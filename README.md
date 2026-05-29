# Med Try List 🫒

Mediterranean restaurant tracker for Dallas & Austin.

## Stack
- Next.js 14 (App Router)
- Supabase (Postgres)
- Anthropic API (Find New Spots)
- Vercel (hosting)

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Environment variables
Copy `.env.example` to `.env.local` and fill in your keys:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Supabase — run this SQL in your SQL Editor
```sql
create table restaurant_statuses (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  status text,
  updated_at timestamptz default now()
);

create table restaurant_rankings (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  score integer,
  notes text,
  dishes text,
  date text,
  updated_at timestamptz default now()
);

create table new_spots (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  data jsonb not null,
  added_at timestamptz default now()
);

create table app_meta (
  key text primary key,
  value text
);
```

### 4. Run locally
```bash
npm run dev
```

### 5. Deploy to Vercel
Push to GitHub, import in Vercel, add the 3 env vars under Settings → Environment Variables.

## Features
- 45+ Mediterranean restaurants across Dallas & Austin
- Mark Want to Try / Tried
- Beli-style 1-10 scoring with notes
- Sort by distance (uses browser location)
- AI-powered Find New Spots button
- Syncs across all devices via Supabase
