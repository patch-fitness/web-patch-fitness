const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { validateRequiredFields } = require('../utils/validation');
const { recalculatePTSalaryForTrainer } = require('../utils/ptSalary');
const { cancelSessionExpense } = require('../utils/ptSessionTracking');

const baseSelect = `
  ms.id,
  ms.memberId,
  ms.membershipId,
  ms.trainerId,
  ms.pt_schedule,
  ms.startDate,
  ms.endDate,
  ms.status,
  m.name AS memberName,
  m.gymId AS memberGymId,
  mem.title AS membershipTitle,
  mem.price AS membershipPrice,
  mem.gymId AS membershipGymId,
  t.name AS trainerName
`;

const getSubscriptionByConditions = async (conditions, params) => {
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `
    SELECT ${baseSelect}
    FROM Member_Subscriptions ms
    INNER JOIN Members m ON ms.memberId = m.id
    INNER JOIN Memberships mem ON ms.membershipId = mem.id
    LEFT JOIN Trainers t ON ms.trainerId = t.id
    ${whereClause}
    ORDER BY ms.startDate DESC
    `,
    params
  );

  return rows;
};

exports.getSubscriptions = asyncHandler(async (req, res) => {
  const { gymId, memberId, status, trainerId } = req.query;

  const conditions = [];
  const params = [];

  if (gymId) {
    conditions.push('(m.gymId = ? OR mem.gymId = ?)');
    params.push(gymId, gymId);
  }

  if (memberId) {
    conditions.push('ms.memberId = ?');
    params.push(memberId);
  }

  if (status) {
    conditions.push('ms.status = ?');
    params.push(status);
  }

  if (trainerId) {
    conditions.push('ms.trainerId = ?');
    params.push(trainerId);
  }

  const subscriptions = await getSubscriptionByConditions(conditions, params);
  res.json(subscriptions);
});

exports.getSubscriptionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const subscriptions = await getSubscriptionByConditions(['ms.id = ?'], [id]);

  if (subscriptions.length === 0) {
    return res.status(404).json({ message: 'Subscription not found' });
  }

  return res.json(subscriptions[0]);
});

