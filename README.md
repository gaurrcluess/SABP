# Block Maker

A FastAPI service responsible **only** for generating an initial railway
maintenance block plan: matching maintenance requests into existing
blocks where feasible, or creating new blocks where not.

## Explicitly out of scope

- Criticality / priority scoring of requests
- Optimization of any kind (no OR-Tools, no ML)
- Anything beyond hard-constraint feasibility matching

Those responsibilities belong to a separate downstream module that
consumes this service's `Block` / `BlockPlanResponse` output.

## What it does

1. Loads maintenance requests, existing blocks, and the planning
   calendar (weekly/monthly window) — from CSV by default, or from an
   API request body.
2. For each maintenance request, in order:
   - Checks hard constraints against every existing block: track/section
     compatibility, time-window compatibility, available duration, and
     exclusive-resource conflicts.
   - Merges the request into the **first** feasible block found.
   - If no block is feasible, creates a new block scoped to the
     request's own allowable time window (clamped to the planning period).
3. Returns the full set of blocks (updated existing + newly created) and
   writes `output/weekly_block_plan.csv`.

## Project structure

```
block-maker/
├── app/
│   ├── main.py                 # FastAPI app + /generate-block-plan endpoint
│   ├── models/
│   │   └── schemas.py          # MaintenanceRequest, Block, PlanningCalendar, responses
│   ├── services/
│   │   ├── block_maker.py      # matching / merging / new-block creation
│   │   ├── compatibility.py    # hard constraint checks
│   │   └── planner.py          # CSV I/O + orchestration
│   └── utils/
│       └── time_utils.py       # interval/duration helpers
├── data/                       # mock CSV input data
│   ├── maintenance_requests.csv
│   ├── current_blocks.csv
│   └── planning_calendar.csv
├── tests/
│   ├── test_block_maker.py     # unit tests on matching/merging/constraints
│   └── test_api.py             # endpoint tests
├── output/
│   └── weekly_block_plan.csv   # generated on each run
├── requirements.txt
└── README.md
```

## Running it

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Then either:

```bash
curl -X POST http://localhost:8000/generate-block-plan
```

which uses the mock CSVs under `data/`, or POST a JSON body matching
`BlockPlanRequest` to override `maintenance_requests`, `current_blocks`,
and/or `planning_calendar` for a given call.

## Tests

```bash
pytest
```

## Constraint model (mock, extendable)

`app/services/compatibility.py` checks, per request/block pair:

- **Track/section compatibility** — exact match required.
- **Asset compatibility** — stubbed as always-true; wire up
  `data/asset_compatibility.csv` here if/when that data exists.
- **Time-window compatibility** — the block's scheduled window must sit
  fully inside the request's `earliest_start` / `latest_end` bounds.
- **Duration availability** — block must have enough unused capacity.
- **Resource conflict** — a small mock model where a fixed set of
  `EXCLUSIVE_RESOURCES` (e.g. `crane`, `possession_team`,
  `tamping_machine`) can only serve one request "slot" per block; all
  other resources are treated as shareable.

Each check is a small, independently testable pure function.

## Known design decision worth revisiting

A newly created block is sized to exactly the duration of the request
that triggered it (`allocated_duration_hrs = request.estimated_duration_hrs`),
so it starts with **zero remaining capacity**. This means a second,
unrelated request that arrives later in the same run and would
otherwise fit that new block's time/track window won't merge into it —
it will spawn yet another new block instead. This is intentional for
now (there's no other signal to size a new block by), but if the real
system wants new blocks to absorb later same-window requests, consider
padding new-block capacity (e.g. a configurable default duration or
site-standard block length) rather than an exact-fit size.
