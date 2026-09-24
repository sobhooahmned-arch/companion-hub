import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AdminStats } from "@/components/AdminStats";
import { getSubscriptions, type Subscription } from "@/lib/subscription";
import { clearStoredUser, getStoredUser } from "@/lib/auth";
import { fmt } from "@/lib/market";
import { pushNotification } from "@/lib/notify";
import { getPaySettings, savePaySettings, type PaySettings } from "@/lib/settings";
import { getThreads, sendAdminReply, type SupportThread } from "@/lib/support";
import {
  deleteRequest,
  getAccounts,
  getRequests,
  setRequestStatus,
  updateBalance,
  type Account,
  type MoneyRequest,
} from "@/lib/store";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "لوحة الإدارة | Easy Money" },
      {
        name: "description",
        content: "لوحة إدارة Easy Money: مراجعة طلبات الإيداع والسحب وإضافة الأرصدة للمستخدمين.",
      },
      { property: "og:title", content: "لوحة الإدارة | Easy Money" },
      {
        property: "og:description",
        content: "أضف أو اخصم أرصدة المستخدمين وراجع طلبات الإيداع والسحب.",
      },
    ],
  }),
  component: AdminPage,
});

type TabKey = "stats" | "requests" | "users" | "support" | "pay" | "history";
const TABS: { key: TabKey; label: string }[] = [
  { key: "stats", label: "الإحصائيات" },
  { key: "requests", label: "الطلبات" },
  { key: "users", label: "المستخدمين" },
  { key: "support", label: "الدعم الفني" },
  { key: "pay", label: "بيانات التحويل" },
  { key: "history", label: "السجل" },
];

function AdminPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [requests, setRequests] = useState<MoneyRequest[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("stats");

  const refresh = useCallback(async () => {
    const [a, r, s] = await Promise.all([
      getAccounts().catch(() => [] as Account[]),
      getRequests().catch(() => [] as MoneyRequest[]),
      getSubscriptions().catch(() => [] as Subscription[]),
    ]);
    setAccounts(a);
    setRequests(r);
    setSubscriptions(s);
  }, []);

  useEffect(() => {
    const u = getStoredUser();
    if (!u?.isAdmin) {
      navigate({ to: "/adminyaso", replace: true });
      return;
    }
    void refresh();
    setReady(true);
    const id = window.setInterval(() => void refresh(), 4000);
    return () => window.clearInterval(id);
  }, [navigate, refresh]);

  function flash(msg: string) {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 4000);
  }

  function approve(req: MoneyRequest) {
    if (req.kind === "withdraw") {
      const bal = accounts.find((a) => a.identifier === req.identifier)?.balance ?? 0;
      if (req.amount > bal) return flash("رصيد المستخدم لا يكفي لتنفيذ السحب.");
    }
    void (async () => {
      await updateBalance(req.identifier, req.kind === "deposit" ? req.amount : -req.amount).catch(() => 0);
      await setRequestStatus(req.id, "approved").catch(() => undefined);
      if (req.kind === "deposit") {
        await pushNotification({
          identifier: req.identifier,
          title: "تم إضافة رصيد",
          text: `تم إضافة ${fmt(req.amount)} ج.م إلى محفظتك 🎉`,
        }).catch(() => undefined);
      }
      await refresh();
      flash(
        req.kind === "deposit"
          ? `تمت إضافة ${fmt(req.amount)} ج.م إلى ${req.name}`
          : `تم خصم ${fmt(req.amount)} ج.م من ${req.name}`,
      );
    })();
  }

  function reject(req: MoneyRequest) {
    void (async () => {
      await setRequestStatus(req.id, "rejected").catch(() => undefined);
      await refresh();
      flash("تم رفض الطلب.");
    })();
  }

  if (!ready) return null;

  const pending = requests.filter((r) => r.status === "pending");
  const history = requests.filter((r) => r.status !== "pending").slice(0, 12);

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-black text-primary-foreground">
              $
            </span>
            <div>
              <p className="text-sm font-bold leading-tight">لوحة الإدارة</p>
              <p className="text-xs text-muted-foreground">Easy Money</p>
            </div>
          </div>
          <button
            onClick={() => {
              clearStoredUser();
              navigate({ to: "/adminyaso", replace: true });
            }}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            خروج
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 pt-5">
        {notice && (
          <p className="mb-4 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
            {notice}
          </p>
        )}

        <nav className="sticky top-[61px] z-10 -mx-4 mb-5 flex gap-2 overflow-x-auto border-b border-border bg-background/85 px-4 py-2 backdrop-blur">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition ${
                tab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {t.key === "requests" && pending.length > 0 && ` (${pending.length})`}
            </button>
          ))}
        </nav>

        {tab === "stats" && (<>
        <AdminStats accounts={accounts} requests={requests} subscriptions={subscriptions} />

        </>)}
        {tab === "requests" && (<div className="-mt-8">
        <h2 className="mt-8 text-lg font-bold">طلبات في انتظار المراجعة ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">لا توجد طلبات حالياً.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {pending.map((r) => (
              <li key={r.id} className="rounded-2xl border border-border bg-card px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold">
                      {r.name}{" "}
                      <span className={r.kind === "deposit" ? "text-primary" : "text-accent"}>
                        · {r.kind === "deposit" ? "إيداع" : "سحب"} {fmt(r.amount)} ج.م
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      {r.identifier}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approve(r)}
                      className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
                    >
                      موافقة
                    </button>
                    <button
                      onClick={() => reject(r)}
                      className="rounded-lg border border-border px-3 py-2 text-xs"
                    >
                      رفض
                    </button>
                    <button
                      onClick={() => {
                        void (async () => {
                          await deleteRequest(r.id).catch(() => undefined);
                          await refresh();
                          flash("تم حذف الطلب نهائياً.");
                        })();
                      }}
                      className="rounded-lg border border-destructive/40 px-3 py-2 text-xs text-destructive"
                    >
                      حذف
                    </button>
                  </div>
                </div>
                {r.fromNumber && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    الرقم الذي تم التحويل منه:{" "}
                    <span className="font-bold tabular-nums text-foreground" dir="ltr">
                      {r.fromNumber}
                    </span>
                  </p>
                )}
                {r.proof && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-bold text-primary">
                      عرض صورة التحويل
                    </summary>
                    <img
                      src={r.proof}
                      alt="صورة التحويل"
                      className="mt-2 max-h-72 w-full rounded-xl object-contain"
                    />
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}

        </div>)}
        {tab === "users" && (<div className="-mt-8">
        <h2 className="mt-8 text-lg font-bold">حسابات المستخدمين ({accounts.length})</h2>
        {accounts.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">لا يوجد مستخدمون مسجلون بعد.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {accounts.map((a) => (
              <UserRow
                key={a.identifier}
                account={a}
                onChange={(delta) => {
                  void (async () => {
                    await updateBalance(a.identifier, delta).catch(() => 0);
                    if (delta > 0) {
                      await pushNotification({
                        identifier: a.identifier,
                        title: "تم إضافة رصيد",
                        text: `تم إضافة ${fmt(delta)} ج.م إلى محفظتك 🎉`,
                      }).catch(() => undefined);
                    }
                    await refresh();
                    flash(
                      delta >= 0
                        ? `تمت إضافة ${fmt(delta)} ج.م إلى ${a.name}`
                        : `تم خصم ${fmt(-delta)} ج.م من ${a.name}`,
                    );
                  })();
                }}
              />
            ))}
          </ul>
        )}

        </div>)}
        {tab === "support" && (<div className="-mt-8">
        <SupportSection onReplied={() => flash("تم إرسال الرد للمستخدم.")} />

        </div>)}
        {tab === "pay" && (<div className="-mt-8">
        <div className="mt-8">
          <PaySettingsCard onSaved={() => flash("تم حفظ بيانات التحويل.")} />
        </div>

        </div>)}
        {tab === "history" && (<div className="-mt-8">
        {history.length === 0 ? (<p className="mt-10 text-sm text-muted-foreground">لا يوجد سجل بعد.</p>) : (
          <>
            <h2 className="mt-8 text-lg font-bold">سجل الطلبات</h2>
            <ul className="mt-3 space-y-2">
              {history.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm"
                >
                  <span>
                    {r.name} · {r.kind === "deposit" ? "إيداع" : "سحب"} {fmt(r.amount)} ج.م
                  </span>
                  <span className="flex items-center gap-2">
                    <span
                      className={`text-xs ${
                        r.status === "approved" ? "text-primary" : "text-destructive"
                      }`}
                    >
                      {r.status === "approved" ? "تم التنفيذ" : "مرفوض"}
                    </span>
                    <button
                      onClick={() => {
                        void (async () => {
                          await deleteRequest(r.id).catch(() => undefined);
                          await refresh();
                          flash("تم حذف الطلب من السجل.");
                        })();
                      }}
                      className="rounded-lg border border-destructive/40 px-2 py-1 text-xs text-destructive"
                    >
                      حذف
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
        </div>)}
      </div>
    </main>
  );
}

function UserRow({
  account,
  onChange,
}: {
  account: Account;
  onChange: (delta: number) => void;
}) {
  const [raw, setRaw] = useState("");
  const amount = Number(raw);

  return (
    <li className="rounded-2xl border border-border bg-card px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-bold">{account.name}</p>
          <p className="text-xs text-muted-foreground" dir="ltr">
            {account.identifier}
          </p>
        </div>
        <p className="text-sm font-bold text-primary">{fmt(account.balance)} ج.م</p>
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={raw}
          onChange={(e) => setRaw(e.target.value.replace(/[^\d.]/g, ""))}
          inputMode="decimal"
          dir="ltr"
          placeholder="المبلغ"
          className="flex-1 rounded-xl border border-input bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={() => {
            if (!amount || amount <= 0) return;
            onChange(amount);
            setRaw("");
          }}
          className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
        >
          إضافة
        </button>
        <button
          onClick={() => {
            if (!amount || amount <= 0) return;
            onChange(-amount);
            setRaw("");
          }}
          className="rounded-xl border border-border px-3 py-2 text-xs"
        >
          خصم
        </button>
      </div>
    </li>
  );
}

