"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Brain, ArrowLeft, MoreVertical } from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function ChatHeader() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Avatar className="h-10 w-10 bg-primary/10">
            <AvatarFallback className="text-primary">
              <Brain className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-semibold text-foreground">AI Health Companion</h1>
            <p className="text-sm text-muted-foreground">Always here to help with your wellness journey</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Clear conversation</DropdownMenuItem>
            <DropdownMenuItem>Export chat history</DropdownMenuItem>
            <DropdownMenuItem>Privacy settings</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
