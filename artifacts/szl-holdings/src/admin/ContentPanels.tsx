import {
  BookOpen,
  Building2,
  CheckSquare,
  Circle,
  ClipboardList,
  FileText,
  Globe,
  HelpCircle,
  Layers,
  Map,
  MessageSquare,
  MousePointer,
  Navigation,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import type {
  Article,
  CaseStudy,
  CmsPage,
  Cta,
  Faq,
  NavigationItem,
  RoadmapItem,
  Service,
  Testimonial,
  Update,
  Venture,
} from './api';
import { CmsTablePanel, StatusBadge } from './CmsTablePanel';

// ─── Ventures Panel ───────────────────────────────────────────────────────────

function VenturesPanel() {
  return (
    <CmsTablePanel
      title="Ventures"
      icon={Building2}
      queryKey={['cms-ventures']}
      endpoint="/cms/ventures"
      fields={[
        { key: 'slug', label: 'Slug', required: true, format: 'slug' },
        { key: 'name', label: 'Name', required: true },
        { key: 'shortDescription', label: 'Short Description', type: 'textarea' },
        { key: 'longDescription', label: 'Long Description', type: 'textarea' },
        { key: 'statusBadge', label: 'Status Badge' },
        { key: 'stage', label: 'Stage' },
        { key: 'category', label: 'Category' },
        { key: 'primaryCtaLabel', label: 'Primary CTA Label' },
        { key: 'primaryCtaUrl', label: 'Primary CTA URL', format: 'url' },
        { key: 'accentToken', label: 'Accent Color' },
        { key: 'isFeatured', label: 'Featured', type: 'boolean' },
        { key: 'sortOrder', label: 'Sort Order', type: 'number' },
      ]}
      renderRow={(item) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{item.name}</span>
            {item.isFeatured && (
              <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                Featured
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
            <span className="font-mono">{item.slug}</span>
            {item.statusBadge && <span>· {item.statusBadge}</span>}
          </div>
        </div>
      )}
    />
  );
}

// ─── Pages Panel ─────────────────────────────────────────────────────────────

function PagesPanel() {
  return (
    <CmsTablePanel
      title="Pages"
      icon={FileText}
      queryKey={['cms-pages']}
      endpoint="/cms/pages"
      fields={[
        { key: 'siteId', label: 'Site ID', type: 'number', required: true },
        { key: 'title', label: 'Title', required: true },
        { key: 'slug', label: 'Slug', required: true, format: 'slug' },
        { key: 'pageType', label: 'Page Type' },
        { key: 'status', label: 'Status', type: 'select', options: ['draft', 'published'] },
        { key: 'templateKey', label: 'Template Key' },
        { key: 'metaTitle', label: 'Meta Title' },
        { key: 'metaDescription', label: 'Meta Description', type: 'textarea' },
        { key: 'ogTitle', label: 'OG Title' },
        { key: 'ogDescription', label: 'OG Description', type: 'textarea' },
        { key: 'canonicalUrl', label: 'Canonical URL', format: 'url' },
        { key: 'noindex', label: 'No-index', type: 'boolean' },
      ]}
      renderRow={(item) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{item.title}</span>
            <StatusBadge status={String(item.status ?? '')} />
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
            <span className="font-mono">{item.slug}</span>
            <span>· Site {item.siteId}</span>
          </div>
        </div>
      )}
    />
  );
}

// ─── Articles Panel ───────────────────────────────────────────────────────────

function ArticlesPanel() {
  return (
    <CmsTablePanel
      title="Articles"
      icon={BookOpen}
      queryKey={['cms-articles']}
      endpoint="/cms/articles"
      fields={[
        { key: 'siteId', label: 'Site ID', type: 'number', required: true },
        { key: 'slug', label: 'Slug', required: true, format: 'slug' },
        { key: 'title', label: 'Title', required: true },
        { key: 'excerpt', label: 'Excerpt', type: 'textarea' },
        { key: 'bodyRichtextOrMdx', label: 'Body', type: 'textarea' },
        { key: 'authorName', label: 'Author Name' },
        { key: 'status', label: 'Status', type: 'select', options: ['draft', 'published'] },
        { key: 'metaTitle', label: 'Meta Title' },
        { key: 'metaDescription', label: 'Meta Description', type: 'textarea' },
      ]}
      renderRow={(item) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{item.title}</span>
            <StatusBadge status={String(item.status ?? '')} />
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {item.authorName} · <span className="font-mono">{item.slug}</span>
          </div>
        </div>
      )}
    />
  );
}

