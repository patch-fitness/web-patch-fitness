const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// Get finance dashboard summary
exports.getFinanceDashboard = asyncHandler(async (req, res) => {
  const { gymId, startDate, endDate, period } = req.query;

  let dateCondition = '';
  let params = [];

  // Build date filter
  if (period) {
    const now = new Date();
    let start;
    
    switch(period) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'this_week':
        start = new Date(now.setDate(now.getDate() - now.getDay()));
        break;
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last_month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        start = lastMonth;
        break;
      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
    }
    
    if (start) {
      dateCondition = 'AND payment_date >= ?';
      params.push(start);
    }
  } else {
    if (startDate) {
      dateCondition += ' AND payment_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      dateCondition += ' AND payment_date <= ?';
      params.push(endDate);
    }
  }

  // Get total revenue - CHỈ tính từ members thực sự (member_id IS NOT NULL)
  const [revenueData] = await pool.query(
    `SELECT 
      COUNT(*) as total_transactions,
      COALESCE(SUM(amount), 0) as total_revenue,
      COALESCE(AVG(amount), 0) as average_revenue
    FROM Revenues
    WHERE gymId = ? AND member_id IS NOT NULL ${dateCondition}`,
    [gymId, ...params]
  );

  // Get total expenses - Chỉ tính expense PT còn hợp lệ (trainer có member active)
  // Tính riêng expenses không phải PT và expenses PT còn hợp lệ
  const expenseDateCondition = dateCondition.replace('payment_date', 'expense_date');
  
  // Expenses không phải PT_Commission
  const [nonPTExpenses] = await pool.query(
    `SELECT 
      COUNT(*) as total_transactions,
      COALESCE(SUM(amount), 0) as total_expense
    FROM Expenses
    WHERE gymId = ? 
      AND (expense_type != 'PT_Commission' OR expense_type IS NULL)
      ${expenseDateCondition}`,
    [gymId, ...params]
  );

  // Expenses PT_Commission CHỈ tính những trainer còn có member active
  // Kiểm tra kỹ: expense phải có trainer_id VÀ trainer đó phải có ít nhất 1 member active
  const [validPTExpenses] = await pool.query(
    `SELECT 
      COUNT(*) as total_transactions,
      COALESCE(SUM(e.amount), 0) as total_expense
    FROM Expenses e
    WHERE e.gymId = ? 
      AND e.expense_type = 'PT_Commission'
      AND e.category = 'Luong PT'
      AND e.trainer_id IS NOT NULL
      AND EXISTS (
        SELECT 1 
        FROM Member_Subscriptions ms
        INNER JOIN Members m ON ms.memberId = m.id
        WHERE ms.trainerId = e.trainer_id
          AND ms.status = 'Active'
          AND ms.endDate >= NOW()
          AND ms.trainerId IS NOT NULL
          AND m.gymId = ?
      )
      ${expenseDateCondition}`,
    [gymId, gymId, ...params]
  );

  // Tính tổng
  const totalExpenseTransactions = (parseInt(nonPTExpenses[0]?.total_transactions || 0)) + 
                                    (parseInt(validPTExpenses[0]?.total_transactions || 0));
  const totalExpense = (parseFloat(nonPTExpenses[0]?.total_expense || 0)) + 
                       (parseFloat(validPTExpenses[0]?.total_expense || 0));
  const averageExpense = totalExpenseTransactions > 0 ? totalExpense / totalExpenseTransactions : 0;

  const expenseData = [{
    total_transactions: totalExpenseTransactions,
    total_expense: totalExpense,
    average_expense: averageExpense
  }];

  // Get revenue by payment method - CHỈ tính từ members thực sự
  const [revenueByPaymentMethod] = await pool.query(
    `SELECT 
      payment_method,
      COUNT(*) as count,
      SUM(amount) as total
    FROM Revenues
    WHERE gymId = ? AND member_id IS NOT NULL ${dateCondition}
    GROUP BY payment_method`,
    [gymId, ...params]
  );

  // Get expenses by type - CHỈ tính expense PT còn hợp lệ
  // Expenses không phải PT
  const [nonPTExpensesByType] = await pool.query(
    `SELECT 
      expense_type,
      COUNT(*) as count,
      SUM(amount) as total
    FROM Expenses
    WHERE gymId = ? 
      AND (expense_type != 'PT_Commission' OR expense_type IS NULL)
      ${expenseDateCondition}
    GROUP BY expense_type`,
    [gymId, ...params]
  );

  // Expenses PT_Commission CHỈ tính những trainer còn có member active
  const [validPTExpensesByType] = await pool.query(
    `SELECT 
      e.expense_type,
      COUNT(*) as count,
      SUM(e.amount) as total
    FROM Expenses e
    WHERE e.gymId = ? 
      AND e.expense_type = 'PT_Commission'
      AND e.category = 'Luong PT'
      AND e.trainer_id IS NOT NULL
      AND EXISTS (
        SELECT 1 
        FROM Member_Subscriptions ms
        INNER JOIN Members m ON ms.memberId = m.id
        WHERE ms.trainerId = e.trainer_id
          AND ms.status = 'Active'
          AND ms.endDate >= NOW()
          AND ms.trainerId IS NOT NULL
          AND m.gymId = ?
      )
      ${expenseDateCondition}
    GROUP BY e.expense_type`,
    [gymId, gymId, ...params]
  );

  // Kết hợp kết quả
  const expensesByType = [...nonPTExpensesByType];
  if (validPTExpensesByType.length > 0) {
    const ptExpense = validPTExpensesByType[0];
    // Tìm xem đã có PT_Commission trong danh sách chưa
    const existingPT = expensesByType.find(e => e.expense_type === 'PT_Commission');
    if (existingPT) {
      existingPT.count = parseInt(existingPT.count) + parseInt(ptExpense.count);
      existingPT.total = parseFloat(existingPT.total) + parseFloat(ptExpense.total);
    } else {
      expensesByType.push(ptExpense);
    }
  }

  // Get revenue trend (by month for last 6 months) - CHỈ tính từ members thực sự
  const [revenueTrend] = await pool.query(
    `SELECT 
      DATE_FORMAT(payment_date, '%Y-%m') as month,
      SUM(amount) as total
    FROM Revenues
    WHERE gymId = ? AND member_id IS NOT NULL AND payment_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
    ORDER BY month ASC`,
    [gymId]
  );

  // Get expense trend - CHỈ tính expense PT còn hợp lệ
  // Expenses không phải PT
  const [nonPTExpenseTrend] = await pool.query(
    `SELECT 
      DATE_FORMAT(expense_date, '%Y-%m') as month,
      SUM(amount) as total
    FROM Expenses
    WHERE gymId = ? 
      AND (expense_type != 'PT_Commission' OR expense_type IS NULL)
      AND expense_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    GROUP BY DATE_FORMAT(expense_date, '%Y-%m')
    ORDER BY month ASC`,
    [gymId]
  );

  // Expenses PT_Commission CHỈ tính những trainer còn có member active
  const [validPTExpenseTrend] = await pool.query(
    `SELECT 
      DATE_FORMAT(e.expense_date, '%Y-%m') as month,
      SUM(e.amount) as total
    FROM Expenses e
    WHERE e.gymId = ? 
      AND e.expense_type = 'PT_Commission'
      AND e.category = 'Luong PT'
      AND e.trainer_id IS NOT NULL
      AND e.expense_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      AND EXISTS (
        SELECT 1 
        FROM Member_Subscriptions ms
        INNER JOIN Members m ON ms.memberId = m.id
        WHERE ms.trainerId = e.trainer_id
          AND ms.status = 'Active'
          AND ms.endDate >= NOW()
          AND ms.trainerId IS NOT NULL
          AND m.gymId = ?
      )
    GROUP BY DATE_FORMAT(e.expense_date, '%Y-%m')
    ORDER BY month ASC`,
    [gymId, gymId]
  );

  // Kết hợp kết quả theo tháng
  const expenseMap = new Map();
  nonPTExpenseTrend.forEach(item => {
    expenseMap.set(item.month, parseFloat(item.total || 0));
  });
  validPTExpenseTrend.forEach(item => {
    const month = item.month;
    const amount = parseFloat(item.total || 0);
    expenseMap.set(month, (expenseMap.get(month) || 0) + amount);
  });

  const expenseTrend = Array.from(expenseMap.entries())
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Calculate profit
  // totalExpense đã được tính ở trên (dòng 103-104)
  const totalRevenue = parseFloat(revenueData[0].total_revenue) || 0;
  const profit = totalRevenue - totalExpense;

  res.json({
    summary: {
      total_revenue: totalRevenue,
      total_expense: totalExpense,
      profit: profit,
      profit_margin: totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : 0,
      revenue_transactions: revenueData[0].total_transactions,
      expense_transactions: expenseData[0].total_transactions
    },
    revenue_by_payment_method: revenueByPaymentMethod,
    expenses_by_type: expensesByType,
    trends: {
      revenue: revenueTrend,
      expense: expenseTrend
    }
  });
});

