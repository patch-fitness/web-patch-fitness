const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { validateRequiredFields } = require('../utils/validation');
const { recalculatePTSalaryForTrainer } = require('../utils/ptSalary');

const selectableColumns = [
  'id',
  'name',
  'mobileNo',
  'address',
  'profilePic',
  'joinDate',
  'status',
  'gymId',
];

const buildUpdateQuery = (payload) => {
  const allowedFields = ['name', 'mobileNo', 'address', 'profilePic', 'joinDate', 'status', 'gymId'];
  return Object.entries(payload).filter(([field, value]) => allowedFields.includes(field) && value !== undefined);
};

exports.getMembers = asyncHandler(async (req, res) => {
  const { gymId } = req.query;
  
  // Build WHERE clause: Filter out members with status = 'Deleted' (chỉ hiển thị Active và Inactive)
  let whereClause = "WHERE m.status != 'Deleted'";
  const params = [];
  
  if (gymId) {
    whereClause += ' AND m.gymId = ?';
    params.push(gymId);
  }
  
  // Join with subscriptions to get plan and nextBillDate
  const [members] = await pool.query(
    `SELECT 
      m.id,
      m.name,
      m.mobileNo,
      m.address,
      m.profilePic,
      m.joinDate as createdAt,
      m.status,
      m.gymId,
      COALESCE(MAX(ms.endDate), NULL) as nextBillDate,
      COALESCE(MAX(mem.title), NULL) as plan
    FROM Members m
    LEFT JOIN Member_Subscriptions ms ON m.id = ms.memberId AND ms.status = 'Active'
    LEFT JOIN Memberships mem ON ms.membershipId = mem.id
    ${whereClause}
    GROUP BY m.id
    ORDER BY m.joinDate DESC`,
    params
  );

  // Format response to match frontend expectations
  const formattedMembers = members.map(member => ({
    id: member.id,
    name: member.name,
    mobileNo: member.mobileNo,
    address: member.address,
    profilePic: member.profilePic,
    createdAt: member.createdAt,
    nextBillDate: member.nextBillDate,
    status: member.status || 'Active',
    plan: member.plan || 'Không có gói',
  }));

  res.json(formattedMembers);
});

exports.getMemberById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const [members] = await pool.query(
    `SELECT 
      m.id,
      m.name,
      m.mobileNo,
      m.address,
      m.profilePic,
      m.joinDate as createdAt,
      m.status,
      m.gymId,
      COALESCE(MAX(ms.endDate), NULL) as nextBillDate,
      COALESCE(MAX(mem.title), NULL) as plan
    FROM Members m
    LEFT JOIN Member_Subscriptions ms ON m.id = ms.memberId AND ms.status = 'Active'
    LEFT JOIN Memberships mem ON ms.membershipId = mem.id
    WHERE m.id = ?
    GROUP BY m.id`,
    [id]
  );

  if (members.length === 0) {
    return res.status(404).json({ message: 'Không tìm thấy hội viên' });
  }

  const member = members[0];
  const formattedMember = {
    id: member.id,
    name: member.name,
    mobileNo: member.mobileNo,
    address: member.address,
    profilePic: member.profilePic,
    createdAt: member.createdAt,
    nextBillDate: member.nextBillDate,
    status: member.status || 'Active',
    plan: member.plan || 'Không có gói',
  };

  return res.json(formattedMember);
});

