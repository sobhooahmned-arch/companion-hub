import { supabase } from "@/integrations/supabase/client";
import { updateBalance } from "@/lib/store";

export type Subscription = {
  identifier: string;
  amount: number;
  returnAmount: number;
  durationMs: number;
  startedAt: number;
  tax: number;
  taxPaid?: boolean;
  taxSenderNumber?: string;
  taxProofName?: string;
  taxSubmittedAt?: string;
  credited?: boolean;
};

/** رقم استلام الضريبة */
export const TAX_PHONE = "01208895415";

/** ضريبة كل باقة حسب مبلغ الباقة */
export const PACKAGE_TAX: Record<number, number> = {
  300: 500,
  700: 950,
  1500: 2800,
  5000: 6500,
  8000: 10000,
  12000: 16500,
  20000: 22000,
};

type Row = {
  identifier: string;
  amount: number;
  return_amount: number;
  duration_ms: number;
  started_at: number;
  tax: number;
  tax_paid: boolean;
  tax_sender_number: string | null;
  tax_proof_name: string | null;
  tax_submitted_at: string | null;
  credited: boolean;
};

function map(r: Row): Subscription {
  const sub: Subscription = {
    identifier: r.identifier,
    amount: r.amount,
    returnAmount: r.return_amount,
    durationMs: Number(r.duration_ms),
    startedAt: Number(r.started_at),
    tax: r.tax,
    taxPaid: r.tax_paid,
    credited: r.credited,
  };
  if (r.tax_sender_number) sub.taxSenderNumber = r.tax_sender_number;
  if (r.tax_proof_name) sub.taxProofName = r.tax_proof_name;
  if (r.tax_submitted_at) sub.taxSubmittedAt = r.tax_submitted_at;
  return sub;
}

function norm(v: string) {
  return v.trim().toLowerCase();
}

/** كل الاشتراكات المسجلة (للوحة الإدارة) */
export async function getSubscriptions(): Promise<Subscription[]> {
  const { data, error } = await supabase.from("subscriptions").select("*");
  if (error) throw error;
  return (data ?? []).map(map);
}

export async function getSubscription(identifier: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .ilike("identifier", identifier.trim())
    .limit(1);
  if (error) throw error;
  const row = data?.[0];
  return row ? map(row) : null;
}

export async function subscribe(input: {
  identifier: string;
  amount: number;
  returnAmount: number;
  durationMs: number;
}): Promise<Subscription> {
  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        identifier: input.identifier,
        amount: input.amount,
        return_amount: input.returnAmount,
        duration_ms: Math.round(input.durationMs),
        started_at: Date.now(),
        tax: PACKAGE_TAX[input.amount] ?? 0,
        tax_paid: false,
        tax_sender_number: null,
        tax_proof_name: null,
        tax_submitted_at: null,
        credited: false,
      },
      { onConflict: "identifier" },
    )
    .select()
    .single();
  if (error) throw error;
  return map(data);
}

export async function submitTaxProof(input: {
  identifier: string;
  senderNumber: string;
  proofName: string;
}) {
  const { error } = await supabase
    .from("subscriptions")
    .update({
      tax_paid: true,
      tax_sender_number: input.senderNumber,
      tax_proof_name: input.proofName,
      tax_submitted_at: new Date().toISOString(),
    })
    .ilike("identifier", input.identifier.trim());
  if (error) throw error;
}

/** نسبة اكتمال الباقة من 0 إلى 1 */
export function progressOf(sub: Subscription, now = Date.now()): number {
  if (sub.durationMs <= 0) return 1;
  return Math.min(1, Math.max(0, (now - sub.startedAt) / sub.durationMs));
}

/** الأرباح الحالية: تزيد من مبلغ الباقة حتى مبلغ الاستلام خلال مدة الباقة */
export function currentProfit(sub: Subscription, now = Date.now()): number {
  const p = progressOf(sub, now);
  return sub.amount + (sub.returnAmount - sub.amount) * p;
}

export function remainingMs(sub: Subscription, now = Date.now()): number {
  return Math.max(0, sub.startedAt + sub.durationMs - now);
}

/**
 * تحويل أرباح الباقة للمحفظة تلقائياً بعد انتهاء مدتها (مرة واحدة فقط).
 * يرجع المبلغ المضاف أو null لو لم يحن الوقت أو تمت الإضافة سابقاً.
 */
export async function settleSubscription(identifier: string): Promise<number | null> {
  const sub = await getSubscription(identifier);
  if (!sub || sub.credited || progressOf(sub) < 1) return null;
  const { error } = await supabase
    .from("subscriptions")
    .update({ credited: true })
    .ilike("identifier", identifier.trim());
  if (error) throw error;
  await updateBalance(identifier, sub.returnAmount);
  return sub.returnAmount;
}

export function formatRemaining(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
