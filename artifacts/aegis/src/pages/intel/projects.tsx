import { cn } from '@szl-holdings/shared-ui/utils';
import { ArrowRight, Filter, LayoutGrid, List, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { type Project, type ProjectStatus, projects } from '@/data/seed-data';

const statusLabels: Record<ProjectStatus, string> = {
  research: 'Research',
  development: 'Development',
  testing: 'Testing',
  deployed: 'Deployed',
};

const statusColors: Record<ProjectStatus, string> = {
  research: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  development: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  testing: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  deployed: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
};

const kanbanColors: Record<ProjectStatus, string> = {
  research: 'border-violet-500/30',
  development: 'border-blue-500/30',
  testing: 'border-amber-500/30',
  deployed: 'border-emerald-500/30',
};

const kanbanDotColors: Record<ProjectStatus, string> = {
  research: 'bg-violet-400',
  development: 'bg-blue-400',
  testing: 'bg-amber-400',
  deployed: 'bg-emerald-400',
};

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-card/60 backdrop-blur-sm border border-border rounded-lg p-4 hover:border-primary/30 transition-all duration-200 cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <span
            className={cn(
              'text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border',
              statusColors[project.status],
            )}
          >
            {statusLabels[project.status]}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">{project.domain}</span>
        </div>
        <h3 className="text-sm font-display font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
          {project.name}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span>
            Acc: <span className="text-foreground font-medium">{project.accuracy}%</span>
          </span>
          <span>
            Loss: <span className="text-foreground font-medium">{project.loss.toFixed(3)}</span>
          </span>
          <span>
            Inf: <span className="text-foreground font-medium">{project.inferenceTime}ms</span>
          </span>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <div className="h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/60 rounded-full transition-all duration-500"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex -space-x-1.5">
            {project.team.slice(0, 3).map((m) => (
              <div
                key={m.avatar}
                className="w-6 h-6 rounded-full bg-primary/20 border border-background flex items-center justify-center text-[8px] font-medium text-primary"
              >
                {m.avatar}
              </div>
            ))}
            {project.team.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-muted border border-background flex items-center justify-center text-[8px] text-muted-foreground">
                +{project.team.length - 3}
              </div>
            )}
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Link>
  );
}

function ProjectRow({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.id}`}>
      <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer group border-b border-border/50">
        <span
          className={cn(
            'text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border min-w-[90px] text-center',
            statusColors[project.status],
          )}
        >
          {statusLabels[project.status]}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
            {project.name}
          </p>
          <p className="text-xs text-muted-foreground truncate">{project.description}</p>
        </div>
        <span className="text-xs text-muted-foreground font-mono hidden md:block">
          {project.domain}
        </span>
        <div className="flex items-center gap-3 text-xs text-muted-foreground hidden lg:flex">
          <span>{project.accuracy}%</span>
          <span>{project.inferenceTime}ms</span>
        </div>
        <div className="flex -space-x-1.5 hidden md:flex">
          {project.team.slice(0, 2).map((m) => (
            <div
              key={m.avatar}
              className="w-5 h-5 rounded-full bg-primary/20 border border-background flex items-center justify-center text-[7px] font-medium text-primary"
            >
              {m.avatar}
            </div>
          ))}
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </Link>
  );
}

function KanbanColumn({ status, items }: { status: ProjectStatus; items: Project[] }) {
  return (
    <div
      className={cn(
        'flex-1 min-w-[260px] border rounded-xl p-3',
        kanbanColors[status],
        'bg-card/30',
      )}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={cn('w-2 h-2 rounded-full', kanbanDotColors[status])} />
        <h3 className="text-xs font-display font-semibold text-foreground uppercase tracking-wider">
          {statusLabels[status]}
        </h3>
        <span className="text-[10px] text-muted-foreground ml-auto font-mono">{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
        {items.length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">No projects</div>
        )}
      </div>
    </div>
  );
}

export default function Projects() {
  const [view, setView] = useState<'kanban' | 'grid' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');

  const domains = useMemo(() => [...new Set(projects.map((p) => p.domain))], []);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.domain.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchDomain = domainFilter === 'all' || p.domain === domainFilter;
      return matchSearch && matchStatus && matchDomain;
    });
  }, [search, statusFilter, domainFilter]);

  const kanbanData: Record<ProjectStatus, Project[]> = {
    research: filtered.filter((p) => p.status === 'research'),
    development: filtered.filter((p) => p.status === 'development'),
    testing: filtered.filter((p) => p.status === 'testing'),
    deployed: filtered.filter((p) => p.status === 'deployed'),
  };

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-[1600px]">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Project Pipeline</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Research initiatives tracked from hypothesis to deployed model
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-card/60 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
            className="text-sm bg-card/60 border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
          >
            <option value="all">All Status</option>
            <option value="research">Research</option>
            <option value="development">Development</option>
            <option value="testing">Testing</option>
            <option value="deployed">Deployed</option>
          </select>

          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="text-sm bg-card/60 border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
          >
            <option value="all">All Domains</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 ml-auto bg-card/60 border border-border rounded-lg p-0.5">
          {(
            [
              { key: 'kanban' as const, icon: FolderKanban, label: 'Kanban' },
              { key: 'grid' as const, icon: LayoutGrid, label: 'Grid' },
              { key: 'list' as const, icon: List, label: 'List' },
            ] as const
          ).map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                view === key
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {(['research', 'development', 'testing', 'deployed'] as ProjectStatus[]).map((status) => (
            <KanbanColumn key={status} status={status} items={kanbanData[status]} />
          ))}
        </div>
      )}

      {view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {view === 'list' && (
        <div className="bg-card/40 border border-border rounded-xl divide-y-0">
          {filtered.map((project) => (
            <ProjectRow key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

function FolderKanban(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      <path d="M8 10v4" />
      <path d="M12 10v2" />
      <path d="M16 10v6" />
    </svg>
  );
}
