import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowDownLeft, ArrowUpRight, Gem } from "lucide-react";
import { SupportButton } from "@/components/SupportButton";
import { getStoredUser, type StoredUser } from "@/lib/auth";
import { fmt } from "@/lib/market";
import { userRequests, type MoneyRequest } from "@/lib/store";
import {
  getSubscription,
  progressOf,
  type Subscription,
} from "@/lib/subscription";

export const Route = createFileRoute("/requests")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "طلباتي وسجل العمليات | Easy Money" },
      {
        name: "description",
        content:
          "سجل كامل لعمليات الإيداع والسحب والاستثمار مع حالة كل عملية وتاريخها ومبلغها.",
      },
      { property: "og:title", content: "طلباتي وسجل العمليات | Easy Money" },
      {
        property: "og:description",
        content: "تابع حالة كل عملية إيداع وسحب واستثمار قمت بها.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RequestsPage,
});

const STATUS_LABEL: Record<MoneyRequest["status"], string> = {
  pending: "قيد المراجعة",
  approved: "تم التنفيذ",
  rejected: "مرفوض",
};

const STATUS_CLASS: Record<MoneyRequest["status"], string> = {
  pending: "border-border bg-secondary text-muted-foreground",
  approved: "border-primary/40 bg-primary/10 text-primary",
  rejected: "border-destructive/40 bg-destructive/10 text-destructive",
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function RequestRow({ req }: { req: MoneyRequest }) {
  const isDeposit = req.kind === "deposit";
  const Icon = isDeposit ? ArrowDownLeft : ArrowUpRight;
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            isDeposit
              ? "bg-primary/10 text-primary"
              : "bg-accent/20 text-accent"
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="font-bold">
            {isDeposit ? "إيداع" : "سحب"} {fmt(req.amount)} ج.م
          </p>
          <p className="text-xs text-muted-foreground">{fmtDate(req.at)}</p>
        </div>
      </div>
      <span
        className={`rounded-full border px-3 py-1 text-xs font-bold ${STATUS_CLASS[req.status]}`}
      >
        {STATUS_LABEL[req.status]}
      </span>
    </li>
  );
}

function RequestsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [reqs, setReqs] = useState<MoneyRequest[]>([]);
  const [sub, setSub] = useState<Subscription | null>(null);

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
    const load = async () => {
      setReqs(await userRequests(u.identifier).catch(() => []));
      setSub(await getSubscription(u.identifier).catch(() => null));
    };
    void load();

    const id = window.setInterval(() => void load(), 3000);
    return () => window.clearInterval(id);
  }, [navigate]);

  if (!user) return null;

  const deposits = reqs.filter((r) => r.kind === "deposit");
  const withdrawals = reqs.filter((r) => r.kind === "withdraw");
  const subDone = sub ? progressOf(sub) >= 1 : false;

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate({ to: "/market" })}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
            aria-label="العودة للسوق"
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <div>
            <p className="text-sm font-bold leading-tight">طلباتي</p>
            <p className="text-xs text-muted-foreground">
              سجل عمليات الإيداع والسحب والاستثمار
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-6 px-4 pt-5">
        <section>
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Gem className="h-4 w-4 text-primary" aria-hidden="true" />
            عمليات الاستثمار
          </h2>
          {!sub ? (
            <p className="mt-2 rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
              لا يوجد استثمار حالي. اختر باقة من صفحة السوق للبدء.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              <li className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm">
                <div>
                  <p className="font-bold">
                    باقة {fmt(sub.amount)} ج.م — الاستلام {fmt(sub.returnAmount)} ج.م
                  </p>
                  <p className="text-xs text-muted-foreground">
                    بدأت {fmtDate(new Date(sub.startedAt).toISOString())}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${
                    subDone
                      ? sub.taxPaid
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-accent/60 bg-accent/10 text-accent"
                      : "border-border bg-secondary text-muted-foreground"
                  }`}
                >
                  {subDone
                    ? sub.taxPaid
                      ? "مكتملة"
                      : "بانتظار الضريبة"
                    : "نشطة"}
                </span>
              </li>
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-sm font-bold">عمليات الإيداع</h2>
          {deposits.length === 0 ? (
            <p className="mt-2 rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
              لا توجد عمليات إيداع حتى الآن.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {deposits.map((r) => (
                <RequestRow key={r.id} req={r} />
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-sm font-bold">عمليات السحب</h2>
          {withdrawals.length === 0 ? (
            <p className="mt-2 rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
              لا توجد عمليات سحب حتى الآن.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {withdrawals.map((r) => (
                <RequestRow key={r.id} req={r} />
              ))}
            </ul>
          )}
        </section>
      </div>
      <SupportButton />
    </main>
  );
}
