const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { validateRequiredFields } = require('../utils/validation');

const selectableColumns = ['id', 'name', 'mobileNo', 'sex', 'degree', 'profilePic', 'salary', 'status', 'joinedAt', 'gymId'];

const buildUpdateQuery = (payload) => {
  const allowedFields = ['name', 'mobileNo', 'sex', 'degree', 'profilePic', 'salary', 'status', 'gymId'];
  return Object.entries(payload).filter(([field, value]) => allowedFields.includes(field) && value !== undefined);
};

exports.getTrainers = asyncHandler(async (req, res) => {
  const { gymId } = req.query;
  const whereClause = gymId ? 'WHERE gymId = ?' : '';
  const params = gymId ? [gymId] : [];

  const [trainers] = await pool.query(
    `SELECT ${selectableColumns.join(', ')} FROM Trainers ${whereClause} ORDER BY name ASC`,
    params
  );

  res.json(trainers);
});

exports.getTrainerById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [trainers] = await pool.query(`SELECT ${selectableColumns.join(', ')} FROM Trainers WHERE id = ?`, [id]);

  if (trainers.length === 0) {
    return res.status(404).json({ message: 'Trainer not found' });
  }

  return res.json(trainers[0]);
});

exports.createTrainer = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['name', 'mobileNo', 'gymId']);

  const { 
    name, 
    mobileNo, 
    sex = null, 
    degree = null, 
    profilePic = null,
    salary = null,
    status = 'Active',
    gymId 
  } = req.body;

  // Handle file upload if exists
  const avatarPath = req.file ? `/uploads/avatars/${req.file.filename}` : profilePic;

  const [result] = await pool.execute(
    `INSERT INTO Trainers (name, mobileNo, sex, degree, profilePic, salary, status, gymId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, mobileNo, sex, degree, avatarPath, salary, status, gymId]
  );

  const [trainers] = await pool.query(`SELECT ${selectableColumns.join(', ')} FROM Trainers WHERE id = ?`, [
    result.insertId,
  ]);

  res.status(201).json(trainers[0]);
});

exports.updateTrainer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Handle file upload if exists
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

  const [result] = await pool.execute(`UPDATE Trainers SET ${sets.join(', ')} WHERE id = ?`, values);

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Trainer not found' });
  }

  const [trainers] = await pool.query(`SELECT ${selectableColumns.join(', ')} FROM Trainers WHERE id = ?`, [id]);
  res.json(trainers[0]);
});

exports.deleteTrainer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [result] = await pool.execute('DELETE FROM Trainers WHERE id = ?', [id]);

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Trainer not found' });
  }

  res.status(204).send();
});

