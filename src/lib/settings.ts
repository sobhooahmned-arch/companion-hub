export type DepositMethod = {
  /** اسم طريقة التحويل الخاصة بالرقم، مثال: أورنج كاش / فودافون كاش */
  name: string;
  /** رقم استلام الإيداع */
  number: string;
};

export type PaySettings = {
  /** اسم طريقة التحويل الافتراضي (يُستخدم كاحتياطي لأي رقم بدون اسم) */
  methodName: string;
  /** أرقام استلام الإيداع، لكل رقم اسم طريقة التحويل الخاصة به */
  depositMethods: DepositMethod[];
  /** رقم استلام الضريبة */
  taxNumber: string;
};

const KEY = "em_pay_settings";

export const DEFAULT_PAY_SETTINGS: PaySettings = {
  methodName: "أورنج كاش",
  depositMethods: [
    { name: "أورنج كاش", number: "01201838463" },
    { name: "أورنج كاش", number: "01208895415" },
  ],
  taxNumber: "01208895415",
};

function sanitizeMethods(raw: unknown, fallbackName: string): DepositMethod[] {
  if (!Array.isArray(raw)) return [];
  const out: DepositMethod[] = [];
  for (const item of raw) {
    // توافق مع التنسيق القديم: مصفوفة أرقام نصية
    if (typeof item === "string") {
      if (item.trim()) out.push({ name: fallbackName, number: item.trim() });
      continue;
    }
    if (item && typeof item === "object") {
      const m = item as Partial<DepositMethod>;
      const number = typeof m.number === "string" ? m.number.trim() : "";
      if (!number) continue;
      const name = typeof m.name === "string" && m.name.trim() ? m.name.trim() : fallbackName;
      out.push({ name, number });
    }
  }
  return out;
}

export function getPaySettings(): PaySettings {
  if (typeof window === "undefined") return DEFAULT_PAY_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PAY_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<PaySettings> & {
      depositNumbers?: unknown;
    };
    const methodName = parsed.methodName?.trim() || DEFAULT_PAY_SETTINGS.methodName;
    const methods = sanitizeMethods(
      parsed.depositMethods ?? parsed.depositNumbers,
      methodName,
    );
    return {
      methodName,
      depositMethods: methods.length ? methods : DEFAULT_PAY_SETTINGS.depositMethods,
      taxNumber: parsed.taxNumber?.trim() || DEFAULT_PAY_SETTINGS.taxNumber,
    };
  } catch {
    return DEFAULT_PAY_SETTINGS;
  }
}

export function savePaySettings(value: PaySettings) {
  if (typeof window === "undefined") return;
  const methodName = value.methodName.trim() || DEFAULT_PAY_SETTINGS.methodName;
  const depositMethods = value.depositMethods
    .map((m) => ({
      name: m.name.trim() || methodName,
      number: m.number.trim(),
    }))
    .filter((m) => m.number.length > 0);
  window.localStorage.setItem(
    KEY,
    JSON.stringify({
      methodName,
      depositMethods,
      taxNumber: value.taxNumber.trim() || DEFAULT_PAY_SETTINGS.taxNumber,
    }),
  );
}
