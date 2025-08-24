import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, Eye, Activity, Calendar } from "lucide-react"

interface DetectionResult {
  id: string
  detection_type: string
  confidence_score: number
  risk_indicators: any
  created_at: string
}

interface DetectionHistoryProps {
  detectionResults: DetectionResult[]
}

export function DetectionHistory({ detectionResults }: DetectionHistoryProps) {
  const getDetectionIcon = (type: string) => {
    switch (type) {
      case "speech":
        return Mic
      case "facial":
        return Eye
      case "behavioral":
        return Activity
      default:
        return Calendar
    }
  }

  const getRiskLevel = (score: number) => {
    if (score >= 0.7) return { label: "High Risk", color: "bg-destructive text-destructive-foreground" }
    if (score >= 0.4) return { label: "Moderate Risk", color: "bg-warning text-warning-foreground" }
    return { label: "Low Risk", color: "bg-secondary text-secondary-foreground" }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className="health-metric-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Detection History
        </CardTitle>
        <CardDescription>Your recent assessment results and trends</CardDescription>
      </CardHeader>
      <CardContent>
        {detectionResults.length > 0 ? (
          <div className="space-y-4">
            {detectionResults.slice(0, 10).map((result) => {
              const Icon = getDetectionIcon(result.detection_type)
              const riskLevel = getRiskLevel(result.confidence_score)

              return (
                <div key={result.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium capitalize">{result.detection_type} Analysis</div>
                      <div className="text-sm text-muted-foreground">{formatDate(result.created_at)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={riskLevel.color}>{riskLevel.label}</Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {(result.confidence_score * 100).toFixed(0)}% confidence
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No assessment history yet</p>
            <p className="text-sm">Complete your first assessment to see results here</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
