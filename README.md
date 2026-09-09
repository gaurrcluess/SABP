# Optimization API

FastAPI service that scores maintenance requests by priority and produces
an optimized block schedule — the piece Block Maker explicitly leaves out.

## Explicitly in scope

- Priority scoring: `P = 0.45*Criticality + 0.30*Urgency + 0.25*Impact` (0-100)
- Hard-priority override: safety-critical + past-SLA requests are force-scheduled
- Weekly scheduling via **CP-SAT (ILP)** — exact optimum at this scale
- Monthly scheduling via a **repair-based Genetic Algorithm** — ILP doesn't
  scale to a month's request volume, so this trades exactness for speed
- Feasibility constraints: track/section match, time-window containment,
  block capacity, one-exclusive-resource-per-block (`crane`,
  `possession_team`, `tamping_machine`)

## Explicitly out of scope

- Creating new blocks or merging requests into existing ones — that's
  Block Maker's job. This service consumes `Block Maker`'s `Block` output
  as-is (or mock data) and only decides **which request goes into which
  already-existing block**, and in what priority order.

## Project structure

```
optimization-api/
├── app/
│   ├── main.py                    # FastAPI app + endpoints (matches RailSync's api.js contract)
│   ├── models/
│   │   └── schemas.py             # ScoredRequest, Block, ScheduledBlock, OptimizationRequest/Response
│   └── services/
│       ├── scoring.py             # priority scoring + hard-priority rule
│       ├── feasibility.py         # request <-> block hard-constraint checks
│       ├── optimizer_ilp.py       # weekly: CP-SAT exact solve
│       ├── optimizer_ga.py        # monthly: repair-based genetic algorithm
│       ├── plan_store.py          # in-memory plan storage for GET endpoints
│       └── data_loader.py         # CSV mock data loader
├── data/                          # mock CSV input (extends Block Maker's with scoring fields)
├── tests/
│   ├── test_scoring.py
│   └── test_optimizer_ilp.py
└── requirements.txt
```

## Running it

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload      # http://localhost:8000
```

```bash
curl -X POST http://localhost:8000/api/optimization/generate
```

uses mock CSVs under `data/`. POST a body with `requests`, `blocks`, and/or
`planning_calendar` to override any of them — e.g. to feed in Block Maker's
real `generated_blocks` output instead of the mock ones.

`planning_calendar.period_type` decides the method: `"weekly"` → ILP,
`"monthly"` → GA.

## Endpoints (match RailSync frontend's `src/lib/api.js`)

```
POST /api/optimization/generate
GET  /api/plans/weekly
GET  /api/plans/monthly
GET  /api/plans/{plan_id}
GET  /api/blocks
GET  /api/blocks/{block_id}
```

## Tests

```bash
pytest
```

7 tests cover: criticality/urgency/impact scoring behavior, the
hard-priority override, ILP capacity respect, and exclusive-resource
conflict resolution (a lower-priority request loses a shared resource
to a hard-priority one even when its own score is higher — see
`test_optimizer_ilp.py`).

## Known design decisions worth revisiting

- **GA fitness has no penalty terms** — infeasibility is prevented by
  the repair step (drop lower-priority conflicting request) rather than
  penalized in the objective. Simpler and always yields a feasible
  schedule, but means the GA is really doing priority-ordered greedy
  repair with genetic search over *which* feasible block each request
  targets — not a from-scratch combinatorial search. Good enough for
  hackathon scale; a production version might reduce reliance on the
  fixed tie-break order and penalize conflicts directly instead.
- **Weekly ILP has a 10s solver time budget** (`max_time_in_seconds`) —
  fine at demo scale (single-digit blocks/requests); raise it if a real
  week's data makes CP-SAT time out before OPTIMAL/FEASIBLE.
- **`impact_trains_affected` and `overdue_days`/`sla_days` are not in
  Block Maker's schema** — they need to come from TMS/SMMS/TDMS defect
  records upstream. Right now they're just extra fields expected on the
  request payload; wiring them from real source systems is the next
  integration step, not something this service can infer.
- **Plan storage is in-memory** (`plan_store.py`) — resets on restart,
  single-process only. Swap for a real DB before this leaves demo scope.
