import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { storeUser } from "@/lib/auth";
import { ADMIN_ID } from "@/lib/store";
import { verifyAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/adminop")({
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
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await verifyAdmin({ data: { id, name, pw } }).catch(() => ({ ok: false }));
    if (!res.ok) {
      setBusy(false);
      setError("بيانات الدخول غير صحيحة.");
      return;
    }
    storeUser({
      identifier: ADMIN_ID,
      method: "email",
      name: "الإدارة",
      createdAt: new Date().toISOString(),
      isAdmin: true,
    });
    window.setTimeout(() => navigate({ to: "/admin", replace: true }), 400);
  }

  const input =
    "mt-1 w-full rounded-xl border border-input bg-background/60 px-3 py-3 text-sm outline-none transition focus:border-gold";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="animate-float pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />
      <form onSubmit={submit} className="glass animate-rise relative w-full max-w-sm rounded-3xl border-gold/30 p-7 text-right">
        <div className="bg-gold mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="text-gold mt-4 text-center text-2xl font-bold">لوحة الإدارة</h1>
        <p className="mt-1 text-center text-xs text-muted-foreground">دخول مخصص للإدارة فقط</p>

        <label className="mt-5 block text-sm font-medium">المعرّف</label>
        <input value={id} onChange={(e) => setId(e.target.value)} dir="ltr" className={input} />
        <label className="mt-3 block text-sm font-medium">الاسم</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={input} />
        <label className="mt-3 block text-sm font-medium">كلمة المرور</label>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} dir="ltr" className={input} />

        {error && <p className="mt-3 rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">{error}</p>}

        <button type="submit" disabled={busy} className="bg-gold mt-5 w-full rounded-xl py-3 font-bold transition hover:-translate-y-0.5 disabled:opacity-60">
          {busy ? "جارٍ الدخول…" : "دخول"}
        </button>
      </form>
    </main>
  );
}
