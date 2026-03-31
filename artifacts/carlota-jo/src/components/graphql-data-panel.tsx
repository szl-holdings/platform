import { useCarlotaServices, useCarlotaInquiries } from "@workspace/graphql-client/hooks";

export function CarlotaGraphQLPanel() {
  const { data: servicesData, loading: sLoading } = useCarlotaServices({ isActive: true, limit: 3 });
  const { data: inquiriesData, loading: iLoading } = useCarlotaInquiries({ limit: 3 });

  if (sLoading && iLoading) return null;

  const services = servicesData?.carlotaServices ?? [];
  const inquiries = inquiriesData?.carlotaInquiries ?? [];

  if (services.length === 0 && inquiries.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">GraphQL Live Data</span>
      </div>
      {services.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1">Active Services</p>
          <div className="space-y-1">
            {services.map((s: { id: string; name: string; category: string }) => (
              <div key={s.id} className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">{s.name}</span>
                <span className="text-zinc-500">{s.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {inquiries.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1">Recent Inquiries</p>
          <div className="space-y-1">
            {inquiries.map((i: { id: string; name: string; service: string; status: string }) => (
              <div key={i.id} className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">{i.name}</span>
                <span className="text-zinc-500">{i.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
