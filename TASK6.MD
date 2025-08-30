# Task 6: Webhook Configuration

## Status: PENDING

## Overview
Implement a robust webhook delivery system with configuration management, testing capabilities, retry logic, authentication support, and delivery tracking.

## Prerequisites
- Tasks 1-5 completed
- Lead management system working
- Database models created
- Authentication functional

## Subtasks

### 6.1 Create Webhook Service
Create `services/webhook.service.ts`:
```typescript
import axios, { AxiosRequestConfig } from 'axios';
import { prisma } from '@/lib/db';
import { Lead, Webhook, WebhookDelivery, DeliveryStatus, AuthType } from '@prisma/client';
import crypto from 'crypto';

export class WebhookService {
  // Deliver lead to all configured webhooks
  static async deliverLead(lead: Lead) {
    // Get active webhooks for this page
    const pageWebhooks = await prisma.pageWebhookConfig.findMany({
      where: {
        pageId: lead.pageId,
        isActive: true,
        webhook: {
          isActive: true,
        },
      },
      include: {
        webhook: true,
      },
    });

    // Create delivery records for each webhook
    const deliveryPromises = pageWebhooks.map(config =>
      this.createDelivery(lead, config.webhook)
    );

    await Promise.all(deliveryPromises);
  }

  // Create a new delivery attempt
  static async createDelivery(lead: Lead, webhook: Webhook) {
    const delivery = await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        leadId: lead.id,
        status: DeliveryStatus.PENDING,
      },
    });

    // Queue for immediate delivery
    await this.attemptDelivery(delivery.id);
    
    return delivery;
  }

  // Attempt webhook delivery
  static async attemptDelivery(deliveryId: string) {
    const delivery = await prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: {
        webhook: true,
        lead: {
          include: {
            page: true,
          },
        },
      },
    });

    if (!delivery) return;

    try {
      const payload = this.buildPayload(delivery.lead);
      const config = this.buildRequestConfig(delivery.webhook, payload);
      
      const response = await axios(config);

      // Update delivery as successful
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: DeliveryStatus.SUCCESS,
          statusCode: response.status,
          responseBody: JSON.stringify(response.data).substring(0, 5000), // Limit response size
          completedAt: new Date(),
        },
      });

      // Update webhook last success
      await prisma.webhook.update({
        where: { id: delivery.webhook.id },
        data: { lastSuccess: new Date() },
      });

      // Update lead status
      await prisma.lead.update({
        where: { id: delivery.lead.id },
        data: {
          status: 'DELIVERED',
          processedAt: new Date(),
        },
      });

    } catch (error: any) {
      await this.handleDeliveryError(delivery, error);
    }
  }

  // Handle delivery error
  private static async handleDeliveryError(delivery: any, error: any) {
    const shouldRetry = delivery.attemptNumber < delivery.webhook.retryCount;
    const nextRetryAt = shouldRetry ? this.getNextRetryTime(delivery.attemptNumber) : null;

    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: shouldRetry ? DeliveryStatus.RETRYING : DeliveryStatus.FAILED,
        statusCode: error.response?.status,
        error: error.message,
        responseBody: error.response?.data ? JSON.stringify(error.response.data).substring(0, 5000) : null,
        attemptNumber: delivery.attemptNumber + 1,
        nextRetryAt,
      },
    });

    // Update webhook last failure
    await prisma.webhook.update({
      where: { id: delivery.webhook.id },
      data: { lastFailure: new Date() },
    });

    if (shouldRetry) {
      // Schedule retry
      await this.scheduleRetry(delivery.id, delivery.attemptNumber);
    } else {
      // Update lead status as failed
      await prisma.lead.update({
        where: { id: delivery.lead.id },
        data: { status: 'FAILED' },
      });
    }
  }

  // Build webhook payload
  private static buildPayload(lead: any) {
    return {
      id: lead.id,
      facebook_lead_id: lead.facebookLeadId,
      page: {
        id: lead.page.id,
        name: lead.page.name,
        facebook_page_id: lead.page.facebookPageId,
      },
      form: {
        id: lead.formId,
        name: lead.formName,
      },
      campaign: lead.campaignId ? {
        id: lead.campaignId,
        name: lead.campaignName,
      } : null,
      adset: lead.adsetId ? {
        id: lead.adsetId,
        name: lead.adsetName,
      } : null,
      ad: lead.adId ? {
        id: lead.adId,
        name: lead.adName,
      } : null,
      data: lead.leadData,
      created_at: lead.createdAt.toISOString(),
      delivered_at: new Date().toISOString(),
    };
  }

  // Build request configuration
  private static buildRequestConfig(webhook: Webhook, payload: any): AxiosRequestConfig {
    const headers: any = {
      'Content-Type': 'application/json',
      'User-Agent': 'LeadConnector/1.0',
      'X-LeadConnector-Delivery-Id': crypto.randomUUID(),
      'X-LeadConnector-Timestamp': new Date().toISOString(),
    };

    // Add custom headers
    if (webhook.headers) {
      Object.assign(headers, webhook.headers);
    }

    // Handle authentication
    this.addAuthentication(headers, webhook);

    // Add HMAC signature
    const signature = this.generateHMACSignature(
      JSON.stringify(payload),
      webhook.id
    );
    headers['X-LeadConnector-Signature'] = signature;

    return {
      method: webhook.method.toLowerCase() as any,
      url: webhook.url,
      data: payload,
      headers,
      timeout: webhook.timeoutMs,
      validateStatus: (status) => status < 500, // Don't throw on 4xx errors
    };
  }

  // Add authentication headers
  private static addAuthentication(headers: any, webhook: Webhook) {
    const authConfig = webhook.authConfig as any;
    
    switch (webhook.authType) {
      case AuthType.BASIC:
        if (authConfig?.username && authConfig?.password) {
          const auth = Buffer.from(`${authConfig.username}:${authConfig.password}`).toString('base64');
          headers['Authorization'] = `Basic ${auth}`;
        }
        break;
      
      case AuthType.BEARER:
        if (authConfig?.token) {
          headers['Authorization'] = `Bearer ${authConfig.token}`;
        }
        break;
      
      case AuthType.API_KEY:
        if (authConfig?.headerName && authConfig?.apiKey) {
          headers[authConfig.headerName] = authConfig.apiKey;
        }
        break;
      
      case AuthType.CUSTOM:
        if (authConfig?.headers) {
          Object.assign(headers, authConfig.headers);
        }
        break;
    }
  }

  // Generate HMAC signature
  private static generateHMACSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  // Get next retry time with exponential backoff
  private static getNextRetryTime(attemptNumber: number): Date {
    const delays = [60, 300, 900, 1800]; // 1min, 5min, 15min, 30min
    const delaySeconds = delays[Math.min(attemptNumber, delays.length - 1)];
    return new Date(Date.now() + delaySeconds * 1000);
  }

  // Schedule retry (in production, use a job queue)
  private static async scheduleRetry(deliveryId: string, attemptNumber: number) {
    const delay = this.getRetryDelay(attemptNumber);
    
    setTimeout(() => {
      this.attemptDelivery(deliveryId);
    }, delay);
  }

  // Get retry delay in milliseconds
  private static getRetryDelay(attemptNumber: number): number {
    const delays = [60000, 300000, 900000, 1800000]; // 1min, 5min, 15min, 30min
    return delays[Math.min(attemptNumber, delays.length - 1)];
  }

  // Test webhook endpoint
  static async testWebhook(webhookId: string) {
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) throw new Error('Webhook not found');

    const testPayload = {
      test: true,
      timestamp: new Date().toISOString(),
      webhook_id: webhookId,
      message: 'This is a test delivery from LeadConnector',
      sample_lead: {
        id: 'test-lead-' + Date.now(),
        facebook_lead_id: 'fb-test-' + Date.now(),
        page: {
          id: 'test-page-123',
          name: 'Test Page',
          facebook_page_id: '123456789',
        },
        form: {
          id: 'test-form-123',
          name: 'Test Lead Form',
        },
        campaign: {
          id: 'test-campaign-123',
          name: 'Test Campaign',
        },
        data: {
          email: 'test@example.com',
          full_name: 'Test User',
          phone_number: '+1234567890',
          company: 'Test Company',
          message: 'This is a test lead submission',
        },
        created_at: new Date().toISOString(),
        delivered_at: new Date().toISOString(),
      },
    };

    try {
      const config = this.buildRequestConfig(webhook, testPayload);
      const response = await axios(config);

      return {
        success: true,
        statusCode: response.status,
        response: response.data,
        headers: response.headers,
      };
    } catch (error: any) {
      return {
        success: false,
        statusCode: error.response?.status,
        error: error.message,
        response: error.response?.data,
      };
    }
  }

  // Get webhook statistics
  static async getWebhookStats(webhookId: string) {
    const [total, successful, failed, pending] = await Promise.all([
      prisma.webhookDelivery.count({ where: { webhookId } }),
      prisma.webhookDelivery.count({ 
        where: { webhookId, status: DeliveryStatus.SUCCESS } 
      }),
      prisma.webhookDelivery.count({ 
        where: { webhookId, status: DeliveryStatus.FAILED } 
      }),
      prisma.webhookDelivery.count({ 
        where: { 
          webhookId, 
          status: { in: [DeliveryStatus.PENDING, DeliveryStatus.RETRYING] } 
        } 
      }),
    ]);

    const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;

    return {
      total,
      successful,
      failed,
      pending,
      successRate,
    };
  }
}
```

