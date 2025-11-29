const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { validateRequiredFields } = require('../utils/validation');
const {
  createCompletedSessionExpense,
  cancelSessionExpense,
  getCompletedSessionsCount,
  getCancelledSessionsCount,
  recalculatePTSalaryBasedOnSessions,
  getPTSessionStats
} = require('../utils/ptSessionTracking');

/**
 * Đánh dấu một session đã hoàn thành
 * Tự động tạo expense cho PT
 */
exports.markSessionCompleted = asyncHandler(async (req, res) => {
  const { subscriptionId, sessionDate, notes } = req.body;

  validateRequiredFields(req.body, ['subscriptionId', 'sessionDate']);

  // Lấy thông tin subscription
  const [subscriptions] = await pool.query(
    `SELECT ms.*, m.id as memberId, m.name as memberName, m.gymId, t.id as trainerId, t.name as trainerName
     FROM Member_Subscriptions ms
     INNER JOIN Members m ON ms.memberId = m.id
     LEFT JOIN Trainers t ON ms.trainerId = t.id
     WHERE ms.id = ? AND ms.status = 'Active'`,
    [subscriptionId]
  );

  if (subscriptions.length === 0) {
    return res.status(404).json({ message: 'Subscription not found or inactive' });
  }

  const subscription = subscriptions[0];

  if (!subscription.trainerId) {
    return res.status(400).json({ message: 'Subscription does not have an assigned trainer' });
  }

  // Kiểm tra xem session này đã được đánh dấu completed chưa
  const sessionDateObj = new Date(sessionDate);
  const sessionDateStr = sessionDateObj.toISOString().split('T')[0];
  
  const completedCount = await getCompletedSessionsCount(
    subscriptionId,
    sessionDateObj.getMonth() + 1,
    sessionDateObj.getFullYear()
  );

  // Kiểm tra expense đã tồn tại cho session này chưa
  const [existingExpenses] = await pool.query(
    `SELECT id, payment_status
     FROM Expenses
     WHERE expense_type = 'PT_Commission'
       AND category = 'PT_Session'
       AND notes LIKE ?
       AND DATE(expense_date) = ?
       AND payment_status != 'Cancelled'`,
    [`%subscription_id:${subscriptionId}%`, sessionDateStr]
  );

  if (existingExpenses.length > 0) {
    return res.status(400).json({ 
      message: 'Session already marked as completed',
      expenseId: existingExpenses[0].id
    });
  }

  // Tạo expense cho session đã hoàn thành
  const expenseId = await createCompletedSessionExpense(
    subscriptionId,
    subscription.trainerId,
    subscription.memberId,
    sessionDate,
    { notes: notes || `Session completed on ${sessionDateStr}` }
  );

  if (!expenseId) {
    return res.status(500).json({ message: 'Failed to create expense for session' });
  }

  res.status(201).json({
    message: 'Session marked as completed and expense created',
    subscriptionId,
    sessionDate: sessionDateStr,
    expenseId,
    memberName: subscription.memberName,
    trainerName: subscription.trainerName
  });
});

/**
 * Đánh dấu một session đã bị hủy
 * Tự động hủy expense liên quan (nếu có)
 */
exports.markSessionCancelled = asyncHandler(async (req, res) => {
  const { subscriptionId, sessionDate, cancelledBy, cancelledReason } = req.body;

  validateRequiredFields(req.body, ['subscriptionId', 'sessionDate']);

  // Lấy thông tin subscription
  const [subscriptions] = await pool.query(
    `SELECT ms.*, m.name as memberName, t.name as trainerName
     FROM Member_Subscriptions ms
     INNER JOIN Members m ON ms.memberId = m.id
     LEFT JOIN Trainers t ON ms.trainerId = t.id
     WHERE ms.id = ?`,
    [subscriptionId]
  );

  if (subscriptions.length === 0) {
    return res.status(404).json({ message: 'Subscription not found' });
  }

  const subscription = subscriptions[0];

  // Hủy expense của session này
  const expenseId = await cancelSessionExpense(
    subscriptionId,
    sessionDate,
    cancelledBy || 'System',
    cancelledReason || 'Session cancelled by user'
  );

  res.json({
    message: 'Session marked as cancelled',
    subscriptionId,
    sessionDate,
    expenseCancelled: expenseId !== null,
    expenseId,
    memberName: subscription.memberName,
    trainerName: subscription.trainerName
  });
});

