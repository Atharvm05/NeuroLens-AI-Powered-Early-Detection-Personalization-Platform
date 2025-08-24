"use client"

import { Button } from "@/components/ui/button"
import { Brain, ArrowLeft } from "lucide-react"
import Link from "next/link"

export function AssessmentHeader() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Brain className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">NeuroLens Assessments</h1>
            <p className="text-sm text-muted-foreground">AI-powered early detection system</p>
          </div>
        </div>
      </div>
    </header>
  )
}