### 6.2 Create Webhook API Routes
Create `app/api/webhooks/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { WebhookService } from '@/services/webhook.service';

// Get user's webhooks
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const webhooks = await prisma.webhook.findMany({
      where: { userId: session.user.id },
      include: {
        pageConfigs: {
          include: { page: true },
        },
        _count: {
          select: { deliveries: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get stats for each webhook
    const webhooksWithStats = await Promise.all(
      webhooks.map(async (webhook) => {
        const stats = await WebhookService.getWebhookStats(webhook.id);
        return { ...webhook, stats };
      })
    );

    return NextResponse.json(webhooksWithStats);
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
}

// Create new webhook
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  try {
    const webhook = await prisma.webhook.create({
      data: {
        userId: session.user.id,
        name: body.name,
        url: body.url,
        method: body.method || 'POST',
        headers: body.headers,
        authType: body.authType || 'NONE',
        authConfig: body.authConfig,
        retryCount: body.retryCount || 3,
        timeoutMs: body.timeoutMs || 30000,
      },
    });

    // Connect to pages if specified
    if (body.pageIds && body.pageIds.length > 0) {
      await prisma.pageWebhookConfig.createMany({
        data: body.pageIds.map((pageId: string) => ({
          pageId,
          webhookId: webhook.id,
        })),
      });
    }

    return NextResponse.json(webhook);
  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}
```

