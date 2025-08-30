'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileSpreadsheet, 
  Plus, 
  MapPin, 
  CheckCircle, 
  ExternalLink, 
  Settings,
  ArrowRight,
  Download,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface GoogleFileSpreadsheetConnectProps {
  pageId: string;
  pageName: string;
}

interface SpreadsheetInfo {
  id: string;
  name: string;
  url: string;
  sheets: Array<{ id: string; title: string }>;
}

interface ColumnMapping {
  leadField: string;
  sheetColumn: string;
  isEnabled: boolean;
}

export default function GoogleFileSpreadsheetConnect({ pageId, pageName }: GoogleFileSpreadsheetConnectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'auth' | 'spreadsheet' | 'sheet' | 'mapping' | 'complete'>('auth');
  const [isConnecting, setIsConnecting] = useState(false);
  const [googleAccount, setGoogleAccount] = useState<any>(null);
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetInfo[]>([]);
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<SpreadsheetInfo | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([
    { leadField: 'name', sheetColumn: 'Name', isEnabled: true },
    { leadField: 'email', sheetColumn: 'Email', isEnabled: true },
    { leadField: 'phone', sheetColumn: 'Phone', isEnabled: true },
    { leadField: 'company', sheetColumn: 'Company', isEnabled: false },
    { leadField: 'jobTitle', sheetColumn: 'Job Title', isEnabled: false },
    { leadField: 'campaignName', sheetColumn: 'Campaign', isEnabled: false },
    { leadField: 'formName', sheetColumn: 'Form', isEnabled: false },
    { leadField: 'status', sheetColumn: 'Status', isEnabled: false },
    { leadField: 'createdAt', sheetColumn: 'Date', isEnabled: true },
    { leadField: 'pageName', sheetColumn: 'Source', isEnabled: false }
  ]);

  // Mock data for demonstration
  const mockSpreadsheets: SpreadsheetInfo[] = [
    {
      id: 'sheet1',
      name: 'Lead Management 2024',
      url: 'https://docs.google.com/spreadsheets/d/example1',
      sheets: [
        { id: 'sheet1_0', title: 'Facebook Leads' },
        { id: 'sheet1_1', title: 'All Leads' },
        { id: 'sheet1_2', title: 'Analytics' }
      ]
    },
    {
      id: 'sheet2', 
      name: 'Marketing Campaigns',
      url: 'https://docs.google.com/spreadsheets/d/example2',
      sheets: [
        { id: 'sheet2_0', title: 'Q3 Campaigns' },
        { id: 'sheet2_1', title: 'Lead Sources' }
      ]
    }
  ];

  const handleGoogleAuth = async () => {
    setIsConnecting(true);
    
    // Simulate Google OAuth flow
    setTimeout(() => {
      setGoogleAccount({
        email: 'demo@sarace.com',
        name: 'Demo User',
        picture: 'https://via.placeholder.com/40x40'
      });
      setSpreadsheets(mockSpreadsheets);
      setStep('spreadsheet');
      setIsConnecting(false);
    }, 2000);
  };

  const handleSpreadsheetSelect = (spreadsheet: SpreadsheetInfo) => {
    setSelectedSpreadsheet(spreadsheet);
    setStep('sheet');
  };

  const handleSheetSelect = (sheetId: string) => {
    setSelectedSheet(sheetId);
    setStep('mapping');
  };

  const handleMappingToggle = (index: number) => {
    setColumnMappings(prev => 
      prev.map((mapping, i) => 
        i === index ? { ...mapping, isEnabled: !mapping.isEnabled } : mapping
      )
    );
  };

  const handleMappingChange = (index: number, sheetColumn: string) => {
    setColumnMappings(prev => 
      prev.map((mapping, i) => 
        i === index ? { ...mapping, sheetColumn } : mapping
      )
    );
  };

  const handleComplete = async () => {
    setIsConnecting(true);
    
    // Simulate saving configuration
    setTimeout(() => {
      setStep('complete');
      setIsConnecting(false);
    }, 1500);
  };

  const getStepIcon = (currentStep: string) => {
    switch (currentStep) {
      case 'auth': return step === 'auth' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'spreadsheet': return step === 'spreadsheet' ? <FileSpreadsheet className="h-4 w-4" /> : <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'sheet': return step === 'sheet' ? <Settings className="h-4 w-4" /> : <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'mapping': return step === 'mapping' ? <MapPin className="h-4 w-4" /> : <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Connect Google FileSpreadsheet
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Google FileSpreadsheet Integration - {pageName}
          </DialogTitle>
          <DialogDescription>
            Automatically send Facebook leads to your Google FileSpreadsheet.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {getStepIcon('auth')}
            <span className={`text-sm ${step === 'auth' ? 'font-medium' : 'text-muted-foreground'}`}>Authenticate</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            {getStepIcon('spreadsheet')}
            <span className={`text-sm ${step === 'spreadsheet' ? 'font-medium' : 'text-muted-foreground'}`}>Select Sheet</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            {getStepIcon('sheet')}
            <span className={`text-sm ${step === 'sheet' ? 'font-medium' : 'text-muted-foreground'}`}>Choose Tab</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            {getStepIcon('mapping')}
            <span className={`text-sm ${step === 'mapping' ? 'font-medium' : 'text-muted-foreground'}`}>Map Columns</span>
          </div>
        </div>

        <div className="space-y-6">
          {step === 'auth' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <FileSpreadsheet className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Connect to Google FileSpreadsheet</h3>
                <p className="text-muted-foreground mb-4">
                  Grant access to your Google account to create and manage spreadsheets.
                </p>
              </div>
              <Button onClick={handleGoogleAuth} disabled={isConnecting} size="lg">
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Sign in with Google
                  </>
                )}
              </Button>
              
              <div className="text-xs text-muted-foreground mt-4">
                <p className="mb-2">Required permissions:</p>
                <ul className="list-disc text-left max-w-sm mx-auto space-y-1">
                  <li>View and manage your spreadsheets</li>
                  <li>Create new spreadsheets</li>
                  <li>Add data to existing spreadsheets</li>
                </ul>
              </div>
            </div>
          )}

          {step === 'spreadsheet' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <img src={googleAccount?.picture} alt="Google Account" className="w-8 h-8 rounded-full" />
                <div>
                  <p className="font-medium">{googleAccount?.name}</p>
                  <p className="text-xs text-muted-foreground">{googleAccount?.email}</p>
                </div>
                <Badge variant="secondary">Connected</Badge>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Select a Spreadsheet</h3>
                <div className="space-y-2">
                  {spreadsheets.map((sheet) => (
                    <Card 
                      key={sheet.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleSpreadsheetSelect(sheet)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileSpreadsheet className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-medium">{sheet.name}</p>
                              <p className="text-xs text-muted-foreground">{sheet.sheets.length} sheets</p>
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <Button variant="outline" className="w-full mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Spreadsheet
                </Button>
              </div>
            </div>
          )}

          {step === 'sheet' && selectedSpreadsheet && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <div>
                      <CardTitle className="text-base">{selectedSpreadsheet.name}</CardTitle>
                      <CardDescription>Select which sheet tab to use</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
              
              <div>
                <h3 className="font-semibold mb-3">Choose Sheet Tab</h3>
                <div className="space-y-2">
                  {selectedSpreadsheet.sheets.map((sheet) => (
                    <Card 
                      key={sheet.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleSheetSelect(sheet.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{sheet.title}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Column Mapping</CardTitle>
                  <CardDescription>
                    Map Facebook lead fields to your spreadsheet columns
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <div className="space-y-3">
                {columnMappings.map((mapping, index) => (
                  <div key={mapping.leadField} className="flex items-center gap-4 p-3 border rounded-lg">
                    <Checkbox 
                      checked={mapping.isEnabled}
                      onCheckedChange={() => handleMappingToggle(index)}
                    />
                    
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Lead Field</Label>
                        <p className="font-medium capitalize">{mapping.leadField}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Sheet Column</Label>
                        <Input
                          value={mapping.sheetColumn}
                          onChange={(e) => handleMappingChange(index, e.target.value)}
                          disabled={!mapping.isEnabled}
                          placeholder="Column name"
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Headers will be created automatically</p>
                    <p>If the columns don't exist, they will be added to your spreadsheet.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Integration Complete!</h3>
                <p className="text-muted-foreground mb-4">
                  New leads from {pageName} will automatically be added to your Google Sheet.
                </p>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Spreadsheet:</span>
                    <span className="font-medium">{selectedSpreadsheet?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sheet:</span>
                    <span className="font-medium">
                      {selectedSpreadsheet?.sheets.find(s => s.id === selectedSheet)?.title}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mapped Fields:</span>
                    <span className="font-medium">
                      {columnMappings.filter(m => m.isEnabled).length} fields
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'complete' ? (
            <Button onClick={() => setIsOpen(false)} className="w-full">
              Done
            </Button>
          ) : step === 'mapping' ? (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={() => setStep('sheet')}>
                Back
              </Button>
              <Button onClick={handleComplete} disabled={isConnecting} className="flex-1">
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}