'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Users, Bell, Shield, Share2, Eye, EyeOff, Copy, Check } from 'lucide-react'
import CognitiveTrends from '@/components/dashboard/cognitive-trends'

interface CaregiverRelationship {
  id: string
  user_id: string
  caregiver_email: string
  access_level: 'view' | 'manage'
  status: 'pending' | 'active' | 'revoked'
  created_at: string
}

export default function CaregiverPortalPage() {
  const [caregivers, setCaregivers] = useState<CaregiverRelationship[]>([])
  const [newCaregiverEmail, setNewCaregiverEmail] = useState('')
  const [accessLevel, setAccessLevel] = useState<'view' | 'manage'>('view')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchCaregivers = async () => {
      try {
        setLoading(true)
        setError(null)

        const userId = localStorage.getItem('userId')
        if (!userId) {
          router.push('/login')
          return
        }

        const response = await fetch(`/api/profile?userId=${userId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile data')
        }
        
        const data = await response.json()
        
        if (data.caregivers) {
          setCaregivers(data.caregivers)
        }
      } catch (err) {
        console.error('Error fetching caregivers:', err)
        setError('Failed to load caregiver relationships. Please try again later.')
        toast({
          title: 'Error',
          description: 'Failed to load caregiver data',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCaregivers()
  }, [router, toast])

  const handleAddCaregiver = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newCaregiverEmail) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive'
      })
      return
    }
    
    try {
      setSubmitting(true)
      
      const userId = localStorage.getItem('userId')
      if (!userId) {
        router.push('/login')
        return
      }
      
      const response = await fetch('/api/caregivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          caregiverEmail: newCaregiverEmail,
          accessLevel
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to add caregiver')
      }
      
      const data = await response.json()
      
      setCaregivers(prev => [...prev, data.caregiver])
      setNewCaregiverEmail('')
      
      toast({
        title: 'Success',
        description: `Invitation sent to ${newCaregiverEmail}`,
        variant: 'default'
      })
      
      // Generate share link
      setShareLink(data.shareLink || `${window.location.origin}/caregiver/invite/${data.caregiver.id}`)
    } catch (err) {
      console.error('Error adding caregiver:', err)
      toast({
        title: 'Error',
        description: 'Failed to add caregiver. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateAccess = async (caregiverId: string, newStatus: 'active' | 'revoked') => {
    try {
      const userId = localStorage.getItem('userId')
      if (!userId) return
      
      const response = await fetch(`/api/caregivers/${caregiverId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          status: newStatus
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update caregiver access')
      }
      
      const data = await response.json()
      
      // Update local state
      setCaregivers(prev => 
        prev.map(cg => 
          cg.id === caregiverId ? { ...cg, status: newStatus } : cg
        )
      )
      
      toast({
        title: 'Success',
        description: `Caregiver access ${newStatus === 'active' ? 'granted' : 'revoked'}`,
        variant: 'default'
      })
    } catch (err) {
      console.error('Error updating caregiver access:', err)
      toast({
        title: 'Error',
        description: 'Failed to update caregiver access',
        variant: 'destructive'
      })
    }
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Caregiver Portal</h1>
          <p className="text-muted-foreground">
            Manage access to your cognitive health data for caregivers and family members.
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Caregiver Relationships
              </CardTitle>
              <CardDescription>
                People who have access to your cognitive health information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {caregivers.length === 0 ? (
                <div className="text-center py-8 border rounded-lg">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Caregivers Added</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    You haven't added any caregivers yet. Add a caregiver to share your cognitive health data with them.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {caregivers.map((caregiver) => (
                    <div key={caregiver.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{caregiver.caregiver_email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${caregiver.status === 'active' ? 'bg-green-100 text-green-700' : caregiver.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {caregiver.status.charAt(0).toUpperCase() + caregiver.status.slice(1)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {caregiver.access_level === 'manage' ? 'Full Access' : 'View Only'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {caregiver.status === 'active' ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUpdateAccess(caregiver.id, 'revoked')}
                          >
                            <EyeOff className="h-4 w-4 mr-2" />
                            Revoke Access
                          </Button>
                        ) : caregiver.status === 'revoked' ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUpdateAccess(caregiver.id, 'active')}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Grant Access
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled
                          >
                            <Bell className="h-4 w-4 mr-2" />
                            Pending
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Add Caregiver
              </CardTitle>
              <CardDescription>
                Invite someone to access your health data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCaregiver} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Caregiver Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={newCaregiverEmail}
                    onChange={(e) => setNewCaregiverEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="access-level">Access Level</Label>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">Full Management Access</div>
                      <div className="text-sm text-muted-foreground">
                        Allow caregiver to manage your account
                      </div>
                    </div>
                    <Switch
                      id="access-level"
                      checked={accessLevel === 'manage'}
                      onCheckedChange={(checked) => 
                        setAccessLevel(checked ? 'manage' : 'view')
                      }
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Invitation
                    </>
                  ) : (
                    <>Add Caregiver</>
                  )}
                </Button>
              </form>
              
              {shareLink && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Share Invitation Link</h4>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={shareLink} 
                      readOnly 
                      className="text-xs"
                    />
                    <Button 
                      size="icon" 
                      variant="outline" 
                      onClick={copyShareLink}
                      className="flex-shrink-0"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy Settings
              </CardTitle>
              <CardDescription>
                Control what data is shared with caregivers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium">Cognitive Assessments</div>
                    <div className="text-sm text-muted-foreground">
                      Share cognitive assessment results
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium">Wellness Plan</div>
                    <div className="text-sm text-muted-foreground">
                      Share wellness plan and progress
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium">Conversation History</div>
                    <div className="text-sm text-muted-foreground">
                      Share AI assistant conversations
                    </div>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium">Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Send alerts for significant changes
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Save Privacy Settings</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}