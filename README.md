# TrackEd

Track your study. Own your progress.

A complete, production-ready study tracking web application.

## Features
- **Pomodoro Timer**: Configurable focus and break durations, ambient sounds.
- **Study Analytics**: Heatmap calendar, bar charts, line charts to track hours and performance.
- **Study Groups**: Private and public groups with real-time chat and relative leaderboards.
- **Global Leaderboards**: See how you stack up against other users weekly.
- **Gamification**: XP points, leveling system, streaks, and unlockable badges.
- **Progress Tracking**: Subject-specific hour goals and exam countdowns.

## Tech Stack
- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Supabase (Auth, Postgres, Realtime Sync)
- Framer Motion
- Recharts
- React Router DOM

## Running Locally

1. Setup environment variables by copying `.env.example` to `.env.local`
2. Add your Supabase URL and Anon Key.
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Install dependencies
```bash
npm install
```

4. Run the development server
```bash
npm run dev
```

## Supabase Tables Needed
To successfully run this app, these tables need to exist in your Supabase project:
- `users`
- `sessions`
- `groups`
- `messages`

*(See schema inside the prompt for correct column types and relations)*
