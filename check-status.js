#!/usr/bin/env node

/**
 * Status Check Script
 * Verifies that the Resume Refresh Platform is running correctly
 */

const http = require('http');
const https = require('https');

const checkEndpoint = (url, name) => {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      resolve({
        name,
        status: res.statusCode === 200 ? '✅ Running' : `❌ Error (${res.statusCode})`,
        url
      });
    });
    
    req.on('error', () => {
      resolve({
        name,
        status: '❌ Not accessible',
        url
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        name,
        status: '⏱️ Timeout',
        url
      });
    });
  });
};

const checkStatus = async () => {
  console.log('🔍 Checking Resume Refresh Platform status...\n');
  
  const checks = [
    checkEndpoint('http://localhost:3000', 'Frontend (React)'),
    checkEndpoint('http://localhost:5000', 'Backend (Express)'),
    checkEndpoint('http://localhost:5000/health', 'Backend Health'),
    checkEndpoint('http://localhost:5000/api/auth/health', 'Auth Service')
  ];
  
  const results = await Promise.all(checks);
  
  console.log('📊 Service Status:');
  console.log('================');
  results.forEach(result => {
    console.log(`${result.status} ${result.name}`);
    console.log(`   ${result.url}`);
  });
  
  console.log('\n🎯 Quick Access:');
  console.log('================');
  console.log('🌐 Frontend: http://localhost:3000');
  console.log('🔧 Backend:  http://localhost:5000');
  console.log('📊 Health:   http://localhost:5000/health');
  
  console.log('\n📚 Next Steps:');
  console.log('==============');
  console.log('1. Open http://localhost:3000 in your browser');
  console.log('2. Test the registration flow');
  console.log('3. Login with different roles');
  console.log('4. Explore the dashboards');
  
  const allRunning = results.every(r => r.status.includes('✅'));
  
  if (allRunning) {
    console.log('\n🎉 All services are running correctly!');
  } else {
    console.log('\n⚠️  Some services may need attention. Check the logs above.');
    console.log('💡 Try running "npm run dev" if services are not started.');
  }
};

// Wait a moment for services to start, then check
setTimeout(checkStatus, 3000);