// ─── Case Studies Panel ───────────────────────────────────────────────────────

function CaseStudiesPanel() {
  return (
    <CmsTablePanel
      title="Case Studies"
      icon={ClipboardList}
      queryKey={['cms-case-studies']}
      endpoint="/cms/case-studies"
      fields={[
        { key: 'siteId', label: 'Site ID', type: 'number', required: true },
        { key: 'slug', label: 'Slug', required: true, format: 'slug' },
        { key: 'title', label: 'Title', required: true },
        { key: 'summary', label: 'Summary', type: 'textarea' },
        { key: 'challenge', label: 'Challenge', type: 'textarea' },
        { key: 'approach', label: 'Approach', type: 'textarea' },
        { key: 'outcome', label: 'Outcome', type: 'textarea' },
        { key: 'takeaway', label: 'Takeaway', type: 'textarea' },
        { key: 'status', label: 'Status', type: 'select', options: ['draft', 'published'] },
      ]}
      renderRow={(item) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{item.title}</span>
            <StatusBadge status={String(item.status ?? '')} />
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 font-mono">{item.slug}</div>
        </div>
      )}
    />
  );
}

// ─── Roadmap Panel ────────────────────────────────────────────────────────────

function RoadmapPanel() {
  return (
    <CmsTablePanel
      title="Roadmap Items"
      icon={Map}
      queryKey={['cms-roadmap']}
      endpoint="/cms/roadmap-items"
      fields={[
        { key: 'siteId', label: 'Site ID', type: 'number', required: true },
        { key: 'title', label: 'Title', required: true },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'phaseLabel', label: 'Phase Label' },
        {
          key: 'status',
          label: 'Status',
          type: 'select',
          options: ['planned', 'in_progress', 'completed', 'cancelled'],
        },
        { key: 'targetQuarter', label: 'Target Quarter' },
        { key: 'sortOrder', label: 'Sort Order', type: 'number' },
      ]}
      renderRow={(item) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{item.title}</span>
            <StatusBadge status={String(item.status ?? '')} />
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {item.phaseLabel} · {item.targetQuarter}
          </div>
        </div>
      )}
    />
  );
}

// ─── Updates Panel ────────────────────────────────────────────────────────────

function UpdatesPanel() {
  return (
    <CmsTablePanel
      title="Updates"
      icon={TrendingUp}
      queryKey={['cms-updates']}
      endpoint="/cms/updates"
      fields={[
        { key: 'siteId', label: 'Site ID', type: 'number', required: true },
        { key: 'slug', label: 'Slug', required: true, format: 'slug' },
        { key: 'title', label: 'Title', required: true },
        { key: 'summary', label: 'Summary', type: 'textarea' },
        { key: 'bodyRichtext', label: 'Body', type: 'textarea' },
        { key: 'status', label: 'Status', type: 'select', options: ['draft', 'published'] },
      ]}
      renderRow={(item) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{item.title}</span>
            <StatusBadge status={String(item.status ?? '')} />
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {item.publishedAt ? new Date(String(item.publishedAt)).toLocaleDateString() : 'Draft'} ·{' '}
            <span className="font-mono">{item.slug}</span>
          </div>
        </div>
      )}
    />
  );
}

// ─── CTAs Panel ───────────────────────────────────────────────────────────────

