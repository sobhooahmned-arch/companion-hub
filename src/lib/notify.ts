import { supabase } from "@/integrations/supabase/client";

export type AppNotification = {
  id: string;
  identifier: string;
  title: string;
  text: string;
  at: string;
  seen: boolean;
};

type Row = {
  id: string;
  identifier: string;
  title: string;
  text: string;
  at: string;
  seen: boolean;
};

function map(r: Row): AppNotification {
  return { id: r.id, identifier: r.identifier, title: r.title, text: r.text, at: r.at, seen: r.seen };
}

/** إضافة إشعار لمستخدم معيّن */
export async function pushNotification(input: {
  identifier: string;
  title: string;
  text: string;
}) {
  const { error } = await supabase.from("notifications").insert({
    identifier: input.identifier,
    title: input.title,
    text: input.text,
    seen: false,
  });
  if (error) throw error;
}

/** الإشعارات الجديدة للمستخدم، ويتم تعليمها كمقروءة */
export async function takeUnseen(identifier: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .ilike("identifier", identifier.trim())
    .eq("seen", false)
    .order("at", { ascending: true });
  if (error || !data || data.length === 0) return [];
  const ids = data.map((n) => n.id);
  await supabase.from("notifications").update({ seen: true }).in("id", ids);
  return data.map(map);
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
