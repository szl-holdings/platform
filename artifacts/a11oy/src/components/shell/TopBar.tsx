import { useOrg } from '../../context/OrgContext';
import type { OrgId } from '../../context/OrgContext';
import { Badge } from '../ui/Badge';
import { ChevronDown } from 'lucide-react';

export function TopBar() {
  const { currentOrg, setOrg } = useOrg();

  const orgs: { id: OrgId; name: string }[] = [
    { id: 'szl', name: 'a11oy' },
    { id: 'acme', name: 'Acme Industries' },
    { id: 'northwind', name: 'Northwind Labs' }
  ];

  return (
    <header className="h-14 border-b border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-deep)] flex items-center justify-between px-6 shrink-0 z-30 sticky top-0">
      <div className="flex items-center gap-6">
        <div className="flex items-baseline gap-2">
          <span className="font-display font-medium text-lg tracking-tight text-[var(--color-a11oy-text)]">
            A<span className="font-mono text-[var(--color-a11oy-blue)] font-bold">11</span>oy
          </span>
          <span className="text-[10px] uppercase tracking-widest text-[var(--color-a11oy-text-ghost)]">
            One of one. Forged from many.
          </span>
        </div>

        <div className="h-4 w-px bg-[var(--color-a11oy-border)]"></div>

        <div className="relative group cursor-pointer">
          <div className="flex items-center gap-2 text-sm text-[var(--color-a11oy-text-sub)] group-hover:text-[var(--color-a11oy-text)] transition-colors">
            <span>{orgs.find(o => o.id === currentOrg)?.name}</span>
            <ChevronDown className="w-4 h-4 opacity-50 group-hover:opacity-100" />
          </div>
          
          <div className="absolute top-full left-0 mt-2 w-48 bg-[var(--color-a11oy-card)] border border-[var(--color-a11oy-border)] rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-left z-50">
            <div className="py-1">
              {orgs.map(org => (
                <button
                  key={org.id}
                  onClick={() => setOrg(org.id)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${currentOrg === org.id ? 'bg-[var(--color-a11oy-surface)] text-[var(--color-a11oy-blue)]' : 'text-[var(--color-a11oy-text-sub)] hover:bg-[var(--color-a11oy-surface)] hover:text-[var(--color-a11oy-text)]'}`}
                >
                  {org.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <Badge variant="warn" size="sm" className="font-mono tracking-widest uppercase bg-[var(--color-a11oy-warn)] text-[var(--color-a11oy-navy)] border-none font-bold">
          MOCK DATA
        </Badge>
      </div>
    </header>
  );
}
