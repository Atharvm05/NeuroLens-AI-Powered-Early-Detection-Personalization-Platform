'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, ShieldAlert } from 'lucide-react'

export default function CaregiverInvitePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [caregiverData, setCaregiverData] = useState<any>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    // Get user email from localStorage if available
    const email = localStorage.getItem('userEmail')
    if (email) {
      setUserEmail(email)
    }

    // Fetch the caregiver invitation details
    const fetchInvitation = async () => {
      try {
        const response = await fetch(`/api/caregivers/${params.id}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch invitation')
        }

        setCaregiverData(data.caregiver)
        setLoading(false)
      } catch (err: any) {
        setError(err.message || 'An error occurred')
        setLoading(false)
      }
    }

    fetchInvitation()
  }, [params.id])

  const acceptInvitation = async () => {
    setLoading(true)
    try {
      // Get the user ID from localStorage
      const userId = localStorage.getItem('userId')

      if (!userId) {
        setError('You need to be logged in to accept this invitation')
        setLoading(false)
        return
      }

      // Check if the logged-in user's email matches the caregiver email
      if (userEmail !== caregiverData.caregiver_email) {
        setError(`This invitation was sent to ${caregiverData.caregiver_email}. Please log in with that email to accept.`)
        setLoading(false)
        return
      }

      // Update the caregiver relationship status to active
      const response = await fetch(`/api/caregivers/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: caregiverData.user_id,
          status: 'active',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation')
      }

      setSuccess(true)
      setLoading(false)

      // Redirect to caregiver dashboard after a short delay
      setTimeout(() => {
        router.push('/caregiver/dashboard')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container max-w-md mx-auto py-10">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Loading Invitation</CardTitle>
            <CardDescription>Please wait while we retrieve your invitation details</CardDescription>
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
      <div className="container max-w-md mx-auto py-10">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
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

  if (success) {
    return (
      <div className="container max-w-md mx-auto py-10">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-green-600 flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6" />
              Invitation Accepted
            </CardTitle>
            <CardDescription>You are now a caregiver</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center">Redirecting you to the caregiver dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!caregiverData) {
    return (
      <div className="container max-w-md mx-auto py-10">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Invalid Invitation</AlertTitle>
          <AlertDescription>This caregiver invitation does not exist or has expired.</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.push('/')}>
            Return to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-md mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            Caregiver Invitation
          </CardTitle>
          <CardDescription>
            You have been invited to be a caregiver with {caregiverData.access_level === 'manage' ? 'management' : 'view-only'} access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              <strong>Invitation Details:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Access Level: <span className="capitalize">{caregiverData.access_level}</span></li>
              <li>Invited as: {caregiverData.caregiver_email}</li>
              <li>Status: <span className="capitalize">{caregiverData.status}</span></li>
            </ul>
            
            {userEmail !== caregiverData.caregiver_email && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Email Mismatch</AlertTitle>
                <AlertDescription>
                  This invitation was sent to {caregiverData.caregiver_email}. 
                  You are currently logged in with {userEmail || 'another email'}. 
                  Please log in with the correct email to accept this invitation.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push('/')}>
            Cancel
          </Button>
          <Button 
            onClick={acceptInvitation} 
            disabled={userEmail !== caregiverData.caregiver_email || caregiverData.status === 'active'}
          >
            {caregiverData.status === 'active' ? 'Already Accepted' : 'Accept Invitation'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}