import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StateWrapper } from "@/components/shared/StateWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { BlockStatusBadge } from "@/components/shared/StatusBadges";
import { useApiQuery } from "@/hooks/useApi";
import { getWeeklyPlan } from "@/lib/api";
import { formatTime, formatDate } from "@/lib/utils";

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  return new Date(d.setDate(diff));
}

export default function WeeklyPlan() {
  const { openMobileNav } = useOutletContext();
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  const startDateStr = weekStart.toISOString().slice(0, 10);

  const { status, data, error, refetch } = useApiQuery(
    () => getWeeklyPlan({ start_date: startDateStr }),
    [startDateStr]
  );

  // Group whatever shape the backend returns into a Mon–Sun structure.
  const days = useMemo(() => {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const buckets = labels.map((label, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return { label, date, blocks: [] };
    });

    const flatBlocks = Array.isArray(data)
      ? data
      : data?.days
      ? data.days.flatMap((d) => d.blocks || [])
      : data?.blocks || [];

    flatBlocks.forEach((block) => {
      const ts = block.start_time ? new Date(block.start_time) : null;
      if (!ts || Number.isNaN(ts.getTime())) return;
      const dayIndex = (ts.getDay() + 6) % 7; // Monday = 0
      buckets[dayIndex]?.blocks.push(block);
    });

    buckets.forEach((b) => b.blocks.sort((a, c) => (a.start_time > c.start_time ? 1 : -1)));
    return buckets;
  }, [data, weekStart]);

  const hasAnyBlocks = days.some((d) => d.blocks.length > 0);

  function shiftWeek(delta) {
    const next = new Date(weekStart);
    next.setDate(weekStart.getDate() + delta * 7);
    setWeekStart(next);
  }

  return (
    <>
      <Topbar
        title="Weekly Plan"
        description="Blocks generated for this week, grouped by day."
        onMenuClick={openMobileNav}
        actions={
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => shiftWeek(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm font-medium">
              {formatDate(days[0]?.date)} – {formatDate(days[6]?.date)}
            </span>
            <Button variant="outline" size="icon" onClick={() => shiftWeek(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <main className="flex-1 px-4 py-6 sm:px-6">
        <StateWrapper
          status={status}
          error={error}
          data={data}
          onRetry={refetch}
          loadingLabel="Loading weekly plan…"
          isEmpty={() => status === "success" && !hasAnyBlocks}
          emptyTitle="No blocks scheduled this week"
          emptyDescription="Generate an optimized plan from the Block Planner to populate this week."
          loadingFallback={
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {days.map((day) => (
              <Card key={day.label} className="flex flex-col">
                <div className="border-b border-border px-3 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {day.label}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground/70">
                    {formatDate(day.date, { month: "short", day: "2-digit" })}
                  </p>
                </div>
                <CardContent className="flex-1 space-y-2 p-2.5">
                  {day.blocks.length === 0 ? (
                    <p className="px-1 py-3 text-center text-xs text-muted-foreground/60">
                      No blocks
                    </p>
                  ) : (
                    day.blocks.map((block) => (
                      <button
                        key={block.block_id}
                        onClick={() => navigate(`/blocks/${block.block_id}`)}
                        className="w-full rounded-md border border-border bg-accent/20 px-2.5 py-2 text-left text-xs transition-colors hover:border-primary hover:bg-accent/40"
                      >
                        <p className="flap-digit font-semibold text-foreground">
                          {formatTime(block.start_time)}–{formatTime(block.end_time)}
                        </p>
                        <p className="mt-0.5 font-mono text-muted-foreground">
                          {block.block_id}
                        </p>
                        <div className="mt-1.5">
                          <BlockStatusBadge value={block.status} />
                        </div>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </StateWrapper>
      </main>
    </>
  );
}
