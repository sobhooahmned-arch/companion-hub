import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  emailPattern,
  getLastLogin,
  saveLastLogin,
  getStoredUser,
  phonePattern,
  storeUser,
  type StoredUser,
} from "@/lib/auth";
import { createAccount, findAccount } from "@/lib/store";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Easy Money | منصة استثمار وتداول" },
      {
        name: "description",
        content:
          "سجّل دخولك بالبريد الإلكتروني أو رقم الموبايل وابدأ متابعة أسهمك وأرباحك لحظة بلحظة على منصة Easy Money.",
      },
      { property: "og:title", content: "Easy Money | منصة استثمار وتداول" },
      {
        property: "og:description",
        content: "دخول سريع، محفظة واضحة، وأسعار أسهم تتحرك لحظة بلحظة.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"loading" | "welcome" | "login">("loading");
  const [progress, setProgress] = useState(6);

  useEffect(() => {
    const existing = getStoredUser();
    if (existing) {
      navigate({ to: existing.isAdmin ? "/admin" : "/market", replace: true });
      return;
    }

    const int = window.setInterval(() => {
      setProgress((p) => (p >= 100 ? 100 : p + Math.random() * 14));
    }, 160);
    const to = window.setTimeout(() => setPhase("welcome"), 1800);
    return () => {
      window.clearInterval(int);
      window.clearTimeout(to);
    };
  }, [navigate]);

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="animate-float pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-gold/20 blur-3xl" />
      <div className="animate-float pointer-events-none absolute bottom-0 left-0 h-96 w-96 rounded-full bg-primary/15 blur-3xl" style={{ animationDelay: "-3s" }} />
      <div className="flex flex-1 items-center justify-center px-4 py-8">
      <div className="glass animate-rise relative w-full max-w-md rounded-3xl border-gold/25 p-7">
        {phase === "loading" && <LoadingPanel progress={Math.min(progress, 100)} />}
        {phase === "welcome" && <WelcomePanel onStart={() => setPhase("login")} />}
        {phase === "login" && (
          <LoginPanel
            onDone={(user) => {
              storeUser(user);
              navigate({ to: user.isAdmin ? "/admin" : "/market", replace: true });
            }}
          />
        )}

      </div>
      </div>
    </main>
  );
}

function Logo() {
  return (
    <div className="bg-gold animate-float mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-black">
      $
    </div>
  );
}

function LoadingPanel({ progress }: { progress: number }) {
  return (
    <div className="py-6 text-center">
      <Logo />
      <h1 className="text-gold mt-5 text-3xl font-bold">Easy Money</h1>
      <p className="mt-2 text-sm text-muted-foreground">جارٍ تحضير منصة الاستثمار…</p>
      <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="bg-gold animate-shine h-full rounded-full transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{Math.round(progress)}%</p>
    </div>
  );
}

function WelcomePanel({ onStart }: { onStart: () => void }) {
  return (
    <div className="text-center">
      <Logo />
      <h1 className="mt-5 text-2xl font-bold">أهلاً بك في Easy Money 👋</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        منصة استثمار بسيطة وواضحة: تابع حركة الأسهم وأرباح المستثمرين لحظة بلحظة، وادِر
        عمليات الإيداع والسحب من مكان واحد.
      </p>
      <ul className="mt-5 space-y-2 text-right text-sm">
        {["متابعة مباشرة لأسعار الأسهم", "إيداع وسحب سريع", "ملخص واضح لأرباح محفظتك"].map(
          (t) => (
            <li key={t} className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2">
              <span className="text-primary">✓</span>
              {t}
            </li>
          ),
        )}
      </ul>
      <button
        onClick={onStart}
        className="mt-6 w-full rounded-xl bg-gold py-3 font-bold transition hover:-translate-y-0.5"
      >
        متابعة إلى تسجيل الدخول
      </button>
    </div>
  );
}

