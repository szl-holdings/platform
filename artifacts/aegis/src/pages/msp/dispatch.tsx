import { User, MapPin, Clock, CheckCircle, AlertTriangle, Wrench, Calendar, Navigation, RefreshCw } from "lucide-react";

import { Skeleton } from "@szl-holdings/shared-ui/ui/skeleton";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import { useStandardQuery } from "@szl-holdings/api-client-react";

interface Technician {
  id: number;
  name: string;
  email: string;
  status: "available" | "on-site" | "traveling" | "off-duty";
  specialties: string[];
  currentJob: string | null;
  location: string;
  eta: string | null;
  completedToday: number;
  rating: string;
  certifications: string[];
}

interface TechniciansResponse {
  technicians: Technician[];
}

const pendingJobs = [
  { id: "JOB-2241", title: "Firewall rule audit & update", client: "Pinnacle Health", priority: "high", estimatedHours: 3, requiredSkills: ["Security", "Firewall"], location: "Medical Center" },
  { id: "JOB-2242", title: "New employee onboarding — 3 stations", client: "Greenfield Education", priority: "medium", estimatedHours: 4, requiredSkills: ["Endpoint", "Deployment"], location: "Campus Main" },
  { id: "JOB-2243", title: "UPS battery replacement", client: "Atlas Industries", priority: "low", estimatedHours: 1, requiredSkills: ["Server"], location: "Manufacturing Floor" },
  { id: "JOB-2244", title: "Network cable recertification", client: "Quantum Analytics", priority: "medium", estimatedHours: 6, requiredSkills: ["Network"], location: "Suite 400" },
  { id: "JOB-2245", title: "Active Directory sync investigation", client: "NovaTech", priority: "high", estimatedHours: 2, requiredSkills: ["Identity", "Server"], location: "Remote" },
];

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  available: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  "on-site": { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  traveling: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  "off-duty": { bg: "bg-zinc-500/10", text: "text-zinc-400", dot: "bg-zinc-400" },
};

const prioColors: Record<string, string> = {
  high: "bg-red-500/10 text-red-400",
  medium: "bg-amber-500/10 text-amber-400",
  low: "bg-emerald-500/10 text-emerald-400",
};

export default function Dispatch() {
  const { data, isLoading, refetch } = useStandardQuery<TechniciansResponse>({
    queryKey: ["msp-technicians"],
    queryFn: () => apiFetch<TechniciansResponse>("/msp/technicians"),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const technicians = data?.technicians ?? [];
  const available = technicians.filter(t => t.status === "available").length;
  const onSite = technicians.filter(t => t.status === "on-site").length;
  const completedToday = technicians.reduce((a, t) => a + (t.completedToday || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Technician Dispatch</h1>
          <p className="text-sm text-muted-foreground mt-1">Onsite job scheduling, technician routing, and field service coordination</p>
        </div>
        <button onClick={() => refetch()} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : (
          <>
            <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <User className="w-5 h-5 text-emerald-400" />
              <div><div className="text-xl font-bold">{available}</div><div className="text-xs text-muted-foreground">Available</div></div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <Wrench className="w-5 h-5 text-blue-400" />
              <div><div className="text-xl font-bold">{onSite}</div><div className="text-xs text-muted-foreground">On Site</div></div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <div><div className="text-xl font-bold">{pendingJobs.length}</div><div className="text-xs text-muted-foreground">Pending Jobs</div></div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-violet-400" />
              <div><div className="text-xl font-bold">{completedToday}</div><div className="text-xs text-muted-foreground">Completed Today</div></div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" /> Technician Status
            </h2>
          </div>
          <div className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-16" /></div>)
            ) : technicians.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">No technicians found</div>
            ) : (
              technicians.map((tech) => {
                const st = statusStyles[tech.status] || statusStyles["off-duty"];
                return (
                  <div key={tech.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {tech.name.split(" ").map((n: string) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{tech.name}</p>
                          <p className="text-[10px] text-muted-foreground">{Array.isArray(tech.specialties) ? tech.specialties.join(" · ") : ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                        <span className={`text-xs font-medium capitalize ${st.text}`}>{tech.status.replace("-", " ")}</span>
                      </div>
                    </div>
                    {tech.currentJob && (
                      <div className="ml-11 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Wrench className="w-3 h-3" /> {tech.currentJob}</span>
                        {tech.eta && <span className="flex items-center gap-1 mt-0.5"><Navigation className="w-3 h-3" /> ETA: {tech.eta}</span>}
                      </div>
                    )}
                    <div className="ml-11 mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {tech.location}</span>
                      <span>{tech.completedToday} jobs today</span>
                      <span>★ {tech.rating}</span>
                    </div>
                    {Array.isArray(tech.certifications) && tech.certifications.length > 0 && (
                      <div className="ml-11 mt-1.5 flex flex-wrap gap-1">
                        {tech.certifications.slice(0, 3).map(cert => (
                          <span key={cert} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary/70 font-mono">{cert}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" /> Pending Jobs
            </h2>
          </div>
          <div className="divide-y divide-border">
            {pendingJobs.map((job) => (
              <div key={job.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-muted-foreground">{job.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${prioColors[job.priority]}`}>{job.priority}</span>
                </div>
                <p className="text-sm font-medium">{job.title}</p>
                <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                  <p>{job.client} · {job.location}</p>
                  <p>Skills: {job.requiredSkills.join(", ")} · Est. {job.estimatedHours}h</p>
                </div>
                <button className="mt-2 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                  Assign Technician
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
