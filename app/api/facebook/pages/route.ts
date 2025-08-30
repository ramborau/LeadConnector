import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Simplified version for deployment - will implement authentication later
    return NextResponse.json({ 
      message: 'Facebook pages API endpoint - authentication will be implemented with database setup',
      pages: []
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    return NextResponse.json({ 
      message: 'Connect Facebook page endpoint - will be implemented with database setup'
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    return NextResponse.json({ 
      message: 'Disconnect Facebook page endpoint - will be implemented with database setup'
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}