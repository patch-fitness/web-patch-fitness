const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { validateRequiredFields } = require('../utils/validation');

// Generate unique transaction code
const generateTransactionCode = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `EXP${timestamp}${random}`;
};

// Get all expenses with filters
exports.getExpenses = asyncHandler(async (req, res) => {
  const { gymId, startDate, endDate, expenseType, paymentStatus } = req.query;
  
  let whereConditions = [];
  let params = [];

  if (gymId) {
    whereConditions.push('e.gymId = ?');
    params.push(gymId);
  }

  if (startDate) {
    whereConditions.push('e.expense_date >= ?');
    params.push(startDate);
  }

  if (endDate) {
    whereConditions.push('e.expense_date <= ?');
    params.push(endDate);
  }

  if (expenseType) {
    whereConditions.push('e.expense_type = ?');
    params.push(expenseType);
  }

  if (paymentStatus) {
    whereConditions.push('e.payment_status = ?');
    params.push(paymentStatus);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const [expenses] = await pool.query(
    `SELECT 
      e.*,
      t.name as trainer_name_full,
      eq.name as equipment_name
    FROM Expenses e
    LEFT JOIN Trainers t ON e.trainer_id = t.id
    LEFT JOIN Equipment eq ON e.equipment_id = eq.id
    ${whereClause}
    ORDER BY e.expense_date DESC`,
    params
  );

  res.json(expenses);
});

// Get expense by ID
exports.getExpenseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [expenses] = await pool.query(
    `SELECT 
      e.*,
      t.name as trainer_name_full,
      eq.name as equipment_name
    FROM Expenses e
    LEFT JOIN Trainers t ON e.trainer_id = t.id
    LEFT JOIN Equipment eq ON e.equipment_id = eq.id
    WHERE e.id = ?`,
    [id]
  );

  if (expenses.length === 0) {
    return res.status(404).json({ message: 'Không tìm thấy chi phí' });
  }

  res.json(expenses[0]);
});

