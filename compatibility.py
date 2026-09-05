"""
Hard constraint checks used to decide whether a MaintenanceRequest can be
merged into an existing Block.

Every function here answers a single yes/no feasibility question.
No scoring, ranking, or weighting of any kind belongs in this file —
that is optimization/criticality territory and is explicitly out of scope.
"""

from __future__ import annotations

from typing import List

from app.models.schemas import Block, MaintenanceRequest
from app.utils.time_utils import duration_fits, request_fits_within_block_window

# Resources assumed to be single-use / exclusive per time slot.
# A simple mock capacity model: each exclusive resource can only serve
# one request "slot" at a time within a block. Everything not listed here
# is assumed to be non-exclusive (shareable) for this mock implementation.
EXCLUSIVE_RESOURCES = {"crane", "possession_team", "tamping_machine"}


def check_track_compatibility(request: MaintenanceRequest, block: Block) -> bool:
    """Section and track must match exactly for a request to join a block."""
    return request.section_id == block.section_id and request.track_id == block.track_id


def check_asset_compatibility(request: MaintenanceRequest, block: Block) -> bool:
    """
    Placeholder-but-real check: in this mock setup we treat a block as
    asset-agnostic as long as track/section match. If an asset compatibility
    matrix becomes available (data/asset_compatibility.csv in a future
    iteration), this is the function to extend — signature stays the same.
    """
    return True


def check_time_window_compatibility(request: MaintenanceRequest, block: Block) -> bool:
    """The block's scheduled window must sit inside the request's allowed window."""
    return request_fits_within_block_window(
        request.earliest_start, request.latest_end, block.block_start, block.block_end
    )


def check_duration_availability(request: MaintenanceRequest, block: Block) -> bool:
    """The block must have enough unused duration left for this request."""
    return duration_fits(block.remaining_duration_hrs, request.estimated_duration_hrs)


def check_resource_conflict(request: MaintenanceRequest, block: Block) -> bool:
    """
    True if there is NO conflict (i.e. request may proceed).
    Mock capacity model: an exclusive resource already assigned to the
    block is assumed fully booked for that block's window, so a second
    request needing the same exclusive resource in the same block conflicts.
    Non-exclusive resources never conflict.
    """
    requested_exclusive = set(request.required_resources) & EXCLUSIVE_RESOURCES
    assigned_exclusive = set(block.assigned_resources) & EXCLUSIVE_RESOURCES
    conflict = bool(requested_exclusive & assigned_exclusive)
    return not conflict


def is_feasible(request: MaintenanceRequest, block: Block) -> bool:
    """
    Runs all hard constraints. A block is a valid merge target only if
    every single check passes.
    """
    checks = (
        check_track_compatibility(request, block),
        check_asset_compatibility(request, block),
        check_time_window_compatibility(request, block),
        check_duration_availability(request, block),
        check_resource_conflict(request, block),
    )
    return all(checks)


def feasible_blocks(request: MaintenanceRequest, blocks: List[Block]) -> List[Block]:
    """Returns every existing block the request could feasibly merge into."""
    return [b for b in blocks if is_feasible(request, b)]
