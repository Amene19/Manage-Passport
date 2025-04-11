import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function initDatabase() {
  // Create connection with the database URL
  const connectionString = process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
  
  const sql = postgres(connectionString, {
    ssl: { rejectUnauthorized: false },
    max: 10
  });

  try {
    // Create users table if not exists - PostgreSQL syntax
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(10) CHECK (role IN ('admin', 'worker')) NOT NULL DEFAULT 'worker',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create test user
    const hashedPassword = await bcrypt.hash('test123', 10);
    try {
      await sql`
        INSERT INTO users (username, password, name, role) 
        VALUES (${'testuser'}, ${hashedPassword}, ${'Test User'}, ${'worker'})
      `;
      console.log('✅ Test user created successfully');
      console.log('Username: testuser');
      console.log('Password: test123');
    } catch (err: any) {
      if (err.code === '23505') { // PostgreSQL duplicate key violation
        console.log('ℹ️ Test user already exists');
      } else {
        throw err;
      }
    }

    // Verify users
    const users = await sql`SELECT username, role FROM users`;
    console.log('Current users:', users);

    console.log('✅ Database setup completed successfully');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    // End connection
    await sql.end();
  }
}

initDatabase(); 