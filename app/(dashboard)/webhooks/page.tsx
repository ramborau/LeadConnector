'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WebhooksPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold text-dark">Webhooks</h1>
      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Configure webhook endpoints to deliver leads to your CRM or external systems.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}