import { m } from 'framer-motion';
import { ArrowLeft, Check, Clock, Link2, Briefcase as Linkedin, MessageCircle as Twitter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'wouter';
import { ESSAYS, type Essay, getEssay } from '@/content/essays';
import { FounderLayout } from './FounderLayout';

const CATEGORY_LABELS: Record<Essay['category'], string> = {
  doctrine: 'Doctrine',
  architecture: 'Architecture',
  strategy: 'Strategy',
  operations: 'Operations',
  memo: 'Memo',
};

function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 50,
        background: 'transparent',
      }}
    >
      <div
        style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, hsl(38, 52%, 58%), hsl(38, 70%, 70%))',
          transition: 'width 0.08s linear',
        }}
      />
    </div>
  );
}

function ShareRow({ essay }: { essay: Essay }) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== 'undefined' ? window.location.href : `/founder/essays/${essay.slug}`;
  const shareText = `${essay.title} — ${essay.subtitle}`;
  const tw = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText,
  )}&url=${encodeURIComponent(url)}`;
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };
  const btnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.4rem 0.7rem',
    fontSize: '0.75rem',
    color: 'hsl(214, 6%, 70%)',
    background: 'hsla(0,0%,100%,0.03)',
    border: '1px solid hsla(0,0%,100%,0.07)',
    borderRadius: 6,
    cursor: 'pointer',
    textDecoration: 'none',
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    letterSpacing: '0.02em',
  };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap',
        marginTop: '3rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid hsla(0,0%,100%,0.055)',
      }}
    >
      <span
        style={{
          fontSize: '0.7rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'hsl(214, 6%, 50%)',
          marginRight: '0.25rem',
        }}
      >
        Share
      </span>
      <button type="button" onClick={onCopy} style={btnStyle} data-testid="share-copy">
        {copied ? <Check size={13} /> : <Link2 size={13} />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
      <a href={tw} target="_blank" rel="noopener noreferrer" style={btnStyle}>
        <Twitter size={13} /> X / Twitter
      </a>
      <a href={li} target="_blank" rel="noopener noreferrer" style={btnStyle}>
        <Linkedin size={13} /> LinkedIn
      </a>
    </div>
  );
}

export default function FounderEssayDetail() {
  const params = useParams<{ slug: string }>();
  const essay = getEssay(params.slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params.slug]);

  if (!essay) {
    return (
      <FounderLayout>
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 3rem)',
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'hsl(214, 6%, 57%)' }}>Essay not found.</p>
          <Link href="/founder/essays">
            <span
              style={{
                color: 'hsl(38, 52%, 58%)',
                cursor: 'pointer',
                textDecoration: 'none',
              }}
            >
              ← Back to essays
            </span>
          </Link>
        </div>
      </FounderLayout>
    );
  }

  const formattedDate = new Date(essay.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const sameCategory = ESSAYS.filter((e) => e.slug !== essay.slug && e.category === essay.category);
  const otherCategory = ESSAYS.filter(
    (e) => e.slug !== essay.slug && e.category !== essay.category,
  );
  const otherEssays = [...sameCategory, ...otherCategory].slice(0, 3);

  return (
    <FounderLayout>
      <ScrollProgress />
      <article
        style={{
          maxWidth: '760px',
          margin: '0 auto',
          padding: 'clamp(3rem, 6vw, 5rem) clamp(1.5rem, 5vw, 3rem) clamp(4rem, 8vw, 7rem)',
        }}
      >
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/founder/essays">
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.8125rem',
                color: 'hsl(214, 6%, 57%)',
                cursor: 'pointer',
                textDecoration: 'none',
                marginBottom: '2.5rem',
              }}
            >
              <ArrowLeft size={14} />
              Essays & Memos
            </span>
          </Link>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'hsl(38, 52%, 58%)',
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
                border: '1px solid hsla(38, 52%, 58%, 0.25)',
                background: 'hsla(38, 52%, 58%, 0.06)',
              }}
            >
              {CATEGORY_LABELS[essay.category]}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'hsl(214, 6%, 55%)' }}>
              {formattedDate}
            </span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.8125rem',
                color: 'hsl(214, 6%, 55%)',
              }}
            >
              <Clock size={12} />
              {essay.readTime} min read
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(2rem, 5vw, 3.25rem)',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: 'hsl(38, 8%, 95%)',
              marginBottom: '0.75rem',
            }}
          >
            {essay.title}
          </h1>

          <p
            style={{
              fontSize: '1.125rem',
              fontStyle: 'italic',
              color: 'hsl(214, 7%, 64%)',
              marginBottom: '3rem',
              lineHeight: 1.5,
            }}
          >
            {essay.subtitle}
          </p>
        </m.div>

        <m.div
          className="essay-body"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            fontSize: '1.0625rem',
            lineHeight: 1.78,
            color: 'hsl(214, 7%, 70%)',
          }}
          dangerouslySetInnerHTML={{ __html: essay.body }}
        />

        <ShareRow essay={essay} />

        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          style={{
            marginTop: '4rem',
            paddingTop: '3rem',
            borderTop: '1px solid hsla(0,0%,100%,0.055)',
          }}
        >
          <div
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontWeight: 600,
              fontSize: '0.875rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'hsl(214, 6%, 57%)',
              marginBottom: '1.5rem',
            }}
          >
            More essays
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {otherEssays.map((other) => (
              <Link key={other.slug} href={`/founder/essays/${other.slug}`}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid hsla(0,0%,100%,0.055)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = 'hsla(0,0%,100%,0.10)';
                    el.style.background = 'hsla(0,0%,100%,0.03)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = 'hsla(0,0%,100%,0.055)';
                    el.style.background = 'transparent';
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: 500,
                        color: 'hsl(38, 8%, 95%)',
                        marginBottom: '0.25rem',
                        fontFamily: "'Space Grotesk', system-ui, sans-serif",
                      }}
                    >
                      {other.title}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'hsl(214, 6%, 57%)' }}>
                      {CATEGORY_LABELS[other.category]} · {other.readTime} min
                    </div>
                  </div>
                  <ArrowLeft
                    size={15}
                    style={{
                      color: 'hsl(214, 6%, 57%)',
                      transform: 'rotate(180deg)',
                    }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </m.div>
      </article>

      <style>{`
        .essay-body p { margin: 0 0 1.5rem; }
        .essay-body p:first-of-type::first-letter {
          font-family: 'Space Grotesk', system-ui, sans-serif;
          font-weight: 600;
          font-size: 3.25rem;
          float: left;
          line-height: 1;
          padding: 0.4rem 0.6rem 0 0;
          color: hsl(38, 52%, 58%);
        }
        .essay-body h3 {
          font-family: 'Space Grotesk', system-ui, sans-serif;
          font-weight: 600;
          font-size: 1.3125rem;
          letter-spacing: -0.01em;
          color: hsl(38, 8%, 95%);
          margin: 3rem 0 1rem;
          line-height: 1.3;
          position: relative;
          padding-left: 1rem;
        }
        .essay-body h3::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0.4em;
          bottom: 0.4em;
          width: 2px;
          background: hsl(38, 52%, 58%);
          border-radius: 2px;
        }
        .essay-body strong {
          color: hsl(38, 8%, 95%);
          font-weight: 600;
        }
        .essay-body em {
          color: hsl(38, 30%, 80%);
          font-style: italic;
        }
        .essay-body a {
          color: hsl(38, 52%, 65%);
          text-decoration: underline;
          text-decoration-color: hsla(38, 52%, 58%, 0.35);
          text-underline-offset: 3px;
        }
        .essay-body a:hover { text-decoration-color: hsl(38, 52%, 65%); }
        .essay-body blockquote {
          margin: 2rem 0;
          padding: 0.5rem 0 0.5rem 1.5rem;
          border-left: 3px solid hsl(38, 52%, 58%);
          font-family: 'Space Grotesk', system-ui, sans-serif;
          font-size: 1.25rem;
          line-height: 1.5;
          font-style: italic;
          color: hsl(38, 12%, 88%);
          background: linear-gradient(90deg, hsla(38,52%,58%,0.04), transparent 60%);
          border-radius: 2px;
        }
        .essay-body ul, .essay-body ol {
          margin: 0 0 1.5rem;
          padding-left: 1.5rem;
        }
        .essay-body li { margin: 0.5rem 0; }
        .essay-body hr {
          border: 0;
          height: 1px;
          background: hsla(0,0%,100%,0.07);
          margin: 2.5rem 0;
        }
      `}</style>
    </FounderLayout>
  );
}
