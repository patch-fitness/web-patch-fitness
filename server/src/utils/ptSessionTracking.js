const pool = require('../config/db');

/**
 * Tính số session dự kiến trong tháng dựa trên schedule (2-4-6 hoặc 3-5-7)
 * Schedule 2-4-6: 3 buổi/tuần = ~12-13 buổi/tháng
 * Schedule 3-5-7: 3 buổi/tuần = ~12-13 buổi/tháng
 */
const calculateExpectedSessionsPerMonth = (schedule) => {
  if (!schedule) return 0;
  // Mỗi schedule có 3 buổi/tuần = ~13 buổi/tháng (tính trung bình 4.33 tuần/tháng)
  return 13;
};

/**
 * Tính số session đã hoàn thành trong tháng cho một subscription
 * Dựa trên các expense đã tạo với metadata về session completion
 */
const getCompletedSessionsCount = async (subscriptionId, month, year) => {
  try {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    const [completedSessions] = await pool.query(
      `SELECT COUNT(*) as count
       FROM Expenses
       WHERE expense_type = 'PT_Commission'
         AND category = 'PT_Session'
         AND notes LIKE ?
         AND expense_date >= ?
         AND expense_date <= ?
         AND payment_status != 'Cancelled'`,
      [`%subscription_id:${subscriptionId}%`, monthStart, monthEnd]
    );

    return parseInt(completedSessions[0]?.count || 0);
  } catch (error) {
    console.error('Error getting completed sessions count:', error);
    return 0;
  }
};

/**
 * Tính số session đã bị hủy trong tháng cho một subscription
 */
const getCancelledSessionsCount = async (subscriptionId, month, year) => {
  try {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    const [cancelledSessions] = await pool.query(
      `SELECT COUNT(*) as count
       FROM Expenses
       WHERE expense_type = 'PT_Commission'
         AND category = 'PT_Session'
         AND notes LIKE ?
         AND expense_date >= ?
         AND expense_date <= ?
         AND payment_status = 'Cancelled'`,
      [`%subscription_id:${subscriptionId}%`, monthStart, monthEnd]
    );

    return parseInt(cancelledSessions[0]?.count || 0);
  } catch (error) {
    console.error('Error getting cancelled sessions count:', error);
    return 0;
  }
};

/**
 * Tính session rate (giá mỗi buổi tập) dựa trên lương PT và số session dự kiến
 */
const calculateSessionRate = async (trainerId, subscriptionId, schedule) => {
  try {
    // Lấy lương PT
    const [trainers] = await pool.query(
      'SELECT salary FROM Trainers WHERE id = ?',
      [trainerId]
    );

    if (trainers.length === 0 || !trainers[0].salary) {
      return 0;
    }

    const salary = parseFloat(trainers[0].salary);
    const expectedSessions = calculateExpectedSessionsPerMonth(schedule);

    // Tính giá mỗi buổi = lương / số session dự kiến
    // Nếu không có schedule, tính dựa trên số member active của PT
    if (!schedule || expectedSessions === 0) {
      // Fallback: tính dựa trên số member active
      const [activeMembers] = await pool.query(
        `SELECT COUNT(DISTINCT id) as count
         FROM Member_Subscriptions
         WHERE trainerId = ? AND status = 'Active' AND endDate >= NOW()`,
        [trainerId]
      );
      const memberCount = parseInt(activeMembers[0]?.count || 1);
      return memberCount > 0 ? salary / memberCount / 13 : 0; // ~13 sessions per member per month
    }

    return expectedSessions > 0 ? salary / expectedSessions : 0;
  } catch (error) {
    console.error('Error calculating session rate:', error);
    return 0;
  }
};

/**
 * Tạo expense cho một session đã hoàn thành
 */
