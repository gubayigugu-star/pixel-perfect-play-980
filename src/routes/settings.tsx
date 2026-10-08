import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { actions, useStore } from "@/lib/store";
import { PageHeader } from "@/components/AppShell";
import { Btn, Chips, Label } from "@/components/ui-flow";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — FlowAI" },
      { name: "description", content: "Personalize FlowAI: your name, default email tone and data." },
      { property: "og:title", content: "Settings — FlowAI" },
      { property: "og:description", content: "Personalize your FlowAI workspace." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings } = useStore();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Workspace" title="Settings" />
      <div className="glass max-w-xl space-y-6 p-5">
        <div>
          <Label>Your name</Label>
          <input value={settings.name === "there" ? "" : settings.name} onChange={(e) => actions.updateSettings({ name: e.target.value || "there" })} className="field" placeholder="Used in greetings" />
        </div>
        <div>
          <Label>Default email tone</Label>
          <Chips options={["Professional", "Friendly", "Formal", "Casual", "Persuasive", "Empathetic"]} value={settings.defaultTone} onChange={(v) => actions.updateSettings({ defaultTone: v })} />
        </div>
        <div>
          <Label>Your data</Label>
          <p className="mb-3 text-[13px] text-muted-foreground">Everything is saved privately in this browser.</p>
          <Btn variant="ghost" className="text-destructive" onClick={() => { if (confirm("Delete all tasks, history and settings?")) { actions.resetAll(); toast.success("All data cleared"); } }}>Delete all data</Btn>
        </div>
      </div>
    </div>
  );
}
