'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { Filter, X, Calendar, Users } from 'lucide-react';

interface LeadsFilterProps {
  filters: {
    status: string;
    pageId: string;
    dateFrom: string;
    dateTo: string;
  };
  onFiltersChange: (filters: any) => void;
  pages?: Array<{ id: string; name: string }>;
}

export default function LeadsFilter({ filters, onFiltersChange, pages = [] }: LeadsFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      status: 'all',
      pageId: 'all',
      dateFrom: '',
      dateTo: ''
    };
    setTempFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    setIsOpen(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.pageId && filters.pageId !== 'all') count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filter
          {activeFiltersCount > 0 && (
            <Badge className="ml-2 h-5 w-5 p-0 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Leads
          </DialogTitle>
          <DialogDescription>
            Filter leads by status, page, and date range.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={tempFilters.status} 
              onValueChange={(value) => setTempFilters({...tempFilters, status: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Page Filter */}
          {pages.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="page">Facebook Page</Label>
              <Select 
                value={tempFilters.pageId} 
                onValueChange={(value) => setTempFilters({...tempFilters, pageId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pages</SelectItem>
                  {pages.map((page) => (
                    <SelectItem key={page.id} value={page.id}>
                      {page.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">From</Label>
                <DatePicker
                  date={tempFilters.dateFrom ? new Date(tempFilters.dateFrom) : undefined}
                  onDateChange={(date) => setTempFilters({...tempFilters, dateFrom: date ? date.toISOString().split('T')[0] : ''})}
                  placeholder="Select start date"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">To</Label>
                <DatePicker
                  date={tempFilters.dateTo ? new Date(tempFilters.dateTo) : undefined}
                  onDateChange={(date) => setTempFilters({...tempFilters, dateTo: date ? date.toISOString().split('T')[0] : ''})}
                  placeholder="Select end date"
                />
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Active Filters</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearFilters}
                  className="h-auto p-1 text-xs"
                >
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.status !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Status: {filters.status}
                  </Badge>
                )}
                {filters.pageId && filters.pageId !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Page: {pages.find(p => p.id === filters.pageId)?.name || 'Unknown'}
                  </Badge>
                )}
                {filters.dateFrom && (
                  <Badge variant="secondary" className="text-xs">
                    From: {new Date(filters.dateFrom).toLocaleDateString()}
                  </Badge>
                )}
                {filters.dateTo && (
                  <Badge variant="secondary" className="text-xs">
                    To: {new Date(filters.dateTo).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}