"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Brain, TrendingUp, TrendingDown } from "lucide-react"

interface HealthMetric {
  id: string
  metric_type: string
  value: number
  recorded_at: string
}

interface CognitiveScoreCardProps {
  metrics: HealthMetric[]
}

export function CognitiveScoreCard({ metrics }: CognitiveScoreCardProps) {
  const cognitiveMetrics = metrics.filter((m) => m.metric_type === "cognitive_score")
  const currentScore = cognitiveMetrics.length > 0 ? cognitiveMetrics[0].value : 75
  const previousScore = cognitiveMetrics.length > 1 ? cognitiveMetrics[1].value : 70
  const trend = currentScore - previousScore

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-secondary"
    if (score >= 70) return "text-accent"
    if (score >= 55) return "text-warning"
    return "text-destructive"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 85) return "Excellent"
    if (score >= 70) return "Good"
    if (score >= 55) return "Fair"
    return "Needs Attention"
  }

  return (
    <Card className="health-metric-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Cognitive Health Score
            </CardTitle>
            <CardDescription>Your overall cognitive performance assessment</CardDescription>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getScoreColor(currentScore)}`}>{currentScore.toFixed(0)}</div>
            <div className="text-sm text-muted-foreground">out of 100</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span className={getScoreColor(currentScore)}>{getScoreLabel(currentScore)}</span>
          </div>
          <Progress value={currentScore} className="h-3" />
        </div>

        <div className="flex items-center gap-2 text-sm">
          {trend > 0 ? (
            <TrendingUp className="h-4 w-4 text-secondary" />
          ) : trend < 0 ? (
            <TrendingDown className="h-4 w-4 text-destructive" />
          ) : null}
          <span className={trend > 0 ? "text-secondary" : trend < 0 ? "text-destructive" : "text-muted-foreground"}>
            {trend > 0 ? "+" : ""}
            {trend.toFixed(1)} from last assessment
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="text-lg font-semibold text-secondary">92</div>
            <div className="text-xs text-muted-foreground">Memory</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-accent">78</div>
            <div className="text-xs text-muted-foreground">Focus</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-primary">85</div>
            <div className="text-xs text-muted-foreground">Processing</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
