import { useQuery } from "@tanstack/react-query";
import { Users, Crown, Shield, User } from "lucide-react";
import { apiGet } from "../lib/api";

interface PartnerDetail {
  partner: { id: number; name: string };
  managedOrgs: unknown[];
  teamMembers: Array<{
    userId: number;
    role: string;
    displayName: string;
    email: string | null;
    joinedAt: string;
  }>;
}

const roleIcons: Record<string, React.ElementType> = {
  owner: Crown,
  admin: Shield,
  member: User,
};

const roleColors: Record<string, string> = {
  owner: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  admin: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  member: "bg-slate-600/30 text-slate-400 border-slate-600/30",
};

export default function TeamPage() {
  const meQuery = useQuery({
    queryKey: ["partner-me"],
    queryFn: () => apiGet<{ partner: { id: number } }>("/partner/me"),
    retry: false,
  });

  const partnerId = meQuery.data?.partner?.id;

  const { data, isLoading } = useQuery<PartnerDetail>({
    queryKey: ["partner-detail", partnerId],
    queryFn: () => apiGet(`/partner/accounts/${partnerId}`),
    enabled: !!partnerId,
  });

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Partner Team</h1>
        <p className="text-slate-400 text-sm mt-0.5">Team members with access to this partner account</p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {isLoading || meQuery.isLoading ? (
          <div className="py-12 text-center">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : !data?.teamMembers.length ? (
          <div className="py-12 text-center">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-white font-medium mb-1">No team members</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {data.teamMembers.map((member) => {
              const RoleIcon = roleIcons[member.role] ?? User;
              return (
                <div key={member.userId} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-700 flex items-center justify-center text-sm font-bold text-white">
                      {member.displayName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{member.displayName}</p>
                      <p className="text-xs text-slate-500">{member.email ?? "No email"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border font-medium capitalize ${roleColors[member.role] ?? roleColors.member}`}>
                      <RoleIcon className="w-3 h-3" />
                      {member.role}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
