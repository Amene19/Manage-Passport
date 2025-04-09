-- Create the database
CREATE DATABASE IF NOT EXISTS passport_processing;
USE passport_processing;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100),
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'worker', 'user') NOT NULL DEFAULT 'worker',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Missing Requirements table
CREATE TABLE IF NOT EXISTS missing_requirements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requirement_type VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Passports table
CREATE TABLE IF NOT EXISTS passports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  passport_id VARCHAR(50) NOT NULL UNIQUE,
  scan_type ENUM('Inscan', 'Outscan') NOT NULL,
  status ENUM('Processing', 'Completed', 'Rejected', 'pending', 'processed') NOT NULL DEFAULT 'Processing',
  processed_by INT,
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Passport Categories junction table
CREATE TABLE IF NOT EXISTS passport_categories (
  passport_id INT NOT NULL,
  category_id INT NOT NULL,
  PRIMARY KEY (passport_id, category_id),
  FOREIGN KEY (passport_id) REFERENCES passports(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Passport Missing Requirements junction table
CREATE TABLE IF NOT EXISTS passport_missing_requirements (
  passport_id INT NOT NULL,
  requirement_id INT NOT NULL,
  PRIMARY KEY (passport_id, requirement_id),
  FOREIGN KEY (passport_id) REFERENCES passports(id) ON DELETE CASCADE,
  FOREIGN KEY (requirement_id) REFERENCES missing_requirements(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_passports_status ON passports(status);
CREATE INDEX idx_passports_scan_type ON passports(scan_type);
CREATE INDEX idx_passports_processed_by ON passports(processed_by);
CREATE INDEX idx_users_role ON users(role);