# Passport Processing System

This project consists of two main components:
1. **Backend** - A Node.js/Express API server
2. **FrontDesk** - An Electron desktop application

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher recommended)
- npm (comes with Node.js)
- MySQL (for the Backend)

### Backend Setup
1. Navigate to the Backend directory:
   ```
   cd Backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure the database:
   - Make sure MySQL is running
   - Update the `.env` file with your database credentials
   - Create the database if it doesn't exist:
     ```sql
     CREATE DATABASE IF NOT EXISTS passport_processing;
     ```

4. Start the backend in development mode:
   ```
   npm run dev
   ```

### FrontDesk Setup
1. Navigate to the FrontDesk directory:
   ```
   cd FrontDesk
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the application:
   ```
   npm start
   ```

## Running the Integrated System

For convenience, a batch script is provided to start both the Backend and FrontDesk:

```
start-both.bat
```

This will:
1. Start the Backend server (running on http://localhost:3001)
2. Wait 5 seconds for initialization
3. Start the FrontDesk desktop application

## Default Users

The system comes with a default admin account:
- Username: `admin`
- Password: `admin123`

## Configuration

### API Configuration
The API configuration is stored in `FrontDesk/src/config.ts`. You can modify the:
- API base URL
- Endpoint paths

### Environment Variables
- Backend uses `.env` for configuration
- FrontDesk uses environment variables passed during build time

## Features

### User Management
- Login/Logout
- User role-based access control (admin/worker)

### Passport Management
- View all passport records
- Filter and search passports
- Edit passport details
- Delete passport records

### Dashboard
- View statistics about passport processing
- Filter by date ranges

### History
- View processing history
- Track worker performance

## Troubleshooting

### Connection Issues
If the FrontDesk app cannot connect to the Backend:
1. Ensure the Backend is running (`npm run dev` in the Backend directory)
2. Check that the API URL in `FrontDesk/src/config.ts` matches the Backend server address
3. Verify that no firewall is blocking the connection

### Database Issues
If the Backend cannot connect to the database:
1. Check the MySQL server is running
2. Verify the database credentials in `.env`
3. Ensure the database exists

### Authentication Issues
If login is not working:
1. Check the default admin credentials
2. Verify the JWT secret in `.env`
3. Ensure the token is being stored correctly in localStorage 