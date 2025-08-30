# Facebook Lead Ads Integration Setup Guide

## Overview
This guide will walk you through setting up a Facebook App with the required permissions to integrate with the LeadConnector application. You'll need to create a Facebook App, configure webhooks, and obtain the necessary credentials.

## Prerequisites
- Facebook Developer Account
- Access to Facebook Business Manager (recommended)
- Admin access to Facebook Pages you want to connect
- HTTPS domain for webhook endpoints (required for production)

## Step 1: Create Facebook Developer Account

1. **Go to Facebook Developers**
   - Visit [https://developers.facebook.com](https://developers.facebook.com)
   - Log in with your Facebook account
   - Click "Get Started" if it's your first time

2. **Verify Your Account**
   - Verify your phone number and email address
   - Complete any required verification steps

## Step 2: Create a New Facebook App

1. **Create App**
   - Click "Create App" button
   - Select "Business" as the app type
   - Click "Continue"

2. **App Details**
   - **App Name:** `LeadConnector` (or your preferred name)
   - **App Contact Email:** Your business email
   - **Business Account:** Link to your Business Manager account (recommended)
   - Click "Create App"

3. **App ID and Secret**
   - Note down your **App ID** and **App Secret**
   - You'll need these for your environment variables

## Step 3: Configure Basic Settings

1. **Go to App Settings > Basic**
   - Add App Domain: `yourdomain.com`
   - Add Privacy Policy URL: `https://yourdomain.com/privacy`
   - Add Terms of Service URL: `https://yourdomain.com/terms`
   - Add User Data Deletion URL: `https://yourdomain.com/data-deletion`

2. **Save Changes**

## Step 4: Add Facebook Login Product

1. **Add Product**
   - In the left sidebar, click "Add Product"
   - Find "Facebook Login" and click "Set Up"

2. **Configure Facebook Login**
   - Go to Facebook Login > Settings
   - **Valid OAuth Redirect URIs:**
     ```
     http://localhost:3000/api/auth/callback/facebook
     https://01b173750ad6.ngrok-free.app/api/auth/callback/facebook
     https://lct.botpe.com/api/auth/callback/facebook
     ```
   - **Client OAuth Login:** Yes
   - **Web OAuth Login:** Yes
   - **Enforce HTTPS:** Yes (for production)

## Step 5: Add Webhooks Product

1. **Add Webhooks**
   - Click "Add Product" again
   - Find "Webhooks" and click "Set Up"

2. **Create Webhook**
   - Click "Create Subscription"
   - **Callback URL:** `https://yourdomain.com/api/facebook/webhook`
   - **Verify Token:** `leadconnector-webhook-verify-2024` (match your .env file)
   - Click "Verify and Save"

3. **Subscribe to Page Events**
   - In Webhooks settings, find "Page" subscriptions
   - Click "Add Subscription"
   - Select these webhook fields:
     - `leadgen` (required for lead capture)
   - Click "Save"

## Step 6: Request Advanced Permissions

### Required Permissions for Lead Ads

1. **Go to App Review > Permissions and Features**

2. **Request These Permissions:**

   #### Basic Permissions (usually auto-approved):
   - `email` - Access user's email address
   - `public_profile` - Access basic profile information

   #### Advanced Permissions (require review):
   - `pages_show_list` - Get list of Pages managed by user
   - `leads_retrieval` - Access lead data from Lead Ads
   - `pages_read_engagement` - Read Page engagement metrics
   - `ads_management` - Manage ad campaigns (optional, for enhanced features)
   - `pages_manage_metadata` - Manage Page metadata including webhook subscriptions

3. **App Review Process**
   - Click "Request" for each advanced permission
   - Provide detailed use case explanations:

   **For `leads_retrieval`:**
   ```
   Use Case: This permission is required to retrieve lead information 
   from Facebook Lead Ads forms. The app captures leads from users' 
   Facebook pages and delivers them to external CRM systems via webhooks 
   in real-time, helping businesses respond to leads faster.
   
   How it's used: When a user connects their Facebook page, the app 
   subscribes to leadgen webhooks and retrieves lead data including 
   contact information submitted through Lead Ad forms.
   ```

   **For `pages_show_list`:**
   ```
   Use Case: This permission allows users to see and select which 
   Facebook Pages they want to connect to the lead management system.
   
   How it's used: The app displays a list of Pages the user manages, 
   allowing them to choose which pages should have their leads 
   automatically captured and forwarded to their CRM systems.
   ```

   **For `pages_read_engagement`:**
   ```
   Use Case: This permission enables the app to provide analytics and 
   insights about page performance and lead generation metrics.
   
   How it's used: The app reads engagement metrics to show users 
   dashboard analytics about their lead generation performance and 
   page engagement statistics.
   ```

## Step 7: Business Verification (Required for Advanced Permissions)

1. **Verify Your Business**
   - Go to Business Verification section
   - Upload required documents:
     - Business license or incorporation documents
     - Proof of business address
     - Business website verification

2. **Complete Identity Verification**
   - Verify your identity as the business owner/representative
   - This may require government-issued ID

## Step 8: Configure App for Production

### App Modes

1. **Development Mode** (Initial)
   - Limited to app administrators and developers
   - Can test with limited data

2. **Live Mode** (After approval)
   - Available to all Facebook users
   - Full functionality enabled

### Switch to Live Mode

1. **Complete App Review**
   - Ensure all required permissions are approved
   - Business verification completed

2. **Switch Mode**
   - Go to App Settings > Basic
   - Toggle "App Mode" to "Live"
   - Confirm the switch

## Step 9: Environment Configuration

### Update Your .env.local File

```env
# Facebook App Configuration
FACEBOOK_CLIENT_ID="your-app-id-here"
FACEBOOK_CLIENT_SECRET="your-app-secret-here"
FACEBOOK_WEBHOOK_VERIFY_TOKEN="leadconnector-webhook-verify-2024"

# NextAuth Configuration
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-nextauth-secret"

# Database and other configs...
```

### Security Best Practices

1. **App Secret Security**
   - Never expose your App Secret in client-side code
   - Store securely in environment variables
   - Regenerate if compromised

2. **Webhook Verification**
   - Always verify webhook signatures
   - Use the same verify token in your app and Facebook

3. **HTTPS Requirements**
   - All webhook URLs must use HTTPS
   - Facebook will not send webhooks to HTTP endpoints

## Step 10: Testing Your Integration

### Test Webhook Endpoint

1. **Use Facebook's Test Tool**
   - Go to Webhooks settings in your Facebook App
   - Click "Test" next to your webhook subscription
   - Verify your endpoint receives and responds correctly

2. **Test Lead Form**
   - Create a test Lead Ad form on your Facebook page
   - Submit a test lead
   - Verify the webhook is triggered and data is captured

### Common Testing Issues

1. **Webhook Not Receiving Data**
   - Check that your webhook URL is HTTPS
   - Verify the verify token matches
   - Check server logs for errors

2. **Permission Errors**
   - Ensure all required permissions are approved
   - Check that your app is in Live mode for production

3. **Token Issues**
   - Verify Facebook OAuth is working
   - Check token expiration and refresh logic

## Step 11: Compliance and Privacy

### Data Privacy Requirements

1. **Privacy Policy**
   - Must explain how you collect and use Facebook data
   - Include information about lead data handling
   - Must be accessible from your app

2. **Data Deletion**
   - Implement data deletion endpoint
   - Handle user data deletion requests
   - Comply with GDPR and other regulations

3. **Terms of Service**
   - Define how users can use your app
   - Include Facebook platform policy compliance

### Facebook Platform Policies

1. **Review Platform Policies**
   - Read Facebook Platform Terms: [https://developers.facebook.com/terms](https://developers.facebook.com/terms)
   - Ensure your app complies with all policies

2. **Data Use Policy**
   - Only use data for the stated purpose
   - Don't store unnecessary user data
   - Implement proper data retention policies

## Step 12: Monitoring and Maintenance

### Monitor Your App

1. **Facebook App Dashboard**
   - Monitor API usage and rate limits
   - Check for policy violations
   - Review error logs

2. **Webhook Health**
   - Monitor webhook delivery success rates
   - Set up alerts for failed deliveries
   - Regularly test webhook endpoints

### Rate Limits

Facebook enforces rate limits on API calls:

- **Graph API:** 200 calls per hour per user
- **Webhook Deliveries:** No specific limit but monitor for throttling
- **Marketing API:** Various limits based on ad spend

### Troubleshooting Common Issues

1. **Rate Limit Exceeded**
   ```json
   {
     "error": {
       "code": 4,
       "message": "Application request limit reached"
     }
   }
   ```
   **Solution:** Implement exponential backoff and request queuing

2. **Invalid Access Token**
   ```json
   {
     "error": {
       "code": 190,
       "message": "Invalid OAuth access token"
     }
   }
   ```
   **Solution:** Implement token refresh logic

3. **Permission Denied**
   ```json
   {
     "error": {
       "code": 10,
       "message": "Application does not have permission for this action"
     }
   }
   ```
   **Solution:** Ensure required permissions are approved and app is live

## Support and Resources

### Facebook Developer Support

- **Developer Documentation:** [https://developers.facebook.com/docs/](https://developers.facebook.com/docs/)
- **Lead Ads API:** [https://developers.facebook.com/docs/marketing-api/leadgen](https://developers.facebook.com/docs/marketing-api/leadgen)
- **Webhooks Guide:** [https://developers.facebook.com/docs/graph-api/webhooks](https://developers.facebook.com/docs/graph-api/webhooks)
- **Support Community:** [https://developers.facebook.com/community/](https://developers.facebook.com/community/)

### Important Links

- **Facebook Business Help Center:** [https://www.facebook.com/business/help](https://www.facebook.com/business/help)
- **Platform Policy:** [https://developers.facebook.com/policy](https://developers.facebook.com/policy)
- **App Review Guidelines:** [https://developers.facebook.com/docs/app-review](https://developers.facebook.com/docs/app-review)

---

## Quick Start Checklist

- [ ] Created Facebook Developer account
- [ ] Created new Facebook App (Business type)
- [ ] Configured basic app settings
- [ ] Added Facebook Login product
- [ ] Added Webhooks product
- [ ] Configured webhook subscription
- [ ] Requested required permissions
- [ ] Completed business verification
- [ ] Switched app to Live mode
- [ ] Updated environment variables
- [ ] Tested webhook integration
- [ ] Verified lead capture functionality
- [ ] Implemented privacy policy and terms
- [ ] Set up monitoring and alerts

---

**Important Note:** The app review process can take 3-7 business days. Plan accordingly and submit your review request early in your development timeline. Make sure to provide detailed explanations for permission requests to increase approval chances.