import sql from '../config/database';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

async function setupDatabase() {
  try {
    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the schema into individual statements
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    // Execute statements within a transaction
    await sql.begin(async (txn) => {
      for (const statement of statements) {
        if (statement.trim()) {
          await txn.unsafe(statement);
        }
      }
    });
    
    console.log('✅ Database schema created successfully');

    // Create test user
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    try {
      await sql`
        INSERT INTO users (username, password, name, role) 
        VALUES ('testuser', ${hashedPassword}, 'Test User', 'user')
      `;
      console.log('✅ Test user created successfully');
      console.log('Username: testuser');
      console.log('Password: test123');
    } catch (err: any) {
      if (err.code === '23505') { // PostgreSQL unique violation error code
        console.log('ℹ️ Test user already exists');
      } else {
        throw err;
      }
    }

    // Verify users
    const users = await sql`SELECT username, role FROM users`;
    console.log('Current users:', users);

  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await sql.end();
  }
}

setupDatabase(); 