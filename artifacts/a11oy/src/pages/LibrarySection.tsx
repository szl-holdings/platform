import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { components, type ComponentItem } from '../data/components';
import { Badge } from '../components/ui/Badge';
import { CheckCircle2, PackagePlus } from 'lucide-react';

export function LibrarySection() {
  const [filter, setFilter] = useState<ComponentItem['status'] | 'all'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const filteredComponents =
    filter === 'all' ? components : components.filter((c) => c.status === filter);

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestStatus('submitting');
    setTimeout(() => {
      setRequestStatus('success');
      setTimeout(() => {
        setIsFormOpen(false);
        setRequestStatus('idle');
      }, 2000);
    }, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 h-full flex flex-col"
    >
      <div className="flex items-start justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-2xl font-display font-medium text-[var(--color-a11oy-text)]">
            Component Library
          </h1>
          <p className="text-[var(--color-a11oy-text-sub)] mt-1">
            Governed React components and adoption tracking.
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-2 bg-[var(--color-a11oy-blue)] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[var(--color-a11oy-blue-dim)] transition-colors"
        >
          <PackagePlus className="w-4 h-4" />
          Request Component
        </button>
      </div>

      <div className="flex gap-6 h-full min-h-0">
        {/* Main Table */}
        <div className="flex-1 flex flex-col bg-[var(--color-a11oy-card)] border border-[var(--color-a11oy-border)] rounded-lg overflow-hidden min-w-0">
          <div className="flex gap-2 p-4 border-b border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-surface)] overflow-x-auto">
            {(['all', 'stable', 'beta', 'experimental', 'deprecated'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 text-sm rounded-full capitalize transition-colors ${filter === status ? 'bg-[var(--color-a11oy-border)] text-[var(--color-a11oy-text)] font-medium' : 'text-[var(--color-a11oy-text-sub)] hover:bg-[var(--color-a11oy-surface)] hover:text-[var(--color-a11oy-text)]'}`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-a11oy-surface)] text-[var(--color-a11oy-text-ghost)] uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-3 font-medium">Component</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Adoption</th>
                  <th className="px-6 py-3 font-medium">Surfaces</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-a11oy-border)]">
                {filteredComponents.map((comp) => (
                  <tr
                    key={comp.id}
                    className="hover:bg-[var(--color-a11oy-surface)]/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[var(--color-a11oy-text)] font-medium">
                          {comp.name}
                        </span>
                        <Badge variant="outline" size="sm">
                          v{comp.canonicalVersion}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-[var(--color-a11oy-text-sub)] mt-1 truncate max-w-[250px]">
                        {comp.description}
                      </div>
                      {comp.status === 'deprecated' && comp.deprecatedReplacement && (
                        <div className="text-[10px] text-[var(--color-a11oy-warn)] mt-1 flex items-center gap-1">
                          ↳ Migrate to{' '}
                          <span className="font-mono font-bold">{comp.deprecatedReplacement}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          comp.status === 'stable'
                            ? 'ok'
                            : comp.status === 'deprecated'
                              ? 'critical'
                              : comp.status === 'beta'
                                ? 'info'
                                : 'warn'
                        }
                        className="uppercase text-[10px] tracking-wider font-bold"
                      >
                        {comp.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-[var(--color-a11oy-surface)] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${comp.status === 'deprecated' ? 'bg-[var(--color-a11oy-critical)]' : 'bg-[var(--color-a11oy-blue)]'}`}
                            style={{ width: `${comp.adoptionPct}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-[var(--color-a11oy-text-ghost)]">
                          {comp.adoptionPct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {comp.surfaces.slice(0, 3).map((s) => (
                          <Badge
                            key={s}
                            variant="ghost"
                            size="sm"
                            className="bg-[var(--color-a11oy-surface)]"
                          >
                            {s}
                          </Badge>
                        ))}
                        {comp.surfaces.length > 3 && (
                          <Badge
                            variant="ghost"
                            size="sm"
                            className="bg-[var(--color-a11oy-surface)] text-[var(--color-a11oy-text-ghost)]"
                          >
                            +{comp.surfaces.length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredComponents.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-[var(--color-a11oy-text-ghost)]"
                    >
                      No components match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Request Form Panel */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 380 }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              className="shrink-0 flex flex-col overflow-hidden"
            >
              <div className="bg-[var(--color-a11oy-card)] border border-[var(--color-a11oy-border)] rounded-lg p-6 h-full flex flex-col w-[380px]">
                <h3 className="text-lg font-medium text-[var(--color-a11oy-text)] mb-6">
                  Request Component
                </h3>

                {requestStatus === 'success' ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-[var(--color-a11oy-ok)]/20 flex items-center justify-center text-[var(--color-a11oy-ok)]">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-[var(--color-a11oy-text)] font-medium">
                        Request Submitted
                      </h4>
                      <p className="text-sm text-[var(--color-a11oy-text-sub)] mt-1">
                        The brand ops team will review your component proposal.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleRequestSubmit} className="flex-1 flex flex-col space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-a11oy-text-sub)] mb-1.5 uppercase tracking-wider">
                        Component Name
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full bg-[var(--color-a11oy-surface)] border border-[var(--color-a11oy-border)] rounded md py-2 px-3 text-sm text-[var(--color-a11oy-text)] focus:outline-none focus:border-[var(--color-a11oy-blue)] transition-colors"
                        placeholder="e.g. DataCard"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-a11oy-text-sub)] mb-1.5 uppercase tracking-wider">
                        Category
                      </label>
                      <select
                        required
                        className="w-full bg-[var(--color-a11oy-surface)] border border-[var(--color-a11oy-border)] rounded md py-2 px-3 text-sm text-[var(--color-a11oy-text)] focus:outline-none focus:border-[var(--color-a11oy-blue)] transition-colors"
                      >
                        <option value="">Select category...</option>
                        <option value="data">Data Display</option>
                        <option value="layout">Layout</option>
                        <option value="forms">Forms</option>
                        <option value="feedback">Feedback</option>
                        <option value="nav">Navigation</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-a11oy-text-sub)] mb-1.5 uppercase tracking-wider">
                        Requesting Surface
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full bg-[var(--color-a11oy-surface)] border border-[var(--color-a11oy-border)] rounded md py-2 px-3 text-sm text-[var(--color-a11oy-text)] focus:outline-none focus:border-[var(--color-a11oy-blue)] transition-colors"
                        placeholder="e.g. Counsel"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-[var(--color-a11oy-text-sub)] mb-1.5 uppercase tracking-wider">
                        Rationale
                      </label>
                      <textarea
                        required
                        className="w-full h-[120px] bg-[var(--color-a11oy-surface)] border border-[var(--color-a11oy-border)] rounded md py-2 px-3 text-sm text-[var(--color-a11oy-text)] focus:outline-none focus:border-[var(--color-a11oy-blue)] transition-colors resize-none"
                        placeholder="Why does this need to be a shared component?"
                      />
                    </div>

                    <div className="pt-4 flex gap-3 mt-auto">
                      <button
                        type="button"
                        onClick={() => setIsFormOpen(false)}
                        className="flex-1 py-2 rounded border border-[var(--color-a11oy-border)] text-sm font-medium text-[var(--color-a11oy-text-sub)] hover:text-[var(--color-a11oy-text)] hover:bg-[var(--color-a11oy-surface)] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={requestStatus === 'submitting'}
                        className="flex-1 py-2 rounded bg-[var(--color-a11oy-blue)] text-white text-sm font-medium hover:bg-[var(--color-a11oy-blue-dim)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {requestStatus === 'submitting' ? 'Submitting...' : 'Submit Request'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