function LoginPanel({ onDone }: { onDone: (user: StoredUser) => void }) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [value, setValue] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const last = getLastLogin();
    if (last) {
      setMode("login");
      setMethod(last.method);
      setValue(last.identifier);
      setName(last.name);
      setPassword(last.password ?? "");
    }
  }, []);

  async function login(v: string) {
    const account = await findAccount(v).catch(() => null);
    if (!account) return setError("لا يوجد حساب بهذا البيان. أنشئ حسابًا أولاً.");
    if (account.banned) return setError("تم حظر هذا الحساب من المنصة.");
    if (account.password !== password)
      return setError("كلمة المرور غير صحيحة لهذا الحساب.");
    setError(null);
    setBusy(true);
    saveLastLogin({ identifier: account.identifier, method: account.method, name: account.name, password });
    window.setTimeout(
      () =>
        onDone({
          identifier: account.identifier,
          method: account.method,
          name: account.name,
          createdAt: account.createdAt,
        }),
      700,
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = value.trim();

    if (mode === "signup" && name.trim().length < 2)
      return setError("اكتب اسمك من فضلك.");
    if (method === "email" && !emailPattern.test(v))
      return setError("البريد الإلكتروني غير صحيح.");
    if (method === "phone" && !phonePattern.test(v.replace(/\s/g, "")))
      return setError("رقم الموبايل لازم يكون 11 رقم.");
    if (password.length < 4) return setError("كلمة المرور 4 أحرف على الأقل.");

    setBusy(true);
    try {
      if (mode === "signup") {
        if (await findAccount(v).catch(() => null)) {
          setBusy(false);
          return setError("يوجد حساب بهذا البيان بالفعل. سجّل دخولك بدلًا من ذلك.");
        }
        await createAccount({ identifier: v, method, name: name.trim(), password });
        setError(null);
        setInfo(null);
        setBusy(false);
        await login(v);
        return;
      }

      setInfo(null);
      setBusy(false);
      await login(v);
    } catch {
      setBusy(false);
      setError("حدث خطأ في الاتصال، حاول مرة أخرى.");
    }
  }


  return (
    <form onSubmit={submit} className="text-right">
      <h1 className="text-xl font-bold">
        {mode === "signup" ? "إنشاء حساب" : "تسجيل الدخول"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {mode === "signup"
          ? "أنشئ حسابك الجديد وهتدخل على المنصة على طول."
          : "سيتم حفظ دخولك على هذا الجهاز، فلن نطلبه مرة أخرى."}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1">
        {(
          [
            ["email", "البريد الإلكتروني"],
            ["phone", "رقم الموبايل"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setMethod(key);
              setValue("");
              setError(null);
            }}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              method === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="mt-4 block text-sm font-medium">الاسم</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="اسمك بالكامل"
        className="mt-1 w-full rounded-xl border border-input bg-background/60 px-3 py-3 text-sm outline-none focus:border-primary"
      />

      <label className="mt-4 block text-sm font-medium">
        {method === "email" ? "البريد الإلكتروني" : "رقم الموبايل"}
      </label>
      <input
        value={value}
        onChange={(e) =>
          setValue(
            method === "phone" ? e.target.value.replace(/\D/g, "").slice(0, 11) : e.target.value,
          )
        }
        inputMode={method === "phone" ? "tel" : "email"}
        {...(method === "phone" ? { maxLength: 11 } : {})}
        dir="ltr"
        placeholder={method === "email" ? "name@mail.com" : "01xxxxxxxxx"}
        className="mt-1 w-full rounded-xl border border-input bg-background/60 px-3 py-3 text-sm outline-none focus:border-primary"
      />

      <label className="mt-4 block text-sm font-medium">كلمة المرور</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        dir="ltr"
        placeholder="••••••"
        className="mt-1 w-full rounded-xl border border-input bg-background/60 px-3 py-3 text-sm outline-none focus:border-primary"
      />

      {info && (
        <p className="mt-3 rounded-lg bg-primary/15 px-3 py-2 text-sm text-primary">
          {info}
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-5 w-full rounded-xl bg-gold py-3 font-bold transition hover:-translate-y-0.5 disabled:opacity-60"
      >
        {busy
          ? mode === "signup"
            ? "جارٍ إنشاء الحساب…"
            : "جارٍ الدخول…"
          : mode === "signup"
            ? "إنشاء الحساب"
            : "دخول"}
      </button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {mode === "login" ? "ليس لديك حساب؟" : "لديك حساب؟"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
            setInfo(null);
            setPassword("");
          }}
          className="font-bold text-primary hover:underline"
        >
          {mode === "login" ? "إنشاء حساب" : "تسجيل الدخول"}
        </button>
      </p>
    </form>
  );
}
