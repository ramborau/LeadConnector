'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Facebook, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function FacebookConnect() {
  const { data: session } = useSession();
  const [isConnecting, setIsConnecting] = useState(false);
  
  const isFacebookConnected = session?.accessToken;

  const handleFacebookConnect = async () => {
    setIsConnecting(true);
    await signIn('facebook', { 
      callbackUrl: '/pages',
      redirect: true 
    });
  };

  const requiredPermissions = [
    { name: 'pages_show_list', description: 'Access to your Facebook Pages', granted: isFacebookConnected },
    { name: 'leads_retrieval', description: 'Permission to retrieve lead data', granted: isFacebookConnected },
    { name: 'pages_read_engagement', description: 'Read page engagement metrics', granted: isFacebookConnected },
    { name: 'pages_manage_metadata', description: 'Manage page webhook subscriptions', granted: isFacebookConnected },
  ];

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#1877F2]/10 rounded-lg flex items-center justify-center">
            <Facebook className="h-6 w-6 text-[#1877F2]" />
          </div>
          <div>
            <CardTitle className="text-xl">Facebook Integration</CardTitle>
            <p className="text-sm text-muted-foreground">
              Connect your Facebook account to manage Lead Ads
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
          {isFacebookConnected ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Facebook Connected</p>
                <p className="text-sm text-green-600">
                  Your Facebook account is connected and ready to use
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">Facebook Not Connected</p>
                <p className="text-sm text-orange-600">
                  Connect your Facebook account to access your pages and leads
                </p>
              </div>
            </>
          )}
        </div>

        {/* Required Permissions */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-primary" />
            <h4 className="font-semibold">Required Permissions</h4>
          </div>
          <div className="space-y-3">
            {requiredPermissions.map((permission) => (
              <div key={permission.name} className="flex items-center gap-3 p-3 rounded-lg border">
                {permission.granted ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">{permission.description}</p>
                  <p className="text-xs text-muted-foreground">{permission.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Connection Button */}
        {!isFacebookConnected && (
          <Button
            onClick={handleFacebookConnect}
            className="w-full bg-[#1877F2] text-white hover:bg-[#1664D8] h-12"
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting to Facebook...
              </>
            ) : (
              <>
                <Facebook className="mr-2 h-4 w-4" />
                Connect Facebook Account
              </>
            )}
          </Button>
        )}

        {/* Connected Account Info */}
        {isFacebookConnected && session?.user && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Facebook className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-800">
                  Connected as {session.user.name || session.user.email}
                </p>
                <p className="text-sm text-green-600">
                  You can now access your Facebook pages and lead data
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        {isFacebookConnected && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Next Steps:</h4>
            <ol className="text-sm text-blue-600 space-y-1">
              <li>1. Your Facebook pages will be displayed below</li>
              <li>2. Select pages you want to connect for lead capture</li>
              <li>3. Configure webhook endpoints for real-time lead delivery</li>
              <li>4. Start capturing leads from your Facebook Lead Ads</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}