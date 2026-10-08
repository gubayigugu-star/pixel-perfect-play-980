import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { research } from "@/lib/ai.functions";
import { actions } from "@/lib/store";
import { prefillSearch } from "@/lib/search";
import { ErrorNote, PageHeader, Thinking } from "@/components/AppShell";
import { Btn, Chips, Label } from "@/components/ui-flow";

export const Route = createFileRoute("/research")({
  validateSearch: prefillSearch,
  head: () => ({
    meta: [
      { title: "AI Research Assistant — FlowAI" },
      { name: "description", content: "Ask a question and get an executive summary, key findings, analysis, limitations and sources." },
      { property: "og:title", content: "AI Research Assistant — FlowAI" },
      { property: "og:description", content: "Structured AI research reports with findings and sources." },
    ],
  }),
  component: ResearchPage,
});

function ResearchPage() {
  const { prefill } = Route.useSearch();
  const [q, setQ] = useState(prefill ?? "");
  const [depth, setDepth] = useState("Standard");
  const [format, setFormat] = useState("Report");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  useEffect(() => { if (prefill) setQ(prefill); }, [prefill]);

  async function go() {
    if (!q.trim()) return setErr("Ask a research question first.");
    setBusy(true); setErr(null);
    const r = await research({ data: { question: q, depth, format } });
    setBusy(false);
    if (!r.ok) return setErr(r.error);
    setOut(r.data);
    setSavedId(actions.addHistory({ kind: "research", title: q.slice(0, 90), content: r.data }));
  }

  const summary = (out.split(/##\s*Key findings/i)[0] ?? "").slice(0, 2500);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Research" title="AI Research Assistant" />
      <div className="glass space-y-4 p-5">
        <div>
          <Label>Research question</Label>
          <textarea value={q} onChange={(e) => setQ(e.target.value)} rows={3} className="field resize-y" placeholder="e.g. What are the most effective customer retention strategies for small e-commerce stores?" />
        </div>
        <div className="flex flex-wrap gap-6">
          <div><Label>Depth</Label><Chips options={["Quick", "Standard", "Deep"]} value={depth} onChange={setDepth} /></div>
          <div><Label>Format</Label><Chips options={["Report", "Bullet points", "Brief", "Comparison table"]} value={format} onChange={setFormat} /></div>
        </div>
        <Btn variant="primary" disabled={busy} onClick={go}>{busy ? "Researching…" : "Research"}</Btn>
        {err && <ErrorNote msg={err} />}
      </div>
      {busy && <Thinking label={depth === "Deep" ? "Running deep research — this can take a minute…" : "Researching…"} />}
      {out && !busy && (
        <div className="glass p-6">
          <div className="mb-4 flex flex-wrap gap-2">
            <Btn onClick={() => { navigator.clipboard.writeText(out); toast.success("Copied"); }}>Copy</Btn>
            <Btn onClick={() => savedId && (actions.toggleFavorite(savedId), toast.success("Toggled favorite"))}>★ Favorite</Btn>
            <Link to="/planner" search={{ prefill: `Create an action plan based on this research:\n${summary}` }} className="inline-flex items-center rounded-[10px] px-3.5 py-2 text-[13px] text-accent hover:bg-glass">→ Task plan</Link>
            <Link to="/email" search={{ prefill: `Share these research findings:\n${summary}` }} className="inline-flex items-center rounded-[10px] px-3.5 py-2 text-[13px] text-accent hover:bg-glass">→ Email</Link>
          </div>
          <div className="prose-flow text-[14px]"><ReactMarkdown>{out}</ReactMarkdown></div>
        </div>
      )}
    </div>
  );
}