function CtasPanel() {
  return (
    <CmsTablePanel
      title="CTAs"
      icon={MousePointer}
      queryKey={['cms-ctas']}
      endpoint="/cms/ctas"
      fields={[
        { key: 'siteId', label: 'Site ID', type: 'number', required: true },
        { key: 'label', label: 'Label', required: true },
        { key: 'url', label: 'URL', required: true, format: 'url' },
        {
          key: 'variant',
          label: 'Variant',
          type: 'select',
          options: ['primary', 'secondary', 'ghost'],
        },
        { key: 'helperText', label: 'Helper Text', type: 'textarea' },
      ]}
      renderRow={(item) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{item.label}</span>
            {item.variant && (
              <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                {item.variant}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground font-mono mt-0.5">{item.url}</div>
        </div>
      )}
    />
  );
}

// ─── Navigation Panel ─────────────────────────────────────────────────────────

function NavigationPanel() {
  return (
    <CmsTablePanel
      title="Navigation Items"
      icon={Navigation}
      queryKey={['cms-navigation']}
      endpoint="/cms/navigation-items"
      fields={[
        { key: 'siteId', label: 'Site ID', type: 'number', required: true },
        {
          key: 'navGroup',
          label: 'Nav Group',
          type: 'select',
          options: ['primary', 'footer', 'utility', 'dashboard'],
        },
        { key: 'label', label: 'Label', required: true },
        { key: 'url', label: 'URL', required: true, format: 'url' },
        { key: 'sortOrder', label: 'Sort Order', type: 'number' },
        { key: 'isEnabled', label: 'Enabled', type: 'boolean' },
        { key: 'isExternal', label: 'External Link', type: 'boolean' },
        { key: 'requiresAuth', label: 'Requires Auth', type: 'boolean' },
      ]}
      renderRow={(item) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{item.label}</span>
            {!item.isEnabled && (
              <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                disabled
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
            <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{item.navGroup}</span>
            <span className="font-mono">{item.url}</span>
          </div>
        </div>
      )}
    />
  );
}

// ─── Testimonials Panel ───────────────────────────────────────────────────────

function TestimonialsPanel() {
  return (
    <CmsTablePanel
      title="Testimonials"
      icon={MessageSquare}
      queryKey={['cms-testimonials']}
      endpoint="/cms/testimonials"
      fields={[
        { key: 'siteId', label: 'Site ID', type: 'number', required: true },
        { key: 'quote', label: 'Quote', type: 'textarea', required: true },
        { key: 'attributionName', label: 'Name', required: true },
        { key: 'attributionTitle', label: 'Title' },
        { key: 'attributionCompany', label: 'Company' },
        { key: 'isPublic', label: 'Public', type: 'boolean' },
        { key: 'sortOrder', label: 'Sort Order', type: 'number' },
      ]}
      renderRow={(item) => (
        <div>
          <p className="text-sm text-foreground line-clamp-1 italic">"{item.quote}"</p>
          <div className="text-xs text-muted-foreground mt-0.5">
            {item.attributionName}
            {item.attributionTitle ? ` · ${item.attributionTitle}` : ''}
          </div>
        </div>
      )}
    />
  );
}

// ─── FAQs Panel ───────────────────────────────────────────────────────────────

function FaqsPanel() {
  return (
    <CmsTablePanel
      title="FAQs"
      icon={HelpCircle}
      queryKey={['cms-faqs']}
      endpoint="/cms/faqs"
      fields={[
        { key: 'siteId', label: 'Site ID', type: 'number', required: true },
        { key: 'question', label: 'Question', required: true },
        { key: 'answerRichtext', label: 'Answer', type: 'textarea', required: true },
        { key: 'category', label: 'Category' },
        { key: 'sortOrder', label: 'Sort Order', type: 'number' },
      ]}
      renderRow={(item) => (
        <div>
          <p className="text-sm font-medium text-foreground line-clamp-1">{item.question}</p>
          {item.category && (
            <div className="text-xs text-muted-foreground mt-0.5">{item.category}</div>
          )}
        </div>
      )}
    />
  );
}

// ─── Services Panel ───────────────────────────────────────────────────────────

function ServicesPanel() {
  return (
    <CmsTablePanel
      title="Services"
      icon={Star}
      queryKey={['cms-services']}
      endpoint="/cms/services-items"
      fields={[
        { key: 'siteId', label: 'Site ID', type: 'number', required: true },
        { key: 'slug', label: 'Slug', required: true, format: 'slug' },
        { key: 'title', label: 'Title', required: true },
        { key: 'shortDescription', label: 'Short Description', type: 'textarea' },
        { key: 'fullDescription', label: 'Full Description', type: 'textarea' },
        { key: 'category', label: 'Category' },
        { key: 'iconKey', label: 'Icon Key' },
        { key: 'isFeatured', label: 'Featured', type: 'boolean' },
        { key: 'sortOrder', label: 'Sort Order', type: 'number' },
      ]}
      renderRow={(item) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{item.title}</span>
            {item.isFeatured && (
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                Featured
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
            <span className="font-mono">{item.slug}</span>
            {item.category && <span>· {item.category}</span>}
          </div>
        </div>
      )}
    />
  );
}

export {
  ArticlesPanel,
  CaseStudiesPanel,
  CtasPanel,
  FaqsPanel,
  NavigationPanel,
  PagesPanel,
  RoadmapPanel,
  ServicesPanel,
  TestimonialsPanel,
  UpdatesPanel,
  VenturesPanel,
};