// Get detailed transaction list (combined revenues and expenses)
exports.getTransactionList = asyncHandler(async (req, res) => {
  const { gymId, startDate, endDate, type, limit = 100, offset = 0 } = req.query;

  let conditions = ['gymId = ?'];
  let params = [gymId];

  let dateField = type === 'revenue' ? 'payment_date' : 'expense_date';
  
  if (startDate) {
    conditions.push(`${dateField} >= ?`);
    params.push(startDate);
  }
  if (endDate) {
    conditions.push(`${dateField} <= ?`);
    params.push(endDate);
  }

  let transactions = [];

  if (!type || type === 'revenue') {
    // Thêm điều kiện chỉ lấy revenues từ members thực sự
    const revenueConditions = [...conditions, 'member_id IS NOT NULL'];
    const [revenues] = await pool.query(
      `SELECT 
        id,
        transaction_code,
        'Revenue' as type,
        member_name as description,
        membership_name as category,
        amount,
        payment_method,
        payment_date as date,
        notes
      FROM Revenues
      WHERE ${revenueConditions.join(' AND ')}
      ORDER BY payment_date DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    transactions = [...transactions, ...revenues];
  }

  if (!type || type === 'expense') {
    const [expenses] = await pool.query(
      `SELECT 
        id,
        transaction_code,
        'Expense' as type,
        description,
        category,
        amount,
        payment_method,
        expense_date as date,
        notes,
        created_at,
        updated_at,
        created_by,
        expense_type
      FROM Expenses
      WHERE ${conditions.join(' AND ')}
      ORDER BY expense_date DESC, created_at DESC
      LIMIT ? OFFSET ?`,
      [...params.map(p => p === dateField ? p : gymId), parseInt(limit), parseInt(offset)]
    );
    transactions = [...transactions, ...expenses];
  }

  // Sort combined results by date
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json(transactions.slice(0, parseInt(limit)));
});

// Export report (get data for Excel/PDF export)
exports.getExportData = asyncHandler(async (req, res) => {
  const { gymId, startDate, endDate, type } = req.query;

  let dateCondition = '';
  let params = [gymId];

  if (startDate) {
    dateCondition += ' AND DATE(payment_date) >= ?';
    params.push(startDate);
  }
  if (endDate) {
    dateCondition += ' AND DATE(payment_date) <= ?';
    params.push(endDate);
  }

  let data = {};

  if (!type || type === 'revenue') {
    // CHỈ tính từ members thực sự
    const [revenues] = await pool.query(
      `SELECT 
        transaction_code as 'Mã GD',
        member_name as 'Tên hội viên',
        membership_name as 'Gói tập',
        amount as 'Số tiền',
        payment_method as 'Phương thức',
        DATE_FORMAT(payment_date, '%d/%m/%Y %H:%i') as 'Ngày thanh toán',
        confirmed_by as 'Xác nhận bởi',
        notes as 'Ghi chú'
      FROM Revenues
      WHERE gymId = ? AND member_id IS NOT NULL ${dateCondition}
      ORDER BY payment_date DESC`,
      params
    );
    data.revenues = revenues;
  }

  if (!type || type === 'expense') {
    const expenseDateCondition = dateCondition.replace('payment_date', 'expense_date');
    const [expenses] = await pool.query(
      `SELECT 
        transaction_code as 'Mã GD',
        expense_type as 'Loại chi phí',
        category as 'Danh mục',
        description as 'Mô tả',
        amount as 'Số tiền',
        payment_status as 'Trạng thái',
        DATE_FORMAT(expense_date, '%d/%m/%Y %H:%i') as 'Ngày chi',
        trainer_name as 'PT',
        notes as 'Ghi chú'
      FROM Expenses
      WHERE gymId = ? ${expenseDateCondition}
      ORDER BY expense_date DESC`,
      params
    );
    data.expenses = expenses;
  }

  res.json(data);
});

/**
 * Calculate and create PT salary expenses based on active members
 * Logic: Chỉ trả lương cho PT có ít nhất 1 member active
 * Lương = salary của PT (full salary khi có member active)
 */
exports.calculatePTSalaries = asyncHandler(async (req, res) => {
  const { gymId, period = 'this_month', cleanupOnly = false } = req.query;

  if (!gymId) {
    return res.status(400).json({ message: 'gymId is required' });
  }

  console.log(`💰 Calculating PT salaries for gym ${gymId}, period: ${period}`);

  // Build date filter
  let dateCondition = '';
  let params = [gymId];
  
  if (period === 'this_month') {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    dateCondition = 'AND ms.startDate >= ?';
    params.push(start);
  } else if (period === 'last_month') {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    dateCondition = 'AND ms.startDate >= ? AND ms.startDate <= ?';
    params.push(lastMonth, lastMonthEnd);
  }

  // Lấy tất cả PT có salary
  const [trainers] = await pool.query(
    `SELECT id, name, salary, status 
     FROM Trainers 
     WHERE gymId = ? AND status = 'Active' AND salary IS NOT NULL AND salary > 0
     ORDER BY name ASC`,
    [gymId]
  );

  console.log(`Found ${trainers.length} active trainers with salary`);

  // BƯỚC 1: Dọn dẹp TẤT CẢ expenses PT không hợp lệ (không có member active) TRƯỚC
  // Xóa TẤT CẢ expense PT không có trainer có member active
  // Logic: Xóa nếu trainer_id NULL HOẶC trainer_id không có member active
  // Sử dụng LEFT JOIN với subquery để tránh lỗi với DELETE và subquery
  
  // Lấy danh sách trainer_ids có member active
  const [validTrainers] = await pool.query(
    `SELECT DISTINCT ms.trainerId
     FROM Member_Subscriptions ms
     INNER JOIN Members m ON ms.memberId = m.id
     WHERE ms.status = 'Active'
       AND ms.endDate >= NOW()
       AND ms.trainerId IS NOT NULL
       AND m.gymId = ?`,
    [gymId]
  );
  
  const validTrainerIds = validTrainers.map(t => t.trainerId).filter(id => id !== null);
  
  // Xóa expenses PT không hợp lệ
  let cleanupResult = { affectedRows: 0 };
  if (validTrainerIds.length === 0) {
    // Không có trainer nào có member active, xóa tất cả PT expenses
    [cleanupResult] = await pool.query(
      `DELETE FROM Expenses 
       WHERE expense_type = 'PT_Commission'
         AND category = 'Luong PT'
         AND gymId = ?`,
      [gymId]
    );
  } else {
    // Xóa expenses có trainer_id NULL hoặc không có trong danh sách trainer hợp lệ
    const placeholders = validTrainerIds.map(() => '?').join(',');
    [cleanupResult] = await pool.query(
      `DELETE FROM Expenses 
       WHERE expense_type = 'PT_Commission'
         AND category = 'Luong PT'
         AND gymId = ?
         AND (trainer_id IS NULL OR trainer_id NOT IN (${placeholders}))`,
      [gymId, ...validTrainerIds]
    );
  }
  console.log(`✓ Cleaned up ${cleanupResult.affectedRows} invalid PT expenses (trainers with no active members or NULL trainer_id)`);

  // Nếu chỉ dọn dẹp (cleanupOnly = true), trả về kết quả ngay
  if (cleanupOnly === 'true' || cleanupOnly === true) {
    return res.json({
      gymId: parseInt(gymId),
      deleted_count: cleanupResult.affectedRows || 0,
      message: `Đã xóa ${cleanupResult.affectedRows || 0} chi phí PT không hợp lệ`
    });
  }

  // BƯỚC 2: Xóa tất cả expenses PT cũ trong period này để tính lại
  const periodStart = period === 'this_month' 
    ? new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    : new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  
  const [deleteResult] = await pool.query(
    `DELETE FROM Expenses 
     WHERE expense_type = 'PT_Commission'
       AND category = 'Luong PT'
       AND expense_date >= ?
       AND gymId = ?`,
    [periodStart, gymId]
  );
  console.log(`✓ Deleted ${deleteResult.affectedRows} old PT expenses in period for recalculation`);

  const results = [];
  let totalExpensesCreated = 0;
  let totalAmount = 0;

  for (const trainer of trainers) {
    try {
      // Đếm số member active với PT này (dựa vào lịch HLV thực tế)
      // Xây dựng query với dateCondition một cách an toàn
      let activeMembersQuery = `
        SELECT COUNT(DISTINCT ms.id) as active_count,
               GROUP_CONCAT(DISTINCT CONCAT(m.name, ' (', COALESCE(ms.pt_schedule, 'No Schedule'), ')') SEPARATOR ', ') as members_list
        FROM Member_Subscriptions ms
        INNER JOIN Members m ON ms.memberId = m.id
        WHERE ms.trainerId = ?
          AND ms.status = 'Active'
          AND ms.endDate >= NOW()
          AND m.gymId = ?`;
      
      let activeMembersParams = [trainer.id, gymId];
      
      // Thêm dateCondition nếu có
      if (dateCondition && params.length > 2) {
        activeMembersQuery += ` ${dateCondition}`;
        // Lấy các params từ dateCondition (sau gymId)
        activeMembersParams = activeMembersParams.concat(params.slice(2));
      }
      
      const [activeMembers] = await pool.query(activeMembersQuery, activeMembersParams);

      const activeCount = parseInt(activeMembers[0]?.active_count || 0);
      const membersList = activeMembers[0]?.members_list || '';

      if (activeCount > 0) {
        // PT có member active → trả lương
        const salary = parseFloat(trainer.salary);
        
        if (isNaN(salary) || salary <= 0) {
          throw new Error(`Invalid salary for trainer ${trainer.id}: ${trainer.salary}`);
        }
        
        // Tạo expense mới (đã xóa cũ ở trên)
        const expenseCode = `EXP${Date.now()}${Math.floor(Math.random() * 1000)}`;
        await pool.execute(
          `INSERT INTO Expenses 
          (transaction_code, expense_type, category, description, amount, expense_date,
           payment_status, trainer_id, trainer_name, notes, gymId, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            expenseCode,
            'PT_Commission',
            'Luong PT',
            `Luong cho PT ${trainer.name} - ${activeCount} hoi vien active`,
            salary,
            new Date(),
            'Pending',
            trainer.id,
            trainer.name,
            `Tu dong tinh theo lich HLV thuc te. Hoi vien: ${membersList || 'N/A'}`,
            gymId,
            'System Auto'
          ]
        );

        totalExpensesCreated++;
        totalAmount += salary;

        results.push({
          trainer_id: trainer.id,
          trainer_name: trainer.name,
          salary: salary,
          active_members: activeCount,
          members_list: membersList,
          expense_created: true,
          expense_amount: salary
        });

        console.log(`✓ Created salary expense: ${salary.toLocaleString('vi-VN')} VND for PT ${trainer.name} (${activeCount} members)`);
      } else {
        // PT không có member active → không trả lương
        results.push({
          trainer_id: trainer.id,
          trainer_name: trainer.name,
          salary: parseFloat(trainer.salary),
          active_members: 0,
          members_list: '',
          expense_created: false,
          reason: 'No active members'
        });

        console.log(`⏭️  Skipped PT ${trainer.name} - no active members`);
      }
    } catch (trainerError) {
      console.error(`❌ Error processing trainer ${trainer.id} (${trainer.name}):`, trainerError);
      // Vẫn thêm vào results với lỗi
      results.push({
        trainer_id: trainer.id,
        trainer_name: trainer.name,
        salary: parseFloat(trainer.salary) || 0,
        active_members: 0,
        members_list: '',
        expense_created: false,
        error: trainerError.message || 'Unknown error'
      });
    }
  }

  res.json({
    period,
    gymId: parseInt(gymId),
    total_trainers: trainers.length,
    trainers_with_active_members: results.filter(r => r.active_members > 0).length,
    expenses_created: totalExpensesCreated,
    total_amount: totalAmount,
    results: results
  });
});

