# Task 3: Database and Models

## Status: PENDING

## Overview
Set up PostgreSQL database with Prisma ORM, create comprehensive data models for users, pages, leads, webhooks, and delivery tracking with proper relationships and indexes.

## Prerequisites
- Task 1 completed (Project setup)
- PostgreSQL 15+ installed and running
- Database credentials configured in .env.local

## Subtasks

### 3.1 Initialize Prisma
```bash
npx prisma init
```

### 3.2 Create Complete Schema
Create/Update `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User model - stores authenticated users
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  facebookId    String    @unique
  accessToken   String    @db.Text
  refreshToken  String?   @db.Text
  tokenExpiry   DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLogin     DateTime?
  
  // Relations
  pages         Page[]
  webhooks      Webhook[]
  
  @@index([email])
  @@index([facebookId])
  @@map("users")
}

// Page model - Facebook pages connected by users
model Page {
  id              String    @id @default(cuid())
  facebookPageId  String    @unique
  name            String
  category        String?
  accessToken     String    @db.Text
  isActive        Boolean   @default(true)
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  leads           Lead[]
  webhookConfigs  PageWebhookConfig[]
  
  @@index([userId])
  @@index([facebookPageId])
  @@index([isActive])
  @@map("pages")
}

// Lead model - captured Facebook leads
model Lead {
  id              String      @id @default(cuid())
  facebookLeadId  String      @unique
  pageId          String
  page            Page        @relation(fields: [pageId], references: [id], onDelete: Cascade)
  formId          String
  formName        String
  campaignId      String?
  campaignName    String?
  adsetId         String?
  adsetName       String?
  adId            String?
  adName          String?
  leadData        Json
  status          LeadStatus  @default(NEW)
  createdAt       DateTime    @default(now())
  processedAt     DateTime?
  
  // Relations
  deliveries      WebhookDelivery[]
  
  @@index([pageId])
  @@index([status])
  @@index([createdAt])
  @@index([facebookLeadId])
  @@map("leads")
}

// Webhook model - webhook endpoints configuration
model Webhook {
  id            String      @id @default(cuid())
  userId        String
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  name          String
  url           String
  method        HttpMethod  @default(POST)
  headers       Json?
  authType      AuthType    @default(NONE)
  authConfig    Json?
  retryCount    Int         @default(3)
  timeoutMs     Int         @default(30000)
  isActive      Boolean     @default(true)
  lastSuccess   DateTime?
  lastFailure   DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  // Relations
  deliveries    WebhookDelivery[]
  pageConfigs   PageWebhookConfig[]
  
  @@index([userId])
  @@index([isActive])
  @@map("webhooks")
}

// PageWebhookConfig model - links pages to webhooks
model PageWebhookConfig {
  id          String    @id @default(cuid())
  pageId      String
  page        Page      @relation(fields: [pageId], references: [id], onDelete: Cascade)
  webhookId   String
  webhook     Webhook   @relation(fields: [webhookId], references: [id], onDelete: Cascade)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  
  @@unique([pageId, webhookId])
  @@index([pageId])
  @@index([webhookId])
  @@map("page_webhook_configs")
}

// WebhookDelivery model - tracks webhook delivery attempts
model WebhookDelivery {
  id            String          @id @default(cuid())
  webhookId     String
  webhook       Webhook         @relation(fields: [webhookId], references: [id], onDelete: Cascade)
  leadId        String
  lead          Lead            @relation(fields: [leadId], references: [id], onDelete: Cascade)
  status        DeliveryStatus  @default(PENDING)
  statusCode    Int?
  responseBody  String?         @db.Text
  error         String?         @db.Text
  attemptNumber Int             @default(1)
  nextRetryAt   DateTime?
  createdAt     DateTime        @default(now())
  completedAt   DateTime?
  
  @@index([webhookId])
  @@index([leadId])
  @@index([status])
  @@index([nextRetryAt])
  @@map("webhook_deliveries")
}

// Enums
enum LeadStatus {
  NEW
  PROCESSING
  DELIVERED
  FAILED
  ARCHIVED
}

enum DeliveryStatus {
  PENDING
  SUCCESS
  FAILED
  RETRYING
}

enum HttpMethod {
  POST
  PUT
  PATCH
}

enum AuthType {
  NONE
  BASIC
  BEARER
  API_KEY
  CUSTOM
}
```

### 3.3 Create Database Connection
Create `lib/db.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
```

### 3.4 Create Type Definitions
Create `types/database.types.ts`:
```typescript
import { Prisma } from '@prisma/client';

// User types
export type UserWithPages = Prisma.UserGetPayload<{
  include: { pages: true };
}>;

export type UserWithWebhooks = Prisma.UserGetPayload<{
  include: { webhooks: true };
}>;

// Page types
export type PageWithLeads = Prisma.PageGetPayload<{
  include: { leads: true };
}>;

export type PageWithWebhooks = Prisma.PageGetPayload<{
  include: { webhookConfigs: { include: { webhook: true } } };
}>;

// Lead types
export type LeadWithDeliveries = Prisma.LeadGetPayload<{
  include: { deliveries: true };
}>;

export type LeadWithPage = Prisma.LeadGetPayload<{
  include: { page: true };
}>;

// Webhook types
export type WebhookWithDeliveries = Prisma.WebhookGetPayload<{
  include: { deliveries: true };
}>;

export type WebhookWithPages = Prisma.WebhookGetPayload<{
  include: { pageConfigs: { include: { page: true } } };
}>;

// Delivery types
export type DeliveryWithDetails = Prisma.WebhookDeliveryGetPayload<{
  include: { webhook: true; lead: { include: { page: true } } };
}>;
```

