'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  ExternalLink, 
  Download,
  Filter,
  Search,
  Eye,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';

export default function LeadsPage() {
  const { data: session } = useSession();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  // Mock leads data for demonstration
  const mockLeads = [
    {
      id: 'lead_001',
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+1 (555) 123-4567',
      company: 'Tech Solutions Inc',
      jobTitle: 'Marketing Director',
      source: 'Facebook Lead Ad',
      campaignName: 'Summer Marketing Campaign',
      formName: 'Contact Us Form',
      createdAt: new Date('2024-08-30T10:30:00'),
      status: 'new',
      pageId: '123456789',
      pageName: 'SARACE Digital Solutions'
    },
    {
      id: 'lead_002', 
      name: 'Sarah Johnson',
      email: 'sarah.j@company.com',
      phone: '+1 (555) 987-6543',
      company: 'Growth Marketing LLC',
      jobTitle: 'CEO',
      source: 'Facebook Lead Ad',
      campaignName: 'Lead Generation Campaign',
      formName: 'Get Quote Form',
      createdAt: new Date('2024-08-30T09:15:00'),
      status: 'contacted',
      pageId: '123456789',
      pageName: 'SARACE Digital Solutions'
    },
    {
      id: 'lead_003',
      name: 'Mike Wilson',
      email: 'mike.wilson@startup.io',
      phone: '+1 (555) 456-7890',
      company: 'StartupIO',
      jobTitle: 'Founder',
      source: 'Facebook Lead Ad',
      campaignName: 'Product Launch Campaign',
      formName: 'Demo Request Form',
      createdAt: new Date('2024-08-29T16:45:00'),
      status: 'qualified',
      pageId: '987654321',
      pageName: 'LeadConnector Demo Page'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800'; 
      case 'qualified': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
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
                <p className="text-2xl font-bold">{mockLeads.length}</p>
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
                <p className="text-2xl font-bold">
                  {mockLeads.filter(l => l.status === 'qualified').length}
                </p>
                <p className="text-xs text-muted-foreground">Qualified</p>
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
                <p className="text-2xl font-bold">
                  {mockLeads.filter(l => l.status === 'contacted').length}
                </p>
                <p className="text-xs text-muted-foreground">Contacted</p>
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
                <p className="text-2xl font-bold">
                  {mockLeads.filter(l => 
                    new Date(l.createdAt).toDateString() === new Date().toDateString()
                  ).length}
                </p>
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
            {mockLeads.map((lead) => (
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}