function SupportSection({ onReplied }: { onReplied: () => void }) {
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [text, setText] = useState("");

  useEffect(() => {
    const load = async () => setThreads(await getThreads().catch(() => []));
    void load();
    const id = window.setInterval(() => void load(), 3000);
    return () => window.clearInterval(id);
  }, []);

  const active = threads.find((t) => t.identifier === open) ?? null;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold">رسائل الدعم الفني ({threads.length})</h2>
      {threads.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">لا توجد رسائل دعم حالياً.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {threads.map((t) => (
            <li key={t.identifier} className="rounded-2xl border border-border bg-card px-4 py-3">
              <button
                onClick={() => setOpen(open === t.identifier ? null : t.identifier)}
                className="flex w-full items-center justify-between gap-2 text-right"
              >
                <div>
                  <p className="font-bold">{t.name}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {t.identifier}
                  </p>
                </div>
                {t.waiting && (
                  <span className="rounded-full border border-accent/60 bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                    بانتظار الرد
                  </span>
                )}
              </button>

              {open === t.identifier && active && (
                <div className="mt-3 space-y-2">
                  <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-border bg-background p-3">
                    {active.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${m.from === "user" ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                            m.from === "user"
                              ? "bg-secondary"
                              : m.from === "admin"
                                ? "bg-primary text-primary-foreground"
                                : "border border-border text-muted-foreground"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="اكتب الرد..."
                      className="flex-1 rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => {
                        const value = text.trim();
                        if (!value) return;
                        setText("");
                        void (async () => {
                          await sendAdminReply({
                            identifier: active.identifier,
                            name: active.name,
                            text: value,
                          }).catch(() => undefined);
                          setThreads(await getThreads().catch(() => []));
                          onReplied();
                        })();
                      }}
                      className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
                    >
                      إرسال
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PaySettingsCard({ onSaved }: { onSaved: () => void }) {
  const [form, setForm] = useState<PaySettings>(DEFAULT_PAY_SETTINGS);

  useEffect(() => {
    void getPaySettings().then(setForm);
  }, []);

  function setMethod(i: number, patch: Partial<{ name: string; number: string }>) {
    setForm((f) => ({
      ...f,
      depositMethods: f.depositMethods.map((m, idx) =>
        idx === i ? { ...m, ...patch } : m,
      ),
    }));
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="text-lg font-bold">بيانات التحويل</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        لكل رقم إيداع اسم طريقة التحويل الخاصة به، والتغيير يظهر للمستخدمين فوراً.
      </p>

      <p className="mt-4 text-xs text-muted-foreground">أرقام استلام الإيداع وطرق التحويل</p>
      <div className="mt-1 space-y-2">
        {form.depositMethods.map((m, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={m.name}
              onChange={(e) => setMethod(i, { name: e.target.value })}
              placeholder="اسم الطريقة (أورنج كاش)"
              className="w-2/5 rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <input
              value={m.number}
              onChange={(e) =>
                setMethod(i, { number: e.target.value.replace(/[^\d+]/g, "") })
              }
              inputMode="tel"
              dir="ltr"
              placeholder="01xxxxxxxxx"
              className="flex-1 rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            {form.depositMethods.length > 1 && (
              <button
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    depositMethods: f.depositMethods.filter((_, idx) => idx !== i),
                  }))
                }
                className="rounded-xl border border-border px-3 py-2 text-xs"
              >
                حذف
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={() =>
          setForm((f) => ({
            ...f,
            depositMethods: [...f.depositMethods, { name: f.methodName, number: "" }],
          }))
        }
        className="mt-2 rounded-xl border border-border px-3 py-2 text-xs"
      >
        + إضافة رقم
      </button>

      <label className="mt-4 block text-xs text-muted-foreground">رقم استلام الضريبة</label>
      <input
        value={form.taxNumber}
        onChange={(e) => setForm((f) => ({ ...f, taxNumber: e.target.value.replace(/[^\d+]/g, "") }))}
        inputMode="tel"
        dir="ltr"
        placeholder="01xxxxxxxxx"
        className="mt-1 w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary"
      />

      <button
        onClick={() => {
          void (async () => {
            await savePaySettings(form).catch(() => undefined);
            setForm(await getPaySettings());
            onSaved();
          })();
        }}
        className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground"
      >
        حفظ بيانات التحويل
      </button>
    </section>
  );
}
