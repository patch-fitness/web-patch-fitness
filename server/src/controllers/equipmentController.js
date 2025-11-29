const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { validateRequiredFields } = require('../utils/validation');

const selectableColumns = [
  'id',
  'name',
  'category',
  'location',
  'status',
  'condition',
  'image',
  'description',
  'purchase_price',
  'purchase_date',
  'maintenance_date',
  'maintenance_cost',
  'monthly_maintenance_cost',
  'gymId',
];

const buildUpdateQuery = (payload) => {
  const allowedFields = [
    'name',
    'category',
    'location',
    'status',
    'condition',
    'image',
    'description',
    'purchase_price',
    'purchase_date',
    'maintenance_date',
    'maintenance_cost',
    'monthly_maintenance_cost',
    'gymId',
  ];
  return Object.entries(payload).filter(([field, value]) => allowedFields.includes(field) && value !== undefined);
};

exports.getEquipment = asyncHandler(async (req, res) => {
  const { gymId } = req.query;
  const whereClause = gymId ? 'WHERE gymId = ?' : '';
  const params = gymId ? [gymId] : [];

  const [equipment] = await pool.query(
    `SELECT 
      id,
      name,
      category,
      location,
      status,
      \`condition\`,
      image,
      description,
      purchase_price as purchasePrice,
      purchase_date as purchaseDate,
      maintenance_date as maintenanceDate,
      maintenance_cost as maintenanceCost,
      monthly_maintenance_cost as monthlyMaintenanceCost,
      gymId
    FROM Equipment ${whereClause} ORDER BY purchase_date DESC`,
    params
  );

  res.json(equipment);
});

exports.getEquipmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [equipment] = await pool.query(
    `SELECT 
      id,
      name,
      category,
      location,
      status,
      \`condition\`,
      image,
      description,
      purchase_price as purchasePrice,
      purchase_date as purchaseDate,
      maintenance_date as maintenanceDate,
      maintenance_cost as maintenanceCost,
      monthly_maintenance_cost as monthlyMaintenanceCost,
      gymId
    FROM Equipment WHERE id = ?`,
    [id]
  );

  if (equipment.length === 0) {
    return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
  }

  return res.json(equipment[0]);
});

