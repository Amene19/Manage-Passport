import bcrypt from 'bcryptjs';
import pool from '../config/database';
import dotenv from 'dotenv';
import { User } from '../types';
import { RowDataPacket } from 'mysql2';

dotenv.config();

interface UserRow extends RowDataPacket, User {}

async function checkUser() {
  try {
    // Check if user exists
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT * FROM users WHERE username = ?',
      ['testuser']
    );

    if (rows.length === 0) {
      console.log('User not found. Creating test user...');
      
      // Create test user
      const hashedPassword = await bcrypt.hash('test123', 10);
      await pool.execute(
        'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
        ['testuser', hashedPassword, 'Test User', 'worker']
      );
      
      console.log('Test user created successfully');
      console.log('Username: testuser');
      console.log('Password: test123');
    } else {
      const user = rows[0];
      console.log('User found:', {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      });
      
      // Verify password
      const isValid = await bcrypt.compare('test123', user.password);
      console.log('Password verification:', isValid);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
    process.exit();
  }
}

checkUser(); 