# 🛠️ Tech Stack Detalhada - MCP Sati

## Arquitetura Geral

```
┌─────────────────────────────────────────────────────────┐
│                    ChatGPT (Cliente)                     │
│                 Web | iOS | Android                      │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS (MCP Protocol)
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Vercel Edge Network (CDN)                   │
│                  - Components Bundle                     │
│                  - Static Assets                         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js App (Vercel Serverless)             │
│  ┌────────────────────────────────────────────────────┐ │
│  │  API Routes                                        │ │
│  │  ├─ /mcp (MCP Server)                              │ │
│  │  ├─ /auth/login (OAuth)                            │ │
│  │  ├─ /auth/callback                                 │ │
│  │  └─ /api/webhooks (timers, etc)                    │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Business Logic                                    │ │
│  │  ├─ Tool Handlers                                  │ │
│  │  ├─ Validators (Zod)                               │ │
│  │  ├─ Services (Hyperfocus, Tasks, Timer)            │ │
│  │  └─ Utils                                          │ │
│  └────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    Supabase Cloud                        │
│  ├─ PostgreSQL (Data)                                   │
│  ├─ Auth (OAuth providers)                              │
│  ├─ Storage (opcional)                                  │
│  └─ Realtime (subscriptions)                            │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Frontend (MCP Components)

### Core Framework
```json
{
  "framework": "React 18.3+",
  "language": "TypeScript 5.3+",
  "bundler": "Vite 5.0+",
  "styling": "Tailwind CSS 3.4+"
}
```

### Dependências

#### Essenciais
```bash
npm install react@18.3 react-dom@18.3
npm install -D typescript @types/react @types/react-dom
npm install tailwindcss postcss autoprefixer
npm install clsx tailwind-merge  # Utility classes
```

#### UI & Animações
```bash
npm install framer-motion         # Animações suaves
npm install lucide-react          # Ícones (lightweight)
npm install @radix-ui/react-checkbox  # Checkboxes acessíveis
npm install @radix-ui/react-dialog    # Modal (timer fullscreen)
```

#### State Management
```bash
npm install zustand              # State global (lightweight)
# OU
npm install @tanstack/react-query # Server state
```

### Build Configuration

#### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/components/index.tsx'),
      name: 'SatiComponents',
      fileName: 'bundle',
      formats: ['es']
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
});
```

#### tailwind.config.js
```javascript
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Alinhado com ChatGPT design system
        'chat-gray': {
          50: '#f9fafb',
          100: '#f3f4f6',
          // ... rest of grays
          900: '#111827'
        },
        // Cores de hiperfocos
        hyperfocus: {
          red: '#ef4444',
          green: '#10b981',
          blue: '#3b82f6',
          orange: '#f97316',
          purple: '#a855f7',
          pink: '#ec4899'
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-gentle': 'pulseGentle 2s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
```

---

## ⚙️ Backend (MCP Server)

### Core Framework
```json
{
  "framework": "Next.js 14.2+",
  "runtime": "Node.js 20+",
  "language": "TypeScript 5.3+",
  "mcp": "@modelcontextprotocol/sdk 0.5+"
}
```

### Dependências

#### Essenciais
```bash
npm install next@14 react react-dom
npm install @modelcontextprotocol/sdk
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install zod                   # Schema validation
```

#### Utilidades
```bash
npm install date-fns             # Date manipulation
npm install nanoid               # ID generation (se não usar UUID)
npm install jose                 # JWT handling
```

#### Dev Dependencies
```bash
npm install -D @types/node
npm install -D eslint eslint-config-next
npm install -D prettier prettier-plugin-tailwindcss
npm install -D vitest @vitest/ui  # Testes
npm install -D @playwright/test   # E2E tests
```

### Estrutura de Pastas

