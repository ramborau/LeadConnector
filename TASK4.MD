# Task 4: Facebook Integration

## Status: PENDING

## Overview
Implement comprehensive Facebook Graph API integration for managing pages, subscribing to lead webhooks, retrieving lead data, and handling real-time lead notifications.

## Prerequisites
- Tasks 1-3 completed
- Facebook Developer Account
- Facebook App configured (see FB.MD)
- Valid Facebook access tokens

## Subtasks

### 4.1 Create Facebook Service
Create `services/facebook.service.ts`:
```typescript
import axios, { AxiosInstance } from 'axios';
import { decrypt } from '@/lib/encryption';
import { prisma } from '@/lib/db';

const FACEBOOK_GRAPH_URL = 'https://graph.facebook.com/v19.0';

export class FacebookService {
  private api: AxiosInstance;
  private accessToken: string;

  constructor(encryptedToken: string) {
    this.accessToken = decrypt(encryptedToken);
    this.api = axios.create({
      baseURL: FACEBOOK_GRAPH_URL,
      params: {
        access_token: this.accessToken,
      },
    });
  }

  // Get user's Facebook pages
  async getPages() {
    try {
      const response = await this.api.get('/me/accounts', {
        params: {
          fields: 'id,name,category,access_token,picture,fan_count,is_published',
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching pages:', error);
      throw new Error('Failed to fetch Facebook pages');
    }
  }

  // Subscribe page to leadgen webhooks
  async subscribeToLeadgen(pageId: string, pageAccessToken: string) {
    try {
      await axios.post(
        `${FACEBOOK_GRAPH_URL}/${pageId}/subscribed_apps`,
        {
          subscribed_fields: 'leadgen',
          access_token: pageAccessToken,
        }
      );
      return true;
    } catch (error) {
      console.error('Error subscribing to leadgen:', error);
      throw new Error('Failed to subscribe to lead webhooks');
    }
  }

  // Unsubscribe page from leadgen webhooks
  async unsubscribeFromLeadgen(pageId: string, pageAccessToken: string) {
    try {
      await axios.delete(
        `${FACEBOOK_GRAPH_URL}/${pageId}/subscribed_apps`,
        {
          params: { access_token: pageAccessToken },
        }
      );
      return true;
    } catch (error) {
      console.error('Error unsubscribing from leadgen:', error);
      throw new Error('Failed to unsubscribe from lead webhooks');
    }
  }

  // Get lead details
  async getLeadDetails(leadId: string, pageAccessToken: string) {
    try {
      const response = await axios.get(
        `${FACEBOOK_GRAPH_URL}/${leadId}`,
        {
          params: {
            access_token: pageAccessToken,
            fields: 'id,created_time,field_data,form_id,campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,is_organic',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching lead details:', error);
      throw new Error('Failed to fetch lead details');
    }
  }

  // Get form details
  async getFormDetails(formId: string, pageAccessToken: string) {
    try {
      const response = await axios.get(
        `${FACEBOOK_GRAPH_URL}/${formId}`,
        {
          params: {
            access_token: pageAccessToken,
            fields: 'id,name,questions,privacy_policy_url,follow_up_action_url',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching form details:', error);
      throw new Error('Failed to fetch form details');
    }
  }

  // Get page forms
  async getPageForms(pageId: string, pageAccessToken: string) {
    try {
      const response = await axios.get(
        `${FACEBOOK_GRAPH_URL}/${pageId}/leadgen_forms`,
        {
          params: {
            access_token: pageAccessToken,
            fields: 'id,name,status,created_time,questions',
          },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching page forms:', error);
      throw new Error('Failed to fetch page forms');
    }
  }

  // Get recent leads for a form
  async getFormLeads(formId: string, pageAccessToken: string, limit: number = 100) {
    try {
      const response = await axios.get(
        `${FACEBOOK_GRAPH_URL}/${formId}/leads`,
        {
          params: {
            access_token: pageAccessToken,
            limit,
            fields: 'id,created_time,field_data',
          },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching form leads:', error);
      throw new Error('Failed to fetch form leads');
    }
  }

  // Process field data from lead
  static processFieldData(fieldData: any[]) {
    const processed: Record<string, any> = {};
    for (const field of fieldData) {
      const key = field.name.toLowerCase().replace(/\s+/g, '_');
      processed[key] = field.values[0];
    }
    return processed;
  }

  // Verify webhook signature
  static verifyWebhookSignature(signature: string, body: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.FACEBOOK_CLIENT_SECRET!)
      .update(body)
      .digest('hex');
    return signature === `sha256=${expectedSignature}`;
  }
}
```

