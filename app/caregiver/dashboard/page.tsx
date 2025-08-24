'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, Brain, Activity, Calendar, MessageSquare, AlertTriangle, ChevronRight } from 'lucide-react'
import { LineChart } from '@/components/ui/line-chart'

export default function CaregiverDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [carePatients, setCarePatients] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [cognitiveScores, setCognitiveScores] = useState<any[]>([])
  const [detectionResults, setDetectionResults] = useState<any[]>([])
  const [wellnessPlan, setWellnessPlan] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    // Get user ID and email from localStorage
    const userEmail = localStorage.getItem('userEmail')
    
    if (!userEmail) {
      setError('You need to be logged in to access this page')
      setLoading(false)
      return
    }

    // Fetch patients for whom the current user is a caregiver
    const fetchCarePatients = async () => {
      try {
        // Fetch all caregiver relationships where this user's email is the caregiver
        const response = await fetch(`/api/caregivers?caregiverEmail=${encodeURIComponent(userEmail)}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch patients')
        }

        if (!data.caregivers || data.caregivers.length === 0) {
          setLoading(false)
          return
        }

        // Get active caregiver relationships
        const activeRelationships = data.caregivers.filter((rel: any) => rel.status === 'active')
        setCarePatients(activeRelationships)

        // Set the first patient as selected by default
        if (activeRelationships.length > 0) {
          setSelectedPatient(activeRelationships[0])
          // Fetch data for the first patient
          await fetchPatientData(activeRelationships[0].user_id)
        }

        setLoading(false)
      } catch (err: any) {
        setError(err.message || 'An error occurred')
        setLoading(false)
      }
    }

    fetchCarePatients()
  }, [])

  const fetchPatientData = async (userId: string) => {
    setLoading(true)
    try {
      // Fetch cognitive scores
      const scoresResponse = await fetch(`/api/detection-results?userId=${userId}&type=cognitive&limit=10`)
      const scoresData = await scoresResponse.json()

      if (scoresResponse.ok && scoresData.results) {
        setCognitiveScores(scoresData.results)
      }

      // Fetch recent detection results
      const detectionsResponse = await fetch(`/api/detection-results?userId=${userId}&limit=20`)
      const detectionsData = await detectionsResponse.json()

      if (detectionsResponse.ok && detectionsData.results) {
        setDetectionResults(detectionsData.results)
      }

      // Fetch wellness plan
      const wellnessResponse = await fetch(`/api/wellness-plan?userId=${userId}`)
      const wellnessData = await wellnessResponse.json()

      if (wellnessResponse.ok && wellnessData.plan) {
        setWellnessPlan(wellnessData.plan)
      }

      // Fetch user profile
      const profileResponse = await fetch(`/api/profile?userId=${userId}`)
      const profileData = await profileResponse.json()

      if (profileResponse.ok && profileData.profile) {
        // Update the selected patient with profile data
        setSelectedPatient(prev => ({
          ...prev,
          profile: profileData.profile,
          health_metrics: profileData.health_metrics
        }))
      }

      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch patient data')
      setLoading(false)
    }
  }

  const selectPatient = async (patient: any) => {
    setSelectedPatient(patient)
    await fetchPatientData(patient.user_id)
  }

  const getStatusColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getStatusText = (score: number) => {
    if (score >= 80) return 'Good'
    if (score >= 60) return 'Moderate'
    return 'Needs Attention'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading && !selectedPatient) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Loading Caregiver Dashboard</CardTitle>
            <CardDescription>Please wait while we retrieve your patients' data</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.push('/')}>
            Return to Home
          </Button>
        </div>
      </div>
    )
  }

  if (carePatients.length === 0) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Caregiver Dashboard</CardTitle>
            <CardDescription>You are not currently a caregiver for any patients</CardDescription>
          </CardHeader>
          <CardContent>
            <p>When someone adds you as a caregiver, they will appear here.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => router.push('/')}>
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Prepare chart data for cognitive scores
  const chartData = {
    labels: cognitiveScores.map(score => formatDate(score.created_at)).reverse(),
    datasets: [
      {
        label: 'Cognitive Score',
        data: cognitiveScores.map(score => score.confidence_score).reverse(),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
      },
    ],
  }

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Patient List Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Your Patients</CardTitle>
              <CardDescription>Select a patient to view their data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {carePatients.map((patient) => (
                  <div 
                    key={patient.id} 
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedPatient?.id === patient.id ? 'bg-primary/10' : 'hover:bg-muted'}`}
                    onClick={() => selectPatient(patient)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{patient.user_id.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{patient.profile?.full_name || 'Patient'}</p>
                        <p className="text-sm text-muted-foreground">{patient.access_level === 'manage' ? 'Full Access' : 'View Only'}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Patient Overview */}
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedPatient?.profile?.full_name || 'Patient'}</CardTitle>
                      <CardDescription>
                        {selectedPatient?.profile?.gender}, {selectedPatient?.profile?.birth_date ? 
                          `${new Date().getFullYear() - new Date(selectedPatient.profile.birth_date).getFullYear()} years old` : 
                          'Age not provided'}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(cognitiveScores[0]?.confidence_score || 0)}
                    >
                      {getStatusText(cognitiveScores[0]?.confidence_score || 0)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-4 mb-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="cognitive">Cognitive</TabsTrigger>
                      <TabsTrigger value="wellness">Wellness Plan</TabsTrigger>
                      <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Latest Cognitive Score</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {cognitiveScores[0]?.confidence_score || 'No data'}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Last updated: {cognitiveScores[0] ? formatDate(cognitiveScores[0].created_at) : 'Never'}
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Health Metrics</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Sleep Quality:</span>
                                <span>{selectedPatient?.health_metrics?.sleep_quality || 'No data'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Stress Level:</span>
                                <span>{selectedPatient?.health_metrics?.stress_level || 'No data'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Activity Level:</span>
                                <span>{selectedPatient?.health_metrics?.activity_level || 'No data'}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="md:col-span-2">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Recent Assessments</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {detectionResults.slice(0, 5).map((result) => (
                                <div key={result.id} className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    {result.detection_type === 'facial' && <Activity className="h-4 w-4" />}
                                    {result.detection_type === 'speech' && <MessageSquare className="h-4 w-4" />}
                                    {result.detection_type === 'behavioral' && <Brain className="h-4 w-4" />}
                                    <span className="capitalize">{result.detection_type} Assessment</span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="text-sm">{result.confidence_score}</span>
                                    <span className="text-xs text-muted-foreground">{formatDate(result.created_at)}</span>
                                  </div>
                                </div>
                              ))}
                              {detectionResults.length === 0 && (
                                <p className="text-muted-foreground">No recent assessments</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="cognitive">
                      <Card>
                        <CardHeader>
                          <CardTitle>Cognitive Health Trend</CardTitle>
                          <CardDescription>Tracking cognitive health over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {cognitiveScores.length > 0 ? (
                            <div className="h-[300px]">
                              <LineChart data={chartData} />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-10">
                              <p className="text-muted-foreground">No cognitive data available</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="wellness">
                      <Card>
                        <CardHeader>
                          <CardTitle>Wellness Plan</CardTitle>
                          <CardDescription>
                            {wellnessPlan ? 
                              `Created on ${formatDate(wellnessPlan.created_at)}` : 
                              'No active wellness plan'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {wellnessPlan ? (
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">Focus Areas</h4>
                                <div className="flex flex-wrap gap-2">
                                  {wellnessPlan.focus_areas?.map((area: string, index: number) => (
                                    <Badge key={index} variant="secondary">{area}</Badge>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Activities</h4>
                                <div className="space-y-2">
                                  {wellnessPlan.activities?.map((activity: any, index: number) => (
                                    <div key={index} className="flex justify-between items-center p-2 rounded bg-muted/50">
                                      <span>{activity.name}</span>
                                      <Badge variant="outline">{activity.category}</Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <Button 
                                variant="outline" 
                                className="w-full" 
                                onClick={() => router.push(`/wellness-plan?userId=${selectedPatient.user_id}`)}
                              >
                                View Full Wellness Plan
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-10">
                              <p className="text-muted-foreground">No wellness plan available</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="history">
                      <Card>
                        <CardHeader>
                          <CardTitle>Assessment History</CardTitle>
                          <CardDescription>Complete history of all assessments</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {detectionResults.map((result) => (
                              <div key={result.id} className="flex justify-between items-center p-3 rounded-lg border">
                                <div>
                                  <div className="flex items-center gap-2">
                                    {result.detection_type === 'facial' && <Activity className="h-4 w-4" />}
                                    {result.detection_type === 'speech' && <MessageSquare className="h-4 w-4" />}
                                    {result.detection_type === 'behavioral' && <Brain className="h-4 w-4" />}
                                    <span className="font-medium capitalize">{result.detection_type} Assessment</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{formatDate(result.created_at)}</p>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">{result.confidence_score}</div>
                                  <Badge 
                                    variant="outline" 
                                    className={getStatusColor(result.confidence_score)}
                                  >
                                    {getStatusText(result.confidence_score)}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                            {detectionResults.length === 0 && (
                              <p className="text-muted-foreground text-center py-10">No assessment history available</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}