/**
 * Lấy danh sách sessions của một subscription trong khoảng thời gian
 */
exports.getSubscriptionSessions = asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;
  const { startDate, endDate } = req.query;

  let whereConditions = [
    'expense_type = ?',
    'category = ?',
    'notes LIKE ?'
  ];
  let params = ['PT_Commission', 'PT_Session', `%subscription_id:${subscriptionId}%`];

  if (startDate) {
    whereConditions.push('expense_date >= ?');
    params.push(startDate);
  }

  if (endDate) {
    whereConditions.push('expense_date <= ?');
    params.push(endDate);
  }

  const [sessions] = await pool.query(
    `SELECT 
      e.id,
      e.expense_date as sessionDate,
      e.amount as sessionFee,
      e.payment_status as status,
      e.description,
      e.notes,
      e.created_at,
      CASE 
        WHEN e.payment_status = 'Cancelled' THEN 'Cancelled'
        WHEN e.payment_status = 'Paid' THEN 'Completed'
        ELSE 'Scheduled'
      END as sessionStatus
     FROM Expenses e
     WHERE ${whereConditions.join(' AND ')}
     ORDER BY e.expense_date DESC`,
    params
  );

  res.json(sessions);
});

/**
 * Lấy thống kê sessions cho một PT
 */
exports.getTrainerSessionStats = asyncHandler(async (req, res) => {
  const { trainerId, gymId, startDate, endDate, month, year } = req.query;

  if (!trainerId || !gymId) {
    return res.status(400).json({ message: 'trainerId and gymId are required' });
  }

  // Nếu có month và year, tính lại lương dựa trên sessions
  if (month && year) {
    const stats = await recalculatePTSalaryBasedOnSessions(
      parseInt(trainerId),
      parseInt(gymId),
      parseInt(month),
      parseInt(year)
    );
    return res.json(stats);
  }

  // Nếu có startDate và endDate, lấy thống kê trong khoảng thời gian
  if (startDate && endDate) {
    const stats = await getPTSessionStats(
      parseInt(trainerId),
      parseInt(gymId),
      startDate,
      endDate
    );
    return res.json(stats);
  }

  return res.status(400).json({ 
    message: 'Either (month, year) or (startDate, endDate) must be provided' 
  });
});

/**
 * Lấy tổng số session đã hoàn thành trong tháng cho một subscription
 */
exports.getSubscriptionSessionCount = asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;
  const { month, year } = req.query;

  const now = new Date();
  const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
  const targetYear = year ? parseInt(year) : now.getFullYear();

  const completedCount = await getCompletedSessionsCount(subscriptionId, targetMonth, targetYear);
  const cancelledCount = await getCancelledSessionsCount(subscriptionId, targetMonth, targetYear);

  // Lấy thông tin subscription để tính số session dự kiến
  const [subscriptions] = await pool.query(
    'SELECT pt_schedule FROM Member_Subscriptions WHERE id = ?',
    [subscriptionId]
  );

  let expectedSessions = 0;
  if (subscriptions.length > 0 && subscriptions[0].pt_schedule) {
    // Tính số session dự kiến dựa trên số ngày trong tháng và schedule
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    const schedule = subscriptions[0].pt_schedule;
    // Schedule 2-4-6 hoặc 3-5-7: ~3 buổi/tuần = ~13 buổi/tháng
    expectedSessions = 13;
  }

  res.json({
    subscriptionId,
    month: targetMonth,
    year: targetYear,
    expectedSessions,
    completedSessions: completedCount,
    cancelledSessions: cancelledCount,
    remainingSessions: Math.max(0, expectedSessions - completedCount - cancelledCount)
  });
});

