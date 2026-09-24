import { Clock3, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmt } from "@/lib/market";
import type { InvestmentPackage, PackageGroup } from "@/lib/packages";
import { GROUP_LABEL } from "@/lib/packages";

export function InvestmentPackages({
  group,
  packages,
  activeAmount,
  onSubscribe,
}: {
  group: PackageGroup;
  packages: InvestmentPackage[];
  activeAmount: number | null;
  onSubscribe: (pkg: InvestmentPackage) => void;
}) {
  const isLarge = group === "large";

  return (
    <section
      aria-label={GROUP_LABEL[group]}
      className="grid gap-2 rounded-lg border border-border bg-background/95 p-3 shadow-2xl sm:grid-cols-2 lg:grid-cols-4"
    >
      {packages.map((item, index) => (
        <article
          key={item.amount}
          className={`relative overflow-hidden rounded-lg border bg-card p-4 ${
            isLarge ? "border-accent/35" : "border-primary/35"
          }`}
        >
          <div
            className={`absolute inset-y-0 right-0 w-1 ${isLarge ? "bg-accent" : "bg-primary"}`}
          />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">باقة {index + 1}</p>
              <p className="mt-1 text-xl font-black tabular-nums">{fmt(item.amount)} ج.م</p>
            </div>
            <Gem
              aria-hidden="true"
              className={isLarge ? "text-accent" : "text-primary"}
            />
          </div>
          <div className="my-3 h-px bg-border" />
          <p className="text-xs text-muted-foreground">الاستلام المتوقع</p>
          <p className={`mt-1 text-lg font-black ${isLarge ? "text-accent" : "text-primary"}`}>
            {fmt(item.returnAmount)} ج.م
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock3 aria-hidden="true" className="size-3.5" />
            خلال {item.duration}
          </p>
          <Button
            type="button"
            variant={activeAmount === item.amount ? "secondary" : "default"}
            disabled={activeAmount !== null}
            onClick={() => onSubscribe(item)}
            className="mt-3 w-full rounded-lg font-bold"
          >
            {activeAmount === item.amount ? "مشترك في الباقة" : "اشتراك في الباقة"}
          </Button>
        </article>
      ))}
    </section>
  );
}
