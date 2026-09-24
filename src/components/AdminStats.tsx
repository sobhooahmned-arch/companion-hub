import { useMemo, useState } from "react";
import { fmt } from "@/lib/market";
import { progressOf, type Subscription } from "@/lib/subscription";
import type { Account, MoneyRequest } from "@/lib/store";

type RangeKey = "today" | "7d" | "30d" | "all";

const RANGES: { key: RangeKey; label: string; ms: number | null }[] = [
  { key: "today", label: "اليوم", ms: 24 * 60 * 60 * 1000 },
  { key: "7d", label: "آخر 7 أيام", ms: 7 * 24 * 60 * 60 * 1000 },
  { key: "30d", label: "آخر 30 يوم", ms: 30 * 24 * 60 * 60 * 1000 },
  { key: "all", label: "كل الفترات", ms: null },
];

function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "primary" | "accent" | "destructive";
}) {
  const toneClass =
    tone === "primary"
      ? "text-primary"
      : tone === "accent"
        ? "text-accent"
        : tone === "destructive"
          ? "text-destructive"
          : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-black tabular-nums ${toneClass}`}>{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function AdminStats({
  accounts,
  requests,
  subscriptions,
}: {
  accounts: Account[];
  requests: MoneyRequest[];
  subscriptions: Subscription[];
}) {
  const [range, setRange] = useState<RangeKey>("7d");

  const data = useMemo(() => {
    const now = Date.now();
    const span = RANGES.find((r) => r.key === range)?.ms ?? null;
    const from = span === null ? 0 : now - span;

    const inRange = (iso?: string | number) => {
      if (iso === undefined) return false;
      const t = typeof iso === "number" ? iso : new Date(iso).getTime();
      return Number.isFinite(t) && t >= from;
    };

    const reqs = requests.filter((r) => inRange(r.at));
    const deposits = reqs.filter((r) => r.kind === "deposit");
    const withdraws = reqs.filter((r) => r.kind === "withdraw");
    const approved = reqs.filter((r) => r.status === "approved");
    const rejected = reqs.filter((r) => r.status === "rejected");
    const pending = reqs.filter((r) => r.status === "pending");
    const sum = (list: MoneyRequest[]) => list.reduce((t, r) => t + r.amount, 0);

    const subs = subscriptions.filter((s) => inRange(s.startedAt));
    const activeSubs = subscriptions.filter((s) => progressOf(s, now) < 1);
    const byPackage = new Map<number, { count: number; amount: number }>();
    for (const s of subs) {
      const row = byPackage.get(s.amount) ?? { count: 0, amount: 0 };
      byPackage.set(s.amount, { count: row.count + 1, amount: row.amount + s.amount });
    }

    return {
      newUsers: accounts.filter((a) => inRange(a.createdAt)).length,
      totalUsers: accounts.length,
      balances: accounts.reduce((t, a) => t + a.balance, 0),
      funded: accounts.filter((a) => a.balance > 0).length,
      reqCount: reqs.length,
      depositAmount: sum(deposits.filter((r) => r.status === "approved")),
      depositCount: deposits.length,
      withdrawAmount: sum(withdraws.filter((r) => r.status === "approved")),
      withdrawCount: withdraws.length,
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      approvalRate: reqs.length
        ? Math.round((approved.length / Math.max(1, approved.length + rejected.length)) * 100)
        : 0,
      subsCount: subs.length,
      subsAmount: subs.reduce((t, s) => t + s.amount, 0),
      subsPayout: subs.reduce((t, s) => t + s.returnAmount, 0),
      taxPaid: subs.filter((s) => s.taxPaid).length,
      activeSubs: activeSubs.length,
      packages: [...byPackage.entries()].sort((a, b) => b[1].count - a[1].count),
    };
  }, [accounts, requests, subscriptions, range]);

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">إحصاءات المنصة</h2>
        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                range === r.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        الأرقام محسوبة على الفترة المختارة، ما عدا إجمالي المستخدمين والأرصدة الحالية.
      </p>

      <h3 className="mt-4 text-sm font-bold text-muted-foreground">المستخدمون</h3>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="مستخدمون جدد" value={String(data.newUsers)} tone="primary" />
        <Stat label="إجمالي المستخدمين" value={String(data.totalUsers)} />
        <Stat label="حسابات برصيد" value={String(data.funded)} />
        <Stat label="إجمالي الأرصدة" value={`${fmt(data.balances)} ج.م`} tone="primary" />
      </div>

      <h3 className="mt-5 text-sm font-bold text-muted-foreground">المعاملات</h3>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat
          label="إيداعات منفذة"
          value={`${fmt(data.depositAmount)} ج.م`}
          hint={`${data.depositCount} طلب إيداع`}
          tone="primary"
        />
        <Stat
          label="سحوبات منفذة"
          value={`${fmt(data.withdrawAmount)} ج.م`}
          hint={`${data.withdrawCount} طلب سحب`}
          tone="accent"
        />
        <Stat
          label="قيد المراجعة"
          value={String(data.pending)}
          hint={`من ${data.reqCount} طلب`}
        />
        <Stat
          label="نسبة الموافقة"
          value={`${data.approvalRate}%`}
          hint={`${data.approved} موافقة · ${data.rejected} رفض`}
          tone={data.rejected > data.approved ? "destructive" : "primary"}
        />
      </div>

      <h3 className="mt-5 text-sm font-bold text-muted-foreground">الباقات</h3>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="اشتراكات جديدة" value={String(data.subsCount)} tone="primary" />
        <Stat label="قيمة الاشتراكات" value={`${fmt(data.subsAmount)} ج.م`} />
        <Stat label="أرباح مستحقة" value={`${fmt(data.subsPayout)} ج.م`} tone="accent" />
        <Stat
          label="باقات جارية الآن"
          value={String(data.activeSubs)}
          hint={`${data.taxPaid} دفعوا الضريبة`}
        />
      </div>

      {data.packages.length > 0 && (
        <ul className="mt-3 space-y-2">
          {data.packages.map(([amount, row]) => {
            const top = data.packages[0]?.[1].count || 1;
            return (
              <li key={amount} className="rounded-xl border border-border bg-card px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold">باقة {fmt(amount)} ج.م</span>
                  <span className="text-xs text-muted-foreground">
                    {row.count} اشتراك · {fmt(row.amount)} ج.م
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.round((row.count / top) * 100)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
