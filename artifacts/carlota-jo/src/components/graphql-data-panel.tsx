import { useCarlotaInquiries, useCarlotaServices } from '@szl-holdings/graphql-client/hooks';
import { GraphQLDataPanel } from '@szl-holdings/shared-ui/design-system';

export function CarlotaGraphQLPanel() {
  const { data: servicesData, loading: sLoading } = useCarlotaServices({
    isActive: true,
    limit: 3,
  });
  const { data: inquiriesData, loading: iLoading } = useCarlotaInquiries({ limit: 3 });

  return (
    <GraphQLDataPanel
      accentColor="rgb(251, 113, 133)"
      loading={sLoading && iLoading}
      sections={[
        {
          label: 'Active Services',
          items: servicesData?.carlotaServices ?? [],
          renderItem: (s: { id: string; name: string; category: string }) => (
            <div key={s.id} className="flex items-center justify-between text-xs">
              <span className="text-zinc-300">{s.name}</span>
              <span className="text-zinc-500">{s.category}</span>
            </div>
          ),
        },
        {
          label: 'Recent Inquiries',
          items: inquiriesData?.carlotaInquiries ?? [],
          renderItem: (i: { id: string; name: string; service: string; status: string }) => (
            <div key={i.id} className="flex items-center justify-between text-xs">
              <span className="text-zinc-300">{i.name}</span>
              <span className="text-zinc-500">{i.status}</span>
            </div>
          ),
        },
      ]}
    />
  );
}
