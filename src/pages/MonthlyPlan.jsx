import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StateWrapper } from "@/components/shared/StateWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/useApi";
import { getMonthlyPlan } from "@/lib/api";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function MonthlyPlan() {
  const { openMobileNav } = useOutletContext();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });
  const [selectedWeek, setSelectedWeek] = useState(null);

  const { status, data, error, refetch } = useApiQuery(
    () => getMonthlyPlan({ month: cursor.month, year: cursor.year }),
    [cursor.month, cursor.year]
  );

  const weeks = data?.weeks || [];
  const maxTasks = Math.max(1, ...weeks.map((w) => w.tasks_count ?? w.tasks ?? 0));

  function shiftMonth(delta) {
    setSelectedWeek(null);
    setCursor((prev) => {
      let month = prev.month + delta;
      let year = prev.year;
      if (month > 12) { month = 1; year += 1; }
      if (month < 1) { month = 12; year -= 1; }
      return { month, year };
    });
  }

  return (
    <>
      <Topbar
        title="Monthly Plan"
        description="A visualization of the week-by-week block plan already produced by the backend."
        onMenuClick={openMobileNav}
        actions={
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[9rem] px-2 text-center text-sm font-medium uppercase tracking-wide">
              {MONTH_NAMES[cursor.month - 1]} {cursor.year}
            </span>
            <Button variant="outline" size="icon" onClick={() => shiftMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <main className="flex-1 space-y-6 px-4 py-6 sm:px-6">
        <StateWrapper
          status={status}
          error={error}
          data={weeks}
          onRetry={refetch}
          loadingLabel="Loading monthly plan…"
          isEmpty={(d) => !d || d.length === 0}
          emptyTitle="No monthly plan available"
          emptyDescription="Weekly plans need to exist for this month before a monthly view can be shown."
          loadingFallback={
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          }
        >
          <Card>
            <CardContent className="space-y-4 pt-6">
              {weeks.map((week, i) => {
                const taskCount = week.tasks_count ?? week.tasks ?? 0;
                const isSelected = selectedWeek === i;
                return (
                  <button
                    key={week.week_label || i}
                    onClick={() => setSelectedWeek(isSelected ? null : i)}
                    className={`block w-full rounded-md border px-4 py-3 text-left transition-colors ${
                      isSelected ? "border-primary bg-accent/20" : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{week.week_label || `Week ${i + 1}`}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {taskCount} tasks
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max(6, (taskCount / maxTasks) * 100)}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {selectedWeek != null && weeks[selectedWeek] && (
            <Card className="border-primary/30 bg-accent/10">
              <CardContent className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-4">
                <WeekStat
                  label="Maintenance tasks"
                  value={weeks[selectedWeek].tasks_count ?? weeks[selectedWeek].tasks}
                />
                <WeekStat label="Blocks" value={weeks[selectedWeek].blocks_count ?? weeks[selectedWeek].blocks} />
                <WeekStat
                  label="High priority tasks"
                  value={weeks[selectedWeek].high_priority_tasks}
                />
                <WeekStat
                  label="Estimated block hours"
                  value={weeks[selectedWeek].estimated_block_hours}
                />
              </CardContent>
            </Card>
          )}
        </StateWrapper>
      </main>
    </>
  );
}

function WeekStat({ label, value }) {
  return (
    <div>
      <p className="flap-digit text-2xl font-semibold text-foreground">{value ?? "—"}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
