import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { generateEmail } from "@/lib/ai.functions";
import { actions, useStore } from "@/lib/store";
import { prefillSearch } from "@/lib/search";
import { ErrorNote, PageHeader, Thinking } from "@/components/AppShell";
import { Btn, Chips, Label } from "@/components/ui-flow";

export const Route = createFileRoute("/email")({
  validateSearch: prefillSearch,
  head: () => ({
    meta: [
      { title: "Smart Email Generator — FlowAI" },
      { name: "description", content: "Describe what you want to say and get a clear, natural email in the right tone and length." },
      { property: "og:title", content: "Smart Email Generator — FlowAI" },
      { property: "og:description", content: "AI-written emails in your chosen type, tone and length." },
    ],
  }),
  component: EmailPage,
});

const TYPES = ["Follow-up", "Request", "Update", "Introduction", "Thank you", "Apology", "Cold outreach"];
const TONES = ["Professional", "Friendly", "Formal", "Casual", "Persuasive", "Empathetic"];
const LENGTHS = ["Short", "Medium", "Long"];

function EmailPage() {
  const { prefill } = Route.useSearch();
  const { settings } = useStore();
  const [message, setMessage] = useState(prefill ?? "");
  const [type, setType] = useState(TYPES[0]);
  const [tone, setTone] = useState(settings.defaultTone);
  const [length, setLength] = useState("Medium");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [instr, setInstr] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => { if (prefill) setMessage(prefill); }, [prefill]);

  async function go(improve = false) {
    if (!message.trim()) return setErr("Tell me what you want to say first.");
    setBusy(true); setErr(null);
    const r = await generateEmail({
      data: { message, type, tone, length, ...(improve && body ? { current: `Subject: ${subject}\n\n${body}`, instruction: instr } : {}) },
    });
    setBusy(false);
    if (!r.ok) return setErr(r.error);
    setSubject(r.data.subject); setBody(r.data.body); setInstr("");
    setSavedId(actions.addHistory({ kind: "email", title: r.data.subject, content: `Subject: ${r.data.subject}\n\n${r.data.body}` }));
  }

  const full = `Subject: ${subject}\n\n${body}`;
  function exportTxt() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([full], { type: "text/plain" }));
    a.download = `${subject || "email"}.txt`;
    a.click();
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Communicate" title="Smart Email Generator" />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="glass space-y-5 p-5 lg:col-span-2">
          <div>
            <Label>What do you want to say?</Label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={7} className="field resize-y" placeholder="e.g. Tell Sam the report will be two days late because we're waiting on Q3 numbers, and ask if Friday works." />
          </div>
          <div><Label>Type</Label><Chips options={TYPES} value={type} onChange={setType} /></div>
          <div><Label>Tone</Label><Chips options={TONES} value={tone} onChange={setTone} /></div>
          <div><Label>Length</Label><Chips options={LENGTHS} value={length} onChange={setLength} /></div>
          <Btn variant="primary" className="w-full" disabled={busy} onClick={() => go(false)}>{busy ? "Writing…" : body ? "Regenerate" : "Generate email"}</Btn>
          {err && <ErrorNote msg={err} />}
        </div>
        <div className="space-y-4 lg:col-span-3">
          {busy && !body && <Thinking label="Writing your email…" />}
          {!body && !busy && <div className="glass p-8 text-center text-[13px] text-muted-foreground">Your email will appear here — fully editable.</div>}
          {body && (
            <div className="glass space-y-3 p-5">
              <input value={subject} onChange={(e) => setSubject(e.target.value)} className="field font-medium" />
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={14} className="field resize-y leading-relaxed" />
              <div className="flex flex-col gap-2 sm:flex-row">
                <input value={instr} onChange={(e) => setInstr(e.target.value)} className="field" placeholder="Improve: e.g. make it warmer, add a clear ask…" />
                <Btn disabled={busy} onClick={() => go(true)}>{busy ? "Improving…" : "Improve"}</Btn>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Btn onClick={() => { navigator.clipboard.writeText(full); toast.success("Copied to clipboard"); }}>Copy</Btn>
                <Btn onClick={() => { if (savedId) { actions.toggleFavorite(savedId); toast.success("Toggled favorite"); } }}>★ Favorite</Btn>
                <Btn onClick={exportTxt}>Export .txt</Btn>
                <a className="inline-flex items-center rounded-[10px] px-3.5 py-2 text-[13px] text-muted-foreground hover:bg-glass hover:text-foreground" href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}>Open in mail app</a>
                <Link to="/planner" search={{ prefill: `Tasks from this email:\n${full}` }} className="ml-auto inline-flex items-center rounded-[10px] px-3.5 py-2 text-[13px] text-accent hover:bg-glass">→ Turn into tasks</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
