'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Zap, Plus, Settings, Trash2, TestTube, CheckCircle, XCircle, Clock, Globe, Key, Shield } from 'lucide-react';

interface WebhookConfigProps {
  pageId: string;
  pageName: string;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  authType: 'NONE' | 'BASIC' | 'BEARER' | 'API_KEY';
  isActive: boolean;
  lastSuccess?: string;
  lastFailure?: string;
  retryCount: number;
}

export default function WebhookConfig({ pageId, pageName }: WebhookConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    {
      id: '1',
      name: 'Main CRM Integration',
      url: 'https://api.example.com/webhooks/leads',
      method: 'POST',
      authType: 'BEARER',
      isActive: true,
      lastSuccess: '2 minutes ago',
      retryCount: 3
    }
  ]);

  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    method: 'POST' as const,
    authType: 'NONE' as const,
    authValue: '',
    retryCount: 3,
    timeoutMs: 30000
  });

  const handleAddWebhook = async () => {
    try {
      const authConfig = newWebhook.authType !== 'NONE' ? { value: newWebhook.authValue } : null;
      
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newWebhook.name,
          url: newWebhook.url,
          method: newWebhook.method,
          authType: newWebhook.authType,
          authConfig,
          retryCount: newWebhook.retryCount,
          timeoutMs: newWebhook.timeoutMs,
          pageIds: [pageId] // Associate with current page
        }),
      });

      if (response.ok) {
        const webhook = await response.json();
        const formattedWebhook: Webhook = {
          id: webhook.id,
          name: webhook.name,
          url: webhook.url,
          method: webhook.method,
          authType: webhook.authType,
          isActive: webhook.isActive,
          retryCount: webhook.retryCount
        };

        setWebhooks([...webhooks, formattedWebhook]);
        setNewWebhook({
          name: '',
          url: '',
          method: 'POST',
          authType: 'NONE',
          authValue: '',
          retryCount: 3,
          timeoutMs: 30000
        });
      } else {
        alert('Failed to create webhook');
      }
    } catch (error) {
      console.error('Error creating webhook:', error);
      alert('Error creating webhook');
    }
  };

  const handleToggleWebhook = (id: string) => {
    setWebhooks(webhooks.map(w => 
      w.id === id ? { ...w, isActive: !w.isActive } : w
    ));
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter(w => w.id !== id));
  };

  const handleTestWebhook = async (webhook: Webhook) => {
    // Mock test functionality
    console.log('Testing webhook:', webhook);
    alert('Webhook test sent! Check your endpoint logs.');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Zap className="h-4 w-4 mr-2" />
          Configure Webhooks
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Webhook Configuration - {pageName}
          </DialogTitle>
          <DialogDescription>
            Configure webhook endpoints to receive lead notifications from this Facebook page.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Webhooks */}
          {webhooks.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Active Webhooks ({webhooks.length})
              </h3>
              
              {webhooks.map((webhook) => (
                <Card key={webhook.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-base">{webhook.name}</CardTitle>
                        <Badge variant={webhook.isActive ? "default" : "secondary"}>
                          {webhook.isActive ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleTestWebhook(webhook)}
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Switch 
                          checked={webhook.isActive}
                          onCheckedChange={() => handleToggleWebhook(webhook.id)}
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteWebhook(webhook.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-muted-foreground">URL</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono text-xs">{webhook.url}</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Method</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {webhook.method}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Authentication</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Key className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{webhook.authType}</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Last Status</Label>
                        <div className="flex items-center gap-2 mt-1">
                          {webhook.lastSuccess ? (
                            <>
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <span className="text-xs text-green-600">{webhook.lastSuccess}</span>
                            </>
                          ) : webhook.lastFailure ? (
                            <>
                              <XCircle className="h-3 w-3 text-red-600" />
                              <span className="text-xs text-red-600">{webhook.lastFailure}</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">Never tested</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Separator />

          {/* Add New Webhook */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Webhook
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Webhook Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Main CRM Integration"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({...newWebhook, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="method">HTTP Method</Label>
                <Select value={newWebhook.method} onValueChange={(value: any) => setNewWebhook({...newWebhook, method: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Webhook URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://your-api.com/webhooks/facebook-leads"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({...newWebhook, url: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="auth">Authentication Type</Label>
                <Select value={newWebhook.authType} onValueChange={(value: any) => setNewWebhook({...newWebhook, authType: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None</SelectItem>
                    <SelectItem value="BEARER">Bearer Token</SelectItem>
                    <SelectItem value="BASIC">Basic Auth</SelectItem>
                    <SelectItem value="API_KEY">API Key</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {newWebhook.authType !== 'NONE' && (
                <div className="space-y-2">
                  <Label htmlFor="authValue">
                    {newWebhook.authType === 'BEARER' && 'Bearer Token'}
                    {newWebhook.authType === 'BASIC' && 'Username:Password'}
                    {newWebhook.authType === 'API_KEY' && 'API Key'}
                  </Label>
                  <Input
                    id="authValue"
                    type="password"
                    placeholder={
                      newWebhook.authType === 'BEARER' ? 'your-bearer-token' :
                      newWebhook.authType === 'BASIC' ? 'username:password' :
                      'your-api-key'
                    }
                    value={newWebhook.authValue}
                    onChange={(e) => setNewWebhook({...newWebhook, authValue: e.target.value})}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="retryCount">Retry Count</Label>
                <Select value={newWebhook.retryCount.toString()} onValueChange={(value) => setNewWebhook({...newWebhook, retryCount: parseInt(value)})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 retry</SelectItem>
                    <SelectItem value="3">3 retries</SelectItem>
                    <SelectItem value="5">5 retries</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (ms)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={newWebhook.timeoutMs}
                  onChange={(e) => setNewWebhook({...newWebhook, timeoutMs: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <Card className="bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Webhook Payload Example
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  readOnly
                  className="font-mono text-xs"
                  value={`{
  "object": "page",
  "entry": [
    {
      "id": "${pageId}",
      "time": 1234567890,
      "changes": [
        {
          "value": {
            "form_id": "123456789",
            "leadgen_id": "987654321",
            "created_time": 1234567890,
            "page_id": "${pageId}",
            "adgroup_id": "456789123"
          },
          "field": "leadgen"
        }
      ]
    }
  ]
}`}
                  rows={16}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddWebhook}
            disabled={!newWebhook.name || !newWebhook.url}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Webhook
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}