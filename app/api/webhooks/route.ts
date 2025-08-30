import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

// GET /api/webhooks - Get all webhooks for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const webhooks = await prisma.webhook.findMany({
      where: { userId: user.id },
      include: {
        pageConfigs: {
          include: {
            page: true
          }
        }
      }
    });

    return NextResponse.json(webhooks);
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/webhooks - Create a new webhook
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, url, method, authType, authConfig, retryCount, timeoutMs, pageIds } = body;

    // Create the webhook
    const webhook = await prisma.webhook.create({
      data: {
        userId: user.id,
        name,
        url,
        method: method || 'POST',
        authType: authType || 'NONE',
        authConfig: authConfig || null,
        retryCount: retryCount || 3,
        timeoutMs: timeoutMs || 30000,
      }
    });

    // Create page-webhook associations if pageIds provided
    if (pageIds && pageIds.length > 0) {
      await prisma.pageWebhookConfig.createMany({
        data: pageIds.map((pageId: string) => ({
          pageId,
          webhookId: webhook.id
        }))
      });
    }

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/webhooks - Update webhook
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, url, method, authType, authConfig, retryCount, timeoutMs, isActive } = body;

    const webhook = await prisma.webhook.update({
      where: { id },
      data: {
        name,
        url,
        method,
        authType,
        authConfig,
        retryCount,
        timeoutMs,
        isActive
      }
    });

    return NextResponse.json(webhook);
  } catch (error) {
    console.error('Error updating webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/webhooks - Delete webhook
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Webhook ID is required' }, { status: 400 });
    }

    await prisma.webhook.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Webhook deleted successfully' });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}