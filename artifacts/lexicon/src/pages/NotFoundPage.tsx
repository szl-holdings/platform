import { Link } from 'wouter';
import { Scale, ArrowLeft } from 'lucide-react';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '/lexicon';

export default function NotFoundPage() {
  return (
    <div className="max-w-[600px] mx-auto px-4 sm:px-6 py-20 md:py-32 text-center animate-fade-in">
      <div className="relative w-32 h-32 mx-auto mb-8">
        <div className="absolute inset-0 bg-lexicon-blue/5 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
        <div className="relative w-full h-full bg-lexicon-surface-raised border border-lexicon-border rounded-full flex items-center justify-center shadow-lg">
          <Scale size={48} className="text-lexicon-blue/50" />
        </div>
      </div>
      
      <h1 className="text-5xl md:text-7xl font-extrabold text-lexicon-text mb-4 tracking-tight">404</h1>
      <h2 className="text-xl md:text-2xl font-bold text-lexicon-text-muted mb-6">Page Not Found</h2>
      
      <p className="text-lexicon-text-muted text-lg mb-10 leading-relaxed max-w-md mx-auto">
        This page doesn't exist in the catalog. It may have moved or the URL might be incorrect.
      </p>
      
      <Link href={`${BASE}/`}>
        <span className="inline-flex items-center gap-2 px-8 py-3.5 bg-lexicon-blue hover:bg-lexicon-blue-dim text-lexicon-surface font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(79,142,247,0.2)] hover:shadow-[0_0_30px_rgba(79,142,247,0.4)] cursor-pointer" data-testid="link-404-home">
          <ArrowLeft size={18} /> Return to Catalog
        </span>
      </Link>
    </div>
  );
}
