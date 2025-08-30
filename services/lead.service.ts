import { prisma } from '@/lib/db';
import { LeadStatus, Prisma } from '@prisma/client';

export interface LeadFilters {
  pageId?: string;
  status?: LeadStatus;
  formId?: string;
  campaignId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class LeadService {
  // Get leads with filters and pagination
  static async getLeads(
    userId: string,
    filters: LeadFilters,
    pagination: PaginationParams
  ) {
    // Get user's pages
    const userPages = await prisma.page.findMany({
      where: { userId },
      select: { id: true },
    });
    
    const pageIds = userPages.map(p => p.id);

    // Build where clause
    const where: Prisma.LeadWhereInput = {
      pageId: { in: pageIds },
    };

    if (filters.pageId) where.pageId = filters.pageId;
    if (filters.status) where.status = filters.status;
    if (filters.formId) where.formId = filters.formId;
    if (filters.campaignId) where.campaignId = filters.campaignId;
    
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    if (filters.search) {
      where.OR = [
        { formName: { contains: filters.search, mode: 'insensitive' } },
        { campaignName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.lead.count({ where });

    // Get paginated leads
    const leads = await prisma.lead.findMany({
      where,
      include: {
        page: true,
        deliveries: {
          include: { webhook: true },
        },
      },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
      orderBy: {
        [pagination.sortBy || 'createdAt']: pagination.sortOrder || 'desc',
      },
    });

    return {
      leads,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  // Get single lead details
  static async getLeadById(leadId: string, userId: string) {
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        page: {
          userId,
        },
      },
      include: {
        page: true,
        deliveries: {
          include: { webhook: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!lead) throw new Error('Lead not found');

    return lead;
  }

  // Update lead status
  static async updateLeadStatus(leadId: string, status: LeadStatus, userId: string) {
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        page: { userId },
      },
    });

    if (!lead) throw new Error('Lead not found');

    return await prisma.lead.update({
      where: { id: leadId },
      data: {
        status,
        processedAt: status === LeadStatus.DELIVERED ? new Date() : undefined,
      },
    });
  }

  // Export leads to CSV
  static async exportLeads(userId: string, filters: LeadFilters) {
    const { leads } = await this.getLeads(
      userId,
      filters,
      { page: 1, limit: 10000 } // Export up to 10k leads
    );

    const csvHeaders = [
      'Lead ID',
      'Page',
      'Form',
      'Campaign',
      'Status',
      'Created At',
      'Email',
      'Name',
      'Phone',
      'Custom Fields',
    ];

    const csvRows = leads.map(lead => {
      const data = lead.leadData as any;
      return [
        lead.id,
        lead.page.name,
        lead.formName,
        lead.campaignName || '',
        lead.status,
        lead.createdAt.toISOString(),
        data.email || '',
        data.full_name || data.name || '',
        data.phone_number || data.phone || '',
        JSON.stringify(data),
      ];
    });

    return {
      headers: csvHeaders,
      rows: csvRows,
    };
  }

  // Get lead statistics
  static async getLeadStats(userId: string, pageId?: string) {
    const where: Prisma.LeadWhereInput = {
      page: { userId },
    };

    if (pageId) where.pageId = pageId;

    const [total, delivered, failed, pending, todayCount] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.count({ where: { ...where, status: LeadStatus.DELIVERED } }),
      prisma.lead.count({ where: { ...where, status: LeadStatus.FAILED } }),
      prisma.lead.count({ where: { ...where, status: LeadStatus.NEW } }),
      prisma.lead.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      total,
      delivered,
      failed,
      pending,
      todayCount,
      deliveryRate: total > 0 ? Math.round((delivered / total) * 100) : 0,
    };
  }

  // Bulk update leads
  static async bulkUpdateStatus(leadIds: string[], status: LeadStatus, userId: string) {
    // Verify all leads belong to user
    const leads = await prisma.lead.findMany({
      where: {
        id: { in: leadIds },
        page: { userId },
      },
    });

    if (leads.length !== leadIds.length) {
      throw new Error('Some leads not found or unauthorized');
    }

    const result = await prisma.lead.updateMany({
      where: { id: { in: leadIds } },
      data: {
        status,
        processedAt: status === LeadStatus.DELIVERED ? new Date() : undefined,
      },
    });

    return result;
  }
}