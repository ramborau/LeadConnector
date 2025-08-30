# LeadConnector - Technical Implementation Guide

## Project Overview

LeadConnector is a Next.js application that integrates with Facebook Lead Ads to capture leads in real-time and distribute them via configurable webhooks. Built with Next.js 14+, Shadcn/UI, PostgreSQL, and Prisma ORM.

## Tech Stack

### Core Technologies

-   **Framework:** Next.js 14+ (App Router)
-   **Language:** TypeScript 5.0+
-   **UI Library:** Shadcn/UI with Radix UI primitives
-   **Styling:** Tailwind CSS 3.0+
-   **Database:** PostgreSQL 15+
-   **ORM:** Prisma 5.0+
-   **Authentication:** NextAuth.js with Facebook Provider
-   **State Management:** Zustand
-   **API Client:** Axios
-   **Validation:** Zod
-   **Forms:** React Hook Form
-   **Tables:** TanStack Table
-   **Testing:** Jest + React Testing Library
-   **Deployment:** Vercel/Railway

## Project Structure

```
leadconnector/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── leads/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── pages/
│   │   │   └── page.tsx
│   │   ├── webhooks/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── facebook/
│   │   │   ├── callback/
│   │   │   │   └── route.ts
│   │   │   ├── pages/
│   │   │   │   └── route.ts
│   │   │   └── leads/
│   │   │       └── route.ts
│   │   ├── webhooks/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── test/
│   │   │           └── route.ts
│   │   └── leads/
│   │       └── route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   │   └── [shadcn components]
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   ├── dashboard/
│   │   ├── stats-cards.tsx
│   │   ├── recent-leads.tsx
│   │   └── webhook-status.tsx
│   ├── leads/
│   │   ├── lead-table.tsx
│   │   ├── lead-filters.tsx
│   │   └── lead-detail.tsx
│   ├── webhooks/
│   │   ├── webhook-form.tsx
│   │   ├── webhook-list.tsx
│   │   └── webhook-test.tsx
│   └── pages/
│       ├── page-selector.tsx
│       └── page-card.tsx
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── facebook.ts
│   ├── webhook.ts
│   ├── utils.ts
│   └── constants.ts
├── hooks/
│   ├── use-leads.ts
│   ├── use-webhooks.ts
│   ├── use-facebook.ts
│   └── use-toast.ts
├── services/
│   ├── facebook.service.ts
│   ├── lead.service.ts
│   ├── webhook.service.ts
│   └── queue.service.ts
├── store/
│   ├── auth.store.ts
│   ├── lead.store.ts
│   └── webhook.store.ts
├── types/
│   ├── facebook.types.ts
│   ├── lead.types.ts
│   ├── webhook.types.ts
│   └── index.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/
│   └── assets/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── config files...
```

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

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

  pages         Page[]
  webhooks      Webhook[]
  @@index([email])
  @@index([facebookId])
}

model Page {
  id            String    @id @default(cuid())
  facebookPageId String   @unique
  name          String
  category      String?
  accessToken   String    @db.Text
  isActive      Boolean   @default(true)
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  leads         Lead[]
  webhookConfigs PageWebhookConfig[]

  @@index([userId])
  @@index([facebookPageId])
}

model Lead {
  id            String    @id @default(cuid())
  facebookLeadId String   @unique
  pageId        String
  page          Page      @relation(fields: [pageId], references: [id], onDelete: Cascade)
  formId        String
  formName      String
  campaignId    String?
  campaignName  String?
  adsetId       String?
  adsetName     String?
  adId          String?
  adName        String?
  leadData      Json
  status        LeadStatus @default(NEW)
  createdAt     DateTime  @default(now())
  processedAt   DateTime?

  deliveries    WebhookDelivery[]

  @@index([pageId])
  @@index([status])
  @@index([createdAt])
}