exports.createEquipment = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['name', 'gymId']);

  const {
    name,
    category = null,
    location = null,
    status = 'Available',
    condition = 'Good',
    image = null,
    description = null,
    purchase_price = null,
    purchasePrice = null,
    purchase_date = null,
    purchaseDate = null,
    maintenance_date = null,
    maintenanceDate = null,
    maintenance_cost = 0,
    maintenanceCost = 0,
    monthly_maintenance_cost = 0,
    monthlyMaintenanceCost = 0,
    gymId,
  } = req.body;

  // Handle file upload if exists (giống trainer)
  const imagePath = req.file ? `/uploads/avatars/${req.file.filename}` : image;

  // Support both snake_case and camelCase from frontend
  const finalPurchasePrice = purchase_price || purchasePrice;
  const finalPurchaseDate = purchase_date || purchaseDate;
  const finalMaintenanceDate = maintenance_date || maintenanceDate;
  const finalMaintenanceCost = maintenance_cost || maintenanceCost;
  const finalMonthlyMaintenanceCost = monthly_maintenance_cost || monthlyMaintenanceCost;

  const [result] = await pool.execute(
    `INSERT INTO Equipment (
      name, category, location, status, \`condition\`, image, description,
      purchase_price, purchase_date, maintenance_date, maintenance_cost, monthly_maintenance_cost, gymId
    )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      category,
      location,
      status,
      condition,
      imagePath,
      description,
      finalPurchasePrice,
      finalPurchaseDate,
      finalMaintenanceDate,
      finalMaintenanceCost,
      finalMonthlyMaintenanceCost,
      gymId,
    ]
  );

  const equipmentId = result.insertId;
  console.log(`✓ Created equipment ID: ${equipmentId}`);

  // Tự động tạo expense cho chi phí mua thiết bị (nếu có purchase_price)
  if (finalPurchasePrice && parseFloat(finalPurchasePrice) > 0) {
    const purchaseExpenseCode = `EXP${Date.now()}${Math.floor(Math.random() * 1000)}`;
    await pool.execute(
      `INSERT INTO Expenses 
      (transaction_code, expense_type, category, description, amount, expense_date,
       payment_status, equipment_id, notes, gymId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        purchaseExpenseCode,
        'Equipment',
        'Mua thiet bi',
        `Chi phi mua thiet bi: ${name}`,
        finalPurchasePrice,
        finalPurchaseDate || new Date(),
        'Paid',
        equipmentId,
        'Tu dong tao khi mua thiet bi moi',
        gymId
      ]
    );
    console.log(`✓ Created purchase expense: ${finalPurchasePrice} VND`);
  }

  // Tự động tạo expense cho chi phí bảo trì hàng tháng (nếu có)
  if (finalMonthlyMaintenanceCost && parseFloat(finalMonthlyMaintenanceCost) > 0) {
    const maintenanceExpenseCode = `EXP${Date.now() + 1}${Math.floor(Math.random() * 1000)}`;
    await pool.execute(
      `INSERT INTO Expenses 
      (transaction_code, expense_type, category, description, amount, expense_date,
       payment_status, equipment_id, notes, gymId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        maintenanceExpenseCode,
        'Maintenance',
        'Bao tri hang thang',
        `Chi phi bao tri hang thang: ${name}`,
        finalMonthlyMaintenanceCost,
        new Date(),
        'Pending',
        equipmentId,
        'Tu dong tao chi phi bao tri hang thang',
        gymId
      ]
    );
    console.log(`✓ Created monthly maintenance expense: ${finalMonthlyMaintenanceCost} VND/month`);
  }

  const [equipment] = await pool.query(
    `SELECT 
      id,
      name,
      category,
      location,
      status,
      \`condition\`,
      image,
      description,
      purchase_price as purchasePrice,
      purchase_date as purchaseDate,
      maintenance_date as maintenanceDate,
      maintenance_cost as maintenanceCost,
      monthly_maintenance_cost as monthlyMaintenanceCost,
      gymId
    FROM Equipment WHERE id = ?`,
    [equipmentId]
  );

  res.status(201).json(equipment[0]);
});

