import { norm } from "@/lib/store";

export type AppNotification = {
  id: string;
  identifier: string;
  title: string;
  text: string;
  at: string;
  seen: boolean;
};

const KEY = "em_notifications";

function read(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

function write(list: AppNotification[]) {
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

/** إضافة إشعار لمستخدم معيّن */
export function pushNotification(input: {
  identifier: string;
  title: string;
  text: string;
}) {
  if (typeof window === "undefined") return;
  const item: AppNotification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    identifier: input.identifier,
    title: input.title,
    text: input.text,
    at: new Date().toISOString(),
    seen: false,
  };
  write([...read(), item].slice(-60));
}

/** الإشعارات الجديدة للمستخدم، ويتم تعليمها كمقروءة */
export function takeUnseen(identifier: string): AppNotification[] {
  const id = norm(identifier);
  const all = read();
  const unseen = all.filter((n) => !n.seen && norm(n.identifier) === id);
  if (unseen.length === 0) return [];
  write(all.map((n) => (unseen.some((u) => u.id === n.id) ? { ...n, seen: true } : n)));
  return unseen;
}

/** طلب إذن إشعارات الهاتف */
export function ensureDevicePermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    void Notification.requestPermission().catch(() => undefined);
  }
}

/** إظهار إشعار على الهاتف/الجهاز */
export function showDeviceNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, { body, icon: "/favicon.ico", lang: "ar", dir: "rtl" });
    window.setTimeout(() => n.close(), 10000);
  } catch {
    /* ignore */
  }
}