exports.createMember = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['name', 'mobileNo', 'address', 'gymId']);

  const {
    name,
    mobileNo,
    address,
    profilePic = null,
    joinDate = null,
    status = 'Active',
    gymId,
    membershipId = null,
  } = req.body;

  const parsedGymId = parseInt(gymId, 10);
  const parsedMembershipId = membershipId ? parseInt(membershipId, 10) : null;
  const normalizedJoinDate = joinDate && joinDate !== 'null' ? new Date(joinDate) : new Date();
  const avatarPath = req.file ? `/uploads/avatars/${req.file.filename}` : profilePic || null;

  const [result] = await pool.execute(
    `INSERT INTO Members (name, mobileNo, address, profilePic, joinDate, status, gymId)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, mobileNo, address, avatarPath, normalizedJoinDate, status, parsedGymId]
  );

  let planName = 'No Plan';
  let nextBillDate = null;

  if (parsedMembershipId) {
    const [membershipRows] = await pool.query(
      `SELECT id, title, name as membershipName, duration_in_months, price, trainer_id FROM Memberships WHERE id = ?`,
      [parsedMembershipId]
    );

    if (membershipRows.length === 0) {
      return res.status(400).json({ message: 'Không tìm thấy gói tập' });
    }

    const membership = membershipRows[0];
    planName = membership.title || membership.membershipName || planName;
    const durationInMonths = membership.duration_in_months || 1;
    const endDate = new Date(normalizedJoinDate);
    endDate.setMonth(endDate.getMonth() + durationInMonths);
    nextBillDate = endDate.toISOString();

    // Create subscription
    const [subscriptionResult] = await pool.execute(
      `INSERT INTO Member_Subscriptions (memberId, membershipId, trainerId, pt_schedule, startDate, endDate, status)
       VALUES (?, ?, NULL, NULL, ?, ?, 'Active')`,
      [result.insertId, membership.id, normalizedJoinDate, endDate]
    );

    const subscriptionId = subscriptionResult.insertId;

    // AUTO: Create Revenue record
    const transactionCode = `REV${Date.now()}${Math.floor(Math.random() * 1000)}`;
    await pool.execute(
      `INSERT INTO Revenues 
      (transaction_code, member_id, member_name, membership_id, membership_name, 
       amount, payment_method, payment_date, confirmed_by, notes, gymId, subscription_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transactionCode,
        result.insertId,
        name,
        membership.id,
        planName,
        membership.price || 0,
        'Cash', // Default payment method
        normalizedJoinDate,
        'System Auto', // Auto-created
        'Dang ky goi tap moi',
        parsedGymId,
        subscriptionId
      ]
    );

    // AUTO: Create PT Commission Expense if has trainer
    // KHÔNG tự động tạo PT expense khi tạo member
    // Lương PT sẽ được tính dựa trên số member active với PT đó
    // Sử dụng API /api/finance/calculate-pt-salaries để tính và tạo expenses
  }

  const formattedMember = {
    id: result.insertId,
    name,
    mobileNo,
    address,
    profilePic: avatarPath,
    createdAt: normalizedJoinDate.toISOString(),
    nextBillDate,
    status: status || 'Active',
    plan: planName,
  };

  res.status(201).json(formattedMember);
});

exports.updateMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (req.file) {
    req.body.profilePic = `/uploads/avatars/${req.file.filename}`;
  }
  const entries = buildUpdateQuery(req.body);

  if (entries.length === 0) {
    return res.status(400).json({ message: 'No updatable fields provided' });
  }

  const sets = entries.map(([field]) => `${field} = ?`);
  const values = entries.map(([, value]) => (value === '' ? null : value));
  values.push(id);

  const [result] = await pool.execute(`UPDATE Members SET ${sets.join(', ')} WHERE id = ?`, values);

  if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy hội viên' });
  }

  const [members] = await pool.query(
    `SELECT 
      m.id,
      m.name,
      m.mobileNo,
      m.address,
      m.profilePic,
      m.joinDate as createdAt,
      m.status,
      m.gymId,
      COALESCE(MAX(ms.endDate), NULL) as nextBillDate,
      COALESCE(MAX(mem.title), NULL) as plan
    FROM Members m
    LEFT JOIN Member_Subscriptions ms ON m.id = ms.memberId AND ms.status = 'Active'
    LEFT JOIN Memberships mem ON ms.membershipId = mem.id
    WHERE m.id = ?
    GROUP BY m.id`,
    [id]
  );

  const member = members[0];
  const formattedMember = {
    id: member.id,
    name: member.name,
    mobileNo: member.mobileNo,
    address: member.address,
    profilePic: member.profilePic,
    createdAt: member.createdAt,
    nextBillDate: member.nextBillDate,
    status: member.status || 'Active',
    plan: member.plan || 'Không có gói',
  };

  res.json(formattedMember);
});

