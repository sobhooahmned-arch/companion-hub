import { supabase } from "@/integrations/supabase/client";
import { pushNotification } from "@/lib/notify";
import { norm } from "@/lib/store";

export type SupportMessage = {
  id: string;
  identifier: string;
  name: string;
  from: "user" | "admin" | "system" | "ai";
  text: string;
  /** صورة مرفقة (data URL) */
  image?: string;
  at: string;
};

export const AUTO_REPLY =
  "يرجى الانتظار، تم الاطلاع على مشكلتك وسوف يتم التواصل معك في أسرع وقت.";

type Row = {
  id: string;
  identifier: string;
  name: string;
  sender: string;
  text: string;
  image: string | null;
  at: string;
};

function map(r: Row): SupportMessage {
  const msg: SupportMessage = {
    id: r.id,
    identifier: r.identifier,
    name: r.name,
    from: (r.sender as SupportMessage["from"]) ?? "user",
    text: r.text,
    at: r.at,
  };
  if (r.image) msg.image = r.image;
  return msg;
}

export async function getAllMessages(): Promise<SupportMessage[]> {
  const { data, error } = await supabase
    .from("support_messages")
    .select("*")
    .order("at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(map);
}

export async function threadOf(identifier: string): Promise<SupportMessage[]> {
  const { data, error } = await supabase
    .from("support_messages")
    .select("*")
    .ilike("identifier", identifier.trim())
    .order("at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(map);
}

export type SupportThread = {
  identifier: string;
  name: string;
  messages: SupportMessage[];
  lastAt: string;
  waiting: boolean;
};

export async function getThreads(): Promise<SupportThread[]> {
  const all = await getAllMessages();
  const mapByUser = new Map<string, SupportMessage[]>();
  for (const m of all) {
    const key = norm(m.identifier);
    mapByUser.set(key, [...(mapByUser.get(key) ?? []), m]);
  }
  return [...mapByUser.values()]
    .map((messages) => {
      const last = messages[messages.length - 1]!;
      const lastUser = [...messages].reverse().find((m) => m.from === "user");
      const lastAdmin = [...messages].reverse().find((m) => m.from === "admin");
      return {
        identifier: last.identifier,
        name: last.name,
        messages,
        lastAt: last.at,
        waiting: !!lastUser && (!lastAdmin || lastAdmin.at < lastUser.at),
      };
    })
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

async function push(msg: Omit<SupportMessage, "id" | "at">) {
  const { error } = await supabase.from("support_messages").insert({
    identifier: msg.identifier,
    name: msg.name,
    sender: msg.from,
    text: msg.text,
    image: msg.image ?? null,
  });
  if (error) throw error;
}

/** رسالة من المستخدم + رد تلقائي فوري */
export async function sendUserMessage(input: {
  identifier: string;
  name: string;
  text: string;
}) {
  await push({ ...input, from: "user" });
  await push({
    identifier: input.identifier,
    name: input.name,
    from: "system",
    text: AUTO_REPLY,
  });
}

export async function sendAdminReply(input: {
  identifier: string;
  name: string;
  text: string;
}) {
  await push({ ...input, from: "admin" });
  await pushNotification({
    identifier: input.identifier,
    title: "رد الدعم الفني",
    text: `تم الرد على طلبك من الدعم الفني: ${input.text}`,
  });
}
