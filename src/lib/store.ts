import { useSyncExternalStore } from "react";

export type Kind = "email" | "plan" | "research" | "assistant";
export type HistoryItem = {
  id: string;
  kind: Kind;
  title: string;
  content: string;
  createdAt: number;
  favorite?: boolean;
};
export type Task = {
  id: string;
  milestone: string;
  title: string;
  priority: "high" | "medium" | "low";
  deadline: string; // yyyy-mm-dd
  estimateHours: number;
  dependsOn: string[];
  subtasks: { title: string; done: boolean }[];
  done: boolean;
  goal: string;
};
export type Settings = { name: string; defaultTone: string };

type State = { history: HistoryItem[]; tasks: Task[]; settings: Settings };
const KEY = "flowai:v1";
const empty: State = { history: [], tasks: [], settings: { name: "there", defaultTone: "Professional" } };

let state: State = empty;
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...empty, ...JSON.parse(raw) };
  } catch {}
}
function set(next: Partial<State>) {
  state = { ...state, ...next };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  subs.forEach((s) => s());
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export function useStore() {
  return useSyncExternalStore(
    (cb) => { load(); subs.add(cb); cb(); return () => subs.delete(cb); },
    () => { load(); return state; },
    () => empty,
  );
}

export const actions = {
  addHistory(item: Omit<HistoryItem, "id" | "createdAt">) {
    const h = { ...item, id: uid(), createdAt: Date.now() };
    set({ history: [h, ...state.history].slice(0, 200) });
    return h.id;
  },
  toggleFavorite(id: string) {
    set({ history: state.history.map((h) => (h.id === id ? { ...h, favorite: !h.favorite } : h)) });
  },
  removeHistory(id: string) {
    set({ history: state.history.filter((h) => h.id !== id) });
  },
  clearHistory() { set({ history: state.history.filter((h) => h.favorite) }); },
  addTasks(tasks: Task[]) { set({ tasks: [...state.tasks, ...tasks] }); },
  updateTask(id: string, patch: Partial<Task>) {
    set({ tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
  },
  removeTask(id: string) { set({ tasks: state.tasks.filter((t) => t.id !== id) }); },
  clearTasks() { set({ tasks: [] }); },
  updateSettings(s: Partial<Settings>) { set({ settings: { ...state.settings, ...s } }); },
  resetAll() { set(empty); },
};

export const kindLabel: Record<Kind, string> = {
  email: "Email Generator",
  plan: "Task Planner",
  research: "Research Assistant",
  assistant: "Assistant",
};

export function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function tasksToText(tasks: Task[]) {
  return tasks
    .map((t) => `- [${t.done ? "x" : " "}] ${t.title} (${t.priority}, due ${t.deadline})`)
    .join("\n");
}
