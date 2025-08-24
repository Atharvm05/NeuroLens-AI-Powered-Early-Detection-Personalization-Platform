'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Calendar, Brain, Activity, Heart, Clock, CheckCircle2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface Activity {
  id: string
  title: string
  description: string
  frequency: string
  duration_minutes: number
  difficulty: string
  category: string
}

interface Schedule {
  recommended_time_of_day: Record<string, string>
  weekly_distribution: Record<string, string[]>
  adaptability: string
}

interface WellnessPlan {
  id: string
  user_id: string
  title: string
  description: string
  activities: Activity[]
  schedule: Schedule
  is_active: boolean
  created_at: string
}

interface ActivityProgress {
  id: string
  activity_id: string
  completed: boolean
  notes: string
  completed_at: string | null
}

export default function WellnessPlanPage() {
  const [plan, setPlan] = useState<WellnessPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [progress, setProgress] = useState<Record<string, ActivityProgress>>({})  
  const [selectedDay, setSelectedDay] = useState<string>(
    ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
      new Date().getDay()
    ]
  )
  const [activityNotes, setActivityNotes] = useState<Record<string, string>>({})
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchWellnessPlan = async () => {
      try {
        setLoading(true)
        setError(null)

        const userId = localStorage.getItem('userId')
        if (!userId) {
          router.push('/login')
          return
        }

        const response = await fetch(`/api/wellness-plan?userId=${userId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch wellness plan')
        }
        
        const data = await response.json()
        
        if (data.plan) {
          setPlan(data.plan)
          
          // Initialize activity notes
          const notesObj: Record<string, string> = {}
          data.plan.activities.forEach((activity: Activity) => {
            notesObj[activity.id] = ''
          })
          setActivityNotes(notesObj)
        } else {
          setError('No active wellness plan found')
        }
      } catch (err) {
        console.error('Error fetching wellness plan:', err)
        setError('Failed to load wellness plan. Please try again later.')
        toast({
          title: 'Error',
          description: 'Failed to load wellness plan',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchWellnessPlan()
  }, [router, toast])

  const handleActivityToggle = async (activityId: string, completed: boolean) => {
    try {
      const userId = localStorage.getItem('userId')
      if (!userId || !plan) return

      // Optimistically update UI
      setProgress(prev => ({
        ...prev,
        [activityId]: {
          id: prev[activityId]?.id || '',
          activity_id: activityId,
          completed,
          notes: activityNotes[activityId] || '',
          completed_at: completed ? new Date().toISOString() : null
        }
      }))

      // Send update to server
      const response = await fetch('/api/wellness-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          planId: plan.id,
          activityId,
          completed,
          notes: activityNotes[activityId] || ''
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update activity progress')
      }

      const data = await response.json()
      
      // Update with server response
      setProgress(prev => ({
        ...prev,
        [activityId]: data.progress
      }))

      toast({
        title: completed ? 'Activity Completed' : 'Activity Marked Incomplete',
        description: `Successfully updated progress for ${plan.activities.find(a => a.id === activityId)?.title}`,
        variant: 'default'
      })
    } catch (err) {
      console.error('Error updating activity progress:', err)
      toast({
        title: 'Error',
        description: 'Failed to update activity progress',
        variant: 'destructive'
      })

      // Revert optimistic update
      setProgress(prev => ({
        ...prev,
        [activityId]: {
          ...prev[activityId],
          completed: !completed
        }
      }))
    }
  }

  const handleNotesChange = (activityId: string, notes: string) => {
    setActivityNotes(prev => ({
      ...prev,
      [activityId]: notes
    }))
  }

  const calculateCompletionPercentage = () => {
    if (!plan) return 0
    
    const totalActivities = plan.activities.length
    const completedActivities = Object.values(progress).filter(p => p.completed).length
    
    return Math.round((completedActivities / totalActivities) * 100)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cognitive':
        return <Brain className="h-5 w-5" />
      case 'physical':
        return <Activity className="h-5 w-5" />
      case 'wellness':
      case 'social':
        return <Heart className="h-5 w-5" />
      case 'monitoring':
        return <Calendar className="h-5 w-5" />
      default:
        return <Brain className="h-5 w-5" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-500 bg-green-100'
      case 'moderate':
        return 'text-yellow-500 bg-yellow-100'
      case 'challenging':
        return 'text-orange-500 bg-orange-100'
      case 'adaptive':
        return 'text-blue-500 bg-blue-100'
      default:
        return 'text-gray-500 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Wellness Plan</CardTitle>
            <CardDescription>Personalized cognitive wellness recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Brain className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Wellness Plan Available</h3>
              <p className="text-muted-foreground mb-6">
                {error || 'We couldn\'t find an active wellness plan for you.'}
              </p>
              <Button onClick={() => window.location.reload()}>Refresh</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const todayActivities = plan.schedule.weekly_distribution[selectedDay] || []
  const filteredActivities = plan.activities.filter(activity => 
    todayActivities.includes(activity.id)
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{plan.title}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="text-sm font-medium">
                {new Date(plan.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium">Overall Progress</p>
              <p className="text-sm font-medium">{calculateCompletionPercentage()}%</p>
            </div>
            <Progress value={calculateCompletionPercentage()} className="h-2" />
          </div>
          
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="daily">Daily Plan</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan.activities.map(activity => (
                  <Card key={activity.id} className="overflow-hidden">
                    <div className="flex items-center p-4 border-b">
                      <div className="mr-3">
                        {getCategoryIcon(activity.category)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{activity.title}</h3>
                        <p className="text-sm text-muted-foreground">{activity.category}</p>
                      </div>
                      <div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(activity.difficulty)}`}>
                          {activity.difficulty}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm mb-3">{activity.description}</p>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{activity.duration_minutes} min</span>
                        </div>
                        <div>
                          <span>Frequency: {activity.frequency}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="daily" className="space-y-4 mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Daily Activities</h3>
                <div className="flex">
                  <select 
                    className="bg-background border rounded-md px-3 py-1 text-sm"
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                  >
                    <option value="monday">Monday</option>
                    <option value="tuesday">Tuesday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="thursday">Thursday</option>
                    <option value="friday">Friday</option>
                    <option value="saturday">Saturday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </div>
              </div>
              
              {filteredActivities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No activities scheduled for this day</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredActivities.map(activity => (
                    <Card key={activity.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start">
                          <div className="mr-3 mt-1">
                            <Checkbox 
                              id={`activity-${activity.id}`}
                              checked={progress[activity.id]?.completed || false}
                              onCheckedChange={(checked) => 
                                handleActivityToggle(activity.id, checked as boolean)
                              }
                            />
                          </div>
                          <div className="flex-1">
                            <label 
                              htmlFor={`activity-${activity.id}`}
                              className="font-medium cursor-pointer"
                            >
                              {activity.title}
                            </label>
                            <p className="text-sm text-muted-foreground mb-2">
                              {activity.duration_minutes} minutes • {activity.difficulty}
                            </p>
                            <p className="text-sm mb-4">{activity.description}</p>
                            
                            <Textarea
                              placeholder="Add notes about your experience..."
                              value={activityNotes[activity.id] || ''}
                              onChange={(e) => handleNotesChange(activity.id, e.target.value)}
                              className="text-sm"
                            />
                            
                            {progress[activity.id]?.completed && (
                              <div className="flex items-center mt-3 text-sm text-green-600">
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                <span>Completed {progress[activity.id]?.completed_at ? 
                                  new Date(progress[activity.id].completed_at as string).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit'
                                  }) : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="recommendations" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Lifestyle Recommendations</CardTitle>
                  <CardDescription>
                    Additional recommendations to support your cognitive wellness
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Sleep</h4>
                      <p className="text-sm">{plan.schedule.recommended_time_of_day.relaxation}</p>
                    </div>
                    
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Nutrition</h4>
                      <p className="text-sm">Follow a Mediterranean-style diet rich in omega-3 fatty acids, antioxidants, and whole foods.</p>
                    </div>
                    
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Hydration</h4>
                      <p className="text-sm">Drink at least 8 glasses of water daily to support optimal brain function.</p>
                    </div>
                    
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Technology Use</h4>
                      <p className="text-sm">Take regular breaks from screens and practice digital detox for at least 1 hour before bedtime.</p>
                    </div>
                    
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Adaptability</h4>
                      <p className="text-sm">{plan.schedule.adaptability}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
          <Button onClick={() => window.print()}>Print Plan</Button>
        </CardFooter>
      </Card>
    </div>
  )
}