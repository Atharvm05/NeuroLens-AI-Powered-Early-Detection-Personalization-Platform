import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AssessmentDashboard } from "@/components/assessments/assessment-dashboard"

export default async function AssessmentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch recent detection results
  const { data: detectionResults } = await supabase
    .from("detection_results")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <div className="min-h-screen bg-background">
      <AssessmentDashboard user={user} detectionResults={detectionResults || []} />
    </div>
  )
}
