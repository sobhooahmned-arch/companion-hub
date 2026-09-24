import { supabase } from "@/integrations/supabase/client";

export const ADMIN_ID = "admin";

export type Account = {
  identifier: string;
  method: "email" | "phone";
  name: string;
  password: string;
  balance: number;
  createdAt: string;
};

export type MoneyRequest = {
  id: string;
  identifier: string;
  name: string;
  kind: "deposit" | "withdraw";
  amount: number;
  status: "pending" | "approved" | "rejected";
  at: string;
  decidedAt?: string;
  proof?: string;
  proofName?: string;
  fromNumber?: string;
};

export function norm(v: string) {
  return v.trim().toLowerCase();
}

type AccountRow = {
  identifier: string;
  method: string;
  name: string;
  password: string;
  balance: number;
  created_at: string;
};

type RequestRow = {
  id: string;
  identifier: string;
  name: string;
  kind: string;
  amount: number;
  status: string;
  at: string;
  decided_at: string | null;
  proof: string | null;
  proof_name: string | null;
  from_number: string | null;
};

function mapAccount(r: AccountRow): Account {
  return {
    identifier: r.identifier,
    method: r.method === "phone" ? "phone" : "email",
    name: r.name,
    password: r.password,
    balance: r.balance,
    createdAt: r.created_at,
  };
}

function mapRequest(r: RequestRow): MoneyRequest {
  const req: MoneyRequest = {
    id: r.id,
    identifier: r.identifier,
    name: r.name,
    kind: r.kind === "withdraw" ? "withdraw" : "deposit",
    amount: r.amount,
    status: (r.status as MoneyRequest["status"]) ?? "pending",
    at: r.at,
  };
  if (r.decided_at) req.decidedAt = r.decided_at;
  if (r.proof) req.proof = r.proof;
  if (r.proof_name) req.proofName = r.proof_name;
  if (r.from_number) req.fromNumber = r.from_number;
  return req;
}

export async function getAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select("identifier, method, name, password, balance, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapAccount);
}

export async function findAccount(identifier: string): Promise<Account | null> {
  const { data, error } = await supabase
    .from("accounts")
    .select("identifier, method, name, password, balance, created_at")
    .ilike("identifier", identifier.trim())
    .limit(1);
  if (error) throw error;
  const row = data?.[0];
  return row ? mapAccount(row) : null;
}

export async function createAccount(input: {
  identifier: string;
  method: "email" | "phone";
  name: string;
  password: string;
}): Promise<Account> {
  const { data, error } = await supabase
    .from("accounts")
    .insert({
      identifier: input.identifier.trim(),
      method: input.method,
      name: input.name.trim(),
      password: input.password,
      balance: 0,
    })
    .select("identifier, method, name, password, balance, created_at")
    .single();
  if (error) throw error;
  return mapAccount(data);
}

export async function updateBalance(identifier: string, delta: number): Promise<number> {
  const account = await findAccount(identifier);
  if (!account) return 0;
  const next = Math.max(0, account.balance + delta);
  const { error } = await supabase
    .from("accounts")
    .update({ balance: next })
    .ilike("identifier", identifier.trim());
  if (error) throw error;
  return next;
}

export async function getBalance(identifier: string): Promise<number> {
  const account = await findAccount(identifier);
  return account?.balance ?? 0;
}

export async function getRequests(): Promise<MoneyRequest[]> {
  const { data, error } = await supabase
    .from("money_requests")
    .select("*")
    .order("at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRequest);
}

export async function addRequest(input: {
  identifier: string;
  name: string;
  kind: "deposit" | "withdraw";
  amount: number;
  proof?: string;
  proofName?: string;
  fromNumber?: string;
}): Promise<MoneyRequest> {
  const { data, error } = await supabase
    .from("money_requests")
    .insert({
      identifier: input.identifier,
      name: input.name,
      kind: input.kind,
      amount: input.amount,
      status: "pending",
      proof: input.proof ?? null,
      proof_name: input.proofName ?? null,
      from_number: input.fromNumber ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRequest(data);
}

export async function setRequestStatus(id: string, status: "approved" | "rejected") {
  const { error } = await supabase
    .from("money_requests")
    .update({ status, decided_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteRequest(id: string) {
  const { error } = await supabase.from("money_requests").delete().eq("id", id);
  if (error) throw error;
}

export const DEPOSIT_BAN_MS = 15 * 60 * 1000;

export async function userRequests(identifier: string): Promise<MoneyRequest[]> {
  const { data, error } = await supabase
    .from("money_requests")
    .select("*")
    .ilike("identifier", identifier.trim())
    .order("at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRequest);
}

/** طلب إيداع قيد المراجعة للمستخدم (إن وجد) */
export async function pendingDeposit(identifier: string): Promise<MoneyRequest | null> {
  const reqs = await userRequests(identifier);
  return reqs.find((r) => r.kind === "deposit" && r.status === "pending") ?? null;
}

/** وقت انتهاء حظر الإيداع (timestamp) بعد رفض آخر طلب، أو null */
export async function depositBanUntil(identifier: string): Promise<number | null> {
  const reqs = await userRequests(identifier);
  const lastRejected = reqs
    .filter((r) => r.kind === "deposit" && r.status === "rejected" && r.decidedAt)
    .sort((a, b) => (b.decidedAt ?? "").localeCompare(a.decidedAt ?? ""))[0];
  if (!lastRejected?.decidedAt) return null;
  const until = new Date(lastRejected.decidedAt).getTime() + DEPOSIT_BAN_MS;
  return until > Date.now() ? until : null;
}
