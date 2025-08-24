/**
 * Test script for ML model integrations
 * 
 * This script tests:
 * 1. Speech emotion recognition API
 * 2. Facial emotion detection API
 * 3. LLM-powered chatbot API
 */

async function testMlIntegrations() {
  console.log('Starting ML integration tests...');
  
  // Mock data for testing
  const mockAudioBase64 = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
  const mockImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==';
  const userId = 'test-user-id';
  
  // Helper function to make API requests
  async function makeRequest(endpoint, data) {
    try {
      const response = await fetch(`http://localhost:3000/api/ml/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      return {
        status: response.status,
        data: await response.json()
      };
    } catch (error) {
      console.error(`Error calling ${endpoint}:`, error.message);
      return { status: 500, data: { error: error.message } };
    }
  }
  
  // Test 1: Speech Emotion Recognition
  console.log('\nTest 1: Speech Emotion Recognition');
  const speechResult = await makeRequest('speech-emotion', {
    userId,
    audioData: mockAudioBase64
  });
  
  console.log(`Status: ${speechResult.status}`);
  if (speechResult.status === 200) {
    console.log('✅ Speech emotion API responded successfully');
    console.log('Response data:', JSON.stringify(speechResult.data, null, 2));
    
    // Validate response structure
    if (speechResult.data.emotions && speechResult.data.risk_indicators) {
      console.log('✅ Response contains expected data structure');
    } else {
      console.log('❌ Response missing expected data structure');
    }
  } else {
    console.log('❌ Speech emotion API failed');
    console.log('Error:', speechResult.data.error || 'Unknown error');
  }
  
  // Test 2: Facial Emotion Detection
  console.log('\nTest 2: Facial Emotion Detection');
  const facialResult = await makeRequest('facial-emotion', {
    userId,
    imageData: mockImageBase64
  });
  
  console.log(`Status: ${facialResult.status}`);
  if (facialResult.status === 200) {
    console.log('✅ Facial emotion API responded successfully');
    console.log('Response data:', JSON.stringify(facialResult.data, null, 2));
    
    // Validate response structure
    if (facialResult.data.emotions && facialResult.data.risk_indicators) {
      console.log('✅ Response contains expected data structure');
    } else {
      console.log('❌ Response missing expected data structure');
    }
  } else {
    console.log('❌ Facial emotion API failed');
    console.log('Error:', facialResult.data.error || 'Unknown error');
  }
  
  // Test 3: LLM-powered Chatbot
  console.log('\nTest 3: LLM-powered Chatbot');
  const chatbotResult = await makeRequest('chatbot', {
    userId,
    message: 'Hello, how can you help me with my cognitive health?'
  });
  
  console.log(`Status: ${chatbotResult.status}`);
  if (chatbotResult.status === 200) {
    console.log('✅ Chatbot API responded successfully');
    console.log('Response:', chatbotResult.data.response);
    
    // Validate response structure
    if (chatbotResult.data.response && chatbotResult.data.sentiment) {
      console.log('✅ Response contains expected data structure');
    } else {
      console.log('❌ Response missing expected data structure');
    }
  } else {
    console.log('❌ Chatbot API failed');
    console.log('Error:', chatbotResult.data.error || 'Unknown error');
  }
  
  console.log('\nML integration tests completed.');
}

// Run the tests
testMlIntegrations().catch(console.error);