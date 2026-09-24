import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

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

function normalize(parsed: Partial<PaySettings> & { depositNumbers?: unknown }): PaySettings {
  const methodName = parsed.methodName?.trim() || DEFAULT_PAY_SETTINGS.methodName;
  const methods = sanitizeMethods(parsed.depositMethods ?? parsed.depositNumbers, methodName);
  return {
    methodName,
    depositMethods: methods.length ? methods : DEFAULT_PAY_SETTINGS.depositMethods,
    taxNumber: parsed.taxNumber?.trim() || DEFAULT_PAY_SETTINGS.taxNumber,
  };
}

let cache: PaySettings | null = null;

export async function getPaySettings(): Promise<PaySettings> {
  try {
    const { data, error } = await supabase
      .from("pay_settings")
      .select("data")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    cache = data?.data ? normalize(data.data as Partial<PaySettings>) : DEFAULT_PAY_SETTINGS;
  } catch {
    cache = cache ?? DEFAULT_PAY_SETTINGS;
  }
  return cache;
}

/** قراءة محلية سريعة من آخر قيمة محمّلة */
export function getCachedPaySettings(): PaySettings {
  return cache ?? DEFAULT_PAY_SETTINGS;
}

export async function savePaySettings(value: PaySettings) {
  const methodName = value.methodName.trim() || DEFAULT_PAY_SETTINGS.methodName;
  const depositMethods = value.depositMethods
    .map((m) => ({ name: m.name.trim() || methodName, number: m.number.trim() }))
    .filter((m) => m.number.length > 0);
  const clean: PaySettings = {
    methodName,
    depositMethods,
    taxNumber: value.taxNumber.trim() || DEFAULT_PAY_SETTINGS.taxNumber,
  };
  const { error } = await supabase
    .from("pay_settings")
    .upsert({ id: 1, data: clean as unknown as Json }, { onConflict: "id" });
  if (error) throw error;
  cache = clean;
}
