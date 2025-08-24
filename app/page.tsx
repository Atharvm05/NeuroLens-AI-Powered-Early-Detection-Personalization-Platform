import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Heart, Shield, Users } from "lucide-react"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">NeuroLens</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            AI-Powered Early Detection for <span className="text-primary">Neurological Health</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Advanced AI technology monitors speech patterns, facial expressions, and behavioral changes to provide early
            detection and personalized wellness plans for neurological and mental health conditions.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/auth/sign-up">
              <Button size="lg" className="px-8">
                Start Your Health Journey
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="lg" className="px-8 bg-transparent">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">Comprehensive Health Monitoring</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our platform combines cutting-edge AI with personalized care to support your neurological wellness journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="health-metric-card">
            <CardHeader>
              <Brain className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Early Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Advanced AI analyzes speech patterns, facial expressions, and behavioral changes for early warning
                signs.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="health-metric-card">
            <CardHeader>
              <Heart className="h-12 w-12 text-secondary mb-4" />
              <CardTitle>Personalized Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Customized cognitive wellness plans with gamified activities tailored to your specific needs and goals.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="health-metric-card">
            <CardHeader>
              <Shield className="h-12 w-12 text-accent mb-4" />
              <CardTitle>AI Health Companion</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                24/7 intelligent chatbot provides support, answers questions, and tracks your daily wellness journey.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="health-metric-card">
            <CardHeader>
              <Users className="h-12 w-12 text-info mb-4" />
              <CardTitle>Caregiver Portal</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Secure sharing with family and healthcare providers, with customizable alerts and progress reports.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Take Control of Your Neurological Health Today</h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of users who trust NeuroLens for early detection and personalized wellness support.
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" variant="secondary" className="px-8">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">What Our Users Say</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hear from people who have experienced the benefits of NeuroLens in their daily lives.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="testimonial-card">
            <CardContent className="pt-6">
              <p className="italic text-muted-foreground mb-4">
                "NeuroLens has been instrumental in helping me track subtle changes in my cognitive health. The early detection features gave me confidence to seek professional help at the right time."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="font-semibold text-primary">JD</span>
                </div>
                <div>
                  <p className="font-medium">John D.</p>
                  <p className="text-sm text-muted-foreground">Using NeuroLens for 8 months</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="testimonial-card">
            <CardContent className="pt-6">
              <p className="italic text-muted-foreground mb-4">
                "As a caregiver, the ability to monitor my mother's cognitive patterns remotely has been life-changing. The AI companion provides her with daily support that complements my care."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center">
                  <span className="font-semibold text-secondary">SM</span>
                </div>
                <div>
                  <p className="font-medium">Sarah M.</p>
                  <p className="text-sm text-muted-foreground">Caregiver using NeuroLens</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="testimonial-card">
            <CardContent className="pt-6">
              <p className="italic text-muted-foreground mb-4">
                "The personalized wellness plans have helped me maintain cognitive health in ways I never expected. The speech and facial analysis features are remarkably accurate."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="font-semibold text-accent">RT</span>
                </div>
                <div>
                  <p className="font-medium">Robert T.</p>
                  <p className="text-sm text-muted-foreground">NeuroLens user for 1 year</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-6 w-6 text-primary" />
                <span className="font-semibold text-foreground">NeuroLens</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Empowering neurological wellness through advanced AI technology and personalized care.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Features</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Pricing</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Demo</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Security</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Blog</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Documentation</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Research</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Partners</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Company</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">About Us</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Careers</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Contact</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-muted-foreground mb-4 md:mb-0">
              © 2025 NeuroLens. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Terms</Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Privacy</Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
