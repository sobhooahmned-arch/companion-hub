import { useEffect, useState } from "react";
import {
  ensureDevicePermission,
  showDeviceNotification,
  takeUnseen,
  type AppNotification,
} from "@/lib/notify";

/**
 * يراقب إشعارات المستخدم: يعرضها داخل الصفحة 10 ثواني
 * ويرسل إشعار على الهاتف في نفس اللحظة.
 */
export function useNotifications(identifier: string | null) {
  const [toasts, setToasts] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!identifier) return;
    ensureDevicePermission();

    const check = () => {
      const fresh = takeUnseen(identifier);
      if (fresh.length === 0) return;
      for (const n of fresh) showDeviceNotification(n.title, n.text);
      setToasts((prev) => [...prev, ...fresh]);
      const ids = fresh.map((n) => n.id);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => !ids.includes(t.id)));
      }, 10000);
    };

    check();
    const id = window.setInterval(check, 1500);
    return () => window.clearInterval(id);
  }, [identifier]);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return { toasts, dismiss };
}
