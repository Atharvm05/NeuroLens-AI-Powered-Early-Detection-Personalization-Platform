import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Brain, User, Sparkles, Heart, Frown, AlertCircle, HelpCircle, Lightbulb } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ChatMessageProps {
  message: string
  isUser: boolean
  timestamp: string
  user?: SupabaseUser
  sentimentScore?: number | null
  emotions?: Record<string, number> | null
}

export function ChatMessage({ message, isUser, timestamp, user, sentimentScore, emotions }: ChatMessageProps) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getSentimentBadge = (score: number | null) => {
    if (score === null) return null
    if (score >= 0.6) return <Badge className="bg-secondary text-secondary-foreground">Positive</Badge>
    if (score >= 0.2) return <Badge className="bg-accent text-accent-foreground">Neutral</Badge>
    return <Badge className="bg-warning text-warning-foreground">Needs Support</Badge>
  }
  
  const getEmotionIcon = (emotion: string) => {
    switch (emotion) {
      case 'joy':
        return <Heart className="h-3 w-3 text-green-500" />
      case 'sadness':
        return <Frown className="h-3 w-3 text-blue-500" />
      case 'anxiety':
        return <AlertCircle className="h-3 w-3 text-amber-500" />
      case 'anger':
        return <Sparkles className="h-3 w-3 text-red-500" />
      case 'confusion':
        return <HelpCircle className="h-3 w-3 text-purple-500" />
      case 'hope':
        return <Lightbulb className="h-3 w-3 text-yellow-500" />
      default:
        return <Sparkles className="h-3 w-3" />
    }
  }
  
  const getDominantEmotion = () => {
    if (!emotions) return null
    
    return Object.entries(emotions)
      .sort((a, b) => b[1] - a[1])
      .filter(([_, value]) => value > 0)[0]?.[0] || null
  }
  
  const dominantEmotion = getDominantEmotion()

  const userInitials = user?.email?.[0]?.toUpperCase() || "U"

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <Avatar className="h-8 w-8 bg-primary/10 flex-shrink-0">
          <AvatarFallback className="text-primary">
            <Brain className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`max-w-[70%] ${isUser ? "order-first" : ""}`}>
        <Card className={`p-3 ${isUser ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"}`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
        </Card>

        <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${isUser ? "justify-end" : ""}`}>
          <span>{formatTime(timestamp)}</span>
          {!isUser && sentimentScore !== undefined && getSentimentBadge(sentimentScore)}
          
          {!isUser && dominantEmotion && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="flex items-center gap-1 capitalize border-none bg-transparent">
                    {getEmotionIcon(dominantEmotion)}
                    <span className="text-xs">{dominantEmotion}</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1 w-36">
                    <p className="text-xs font-medium">Detected Emotions:</p>
                    {emotions && Object.entries(emotions)
                      .filter(([_, value]) => value > 0)
                      .sort((a, b) => b[1] - a[1])
                      .map(([emotion, value]) => (
                        <div key={emotion} className="flex items-center justify-between">
                          <span className="text-xs capitalize flex items-center gap-1">
                            {getEmotionIcon(emotion)}
                            {emotion}
                          </span>
                          <span className="text-xs">{Math.round(value * 100)}%</span>
                        </div>
                      ))
                    }
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 bg-secondary/10 flex-shrink-0">
          <AvatarFallback className="text-secondary">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
