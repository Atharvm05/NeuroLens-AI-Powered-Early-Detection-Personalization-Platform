import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Heart, Moon, Zap } from "lucide-react"

interface HealthMetric {
  id: string
  metric_type: string
  value: number
  recorded_at: string
}

interface HealthMetricsOverviewProps {
  metrics: HealthMetric[]
}

export function HealthMetricsOverview({ metrics }: HealthMetricsOverviewProps) {
  // Calculate latest values for each metric type
  const getLatestMetric = (type: string) => {
    const filtered = metrics.filter((m) => m.metric_type === type)
    return filtered.length > 0 ? filtered[0].value : 0
  }

  const cognitiveScore = getLatestMetric("cognitive_score")
  const moodRating = getLatestMetric("mood_rating")
  const sleepQuality = getLatestMetric("sleep_quality")
  const stressLevel = getLatestMetric("stress_level")

  const metricCards = [
    {
      title: "Cognitive Score",
      value: cognitiveScore,
      max: 100,
      icon: Brain,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Mood Rating",
      value: moodRating,
      max: 10,
      icon: Heart,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Sleep Quality",
      value: sleepQuality,
      max: 10,
      icon: Moon,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Stress Level",
      value: 10 - stressLevel, // Invert stress level for display
      max: 10,
      icon: Zap,
      color: "text-info",
      bgColor: "bg-info/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metricCards.map((metric) => {
        const percentage = (metric.value / metric.max) * 100
        const Icon = metric.icon

        return (
          <Card key={metric.title} className="health-metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <div className={`p-2 rounded-full ${metric.bgColor}`}>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value.toFixed(0)}</div>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    percentage >= 80
                      ? "bg-secondary"
                      : percentage >= 60
                        ? "bg-accent"
                        : percentage >= 40
                          ? "bg-warning"
                          : "bg-destructive"
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {percentage >= 80
                  ? "Excellent"
                  : percentage >= 60
                    ? "Good"
                    : percentage >= 40
                      ? "Fair"
                      : "Needs attention"}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
