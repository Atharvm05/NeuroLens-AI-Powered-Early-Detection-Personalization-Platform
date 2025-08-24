"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle, Sparkles } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

export function AICompanionWidget() {
  const [isExpanded, setIsExpanded] = useState(false)

  const quickSuggestions = [
    "How am I doing today?",
    "Suggest a brain exercise",
    "Explain my mood trend",
    "Tips for better sleep",
  ]

  return (
    <Card className="health-metric-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Health Companion
        </CardTitle>
        <CardDescription>Your personal neurological health assistant</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <MessageCircle className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Good morning!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your cognitive score is looking great today. Would you like me to suggest some activities to maintain
                this momentum?
              </p>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Quick questions:</p>
            {quickSuggestions.map((suggestion, index) => (
              <Button key={index} variant="ghost" size="sm" className="w-full justify-start text-left h-auto p-2">
                <span className="text-xs">{suggestion}</span>
              </Button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Link href="/chat" className="flex-1">
            <Button className="w-full">Chat Now</Button>
          </Link>
          <Link href="/chat">
            <Button variant="outline" size="icon">
              <MessageCircle className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