```
sati-mcp/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── mcp/
│   │   │   └── route.ts          # MCP Server endpoint
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   └── callback/route.ts
│   │   ├── api/
│   │   │   └── webhooks/route.ts
│   │   └── layout.tsx
│   │
│   ├── components/               # MCP UI Components
│   │   ├── HyperfocusCard.tsx
│   │   ├── TaskBreakdown.tsx
│   │   ├── FocusTimer.tsx
│   │   ├── HyperfocusTreeView.tsx
│   │   ├── AlternancyFlow.tsx
│   │   └── index.tsx             # Bundle entry
│   │
│   ├── lib/                      # Business Logic
│   │   ├── mcp/
│   │   │   ├── tools/            # Tool handlers
│   │   │   │   ├── createHyperfocus.ts
│   │   │   │   ├── breakIntoSubtasks.ts
│   │   │   │   ├── analyzeContext.ts
│   │   │   │   └── ...
│   │   │   ├── schemas.ts        # Zod schemas
│   │   │   └── server.ts         # MCP server setup
│   │   │
│   │   ├── supabase/
│   │   │   ├── client.ts         # Supabase client
│   │   │   ├── queries.ts        # DB queries
│   │   │   └── types.ts          # DB types (auto-generated)
│   │   │
│   │   ├── services/
│   │   │   ├── hyperfocus.service.ts
│   │   │   ├── task.service.ts
│   │   │   ├── timer.service.ts
│   │   │   └── auth.service.ts
│   │   │
│   │   └── utils/
│   │       ├── errors.ts
│   │       ├── logger.ts
│   │       └── validators.ts
│   │
│   └── types/                    # TypeScript types
│       ├── mcp.d.ts
│       ├── database.d.ts
│       └── components.d.ts
│
├── supabase/
│   ├── migrations/               # SQL migrations
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   └── ...
│   ├── seed.sql                  # Dados de teste
│   └── config.toml
│
├── tests/
│   ├── unit/
│   │   └── tools/
│   ├── integration/
│   │   └── flows/
│   └── e2e/
│       └── chatgpt-integration.spec.ts
│
├── public/
│   ├── sounds/                   # Alarm sounds
│   │   ├── gentle-bell.mp3
│   │   └── soft-chime.mp3
│   └── icons/
│
├── docs/
│   ├── PRD.md
│   ├── SPRINTS.md
│   ├── API.md
│   └── DEPLOYMENT.md
│
├── .env.example
├── .env.local                    # Não comitar!
├── next.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🗄️ Database (Supabase)

### Schema Completo

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Hyperfocus table
CREATE TABLE public.hyperfocus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 100),
    description TEXT CHECK (char_length(description) <= 500),
    color TEXT DEFAULT 'blue' CHECK (color IN ('red','green','blue','orange','purple','brown','gray','pink')),
    estimated_time_minutes INTEGER CHECK (estimated_time_minutes >= 5 AND estimated_time_minutes <= 480),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    archived BOOLEAN DEFAULT FALSE,
    
    -- Indexes
    INDEX idx_hyperfocus_user_id (user_id),
    INDEX idx_hyperfocus_created_at (created_at DESC)
);

-- Tasks table
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hyperfocus_id UUID REFERENCES public.hyperfocus(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    order_index INTEGER NOT NULL DEFAULT 0,
    estimated_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,
    
    INDEX idx_tasks_hyperfocus_id (hyperfocus_id),
    INDEX idx_tasks_order (hyperfocus_id, order_index)
);

-- Focus sessions table
CREATE TABLE public.focus_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hyperfocus_id UUID REFERENCES public.hyperfocus(id) ON DELETE CASCADE NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ended_at TIMESTAMPTZ,
    planned_duration_minutes INTEGER NOT NULL,
    actual_duration_minutes INTEGER,
    interrupted BOOLEAN DEFAULT FALSE,
    
    INDEX idx_focus_sessions_hyperfocus (hyperfocus_id),
    INDEX idx_focus_sessions_started (started_at DESC)
);

-- Alternancy sessions table
CREATE TABLE public.alternancy_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE public.alternancy_hyperfocus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alternancy_session_id UUID REFERENCES public.alternancy_sessions(id) ON DELETE CASCADE NOT NULL,
    hyperfocus_id UUID REFERENCES public.hyperfocus(id) ON DELETE CASCADE NOT NULL,
    order_index INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL,
    
    UNIQUE(alternancy_session_id, hyperfocus_id, order_index)
);

-- Saved context (widget state)
CREATE TABLE public.hyperfocus_context (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hyperfocus_id UUID REFERENCES public.hyperfocus(id) ON DELETE CASCADE NOT NULL,
    context_data JSONB NOT NULL,
    saved_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Keep only latest context per hyperfocus
    UNIQUE(hyperfocus_id)
);

-- Row Level Security (RLS)
ALTER TABLE public.hyperfocus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alternancy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alternancy_hyperfocus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hyperfocus_context ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can CRUD own hyperfocus"
    ON public.hyperfocus
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can CRUD tasks of own hyperfocus"
    ON public.tasks
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.hyperfocus
            WHERE hyperfocus.id = tasks.hyperfocus_id
            AND hyperfocus.user_id = auth.uid()
        )
    );

-- Similar policies para outras tabelas...

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hyperfocus_updated_at
    BEFORE UPDATE ON public.hyperfocus
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### TypeScript Types (Auto-generated)

```bash
# Gerar types do schema
npx supabase gen types typescript --project-id <project-id> > src/types/database.d.ts
```

---

## 🔌 APIs e Integrações

### Model Context Protocol (MCP)

```typescript
// src/lib/mcp/server.ts
import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';