model Webhook {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  name          String
  url           String
  method        HttpMethod @default(POST)
  headers       Json?
  authType      AuthType  @default(NONE)
  authConfig    Json?
  retryCount    Int       @default(3)
  timeoutMs     Int       @default(30000)
  isActive      Boolean   @default(true)
  lastSuccess   DateTime?
  lastFailure   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  deliveries    WebhookDelivery[]
  pageConfigs   PageWebhookConfig[]

  @@index([userId])
  @@index([isActive])
}

model PageWebhookConfig {
  id            String    @id @default(cuid())
  pageId        String
  page          Page      @relation(fields: [pageId], references: [id], onDelete: Cascade)
  webhookId     String
  webhook       Webhook   @relation(fields: [webhookId], references: [id], onDelete: Cascade)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())

  @@unique([pageId, webhookId])
  @@index([pageId])
  @@index([webhookId])
}

model WebhookDelivery {
  id            String    @id @default(cuid())
  webhookId     String
  webhook       Webhook   @relation(fields: [webhookId], references: [id], onDelete: Cascade)
  leadId        String
  lead          Lead      @relation(fields: [leadId], references: [id], onDelete: Cascade)
  status        DeliveryStatus @default(PENDING)
  statusCode    Int?
  responseBody  String?   @db.Text
  error         String?   @db.Text
  attemptNumber Int       @default(1)
  nextRetryAt   DateTime?
  createdAt     DateTime  @default(now())
  completedAt   DateTime?

  @@index([webhookId])
  @@index([leadId])
  @@index([status])
  @@index([nextRetryAt])
}

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

## Environment Variables

```env
# .env.local
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/leadconnector"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Facebook App
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"
FACEBOOK_WEBHOOK_VERIFY_TOKEN="your-webhook-verify-token"

# Redis (for queue management)
REDIS_URL="redis://localhost:6379"

# Encryption
ENCRYPTION_KEY="your-32-character-encryption-key"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="LeadConnector"
```

## Key Implementation Files

### 1. Theme Configuration (tailwind.config.ts)

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
	darkMode: ['class'],
	content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: '#00c307',
					50: '#e6ffe7',
					100: '#ccffce',
					200: '#99ff9d',
					300: '#66ff6c',
					400: '#33ff3b',
					500: '#00c307',
					600: '#00a306',
					700: '#008305',
					800: '#006304',
					900: '#004302',
				},
				dark: {
					DEFAULT: '#075e54',
					50: '#e8f5f3',
					100: '#d1ebe7',
					200: '#a3d7cf',
					300: '#75c3b7',
					400: '#47af9f',
					500: '#075e54',
					600: '#064e46',
					700: '#053e38',
					800: '#042e2a',
					900: '#031e1c',
				},
				secondary: {
					DEFAULT: '#dcf8c6',
					50: '#fafef6',
					100: '#f5fded',
					200: '#ebfbdb',
					300: '#e1f9c9',
					400: '#dcf8c6',
					500: '#c8f4a8',
					600: '#b4f08a',
					700: '#a0ec6c',
					800: '#8ce84e',
					900: '#78e430',
				},
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
};
export default config;
```

### 2. NextAuth Configuration (app/api/auth/[...nextauth]/route.ts)

```typescript
import NextAuth from 'next-auth';
import FacebookProvider from 'next-auth/providers/facebook';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/encryption';

const handler = NextAuth({
	adapter: PrismaAdapter(prisma),
	providers: [
		FacebookProvider({
			clientId: process.env.FACEBOOK_CLIENT_ID!,
			clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
			authorization: {
				params: {
					scope: 'email,pages_show_list,leads_retrieval,pages_read_engagement,ads_management',
				},
			},
		}),
	],
	callbacks: {
		async session({ session, token, user }) {
			if (session.user) {
				session.user.id = user.id;
				session.accessToken = token.accessToken;
			}
			return session;
		},
		async jwt({ token, account, user }) {
			if (account) {
				token.accessToken = account.access_token;

				// Store encrypted tokens in database
				await prisma.user.update({
					where: { id: user.id },
					data: {
						accessToken: encrypt(account.access_token!),
						refreshToken: account.refresh_token ? encrypt(account.refresh_token) : null,
						tokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : null,
					},
				});
			}
			return token;
		},
	},
	pages: {
		signIn: '/login',
		error: '/login',
	},
});

