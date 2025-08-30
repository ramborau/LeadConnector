# LeadConnector - Facebook Lead Ads Integration

![LeadConnector](https://img.shields.io/badge/Platform-Facebook%20Lead%20Ads-blue?style=for-the-badge&logo=facebook)
![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=for-the-badge&logo=typescript)

Enterprise-grade Facebook Lead Ads integration platform for modern businesses by **SARACE DIGITALSOLUTIONS PRIVATE LIMITED**.

## 🚀 Features

- **Real-time Lead Capture** - Instant Facebook lead synchronization
- **CRM Integration** - Flexible webhook system for any CRM
- **Analytics Dashboard** - Comprehensive reporting and insights  
- **Enterprise Security** - AES-256-GCM encryption and secure token storage
- **Multi-Platform Support** - Responsive design for all devices
- **Legal Compliance** - GDPR/CCPA compliant with privacy controls

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/UI
- **Authentication**: NextAuth.js with Facebook OAuth
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Vercel (recommended)
- **APIs**: Facebook Graph API v19.0

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Facebook Developer Account
- Facebook App with Lead Ads permissions

## ⚡ Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd LeadConnector
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your `.env.local`:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key
   FACEBOOK_CLIENT_ID=your-facebook-app-id
   FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
   DATABASE_URL=your-postgresql-connection-string
   ENCRYPTION_KEY=your-32-character-encryption-key
   ```

4. **Set up database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

## 📱 Application Structure

```
LeadConnector/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (dashboard)/     # Dashboard and lead management
│   ├── (legal)/         # Privacy, Terms, Data Deletion
│   └── api/             # API routes
├── components/          # Reusable UI components
├── lib/                 # Utilities and configurations
├── prisma/              # Database schema
└── services/            # Business logic services
```

## 🔧 Configuration

### Facebook App Setup

1. Visit [Facebook Developers](https://developers.facebook.com)
2. Create new app or use existing
3. Add these products:
   - **Facebook Login** 
   - **Webhooks**
   - **Lead Ads**
4. Configure OAuth redirect: `https://yourdomain.com/api/auth/callback/facebook`
5. Set webhook URL: `https://yourdomain.com/api/facebook/webhook`

### Required Permissions

- `email`
- `pages_show_list` 
- `leads_retrieval`
- `pages_read_engagement`
- `ads_management`
- `pages_manage_metadata`

## 🌐 Deployment

### Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Configure environment variables** in Vercel dashboard

4. **Set up database** (recommended: Supabase, PlanetScale, or Neon)

## 📊 Database Schema

- **User** - Authentication and profile data
- **Page** - Facebook page connections  
- **Lead** - Captured lead information
- **Webhook** - Delivery configurations
- **WebhookDelivery** - Delivery tracking and retry logic

## 🔒 Security Features

- AES-256-GCM token encryption
- Webhook signature verification
- Rate limiting and DDoS protection
- CSRF protection with NextAuth.js
- Environment variable validation

## 📞 Support

**SARACE DIGITALSOLUTIONS PRIVATE LIMITED**

- **Email**: admin@botpe.com
- **Phone**: +91 94225 94226
- **Documentation**: See `TASK1.MD` - `TASK7.MD` for detailed guides

## 📄 Legal

- [Privacy Policy](https://yourdomain.com/privacy)
- [Terms of Service](https://yourdomain.com/terms)  
- [Data Deletion](https://yourdomain.com/data-deletion)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is proprietary software owned by SARACE DIGITALSOLUTIONS PRIVATE LIMITED.

---

**Built with ❤️ by SARACE DIGITALSOLUTIONS PRIVATE LIMITED**

*Automating Facebook Lead Ads for modern businesses*