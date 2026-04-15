import * as React from "react";

export interface GraphQLDataSection<T = Record<string, unknown>> {
  label: string;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
}

export interface GraphQLDataPanelProps {
  title?: string;
  accentColor?: string;
  loading?: boolean;
  sections: ReadonlyArray<GraphQLDataSection<unknown>>;
  className?: string;
}

export function GraphQLDataPanel({
  title = "GraphQL Live Data",
  accentColor = "rgb(96, 165, 250)",
  loading = false,
  sections,
  className,
}: GraphQLDataPanelProps) {
  if (loading) return null;

  const hasData = sections.some((s) => s.items.length > 0);
  if (!hasData) return null;

  return (
    <div
      className={
        "rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3" +
        (className ? " " + className : "")
      }
    >
      <div className="flex items-center gap-2">
        <span
          className="h-1.5 w-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: accentColor }}
        />
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
          {title}
        </span>
      </div>
      {sections.map(
        (section) =>
          section.items.length > 0 && (
            <div key={section.label}>
              <p className="text-xs text-zinc-500 mb-1">{section.label}</p>
              <div className="space-y-1">
                {section.items.map((item, i) => section.renderItem(item, i))}
              </div>
            </div>
          )
      )}
    </div>
  );
}
