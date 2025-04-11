import pool from '../config/database';

async function checkDatabase() {
  try {
    // Test connection
    const result = await pool`SELECT 1`;
    console.log('✅ Database connection successful');

    // Check if users table exists and has data
    const usersResult = await pool`SELECT * FROM users`;
    console.log('✅ Users table exists');
    console.log('Number of users:', usersResult.length);
    console.log('Users:', usersResult.map(user => ({ username: user.username, role: user.role })));

  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    // pool.end() is not needed with postgres library as it manages its own connection pool
  }
}

checkDatabase(); 