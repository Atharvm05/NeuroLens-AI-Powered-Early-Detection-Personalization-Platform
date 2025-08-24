"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Activity, Play, Target } from "lucide-react"

interface BehavioralAssessmentProps {
  userId: string
}

export function BehavioralAssessment({ userId }: BehavioralAssessmentProps) {
  const [isAssessing, setIsAssessing] = useState(false)
  const [assessmentTime, setAssessmentTime] = useState(0)
  const [currentTask, setCurrentTask] = useState(0)
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [taskResults, setTaskResults] = useState<any[]>([])

  const tasks = [
    {
      title: "Finger Tapping",
      description: "Tap the space bar as quickly as possible for 10 seconds",
      duration: 10,
      instruction: "Press and hold the space bar repeatedly",
    },
    {
      title: "Mouse Tracking",
      description: "Follow the moving target with your cursor",
      duration: 15,
      instruction: "Keep your cursor on the red circle",
    },
    {
      title: "Reaction Time",
      description: "Click when the circle turns green",
      duration: 20,
      instruction: "Wait for green, then click immediately",
    },
  ]

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isAssessing) {
      interval = setInterval(() => {
        setAssessmentTime((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isAssessing])

  const startAssessment = () => {
    setIsAssessing(true)
    setAssessmentTime(0)
    setCurrentTask(0)
    setTaskResults([])
    setAnalysisResults(null)
  }

  const completeTask = (taskData: any) => {
    const newResults = [...taskResults, taskData]
    setTaskResults(newResults)

    if (currentTask < tasks.length - 1) {
      setCurrentTask(currentTask + 1)
    } else {
      // All tasks completed, analyze results
      analyzeResults(newResults)
    }
  }

  const analyzeResults = async (results: any[]) => {
    setIsAssessing(false)

    // Simulate analysis
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock analysis results
    const mockResults = {
      confidence_score: Math.random() * 0.3 + 0.1, // Low risk for demo
      risk_indicators: {
        movement_patterns: Math.random() * 0.2 + 0.8,
        coordination: Math.random() * 0.3 + 0.7,
        reaction_time: Math.random() * 0.4 + 0.5,
        fine_motor_control: Math.random() * 0.3 + 0.6,
      },
      raw_data: {
        total_duration: assessmentTime,
        tasks_completed: results.length,
        average_performance: results.reduce((acc, r) => acc + r.score, 0) / results.length,
      },
    }

    setAnalysisResults(mockResults)

    // Save to database
    await fetch("/api/detection-results", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        detection_type: "behavioral",
        confidence_score: mockResults.confidence_score,
        risk_indicators: mockResults.risk_indicators,
        raw_data: mockResults.raw_data,
      }),
    })
  }

  const getRiskLevel = (score: number) => {
    if (score >= 0.7) return { label: "High Risk", color: "bg-destructive" }
    if (score >= 0.4) return { label: "Moderate Risk", color: "bg-warning" }
    return { label: "Low Risk", color: "bg-secondary" }
  }

  return (
    <div className="space-y-6">
      <Card className="health-metric-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            Behavioral Pattern Assessment
          </CardTitle>
          <CardDescription>
            Complete interactive tasks to assess movement patterns, coordination, and reaction times.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isAssessing && !analysisResults && (
            <div className="text-center space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tasks.map((task, index) => (
                  <div key={index} className="p-4 rounded-lg border border-border">
                    <h4 className="font-medium mb-2">{task.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                    <div className="text-xs text-muted-foreground">{task.duration}s duration</div>
                  </div>
                ))}
              </div>
              <Button onClick={startAssessment} size="lg">
                <Play className="h-4 w-4 mr-2" />
                Start Assessment
              </Button>
            </div>
          )}

          {isAssessing && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">
                  Task {currentTask + 1}: {tasks[currentTask].title}
                </h3>
                <p className="text-muted-foreground mb-4">{tasks[currentTask].instruction}</p>
                <div className="text-2xl font-bold text-accent">{assessmentTime}s</div>
              </div>

              <div className="flex justify-center">
                <TaskComponent
                  task={tasks[currentTask]}
                  onComplete={(data) => completeTask({ ...data, task: currentTask })}
                />
              </div>

              <Progress value={((currentTask + 1) / tasks.length) * 100} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResults && (
        <Card className="health-metric-card">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>Behavioral pattern assessment completed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Overall Risk Level</span>
              <Badge className={getRiskLevel(analysisResults.confidence_score).color}>
                {getRiskLevel(analysisResults.confidence_score).label}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Movement Patterns</span>
                  <span>{(analysisResults.risk_indicators.movement_patterns * 100).toFixed(0)}%</span>
                </div>
                <Progress value={analysisResults.risk_indicators.movement_patterns * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Coordination</span>
                  <span>{(analysisResults.risk_indicators.coordination * 100).toFixed(0)}%</span>
                </div>
                <Progress value={analysisResults.risk_indicators.coordination * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Reaction Time</span>
                  <span>{(analysisResults.risk_indicators.reaction_time * 100).toFixed(0)}%</span>
                </div>
                <Progress value={analysisResults.risk_indicators.reaction_time * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Fine Motor Control</span>
                  <span>{(analysisResults.risk_indicators.fine_motor_control * 100).toFixed(0)}%</span>
                </div>
                <Progress value={analysisResults.risk_indicators.fine_motor_control * 100} className="h-2" />
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="font-medium mb-2">Recommendations</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Regular physical exercise to maintain coordination</li>
                <li>• Hand and finger exercises for fine motor control</li>
                <li>• Consider occupational therapy if patterns persist</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Simple task component for demonstration
function TaskComponent({ task, onComplete }: { task: any; onComplete: (data: any) => void }) {
  const [taskTime, setTaskTime] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      // Auto-complete task after duration
      onComplete({ score: Math.random() * 0.3 + 0.7, duration: task.duration })
    }, task.duration * 1000)

    const interval = setInterval(() => {
      setTaskTime((prev) => prev + 1)
    }, 1000)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [task, onComplete])

  return (
    <div className="text-center space-y-4">
      <div className="w-32 h-32 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
        <Target className="h-16 w-16 text-accent" />
      </div>
      <div className="text-lg font-medium">{task.duration - taskTime}s remaining</div>
      <p className="text-sm text-muted-foreground">Follow the task instructions above</p>
    </div>
  )
}
