import { useState } from 'react';
import { motion } from 'framer-motion';
import { releases as initialReleases, type Release, type ReleaseStatus } from '../data/releases';
import { Badge } from '../components/ui/Badge';
import { ArrowUpRight, CheckCircle2, Circle } from 'lucide-react';

export function ReleasesSection() {
  const [releaseList, setReleaseList] = useState<Release[]>(initialReleases);

  const handlePromote = (id: string, currentStatus: ReleaseStatus) => {
    const statusMap: Record<ReleaseStatus, ReleaseStatus> = {
      Drafted: 'In Review',
      'In Review': 'Approved',
      Approved: 'Shipped',
      Shipped: 'Shipped',
    };

    const nextStatus = statusMap[currentStatus];
    if (nextStatus === currentStatus) return;

    setReleaseList((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: nextStatus, updatedAt: new Date().toISOString().split('T')[0] }
          : r,
      ),
    );
  };

  const getStatusColor = (status: ReleaseStatus) => {
    switch (status) {
      case 'Drafted':
        return 'default';
      case 'In Review':
        return 'warn';
      case 'Approved':
        return 'info';
      case 'Shipped':
        return 'ok';
      default:
        return 'default';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 h-full flex flex-col"
    >
      <div className="mb-8 shrink-0">
        <h1 className="text-2xl font-display font-medium text-[var(--color-a11oy-text)]">
          Releases
        </h1>
        <p className="text-[var(--color-a11oy-text-sub)] mt-1">
          Design system and brand package release timeline.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pr-4">
        <div className="relative border-l border-[var(--color-a11oy-border)] ml-4 space-y-10 pb-10">
          {releaseList.map((release, idx) => (
            <div key={release.id} className="relative pl-8">
              {/* Timeline node */}
              <div
                className={`absolute -left-2.5 top-1.5 w-5 h-5 rounded-full border-4 border-[var(--color-a11oy-navy)] ${release.status === 'Shipped' ? 'bg-[var(--color-a11oy-ok)]' : 'bg-[var(--color-a11oy-border)]'}`}
              />

              <div className="bg-[var(--color-a11oy-card)] border border-[var(--color-a11oy-border)] rounded-lg p-6 hover:border-[var(--color-a11oy-muted)] transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="font-mono text-sm px-2 py-1 bg-[var(--color-a11oy-surface)]"
                    >
                      {release.version}
                    </Badge>
                    <h3 className="text-lg font-medium text-[var(--color-a11oy-text)]">
                      {release.title}
                    </h3>
                    <Badge
                      variant={getStatusColor(release.status)}
                      className="uppercase text-[10px] tracking-wider font-bold ml-2"
                    >
                      {release.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-[var(--color-a11oy-text-ghost)] flex items-center gap-4">
                    <span>Created: {release.createdAt}</span>
                    <span>Updated: {release.updatedAt}</span>
                    {release.status !== 'Shipped' && (
                      <button
                        onClick={() => handlePromote(release.id, release.status)}
                        className="flex items-center gap-1.5 bg-[var(--color-a11oy-surface)] hover:bg-[var(--color-a11oy-border)] text-[var(--color-a11oy-text)] px-3 py-1.5 rounded transition-colors ml-2"
                      >
                        Promote <ArrowUpRight className="w-3 h-3 text-[var(--color-a11oy-blue)]" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-[var(--color-a11oy-text-sub)] mb-6 max-w-3xl">
                  {release.summary}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="col-span-1">
                    <h4 className="text-[10px] uppercase tracking-widest text-[var(--color-a11oy-text-ghost)] mb-2 border-b border-[var(--color-a11oy-border)] pb-2">
                      Changes Included
                    </h4>
                    <ul className="space-y-1.5 mt-3">
                      {release.changes.map((change, i) => (
                        <li
                          key={i}
                          className="text-xs text-[var(--color-a11oy-text-sub)] flex items-start gap-2"
                        >
                          <span className="text-[var(--color-a11oy-border)] mt-0.5">•</span>
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="col-span-1">
                    <h4 className="text-[10px] uppercase tracking-widest text-[var(--color-a11oy-text-ghost)] mb-2 border-b border-[var(--color-a11oy-border)] pb-2">
                      Target Surfaces
                    </h4>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {release.targetBrands.map((brand, i) => (
                        <Badge
                          key={i}
                          variant="ghost"
                          size="sm"
                          className="bg-[var(--color-a11oy-surface)] text-[var(--color-a11oy-text-sub)] border border-[var(--color-a11oy-border)]"
                        >
                          {brand}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-1">
                    <h4 className="text-[10px] uppercase tracking-widest text-[var(--color-a11oy-text-ghost)] mb-2 border-b border-[var(--color-a11oy-border)] pb-2">
                      Required Reviews
                    </h4>
                    <div className="space-y-2 mt-3">
                      {release.reviewers.map((reviewer, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-[var(--color-a11oy-surface)] text-[var(--color-a11oy-text-ghost)] text-[9px] flex items-center justify-center font-bold tracking-tighter">
                              {reviewer.avatarInitials}
                            </div>
                            <span className="text-xs text-[var(--color-a11oy-text-sub)]">
                              {reviewer.name}
                            </span>
                          </div>
                          {reviewer.approved ? (
                            <CheckCircle2 className="w-4 h-4 text-[var(--color-a11oy-ok)]" />
                          ) : (
                            <Circle className="w-4 h-4 text-[var(--color-a11oy-border)]" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
