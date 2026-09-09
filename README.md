# SABP — Smart Automated Block Planner

AI-driven Automatic Block Planning system for railway maintenance. Built for **Smart India Hackathon**, addressing decentralized, manual block/disconnection scheduling across Engineering, Traction Distribution (TRD), and Signal & Telecommunication (S&T) departments.

## Problem

Maintenance blocks are currently requested and approved independently by each department via BDMS, with defect/overdue-task data siloed in TMS, SMMS, and TDMS, and corridor availability managed separately in COA. This leads to inefficient block utilization, poor cross-department coordination, and reduced asset availability.

**SABP** integrates this data to generate optimized, coordinated block schedules — maximizing asset uptime while respecting train timetable and goods-traffic constraints.

## Repo structure

This repo is organized as **one branch per service**, each independently runnable. `main` holds only this overview.

| Branch | Role | Stack | Status |
|---|---|---|---|
| [`FRONTEND`](../../tree/FRONTEND) | **RailSync** — dashboard for maintenance requests, block plans, corridor map | React + Vite + Tailwind + shadcn/ui | Functional |
| [`BLOCK-MAKER-API`](../../tree/BLOCK-MAKER-API) | Hard-constraint block matching: merges requests into feasible existing blocks or creates new ones | FastAPI + Pydantic | Functional |
| [`OPTIMIZATION-API`](../../tree/OPTIMIZATION-API) | Priority scoring (criticality/urgency/impact) + schedule optimization (ILP/GA) over Block Maker's output | — | Planned |
| [`BACKEND`](../../tree/BACKEND) | Gateway / auth / orchestration layer tying services together for the frontend | — | Planned |
| [`VISUALISATION`](../../tree/VISUALISATION) | 3D railway corridor simulation for demo | Unity | In progress |

## How the pieces fit together

```
                        ┌───────────────────────┐
                        │   RailSync Frontend    │
                        │ (React dashboard)      │
                        └──────────┬─────────────┘
                                   │ REST/JSON
                                   ▼
                        ┌───────────────────────┐
                        │        Backend         │
                        │  (gateway / API layer) │
                        └──────────┬─────────────┘
                     ┌─────────────┼──────────────┐
                     ▼             ▼              ▼
            ┌────────────────┐ ┌────────────┐ ┌───────────────┐
            │ Block Maker API│ │Optimization│ │ Visualisation │
            │ (feasibility   │ │API (scoring│ │ (Unity 3D     │
            │  matching)     │ │ + ILP/GA)  │ │  simulation)  │
            └────────────────┘ └────────────┘ └───────────────┘
```

Block Maker handles **hard feasibility** (does this request fit any block, given track/time/resource constraints) — no priority logic. Optimization API is meant to consume Block Maker's output and re-rank/re-slot it by criticality, urgency, and impact, producing weekly and monthly plans. This separation of concerns is intentional (see `BLOCK-MAKER-API`'s README).

## Running locally

Each service lives on its own branch — checkout the one you need:

```bash
git clone https://github.com/h3kler0707/SABP.git
cd SABP

git checkout BLOCK-MAKER-API
pip install -r requirements.txt
uvicorn app.main:app --reload      # http://localhost:8000

git checkout FRONTEND
npm install
npm run dev                        # http://localhost:5500
```

Frontend expects the API at `VITE_API_BASE_URL` (default `http://localhost:8000/api`) — see `FRONTEND/README.md` for the full API contract it calls.

## Roadmap

- [ ] `OPTIMIZATION-API`: priority scoring engine (criticality × urgency × impact) + ILP (weekly) / GA (monthly) scheduler
- [ ] `BACKEND`: unify Block Maker + Optimization API behind the routes `FRONTEND` already expects
- [ ] Merge stable branches into `main` once integrated end-to-end
- [ ] Wire `VISUALISATION` to live plan output

## Team

Smart India Hackathon — Problem Statement: Automatic Block Planning for Railway Maintenance (Eng / TRD / S&T integration).
