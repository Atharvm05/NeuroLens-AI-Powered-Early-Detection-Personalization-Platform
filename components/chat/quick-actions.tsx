"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Heart, TrendingUp, Moon, Zap, Activity, Sparkles, Calendar, Lightbulb, Clock } from "lucide-react"

interface QuickActionsProps {
  onActionClick: (message: string) => void
}

export function QuickActions({ onActionClick }: QuickActionsProps) {
  const quickActions = [
    {
      icon: Brain,
      title: "Cognitive Health",
      description: "Check my cognitive score",
      message: "How is my cognitive health looking today? Can you analyze my recent scores and trends?",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Sparkles,
      title: "Emotion Insights",
      description: "Understand my emotions",
      message: "Can you help me understand my emotional patterns based on our recent conversations?",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Heart,
      title: "Mood Analysis",
      description: "Analyze my mood trends",
      message: "Can you analyze my mood trends over the past week and give me insights?",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      icon: TrendingUp,
      title: "Progress Review",
      description: "Review my overall progress",
      message: "Can you give me a comprehensive review of my neurological health progress?",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: Calendar,
      title: "Personalized Plan",
      description: "Get a tailored wellness plan",
      message: "Based on my recent data, can you create a personalized cognitive wellness plan for me?",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Moon,
      title: "Sleep & Wellness",
      description: "Tips for better sleep",
      message: "I'd like some personalized tips for improving my sleep quality based on my recent patterns.",
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      icon: Zap,
      title: "Brain Exercises",
      description: "Suggest activities",
      message: "Can you suggest some brain exercises tailored to my cognitive profile?",
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      icon: Lightbulb,
      title: "Cognitive Insights",
      description: "Get personalized insights",
      message: "What patterns have you noticed in my speech and facial analysis that I should be aware of?",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: Clock,
      title: "Progress Timeline",
      description: "View my journey",
      message: "Can you show me a timeline of my cognitive health journey since I started using NeuroLens?",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: Activity,
      title: "Daily Check-in",
      description: "How am I doing?",
      message: "I'd like to do a daily check-in. How am I doing overall with my neurological health?",
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h4 className="font-medium text-foreground mb-2">Quick Actions</h4>
        <p className="text-sm text-muted-foreground">Choose a topic to get started</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon
          return (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-md transition-shadow border-border hover:border-primary/20"
              onClick={() => onActionClick(action.message)}
            >
              <CardHeader className="pb-2">
                <div className={`p-2 rounded-full ${action.bgColor} w-fit`}>
                  <Icon className={`h-4 w-4 ${action.color}`} />
                </div>
                <CardTitle className="text-sm">{action.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">{action.description}</CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
