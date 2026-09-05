"""
Pure time/duration helper functions used by constraint checks.
No business rules live here beyond generic interval math.
"""

from __future__ import annotations

from datetime import datetime


def windows_overlap(
    start_a: datetime, end_a: datetime, start_b: datetime, end_b: datetime
) -> bool:
    """True if [start_a, end_a] and [start_b, end_b] overlap at all."""
    return start_a < end_b and start_b < end_a


def request_fits_within_block_window(
    request_earliest_start: datetime,
    request_latest_end: datetime,
    block_start: datetime,
    block_end: datetime,
) -> bool:
    """
    True if the block's active window is fully inside the request's
    allowable window, i.e. the block can host the request without
    violating the request's earliest-start / latest-end limits.
    """
    return request_earliest_start <= block_start and block_end <= request_latest_end


def duration_fits(remaining_duration_hrs: float, requested_duration_hrs: float) -> bool:
    """True if a block has enough spare capacity for the request."""
    return requested_duration_hrs <= remaining_duration_hrs


def hours_between(start: datetime, end: datetime) -> float:
    return round((end - start).total_seconds() / 3600, 4)