// Create expense
exports.createExpense = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['expense_type', 'category', 'description', 'amount', 'gymId']);

  const {
    expense_type,
    category,
    description,
    amount,
    expense_date,
    payment_status,
    payment_method,
    paid_date,
    trainer_id,
    trainer_name,
    revenue_id,
    commission_rate,
    equipment_id,
    notes,
    gymId,
    created_by
  } = req.body;

  // Validate amount
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: 'Số tiền phải là số dương' });
  }

  // Validate gymId
  const parsedGymId = parseInt(gymId, 10);
  if (isNaN(parsedGymId)) {
    return res.status(400).json({ message: 'Mã phòng tập không hợp lệ' });
  }

  const transaction_code = generateTransactionCode();

  // Convert undefined to null or default values for ALL fields
  // Nếu không có expense_date hoặc là chuỗi rỗng, dùng thời gian hiện tại (có cả giờ)
  // Nếu có expense_date, parse và đảm bảo format đúng
  let normalizedExpenseDate;
  if (!expense_date || expense_date === '' || expense_date === 'null' || expense_date === null || expense_date === undefined) {
    // Không chọn ngày -> dùng thời gian hiện tại (có cả giờ)
    normalizedExpenseDate = new Date();
    console.log(`✓ Using current datetime for expense: ${normalizedExpenseDate.toISOString()}`);
  } else {
    // Có chọn ngày -> parse và giữ nguyên
    // Nếu chỉ có date (YYYY-MM-DD), sẽ lưu với time 00:00:00
    // Nếu muốn có cả giờ, có thể thêm logic ở đây
    const parsedDate = new Date(expense_date);
    // Kiểm tra nếu date hợp lệ
    if (isNaN(parsedDate.getTime())) {
      // Date không hợp lệ -> dùng thời gian hiện tại
      console.log(`⚠️  Invalid date format: ${expense_date}, using current datetime`);
      normalizedExpenseDate = new Date();
    } else {
      normalizedExpenseDate = parsedDate;
      console.log(`✓ Using provided date for expense: ${normalizedExpenseDate.toISOString()}`);
    }
  }
  const normalizedPaymentStatus = payment_status || 'Pending';
  // payment_method can be null if payment_status is Pending
  const normalizedPaymentMethod = (payment_status === 'Paid' && payment_method) ? payment_method : null;
  const normalizedPaidDate = (payment_status === 'Paid' && paid_date) ? new Date(paid_date) : null;
  const normalizedTrainerId = trainer_id ? parseInt(trainer_id, 10) : null;
  const normalizedTrainerName = trainer_name || null;
  const normalizedRevenueId = revenue_id ? parseInt(revenue_id, 10) : null;
  const normalizedCommissionRate = commission_rate ? parseFloat(commission_rate) : null;
  const normalizedEquipmentId = equipment_id ? parseInt(equipment_id, 10) : null;
  const normalizedNotes = notes || null;
  const normalizedCreatedBy = created_by || 'Admin';

  try {
    const [result] = await pool.execute(
      `INSERT INTO Expenses 
      (transaction_code, expense_type, category, description, amount, expense_date,
       payment_status, payment_method, paid_date, trainer_id, trainer_name, revenue_id,
       commission_rate, equipment_id, notes, gymId, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [transaction_code, expense_type, category, description, parsedAmount, normalizedExpenseDate,
       normalizedPaymentStatus, normalizedPaymentMethod, normalizedPaidDate, normalizedTrainerId, 
       normalizedTrainerName, normalizedRevenueId, normalizedCommissionRate, normalizedEquipmentId, 
       normalizedNotes, parsedGymId, normalizedCreatedBy]
    );

    // Get the created expense with all related data
    // Sử dụng COALESCE để đảm bảo có giá trị cho updated_at (nếu cột tồn tại)
    const [expenses] = await pool.query(
      `SELECT 
        e.*,
        COALESCE(e.updated_at, e.created_at, e.expense_date) as updated_at,
        t.name as trainer_name_full,
        eq.name as equipment_name
      FROM Expenses e
      LEFT JOIN Trainers t ON e.trainer_id = t.id
      LEFT JOIN Equipment eq ON e.equipment_id = eq.id
      WHERE e.id = ?`,
      [result.insertId]
    );

    if (expenses.length === 0) {
      return res.status(500).json({ message: 'Không thể lấy thông tin chi phí vừa tạo' });
    }

    console.log(`✓ Created expense ${result.insertId} for gym ${parsedGymId}: ${parsedAmount} VND`);
    res.status(201).json(expenses[0]);
  } catch (error) {
    console.error('Error creating expense:', error);
    // Provide more specific error messages
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({ 
        message: 'Lỗi cấu trúc database. Vui lòng kiểm tra các cột bắt buộc có tồn tại không.',
        error: error.message 
      });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: 'Tham chiếu khóa ngoại không hợp lệ (trainer_id, equipment_id, revenue_id, hoặc gymId)',
        error: error.message 
      });
    }
    throw error; // Let asyncHandler handle other errors
  }
});

// Update expense
exports.updateExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const allowedFields = [
    'payment_status', 'payment_method', 'paid_date', 'notes', 'description', 'amount'
  ];

  const updates = [];
  const values = [];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  });

  if (updates.length === 0) {
    return res.status(400).json({ message: 'Không có trường nào để cập nhật' });
  }

  values.push(id);

  const [result] = await pool.execute(
    `UPDATE Expenses SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Không tìm thấy chi phí' });
  }

  const [expenses] = await pool.query('SELECT * FROM Expenses WHERE id = ?', [id]);
  res.json(expenses[0]);
});

// Delete expense - Chỉ cho phép xóa chi phí thủ công (không phải tự động)
exports.deleteExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Kiểm tra expense có tồn tại và có phải chi phí tự động không
  const [expenses] = await pool.query(
    `SELECT id, created_by, expense_type, description 
     FROM Expenses 
     WHERE id = ?`,
    [id]
  );

  if (expenses.length === 0) {
    return res.status(404).json({ message: 'Không tìm thấy chi phí' });
  }

  const expense = expenses[0];

  // Kiểm tra nếu là chi phí tự động (System Auto) hoặc PT Commission
  // Chi phí tự động: created_by = 'System Auto' hoặc expense_type = 'PT_Commission'
  const isAutoExpense = 
    expense.created_by === 'System Auto' || 
    expense.created_by === 'System Auto (Session Completed)' ||
    expense.expense_type === 'PT_Commission' ||
    (expense.description && expense.description.includes('Tu dong'));

  if (isAutoExpense) {
    return res.status(403).json({ 
      message: 'Không thể xóa chi phí tự động. Chỉ có thể xóa chi phí được thêm thủ công.' 
    });
  }

  // Xóa chi phí thủ công
  const [result] = await pool.execute('DELETE FROM Expenses WHERE id = ?', [id]);

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Không tìm thấy chi phí' });
  }

  console.log(`✓ Deleted manual expense ${id}`);
  res.status(200).json({ message: 'Đã xóa chi phí thành công' });
});

