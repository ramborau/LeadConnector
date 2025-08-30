# Google Sheets API Integration Setup Guide

This guide will help you set up Google Sheets API integration for LeadConnector to automatically export Facebook leads to your Google Sheets.

## Prerequisites

- A Google Cloud Platform (GCP) account
- A Google Sheets spreadsheet where you want to export leads
- Admin access to your LeadConnector application

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Enter project name: `LeadConnector-Sheets`
4. Click **Create**

## Step 2: Enable Google Sheets API

1. In your GCP project, go to **APIs & Services** → **Library**
2. Search for "Google Sheets API"
3. Click **Google Sheets API** → **Enable**
4. Also enable "Google Drive API" (required for file access)

## Step 3: Create Service Account Credentials

### Option A: Service Account (Recommended for Server-to-Server)

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **Service account**
3. Enter details:
   - **Service account name**: `leadconnector-sheets`
   - **Service account ID**: `leadconnector-sheets`
   - **Description**: `Service account for LeadConnector Google Sheets integration`
4. Click **Create and Continue**
5. Skip role assignment (click **Continue**)
6. Click **Done**
7. Find your new service account and click on it
8. Go to **Keys** tab → **Add Key** → **Create new key**
9. Choose **JSON** format → **Create**
10. Download the JSON file (keep it secure!)

### Option B: OAuth 2.0 (For User Authentication)

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted, configure OAuth consent screen first:
   - Choose **External** user type
   - Fill in required fields (App name, User support email, Developer contact)
   - Add your domain to **Authorized domains**
   - Save and continue through all steps
4. Select **Web application**
5. Enter details:
   - **Name**: `LeadConnector Web Client`
   - **Authorized redirect URIs**: Add your callback URLs:
     - `http://localhost:3001/api/auth/callback/google` (development)
     - `https://lct.botpe.com/api/auth/callback/google` (production)
6. Click **Create**
7. Copy the **Client ID** and **Client Secret**

## Step 4: Configure Environment Variables

Add these variables to your `.env.local` file:

### For Service Account Authentication:
```env
# Google Sheets API (Service Account)
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[YOUR_PRIVATE_KEY]\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_CLIENT_EMAIL="leadconnector-sheets@your-project-id.iam.gserviceaccount.com"
GOOGLE_SHEETS_PROJECT_ID="your-project-id"
```

### For OAuth 2.0 Authentication:
```env
# Google Sheets API (OAuth)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

## Step 5: Share Your Google Sheet

### For Service Account:
1. Open your Google Sheet
2. Click **Share** button
3. Add the service account email as an editor:
   `leadconnector-sheets@your-project-id.iam.gserviceaccount.com`
4. Make sure to give **Editor** permission

### For OAuth 2.0:
No additional sharing needed - users will authenticate with their own Google account.

## Step 6: Install Required Dependencies

Run the following command in your project:

```bash
npm install googleapis @google-cloud/local-auth
```

## Step 7: Implement Google Sheets Integration

### Service Account Implementation

```javascript
import { GoogleAuth } from 'google-auth-library';
import { sheets } from 'googleapis/build/src/apis/sheets';

const auth = new GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: process.env.GOOGLE_SHEETS_PROJECT_ID,
    private_key_id: process.env.GOOGLE_SHEETS_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_SHEETS_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheetsAPI = sheets({ version: 'v4', auth });

export async function appendToSheet(spreadsheetId, range, values) {
  try {
    const response = await sheetsAPI.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error appending to sheet:', error);
    throw error;
  }
}
```

## Step 8: Test the Integration

### Get Your Spreadsheet ID
1. Open your Google Sheet
2. Copy the spreadsheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

### Test API Connection
Create a test endpoint in your Next.js app:

```javascript
// app/api/test-sheets/route.js
import { appendToSheet } from '@/lib/google-sheets';

export async function GET() {
  try {
    const result = await appendToSheet(
      'your-spreadsheet-id',
      'Sheet1!A:E',
      ['Test Name', 'test@example.com', '123-456-7890', new Date().toISOString(), 'Test Campaign']
    );
    
    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

## Step 9: Create Column Mappings

Set up your Google Sheet with these headers:

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| Name | Email | Phone | Company | Date | Campaign | Ad Name |

## Step 10: Production Deployment

### Environment Variables for Production:
1. Add all Google Sheets variables to your production environment
2. Ensure the service account has access to your production spreadsheets
3. Update OAuth redirect URIs for your production domain

### Security Best Practices:
1. **Never commit credentials to version control**
2. **Use environment variables for all sensitive data**
3. **Regularly rotate service account keys**
4. **Monitor API usage in Google Cloud Console**
5. **Set up proper error handling and logging**

## Troubleshooting

### Common Issues:

#### 1. "Insufficient Permission" Error
- Ensure the service account has Editor access to the sheet
- Verify the service account email is correct

#### 2. "Spreadsheet Not Found" Error
- Check the spreadsheet ID is correct
- Ensure the sheet is not in Trash
- Verify sharing permissions

#### 3. "Invalid Credentials" Error
- Check all environment variables are set correctly
- Ensure the private key includes `\n` characters properly
- Verify the service account JSON file is valid

#### 4. "Quota Exceeded" Error
- Check your Google Cloud Console for API quotas
- Implement rate limiting in your application
- Consider using batch operations for multiple leads

### API Rate Limits:
- **Read requests**: 300 per minute per project
- **Write requests**: 300 per minute per project
- **Requests per sheet**: 100 per 100 seconds

## Advanced Features

### Batch Operations
For better performance, batch multiple leads:

```javascript
export async function batchAppendToSheet(spreadsheetId, range, batchValues) {
  try {
    const response = await sheetsAPI.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: batchValues, // Array of arrays
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error batch appending to sheet:', error);
    throw error;
  }
}
```

### Column Formatting
Apply formatting to your data:

```javascript
export async function formatSheet(spreadsheetId, sheetId) {
  try {
    const response = await sheetsAPI.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.6, blue: 1.0 },
                  textFormat: { bold: true, foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 } },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
        ],
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error formatting sheet:', error);
    throw error;
  }
}
```

## Support

If you encounter issues:

1. Check the [Google Sheets API documentation](https://developers.google.com/sheets/api)
2. Review the [Google Cloud Console logs](https://console.cloud.google.com/logs)
3. Ensure all quotas and billing are properly configured
4. Test with a simple spreadsheet first

## Security Notes

- **Service Account Keys**: Store securely and rotate regularly
- **Scopes**: Use minimal required scopes (`spreadsheets` for read/write)
- **Access**: Regularly audit which sheets have service account access
- **Monitoring**: Set up alerts for unusual API usage patterns