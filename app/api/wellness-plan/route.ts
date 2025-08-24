import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Schema for GET request query parameters
const getWellnessPlanQuerySchema = z.object({
  userId: z.string(),
})

// Helper function to generate personalized wellness plan
async function generateWellnessPlan(userId: string) {
  const supabase = await createClient()
  
  // Fetch user's cognitive health data
  const { data: cognitiveScores, error: cognitiveError } = await supabase
    .from("cognitive_scores")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
  
  if (cognitiveError) {
    console.error("Error fetching cognitive scores:", cognitiveError)
    return { error: "Failed to fetch cognitive data" }
  }
  
  // Fetch recent detection results
  const { data: detectionResults, error: detectionError } = await supabase
    .from("detection_results")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10)
  
  if (detectionError) {
    console.error("Error fetching detection results:", detectionError)
    return { error: "Failed to fetch detection results" }
  }
  
  // Fetch user profile for personalization
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()
  
  if (profileError) {
    console.error("Error fetching user profile:", profileError)
    // Continue anyway, as profile is optional for recommendations
  }
  
  // Default cognitive score if none found
  const cognitiveScore = cognitiveScores && cognitiveScores.length > 0 
    ? cognitiveScores[0] 
    : { score: 75, status: "moderate", areas_of_concern: [] }
  
  // Analyze detection results to identify areas needing focus
  const facialResults = detectionResults?.filter(r => r.detection_type === "facial") || []
  const speechResults = detectionResults?.filter(r => r.detection_type === "speech") || []
  const behavioralResults = detectionResults?.filter(r => r.detection_type === "behavioral") || []
  
  // Generate personalized activities based on cognitive score and detection results
  const activities = []
  
  // Core activities for everyone
  activities.push({
    id: "daily-check-in",
    title: "Daily Cognitive Check-in",
    description: "Complete a brief daily assessment to track your cognitive health",
    frequency: "daily",
    duration_minutes: 5,
    difficulty: "easy",
    category: "monitoring"
  })
  
  activities.push({
    id: "mindfulness-practice",
    title: "Mindfulness Practice",
    description: "Practice mindfulness meditation to improve focus and reduce stress",
    frequency: "daily",
    duration_minutes: 10,
    difficulty: "easy",
    category: "wellness"
  })
  
  // Add facial expression exercises if needed
  if (facialResults.length > 0 && facialResults.some(r => r.confidence_score < 0.7)) {
    activities.push({
      id: "facial-exercises",
      title: "Facial Expression Exercises",
      description: "Practice facial movements and expressions to maintain muscle tone and expressiveness",
      frequency: "3x-weekly",
      duration_minutes: 15,
      difficulty: "moderate",
      category: "facial"
    })
  }
  
  // Add speech exercises if needed
  if (speechResults.length > 0 && speechResults.some(r => r.confidence_score < 0.7)) {
    activities.push({
      id: "speech-practice",
      title: "Speech Articulation Practice",
      description: "Read passages aloud focusing on clear articulation and varied intonation",
      frequency: "daily",
      duration_minutes: 15,
      difficulty: "moderate",
      category: "speech"
    })
    
    activities.push({
      id: "word-retrieval",
      title: "Word Retrieval Exercises",
      description: "Practice word-finding exercises to strengthen lexical retrieval",
      frequency: "2x-weekly",
      duration_minutes: 20,
      difficulty: "challenging",
      category: "speech"
    })
  }
  
  // Add memory exercises based on cognitive score
  if (cognitiveScore.score < 70 || cognitiveScore.areas_of_concern?.includes("memory")) {
    activities.push({
      id: "memory-training",
      title: "Memory Enhancement Training",
      description: "Complete memory exercises designed to strengthen recall and recognition",
      frequency: "daily",
      duration_minutes: 20,
      difficulty: "adaptive",
      category: "cognitive"
    })
  }
  
  // Add social activities if behavioral scores indicate isolation
  if (behavioralResults.length > 0 && behavioralResults.some(r => 
      r.risk_indicators && r.risk_indicators.social_withdrawal)) {
    activities.push({
      id: "social-engagement",
      title: "Social Engagement Activity",
      description: "Schedule and participate in a social activity with friends or family",
      frequency: "weekly",
      duration_minutes: 60,
      difficulty: "moderate",
      category: "social"
    })
  }
  
  // Add physical exercise for overall brain health
  activities.push({
    id: "physical-exercise",
    title: "Physical Exercise Session",
    description: "Engage in moderate physical activity to promote brain health",
    frequency: "3x-weekly",
    duration_minutes: 30,
    difficulty: "moderate",
    category: "physical"
  })
  
  // Generate schedule recommendations
  const schedule = {
    recommended_time_of_day: {
      cognitive_exercises: "morning",
      physical_activities: "afternoon",
      relaxation: "evening"
    },
    weekly_distribution: {
      monday: ["daily-check-in", "mindfulness-practice", "memory-training"],
      tuesday: ["daily-check-in", "physical-exercise", "speech-practice"],
      wednesday: ["daily-check-in", "mindfulness-practice", "facial-exercises"],
      thursday: ["daily-check-in", "physical-exercise", "word-retrieval"],
      friday: ["daily-check-in", "mindfulness-practice", "memory-training"],
      saturday: ["daily-check-in", "physical-exercise", "social-engagement"],
      sunday: ["daily-check-in", "mindfulness-practice", "rest-day"]
    },
    adaptability: "Adjust schedule based on energy levels and cognitive load throughout the day"
  }
  
  // Create the wellness plan
  const wellnessPlan = {
    title: "Personalized Cognitive Wellness Plan",
    description: `Customized plan based on your cognitive profile and recent assessments. Focus areas include ${cognitiveScore.areas_of_concern?.join(", ") || "overall cognitive health"}.`,
    activities,
    schedule,
    recommendations: {
      sleep: "Aim for 7-8 hours of quality sleep each night",
      nutrition: "Follow a Mediterranean-style diet rich in omega-3 fatty acids",
      hydration: "Drink at least 8 glasses of water daily",
      technology: "Take regular breaks from screens and practice digital detox"
    },
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString()
  }
  
  return wellnessPlan
}