exports.updateEquipment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Handle file upload if exists (giống trainer)
  if (req.file) {
    req.body.image = `/uploads/avatars/${req.file.filename}`;
  }
  
  // Map camelCase to snake_case for database
  const fieldMapping = {
    purchasePrice: 'purchase_price',
    purchaseDate: 'purchase_date',
    maintenanceDate: 'maintenance_date',
    maintenanceCost: 'maintenance_cost',
    monthlyMaintenanceCost: 'monthly_maintenance_cost',
  };

  const mappedBody = {};
  Object.entries(req.body).forEach(([key, value]) => {
    const dbField = fieldMapping[key] || key;
    mappedBody[dbField] = value;
  });

  const entries = buildUpdateQuery(mappedBody);

  if (entries.length === 0) {
    return res.status(400).json({ message: 'No updatable fields provided' });
  }

  const sets = entries.map(([field]) => {
    // Use backticks for reserved keywords
    const fieldName = field === 'condition' ? '`condition`' : field;
    return `${fieldName} = ?`;
  });
  const values = entries.map(([, value]) => (value === '' ? null : value));
  values.push(id);

  // Lấy giá cũ trước khi update
  const [oldEquipment] = await pool.query(
    'SELECT purchase_price, monthly_maintenance_cost, name, gymId FROM Equipment WHERE id = ?',
    [id]
  );

  if (oldEquipment.length === 0) {
    return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
  }

  const oldPurchasePrice = parseFloat(oldEquipment[0].purchase_price) || 0;
  const oldMonthlyMaintenanceCost = parseFloat(oldEquipment[0].monthly_maintenance_cost) || 0;
  const equipmentName = oldEquipment[0].name;
  const equipmentGymId = oldEquipment[0].gymId;

  // Lấy giá mới từ request body (nếu có) trước khi update
  const newPurchasePriceFromBody = req.body.purchasePrice !== undefined 
    ? parseFloat(req.body.purchasePrice) 
    : (mappedBody.purchase_price !== undefined ? parseFloat(mappedBody.purchase_price) : null);
  
  const newMonthlyMaintenanceCostFromBody = req.body.monthlyMaintenanceCost !== undefined
    ? parseFloat(req.body.monthlyMaintenanceCost)
    : (mappedBody.monthly_maintenance_cost !== undefined ? parseFloat(mappedBody.monthly_maintenance_cost) : null);

  console.log(`📝 Updating equipment ${id}:`);
  console.log(`   Old purchase price: ${oldPurchasePrice}`);
  console.log(`   New purchase price from body: ${newPurchasePriceFromBody}`);

  // Update equipment
  const [result] = await pool.execute(`UPDATE Equipment SET ${sets.join(', ')} WHERE id = ?`, values);

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
  }

  // Lấy giá mới sau khi update từ database
  const [updatedEquipment] = await pool.query(
    `SELECT 
      id,
      name,
      category,
      location,
      status,
      \`condition\`,
      image,
      description,
      purchase_price as purchasePrice,
      purchase_date as purchaseDate,
      maintenance_date as maintenanceDate,
      maintenance_cost as maintenanceCost,
      monthly_maintenance_cost as monthlyMaintenanceCost,
      gymId
    FROM Equipment WHERE id = ?`,
    [id]
  );
  
  // Ưu tiên giá từ database (đã được update)
  const newPurchasePrice = parseFloat(updatedEquipment[0].purchasePrice) || 0;
  const newMonthlyMaintenanceCost = parseFloat(updatedEquipment[0].monthlyMaintenanceCost) || 0;

  console.log(`   New purchase price from DB: ${newPurchasePrice}`);

  // Cập nhật expense nếu purchase_price thay đổi
  // So sánh giá cũ và giá mới từ database
  const purchasePriceChanged = oldPurchasePrice !== newPurchasePrice && newPurchasePrice > 0;

  if (purchasePriceChanged) {
    console.log(`🔄 Purchase price changed for equipment ${id}: ${oldPurchasePrice} → ${newPurchasePrice}`);
    
    // Tìm expense mua thiết bị - thử tìm theo equipment_id trước
    let [purchaseExpenses] = await pool.query(
      `SELECT id, amount, description FROM Expenses 
       WHERE equipment_id = ? 
         AND expense_type = 'Equipment' 
         AND category = 'Mua thiet bi'
       ORDER BY created_at DESC LIMIT 1`,
      [id]
    );

    // Nếu không tìm thấy, thử tìm theo description (fallback)
    if (purchaseExpenses.length === 0) {
      console.log(`⚠️  No expense found by equipment_id, trying description...`);
      [purchaseExpenses] = await pool.query(
        `SELECT id, amount, description FROM Expenses 
         WHERE expense_type = 'Equipment' 
           AND category = 'Mua thiet bi'
           AND description LIKE ?
         ORDER BY created_at DESC LIMIT 1`,
        [`%${equipmentName}%`]
      );
    }

    console.log(`Found ${purchaseExpenses.length} purchase expense(s) for equipment ${id}`);

    if (purchaseExpenses.length > 0) {
      // Update expense amount
      const expenseId = purchaseExpenses[0].id;
      await pool.execute(
        'UPDATE Expenses SET amount = ?, description = ? WHERE id = ?',
        [
          newPurchasePrice,
          `Chi phi mua thiet bi: ${equipmentName}`,
          expenseId
        ]
      );
      console.log(`✅ Updated purchase expense ID ${expenseId}: ${oldPurchasePrice} → ${newPurchasePrice} VND`);
    } else if (newPurchasePrice > 0) {
      // Nếu chưa có expense, tạo mới
      const expenseCode = `EXP${Date.now()}${Math.floor(Math.random() * 1000)}`;
      await pool.execute(
        `INSERT INTO Expenses 
        (transaction_code, expense_type, category, description, amount, expense_date,
         payment_status, equipment_id, notes, gymId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          expenseCode,
          'Equipment',
          'Mua thiet bi',
          `Chi phi mua thiet bi: ${equipmentName}`,
          newPurchasePrice,
          updatedEquipment[0].purchaseDate || new Date(),
          'Paid',
          id,
          'Tu dong tao khi cap nhat gia thiet bi',
          equipmentGymId
        ]
      );
      console.log(`✓ Created purchase expense: ${newPurchasePrice} VND`);
    }
  }

  // Cập nhật expense nếu monthly_maintenance_cost thay đổi
  const maintenanceCostChanged = oldMonthlyMaintenanceCost !== newMonthlyMaintenanceCost;

  if (maintenanceCostChanged) {
    console.log(`🔄 Maintenance cost changed for equipment ${id}: ${oldMonthlyMaintenanceCost} → ${newMonthlyMaintenanceCost}`);
    
    // Tìm expense bảo trì hàng tháng - thử tìm theo equipment_id trước
    let [maintenanceExpenses] = await pool.query(
      `SELECT id, amount, description FROM Expenses 
       WHERE equipment_id = ? 
         AND expense_type = 'Maintenance' 
         AND category = 'Bao tri hang thang'
       ORDER BY created_at DESC LIMIT 1`,
      [id]
    );

    // Nếu không tìm thấy, thử tìm theo description (fallback)
    if (maintenanceExpenses.length === 0) {
      console.log(`⚠️  No maintenance expense found by equipment_id, trying description...`);
      [maintenanceExpenses] = await pool.query(
        `SELECT id, amount, description FROM Expenses 
         WHERE expense_type = 'Maintenance' 
           AND category = 'Bao tri hang thang'
           AND description LIKE ?
         ORDER BY created_at DESC LIMIT 1`,
        [`%${equipmentName}%`]
      );
    }

    console.log(`Found ${maintenanceExpenses.length} maintenance expense(s) for equipment ${id}`);

    if (maintenanceExpenses.length > 0) {
      // Update expense amount
      const expenseId = maintenanceExpenses[0].id;
      await pool.execute(
        'UPDATE Expenses SET amount = ?, description = ? WHERE id = ?',
        [
          newMonthlyMaintenanceCost,
          `Chi phi bao tri hang thang: ${equipmentName}`,
          expenseId
        ]
      );
      console.log(`✅ Updated maintenance expense ID ${expenseId}: ${oldMonthlyMaintenanceCost} → ${newMonthlyMaintenanceCost} VND`);
    } else if (newMonthlyMaintenanceCost > 0) {
      // Nếu chưa có expense, tạo mới
      const expenseCode = `EXP${Date.now() + 1}${Math.floor(Math.random() * 1000)}`;
      await pool.execute(
        `INSERT INTO Expenses 
        (transaction_code, expense_type, category, description, amount, expense_date,
         payment_status, equipment_id, notes, gymId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          expenseCode,
          'Maintenance',
          'Bao tri hang thang',
          `Chi phi bao tri hang thang: ${equipmentName}`,
          newMonthlyMaintenanceCost,
          new Date(),
          'Pending',
          id,
          'Tu dong tao khi cap nhat chi phi bao tri',
          equipmentGymId
        ]
      );
      console.log(`✓ Created maintenance expense: ${newMonthlyMaintenanceCost} VND/month`);
    }
  }
  
  res.json(updatedEquipment[0]);
});

exports.deleteEquipment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log(`🗑️  Deleting equipment ID: ${id}`);

  // 1. Kiểm tra equipment có tồn tại không
  const [equipment] = await pool.query('SELECT name FROM Equipment WHERE id = ?', [id]);
  
  if (equipment.length === 0) {
    return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
  }

  // 2. Xóa expenses liên quan đến equipment này
  const [expenseResult] = await pool.execute(
    'DELETE FROM Expenses WHERE equipment_id = ?',
    [id]
  );
  console.log(`✓ Deleted ${expenseResult.affectedRows} expenses for equipment ${id}`);

  // 3. Xóa equipment
  const [result] = await pool.execute('DELETE FROM Equipment WHERE id = ?', [id]);

  console.log(`✅ Đã xóa thiết bị ${id} và tất cả chi phí liên quan thành công`);
  res.status(204).send();
});

