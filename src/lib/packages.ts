export type PackageGroup = "small" | "large";

export type InvestmentPackage = {
  amount: number;
  returnAmount: number;
  duration: string;
  durationMs: number;
};

const MIN = 60 * 1000;

export const INVESTMENT_PACKAGES: Record<PackageGroup, InvestmentPackage[]> = {
  small: [
    { amount: 300, returnAmount: 3000, duration: "30 دقيقة", durationMs: 30 * MIN },
    { amount: 700, returnAmount: 7100, duration: "35 دقيقة", durationMs: 35 * MIN },
    { amount: 1500, returnAmount: 15000, duration: "45 دقيقة", durationMs: 45 * MIN },
  ],
  large: [
    { amount: 5000, returnAmount: 45000, duration: "ساعة واحدة", durationMs: 60 * MIN },
    { amount: 8000, returnAmount: 72000, duration: "ساعتين", durationMs: 120 * MIN },
    { amount: 12000, returnAmount: 86000, duration: "ساعتين", durationMs: 120 * MIN },
    { amount: 20000, returnAmount: 120000, duration: "ساعتين", durationMs: 120 * MIN },
  ],
};

export function isPackageGroup(v: string): v is PackageGroup {
  return v === "small" || v === "large";
}

export const GROUP_LABEL: Record<PackageGroup, string> = {
  small: "باقات الاستثمار الصغيرة",
  large: "باقات الاستثمار الضخمة",
};
