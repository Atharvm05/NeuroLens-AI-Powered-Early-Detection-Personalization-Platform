# NeuroLens: AI-Powered Cognitive Health Monitoring

NeuroLens is a Next.js application that uses AI and machine learning to monitor cognitive health through speech analysis, facial expression detection, and personalized chatbot interactions.

## Features

- **Speech Emotion Recognition**: Analyzes speech patterns using the RAVDESS dataset to detect emotional states and potential cognitive health indicators.
- **Facial Emotion Detection**: Uses computer vision to analyze facial expressions and detect emotions in real-time.
- **LLM-Powered Chatbot**: Provides personalized health insights and recommendations using OpenAI's GPT models.
- **Comprehensive Dashboard**: Visualizes cognitive health trends and metrics.
- **Personalized Wellness Plans**: Generates tailored cognitive wellness activities.

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes
- **Database**: Supabase
- **AI/ML**: TensorFlow.js, OpenAI API
- **Authentication**: Supabase Auth

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/neurolens.git
cd neurolens
```

2. Install dependencies

```bash
pnpm install
```

3. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys and configuration values.

4. Create the required model directories

```bash
mkdir -p public/models/ravdess
mkdir -p public/models/emotion
```

5. Download pre-trained models (instructions to be added)

6. Run the development server

```bash
pnpm dev
```

## AI/ML Integration

### Speech Emotion Recognition

The speech analysis component uses TensorFlow.js to analyze audio recordings and detect emotions based on the RAVDESS dataset. The model identifies patterns in speech that may indicate cognitive health issues.

### Facial Emotion Detection

The facial analysis component uses TensorFlow.js with a pre-trained CNN model to detect facial expressions and emotions in real-time. This provides insights into emotional states and potential cognitive health indicators.

### LLM-Powered Chatbot

The chatbot uses OpenAI's GPT models to provide personalized health insights, recommendations, and emotional support. It analyzes conversation history and health data to offer tailored advice.

## Security Considerations

- API keys are stored securely in environment variables
- User authentication is handled by Supabase
- Rate limiting is implemented to prevent abuse
- All health data is stored securely in the database

## License

MIT