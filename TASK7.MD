# Task 7: Dashboard and Analytics

## Status: PENDING

## Overview
Create a comprehensive dashboard with real-time analytics, monitoring capabilities, lead statistics, webhook performance metrics, and interactive charts for business insights.

## Prerequisites
- Tasks 1-6 completed
- All services and APIs functional
- Database with analytics queries
- UI components library ready

## Subtasks

### 7.1 Create Analytics Service
Create `services/analytics.service.ts`:
```typescript
import { prisma } from '@/lib/db';
import { LeadStatus, DeliveryStatus } from '@prisma/client';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

export class AnalyticsService {
  // Get dashboard overview stats
  static async getDashboardStats(userId: string) {
    // Get user's pages
    const userPages = await prisma.page.findMany({
      where: { userId },
      select: { id: true },
    });
    const pageIds = userPages.map(p => p.id);

    const today = new Date();
    const yesterday = subDays(today, 1);
    const thisWeek = subDays(today, 7);
    const thisMonth = subDays(today, 30);

    const [
      totalLeads,
      todayLeads,
      weekLeads,
      monthLeads,
      deliveredLeads,
      failedLeads,
      pendingLeads,
      totalWebhooks,
      activeWebhooks,
    ] = await Promise.all([
      // Lead counts
      prisma.lead.count({ where: { pageId: { in: pageIds } } }),
      prisma.lead.count({
        where: {
          pageId: { in: pageIds },
          createdAt: { gte: startOfDay(today) },
        },
      }),
      prisma.lead.count({
        where: {
          pageId: { in: pageIds },
          createdAt: { gte: startOfDay(thisWeek) },
        },
      }),
      prisma.lead.count({
        where: {
          pageId: { in: pageIds },
          createdAt: { gte: startOfDay(thisMonth) },
        },
      }),
      // Status counts
      prisma.lead.count({
        where: { pageId: { in: pageIds }, status: LeadStatus.DELIVERED },
      }),
      prisma.lead.count({
        where: { pageId: { in: pageIds }, status: LeadStatus.FAILED },
      }),
      prisma.lead.count({
        where: { pageId: { in: pageIds }, status: LeadStatus.NEW },
      }),
      // Webhook counts
      prisma.webhook.count({ where: { userId } }),
      prisma.webhook.count({ where: { userId, isActive: true } }),
    ]);

    // Calculate rates
    const deliveryRate = totalLeads > 0 ? Math.round((deliveredLeads / totalLeads) * 100) : 0;
    const failureRate = totalLeads > 0 ? Math.round((failedLeads / totalLeads) * 100) : 0;

    return {
      leads: {
        total: totalLeads,
        today: todayLeads,
        week: weekLeads,
        month: monthLeads,
        delivered: deliveredLeads,
        failed: failedLeads,
        pending: pendingLeads,
        deliveryRate,
        failureRate,
      },
      webhooks: {
        total: totalWebhooks,
        active: activeWebhooks,
      },
    };
  }

  // Get leads over time data
  static async getLeadsOverTime(userId: string, days: number = 30) {
    const userPages = await prisma.page.findMany({
      where: { userId },
      select: { id: true },
    });
    const pageIds = userPages.map(p => p.id);

    const startDate = subDays(new Date(), days);
    
    const leads = await prisma.lead.groupBy({
      by: ['createdAt'],
      where: {
        pageId: { in: pageIds },
        createdAt: { gte: startDate },
      },
      _count: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const dailyLeads = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const date = subDays(new Date(), i);
      const dateKey = format(date, 'yyyy-MM-dd');
      dailyLeads.set(dateKey, 0);
    }

    leads.forEach(lead => {
      const dateKey = format(new Date(lead.createdAt), 'yyyy-MM-dd');
      if (dailyLeads.has(dateKey)) {
        dailyLeads.set(dateKey, dailyLeads.get(dateKey)! + lead._count.id);
      }
    });

    return Array.from(dailyLeads.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Get top performing pages
  static async getTopPages(userId: string, limit: number = 5) {
    const pages = await prisma.page.findMany({
      where: { userId },
      include: {
        _count: {
          select: { leads: true },
        },
        leads: {
          select: { status: true },
        },
      },
      orderBy: {
        leads: { _count: 'desc' },
      },
      take: limit,
    });

    return pages.map(page => {
      const totalLeads = page._count.leads;
      const deliveredLeads = page.leads.filter(l => l.status === LeadStatus.DELIVERED).length;
      const deliveryRate = totalLeads > 0 ? Math.round((deliveredLeads / totalLeads) * 100) : 0;

      return {
        id: page.id,
        name: page.name,
        totalLeads,
        deliveryRate,
        isActive: page.isActive,
      };
    });
  }

  // Get webhook performance
  static async getWebhookPerformance(userId: string) {
    const webhooks = await prisma.webhook.findMany({
      where: { userId },
      include: {
        deliveries: {
          select: { status: true, createdAt: true },
        },
      },
    });

    return webhooks.map(webhook => {
      const deliveries = webhook.deliveries;
      const total = deliveries.length;
      const successful = deliveries.filter(d => d.status === DeliveryStatus.SUCCESS).length;
      const failed = deliveries.filter(d => d.status === DeliveryStatus.FAILED).length;
      const pending = deliveries.filter(d => 
        d.status === DeliveryStatus.PENDING || d.status === DeliveryStatus.RETRYING
      ).length;
      
      const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;

      return {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        isActive: webhook.isActive,
        total,
        successful,
        failed,
        pending,
        successRate,
        lastSuccess: webhook.lastSuccess,
        lastFailure: webhook.lastFailure,
      };
    });
  }

  // Get form performance
  static async getFormPerformance(userId: string, limit: number = 10) {
    const userPages = await prisma.page.findMany({
      where: { userId },
      select: { id: true },
    });
    const pageIds = userPages.map(p => p.id);

    const forms = await prisma.lead.groupBy({
      by: ['formName', 'formId'],
      where: { pageId: { in: pageIds } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    return forms.map(form => ({
      formId: form.formId,
      formName: form.formName,
      leadCount: form._count.id,
    }));
  }

  // Get recent activity
  static async getRecentActivity(userId: string, limit: number = 10) {
    const userPages = await prisma.page.findMany({
      where: { userId },
      select: { id: true },
    });
    const pageIds = userPages.map(p => p.id);

    const [recentLeads, recentDeliveries] = await Promise.all([
      prisma.lead.findMany({
        where: { pageId: { in: pageIds } },
        include: { page: true },
        orderBy: { createdAt: 'desc' },
        take: limit / 2,
      }),
      prisma.webhookDelivery.findMany({
        where: {
          webhook: { userId },
        },
        include: {
          webhook: true,
          lead: { include: { page: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit / 2,
      }),
    ]);

    const activity = [
      ...recentLeads.map(lead => ({
        type: 'lead_received' as const,
        id: lead.id,
        title: `New lead from ${lead.page.name}`,
        description: `Form: ${lead.formName}`,
        timestamp: lead.createdAt,
        status: lead.status,
      })),
      ...recentDeliveries.map(delivery => ({
        type: 'webhook_delivery' as const,
        id: delivery.id,
        title: `Webhook ${delivery.status.toLowerCase()}`,
        description: `${delivery.webhook.name} -> ${delivery.lead.page.name}`,
        timestamp: delivery.createdAt,
        status: delivery.status,
      })),
    ];

    return activity
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Get conversion funnel
  static async getConversionFunnel(userId: string) {
    const userPages = await prisma.page.findMany({
      where: { userId },
      select: { id: true },
    });
    const pageIds = userPages.map(p => p.id);

    const [
      totalLeads,
      processedLeads,
      deliveredLeads,
      failedLeads,
    ] = await Promise.all([
      prisma.lead.count({ where: { pageId: { in: pageIds } } }),
      prisma.lead.count({
        where: {
          pageId: { in: pageIds },
          status: { not: LeadStatus.NEW },
        },
      }),
      prisma.lead.count({
        where: { pageId: { in: pageIds }, status: LeadStatus.DELIVERED },
      }),
      prisma.lead.count({
        where: { pageId: { in: pageIds }, status: LeadStatus.FAILED },
      }),
    ]);

    return [
      { stage: 'Leads Received', count: totalLeads, percentage: 100 },
      {
        stage: 'Processed',
        count: processedLeads,
        percentage: totalLeads > 0 ? Math.round((processedLeads / totalLeads) * 100) : 0,
      },
      {
        stage: 'Successfully Delivered',
        count: deliveredLeads,
        percentage: totalLeads > 0 ? Math.round((deliveredLeads / totalLeads) * 100) : 0,
      },
      {
        stage: 'Failed',
        count: failedLeads,
        percentage: totalLeads > 0 ? Math.round((failedLeads / totalLeads) * 100) : 0,
      },
    ];
  }
}
```

