import Footer from '@/components/Footer';
import Header from '@/components/Header';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center pt-20">
        <div className="max-w-lg mx-auto px-6 text-center">
          <h1 className="font-serif text-6xl text-gold-400/30 mb-4">404</h1>
          <h2 className="font-serif text-2xl text-cream-50 mb-4">Page Not Found</h2>
          <p className="text-sm text-cream-300/50 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <a
            href={import.meta.env.BASE_URL}
            className="inline-block px-8 py-3.5 border border-gold-500/30 text-gold-400 text-sm font-medium tracking-widest uppercase hover:bg-gold-500/10 transition-all duration-300"
          >
            Return to Home
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