const createCompletedSessionExpense = async (subscriptionId, trainerId, memberId, sessionDate, sessionInfo = {}) => {
  try {
    // Lấy thông tin subscription
    const [subscriptions] = await pool.query(
      `SELECT ms.*, m.name as memberName, m.gymId, t.name as trainerName, mem.title as membershipTitle
       FROM Member_Subscriptions ms
       INNER JOIN Members m ON ms.memberId = m.id
       LEFT JOIN Trainers t ON ms.trainerId = t.id
       LEFT JOIN Memberships mem ON ms.membershipId = mem.id
       WHERE ms.id = ?`,
      [subscriptionId]
    );

    if (subscriptions.length === 0) {
      throw new Error('Subscription not found');
    }

    const subscription = subscriptions[0];
    const schedule = subscription.pt_schedule || '2-4-6';

    // Tính session rate
    const sessionRate = await calculateSessionRate(trainerId, subscriptionId, schedule);
    if (sessionRate <= 0) {
      console.warn(`⚠️  Session rate is 0 for trainer ${trainerId}, subscription ${subscriptionId}`);
      return null;
    }

    // Tạo expense cho session này
    const expenseCode = `EXP${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const sessionDateObj = sessionDate ? new Date(sessionDate) : new Date();
    
    const notes = `PT Session completed | subscription_id:${subscriptionId} | member_id:${memberId} | session_date:${sessionDateObj.toISOString().split('T')[0]} | schedule:${schedule} | ${sessionInfo.notes || ''}`;
    
    const [result] = await pool.execute(
      `INSERT INTO Expenses 
      (transaction_code, expense_type, category, description, amount, expense_date,
       payment_status, trainer_id, trainer_name, notes, gymId, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        expenseCode,
        'PT_Commission',
        'PT_Session',
        `Session fee - ${subscription.memberName} (${subscription.trainerName}) - ${sessionDateObj.toLocaleDateString('vi-VN')}`,
        sessionRate,
        sessionDateObj,
        'Pending',
        trainerId,
        subscription.trainerName,
        notes,
        subscription.gymId,
        'System Auto (Session Completed)'
      ]
    );

    console.log(`✅ Created expense for completed session: ${sessionRate} VND for trainer ${subscription.trainerName}, member ${subscription.memberName}, date ${sessionDateObj.toLocaleDateString('vi-VN')}`);
    
    return result.insertId;
  } catch (error) {
    console.error(`❌ Error creating completed session expense:`, error);
    throw error;
  }
};

/**
 * Hủy expense của một session (đánh dấu là Cancelled)
 */
const cancelSessionExpense = async (subscriptionId, sessionDate, cancelledBy = 'System', cancelledReason = '') => {
  try {
    const sessionDateObj = sessionDate ? new Date(sessionDate) : new Date();
    const sessionDateStr = sessionDateObj.toISOString().split('T')[0];

    // Tìm expense liên quan đến session này
    // Tìm theo subscription_id trong notes và session_date trong notes hoặc expense_date
    const [expenses] = await pool.query(
      `SELECT id, amount, description, payment_status
       FROM Expenses
       WHERE expense_type = 'PT_Commission'
         AND category = 'PT_Session'
         AND notes LIKE ?
         AND (DATE(expense_date) = ? OR notes LIKE ?)
         AND payment_status != 'Cancelled'
       ORDER BY created_at DESC
       LIMIT 1`,
      [`%subscription_id:${subscriptionId}%`, sessionDateStr, `%session_date:${sessionDateStr}%`]
    );

    if (expenses.length === 0) {
      // Không tìm thấy expense, có thể session chưa được tạo expense
      console.log(`ℹ️  No expense found to cancel for subscription ${subscriptionId}, date ${sessionDateStr}`);
      return null;
    }

    const expense = expenses[0];

    // Cập nhật expense thành Cancelled
    const cancelledNote = ` | CANCELLED at ${new Date().toISOString()} by ${cancelledBy} - Reason: ${cancelledReason || 'No reason provided'}`;
    
    const [updateResult] = await pool.execute(
      `UPDATE Expenses 
       SET payment_status = 'Cancelled',
           notes = CONCAT(IFNULL(notes, ''), ?)
       WHERE id = ?`,
      [cancelledNote, expense.id]
    );

    console.log(`✅ Cancelled expense ID ${expense.id} for subscription ${subscriptionId}, session date ${sessionDateStr}`);

    return expense.id;
  } catch (error) {
    console.error(`❌ Error cancelling session expense:`, error);
    throw error;
  }
};

