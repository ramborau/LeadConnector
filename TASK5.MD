# Task 5: Lead Management System

## Status: PENDING

## Overview
Build a comprehensive lead management system with interfaces for viewing, filtering, searching, exporting leads, and tracking lead processing status with real-time updates.

## Prerequisites
- Tasks 1-4 completed
- Database models created
- Facebook integration working
- Authentication system functional

## Subtasks

### 5.1 Create Lead Service
Create `services/lead.service.ts`:
```typescript
import { prisma } from '@/lib/db';
import { LeadStatus, Prisma } from '@prisma/client';
import { WebhookService } from './webhook.service';

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
        { leadData: { string_contains: filters.search } },
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

  // Retry webhook delivery
  static async retryWebhookDelivery(leadId: string, webhookId: string, userId: string) {
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        page: { userId },
      },
      include: { page: true },
    });

    if (!lead) throw new Error('Lead not found');

    const webhook = await prisma.webhook.findFirst({
      where: {
        id: webhookId,
        userId,
      },
    });

    if (!webhook) throw new Error('Webhook not found');

    // Create new delivery attempt
    await WebhookService.createDelivery(lead, webhook);

    return { success: true };
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
```

### 5.2 Create Lead API Routes
Create `app/api/leads/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { LeadService } from '@/services/lead.service';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  
  // Parse filters
  const filters = {
    pageId: searchParams.get('pageId') || undefined,
    status: searchParams.get('status') as any || undefined,
    formId: searchParams.get('formId') || undefined,
    campaignId: searchParams.get('campaignId') || undefined,
    dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
    dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
    search: searchParams.get('search') || undefined,
  };

  // Parse pagination
  const pagination = {
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
  };

  try {
    const result = await LeadService.getLeads(
      session.user.id,
      filters,
      pagination
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}
```

### 5.3 Create Lead Detail API
Create `app/api/leads/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { LeadService } from '@/services/lead.service';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const lead = await LeadService.getLeadById(params.id, session.user.id);
    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      { error: 'Lead not found' },
      { status: 404 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { status } = await req.json();

  try {
    const lead = await LeadService.updateLeadStatus(
      params.id,
      status,
      session.user.id
    );
    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}
```

### 5.4 Create Lead Table Component
Create `components/leads/lead-table.tsx`:
```typescript
'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, RefreshCw, Download } from 'lucide-react';
import { format } from 'date-fns';
import { LeadStatus } from '@prisma/client';
import { useRouter } from 'next/navigation';

interface Lead {
  id: string;
  formName: string;
  campaignName?: string;
  status: LeadStatus;
  createdAt: string;
  leadData: any;
  page: {
    name: string;
  };
}

interface LeadTableProps {
  leads: Lead[];
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  onRetry: (leadId: string) => void;
}

export function LeadTable({ leads, onStatusChange, onRetry }: LeadTableProps) {
  const router = useRouter();

  const getStatusBadge = (status: LeadStatus) => {
    const variants = {
      NEW: 'default',
      PROCESSING: 'secondary',
      DELIVERED: 'success',
      FAILED: 'destructive',
      ARCHIVED: 'outline',
    } as const;

    return (
      <Badge variant={variants[status] as any}>
        {status}
      </Badge>
    );
  };

  const getLeadName = (data: any) => {
    return data.full_name || data.name || data.first_name || 'N/A';
  };

  const getLeadEmail = (data: any) => {
    return data.email || 'N/A';
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Lead</TableHead>
          <TableHead>Page</TableHead>
          <TableHead>Form</TableHead>
          <TableHead>Campaign</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell>
              <div>
                <div className="font-medium">{getLeadName(lead.leadData)}</div>
                <div className="text-sm text-muted-foreground">
                  {getLeadEmail(lead.leadData)}
                </div>
              </div>
            </TableCell>
            <TableCell>{lead.page.name}</TableCell>
            <TableCell>{lead.formName}</TableCell>
            <TableCell>{lead.campaignName || '-'}</TableCell>
            <TableCell>{getStatusBadge(lead.status)}</TableCell>
            <TableCell>
              {format(new Date(lead.createdAt), 'MMM d, yyyy HH:mm')}
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => router.push(`/leads/${lead.id}`)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  {lead.status === LeadStatus.FAILED && (
                    <DropdownMenuItem onClick={() => onRetry(lead.id)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry Webhook
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => onStatusChange(lead.id, LeadStatus.ARCHIVED)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### 5.5 Create Lead Filters Component
Create `components/leads/lead-filters.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Search, Filter, X } from 'lucide-react';
import { LeadStatus } from '@prisma/client';

interface LeadFiltersProps {
  pages: Array<{ id: string; name: string }>;
  onFilterChange: (filters: any) => void;
}

