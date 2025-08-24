import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Schema for POST request validation
const detectionResultSchema = z.object({
  userId: z.string(),
  detection_type: z.string(),
  confidence_score: z.number(),
  risk_indicators: z.record(z.string(), z.any()).optional(),
  raw_data: z.record(z.string(), z.any()).optional(),
})

// Schema for GET request query parameters
const getResultsQuerySchema = z.object({
  userId: z.string(),
  type: z.string().optional(),
  limit: z.string().transform(Number).optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
})

// Schema for trend analysis query parameters
const trendAnalysisQuerySchema = z.object({
  userId: z.string(),
  detection_type: z.string(),
  timeframe: z.enum(['day', 'week', 'month', 'year']).default('week'),
})

// Helper function to analyze trends in detection results
async function analyzeTrends(userId: string, detection_type: string, timeframe: string) {
  const supabase = await createClient()
  
  // Calculate the date range based on timeframe
  const now = new Date()
  let startDate = new Date()
  
  switch(timeframe) {
    case 'day':
      startDate.setDate(now.getDate() - 1)
      break
    case 'week':
      startDate.setDate(now.getDate() - 7)
      break
    case 'month':
      startDate.setMonth(now.getMonth() - 1)
      break
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1)
      break
    default:
      startDate.setDate(now.getDate() - 7) // Default to week
  }
  
  // Query detection results within the timeframe
  const { data, error } = await supabase
    .from('detection_results')
    .select('*')
    .eq('user_id', userId)
    .eq('detection_type', detection_type)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', now.toISOString())
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching trend data:', error)
    return { error: 'Failed to analyze trends' }
  }
  
  if (!data || data.length === 0) {
    return { 
      message: 'No data available for trend analysis',
      data: [] 
    }
  }
  
  // Calculate average scores and identify trends
  const scores = data.map(item => item.confidence_score)
  const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
  
  // Calculate trend direction (positive or negative)
  const firstHalf = data.slice(0, Math.floor(data.length / 2))
  const secondHalf = data.slice(Math.floor(data.length / 2))
  
  const firstHalfAvg = firstHalf.reduce((sum, item) => sum + item.confidence_score, 0) / firstHalf.length
  const secondHalfAvg = secondHalf.reduce((sum, item) => sum + item.confidence_score, 0) / secondHalf.length
  
  const trendDirection = secondHalfAvg > firstHalfAvg ? 'improving' : secondHalfAvg < firstHalfAvg ? 'declining' : 'stable'
  const changePercentage = firstHalfAvg !== 0 ? Math.abs(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100) : 0
  
  // Identify common risk indicators
  const riskIndicators = {}
  data.forEach(item => {
    if (item.risk_indicators) {
      Object.entries(item.risk_indicators).forEach(([key, value]) => {
        if (value) {
          riskIndicators[key] = (riskIndicators[key] || 0) + 1
        }
      })
    }
  })
  
  // Sort risk indicators by frequency
  const sortedRiskIndicators = Object.entries(riskIndicators)
    .sort((a, b) => b[1] - a[1])
    .map(([indicator, count]) => ({
      indicator,
      frequency: count,
      percentage: (count / data.length) * 100
    }))
  
  return {
    timeframe,
    data_points: data.length,
    average_score: avgScore,
    trend: {
      direction: trendDirection,
      change_percentage: changePercentage.toFixed(2)
    },
    common_risk_indicators: sortedRiskIndicators.slice(0, 5),
    raw_data: data.map(item => ({
      id: item.id,
      date: item.created_at,
      score: item.confidence_score
    }))
  }
}

