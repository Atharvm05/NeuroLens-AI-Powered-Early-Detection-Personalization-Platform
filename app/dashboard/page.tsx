import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { HealthMetricsOverview } from "@/components/dashboard/health-metrics-overview"
import { CognitiveScoreCard } from "@/components/dashboard/cognitive-score-card"
import { MoodTrendChart } from "@/components/dashboard/mood-trend-chart"
import { RecentDetections } from "@/components/dashboard/recent-detections"
import { WellnessPlanProgress } from "@/components/dashboard/wellness-plan-progress"
import { AICompanionWidget } from "@/components/dashboard/ai-companion-widget"
import CognitiveTrends from "@/components/dashboard/cognitive-trends"
import WearableDataIntegration from "@/components/dashboard/wearable-data-integration"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch recent health metrics
  const { data: healthMetrics } = await supabase
    .from("health_metrics")
    .select("*")
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: false })
    .limit(10)

  // Fetch recent detection results
  const { data: detectionResults } = await supabase
    .from("detection_results")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Welcome Section */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                Welcome back, {profile?.full_name || user.email?.split("@")[0]}
              </h1>
              <p className="text-muted-foreground">Here's your neurological health overview for today.</p>
            </div>
            <Link href="/assessments">
              <Button>Take Assessment</Button>
            </Link>
          </div>

          {/* Health Metrics Overview */}
          <HealthMetricsOverview metrics={healthMetrics || []} />

          {/* Main Dashboard Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Primary Metrics */}
            <div className="lg:col-span-2 space-y-6">
              <CognitiveScoreCard metrics={healthMetrics || []} />
              <CognitiveTrends />
              <WearableDataIntegration userId={user.id} />
              <MoodTrendChart metrics={healthMetrics || []} />
              <RecentDetections detections={detectionResults || []} />
            </div>

            {/* Right Column - Secondary Info */}
            <div className="space-y-6">
              <AICompanionWidget />
              <WellnessPlanProgress userId={user.id} />
              <div className="mt-4">
                <Link href="/wellness-plan">
                  <Button variant="outline" className="w-full">View Wellness Plan</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
