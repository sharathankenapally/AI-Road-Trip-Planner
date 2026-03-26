import { Map, Compass } from 'lucide-react';
import { Link, useLocation } from 'wouter';

export function Navbar() {
  const [location] = useLocation();
  const isHome = location === '/';

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group outline-none">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
            <Map className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            Roam<span className="text-primary">Route</span>
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          {!isHome && (
            <Link 
              href="/plan" 
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              New Trip
            </Link>
          )}
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-secondary/90 hover:shadow-md transition-all duration-200"
          >
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">Explore More</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
