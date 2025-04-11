const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log('Auth Header:', authHeader);
  console.log('Token:', token);
  
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  
  // For a simple dummy server, just check if token contains "mock-jwt-token"
  if (token.includes('mock-jwt-token')) {
    // In a real app, you would verify the JWT token
    next();
  } else {
    return res.status(403).json({ message: "Invalid token" });
  }
}

// Request logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} [${req.method}] ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers));
  console.log('Query:', JSON.stringify(req.query));
  console.log('Body:', JSON.stringify(req.body));
  next();
});

// File path for persisting users (simple file-based storage for demo)
const usersFilePath = path.join(__dirname, 'dummy-users.json');

// Load or initialize users
let users = [
  {
    id: 1,
    name: 'Administrator',
    username: 'admin',
    password: 'admin123', // In a real app, this would be hashed
    role: 'admin'
  }
];

// Try to load existing users
try {
  if (fs.existsSync(usersFilePath)) {
    const userData = fs.readFileSync(usersFilePath, 'utf8');
    users = JSON.parse(userData);
    console.log(`Loaded ${users.length} users from storage`);
  } else {
    // Save initial users
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    console.log('Initialized users storage with default admin account');
  }
} catch (error) {
  console.error('Error loading users:', error.message);
}

// Helper function to save users
function saveUsers() {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving users:', error.message);
    return false;
  }
}

// Mock passport data
let passports = [
  {
    id: "P12345",
    applicantName: "John Doe",
    applicantId: "ID12345",
    category: "Regular",
    status: "approved",
    missingRequirements: [],
    processedAt: "2023-03-15T10:30:00Z",
    processedBy: "admin"
  },
  {
    id: "P12346",
    applicantName: "Jane Smith",
    applicantId: "ID12346",
    category: "Expedited",
    status: "pending",
    missingRequirements: ["Photo", "Birth Certificate"],
    processedAt: "2023-03-16T14:20:00Z",
    processedBy: "worker1"
  },
  {
    id: "P12347",
    applicantName: "Bob Johnson",
    applicantId: "ID12347",
    category: "Regular",
    status: "rejected",
    missingRequirements: ["ID Verification", "Application Fee"],
    processedAt: "2023-03-17T09:15:00Z",
    processedBy: "worker2"
  },
  {
    id: "P12348",
    applicantName: "Alice Williams",
    applicantId: "ID12348",
    category: "Expedited",
    status: "approved",
    missingRequirements: [],
    processedAt: "2023-03-18T11:45:00Z",
    processedBy: "admin"
  },
  {
    id: "P12349",
    applicantName: "Charlie Brown",
    applicantId: "ID12349",
    category: "Regular",
    status: "pending",
    missingRequirements: ["Signature"],
    processedAt: "2023-03-19T16:30:00Z",
    processedBy: "worker1"
  }
];

// Routes
app.get('/api/auth/status', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'API server is running',
    userCount: users.length 
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log('Login attempt:', { username, password });
  console.log('Available users:', users.map(u => ({ id: u.id, username: u.username, password: u.password })));
  
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    console.log('User found:', user.username);
    // Don't send password in the response
    const { password, ...userWithoutPassword } = user;
    
    const token = `mock-jwt-token-${user.id}-${Date.now()}`;
    console.log('Generated token:', token);
    
    res.json({
      token,
      user: userWithoutPassword
    });
  } else {
    console.log('Login failed: Invalid credentials');
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Sign-up API endpoint
app.post('/api/auth/signup', (req, res) => {
  const { name, username, password, email } = req.body;
  
  // Validate input
  if (!name || !username || !password) {
    return res.status(400).json({ message: 'Name, username and password are required' });
  }
  
  // Validate username length
  if (username.length < 3) {
    return res.status(400).json({ message: 'Username must be at least 3 characters long' });
  }
  
  // Validate password strength
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }
  
  // Check if username already exists
  if (users.some(u => u.username === username)) {
    return res.status(409).json({ message: 'Username is already taken' });
  }
  
  // Create new user (worker role by default for sign-ups)
  const newUser = {
    id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
    name,
    username,
    password,
    email: email || null,
    role: 'worker', // Default role for signed-up users
    created_at: new Date().toISOString()
  };
  
  // Add to users array
  users.push(newUser);
  
  // Save to file
  if (saveUsers()) {
    // Don't send password in the response
    const { password, ...userWithoutPassword } = newUser;
    
    // Auto-login: generate a token
    const token = `mock-jwt-token-${newUser.id}-${Date.now()}`;
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userWithoutPassword
    });
  } else {
    res.status(500).json({ message: 'Error saving user' });
  }
});