exports.createSubscription = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['memberId', 'membershipId', 'startDate', 'endDate']);

  const {
    memberId,
    membershipId,
    trainerId = null,
    pt_schedule = null,
    startDate,
    endDate,
    status = 'Active',
  } = req.body;

  // Get member info
  const [members] = await pool.query('SELECT name, gymId FROM Members WHERE id = ?', [memberId]);
  if (members.length === 0) {
    return res.status(404).json({ message: 'Không tìm thấy hội viên' });
  }
  const member = members[0];

  // Get membership info - Lấy đầy đủ thông tin bao gồm trainer_id, schedule, has_trainer
  const [memberships] = await pool.query(
    `SELECT title, name, price, trainer_id, schedule, has_trainer 
     FROM Memberships WHERE id = ?`, 
    [membershipId]
  );
  if (memberships.length === 0) {
    return res.status(404).json({ message: 'Không tìm thấy gói tập' });
  }
  const membership = memberships[0];

  // Xác định trainerId và pt_schedule từ membership hoặc request body
  // Ưu tiên: request body > membership.trainer_id/schedule
  let effectiveTrainerId = trainerId || membership.trainer_id || null;
  let effectiveSchedule = pt_schedule || membership.schedule || null;

  // Nếu membership có has_trainer = true nhưng chưa có trainer_id cụ thể,
  // và request body cũng không có trainerId, thì cần tìm available trainer
  const hasTrainer = membership.has_trainer === 1 || membership.has_trainer === true || membership.has_trainer === '1';
  
  if (hasTrainer && !effectiveTrainerId && effectiveSchedule) {
    // Tìm available trainer cho schedule này
    const [availableTrainers] = await pool.query(
      `SELECT DISTINCT t.id, t.name
       FROM Trainers t
       WHERE t.gymId = ? 
         AND t.status = 'Active'
         AND t.id NOT IN (
           SELECT DISTINCT trainerId 
           FROM Member_Subscriptions 
           WHERE pt_schedule = ? 
             AND status = 'Active' 
             AND trainerId IS NOT NULL
             AND endDate >= NOW()
         )
       LIMIT 1`,
      [member.gymId, effectiveSchedule]
    );

    if (availableTrainers.length > 0) {
      effectiveTrainerId = availableTrainers[0].id;
      console.log(`✓ Auto-assigned trainer ${availableTrainers[0].name} (ID: ${effectiveTrainerId}) to schedule ${effectiveSchedule}`);
    } else {
      console.warn(`⚠️  No available trainer found for schedule ${effectiveSchedule} in gym ${member.gymId}`);
    }
  }

  // Create subscription với trainerId và schedule từ membership
  const [result] = await pool.execute(
    `
    INSERT INTO Member_Subscriptions
      (memberId, membershipId, trainerId, pt_schedule, startDate, endDate, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [memberId, membershipId, effectiveTrainerId, effectiveSchedule, startDate, endDate, status]
  );

  const subscriptionId = result.insertId;

  // AUTO: Create Revenue record ONLY if not already exists
  // Kiểm tra xem đã có revenue nào cho member này với membership này chưa
  // (tránh trùng lặp khi member đã được tạo với membership và đã có revenue)
  // Tìm revenue chưa có subscription_id hoặc có subscription_id khác
  const [existingRevenues] = await pool.query(
    `SELECT id, subscription_id FROM Revenues 
     WHERE member_id = ? 
       AND membership_id = ?
     ORDER BY payment_date DESC 
     LIMIT 1`,
    [memberId, membershipId]
  );

  // Chỉ tạo revenue mới nếu:
  // 1. Chưa có revenue nào cho member + membership này (existingRevenues.length === 0)
  // 2. Hoặc revenue cũ không có subscription_id (tức là revenue từ khi tạo member, chưa gắn với subscription)
  if (existingRevenues.length === 0) {
    // Chưa có revenue nào, tạo mới
    const transactionCode = `REV${Date.now()}${Math.floor(Math.random() * 1000)}`;
    await pool.execute(
      `INSERT INTO Revenues 
      (transaction_code, member_id, member_name, membership_id, membership_name, 
       amount, payment_method, payment_date, confirmed_by, notes, gymId, subscription_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transactionCode,
        memberId,
        member.name,
        membershipId,
        membership.title || membership.name,
        membership.price || 0,
        'Cash',
        new Date(),
        'System Auto',
        'Dang ky goi tap',
        member.gymId,
        subscriptionId
      ]
    );
    console.log(`✓ Created revenue for subscription ${subscriptionId}`);
  } else if (existingRevenues[0].subscription_id === null || existingRevenues[0].subscription_id === undefined) {
    // Đã có revenue nhưng chưa có subscription_id (từ khi tạo member)
    // Cập nhật subscription_id vào revenue đó để tránh trùng lặp
    await pool.execute(
      `UPDATE Revenues 
       SET subscription_id = ?, 
           notes = CONCAT(IFNULL(notes, ''), ' | Gan voi subscription: ', ?)
       WHERE id = ?`,
      [subscriptionId, subscriptionId, existingRevenues[0].id]
    );
    console.log(`✓ Updated existing revenue ${existingRevenues[0].id} with subscription_id ${subscriptionId} (avoid duplicate)`);
  } else {
    // Đã có revenue với subscription_id khác (có thể là gia hạn hoặc đăng ký gói khác)
    // Trong trường hợp này, KHÔNG tạo revenue mới vì đây là đăng ký lại cùng gói
    // (trường hợp gia hạn sẽ được xử lý trong updateSubscription)
    console.log(`⚠️  Revenue already exists for member ${memberId} with membership ${membershipId} and subscription ${existingRevenues[0].subscription_id}. Skipping revenue creation to avoid duplicate.`);
  }

  // KHÔNG tự động tạo PT expense khi tạo subscription
  // Lương PT sẽ được tính dựa trên lịch HLV thực tế

  const subscriptions = await getSubscriptionByConditions(['ms.id = ?'], [subscriptionId]);
  const newSubscription = subscriptions[0];

  // Tính lại lương PT dựa vào lịch HLV thực tế nếu có trainer
  if (effectiveTrainerId) {
    console.log(`🔄 Recalculating PT salary for trainer ${effectiveTrainerId} after creating subscription`);
    await recalculatePTSalaryForTrainer(effectiveTrainerId, member.gymId);
  }

  res.status(201).json(newSubscription);
});

