import { Bell, X } from "lucide-react";
import type { AppNotification } from "@/lib/notify";

export function NotificationToasts({
  items,
  onDismiss,
}: {
  items: AppNotification[];
  onDismiss: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4">
      {items.map((n) => (
        <div
          key={n.id}
          className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-primary/50 bg-card/95 px-4 py-3 shadow-lg backdrop-blur"
        >
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Bell className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-primary">{n.title}</p>
            <p className="mt-0.5 text-sm text-foreground">{n.text}</p>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(n.id)}
            aria-label="إغلاق الإشعار"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
