import sql from './config/database';

async function testConnection() {
  try {
    const result = await sql`SELECT 1 as connected`;
    console.log('Database connected successfully!');
    console.log('Test query executed successfully:', result);
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    // Close the connection
    await sql.end();
  }
}

testConnection(); 