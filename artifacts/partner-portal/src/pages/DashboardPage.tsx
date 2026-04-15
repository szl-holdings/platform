import { useQuery } from "@tanstack/react-query";
import { Building2, Globe, Users, TrendingUp, Plus, ArrowRight, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { apiGet } from "../lib/api";

interface PartnerProfile {
  partner: {
    id: number;
    name: string;
    slug: string;
    status: string;
    tier: string;
    maxManagedTenants: number;
    commissionRate: string;
  };
  managedOrgs: Array<{
    id: number;
    name: string;
    slug: string;
    plan: string;
    status: string;
    accessLevel: string;
  }>;
  managedOrgCount: number;
}

function StatCard({ icon: Icon, label, value, sub, color = "indigo" }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-500/10 text-indigo-400",
    violet: "bg-violet-500/10 text-violet-400",
    cyan: "bg-cyan-500/10 text-cyan-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
  };
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colors[color] ?? colors.indigo}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function statusIcon(status: string) {
  if (status === "active") return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
  if (status === "inactive" || status === "suspended") return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
  return <Clock className="w-3.5 h-3.5 text-yellow-400" />;
}

const planColors: Record<string, string> = {
  enterprise: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  professional: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  starter: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  free: "bg-slate-600/30 text-slate-400 border-slate-600/30",
};

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<PartnerProfile>({
    queryKey: ["partner-me"],
    queryFn: () => apiGet("/partner/me"),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-800 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h2 className="text-white font-semibold mb-2">No Partner Account Found</h2>
          <p className="text-slate-400 text-sm mb-4">
            You don't have a partner account yet. Create one to start managing tenants.
          </p>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Partner Account
          </button>
        </div>
      </div>
    );
  }

  const { partner, managedOrgs } = data;
  const activeOrgs = managedOrgs.filter((o) => o.status === "active").length;
  const commission = Math.round(Number(partner.commissionRate) * 100);

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-white">{partner.name}</h1>
          <span className={`px-2 py-0.5 text-xs rounded-full font-medium border ${
            partner.status === "active"
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
          }`}>
            {partner.status}
          </span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-medium capitalize">
            {partner.tier.replace("_", " ")}
          </span>
        </div>
        <p className="text-slate-400 text-sm">Partner ID: {partner.slug}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Building2} label="Managed Tenants" value={managedOrgs.length} sub={`of ${partner.maxManagedTenants} max`} color="indigo" />
        <StatCard icon={CheckCircle} label="Active Tenants" value={activeOrgs} color="emerald" />
        <StatCard icon={TrendingUp} label="Commission Rate" value={`${commission}%`} color="violet" />
        <StatCard icon={Globe} label="White-Label Tier" value={partner.tier.replace("_", " ")} color="cyan" />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="text-sm font-semibold text-white">Managed Tenants</h2>
          <Link href="/tenants">
            <a className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              Manage all <ArrowRight className="w-3 h-3" />
            </a>
          </Link>
        </div>

        {managedOrgs.length === 0 ? (
          <div className="py-12 text-center">
            <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No tenants yet</p>
            <Link href="/tenants">
              <a className="mt-3 inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
                <Plus className="w-3 h-3" /> Provision first tenant
              </a>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {managedOrgs.slice(0, 8).map((org) => (
              <div key={org.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  {statusIcon(org.status)}
                  <div>
                    <p className="text-sm font-medium text-white">{org.name}</p>
                    <p className="text-xs text-slate-500">{org.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs rounded border font-medium capitalize ${planColors[org.plan] ?? planColors.free}`}>
                    {org.plan}
                  </span>
                  <span className="text-xs text-slate-500 capitalize">{org.accessLevel}</span>
                  <Link href={`/branding/${org.id}`}>
                    <a className="text-xs text-indigo-400 hover:text-indigo-300 ml-2 transition-colors">Brand →</a>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
