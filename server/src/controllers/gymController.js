const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { validateRequiredFields } = require('../utils/validation');

const selectableColumns = [
  'id',
  'email',
  'userName',
  'password',
  'profilePic',
  'gymName',
  'resetPasswordToken',
  'resetPasswordExpires',
  'createdAt',
  'updatedAt',
];

const buildUpdateQuery = (payload) => {
  const allowedFields = [
    'email',
    'userName',
    'password',
    'profilePic',
    'gymName',
    'resetPasswordToken',
    'resetPasswordExpires',
  ];

  const entries = Object.entries(payload).filter(([field, value]) => allowedFields.includes(field) && value !== undefined);

  return entries;
};

exports.getGyms = asyncHandler(async (req, res) => {
  const [gyms] = await pool.query(`SELECT ${selectableColumns.join(', ')} FROM Gyms`);
  res.json(gyms);
});

exports.getGymById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [gyms] = await pool.query(`SELECT ${selectableColumns.join(', ')} FROM Gyms WHERE id = ?`, [id]);

  if (gyms.length === 0) {
    return res.status(404).json({ message: 'Không tìm thấy phòng tập' });
  }

  return res.json(gyms[0]);
});

exports.createGym = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['email', 'userName', 'password', 'gymName']);

  const {
    email,
    userName,
    password,
    profilePic = null,
    gymName,
    resetPasswordToken = null,
    resetPasswordExpires = null,
  } = req.body;

  const [result] = await pool.execute(
    `INSERT INTO Gyms (email, userName, password, profilePic, gymName, resetPasswordToken, resetPasswordExpires)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [email, userName, password, profilePic, gymName, resetPasswordToken, resetPasswordExpires]
  );

  const [gyms] = await pool.query(`SELECT ${selectableColumns.join(', ')} FROM Gyms WHERE id = ?`, [result.insertId]);

  res.status(201).json(gyms[0]);
});

exports.updateGym = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const entries = buildUpdateQuery(req.body);

  if (entries.length === 0) {
    return res.status(400).json({ message: 'No updatable fields provided' });
  }

  const sets = entries.map(([field]) => `${field} = ?`);
  sets.push('updatedAt = NOW()');
  const values = entries.map(([, value]) => (value === '' ? null : value));
  values.push(id);

  const [result] = await pool.execute(`UPDATE Gyms SET ${sets.join(', ')} WHERE id = ?`, values);

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Không tìm thấy phòng tập' });
  }

  const [gyms] = await pool.query(`SELECT ${selectableColumns.join(', ')} FROM Gyms WHERE id = ?`, [id]);
  res.json(gyms[0]);
});

exports.deleteGym = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [result] = await pool.execute('DELETE FROM Gyms WHERE id = ?', [id]);

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Không tìm thấy phòng tập' });
  }

  res.status(204).send();
});

