import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Request schema validation
const chatRequestSchema = z.object({
  message: z.string().min(1, "Message is required"),
  userId: z.string().uuid("Valid user ID is required"),
  context: z.object({
    previousMessages: z.number().optional(),
    includeHealthData: z.boolean().optional(),
  }).optional().default({}),
})

// Enhanced sentiment analysis function with emotion detection
function analyzeSentiment(text: string): { score: number; emotions: Record<string, number> } {
  const positiveWords = [
    "good", "great", "excellent", "happy", "better", "improved", "positive", 
    "wonderful", "amazing", "fantastic", "love", "enjoy", "excited", "confident", 
    "optimistic", "grateful", "thankful", "pleased", "delighted", "joyful", "content"
  ]
  
  const negativeWords = [
    "bad", "terrible", "awful", "sad", "worse", "declined", "negative", 
    "horrible", "hate", "worried", "anxious", "depressed", "frustrated", 
    "stressed", "concerned", "upset", "unhappy", "miserable", "angry", "afraid", "fearful"
  ]
  
  // Emotion categories with associated words
  const emotionCategories = {
    joy: ["happy", "excited", "delighted", "pleased", "glad", "joyful", "cheerful", "content"],
    sadness: ["sad", "unhappy", "depressed", "down", "blue", "gloomy", "miserable", "heartbroken"],
    anxiety: ["worried", "anxious", "nervous", "tense", "uneasy", "afraid", "fearful", "stressed"],
    anger: ["angry", "frustrated", "annoyed", "irritated", "mad", "furious", "upset", "outraged"],
    confusion: ["confused", "uncertain", "unsure", "puzzled", "perplexed", "disoriented", "lost"],
    hope: ["hopeful", "optimistic", "looking forward", "positive", "encouraged", "confident"],
  }

  const words = text.toLowerCase().split(/\s+/)
  let positiveCount = 0
  let negativeCount = 0
  
  // Track emotions
  const emotions: Record<string, number> = {
    joy: 0,
    sadness: 0,
    anxiety: 0,
    anger: 0,
    confusion: 0,
    hope: 0,
  }

  // Count sentiment words and emotions
  words.forEach((word) => {
    if (positiveWords.includes(word)) positiveCount++
    if (negativeWords.includes(word)) negativeCount++
    
    // Check for emotions
    Object.entries(emotionCategories).forEach(([emotion, emotionWords]) => {
      if (emotionWords.includes(word) || emotionWords.some(phrase => text.toLowerCase().includes(phrase))) {
        emotions[emotion]++
      }
    })
  })
  
  // Check for phrases (multi-word emotions)
  Object.entries(emotionCategories).forEach(([emotion, emotionWords]) => {
    emotionWords.forEach(phrase => {
      if (phrase.includes(" ") && text.toLowerCase().includes(phrase)) {
        emotions[emotion]++
      }
    })
  })

  const totalSentimentWords = positiveCount + negativeCount
  // Calculate sentiment score
  const score = totalSentimentWords === 0 ? 0.5 : positiveCount / totalSentimentWords
  
  // Normalize emotion scores
  const totalEmotions = Object.values(emotions).reduce((sum, val) => sum + val, 0)
  if (totalEmotions > 0) {
    Object.keys(emotions).forEach(emotion => {
      emotions[emotion] = emotions[emotion] / totalEmotions
    })
  }
  
  return { score, emotions }
}

