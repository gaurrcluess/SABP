import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrainFront } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <TrainFront className="h-10 w-10 text-muted-foreground" />
      <div>
        <h1 className="font-display text-2xl font-semibold">Off the corridor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This page doesn't exist in RailSync.
        </p>
      </div>
      <Button asChild>
        <Link to="/">Back to Dashboard</Link>
      </Button>
    </div>
  );
}
