"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Heart } from "lucide-react"

interface HealthMetric {
  id: string
  metric_type: string
  value: number
  recorded_at: string
}

interface MoodTrendChartProps {
  metrics: HealthMetric[]
}

export function MoodTrendChart({ metrics }: MoodTrendChartProps) {
  // Filter and format mood data for the last 7 days
  const moodMetrics = metrics
    .filter((m) => m.metric_type === "mood_rating")
    .slice(0, 7)
    .reverse()
    .map((metric, index) => ({
      day: `Day ${index + 1}`,
      mood: metric.value,
      date: new Date(metric.recorded_at).toLocaleDateString(),
    }))

  // Generate sample data if no real data exists
  const chartData =
    moodMetrics.length > 0
      ? moodMetrics
      : [
          { day: "Mon", mood: 7.2, date: "Today" },
          { day: "Tue", mood: 6.8, date: "Yesterday" },
          { day: "Wed", mood: 7.5, date: "2 days ago" },
          { day: "Thu", mood: 8.1, date: "3 days ago" },
          { day: "Fri", mood: 7.9, date: "4 days ago" },
          { day: "Sat", mood: 8.3, date: "5 days ago" },
          { day: "Sun", mood: 7.6, date: "6 days ago" },
        ]

  const averageMood = chartData.reduce((sum, item) => sum + item.mood, 0) / chartData.length

  const chartConfig = {
    mood: {
      label: "Mood Rating",
      color: "hsl(var(--color-secondary))",
    },
  }

  return (
    <Card className="health-metric-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-secondary" />
          Mood Trend
        </CardTitle>
        <CardDescription>Your emotional well-being over the past week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="text-2xl font-bold text-secondary">{averageMood.toFixed(1)}</div>
          <div className="text-sm text-muted-foreground">Average mood this week</div>
        </div>

        <ChartContainer config={chartConfig} className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} className="text-xs" />
              <YAxis domain={[0, 10]} axisLine={false} tickLine={false} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="hsl(var(--color-secondary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--color-secondary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "hsl(var(--color-secondary))", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="font-semibold text-secondary">{Math.max(...chartData.map((d) => d.mood)).toFixed(1)}</div>
            <div className="text-muted-foreground">Peak</div>
          </div>
          <div>
            <div className="font-semibold text-accent">{averageMood.toFixed(1)}</div>
            <div className="text-muted-foreground">Average</div>
          </div>
          <div>
            <div className="font-semibold text-warning">{Math.min(...chartData.map((d) => d.mood)).toFixed(1)}</div>
            <div className="text-muted-foreground">Low</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
