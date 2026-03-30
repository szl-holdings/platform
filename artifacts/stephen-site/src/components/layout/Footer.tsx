import { Github, Linkedin, Mail, ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-background border-t border-border pt-20 pb-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="font-serif font-bold text-background text-lg">SL</span>
              </div>
              <span className="font-serif font-semibold text-2xl">Stephen Lutar</span>
            </div>
            <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
              Builder, architect, and operator. Building enterprise-grade platforms across maritime intelligence, cybersecurity, commerce, and creative production.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://linkedin.com/in/stephenlutar" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-primary hover:text-background hover:scale-110 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
                <Linkedin size={18} />
              </a>
              <a href="https://github.com/stephenlutar" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-primary hover:text-background hover:scale-110 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
                <Github size={18} />
              </a>
              <a href="mailto:stephen@szlholdings.com" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-primary hover:text-background hover:scale-110 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
                <Mail size={18} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-6">Navigate</h4>
            <ul className="space-y-4">
              <li><a href="#about" className="text-muted-foreground hover:text-primary inline-block transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-primary after:transition-all after:duration-300 hover:after:w-full">About</a></li>
              <li><a href="#services" className="text-muted-foreground hover:text-primary inline-block transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-primary after:transition-all after:duration-300 hover:after:w-full">Services</a></li>
              <li><a href="#case-studies" className="text-muted-foreground hover:text-primary inline-block transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-primary after:transition-all after:duration-300 hover:after:w-full">Case Studies</a></li>
              <li><a href="#insights" className="text-muted-foreground hover:text-primary inline-block transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-primary after:transition-all after:duration-300 hover:after:w-full">Insights</a></li>
              <li><a href="#testimonials" className="text-muted-foreground hover:text-primary inline-block transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-primary after:transition-all after:duration-300 hover:after:w-full">Testimonials</a></li>
              <li><a href="#contact" className="text-muted-foreground hover:text-primary inline-block transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-primary after:transition-all after:duration-300 hover:after:w-full">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-6">Ecosystem</h4>
            <ul className="space-y-4">
              <li><a href="/vessels/" className="text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors">Vessels <ArrowUpRight size={14} /></a></li>
              <li><a href="/firestorm/" className="text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors">Firestorm <ArrowUpRight size={14} /></a></li>
              <li><a href="/lyte-command-center/" className="text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors">Lyte <ArrowUpRight size={14} /></a></li>
              <li><a href="/dreamscape/" className="text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors">Dreamscape <ArrowUpRight size={14} /></a></li>
              <li><a href="/readiness-report/" className="text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors">Readiness Report <ArrowUpRight size={14} /></a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Stephen Lutar. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            Washington, D.C. Metro &middot; Global Availability
          </p>
        </div>
      </div>
    </footer>
  );
}
