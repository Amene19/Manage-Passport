import pool from './config/database';

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully!');
    
    // Test query
    const [rows] = await connection.query('SELECT 1');
    console.log('Test query executed successfully:', rows);
    
    connection.release();
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

testConnection(); 