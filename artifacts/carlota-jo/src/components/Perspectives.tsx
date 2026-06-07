import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const articles = [
  {
    id: 1,
    category: 'Technology & Operations',
    title: 'Why 73% of Digital Transformations Fail — and What the Other 27% Do Differently',
    excerpt:
      'Our analysis of 140 enterprise transformation programs reveals three structural patterns that separate successful digital initiatives from costly false starts.',
    readTime: '12 min read',
    date: 'March 2026',
    featured: true,
  },
  {
    id: 2,
    category: 'M&A & Corporate Finance',
    title: 'The Hidden Cost of Synergy Optimism in Cross-Border Transactions',
    excerpt:
      'Acquirers consistently overestimate synergy capture by 35-50%. A disciplined framework for probability-adjusted integration planning.',
    readTime: '9 min read',
    date: 'February 2026',
    featured: false,
  },
  {
    id: 3,
    category: 'Growth Strategy',
    title: 'Beyond TAM: Why Traditional Market Sizing Misleads Capital Allocation',
    excerpt:
      'Jobs-to-be-done segmentation reveals addressable markets that top-down sizing methodologies systematically overlook.',
    readTime: '8 min read',
    date: 'January 2026',
    featured: false,
  },
  {
    id: 4,
    category: 'Portfolio Strategy',
    title: 'When to Prune: A Framework for Portfolio Rationalization Under Uncertainty',
    excerpt:
      'How to identify and divest underperforming assets without destroying optionality — lessons from 12 conglomerate restructurings.',
    readTime: '11 min read',
    date: 'December 2025',
    featured: false,
  },
  {
    id: 5,
    category: 'Risk & Governance',
    title: 'CSRD Readiness: What European Reporting Standards Mean for Global Boards',
    excerpt:
      'The Corporate Sustainability Reporting Directive will reshape governance expectations worldwide. A practical readiness assessment for non-EU multinationals.',
    readTime: '7 min read',
    date: 'November 2025',
    featured: false,
  },
];

export default function Perspectives() {
  const featured = articles.find((a) => a.featured)!;
  const rest = articles.filter((a) => !a.featured);

  return (
    <section id="perspectives" className="py-24 lg:py-40 bg-stone-100 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 mb-20 lg:mb-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5"
          >
            <p className="text-[11px] font-medium tracking-[0.35em] uppercase text-warm-gold mb-6">
              Perspectives
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-ink-900 leading-tight">
              Our latest
              <br />
              <span className="italic">thinking</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-7 flex items-end"
          >
            <p className="text-sm text-ink-600 font-light leading-relaxed max-w-xl">
              Original research, frameworks, and insights from our advisory practice. We publish
              what we learn so that leaders everywhere can make better-informed decisions.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-stone-200 mb-px">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 bg-stone-100 p-8 lg:p-10 group cursor-pointer hover:bg-stone-50 transition-colors duration-500"
          >
            <div className="flex items-center gap-4 mb-5">
              <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-warm-gold">
                Featured
              </span>
              <span className="w-px h-3 bg-stone-300" />
              <span className="text-[11px] tracking-wider text-stone-400 font-light">
                {featured.category}
              </span>
            </div>

            <h3 className="font-serif text-2xl lg:text-3xl font-light text-ink-900 leading-snug mb-5 group-hover:text-ink-600 transition-colors duration-300">
              {featured.title}
            </h3>

            <p className="text-sm text-ink-600 leading-relaxed font-light mb-8 max-w-lg">
              {featured.excerpt}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-[11px] text-stone-400 font-light">
                <span>{featured.date}</span>
                <span className="w-px h-3 bg-stone-300" />
                <span>{featured.readTime}</span>
              </div>
              <span className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] uppercase text-warm-gold group-hover:text-warm-gold-light transition-colors">
                Read
                <ArrowRight
                  size={12}
                  className="group-hover:translate-x-1 transition-transform duration-300"
                />
              </span>
            </div>
          </motion.div>

          <div className="lg:col-span-5 grid grid-rows-2 gap-px bg-stone-200">
            {rest.slice(0, 2).map((article, idx) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 + idx * 0.08 }}
                className="bg-stone-100 p-8 group cursor-pointer hover:bg-stone-50 transition-colors duration-500 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[11px] tracking-wider text-stone-400 block mb-3 font-light">
                    {article.category}
                  </span>
                  <h4 className="font-serif text-lg font-light text-ink-900 leading-snug mb-3 group-hover:text-ink-600 transition-colors duration-300">
                    {article.title}
                  </h4>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3 text-[10px] text-stone-400 font-light">
                    <span>{article.date}</span>
                    <span>{article.readTime}</span>
                  </div>
                  <ArrowRight
                    size={12}
                    className="text-warm-gold/40 group-hover:text-warm-gold group-hover:translate-x-1 transition-all duration-300"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-stone-200">
          {rest.slice(2).map((article, idx) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 + idx * 0.08 }}
              className="bg-stone-100 p-8 group cursor-pointer hover:bg-stone-50 transition-colors duration-500"
            >
              <span className="text-[11px] tracking-wider text-stone-400 block mb-3 font-light">
                {article.category}
              </span>
              <h4 className="font-serif text-lg font-light text-ink-900 leading-snug mb-3 group-hover:text-ink-600 transition-colors duration-300">
                {article.title}
              </h4>
              <p className="text-[13px] text-ink-600 leading-relaxed font-light mb-4">
                {article.excerpt}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] text-stone-400 font-light">
                  <span>{article.date}</span>
                  <span>{article.readTime}</span>
                </div>
                <ArrowRight
                  size={12}
                  className="text-warm-gold/40 group-hover:text-warm-gold group-hover:translate-x-1 transition-all duration-300"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
