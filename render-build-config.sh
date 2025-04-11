#!/bin/bash

# Enhanced build script for TypeScript backend
set -e  # Exit immediately if a command exits with a non-zero status
echo "Starting build process..."

# Navigate to Backend directory
cd Backend
echo "Working directory: $(pwd)"

# Clean up any previous build
echo "Cleaning previous build..."
rm -rf dist

# Install all dependencies including all needed type definitions
echo "Installing all dependencies..."
npm install

# Install specific TypeScript type definitions explicitly to ensure they're available
echo "Installing TypeScript type definitions..."
npm install --save-dev @types/node@18.19.86 @types/express@4.17.21 @types/cors@2.8.17 @types/bcryptjs@2.4.6 @types/jsonwebtoken@9.0.9

# Create a .d.ts file for any missing modules
echo "Creating type definitions for any potentially missing modules..."
mkdir -p src/types/declarations
cat > src/types/declarations/globals.d.ts << 'EOF'
// Global module declarations
declare module 'express' {
  export * from 'express';
}
declare module 'cors' {
  export * from 'cors';
}
declare module 'bcryptjs' {
  export * from 'bcryptjs';
}
declare module 'postgres' {
  export * from 'postgres';
}
EOF

# Ensure TypeScript can find the NodeJS types
echo "Making sure tsconfig.json is optimally configured..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es2018",
    "module": "commonjs",
    "lib": ["es2018", "esnext.asynciterable", "dom"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "*": ["node_modules/*", "src/types/declarations/*"]
    },
    "typeRoots": ["./node_modules/@types", "./src/types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Build the TypeScript code
echo "Building TypeScript code..."
npm run build

# Verify successful build
if [ -d "./dist" ]; then
  echo "✅ Build successful! dist directory exists."
else
  echo "❌ Build failed! dist directory not found."
  exit 1
fi

# Test database connection
echo "Testing database connection..."
node dist/config/database.js

echo "Build process completed successfully! 🎉" 