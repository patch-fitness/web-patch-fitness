const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { validateRequiredFields } = require('../utils/validation');

const baseSelect = `
  t.id,
  t.amount,
  t.description,
  t.transaction_date,
  t.category,
  t.subscriptionId,
  t.gymId,
  ms.memberId,
  m.name AS memberName,
  mem.title AS membershipTitle
`;

const buildConditions = (query) => {
  const { gymId, category, startDate, endDate } = query;
  const conditions = [];
  const params = [];

  if (gymId) {
    conditions.push('t.gymId = ?');
    params.push(gymId);
  }

  if (category) {
    conditions.push('t.category = ?');
    params.push(category);
  }

  if (startDate) {
    conditions.push('t.transaction_date >= ?');
    params.push(startDate);
  }

  if (endDate) {
    conditions.push('t.transaction_date <= ?');
    params.push(endDate);
  }

  return { conditions, params };
};

const fetchTransactions = async (conditions, params) => {
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [transactions] = await pool.query(
    `
    SELECT ${baseSelect}
    FROM Transactions t
    LEFT JOIN Member_Subscriptions ms ON t.subscriptionId = ms.id
    LEFT JOIN Members m ON ms.memberId = m.id
    LEFT JOIN Memberships mem ON ms.membershipId = mem.id
    ${whereClause}
    ORDER BY t.transaction_date DESC
    `,
    params
  );

  return transactions;
};

exports.getTransactions = asyncHandler(async (req, res) => {
  const { conditions, params } = buildConditions(req.query);
  const transactions = await fetchTransactions(conditions, params);
  
  // Format for frontend Finance component (bill, income, expense, profit)
  const formattedTransactions = transactions.map(t => {
    const isIncome = t.amount > 0;
    return {
      id: t.id,
      bill: t.description || `Transaction #${t.id}`,
      income: isIncome ? t.amount : 0,
      expense: isIncome ? 0 : Math.abs(t.amount),
      profit: t.amount,
      transaction_date: t.transaction_date,
      category: t.category,
      memberName: t.memberName,
      membershipTitle: t.membershipTitle,
    };
  });
  
  res.json(formattedTransactions);
});

exports.getTransactionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const transactions = await fetchTransactions(['t.id = ?'], [id]);

  if (transactions.length === 0) {
    return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
  }

  const t = transactions[0];
  const isIncome = t.amount > 0;
  const formatted = {
    id: t.id,
    bill: t.description || `Transaction #${t.id}`,
    income: isIncome ? t.amount : 0,
    expense: isIncome ? 0 : Math.abs(t.amount),
    profit: t.amount,
    transaction_date: t.transaction_date,
    category: t.category,
    memberName: t.memberName,
    membershipTitle: t.membershipTitle,
  };

  return res.json(formatted);
});

exports.createTransaction = asyncHandler(async (req, res) => {
  // Support both old format (amount, category) and new format (income, expense, bill)
  const { 
    amount, 
    income, 
    expense, 
    bill, 
    description = null, 
    transaction_date = null, 
    category = 'Other', 
    subscriptionId = null, 
    gymId 
  } = req.body;

  // Calculate amount from income/expense if provided
  let finalAmount = amount;
  let finalDescription = description || bill;
  
  if (income !== undefined || expense !== undefined) {
    finalAmount = (income || 0) - (expense || 0);
    if (!finalDescription && bill) {
      finalDescription = bill;
    }
  }

  if (finalAmount === undefined || finalAmount === null) {
    return res.status(400).json({ message: 'Amount, or income/expense must be provided' });
  }

  if (!gymId) {
    return res.status(400).json({ message: 'gymId is required' });
  }

  const [result] = await pool.execute(
    `
    INSERT INTO Transactions (amount, description, transaction_date, category, subscriptionId, gymId)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [finalAmount, finalDescription, transaction_date, category, subscriptionId, gymId]
  );

  const transactions = await fetchTransactions(['t.id = ?'], [result.insertId]);
  
  // Format response for frontend
  const t = transactions[0];
  const isIncome = t.amount > 0;
  const formatted = {
    id: t.id,
    bill: t.description || `Transaction #${t.id}`,
    income: isIncome ? t.amount : 0,
    expense: isIncome ? 0 : Math.abs(t.amount),
    profit: t.amount,
    transaction_date: t.transaction_date,
    category: t.category,
    memberName: t.memberName,
    membershipTitle: t.membershipTitle,
  };

  res.status(201).json(formatted);
});

exports.updateTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const allowedFields = ['amount', 'description', 'transaction_date', 'category', 'subscriptionId', 'gymId'];

  const entries = Object.entries(req.body).filter(
    ([field, value]) => allowedFields.includes(field) && value !== undefined
  );

  if (entries.length === 0) {
    return res.status(400).json({ message: 'No updatable fields provided' });
  }

  const sets = entries.map(([field]) => `${field} = ?`);
  const values = entries.map(([, value]) => (value === '' ? null : value));
  values.push(id);

  const [result] = await pool.execute(`UPDATE Transactions SET ${sets.join(', ')} WHERE id = ?`, values);

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
  }

  const transactions = await fetchTransactions(['t.id = ?'], [id]);
  res.json(transactions[0]);
});

exports.deleteTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [result] = await pool.execute('DELETE FROM Transactions WHERE id = ?', [id]);

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
  }

  res.status(204).send();
});

