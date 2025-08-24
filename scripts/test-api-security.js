/**
 * Test script for API security and rate limiting
 * 
 * This script tests:
 * 1. Authentication requirements
 * 2. Rate limiting functionality
 * 3. API key validation
 */

async function testApiSecurity() {
  console.log('Starting API security tests...');
  
  const endpoints = [
    '/api/ml/speech-emotion',
    '/api/ml/facial-emotion',
    '/api/ml/chatbot'
  ];
  
  // Test 1: Authentication check
  console.log('\nTest 1: Authentication check');
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: 'invalid-user-id' })
      });
      
      const data = await response.json();
      console.log(`${endpoint}: ${response.status} - ${data.error || 'No error message'}`)
      
      if (response.status === 401 && data.error === 'Unauthorized') {
        console.log(`✅ ${endpoint} - Authentication check passed`);
      } else {
        console.log(`❌ ${endpoint} - Authentication check failed`);
      }
    } catch (error) {
      console.error(`Error testing ${endpoint}:`, error.message);
    }
  }
  
  // Test 2: Rate limiting
  console.log('\nTest 2: Rate limiting');
  console.log('Simulating multiple requests to test rate limiting...');
  
  // Use the first endpoint for rate limit testing
  const testEndpoint = endpoints[0];
  const requests = [];
  
  // Send 10 requests in quick succession
  for (let i = 0; i < 10; i++) {
    requests.push(
      fetch(`http://localhost:3000${testEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: 'test-user' })
      })
    );
  }
  
  try {
    const responses = await Promise.all(requests);
    const statusCounts = responses.reduce((acc, response) => {
      acc[response.status] = (acc[response.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Response status distribution:', statusCounts);
    
    if (statusCounts[429] > 0) {
      console.log('✅ Rate limiting is working (received 429 Too Many Requests)');
    } else {
      console.log('❓ Could not verify rate limiting (no 429 responses)');
      console.log('Note: This might be expected if rate limits are set high');
    }
  } catch (error) {
    console.error('Error testing rate limiting:', error.message);
  }
  
  // Test 3: API key validation
  console.log('\nTest 3: API key validation');
  
  // Temporarily backup the real API key
  const originalApiKey = process.env.OPENAI_API_KEY;
  
  // Set an invalid API key
  process.env.OPENAI_API_KEY = '';
  
  try {
    const response = await fetch(`http://localhost:3000/api/ml/chatbot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'test-user',
        message: 'Hello'
      })
    });
    
    const data = await response.json();
    
    if (response.status === 500 && data.error.includes('API key')) {
      console.log('✅ API key validation is working');
    } else {
      console.log('❌ API key validation check failed');
      console.log(`Status: ${response.status}, Error: ${data.error || 'No error message'}`);
    }
  } catch (error) {
    console.error('Error testing API key validation:', error.message);
  }
  
  // Restore the original API key
  process.env.OPENAI_API_KEY = originalApiKey;
  
  console.log('\nAPI security tests completed.');
}

// Run the tests
testApiSecurity().catch(console.error);