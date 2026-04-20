import React, { type ReactNode } from 'react';
import { color } from '../tokens/index.js';
import { cn } from '../utils.js';

export interface SideNavSection {
  id: string;
  title?: string;
  items: SideNavItem[];
}

export interface SideNavItem {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: string | number;
  children?: SideNavItem[];
}

export interface SideNavProps {
  sections: SideNavSection[];
  activeItemId?: string;
  collapsed?: boolean;
  className?: string;
}

export function SideNav({ sections, activeItemId, collapsed = false, className }: SideNavProps) {
  return (
    <nav className={cn('flex flex-col gap-4 py-3 px-2', className)}>
      {sections.map((section) => (
        <div key={section.id} className="flex flex-col gap-0.5">
          {!collapsed && section.title && (
            <span
              className="px-2 mb-1 uppercase tracking-wider"
              style={{ color: color.text.muted, fontSize: '10px', fontWeight: 500 }}
            >
              {section.title}
            </span>
          )}
          {section.items.map((item) => (
            <SideNavItemRow
              key={item.id}
              item={item}
              active={activeItemId === item.id}
              collapsed={collapsed}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

function SideNavItemRow({
  item,
  active,
  collapsed,
}: {
  item: SideNavItem;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <a
      href={item.href}
      className={cn('flex items-center gap-2 px-2 rounded transition-colors')}
      style={{
        height: '34px',
        textDecoration: 'none',
        fontSize: '13px',
        background: active ? color.bg.active : 'transparent',
        color: active ? color.text.primary : color.text.secondary,
      }}
    >
      {item.icon && <span className="flex-shrink-0 w-4 h-4">{item.icon}</span>}
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {!collapsed && item.badge !== undefined && (
        <span
          className="rounded-full px-1.5 text-xs"
          style={{
            background: color.border.default,
            color: color.text.secondary,
            minWidth: '18px',
            textAlign: 'center',
          }}
        >
          {item.badge}
        </span>
      )}
    </a>
  );
}
