import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Renders exactly one of: loading / error / empty / children (success).
 *
 * - loadingFallback: optional custom skeleton; otherwise a spinner + label.
 * - isEmpty(data): optional predicate to detect an empty-but-successful response.
 */
export function StateWrapper({
  status,
  error,
  data,
  onRetry,
  loadingLabel = "Loading…",
  loadingFallback,
  isEmpty,
  emptyTitle = "Nothing here yet",
  emptyDescription = "Once data is available from the backend, it will appear here.",
  children,
}) {
  if (status === "loading") {
    return (
      loadingFallback ?? (
        <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm">{loadingLabel}</p>
        </div>
      )
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <div>
          <p className="text-sm font-medium text-destructive">
            Unable to load this data.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error?.message || "Please try again."}
          </p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  if (isEmpty?.(data)) {
    return (
      <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-12 text-center text-muted-foreground">
        <Inbox className="h-5 w-5" />
        <div>
          <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
          <p className="mt-1 text-sm">{emptyDescription}</p>
        </div>
      </div>
    );
  }

  return children;
}
