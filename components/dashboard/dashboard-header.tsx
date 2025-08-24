"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Brain, LogOut, Activity, Users, LineChart } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface DashboardHeaderProps {
  user: SupabaseUser
  profile: any
}

export function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : user.email?.[0]?.toUpperCase() || "U"

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">NeuroLens</span>
        </div>

        <div className="hidden md:flex items-center space-x-6 mx-6">
          <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link href="/assessments" className="text-sm font-medium hover:text-primary transition-colors">
            Assessments
          </Link>
          <Link href="/wellness-plan" className="text-sm font-medium hover:text-primary transition-colors">
            Wellness Plan
          </Link>
          <Link href="/wearable-data" className="text-sm font-medium hover:text-primary transition-colors">
            <div className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              <span>Wearable Data</span>
            </div>
          </Link>
          <Link href="/caregiver" className="text-sm font-medium hover:text-primary transition-colors">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Caregiver</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.full_name || "User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                {/* Profile icon and text */}
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                {/* Settings icon and text */}
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
