import * as React from 'react';
import { cn } from '../utils';

export interface ArticleCardProps {
  slug?: string;
  category?: string;
  title: string;
  excerpt?: string;
  author?: { name: string; avatar?: string };
  date?: string;
  readTime?: string;
  image?: string;
  tags?: string[];
  href?: string;
  onClick?: () => void;
  accentColor?: string;
  variant?: 'light' | 'dark';
  className?: string;
}

export function ArticleCard({
  category,
  title,
  excerpt,
  author,
  date,
  readTime,
  image,
  tags,
  href,
  onClick,
  accentColor = 'hsl(215 45% 32%)',
  variant = 'light',
  className,
}: ArticleCardProps) {
  const isDark = variant === 'dark';

  const content = (
    <div
      className={cn(
        'group rounded-2xl overflow-hidden border transition-all duration-300 h-full flex flex-col',
        isDark
          ? 'bg-white/3 border-white/8 hover:border-white/16'
          : 'bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-md hover:shadow-black/5',
        className,
      )}
    >
      {image && (
        <div className="aspect-[16/9] overflow-hidden shrink-0">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        {category && (
          <p
            className="text-[10px] font-bold uppercase tracking-[0.12em] mb-3"
            style={{ color: accentColor }}
          >
            {category}
          </p>
        )}

        <h3
          className={cn(
            'text-[15px] font-bold leading-snug mb-2 line-clamp-2 group-hover:transition-colors',
            isDark ? 'text-white' : 'text-neutral-900',
          )}
        >
          {title}
        </h3>

        {excerpt && (
          <p
            className={cn(
              'text-sm leading-relaxed line-clamp-3 mb-4 flex-1',
              isDark ? 'text-white/50' : 'text-neutral-500',
            )}
          >
            {excerpt}
          </p>
        )}

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  'text-[10px] font-medium px-2 py-0.5 rounded-full',
                  isDark ? 'bg-white/8 text-white/50' : 'bg-neutral-100 text-neutral-500',
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div
          className={cn(
            'flex items-center justify-between mt-auto pt-3 border-t text-[11px]',
            isDark ? 'border-white/8 text-white/30' : 'border-neutral-100 text-neutral-400',
          )}
        >
          <div className="flex items-center gap-2">
            {author?.avatar && (
              <img
                src={author.avatar}
                alt={author.name}
                className="w-5 h-5 rounded-full object-cover"
              />
            )}
            <span>{author?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {date && <span>{date}</span>}
            {readTime && <span>· {readTime}</span>}
          </div>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} onClick={onClick} className="block h-full">
        {content}
      </a>
    );
  }

  return content;
}
