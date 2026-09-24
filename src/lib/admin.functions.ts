import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const verifyAdmin = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ id: z.string().max(200), name: z.string().max(200), pw: z.string().max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const n = (v: string) => v.trim().toLowerCase();
    const ok =
      n(data.id) === "sex" &&
      n(data.name) === "sex" &&
      data.pw.trim() === "adminsex777";
    await new Promise((r) => setTimeout(r, 400));
    return { ok };
  });
