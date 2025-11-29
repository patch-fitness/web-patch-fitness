const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get available trainers for a specific schedule type
 * A trainer can only have:
 * - 1 active member on schedule '2-4-6'
 * - 1 active member on schedule '3-5-7'
 * Total maximum: 2 active members (one on each schedule)
 */
exports.getAvailableTrainers = asyncHandler(async (req, res) => {
  const { scheduleType, gymId } = req.query;

  // Validate schedule type
  if (!scheduleType || !['2-4-6', '3-5-7'].includes(scheduleType)) {
    return res.status(400).json({ 
      message: 'Invalid schedule type. Must be "2-4-6" or "3-5-7"' 
    });
  }

  if (!gymId) {
    return res.status(400).json({ message: 'gymId is required' });
  }

  // Get all trainers in the gym
  const [allTrainers] = await pool.query(
    'SELECT id, name, mobileNo, degree FROM Trainers WHERE gymId = ? ORDER BY name ASC',
    [gymId]
  );

  // Get trainers who are already assigned to this schedule type with active status
  const [occupiedTrainers] = await pool.query(
    `SELECT DISTINCT trainerId 
     FROM Member_Subscriptions 
     WHERE pt_schedule = ? 
       AND status = 'Active' 
       AND trainerId IS NOT NULL
       AND endDate >= NOW()`,
    [scheduleType]
  );

  // Create a set of occupied trainer IDs for fast lookup
  const occupiedTrainerIds = new Set(occupiedTrainers.map(t => t.trainerId));

  // Filter out occupied trainers
  const availableTrainers = allTrainers.filter(trainer => !occupiedTrainerIds.has(trainer.id));

  // Also get count of current assignments for each available trainer
  const [trainerAssignments] = await pool.query(
    `SELECT 
      trainerId,
      pt_schedule,
      COUNT(*) as count
     FROM Member_Subscriptions
     WHERE status = 'Active' 
       AND trainerId IS NOT NULL
       AND endDate >= NOW()
       AND trainerId IN (?)
     GROUP BY trainerId, pt_schedule`,
    [availableTrainers.length > 0 ? availableTrainers.map(t => t.id) : [0]]
  );

  // Add assignment info to each trainer
  const trainersWithInfo = availableTrainers.map(trainer => {
    const assignments = trainerAssignments.filter(a => a.trainerId === trainer.id);
    const schedule246 = assignments.find(a => a.pt_schedule === '2-4-6');
    const schedule357 = assignments.find(a => a.pt_schedule === '3-5-7');
    
    return {
      ...trainer,
      currentAssignments: {
        schedule_246: schedule246 ? schedule246.count : 0,
        schedule_357: schedule357 ? schedule357.count : 0,
        total: assignments.reduce((sum, a) => sum + a.count, 0)
      },
      availableFor: scheduleType
    };
  });

  res.json({
    scheduleType,
    totalTrainers: allTrainers.length,
    occupiedTrainers: occupiedTrainers.length,
    availableTrainers: trainersWithInfo.length,
    trainers: trainersWithInfo
  });
});

/**
 * Get trainer schedule availability overview
 * Shows all trainers with their current assignments
 */
exports.getTrainerScheduleOverview = asyncHandler(async (req, res) => {
  const { gymId } = req.query;

  if (!gymId) {
    return res.status(400).json({ message: 'gymId is required' });
  }

  // Get all trainers
  const [trainers] = await pool.query(
    'SELECT id, name, mobileNo, degree, status FROM Trainers WHERE gymId = ? ORDER BY name ASC',
    [gymId]
  );

  // Get all active assignments with member details
  const [assignments] = await pool.query(
    `SELECT 
      ms.trainerId,
      ms.pt_schedule,
      ms.startDate,
      ms.endDate,
      m.id as memberId,
      m.name as memberName,
      mem.title as membershipTitle
     FROM Member_Subscriptions ms
     INNER JOIN Members m ON ms.memberId = m.id
     LEFT JOIN Memberships mem ON ms.membershipId = mem.id
     WHERE ms.status = 'Active' 
       AND ms.trainerId IS NOT NULL
       AND ms.endDate >= NOW()
       AND m.gymId = ?
     ORDER BY ms.trainerId, ms.pt_schedule`,
    [gymId]
  );

  // Build overview for each trainer
  const overview = trainers.map(trainer => {
    const trainerAssignments = assignments.filter(a => a.trainerId === trainer.id);
    const schedule246 = trainerAssignments.filter(a => a.pt_schedule === '2-4-6');
    const schedule357 = trainerAssignments.filter(a => a.pt_schedule === '3-5-7');

    return {
      id: trainer.id,
      name: trainer.name,
      mobileNo: trainer.mobileNo,
      degree: trainer.degree,
      status: trainer.status,
      schedule_246: {
        occupied: schedule246.length > 0,
        member: schedule246[0] ? {
          id: schedule246[0].memberId,
          name: schedule246[0].memberName,
          membership: schedule246[0].membershipTitle,
          startDate: schedule246[0].startDate,
          endDate: schedule246[0].endDate
        } : null
      },
      schedule_357: {
        occupied: schedule357.length > 0,
        member: schedule357[0] ? {
          id: schedule357[0].memberId,
          name: schedule357[0].memberName,
          membership: schedule357[0].membershipTitle,
          startDate: schedule357[0].startDate,
          endDate: schedule357[0].endDate
        } : null
      },
      totalActiveMembers: trainerAssignments.length,
      availableSlots: 2 - trainerAssignments.length
    };
  });

  res.json({
    gymId: parseInt(gymId),
    totalTrainers: trainers.length,
    trainers: overview
  });
});

/**
 * Auto-expire subscriptions that have passed their end date
 * This should be called periodically (e.g., daily cron job)
 */
exports.autoExpireSubscriptions = asyncHandler(async (req, res) => {
  const [result] = await pool.execute(
    `UPDATE Member_Subscriptions 
     SET status = 'Expired' 
     WHERE status = 'Active' 
       AND endDate < NOW()`,
    []
  );

  res.json({
    message: 'Auto-expire completed',
    expiredCount: result.affectedRows,
    timestamp: new Date().toISOString()
  });
});

