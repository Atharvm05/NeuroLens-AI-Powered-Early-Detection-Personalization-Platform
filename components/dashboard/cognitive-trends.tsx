'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Loader2, TrendingUp, TrendingDown, Minus, Calendar, Activity, Brain } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface CognitiveScore {
  id: string
  user_id: string
  score: number
  status: string
  areas_of_concern: string[]
  created_at: string
}

interface DetectionResult {
  id: string
  user_id: string
  detection_type: string
  confidence_score: number
  risk_indicators: Record<string, any>
  created_at: string
}

interface TrendData {
  date: string
  cognitiveScore: number
  facialScore?: number
  speechScore?: number
  behavioralScore?: number
}

export default function CognitiveTrends() {
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('week')
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [latestScore, setLatestScore] = useState<CognitiveScore | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch cognitive scores
        const scoresResponse = await fetch(`/api/detection-results?userId=${localStorage.getItem('userId')}&type=cognitive&timeframe=${timeframe}`)
        
        if (!scoresResponse.ok) {
          throw new Error('Failed to fetch cognitive scores')
        }
        
        const scoresData = await scoresResponse.json()
        
        // Fetch trend analysis
        const trendsResponse = await fetch(
          `/api/detection-results?userId=${localStorage.getItem('userId')}&timeframe=${timeframe}`,
          { method: 'PATCH' }
        )
        
        if (!trendsResponse.ok) {
          throw new Error('Failed to fetch trend analysis')
        }
        
        const trendsData = await trendsResponse.json()
        
        // Set latest cognitive score
        if (scoresData.results && scoresData.results.length > 0) {
          setLatestScore(scoresData.results[0])
        }
        
        // Process and format trend data
        const formattedData = trendsData.trends.map((item: any) => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          cognitiveScore: item.cognitive_score || 0,
          facialScore: item.facial_score || 0,
          speechScore: item.speech_score || 0,
          behavioralScore: item.behavioral_score || 0
        }))
        
        setTrendData(formattedData)
      } catch (err) {
        console.error('Error fetching trend data:', err)
        setError('Failed to load trend data. Please try again later.')
        toast({
          title: 'Error',
          description: 'Failed to load cognitive trend data',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTrendData()
  }, [timeframe, toast])

  const getTrendIcon = (current: number, previous: number) => {
    const difference = current - previous
    if (difference > 5) return <TrendingUp className="text-green-500" />
    if (difference < -5) return <TrendingDown className="text-red-500" />
    return <Minus className="text-yellow-500" />
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'excellent':
        return 'text-green-500'
      case 'good':
        return 'text-blue-500'
      case 'moderate':
        return 'text-yellow-500'
      case 'concerning':
        return 'text-orange-500'
      case 'critical':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Cognitive Health Trends
        </CardTitle>
        <CardDescription>
          Track your cognitive health metrics over time
        </CardDescription>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="day" onClick={() => setTimeframe('day')}>Day</TabsTrigger>
          <TabsTrigger value="week" onClick={() => setTimeframe('week')}>Week</TabsTrigger>
          <TabsTrigger value="month" onClick={() => setTimeframe('month')}>Month</TabsTrigger>
          <TabsTrigger value="year" onClick={() => setTimeframe('year')}>Year</TabsTrigger>
        </TabsList>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => setTimeframe(timeframe)}>Retry</Button>
          </div>
        ) : (
          <>
            {latestScore && (
              <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Current Cognitive Status</h3>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Score</p>
                    <p className="text-2xl font-bold">{latestScore.score}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className={`text-xl font-semibold ${getStatusColor(latestScore.status)}`}>
                      {latestScore.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="text-sm">
                      {new Date(latestScore.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                {latestScore.areas_of_concern && latestScore.areas_of_concern.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground">Areas of Focus</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {latestScore.areas_of_concern.map((area, index) => (
                        <span 
                          key={index} 
                          className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }} 
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cognitiveScore"
                    name="Cognitive Score"
                    stroke="#8884d8"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="facialScore"
                    name="Facial Analysis"
                    stroke="#82ca9d"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="speechScore"
                    name="Speech Analysis"
                    stroke="#ffc658"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="behavioralScore"
                    name="Behavioral Analysis"
                    stroke="#ff8042"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-6">
              <Card className="bg-muted/30">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Next Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-lg font-semibold">
                    {new Date(Date.now() + 86400000).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-muted/30">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    <Activity className="h-4 w-4" />
                    Weekly Change
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold">
                      {trendData.length >= 2 
                        ? `${(trendData[trendData.length - 1].cognitiveScore - trendData[0].cognitiveScore).toFixed(1)}%` 
                        : 'N/A'}
                    </p>
                    {trendData.length >= 2 && getTrendIcon(
                      trendData[trendData.length - 1].cognitiveScore, 
                      trendData[0].cognitiveScore
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-muted/30">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    <Brain className="h-4 w-4" />
                    Wellness Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href="/wellness-plan">View Plan</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}