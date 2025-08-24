import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Schema for POST request body
const addCaregiverSchema = z.object({
  userId: z.string(),
  caregiverEmail: z.string().email(),
  accessLevel: z.enum(['view', 'manage']),
})

// Schema for GET request query parameters
const getCaregiverQuerySchema = z.object({
  userId: z.string(),
})

// POST endpoint to add a new caregiver
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const result = addCaregiverSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request body", details: result.error.format() }, { status: 400 })
    }
    
    const { userId, caregiverEmail, accessLevel } = result.data
    
    const supabase = await createClient()
    
    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if caregiver relationship already exists
    const { data: existingCaregiver, error: checkError } = await supabase
      .from("caregiver_relationships")
      .select("*")
      .eq("user_id", userId)
      .eq("caregiver_email", caregiverEmail)
      .maybeSingle()
    
    if (checkError) {
      console.error("Database error:", checkError)
      return NextResponse.json({ error: "Failed to check existing caregiver" }, { status: 500 })
    }
    
    if (existingCaregiver) {
      return NextResponse.json({ 
        error: "Caregiver already exists", 
        caregiver: existingCaregiver 
      }, { status: 409 })
    }
    
    // Create new caregiver relationship
    const { data: newCaregiver, error: createError } = await supabase
      .from("caregiver_relationships")
      .insert({
        user_id: userId,
        caregiver_email: caregiverEmail,
        access_level: accessLevel,
        status: 'pending'
      })
      .select()
      .single()
    
    if (createError) {
      console.error("Database error:", createError)
      return NextResponse.json({ error: "Failed to add caregiver" }, { status: 500 })
    }
    
    // Generate a secure invitation link
    const inviteId = newCaregiver.id
    const shareLink = `${request.headers.get('origin') || 'https://neurolens.app'}/caregiver/invite/${inviteId}`
    
    // TODO: Send email invitation to caregiver
    // This would typically be implemented with an email service
    
    return NextResponse.json({
      caregiver: newCaregiver,
      shareLink,
      message: "Caregiver invitation created successfully"
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET endpoint to retrieve caregivers
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    
    // Extract and validate query parameters
    const queryParams = {
      userId: url.searchParams.get('userId'),
    }
    
    const result = getCaregiverQuerySchema.safeParse(queryParams)
    
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
    
    // Fetch caregiver relationships
    const { data: caregivers, error: fetchError } = await supabase
      .from("caregiver_relationships")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    
    if (fetchError) {
      console.error("Database error:", fetchError)
      return NextResponse.json({ error: "Failed to fetch caregivers" }, { status: 500 })
    }
    
    return NextResponse.json({
      caregivers: caregivers || [],
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}