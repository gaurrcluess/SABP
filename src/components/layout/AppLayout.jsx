import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar className="hidden lg:flex" />

      {/* Mobile nav drawer */}
      <Dialog open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <DialogContent className="left-0 top-0 h-full max-w-[16rem] translate-x-0 translate-y-0 rounded-none border-0 p-0 max-h-full">
          <Sidebar className="flex h-full" onNavigate={() => setMobileNavOpen(false)} />
        </DialogContent>
      </Dialog>

      <div className="flex min-h-screen w-full flex-1 flex-col">
        <Outlet context={{ openMobileNav: () => setMobileNavOpen(true) }} />
      </div>
    </div>
  );
}
