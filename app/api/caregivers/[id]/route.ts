import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Schema for PATCH request body
const updateCaregiverSchema = z.object({
  userId: z.string(),
  status: z.enum(['pending', 'active', 'revoked']),
  accessLevel: z.enum(['view', 'manage']).optional(),
})

// GET endpoint to retrieve a specific caregiver relationship
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const caregiverId = params.id
    
    if (!caregiverId) {
      return NextResponse.json({ error: "Caregiver ID is required" }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Fetch caregiver relationship
    const { data: caregiver, error: fetchError } = await supabase
      .from("caregiver_relationships")
      .select("*")
      .eq("id", caregiverId)
      .single()
    
    if (fetchError) {
      console.error("Database error:", fetchError)
      return NextResponse.json({ error: "Failed to fetch caregiver relationship" }, { status: 500 })
    }
    
    // Check if user is authorized to view this caregiver relationship
    if (caregiver.user_id !== user.id && caregiver.caregiver_email !== user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    return NextResponse.json({
      caregiver,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH endpoint to update a caregiver relationship
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const caregiverId = params.id
    
    if (!caregiverId) {
      return NextResponse.json({ error: "Caregiver ID is required" }, { status: 400 })
    }
    
    const body = await request.json()
    
    const result = updateCaregiverSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request body", details: result.error.format() }, { status: 400 })
    }
    
    const { userId, status, accessLevel } = result.data
    
    const supabase = await createClient()
    
    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Fetch caregiver relationship to verify ownership
    const { data: existingCaregiver, error: fetchError } = await supabase
      .from("caregiver_relationships")
      .select("*")
      .eq("id", caregiverId)
      .single()
    
    if (fetchError) {
      console.error("Database error:", fetchError)
      return NextResponse.json({ error: "Failed to fetch caregiver relationship" }, { status: 500 })
    }
    
    if (existingCaregiver.user_id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Update caregiver relationship
    const updateData: any = { status }
    if (accessLevel) {
      updateData.access_level = accessLevel
    }
    
    const { data: updatedCaregiver, error: updateError } = await supabase
      .from("caregiver_relationships")
      .update(updateData)
      .eq("id", caregiverId)
      .select()
      .single()
    
    if (updateError) {
      console.error("Database error:", updateError)
      return NextResponse.json({ error: "Failed to update caregiver relationship" }, { status: 500 })
    }
    
    return NextResponse.json({
      caregiver: updatedCaregiver,
      message: "Caregiver relationship updated successfully"
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE endpoint to remove a caregiver relationship
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const caregiverId = params.id
    
    if (!caregiverId) {
      return NextResponse.json({ error: "Caregiver ID is required" }, { status: 400 })
    }
    
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Fetch caregiver relationship to verify ownership
    const { data: existingCaregiver, error: fetchError } = await supabase
      .from("caregiver_relationships")
      .select("*")
      .eq("id", caregiverId)
      .single()
    
    if (fetchError) {
      console.error("Database error:", fetchError)
      return NextResponse.json({ error: "Failed to fetch caregiver relationship" }, { status: 500 })
    }
    
    if (existingCaregiver.user_id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Delete caregiver relationship
    const { error: deleteError } = await supabase
      .from("caregiver_relationships")
      .delete()
      .eq("id", caregiverId)
    
    if (deleteError) {
      console.error("Database error:", deleteError)
      return NextResponse.json({ error: "Failed to delete caregiver relationship" }, { status: 500 })
    }
    
    return NextResponse.json({
      message: "Caregiver relationship deleted successfully"
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}