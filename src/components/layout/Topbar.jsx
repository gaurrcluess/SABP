import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Topbar({ title, description, onMenuClick, actions }) {
  return (
    <header className="sticky top-0 z-30 flex items-start justify-between gap-4 border-b border-border bg-background/95 px-4 py-4 backdrop-blur sm:px-6 sm:py-5">
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="mt-0.5 shrink-0 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
