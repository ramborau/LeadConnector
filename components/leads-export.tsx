'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, Table, Loader2 } from 'lucide-react';

interface LeadsExportProps {
  leads: any[];
  filters: any;
}

export default function LeadsExport({ leads, filters }: LeadsExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('csv');
  const [selectedFields, setSelectedFields] = useState({
    name: true,
    email: true,
    phone: true,
    company: true,
    jobTitle: true,
    source: true,
    campaignName: true,
    formName: true,
    status: true,
    createdAt: true,
    pageName: true
  });
  const [isExporting, setIsExporting] = useState(false);

  const fieldLabels = {
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    company: 'Company',
    jobTitle: 'Job Title',
    source: 'Source',
    campaignName: 'Campaign',
    formName: 'Form Name',
    status: 'Status',
    createdAt: 'Created Date',
    pageName: 'Page Name'
  };

  const handleFieldToggle = (field: keyof typeof selectedFields) => {
    setSelectedFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const exportToCSV = (data: any[], fields: any) => {
    const selectedKeys = Object.keys(fields).filter(key => fields[key]);
    const headers = selectedKeys.map(key => fieldLabels[key as keyof typeof fieldLabels]);
    
    const csvContent = [
      headers.join(','),
      ...data.map(lead => 
        selectedKeys.map(key => {
          let value = lead[key];
          if (key === 'createdAt') {
            value = new Date(value).toLocaleString();
          }
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (leads.length === 0) {
      alert('No leads to export');
      return;
    }

    setIsExporting(true);
    
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      
      if (exportFormat === 'csv') {
        const csvContent = exportToCSV(leads, selectedFields);
        downloadFile(csvContent, `leads_export_${timestamp}.csv`, 'text/csv');
      } else if (exportFormat === 'xlsx') {
        // For XLSX, we'll need to install a library like xlsx
        // For now, fallback to CSV
        const csvContent = exportToCSV(leads, selectedFields);
        downloadFile(csvContent, `leads_export_${timestamp}.csv`, 'text/csv');
        alert('XLSX export coming soon! Downloaded as CSV for now.');
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedFieldsCount = Object.values(selectedFields).filter(Boolean).length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Leads
          </DialogTitle>
          <DialogDescription>
            Export {leads.length} leads with selected fields and format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Export Format */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={exportFormat} onValueChange={(value: 'csv' | 'xlsx') => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV File
                  </div>
                </SelectItem>
                <SelectItem value="xlsx">
                  <div className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    Excel File (XLSX)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Field Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Fields to Export ({selectedFieldsCount})</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  const allSelected = Object.values(selectedFields).every(Boolean);
                  const newState = Object.keys(selectedFields).reduce((acc, key) => {
                    acc[key as keyof typeof selectedFields] = !allSelected;
                    return acc;
                  }, {} as typeof selectedFields);
                  setSelectedFields(newState);
                }}
                className="h-auto p-1 text-xs"
              >
                {Object.values(selectedFields).every(Boolean) ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {Object.entries(fieldLabels).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={selectedFields[key as keyof typeof selectedFields]}
                    onCheckedChange={() => handleFieldToggle(key as keyof typeof selectedFields)}
                  />
                  <Label htmlFor={key} className="text-sm">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Export Preview */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm">
              <div><strong>Leads:</strong> {leads.length}</div>
              <div><strong>Format:</strong> {exportFormat.toUpperCase()}</div>
              <div><strong>Fields:</strong> {selectedFieldsCount}</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || selectedFieldsCount === 0 || leads.length === 0}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}