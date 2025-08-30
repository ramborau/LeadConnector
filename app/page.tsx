import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Facebook, Shield, Zap, TrendingUp, Phone, Mail } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Facebook className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-primary">LeadConnector</h1>
                <p className="text-xs text-muted-foreground">by SARACE DIGITALSOLUTIONS</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/register">
                <Button>
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold mb-6 text-primary">
              Facebook Lead Ads Integration
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Automate your Facebook Lead Ads with powerful webhook integrations. 
              Capture leads instantly and sync them to any CRM or system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/register">
                <Button size="lg" className="min-w-[200px]">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="min-w-[200px]">
                  Sign In
                </Button>
              </Link>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span>Enterprise Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-600" />
                <span>Real-time Processing</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span>Advanced Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4">Powerful Lead Management Features</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to capture, process, and manage Facebook leads efficiently
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group p-6 rounded-lg border bg-card hover:shadow-lg transition-all duration-300 hover:border-primary/30">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Zap className="h-6 w-6" />
              </div>
              <h4 className="text-xl font-semibold mb-3">Real-time Lead Capture</h4>
              <p className="text-muted-foreground">
                Capture Facebook leads instantly with webhook notifications and real-time processing
              </p>
            </div>

            <div className="group p-6 rounded-lg border bg-card hover:shadow-lg transition-all duration-300 hover:border-primary/30">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Facebook className="h-6 w-6" />
              </div>
              <h4 className="text-xl font-semibold mb-3">CRM Integration</h4>
              <p className="text-muted-foreground">
                Connect to any CRM or system with flexible webhooks and automated data sync
              </p>
            </div>

            <div className="group p-6 rounded-lg border bg-card hover:shadow-lg transition-all duration-300 hover:border-primary/30">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h4 className="text-xl font-semibold mb-3">Analytics Dashboard</h4>
              <p className="text-muted-foreground">
                Monitor performance with detailed analytics, insights, and comprehensive reporting
              </p>
            </div>

            <div className="group p-6 rounded-lg border bg-card hover:shadow-lg transition-all duration-300 hover:border-primary/30">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Shield className="h-6 w-6" />
              </div>
              <h4 className="text-xl font-semibold mb-3">Enterprise Ready</h4>
              <p className="text-muted-foreground">
                Built for scale with enterprise security, reliability, and compliance features
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-muted-foreground mb-8">
              Join thousands of businesses already using LeadConnector to automate their Facebook Lead Ads
            </p>
            <Link href="/register">
              <Button size="lg" className="min-w-[250px]">
                Start Your Free Trial Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Facebook className="h-8 w-8 text-primary" />
                <div>
                  <h4 className="text-lg font-bold">LeadConnector</h4>
                  <p className="text-xs text-muted-foreground">by SARACE DIGITALSOLUTIONS</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                Enterprise-grade Facebook Lead Ads integration platform for modern businesses.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4" />
                  <span>admin@botpe.com</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4" />
                  <span>+91 94225 94226</span>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Product</h5>
              <div className="space-y-2 text-sm">
                <Link href="/login" className="block text-muted-foreground hover:text-foreground">
                  Login
                </Link>
                <Link href="/register" className="block text-muted-foreground hover:text-foreground">
                  Sign Up
                </Link>
                <Link href="/dashboard" className="block text-muted-foreground hover:text-foreground">
                  Dashboard
                </Link>
              </div>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Legal</h5>
              <div className="space-y-2 text-sm">
                <Link href="/privacy" className="block text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="block text-muted-foreground hover:text-foreground">
                  Terms of Service
                </Link>
                <Link href="/data-deletion" className="block text-muted-foreground hover:text-foreground">
                  Data Deletion
                </Link>
              </div>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 SARACE DIGITALSOLUTIONS PRIVATE LIMITED. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}