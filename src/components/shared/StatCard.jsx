import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * KPI card styled after a railway departure-board "flap" display:
 * a dark inset panel holds the number, the label sits below it in
 * small caps mono — evokes the station-board subject matter without
 * relying on generic card+shadow SaaS chrome.
 */
export function StatCard({ label, value, suffix, icon: Icon, tone = "default", loading }) {
  const toneClasses = {
    default: "text-panel-foreground",
    primary: "text-primary",
    accent: "text-accent",
    warning: "text-warning",
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-panel px-5 pb-4 pt-5">
        {loading ? (
          <Skeleton className="h-9 w-20 bg-panel-foreground/10" />
        ) : (
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "flap-digit animate-flap-in text-4xl font-semibold",
                toneClasses[tone]
              )}
            >
              {value}
            </span>
            {suffix && (
              <span className="flap-digit text-lg text-panel-foreground/60">
                {suffix}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-5 py-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground/70" />}
      </div>
    </Card>
  );
}