export function LeadFilters({ pages, onFilterChange }: LeadFiltersProps) {
  const [filters, setFilters] = useState({
    search: '',
    pageId: '',
    status: '',
    dateRange: null as any,
  });

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      pageId: '',
      status: '',
      dateRange: null,
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={filters.pageId}
          onValueChange={(value) => handleFilterChange('pageId', value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Pages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Pages</SelectItem>
            {pages.map((page) => (
              <SelectItem key={page.id} value={page.id}>
                {page.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.status}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            {Object.values(LeadStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DatePickerWithRange
          value={filters.dateRange}
          onChange={(range) => handleFilterChange('dateRange', range)}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={clearFilters}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

### 5.6 Create Lead Detail Component
Create `components/leads/lead-detail.tsx`:
```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { RefreshCw, Download } from 'lucide-react';

interface LeadDetailProps {
  lead: any;
  onRetry: (webhookId: string) => void;
}

export function LeadDetail({ lead, onRetry }: LeadDetailProps) {
  const renderFieldValue = (value: any) => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return value || 'N/A';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lead Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Lead ID</dt>
              <dd className="text-sm">{lead.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Facebook Lead ID</dt>
              <dd className="text-sm">{lead.facebookLeadId}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Status</dt>
              <dd>
                <Badge>{lead.status}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Created</dt>
              <dd className="text-sm">
                {format(new Date(lead.createdAt), 'MMM d, yyyy HH:mm:ss')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Page</dt>
              <dd className="text-sm">{lead.page.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Form</dt>
              <dd className="text-sm">{lead.formName}</dd>
            </div>
            {lead.campaignName && (
              <>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Campaign</dt>
                  <dd className="text-sm">{lead.campaignName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Ad Set</dt>
                  <dd className="text-sm">{lead.adsetName || 'N/A'}</dd>
                </div>
              </>
            )}
          </dl>
        </CardContent>
      </Card>

      <Tabs defaultValue="data">
        <TabsList>
          <TabsTrigger value="data">Lead Data</TabsTrigger>
          <TabsTrigger value="deliveries">Webhook Deliveries</TabsTrigger>
        </TabsList>
        
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Form Data</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                {Object.entries(lead.leadData).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {key.replace(/_/g, ' ').toUpperCase()}
                    </dt>
                    <dd className="text-sm mt-1">
                      {renderFieldValue(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="deliveries">
          <Card>
            <CardHeader>
              <CardTitle>Delivery History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lead.deliveries.map((delivery: any) => (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between border-b pb-4"
                  >
                    <div>
                      <div className="font-medium">{delivery.webhook.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {delivery.webhook.url}
                      </div>
                      <div className="text-sm">
                        {format(new Date(delivery.createdAt), 'MMM d, yyyy HH:mm:ss')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          delivery.status === 'SUCCESS' ? 'success' :
                          delivery.status === 'FAILED' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {delivery.status}
                      </Badge>
                      {delivery.status === 'FAILED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRetry(delivery.webhook.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 5.7 Create Leads Page
Create `app/(dashboard)/leads/page.tsx`:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useLeads } from '@/hooks/use-leads';
import { LeadTable } from '@/components/leads/lead-table';
import { LeadFilters } from '@/components/leads/lead-filters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, RefreshCw } from 'lucide-react';
import { LeadStatus } from '@prisma/client';

export default function LeadsPage() {
  const { 
    leads, 
    loading, 
    fetchLeads, 
    updateLeadStatus, 
    retryWebhook,
    exportLeads,
    pages 
  } = useLeads();

  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    fetchLeads(filters, pagination);
  }, [filters, pagination]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPagination({ ...pagination, page: 1 });
  };

  const handleExport = async () => {
    await exportLeads(filters);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-dark">Leads</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchLeads(filters, pagination)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <LeadFilters 
        pages={pages} 
        onFilterChange={handleFilterChange}
      />

      <Card>
        <CardHeader>
          <CardTitle>Lead List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <LeadTable
              leads={leads.data}
              onStatusChange={updateLeadStatus}
              onRetry={retryWebhook}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

## Verification Steps
1. [ ] Lead listing with pagination working
2. [ ] Filtering and search functional
3. [ ] Lead detail view working
4. [ ] Status updates working
5. [ ] Webhook retry functional
6. [ ] Export to CSV working
7. [ ] Real-time updates working

## Performance Considerations
- Pagination for large datasets
- Indexed database queries
- Optimistic UI updates
- Debounced search input
- Lazy loading for details

## Next Steps
- Proceed to Task 6: Webhook Configuration
- Implement real-time updates
- Add bulk operations
- Create lead analytics

## Notes
- Consider WebSocket for real-time updates
- Implement rate limiting on API
- Add audit logging for changes
- Monitor query performance