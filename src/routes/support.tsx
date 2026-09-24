import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Headset, Send } from "lucide-react";
import { getStoredUser, type StoredUser } from "@/lib/auth";
import { sendUserMessage, threadOf, type SupportMessage } from "@/lib/support";
import { NotificationToasts } from "@/components/NotificationToasts";
import { useNotifications } from "@/hooks/use-notifications";

export const Route = createFileRoute("/support")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "الدعم الفني | Easy Money" },
      {
        name: "description",
        content: "تواصل مع فريق دعم Easy Money واكتب مشكلتك ليتم الرد عليها من الإدارة.",
      },
      { property: "og:title", content: "الدعم الفني | Easy Money" },
      {
        property: "og:description",
        content: "اكتب مشكلتك وسيتم التواصل معك من فريق الدعم في أسرع وقت.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SupportPage,
});

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function SupportPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [msgs, setMsgs] = useState<SupportMessage[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const { toasts, dismiss } = useNotifications(user?.identifier ?? null);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      navigate({ to: "/", replace: true });
      return;
    }
    if (u.isAdmin) {
      navigate({ to: "/admin", replace: true });
      return;
    }
    setUser(u);
    setMsgs(threadOf(u.identifier));
    const id = window.setInterval(() => setMsgs(threadOf(u.identifier)), 2000);
    return () => window.clearInterval(id);
  }, [navigate]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  if (!user) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value || !user) return;
    sendUserMessage({ identifier: user.identifier, name: user.name, text: value });
    setText("");
    setMsgs(threadOf(user.identifier));
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate({ to: "/market" })}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
            aria-label="العودة للسوق"
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Headset className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">الدعم الفني</p>
            <p className="text-xs text-muted-foreground">اكتب مشكلتك وهيتم الرد عليك</p>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 space-y-3 px-4 py-5">
        {msgs.length === 0 && (
          <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            أهلاً {user.name} 👋 اكتب مشكلتك هنا وفريق الدعم هيتواصل معك.
          </p>
        )}
        {msgs.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.from === "user" ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                m.from === "user"
                  ? "bg-primary text-primary-foreground"
                  : m.from === "admin"
                    ? "border border-verified/40 bg-verified/10 text-foreground"
                    : "border border-border bg-card text-muted-foreground"
              }`}
            >
              {m.from !== "user" && (
                <p className="mb-0.5 text-[11px] font-bold opacity-80">
                  {m.from === "admin" ? "الدعم الفني" : "رسالة تلقائية"}
                </p>
              )}
              <p className="whitespace-pre-wrap">{m.text}</p>
              <p className="mt-1 text-[10px] opacity-70">{fmtTime(m.at)}</p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={submit}
        className="sticky bottom-0 border-t border-border bg-background/95 px-4 py-3 backdrop-blur"
      >
        <div className="mx-auto flex max-w-3xl gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="اكتب مشكلتك..."
            className="flex-1 rounded-xl border border-input bg-background/60 px-3 py-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            aria-label="إرسال"
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </form>
      <NotificationToasts items={toasts} onDismiss={dismiss} />
    </main>
  );
}
