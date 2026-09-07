import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import MaintenanceRequests from "@/pages/MaintenanceRequests";
import RegisterRequest from "@/pages/RegisterRequest";
import BlockPlanner from "@/pages/BlockPlanner";
import WeeklyPlan from "@/pages/WeeklyPlan";
import MonthlyPlan from "@/pages/MonthlyPlan";
import RailwayMap from "@/pages/RailwayMap";
import BlockDetails from "@/pages/BlockDetails";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/requests" element={<MaintenanceRequests />} />
          <Route path="/requests/new" element={<RegisterRequest />} />
          <Route path="/planner" element={<BlockPlanner />} />
          <Route path="/plan/weekly" element={<WeeklyPlan />} />
          <Route path="/plan/monthly" element={<MonthlyPlan />} />
          <Route path="/map" element={<RailwayMap />} />
          <Route path="/blocks/:blockId" element={<BlockDetails />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
