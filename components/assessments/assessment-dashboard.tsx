"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AssessmentHeader } from "./assessment-header"
import { SpeechAnalysis } from "./speech-analysis"
import { FacialAnalysis } from "./facial-analysis"
import { BehavioralAssessment } from "./behavioral-assessment"
import { DetectionHistory } from "./detection-history"
import { Mic, Eye, Activity } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface DetectionResult {
  id: string
  detection_type: string
  confidence_score: number
  risk_indicators: any
  raw_data: any
  created_at: string
}

interface AssessmentDashboardProps {
  user: SupabaseUser
  detectionResults: DetectionResult[]
}

export function AssessmentDashboard({ user, detectionResults }: AssessmentDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")

  const assessmentTypes = [
    {
      id: "speech",
      title: "Speech Analysis",
      description: "Analyze speech patterns for neurological indicators",
      icon: Mic,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      id: "facial",
      title: "Facial Expression",
      description: "Monitor facial expressions and micro-expressions",
      icon: Eye,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      id: "behavioral",
      title: "Behavioral Patterns",
      description: "Track movement and interaction patterns",
      icon: Activity,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <AssessmentHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Early Detection Assessments</h1>
            <p className="text-muted-foreground">
              Use AI-powered analysis to monitor your neurological health through speech, facial expressions, and
              behavioral patterns.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="speech">Speech</TabsTrigger>
              <TabsTrigger value="facial">Facial</TabsTrigger>
              <TabsTrigger value="behavioral">Behavioral</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                {assessmentTypes.map((assessment) => {
                  const Icon = assessment.icon
                  const recentResults = detectionResults.filter((r) => r.detection_type === assessment.id)
                  const latestScore = recentResults.length > 0 ? recentResults[0].confidence_score : 0

                  return (
                    <Card key={assessment.id} className="health-metric-card">
                      <CardHeader>
                        <div className={`p-3 rounded-full ${assessment.bgColor} w-fit`}>
                          <Icon className={`h-6 w-6 ${assessment.color}`} />
                        </div>
                        <CardTitle>{assessment.title}</CardTitle>
                        <CardDescription>{assessment.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Latest Score</span>
                          <span className="text-lg font-semibold">
                            {latestScore > 0 ? `${(latestScore * 100).toFixed(0)}%` : "No data"}
                          </span>
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => setActiveTab(assessment.id)}
                          variant={latestScore > 0.6 ? "destructive" : "default"}
                        >
                          {latestScore > 0.6 ? "Review Results" : "Start Assessment"}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <DetectionHistory detectionResults={detectionResults} />
            </TabsContent>

            <TabsContent value="speech">
              <SpeechAnalysis userId={user.id} />
            </TabsContent>

            <TabsContent value="facial">
              <FacialAnalysis userId={user.id} />
            </TabsContent>

            <TabsContent value="behavioral">
              <BehavioralAssessment userId={user.id} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
