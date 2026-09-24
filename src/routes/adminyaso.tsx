import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { storeUser } from "@/lib/auth";
import { ADMIN_ID } from "@/lib/store";
import { requestAccess, type DeviceStatus } from "@/lib/devices";

export const Route = createFileRoute("/adminyaso")({
  head: () => ({
    meta: [
      { title: "دخول الإدارة | Easy Money" },
      { name: "description", content: "بوابة دخول لوحة تحكم الإدارة في Easy Money." },
      { property: "og:title", content: "دخول الإدارة | Easy Money" },
      { property: "og:description", content: "بوابة دخول لوحة تحكم الإدارة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminGate,
});

function AdminGate() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<DeviceStatus | "loading">("loading");

  useEffect(() => {
    let stop = false;
    const check = async () => {
      const s = await requestAccess().catch(() => "pending" as DeviceStatus);
      if (stop) return;
      setStatus(s);
      if (s === "approved") {
        storeUser({
          identifier: ADMIN_ID,
          method: "email",
          name: "الإدارة",
          createdAt: new Date().toISOString(),
          isAdmin: true,
        });
        navigate({ to: "/admin", replace: true });
      }
    };
    void check();
    const id = window.setInterval(() => void check(), 3000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [navigate]);

  const msg =
    status === "loading"
      ? "جارٍ التحقق من الجهاز…"
      : status === "rejected"
        ? "تم رفض دخول هذا الجهاز."
        : status === "approved"
          ? "تم القبول، جارٍ الدخول…"
          : "تم إرسال طلب دخول لهذا الجهاز. في انتظار الموافقة…";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="glass animate-rise relative w-full max-w-sm rounded-3xl border-gold/30 p-7 text-center">
        <div className="bg-gold mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="text-gold mt-4 text-2xl font-bold">لوحة الإدارة</h1>
        <p
          className={`mt-4 rounded-lg px-3 py-3 text-sm ${status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}
        >
          {msg}
        </p>
      </div>
    </main>
  );
}
