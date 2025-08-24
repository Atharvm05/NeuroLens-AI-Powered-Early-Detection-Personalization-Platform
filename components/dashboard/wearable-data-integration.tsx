'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Heart, Activity, Moon, Zap, AlertTriangle } from 'lucide-react'
import { LineChart } from '@/components/ui/line-chart'

interface WearableData {
  id: string
  user_id: string
  device_type: string
  data_type: string
  timestamp: string
  value: number
  unit?: string
  metadata?: Record<string, any>
}

export default function WearableDataIntegration({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('heart_rate')
  const [wearableData, setWearableData] = useState<Record<string, WearableData[]>>({
    heart_rate: [],
    sleep: [],
    activity: [],
    stress: [],
  })
  const [connectedDevices, setConnectedDevices] = useState<string[]>([])
  const [lastSync, setLastSync] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    
    fetchWearableData()
  }, [userId])

  const fetchWearableData = async () => {
    setLoading(true)
    try {
      // Fetch data for each type
      const dataTypes = ['heart_rate', 'sleep', 'activity', 'stress']
      const results: Record<string, WearableData[]> = {}
      const devices = new Set<string>()
      let latestTimestamp = null

      for (const dataType of dataTypes) {
        const response = await fetch(`/api/wearable-data?userId=${userId}&data_type=${dataType}&limit=30`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || `Failed to fetch ${dataType} data`)
        }

        results[dataType] = data.data || []

        // Track connected devices and latest sync time
        results[dataType].forEach(item => {
          devices.add(item.device_type)
          
          const itemTimestamp = new Date(item.timestamp).getTime()
          if (!latestTimestamp || itemTimestamp > latestTimestamp) {
            latestTimestamp = itemTimestamp
          }
        })
      }

      setWearableData(results)
      setConnectedDevices(Array.from(devices))
      setLastSync(latestTimestamp ? new Date(latestTimestamp).toISOString() : null)
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching wearable data')
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDataTypeIcon = (dataType: string) => {
    switch (dataType) {
      case 'heart_rate':
        return <Heart className="h-4 w-4 text-red-500" />
      case 'sleep':
        return <Moon className="h-4 w-4 text-indigo-500" />
      case 'activity':
        return <Activity className="h-4 w-4 text-green-500" />
      case 'stress':
        return <Zap className="h-4 w-4 text-amber-500" />
      default:
        return null
    }
  }

  const getDataTypeLabel = (dataType: string) => {
    switch (dataType) {
      case 'heart_rate':
        return 'Heart Rate'
      case 'sleep':
        return 'Sleep'
      case 'activity':
        return 'Activity'
      case 'stress':
        return 'Stress'
      default:
        return dataType.replace('_', ' ')
    }
  }

  const getDataUnit = (dataType: string) => {
    switch (dataType) {
      case 'heart_rate':
        return 'bpm'
      case 'sleep':
        return 'hours'
      case 'activity':
        return 'steps'
      case 'stress':
        return 'level'
      default:
        return ''
    }
  }

  const getLatestValue = (dataType: string) => {
    const data = wearableData[dataType]
    if (!data || data.length === 0) return 'No data'
    return `${data[0].value} ${data[0].unit || getDataUnit(dataType)}`
  }

  const getStatusText = (dataType: string) => {
    const data = wearableData[dataType]
    if (!data || data.length === 0) return 'No data'

    const value = data[0].value

    switch (dataType) {
      case 'heart_rate':
        if (value < 60) return 'Low'
        if (value > 100) return 'High'
        return 'Normal'
      case 'sleep':
        if (value < 6) return 'Poor'
        if (value >= 8) return 'Excellent'
        return 'Good'
      case 'activity':
        if (value < 5000) return 'Low'
        if (value >= 10000) return 'Excellent'
        return 'Good'
      case 'stress':
        if (value < 30) return 'Low'
        if (value > 70) return 'High'
        return 'Moderate'
      default:
        return 'Normal'
    }
  }

  const getStatusColor = (dataType: string) => {
    const status = getStatusText(dataType)
    
    if (status === 'No data') return ''
    
    switch (dataType) {
      case 'heart_rate':
        return status === 'Normal' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
      case 'sleep':
        return status === 'Poor' ? 'bg-red-100 text-red-800' : 
               status === 'Good' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
      case 'activity':
        return status === 'Low' ? 'bg-red-100 text-red-800' : 
               status === 'Good' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
      case 'stress':
        return status === 'High' ? 'bg-red-100 text-red-800' : 
               status === 'Moderate' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Prepare chart data for the active tab
  const prepareChartData = (dataType: string) => {
    const data = wearableData[dataType] || []
    
    // Sort by timestamp ascending for proper chart display
    const sortedData = [...data].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    return {
      labels: sortedData.map(item => formatDate(item.timestamp)),
      datasets: [
        {
          label: getDataTypeLabel(dataType),
          data: sortedData.map(item => item.value),
          borderColor: dataType === 'heart_rate' ? 'rgb(239, 68, 68)' : 
                       dataType === 'sleep' ? 'rgb(99, 102, 241)' : 
                       dataType === 'activity' ? 'rgb(34, 197, 94)' : 'rgb(245, 158, 11)',
          backgroundColor: dataType === 'heart_rate' ? 'rgba(239, 68, 68, 0.5)' : 
                           dataType === 'sleep' ? 'rgba(99, 102, 241, 0.5)' : 
                           dataType === 'activity' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(245, 158, 11, 0.5)',
        },
      ],
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wearable Data</CardTitle>
          <CardDescription>Loading your health data from connected devices</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wearable Data</CardTitle>
          <CardDescription>There was an error loading your health data</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const hasAnyData = Object.values(wearableData).some(data => data.length > 0)

  if (!hasAnyData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wearable Data</CardTitle>
          <CardDescription>Connect your wearable devices to see health insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <p className="text-muted-foreground text-center">No wearable data available yet</p>
            <Button variant="outline">Connect a Device</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Wearable Health Data</CardTitle>
            <CardDescription>
              {connectedDevices.length > 0 ? 
                `Connected to ${connectedDevices.map(d => d.replace('_', ' ')).join(', ')}` : 
                'No devices connected'}
            </CardDescription>
          </div>
          {lastSync && (
            <div className="text-xs text-muted-foreground">
              Last synced: {new Date(lastSync).toLocaleString()}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {['heart_rate', 'sleep', 'activity', 'stress'].map(dataType => (
            <Card key={dataType} className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getDataTypeIcon(dataType)}
                  <span className="text-sm font-medium">{getDataTypeLabel(dataType)}</span>
                </div>
                <div className="text-2xl font-bold">{getLatestValue(dataType)}</div>
                {wearableData[dataType]?.length > 0 && (
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(dataType)}
                  >
                    {getStatusText(dataType)}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="heart_rate" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="heart_rate">Heart Rate</TabsTrigger>
            <TabsTrigger value="sleep">Sleep</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="stress">Stress</TabsTrigger>
          </TabsList>

          {['heart_rate', 'sleep', 'activity', 'stress'].map(dataType => (
            <TabsContent key={dataType} value={dataType}>
              {wearableData[dataType]?.length > 0 ? (
                <div className="h-[300px]">
                  <LineChart data={prepareChartData(dataType)} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <p className="text-muted-foreground">No {getDataTypeLabel(dataType).toLowerCase()} data available</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={fetchWearableData}>
          Sync Data
        </Button>
      </CardFooter>
    </Card>
  )
}