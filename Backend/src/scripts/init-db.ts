import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function initDatabase() {
  // First create a connection without database
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  try {
    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    await connection.query(`USE ${process.env.DB_NAME}`);
    
    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role ENUM('admin', 'worker') NOT NULL DEFAULT 'worker',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create test user
    const hashedPassword = await bcrypt.hash('test123', 10);
    try {
      await connection.query(
        'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
        ['testuser', hashedPassword, 'Test User', 'worker']
      );
      console.log('✅ Test user created successfully');
      console.log('Username: testuser');
      console.log('Password: test123');
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log('ℹ️ Test user already exists');
      } else {
        throw err;
      }
    }

    // Verify users
    const [users] = await connection.query('SELECT username, role FROM users');
    console.log('Current users:', users);

    console.log('✅ Database setup completed successfully');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    await connection.end();
  }
}

initDatabase(); 