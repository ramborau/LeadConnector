import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { testGoogleSheetsConnection } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test the Google Sheets connection
    const isConnected = await testGoogleSheetsConnection();
    
    return NextResponse.json({ 
      connected: isConnected,
      message: isConnected 
        ? 'Google Sheets API connection successful' 
        : 'Google Sheets API connection failed - check credentials'
    });
  } catch (error) {
    console.error('Google Sheets test error:', error);
    return NextResponse.json({ 
      connected: false,
      error: 'Failed to test Google Sheets connection'
    }, { status: 500 });
  }
}