import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trash2, Shield, Clock } from 'lucide-react';

export default function DataDeletion() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-primary mb-2">Data Deletion Instructions</h1>
          <p className="text-muted-foreground">How to delete your data from LeadConnector</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-destructive" />
                  Account Deletion
                </CardTitle>
                <CardDescription>
                  Complete removal of your LeadConnector account and associated data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="mb-4">
                    If you wish to delete your LeadConnector account and all associated data, you can do so through the following methods:
                  </p>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Method 1: In-App Deletion (Recommended)</h4>
                    <ol className="list-decimal pl-6 space-y-2">
                      <li>Log in to your LeadConnector account</li>
                      <li>Navigate to Settings → Account Management</li>
                      <li>Click on "Delete Account"</li>
                      <li>Confirm the deletion by following the prompts</li>
                      <li>Your account and data will be permanently deleted within 30 days</li>
                    </ol>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Method 2: Email Request</h4>
                    <p className="mb-2">Send an email to our data protection team:</p>
                    <div className="bg-background p-3 rounded border">
                      <p><strong>To:</strong> admin@botpe.com</p>
                      <p><strong>Subject:</strong> Data Deletion Request - LeadConnector</p>
                      <p><strong>Include:</strong></p>
                      <ul className="list-disc pl-6 mt-2">
                        <li>Your full name</li>
                        <li>Email address associated with your account</li>
                        <li>Facebook ID (if available)</li>
                        <li>Reason for deletion (optional)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Processing Timeline
                </CardTitle>
                <CardDescription>
                  What happens after you request data deletion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <h4 className="font-semibold">Immediate (0-24 hours)</h4>
                      <p className="text-muted-foreground">Your account access is suspended and marked for deletion</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <h4 className="font-semibold">Within 7 days</h4>
                      <p className="text-muted-foreground">All lead data, webhook configurations, and analytics are permanently deleted</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <h4 className="font-semibold">Within 30 days</h4>
                      <p className="text-muted-foreground">Complete data purge from all systems, including backups</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  What Data Gets Deleted
                </CardTitle>
                <CardDescription>
                  Comprehensive list of data removed during deletion process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-destructive">Data Permanently Deleted:</h4>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li>Account profile and settings</li>
                      <li>Facebook Lead Ads data</li>
                      <li>Webhook configurations</li>
                      <li>Analytics and usage data</li>
                      <li>API access tokens</li>
                      <li>Lead export history</li>
                      <li>Support conversation history</li>
                      <li>Billing and payment information</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-green-600">Data That May Be Retained:</h4>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li>Anonymized usage statistics (no personal identifiers)</li>
                      <li>Legal compliance records (as required by law)</li>
                      <li>Aggregated analytics data</li>
                      <li>Security logs (for fraud prevention)</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-3">
                      * Retained data contains no personally identifiable information
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Facebook Data Deletion</CardTitle>
                <CardDescription>
                  Information about data stored by Facebook
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                  <p className="text-sm">
                    <strong>Important:</strong> Deleting your LeadConnector account does not automatically 
                    delete data that Facebook has collected about your Lead Ads campaigns.
                  </p>
                </div>
                <p className="mb-4">To delete your Facebook data:</p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Visit Facebook Settings → Privacy → Your Facebook Information</li>
                  <li>Click "Delete Your Account and Information"</li>
                  <li>Or remove LeadConnector app access in Apps and Websites settings</li>
                </ol>
              </CardContent>
            </Card>

            <Card className="bg-muted">
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
                <CardDescription>
                  Contact our support team for assistance with data deletion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>SARACE DIGITALSOLUTIONS PRIVATE LIMITED</strong></p>
                  <p>Email: admin@botpe.com</p>
                  <p>Phone: +91 94225 94226</p>
                  <p className="text-sm text-muted-foreground mt-4">
                    Our data protection team typically responds to deletion requests within 2-3 business days. 
                    You will receive email confirmation once the deletion process is complete.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Link href="/privacy">
              <Button variant="outline" className="mr-4">
                View Privacy Policy
              </Button>
            </Link>
            <Link href="/terms">
              <Button variant="outline">
                View Terms of Service
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}