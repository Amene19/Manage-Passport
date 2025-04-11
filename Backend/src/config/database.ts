import postgres from 'postgres'
import dotenv from 'dotenv';

dotenv.config();

console.log('🔌 Attempting to connect to database...');
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`Database: ${process.env.DB_NAME}`);
console.log(`User: ${process.env.DB_USER}`);
console.log(`Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);

// Check if connectionString exists, otherwise build it from individual params
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

console.log('Using connection string:', connectionString.replace(/:[^:]*@/, ':****@')); // Log without exposing password

const sql = postgres(connectionString, {
  ssl: { rejectUnauthorized: false }, // Accept self-signed certificates
  max: 10, // Connection limit
  idle_timeout: 30,
  connect_timeout: 30
})

// Test the connection
async function testConnection() {
  try {
    const result = await sql`SELECT 1 as connected`;
    console.log('✅ Database connection created successfully!');
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    return false;
  }
}

testConnection();

export default sql; 