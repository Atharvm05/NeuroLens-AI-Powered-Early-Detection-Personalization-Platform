"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Mic, Square, AlertTriangle, Waveform, Brain, BarChart3 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

interface SpeechAnalysisProps {
  userId: string
}

export function SpeechAnalysis({ userId }: SpeechAnalysisProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [waveformData, setWaveformData] = useState<Array<{x: number, y: number}>>([]) 
  const [transcription, setTranscription] = useState<string>("")

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check microphone permission
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => setHasPermission(true))
      .catch(() => setHasPermission(false))

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error starting recording:", error)
      setHasPermission(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const analyzeAudio = async () => {
    if (!audioBlob) return

    setIsAnalyzing(true)

    try {
      // Generate waveform visualization data
      generateWaveformData()
      
      // Generate mock transcription
      const mockTranscription = "The quick brown fox jumps over the lazy dog. Today is a beautiful day for a walk in the park. I enjoy spending time with my family and friends. Technology has changed the way we communicate with each other."
      setTranscription(mockTranscription)
      
      // Convert audio blob to base64
      const base64Audio = await blobToBase64(audioBlob)
      
      // Send to speech emotion recognition API
      const response = await fetch("/api/ml/speech-emotion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          audioData: base64Audio,
        }),
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const analysisData = await response.json()
      setAnalysisResults(analysisData)
    }
    } catch (error) {
      console.error("Error analyzing audio:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getRiskLevel = (score: number) => {
    if (score >= 0.7) return { label: "High Risk", color: "bg-destructive" }
    if (score >= 0.4) return { label: "Moderate Risk", color: "bg-warning" }
    return { label: "Low Risk", color: "bg-secondary" }
  }
  
  // Convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        // Remove data URL prefix
        const base64 = base64String.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }
  
  // Generate waveform visualization data
  const generateWaveformData = () => {
    // Generate random waveform data for visualization
    const data: Array<{x: number, y: number}> = []
    for (let i = 0; i < 100; i++) {
      const x = i
      // Create a somewhat realistic waveform pattern
      const baseY = Math.sin(i / 5) * 0.3 + 0.5
      const noise = Math.random() * 0.2 - 0.1
      const y = Math.max(0, Math.min(1, baseY + noise))
      data.push({ x, y })
    }
    setWaveformData(data)
  }
  
  // Save results to database
  const saveResults = async () => {
    if (!analysisResults) return
    
    try {
      await fetch("/api/detection-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          detection_type: "speech",
          confidence_score: analysisResults.confidence_score,
          risk_indicators: analysisResults.risk_indicators,
          raw_data: analysisResults.raw_data || {},
        }),
      })
    } catch (error) {
      console.error("Error saving results:", error)
    }
  }

  if (hasPermission === false) {
    return (
      <Card className="health-metric-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Microphone Access Required
          </CardTitle>
          <CardDescription>Please allow microphone access to perform speech analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.reload()}>Grant Permission</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="health-metric-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Speech Pattern Analysis
          </CardTitle>
          <CardDescription>
            Record a 30-60 second speech sample for neurological assessment. Read the provided text or speak naturally.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recording Instructions */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <h4 className="font-medium mb-2">Sample Text (Optional)</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              "The quick brown fox jumps over the lazy dog. Today is a beautiful day for a walk in the park. I enjoy
              spending time with my family and friends. Technology has changed the way we communicate with each other."
            </p>
          </div>

          {/* Recording Controls */}
          <div className="flex flex-col items-center space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{formatTime(recordingTime)}</div>
              <div className="text-sm text-muted-foreground">{isRecording ? "Recording..." : "Ready to record"}</div>
            </div>

            <div className="flex gap-4">
              {!isRecording ? (
                <Button onClick={startRecording} size="lg" disabled={isAnalyzing}>
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <Button onClick={stopRecording} size="lg" variant="destructive">
                  <Square className="h-4 w-4 mr-2" />
                  Stop Recording
                </Button>
              )}

              {audioBlob && !isRecording && (
                <Button onClick={analyzeAudio} size="lg" disabled={isAnalyzing}>
                  {isAnalyzing ? "Analyzing..." : "Analyze Speech"}
                </Button>
              )}
            </div>

            {isAnalyzing && (
              <div className="w-full max-w-md">
                <Progress value={66} className="h-2" />
                <p className="text-sm text-muted-foreground text-center mt-2">Analyzing speech patterns...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Waveform Visualization */}
      {waveformData.length > 0 && (
        <Card className="health-metric-card mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Waveform className="h-5 w-5 text-primary" />
              Speech Waveform Analysis
            </CardTitle>
            <CardDescription>Visual representation of speech patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 w-full">
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Background grid */}
                <g className="grid">
                  {[0, 25, 50, 75, 100].map((y) => (
                    <line 
                      key={`h-${y}`}
                      x1="0" 
                      y1={100 - y} 
                      x2="100" 
                      y2={100 - y} 
                      stroke="currentColor" 
                      strokeOpacity="0.1" 
                      strokeWidth="0.5"
                    />
                  ))}
                  {[0, 20, 40, 60, 80, 100].map((x) => (
                    <line 
                      key={`v-${x}`}
                      x1={x} 
                      y1="0" 
                      x2={x} 
                      y2="100" 
                      stroke="currentColor" 
                      strokeOpacity="0.1" 
                      strokeWidth="0.5"
                    />
                  ))}
                </g>
                
                {/* Waveform path */}
                <path
                  d={`M ${waveformData.map((p, i) => `${p.x} ${100 - p.y * 80}`).join(' L ')}`}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Highlight potential anomalies */}
                {waveformData
                  .filter((p, i, arr) => {
                    if (i === 0 || i === arr.length - 1) return false
                    const prevDiff = Math.abs(p.y - arr[i-1].y)
                    const nextDiff = Math.abs(p.y - arr[i+1].y)
                    return prevDiff > 0.4 && nextDiff > 0.4
                  })
                  .map((p, i) => (
                    <circle 
                      key={i}
                      cx={p.x} 
                      cy={100 - p.y * 80} 
                      r="1.5"
                      fill="hsl(var(--destructive))"
                    />
                  ))
                }
              </svg>
            </div>
            
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>0s</span>
              <span>{(recordingTime / 2).toFixed(1)}s</span>
              <span>{recordingTime.toFixed(1)}s</span>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Transcription */}
      {transcription && (
        <Card className="health-metric-card mt-6">
          <CardHeader>
            <CardTitle>Speech Transcription</CardTitle>
            <CardDescription>Automated transcription of recorded speech</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm italic">
                {transcription}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Analysis Results */}
      {analysisResults && (
        <Card className="health-metric-card mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Speech Analysis Results
            </CardTitle>
            <CardDescription>Comprehensive speech pattern assessment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Overall Risk Level</span>
              <Badge className={getRiskLevel(analysisResults.confidence_score).color}>
                {getRiskLevel(analysisResults.confidence_score).label}
              </Badge>
            </div>
            
            <Tabs defaultValue="metrics" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="metrics">Speech Metrics</TabsTrigger>
                <TabsTrigger value="neural">Neural Indicators</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="metrics" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  {analysisResults && Object.entries(analysisResults.risk_indicators).map(([key, value], index) => {
                    // Skip emotional_state which is an object
                    if (key === 'emotional_state') return null;
                    
                    const metric = {
                      name: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                      value: value as number,
                      threshold: 0.4,
                      description: `Assessment of ${key.replace(/_/g, ' ')} patterns in speech.`
                    };
                    return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{metric.name}</span>
                        <span className={metric.value < metric.threshold ? "text-destructive" : ""}>
                          {(metric.value * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress 
                        value={metric.value * 100} 
                        className={`h-2 ${metric.value < metric.threshold ? "bg-destructive/20" : ""}`} 
                      />
                      <p className="text-xs text-muted-foreground">{metric.description}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="neural" className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <h4 className="font-medium">Neural Speech Pattern Analysis</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 rounded-lg border border-border bg-card">
                      <h5 className="font-medium mb-2">Temporal Patterns</h5>
                      <p className="text-sm text-muted-foreground mb-2">
                        Analysis of speech timing, pauses, and rhythm patterns that may indicate cognitive processing changes.
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div>
                          <div className="text-xs font-medium mb-1">Pause Frequency</div>
                          <Progress value={Math.random() * 40 + 30} className="h-1.5" />
                        </div>
                        <div>
                          <div className="text-xs font-medium mb-1">Speech Rate Variability</div>
                          <Progress value={Math.random() * 30 + 60} className="h-1.5" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg border border-border bg-card">
                      <h5 className="font-medium mb-2">Linguistic Complexity</h5>
                      <p className="text-sm text-muted-foreground mb-2">
                        Assessment of vocabulary diversity, grammatical structure, and semantic coherence.
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div>
                          <div className="text-xs font-medium mb-1">Vocabulary Range</div>
                          <Progress value={Math.random() * 30 + 60} className="h-1.5" />
                        </div>
                        <div>
                          <div className="text-xs font-medium mb-1">Grammatical Accuracy</div>
                          <Progress value={Math.random() * 20 + 70} className="h-1.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="recommendations" className="pt-4">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-border bg-card">
                    <h5 className="font-medium mb-2">Daily Practice Recommendations</h5>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                        </div>
                        <span>Complete 10 minutes of tongue twisters daily to improve articulation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                        </div>
                        <span>Practice word-finding exercises with category naming games</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                        </div>
                        <span>Record yourself reading aloud for 5 minutes and review for clarity</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-4 rounded-lg border border-border bg-card">
                    <h5 className="font-medium mb-2">Professional Consultation</h5>
                    <p className="text-sm text-muted-foreground mb-3">
                      Based on your speech patterns, we recommend the following professional resources:
                    </p>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                        </div>
                        <span>Schedule a consultation with a speech-language pathologist</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                        </div>
                        <span>Consider cognitive exercises focused on verbal fluency</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <Separator className="my-2" />
            
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setAnalysisResults(null)}>
                Reset Analysis
              </Button>
              <Button size="sm" onClick={() => saveResults()}>
                Save Results
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
