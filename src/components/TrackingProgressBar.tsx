import { ShipmentStatus, STATUS_ORDER, STATUS_LABELS } from "@/lib/types";
import { Package, Truck, Building2, MapPin, CheckCircle2 } from "lucide-react";

interface TrackingProgressBarProps {
  currentStatus: ShipmentStatus;
}

const steps = [
  { status: "LABEL_CREATED" as ShipmentStatus, icon: Package, label: "Label Created" },
  { status: "PICKED_UP" as ShipmentStatus, icon: Package, label: "Picked Up" },
  { status: "IN_TRANSIT" as ShipmentStatus, icon: Truck, label: "In Transit" },
  { status: "AT_FACILITY" as ShipmentStatus, icon: Building2, label: "At Facility" },
  { status: "OUT_FOR_DELIVERY" as ShipmentStatus, icon: MapPin, label: "Out for Delivery" },
  { status: "DELIVERED" as ShipmentStatus, icon: CheckCircle2, label: "Delivered" },
];

const TrackingProgressBar = ({ currentStatus }: TrackingProgressBarProps) => {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const isException = currentStatus === "EXCEPTION" || currentStatus === "DELIVERY_ATTEMPTED" || currentStatus === "RETURNED";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Background line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-muted rounded-full" />
        {/* Progress line */}
        <div
          className={`absolute top-5 left-0 h-1 rounded-full transition-all duration-1000 ease-out ${isException ? "bg-destructive" : "bg-success"}`}
          style={{ width: `${Math.max(0, (currentIdx / (steps.length - 1)) * 100)}%` }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx <= currentIdx && !isException;
          const isCurrent = idx === currentIdx && !isException;

          return (
            <div key={step.status} className="relative flex flex-col items-center z-10" style={{ width: `${100 / steps.length}%` }}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isCurrent
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110"
                    : isCompleted
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <step.icon className="h-4 w-4" />
              </div>
              <span className={`text-[10px] mt-2 text-center font-medium leading-tight ${isCurrent ? "text-primary font-bold" : isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {isException && (
        <div className="mt-4 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive font-medium text-center">
          ⚠️ {STATUS_LABELS[currentStatus]} — Contact support for assistance
        </div>
      )}
    </div>
  );
};

export default TrackingProgressBar;
