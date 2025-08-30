# Facebook App Review Screencast Script

## 🎬 Complete User Flow Demonstration

### Recording Setup:
- **URL:** https://lct.botpe.com
- **Duration:** 4-5 minutes
- **Resolution:** 1080p minimum
- **Audio:** Clear narration

---

## 📋 Step-by-Step Script

### 1. Landing Page Introduction (30 seconds)
**Screen:** https://lct.botpe.com

**Narration:**
> "This is LeadConnector by SARACE DIGITALSOLUTIONS, a Facebook Lead Ads integration platform. I'll demonstrate how businesses use our app to capture and manage leads from their Facebook advertising campaigns."

**Actions:**
- Show landing page features
- Highlight professional design
- Point out "Get Started" button

---

### 2. User Registration/Login (45 seconds)
**Screen:** https://lct.botpe.com/login

**Narration:**
> "Users start by logging into the platform. Our app supports email authentication followed by Facebook integration for accessing Lead Ads data."

**Actions:**
- Click "Login" from landing page
- Show login form with email/password fields
- Enter demo credentials:
  - Email: `demo@sarace.com`
  - Password: `demo123`
- Click "Sign In"
- Show redirect to dashboard

---

### 3. Dashboard Overview (30 seconds)
**Screen:** https://lct.botpe.com/dashboard

**Narration:**
> "After login, users see the main dashboard with lead statistics and quick actions. The interface shows total leads, webhook status, and provides easy access to all features."

**Actions:**
- Show dashboard statistics (Total Leads: 3, Today's Leads: 1, etc.)
- Point out navigation menu: Dashboard, Leads, Pages, Webhooks, Settings
- Highlight "Connect Pages" card

---

### 4. Facebook Integration Setup (60 seconds)
**Screen:** https://lct.botpe.com/pages

**Narration:**
> "To capture leads, users must connect their Facebook account. I'll click 'Connect Pages' to start the Facebook integration process."

**Actions:**
- Click "Connect Pages" from dashboard OR navigate to Pages
- Show Facebook Connect component
- Point out required permissions list:
  - `pages_show_list` - Access to Facebook Pages
  - `leads_retrieval` - Permission to retrieve lead data  
  - `pages_read_engagement` - Read page engagement metrics
  - `pages_manage_metadata` - Manage page webhook subscriptions
- Click "Connect Facebook Account" button
- **Facebook OAuth Flow:**
  - Facebook login screen appears
  - Enter Facebook credentials
  - Facebook permissions dialog shows
  - Grant all requested permissions
  - Redirect back to app

---

### 5. Facebook Pages Management (45 seconds)
**Screen:** https://lct.botpe.com/pages (after Facebook connection)

**Narration:**
> "Now that Facebook is connected, users can see their Facebook pages and select which ones to monitor for leads. This uses the 'pages_show_list' permission to display managed pages."

**Actions:**
- Show connected Facebook pages list
- Point out page details: SARACE Digital Solutions, LeadConnector Demo Page
- Show connection status indicators
- Click "Connect Page" for unconnected pages
- Show "Configure Webhooks" and "View Leads" options for connected pages

---

### 6. Lead Capture Demonstration (60 seconds)
**Screen:** https://lct.botpe.com/leads

**Narration:**
> "Here's where captured leads appear. When someone submits a lead form on Facebook, our webhook receives the data instantly using the 'leads_retrieval' permission. All lead information is displayed in real-time."

**Actions:**
- Navigate to Leads page
- Show lead statistics: Total: 3, Qualified: 1, Contacted: 1, Today: 1
- Scroll through individual lead cards showing:
  - **John Smith** - Tech Solutions Inc (Status: new)
  - **Sarah Johnson** - Growth Marketing LLC (Status: contacted)  
  - **Mike Wilson** - StartupIO (Status: qualified)
- Point out lead details: contact info, campaign source, timestamps
- Show "Export" and "Filter" functionality

---

### 7. Webhook Configuration (45 seconds)
**Screen:** https://lct.botpe.com/webhooks

**Narration:**
> "Users can configure webhook endpoints to automatically forward leads to their existing CRM systems. This enables real-time lead distribution and immediate follow-up."

**Actions:**
- Navigate to Webhooks page
- Show webhook configuration interface
- Point out webhook URL setup for external integrations
- Demonstrate webhook testing functionality

---

### 8. Analytics & Engagement (30 seconds)
**Screen:** Back to dashboard or dedicated analytics

**Narration:**
> "The app also provides analytics using 'pages_read_engagement' permission. Users can track lead conversion rates, page performance, and campaign effectiveness to optimize their Facebook advertising ROI."

**Actions:**
- Show analytics dashboard
- Point out engagement metrics
- Highlight conversion tracking
- Show performance insights

---

### 9. Settings & Account Management (30 seconds)
**Screen:** https://lct.botpe.com/settings

**Narration:**
> "Finally, users can manage their account settings, configure notification preferences, and review their connected Facebook pages and permissions."

**Actions:**
- Navigate to Settings
- Show account information
- Display connected Facebook account details
- Show privacy and security settings

---

### 10. Closing Summary (15 seconds)

**Narration:**
> "This demonstrates how LeadConnector responsibly uses Facebook permissions to provide valuable lead management services, helping businesses capture and process leads automatically while maintaining data security and user privacy."

**Actions:**
- Return to dashboard
- Show final overview of connected status
- End recording

---

## 🔧 Technical Setup Before Recording

### 1. Prepare Demo Data:
```bash
# Ensure your local server is running
npm run dev
# Visit http://localhost:3001 to test flow locally first
```

### 2. Facebook App Configuration:
- Set OAuth redirect: `https://lct.botpe.com/api/auth/callback/facebook`
- Set webhook URL: `https://lct.botpe.com/api/facebook/webhook`
- Verify token: `leadconnector-webhook-verify-2024`

### 3. Demo Account:
- **Email:** demo@sarace.com
- **Password:** demo123
- **Facebook Account:** Use your test Facebook account with test pages

### 4. Recording Tools:
- **macOS:** QuickTime Screen Recording or OBS
- **Windows:** OBS Studio or Windows Game Bar
- **Linux:** OBS Studio or Kazam

---

## 📝 Permission Justification Text

Copy this for your app review submission:

### pages_show_list
```
This permission displays Facebook pages managed by the user, allowing them to select which pages should be connected for lead capture. Users see a list of their pages and can choose specific pages for lead generation integration.
```

### leads_retrieval  
```
This permission retrieves lead contact information from Facebook Lead Ads forms. When users run lead generation campaigns, the app captures submitted data (name, email, phone) and forwards it to external CRM systems via webhooks for immediate follow-up.
```

### pages_read_engagement
```
This permission provides analytics showing page engagement metrics and lead generation performance. Users can track lead conversion rates, campaign effectiveness, and page performance to optimize their Facebook advertising ROI.
```

### pages_manage_metadata
```
This permission allows automatic webhook subscription setup when users connect Facebook pages. The app programmatically configures webhook subscriptions to receive lead notifications, eliminating manual setup requirements.
```

---

## ✅ Final Checklist

- [ ] Production app deployed at https://lct.botpe.com
- [ ] Facebook app configured with correct permissions
- [ ] Test Facebook page with lead forms ready
- [ ] Demo account credentials prepared
- [ ] Recording software tested
- [ ] Complete user flow tested
- [ ] Screencast recorded (4-5 minutes)
- [ ] App review submission ready

**Your app is now ready for Facebook review submission!**