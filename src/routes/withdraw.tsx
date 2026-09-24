import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Smartphone } from "lucide-react";
import { RequestsButton } from "@/components/RequestsButton";
import { LiveWithdrawals } from "@/components/LiveWithdrawals";
import { LoadingDialog, randomLoadingMs } from "@/components/LoadingDialog";
import { getStoredUser, type StoredUser } from "@/lib/auth";
import { fmt } from "@/lib/market";
import { addRequest, getBalance } from "@/lib/store";
import {
  getSubscription,
  PACKAGE_TAX,
  progressOf,
  settleSubscription,
  submitTaxProof,
  type Subscription,
} from "@/lib/subscription";
import { getPaySettings } from "@/lib/settings";

export const Route = createFileRoute("/withdraw")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "سحب الرصيد | Easy Money" },
      {
        name: "description",
        content:
          "اختار طريقة السحب المناسبة، اكتب رقم الاستلام والمبلغ، وأرسل طلب السحب لمراجعته من الإدارة.",
      },
      { property: "og:title", content: "سحب الرصيد | Easy Money" },
      {
        property: "og:description",
        content: "طرق سحب متعددة، إدخال رقم الاستلام والمبلغ، وإرسال الطلب للمراجعة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WithdrawPage,
});

const WITHDRAW_METHODS = ["اتصالات كاش", "أورانج كاش", "وي كاش", "انستا باي"] as const;

function WithdrawPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [balance, setBalance] = useState(0);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const [method, setMethod] = useState<string | null>(null);
  const [receiveNumber, setReceiveNumber] = useState("");
  const [raw, setRaw] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [proofName, setProofName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const paySettings = getPaySettings();
  const amount = Number(raw);

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
    settleSubscription(u.identifier);
    setBalance(getBalance(u.identifier));
    const s = getSubscription(u.identifier);
    // الضريبة تُطلب فقط بعد اكتمال الباقة وقبل دفع ضريبتها
    setSub(s && progressOf(s, Date.now()) >= 1 ? s : null);
  }, [navigate]);

  if (!user) return null;

  const needsTax = Boolean(sub) && !sub?.taxPaid;
  const tax = sub ? sub.tax || PACKAGE_TAX[sub.amount] || 0 : 0;

  function submitTax() {
    if (!/^\d{11}$/.test(senderNumber.trim())) return setError("اكتب الرقم الذي تم التحويل منه (11 رقم).");
    if (!proofName) return setError("أضف صورة التحويل.");
    setError(null);
    submitTaxProof({ identifier: user!.identifier, senderNumber: senderNumber.trim(), proofName });
    setSub(getSubscription(user!.identifier));
    setDone("تم إرسال إثبات دفع الضريبة، سيتم مراجعته وتحويل الأرباح.");
  }

  function submitWithdraw() {
    if (!/^\d{11}$/.test(receiveNumber.trim())) return setError("اكتب رقم الاستلام (11 رقم).");
    if (!amount || amount <= 0) return setError("اكتب مبلغاً صحيحاً.");
    if (amount > balance) return setError("المبلغ أكبر من رصيدك.");
    setError(null);
    setLoading(true);
    const ms = randomLoadingMs();
    window.setTimeout(() => {
      addRequest({ identifier: user!.identifier, name: user!.name, kind: "withdraw", amount });
      setDone(
        `تم إرسال طلب سحب ${fmt(amount)} ج.م عن طريق ${method} على الرقم ${receiveNumber.trim()}، سيتم تنفيذه بعد مراجعة الإدارة.`,
      );
      setLoading(false);
    }, ms);
  }

  return (
    <main className="min-h-screen pb-16">
      <LoadingDialog open={loading} title="جارٍ إرسال طلب السحب…" />
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-black text-primary-foreground">
              $
            </span>
            <div>
              <p className="text-sm font-bold leading-tight">سحب الرصيد</p>
              <p className="text-xs text-muted-foreground">أهلاً {user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RequestsButton />
            <button
              onClick={() => navigate({ to: "/market", replace: true })}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              رجوع
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-5">
        {error && (
          <p className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {done ? (
          <div className="rounded-2xl border border-primary/40 bg-primary/10 px-5 py-8 text-center">
            <p className="text-2xl">✅</p>
            <p className="mt-2 text-sm font-bold text-primary">{done}</p>
            <button
              onClick={() => navigate({ to: "/market", replace: true })}
              className="mt-5 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
            >
              العودة إلى السوق
            </button>
          </div>
        ) : needsTax && sub ? (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <ShieldCheck aria-hidden="true" className="text-primary" />
              دفع ضريبة الباقة
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              عشان تتم عملية سحب أرباح باقة {fmt(sub.amount)} ج.م، لازم تدفع ضريبة الباقة الأول.
            </p>
            <p className="mt-3 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-bold text-primary">
              الضريبة المطلوبة: {fmt(tax)} ج.م
            </p>

            <div className="mt-4 rounded-xl border border-border bg-background/60 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                1- حوّل الضريبة المطلوبة على الرقم ده لاستلام الأرباح مباشرة
              </p>
              <p className="mt-1 text-lg font-black tabular-nums" dir="ltr">
                {paySettings.taxNumber}
              </p>
            </div>

            <label className="mt-4 block text-xs text-muted-foreground">
              2- الرقم الذي تم التحويل منه
            </label>
            <input
              value={senderNumber}
              onChange={(e) => setSenderNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
              inputMode="tel"
              maxLength={11}
              dir="ltr"
              placeholder="01xxxxxxxxx"
              className="mt-1 w-full rounded-xl border border-input bg-background/60 px-3 py-3 outline-none focus:border-primary"
            />

            <label className="mt-4 block text-xs text-muted-foreground">3- صورة التحويل</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProofName(e.target.files?.[0]?.name ?? "")}
              className="mt-1 w-full rounded-xl border border-input bg-background/60 px-3 py-2 text-sm"
            />
            {proofName && <p className="mt-1 text-xs text-primary">{proofName}</p>}

            <button
              onClick={submitTax}
              className="mt-5 w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground"
            >
              إرسال إثبات الدفع
            </button>
          </section>
        ) : !method ? (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-bold">طرق السحب</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              اختار الطريقة اللي عايز تستلم بيها.
            </p>
            <div className="mt-4 space-y-2">
              {WITHDRAW_METHODS.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMethod(m);
                    setError(null);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-3 font-bold transition hover:border-primary hover:text-primary"
                >
                  <span className="flex items-center gap-2">
                    <Smartphone aria-hidden="true" className="size-4" />
                    {m}
                  </span>
                  <span className="text-muted-foreground">‹</span>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-bold">سحب عن طريق {method}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              المتاح للسحب: {fmt(balance)} ج.م
            </p>

            <label className="mt-4 block text-xs text-muted-foreground">
              الرقم اللي هيتم إرسال الأرباح عليه ({method})
            </label>
            <input
              value={receiveNumber}
              onChange={(e) => setReceiveNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
              inputMode="tel"
              maxLength={11}
              dir="ltr"
              placeholder="01xxxxxxxxx"
              className="mt-1 w-full rounded-xl border border-input bg-background/60 px-3 py-3 outline-none focus:border-primary"
            />

            <label className="mt-4 block text-xs text-muted-foreground">المبلغ</label>
            <input
              value={raw}
              onChange={(e) => setRaw(e.target.value.replace(/[^\d.]/g, ""))}
              inputMode="decimal"
              dir="ltr"
              placeholder="0.00"
              className="mt-1 w-full rounded-xl border border-input bg-background/60 px-3 py-3 text-lg outline-none focus:border-primary"
            />
            <div className="mt-3 flex gap-2">
              {[500, 1000, 5000].map((v) => (
                <button
                  key={v}
                  onClick={() => setRaw(String(v))}
                  className="flex-1 rounded-lg bg-secondary py-2 text-sm"
                >
                  {v}
                </button>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={submitWithdraw}
                className="flex-1 rounded-xl bg-primary py-3 font-bold text-primary-foreground"
              >
                تأكيد
              </button>
              <button
                onClick={() => setMethod(null)}
                className="rounded-xl border border-border px-4 py-3 text-sm"
              >
                رجوع
              </button>
            </div>
          </section>
        )}

        <LiveWithdrawals />
      </div>
    </main>
  );
}
