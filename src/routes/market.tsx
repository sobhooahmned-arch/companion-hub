import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Clock3,
  Gem,
  Landmark,
  WalletCards,
} from "lucide-react";
import { SupportButton } from "@/components/SupportButton";
import { RequestsButton } from "@/components/RequestsButton";
import { NotificationToasts } from "@/components/NotificationToasts";
import { useNotifications } from "@/hooks/use-notifications";
import { clearStoredUser, getStoredUser, type StoredUser } from "@/lib/auth";
import { createStocks, fmt, tick, type Stock } from "@/lib/market";
import { AnimatedNumber, LiveChart, LiveTicker, LiveTrades, MarketTable } from "@/components/LiveMarket";
import { getBalance } from "@/lib/store";
import {
  currentProfit,
  formatRemaining,
  getSubscription,
  progressOf,
  remainingMs,
  settleSubscription,
  type Subscription,
} from "@/lib/subscription";

export const Route = createFileRoute("/market")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "السوق والمحفظة | Easy Money" },
      {
        name: "description",
        content:
          "تابع حركة الأسهم وأرباح المستثمرين لحظة بلحظة، وأدِر الإيداع والسحب من أعلى الصفحة.",
      },
      { property: "og:title", content: "السوق والمحفظة | Easy Money" },
      {
        property: "og:description",
        content: "أسعار متحركة، أرباح محفظتك، وإيداع وسحب في خطوة واحدة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MarketPage,
});

function MarketPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [stocks, setStocks] = useState<Stock[]>(() => createStocks());
  const [balance, setBalance] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const { toasts, dismiss } = useNotifications(user?.identifier ?? null);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      navigate({ to: "/", replace: true });
      return;
    }
    if (u.isAdmin) {
      navigate({ to: "/admin", replace: true });
      return;
    }
    setUser(u);
    void (async () => {
      await settleSubscription(u.identifier).catch(() => null);
      setBalance(await getBalance(u.identifier).catch(() => 0));
      setSub(await getSubscription(u.identifier).catch(() => null));
    })();
  }, [navigate]);

  useEffect(() => {
    const id = window.setInterval(() => setStocks((s) => tick(s)), 1200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // إضافة أرباح الباقة للمحفظة تلقائياً بعد انتهاء مدتها + تحديث الرصيد
  useEffect(() => {
    if (!user) return;
    const id = window.setInterval(() => {
      void (async () => {
        const credited = await settleSubscription(user.identifier).catch(() => null);
        if (credited) {
          setNotice(`تم إضافة أرباحك ${fmt(credited)} ج.م لرصيد محفظتك تلقائياً 🎉`);
          window.setTimeout(() => setNotice(null), 8000);
          setSub(await getSubscription(user.identifier).catch(() => null));
        }
        setBalance(await getBalance(user.identifier).catch(() => 0));
      })();
    }, 3000);
    return () => window.clearInterval(id);
  }, [user]);

  // الأرباح لا تتحرك إلا عند الاشتراك في باقة
  const profit = sub ? currentProfit(sub, now) : 0;
  const subDone = sub ? progressOf(sub, now) >= 1 : false;

  if (!user) return null;



  const total = balance + profit;

  return (
    <main className="min-h-screen overflow-x-hidden pb-20">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="bg-gold flex h-10 w-10 items-center justify-center rounded-2xl text-lg font-black">
              $
            </span>
            <div>
              <p className="text-gold text-base font-bold leading-tight">Easy Money</p>
              <p className="text-xs text-muted-foreground">أهلاً {user.name} 👋</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RequestsButton />
            <button
              onClick={() => {
                clearStoredUser();
                navigate({ to: "/", replace: true });
              }}
              className="rounded-xl border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-gold/50 hover:text-foreground"
            >
              خروج
            </button>
          </div>
        </div>
        <LiveTicker stocks={stocks} />
      </header>

      <div className="mx-auto max-w-6xl space-y-5 px-4 pt-5">
        {notice && (
          <p className="animate-rise rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
            {notice}
          </p>
        )}

        {/* بطاقة المحفظة */}
        <section className="animate-rise relative overflow-hidden rounded-3xl border border-gold/30 p-5 shadow-[var(--shadow-gold)]" style={{ background: "var(--gradient-card)" }}>
          <div className="grid-bg pointer-events-none absolute inset-0" />
          <div className="animate-float pointer-events-none absolute -left-10 -top-16 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
          <div className="relative">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Gem className="h-4 w-4 text-gold" /> إجمالي قيمة المحفظة
            </p>
            <p className="mt-2 text-4xl font-bold tracking-tight">
              <AnimatedNumber value={total} className="text-gold font-mono" />{" "}
              <span className="text-base text-muted-foreground">ج.م</span>
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <MiniStat label="الرصيد" value={`${fmt(balance)}`} />
              <MiniStat label="الأرباح" value={`${profit >= 0 ? "+" : ""}${fmt(profit)}`} tone={profit >= 0 ? "up" : "down"} />
              <MiniStat label="الأسهم" value={`${stocks.length}`} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate({ to: "/deposit" })}
                className="bg-emerald rounded-2xl px-4 py-3 text-right font-bold transition hover:-translate-y-0.5"
              >
                <span className="block text-[11px] font-medium opacity-75">إيداع</span>
                إضافة رصيد ↓
              </button>
              <button
                onClick={() => navigate({ to: "/withdraw" })}
                className="bg-gold rounded-2xl px-4 py-3 text-right font-bold transition hover:-translate-y-0.5"
              >
                <span className="block text-[11px] font-medium opacity-75">سحب</span>
                تحويل للحساب ↑
              </button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/packages/$group", params: { group: "small" } })}
            className="glass group flex min-h-16 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-center font-bold transition hover:-translate-y-0.5 hover:border-primary/50"
          >
            <WalletCards className="text-primary transition group-hover:scale-110" aria-hidden="true" />
            باقات الاستثمار الصغيرة
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/packages/$group", params: { group: "large" } })}
            className="glass group flex min-h-16 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-center font-bold transition hover:-translate-y-0.5 hover:border-gold/50"
          >
            <Landmark className="text-gold transition group-hover:scale-110" aria-hidden="true" />
            باقات الاستثمار الضخمة
          </button>
        </div>

        {sub && (
          <section className="glass animate-rise rounded-3xl border-primary/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold">
                باقة {fmt(sub.amount)} ج.م — الاستلام <span className="text-gold">{fmt(sub.returnAmount)} ج.م</span>
              </p>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock3 className="h-4 w-4" />
                {subDone ? "تم اكتمال الباقة" : `المتبقي ${formatRemaining(remainingMs(sub, now))}`}
              </p>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="bg-emerald animate-shine h-full rounded-full transition-all"
                style={{ width: `${Math.round(progressOf(sub, now) * 100)}%` }}
              />
            </div>
            {subDone && (
              <p className="mt-3 text-sm text-primary">
                {sub.credited
                  ? `تم إضافة ${fmt(sub.returnAmount)} ج.م لمحفظتك ✅ — متاحة للسحب بعد دفع ضريبة الباقة (${fmt(sub.tax)} ج.م).`
                  : `أرباح باقة ${fmt(sub.amount)} ج.م هتتضاف لمحفظتك تلقائياً، ومتاحة للسحب بعد دفع ضريبة الباقة (${fmt(sub.tax)} ج.م).`}
              </p>
            )}
          </section>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          <div className="min-w-0 lg:col-span-3">
            <LiveChart stocks={stocks} />
          </div>
          <div className="min-w-0 lg:col-span-2">
            <LiveTrades stocks={stocks} />
          </div>
        </div>

        <MarketTable stocks={stocks} />
      </div>
      <SupportButton />
      <NotificationToasts items={toasts} onDismiss={dismiss} />
    </main>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 px-3 py-2 backdrop-blur">
      <p className="text-muted-foreground">{label}</p>
      <p className={`mt-0.5 font-mono text-sm font-bold ${tone === "up" ? "text-primary" : tone === "down" ? "text-destructive" : ""}`}>
        {value}
      </p>
    </div>
  );
}
