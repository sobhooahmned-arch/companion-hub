import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";

const NAMES = [
  "أحمد محمد",
  "محمود سعيد",
  "مصطفى علي",
  "كريم حسن",
  "عبدالرحمن ياسر",
  "إسلام فتحي",
  "سارة إبراهيم",
  "منى عادل",
  "ياسمين طارق",
  "هبة رمضان",
  "محمد جمال",
  "عمرو شعبان",
  "خالد أنور",
  "نورهان سمير",
  "مريم أشرف",
  "حسام الدين",
  "أميرة وليد",
  "طارق زكي",
  "شيماء ماهر",
  "عمر صلاح",
];

const METHODS = ["اتصالات كاش", "أورانج كاش", "وي كاش", "انستا باي"];
const AMOUNTS = [10000, 11000, 12500, 13000, 14000, 15000, 17000, 18000, 20000, 22000, 25000, 30000];

type Item = {
  id: string;
  name: string;
  method: string;
  amount: number;
  phone: string;
  secondsAgo: number;
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

const money = (n: number) => n.toLocaleString("en-US");

function maskPhone() {
  const prefix = pick(["010", "011", "012", "015"]);
  const tail = String(Math.floor(Math.random() * 100)).padStart(2, "0");
  return `${prefix}****${tail}`;
}

function makeItem(secondsAgo: number, excludeNames: string[]): Item {
  const available = NAMES.filter((n) => !excludeNames.includes(n));
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: pick(available.length ? available : NAMES),
    method: pick(METHODS),
    amount: pick(AMOUNTS),
    phone: maskPhone(),
    secondsAgo,
  };
}

function ago(s: number) {
  if (s < 60) return `منذ ${s} ثانية`;
  const m = Math.floor(s / 60);
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  return `منذ ${h} ساعة`;
}

export function LiveWithdrawals() {
  const [items, setItems] = useState<Item[]>([]);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    let t = 30;
    const seed: Item[] = [];
    for (let i = 0; i < 6; i++) {
      seed.push(makeItem(t, seed.map((s) => s.name)));
      t += 30 + Math.floor(Math.random() * 60);
    }
    setItems(seed);

    const tick = window.setInterval(() => {
      setItems((prev) => prev.map((it) => ({ ...it, secondsAgo: it.secondsAgo + 1 })));
    }, 1000);

    const schedule = () => {
      timer.current = window.setTimeout(() => {
        setItems((prev) => [
          makeItem(1, prev.map((p) => p.name)),
          ...prev,
        ].slice(0, 8));
        schedule();
      }, 30_000);
    };
    schedule();

    return () => {
      window.clearInterval(tick);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          عمليات سحب جارية الآن
        </h2>
      </div>

      <ul className="mt-4 space-y-2">
        {items.map((it, idx) => (
          <li
            key={it.id}
            className={`flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-4 py-3 ${
              idx === 0 ? "animate-in fade-in slide-in-from-top-2 border-primary/50" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold leading-tight">{it.name}</p>
                <p className="text-xs text-muted-foreground">
                  {it.method} • <span dir="ltr">{it.phone}</span> • {ago(it.secondsAgo)}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <p className="text-sm font-black text-primary tabular-nums">
                {money(it.amount)} ج.م
              </p>
              {it.amount < 15000 ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  باقات الاستثمار الصغيرة
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-300/40 bg-slate-300/10 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                  باقات الاستثمار الضخمة
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
