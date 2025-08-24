# NeuroLens ML API Endpoints

This document provides details about the ML API endpoints used in the NeuroLens application.

## Authentication and Security

All ML API endpoints require authentication and implement rate limiting. The middleware in `app/api/ml/middleware.ts` handles:

- User authentication via Supabase
- Rate limiting (configurable via environment variables)
- API key validation for external services

## Endpoints

### 1. Speech Emotion Recognition

**Endpoint:** `/api/ml/speech-emotion`

**Method:** POST

**Request Body:**
```json
{
  "userId": "string (UUID)",
  "audioData": "string (base64 encoded audio)"
}
```

**Response:**
```json
{
  "emotions": {
    "neutral": 0.2,
    "happy": 0.5,
    "sad": 0.1,
    "angry": 0.1,
    "fearful": 0.05,
    "disgusted": 0.05
  },
  "risk_indicators": {
    "cognitive_load": 0.3,
    "emotional_variability": 0.4,
    "speech_coherence": 0.8,
    "linguistic_complexity": 0.6
  },
  "transcription": "string (transcribed speech)",
  "waveform_data": [array of numbers],
  "confidence_score": 0.85
}
```

### 2. Facial Emotion Detection

**Endpoint:** `/api/ml/facial-emotion`

**Method:** POST

**Request Body:**
```json
{
  "userId": "string (UUID)",
  "imageData": "string (base64 encoded image)"
}
```

**Response:**
```json
{
  "emotions": {
    "neutral": 0.2,
    "happy": 0.5,
    "sad": 0.1,
    "angry": 0.1,
    "surprised": 0.1
  },
  "risk_indicators": {
    "emotional_consistency": 0.7,
    "facial_expressiveness": 0.6,
    "attention_focus": 0.8,
    "micro_expressions": 0.4
  },
  "face_detected": true,
  "confidence_score": 0.9
}
```

### 3. LLM-Powered Chatbot

**Endpoint:** `/api/ml/chatbot`

**Method:** POST

**Request Body:**
```json
{
  "userId": "string (UUID)",
  "message": "string",
  "conversationId": "string (optional)"
}
```

**Response:**
```json
{
  "id": "string",
  "conversation_id": "string",
  "response": "string (AI response)",
  "sentiment": {
    "primary_emotion": "string",
    "intensity": 0.7
  }
}
```

## Error Responses

All endpoints return standardized error responses:

### Authentication Error (401)
```json
{
  "error": "Unauthorized"
}
```

### Validation Error (400)
```json
{
  "error": "Invalid request data",
  "details": { ... }
}
```

### Rate Limit Error (429)
```json
{
  "error": "Rate limit exceeded. Try again later."
}
```

### Server Error (500)
```json
{
  "error": "Internal server error"
}
```

## Testing

Use the provided test scripts to validate the API endpoints:

```bash
# Test API security and rate limiting
npm run test:api

# Test ML integrations
npm run test:ml

# Run all tests
npm test
```