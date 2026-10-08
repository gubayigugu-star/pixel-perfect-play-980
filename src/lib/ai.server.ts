const GATEWAY = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";

export class AIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Streams a Responses call and returns the final output text. */
export async function callAI(opts: {
  instructions: string;
  input: string;
  schema?: { name: string; schema: Record<string, unknown> };
  effort?: "low" | "medium" | "high";
}): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AIError(401, "AI is not configured.");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      instructions: opts.instructions,
      input: opts.input,
      stream: true,
      store: false,
      reasoning: { effort: opts.effort ?? "low", summary: "auto" },
      include: ["reasoning.encrypted_content"],
      ...(opts.schema
        ? { text: { format: { type: "json_schema", name: opts.schema.name, strict: true, schema: opts.schema.schema } } }
        : {}),
    }),
  });
  if (!res.ok || !res.body) {
    let msg = `AI request failed (${res.status}).`;
    try {
      const j = await res.json();
      msg = j?.error?.message || j?.message || msg;
    } catch {}
    if (res.status === 429) msg = "Too many requests — please wait a moment and try again.";
    if (res.status === 402) msg = "AI credits are used up. Add credits in workspace billing to continue.";
    throw new AIError(res.status, msg);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const ev = JSON.parse(data);
        if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
        else if (ev.type === "response.failed" || ev.type === "error")
          throw new AIError(500, ev.response?.error?.message || ev.message || "AI generation failed.");
        else if (ev.type === "response.refusal.delta") throw new AIError(403, "The AI declined this request.");
      } catch (e) {
        if (e instanceof AIError) throw e;
      }
    }
  }
  if (!text.trim()) throw new AIError(500, "The AI returned an empty response.");
  return text;
}
