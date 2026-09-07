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

export function StatusBadge({ status }: { status: ProductStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted">
      <span
        aria-hidden
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      {meta.label}
    </span>
  );
}

export function statusColor(status: ProductStatus): string {
  return STATUS_META[status].color;
}
