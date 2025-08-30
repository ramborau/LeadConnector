import { Prisma } from '@prisma/client';

// User types
export type UserWithPages = Prisma.UserGetPayload<{
  include: { pages: true };
}>;

export type UserWithWebhooks = Prisma.UserGetPayload<{
  include: { webhooks: true };
}>;

// Page types
export type PageWithLeads = Prisma.PageGetPayload<{
  include: { leads: true };
}>;

export type PageWithWebhooks = Prisma.PageGetPayload<{
  include: { webhookConfigs: { include: { webhook: true } } };
}>;

// Lead types
export type LeadWithDeliveries = Prisma.LeadGetPayload<{
  include: { deliveries: true };
}>;

export type LeadWithPage = Prisma.LeadGetPayload<{
  include: { page: true };
}>;

// Webhook types
export type WebhookWithDeliveries = Prisma.WebhookGetPayload<{
  include: { deliveries: true };
}>;

export type WebhookWithPages = Prisma.WebhookGetPayload<{
  include: { pageConfigs: { include: { page: true } } };
}>;

// Delivery types
export type DeliveryWithDetails = Prisma.WebhookDeliveryGetPayload<{
  include: { webhook: true; lead: { include: { page: true } } };
}>;