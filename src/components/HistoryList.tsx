import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Star, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { actions, kindLabel, timeAgo, type HistoryItem } from "@/lib/store";
import { Chips } from "@/components/ui-flow";

export function HistoryList({ items, empty }: { items: HistoryItem[]; empty: string }) {
  const [filter, setFilter] = useState("All");
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const map: Record<string, string> = { Emails: "email", Plans: "plan", Research: "research", Assistant: "assistant" };
  const shown = items.filter((h) => (filter === "All" || h.kind === map[filter]) && (h.title + h.content).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Chips options={["All", "Emails", "Plans", "Research", "Assistant"]} value={filter} onChange={setFilter} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="field max-w-xs" />
      </div>
      {shown.length === 0 && <div className="glass p-8 text-center text-[13px] text-muted-foreground">{empty}</div>}
      <div className="space-y-2">
        {shown.map((h) => (
          <div key={h.id} className="glass p-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setOpen(open === h.id ? null : h.id)} className="min-w-0 flex-1 text-left">
                <div className="truncate text-[14px] font-medium">{h.title}</div>
                <div className="text-[11px] text-muted-foreground">{kindLabel[h.kind]} · {timeAgo(h.createdAt)}</div>
              </button>
              <button aria-label="Copy" onClick={() => { navigator.clipboard.writeText(h.content); toast.success("Copied"); }} className="text-muted-foreground hover:text-foreground"><Copy className="size-4" /></button>
              <button aria-label="Favorite" onClick={() => actions.toggleFavorite(h.id)} className={h.favorite ? "text-accent" : "text-muted-foreground hover:text-foreground"}><Star className="size-4" fill={h.favorite ? "currentColor" : "none"} /></button>
              <button aria-label="Delete" onClick={() => actions.removeHistory(h.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
            </div>
            {open === h.id && <div className="prose-flow mt-3 whitespace-pre-wrap border-t border-border pt-3 text-[13px]"><ReactMarkdown>{h.content}</ReactMarkdown></div>}
          </div>
        ))}
      </div>
    </div>
  );
}
