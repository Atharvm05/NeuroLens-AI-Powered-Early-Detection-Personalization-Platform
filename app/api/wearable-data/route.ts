import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Schema for POST request body
const wearableDataSchema = z.object({
  userId: z.string(),
  device_type: z.enum(['smartwatch', 'fitness_tracker', 'sleep_monitor', 'medical_device', 'other']),
  data_type: z.enum(['heart_rate', 'sleep', 'activity', 'stress', 'blood_pressure', 'blood_glucose', 'other']),
  timestamp: z.string().datetime(),
  value: z.number(),
  unit: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

// Schema for GET request query parameters
const getWearableDataQuerySchema = z.object({
  userId: z.string(),
  data_type: z.enum(['heart_rate', 'sleep', 'activity', 'stress', 'blood_pressure', 'blood_glucose', 'other']).optional(),
  device_type: z.enum(['smartwatch', 'fitness_tracker', 'sleep_monitor', 'medical_device', 'other']).optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  limit: z.string().transform(Number).pipe(z.number().positive()).optional(),
})

// POST endpoint to save wearable data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const result = wearableDataSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request body", details: result.error.format() }, { status: 400 })
    }
    
    const { userId, device_type, data_type, timestamp, value, unit, metadata } = result.data
    
    const supabase = await createClient()
    
    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Insert wearable data
    const { data: wearableData, error: insertError } = await supabase
      .from("wearable_data")
      .insert({
        user_id: userId,
        device_type,
        data_type,
        timestamp,
        value,
        unit,
        metadata,
      })
      .select()
      .single()
    
    if (insertError) {
      console.error("Database error:", insertError)
      return NextResponse.json({ error: "Failed to save wearable data" }, { status: 500 })
    }
    
    // Update health metrics based on wearable data
    await updateHealthMetrics(supabase, userId, data_type, value)
    
    return NextResponse.json({
      data: wearableData,
      message: "Wearable data saved successfully"
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET endpoint to retrieve wearable data
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    
    // Extract and validate query parameters
    const queryParams = {
      userId: url.searchParams.get('userId'),
      data_type: url.searchParams.get('data_type') as any,
      device_type: url.searchParams.get('device_type') as any,
      from_date: url.searchParams.get('from_date'),
      to_date: url.searchParams.get('to_date'),
      limit: url.searchParams.get('limit') || '100',
    }
    
    const result = getWearableDataQuerySchema.safeParse(queryParams)
    
    if (!result.success) {
      return NextResponse.json({ error: "Invalid query parameters", details: result.error.format() }, { status: 400 })
    }
    
    const { userId, data_type, device_type, from_date, to_date, limit } = result.data
    
    const supabase = await createClient()
    
    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if the user is authorized to access this data
    // Either it's their own data or they are a caregiver with access
    if (user.id !== userId) {
      const { data: caregiverRelationship, error: caregiverError } = await supabase
        .from("caregiver_relationships")
        .select("*")
        .eq("user_id", userId)
        .eq("caregiver_email", user.email)
        .eq("status", "active")
        .maybeSingle()
      
      if (caregiverError || !caregiverRelationship) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }
    
    // Build the query
    let query = supabase
      .from("wearable_data")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .limit(limit)
    
    if (data_type) {
      query = query.eq("data_type", data_type)
    }
    
    if (device_type) {
      query = query.eq("device_type", device_type)
    }
    
    if (from_date) {
      query = query.gte("timestamp", from_date)
    }
    
    if (to_date) {
      query = query.lte("timestamp", to_date)
    }
    
    const { data: wearableData, error: fetchError } = await query
    
    if (fetchError) {
      console.error("Database error:", fetchError)
      return NextResponse.json({ error: "Failed to fetch wearable data" }, { status: 500 })
    }
    
    return NextResponse.json({
      data: wearableData || [],
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to update health metrics based on wearable data
async function updateHealthMetrics(supabase: any, userId: string, dataType: string, value: number) {
  try {
    // Get the latest health metrics for the user
    const { data: latestMetrics, error: fetchError } = await supabase
      .from("health_metrics")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (fetchError) {
      console.error("Error fetching health metrics:", fetchError)
      return
    }
    
    // Determine which metric to update based on the data type
    let updateData: any = {}
    
    switch (dataType) {
      case 'heart_rate':
        updateData.resting_heart_rate = value
        break
      case 'sleep':
        // Assuming value is sleep duration in hours
        updateData.sleep_quality = value >= 7 ? 'good' : value >= 5 ? 'fair' : 'poor'
        break
      case 'activity':
        // Assuming value is steps or activity minutes
        updateData.activity_level = value >= 10000 ? 'high' : value >= 5000 ? 'moderate' : 'low'
        break
      case 'stress':
        // Assuming value is a stress score (0-100)
        updateData.stress_level = value <= 30 ? 'low' : value <= 70 ? 'moderate' : 'high'
        break
      default:
        // No relevant metric to update
        return
    }
    
    // If we have existing metrics, update them
    if (latestMetrics) {
      // Only update if the latest metrics are from today
      const today = new Date().toISOString().split('T')[0]
      const metricsDate = new Date(latestMetrics.created_at).toISOString().split('T')[0]
      
      if (today === metricsDate) {
        // Update existing metrics for today
        await supabase
          .from("health_metrics")
          .update(updateData)
          .eq("id", latestMetrics.id)
      } else {
        // Create new metrics for today
        await supabase
          .from("health_metrics")
          .insert({
            user_id: userId,
            ...updateData,
          })
      }
    } else {
      // No existing metrics, create new entry
      await supabase
        .from("health_metrics")
        .insert({
          user_id: userId,
          ...updateData,
        })
    }
  } catch (error) {
    console.error("Error updating health metrics:", error)
  }
}