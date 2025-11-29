const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { validateRequiredFields } = require('../utils/validation');

// Generate unique transaction code
const generateTransactionCode = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `REV${timestamp}${random}`;
};

// Get all revenues with filters
exports.getRevenues = asyncHandler(async (req, res) => {
  const { gymId, startDate, endDate, paymentMethod, memberId } = req.query;
  
  let whereConditions = [];
  let params = [];

  if (gymId) {
    whereConditions.push('r.gymId = ?');
    params.push(gymId);
  }

  if (startDate) {
    whereConditions.push('r.payment_date >= ?');
    params.push(startDate);
  }

  if (endDate) {
    whereConditions.push('r.payment_date <= ?');
    params.push(endDate);
  }

  if (paymentMethod) {
    whereConditions.push('r.payment_method = ?');
    params.push(paymentMethod);
  }

  if (memberId) {
    whereConditions.push('r.member_id = ?');
    params.push(memberId);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const [revenues] = await pool.query(
    `SELECT 
      r.*,
      m.name as member_name_full,
      mem.title as membership_title
    FROM Revenues r
    LEFT JOIN Members m ON r.member_id = m.id
    LEFT JOIN Memberships mem ON r.membership_id = mem.id
    ${whereClause}
    ORDER BY r.payment_date DESC`,
    params
  );

  res.json(revenues);
});

// Get revenue by ID
exports.getRevenueById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [revenues] = await pool.query(
    `SELECT 
      r.*,
      m.name as member_name_full,
      mem.title as membership_title
    FROM Revenues r
    LEFT JOIN Members m ON r.member_id = m.id
    LEFT JOIN Memberships mem ON r.membership_id = mem.id
    WHERE r.id = ?`,
    [id]
  );

  if (revenues.length === 0) {
    return res.status(404).json({ message: 'Revenue not found' });
  }

  res.json(revenues[0]);
});

// Create revenue (manual or automatic)
exports.createRevenue = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['member_name', 'membership_name', 'amount', 'gymId']);

  const {
    member_id,
    member_name,
    membership_id,
    membership_name,
    amount,
    payment_method = 'Cash',
    payment_date = new Date(),
    confirmed_by,
    notes,
    gymId,
    subscription_id
  } = req.body;

  const transaction_code = generateTransactionCode();

  // Convert undefined to null for optional fields
  const normalizedMemberId = member_id || null;
  const normalizedMembershipId = membership_id || null;
  const normalizedPaymentDate = payment_date || new Date();
  const normalizedConfirmedBy = confirmed_by || null;
  const normalizedNotes = notes || null;
  const normalizedSubscriptionId = subscription_id || null;

  const [result] = await pool.execute(
    `INSERT INTO Revenues 
    (transaction_code, member_id, member_name, membership_id, membership_name, 
     amount, payment_method, payment_date, confirmed_by, notes, gymId, subscription_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [transaction_code, normalizedMemberId, member_name, normalizedMembershipId, membership_name,
     amount, payment_method, normalizedPaymentDate, normalizedConfirmedBy, normalizedNotes, 
     gymId, normalizedSubscriptionId]
  );

  const [revenues] = await pool.query('SELECT * FROM Revenues WHERE id = ?', [result.insertId]);

  res.status(201).json(revenues[0]);
});

// Update revenue
exports.updateRevenue = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { payment_method, confirmed_by, notes } = req.body;

  const updates = [];
  const values = [];

  if (payment_method) {
    updates.push('payment_method = ?');
    values.push(payment_method);
  }
  if (confirmed_by !== undefined) {
    updates.push('confirmed_by = ?');
    values.push(confirmed_by);
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    values.push(notes);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  values.push(id);

  const [result] = await pool.execute(
    `UPDATE Revenues SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Revenue not found' });
  }

  const [revenues] = await pool.query('SELECT * FROM Revenues WHERE id = ?', [id]);
  res.json(revenues[0]);
});

// Delete revenue
exports.deleteRevenue = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [result] = await pool.execute('DELETE FROM Revenues WHERE id = ?', [id]);

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Revenue not found' });
  }

  res.status(204).send();
});

// Get revenue statistics
exports.getRevenueStats = asyncHandler(async (req, res) => {
  const { gymId, startDate, endDate } = req.query;

  let whereConditions = [];
  let params = [];

  if (gymId) {
    whereConditions.push('gymId = ?');
    params.push(gymId);
  }

  if (startDate) {
    whereConditions.push('payment_date >= ?');
    params.push(startDate);
  }

  if (endDate) {
    whereConditions.push('payment_date <= ?');
    params.push(endDate);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const [stats] = await pool.query(
    `SELECT 
      COUNT(*) as total_transactions,
      SUM(amount) as total_revenue,
      AVG(amount) as average_revenue,
      SUM(CASE WHEN payment_method = 'Cash' THEN amount ELSE 0 END) as cash_revenue,
      SUM(CASE WHEN payment_method = 'Transfer' THEN amount ELSE 0 END) as transfer_revenue,
      SUM(CASE WHEN payment_method = 'Card' THEN amount ELSE 0 END) as card_revenue
    FROM Revenues
    ${whereClause}`,
    params
  );

  res.json(stats[0]);
});

