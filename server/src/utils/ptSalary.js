const pool = require('../config/db');

/**
 * Tính lại lương PT cho một trainer dựa vào lịch HLV thực tế
 */
const recalculatePTSalaryForTrainer = async (trainerId, gymId) => {
  try {
    // Lấy thông tin trainer
    const [trainers] = await pool.query(
      'SELECT id, name, salary FROM Trainers WHERE id = ? AND salary IS NOT NULL AND salary > 0',
      [trainerId]
    );

    if (trainers.length === 0) {
      console.log(`⚠️  Trainer ${trainerId} not found or has no salary`);
      return;
    }

    const trainer = trainers[0];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Xóa expenses PT cũ của trainer này trong tháng này
    const [deleteResult] = await pool.query(
      `DELETE FROM Expenses 
       WHERE trainer_id = ?
         AND expense_type = 'PT_Commission'
         AND category = 'Luong PT'
         AND expense_date >= ?`,
      [trainerId, monthStart]
    );
    console.log(`✓ Deleted ${deleteResult.affectedRows} old PT expenses for trainer ${trainer.name}`);

    // Đếm số member active với PT này
    const [activeMembers] = await pool.query(
      `SELECT COUNT(DISTINCT ms.id) as active_count,
              GROUP_CONCAT(DISTINCT CONCAT(m.name, ' (', ms.pt_schedule, ')') SEPARATOR ', ') as members_list
       FROM Member_Subscriptions ms
       INNER JOIN Members m ON ms.memberId = m.id
       WHERE ms.trainerId = ?
         AND ms.status = 'Active'
         AND ms.endDate >= NOW()
         AND m.gymId = ?`,
      [trainerId, gymId]
    );

    const activeCount = parseInt(activeMembers[0]?.active_count || 0);
    const membersList = activeMembers[0]?.members_list || '';

    if (activeCount > 0) {
      // PT có member active → tạo expense
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
          parseFloat(trainer.salary),
          new Date(),
          'Pending',
          trainer.id,
          trainer.name,
          `Tu dong tinh lai theo lich HLV thuc te. Hoi vien: ${membersList}`,
          gymId,
          'System Auto'
        ]
      );
      console.log(`✅ Recalculated PT salary: ${trainer.salary} VND for trainer ${trainer.name} (${activeCount} members)`);
    } else {
      console.log(`⏭️  Skipped PT ${trainer.name} - no active members`);
    }
  } catch (error) {
    console.error(`❌ Error recalculating PT salary for trainer ${trainerId}:`, error);
    // Không throw error, chỉ log
  }
};

module.exports = {
  recalculatePTSalaryForTrainer,
};

