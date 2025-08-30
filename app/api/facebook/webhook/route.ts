import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Facebook webhook verification
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verify webhook - in production, verify against WEBHOOK_VERIFY_TOKEN
  if (mode === 'subscribe' && token === 'your-verify-token') {
    return new NextResponse(challenge);
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Facebook webhook payload processing
    console.log('Webhook received:', body);
    
    // Will implement lead processing after database setup
    return NextResponse.json({ message: 'Webhook received successfully' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}