# Development Track

A developer SaaS tool for managing projects, clients, and feedback in real-time.

**Live Demo:** https://development-track.vercel.app

## Features

- 📁 Project management with status tracking
- 👥 Client management with tag organization
- 💬 Real-time feedback system (client portal)
- 🔔 Real-time developer responses visible instantly
- 🏷️ Color-coded tag system per developer account
- 🔒 Secure multi-tenant architecture (RLS)
- 🌓 Dark / Light mode

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database & Auth:** Supabase (PostgreSQL + Row Level Security)
- **UI:** shadcn/ui + Tailwind CSS
- **Validation:** Zod
- **Deployment:** Vercel

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/development-track.git
cd development-track
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Run all SQL files in the `/database` folder in order (v1 → v7)
3. Copy your project URL and anon key

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your values in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

Deploy to Vercel in one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Remember to add your environment variables in the Vercel dashboard.

## License

MIT
