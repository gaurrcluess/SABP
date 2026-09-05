"""
Planner: orchestrates loading data (CSV by default), running the Block
Maker over every request, and producing the final BlockPlanResponse
plus a CSV export. This is the only module that touches the filesystem.
"""

from __future__ import annotations

import csv
from pathlib import Path
from typing import List, Optional

from app.models.schemas import (
    Block,
    BlockPlanResponse,
    MaintenanceRequest,
    PlanningCalendar,
)
from app.services.block_maker import process_requests

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
OUTPUT_DIR = BASE_DIR / "output"

REQUESTS_CSV = DATA_DIR / "maintenance_requests.csv"
BLOCKS_CSV = DATA_DIR / "current_blocks.csv"
CALENDAR_CSV = DATA_DIR / "planning_calendar.csv"
OUTPUT_CSV = OUTPUT_DIR / "weekly_block_plan.csv"


def load_maintenance_requests(path: Path = REQUESTS_CSV) -> List[MaintenanceRequest]:
    with open(path, newline="", encoding="utf-8") as f:
        return [MaintenanceRequest(**row) for row in csv.DictReader(f)]


def load_current_blocks(path: Path = BLOCKS_CSV) -> List[Block]:
    with open(path, newline="", encoding="utf-8") as f:
        return [Block(**row) for row in csv.DictReader(f)]


def load_planning_calendar(path: Path = CALENDAR_CSV) -> PlanningCalendar:
    with open(path, newline="", encoding="utf-8") as f:
        row = next(csv.DictReader(f))
        return PlanningCalendar(**row)


def write_block_plan_csv(blocks: List[Block], path: Path = OUTPUT_CSV) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "block_id",
        "section_id",
        "track_id",
        "block_start",
        "block_end",
        "allocated_duration_hrs",
        "used_duration_hrs",
        "assigned_resources",
        "merged_request_ids",
        "is_new",
    ]
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for b in blocks:
            writer.writerow(
                {
                    "block_id": b.block_id,
                    "section_id": b.section_id,
                    "track_id": b.track_id,
                    "block_start": b.block_start.isoformat(),
                    "block_end": b.block_end.isoformat(),
                    "allocated_duration_hrs": b.allocated_duration_hrs,
                    "used_duration_hrs": b.used_duration_hrs,
                    "assigned_resources": ";".join(b.assigned_resources),
                    "merged_request_ids": ";".join(b.merged_request_ids),
                    "is_new": b.is_new,
                }
            )


def generate_block_plan(
    maintenance_requests: Optional[List[MaintenanceRequest]] = None,
    current_blocks: Optional[List[Block]] = None,
    planning_calendar: Optional[PlanningCalendar] = None,
    write_output: bool = True,
) -> BlockPlanResponse:
    """
    Full pipeline: load (or accept) inputs, run Block Maker, optionally
    write the CSV export, and return the structured response.
    """
    requests = maintenance_requests if maintenance_requests is not None else load_maintenance_requests()
    blocks = current_blocks if current_blocks is not None else load_current_blocks()
    calendar = planning_calendar if planning_calendar is not None else load_planning_calendar()

    result_blocks, unplaced = process_requests(requests, blocks, calendar)

    if write_output:
        write_block_plan_csv(result_blocks)

    return BlockPlanResponse(
        period_id=calendar.period_id,
        period_type=calendar.period_type,
        generated_blocks=result_blocks,
        unplaced_requests=unplaced,
        total_requests_processed=len(requests),
        total_blocks_output=len(result_blocks),
    )