### 6.3 Create Webhook Test API
Create `app/api/webhooks/[id]/test/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { WebhookService } from '@/services/webhook.service';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verify webhook belongs to user
    const webhook = await prisma.webhook.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const result = await WebhookService.testWebhook(params.id);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error testing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to test webhook' },
      { status: 500 }
    );
  }
}
```

### 6.4 Create Webhook Form Component
Create `components/webhooks/webhook-form.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuthType, HttpMethod } from '@prisma/client';

const webhookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Must be a valid URL'),
  method: z.nativeEnum(HttpMethod),
  authType: z.nativeEnum(AuthType),
  authConfig: z.any().optional(),
  headers: z.string().optional(),
  retryCount: z.number().min(0).max(5),
  timeoutMs: z.number().min(1000).max(60000),
  pageIds: z.array(z.string()).optional(),
});

interface WebhookFormProps {
  pages: Array<{ id: string; name: string }>;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export function WebhookForm({ pages, onSubmit, initialData }: WebhookFormProps) {
  const [authType, setAuthType] = useState<AuthType>(initialData?.authType || AuthType.NONE);

  const form = useForm<z.infer<typeof webhookSchema>>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      name: initialData?.name || '',
      url: initialData?.url || '',
      method: initialData?.method || HttpMethod.POST,
      authType: initialData?.authType || AuthType.NONE,
      authConfig: initialData?.authConfig || {},
      headers: initialData?.headers ? JSON.stringify(initialData.headers, null, 2) : '',
      retryCount: initialData?.retryCount || 3,
      timeoutMs: initialData?.timeoutMs || 30000,
      pageIds: initialData?.pageIds || [],
    },
  });

  const handleSubmit = (data: z.infer<typeof webhookSchema>) => {
    // Parse headers
    let headers = {};
    if (data.headers) {
      try {
        headers = JSON.parse(data.headers);
      } catch (e) {
        form.setError('headers', { message: 'Invalid JSON format' });
        return;
      }
    }

    // Build auth config based on type
    let authConfig = {};
    if (authType === AuthType.BASIC) {
      authConfig = {
        username: form.getValues('authConfig.username'),
        password: form.getValues('authConfig.password'),
      };
    } else if (authType === AuthType.BEARER) {
      authConfig = {
        token: form.getValues('authConfig.token'),
      };
    } else if (authType === AuthType.API_KEY) {
      authConfig = {
        headerName: form.getValues('authConfig.headerName'),
        apiKey: form.getValues('authConfig.apiKey'),
      };
    }

    onSubmit({
      ...data,
      headers,
      authConfig,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My CRM Webhook" {...field} />
                  </FormControl>
                  <FormDescription>
                    A friendly name to identify this webhook
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://api.example.com/webhook" {...field} />
                  </FormControl>
                  <FormDescription>
                    The endpoint URL where lead data will be sent
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HTTP Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={HttpMethod.POST}>POST</SelectItem>
                        <SelectItem value={HttpMethod.PUT}>PUT</SelectItem>
                        <SelectItem value={HttpMethod.PATCH}>PATCH</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeoutMs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timeout (ms)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="retryCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Retry Count</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      max="5" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Number of retry attempts for failed deliveries
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={authType} onValueChange={(v) => setAuthType(v as AuthType)}>
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value={AuthType.NONE}>None</TabsTrigger>
                <TabsTrigger value={AuthType.BASIC}>Basic</TabsTrigger>
                <TabsTrigger value={AuthType.BEARER}>Bearer</TabsTrigger>
                <TabsTrigger value={AuthType.API_KEY}>API Key</TabsTrigger>
                <TabsTrigger value={AuthType.CUSTOM}>Custom</TabsTrigger>
              </TabsList>

              <TabsContent value={AuthType.BASIC} className="space-y-4">
                <FormField
                  control={form.control}
                  name="authConfig.username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="authConfig.password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value={AuthType.BEARER} className="space-y-4">
                <FormField
                  control={form.control}
                  name="authConfig.token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bearer Token</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value={AuthType.API_KEY} className="space-y-4">
                <FormField
                  control={form.control}
                  name="authConfig.headerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Header Name</FormLabel>
                      <FormControl>
                        <Input placeholder="X-API-Key" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="authConfig.apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom Headers</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="headers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Headers (JSON)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder='{"X-Custom-Header": "value"}'
                      className="font-mono"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Additional headers to send with each request
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Page Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="pageIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Connected Pages</FormLabel>
                  <div className="space-y-2">
                    {pages.map((page) => (
                      <div key={page.id} className="flex items-center space-x-2">
                        <Switch
                          checked={field.value?.includes(page.id)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            if (checked) {
                              field.onChange([...current, page.id]);
                            } else {
                              field.onChange(current.filter((id: string) => id !== page.id));
                            }
                          }}
                        />
                        <label className="text-sm">{page.name}</label>
                      </div>
                    ))}
                  </div>
                  <FormDescription>
                    Select which pages should send leads to this webhook
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Update' : 'Create'} Webhook
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

### 6.5 Create Webhook List Component
Create `components/webhooks/webhook-list.tsx`:
```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  TestTube, 
  Edit, 
  Trash, 
  Activity,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';