/**
 * Tính lại lương PT dựa trên số session đã hoàn thành trong tháng
 * Thay vì tính theo số member, tính theo số session thực tế
 */
const recalculatePTSalaryBasedOnSessions = async (trainerId, gymId, month, year) => {
  try {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    // Lấy tất cả subscriptions active của PT này
    const [subscriptions] = await pool.query(
      `SELECT ms.id as subscriptionId, ms.memberId, ms.pt_schedule, m.name as memberName
       FROM Member_Subscriptions ms
       INNER JOIN Members m ON ms.memberId = m.id
       WHERE ms.trainerId = ?
         AND ms.status = 'Active'
         AND ms.endDate >= NOW()
         AND m.gymId = ?`,
      [trainerId, gymId]
    );

    if (subscriptions.length === 0) {
      console.log(`⚠️  No active subscriptions found for trainer ${trainerId}`);
      return 0;
    }

    // Đếm số session đã hoàn thành trong tháng (không bị hủy)
    let totalCompletedSessions = 0;
    let totalSessionAmount = 0;

    for (const sub of subscriptions) {
      const completedCount = await getCompletedSessionsCount(sub.subscriptionId, month, year);
      const schedule = sub.pt_schedule || '2-4-6';
      const sessionRate = await calculateSessionRate(trainerId, sub.subscriptionId, schedule);
      
      totalCompletedSessions += completedCount;
      totalSessionAmount += completedCount * sessionRate;
    }

    console.log(`📊 Trainer ${trainerId}: ${totalCompletedSessions} completed sessions, total amount: ${totalSessionAmount} VND`);

    return {
      trainerId,
      month,
      year,
      totalSubscriptions: subscriptions.length,
      totalCompletedSessions,
      totalSessionAmount,
      subscriptions: subscriptions.map(sub => ({
        subscriptionId: sub.subscriptionId,
        memberName: sub.memberName,
        schedule: sub.pt_schedule
      }))
    };
  } catch (error) {
    console.error(`❌ Error recalculating PT salary based on sessions:`, error);
    throw error;
  }
};

/**
 * Lấy thống kê sessions cho một PT trong khoảng thời gian
 */
const getPTSessionStats = async (trainerId, gymId, startDate, endDate) => {
  try {
    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_sessions,
        SUM(CASE WHEN payment_status != 'Cancelled' THEN amount ELSE 0 END) as total_amount,
        SUM(CASE WHEN payment_status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled_count,
        SUM(CASE WHEN payment_status = 'Pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN payment_status = 'Paid' THEN 1 ELSE 0 END) as paid_count
       FROM Expenses
       WHERE expense_type = 'PT_Commission'
         AND category = 'PT_Session'
         AND trainer_id = ?
         AND gymId = ?
         AND expense_date >= ?
         AND expense_date <= ?`,
      [trainerId, gymId, startDate, endDate]
    );

    return stats[0];
  } catch (error) {
    console.error('Error getting PT session stats:', error);
    return {
      total_sessions: 0,
      total_amount: 0,
      cancelled_count: 0,
      pending_count: 0,
      paid_count: 0
    };
  }
};

module.exports = {
  calculateExpectedSessionsPerMonth,
  getCompletedSessionsCount,
  getCancelledSessionsCount,
  calculateSessionRate,
  createCompletedSessionExpense,
  cancelSessionExpense,
  recalculatePTSalaryBasedOnSessions,
  getPTSessionStats
};

