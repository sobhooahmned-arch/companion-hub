import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string(),
      }),
    )
    .max(20),
  image: z.string().nullable(),
});

const SYSTEM = `أنت موظف دعم فني في منصة "Easy Money" للاستثمار في مصر.
- رد دائماً باللهجة المصرية البسيطة وباختصار (سطرين إلى أربعة أسطر).
- المنصة فيها: إيداع، سحب (اتصالات كاش، أورانج كاش، وي كاش، انستا باي)، باقات استثمار صغيرة وضخمة، سوق العملات، وإشعارات.
- لو المستخدم بعت صورة (إيصال دفع أو مشكلة في الشاشة)، حللها واشرح اللي ظاهر فيها ووجهه للخطوة الصح.
- لو الطلب محتاج تدخل الإدارة (تعديل رصيد، تأكيد تحويل، مشكلة حساب)، طمّنه وقول إن الطلب اتسجل وهيتم مراجعته من فريق الإدارة.
- متطلبش بيانات حساسة زي كلمة السر أو كود التحويل السري.`;

export const askSupportAI = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const messages = data.history.map((m, i) => {
      const isLast = i === data.history.length - 1;
      if (m.role === "assistant") {
        return {
          role: "assistant",
          content: [{ type: "output_text", text: m.text }],
        };
      }
      const content: Array<Record<string, unknown>> = [
        { type: "input_text", text: m.text || "شوف الصورة دي من فضلك" },
      ];
      if (isLast && data.image) {
        content.push({ type: "input_image", image_url: data.image });
      }
      return { role: "user", content };
    });

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions: SYSTEM,
        input: messages,
        stream: true,
        store: false,
        reasoning: { effort: "low", summary: "auto" },
      }),
    });

    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => "");
      return {
        ok: false as const,
        status: res.status,
        text: "",
        detail: detail.slice(0, 300),
      };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let out = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload) as {
            type?: string;
            delta?: string;
            response?: { output_text?: string };
          };
          if (evt.type === "response.output_text.delta" && evt.delta) {
            out += evt.delta;
          } else if (evt.type === "response.completed" && !out) {
            out = evt.response?.output_text ?? "";
          }
        } catch {
          // ignore malformed chunk
        }
      }
    }

    return { ok: true as const, status: 200, text: out.trim(), detail: "" };
  });
