import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OpenAI } from 'openai'
import { z } from 'zod'
import { mlApiMiddleware } from '../middleware'

// Schema for validating request body
const chatRequestSchema = z.object({
  userId: z.string().uuid(),
  message: z.string().min(1),
  conversationId: z.string().optional(),
})

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// System prompt for the chatbot
const SYSTEM_PROMPT = `
You are NeuroBuddy, an empathetic AI health companion for the NeuroLens cognitive health monitoring platform.

Your primary goals are to:
1. Provide emotional support and encouragement to users monitoring their cognitive health
2. Offer personalized insights based on their detection results (speech, facial, behavioral analysis)
3. Suggest appropriate wellness activities based on their cognitive patterns
4. Answer questions about cognitive health in an accessible, non-clinical way
5. Maintain a warm, supportive tone while being honest about limitations

When responding to users:
- Acknowledge their emotions and concerns with empathy
- Reference their recent assessment results when relevant
- Suggest specific wellness activities that target their areas of concern
- Avoid making medical diagnoses or replacing professional medical advice
- Keep responses concise (2-3 paragraphs maximum) and conversational

You have access to the user's recent assessment data and can reference specific patterns.
`

// Function to analyze user message sentiment
async function analyzeSentiment(message: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a sentiment analysis tool. Analyze the emotional tone of the following message and respond with a JSON object containing 'primary_emotion' (one of: neutral, happy, sad, anxious, frustrated, confused, hopeful) and 'intensity' (a number from 0 to 1)."
        },
        { role: "user", content: message }
      ],
      response_format: { type: "json_object" }
    })

    const result = JSON.parse(response.choices[0].message.content || '{"primary_emotion":"neutral","intensity":0.5}')
    return result
  } catch (error) {
    console.error("Error analyzing sentiment:", error)
    return { primary_emotion: "neutral", intensity: 0.5 }
  }
}

// Function to get user's recent health data
async function getUserHealthData(supabase: any, userId: string) {
  try {
    // Get recent detection results
    const { data: detectionResults, error: detectionError } = await supabase
      .from("detection_results")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)

    if (detectionError) throw detectionError

    // Get cognitive scores
    const { data: cognitiveScores, error: scoresError } = await supabase
      .from("cognitive_scores")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(3)

    if (scoresError) throw scoresError

    // Get recent conversations
    const { data: recentConversations, error: conversationsError } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)

    if (conversationsError) throw conversationsError

    return {
      detectionResults,
      cognitiveScores,
      recentConversations
    }
  } catch (error) {
    console.error("Error fetching user health data:", error)
    return {
      detectionResults: [],
      cognitiveScores: [],
      recentConversations: []
    }
  }
}

// Function to generate personalized response
async function generateResponse(message: string, userData: any, sentiment: any) {
  try {
    // Format user data for context
    const detectionSummary = userData.detectionResults.length > 0 
      ? `Recent detection results: ${userData.detectionResults.map((r: any) => 
          `${r.detection_type} analysis (${new Date(r.created_at).toLocaleDateString()}) - confidence score: ${r.confidence_score.toFixed(2)}`
        ).join(', ')}` 
      : "No recent detection results available.";

    const cognitiveTrends = userData.cognitiveScores.length > 0
      ? `Recent cognitive scores: ${userData.cognitiveScores.map((s: any) => 
          `${new Date(s.date).toLocaleDateString()}: ${s.overall_score.toFixed(2)}`
        ).join(', ')}`
      : "No recent cognitive scores available.";

    const conversationHistory = userData.recentConversations.length > 0
      ? `Recent conversation topics: ${userData.recentConversations.map((c: any) => 
          c.user_message.substring(0, 30) + (c.user_message.length > 30 ? '...' : '')
        ).join('; ')}`
      : "No recent conversation history available.";

    // Create context for the AI
    const userContext = `
    USER CONTEXT:
    ${detectionSummary}
    ${cognitiveTrends}
    User's current emotional state: ${sentiment.primary_emotion} (intensity: ${sentiment.intensity.toFixed(2)})
    ${conversationHistory}
    `;

    // Generate response
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: SYSTEM_PROMPT + userContext },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response. Please try again."
  } catch (error) {
    console.error("Error generating response:", error)
    return "I'm having trouble connecting right now. Please try again in a moment."
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply middleware for authentication, rate limiting, and API key validation
    const middlewareResponse = await mlApiMiddleware(request);
    if (middlewareResponse) return middlewareResponse;
    
    const body = await request.json()
    
    // Validate request data
    const result = chatRequestSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 })
    }
    
    const { userId, message, conversationId } = result.data

    const supabase = await createClient()

    // Analyze message sentiment
    const sentiment = await analyzeSentiment(message)
    
    // Get user health data for context
    const userData = await getUserHealthData(supabase, userId)
    
    // Generate personalized response
    const aiResponse = await generateResponse(message, userData, sentiment)
    
    // Save conversation to database
    const { data: conversationData, error: conversationError } = await supabase
      .from("ai_conversations")
      .insert({
        user_id: userId,
        conversation_id: conversationId || crypto.randomUUID(),
        user_message: message,
        ai_response: aiResponse,
        sentiment: sentiment.primary_emotion,
        sentiment_intensity: sentiment.intensity,
      })
      .select()
      .single()

    if (conversationError) {
      console.error("Database error:", conversationError)
      return NextResponse.json({ error: "Failed to save conversation" }, { status: 500 })
    }

    return NextResponse.json({
      id: conversationData.id,
      conversation_id: conversationData.conversation_id,
      response: aiResponse,
      sentiment: sentiment,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}