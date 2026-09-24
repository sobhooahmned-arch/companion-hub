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

const KEY = "em_support";

export const AUTO_REPLY =
  "يرجى الانتظار، تم الاطلاع على مشكلتك وسوف يتم التواصل معك في أسرع وقت.";

function read(): SupportMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SupportMessage[]) : [];
  } catch {
    return [];
  }
}

function write(list: SupportMessage[]) {
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

export function getAllMessages(): SupportMessage[] {
  return read().sort((a, b) => a.at.localeCompare(b.at));
}

export function threadOf(identifier: string): SupportMessage[] {
  const id = norm(identifier);
  return getAllMessages().filter((m) => norm(m.identifier) === id);
}

export type SupportThread = {
  identifier: string;
  name: string;
  messages: SupportMessage[];
  lastAt: string;
  waiting: boolean;
};

export function getThreads(): SupportThread[] {
  const map = new Map<string, SupportMessage[]>();
  for (const m of getAllMessages()) {
    const key = norm(m.identifier);
    map.set(key, [...(map.get(key) ?? []), m]);
  }
  return [...map.values()]
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

function push(msg: Omit<SupportMessage, "id" | "at">): SupportMessage {
  const full: SupportMessage = {
    ...msg,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
  };
  write([...read(), full]);
  return full;
}

/** رسالة من المستخدم + رد تلقائي فوري */
export function sendUserMessage(input: {
  identifier: string;
  name: string;
  text: string;
}) {
  push({ ...input, from: "user" });
  push({
    identifier: input.identifier,
    name: input.name,
    from: "system",
    text: AUTO_REPLY,
  });
}

export function sendAdminReply(input: {
  identifier: string;
  name: string;
  text: string;
}) {
  push({ ...input, from: "admin" });
  pushNotification({
    identifier: input.identifier,
    title: "رد الدعم الفني",
    text: `تم الرد على طلبك من الدعم الفني: ${input.text}`,
  });
}
