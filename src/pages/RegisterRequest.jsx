import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApiMutation, useApiQuery } from "@/hooks/useApi";
import { createMaintenanceRequest, getMapData } from "@/lib/api";

const DEPARTMENTS = ["Engineering", "S&T", "Traction", "Operations", "Civil"];
const ASSET_TYPES = ["Track", "Signal", "OHE", "Other"];
const MAINTENANCE_TYPES = ["Preventive", "Corrective", "Inspection", "Emergency"];
const CRITICALITY_LEVELS = ["Low", "Medium", "High", "Critical"];

const EMPTY_FORM = {
  department: "",
  asset_id: "",
  asset_type: "",
  maintenance_type: "",
  corridor_id: "",
  start_km: "",
  end_km: "",
  description: "",
  estimated_duration: "",
  required_by: "",
  criticality: "",
  requires_block: "",
  required_resources: "",
};

export default function RegisterRequest() {
  const { openMobileNav } = useOutletContext();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);

  // Corridor options come from the map/corridors endpoint so nothing is hardcoded.
  const { data: corridorData } = useApiQuery(() => getMapData(), []);
  const corridors = Array.isArray(corridorData)
    ? corridorData
    : corridorData?.corridors || [];

  const submitMutation = useApiMutation(createMaintenanceRequest);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      department: form.department,
      asset_id: form.asset_id,
      asset_type: form.asset_type,
      maintenance_type: form.maintenance_type,
      corridor_id: form.corridor_id,
      start_km: form.start_km ? Number(form.start_km) : null,
      end_km: form.end_km ? Number(form.end_km) : null,
      description: form.description,
      estimated_duration: form.estimated_duration ? Number(form.estimated_duration) : null,
      required_by: form.required_by,
      criticality: form.criticality,
      requires_block: form.requires_block === "yes",
      required_resources: form.required_resources
        ? form.required_resources.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
    };

    try {
      await submitMutation.mutate(payload);
    } catch {
      // handled below via submitMutation.status / error
    }
  }

  if (submitMutation.status === "success") {
    const result = submitMutation.data;
    return (
      <>
        <Topbar title="Register Maintenance Request" onMenuClick={openMobileNav} />
        <main className="flex flex-1 items-center justify-center px-4 py-10">
          <Card className="w-full max-w-md text-center">
            <CardContent className="flex flex-col items-center gap-4 pt-6">
              <CheckCircle2 className="h-10 w-10 text-success" />
              <div>
                <p className="font-display text-lg font-semibold">
                  Maintenance request registered
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {result?.message || "The backend has recorded this request."}
                </p>
              </div>
              <div className="w-full rounded-md bg-muted px-4 py-3 text-left text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Task ID</span>
                  <span className="font-mono font-medium">{result?.task_id || "—"}</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium capitalize">
                    {result?.status?.replace(/_/g, " ") || "Pending AI Planning"}
                  </span>
                </div>
              </div>
              <div className="flex w-full gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    submitMutation.reset();
                    setForm(EMPTY_FORM);
                  }}
                >
                  Register another
                </Button>
                <Button className="flex-1" onClick={() => navigate("/requests")}>
                  View requests
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar
        title="Register Maintenance Request"
        description="Submitted requests are queued for AI prioritization and block planning."
        onMenuClick={openMobileNav}
      />
      <main className="flex-1 px-4 py-6 sm:px-6">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Department" required>
                <SelectField
                  value={form.department}
                  onChange={(v) => update("department", v)}
                  options={DEPARTMENTS}
                  placeholder="Select department"
                />
              </Field>
              <Field label="Asset ID" required>
                <Input
                  value={form.asset_id}
                  onChange={(e) => update("asset_id", e.target.value)}
                  placeholder="e.g. TRK-102"
                  required
                />
              </Field>
              <Field label="Asset Type" required>
                <SelectField
                  value={form.asset_type}
                  onChange={(v) => update("asset_type", v)}
                  options={ASSET_TYPES}
                  placeholder="Select asset type"
                />
              </Field>
              <Field label="Maintenance Type" required>
                <SelectField
                  value={form.maintenance_type}
                  onChange={(v) => update("maintenance_type", v)}
                  options={MAINTENANCE_TYPES}
                  placeholder="Select maintenance type"
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Corridor" required>
                {corridors.length > 0 ? (
                  <SelectField
                    value={form.corridor_id}
                    onChange={(v) => update("corridor_id", v)}
                    options={corridors.map((c) => ({
                      value: c.corridor_id || c.id,
                      label: c.name || c.corridor_id || c.id,
                    }))}
                    placeholder="Select corridor"
                  />
                ) : (
                  <Input
                    value={form.corridor_id}
                    onChange={(e) => update("corridor_id", e.target.value)}
                    placeholder="e.g. C-12"
                    required
                  />
                )}
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Start Location / KM" required>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.start_km}
                    onChange={(e) => update("start_km", e.target.value)}
                    required
                  />
                </Field>
                <Field label="End Location / KM">
                  <Input
                    type="number"
                    step="0.1"
                    value={form.end_km}
                    onChange={(e) => update("end_km", e.target.value)}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance requirements</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Description" required className="sm:col-span-2">
                <Textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Describe the work to be done"
                  required
                />
              </Field>
              <Field label="Estimated Duration (hours)" required>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={form.estimated_duration}
                  onChange={(e) => update("estimated_duration", e.target.value)}
                  required
                />
              </Field>
              <Field label="Required By" required>
                <Input
                  type="datetime-local"
                  value={form.required_by}
                  onChange={(e) => update("required_by", e.target.value)}
                  required
                />
              </Field>
              <Field label="Criticality" required>
                <SelectField
                  value={form.criticality}
                  onChange={(v) => update("criticality", v)}
                  options={CRITICALITY_LEVELS}
                  placeholder="Select criticality"
                />
              </Field>
              <Field label="Requires Block?" required>
                <SelectField
                  value={form.requires_block}
                  onChange={(v) => update("requires_block", v)}
                  options={[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                  ]}
                  placeholder="Select"
                />
              </Field>
              <Field label="Required Resources" className="sm:col-span-2">
                <Input
                  value={form.required_resources}
                  onChange={(e) => update("required_resources", e.target.value)}
                  placeholder="Comma separated, e.g. Track Team, Inspection Vehicle"
                />
              </Field>
            </CardContent>
          </Card>

          {submitMutation.status === "error" && (
            <p className="text-sm text-destructive">
              ⚠ Unable to submit request. {submitMutation.error?.message}
            </p>
          )}

          <Separator />

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={submitMutation.status === "loading"}>
              {submitMutation.status === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Submit Maintenance Request
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </>
  );
}

function Field({ label, required, children, className }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 flex items-center gap-1">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function SelectField({ value, onChange, options, placeholder }) {
  const normalized = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {normalized.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
