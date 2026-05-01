import { useAuth } from '../hooks/useAuth';

export function Dashboard() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-white">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">${{ values.domainName }}</h1>
        <p className="text-neutral-400 mt-1">${{ values.description }}</p>
      </header>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusCard title="Status" value="Active" />
        <StatusCard title="Domain" value="${{ values.domainSlug }}" />
        <StatusCard title="User" value={user?.name ?? 'Unknown'} />
      </section>
    </main>
  );
}

function StatusCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
      <p className="text-sm text-neutral-400 mb-1">{title}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
