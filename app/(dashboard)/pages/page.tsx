'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PagesPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold text-dark">Facebook Pages</h1>
      <Card>
        <CardHeader>
          <CardTitle>Page Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Connect your Facebook pages to start receiving leads. Configure Facebook app credentials first.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}