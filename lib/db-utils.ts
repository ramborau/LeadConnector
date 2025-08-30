import { prisma } from '@/lib/db';
import { LeadStatus, DeliveryStatus } from '@prisma/client';

export async function getDatabaseStats() {
  const [userCount, pageCount, leadCount, webhookCount] = await Promise.all([
    prisma.user.count(),
    prisma.page.count(),
    prisma.lead.count(),
    prisma.webhook.count(),
  ]);

  return {
    users: userCount,
    pages: pageCount,
    leads: leadCount,
    webhooks: webhookCount,
  };
}

export async function getLeadStats(userId: string) {
  const pages = await prisma.page.findMany({
    where: { userId },
    select: { id: true },
  });

  const pageIds = pages.map(p => p.id);

  const [total, delivered, failed, pending] = await Promise.all([
    prisma.lead.count({ where: { pageId: { in: pageIds } } }),
    prisma.lead.count({ where: { pageId: { in: pageIds }, status: LeadStatus.DELIVERED } }),
    prisma.lead.count({ where: { pageId: { in: pageIds }, status: LeadStatus.FAILED } }),
    prisma.lead.count({ where: { pageId: { in: pageIds }, status: LeadStatus.NEW } }),
  ]);

  return { total, delivered, failed, pending };
}

export async function getWebhookStats(userId: string) {
  const webhooks = await prisma.webhook.findMany({
    where: { userId },
    include: {
      deliveries: {
        select: { status: true },
      },
    },
  });

  const stats = webhooks.reduce(
    (acc, webhook) => {
      acc.total++;
      if (webhook.isActive) acc.active++;
      
      webhook.deliveries.forEach(delivery => {
        if (delivery.status === DeliveryStatus.SUCCESS) acc.successful++;
        if (delivery.status === DeliveryStatus.FAILED) acc.failed++;
      });
      
      return acc;
    },
    { total: 0, active: 0, successful: 0, failed: 0 }
  );

  return stats;
}

export async function cleanupOldData(daysToKeep: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const deletedLeads = await prisma.lead.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      status: LeadStatus.ARCHIVED,
    },
  });

  const deletedDeliveries = await prisma.webhookDelivery.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      status: { in: [DeliveryStatus.SUCCESS, DeliveryStatus.FAILED] },
    },
  });

  return {
    deletedLeads: deletedLeads.count,
    deletedDeliveries: deletedDeliveries.count,
  };
}