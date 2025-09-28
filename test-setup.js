#!/usr/bin/env node

/**
 * Setup Test Script
 * Tests the Resume Refresh Platform setup without requiring external APIs
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Resume Refresh Platform setup...\n');

// Test 1: Check if required files exist
console.log('📁 Checking project structure...');
const requiredFiles = [
  'package.json',
  'backend/package.json',
  'frontend/package.json',
  'backend/src/server.js',
  'frontend/src/main.jsx',
  'backend/.env',
  'frontend/.env'
];

let filesOk = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    filesOk = false;
  }
});

// Test 2: Check Node.js version
console.log('\n🔧 Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));

if (majorVersion >= 18) {
  console.log(`✅ Node.js ${nodeVersion} (compatible)`);
} else {
  console.log(`❌ Node.js ${nodeVersion} (requires v18+)`);
  filesOk = false;
}

// Test 3: Check dependencies
console.log('\n📦 Checking dependencies...');
try {
  const rootPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const backendPkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  const frontendPkg = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
  
  console.log(`✅ Root dependencies: ${Object.keys(rootPkg.dependencies || {}).length + Object.keys(rootPkg.devDependencies || {}).length}`);
  console.log(`✅ Backend dependencies: ${Object.keys(backendPkg.dependencies || {}).length + Object.keys(backendPkg.devDependencies || {}).length}`);
  console.log(`✅ Frontend dependencies: ${Object.keys(frontendPkg.dependencies || {}).length + Object.keys(frontendPkg.devDependencies || {}).length}`);
} catch (error) {
  console.log('❌ Error reading package.json files');
  filesOk = false;
}

// Test 4: Check environment variables
console.log('\n🔐 Checking environment configuration...');
try {
  const backendEnv = fs.readFileSync('backend/.env', 'utf8');
  const frontendEnv = fs.readFileSync('frontend/.env', 'utf8');
  
  const hasJwtSecret = backendEnv.includes('JWT_SECRET=') && !backendEnv.includes('your-super-secret');
  const hasApiUrl = frontendEnv.includes('VITE_API_URL=');
  
  console.log(`${hasJwtSecret ? '✅' : '⚠️'} Backend JWT configuration`);
  console.log(`${hasApiUrl ? '✅' : '❌'} Frontend API configuration`);
  
  if (backendEnv.includes('MOCK_AI_SERVICES=true')) {
    console.log('🤖 Mock AI services enabled (no external API required)');
  }
  
  if (backendEnv.includes('MOCK_EMAIL_SERVICES=true')) {
    console.log('📧 Mock email services enabled (no SMTP required)');
  }
  
} catch (error) {
  console.log('❌ Error reading environment files');
  filesOk = false;
}

// Test 5: Check MongoDB connection (optional)
console.log('\n🗄️ Checking MongoDB...');
const { spawn } = require('child_process');

const checkMongo = spawn('mongosh', ['--eval', 'db.adminCommand("ismaster")', '--quiet'], {
  stdio: 'pipe'
});

checkMongo.on('close', (code) => {
  if (code === 0) {
    console.log('✅ MongoDB is accessible');
  } else {
    console.log('⚠️ MongoDB not accessible (you can start it later)');
  }
  
  // Final summary
  console.log('\n📋 Setup Summary:');
  console.log('=================');
  
  if (filesOk) {
    console.log('🎉 Project setup is complete and ready for development!');
    console.log('\n🚀 To start the development servers:');
    console.log('   npm run dev');
    console.log('\n🌐 Access points:');
    console.log('   • Frontend: http://localhost:3000');
    console.log('   • Backend:  http://localhost:5000');
    console.log('   • Health:   http://localhost:5000/health');
    console.log('\n💡 Features available without external APIs:');
    console.log('   • User registration and authentication');
    console.log('   • Dashboard interfaces for all roles');
    console.log('   • Mock AI matching and suggestions');
    console.log('   • Mock email notifications (logged to console)');
    console.log('   • File upload and management');
    console.log('   • All UI components and interactions');
  } else {
    console.log('❌ Setup incomplete. Please fix the issues above.');
    console.log('\n🔧 Common fixes:');
    console.log('   • Run: npm install && cd backend && npm install && cd ../frontend && npm install');
    console.log('   • Run: node setup-dev-mode.js');
    console.log('   • Check Node.js version (requires v18+)');
  }
});

checkMongo.on('error', () => {
  console.log('⚠️ MongoDB not found (install from https://www.mongodb.com/)');
  // Continue with summary even if MongoDB is not available
  checkMongo.emit('close', 1);
});
