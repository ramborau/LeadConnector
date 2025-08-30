import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { FacebookService } from '@/services/facebook.service';
import { prisma } from '@/lib/db';
import { encrypt, decrypt } from '@/lib/encryption';

// Get user's Facebook pages
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const fbService = new FacebookService(user.accessToken);
    const pages = await fbService.getPages();

    return NextResponse.json({ pages });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

// Connect a Facebook page
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { pageId, name, category, accessToken } = await req.json();

  try {
    // Save page to database
    const page = await prisma.page.upsert({
      where: { facebookPageId: pageId },
      update: {
        name,
        category,
        accessToken: encrypt(accessToken),
        isActive: true,
      },
      create: {
        facebookPageId: pageId,
        name,
        category,
        accessToken: encrypt(accessToken),
        userId: session.user.id,
      },
    });

    // Subscribe to leadgen webhooks
    const fbService = new FacebookService(encrypt(accessToken));
    await fbService.subscribeToLeadgen(pageId, accessToken);

    return NextResponse.json({ page });
  } catch (error) {
    console.error('Error connecting page:', error);
    return NextResponse.json(
      { error: 'Failed to connect page' },
      { status: 500 }
    );
  }
}

// Disconnect a Facebook page
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { pageId } = await req.json();

  try {
    const page = await prisma.page.findFirst({
      where: {
        facebookPageId: pageId,
        userId: session.user.id,
      },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Unsubscribe from webhooks
    const fbService = new FacebookService(page.accessToken);
    await fbService.unsubscribeFromLeadgen(
      pageId,
      decrypt(page.accessToken)
    );

    // Soft delete by marking inactive
    await prisma.page.update({
      where: { id: page.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting page:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect page' },
      { status: 500 }
    );
  }
}