import { useEffect, useState } from "react";

// مدة عشوائية بين 5 و 7 ثواني
export function randomLoadingMs() {
  return 5000 + Math.floor(Math.random() * 2001);
}

const STEPS = [
  "جارٍ التحقق من البيانات…",
  "جارٍ معالجة الطلب…",
  "جارٍ تأمين العملية…",
  "الخطوة الأخيرة…",
];

export function LoadingDialog({
  open,
  title = "برجاء الانتظار",
}: {
  open: boolean;
  title?: string;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) {
      setStep(0);
      return;
    }
    const t = window.setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
    }, 1500);
    return () => window.clearInterval(t);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      role="alert"
      aria-live="assertive"
    >
      <div className="w-[300px] rounded-2xl border border-border bg-card px-8 py-7 text-center shadow-xl">
        <svg
          viewBox="0 0 24 24"
          className="mx-auto h-10 w-10 animate-spin text-primary"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" className="opacity-20" stroke="currentColor" strokeWidth="3" />
          <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <p className="mt-4 text-base font-bold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{STEPS[step]}</p>
      </div>
    </div>
  );
}
