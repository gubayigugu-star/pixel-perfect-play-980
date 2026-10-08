import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { planGoal } from "@/lib/ai.functions";
import { actions, tasksToText, uid, useStore, type Task } from "@/lib/store";
import { prefillSearch } from "@/lib/search";
import { ErrorNote, PageHeader, Thinking } from "@/components/AppShell";
import { Btn, Chips, Label } from "@/components/ui-flow";

export const Route = createFileRoute("/planner")({
  validateSearch: prefillSearch,
  head: () => ({
    meta: [
      { title: "AI Task Planner — FlowAI" },
      { name: "description", content: "Turn any goal into milestones, prioritized tasks, deadlines and time estimates." },
      { property: "og:title", content: "AI Task Planner — FlowAI" },
      { property: "og:description", content: "Turn any goal into an actionable, prioritized plan." },
    ],
  }),
  component: PlannerPage,
});

const prioColor = { high: "text-destructive", medium: "text-accent", low: "text-muted-foreground" };

function PlannerPage() {
  const { prefill } = Route.useSearch();
  const { tasks } = useStore();
  const [goal, setGoal] = useState(prefill ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  useEffect(() => { if (prefill) setGoal(prefill); }, [prefill]);

  async function go() {
    if (!goal.trim()) return setErr("Describe a goal first.");
    setBusy(true); setErr(null);
    const r = await planGoal({ data: { goal } });
    setBusy(false);
    if (!r.ok) return setErr(r.error);
    const plan = r.data;
    const add = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
    const created: Task[] = plan.milestones.flatMap((m) =>
      m.tasks.map((t) => ({
        id: uid(), milestone: m.title, title: t.title, priority: t.priority,
        deadline: add(Math.max(0, Math.round(t.deadlineDay))), estimateHours: t.estimateHours,
        dependsOn: t.dependsOn, subtasks: t.subtasks.map((s) => ({ title: s, done: false })), done: false, goal: plan.goal,
      })),
    );
    actions.addTasks(created);
    actions.addHistory({ kind: "plan", title: plan.goal, content: tasksToText(created) });
    setGoal("");
  }

  const shown = tasks.filter((t) => filter === "All" || (filter === "Open" ? !t.done : filter === "Done" ? t.done : t.priority === filter.toLowerCase()));
  const groups = useMemo(() => {
    const g = new Map<string, Task[]>();
    shown.forEach((t) => g.set(t.milestone, [...(g.get(t.milestone) ?? []), t]));
    return [...g.entries()];
  }, [shown]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Plan" title="AI Task Planner">
        {tasks.length > 0 && (
          <div className="flex gap-2">
            <Link to="/email" search={{ prefill: `Status update on my tasks:\n${tasksToText(tasks)}` }} className="rounded-[10px] px-3 py-2 text-[13px] text-accent hover:bg-glass">→ Email update</Link>
            <Btn variant="ghost" onClick={() => confirm("Delete all tasks?") && actions.clearTasks()}>Clear all</Btn>
          </div>
        )}
      </PageHeader>
      <div className="glass space-y-3 p-5">
        <Label>Your goal</Label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={2} className="field resize-y" placeholder="e.g. Launch my online store in 30 days" />
          <Btn variant="primary" disabled={busy} onClick={go} className="sm:self-start">{busy ? "Planning…" : "Generate plan"}</Btn>
        </div>
        {err && <ErrorNote msg={err} />}
      </div>
      {busy && <Thinking label="Breaking your goal into milestones…" />}
      {tasks.length > 0 && <Chips options={["All", "Open", "Done", "High", "Medium", "Low"]} value={filter} onChange={setFilter} />}
      {tasks.length === 0 && !busy && <div className="glass p-8 text-center text-[13px] text-muted-foreground">No tasks yet. Enter a goal and AI will build a plan.</div>}
      {groups.map(([m, list]) => {
        const d = list.filter((t) => t.done).length;
        return (
          <section key={m} className="glass p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">{m}</h2>
              <span className="text-[12px] text-muted-foreground">{d}/{list.length}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-glass"><div className="h-full bg-gradient-accent" style={{ width: `${(d / list.length) * 100}%` }} /></div>
            <div className="mt-4 divide-y divide-border">
              {list.map((t) => <TaskRow key={t.id} t={t} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function TaskRow({ t }: { t: Task }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-3">
      <div className="flex items-start gap-3">
        <button onClick={() => actions.updateTask(t.id, { done: !t.done })} className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ring-1 ${t.done ? "bg-accent/25 ring-accent/50" : "ring-border hover:ring-accent"}`}>
          {t.done && <span className="size-1.5 rounded-full bg-accent" />}
        </button>
        <div className="min-w-0 flex-1">
          <input value={t.title} onChange={(e) => actions.updateTask(t.id, { title: e.target.value })} className={`w-full bg-transparent text-[14px] outline-none ${t.done ? "text-muted-foreground line-through" : ""}`} />
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <select value={t.priority} onChange={(e) => actions.updateTask(t.id, { priority: e.target.value as Task["priority"] })} className={`bg-transparent outline-none ${prioColor[t.priority]}`}>
              <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
            </select>
            <input type="date" value={t.deadline} onChange={(e) => actions.updateTask(t.id, { deadline: e.target.value })} className="bg-transparent outline-none [color-scheme:dark]" />
            <span>~{t.estimateHours}h</span>
            {t.dependsOn.length > 0 && <span>after: {t.dependsOn.join(", ")}</span>}
            {t.subtasks.length > 0 && <button onClick={() => setOpen(!open)} className="hover:text-foreground">{t.subtasks.filter((s) => s.done).length}/{t.subtasks.length} subtasks {open ? "▴" : "▾"}</button>}
            <Link to="/research" search={{ prefill: `How to: ${t.title} (context: ${t.goal})` }} className="text-accent hover:underline">research</Link>
          </div>
          {open && (
            <ul className="mt-2 space-y-1">
              {t.subtasks.map((s, i) => (
                <li key={i}>
                  <label className="flex items-center gap-2 text-[13px]">
                    <input type="checkbox" checked={s.done} className="accent-[var(--accent)]" onChange={() => actions.updateTask(t.id, { subtasks: t.subtasks.map((x, j) => (j === i ? { ...x, done: !x.done } : x)) })} />
                    <span className={s.done ? "text-muted-foreground line-through" : ""}>{s.title}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button onClick={() => actions.removeTask(t.id)} className="text-muted-foreground hover:text-destructive" aria-label="Delete task"><Trash2 className="size-4" /></button>
      </div>
    </div>
  );
}
