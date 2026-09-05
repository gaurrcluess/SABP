"""
Pydantic schemas for the Block Maker service.

These define the exact I/O contract for this module. The downstream
optimization/criticality module (owned by a different team/service)
should consume `Block` / `BlockPlanResponse` as-is.

NOTE: No criticality, score, priority, or optimization fields exist
anywhere in this file by design. That is out of scope for Block Maker.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class MaintenanceRequest(BaseModel):
    """A single incoming maintenance request to be placed into a block."""

    request_id: str
    section_id: str
    track_id: str
    asset_type: str
    earliest_start: datetime
    latest_end: datetime
    estimated_duration_hrs: float = Field(gt=0)
    required_resources: List[str] = Field(default_factory=list)

    @field_validator("required_resources", mode="before")
    @classmethod
    def _split_csv_resources(cls, v):
        # Allows CSV loading where resources arrive as "crane;possession_team"
        if isinstance(v, str):
            return [r.strip() for r in v.split(";") if r.strip()]
        return v

    @field_validator("latest_end")
    @classmethod
    def _end_after_start(cls, v, info):
        start = info.data.get("earliest_start")
        if start and v <= start:
            raise ValueError("latest_end must be after earliest_start")
        return v


class Block(BaseModel):
    """A maintenance block — either pre-existing or newly created by Block Maker."""

    block_id: str
    section_id: str
    track_id: str
    block_start: datetime
    block_end: datetime
    allocated_duration_hrs: float = Field(gt=0)
    used_duration_hrs: float = Field(default=0, ge=0)
    assigned_resources: List[str] = Field(default_factory=list)
    merged_request_ids: List[str] = Field(default_factory=list)
    is_new: bool = False

    @field_validator("assigned_resources", mode="before")
    @classmethod
    def _split_csv_resources(cls, v):
        if isinstance(v, str):
            return [r.strip() for r in v.split(";") if r.strip()]
        return v

    @property
    def remaining_duration_hrs(self) -> float:
        return round(self.allocated_duration_hrs - self.used_duration_hrs, 4)


class PlanningCalendar(BaseModel):
    """The planning window Block Maker is generating a plan for."""

    period_id: str
    period_type: str  # "weekly" or "monthly"
    start_date: datetime
    end_date: datetime

    @field_validator("period_type")
    @classmethod
    def _valid_period_type(cls, v):
        if v not in ("weekly", "monthly"):
            raise ValueError("period_type must be 'weekly' or 'monthly'")
        return v

    @field_validator("end_date")
    @classmethod
    def _end_after_start(cls, v, info):
        start = info.data.get("start_date")
        if start and v <= start:
            raise ValueError("end_date must be after start_date")
        return v


class UnplacedRequest(BaseModel):
    """A request that could not be merged or newly blocked (should be rare)."""

    request_id: str
    reason: str


class BlockPlanRequest(BaseModel):
    """Optional request body to override the default mock CSV data."""

    maintenance_requests: Optional[List[MaintenanceRequest]] = None
    current_blocks: Optional[List[Block]] = None
    planning_calendar: Optional[PlanningCalendar] = None


class BlockPlanResponse(BaseModel):
    """Final output of the Block Maker for a planning period."""

    period_id: str
    period_type: str
    generated_blocks: List[Block]
    unplaced_requests: List[UnplacedRequest] = Field(default_factory=list)
    total_requests_processed: int
    total_blocks_output: int
