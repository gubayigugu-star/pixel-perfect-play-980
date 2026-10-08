import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/AppShell";
import { HistoryList } from "@/components/HistoryList";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Favorites — FlowAI" },
      { name: "description", content: "Your starred emails, plans and research reports." },
      { property: "og:title", content: "Favorites — FlowAI" },
      { property: "og:description", content: "Quick access to your best AI results." },
    ],
  }),
  component: () => {
    const { history } = useStore();
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Library" title="Favorites" />
        <HistoryList items={history.filter((h) => h.favorite)} empty="Star results to keep them here." />
      </div>
    );
  },
});
