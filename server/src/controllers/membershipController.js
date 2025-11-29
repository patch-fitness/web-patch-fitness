const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { validateRequiredFields } = require('../utils/validation');

const selectableColumns = [
  'id',
  'title',
  'name',
  'price',
  'package_type',
  'duration_in_months',
  'gymId',
  'trainer_id',
  'schedule',
  'has_trainer',
];

const buildUpdateQuery = (payload) => {
  const allowedFields = ['title', 'name', 'price', 'package_type', 'duration_in_months', 'gymId', 'trainer_id', 'schedule', 'has_trainer'];
  return Object.entries(payload).filter(([field, value]) => allowedFields.includes(field) && value !== undefined);
};

exports.getMemberships = asyncHandler(async (req, res) => {
  const { gymId } = req.query;
  const whereClause = gymId ? 'WHERE m.gymId = ?' : '';
  const params = gymId ? [gymId] : [];

  try {
    // Try to select with trainer_id, schedule, and has_trainer
    const [memberships] = await pool.query(
      `SELECT 
        m.id,
        COALESCE(m.name, m.title) as name,
        m.title,
        m.price,
        m.package_type,
        m.duration_in_months as months,
        m.duration_in_months,
        m.gymId,
        m.trainer_id,
        m.schedule,
        m.has_trainer,
        t.name as trainer_name,
        t.mobileNo as trainer_mobileNo,
        t.sex as trainer_sex,
        t.degree as trainer_degree
      FROM Memberships m
      LEFT JOIN Trainers t ON m.trainer_id = t.id
      ${whereClause} ORDER BY m.price ASC`,
      params
    );

    console.log('✓ getMemberships - Success, returning', memberships.length, 'items');
    console.log('Sample item:', memberships[0]);
    res.json(memberships);
  } catch (error) {
    console.error('❌ getMemberships - Error:', error.code, error.message);
    // Fallback: if columns don't exist, select without them
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.log('⚠️  Falling back to query without new columns');
      const [memberships] = await pool.query(
        `SELECT 
          m.id,
          COALESCE(m.name, m.title) as name,
          m.title,
          m.price,
          m.package_type,
          m.duration_in_months as months,
          m.duration_in_months,
          m.gymId,
          NULL as trainer_id,
          NULL as schedule,
          0 as has_trainer,
          NULL as trainer_name,
          NULL as trainer_mobileNo,
          NULL as trainer_sex,
          NULL as trainer_degree
        FROM Memberships m
        ${whereClause} ORDER BY m.price ASC`,
        params
      );

      res.json(memberships);
    } else {
      throw error;
    }
  }
});

exports.getMembershipById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const [memberships] = await pool.query(
      `SELECT 
        m.id,
        m.title,
        m.name,
        m.price,
        m.package_type,
        m.duration_in_months,
        m.gymId,
        m.trainer_id,
        m.schedule,
        m.has_trainer,
        t.name as trainer_name,
        t.mobileNo as trainer_mobileNo,
        t.sex as trainer_sex,
        t.degree as trainer_degree
      FROM Memberships m
      LEFT JOIN Trainers t ON m.trainer_id = t.id
      WHERE m.id = ?`,
      [id]
    );

    if (memberships.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy gói tập' });
    }

    return res.json(memberships[0]);
  } catch (error) {
    // Fallback: if columns don't exist
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      const [memberships] = await pool.query(
        `SELECT 
          id,
          title,
          name,
          price,
          package_type,
          duration_in_months,
          gymId,
          NULL as trainer_id,
          NULL as schedule,
          NULL as trainer_name,
          NULL as trainer_mobileNo,
          NULL as trainer_sex,
          NULL as trainer_degree
        FROM Memberships
        WHERE id = ?`,
        [id]
      );

      if (memberships.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy gói tập' });
      }

      return res.json(memberships[0]);
    } else {
      throw error;
    }
  }
});

