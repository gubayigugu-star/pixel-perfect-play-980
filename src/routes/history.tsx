import { createFileRoute } from "@tanstack/react-router";
import { useStore, actions } from "@/lib/store";
import { PageHeader } from "@/components/AppShell";
import { HistoryList } from "@/components/HistoryList";
import { Btn } from "@/components/ui-flow";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — FlowAI" },
      { name: "description", content: "Every email, plan and research report you've generated with FlowAI." },
      { property: "og:title", content: "History — FlowAI" },
      { property: "og:description", content: "Browse and reuse your past AI results." },
    ],
  }),
  component: () => {
    const { history } = useStore();
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Library" title="History">
          {history.length > 0 && <Btn variant="ghost" onClick={() => confirm("Clear history? Favorites are kept.") && actions.clearHistory()}>Clear history</Btn>}
        </PageHeader>
        <HistoryList items={history} empty="No history yet." />
      </div>
    );
  },
});
