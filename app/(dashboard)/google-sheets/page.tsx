'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  FileSpreadsheet, 
  Plus, 
  MapPin, 
  CheckCircle, 
  ExternalLink, 
  Settings,
  ArrowRight,
  Loader2,
  AlertCircle,
  Trash2,
  RefreshCw,
  Users,
  Calendar,
  Mail,
  Phone,
  Building
} from 'lucide-react';
import { format } from 'date-fns';

interface GoogleSheetsIntegration {
  id: string;
  pageId: string;
  pageName: string;
  spreadsheetId: string;
  spreadsheetName: string;
  sheetName: string;
  isActive: boolean;
  lastSync?: string;
  totalLeads: number;
  columnMappings: {
    leadField: string;
    sheetColumn: string;
    isEnabled: boolean;
  }[];
}

export default function GoogleSheetsPage() {
  const { data: session } = useSession();
  const [integrations, setIntegrations] = useState<GoogleSheetsIntegration[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPage, setSelectedPage] = useState('all');

  // Mock data for demonstration
  const mockIntegrations: GoogleSheetsIntegration[] = [
    {
      id: '1',
      pageId: '123456789',
      pageName: 'SARACE Digital Solutions',
      spreadsheetId: 'sheet1',
      spreadsheetName: 'Lead Management 2024',
      sheetName: 'Facebook Leads',
      isActive: true,
      lastSync: '2024-08-30T14:30:00',
      totalLeads: 128,
      columnMappings: [
        { leadField: 'name', sheetColumn: 'Name', isEnabled: true },
        { leadField: 'email', sheetColumn: 'Email', isEnabled: true },
        { leadField: 'phone', sheetColumn: 'Phone', isEnabled: true },
        { leadField: 'company', sheetColumn: 'Company', isEnabled: false },
        { leadField: 'createdAt', sheetColumn: 'Date', isEnabled: true },
      ]
    },
    {
      id: '2',
      pageId: '987654321',
      pageName: 'LeadConnector Demo Page',
      spreadsheetId: 'sheet2',
      spreadsheetName: 'Marketing Campaigns',
      sheetName: 'Q3 Leads',
      isActive: false,
      lastSync: '2024-08-29T09:15:00',
      totalLeads: 67,
      columnMappings: [
        { leadField: 'name', sheetColumn: 'Full Name', isEnabled: true },
        { leadField: 'email', sheetColumn: 'Email Address', isEnabled: true },
        { leadField: 'phone', sheetColumn: 'Contact Number', isEnabled: true },
        { leadField: 'campaignName', sheetColumn: 'Campaign', isEnabled: true },
      ]
    }
  ];

  const mockPages = [
    { id: '123456789', name: 'SARACE Digital Solutions' },
    { id: '987654321', name: 'LeadConnector Demo Page' },
    { id: '555666777', name: 'Marketing Agency Pro' }
  ];

  useEffect(() => {
    setIntegrations(mockIntegrations);
  }, []);

  const handleToggleIntegration = (id: string) => {
    setIntegrations(prev => 
      prev.map(integration => 
        integration.id === id 
          ? { ...integration, isActive: !integration.isActive }
          : integration
      )
    );
  };

  const handleSyncNow = async (id: string) => {
    setLoading(true);
    // Simulate sync
    setTimeout(() => {
      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === id 
            ? { ...integration, lastSync: new Date().toISOString(), totalLeads: integration.totalLeads + Math.floor(Math.random() * 5) }
            : integration
        )
      );
      setLoading(false);
    }, 2000);
  };

  const handleDeleteIntegration = (id: string) => {
    if (confirm('Are you sure you want to delete this integration?')) {
      setIntegrations(prev => prev.filter(integration => integration.id !== id));
    }
  };

  const filteredIntegrations = selectedPage === 'all' 
    ? integrations 
    : integrations.filter(integration => integration.pageId === selectedPage);

  const totalActiveIntegrations = integrations.filter(i => i.isActive).length;
  const totalLeadsExported = integrations.reduce((sum, i) => sum + i.totalLeads, 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-dark">Google Sheets Integration</h1>
          <p className="text-muted-foreground">
            Automatically export Facebook leads to your Google Sheets
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Integration
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{integrations.length}</p>
                <p className="text-xs text-muted-foreground">Total Integrations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalActiveIntegrations}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalLeadsExported}</p>
                <p className="text-xs text-muted-foreground">Leads Exported</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {integrations.filter(i => i.lastSync && 
                    new Date(i.lastSync).toDateString() === new Date().toDateString()
                  ).length}
                </p>
                <p className="text-xs text-muted-foreground">Synced Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label>Filter by Page:</Label>
            <Select value={selectedPage} onValueChange={setSelectedPage}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pages</SelectItem>
                {mockPages.map((page) => (
                  <SelectItem key={page.id} value={page.id}>
                    {page.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Integrations List */}
      <div className="space-y-4">
        {filteredIntegrations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Integrations Found</h3>
              <p className="text-muted-foreground mb-4">
                {selectedPage === 'all' 
                  ? 'Create your first Google Sheets integration to automatically export leads.'
                  : 'No integrations found for the selected page.'
                }
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Integration
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredIntegrations.map((integration) => (
            <Card key={integration.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-6 w-6 text-green-600" />
                    <div>
                      <CardTitle className="text-lg">{integration.spreadsheetName}</CardTitle>
                      <CardDescription>
                        {integration.pageName} → {integration.sheetName}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={integration.isActive ? "default" : "secondary"}>
                      {integration.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleSyncNow(integration.id)}
                      disabled={loading}
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{integration.totalLeads}</p>
                    <p className="text-xs text-muted-foreground">Total Leads</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {integration.columnMappings.filter(m => m.isEnabled).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Mapped Fields</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {integration.lastSync 
                        ? format(new Date(integration.lastSync), 'MMM dd, HH:mm')
                        : 'Never'
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">Last Sync</p>
                  </div>
                </div>

                <Separator />

                {/* Column Mappings */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Column Mappings
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {integration.columnMappings.map((mapping, index) => (
                      <div 
                        key={index} 
                        className={`p-2 rounded-lg text-xs ${
                          mapping.isEnabled 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          {mapping.leadField === 'name' && <Users className="h-3 w-3" />}
                          {mapping.leadField === 'email' && <Mail className="h-3 w-3" />}
                          {mapping.leadField === 'phone' && <Phone className="h-3 w-3" />}
                          {mapping.leadField === 'company' && <Building className="h-3 w-3" />}
                          {mapping.leadField === 'createdAt' && <Calendar className="h-3 w-3" />}
                          <span className="capitalize font-medium">{mapping.leadField}</span>
                        </div>
                        <ArrowRight className="h-3 w-3 mx-auto text-muted-foreground" />
                        <p className="font-medium">{mapping.sheetColumn}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={integration.isActive}
                      onCheckedChange={() => handleToggleIntegration(integration.id)}
                    />
                    <Label className="text-sm">
                      Auto-sync new leads
                    </Label>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open Sheet
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-1" />
                      Configure
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteIntegration(integration.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Getting Started with Google Sheets Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <div>
                <h4 className="font-medium mb-1">Connect Google Account</h4>
                <p className="text-sm text-muted-foreground">
                  Sign in with your Google account to access your spreadsheets
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">2</span>
              </div>
              <div>
                <h4 className="font-medium mb-1">Select Spreadsheet & Sheet</h4>
                <p className="text-sm text-muted-foreground">
                  Choose which spreadsheet and sheet tab to export your leads to
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">3</span>
              </div>
              <div>
                <h4 className="font-medium mb-1">Map Data Fields</h4>
                <p className="text-sm text-muted-foreground">
                  Map your Facebook lead fields to the appropriate sheet columns
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}