### 4.2 Create Webhook Handler Service
Create `services/webhook-handler.service.ts`:
```typescript
import { prisma } from '@/lib/db';
import { FacebookService } from './facebook.service';
import { WebhookService } from './webhook.service';
import { decrypt } from '@/lib/encryption';
import { LeadStatus } from '@prisma/client';

export class WebhookHandlerService {
  static async handleLeadgenChange(entry: any) {
    for (const change of entry.changes) {
      if (change.field === 'leadgen') {
        await this.processLead(change.value);
      }
    }
  }

  private static async processLead(leadData: any) {
    const { leadgen_id, page_id, form_id, created_time } = leadData;

    try {
      // Check if lead already exists
      const existingLead = await prisma.lead.findUnique({
        where: { facebookLeadId: leadgen_id },
      });

      if (existingLead) {
        console.log('Lead already processed:', leadgen_id);
        return;
      }

      // Get page from database
      const page = await prisma.page.findUnique({
        where: { facebookPageId: page_id },
        include: { user: true },
      });

      if (!page || !page.isActive) {
        console.log('Page not found or inactive:', page_id);
        return;
      }

      // Get lead details from Facebook
      const fbService = new FacebookService(page.accessToken);
      const [leadDetails, formDetails] = await Promise.all([
        fbService.getLeadDetails(leadgen_id, decrypt(page.accessToken)),
        fbService.getFormDetails(form_id, decrypt(page.accessToken)),
      ]);

      // Process field data
      const processedData = FacebookService.processFieldData(leadDetails.field_data);

      // Save lead to database
      const lead = await prisma.lead.create({
        data: {
          facebookLeadId: leadgen_id,
          pageId: page.id,
          formId: form_id,
          formName: formDetails.name,
          campaignId: leadDetails.campaign_id,
          campaignName: leadDetails.campaign_name,
          adsetId: leadDetails.adset_id,
          adsetName: leadDetails.adset_name,
          adId: leadDetails.ad_id,
          adName: leadDetails.ad_name,
          leadData: processedData,
          status: LeadStatus.NEW,
        },
      });

      console.log('Lead saved:', lead.id);

      // Trigger webhook delivery
      await WebhookService.deliverLead(lead);
    } catch (error) {
      console.error('Error processing lead:', error);
      // Log error but don't throw to prevent webhook retry storms
    }
  }

  static async verifyWebhook(mode: string, token: string, challenge: string) {
    if (mode === 'subscribe' && token === process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN) {
      return challenge;
    }
    throw new Error('Webhook verification failed');
  }
}
```

### 4.3 Create Facebook API Routes
Create `app/api/facebook/webhook/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { WebhookHandlerService } from '@/services/webhook-handler.service';
import { FacebookService } from '@/services/facebook.service';

// Handle webhook verification (GET)
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  try {
    const result = await WebhookHandlerService.verifyWebhook(
      mode!,
      token!,
      challenge!
    );
    return new NextResponse(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
  }
}

// Handle webhook events (POST)
export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-hub-signature-256');
  const body = await req.text();

  // Verify signature
  if (!signature || !FacebookService.verifyWebhookSignature(signature, body)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const data = JSON.parse(body);

  // Process each entry
  for (const entry of data.entry) {
    await WebhookHandlerService.handleLeadgenChange(entry);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
```

### 4.4 Create Pages API Route
Create `app/api/facebook/pages/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FacebookService } from '@/services/facebook.service';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/encryption';

// Get user's Facebook pages
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const fbService = new FacebookService(user.accessToken);
    const pages = await fbService.getPages();

    return NextResponse.json({ pages });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

// Connect a Facebook page
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { pageId, name, category, accessToken } = await req.json();

  try {
    // Save page to database
    const page = await prisma.page.upsert({
      where: { facebookPageId: pageId },
      update: {
        name,
        category,
        accessToken: encrypt(accessToken),
        isActive: true,
      },
      create: {
        facebookPageId: pageId,
        name,
        category,
        accessToken: encrypt(accessToken),
        userId: session.user.id,
      },
    });

    // Subscribe to leadgen webhooks
    const fbService = new FacebookService(encrypt(accessToken));
    await fbService.subscribeToLeadgen(pageId, accessToken);

    return NextResponse.json({ page });
  } catch (error) {
    console.error('Error connecting page:', error);
    return NextResponse.json(
      { error: 'Failed to connect page' },
      { status: 500 }
    );
  }
}

// Disconnect a Facebook page
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { pageId } = await req.json();

  try {
    const page = await prisma.page.findFirst({
      where: {
        facebookPageId: pageId,
        userId: session.user.id,
      },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Unsubscribe from webhooks
    const fbService = new FacebookService(page.accessToken);
    await fbService.unsubscribeFromLeadgen(
      pageId,
      decrypt(page.accessToken)
    );

    // Soft delete by marking inactive
    await prisma.page.update({
      where: { id: page.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting page:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect page' },
      { status: 500 }
    );
  }
}
```

