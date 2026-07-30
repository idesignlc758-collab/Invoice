const statusStyles: Record<string, string> = {
  paid: "bg-success-soft text-success",
  open: "bg-pending-soft text-pending",
  sent: "bg-pending-soft text-pending",
  viewed: "bg-pending-soft text-pending",
  accepted: "bg-success-soft text-success",
  converted: "bg-success-soft text-success",
  declined: "bg-danger-soft text-danger",
  canceled: "bg-line text-muted",
  expired: "bg-line text-muted",
  payment_failed: "bg-danger-soft text-danger",
  uncollectible: "bg-danger-soft text-danger",
  draft: "bg-line text-muted",
  void: "bg-line text-muted",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`text-[11px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full ${
        statusStyles[status] ?? "bg-line text-muted"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