export { handler as GET, handler as POST };
```

### 3. Facebook Service (services/facebook.service.ts)

```typescript
import axios from 'axios';
import { decrypt } from '@/lib/encryption';
import { prisma } from '@/lib/db';

const FACEBOOK_GRAPH_URL = 'https://graph.facebook.com/v19.0';

export class FacebookService {
	private accessToken: string;

	constructor(encryptedToken: string) {
		this.accessToken = decrypt(encryptedToken);
	}

	async getPages() {
		const response = await axios.get(`${FACEBOOK_GRAPH_URL}/me/accounts`, {
			params: {
				access_token: this.accessToken,
				fields: 'id,name,category,access_token',
			},
		});
		return response.data.data;
	}

	async subscribeToLeadgen(pageId: string, pageAccessToken: string) {
		await axios.post(`${FACEBOOK_GRAPH_URL}/${pageId}/subscribed_apps`, {
			subscribed_fields: 'leadgen',
			access_token: pageAccessToken,
		});
	}

	async getLeadDetails(leadId: string, pageAccessToken: string) {
		const response = await axios.get(`${FACEBOOK_GRAPH_URL}/${leadId}`, {
			params: {
				access_token: pageAccessToken,
				fields: 'id,created_time,field_data,form_id,campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name',
			},
		});
		return response.data;
	}

	async getFormDetails(formId: string, pageAccessToken: string) {
		const response = await axios.get(`${FACEBOOK_GRAPH_URL}/${formId}`, {
			params: {
				access_token: pageAccessToken,
				fields: 'id,name,questions',
			},
		});
		return response.data;
	}

	static async handleWebhook(entry: any) {
		for (const change of entry.changes) {
			if (change.field === 'leadgen') {
				const leadId = change.value.leadgen_id;
				const pageId = change.value.page_id;
				const formId = change.value.form_id;

				// Get page details from database
				const page = await prisma.page.findUnique({
					where: { facebookPageId: pageId },
				});

				if (!page || !page.isActive) continue;

				// Get lead details from Facebook
				const fbService = new FacebookService(page.accessToken);
				const leadData = await fbService.getLeadDetails(leadId, decrypt(page.accessToken));
				const formData = await fbService.getFormDetails(formId, decrypt(page.accessToken));

				// Process field data
				const processedData = this.processFieldData(leadData.field_data);

				// Save lead to database
				const lead = await prisma.lead.create({
					data: {
						facebookLeadId: leadId,
						pageId: page.id,
						formId: formId,
						formName: formData.name,
						campaignId: leadData.campaign_id,
						campaignName: leadData.campaign_name,
						adsetId: leadData.adset_id,
						adsetName: leadData.adset_name,
						adId: leadData.ad_id,
						adName: leadData.ad_name,
						leadData: processedData,
						status: 'NEW',
					},
				});

				// Trigger webhook delivery
				await WebhookService.deliverLead(lead);
			}
		}
	}

	private static processFieldData(fieldData: any[]) {
		const processed: any = {};
		for (const field of fieldData) {
			processed[field.name] = field.values[0];
		}
		return processed;
	}
}
```

### 4. Webhook Service (services/webhook.service.ts)

```typescript
import axios from 'axios';
import { prisma } from '@/lib/db';
import { Lead, Webhook, WebhookDelivery } from '@prisma/client';
import crypto from 'crypto';

export class WebhookService {
	static async deliverLead(lead: Lead) {
		// Get active webhooks for this page
		const pageWebhooks = await prisma.pageWebhookConfig.findMany({
			where: {
				pageId: lead.pageId,
				isActive: true,
				webhook: {
					isActive: true,
				},
			},
			include: {
				webhook: true,
			},
		});

		// Create delivery records for each webhook
		for (const config of pageWebhooks) {
			await this.createDelivery(lead, config.webhook);
		}
	}

