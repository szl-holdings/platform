import * as React from 'react';
import { cn, toAlpha } from '../utils';

export interface SidebarNavItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'default' | 'danger' | 'warning' | 'success';
  children?: SidebarNavItem[];
  onClick?: () => void;
}

export interface SidebarNavSection {
  id?: string;
  label?: string;
  items: SidebarNavItem[];
}

export interface SidebarNavProps {
  sections: SidebarNavSection[];
  currentPath?: string;
  collapsed?: boolean;
  accentColor?: string;
  onNavigate?: (item: SidebarNavItem) => void;
  className?: string;
  footer?: React.ReactNode;
  header?: React.ReactNode;
}

export function SidebarNav({
  sections,
  currentPath = '/',
  collapsed = false,
  accentColor = 'hsl(215 45% 48%)',
  onNavigate,
  className,
  footer,
  header,
}: SidebarNavProps) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isActive = (item: SidebarNavItem) =>
    item.href ? currentPath === item.href || currentPath.startsWith(`${item.href}/`) : false;

  const renderItem = (item: SidebarNavItem, depth = 0) => {
    const active = isActive(item);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expanded.has(item.id);
    const Tag = item.href ? 'a' : 'button';

    const badgeStyle: React.CSSProperties = (() => {
      switch (item.badgeVariant) {
        case 'danger':
          return {
            background: toAlpha('#ef4444', 0.13),
            color: '#f87171',
            border: `1px solid ${toAlpha('#ef4444', 0.22)}`,
          };
        case 'warning':
          return {
            background: toAlpha('#f59e0b', 0.13),
            color: '#fbbf24',
            border: `1px solid ${toAlpha('#f59e0b', 0.22)}`,
          };
        case 'success':
          return {
            background: toAlpha('#10b981', 0.13),
            color: '#34d399',
            border: `1px solid ${toAlpha('#10b981', 0.22)}`,
          };
        default:
          return {
            background: toAlpha('#ffffff', 0.07),
            color: 'hsl(210 5% 50%)',
            border: `1px solid ${toAlpha('#ffffff', 0.09)}`,
          };
      }
    })();

    return (
      <li key={item.id}>
        <Tag
          href={item.href}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault();
              toggleExpanded(item.id);
              return;
            }
            if (item.href && onNavigate) {
              e.preventDefault();
            }
            item.onClick?.();
            onNavigate?.(item);
          }}
          className={cn(
            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsla(210_60%_58%_/_0.4)]',
            depth > 0 && 'pl-8 text-xs',
            active ? 'text-white/90' : 'text-white/45 hover:text-white/80 hover:bg-white/5',
          )}
          style={
            active
              ? {
                  background: toAlpha(accentColor, 0.1),
                  border: `1px solid ${toAlpha(accentColor, 0.18)}`,
                  borderRadius: '0.5rem',
                }
              : { border: '1px solid transparent', borderRadius: '0.5rem' }
          }
          aria-current={active ? 'page' : undefined}
        >
          {item.icon && (
            <span
              className="shrink-0 w-4 h-4 transition-colors"
              style={{ color: active ? accentColor : undefined }}
            >
              {item.icon}
            </span>
          )}
          {!collapsed && (
            <>
              <span className="flex-1 truncate text-left">{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={badgeStyle}
                >
                  {item.badge}
                </span>
              )}
              {hasChildren && (
                <span
                  className={cn(
                    'shrink-0 text-white/30 transition-transform duration-200',
                    isExpanded && 'rotate-90',
                  )}
                >
                  ›
                </span>
              )}
            </>
          )}
        </Tag>

        {hasChildren && isExpanded && !collapsed && (
          <ul className="mt-0.5 space-y-0.5">
            {item.children?.map((child) => renderItem(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <nav className={cn('flex flex-col h-full py-3', className)} aria-label="Sidebar">
      {header && <div className="px-3 mb-3">{header}</div>}

      <div className="flex-1 overflow-y-auto px-2 space-y-4">
        {sections.map((section, si) => (
          <div key={section.id ?? si}>
            {section.label && !collapsed && (
              <p className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/55">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">{section.items.map((item) => renderItem(item))}</ul>
          </div>
        ))}
      </div>

      {footer && (
        <div className={cn('px-2 pt-3 border-t border-white/6', collapsed && 'px-1')}>{footer}</div>
      )}
    </nav>
  );
}
