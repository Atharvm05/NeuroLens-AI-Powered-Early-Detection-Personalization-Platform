'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, Heart, Activity, Moon, Zap, AlertTriangle, Plus, Trash2, RefreshCw } from 'lucide-react'
import { LineChart } from '@/components/ui/line-chart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'

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

export default function WearableDataPage() {
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
  const [userId, setUserId] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newDataEntry, setNewDataEntry] = useState({
    device_type: 'smartwatch',
    data_type: 'heart_rate',
    value: 0,
    unit: '',
    timestamp: new Date().toISOString().slice(0, 16),
  })

  useEffect(() => {
    // Get user ID from localStorage
    const id = localStorage.getItem('userId')
    if (id) {
      setUserId(id)
      fetchWearableData(id)
    } else {
      setError('User ID not found. Please log in again.')
      setLoading(false)
    }
  }, [])

  const fetchWearableData = async (id: string) => {
    setLoading(true)
    try {
      // Fetch data for each type
      const dataTypes = ['heart_rate', 'sleep', 'activity', 'stress']
      const results: Record<string, WearableData[]> = {}
      const devices = new Set<string>()
      let latestTimestamp = null

      for (const dataType of dataTypes) {
        const response = await fetch(`/api/wearable-data?userId=${id}&data_type=${dataType}&limit=30`)
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

  const addWearableData = async () => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'User ID not found. Please log in again.',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch('/api/wearable-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          device_type: newDataEntry.device_type,
          data_type: newDataEntry.data_type,
          timestamp: new Date(newDataEntry.timestamp).toISOString(),
          value: Number(newDataEntry.value),
          unit: newDataEntry.unit || getDefaultUnit(newDataEntry.data_type),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add wearable data')
      }

      toast({
        title: 'Success',
        description: 'Wearable data added successfully',
      })

      // Reset form and close dialog
      setNewDataEntry({
        device_type: 'smartwatch',
        data_type: 'heart_rate',
        value: 0,
        unit: '',
        timestamp: new Date().toISOString().slice(0, 16),
      })
      setIsAddDialogOpen(false)

      // Refresh data
      if (userId) fetchWearableData(userId)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to add wearable data',
        variant: 'destructive',
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
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

  const getDefaultUnit = (dataType: string) => {
    switch (dataType) {
      case 'heart_rate':
        return 'bpm'
      case 'sleep':
        return 'hours'
      case 'activity':
        return 'steps'
      case 'stress':
        return 'level'
      case 'blood_pressure':
        return 'mmHg'
      case 'blood_glucose':
        return 'mg/dL'
      default:
        return ''
    }
  }

  const getStatusText = (dataType: string, value: number) => {
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

  const getStatusColor = (dataType: string, value: number) => {
    const status = getStatusText(dataType, value)
    
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

  if (loading && !Object.values(wearableData).some(data => data.length > 0)) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Wearable Health Data</CardTitle>
            <CardDescription>Loading your health data from connected devices</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Wearable Health Data</CardTitle>
            <CardDescription>There was an error loading your health data</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Wearable Health Data</h1>
          <p className="text-muted-foreground">
            {connectedDevices.length > 0 ? 
              `Connected to ${connectedDevices.map(d => d.replace('_', ' ')).join(', ')}` : 
              'No devices connected'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => userId && fetchWearableData(userId)}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Wearable Data</DialogTitle>
                <DialogDescription>
                  Manually add health data from your wearable devices
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="device_type">Device Type</Label>
                    <Select 
                      value={newDataEntry.device_type} 
                      onValueChange={(value) => setNewDataEntry({...newDataEntry, device_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select device type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smartwatch">Smartwatch</SelectItem>
                        <SelectItem value="fitness_tracker">Fitness Tracker</SelectItem>
                        <SelectItem value="sleep_monitor">Sleep Monitor</SelectItem>
                        <SelectItem value="medical_device">Medical Device</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_type">Data Type</Label>
                    <Select 
                      value={newDataEntry.data_type} 
                      onValueChange={(value) => setNewDataEntry({
                        ...newDataEntry, 
                        data_type: value,
                        unit: getDefaultUnit(value)
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select data type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="heart_rate">Heart Rate</SelectItem>
                        <SelectItem value="sleep">Sleep</SelectItem>
                        <SelectItem value="activity">Activity</SelectItem>
                        <SelectItem value="stress">Stress</SelectItem>
                        <SelectItem value="blood_pressure">Blood Pressure</SelectItem>
                        <SelectItem value="blood_glucose">Blood Glucose</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="value">Value</Label>
                    <Input 
                      id="value" 
                      type="number" 
                      value={newDataEntry.value} 
                      onChange={(e) => setNewDataEntry({...newDataEntry, value: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input 
                      id="unit" 
                      value={newDataEntry.unit || getDefaultUnit(newDataEntry.data_type)} 
                      onChange={(e) => setNewDataEntry({...newDataEntry, unit: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timestamp">Timestamp</Label>
                  <Input 
                    id="timestamp" 
                    type="datetime-local" 
                    value={newDataEntry.timestamp} 
                    onChange={(e) => setNewDataEntry({...newDataEntry, timestamp: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={addWearableData}>Add Data</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {['heart_rate', 'sleep', 'activity', 'stress'].map(dataType => {
          const data = wearableData[dataType];
          const latestData = data && data.length > 0 ? data[0] : null;
          
          return (
            <Card key={dataType} className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getDataTypeIcon(dataType)}
                  <span className="text-sm font-medium">{getDataTypeLabel(dataType)}</span>
                </div>
                {latestData ? (
                  <>
                    <div className="text-2xl font-bold">
                      {latestData.value} {latestData.unit || getDefaultUnit(dataType)}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(dataType, latestData.value)}
                      >
                        {getStatusText(dataType, latestData.value)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(latestData.timestamp)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground">No data</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Health Trends</CardTitle>
          <CardDescription>
            Track your health metrics over time
            {lastSync && (
              <span className="block text-xs mt-1">
                Last synced: {new Date(lastSync).toLocaleString()}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data History</CardTitle>
          <CardDescription>View and manage your wearable health data</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.values(wearableData)
                .flat()
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 20)
                .map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDataTypeIcon(item.data_type)}
                        <span>{getDataTypeLabel(item.data_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.value} {item.unit || getDefaultUnit(item.data_type)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(item.data_type, item.value)}
                      >
                        {getStatusText(item.data_type, item.value)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{item.device_type.replace('_', ' ')}</span>
                    </TableCell>
                    <TableCell>
                      {formatDateTime(item.timestamp)}
                    </TableCell>
                  </TableRow>
                ))}
              {Object.values(wearableData).flat().length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No wearable data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}