	static async createDelivery(lead: Lead, webhook: Webhook) {
		const delivery = await prisma.webhookDelivery.create({
			data: {
				webhookId: webhook.id,
				leadId: lead.id,
				status: 'PENDING',
			},
		});

		// Queue for immediate delivery
		await this.attemptDelivery(delivery.id);
	}

	static async attemptDelivery(deliveryId: string) {
		const delivery = await prisma.webhookDelivery.findUnique({
			where: { id: deliveryId },
			include: {
				webhook: true,
				lead: {
					include: {
						page: true,
					},
				},
			},
		});

		if (!delivery) return;

		try {
			const payload = this.buildPayload(delivery.lead);
			const headers = this.buildHeaders(delivery.webhook);

			const response = await axios({
				method: delivery.webhook.method,
				url: delivery.webhook.url,
				data: payload,
				headers,
				timeout: delivery.webhook.timeoutMs,
			});

			// Update delivery as successful
			await prisma.webhookDelivery.update({
				where: { id: deliveryId },
				data: {
					status: 'SUCCESS',
					statusCode: response.status,
					responseBody: JSON.stringify(response.data),
					completedAt: new Date(),
				},
			});

			// Update webhook last success
			await prisma.webhook.update({
				where: { id: delivery.webhook.id },
				data: { lastSuccess: new Date() },
			});

			// Update lead status
			await prisma.lead.update({
				where: { id: delivery.lead.id },
				data: {
					status: 'DELIVERED',
					processedAt: new Date(),
				},
			});
		} catch (error: any) {
			const shouldRetry = delivery.attemptNumber < delivery.webhook.retryCount;

			await prisma.webhookDelivery.update({
				where: { id: deliveryId },
				data: {
					status: shouldRetry ? 'RETRYING' : 'FAILED',
					statusCode: error.response?.status,
					error: error.message,
					attemptNumber: delivery.attemptNumber + 1,
					nextRetryAt: shouldRetry ? this.getNextRetryTime(delivery.attemptNumber) : null,
				},
			});

			// Update webhook last failure
			await prisma.webhook.update({
				where: { id: delivery.webhook.id },
				data: { lastFailure: new Date() },
			});

			if (shouldRetry) {
				// Schedule retry
				await this.scheduleRetry(deliveryId, delivery.attemptNumber);
			} else {
				// Update lead status as failed
				await prisma.lead.update({
					where: { id: delivery.lead.id },
					data: { status: 'FAILED' },
				});
			}
		}
	}

	private static buildPayload(lead: any) {
		return {
			id: lead.id,
			facebook_lead_id: lead.facebookLeadId,
			page: {
				id: lead.page.id,
				name: lead.page.name,
			},
			form: {
				id: lead.formId,
				name: lead.formName,
			},
			campaign: {
				id: lead.campaignId,
				name: lead.campaignName,
			},
			adset: {
				id: lead.adsetId,
				name: lead.adsetName,
			},
			ad: {
				id: lead.adId,
				name: lead.adName,
			},
			data: lead.leadData,
			created_at: lead.createdAt,
		};
	}

	private static buildHeaders(webhook: Webhook) {
		const headers: any = {
			'Content-Type': 'application/json',
			'User-Agent': 'LeadConnector/1.0',
		};

		if (webhook.headers) {
			Object.assign(headers, webhook.headers);
		}

		// Handle authentication
		if (webhook.authType === 'BASIC' && webhook.authConfig) {
			const { username, password } = webhook.authConfig as any;
			headers['Authorization'] = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
		} else if (webhook.authType === 'BEARER' && webhook.authConfig) {
			const { token } = webhook.authConfig as any;
			headers['Authorization'] = `Bearer ${token}`;
		} else if (webhook.authType === 'API_KEY' && webhook.authConfig) {
			const { headerName, apiKey } = webhook.authConfig as any;
			headers[headerName] = apiKey;
		}

		return headers;
	}