exports.deleteMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // Lấy force parameter từ query string và parse đúng
  const forceParam = req.query.force;
  const force = forceParam === 'true' || forceParam === true || forceParam === '1' || forceParam === 1;

  console.log(`🗑️  Soft deleting member ID: ${id}, force: ${force}`);

  // 1. Lấy thông tin member trước khi xóa
  const [memberInfo] = await pool.query(
    'SELECT name, status, gymId FROM Members WHERE id = ?',
    [id]
  );

  if (memberInfo.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy hội viên' });
  }

  const member = memberInfo[0];
  const memberName = member.name || '';
  const currentStatus = member.status || 'Active';

  // Lấy hard parameter từ query string
  const hardParam = req.query.hard;
  const hardDelete = hardParam === 'true' || hardParam === true || hardParam === '1' || hardParam === 1;

  // Nếu có force=true và hard=true, cho phép hard delete ngay cả khi status = 'Active'
  if (force && hardDelete) {
    console.log(`🗑️  Hard deleting member ID: ${id} (force=true&hard=true)`);
    
    // HARD DELETE: Xóa hoàn toàn khỏi database
    try {
      // Xóa các bản ghi liên quan trước (cascading delete)
      // 1. Xóa Transactions liên quan đến subscriptions của member
      const [subscriptionRows] = await pool.query(
        'SELECT id FROM Member_Subscriptions WHERE memberId = ?',
        [id]
      );
      const subscriptionIds = subscriptionRows.map((row) => row.id);
      
      if (subscriptionIds.length > 0) {
        const placeholders = subscriptionIds.map(() => '?').join(', ');
        await pool.execute(`DELETE FROM Transactions WHERE subscriptionId IN (${placeholders})`, subscriptionIds);
        console.log(`✓ Đã xóa Transactions cho hội viên ${id}`);
      }
      
      // 2. Xóa Member_Subscriptions
      await pool.execute('DELETE FROM Member_Subscriptions WHERE memberId = ?', [id]);
      console.log(`✓ Đã xóa Member_Subscriptions cho hội viên ${id}`);
      
      // 3. Xóa Revenues (hoàn toàn xóa khỏi database)
      await pool.execute('DELETE FROM Revenues WHERE member_id = ?', [id]).catch(err => {
        console.log('⚠️  Lỗi khi xóa Revenues (có thể không tồn tại):', err.message);
      });
      console.log(`✓ Đã xóa Revenues cho hội viên ${id}`);
      
      // 4. Xóa Expenses liên quan (nếu có)
      await pool.execute('DELETE FROM Expenses WHERE member_id = ?', [id]).catch(err => {
        console.log('⚠️  Lỗi khi xóa Expenses (có thể không tồn tại):', err.message);
      });
      console.log(`✓ Đã xóa Expenses cho hội viên ${id}`);
      
      // 5. Cuối cùng, xóa member
      const [deleteResult] = await pool.execute('DELETE FROM Members WHERE id = ?', [id]);
      
      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ message: 'Không tìm thấy hội viên' });
      }
      
      console.log(`✓ Đã xóa hoàn toàn hội viên ${id} khỏi database`);
      
      return res.json({
        message: `Đã xóa hoàn toàn hội viên ${memberName} khỏi database`,
        member: { id: parseInt(id), name: memberName },
        deleted: true
      });
    } catch (error) {
      console.error('Lỗi khi xóa hoàn toàn hội viên:', error);
      return res.status(500).json({
        message: 'Lỗi khi xóa hoàn toàn hội viên',
        error: error.message
      });
    }
  }
  
  // Nếu đã bị soft delete nhưng không có hard parameter, thông báo và hướng dẫn
  if (currentStatus === 'Deleted' || currentStatus === 'Inactive') {
    return res.status(400).json({ 
      message: `Member already marked as ${currentStatus}`,
      suggestion: 'Để xóa hoàn toàn khỏi database, vui lòng sử dụng ?hard=true'
    });
  }

  // 2. Kiểm tra công nợ trước khi xóa (tổng số tiền chưa thanh toán)
  // Xử lý trường hợp cột payment_status chưa tồn tại
  let totalDebt = 0;
  try {
    const [outstandingDebt] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_debt
       FROM Revenues
       WHERE member_id = ? 
         AND (payment_status IS NULL 
              OR payment_status = 'Pending'
              OR payment_status = 'Unpaid')`,
      [id]
    );
    totalDebt = parseFloat(outstandingDebt[0]?.total_debt || 0);
    console.log(`✓ Checked debt for member ${id}: ${totalDebt} VND`);
  } catch (error) {
    // Nếu cột payment_status chưa tồn tại, chỉ kiểm tra member_id
    if (error.code === 'ER_BAD_FIELD_ERROR' && error.message.includes('payment_status')) {
      console.log('⚠️  Column payment_status does not exist in Revenues, checking all revenues for member');
      try {
        const [allRevenues] = await pool.query(
          `SELECT COALESCE(SUM(amount), 0) as total_debt
           FROM Revenues
           WHERE member_id = ?`,
          [id]
        );
        totalDebt = parseFloat(allRevenues[0]?.total_debt || 0);
        console.log(`✓ Checked all revenues for member ${id}: ${totalDebt} VND`);
      } catch (fallbackError) {
        console.error('Lỗi khi kiểm tra revenues:', fallbackError);
        // Nếu vẫn lỗi, giả sử không có công nợ
        totalDebt = 0;
      }
    } else {
      // Nếu lỗi khác, log và giả sử không có công nợ để không block việc xóa
      console.error('Lỗi khi kiểm tra công nợ, giả sử không có công nợ:', error);
      totalDebt = 0;
    }
  }

  // Kiểm tra các subscription còn active
  const [activeSubscriptions] = await pool.query(
    `SELECT COUNT(*) as active_count 
     FROM Member_Subscriptions 
     WHERE memberId = ? AND status = 'Active' AND endDate >= NOW()`,
    [id]
  );

  const hasActiveSubscriptions = parseInt(activeSubscriptions[0]?.active_count || 0) > 0;

  // Cảnh báo nếu có công nợ hoặc subscription đang active và không force delete
  if (!force && (totalDebt > 0 || hasActiveSubscriptions)) {
    const warnings = [];
    if (totalDebt > 0) {
      warnings.push(`Công nợ chưa thanh toán: ${totalDebt.toLocaleString('vi-VN')} VND`);
    }
    if (hasActiveSubscriptions) {
      warnings.push(`Còn ${activeSubscriptions[0].active_count} gói tập đang active`);
    }

    return res.status(400).json({
      message: 'Không thể xóa hội viên. Vui lòng xử lý các vấn đề sau trước:',
      warnings: warnings,
      totalDebt: totalDebt,
      hasActiveSubscriptions: hasActiveSubscriptions,
      suggestion: 'Nếu vẫn muốn xóa, vui lòng sử dụng ?force=true'
    });
  }

  // 3. SOFT DELETE: Đánh dấu member là "Deleted" thay vì xóa cứng
  let updateResult;
  try {
    const result = await pool.execute(
      `UPDATE Members SET status = 'Deleted' WHERE id = ?`,
      [id]
    );
    // Xử lý kết quả nếu là array
    updateResult = Array.isArray(result) && result.length === 2 ? result[0] : result;
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái hội viên:', error);
    return res.status(500).json({ 
      message: 'Lỗi khi cập nhật trạng thái member',
      error: error.message 
    });
  }

  if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy hội viên' });
  }

  console.log(`✓ Marked member ${id} as Deleted`);

  // 4. Cập nhật trạng thái các bản ghi tài chính liên quan
  
  // 4a. Cập nhật Revenues: Đánh dấu các revenue chưa thanh toán là "Cancelled"
  if (totalDebt > 0) {
    try {
      const [revenueUpdateResult] = await pool.execute(
        `UPDATE Revenues 
         SET payment_status = 'Cancelled',
             notes = CONCAT(IFNULL(notes, ''), ' | Da huy vi hoi vien da bi xoa (Member ID: ', ?, ')')
         WHERE member_id = ? 
           AND (payment_status IS NULL OR payment_status = 'Pending' OR payment_status = 'Unpaid')`,
        [id, id]
      );
      console.log(`✓ Marked ${revenueUpdateResult.affectedRows} unpaid revenues as Cancelled`);
    } catch (error) {
      // Nếu cột payment_status chưa tồn tại, chỉ cập nhật notes
      if (error.code === 'ER_BAD_FIELD_ERROR' && error.message.includes('payment_status')) {
        console.log('⚠️  Column payment_status does not exist, only updating notes');
        const [revenueUpdateResult] = await pool.execute(
          `UPDATE Revenues 
           SET notes = CONCAT(IFNULL(notes, ''), ' | Da huy vi hoi vien da bi xoa (Member ID: ', ?, ')')
           WHERE member_id = ?`,
          [id, id]
        );
        console.log(`✓ Updated notes for ${revenueUpdateResult.affectedRows} revenues`);
      } else {
        // Log lỗi nhưng không throw để không làm gián đoạn quá trình xóa
        console.error('Lỗi khi cập nhật revenues:', error);
      }
    }
  }

  // 4b. Cập nhật Subscriptions: Đánh dấu các subscription active là "Cancelled"
  if (hasActiveSubscriptions) {
    // Bỏ qua updated_at nếu cột không tồn tại
    let [subUpdateResult] = await pool.execute(
      `UPDATE Member_Subscriptions 
       SET status = 'Cancelled'
       WHERE memberId = ? AND status = 'Active'`,
      [id]
    ).catch(async (error) => {
      // Nếu lỗi do updated_at không tồn tại, thử lại không có updated_at
      if (error.code === 'ER_BAD_FIELD_ERROR' && error.message.includes('updated_at')) {
        console.log('⚠️  Column updated_at does not exist in Member_Subscriptions, skipping it');
        return await pool.execute(
          `UPDATE Member_Subscriptions 
           SET status = 'Cancelled'
           WHERE memberId = ? AND status = 'Active'`,
          [id]
        );
      }
      throw error;
    });

    // Xử lý kết quả nếu là array
    if (Array.isArray(subUpdateResult) && subUpdateResult.length === 2) {
      subUpdateResult = subUpdateResult[0];
    }
    console.log(`✓ Marked ${subUpdateResult.affectedRows} active subscriptions as Cancelled`);
  }

  // 4c. Cập nhật Transactions: Đánh dấu các transaction chưa hoàn thành là "Cancelled"
  const [subscriptionRows] = await pool.query(
    'SELECT id FROM Member_Subscriptions WHERE memberId = ?',
    [id]
  );
  const subscriptionIds = subscriptionRows.map((row) => row.id);

  if (subscriptionIds.length > 0) {
    const placeholders = subscriptionIds.map(() => '?').join(', ');
    const [txUpdateResult] = await pool.query(
      `UPDATE Transactions 
       SET description = CONCAT(IFNULL(description, ''), ' | [Cancelled - Member Deleted]')
       WHERE subscriptionId IN (${placeholders}) 
         AND (category = 'Membership Update' OR description LIKE '%pending%')`,
      subscriptionIds
    );
    console.log(`✓ Updated ${txUpdateResult.affectedRows} related transactions`);
  }

  // 5. Xử lý PT expenses: Tính lại lương PT vì member đã bị xóa
  const [subscriptionsWithTrainer] = await pool.query(
    'SELECT DISTINCT trainerId FROM Member_Subscriptions WHERE memberId = ? AND trainerId IS NOT NULL',
    [id]
  );
  const affectedTrainerIds = subscriptionsWithTrainer.map(s => s.trainerId);
  
  if (affectedTrainerIds.length > 0) {
    console.log(`🔄 Recalculating PT salaries for affected trainers:`, affectedTrainerIds);
    
    const gymId = member.gymId || 1;
    
    // Tính lại lương PT cho từng trainer bị ảnh hưởng
    for (const trainerId of affectedTrainerIds) {
      try {
        await recalculatePTSalaryForTrainer(trainerId, gymId);
      } catch (salaryError) {
        console.error(`Lỗi khi tính lại lương PT cho huấn luyện viên ${trainerId}:`, salaryError);
        // Không throw error, chỉ log
      }
    }
  }

  console.log(`✅ Đã xóa mềm hội viên ${id} thành công. Trạng thái đã được cập nhật thành 'Deleted'`);
  
  // Trả về thông tin đã được cập nhật
  const [updatedMember] = await pool.query(
    `SELECT 
      m.id,
      m.name,
      m.mobileNo,
      m.address,
      m.profilePic,
      m.joinDate as createdAt,
      m.status,
      m.gymId,
      COALESCE(MAX(ms.endDate), NULL) as nextBillDate,
      COALESCE(MAX(mem.title), NULL) as plan
    FROM Members m
    LEFT JOIN Member_Subscriptions ms ON m.id = ms.memberId AND ms.status = 'Active'
    LEFT JOIN Memberships mem ON ms.membershipId = mem.id
    WHERE m.id = ?
    GROUP BY m.id`,
    [id]
  );

  const formattedMember = {
    id: updatedMember[0].id,
    name: updatedMember[0].name,
    mobileNo: updatedMember[0].mobileNo,
    address: updatedMember[0].address,
    profilePic: updatedMember[0].profilePic,
    createdAt: updatedMember[0].createdAt,
    nextBillDate: updatedMember[0].nextBillDate,
    status: updatedMember[0].status,
    plan: updatedMember[0].plan || 'No Plan',
  };

  res.json({
    message: 'Member đã được đánh dấu là Deleted',
    member: formattedMember,
    financialRecordsUpdated: {
      revenuesCancelled: totalDebt > 0 ? 'Yes' : 'No',
      subscriptionsCancelled: hasActiveSubscriptions ? 'Yes' : 'No',
      ptSalariesRecalculated: affectedTrainerIds.length > 0 ? 'Yes' : 'No'
    }
  });
});

