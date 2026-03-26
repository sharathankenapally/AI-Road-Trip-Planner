import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { MapPin, Compass, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Wash */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background z-10" />
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Scenic mountain road" 
            className="w-full h-[80vh] object-cover object-top opacity-30"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-sm tracking-wider uppercase mb-6 border border-primary/20 shadow-sm">
              Smarter Travel Planning
            </span>
            <h1 className="text-5xl md:text-7xl font-display font-extrabold text-foreground tracking-tight mb-8 drop-shadow-sm">
              The Open Road <br /> <span className="text-primary italic">Awaits You.</span>
            </h1>
            <p className="mt-4 text-xl text-foreground/80 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Dynamic road trip planning that adapts to your vehicle, your preferences, and your real-time delays. Say goodbye to closed restaurants and stressful reroutes.
            </p>
            
            <Link 
              href="/plan" 
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-bold text-white bg-primary rounded-2xl shadow-xl shadow-primary/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ring-4 ring-primary/20"
            >
              Start Planning
              <Compass className="w-5 h-5 ml-2" />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-10">
          <div className="bg-card p-8 rounded-3xl border border-border shadow-sm hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold font-display mb-3">Vehicle Suitability</h3>
            <p className="text-muted-foreground leading-relaxed">
              We check if your car can handle the journey. If not, we suggest the perfect alternative for your group size.
            </p>
          </div>
          
          <div className="bg-card p-8 rounded-3xl border border-border shadow-sm hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
              <MapPin className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold font-display mb-3">Curated Stops</h3>
            <p className="text-muted-foreground leading-relaxed">
              Discover the best scenic views, landmarks, and top-rated restaurants precisely when you're hungry.
            </p>
          </div>

          <div className="bg-card p-8 rounded-3xl border border-border shadow-sm hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-accent/20 text-accent-foreground rounded-2xl flex items-center justify-center mb-6">
              <Compass className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold font-display mb-3">Dynamic Rerouting</h3>
            <p className="text-muted-foreground leading-relaxed">
              Running late? Tap a button and we'll instantly adjust your timeline and swap out closed spots for open ones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
