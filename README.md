# Store Manager Sim (Demo)

A single-player retail store management business simulation built with **FreshWay Markets** — a fictional retailer. Run your store for 4 rounds, making decisions across commercial strategy, staffing, operations, and investment.

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS v4
- **Backend:** Node.js + TypeScript + Express
- **Database:** PostgreSQL + Prisma ORM
- **Charts:** Recharts
- **Validation:** Zod
- **Logging:** pino

## Project Structure

```
store-manager-sim/
├── client/          # React frontend (Vite)
├── server/          # Express API + Prisma
├── shared/          # Shared Zod schemas & TypeScript types
├── package.json     # Root workspace config
└── README.md
```

## Local Setup

### Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a connection string to a remote instance)

### 1. Clone & install

```bash
npm install
```

### 2. Configure environment

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your PostgreSQL connection string

# Client (optional for local dev — proxy handles it)
cp client/.env.example client/.env
```

**Server `.env`:**
```
DATABASE_URL="postgresql://user:password@localhost:5432/store_manager_sim?schema=public"
PORT=3001
CORS_ORIGINS="http://localhost:5173"
```

### 3. Set up the database

```bash
# Run migrations
npm run db:migrate

# Seed decision templates and event templates
npm run db:seed
```

### 4. Start development

```bash
# Start both server and client concurrently
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start server + client concurrently |
| `npm run dev:server` | Start server only |
| `npm run dev:client` | Start client only |
| `npm run build` | Build server + client for production |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed decision & event templates |
| `npm run db:setup` | Migrate + seed in one step |

## Deployment

### Frontend → Vercel

1. Connect the repo to Vercel
2. Set root directory to `client`
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variable: `VITE_API_URL=https://your-api.onrender.com`

### Backend → Render

1. Create a new Web Service on Render
2. Set root directory to `server`
3. Set build command: `npm install && npx prisma generate && npx tsc`
4. Set start command: `node dist/index.js`
5. Add environment variables:
   - `DATABASE_URL` — your Postgres connection string
   - `PORT` — `3001` (or let Render assign)
   - `CORS_ORIGINS` — your Vercel frontend URL

### Database → Render Postgres or Supabase

Create a PostgreSQL database and use the connection string in `DATABASE_URL`.

## Game Flow

1. **Landing** → Start Demo Run
2. **Create Run** → Name your store, choose size and region
3. **4 Rounds**, each with:
   - Dashboard (metrics + charts + narrative)
   - Decisions (4 categories, 4 options each)
   - Results (metric deltas + event + explanation)
4. **End Summary** → Balanced scorecard, grade, strengths, risks, recommendations
5. **Download** JSON report of the full run

## Metrics

| Category | Metrics |
|---|---|
| Financial | Revenue, Gross Margin %, Labour Cost %, Waste %, Shrink %, Net Profit |
| Customer | Satisfaction, Complaints, Loyalty Index |
| People | Engagement, Absence Rate %, Attrition Risk |
| Operations | Availability %, Queue Time, Compliance Score |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/runs` | Create a new simulation run |
| GET | `/runs/:id` | Get run metadata |
| GET | `/runs/:id/round/:n` | Get round state + decision templates |
| POST | `/runs/:id/round/:n/decisions` | Submit decisions, resolve round |
| GET | `/runs/:id/report` | Get full JSON report |
| GET | `/health` | Health check |