// Create a new user account (admin only)
app.post('/api/users', (req, res) => {
  const { name, username, password, role } = req.body;
  
  // Validate input
  if (!name || !username || !password) {
    return res.status(400).json({ message: 'Name, username and password are required' });
  }
  
  // Check if username already exists
  if (users.some(u => u.username === username)) {
    return res.status(400).json({ message: 'Username already exists' });
  }
  
  // Create new user
  const newUser = {
    id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
    name,
    username,
    password,
    role: role || 'worker',
    created_at: new Date().toISOString()
  };
  
  // Add to users array
  users.push(newUser);
  
  // Save to file
  if (saveUsers()) {
    // Don't send password in the response
    const { password, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } else {
    res.status(500).json({ message: 'Error saving user' });
  }
});

// Get all users (without passwords)
app.get('/api/users', (req, res) => {
  const safeUsers = users.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
  res.json(safeUsers);
});

app.get('/api/workers', (req, res) => {
  const workers = users
    .filter(user => user.role === 'worker')
    .map(({ password, ...userWithoutPassword }) => userWithoutPassword);
  
  res.json(workers);
});

// Stats API - No authentication required for demo purposes
app.get('/api/stats/daily', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  
  console.log('Serving stats for date:', date);
  
  // Generate some mock data
  const mockWorkerStats = {
    'user1': { id: 'user1', name: 'John Doe', inscanned: 23, outscanned: 18, pending: 5 },
    'user2': { id: 'user2', name: 'Jane Smith', inscanned: 17, outscanned: 15, pending: 2 },
    'user3': { id: 'user3', name: 'Mike Johnson', inscanned: 29, outscanned: 22, pending: 7 }
  };
  
  const mockStats = {
    totalPassports: 69,
    inscannedPassports: 69,
    pendingOutscan: 14,
    categoryA: 20,
    categoryB: 15,
    categoryC: 25,
    categoryD: 9,
    missingDocuments: 12,
    invalidDocuments: 8,
    additionalInfoRequired: 5,
    workerStats: mockWorkerStats
  };
  
  res.json(mockStats);
});

// GET all passports
app.get('/api/passports', authenticateToken, (req, res) => {
  res.json({ data: passports });
});

// GET a single passport by ID
app.get('/api/passports/:id', authenticateToken, (req, res) => {
  const passport = passports.find(p => p.id === req.params.id);
  
  if (!passport) {
    return res.status(404).json({ message: "Passport not found" });
  }
  
  res.json({ data: passport });
});

// UPDATE a passport
app.put('/api/passports/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const passportIndex = passports.findIndex(p => p.id === id);
  
  if (passportIndex === -1) {
    return res.status(404).json({ message: "Passport not found" });
  }
  
  // Ensure we're not allowing updates to the ID
  const updatedPassport = {
    ...passports[passportIndex],
    ...req.body,
    id: passports[passportIndex].id // Ensure ID doesn't change
  };
  
  passports[passportIndex] = updatedPassport;
  
  res.json({ 
    message: "Passport updated successfully", 
    data: updatedPassport 
  });
});

// DELETE a passport
app.delete('/api/passports/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const initialLength = passports.length;
  
  passports = passports.filter(p => p.id !== id);
  
  if (passports.length === initialLength) {
    return res.status(404).json({ message: "Passport not found" });
  }
  
  res.json({ message: "Passport deleted successfully" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Dummy API server running at http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /api/auth/status - Check API status');
  console.log('  POST /api/auth/login - Login with username/password');
  console.log('  POST /api/auth/signup - Register a new user account');
  console.log('  POST /api/users - Create a new user (admin only)');
  console.log('  GET  /api/users - Get all users');
  console.log('  GET  /api/workers - Get list of workers');
  console.log('  GET  /api/stats/daily - Get daily statistics');
  console.log('  GET  /api/passports - Get all passports');
  console.log('  GET  /api/passports/:id - Get a single passport');
  console.log('  PUT  /api/passports/:id - Update a passport');
  console.log('  DELETE /api/passports/:id - Delete a passport');
  console.log('\nDefault admin account:');
  console.log('  Username: admin');
  console.log('  Password: admin123');
}); 