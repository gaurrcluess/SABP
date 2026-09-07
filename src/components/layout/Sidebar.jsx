import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  FilePlus2,
  Wand2,
  CalendarDays,
  CalendarRange,
  Map as MapIcon,
  TramFront,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/requests", label: "Maintenance Requests", icon: ClipboardList, end: true }, 
  { to: "/requests/new", label: "Register Request", icon: FilePlus2 },
  { to: "/planner", label: "Block Planner", icon: Wand2 },
  { to: "/plan/weekly", label: "Weekly Plan", icon: CalendarDays },
  { to: "/plan/monthly", label: "Monthly Plan", icon: CalendarRange },
  { to: "/map", label: "Railway Map", icon: MapIcon },
];

export function Sidebar({ className, onNavigate }) {
  return (
   <aside
  className={cn(
    "sticky top-0 h-screen w-64 shrink-0 flex-col bg-panel text-panel-foreground",
    className
  )}
>
      <div className="flex items-center gap-2.5 px-5 py-6 ">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <TramFront className="h-5 w-5" />
        </div>
        <div>
          <p className="font-display text-lg font-semibold leading-none text-panel-foreground">
            RailSync
          </p>
          
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-panel-foreground/70 hover:bg-panel-foreground/10 hover:text-panel-foreground"
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-panel-foreground/10 px-5 py-4">
        <p className="text-[11px] leading-relaxed text-panel-foreground/40">
          RailSync requests, displays and explains the result.
        </p>
      </div>
    </aside>
  );
}
