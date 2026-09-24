import { useEffect, useMemo, useRef, useState } from "react";
import { fmt, type Stock } from "@/lib/market";

/* ---------- شريط الأسعار المتحرك ---------- */
export function LiveTicker({ stocks }: { stocks: Stock[] }) {
  const items = [...stocks, ...stocks];
  return (
    <div className="relative w-full max-w-full h-10 overflow-hidden border-y border-border bg-card/50 backdrop-blur" dir="ltr">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
      <div className="absolute right-0 flex h-full w-max animate-marquee items-center gap-10">
        {items.map((s, i) => {
          const up = s.change >= 0;
          return (
            <span key={`${s.symbol}-${i}`} className="flex items-center gap-2.5 font-mono text-xs">
              <span className="h-1 w-1 rounded-full bg-gold opacity-70" />
              <span className="font-bold text-gold tracking-wide">{s.symbol}</span>
              <span className="tabular-nums text-foreground/90">{s.price.toFixed(2)}</span>
              <span
                className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                  up ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                }`}
              >
                <span className="text-[8px]">{up ? "▲" : "▼"}</span>
                {Math.abs(s.change).toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- منحنى ناعم (Catmull-Rom) ---------- */
function smoothPath(pts: readonly (readonly [number, number])[]) {
  if (pts.length < 2) return "";
  let d = `M${pts[0]![0].toFixed(1)},${pts[0]![1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[Math.min(pts.length - 1, i + 2)]!;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/* ---------- الرسم البياني الحي ---------- */
export function LiveChart({ stocks }: { stocks: Stock[] }) {
  const [sel, setSel] = useState(stocks[0]?.symbol ?? "");
  const stock = stocks.find((s) => s.symbol === sel) ?? stocks[0]!;
  const W = 600;
  const H = 220;
  const { line, area, lastY, min, max, avgY } = useMemo(() => {
    const v = stock.history;
    const mn = Math.min(...v);
    const mx = Math.max(...v);
    const span = mx - mn || 1;
    const pts = v.map((y, i) => [(i / (v.length - 1)) * W, H - 12 - ((y - mn) / span) * (H - 30)] as const);
    const l = smoothPath(pts);
    const avg = v.reduce((a, b) => a + b, 0) / v.length;
    return {
      line: l,
      area: `${l} L${W},${H} L0,${H} Z`,
      lastY: pts[pts.length - 1]![1],
      min: mn,
      max: mx,
      avgY: H - 12 - ((avg - mn) / span) * (H - 30),
    };
  }, [stock.history]);
  const up = stock.change >= 0;
  const color = up ? "var(--primary)" : "var(--destructive)";

  return (
    <section className="glass animate-rise relative overflow-hidden rounded-3xl p-4 sm:p-5">
      {/* وهج خلفي خفيف */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-48 w-2/3 -translate-x-1/2 rounded-full blur-3xl transition-colors duration-700"
        style={{ background: up ? "oklch(0.92 0.015 240 / 0.10)" : "oklch(0.66 0.22 20 / 0.12)" }}
      />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold">{stock.name}</p>
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground" dir="ltr">
              {stock.symbol}
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-3" dir="ltr">
            <AnimatedNumber
              value={stock.price}
              className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text font-mono text-4xl font-bold tabular-nums text-transparent"
            />
            <span
              className={`flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-sm font-bold tabular-nums ${
                up ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
              }`}
            >
              {up ? "▲ +" : "▼ "}
              {stock.change.toFixed(2)}%
            </span>
          </div>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] text-primary shadow-[0_0_20px_-5px_var(--color-primary)]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          LIVE
        </span>
      </div>

      <div className="relative mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" dir="ltr">
        {stocks.map((s) => {
          const active = s.symbol === stock.symbol;
          return (
            <button
              key={s.symbol}
              onClick={() => setSel(s.symbol)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[11px] font-bold transition-all duration-300 ${
                active
                  ? "bg-gold scale-105"
                  : "border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {s.symbol}
              <span className={`text-[8px] ${s.change >= 0 ? "" : "text-destructive"}`}>
                {s.change >= 0 ? "▲" : "▼"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative mt-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="area-g" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="70%" stopColor={color} stopOpacity="0.03" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="line-g" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1="0"
              x2={W}
              y1={H * f}
              y2={H * f}
              stroke="currentColor"
              className="text-border"
              strokeOpacity="0.5"
              strokeDasharray="2 8"
            />
          ))}
          {/* خط المتوسط */}
          <line x1="0" x2={W} y1={avgY} y2={avgY} stroke="currentColor" className="text-muted-foreground" strokeOpacity="0.3" strokeDasharray="1 5" />
          <path d={area} fill="url(#area-g)" style={{ transition: "d 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
          <path
            d={line}
            fill="none"
            stroke="url(#line-g)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            filter="url(#glow)"
            style={{ transition: "d 0.8s cubic-bezier(0.4,0,0.2,1)" }}
          />
          <line x1="0" x2={W} y1={lastY} y2={lastY} stroke={color} strokeOpacity="0.5" strokeDasharray="4 6" />
          <circle cx={W} cy={lastY} r="8" fill={color} opacity="0.25">
            <animate attributeName="r" values="6;14;6" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.35;0;0.35" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <circle cx={W} cy={lastY} r="3.5" fill={color} stroke="var(--color-background)" strokeWidth="1.5" />
          {/* سعر آخر نقطة */}
          <g transform={`translate(${W - 78},${lastY - 26})`}>
            <rect width="72" height="18" rx="9" fill={color} opacity="0.9" />
            <text x="36" y="13" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--color-background)" fontFamily="JetBrains Mono, monospace">
              {stock.price.toFixed(2)}
            </text>
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-y-0 left-1 flex flex-col justify-between py-2 font-mono text-[10px] text-muted-foreground" dir="ltr">
          <span>{max.toFixed(2)}</span>
          <span>{min.toFixed(2)}</span>
        </div>
      </div>
    </section>
  );
}

/* ---------- جدول السوق الحي ---------- */
export function MarketTable({ stocks }: { stocks: Stock[] }) {
  const prev = useRef<Record<string, number>>({});
  const flashes: Record<string, "up" | "down" | null> = {};
  for (const s of stocks) {
    const p = prev.current[s.symbol];
    flashes[s.symbol] = p === undefined ? null : s.price > p ? "up" : s.price < p ? "down" : null;
  }
  useEffect(() => {
    for (const s of stocks) prev.current[s.symbol] = s.price;
  });

  return (
    <section className="glass animate-rise overflow-hidden rounded-3xl">
      <Header title="جدول السوق المباشر" sub="الأسعار تتحدث كل ثانية" />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/20 text-[11px] tracking-wide text-muted-foreground">
              <th className="px-4 py-3 text-right font-medium">السهم</th>
              <th className="px-2 py-3 text-left font-medium">السعر</th>
              <th className="px-2 py-3 text-left font-medium">التغيير</th>
              <th className="px-2 py-3 text-center font-medium">آخر ٣٠ ثانية</th>
              <th className="px-4 py-3 text-left font-medium">الحجم</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((s, i) => {
              const up = s.change >= 0;
              const f = flashes[s.symbol];
              const vol = Math.round((s.price * 9137 * (i + 3)) % 9_800_000) + 200_000;
              return (
                <tr
                  key={`${s.symbol}-${s.history.length}-${s.price}`}
                  className={`group border-b border-border/40 transition-all duration-300 hover:bg-secondary/30 hover:shadow-[inset_2px_0_0_var(--color-primary)] ${
                    f === "up" ? "flash-up" : f === "down" ? "flash-down" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl font-mono text-[10px] font-bold ring-1 transition-transform duration-300 group-hover:scale-110 ${
                          up
                            ? "bg-primary/10 text-primary ring-primary/30"
                            : "bg-destructive/10 text-destructive ring-destructive/30"
                        }`}
                      >
                        {s.symbol.slice(0, 2)}
                      </span>
                      <div>
                        <p className="font-bold leading-tight">{s.name}</p>
                        <p className="font-mono text-[10px] tracking-wider text-muted-foreground" dir="ltr">
                          {s.symbol}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 text-left" dir="ltr">
                    <AnimatedNumber value={s.price} className="font-mono font-bold tabular-nums" />
                  </td>
                  <td className="px-2 text-left" dir="ltr">
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-mono text-xs font-bold tabular-nums ${
                        up ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      <span className="text-[8px]">{up ? "▲" : "▼"}</span>
                      {up ? "+" : "-"}
                      {Math.abs(s.change).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-2">
                    <Spark values={s.history} up={up} />
                  </td>
                  <td className="px-4 text-left font-mono text-xs text-muted-foreground tabular-nums" dir="ltr">
                    {(vol / 1000).toFixed(0)}K
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Spark({ values, up }: { values: number[]; up: boolean }) {
  const v = values.slice(-30);
  const mn = Math.min(...v);
  const span = Math.max(...v) - mn || 1;
  const pts = v.map((y, i) => [(i / (v.length - 1)) * 80, 26 - ((y - mn) / span) * 22] as const);
  const d = smoothPath(pts);
  const gid = `sg-${up ? "u" : "d"}-${Math.abs(Math.round(mn * 100)) % 1000}`;
  return (
    <svg viewBox="0 0 80 28" className="mx-auto h-7 w-20" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={up ? "var(--primary)" : "var(--destructive)"} stopOpacity="0.3" />
          <stop offset="100%" stopColor={up ? "var(--primary)" : "var(--destructive)"} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L80,28 L0,28 Z`} fill={`url(#${gid})`} />
      <path d={d} fill="none" strokeWidth="1.8" strokeLinecap="round" className={up ? "stroke-primary" : "stroke-destructive"} />
      <circle cx="80" cy={pts[pts.length - 1]![1]} r="2" className={up ? "fill-primary" : "fill-destructive"} />
    </svg>
  );
}

function Header({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border bg-secondary/10 px-4 py-3.5">
      <div>
        <h2 className="font-bold">{title}</h2>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <span className="flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-2.5 py-1 text-[10px] font-bold tracking-widest text-primary">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-primary" />
        </span>
        مباشر
      </span>
    </div>
  );
}

/* ---------- جدول الصفقات المنفذة ---------- */
type Trade = { id: string; symbol: string; side: "buy" | "sell"; price: number; qty: number; time: string };

export function LiveTrades({ stocks }: { stocks: Stock[] }) {
  const ref = useRef(stocks);
  ref.current = stocks;
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    const make = (): Trade => {
      const s = ref.current[Math.floor(Math.random() * ref.current.length)]!;
      return {
        id: Math.random().toString(36).slice(2),
        symbol: s.symbol,
        side: Math.random() > 0.45 ? "buy" : "sell",
        price: s.price * (1 + (Math.random() - 0.5) * 0.002),
        qty: Math.ceil(Math.random() * 900),
        time: new Date().toLocaleTimeString("en-GB"),
      };
    };
    setTrades(Array.from({ length: 8 }, make));
    const id = window.setInterval(() => setTrades((t) => [make(), ...t].slice(0, 9)), 1100);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="glass animate-rise overflow-hidden rounded-3xl">
      <Header title="الصفقات المنفذة الآن" sub="تدفق مباشر لعمليات البيع والشراء" />
      <div className="divide-y divide-border/40" dir="ltr">
        {trades.map((t) => (
          <div
            key={t.id}
            className="animate-row-in grid grid-cols-4 items-center px-4 py-2.5 font-mono text-xs transition-colors hover:bg-secondary/20"
          >
            <span className="font-bold tracking-wide text-gold">{t.symbol}</span>
            <span
              className={`w-fit rounded-lg px-2.5 py-0.5 text-[10px] font-bold ring-1 ${
                t.side === "buy"
                  ? "bg-primary/10 text-primary ring-primary/30"
                  : "bg-destructive/10 text-destructive ring-destructive/30"
              }`}
            >
              {t.side === "buy" ? "شراء ▲" : "بيع ▼"}
            </span>
            <span className="tabular-nums text-foreground/90">
              {t.price.toFixed(2)} <span className="text-muted-foreground">×</span> {t.qty}
            </span>
            <span className="text-right text-muted-foreground tabular-nums">{t.time}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- عداد رقمي ناعم ---------- */
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / 700);
      const e = 1 - Math.pow(1 - k, 3);
      setShown(a + (value - a) * e);
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <span className={className} dir="ltr">
      {fmt(shown)}
    </span>
  );
}
