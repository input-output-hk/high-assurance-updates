import type { ProductStatus } from "@/lib/types";

const STATUS_META: Record<
  ProductStatus,
  { label: string; color: string }
> = {
  done: { label: "Done", color: "var(--status-done)" },
  "in-progress": { label: "In progress", color: "var(--status-progress)" },
  blocked: { label: "Blocked", color: "var(--status-blocked)" },
  "not-started": { label: "Not started", color: "var(--status-todo)" },
};

/** The shared dot+label rendering used by product and proposal status chips. */
export function StatusDot({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted">
      <span
        aria-hidden
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: ProductStatus }) {
  const meta = STATUS_META[status];
  return <StatusDot label={meta.label} color={meta.color} />;
}

export function statusColor(status: ProductStatus): string {
  return STATUS_META[status].color;
}
