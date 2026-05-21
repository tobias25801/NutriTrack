# NutriTrack 🔥

A modern, full-stack nutrition tracking application — completely free, no paywalls, no ads.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, TailwindCSS, Framer Motion |
| Mobile | React Native + Expo |
| Backend | Node.js + Fastify |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Auth | JWT + Google OAuth |
| Charts | Recharts |
| AI | OpenAI GPT-4o |
| Storage | Supabase Storage |
| State | Zustand + TanStack Query |

## Project Structure

```
nutritrack/
├── apps/
│   ├── api/          # Fastify backend
│   ├── web/          # Next.js 15 web app
│   └── mobile/       # React Native Expo
├── packages/
│   └── shared/       # Shared TypeScript types
├── docker-compose.yml
└── turbo.json
```

## Features

- **Dashboard** — Calorie ring, macro progress bars, water tracker, streak, level/XP
- **Food Log** — Log meals by type (breakfast/lunch/dinner/snack) with search
- **Food Database** — 25+ seeded foods, barcode lookup via Open Food Facts, custom foods
- **Barcode Scanner** — Mobile camera scan → instant nutrition lookup
- **AI Meal Analyzer** — Photo → GPT-4o Vision → calories + macros + health score
- **AI Meal Plans** — Personalized 3-14 day plans based on goals (bulk/cut/maintain)
- **AI Coach Chat** — GPT-4o mini chatbot for nutrition advice
- **Weight Tracking** — Log weight, BMI calc, trend charts (Recharts)
- **Analytics** — Calorie charts, macro pie chart, weekly summaries
- **Gamification** — XP system, level-up, streak tracking, achievements, daily challenges
- **Social** — Friend requests, leaderboard
- **Settings** — Profile, nutrition goals, auto-calculate TDEE

## Quick Start (Development)

### Prerequisites
- Node.js 20+
- Docker (for local PostgreSQL)
- pnpm or npm

### 1. Clone & Install
```bash
git clone https://github.com/your-org/nutritrack.git
cd nutritrack
npm install
```

### 2. Start Database
```bash
docker-compose up postgres -d
```

### 3. Configure Environment
```bash
# Copy env files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Edit apps/api/.env with your values
DATABASE_URL="postgresql://nutritrack:nutritrack_password@localhost:5432/nutritrack"
JWT_SECRET="your-secret-here"
OPENAI_API_KEY="sk-..."  # Optional - enables AI features
```

### 4. Setup Database
```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Start Development Servers
```bash
# From root - starts all apps
npm run dev

# Or individually:
cd apps/api && npm run dev      # http://localhost:3001
cd apps/web && npm run dev      # http://localhost:3000
cd apps/mobile && npm start     # Expo DevTools
```

### Demo Account
After seeding: `demo@nutritrack.app` / `demo123456`

## API Routes

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Sign in |
| POST | /api/auth/google-login | Google OAuth |
| POST | /api/auth/refresh | Refresh access token |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/me | Update profile |

### Foods
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/foods?q=... | Search foods |
| POST | /api/foods | Create custom food |
| GET | /api/foods/:id | Get food by ID |
| GET | /api/foods/barcode/:barcode | Barcode lookup |
| GET | /api/foods/recent/list | Recently used foods |
| GET | /api/foods/favorites/list | Favorite foods |
| POST | /api/foods/:id/favorite | Toggle favorite |

### Meals
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/meals?date=YYYY-MM-DD | Get meals for date |
| POST | /api/meals | Log a meal |
| PUT | /api/meals/:id | Update meal entry |
| DELETE | /api/meals/:id | Delete meal entry |
| GET | /api/meals/nutrition/summary | Nutrition analytics |

### Weight
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/weight | Get weight history |
| POST | /api/weight | Log weight |
| GET | /api/weight/bmi | Get BMI |

### Water
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/water/today | Today's water |
| POST | /api/water | Log water |
| GET | /api/water/history | 7-day history |

### AI
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/ai/analyze-meal | Analyze meal photo |
| POST | /api/ai/generate-plan | Generate meal plan |
| POST | /api/ai/chat | AI coach chat |
| GET | /api/ai/tip | Daily AI tip |

### Achievements
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/achievements | All achievements |
| GET | /api/achievements/progress | XP/level info |
| GET | /api/achievements/challenges | Daily challenges |
| GET | /api/achievements/leaderboard | Streak leaderboard |

## Database Models

See `apps/api/prisma/schema.prisma` for full schema.

Key models: `User`, `Food`, `MealEntry`, `WeightEntry`, `WaterEntry`, `Achievement`, `UserAchievement`, `MealPlan`, `FastingRecord`, `Friendship`, `AIAnalysis`

## Deployment

### Backend (Railway)
```bash
# Push to GitHub, then:
railway login
railway link
railway up
```
Set env vars in Railway dashboard.

### Frontend (Vercel)
```bash
vercel --prod
# Set NEXT_PUBLIC_API_URL to your Railway URL
```

### Mobile (Expo)
```bash
cd apps/mobile
npx expo build:ios     # iOS
npx expo build:android # Android
# Or use EAS Build for production
npx eas build --platform all
```

### Docker (Full Stack)
```bash
docker-compose up --build
```

## Environment Variables

### Backend (`apps/api/.env`)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=sk-...          # Required for AI features
GOOGLE_CLIENT_ID=...           # Required for Google login
GOOGLE_CLIENT_SECRET=...
PORT=3001
NODE_ENV=development
```

### Frontend (`apps/web/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Mobile (`apps/mobile/.env`)
```env
EXPO_PUBLIC_API_URL=http://localhost:3001/api
```

## Security Features
- JWT access tokens (15min TTL) + refresh tokens (30 days)
- bcrypt password hashing (12 rounds)
- Rate limiting (200 req/min global)
- CORS whitelist
- Input validation with Zod
- SQL injection prevention via Prisma ORM

## Performance Optimizations
- TanStack Query with 60s stale time + optimistic updates
- Debounced search (300ms)
- Infinite scroll ready
- Next.js image optimization
- Lazy loading components
- API response caching

## License
MIT — Free forever
# NutriTrack