interface WebhookListProps {
  webhooks: any[];
  onTest: (id: string) => void;
  onEdit: (webhook: any) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
}

export function WebhookList({ 
  webhooks, 
  onTest, 
  onEdit, 
  onDelete, 
  onToggle 
}: WebhookListProps) {
  return (
    <div className="space-y-4">
      {webhooks.map((webhook) => (
        <Card key={webhook.id}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-lg">{webhook.name}</CardTitle>
                <Badge variant={webhook.isActive ? 'success' : 'secondary'}>
                  {webhook.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={webhook.isActive}
                  onCheckedChange={(checked) => onToggle(webhook.id, checked)}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onTest(webhook.id)}>
                      <TestTube className="mr-2 h-4 w-4" />
                      Test Webhook
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(webhook)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(webhook.id)}
                      className="text-destructive"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 text-sm">
              <span className="font-medium">URL:</span>
              <code className="flex-1 bg-muted px-2 py-1 rounded">
                {webhook.url}
              </code>
              <Badge variant="outline">{webhook.method}</Badge>
            </div>

            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{webhook.stats?.total || 0}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <div className="font-medium">{webhook.stats?.successful || 0}</div>
                  <div className="text-xs text-muted-foreground">Success</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <div>
                  <div className="font-medium">{webhook.stats?.failed || 0}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <div>
                  <div className="font-medium">{webhook.stats?.pending || 0}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
              </div>
            </div>

            {webhook.lastSuccess && (
              <div className="text-xs text-muted-foreground">
                Last success: {format(new Date(webhook.lastSuccess), 'MMM d, yyyy HH:mm')}
              </div>
            )}

            {webhook.pageConfigs && webhook.pageConfigs.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {webhook.pageConfigs.map((config: any) => (
                  <Badge key={config.page.id} variant="secondary" className="text-xs">
                    {config.page.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

## Verification Steps
1. [ ] Webhook creation working
2. [ ] Webhook testing functional
3. [ ] Authentication methods working
4. [ ] Retry logic functioning
5. [ ] Delivery tracking accurate
6. [ ] HMAC signatures generated
7. [ ] Stats calculation correct

## Security Considerations
- HMAC signature verification
- Secure credential storage
- SSL/TLS enforcement
- Rate limiting on deliveries
- Timeout protection

## Next Steps
- Proceed to Task 7: Dashboard and Analytics
- Implement queue system for production
- Add webhook logs viewer
- Create delivery analytics

## Notes
- Consider using Bull/BullMQ for production queue
- Monitor webhook endpoint health
- Implement circuit breaker pattern
- Add webhook validation before save