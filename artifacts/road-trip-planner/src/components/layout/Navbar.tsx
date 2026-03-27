import { Map } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useTripStore } from '@/store/use-trip-store';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { HowItWorksDialog } from './HowItWorksDialog';

export function Navbar() {
  const [location] = useLocation();
  const { liveMode } = useTripStore();
  const isDashboard = location === '/dashboard';

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Left — Logo + Live badge */}
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/" className="flex items-center gap-2 group outline-none">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
              <Map className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">
              Roam<span className="text-primary">Route</span>
            </span>
          </Link>

          {liveMode && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-bold uppercase tracking-wider border border-green-500/20">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live
            </div>
          )}
        </div>

        {/* Right — Nav links + actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/plan"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              location === '/plan'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            New Trip
          </Link>

          <Link
            href="/trips"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              location === '/trips'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            My Trips
          </Link>

          {isDashboard && <NotificationBell />}

          <HowItWorksDialog />
        </div>
      </div>
    </nav>
  );
}
