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