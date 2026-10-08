import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import avatar from "@/assets/avatar.jpg";
import { askAssistant } from "@/lib/ai.functions";
import { actions, kindLabel, timeAgo, useStore } from "@/lib/store";
import { ErrorNote } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FlowAI — AI productivity dashboard" },
      { name: "description", content: "Write emails, plan goals and research topics with AI — then turn answers into action." },
      { property: "og:title", content: "FlowAI — AI productivity dashboard" },
      { property: "og:description", content: "Write emails, plan goals and research topics with AI in one workspace." },
    ],
  }),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Dashboard() {
  const { history, tasks, settings } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const done = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = tasks.filter((t) => !t.done && t.deadline < today);
  const focus = [...tasks].filter((t) => !t.done).sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 4);
  const weekAgo = Date.now() - 7 * 864e5;
  const week = history.filter((h) => h.createdAt > weekAgo);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim() || busy) return;
    setBusy(true); setErr(null); setAnswer(null);
    const r = await askAssistant({ data: { prompt: q } });
    setBusy(false);
    if (!r.ok) return setErr(r.error);
    setAnswer(r.data);
    actions.addHistory({ kind: "assistant", title: q.slice(0, 80), content: r.data });
  }

  const suggestion = overdue.length
    ? { text: `${overdue.length} ${overdue.length === 1 ? "task is" : "tasks are"} overdue. Draft a follow-up email about the delay?`, cta: "Draft email", go: () => navigate({ to: "/email", search: { prefill: `Update on delayed tasks:\n${overdue.map((t) => `- ${t.title}`).join("\n")}` } }) }
    : tasks.length === 0
      ? { text: "You don't have a plan yet. Give me a goal and I'll break it into milestones and tasks.", cta: "Plan a goal", go: () => navigate({ to: "/planner" }) }
      : { text: "Your plan is on track. Want me to research anything that could help with the next task?", cta: "Research", go: () => navigate({ to: "/research", search: { prefill: focus[0] ? `How do I best approach: ${focus[0].title}` : "" } }) };

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <h1 className="mt-1 text-balance text-[34px] font-semibold leading-none tracking-tight sm:text-[40px]">
            {greeting()}{settings.name && settings.name !== "there" ? `, ${settings.name}` : ""}.
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-glass px-3 py-1.5 text-[12px] ring-1 ring-border">
            <span className="size-2 rounded-full bg-accent" /> {tasks.length - done} open tasks
          </div>
          <Link to="/settings"><img src={avatar} alt="Profile" width={44} height={44} className="size-11 rounded-full object-cover ring-1 ring-border" /></Link>
        </div>
      </header>

      <form onSubmit={ask} className="relative mt-6 overflow-hidden rounded-[18px] bg-glass p-1 ring-1 ring-border backdrop-blur-md">
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 -rotate-12 rounded-[16px] bg-gradient-soft" />
        <div className="relative flex flex-col gap-3 rounded-[14px] bg-surface/80 p-3 ring-1 ring-border sm:flex-row sm:items-center">
          <input value={q} onChange={(e) => setQ(e.target.value)} className="w-full flex-1 bg-transparent px-2 py-2 text-[14px] outline-none placeholder:text-muted-foreground" placeholder="Ask FlowAI anything — draft, plan, or research…" />
          <button disabled={busy} className="flex items-center justify-center gap-2 self-start rounded-[10px] bg-accent px-4 py-2 text-[13px] font-medium text-accent-foreground ring-1 ring-accent transition-transform hover:scale-[1.02] disabled:opacity-60 sm:self-auto">
            {busy ? "Thinking…" : "Ask"}
          </button>
        </div>
      </form>
      {err && <div className="mt-3"><ErrorNote msg={err} /></div>}
      {answer && (
        <div className="glass mt-3 p-5">
          <div className="prose-flow text-[14px]"><ReactMarkdown>{answer}</ReactMarkdown></div>
          <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
            <Link to="/email" search={{ prefill: answer }} className="rounded-full px-3 py-1 ring-1 ring-border hover:bg-glass">→ Email</Link>
            <Link to="/planner" search={{ prefill: answer }} className="rounded-full px-3 py-1 ring-1 ring-border hover:bg-glass">→ Task plan</Link>
            <Link to="/research" search={{ prefill: q }} className="rounded-full px-3 py-1 ring-1 ring-border hover:bg-glass">→ Deep research</Link>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { to: "/email" as const, t: "Write email", s: "Draft, tone, send" },
          { to: "/planner" as const, t: "Plan goal", s: "Break into steps" },
          { to: "/research" as const, t: "Research", s: "Summarize sources" },
        ].map((a) => (
          <Link key={a.to} to={a.to} className="glass glass-hover rounded-[14px] p-4">
            <div className="text-[13px] font-medium">{a.t}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{a.s}</div>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="glass p-5">
            <div className="flex items-center justify-between">
              <div className="text-[15px] font-semibold">Today's focus</div>
              <div className="text-[12px] text-muted-foreground">{done} of {tasks.length} done</div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-glass"><div className="h-full rounded-full bg-gradient-accent transition-all" style={{ width: `${pct}%` }} /></div>
            <div className="mt-4 space-y-3">
              {focus.length === 0 && <div className="text-[13px] text-muted-foreground">No open tasks. <Link to="/planner" className="text-accent">Plan a goal →</Link></div>}
              {focus.map((t) => (
                <button key={t.id} onClick={() => actions.updateTask(t.id, { done: true })} className="flex w-full items-center gap-3 text-left">
                  <span className="size-5 shrink-0 rounded-full ring-1 ring-border hover:ring-accent" />
                  <div className="min-w-0">
                    <div className="truncate text-[14px]">{t.title}</div>
                    <div className={`text-[11px] ${t.deadline < today ? "text-destructive" : "text-muted-foreground"}`}>{t.milestone} · due {t.deadline}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="glass p-5">
            <div className="flex items-center justify-between">
              <div className="text-[15px] font-semibold">Recent activity</div>
              <Link to="/history" className="text-[12px] text-muted-foreground hover:text-foreground">View all</Link>
            </div>
            <div className="mt-3 space-y-2 text-[13px]">
              {history.length === 0 && <div className="text-muted-foreground">Nothing yet — your AI results will appear here.</div>}
              {history.slice(0, 5).map((h) => (
                <div key={h.id} className="flex items-center justify-between gap-4">
                  <span className="truncate">{h.title}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{kindLabel[h.kind]} · {timeAgo(h.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="glass p-5">
            <div className="text-[15px] font-semibold">This week</div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Stat n={done} l="tasks done" />
              <Stat n={week.filter((h) => h.kind === "email").length} l="emails drafted" />
              <Stat n={week.filter((h) => h.kind === "research").length} l="research reports" />
              <Stat n={`${pct}%`} l="plan complete" accent />
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[16px] bg-gradient-soft p-5 ring-1 ring-border">
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rotate-12 rounded-[12px] bg-accent/25" />
            <div className="text-[12px] font-medium uppercase tracking-[0.16em] text-accent">AI suggests</div>
            <div className="mt-2 text-[14px] font-medium leading-6">{suggestion.text}</div>
            <button onClick={suggestion.go} className="mt-4 rounded-[10px] bg-glass-strong px-3 py-2 text-[13px] font-medium ring-1 ring-border hover:bg-glass">{suggestion.cta}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ n, l, accent }: { n: number | string; l: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[26px] font-semibold leading-none">{n}</div>
      <div className={`mt-1 text-[11px] ${accent ? "text-accent" : "text-muted-foreground"}`}>{l}</div>
    </div>
  );
}
