# LeadConnector Deployment Guide

## Facebook OAuth Setup

### For Development (localhost:3001)
1. Go to [Facebook Developers Console](https://developers.facebook.com/)
2. Navigate to your app settings
3. Under **Facebook Login** → **Settings**
4. Add to **Valid OAuth Redirect URIs**:
   ```
   http://localhost:3001/api/auth/callback/facebook
   ```

### For Production (lct.botpe.com)
1. Go to [Facebook Developers Console](https://developers.facebook.com/)
2. Navigate to your app settings
3. Under **Facebook Login** → **Settings**
4. Add to **Valid OAuth Redirect URIs**:
   ```
   https://lct.botpe.com/api/auth/callback/facebook
   ```

### Required Facebook Permissions
Make sure your Facebook app has the following permissions:
- `email` - Basic email access
- `public_profile` - Basic profile information
- `pages_show_list` - Access to user's Facebook pages
- `pages_read_engagement` - Read page engagement data
- `leads_retrieval` - Access to lead ads data

### Environment Configuration

#### Development
Copy `.env.development` to `.env.local`:
```bash
cp .env.development .env.local
```

#### Production
Copy `.env.production` to `.env.local` and update with your production values:
```bash
cp .env.production .env.local
```

Then update:
- `DATABASE_URL` with your production database URL
- `NEXTAUTH_SECRET` with a secure 32-character secret
- `ENCRYPTION_KEY` with a secure 32-character key
- `REDIS_URL` with your production Redis URL (if using)

### Deployment Commands

#### DigitalOcean App Platform
```bash
# Deploy to DigitalOcean
doctl apps create --spec .do/app.yaml

# Update existing app
doctl apps update YOUR_APP_ID --spec .do/app.yaml
```

#### Manual Deployment
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Build the application
npm run build

# Start production server
npm start
```

## Troubleshooting

### Facebook OAuth "Invalid Redirect URI" Error
1. Verify the redirect URI in Facebook Developer Console matches exactly:
   - Development: `http://localhost:3001/api/auth/callback/facebook`
   - Production: `https://lct.botpe.com/api/auth/callback/facebook`
2. Ensure `NEXTAUTH_URL` in your environment matches the domain
3. Check that your Facebook app is not in "Development Mode" for production

### Database Connection Issues
1. Verify `DATABASE_URL` is correct
2. Ensure database is accessible from your deployment environment
3. Run `npx prisma migrate deploy` to apply migrations

### Build Errors
1. Check all environment variables are set
2. Verify `NEXTAUTH_SECRET` is not empty
3. Ensure all dependencies are installed with `npm install`