### 7.2 Create Analytics API Routes
Create `app/api/analytics/dashboard/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AnalyticsService } from '@/services/analytics.service';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stats = await AnalyticsService.getDashboardStats(session.user.id);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
```

### 7.3 Create Stats Cards Component
Create `components/dashboard/stats-cards.tsx`:
```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Activity, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StatsCardsProps {
  stats: {
    leads: {
      total: number;
      today: number;
      week: number;
      month: number;
      delivered: number;
      failed: number;
      pending: number;
      deliveryRate: number;
      failureRate: number;
    };
    webhooks: {
      total: number;
      active: number;
    };
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Leads",
      value: stats.leads.total.toLocaleString(),
      icon: Users,
      description: "All time captured leads",
      trend: {
        value: stats.leads.week,
        label: "This week",
        type: "positive" as const,
      },
    },
    {
      title: "Today's Leads",
      value: stats.leads.today,
      icon: Activity,
      description: "Captured in last 24 hours",
      trend: {
        value: stats.leads.month,
        label: "This month",
        type: "positive" as const,
      },
    },
    {
      title: "Active Webhooks",
      value: stats.webhooks.active,
      icon: Zap,
      description: `${stats.webhooks.total} total configured`,
      trend: {
        value: stats.leads.deliveryRate,
        label: "Delivery rate",
        type: stats.leads.deliveryRate > 80 ? "positive" : "negative",
        suffix: "%",
      },
    },
    {
      title: "Success Rate",
      value: `${stats.leads.deliveryRate}%`,
      icon: stats.leads.deliveryRate > 80 ? TrendingUp : TrendingDown,
      description: "Webhook delivery success",
      trend: {
        value: stats.leads.failureRate,
        label: "Failure rate",
        type: "negative" as const,
        suffix: "%",
      },
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mb-2">
              {card.description}
            </p>
            {card.trend && (
              <div className="flex items-center text-xs">
                <Badge
                  variant={card.trend.type === "positive" ? "success" : "destructive"}
                  className="mr-1"
                >
                  {card.trend.value}{card.trend.suffix || ""}
                </Badge>
                <span className="text-muted-foreground">{card.trend.label}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### 7.4 Create Recent Activity Component
Create `components/dashboard/recent-activity.tsx`:
```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  User, 
  Webhook, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  type: 'lead_received' | 'webhook_delivery';
  id: string;
  title: string;
  description: string;
  timestamp: string;
  status: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (activity: Activity) => {
    if (activity.type === 'lead_received') {
      return <User className="h-4 w-4" />;
    }
    
    switch (activity.status) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PENDING':
      case 'RETRYING':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Webhook className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      NEW: 'default',
      PROCESSING: 'secondary',
      DELIVERED: 'success',
      FAILED: 'destructive',
      SUCCESS: 'success',
      PENDING: 'secondary',
      RETRYING: 'secondary',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] as any} className="text-xs">
        {status}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No recent activity
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">
                        {activity.title}
                      </p>
                      {getStatusBadge(activity.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
```

### 7.5 Create Leads Chart Component
Create `components/dashboard/leads-chart.tsx`:
```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { format } from 'date-fns';

interface LeadsChartProps {
  data: Array<{
    date: string;
    count: number;
  }>;
}

export function LeadsChart({ data }: LeadsChartProps) {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="text-sm font-medium">{formatDate(label)}</p>
          <p className="text-sm text-primary">
            {payload[0].value} leads
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Leads Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00c307" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00c307" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#00c307"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorLeads)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 7.6 Create Webhook Performance Component
Create `components/dashboard/webhook-performance.tsx`:
```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Activity,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface WebhookPerformanceProps {
  webhooks: Array<{
    id: string;
    name: string;
    url: string;
    isActive: boolean;
    total: number;
    successful: number;
    failed: number;
    pending: number;
    successRate: number;
    lastSuccess?: string;
    lastFailure?: string;
  }>;
}

export function WebhookPerformance({ webhooks }: WebhookPerformanceProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Webhook Performance</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/webhooks">
            <ExternalLink className="mr-2 h-4 w-4" />
            Manage
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {webhooks.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No webhooks configured
            </div>
          ) : (
            webhooks.map((webhook) => (
              <div key={webhook.id} className="space-y-2 p-3 border rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{webhook.name}</h4>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {webhook.url}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={webhook.isActive ? 'success' : 'secondary'}>
                      {webhook.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {webhook.successRate}%
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Success Rate</span>
                    <span>{webhook.successRate}%</span>
                  </div>
                  <Progress value={webhook.successRate} className="h-2" />
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center space-x-1">
                    <Activity className="h-3 w-3 text-muted-foreground" />
                    <span>{webhook.total}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>{webhook.successful}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <XCircle className="h-3 w-3 text-red-500" />
                    <span>{webhook.failed}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-yellow-500" />
                    <span>{webhook.pending}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 7.7 Create Dashboard Page
Create `app/(dashboard)/dashboard/page.tsx`:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { LeadsChart } from '@/components/dashboard/leads-chart';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { WebhookPerformance } from '@/components/dashboard/webhook-performance';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useAnalytics } from '@/hooks/use-analytics';

export default function DashboardPage() {
  const { 
    stats, 
    leadsChart, 
    recentActivity, 
    webhookPerformance,
    loading, 
    fetchDashboardData 
  } = useAnalytics();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-dark">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your lead generation and webhook performance
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {stats && <StatsCards stats={stats} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {leadsChart && (
          <div className="lg:col-span-2">
            <LeadsChart data={leadsChart} />
          </div>
        )}
        {webhookPerformance && (
          <WebhookPerformance webhooks={webhookPerformance} />
        )}
      </div>

      {recentActivity && <RecentActivity activities={recentActivity} />}
    </div>
  );
}
```

### 7.8 Create Analytics Hook
Create `hooks/use-analytics.ts`:
```typescript
import { useState, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';

export function useAnalytics() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [leadsChart, setLeadsChart] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any>(null);
  const [webhookPerformance, setWebhookPerformance] = useState<any>(null);
  const { toast } = useToast();

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        dashboardResponse,
        chartResponse,
        activityResponse,
        webhookResponse,
      ] = await Promise.all([
        axios.get('/api/analytics/dashboard'),
        axios.get('/api/analytics/leads-chart'),
        axios.get('/api/analytics/activity'),
        axios.get('/api/analytics/webhook-performance'),
      ]);

      setStats(dashboardResponse.data);
      setLeadsChart(chartResponse.data);
      setRecentActivity(activityResponse.data);
      setWebhookPerformance(webhookResponse.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    stats,
    leadsChart,
    recentActivity,
    webhookPerformance,
    loading,
    fetchDashboardData,
  };
}
```

## Verification Steps
1. [ ] Dashboard stats loading correctly
2. [ ] Charts rendering with data
3. [ ] Real-time activity feed working
4. [ ] Webhook performance metrics accurate
5. [ ] Responsive design working
6. [ ] Refresh functionality working
7. [ ] Navigation between sections working

## Performance Considerations
- Cached analytics queries
- Optimized database aggregations
- Lazy loading for charts
- Efficient data transformations
- Proper indexes for analytics

## Next Steps
- Add more detailed analytics
- Implement real-time updates
- Create export functionality
- Add custom date ranges

## Notes
- Consider using React Query for caching
- Monitor query performance
- Add analytics data retention policy
- Implement user activity tracking