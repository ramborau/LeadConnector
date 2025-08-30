import { GoogleAuth } from 'google-auth-library';
import { sheets_v4, google } from 'googleapis';

// Initialize Google Sheets API client
let sheetsClient: sheets_v4.Sheets | null = null;

function getAuthClient() {
  if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || !process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
    throw new Error('Google Sheets credentials not configured');
  }

  return new GoogleAuth({
    credentials: {
      type: 'service_account',
      project_id: process.env.GOOGLE_SHEETS_PROJECT_ID,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_SHEETS_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function getSheetsClient() {
  if (!sheetsClient) {
    const auth = getAuthClient();
    sheetsClient = google.sheets({ version: 'v4', auth });
  }
  return sheetsClient;
}

export interface LeadData {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  createdAt: string;
  campaignName?: string;
  adName?: string;
  formName?: string;
  customFields?: Record<string, any>;
}

export interface ColumnMapping {
  leadField: string;
  sheetColumn: string;
  isEnabled: boolean;
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
  columnMappings: ColumnMapping[];
}

export async function testGoogleSheetsConnection(): Promise<boolean> {
  try {
    const sheets = getSheetsClient();
    // Test with a simple request to verify credentials
    await sheets.spreadsheets.get({
      spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms', // Google's test spreadsheet
      ranges: ['Class Data!A1:B1'],
    });
    return true;
  } catch (error) {
    console.error('Google Sheets connection test failed:', error);
    return false;
  }
}

export async function getSpreadsheetInfo(spreadsheetId: string) {
  try {
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      includeGridData: false,
    });
    
    return {
      title: response.data.properties?.title,
      sheets: response.data.sheets?.map(sheet => ({
        title: sheet.properties?.title,
        sheetId: sheet.properties?.sheetId,
      })),
    };
  } catch (error) {
    console.error('Error getting spreadsheet info:', error);
    throw new Error('Failed to access spreadsheet. Please check the spreadsheet ID and permissions.');
  }
}

export async function getSheetHeaders(spreadsheetId: string, sheetName: string): Promise<string[]> {
  try {
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!1:1`,
    });
    
    return response.data.values?.[0] || [];
  } catch (error) {
    console.error('Error getting sheet headers:', error);
    throw new Error('Failed to read sheet headers');
  }
}

export async function appendLeadToSheet(
  config: GoogleSheetsConfig,
  leadData: LeadData
): Promise<void> {
  try {
    const sheets = getSheetsClient();
    
    // Map lead data to sheet columns based on configuration
    const values: (string | number)[] = [];
    const enabledMappings = config.columnMappings.filter(mapping => mapping.isEnabled);
    
    enabledMappings.forEach(mapping => {
      let value = '';
      
      switch (mapping.leadField) {
        case 'name':
          value = leadData.name || '';
          break;
        case 'email':
          value = leadData.email || '';
          break;
        case 'phone':
          value = leadData.phone || '';
          break;
        case 'company':
          value = leadData.company || '';
          break;
        case 'createdAt':
          value = new Date(leadData.createdAt).toLocaleString();
          break;
        case 'campaignName':
          value = leadData.campaignName || '';
          break;
        case 'adName':
          value = leadData.adName || '';
          break;
        case 'formName':
          value = leadData.formName || '';
          break;
        default:
          // Handle custom fields
          if (leadData.customFields && leadData.customFields[mapping.leadField]) {
            value = String(leadData.customFields[mapping.leadField]);
          }
          break;
      }
      
      values.push(value);
    });
    
    // Append the row to the sheet
    const range = `${config.sheetName}!A:Z`;
    await sheets.spreadsheets.values.append({
      spreadsheetId: config.spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    });
    
    console.log('Lead successfully appended to Google Sheet');
  } catch (error) {
    console.error('Error appending lead to sheet:', error);
    throw new Error('Failed to export lead to Google Sheets');
  }
}

export async function batchAppendLeadsToSheet(
  config: GoogleSheetsConfig,
  leads: LeadData[]
): Promise<void> {
  try {
    const sheets = getSheetsClient();
    const enabledMappings = config.columnMappings.filter(mapping => mapping.isEnabled);
    
    const batchValues = leads.map(leadData => {
      const values: (string | number)[] = [];
      
      enabledMappings.forEach(mapping => {
        let value = '';
        
        switch (mapping.leadField) {
          case 'name':
            value = leadData.name || '';
            break;
          case 'email':
            value = leadData.email || '';
            break;
          case 'phone':
            value = leadData.phone || '';
            break;
          case 'company':
            value = leadData.company || '';
            break;
          case 'createdAt':
            value = new Date(leadData.createdAt).toLocaleString();
            break;
          case 'campaignName':
            value = leadData.campaignName || '';
            break;
          case 'adName':
            value = leadData.adName || '';
            break;
          case 'formName':
            value = leadData.formName || '';
            break;
          default:
            // Handle custom fields
            if (leadData.customFields && leadData.customFields[mapping.leadField]) {
              value = String(leadData.customFields[mapping.leadField]);
            }
            break;
        }
        
        values.push(value);
      });
      
      return values;
    });
    
    // Batch append all rows
    const range = `${config.sheetName}!A:Z`;
    await sheets.spreadsheets.values.append({
      spreadsheetId: config.spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: batchValues,
      },
    });
    
    console.log(`${leads.length} leads successfully batch appended to Google Sheet`);
  } catch (error) {
    console.error('Error batch appending leads to sheet:', error);
    throw new Error('Failed to batch export leads to Google Sheets');
  }
}

export async function setupSheetHeaders(
  spreadsheetId: string,
  sheetName: string,
  headers: string[]
): Promise<void> {
  try {
    const sheets = getSheetsClient();
    
    // Set the header row
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!1:1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [headers],
      },
    });
    
    // Format the header row (bold, background color)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0, // Assumes first sheet, should get actual sheetId
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.6, blue: 1.0, alpha: 1.0 },
                  textFormat: { 
                    bold: true, 
                    foregroundColor: { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 } 
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
        ],
      },
    });
    
    console.log('Sheet headers set up successfully');
  } catch (error) {
    console.error('Error setting up sheet headers:', error);
    throw new Error('Failed to set up sheet headers');
  }
}

// Default column mappings for lead data
export const DEFAULT_COLUMN_MAPPINGS: ColumnMapping[] = [
  { leadField: 'name', sheetColumn: 'Name', isEnabled: true },
  { leadField: 'email', sheetColumn: 'Email', isEnabled: true },
  { leadField: 'phone', sheetColumn: 'Phone', isEnabled: true },
  { leadField: 'company', sheetColumn: 'Company', isEnabled: false },
  { leadField: 'createdAt', sheetColumn: 'Date', isEnabled: true },
  { leadField: 'campaignName', sheetColumn: 'Campaign', isEnabled: true },
  { leadField: 'adName', sheetColumn: 'Ad Name', isEnabled: false },
  { leadField: 'formName', sheetColumn: 'Form Name', isEnabled: false },
];