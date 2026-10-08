import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LayoutGrid, Mail, ListChecks, Search, History, Star, Settings } from "lucide-react";
import { useStore } from "@/lib/store";

const main = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/email", label: "Email Generator", icon: Mail },
  { to: "/planner", label: "Task Planner", icon: ListChecks },
  { to: "/research", label: "Research Assistant", icon: Search },
] as const;
const lib = [
  { to: "/history", label: "History", icon: History },
  { to: "/favorites", label: "Favorites", icon: Star },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const linkCls =
  "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-muted-foreground transition-colors hover:bg-glass hover:text-foreground";
const activeCls = "!bg-glass-strong !text-foreground font-medium ring-1 ring-border";

export function AppShell({ children }: { children: ReactNode }) {
  const { tasks } = useStore();
  const open = tasks.filter((t) => !t.done).length;
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -left-24 -top-28 h-[420px] w-[420px] -rotate-12 rounded-[28px] bg-gradient-soft ring-1 ring-border" />
      <div className="pointer-events-none absolute -right-16 top-40 h-[360px] w-[360px] rotate-6 rounded-[28px] bg-gradient-soft ring-1 ring-border" />
      <div className="relative mx-auto max-w-[1440px] px-4 pb-24 pt-6 sm:px-8 lg:pb-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-[250px] shrink-0 flex-col lg:flex">
            <Link to="/" className="flex items-center gap-2.5 px-2 pb-6">
              <div className="grid size-9 place-items-center rounded-[10px] bg-accent/20 ring-1 ring-accent/40">
                <span className="size-2.5 rounded-full bg-accent" />
              </div>
              <div>
                <div className="text-[15px] font-semibold tracking-tight">FlowAI</div>
                <div className="text-[11px] text-muted-foreground">Productivity OS</div>
              </div>
            </Link>
            <nav className="flex flex-col gap-1 text-[14px]">
              {main.map((l) => (
                <Link key={l.to} to={l.to} className={linkCls} activeProps={{ className: activeCls }} activeOptions={{ exact: true }}>
                  <l.icon className="size-4" /> {l.label}
                </Link>
              ))}
              <div className="my-2 h-px bg-border" />
              {lib.map((l) => (
                <Link key={l.to} to={l.to} className={linkCls} activeProps={{ className: activeCls }}>
                  <l.icon className="size-4" /> {l.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto rounded-[14px] bg-gradient-soft p-4 ring-1 ring-border">
              <div className="text-[13px] font-medium">{open} open {open === 1 ? "task" : "tasks"}</div>
              <div className="mt-1 text-[12px] leading-5 text-muted-foreground">
                Ask AI → get an answer → turn it into action.
              </div>
            </div>
          </aside>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-border bg-background/90 px-2 py-2 backdrop-blur-md lg:hidden">
        {[...main, lib[0], lib[2]].map((l) => (
          <Link key={l.to} to={l.to} className="flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] text-muted-foreground" activeProps={{ className: "!text-accent" }} activeOptions={{ exact: true }}>
            <l.icon className="size-5" />
            {l.label.split(" ")[0]}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</div>
        <h1 className="mt-1 text-balance text-[30px] font-semibold leading-none tracking-tight sm:text-[38px]">{title}</h1>
      </div>
      {children}
    </header>
  );
}

export function ErrorNote({ msg }: { msg: string }) {
  return <div className="rounded-[12px] border border-destructive/40 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">{msg}</div>;
}

export function Thinking({ label = "Thinking…" }: { label?: string }) {
  return (
    <div className="glass flex items-center gap-3 p-5 text-[13px] text-muted-foreground">
      <span className="size-2 animate-pulse rounded-full bg-accent" /> {label}
    </div>
  );
}