const server = new Server({
  name: 'sati-mcp',
  version: '1.0.0',
  description: 'Hyperfocus organizer for neurodivergent people'
});

// Register tools
server.tool(
  'createHyperfocus',
  createHyperfocusSchema,
  createHyperfocusHandler
);

server.tool(
  'breakIntoSubtasks',
  breakIntoSubtasksSchema,
  breakIntoSubtasksHandler
);

// ... registrar outras tools

export default server;
```

### Supabase Client

```typescript
// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-side client (com service role)
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

---

## 🔐 Autenticação

### OAuth Providers

```typescript
// src/lib/auth/config.ts
export const authConfig = {
  providers: [
    {
      name: 'google',
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scopes: ['email', 'profile']
    },
    {
      name: 'github',
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      scopes: ['user:email']
    }
  ],
  redirectUrl: `${process.env.NEXT_PUBLIC_URL}/auth/callback`,
  cookieName: 'sati-auth-token',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 dias
  }
};
```

### Middleware de Autenticação

```typescript
// src/lib/auth/middleware.ts
import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function requireAuth(request: NextRequest) {
  const token = request.cookies.get('sati-auth-token')?.value;
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Invalid authentication token');
  }
  
  return user;
}
```

---

## 🧪 Testing Stack

### Unit Tests (Vitest)

```bash
npm install -D vitest @vitest/ui
npm install -D @testing-library/react @testing-library/jest-dom
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/']
    }
  }
});
```

### E2E Tests (Playwright)

```bash
npm install -D @playwright/test
npx playwright install
```

```typescript
// tests/e2e/hyperfocus-flow.spec.ts
import { test, expect } from '@playwright/test';

test('create hyperfocus via ChatGPT', async ({ page }) => {
  await page.goto('https://chatgpt.com');
  
  // Login...
  
  // Enable Sati in developer mode
  await page.click('[data-connector="sati"]');
  
  // Send prompt
  await page.fill('textarea', 'Sati, crie um hiperfoco: Aprender React');
  await page.press('textarea', 'Enter');
  
  // Wait for component render
  await expect(page.locator('[data-component="HyperfocusCard"]')).toBeVisible();
  
  // Verify content
  await expect(page.locator('text=Aprender React')).toBeVisible();
});
```

---

## 🚀 Deployment & DevOps

### Vercel Configuration

```javascript
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1"],  // US East (perto de usuários)
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-key",
    "GOOGLE_CLIENT_ID": "@google-client-id",
    "GOOGLE_CLIENT_SECRET": "@google-client-secret",
    "GITHUB_CLIENT_ID": "@github-client-id",
    "GITHUB_CLIENT_SECRET": "@github-client-secret"
  },
  "headers": [
    {
      "source": "/mcp",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "POST, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
      ]
    }
  ]
}
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Build
        run: npm run build

  deploy-preview:
    needs: test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 📊 Monitoring & Observability

### Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Remove dados sensíveis
    if (event.request) {
      delete event.request.cookies;
    }
    return event;
  }
});
```

