import { useEffect } from "react";
import { clearStoredUser, getStoredUser } from "@/lib/auth";
import { findAccount } from "@/lib/store";

/** يطرد المستخدم المحظور من أي صفحة */
export function BanGuard() {
  useEffect(() => {
    const check = async () => {
      const u = getStoredUser();
      if (!u || u.isAdmin) return;
      const acc = await findAccount(u.identifier).catch(() => null);
      if (acc?.banned) {
        clearStoredUser();
        window.alert("تم حظر حسابك من المنصة.");
        window.location.href = "/";
      }
    };
    void check();
    const id = window.setInterval(() => void check(), 5000);
    return () => window.clearInterval(id);
  }, []);
  return null;
}
