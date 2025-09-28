#!/bin/bash

echo ""
echo "================================"
echo " Resume Refresh Platform Setup"
echo "================================"
echo ""

echo "Checking prerequisites..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js is installed"
node --version

# Check if MongoDB is running
echo ""
echo "Checking MongoDB connection..."
if ! mongosh --eval "db.adminCommand('ismaster')" --quiet &> /dev/null; then
    echo "WARNING: MongoDB is not running or not accessible"
    echo "Please start MongoDB service:"
    echo "  - macOS: brew services start mongodb-community"
    echo "  - Linux: sudo systemctl start mongod"
    echo "  - Or install MongoDB from https://www.mongodb.com/"
    echo ""
    echo "Continuing anyway... you can start MongoDB later"
else
    echo "✓ MongoDB is running"
fi

echo ""
echo "Installing dependencies..."
echo ""

# Install root dependencies
echo "Installing root dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install root dependencies"
    exit 1
fi

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install backend dependencies"
    exit 1
fi

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install frontend dependencies"
    exit 1
fi

cd ..

echo ""
echo "================================"
echo " Setup Complete!"
echo "================================"
echo ""
echo "The Resume Refresh Platform is ready to run."
echo ""
echo "To start the development servers:"
echo "  npm run dev"
echo ""
echo "This will start:"
echo "  - Backend API server on http://localhost:5000"
echo "  - Frontend React app on http://localhost:3000"
echo ""
echo "Make sure to:"
echo "  1. Configure backend/.env with your API keys"
echo "  2. Start MongoDB if not already running"
echo "  3. Check SETUP.md for detailed configuration"
echo ""
