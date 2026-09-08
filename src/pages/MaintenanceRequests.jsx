import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Plus } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { StateWrapper } from "@/components/shared/StateWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { CriticalityBadge, RequestStatusBadge } from "@/components/shared/StatusBadges";
import { useApiQuery } from "@/hooks/useApi";
import { getMaintenanceRequests } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const DEPARTMENTS = ["All", "Engineering", "S&T", "Traction", "Operations"];
const STATUSES = ["All", "Pending", "Scheduled", "In Progress", "Completed", "Cancelled"];
const PRIORITIES = ["All", "Critical", "High", "Medium", "Low"];

export default function MaintenanceRequests() {
  const { openMobileNav } = useOutletContext();
  const [filters, setFilters] = useState({
    department: "all",
    status: "all",
    priority: "all",
    date: "",
  });

  const { status, data, error, refetch } = useApiQuery(
    () => getMaintenanceRequests(filters),
    [filters.department, filters.status, filters.priority, filters.date]
  );

  const requests = Array.isArray(data) ? data : data?.requests || [];

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <>
      <Topbar
        title="Maintenance Requests"
        description="All requests submitted by railway users, with priority scoring."
        onMenuClick={openMobileNav}
        actions={
          <Button asChild>
            <Link to="/requests/new">
              <Plus className="h-4 w-4" /> Register Request
            </Link>
          </Button>
        }
      />

      <main className="flex-1 space-y-5 px-4 py-6 sm:px-6">
        <Card className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          <FilterSelect
            label="Department"
            value={filters.department}
            onChange={(v) => updateFilter("department", v)}
            options={DEPARTMENTS}
          />
          <FilterSelect
            label="Status"
            value={filters.status}
            onChange={(v) => updateFilter("status", v)}
            options={STATUSES}
          />
          <FilterSelect
            label="Priority"
            value={filters.priority}
            onChange={(v) => updateFilter("priority", v)}
            options={PRIORITIES}
          />
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Date
            </label>
            <Input
              type="date"
              value={filters.date}
              onChange={(e) => updateFilter("date", e.target.value)}
            />
          </div>
        </Card>

        <Card className="overflow-hidden">
          <StateWrapper
            status={status}
            error={error}
            data={requests}
            onRetry={refetch}
            loadingLabel="Loading maintenance requests…"
            isEmpty={(d) => !d || d.length === 0}
            emptyTitle="No maintenance requests found"
            emptyDescription="Register a request, or adjust your filters, to see requests here."
            loadingFallback={
              <div className="space-y-3 p-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Criticality</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Priority Score</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.task_id}>
                    <TableCell className="font-mono text-xs font-medium">
                      {r.task_id}
                    </TableCell>
                    <TableCell>{r.department}</TableCell>
                    <TableCell>{r.asset_id}</TableCell>
                    <TableCell>
                      {r.corridor_id}
                      {r.start_km != null ? ` · KM ${r.start_km}` : ""}
                    </TableCell>
                    <TableCell>{r.maintenance_type}</TableCell>
                    <TableCell>
                      <CriticalityBadge value={r.criticality} />
                    </TableCell>
                    <TableCell>{formatDate(r.required_by)}</TableCell>
                    <TableCell>
                      {r.estimated_duration != null ? `${r.estimated_duration} hrs` : "—"}
                    </TableCell>
                    <TableCell className="font-mono">
                      {r.priority_score != null ? `${r.priority_score}/100` : "—"}
                    </TableCell>
                    <TableCell>
                      <RequestStatusBadge value={r.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </StateWrapper>
        </Card>
      </main>
    </>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt.toLowerCase()}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
