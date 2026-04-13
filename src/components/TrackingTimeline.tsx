import { ShipmentEvent, ShipmentStatus, STATUS_ORDER, STATUS_LABELS } from "@/lib/types";
import { Check, Clock, AlertTriangle, RotateCcw, Package } from "lucide-react";

interface TrackingTimelineProps {
  events: ShipmentEvent[];
  currentStatus: ShipmentStatus;
}

const statusIcon = (status: ShipmentStatus, isActive: boolean) => {
  if (status === "EXCEPTION") return <AlertTriangle className="h-4 w-4" />;
  if (status === "RETURNED") return <RotateCcw className="h-4 w-4" />;
  if (status === "DELIVERED" && isActive) return <Check className="h-4 w-4" />;
  if (isActive) return <Package className="h-4 w-4" />;
  return <Clock className="h-4 w-4" />;
};

const TrackingTimeline = ({ events, currentStatus }: TrackingTimelineProps) => {
  const completedStatuses = new Set(events.map((e) => e.status));
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="space-y-0">
      {STATUS_ORDER.map((status, idx) => {
        const isCompleted = completedStatuses.has(status);
        const isCurrent = status === currentStatus;
        const matchingEvent = [...events].reverse().find((e) => e.status === status);
        const isPast = idx <= currentIdx && currentIdx >= 0;

        return (
          <div key={status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isCurrent
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : isCompleted
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {statusIcon(status, isCompleted || isCurrent)}
              </div>
              {idx < STATUS_ORDER.length - 1 && (
                <div className={`w-0.5 h-8 ${isPast ? "bg-success" : "bg-border"}`} />
              )}
            </div>
            <div className="pb-6 pt-1">
              <p className={`text-sm font-semibold ${isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                {STATUS_LABELS[status]}
              </p>
              {matchingEvent && (
                <>
                  <p className="text-xs text-muted-foreground">{matchingEvent.description}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {matchingEvent.location} · {new Date(matchingEvent.timestamp).toLocaleString()}
                  </p>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TrackingTimeline;
