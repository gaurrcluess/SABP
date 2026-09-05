from datetime import datetime, timedelta

import pytest

from app.models.schemas import Block, MaintenanceRequest, PlanningCalendar
from app.services.block_maker import (
    create_new_block,
    find_matching_block,
    merge_request_into_block,
    process_requests,
)
from app.services.compatibility import (
    check_duration_availability,
    check_resource_conflict,
    check_time_window_compatibility,
    check_track_compatibility,
    is_feasible,
)


def make_request(**overrides) -> MaintenanceRequest:
    defaults = dict(
        request_id="REQ-TEST",
        section_id="SEC-A",
        track_id="TRK-1",
        asset_type="rail",
        earliest_start=datetime(2026, 9, 7, 8, 0),
        latest_end=datetime(2026, 9, 7, 14, 0),
        estimated_duration_hrs=2,
        required_resources=[],
    )
    defaults.update(overrides)
    return MaintenanceRequest(**defaults)


def make_block(**overrides) -> Block:
    defaults = dict(
        block_id="BLK-TEST",
        section_id="SEC-A",
        track_id="TRK-1",
        block_start=datetime(2026, 9, 7, 8, 0),
        block_end=datetime(2026, 9, 7, 13, 0),
        allocated_duration_hrs=5,
        used_duration_hrs=0,
        assigned_resources=[],
    )
    defaults.update(overrides)
    return Block(**defaults)


def make_calendar(**overrides) -> PlanningCalendar:
    defaults = dict(
        period_id="WEEK-TEST",
        period_type="weekly",
        start_date=datetime(2026, 9, 7, 0, 0),
        end_date=datetime(2026, 9, 13, 23, 59, 59),
    )
    defaults.update(overrides)
    return PlanningCalendar(**defaults)


# ---- constraint checks ----

def test_track_compatibility_matches():
    assert check_track_compatibility(make_request(), make_block()) is True


def test_track_compatibility_fails_on_different_track():
    block = make_block(track_id="TRK-9")
    assert check_track_compatibility(make_request(), block) is False


def test_time_window_compatibility_true_when_block_within_request_window():
    assert check_time_window_compatibility(make_request(), make_block()) is True


def test_time_window_compatibility_false_when_block_starts_too_early():
    block = make_block(block_start=datetime(2026, 9, 7, 6, 0))
    assert check_time_window_compatibility(make_request(), block) is False


def test_duration_availability_true_when_enough_capacity():
    assert check_duration_availability(make_request(estimated_duration_hrs=2), make_block()) is True


def test_duration_availability_false_when_insufficient_capacity():
    block = make_block(allocated_duration_hrs=5, used_duration_hrs=4)
    request = make_request(estimated_duration_hrs=2)
    assert check_duration_availability(request, block) is False


def test_resource_conflict_true_for_non_exclusive_resources():
    request = make_request(required_resources=["hand_tools"])
    block = make_block(assigned_resources=["hand_tools"])
    assert check_resource_conflict(request, block) is True


def test_resource_conflict_false_for_exclusive_resource_clash():
    request = make_request(required_resources=["crane"])
    block = make_block(assigned_resources=["crane"])
    assert check_resource_conflict(request, block) is False


def test_is_feasible_requires_all_checks():
    assert is_feasible(make_request(), make_block()) is True


# ---- matching / merging ----

def test_find_matching_block_returns_feasible_block():
    block = make_block()
    match = find_matching_block(make_request(), [block])
    assert match is not None
    assert match.block_id == block.block_id


def test_find_matching_block_returns_none_when_nothing_fits():
    block = make_block(track_id="TRK-9")
    assert find_matching_block(make_request(), [block]) is None


def test_merge_request_into_block_updates_usage_and_resources():
    block = make_block()
    request = make_request(estimated_duration_hrs=2, required_resources=["hand_tools"])
    merged = merge_request_into_block(request, block)
    assert merged.used_duration_hrs == 2
    assert "hand_tools" in merged.assigned_resources
    assert request.request_id in merged.merged_request_ids


def test_create_new_block_clamps_to_request_and_calendar_window():
    calendar = make_calendar()
    request = make_request(
        earliest_start=datetime(2026, 9, 7, 8, 0),
        latest_end=datetime(2026, 9, 7, 14, 0),
    )
    new_block = create_new_block(request, calendar, existing_block_ids=set())
    assert new_block.is_new is True
    assert new_block.block_start == request.earliest_start
    assert new_block.block_end == request.latest_end
    assert new_block.used_duration_hrs == request.estimated_duration_hrs
    assert request.request_id in new_block.merged_request_ids


# ---- full pipeline ----

def test_process_requests_merges_when_possible_and_creates_when_not():
    calendar = make_calendar()
    block = make_block(allocated_duration_hrs=5, used_duration_hrs=0)

    fits = make_request(request_id="REQ-FIT", estimated_duration_hrs=2)
    does_not_fit = make_request(
        request_id="REQ-NEW", section_id="SEC-Z", track_id="TRK-99", estimated_duration_hrs=1
    )

    blocks, unplaced = process_requests([fits, does_not_fit], [block], calendar)

    assert unplaced == []
    assert len(blocks) == 2  # original merged block + one new block
    original = next(b for b in blocks if b.block_id == block.block_id)
    assert "REQ-FIT" in original.merged_request_ids
    new_blocks = [b for b in blocks if b.is_new]
    assert len(new_blocks) == 1
    assert "REQ-NEW" in new_blocks[0].merged_request_ids


def test_process_requests_respects_exclusive_resource_conflict_by_creating_new_block():
    calendar = make_calendar()
    block = make_block(allocated_duration_hrs=10, used_duration_hrs=0)

    first = make_request(request_id="REQ-A", required_resources=["crane"], estimated_duration_hrs=2)
    second = make_request(request_id="REQ-B", required_resources=["crane"], estimated_duration_hrs=2)

    blocks, unplaced = process_requests([first, second], [block], calendar)

    assert unplaced == []
    assert len(blocks) == 2
    assert blocks[1].is_new is True
