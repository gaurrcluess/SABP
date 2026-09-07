import { useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from "react-leaflet";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent } from "@/components/ui/card";
import { StateWrapper } from "@/components/shared/StateWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/useApi";
import { getMapData } from "@/lib/api";
import { formatTime } from "@/lib/utils";

const STATUS_COLOR = {
  recommended: "hsl(281 12% 58%)", // mauve
  active: "hsl(10 76% 55%)", // terracotta
  completed: "hsl(88 26% 36%)", // olive
  conflict: "hsl(14 82% 30%)", // deep rust
};

const DEFAULT_CENTER = [28.6139, 77.209]; // Delhi, as a sensible fallback view

export default function RailwayMap() {
  const { openMobileNav } = useOutletContext();
  const navigate = useNavigate();

  const { status, data, error, refetch } = useApiQuery(() => getMapData(), []);
  const corridors = Array.isArray(data) ? data : data?.corridors || [];

  const center = useMemo(() => {
    const first = corridors[0]?.geometry?.[0];
    return first ? [first[0], first[1]] : DEFAULT_CENTER;
  }, [corridors]);

  return (
    <>
      <Topbar
        title="Railway Map"
        description="Corridors and blocks as reported by the backend — the map only visualizes, it never decides."
        onMenuClick={openMobileNav}
      />

      <main className="flex-1 space-y-4 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap gap-4 text-xs">
          {Object.entries(STATUS_COLOR).map(([status_, color]) => (
            <span key={status_} className="flex items-center gap-1.5 capitalize text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              {status_}
            </span>
          ))}
        </div>

        <StateWrapper
          status={status}
          error={error}
          data={corridors}
          onRetry={refetch}
          loadingLabel="Loading corridor map…"
          isEmpty={(d) => !d || d.length === 0}
          emptyTitle="No corridor data available"
          emptyDescription="Once the backend returns corridor geometry, it will render here."
          loadingFallback={<Skeleton className="h-[520px] w-full rounded-lg" />}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <MapContainer
                center={center}
                zoom={11}
                scrollWheelZoom
                style={{ height: "560px", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {corridors.map((corridor) => (
                  <Corridor
                    key={corridor.corridor_id}
                    corridor={corridor}
                    onBlockClick={(blockId) => navigate(`/blocks/${blockId}`)}
                  />
                ))}
              </MapContainer>
            </CardContent>
          </Card>
        </StateWrapper>
      </main>
    </>
  );
}

function Corridor({ corridor, onBlockClick }) {
  const positions = corridor.geometry || [];
  const midpoint = positions[Math.floor(positions.length / 2)];

  return (
    <>
      <Polyline
        positions={positions}
        pathOptions={{ color: "hsl(10 76% 55%)", weight: 4, opacity: 0.8 }}
      >
        <Tooltip sticky>{corridor.name || corridor.corridor_id}</Tooltip>
      </Polyline>

      {(corridor.blocks || []).map((block, i) => {
        // Spread multiple blocks slightly along the corridor if exact
        // coordinates aren't provided, so markers don't stack exactly.
        const point =
          block.latitude && block.longitude
            ? [block.latitude, block.longitude]
            : midpoint;
        if (!point) return null;

        const color = STATUS_COLOR[block.status?.toLowerCase()] || "hsl(28 30% 60%)";
        const offset = i * 0.0015;

        return (
          <CircleMarker
            key={block.block_id}
            center={[point[0] + offset, point[1] + offset]}
            radius={9}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.9, weight: 2 }}
            eventHandlers={{ click: () => onBlockClick(block.block_id) }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              <div className="text-xs">
                <p className="font-semibold">{block.block_id}</p>
                <p>
                  {formatTime(block.start_time)}–{formatTime(block.end_time)}
                </p>
                <p className="capitalize">{block.status}</p>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}
