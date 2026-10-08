import { z } from "zod";
export const prefillSearch = (s: Record<string, unknown>) =>
  z.object({ prefill: z.string().optional().catch(undefined) }).parse(s);
