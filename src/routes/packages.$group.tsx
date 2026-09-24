import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { InvestmentPackages } from "@/components/InvestmentPackages";
import { LoadingDialog, randomLoadingMs } from "@/components/LoadingDialog";
import { getStoredUser, type StoredUser } from "@/lib/auth";
import { fmt } from "@/lib/market";
import { GROUP_LABEL, INVESTMENT_PACKAGES, isPackageGroup } from "@/lib/packages";
import { getBalance, updateBalance } from "@/lib/store";
import { getSubscription, settleSubscription, subscribe, type Subscription } from "@/lib/subscription";
import type { InvestmentPackage } from "@/lib/packages";

export const Route = createFileRoute("/packages/$group")({
  ssr: false,
  params: {
    parse: ({ group }) => {
      if (!isPackageGroup(group)) throw notFound();
      return { group };
    },
    stringify: ({ group }) => ({ group }),
  },
  head: ({ params }) => {
    const label = isPackageGroup(params.group) ? GROUP_LABEL[params.group] : "الباقات";
    return {
      meta: [
        { title: `${label} | Easy Money` },
        {
          name: "description",
          content: `${label}: اختر الباقة المناسبة واشترك فيها مباشرة من محفظتك.`,
        },
        { property: "og:title", content: `${label} | Easy Money` },
        {
          property: "og:description",
          content: `${label}: اختر الباقة المناسبة واشترك فيها مباشرة من محفظتك.`,
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: PackagesPage,
});

function PackagesPage() {
  const { group } = Route.useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [balance, setBalance] = useState(0);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    setSub(getSubscription(u.identifier));
  }, [navigate]);

  if (!user) return null;

  function handleSubscribe(pkg: InvestmentPackage) {
    if (!user) return;
    if (sub && !sub.credited) {
      setNotice("أنت مشترك بالفعل في باقة، استلم أرباحها الأول.");
      window.setTimeout(() => setNotice(null), 5000);
      return;
    }
    if (balance < pkg.amount) {
      setNotice(
        `رصيدك غير كافي للاشتراك في باقة ${fmt(pkg.amount)} ج.م، اعمل إيداع الأول.`,
      );
      window.setTimeout(() => setNotice(null), 6000);
      return;
    }
    setLoading(true);
    const ms = randomLoadingMs();
    window.setTimeout(() => {
      const created = subscribe({
        identifier: user.identifier,
        amount: pkg.amount,
        returnAmount: pkg.returnAmount,
        durationMs: pkg.durationMs,
      });
      const newBalance = updateBalance(user.identifier, -pkg.amount);
      setBalance(newBalance);
      setSub(created);
      setNotice(
        `تم خصم ${fmt(pkg.amount)} ج.م من محفظتك والاشتراك في الباقة، أرباحك هتزيد لحد ${fmt(pkg.returnAmount)} ج.م خلال ${pkg.duration}.`,
      );
      window.setTimeout(() => setNotice(null), 6000);
      setLoading(false);
    }, ms);
  }

  return (
    <main className="min-h-screen pb-16">
      <LoadingDialog open={loading} title="جارٍ تنفيذ الاشتراك…" />
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-black text-primary-foreground">
              $
            </span>
            <div>
              <p className="text-sm font-bold leading-tight">Easy Money</p>
              <p className="text-xs text-muted-foreground">{GROUP_LABEL[group]}</p>
            </div>
          </div>
          <button
            onClick={() => navigate({ to: "/market" })}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="size-3.5" aria-hidden="true" />
            العودة للسوق
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-6">
        <h1 className="text-xl font-bold">{GROUP_LABEL[group]}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          رصيدك الحالي {fmt(balance)} ج.م — اختر الباقة المناسبة واضغط اشتراك.
        </p>

        {notice && (
          <p className="mt-4 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
            {notice}
          </p>
        )}

        <div className="mt-4">
          <InvestmentPackages
            group={group}
            packages={INVESTMENT_PACKAGES[group]}
            activeAmount={sub && !sub.credited ? sub.amount : null}
            onSubscribe={handleSubscribe}
          />
        </div>
      </div>
    </main>
  );
}
