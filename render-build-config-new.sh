#!/bin/bash

# Script to install required type definitions during Render build process
cd Backend

# Install TypeScript type definitions
echo "Installing TypeScript type definitions..."
npm install --save-dev @types/node @types/express @types/cors @types/bcryptjs @types/jsonwebtoken
npm install

# Build the TypeScript code
echo "Building TypeScript code..."
npm run build

# Test database connection
echo "Testing database connection..."
node dist/config/database.js

echo "Build process completed!" 