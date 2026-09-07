import { useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { CheckCircle2, Loader2, TrainFront, Wand2 } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StateWrapper } from "@/components/shared/StateWrapper";
import { ImpactBadge } from "@/components/shared/StatusBadges";
import { useApiMutation } from "@/hooks/useApi";
import { generateOptimization } from "@/lib/api";
import { formatTime } from "@/lib/utils";

export default function BlockPlanner() {
  const { openMobileNav } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [corridor, setCorridor] = useState("all");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const optimizeMutation = useApiMutation((payload) => generateOptimization(payload));

  // If we arrived here from the Dashboard's "Generate Optimized Plan" button,
  // seed the result instead of forcing the user to click again.
  const [seeded] = useState(location.state?.plan || null);
  const result = optimizeMutation.data || seeded;
  const currentStatus = optimizeMutation.data ? optimizeMutation.status : seeded ? "success" : "idle";

  async function handleGenerate() {
    try {
      await optimizeMutation.mutate({
        planning_horizon: "custom",
        start_date: date,
        end_date: date,
        corridor_id: corridor === "all" ? "ALL" : corridor,
      });
    } catch {
      /* surfaced via optimizeMutation.status */
    }
  }

  const metrics = result?.metrics;
  const blocks = result?.blocks || [];

  return (
    <>
      <Topbar
        title="Block Planner"
        description="Generate an AI-optimized maintenance block plan and review the result."
        onMenuClick={openMobileNav}
      />

      <main className="flex-1 space-y-6 px-4 py-6 sm:px-6">
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Corridor
                </label>
                <Select value={corridor} onValueChange={setCorridor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All corridors</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Date
                </label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={optimizeMutation.status === "loading"}
              className="shrink-0"
            >
              {optimizeMutation.status === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Optimizing…
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" /> Generate Optimized Plan
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {optimizeMutation.status === "error" && (
          <p className="text-sm text-destructive">
            ⚠ Unable to generate plan. {optimizeMutation.error?.message}
          </p>
        )}

        <StateWrapper
          status={currentStatus === "idle" ? "success" : currentStatus}
          error={optimizeMutation.error}
          data={result}
          isEmpty={() => currentStatus === "idle"}
          emptyTitle="No plan generated yet"
          emptyDescription="Choose a corridor and date, then generate an optimized plan to see results here."
        >
          {metrics && (
            <Card className="border-success/30 bg-success/5">
              <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-6">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Optimization completed successfully.</span>
                </div>
                <Metric label="Tasks considered" value={metrics.tasks_considered} />
                <Metric label="Tasks scheduled" value={metrics.tasks_scheduled} />
                <Metric label="Blocks generated" value={metrics.blocks_generated} />
                <Metric label="Train conflicts" value={metrics.train_conflicts} />
              </CardContent>
            </Card>
          )}

          {blocks.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {blocks.map((block) => (
                <BlockCard key={block.block_id} block={block} onView={() => navigate(`/blocks/${block.block_id}`)} />
              ))}
            </div>
          )}
        </StateWrapper>
      </main>
    </>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="font-mono text-lg font-semibold leading-none">{value ?? "—"}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function BlockCard({ block, onView }) {
  const taskCount = block.tasks?.length ?? 0;
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm font-semibold">BLOCK {block.block_id}</span>
          <ImpactBadge value={block.impact} />
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>Corridor: <span className="text-foreground">{block.corridor_id}</span></p>
          <p className="flap-digit text-foreground">
            {formatTime(block.start_time)} — {formatTime(block.end_time)}
          </p>
        </div>
        <p className="text-sm font-medium">
          {taskCount} Maintenance {taskCount === 1 ? "Activity" : "Activities"}
        </p>
        {block.tasks?.length > 0 && (
          <ul className="space-y-1 text-xs text-muted-foreground">
            {block.tasks.slice(0, 4).map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-success" />
                <span className="font-mono">{t}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrainFront className="h-3.5 w-3.5" />
            Trains affected: {block.trains_affected ?? "—"}
          </span>
          <Button variant="outline" size="sm" onClick={onView}>
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