### Logging (Pino)

```bash
npm install pino pino-pretty
```

```typescript
// src/lib/utils/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

// Usage
logger.info({ toolName: 'createHyperfocus', userId }, 'Tool called');
logger.error({ error }, 'Failed to create hyperfocus');
```

### Analytics (Vercel)

```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

---

## 🔧 Development Tools

### Recomendados

```json
{
  "vscode": {
    "extensions": [
      "dbaeumer.vscode-eslint",
      "esbenp.prettier-vscode",
      "bradlc.vscode-tailwindcss",
      "Prisma.prisma",
      "supabase.supabase-vscode"
    ]
  },
  
  "tools": {
    "inspector": "@modelcontextprotocol/inspector",
    "db_client": "Supabase Studio (web) ou TablePlus",
    "api_testing": "Thunder Client (VSCode) ou Postman",
    "design": "Figma (opcional)"
  }
}
```

### Scripts npm

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    
    "test": "vitest",
    "test:unit": "vitest run --coverage",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    
    "db:migrate": "supabase db push",
    "db:reset": "supabase db reset",
    "db:seed": "supabase db seed",
    "db:types": "supabase gen types typescript > src/types/database.d.ts",
    
    "components:build": "vite build --config vite.components.config.ts",
    "components:watch": "vite build --watch --config vite.components.config.ts",
    
    "format": "prettier --write \"src/**/*.{js,jsx,ts,tsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{js,jsx,ts,tsx,json,css,md}\""
  }
}
```

---

## 🌍 Environment Variables

### .env.example

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Server-side only!

# OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GITHUB_CLIENT_ID=Iv1.xxxxx
GITHUB_CLIENT_SECRET=xxxxx

# App
NEXT_PUBLIC_URL=https://sati.app
NODE_ENV=production

# Monitoring (opcional)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
LOG_LEVEL=info

# ChatGPT (opcional - para webhooks)
CHATGPT_WEBHOOK_SECRET=xxxxx
```

---

## 📦 Dependências Completas

### package.json (Final)

```json
{
  "name": "sati-mcp",
  "version": "1.0.0",
  "private": true,
  "scripts": { "...": "ver acima" },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@modelcontextprotocol/sdk": "^0.5.0",
    "@supabase/supabase-js": "^2.40.0",
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "zod": "^3.22.0",
    "date-fns": "^3.0.0",
    "jose": "^5.0.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.300.0",
    "@radix-ui/react-checkbox": "^1.0.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "zustand": "^4.5.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.3.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.2.0",
    "prettier": "^3.2.0",
    "prettier-plugin-tailwindcss": "^0.5.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "vitest": "^1.2.0",
    "@vitest/ui": "^1.2.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@playwright/test": "^1.41.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

**Bundle Size Estimado:**
- Next.js app: ~120KB gzipped
- Components bundle: ~80KB gzipped
- **Total:** <200KB ✅ (dentro do limite recomendado)

---

## 🎨 Design Tokens

### Cores (Tailwind)

```javascript
// Paleta neurodivergent-friendly (low stimulation)
const colors = {
  primary: '#3b82f6',      // Blue - calmo, focado
  success: '#10b981',      // Green - encorajador
  warning: '#f59e0b',      // Amber - gentil
  danger: '#ef4444',       // Red - suave
  
  // Cores de hiperfocos (saturação reduzida)
  hyperfocus: {
    red: '#ef4444',
    green: '#10b981',
    blue: '#3b82f6',
    orange: '#f97316',
    purple: '#a855f7',
    pink: '#ec4899',
    brown: '#92400e',
    gray: '#6b7280'
  },
  
  // Backgrounds (dark-first)
  bg: {
    primary: '#111827',    // Dark
    secondary: '#1f2937',
    tertiary: '#374151'
  }
};
```

### Typography

```css
/* Fonte: Inter (default do ChatGPT) */
font-family: 'Inter', -apple-system, system-ui, sans-serif;

/* Sizes */
.text-xs: 0.75rem    /* 12px */
.text-sm: 0.875rem   /* 14px */
.text-base: 1rem     /* 16px */
.text-lg: 1.125rem   /* 18px */
.text-xl: 1.25rem    /* 20px */

/* Line heights (generous para leitura fácil) */
.leading-relaxed: 1.625
.leading-loose: 2
```

---

## 🔒 Segurança

### Checklist

```markdown
- [ ] HTTPS obrigatório (Vercel automático)
- [ ] Row Level Security no Supabase
- [ ] Validação de input (Zod em todas as tools)
- [ ] Rate limiting (Vercel Edge Config)
- [ ] CORS configurado corretamente
- [ ] Secrets em environment variables (NUNCA no código)
- [ ] JWT tokens com expiração curta (7 dias)
- [ ] Sanitização de output (prevenir XSS)
- [ ] Audit logs de ações críticas
- [ ] GDPR compliance (delete account feature)
```

### Rate Limiting

```typescript
// src/lib/utils/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true
});

export async function checkRateLimit(userId: string) {
  const { success, remaining } = await ratelimit.limit(userId);
  
  if (!success) {
    throw new Error('Rate limit exceeded. Try again in a few seconds.');
  }
  
  return remaining;
}
```

---

## 📱 Compatibilidade

### Browsers Suportados
- ✅ Chrome 120+ (desktop + mobile)
- ✅ Safari 17+ (desktop + iOS)
- ✅ Firefox 120+
- ✅ Edge 120+

### Dispositivos
- ✅ Desktop (1920x1080+)
- ✅ Laptop (1366x768+)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667+)

