import { NextRequest, NextResponse } from 'next/server';
import { WebhookHandlerService } from '@/services/webhook-handler.service';
import { FacebookService } from '@/services/facebook.service';

// Handle webhook verification (GET)
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  try {
    const result = await WebhookHandlerService.verifyWebhook(
      mode!,
      token!,
      challenge!
    );
    return new NextResponse(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
  }
}

// Handle webhook events (POST)
export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-hub-signature-256');
  const body = await req.text();

  // Verify signature
  if (!signature || !FacebookService.verifyWebhookSignature(signature, body)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const data = JSON.parse(body);

  // Process each entry
  for (const entry of data.entry) {
    await WebhookHandlerService.handleLeadgenChange(entry);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}