### 4.5 Create Leads Sync API
Create `app/api/facebook/leads/sync/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FacebookService } from '@/services/facebook.service';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { LeadStatus } from '@prisma/client';

// Sync leads from Facebook
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { pageId, formId, limit = 100 } = await req.json();

  try {
    const page = await prisma.page.findFirst({
      where: {
        facebookPageId: pageId,
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const fbService = new FacebookService(page.accessToken);
    const pageAccessToken = decrypt(page.accessToken);

    // Get form details and leads
    const [formDetails, leads] = await Promise.all([
      fbService.getFormDetails(formId, pageAccessToken),
      fbService.getFormLeads(formId, pageAccessToken, limit),
    ]);

    let syncedCount = 0;
    let skippedCount = 0;

    for (const leadData of leads) {
      // Check if lead already exists
      const existingLead = await prisma.lead.findUnique({
        where: { facebookLeadId: leadData.id },
      });

      if (existingLead) {
        skippedCount++;
        continue;
      }

      // Get full lead details
      const leadDetails = await fbService.getLeadDetails(
        leadData.id,
        pageAccessToken
      );

      // Process and save lead
      const processedData = FacebookService.processFieldData(leadDetails.field_data);

      await prisma.lead.create({
        data: {
          facebookLeadId: leadData.id,
          pageId: page.id,
          formId: formId,
          formName: formDetails.name,
          campaignId: leadDetails.campaign_id,
          campaignName: leadDetails.campaign_name,
          adsetId: leadDetails.adset_id,
          adsetName: leadDetails.adset_name,
          adId: leadDetails.ad_id,
          adName: leadDetails.ad_name,
          leadData: processedData,
          status: LeadStatus.NEW,
        },
      });

      syncedCount++;
    }

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      skipped: skippedCount,
      total: leads.length,
    });
  } catch (error) {
    console.error('Error syncing leads:', error);
    return NextResponse.json(
      { error: 'Failed to sync leads' },
      { status: 500 }
    );
  }
}
```

### 4.6 Create Facebook Hook
Create `hooks/use-facebook.ts`:
```typescript
import { useState, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';

export function useFacebook() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/facebook/pages');
      return response.data.pages;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch Facebook pages',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const connectPage = useCallback(async (pageData: any) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/facebook/pages', pageData);
      toast({
        title: 'Success',
        description: 'Page connected successfully',
      });
      return response.data.page;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to connect page',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const disconnectPage = useCallback(async (pageId: string) => {
    setLoading(true);
    try {
      await axios.delete('/api/facebook/pages', { data: { pageId } });
      toast({
        title: 'Success',
        description: 'Page disconnected successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to disconnect page',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const syncLeads = useCallback(async (pageId: string, formId: string) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/facebook/leads/sync', {
        pageId,
        formId,
      });
      toast({
        title: 'Sync Complete',
        description: `Synced ${response.data.synced} new leads`,
      });
      return response.data;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sync leads',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    fetchPages,
    connectPage,
    disconnectPage,
    syncLeads,
  };
}
```

### 4.7 Create Facebook Types
Create `types/facebook.types.ts`:
```typescript
export interface FacebookPage {
  id: string;
  name: string;
  category?: string;
  access_token: string;
  picture?: {
    data: {
      url: string;
    };
  };
  fan_count?: number;
  is_published?: boolean;
}

export interface FacebookLead {
  id: string;
  created_time: string;
  field_data: FieldData[];
  form_id: string;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  is_organic: boolean;
}

export interface FieldData {
  name: string;
  values: string[];
}

export interface FacebookForm {
  id: string;
  name: string;
  status: string;
  created_time: string;
  questions: FormQuestion[];
  privacy_policy_url?: string;
  follow_up_action_url?: string;
}

export interface FormQuestion {
  key: string;
  label: string;
  type: string;
  options?: string[];
}

export interface WebhookEntry {
  id: string;
  time: number;
  changes: WebhookChange[];
}

export interface WebhookChange {
  field: string;
  value: any;
}
```

## Verification Steps
1. [ ] Facebook service methods working
2. [ ] Webhook verification successful
3. [ ] Lead capture from webhooks working
4. [ ] Page connection/disconnection working
5. [ ] Lead sync functionality working
6. [ ] Signature verification working
7. [ ] Error handling in place

## Security Considerations
- Webhook signature verification
- Access token encryption
- Rate limiting on API endpoints
- Proper error handling
- Token refresh mechanism

## Next Steps
- Proceed to Task 5: Lead Management System
- Test with real Facebook app
- Set up webhook endpoint in Facebook app
- Test lead capture flow

## Notes
- Facebook API version 19.0 used
- Webhook endpoint must be HTTPS in production
- Regular token refresh recommended
- Monitor API rate limits