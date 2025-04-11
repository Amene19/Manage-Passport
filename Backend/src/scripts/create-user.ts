import bcrypt from 'bcryptjs';
import pool from '../config/database';

async function createUser(username: string, password: string, name: string, role: 'admin' | 'user' = 'user') {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the user
    const result = await pool`
      INSERT INTO users (username, password, name, role) 
      VALUES (${username}, ${hashedPassword}, ${name}, ${role})
    `;

    console.log('User created successfully!');
    console.log('Username:', username);
    console.log('Role:', role);
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    // Connection pooling is managed by the postgres library
  }
}

// Create a new user
createUser('testuser', 'test123', 'Test User', 'user'); 