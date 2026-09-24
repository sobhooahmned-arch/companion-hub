import { useNavigate } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";

export function RequestsButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate({ to: "/requests" })}
      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
    >
      <span className="flex items-center gap-1">
        طلباتي
        <span className="inline-flex items-center gap-1 rounded-full border border-verified/30 bg-verified/10 px-1.5 py-0.5 text-[10px] font-bold text-verified">
          <BadgeCheck className="h-3 w-3" aria-hidden="true" />
          منصة موثقة
        </span>
      </span>
    </button>
  );
}