exports.updateSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const allowedFields = ['memberId', 'membershipId', 'trainerId', 'pt_schedule', 'startDate', 'endDate', 'status'];

  // Lấy thông tin subscription cũ trước khi update (bao gồm thông tin membership cũ)
  const [oldSubscriptions] = await pool.query(
    `SELECT ms.memberId, ms.membershipId, ms.trainerId, 
            m.name as memberName, m.gymId,
            mem.title as oldMembershipTitle, mem.name as oldMembershipName, mem.price as oldMembershipPrice
     FROM Member_Subscriptions ms
     INNER JOIN Members m ON ms.memberId = m.id
     INNER JOIN Memberships mem ON ms.membershipId = mem.id
     WHERE ms.id = ?`,
    [id]
  );

  if (oldSubscriptions.length === 0) {
    return res.status(404).json({ message: 'Subscription not found' });
  }

  const oldSubscription = oldSubscriptions[0];
  const oldMemberId = oldSubscription.memberId;
  const oldMembershipId = oldSubscription.membershipId;
  const oldTrainerId = oldSubscription.trainerId;
  const oldMemberName = oldSubscription.memberName;
  const oldGymId = oldSubscription.gymId;
  const oldMembershipTitle = oldSubscription.oldMembershipTitle || oldSubscription.oldMembershipName || 'Unknown';
  const oldMembershipPrice = parseFloat(oldSubscription.oldMembershipPrice) || 0;

  const entries = Object.entries(req.body).filter(
    ([field, value]) => allowedFields.includes(field) && value !== undefined
  );

  if (entries.length === 0) {
    return res.status(400).json({ message: 'No updatable fields provided' });
  }

  const sets = entries.map(([field]) => `${field} = ?`);
  const values = entries.map(([, value]) => (value === '' ? null : value));
  values.push(id);

  const [result] = await pool.execute(`UPDATE Member_Subscriptions SET ${sets.join(', ')} WHERE id = ?`, values);

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Subscription not found' });
  }

  // Lấy subscription mới sau khi update
  const subscriptions = await getSubscriptionByConditions(['ms.id = ?'], [id]);
  const updatedSubscription = subscriptions[0];

  // Lấy gymId từ member để dùng cho các logic sau
  const [memberInfo] = await pool.query('SELECT gymId FROM Members WHERE id = ?', [oldMemberId]);
  const gymId = memberInfo.length > 0 ? memberInfo[0].gymId : updatedSubscription.gymId || 1;

  // Nếu membershipId thay đổi, cập nhật trainerId và pt_schedule từ membership mới
  const newMembershipId = updatedSubscription.membershipId;
  const membershipIdChanged = newMembershipId && newMembershipId !== oldMembershipId;
  
  if (membershipIdChanged || newMembershipId) {
    // Lấy thông tin membership mới (bao gồm trainer_id, schedule, has_trainer)
    const [memberships] = await pool.query(
      `SELECT id, title, name, price, trainer_id, schedule, has_trainer 
       FROM Memberships WHERE id = ?`,
      [newMembershipId]
    );

    if (memberships.length > 0) {
      const membership = memberships[0];
      const newPrice = parseFloat(membership.price) || 0;

      // Nếu membershipId thay đổi và membership mới có PT, cập nhật trainerId và pt_schedule
      if (membershipIdChanged) {
        const hasTrainer = membership.has_trainer === 1 || membership.has_trainer === true || membership.has_trainer === '1';
        
        if (hasTrainer) {
          // Xác định trainerId và schedule từ membership
          let newTrainerId = membership.trainer_id || null;
          let newSchedule = membership.schedule || null;

          // Nếu membership có schedule nhưng chưa có trainer_id cụ thể, tìm available trainer
          if (newSchedule && !newTrainerId) {
            const [availableTrainers] = await pool.query(
              `SELECT DISTINCT t.id, t.name
               FROM Trainers t
               WHERE t.gymId = ? 
                 AND t.status = 'Active'
                 AND t.id NOT IN (
                   SELECT DISTINCT trainerId 
                   FROM Member_Subscriptions 
                   WHERE pt_schedule = ? 
                     AND status = 'Active' 
                     AND trainerId IS NOT NULL
                     AND endDate >= NOW()
                     AND id != ?
                 )
               LIMIT 1`,
              [gymId, newSchedule, id]
            );

            if (availableTrainers.length > 0) {
              newTrainerId = availableTrainers[0].id;
              console.log(`✓ Auto-assigned trainer ${availableTrainers[0].name} (ID: ${newTrainerId}) to schedule ${newSchedule} for subscription ${id}`);
            }
          }

          // Cập nhật trainerId và pt_schedule nếu có thay đổi
          if (newTrainerId || newSchedule) {
            const updateFields = [];
            const updateValues = [];

            if (newTrainerId !== updatedSubscription.trainerId) {
              updateFields.push('trainerId = ?');
              updateValues.push(newTrainerId);
            }

            if (newSchedule !== updatedSubscription.pt_schedule) {
              updateFields.push('pt_schedule = ?');
              updateValues.push(newSchedule);
            }

            if (updateFields.length > 0) {
              updateValues.push(id);
              await pool.execute(
                `UPDATE Member_Subscriptions SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
              );
              console.log(`✓ Updated subscription ${id}: trainerId=${newTrainerId}, pt_schedule=${newSchedule}`);

              // Lấy lại subscription sau khi update
              const [updatedSubs] = await getSubscriptionByConditions(['ms.id = ?'], [id]);
              if (updatedSubs.length > 0) {
                Object.assign(updatedSubscription, updatedSubs[0]);
              }
            }
          }
        } else {
          // Membership mới không có PT, xóa trainerId và pt_schedule
          if (updatedSubscription.trainerId || updatedSubscription.pt_schedule) {
            await pool.execute(
              `UPDATE Member_Subscriptions SET trainerId = NULL, pt_schedule = NULL WHERE id = ?`,
              [id]
            );
            updatedSubscription.trainerId = null;
            updatedSubscription.pt_schedule = null;
            console.log(`✓ Removed trainer from subscription ${id} (membership does not have PT)`);
          }
        }
      }

      // Tính toán chi phí phát sinh khi thay đổi gói tập
      let costDifference = 0;
      let isUpgrade = false;
      let isRenewal = false;
      
      if (membershipIdChanged) {
        // Trường hợp nâng cấp/thay đổi gói: tính chênh lệch giá
        costDifference = newPrice - oldMembershipPrice;
        isUpgrade = true;
        console.log(`📊 Package change detected: ${oldMembershipTitle} (${oldMembershipPrice} VND) → ${membership.title || membership.name} (${newPrice} VND), difference: ${costDifference} VND`);
      } else {
        // Trường hợp gia hạn (endDate thay đổi nhưng membershipId không đổi)
        // Kiểm tra xem có thay đổi endDate không
        const endDateChanged = req.body.endDate && updatedSubscription.endDate !== new Date(req.body.endDate).toISOString();
        if (endDateChanged) {
          costDifference = newPrice;
          isRenewal = true;
          console.log(`📅 Renewal detected: Extending package ${membership.title || membership.name} (${newPrice} VND)`);
        }
      }

      // Chỉ tạo giao dịch tài chính nếu có chi phí phát sinh
      if (costDifference !== 0 || membershipIdChanged) {
        // 1. Tạo Transaction mới để ghi nhận giao dịch
        const transactionCode = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const transactionDescription = membershipIdChanged
          ? `Cap nhat goi tap: ${oldMembershipTitle} → ${membership.title || membership.name}`
          : `Gia han goi tap: ${membership.title || membership.name}`;
        
        await pool.execute(
          `INSERT INTO Transactions 
          (amount, description, transaction_date, category, subscriptionId, gymId)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            costDifference,
            transactionDescription,
            new Date(),
            'Membership Update',
            id,
            gymId
          ]
        );
        console.log(`✓ Created transaction: ${costDifference} VND for subscription ${id}`);

        // 2. Tạo hoặc cập nhật Revenue record
        // Tìm revenue cũ liên quan đến subscription này
        let [oldRevenues] = await pool.query(
          'SELECT id, amount FROM Revenues WHERE subscription_id = ? ORDER BY payment_date DESC LIMIT 1',
          [id]
        );

        // Nếu không tìm thấy, thử tìm theo member_id và membership_id cũ
        if (oldRevenues.length === 0 && oldMembershipId) {
          [oldRevenues] = await pool.query(
            'SELECT id, amount FROM Revenues WHERE member_id = ? AND membership_id = ? ORDER BY payment_date DESC LIMIT 1',
            [oldMemberId, oldMembershipId]
          );
        }

        if (membershipIdChanged || isRenewal) {
          // Trường hợp nâng cấp/gia hạn: Tạo Revenue mới (không update revenue cũ)
          const revenueCode = `REV${Date.now()}${Math.floor(Math.random() * 1000)}`;
          const revenueNotes = membershipIdChanged
            ? `Nang cap tu goi "${oldMembershipTitle}" (${oldMembershipPrice} VND) len goi "${membership.title || membership.name}" (${newPrice} VND). Chenh lech: ${costDifference > 0 ? '+' : ''}${costDifference} VND`
            : `Gia han goi tap "${membership.title || membership.name}" them ${costDifference > 0 ? costDifference : 'thời gian'}`;

          await pool.execute(
            `INSERT INTO Revenues 
            (transaction_code, member_id, member_name, membership_id, membership_name, 
             amount, payment_method, payment_date, confirmed_by, notes, gymId, subscription_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              revenueCode,
              oldMemberId,
              oldMemberName || updatedSubscription.memberName,
              newMembershipId,
              membership.title || membership.name,
              Math.abs(costDifference), // Luôn là số dương cho revenue
              'Cash',
              new Date(),
              'System Auto',
              revenueNotes,
              gymId,
              id
            ]
          );
          console.log(`✓ Created revenue: ${Math.abs(costDifference)} VND for subscription ${id} (${membershipIdChanged ? 'upgrade' : 'renewal'})`);
        } else if (oldRevenues.length > 0) {
          // Trường hợp khác: Cập nhật revenue cũ
          await pool.execute(
            `UPDATE Revenues 
             SET amount = ?, 
                 membership_id = ?, 
                 membership_name = ?,
                 notes = CONCAT(IFNULL(notes, ''), ' | Cap nhat: ', NOW())
             WHERE id = ?`,
            [
              newPrice,
              newMembershipId,
              membership.title || membership.name,
              oldRevenues[0].id
            ]
          );
          console.log(`✓ Updated revenue ID ${oldRevenues[0].id}: ${oldRevenues[0].amount} → ${newPrice} VND for subscription ${id}`);
        }
      }
    }
  }

  // Kiểm tra và xóa expense PT nếu đổi sang gói thường (không có PT)
  const newTrainerId = updatedSubscription.trainerId;

  // Kiểm tra membership mới có PT không (đã lấy ở trên nếu có)
  let newMembershipHasTrainer = false;
  if (newMembershipId) {
    const [newMembership] = await pool.query(
      'SELECT has_trainer FROM Memberships WHERE id = ?',
      [newMembershipId]
    );
    newMembershipHasTrainer = newMembership.length > 0 && 
      (newMembership[0].has_trainer === 1 || newMembership[0].has_trainer === true);
  }

  // Nếu trainerId thay đổi từ có → null, hoặc membership mới không có PT
  const shouldRemovePTExpense = 
    (oldTrainerId && !newTrainerId) || // Trainer bị xóa
    (oldTrainerId && !newMembershipHasTrainer); // Đổi sang gói không có PT

  if (shouldRemovePTExpense && oldTrainerId) {
    console.log(`🔄 Removing PT expense: trainerId changed from ${oldTrainerId} to ${newTrainerId || 'null'}, membership has_trainer: ${newMembershipHasTrainer}`);

    // Tìm và xóa expense PT liên quan đến subscription này
    // Tìm theo trainer_id và member name (vì expense được tạo với member name trong description)
    const [members] = await pool.query('SELECT name FROM Members WHERE id = ?', [oldMemberId]);
    const memberName = members[0]?.name || '';

    // Tìm expense theo trainer_id và member name trong description
    const [ptExpenses] = await pool.query(
      `SELECT id, amount, description, notes FROM Expenses 
       WHERE trainer_id = ? 
         AND expense_type = 'PT_Commission'
         AND category = 'Luong PT'
         AND (description LIKE ? OR notes LIKE ? OR description LIKE ?)
       ORDER BY created_at DESC`,
      [
        oldTrainerId, 
        `%${memberName}%`, // Tìm theo tên member trong description
        `%member ${oldMemberId}%`, // Tìm theo member ID trong notes
        `%subscription ${id}%` // Tìm theo subscription ID (nếu có)
      ]
    );

    if (ptExpenses.length > 0) {
      // Xóa tất cả expenses PT liên quan
      for (const expense of ptExpenses) {
        await pool.execute('DELETE FROM Expenses WHERE id = ?', [expense.id]);
        console.log(`✓ Deleted PT expense ID ${expense.id}: ${expense.amount} VND`);
        console.log(`   Description: ${expense.description}`);
        console.log(`   Notes: ${expense.notes || 'N/A'}`);
      }
      console.log(`✅ Deleted ${ptExpenses.length} PT expense(s) for subscription ${id}`);
    } else {
      console.log(`⚠️  No PT expense found to delete for trainer ${oldTrainerId} and member ${memberName}`);
    }
  }

  // Nếu subscription bị đánh dấu là Cancelled hoặc Expired, hủy tất cả session expenses chưa hoàn thành
  const newStatus = updatedSubscription.status;
  const statusChanged = req.body.status && req.body.status !== 'Active';
  
  if (statusChanged && (newStatus === 'Cancelled' || newStatus === 'Expired')) {
    console.log(`🔄 Subscription ${id} status changed to ${newStatus}, cancelling all pending session expenses`);
    
    // Tìm tất cả session expenses chưa hoàn thành (chưa được cancel hoặc paid)
    const [pendingSessions] = await pool.query(
      `SELECT id, expense_date, notes
       FROM Expenses
       WHERE expense_type = 'PT_Commission'
         AND category = 'PT_Session'
         AND notes LIKE ?
         AND payment_status NOT IN ('Cancelled', 'Paid')
       ORDER BY expense_date DESC`,
      [`%subscription_id:${id}%`]
    );

    if (pendingSessions.length > 0) {
      for (const session of pendingSessions) {
        try {
          // Trích xuất session_date từ notes
          const sessionDateMatch = session.notes?.match(/session_date:([0-9-]+)/);
          const sessionDate = sessionDateMatch ? sessionDateMatch[1] : session.expense_date;
          
          await cancelSessionExpense(
            id,
            sessionDate,
            'System',
            `Subscription status changed to ${newStatus}`
          );
        } catch (cancelError) {
          console.error(`Error cancelling session expense ${session.id}:`, cancelError);
          // Vẫn tiếp tục hủy các session khác
        }
      }
      console.log(`✅ Cancelled ${pendingSessions.length} pending session expenses for subscription ${id}`);
    }
  }

  // Tính lại lương PT dựa vào lịch HLV thực tế sau khi subscription thay đổi
  // gymId đã được lấy ở trên

  // Lấy danh sách trainer IDs bị ảnh hưởng (cả cũ và mới)
  const affectedTrainerIds = new Set();
  if (oldTrainerId) affectedTrainerIds.add(oldTrainerId);
  if (newTrainerId && newTrainerId !== oldTrainerId) affectedTrainerIds.add(newTrainerId);

  if (affectedTrainerIds.size > 0) {
    console.log(`🔄 Recalculating PT salaries for affected trainers:`, Array.from(affectedTrainerIds));
    
    // Tính lại lương PT cho từng trainer bị ảnh hưởng
    for (const trainerId of affectedTrainerIds) {
      await recalculatePTSalaryForTrainer(trainerId, gymId);
    }
  }

  res.json(updatedSubscription);
});

exports.deleteSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log(`🗑️  Deleting subscription ID: ${id}`);

  // 1. Lấy thông tin subscription để biết member_id, membership_id, trainerId, và gymId
  const [subscriptions] = await pool.query(
    'SELECT memberId, membershipId, trainerId FROM Member_Subscriptions WHERE id = ?',
    [id]
  );

  if (subscriptions.length === 0) {
    return res.status(404).json({ message: 'Subscription not found' });
  }

  const { memberId, membershipId, trainerId } = subscriptions[0];

  // Lấy gymId từ member
  const [members] = await pool.query('SELECT gymId FROM Members WHERE id = ?', [memberId]);
  const gymId = members.length > 0 ? members[0].gymId : 1;

  // 2. Hủy tất cả session expenses chưa hoàn thành trước khi xóa subscription
  const [pendingSessions] = await pool.query(
    `SELECT id, expense_date, notes
     FROM Expenses
     WHERE expense_type = 'PT_Commission'
       AND category = 'PT_Session'
       AND notes LIKE ?
       AND payment_status NOT IN ('Cancelled', 'Paid')
     ORDER BY expense_date DESC`,
    [`%subscription_id:${id}%`]
  );

  if (pendingSessions.length > 0) {
    console.log(`🔄 Cancelling ${pendingSessions.length} pending session expenses before deleting subscription`);
    
    for (const session of pendingSessions) {
      try {
        // Trích xuất session_date từ notes
        const sessionDateMatch = session.notes?.match(/session_date:([0-9-]+)/);
        const sessionDate = sessionDateMatch ? sessionDateMatch[1] : session.expense_date;
        
        await cancelSessionExpense(
          id,
          sessionDate,
          'System',
          'Subscription deleted'
        );
      } catch (cancelError) {
        console.error(`Error cancelling session expense ${session.id}:`, cancelError);
        // Vẫn tiếp tục hủy các session khác
      }
    }
    console.log(`✅ Cancelled ${pendingSessions.length} pending session expenses`);
  }

  // 3. Xóa revenues liên quan đến subscription này (ưu tiên tìm theo subscription_id)
  let [revenueResult] = await pool.execute(
    'DELETE FROM Revenues WHERE subscription_id = ?',
    [id]
  );
  
  // Nếu không tìm thấy, thử tìm theo member_id và membership_id
  if (revenueResult.affectedRows === 0) {
    [revenueResult] = await pool.execute(
      'DELETE FROM Revenues WHERE member_id = ? AND membership_id = ?',
      [memberId, membershipId]
    );
  }
  console.log(`✓ Deleted ${revenueResult.affectedRows} revenues`);

  // 4. Xóa transactions liên quan
  const [txResult] = await pool.execute(
    'DELETE FROM Transactions WHERE subscriptionId = ?',
    [id]
  );
  console.log(`✓ Deleted ${txResult.affectedRows} transactions`);

  // 5. Cuối cùng xóa subscription
  const [result] = await pool.execute('DELETE FROM Member_Subscriptions WHERE id = ?', [id]);

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Subscription not found' });
  }

  // 6. Tính lại lương PT dựa vào lịch HLV thực tế nếu có trainer
  if (trainerId) {
    console.log(`🔄 Recalculating PT salary for trainer ${trainerId} after deleting subscription`);
    await recalculatePTSalaryForTrainer(trainerId, gymId);
  }

  console.log(`✅ Đã xóa gói tập ${id} và tất cả bản ghi tài chính liên quan thành công`);
  res.status(204).send();
});

