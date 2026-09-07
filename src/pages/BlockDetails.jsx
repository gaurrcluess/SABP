import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StateWrapper } from "@/components/shared/StateWrapper";
import { ImpactBadge, BlockStatusBadge } from "@/components/shared/StatusBadges";
import { useApiQuery } from "@/hooks/useApi";
import { getBlockDetails } from "@/lib/api";
import { formatTime } from "@/lib/utils";

export default function BlockDetails() {
  const { openMobileNav } = useOutletContext();
  const { blockId } = useParams();
  const navigate = useNavigate();

  const { status, data: block, error, refetch } = useApiQuery(
    () => getBlockDetails(blockId),
    [blockId]
  );

  return (
    <>
      <Topbar
        title={`Block ${blockId}`}
        description="Full detail and AI explanation for this maintenance block."
        onMenuClick={openMobileNav}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        }
      />

      <main className="flex-1 px-4 py-6 sm:px-6">
        <StateWrapper
          status={status}
          error={error}
          data={block}
          onRetry={refetch}
          loadingLabel="Loading block details…"
          isEmpty={(d) => !d}
          emptyTitle="Block not found"
          emptyDescription="This block ID doesn't exist, or hasn't been generated yet."
        >
          {block && (
            <div className="mx-auto max-w-3xl space-y-6">
              <Card>
                <CardContent className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-4">
                  <DetailStat label="Corridor" value={block.corridor_id} />
                  <DetailStat
                    label="Time"
                    value={`${formatTime(block.start_time)} – ${formatTime(block.end_time)}`}
                  />
                  <DetailStat
                    label="Duration"
                    value={block.duration_hours ? `${block.duration_hours} hours` : "—"}
                  />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Operational Impact
                    </p>
                    <div className="mt-1.5">
                      <ImpactBadge value={block.impact} />
                    </div>
                  </div>
                </CardContent>
                {block.status && (
                  <>
                    <Separator />
                    <CardContent className="flex items-center justify-between pt-4">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <BlockStatusBadge value={block.status} />
                    </CardContent>
                  </>
                )}
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Tasks
                  </p>
                  <StateWrapper
                    status="success"
                    data={block.task_details}
                    isEmpty={(d) => !d || d.length === 0}
                    emptyTitle="No task detail returned"
                    emptyDescription="The backend didn't include per-task detail for this block."
                  >
                    <ul className="divide-y divide-border">
                      {(block.task_details || []).map((task) => (
                        <li key={task.task_id} className="flex items-center justify-between py-3">
                          <div>
                            <p className="text-sm font-medium">{task.description || task.task_id}</p>
                            <p className="text-xs text-muted-foreground">{task.department}</p>
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">
                            {task.task_id}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </StateWrapper>
                </CardContent>
              </Card>

              <Card className="border-primary/30 bg-accent/20">
                <CardContent className="pt-6">
                  <p className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Why was this block selected?
                  </p>
                  <StateWrapper
                    status="success"
                    data={block.optimization_reasons}
                    isEmpty={(d) => !d || d.length === 0}
                    emptyTitle="No explanation returned"
                    emptyDescription="The backend didn't include optimization reasons for this block."
                  >
                    <ul className="space-y-2">
                      {(block.optimization_reasons || []).map((reason, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </StateWrapper>
                </CardContent>
              </Card>
            </div>
          )}
        </StateWrapper>
      </main>
    </>
  );
}

function DetailStat({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 flap-digit text-sm font-medium text-foreground">{value ?? "—"}</p>
    </div>
  );
}