### ChatGPT Platforms
- ✅ ChatGPT Web
- ✅ ChatGPT iOS app
- ✅ ChatGPT Android app

---

## 🔄 Versionamento

### Semantic Versioning

```
MAJOR.MINOR.PATCH

1.0.0 - MVP Launch
1.1.0 - Adicionar analyzeContext
1.2.0 - Sistema de alternância
2.0.0 - Breaking change (reescrever componentes)
```

### Git Strategy

```
main (production)
  ↑
develop (staging)
  ↑
feature/create-hyperfocus-tool
feature/focus-timer-component
bugfix/task-checkbox-not-working
```

---

## 🎯 Performance Targets

| Métrica | Target | Crítico |
|---------|--------|---------|
| API Response Time (p95) | <500ms | <1s |
| Component Load Time | <2s | <3s |
| Lighthouse Score | >90 | >80 |
| Bundle Size | <100KB | <150KB |
| Time to Interactive | <2s | <3s |
| First Contentful Paint | <1s | <1.5s |

---

## 🛡️ Backup & Disaster Recovery

### Supabase Backups
- Automático: Daily backups (retained 7 days)
- Manual: Antes de migrations importantes
- Export: Script mensal para JSON backup

### Vercel Deployments
- Rollback: Instant para deployment anterior
- Preview: Cada PR tem URL única
- Production: Protected branch (main)

---

## 📚 Recursos de Aprendizado

### Must Read
1. [MCP Specification](https://modelcontextprotocol.io/specification)
2. [ChatGPT Apps Developer Guidelines](./app-developer-guidelines.html)
3. [Next.js App Router Docs](https://nextjs.org/docs/app)
4. [Supabase Auth Guide](https://supabase.com/docs/guides/auth)

### Recomendados
- [Building Apps for ChatGPT](https://developers.openai.com/apps-sdk)
- [React Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Tailwind CSS Best Practices](https://tailwindcss.com/docs/reusing-styles)

---

**Stack escolhida com critérios:**
- ✅ Baixo custo inicial ($0-15)
- ✅ Escalável (Supabase + Vercel handle 1M+ requests)
- ✅ Developer Experience excelente
- ✅ TypeScript end-to-end
- ✅ Comunidade ativa (fácil achar ajuda)

**Pronto para começar!** 🚀

