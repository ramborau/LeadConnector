import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { WebhookService } from '@/services/webhook.service';

// Get user's webhooks
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const webhooks = await prisma.webhook.findMany({
      where: { userId: session.user.id },
      include: {
        pageConfigs: {
          include: { page: true },
        },
        _count: {
          select: { deliveries: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get stats for each webhook
    const webhooksWithStats = await Promise.all(
      webhooks.map(async (webhook) => {
        const stats = await WebhookService.getWebhookStats(webhook.id);
        return { ...webhook, stats };
      })
    );

    return NextResponse.json(webhooksWithStats);
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
}

// Create new webhook
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  try {
    const webhook = await prisma.webhook.create({
      data: {
        userId: session.user.id,
        name: body.name,
        url: body.url,
        method: body.method || 'POST',
        headers: body.headers,
        authType: body.authType || 'NONE',
        authConfig: body.authConfig,
        retryCount: body.retryCount || 3,
        timeoutMs: body.timeoutMs || 30000,
      },
    });

    // Connect to pages if specified
    if (body.pageIds && body.pageIds.length > 0) {
      await prisma.pageWebhookConfig.createMany({
        data: body.pageIds.map((pageId: string) => ({
          pageId,
          webhookId: webhook.id,
        })),
      });
    }

    return NextResponse.json(webhook);
  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}