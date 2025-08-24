import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Target, CheckCircle, Clock } from "lucide-react"

interface WellnessPlanProgressProps {
  userId: string
}

export function WellnessPlanProgress({ userId }: WellnessPlanProgressProps) {
  // Sample wellness plan data
  const wellnessPlan = {
    title: "Cognitive Enhancement Program",
    totalActivities: 12,
    completedActivities: 8,
    todayActivities: [
      { name: "Memory Training", completed: true, duration: "15 min" },
      { name: "Meditation Session", completed: true, duration: "10 min" },
      { name: "Brain Games", completed: false, duration: "20 min" },
    ],
  }

  const progressPercentage = (wellnessPlan.completedActivities / wellnessPlan.totalActivities) * 100

  return (
    <Card className="health-metric-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Wellness Plan
        </CardTitle>
        <CardDescription>{wellnessPlan.title}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span className="font-medium">
              {wellnessPlan.completedActivities}/{wellnessPlan.totalActivities} activities
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="text-xs text-muted-foreground">{progressPercentage.toFixed(0)}% complete</div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm">Today's Activities</h4>
          {wellnessPlan.todayActivities.map((activity, index) => (
            <div key={index} className="wellness-activity">
              <div className="flex items-center gap-2">
                {activity.completed ? (
                  <CheckCircle className="h-4 w-4 text-secondary" />
                ) : (
                  <Clock className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={`text-sm ${activity.completed ? "line-through text-muted-foreground" : ""}`}>
                  {activity.name}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{activity.duration}</span>
            </div>
          ))}
        </div>

        <Button className="w-full bg-transparent" variant="outline">
          View Full Plan
        </Button>
      </CardContent>
    </Card>
  )
}
