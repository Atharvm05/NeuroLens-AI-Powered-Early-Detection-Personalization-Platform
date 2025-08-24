import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Schema for GET request query parameters
const getProfileQuerySchema = z.object({
  userId: z.string(),
})

// Schema for PATCH request body
const updateProfileSchema = z.object({
  userId: z.string(),
  full_name: z.string().optional(),
  avatar_url: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.string().optional(),
  medical_history: z.record(z.any()).optional(),
  preferences: z.record(z.any()).optional(),
})

// GET endpoint to retrieve user profile
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    
    // Extract and validate query parameters
    const queryParams = {
      userId: url.searchParams.get('userId'),
    }
    
    const result = getProfileQuerySchema.safeParse(queryParams)
    
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
    
    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()
    
    if (profileError) {
      console.error("Database error:", profileError)
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
    }
    
    // Fetch health metrics
    const { data: healthMetrics, error: metricsError } = await supabase
      .from("health_metrics")
      .select("*")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false })
      .limit(1)
    
    if (metricsError) {
      console.error("Database error:", metricsError)
      // Continue anyway, as health metrics are optional
    }
    
    // Fetch caregiver relationships
    const { data: caregivers, error: caregiverError } = await supabase
      .from("caregiver_relationships")
      .select("*")
      .eq("user_id", userId)
    
    if (caregiverError) {
      console.error("Database error:", caregiverError)
      // Continue anyway, as caregiver relationships are optional
    }
    
    return NextResponse.json({
      profile,
      latest_health_metrics: healthMetrics && healthMetrics.length > 0 ? healthMetrics[0] : null,
      caregivers: caregivers || [],
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH endpoint to update user profile
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    
    const result = updateProfileSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request body", details: result.error.format() }, { status: 400 })
    }
    
    const { userId, ...profileData } = result.data
    
    const supabase = await createClient()
    
    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Update user profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update(profileData)
      .eq("id", userId)
      .select()
      .single()
    
    if (updateError) {
      console.error("Database error:", updateError)
      return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 })
    }
    
    return NextResponse.json({
      profile: updatedProfile,
      message: "Profile updated successfully"
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}