import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getSpreadsheetInfo, getSheetHeaders } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { spreadsheetId, sheetName } = await request.json();
    
    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Spreadsheet ID is required' }, { status: 400 });
    }

    // Get spreadsheet info
    const spreadsheetInfo = await getSpreadsheetInfo(spreadsheetId);
    
    let headers: string[] = [];
    if (sheetName) {
      // Get headers for specific sheet
      headers = await getSheetHeaders(spreadsheetId, sheetName);
    }
    
    return NextResponse.json({
      spreadsheet: spreadsheetInfo,
      headers: sheetName ? headers : undefined
    });
  } catch (error) {
    console.error('Spreadsheet info error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to get spreadsheet info'
    }, { status: 500 });
  }
}