### 3.5 Create Database Seed Script
Create `prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
import { encrypt } from '../lib/encryption';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      facebookId: 'test_facebook_id',
      accessToken: encrypt('test_access_token'),
      refreshToken: encrypt('test_refresh_token'),
      image: 'https://via.placeholder.com/150',
    },
  });

  console.log('Created test user:', testUser);

  // Create test page
  const testPage = await prisma.page.upsert({
    where: { facebookPageId: 'test_page_id' },
    update: {},
    create: {
      facebookPageId: 'test_page_id',
      name: 'Test Business Page',
      category: 'Business',
      accessToken: encrypt('test_page_access_token'),
      userId: testUser.id,
    },
  });

  console.log('Created test page:', testPage);

  // Create test webhook
  const testWebhook = await prisma.webhook.upsert({
    where: { id: 'test_webhook_id' },
    update: {},
    create: {
      id: 'test_webhook_id',
      name: 'Test Webhook',
      url: 'https://webhook.site/test',
      userId: testUser.id,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  });

  console.log('Created test webhook:', testWebhook);

  // Link page to webhook
  const pageWebhookConfig = await prisma.pageWebhookConfig.upsert({
    where: {
      pageId_webhookId: {
        pageId: testPage.id,
        webhookId: testWebhook.id,
      },
    },
    update: {},
    create: {
      pageId: testPage.id,
      webhookId: testWebhook.id,
    },
  });

  console.log('Created page-webhook config:', pageWebhookConfig);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 3.6 Update package.json
Add to `package.json` scripts:
```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:seed": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts",
    "db:reset": "prisma migrate reset"
  },
  "prisma": {
    "seed": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts"
  }
}
```

### 3.7 Run Database Migrations
```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name initial_schema

# Run seed (optional)
npm run db:seed

# Open Prisma Studio to view data
npx prisma studio
```

### 3.8 Create Database Utilities
Create `lib/db-utils.ts`:
```typescript
import { prisma } from '@/lib/db';
import { LeadStatus, DeliveryStatus } from '@prisma/client';

export async function getDatabaseStats() {
  const [userCount, pageCount, leadCount, webhookCount] = await Promise.all([
    prisma.user.count(),
    prisma.page.count(),
    prisma.lead.count(),
    prisma.webhook.count(),
  ]);

  return {
    users: userCount,
    pages: pageCount,
    leads: leadCount,
    webhooks: webhookCount,
  };
}

export async function getLeadStats(userId: string) {
  const pages = await prisma.page.findMany({
    where: { userId },
    select: { id: true },
  });

  const pageIds = pages.map(p => p.id);

  const [total, delivered, failed, pending] = await Promise.all([
    prisma.lead.count({ where: { pageId: { in: pageIds } } }),
    prisma.lead.count({ where: { pageId: { in: pageIds }, status: LeadStatus.DELIVERED } }),
    prisma.lead.count({ where: { pageId: { in: pageIds }, status: LeadStatus.FAILED } }),
    prisma.lead.count({ where: { pageId: { in: pageIds }, status: LeadStatus.NEW } }),
  ]);

  return { total, delivered, failed, pending };
}

export async function getWebhookStats(userId: string) {
  const webhooks = await prisma.webhook.findMany({
    where: { userId },
    include: {
      deliveries: {
        select: { status: true },
      },
    },
  });

  const stats = webhooks.reduce(
    (acc, webhook) => {
      acc.total++;
      if (webhook.isActive) acc.active++;
      
      webhook.deliveries.forEach(delivery => {
        if (delivery.status === DeliveryStatus.SUCCESS) acc.successful++;
        if (delivery.status === DeliveryStatus.FAILED) acc.failed++;
      });
      
      return acc;
    },
    { total: 0, active: 0, successful: 0, failed: 0 }
  );

  return stats;
}

export async function cleanupOldData(daysToKeep: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const deletedLeads = await prisma.lead.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      status: LeadStatus.ARCHIVED,
    },
  });

  const deletedDeliveries = await prisma.webhookDelivery.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      status: { in: [DeliveryStatus.SUCCESS, DeliveryStatus.FAILED] },
    },
  });

  return {
    deletedLeads: deletedLeads.count,
    deletedDeliveries: deletedDeliveries.count,
  };
}
```

### 3.9 Create Migration for Indexes
Create `prisma/migrations/add_indexes.sql`:
```sql
-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_leads_form_id ON leads(form_id);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON webhook_deliveries(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
CREATE INDEX IF NOT EXISTS idx_pages_updated_at ON pages(updated_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_page_status ON leads(page_id, status);
CREATE INDEX IF NOT EXISTS idx_deliveries_webhook_status ON webhook_deliveries(webhook_id, status);
CREATE INDEX IF NOT EXISTS idx_deliveries_lead_status ON webhook_deliveries(lead_id, status);
```

### 3.10 Environment Variables Check
Ensure `.env.local` has:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/leadconnector"
```

## Verification Steps
1. [ ] PostgreSQL database running
2. [ ] Prisma schema created successfully
3. [ ] Migrations applied without errors
4. [ ] Prisma Client generated
5. [ ] Seed data inserted (if ran seed)
6. [ ] Prisma Studio accessible
7. [ ] All indexes created
8. [ ] Database connection working

## Performance Considerations
- Proper indexes on frequently queried columns
- JSON fields for flexible data storage
- Cascade deletes for data integrity
- Optimized queries with includes
- Connection pooling configured

## Next Steps
- Proceed to Task 4: Facebook Integration
- Test database operations
- Set up database backups
- Configure monitoring

## Notes
- Use Prisma Studio for visual database management
- Regular backups recommended
- Monitor query performance in production
- Consider read replicas for scaling