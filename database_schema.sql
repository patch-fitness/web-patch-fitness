SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS PT_Commission_Settings;
DROP TABLE IF EXISTS Transactions;
DROP TABLE IF EXISTS Expenses;
DROP TABLE IF EXISTS Revenues;
DROP TABLE IF EXISTS Equipment;
DROP TABLE IF EXISTS Member_Subscriptions;
DROP TABLE IF EXISTS Members;
DROP TABLE IF EXISTS Memberships;
DROP TABLE IF EXISTS Trainers;
DROP TABLE IF EXISTS Gyms;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE Gyms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255),
  userName VARCHAR(255),
  password VARCHAR(255),
  profilePic VARCHAR(255),
  gymName VARCHAR(255),
  resetPasswordToken VARCHAR(255),
  resetPasswordExpires DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE Trainers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  mobileNo VARCHAR(20),
  sex VARCHAR(10),
  degree VARCHAR(255),
  profilePic VARCHAR(255),
  salary DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'Active',
  joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  gymId INT,
  FOREIGN KEY (gymId) REFERENCES Gyms(id) ON DELETE CASCADE
);

CREATE TABLE Memberships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  name VARCHAR(255),
  price DECIMAL(10, 2),
  package_type VARCHAR(50),
  duration_in_months INT,
  gymId INT,
  trainer_id INT,
  schedule VARCHAR(255),
  has_trainer TINYINT(1) DEFAULT 0,
  FOREIGN KEY (gymId) REFERENCES Gyms(id) ON DELETE CASCADE,
  FOREIGN KEY (trainer_id) REFERENCES Trainers(id) ON DELETE SET NULL
);

CREATE TABLE Members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  mobileNo VARCHAR(20),
  address TEXT,
  profilePic VARCHAR(255),
  joinDate DATETIME,
  status VARCHAR(50) DEFAULT 'Active',
  gymId INT,
  FOREIGN KEY (gymId) REFERENCES Gyms(id) ON DELETE CASCADE
);

CREATE TABLE Member_Subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  memberId INT,
  membershipId INT,
  trainerId INT,
  pt_schedule VARCHAR(255),
  startDate DATETIME,
  endDate DATETIME,
  status VARCHAR(50) DEFAULT 'Active',
  FOREIGN KEY (memberId) REFERENCES Members(id) ON DELETE CASCADE,
  FOREIGN KEY (membershipId) REFERENCES Memberships(id) ON DELETE CASCADE,
  FOREIGN KEY (trainerId) REFERENCES Trainers(id) ON DELETE SET NULL
);

CREATE TABLE Equipment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  category VARCHAR(100),
  location VARCHAR(255),
  status VARCHAR(50),
  `condition` VARCHAR(50),
  image VARCHAR(255),
  description TEXT,
  purchase_price DECIMAL(10, 2),
  purchase_date DATETIME,
  maintenance_date DATETIME,
  maintenance_cost DECIMAL(10, 2),
  monthly_maintenance_cost DECIMAL(10, 2),
  gymId INT,
  FOREIGN KEY (gymId) REFERENCES Gyms(id) ON DELETE CASCADE
);

CREATE TABLE Revenues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_code VARCHAR(50),
  member_id INT,
  member_name VARCHAR(255),
  membership_id INT,
  membership_name VARCHAR(255),
  amount DECIMAL(10, 2),
  payment_method VARCHAR(50),
  payment_date DATETIME,
  confirmed_by VARCHAR(255),
  notes TEXT,
  gymId INT,
  subscription_id INT,
  payment_status VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES Members(id) ON DELETE SET NULL,
  FOREIGN KEY (membership_id) REFERENCES Memberships(id) ON DELETE SET NULL,
  FOREIGN KEY (gymId) REFERENCES Gyms(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES Member_Subscriptions(id) ON DELETE SET NULL
);

CREATE TABLE Expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_code VARCHAR(50),
  expense_type VARCHAR(50),
  category VARCHAR(100),
  description TEXT,
  amount DECIMAL(10, 2),
  expense_date DATETIME,
  payment_status VARCHAR(50),
  payment_method VARCHAR(50),
  paid_date DATETIME,
  trainer_id INT,
  trainer_name VARCHAR(255),
  revenue_id INT,
  commission_rate DECIMAL(5, 2),
  equipment_id INT,
  notes TEXT,
  gymId INT,
  created_by VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (trainer_id) REFERENCES Trainers(id) ON DELETE SET NULL,
  FOREIGN KEY (revenue_id) REFERENCES Revenues(id) ON DELETE SET NULL,
  FOREIGN KEY (equipment_id) REFERENCES Equipment(id) ON DELETE SET NULL,
  FOREIGN KEY (gymId) REFERENCES Gyms(id) ON DELETE CASCADE
);

CREATE TABLE Transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  amount DECIMAL(10, 2),
  description TEXT,
  transaction_date DATETIME,
  category VARCHAR(100),
  subscriptionId INT,
  gymId INT,
  FOREIGN KEY (subscriptionId) REFERENCES Member_Subscriptions(id) ON DELETE SET NULL,
  FOREIGN KEY (gymId) REFERENCES Gyms(id) ON DELETE CASCADE
);

CREATE TABLE PT_Commission_Settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trainer_id INT,
  membership_id INT,
  commission_type VARCHAR(50),
  commission_value DECIMAL(10, 2),
  gymId INT,
  is_default TINYINT(1) DEFAULT 0,
  FOREIGN KEY (trainer_id) REFERENCES Trainers(id) ON DELETE CASCADE,
  FOREIGN KEY (membership_id) REFERENCES Memberships(id) ON DELETE CASCADE,
  FOREIGN KEY (gymId) REFERENCES Gyms(id) ON DELETE CASCADE
);
