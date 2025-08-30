'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LeadsPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold text-dark">Leads</h1>
      <Card>
        <CardHeader>
          <CardTitle>Lead Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Lead management interface will be implemented here. Connect a Facebook page first to start receiving leads.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}