// Fetch user's health data for personalized responses
async function getUserHealthData(supabase: any, userId: string) {
  try {
    // Get the latest detection results
    const { data: detectionResults } = await supabase
      .from('detection_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
    
    // Get cognitive scores
    const { data: cognitiveScores } = await supabase
      .from('cognitive_scores')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(5)
    
    // Get recent conversations for context
    const { data: recentConversations } = await supabase
      .from('ai_conversations')
      .select('message, response, sentiment_score, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    
    return {
      detectionResults: detectionResults || [],
      cognitiveScores: cognitiveScores || [],
      recentConversations: recentConversations || [],
    }
  } catch (error) {
    console.error('Error fetching user health data:', error)
    return {
      detectionResults: [],
      cognitiveScores: [],
      recentConversations: [],
    }
  }
}

// Generate personalized AI response based on message content and user data
async function generateAIResponse(message: string, sentimentAnalysis: { score: number; emotions: Record<string, number> }, userData: any): Promise<string> {
  const { score: sentimentScore, emotions } = sentimentAnalysis
  const lowerMessage = message.toLowerCase()
  
  // Determine dominant emotion
  const dominantEmotion = Object.entries(emotions)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, value]) => value > 0)[0]?.[0] || null
  
  // Extract relevant user data
  const hasRecentAssessment = userData.detectionResults.length > 0
  const latestAssessment = hasRecentAssessment ? userData.detectionResults[0] : null
  const hasCognitiveScores = userData.cognitiveScores.length > 0
  const latestScore = hasCognitiveScores ? userData.cognitiveScores[0] : null
  const cognitiveScoreTrend = hasCognitiveScores && userData.cognitiveScores.length > 1 
    ? (userData.cognitiveScores[0].overall_score > userData.cognitiveScores[1].overall_score ? 'improving' : 'declining')
    : 'stable'
  
  // Check for conversation patterns
  const recentNegativeConversations = userData.recentConversations
    .filter(conv => conv.sentiment_score < 0.4)
    .length
  
  const userNamePrefix = userData.detectionResults[0]?.user_name 
    ? `${userData.detectionResults[0].user_name}, ` 
    : ""
  const lowerMessage = message.toLowerCase()

  // Health-related responses with personalized data
  if (lowerMessage.includes("cognitive") || lowerMessage.includes("brain") || lowerMessage.includes("memory")) {
    if (hasCognitiveScores) {
      return `${userNamePrefix}based on your cognitive health patterns, I can see you're actively monitoring your brain function. This is excellent! Your latest cognitive score is ${latestScore.overall_score.toFixed(1)}/10, which shows your cognitive health is ${cognitiveScoreTrend}. 

Your strongest areas are ${latestScore.memory_score > latestScore.focus_score ? 'memory' : 'focus'} and processing speed. ${cognitiveScoreTrend === 'improving' ? 'Keep up the great work!' : 'We have some targeted exercises that could help improve these scores.'} Would you like me to suggest some specific brain training exercises tailored to your profile?`
    } else {
      return `${userNamePrefix}I notice you haven't completed a cognitive assessment recently. Regular cognitive assessment helps identify changes early. Would you like to take a quick assessment now, or would you prefer me to suggest some general brain training exercises?`
    }
  }

  if (lowerMessage.includes("mood") || lowerMessage.includes("feeling") || lowerMessage.includes("emotion")) {
    // Personalized response based on dominant emotion and conversation history
    if (dominantEmotion) {
      switch (dominantEmotion) {
        case 'joy':
          return `${userNamePrefix}it's wonderful to see you're experiencing joy! ${recentNegativeConversations > 2 ? "This is a positive shift from some of your recent conversations." : "Your positive outlook contributes to better cognitive function."} 

Your emotional well-being is closely tied to your neurological health. When you're feeling positive, your brain actually processes information more efficiently. Would you like to explore some activities that can help maintain this positive state?`
          
        case 'sadness':
          return `${userNamePrefix}I can sense you might be feeling down today. ${recentNegativeConversations > 2 ? "I've noticed this pattern in our recent conversations." : "Everyone experiences sadness at times."} 

Emotional well-being is closely connected to cognitive health. Some gentle activities that might help include a short walk outside, listening to uplifting music, or practicing mindfulness for just 5 minutes. Would you like me to guide you through a quick mood-lifting exercise?`
          
        case 'anxiety':
          return `${userNamePrefix}I'm noticing signs of anxiety in your message. ${hasRecentAssessment ? "Your recent assessment showed some stress indicators as well." : ""} 

Anxiety can impact cognitive function, particularly attention and memory. Let's work on this together. Deep breathing exercises can help reduce anxiety in the moment - would you like me to guide you through a quick breathing technique? Or would you prefer some longer-term strategies for managing anxiety?`
          
        case 'confusion':
          return `${userNamePrefix}I sense you might be feeling uncertain or confused. This is completely normal, especially when dealing with health information. 

Let me help clarify things for you. ${hasCognitiveScores ? "Your latest cognitive assessment shows your overall score is " + latestScore.overall_score.toFixed(1) + "/10." : "We can break down your health information into simpler terms."} What specific aspect would you like me to explain more clearly?`
          
        case 'hope':
          return `${userNamePrefix}I'm glad to see your hopeful outlook! Optimism is actually linked to better cognitive resilience and brain health. ${cognitiveScoreTrend === 'improving' ? "This positive attitude aligns with your improving cognitive scores!" : "This positive mindset can help support your cognitive health journey."} 

What specific goals or hopes do you have for your neurological wellness that I can help you work toward?`
          
        default:
          // Fall back to sentiment-based response if emotion is detected but not specifically handled
          if (sentimentScore > 0.6) {
            return `${userNamePrefix}I'm glad to hear you're feeling positive! Your mood trends are an important indicator of your overall neurological wellness. ${hasCognitiveScores ? "I notice your cognitive scores tend to be higher when your mood is positive." : "Maintaining good emotional health supports cognitive function too."} Is there anything specific that's been contributing to your positive mood lately?`
          } else if (sentimentScore < 0.4) {
            return `${userNamePrefix}I understand you might be going through a challenging time. Your emotional well-being is just as important as your cognitive health. ${recentNegativeConversations > 2 ? "I've noticed a pattern in our recent conversations that suggests you might benefit from some additional support." : "Consider some mood-boosting activities like light exercise, meditation, or connecting with loved ones."} What would help you feel better today?`
          }
      }
    }
    
    // Default mood response if no specific emotion detected
    if (sentimentScore > 0.6) {
      return `${userNamePrefix}I'm glad to hear you're feeling positive! Your mood trends are an important indicator of your overall neurological wellness. ${hasCognitiveScores ? "I notice your cognitive scores tend to be higher when your mood is positive." : "Maintaining good emotional health supports cognitive function too."} Is there anything specific that's been contributing to your positive mood lately?`
    } else if (sentimentScore < 0.4) {
      return `${userNamePrefix}I understand you might be going through a challenging time. Your emotional well-being is just as important as your cognitive health. ${recentNegativeConversations > 2 ? "I've noticed a pattern in our recent conversations that suggests you might benefit from some additional support." : "Consider some mood-boosting activities like light exercise, meditation, or connecting with loved ones."} What would help you feel better today?`
    } else {
      return `${userNamePrefix}your mood seems balanced today. It's normal to have ups and downs, and being aware of your emotional state is a positive step. ${hasRecentAssessment ? "Your recent assessments show a good balance between cognitive performance and emotional regulation." : "Regular mood tracking helps identify patterns and triggers."} Would you like some suggestions for activities that can help maintain emotional balance?`
    }
  }

  if (lowerMessage.includes("sleep") || lowerMessage.includes("tired") || lowerMessage.includes("rest")) {
    return `Sleep quality significantly impacts neurological health and cognitive function. Good sleep hygiene includes maintaining a consistent sleep schedule, creating a relaxing bedtime routine, and avoiding screens before bed. Poor sleep can affect memory, concentration, and mood. How many hours of sleep are you typically getting, and how would you rate your sleep quality?`
  }

  if (lowerMessage.includes("exercise") || lowerMessage.includes("activity") || lowerMessage.includes("brain games")) {
    return `Physical and mental exercises are fantastic for neurological health! Regular physical activity increases blood flow to the brain and promotes neuroplasticity. Brain training exercises can help maintain cognitive sharpness. I recommend a mix of cardiovascular exercise, strength training, and cognitive challenges like puzzles, reading, or learning new skills. What types of activities do you enjoy most?`
  }

  if (lowerMessage.includes("progress") || lowerMessage.includes("improvement") || lowerMessage.includes("better")) {
    if (hasCognitiveScores && userData.cognitiveScores.length > 1) {
      const scoreChange = userData.cognitiveScores[0].overall_score - userData.cognitiveScores[1].overall_score;
      const percentChange = ((scoreChange / userData.cognitiveScores[1].overall_score) * 100).toFixed(1);
      const changeDirection = scoreChange > 0 ? "improved" : "decreased";
      
      return `${userNamePrefix}tracking your progress is key to maintaining neurological wellness. Your cognitive score has ${changeDirection} by ${Math.abs(percentChange)}% since your last assessment. 

${scoreChange > 0 ? 
        `Great work! The areas showing the most improvement are ${userData.cognitiveScores[0].memory_score > userData.cognitiveScores[1].memory_score ? 'memory' : 'focus'} and processing speed.` : 
        `This small fluctuation is normal. The areas we could focus on are ${userData.cognitiveScores[0].memory_score < userData.cognitiveScores[1].memory_score ? 'memory' : 'focus'} and processing speed.`
      } 

Remember that progress isn't always linear - small improvements over time lead to significant benefits. What specific areas would you like to focus on improving?`
    } else {
      return `${userNamePrefix}tracking your progress is key to maintaining neurological wellness. From what I can see, you're taking a proactive approach to your health, which is commendable. 

${hasRecentAssessment ? 
        "Your recent assessment provides a good baseline for measuring future progress." : 
        "I recommend completing an assessment to establish a baseline for measuring your progress."
      } 

Remember that progress isn't always linear - small improvements over time lead to significant benefits. What specific areas would you like to focus on improving?`
    }
  }

  // General supportive response
  if (sentimentScore > 0.6) {
    return `It's wonderful to hear from you! Your positive attitude is beneficial for your overall neurological health. Maintaining an optimistic outlook can actually support cognitive function and emotional well-being. Keep up the great work with your health monitoring. Is there anything specific about your wellness journey you'd like to discuss today?`
  } else if (sentimentScore < 0.4) {
    return `Thank you for sharing with me. I'm here to support you through your wellness journey. Remember that seeking help and monitoring your health are positive steps, even when things feel challenging. Your neurological health is multifaceted, and there are many ways we can work together to support your well-being. What would be most helpful for you right now?`
  }

  // Default response
  return `I'm here to support your neurological wellness journey. Whether you want to discuss your health metrics, get personalized advice, or just check in about how you're feeling, I'm ready to help. Your proactive approach to monitoring your brain health is commendable. What would you like to explore today?`
}

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json()
    
    // Validate request data
    const result = chatRequestSchema.safeParse(requestData)
    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 })
    }
    
    const { message, userId, context = {} } = result.data

    const supabase = await createClient()

    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user health data for personalization
    const userData = await getUserHealthData(supabase, userId)
    
    // Enhanced sentiment analysis with emotion detection
    const sentimentAnalysis = analyzeSentiment(message)

    // Generate personalized AI response
    const aiResponse = await generateAIResponse(message, sentimentAnalysis, userData)

    // Save conversation to database
    const { data: conversation, error } = await supabase
      .from("ai_conversations")
      .insert({
        user_id: userId,
        message,
        response: aiResponse,
        sentiment_score: sentimentAnalysis.score,
        emotion_data: sentimentAnalysis.emotions,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to save conversation" }, { status: 500 })
    }

    return NextResponse.json({
      id: conversation.id,
      response: aiResponse,
      sentiment_score: sentimentAnalysis.score,
      emotions: sentimentAnalysis.emotions,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
