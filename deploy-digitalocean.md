# DigitalOcean Deployment Guide

## Option 1: App Platform (Recommended)

### Step 1: Create App
1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Connect to GitHub and select `ramborau/LeadConnector`
4. Choose `main` branch

### Step 2: Configure App Settings
```yaml
Name: leadconnector
Type: Web Service
Environment: Node.js 16+
Build Command: npm run build
Run Command: npm start
HTTP Port: 3000
Instance Type: Basic ($5/month)
```

### Step 3: Environment Variables
Add these in the App Platform dashboard:
```
NODE_ENV=production
NEXTAUTH_URL=https://leadconnector-xxxxx.ondigitalocean.app
NEXTAUTH_SECRET=generate-strong-secret-key-here
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
DATABASE_URL=postgresql://username:password@host:port/database
ENCRYPTION_KEY=your-32-character-encryption-key
```

### Step 4: Database Setup (Optional - DigitalOcean Managed PostgreSQL)
1. Create managed PostgreSQL database
2. Update DATABASE_URL in environment variables
3. Run migrations after first deployment

---

## Option 2: Droplet (VPS) Deployment

### Prerequisites
- DigitalOcean Droplet (Ubuntu 20.04+)
- Domain name (optional)

### Step 1: Create and Setup Droplet
```bash
# Create droplet with Ubuntu 20.04
# SSH into your droplet
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Install Nginx for reverse proxy
apt install nginx -y

# Install Git
apt install git -y
```

### Step 2: Clone and Setup Application
```bash
# Clone your repository
cd /opt
git clone https://github.com/ramborau/LeadConnector.git
cd LeadConnector

# Install dependencies
npm install

# Create environment file
nano .env.local
```

Add to .env.local:
```env
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-key
FACEBOOK_CLIENT_ID=your-app-id
FACEBOOK_CLIENT_SECRET=your-app-secret  
DATABASE_URL=your-postgresql-url
ENCRYPTION_KEY=your-32-char-key
```

### Step 3: Build and Start Application
```bash
# Generate Prisma client and build
npm run build

# Start with PM2
pm2 start npm --name "leadconnector" -- start
pm2 startup
pm2 save
```

### Step 4: Configure Nginx
```bash
# Create Nginx config
nano /etc/nginx/sites-available/leadconnector
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/leadconnector /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 5: SSL Certificate (Optional)
```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Step 6: Database Setup
If using DigitalOcean Managed PostgreSQL:
```bash
# Run database migrations
cd /opt/LeadConnector
npx prisma db push
```

---

## Deployment Automation Script

Create this script for easy deployments:

```bash
#!/bin/bash
# deploy.sh

echo "Deploying LeadConnector..."

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Restart PM2 process
pm2 restart leadconnector

echo "Deployment complete!"
```

Make executable:
```bash
chmod +x deploy.sh
```

---

## Monitoring and Maintenance

### PM2 Commands
```bash
pm2 status                 # Check app status
pm2 logs leadconnector     # View logs
pm2 restart leadconnector  # Restart app
pm2 stop leadconnector     # Stop app
```

### Nginx Commands
```bash
systemctl status nginx     # Check nginx status
systemctl restart nginx   # Restart nginx
nginx -t                   # Test nginx config
```

### Database Management
```bash
# Connect to database
psql $DATABASE_URL

# Run migrations
npx prisma db push

# Reset database (careful!)
npx prisma db reset
```

---

## Cost Estimation

### App Platform (Managed)
- Basic: $5/month
- Pro: $12/month
- Auto-scaling, zero-config

### Droplet (Self-managed)
- Basic Droplet: $6/month (1GB RAM)
- Standard Droplet: $12/month (2GB RAM)
- Plus managed PostgreSQL: $15/month

### Recommended Stack
- App Platform ($5/month) + Managed PostgreSQL ($15/month) = $20/month
- Fully managed, auto-scaling, SSL included

---

## Next Steps After Deployment

1. **Configure Facebook App**
   - Update OAuth redirect URLs to your DigitalOcean domain
   - Set webhook URL to `https://yourdomain.com/api/facebook/webhook`

2. **Database Setup**
   - Create PostgreSQL database
   - Run `npx prisma db push`
   - Test database connection

3. **Domain Configuration** (Optional)
   - Point your domain to DigitalOcean
   - Update NEXTAUTH_URL environment variable

4. **Monitoring Setup**
   - Set up monitoring alerts
   - Configure backup strategies
   - Monitor application logs

---

**Contact for Support:**
- SARACE DIGITALSOLUTIONS PRIVATE LIMITED
- Email: admin@botpe.com
- Phone: +91 94225 94226