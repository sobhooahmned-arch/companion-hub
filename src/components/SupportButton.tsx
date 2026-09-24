import { useNavigate } from "@tanstack/react-router";
import { Headset } from "lucide-react";

export function SupportButton() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate({ to: "/support" })}
      aria-label="الدعم الفني"
      className="fixed bottom-5 left-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:opacity-90"
    >
      <Headset className="h-6 w-6" aria-hidden="true" />
    </button>
  );
}