/**
 * Dọn dẹp tất cả expense PT không hợp lệ (trainer không còn member active hoặc trainer_id NULL)
 * API này để xóa dữ liệu cũ không hợp lệ
 */
exports.cleanupInvalidPTExpenses = asyncHandler(async (req, res) => {
  const { gymId } = req.query;

  if (!gymId) {
    return res.status(400).json({ message: 'gymId is required' });
  }

  console.log(`🧹 Cleaning up invalid PT expenses for gym ${gymId}`);

  // Xóa TẤT CẢ expense PT không hợp lệ:
  // 1. trainer_id IS NULL
  // 2. trainer_id không có member active trong Member_Subscriptions
  const [deleteResult] = await pool.query(
    `DELETE e FROM Expenses e
     WHERE e.expense_type = 'PT_Commission'
       AND e.category = 'Luong PT'
       AND e.gymId = ?
       AND (
         e.trainer_id IS NULL 
         OR NOT EXISTS (
           SELECT 1
           FROM Member_Subscriptions ms
           INNER JOIN Members m ON ms.memberId = m.id
           WHERE ms.trainerId = e.trainer_id
             AND ms.status = 'Active'
             AND ms.endDate >= NOW()
             AND ms.trainerId IS NOT NULL
             AND m.gymId = ?
         )
       )`,
    [gymId, gymId]
  );

  const deletedCount = deleteResult.affectedRows || 0;
  console.log(`✅ Cleaned up ${deletedCount} invalid PT expenses for gym ${gymId}`);

  res.json({
    gymId: parseInt(gymId),
    deleted_count: deletedCount,
    message: `Đã xóa ${deletedCount} chi phí PT không hợp lệ`
  });
});

