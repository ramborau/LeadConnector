import axios, { AxiosRequestConfig } from 'axios';
import { prisma } from '@/lib/db';
import { Lead, Webhook, DeliveryStatus, AuthType } from '@prisma/client';
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