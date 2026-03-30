import { Priority, RequestStatus } from "@/types";

function badgeClasses(type: string) {
  const map: Record<string, string> = {
    LOW: "bg-green-100 text-green-800",
    MEDIUM: "bg-amber-100 text-amber-800",
    HIGH: "bg-orange-100 text-orange-800",
    CRITICAL: "bg-red-100 text-red-800",
    NEW: "bg-gray-100 text-gray-700",
    ASSIGNED: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-amber-100 text-amber-800",
    COMPLETED: "bg-green-100 text-green-800",
  };

  return map[type] || "bg-muted text-foreground";
}

export const PriorityBadge = ({ value }: { value: Priority }) => (
  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasses(value)}`}>
    {value}
  </span>
);

export const StatusBadge = ({ value }: { value: RequestStatus }) => (
  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasses(value)}`}>
    {value}
  </span>
);

export const SeverityBadge = ({ value }: { value: Priority }) => (
  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasses(value)}`}>
    {value}
  </span>
);