// Helper function to calculate cognitive health score
async function calculateCognitiveScore(userId: string) {
  const supabase = await createClient()
  
  // Get recent detection results for different types
  const { data: facialResults, error: facialError } = await supabase
    .from('detection_results')
    .select('*')
    .eq('user_id', userId)
    .eq('detection_type', 'facial')
    .order('created_at', { ascending: false })
    .limit(5)
  
  const { data: speechResults, error: speechError } = await supabase
    .from('detection_results')
    .select('*')
    .eq('user_id', userId)
    .eq('detection_type', 'speech')
    .order('created_at', { ascending: false })
    .limit(5)
  
  const { data: behavioralResults, error: behavioralError } = await supabase
    .from('detection_results')
    .select('*')
    .eq('user_id', userId)
    .eq('detection_type', 'behavioral')
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (facialError || speechError || behavioralError) {
    console.error('Error fetching data for cognitive score:', facialError || speechError || behavioralError)
    return { error: 'Failed to calculate cognitive score' }
  }
  
  // Calculate weighted average of confidence scores
  const facialWeight = 0.35
  const speechWeight = 0.4
  const behavioralWeight = 0.25
  
  let facialAvg = 0
  let speechAvg = 0
  let behavioralAvg = 0
  
  if (facialResults && facialResults.length > 0) {
    facialAvg = facialResults.reduce((sum, item) => sum + item.confidence_score, 0) / facialResults.length
  }
  
  if (speechResults && speechResults.length > 0) {
    speechAvg = speechResults.reduce((sum, item) => sum + item.confidence_score, 0) / speechResults.length
  }
  
  if (behavioralResults && behavioralResults.length > 0) {
    behavioralAvg = behavioralResults.reduce((sum, item) => sum + item.confidence_score, 0) / behavioralResults.length
  }
  
  // Calculate weighted cognitive score (0-100 scale)
  const cognitiveScore = Math.round(
    (facialAvg * facialWeight + speechAvg * speechWeight + behavioralAvg * behavioralWeight) * 100
  )
  
  // Determine cognitive health status
  let status = 'normal'
  if (cognitiveScore < 50) {
    status = 'concerning'
  } else if (cognitiveScore < 70) {
    status = 'moderate'
  } else {
    status = 'healthy'
  }
  
  // Identify areas of concern
  const areasOfConcern = []
  if (facialAvg < 0.6) areasOfConcern.push('facial expressions')
  if (speechAvg < 0.6) areasOfConcern.push('speech patterns')
  if (behavioralAvg < 0.6) areasOfConcern.push('behavioral responses')
  
  return {
    cognitive_score: cognitiveScore,
    status,
    areas_of_concern: areasOfConcern,
    component_scores: {
      facial: Math.round(facialAvg * 100),
      speech: Math.round(speechAvg * 100),
      behavioral: Math.round(behavioralAvg * 100)
    },
    last_updated: new Date().toISOString()
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    
    // Extract and validate query parameters
    const queryParams = {
      userId: url.searchParams.get('userId'),
      type: url.searchParams.get('type'),
      limit: url.searchParams.get('limit'),
      from_date: url.searchParams.get('from_date'),
      to_date: url.searchParams.get('to_date')
    }
    
    const result = getResultsQuerySchema.safeParse(queryParams)
    
    if (!result.success) {
      return NextResponse.json({ error: "Invalid query parameters", details: result.error.format() }, { status: 400 })
    }
    
    const { userId, type, limit = 10, from_date, to_date } = result.data
    
    const supabase = await createClient()
    
    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Build query
    let query = supabase
      .from("detection_results")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)
    
    // Add optional filters
    if (type) {
      query = query.eq("detection_type", type)
    }
    
    if (from_date) {
      query = query.gte("created_at", from_date)
    }
    
    if (to_date) {
      query = query.lte("created_at", to_date)
    }
    
    // Execute query
    const { data, error } = await query
    
    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch detection results" }, { status: 500 })
    }
    
    return NextResponse.json({ results: data })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Endpoint for trend analysis
export async function PATCH(request: NextRequest) {
  try {
    const url = new URL(request.url)
    
    // Extract and validate query parameters
    const queryParams = {
      userId: url.searchParams.get('userId'),
      detection_type: url.searchParams.get('detection_type'),
      timeframe: url.searchParams.get('timeframe') || 'week'
    }
    
    const result = trendAnalysisQuerySchema.safeParse(queryParams)
    
    if (!result.success) {
      return NextResponse.json({ error: "Invalid query parameters", details: result.error.format() }, { status: 400 })
    }
    
    const { userId, detection_type, timeframe } = result.data
    
    const supabase = await createClient()
    
    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Analyze trends
    const trendAnalysis = await analyzeTrends(userId, detection_type, timeframe)
    
    if ('error' in trendAnalysis) {
      return NextResponse.json({ error: trendAnalysis.error }, { status: 500 })
    }
    
    return NextResponse.json(trendAnalysis)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Endpoint for cognitive health score calculation
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Calculate cognitive score
    const cognitiveHealth = await calculateCognitiveScore(userId)
    
    if ('error' in cognitiveHealth) {
      return NextResponse.json({ error: cognitiveHealth.error }, { status: 500 })
    }
    
    // Store the calculated score in the database
    const { error } = await supabase
      .from("cognitive_scores")
      .insert({
        user_id: userId,
        score: cognitiveHealth.cognitive_score,
        status: cognitiveHealth.status,
        areas_of_concern: cognitiveHealth.areas_of_concern,
        component_scores: cognitiveHealth.component_scores
      })
    
    if (error) {
      console.error("Database error:", error)
      // Continue anyway, as we want to return the score even if saving fails
    }
    
    return NextResponse.json(cognitiveHealth)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const body = await request.json()
    const result = detectionResultSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request data", details: result.error.format() }, { status: 400 })
    }
    
    const { userId, detection_type, confidence_score, risk_indicators, raw_data } = result.data

    if (!userId || !detection_type || confidence_score === undefined) {
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

    // Save detection result to database
    const { data: result, error } = await supabase
      .from("detection_results")
      .insert({
        user_id: userId,
        detection_type,
        confidence_score,
        risk_indicators,
        raw_data,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to save detection result" }, { status: 500 })
    }

    return NextResponse.json({ id: result.id, success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
