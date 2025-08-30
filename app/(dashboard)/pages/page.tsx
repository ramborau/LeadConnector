'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FacebookConnect from '@/components/facebook-connect';
import WebhookConfig from '@/components/webhook-config';
import GoogleSheetsConnect from '@/components/google-sheets-connect';
import { Facebook, Users, Zap, CheckCircle, Plus, ExternalLink, FileSpreadsheet } from 'lucide-react';

export default function PagesPage() {
  const { data: session } = useSession();
  const isFacebookConnected = session?.accessToken;

  // Mock Facebook pages data for demonstration
  const mockPages = [
    {
      id: '123456789',
      name: 'SARACE Digital Solutions',
      category: 'Business Services',
      fanCount: 1250,
      isConnected: true,
      picture: 'https://via.placeholder.com/60x60/1877F2/ffffff?text=SD'
    },
    {
      id: '987654321', 
      name: 'LeadConnector Demo Page',
      category: 'Software',
      fanCount: 450,
      isConnected: false,
      picture: 'https://via.placeholder.com/60x60/42A5F5/ffffff?text=LC'
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-dark">Facebook Pages</h1>
        <p className="text-muted-foreground">
          Connect your Facebook pages to start capturing leads from Lead Ads
        </p>
      </div>

      {/* Facebook Connection */}
      <FacebookConnect />

      {/* Connected Pages */}
      {isFacebookConnected && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Facebook Pages</h2>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Refresh Pages
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockPages.map((page) => (
              <Card key={page.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={page.picture} 
                      alt={page.name}
                      className="w-12 h-12 rounded-lg"
                    />
                    <div className="flex-1">
                      <CardTitle className="text-base">{page.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{page.category}</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Followers</span>
                    <span className="font-medium">{page.fanCount.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {page.isConnected ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Connected</span>
                      </>
                    ) : (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                        <span className="text-sm text-muted-foreground">Not connected</span>
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    {page.isConnected ? (
                      <>
                        <WebhookConfig pageId={page.id} pageName={page.name} />
                        <GoogleSheetsConnect pageId={page.id} pageName={page.name} />
                        <Button variant="outline" size="sm" className="w-full">
                          <Users className="h-4 w-4 mr-2" />
                          View Leads
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Connect Page
                      </Button>
                    )}
                  </div>

                  <div className="pt-2 border-t">
                    <Button variant="ghost" size="sm" className="w-full text-xs">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View on Facebook
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Getting Started Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Getting Started with Lead Capture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Connect Pages</h4>
                    <p className="text-sm text-muted-foreground">
                      Select the Facebook pages you want to monitor for leads
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Configure Webhooks</h4>
                    <p className="text-sm text-muted-foreground">
                      Set up webhook endpoints to receive lead notifications
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Start Capturing</h4>
                    <p className="text-sm text-muted-foreground">
                      Begin receiving leads automatically from your Lead Ads
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}