	private static getNextRetryTime(attemptNumber: number): Date {
		// Exponential backoff: 1min, 5min, 15min
		const delays = [60, 300, 900];
		const delaySeconds = delays[Math.min(attemptNumber, delays.length - 1)];
		return new Date(Date.now() + delaySeconds * 1000);
	}

	private static async scheduleRetry(deliveryId: string, attemptNumber: number) {
		// In production, use a job queue like Bull or BullMQ
		const delay = this.getRetryDelay(attemptNumber);
		setTimeout(() => {
			this.attemptDelivery(deliveryId);
		}, delay);
	}

	private static getRetryDelay(attemptNumber: number): number {
		const delays = [60000, 300000, 900000]; // 1min, 5min, 15min
		return delays[Math.min(attemptNumber, delays.length - 1)];
	}

	static async testWebhook(webhookId: string) {
		const webhook = await prisma.webhook.findUnique({
			where: { id: webhookId },
		});

		if (!webhook) throw new Error('Webhook not found');

		const testPayload = {
			test: true,
			timestamp: new Date().toISOString(),
			webhook_id: webhookId,
			sample_lead: {
				id: 'test-lead-123',
				facebook_lead_id: 'fb-test-123',
				page: {
					id: 'test-page-123',
					name: 'Test Page',
				},
				form: {
					id: 'test-form-123',
					name: 'Test Form',
				},
				data: {
					email: 'test@example.com',
					full_name: 'Test User',
					phone_number: '+1234567890',
				},
				created_at: new Date().toISOString(),
			},
		};

		const headers = this.buildHeaders(webhook);

		try {
			const response = await axios({
				method: webhook.method,
				url: webhook.url,
				data: testPayload,
				headers,
				timeout: webhook.timeoutMs,
			});

			return {
				success: true,
				statusCode: response.status,
				response: response.data,
			};
		} catch (error: any) {
			return {
				success: false,
				statusCode: error.response?.status,
				error: error.message,
			};
		}
	}
}
```

### 5. Dashboard Component (components/dashboard/stats-cards.tsx)

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, Zap, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
	stats: {
		totalLeads: number;
		todayLeads: number;
		activeWebhooks: number;
		successRate: number;
	};
}

export function StatsCards({ stats }: StatsCardsProps) {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium text-dark">Total Leads</CardTitle>
					<Users className="h-4 w-4 text-primary" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.totalLeads.toLocaleString()}</div>
					<p className="text-xs text-muted-foreground">All time captured leads</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium text-dark">Today's Leads</CardTitle>
					<Activity className="h-4 w-4 text-primary" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.todayLeads}</div>
					<p className="text-xs text-muted-foreground">Captured in last 24 hours</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium text-dark">Active Webhooks</CardTitle>
					<Zap className="h-4 w-4 text-primary" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.activeWebhooks}</div>
					<p className="text-xs text-muted-foreground">Currently configured</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium text-dark">Success Rate</CardTitle>
					<TrendingUp className="h-4 w-4 text-primary" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.successRate}%</div>
					<p className="text-xs text-muted-foreground">Webhook delivery rate</p>
				</CardContent>
			</Card>
		</div>
	);
}
```

## Setup Instructions

### 1. Initial Setup

```bash
# Create Next.js app
npx create-next-app@latest leadconnector --typescript --tailwind --app

# Navigate to project
cd leadconnector

# Install dependencies
npm install @prisma/client prisma @next-auth/prisma-adapter next-auth
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label
npm install axios zod react-hook-form @hookform/resolvers
npm install @tanstack/react-table zustand
npm install lucide-react clsx tailwind-merge
npm install -D @types/node

# Setup Shadcn/UI
npx shadcn-ui@latest init
```

