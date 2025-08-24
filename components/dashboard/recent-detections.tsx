import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Mic, Activity, AlertTriangle } from "lucide-react"

interface DetectionResult {
  id: string
  detection_type: string
  confidence_score: number
  risk_indicators: any
  created_at: string
}

interface RecentDetectionsProps {
  detections: DetectionResult[]
}

export function RecentDetections({ detections }: RecentDetectionsProps) {
  const getDetectionIcon = (type: string) => {
    switch (type) {
      case "speech":
        return Mic
      case "facial":
        return Eye
      case "behavioral":
        return Activity
      default:
        return AlertTriangle
    }
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "bg-destructive text-destructive-foreground"
    if (score >= 0.6) return "bg-warning text-warning-foreground"
    if (score >= 0.4) return "bg-accent text-accent-foreground"
    return "bg-secondary text-secondary-foreground"
  }

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.8) return "High Risk"
    if (score >= 0.6) return "Moderate Risk"
    if (score >= 0.4) return "Low Risk"
    return "Normal"
  }

  // Sample data if no real detections
  const sampleDetections = [
    {
      id: "1",
      detection_type: "speech",
      confidence_score: 0.3,
      risk_indicators: { speech_clarity: 0.85, response_time: 0.4 },
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      detection_type: "facial",
      confidence_score: 0.2,
      risk_indicators: { facial_symmetry: 0.92, eye_tracking: 0.88 },
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "3",
      detection_type: "behavioral",
      confidence_score: 0.1,
      risk_indicators: { movement_patterns: 0.95, coordination: 0.91 },
      created_at: new Date(Date.now() - 172800000).toISOString(),
    },
  ]

  const displayDetections = detections.length > 0 ? detections : sampleDetections

  return (
    <Card className="health-metric-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Recent Detections
        </CardTitle>
        <CardDescription>Latest AI-powered health assessments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayDetections.map((detection) => {
            const Icon = getDetectionIcon(detection.detection_type)
            const formattedDate = new Date(detection.created_at).toLocaleDateString()

            return (
              <div key={detection.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium capitalize">{detection.detection_type} Analysis</div>
                    <div className="text-sm text-muted-foreground">{formattedDate}</div>
                  </div>
                </div>
                <Badge className={getConfidenceColor(detection.confidence_score)}>
                  {getConfidenceLabel(detection.confidence_score)}
                </Badge>
              </div>
            )
          })}
        </div>

        {displayDetections.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent detections available</p>
            <p className="text-sm">Complete an assessment to see results here</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
