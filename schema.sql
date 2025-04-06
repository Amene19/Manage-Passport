-- Create the database
CREATE DATABASE IF NOT EXISTS passport_processing;
USE passport_processing;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'worker') NOT NULL DEFAULT 'worker',
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
  scan_type ENUM('in', 'out') NOT NULL,
  status ENUM('pending', 'processed', 'rejected') NOT NULL DEFAULT 'pending',
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

-- Insert default categories
INSERT INTO categories (name, description) VALUES 
('Diplomatic', 'Diplomatic passports for government officials'),
('Service', 'Service passports for government employees'),
('Regular', 'Regular passports for citizens'),
('Emergency', 'Emergency temporary passports');

-- Insert default missing requirements
INSERT INTO missing_requirements (requirement_type, description) VALUES 
('Photo', 'Missing or improper photo'),
('Signature', 'Missing signature'),
('Application Form', 'Incomplete application form'),
('ID Proof', 'Missing identity proof'),
('Address Proof', 'Missing address proof'),
('Fee', 'Payment not complete');

-- Create admin user if it doesn't exist
INSERT IGNORE INTO users (name, username, password, role) 
VALUES ('Administrator', 'admin', '$2b$10$JcCIGWRTGQTL0FRwdwoSdOAiwvGLCF37L/w/BUh1nsCrDCbUGKzqm', 'admin');
-- Note: The password above is 'admin123' hashed with bcrypt 