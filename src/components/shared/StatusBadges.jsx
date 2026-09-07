import { Badge } from "@/components/ui/badge";

const CRITICALITY_VARIANT = {
  critical: "destructive",
  high: "default",
  medium: "warning",
  low: "secondary",
};

export function CriticalityBadge({ value }) {
  if (!value) return <Badge variant="muted">Unknown</Badge>;
  const key = String(value).toLowerCase();
  return (
    <Badge variant={CRITICALITY_VARIANT[key] || "muted"} className="capitalize">
      {value}
    </Badge>
  );
}

const REQUEST_STATUS_VARIANT = {
  pending: "muted",
  "pending ai planning": "muted",
  scheduled: "secondary",
  planned: "secondary",
  in_progress: "warning",
  "in progress": "warning",
  completed: "success",
  cancelled: "outline",
};

export function RequestStatusBadge({ value }) {
  if (!value) return <Badge variant="muted">Unknown</Badge>;
  const key = String(value).toLowerCase();
  return (
    <Badge variant={REQUEST_STATUS_VARIANT[key] || "muted"} className="capitalize">
      {value.replace(/_/g, " ")}
    </Badge>
  );
}

const BLOCK_STATUS_VARIANT = {
  recommended: "secondary",
  active: "default",
  completed: "success",
  conflict: "destructive",
};

export function BlockStatusBadge({ value }) {
  if (!value) return <Badge variant="muted">Unknown</Badge>;
  const key = String(value).toLowerCase();
  return (
    <Badge variant={BLOCK_STATUS_VARIANT[key] || "muted"} className="capitalize">
      {value}
    </Badge>
  );
}

const IMPACT_VARIANT = {
  low: "secondary",
  medium: "warning",
  high: "destructive",
};

export function ImpactBadge({ value }) {
  if (!value) return <Badge variant="muted">Unknown</Badge>;
  const key = String(value).toLowerCase();
  return (
    <Badge variant={IMPACT_VARIANT[key] || "muted"} className="capitalize">
      {value} impact
    </Badge>
  );
}
