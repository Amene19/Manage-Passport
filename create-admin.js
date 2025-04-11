const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: './Backend/.env' });

// Database configuration from .env
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Create a connection
    const connection = await mysql.createConnection(dbConfig);
    
    // Generate a hash for password 'admin123'
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);
    
    // Insert admin user
    const [result] = await connection.execute(
      'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)',
      ['Administrator', 'admin', hashedPassword, 'admin']
    );
    
    console.log(`Admin user created with ID: ${result.insertId}`);
    
    // Close the connection
    await connection.end();
    
    console.log('Done!');
  } catch (error) {
    console.error('Error creating admin user:', error.message);
  }
}

createAdminUser(); 

// Added commands to delete the release folder before packaging
const { exec } = require('child_process');
exec('rmdir /s /q release', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error deleting release folder: ${error}`);
    return;
  }
  console.log('Release folder deleted successfully');
  exec('npm run package', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running package command: ${error}`);
      return;
    }
    console.log('Package command executed successfully');
  });
});