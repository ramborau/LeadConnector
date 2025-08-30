import { prisma } from '@/lib/db';
import { FacebookService } from './facebook.service';
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

      // Import WebhookService dynamically to avoid circular dependency
      const { WebhookService } = await import('./webhook.service');
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