// Endpoint to get personalized wellness plan
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    
    // Extract and validate query parameters
    const queryParams = {
      userId: url.searchParams.get('userId'),
    }
    
    const result = getWellnessPlanQuerySchema.safeParse(queryParams)
    
    if (!result.success) {
      return NextResponse.json({ error: "Invalid query parameters", details: result.error.format() }, { status: 400 })
    }
    
    const { userId } = result.data
    
    const supabase = await createClient()
    
    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if user already has an active wellness plan
    const { data: existingPlan, error: planError } = await supabase
      .from("wellness_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
    
    if (planError) {
      console.error("Database error:", planError)
      return NextResponse.json({ error: "Failed to check existing plans" }, { status: 500 })
    }
    
    // If plan exists and is less than 7 days old, return it
    if (existingPlan && existingPlan.length > 0) {
      const planDate = new Date(existingPlan[0].created_at)
      const daysSinceCreation = Math.floor((Date.now() - planDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSinceCreation < 7) {
        return NextResponse.json({ 
          plan: existingPlan[0],
          is_new: false,
          days_remaining: 7 - daysSinceCreation
        })
      }
    }
    
    // Generate new wellness plan
    const wellnessPlan = await generateWellnessPlan(userId)
    
    if ('error' in wellnessPlan) {
      return NextResponse.json({ error: wellnessPlan.error }, { status: 500 })
    }
    
    // Save the new plan to the database
    const { data: savedPlan, error: saveError } = await supabase
      .from("wellness_plans")
      .insert({
        user_id: userId,
        title: wellnessPlan.title,
        description: wellnessPlan.description,
        activities: wellnessPlan.activities,
        schedule: wellnessPlan.schedule,
        is_active: true
      })
      .select()
      .single()
    
    if (saveError) {
      console.error("Database error:", saveError)
      // Continue anyway to return the plan even if saving fails
    }
    
    return NextResponse.json({ 
      plan: savedPlan || wellnessPlan,
      is_new: true,
      days_remaining: 7
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Endpoint to update wellness plan progress
export async function POST(request: NextRequest) {
  try {
    const { userId, planId, activityId, completed, notes } = await request.json()
    
    if (!userId || !planId || !activityId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get the current plan
    const { data: plan, error: planError } = await supabase
      .from("wellness_plans")
      .select("*")
      .eq("id", planId)
      .eq("user_id", userId)
      .single()
    
    if (planError) {
      console.error("Database error:", planError)
      return NextResponse.json({ error: "Failed to fetch wellness plan" }, { status: 500 })
    }
    
    if (!plan) {
      return NextResponse.json({ error: "Wellness plan not found" }, { status: 404 })
    }
    
    // Create activity progress entry
    const { data: progress, error: progressError } = await supabase
      .from("activity_progress")
      .insert({
        user_id: userId,
        plan_id: planId,
        activity_id: activityId,
        completed: completed || false,
        notes: notes || "",
        completed_at: completed ? new Date().toISOString() : null
      })
      .select()
      .single()
    
    if (progressError) {
      console.error("Database error:", progressError)
      return NextResponse.json({ error: "Failed to update activity progress" }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      progress
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}