/**
 * Client-side content protection.
 * Deters casual copying: no right-click and no devtools shortcuts.
 * No redirects or page wipes — inputs and typing are never affected.
 */
export function enableProtection() {
  if (typeof window === "undefined") return () => {};
  if (import.meta.env.DEV) return () => {};

  const stop = (e: Event) => {
    e.preventDefault();
    return false;
  };

  const onKey = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    const blocked =
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && ["i", "j", "c", "k"].includes(k)) ||
      (e.metaKey && e.altKey && ["i", "j", "c"].includes(k));
    if (blocked) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    return undefined;
  };

  document.addEventListener("contextmenu", stop);
  document.addEventListener("keydown", onKey, true);

  return () => {
    document.removeEventListener("contextmenu", stop);
    document.removeEventListener("keydown", onKey, true);
  };
}
