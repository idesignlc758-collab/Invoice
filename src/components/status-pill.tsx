const statusStyles: Record<string, string> = {
  paid: "bg-success-soft text-success",
  open: "bg-pending-soft text-pending",
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