// Get expense statistics
exports.getExpenseStats = asyncHandler(async (req, res) => {
  const { gymId, startDate, endDate } = req.query;

  let whereConditions = [];
  let params = [];

  if (gymId) {
    whereConditions.push('gymId = ?');
    params.push(gymId);
  }

  if (startDate) {
    whereConditions.push('expense_date >= ?');
    params.push(startDate);
  }

  if (endDate) {
    whereConditions.push('expense_date <= ?');
    params.push(endDate);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const [stats] = await pool.query(
    `SELECT 
      COUNT(*) as total_transactions,
      SUM(amount) as total_expense,
      AVG(amount) as average_expense,
      SUM(CASE WHEN expense_type = 'PT_Commission' THEN amount ELSE 0 END) as pt_commission_expense,
      SUM(CASE WHEN expense_type = 'Operating' THEN amount ELSE 0 END) as operating_expense,
      SUM(CASE WHEN expense_type = 'Maintenance' THEN amount ELSE 0 END) as maintenance_expense,
      SUM(CASE WHEN expense_type = 'Equipment' THEN amount ELSE 0 END) as equipment_expense,
      SUM(CASE WHEN expense_type = 'Salary' THEN amount ELSE 0 END) as salary_expense,
      SUM(CASE WHEN expense_type = 'Marketing' THEN amount ELSE 0 END) as marketing_expense,
      SUM(CASE WHEN payment_status = 'Paid' THEN amount ELSE 0 END) as paid_expense,
      SUM(CASE WHEN payment_status = 'Pending' THEN amount ELSE 0 END) as pending_expense
    FROM Expenses
    ${whereClause}`,
    params
  );

  res.json(stats[0]);
});

// Get PT commission settings
exports.getPTCommissionSettings = asyncHandler(async (req, res) => {
  const { gymId, trainerId } = req.query;

  let whereConditions = ['gymId = ?'];
  let params = [gymId];

  if (trainerId) {
    whereConditions.push('(trainer_id = ? OR trainer_id IS NULL)');
    params.push(trainerId);
  }

  const [settings] = await pool.query(
    `SELECT * FROM PT_Commission_Settings 
     WHERE ${whereConditions.join(' AND ')}
     ORDER BY is_default DESC, trainer_id DESC, membership_id DESC`,
    params
  );

  res.json(settings);
});

// Update PT commission settings
exports.updatePTCommissionSettings = asyncHandler(async (req, res) => {
  const { trainerId, membershipId, commissionType, commissionValue, gymId } = req.body;

  validateRequiredFields(req.body, ['commissionType', 'commissionValue', 'gymId']);

  // Try to update existing setting
  const [result] = await pool.execute(
    `INSERT INTO PT_Commission_Settings 
     (trainer_id, membership_id, commission_type, commission_value, gymId)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
     commission_type = VALUES(commission_type),
     commission_value = VALUES(commission_value)`,
    [trainerId || null, membershipId || null, commissionType, commissionValue, gymId]
  );

  res.json({ 
    message: 'Đã cập nhật cài đặt hoa hồng PT thành công',
    id: result.insertId || result.lastInsertId
  });
});

// Delete PT commission settings
exports.deletePTCommissionSettings = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Kiểm tra setting có tồn tại không
  const [settings] = await pool.query(
    `SELECT id FROM PT_Commission_Settings WHERE id = ?`,
    [id]
  );

  if (settings.length === 0) {
    return res.status(404).json({ message: 'Không tìm thấy cài đặt hoa hồng' });
  }

  // Xóa setting
  const [result] = await pool.execute(
    'DELETE FROM PT_Commission_Settings WHERE id = ?',
    [id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Không tìm thấy cài đặt hoa hồng' });
  }

  console.log(`✓ Deleted PT commission setting ${id}`);
  res.status(200).json({ message: 'Đã xóa cài đặt hoa hồng thành công' });
});