### 2. Configure Shadcn/UI

When prompted, use these settings:

-   Style: Default
-   Base color: Neutral
-   CSS variables: Yes

### 3. Install Shadcn Components

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add alert
```

### 4. Database Setup

```bash
# Initialize Prisma
npx prisma init

# Update DATABASE_URL in .env
# Run migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Seed database (optional)
npx prisma db seed
```

### 5. Facebook App Setup

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create a new app (Business type)
3. Add Facebook Login product
4. Configure OAuth redirect URI: `https://yourdomain.com/api/auth/callback/facebook`
5. Add Webhooks product
6. Subscribe to Page > Leadgen webhook
7. Set webhook URL: `https://yourdomain.com/api/facebook/webhook`
8. Copy App ID and App Secret to .env

### 6. Development Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

## Security Considerations

1. **Token Encryption**: All Facebook tokens are encrypted using AES-256-GCM
2. **HTTPS Only**: Enforce HTTPS in production
3. **Rate Limiting**: Implement rate limiting on API endpoints
4. **Input Validation**: Use Zod for all input validation
5. **SQL Injection**: Prisma ORM prevents SQL injection
6. **XSS Protection**: Next.js provides built-in XSS protection
7. **CSRF Protection**: Implement CSRF tokens for state-changing operations
8. **Webhook Signature**: Verify Facebook webhook signatures
9. **Access Control**: Implement proper user authorization checks
10. **Audit Logging**: Log all critical operations

## Performance Optimization

1. **Database Indexing**: Proper indexes on frequently queried columns
2. **Caching Strategy**: Implement Redis for caching
3. **Queue Management**: Use Bull/BullMQ for webhook delivery queue
4. **Connection Pooling**: PostgreSQL connection pooling
5. **Image Optimization**: Use Next.js Image component
6. **Code Splitting**: Automatic with Next.js App Router
7. **API Response Caching**: Cache Facebook API responses
8. **Webhook Retry Logic**: Exponential backoff for failed webhooks
9. **Database Query Optimization**: Use Prisma's query optimization
10. **CDN**: Use Vercel's Edge Network or CloudFlare

## Monitoring & Logging

1. **Application Monitoring**: Sentry or LogRocket
2. **Performance Monitoring**: Vercel Analytics
3. **Error Tracking**: Sentry
4. **Uptime Monitoring**: Better Uptime or Pingdom
5. **Log Aggregation**: LogDNA or Datadog
6. **Database Monitoring**: PostgreSQL monitoring tools
7. **Webhook Delivery Tracking**: Custom dashboard
8. **User Analytics**: Google Analytics or Plausible

## Testing Strategy

### Unit Tests

-   Service methods
-   Utility functions
-   React components
-   API route handlers

### Integration Tests

-   Database operations
-   Facebook API integration
-   Webhook delivery system
-   Authentication flow

### E2E Tests

-   User registration/login
-   Page connection flow
-   Lead capture process
-   Webhook configuration
-   Dashboard functionality

## Support & Documentation

1. **User Documentation**: In-app help system
2. **API Documentation**: OpenAPI/Swagger spec
3. **Developer Guide**: GitHub wiki
4. **Video Tutorials**: User onboarding videos
5. **FAQ Section**: Common questions and solutions
6. **Support Ticket System**: Integrated help desk
7. **Community Forum**: Discord or Slack community
8. **Change Log**: Version history and updates

## Future Enhancements

1. **Multi-user Support**: Team collaboration features
2. **Advanced Analytics**: Detailed lead analytics and insights
3. **Native Integrations**: Direct CRM integrations
4. **Lead Scoring**: AI-based lead quality scoring
5. **Automation Rules**: Conditional webhook routing
6. **Mobile App**: React Native mobile application
7. **Bulk Operations**: Mass lead export/import
8. **A/B Testing**: Webhook configuration testing
9. **Custom Fields Mapping**: Field transformation rules
10. **White-label Solution**: Custom branding options
