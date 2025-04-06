import pool from '../config/database';

async function checkDatabase() {
  try {
    // Test connection
    const [result] = await pool.execute('SELECT 1');
    console.log('✅ Database connection successful');

    // Check if users table exists and has data
    const [usersResult] = await pool.execute('SELECT * FROM users');
    console.log('✅ Users table exists');
    console.log('Number of users:', (usersResult as any[]).length);
    console.log('Users:', (usersResult as any[]).map(user => ({ username: user.username, role: user.role })));

  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await pool.end();
  }
}

checkDatabase(); 