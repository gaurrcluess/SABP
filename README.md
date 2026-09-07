# RailSync

AI Block Planning System — frontend dashboard for railway maintenance
requests and AI-optimized block plans. Built for a hackathon (SIH-style
brief): **React + Vite + Tailwind CSS + shadcn/ui**.

The frontend never calculates priorities or schedules. It sends requests
to a FastAPI backend and renders whatever comes back.

```
User → Frontend → HTTP/JSON → FastAPI → AI + Optimization Engine → JSON → Frontend
```

## Theme — "Tuscan Sunset"

| Token | Hex | Used for |
|---|---|---|
| Terracotta | `#E35336` | primary actions, active states |
| Peach | `#FFD3AC` | accents, highlight panels |
| Mauve | `#9988A1` | secondary / "recommended" status |
| Deep rust | `#8A2B0E` | destructive / critical / conflict |

Two supporting hues (a sunset gold and a muted olive) were mixed from the
same palette for medium-priority and completed-state signals — see the
CSS variables in `src/index.css`.

KPI numbers are styled as railway split-flap display panels
(`StatCard`, `flap-digit`) — a nod to the subject matter instead of a
generic card-with-shadow.

## Getting started

```bash
npm install
cp .env.example .env      # set VITE_API_BASE_URL to your FastAPI server
npm run dev
```

The app runs on `http://localhost:5500` by default and expects a backend
at `VITE_API_BASE_URL` (default `http://localhost:8000/api`). FastAPI
must allow this origin via CORS.

## Project structure

```
src/
├── lib/
│   ├── api.js          # every fetch() call lives here — one place to change the base URL
│   └── utils.js         # cn(), date/time formatters
├── hooks/
│   └── useApi.js         # useApiQuery / useApiMutation — loading / success / error states
├── components/
│   ├── ui/                # shadcn-style primitives (button, card, select, table, dialog…)
│   ├── layout/             # Sidebar, Topbar, AppLayout
│   └── shared/              # StateWrapper, StatCard, status badges
└── pages/
    ├── Dashboard.jsx
    ├── MaintenanceRequests.jsx
    ├── RegisterRequest.jsx
    ├── BlockPlanner.jsx
    ├── WeeklyPlan.jsx
    ├── MonthlyPlan.jsx
    ├── RailwayMap.jsx
    └── BlockDetails.jsx
```

## API contract expected from the backend

```
POST   /api/maintenance-requests
GET    /api/maintenance-requests
GET    /api/maintenance-requests/{task_id}
POST   /api/optimization/generate
GET    /api/plans/{plan_id}
GET    /api/plans/weekly
GET    /api/plans/monthly
GET    /api/blocks
GET    /api/blocks/{block_id}
GET    /api/map/corridors
GET    /api/dashboard/metrics
```

Every one of these has a matching function in `src/lib/api.js`. No page
calls `fetch()` directly and no page hardcodes demo data — if an endpoint
isn't ready yet, the page will show its error or empty state rather than
fake numbers.

## Notes for the backend developer

- Field names in `createMaintenanceRequest`, `generateOptimization`, and
  the block/plan shapes follow the guide's example JSON exactly
  (`task_id`, `priority_score`, `block_id`, `optimization_reasons`, etc).
  If a field name differs on your side, update it once in `src/lib/api.js`
  or wherever the response is read in the corresponding page.
- Every screen already renders loading, error, and empty states — a 400,
  404, 409 or 500 response is shown to the user with your `message` /
  `detail` field if present.
