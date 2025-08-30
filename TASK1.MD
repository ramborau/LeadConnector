# Task 1: Project Setup and Configuration

## Status: PENDING

## Overview
Initialize the Next.js project with TypeScript, configure the development environment, and set up all necessary dependencies for the Facebook Lead Connector application.

## Prerequisites
- Node.js 18+ installed
- PostgreSQL 15+ installed
- npm or yarn package manager
- Git initialized

## Subtasks

### 1.1 Create Next.js Application
```bash
npx create-next-app@latest leadconnector --typescript --tailwind --app --src-dir=false
cd leadconnector
```

### 1.2 Install Core Dependencies
```bash
# Authentication & Database
npm install @prisma/client prisma @next-auth/prisma-adapter next-auth@beta

# UI Components & Styling
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-select @radix-ui/react-switch @radix-ui/react-tabs
npm install @radix-ui/react-toast @radix-ui/react-alert-dialog @radix-ui/react-checkbox @radix-ui/react-popover @radix-ui/react-scroll-area

# Form & Validation
npm install react-hook-form @hookform/resolvers zod

# State Management & Data Fetching
npm install zustand axios swr @tanstack/react-table @tanstack/react-query

# Utilities
npm install clsx tailwind-merge lucide-react date-fns crypto-js class-variance-authority

# Development Dependencies
npm install -D @types/node @types/crypto-js
```

### 1.3 Setup Shadcn/UI
```bash
npx shadcn-ui@latest init

# Install all required components
npx shadcn-ui@latest add button card dialog dropdown-menu form input label select table tabs toast badge switch alert checkbox popover scroll-area separator sheet skeleton avatar command
```

### 1.4 Project Structure Creation
Create the following directory structure:
```
leadconnector/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── leads/
│   │   ├── pages/
│   │   ├── webhooks/
│   │   └── settings/
│   ├── api/
│   │   ├── auth/
│   │   ├── facebook/
│   │   ├── webhooks/
│   │   └── leads/
│   └── layout.tsx
├── components/
│   ├── ui/
│   ├── layout/
│   ├── dashboard/
│   ├── leads/
│   ├── webhooks/
│   └── pages/
├── lib/
├── hooks/
├── services/
├── store/
├── types/
├── prisma/
├── public/
└── tests/
```

### 1.5 Environment Configuration
Create `.env.local` file:
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/leadconnector"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-32-character-secret-key"

# Facebook App (will be configured later)
FACEBOOK_CLIENT_ID=""
FACEBOOK_CLIENT_SECRET=""
FACEBOOK_WEBHOOK_VERIFY_TOKEN="leadconnector-webhook-verify-2024"

# Redis (optional for production)
REDIS_URL="redis://localhost:6379"

# Encryption
ENCRYPTION_KEY="generate-another-32-character-key"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="LeadConnector"
```

### 1.6 Tailwind Configuration
Update `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
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

### 1.7 TypeScript Configuration
Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/services/*": ["./services/*"],
      "@/store/*": ["./store/*"],
      "@/types/*": ["./types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 1.8 Package.json Scripts
Update `package.json`:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "ts-node prisma/seed.ts",
    "test": "jest --watch",
    "test:ci": "jest --ci"
  }
}
```

### 1.9 ESLint Configuration
Create `.eslintrc.json`:
```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

### 1.10 Prettier Configuration
Create `.prettierrc`:
```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

## Verification Steps
1. [ ] Next.js app runs with `npm run dev`
2. [ ] TypeScript compilation successful
3. [ ] Tailwind CSS working with custom colors
4. [ ] All dependencies installed without errors
5. [ ] Environment variables configured
6. [ ] Directory structure created
7. [ ] Shadcn/UI components installed

## Next Steps
- Proceed to Task 2: Authentication System
- Set up GitHub repository
- Configure CI/CD pipeline

## Notes
- Ensure PostgreSQL is running before proceeding to database tasks
- Generate secure keys for NEXTAUTH_SECRET and ENCRYPTION_KEY
- Keep Facebook app credentials empty until Facebook app is created