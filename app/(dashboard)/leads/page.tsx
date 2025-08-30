'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LeadsFilter from '@/components/leads-filter';
import LeadsExport from '@/components/leads-export';
import { 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  ExternalLink, 
  Eye,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

export default function LeadsPage() {
  const { data: session } = useSession();
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    pageId: 'all',
    dateFrom: '',
    dateTo: ''
  });

  const fetchLeads = async () => {
    if (!session) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.set('status', filters.status);
      if (filters.pageId && filters.pageId !== 'all') params.set('pageId', filters.pageId);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      
      const response = await fetch(`/api/leads?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads);
        setStats(data.stats);
        
        // Extract unique pages from leads data
        const uniquePages = Array.from(
          new Map(
            data.leads.map((lead: any) => [lead.pageId, { id: lead.pageId, name: lead.pageName }])
          ).values()
        );
        setPages(uniquePages);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [session, filters]);

  // Transform database leads to match UI format
  const transformedLeads = leads.map(lead => ({
    id: lead.id,
    name: lead.leadData?.name || 'Unknown',
    email: lead.leadData?.email || '',
    phone: lead.leadData?.phone || '',
    company: lead.leadData?.company || '',
    jobTitle: lead.leadData?.job_title || '',
    source: 'Facebook Lead Ad',
    campaignName: lead.campaignName || '',
    formName: lead.formName || '',
    createdAt: new Date(lead.createdAt),
    status: lead.status.toLowerCase(),
    pageId: lead.pageId,
    pageName: lead.pageName || ''
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800'; 
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading leads...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-dark">Leads</h1>
          <p className="text-muted-foreground">
            Manage and track leads captured from Facebook Lead Ads
          </p>
        </div>
        <div className="flex gap-2">
          <LeadsFilter 
            filters={filters}
            onFiltersChange={setFilters}
            pages={pages}
          />
          <LeadsExport 
            leads={transformedLeads}
            filters={filters}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.delivered || 0}</p>
                <p className="text-xs text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.processing || 0}</p>
                <p className="text-xs text-muted-foreground">Processing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.today || 0}</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transformedLeads.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No leads found</h3>
                <p className="text-muted-foreground">
                  Connect your Facebook pages and start running Lead Ads to see leads here.
                </p>
              </div>
            ) : (
              transformedLeads.map((lead) => (
                <div key={lead.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{lead.name}</h3>
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status}
                        </Badge>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{lead.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{lead.phone}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{format(lead.createdAt, 'MMM dd, yyyy HH:mm')}</span>
                          </div>
                          <div className="text-muted-foreground">
                            <span className="font-medium">Source:</span> {lead.pageName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span><strong>Campaign:</strong> {lead.campaignName}</span>
                        <span><strong>Form:</strong> {lead.formName}</span>
                        <span><strong>Company:</strong> {lead.company}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}