exports.createMembership = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['price', 'duration_in_months', 'gymId']);

  const { 
    title, 
    name, 
    price, 
    package_type = 'Normal', 
    duration_in_months, 
    months, 
    gymId,
    trainer_id,
    schedule,
    has_trainer
  } = req.body;
  
  // Validate schedule format if provided
  if (schedule && schedule !== '2-4-6' && schedule !== '3-5-7') {
    return res.status(400).json({ message: 'Schedule must be either "2-4-6" or "3-5-7"' });
  }

  // Support both title and name, and both duration_in_months and months
  const finalTitle = title || name || `Gói ${duration_in_months || months} tháng`;
  const finalName = name || title || finalTitle;
  const finalDuration = duration_in_months || months;

  // Check if trainer_id, schedule, and has_trainer columns exist by trying to insert
  // Convert boolean to 1/0 for MySQL TINYINT
  const hasTrainerValue = has_trainer === true || has_trainer === 1 || has_trainer === '1' ? 1 : 0;
  
  try {
    const [result] = await pool.execute(
      `INSERT INTO Memberships (title, name, price, package_type, duration_in_months, gymId, trainer_id, schedule, has_trainer)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [finalTitle, finalName, price, package_type, finalDuration, gymId, trainer_id || null, schedule || null, hasTrainerValue]
    );

    // Try to select with trainer info
    try {
      const [memberships] = await pool.query(
        `SELECT 
          m.id,
          COALESCE(m.name, m.title) as name,
          m.title,
          m.price,
          m.package_type,
          m.duration_in_months as months,
          m.gymId,
          m.trainer_id,
          m.schedule,
          m.has_trainer,
          t.name as trainer_name,
          t.mobileNo as trainer_mobileNo,
          t.sex as trainer_sex,
          t.degree as trainer_degree
        FROM Memberships m
        LEFT JOIN Trainers t ON m.trainer_id = t.id
        WHERE m.id = ?`,
        [result.insertId]
      );

      res.status(201).json(memberships[0]);
    } catch (selectError) {
      // Fallback: select without trainer columns
      if (selectError.code === 'ER_BAD_FIELD_ERROR') {
        const [memberships] = await pool.query(
          `SELECT 
            m.id,
            COALESCE(m.name, m.title) as name,
            m.title,
            m.price,
            m.package_type,
            m.duration_in_months as months,
            m.gymId,
            NULL as trainer_id,
            NULL as schedule,
            NULL as trainer_name,
            NULL as trainer_mobileNo,
            NULL as trainer_sex,
            NULL as trainer_degree
          FROM Memberships m
          WHERE m.id = ?`,
          [result.insertId]
        );

        res.status(201).json(memberships[0]);
      } else {
        throw selectError;
      }
    }
  } catch (insertError) {
    // If columns don't exist, insert without trainer_id and schedule
    if (insertError.code === 'ER_BAD_FIELD_ERROR') {
      const [result] = await pool.execute(
        `INSERT INTO Memberships (title, name, price, package_type, duration_in_months, gymId)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [finalTitle, finalName, price, package_type, finalDuration, gymId]
      );

      const [memberships] = await pool.query(
        `SELECT 
          id,
          COALESCE(name, title) as name,
          title,
          price,
          package_type,
          duration_in_months as months,
          gymId,
          NULL as trainer_id,
          NULL as schedule,
          NULL as trainer_name,
          NULL as trainer_mobileNo,
          NULL as trainer_sex,
          NULL as trainer_degree
        FROM Memberships WHERE id = ?`,
        [result.insertId]
      );

      res.status(201).json(memberships[0]);
    } else {
      throw insertError;
    }
  }
});

exports.updateMembership = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Filter out trainer_id and schedule if columns don't exist
  const entries = buildUpdateQuery(req.body).filter(([field]) => {
    // Only include trainer_id and schedule if they're provided and valid
    if (field === 'trainer_id' || field === 'schedule') {
      return true; // Let it try, will catch error if column doesn't exist
    }
    return true;
  });

  if (entries.length === 0) {
    return res.status(400).json({ message: 'No updatable fields provided' });
  }

  // Validate schedule if provided
  if (req.body.schedule && req.body.schedule !== '2-4-6' && req.body.schedule !== '3-5-7') {
    return res.status(400).json({ message: 'Schedule must be either "2-4-6" or "3-5-7"' });
  }

  const sets = entries.map(([field]) => `${field} = ?`);
  const values = entries.map(([, value]) => value);
  values.push(id);

  try {
    const [result] = await pool.execute(`UPDATE Memberships SET ${sets.join(', ')} WHERE id = ?`, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy gói tập' });
    }

    // Try to select with trainer info
    try {
      const [memberships] = await pool.query(
        `SELECT 
          m.id,
          m.title,
          m.name,
          m.price,
          m.package_type,
          m.duration_in_months,
          m.gymId,
          m.trainer_id,
          m.schedule,
          m.has_trainer,
          t.name as trainer_name,
          t.mobileNo as trainer_mobileNo,
          t.sex as trainer_sex,
          t.degree as trainer_degree
        FROM Memberships m
        LEFT JOIN Trainers t ON m.trainer_id = t.id
        WHERE m.id = ?`,
        [id]
      );
      res.json(memberships[0]);
    } catch (selectError) {
      // Fallback: select without trainer columns
      if (selectError.code === 'ER_BAD_FIELD_ERROR') {
        const [memberships] = await pool.query(
          `SELECT 
            id,
            title,
            name,
            price,
            package_type,
            duration_in_months,
            gymId,
            NULL as trainer_id,
            NULL as schedule,
            NULL as trainer_name,
            NULL as trainer_mobileNo,
            NULL as trainer_sex,
            NULL as trainer_degree
          FROM Memberships
          WHERE id = ?`,
          [id]
        );
        res.json(memberships[0]);
      } else {
        throw selectError;
      }
    }
  } catch (updateError) {
    // If columns don't exist, filter them out and try again
    if (updateError.code === 'ER_BAD_FIELD_ERROR') {
      const filteredEntries = entries.filter(([field]) => field !== 'trainer_id' && field !== 'schedule');
      
      if (filteredEntries.length === 0) {
        return res.status(400).json({ message: 'No updatable fields provided (trainer_id and schedule columns do not exist)' });
      }

      const sets = filteredEntries.map(([field]) => `${field} = ?`);
      const values = filteredEntries.map(([, value]) => value);
      values.push(id);

      const [result] = await pool.execute(`UPDATE Memberships SET ${sets.join(', ')} WHERE id = ?`, values);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Không tìm thấy gói tập' });
      }

      const [memberships] = await pool.query(
        `SELECT 
          id,
          title,
          name,
          price,
          package_type,
          duration_in_months,
          gymId,
          NULL as trainer_id,
          NULL as schedule,
          NULL as trainer_name,
          NULL as trainer_mobileNo,
          NULL as trainer_sex,
          NULL as trainer_degree
        FROM Memberships
        WHERE id = ?`,
        [id]
      );
      res.json(memberships[0]);
    } else {
      throw updateError;
    }
  }
});

exports.deleteMembership = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [result] = await pool.execute('DELETE FROM Memberships WHERE id = ?', [id]);

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Membership not found' });
  }

  res.status(204).send();
});

