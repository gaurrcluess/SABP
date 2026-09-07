import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  ClipboardList,
  AlertOctagon,
  CalendarCheck2,
  Boxes,
  TimerReset,
  Gauge,
  ShieldCheck,
  Wand2,
  Loader2,
} from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { StatCard } from "@/components/shared/StatCard";
import { StateWrapper } from "@/components/shared/StateWrapper";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { getDashboardMetrics, generateOptimization } from "@/lib/api";

const DIVISIONS = [
  "Northern Division",
  "Eastern Division",
  "Western Division",
  "Southern Division",
  "Central Division",
  "North Eastern Division"
];

const HORIZONS = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
];

export default function Dashboard() {
  const { openMobileNav } = useOutletContext();
  const navigate = useNavigate();
  const [division, setDivision] = useState(DIVISIONS[0]);
  const [horizon, setHorizon] = useState("this_week");

  const { status, data, error, refetch } = useApiQuery(
    () => getDashboardMetrics({ division, horizon }),
    [division, horizon]
  );

  const optimizeMutation = useApiMutation(() =>
    generateOptimization({
      planning_horizon: horizon,
      division,
      corridor_id: "ALL",
    })
  );

  async function handleGeneratePlan() {
    try {
      const result = await optimizeMutation.mutate();
      navigate("/planner", { state: { plan: result } });
    } catch {
      // error is already captured by useApiMutation; surfaced below the button
    }
  }

  const metrics = data?.metrics || data || {};

  const cards = [
    { key: "pending_requests", label: "Pending Requests", icon: ClipboardList },
    { key: "high_priority_tasks", label: "High Priority Tasks", icon: AlertOctagon, tone: "primary" },
    { key: "scheduled_tasks", label: "Scheduled Tasks", icon: CalendarCheck2 },
    { key: "active_blocks", label: "Active Blocks", icon: Boxes },
    { key: "block_hours_saved", label: "Block Hours Saved", icon: TimerReset, tone: "accent" },
    { key: "asset_availability", label: "Asset Availability", icon: Gauge, suffixKey: "%" },
    { key: "train_conflicts_avoided", label: "Train Conflicts Avoided", icon: ShieldCheck, tone: "warning" },
  ];

  return (
    <>
      <Topbar
        title="Dashboard"
        description="Corridor-wide maintenance and block planning overview."
        onMenuClick={openMobileNav}
      />

      <main className="flex-1 space-y-6 px-4 py-6 sm:px-6">
        <section className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            AI Block Planning System
          </p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Division
                </label>
                <Select value={division} onValueChange={setDivision}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIVISIONS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Planning Horizon
                </label>
                <Select value={horizon} onValueChange={setHorizon}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HORIZONS.map((h) => (
                      <SelectItem key={h.value} value={h.value}>
                        {h.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleGeneratePlan}
              disabled={optimizeMutation.status === "loading"}
              className="shrink-0"
            >
              {optimizeMutation.status === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" /> Generate Optimized Plan
                </>
              )}
            </Button>
          </div>
          {optimizeMutation.status === "error" && (
            <p className="mt-3 text-sm text-destructive">
              ⚠ Unable to generate plan. {optimizeMutation.error?.message}
            </p>
          )}
        </section>

        <StateWrapper
          status={status}
          error={error}
          data={metrics}
          onRetry={refetch}
          loadingLabel="Loading dashboard metrics…"
          isEmpty={(d) => !d || Object.keys(d).length === 0}
          emptyTitle="No metrics available"
          emptyDescription="The backend hasn't returned dashboard metrics for this division and horizon yet."
          loadingFallback={
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {cards.map((c) => (
                <StatCard key={c.key} label={c.label} loading />
              ))}
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {cards.map((c) => (
              <StatCard
                key={c.key}
                label={c.label}
                icon={c.icon}
                tone={c.tone}
                value={metrics[c.key] ?? "—"}
                suffix={c.suffixKey && metrics[c.key] != null ? c.suffixKey : undefined}
              />
            ))}
          </div>
        </StateWrapper>
      </main>
    </>
  );
}
