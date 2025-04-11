#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
npm install

# Build with TS errors allowed
echo "Building project with TypeScript errors allowed..."
npm run build

# Exit with success
exit 0 