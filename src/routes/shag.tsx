import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { MonitorSmartphone } from "lucide-react";
import { deleteDevice, listDevices, setDeviceStatus, type AdminDevice } from "@/lib/devices";

export const Route = createFileRoute("/shag")({
  head: () => ({
    meta: [
      { title: "أجهزة الإدارة | Easy Money" },
      { name: "description", content: "التحكم في الأجهزة المسموح لها بدخول لوحة الإدارة." },
      { property: "og:title", content: "أجهزة الإدارة | Easy Money" },
      { property: "og:description", content: "قبول أو رفض أجهزة دخول الإدارة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DevicesPage,
});

const LABEL = { pending: "في الانتظار", approved: "مقبول", rejected: "مرفوض" } as const;

function DevicesPage() {
  const [devices, setDevices] = useState<AdminDevice[]>([]);
  const refresh = useCallback(async () => {
    setDevices(await listDevices().catch(() => []));
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 3000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const act = async (fn: () => Promise<void>) => {
    await fn().catch(() => {});
    void refresh();
  };

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-8 text-right">
      <h1 className="text-gold text-2xl font-bold">أجهزة دخول الإدارة</h1>
      <p className="mt-1 text-sm text-muted-foreground">اقبل أو ارفض الأجهزة اللي بتطلب تدخل لوحة الإدارة.</p>
      <div className="mt-6 space-y-3">
        {devices.length === 0 && <p className="text-sm text-muted-foreground">لا توجد طلبات.</p>}
        {devices.map((d) => (
          <div key={d.id} className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MonitorSmartphone className="h-5 w-5 text-gold" />
                <div>
                  <p className="text-sm font-bold">{d.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(d.createdAt).toLocaleString("ar-EG")}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs">{LABEL[d.status]}</span>
            </div>
            <div className="mt-3 flex gap-2">
              {d.status !== "approved" && (
                <button onClick={() => act(() => setDeviceStatus(d.id, "approved"))} className="bg-gold flex-1 rounded-xl py-2 text-sm font-bold">
                  قبول
                </button>
              )}
              {d.status !== "rejected" && (
                <button onClick={() => act(() => setDeviceStatus(d.id, "rejected"))} className="flex-1 rounded-xl bg-destructive/15 py-2 text-sm font-bold text-destructive">
                  رفض
                </button>
              )}
              <button onClick={() => act(() => deleteDevice(d.id))} className="rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground">
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
