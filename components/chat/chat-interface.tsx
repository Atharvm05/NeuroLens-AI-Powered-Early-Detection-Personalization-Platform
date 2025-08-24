"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "./chat-message"
import { ChatHeader } from "./chat-header"
import { QuickActions } from "./quick-actions"
import { Send, Loader2, BrainCircuit, Sparkles } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Conversation {
  id: string
  message: string
  response: string
  sentiment_score: number | null
  emotion_data?: Record<string, number>
  created_at: string
}

interface ChatInterfaceProps {
  user: SupabaseUser
  initialConversations: Conversation[]
}

export function ChatInterface({ user, initialConversations }: ChatInterfaceProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [dominantEmotion, setDominantEmotion] = useState<string | null>(null)
  const [emotionData, setEmotionData] = useState<Record<string, number> | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [conversations])

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || message
    if (!textToSend.trim() || isLoading) return

    setIsLoading(true)
    setMessage("")

    try {
      // Call our new LLM-powered chatbot API
      const response = await fetch("/api/ml/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: textToSend,
          userId: user.id,
          context: {
            previousMessages: conversations.length,
            includeHealthData: true,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get AI response")
      }

      const data = await response.json()
      
      // Process emotion data
      if (data.emotions) {
        setEmotionData(data.emotions)
        // Find dominant emotion
        const dominant = Object.entries(data.emotions)
          .sort((a, b) => b[1] - a[1])
          .filter(([_, value]) => value > 0)[0]?.[0] || null
        setDominantEmotion(dominant)
      }

      // Add to local state immediately for better UX
      const newConversation: Conversation = {
        id: data.id,
        message: textToSend,
        response: data.response,
        sentiment_score: data.sentiment_score,
        emotion_data: data.emotions,
        created_at: new Date().toISOString(),
      }

      setConversations((prev) => [...prev, newConversation])
    } catch (error) {
      console.error("Error sending message:", error)
      // Add error message to chat
      const errorConversation: Conversation = {
        id: `error-${Date.now()}`,
        message: textToSend,
        response: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        sentiment_score: null,
        created_at: new Date().toISOString(),
      }
      setConversations((prev) => [...prev, errorConversation])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <ChatHeader />
      
      {dominantEmotion && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Emotional Analysis</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant={dominantEmotion === 'joy' || dominantEmotion === 'hope' ? 'default' : 'outline'} 
                       className={`capitalize ${dominantEmotion === 'joy' || dominantEmotion === 'hope' ? 'bg-green-500' : 
                                  dominantEmotion === 'sadness' ? 'border-blue-400 text-blue-500' : 
                                  dominantEmotion === 'anxiety' ? 'border-amber-400 text-amber-500' : 
                                  dominantEmotion === 'anger' ? 'border-red-400 text-red-500' : 
                                  dominantEmotion === 'confusion' ? 'border-purple-400 text-purple-500' : ''}`}>
                  <Sparkles className="h-3 w-3 mr-1" />
                  {dominantEmotion}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1 w-48">
                  <p className="text-xs font-medium">Detected Emotions:</p>
                  {emotionData && Object.entries(emotionData)
                    .filter(([_, value]) => value > 0)
                    .sort((a, b) => b[1] - a[1])
                    .map(([emotion, value]) => (
                      <div key={emotion} className="flex items-center justify-between">
                        <span className="text-xs capitalize">{emotion}</span>
                        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${emotion === 'joy' || emotion === 'hope' ? 'bg-green-500' : 
                                      emotion === 'sadness' ? 'bg-blue-500' : 
                                      emotion === 'anxiety' ? 'bg-amber-500' : 
                                      emotion === 'anger' ? 'bg-red-500' : 
                                      emotion === 'confusion' ? 'bg-purple-500' : 'bg-primary'}`}
                            style={{ width: `${value * 100}%` }}
                          />
                        </div>
                      </div>
                    ))
                  }
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {conversations.length === 0 && (
              <div className="text-center py-12">
                <div className="mb-6">
                  <Avatar className="h-16 w-16 mx-auto mb-4 bg-primary/10">
                    <AvatarFallback className="text-primary text-xl">AI</AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Welcome to your AI Health Companion</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    I'm here to support your neurological wellness journey. Ask me about your health metrics, get
                    personalized advice, or just chat about how you're feeling today.
                  </p>
                </div>
                <QuickActions onActionClick={handleSendMessage} />
              </div>
            )}

            {conversations.map((conversation) => (
              <div key={conversation.id} className="space-y-4">
                <ChatMessage
                  message={conversation.message}
                  isUser={true}
                  timestamp={conversation.created_at}
                  user={user}
                />
                <ChatMessage
                  message={conversation.response}
                  isUser={false}
                  timestamp={conversation.created_at}
                  sentimentScore={conversation.sentiment_score}
                  emotions={conversation.emotion_data}
                />
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <Card className="p-4 max-w-xs bg-muted">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">AI is thinking...</span>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your health, request advice, or share how you're feeling..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button onClick={() => handleSendMessage()} disabled={isLoading || !message.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Your conversations are private and help improve your personalized health insights.
          </p>
        </div>
      </div>
    </div>
  )
}
