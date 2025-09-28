#!/usr/bin/env node

/**
 * Simple API Testing Script
 * Uses Node.js built-in modules to test Resume Refresh Platform endpoints
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// Simple HTTP request helper
const makeRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (url.startsWith('https') ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
};

const testEndpoint = async (name, url, options = {}) => {
  try {
    console.log(`🧪 Testing: ${name}`);
    console.log(`   URL: ${url}`);
    
    const response = await makeRequest(url, options);
    
    if (response.status >= 200 && response.status < 300) {
      console.log(`✅ ${name} - PASSED (${response.status})`);
      if (options.showResponse && response.data) {
        console.log(`   Response: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
      }
      console.log('');
      return { passed: true, response };
    } else {
      console.log(`❌ ${name} - FAILED (${response.status})`);
      console.log(`   Error: ${response.data.error || response.data}`);
      console.log('');
      return { passed: false, response };
    }
  } catch (error) {
    console.log(`❌ ${name} - ERROR`);
    console.log(`   Error: ${error.message}`);
    console.log('');
    return { passed: false, error };
  }
};

const runSimpleTests = async () => {
  console.log('🚀 Resume Refresh Platform - Simple API Tests');
  console.log('==============================================\n');

  let passedTests = 0;
  let totalTests = 0;
  const results = [];

  // Test 1: Health Check
  totalTests++;
  const healthResult = await testEndpoint(
    'Health Check',
    `${BASE_URL}/health`,
    { showResponse: true }
  );
  if (healthResult.passed) passedTests++;
  results.push(healthResult);

  // Test 2: Register Candidate (Mock)
  totalTests++;
  const registerResult = await testEndpoint(
    'Candidate Registration',
    `${API_BASE}/auth/register`,
    {
      method: 'POST',
      body: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test.user@example.com',
        password: 'TestPass123',
        role: 'candidate'
      },
      showResponse: true
    }
  );
  if (registerResult.passed) passedTests++;
  results.push(registerResult);

  // Test 3: Login (Mock)
  totalTests++;
  const loginResult = await testEndpoint(
    'User Login',
    `${API_BASE}/auth/login`,
    {
      method: 'POST',
      body: {
        email: 'test.user@example.com',
        password: 'TestPass123'
      },
      showResponse: true
    }
  );
  if (loginResult.passed) passedTests++;
  results.push(loginResult);

  // Test 4: Get Jobs
  totalTests++;
  const jobsResult = await testEndpoint(
    'Get Jobs List',
    `${API_BASE}/jobs`,
    { showResponse: true }
  );
  if (jobsResult.passed) passedTests++;
  results.push(jobsResult);

  // Test 5: Forgot Password
  totalTests++;
  const forgotResult = await testEndpoint(
    'Forgot Password',
    `${API_BASE}/auth/forgot-password`,
    {
      method: 'POST',
      body: {
        email: 'test.user@example.com'
      }
    }
  );
  if (forgotResult.passed) passedTests++;
  results.push(forgotResult);

  // Results Summary
  console.log('==============================================');
  console.log('📊 Test Results Summary:');
  console.log('==============================================');
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests`);
  
  const successRate = (passedTests / totalTests) * 100;
  console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);
  
  console.log('\n🔍 Individual Test Results:');
  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${status}`);
  });

  console.log('\n🎯 What This Means:');
  console.log('===================');
  
  if (passedTests >= 4) {
    console.log('🎉 Core functionality is working!');
    console.log('• Backend server is running');
    console.log('• API endpoints are accessible'); 
    console.log('• Authentication system is functional');
    console.log('• Mock services are providing responses');
  } else {
    console.log('⚠️ Some core services may need attention');
    console.log('💡 Try restarting the servers: npm run dev');
  }

  console.log('\n🌐 Ready to Use:');
  console.log('================');
  console.log('• Frontend: http://localhost:3000');
  console.log('• Backend Health: http://localhost:5000/health');
  console.log('• API Documentation: See API_ENDPOINTS.md');
  console.log('• Postman Collection: Resume_Refresh_API.postman_collection.json');

  console.log('\n🧪 Manual Testing:');
  console.log('==================');
  console.log('1. Open http://localhost:3000 in your browser');
  console.log('2. Register a new account (candidate or recruiter)');
  console.log('3. Login and explore the dashboard');
  console.log('4. Test job posting/searching features');
  console.log('5. Check console logs for mock AI/email responses');
};

// Run tests after a short delay
console.log('⏳ Starting API tests in 2 seconds...\n');
setTimeout(runSimpleTests, 2000);





