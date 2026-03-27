import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Car, MapPin, Route, LayoutDashboard, Navigation, Sparkles, Music2, TrafficCone } from 'lucide-react';

const STEPS = [
  {
    icon: Car,
    color: 'bg-orange-100 text-orange-600',
    step: '01',
    title: 'Check Your Vehicle',
    desc: 'Tell us how many travelers are coming and what vehicle you\'re driving. We\'ll verify it\'s the right fit and suggest better options if needed.',
  },
  {
    icon: MapPin,
    color: 'bg-blue-100 text-blue-600',
    step: '02',
    title: 'Set Your Route',
    desc: 'Enter your starting point and destination — the search bar suggests real places as you type. Pick your departure date & time and any travel preferences.',
  },
  {
    icon: Route,
    color: 'bg-green-100 text-green-600',
    step: '03',
    title: 'Choose a Route Type',
    desc: 'We calculate the real driving distance and time for your trip. Pick from Fastest, Scenic, or Balanced routes — each with accurate mileage and duration.',
  },
  {
    icon: LayoutDashboard,
    color: 'bg-purple-100 text-purple-600',
    step: '04',
    title: 'Your Trip Dashboard',
    desc: 'Get a personalized itinerary with stops at real waypoints along your route. Meals are scheduled at proper times — breakfast before 11 AM, lunch at noon, dinner after 8 PM.',
  },
  {
    icon: Navigation,
    color: 'bg-red-100 text-red-600',
    step: '05',
    title: 'Live Trip Mode',
    desc: 'Activate Live Trip to track your real GPS position on the map. Get progress updates, approaching-stop alerts, and browser notifications as you drive.',
  },
  {
    icon: Sparkles,
    color: 'bg-yellow-100 text-yellow-600',
    step: '06',
    title: 'AI Recommendations',
    desc: 'Our AI Advisor generates personalised attraction, restaurant, and activity suggestions based on your travel style and interests — and you can add any of them as stops.',
  },
  {
    icon: Music2,
    color: 'bg-pink-100 text-pink-600',
    step: '07',
    title: 'AI Music Playlist',
    desc: 'Choose a mood — energetic, relaxed, adventurous, and more — and get an AI-curated playlist for the road, with YouTube links for every track.',
  },
  {
    icon: TrafficCone,
    color: 'bg-amber-100 text-amber-600',
    step: '08',
    title: 'Delay & Traffic Handling',
    desc: 'Running late? Use the Delay Adjuster to shift your whole schedule. The planner auto-swaps closed venues for open alternatives and shows live traffic conditions.',
  },
];

export function HowItWorksDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-secondary/90 hover:shadow-md transition-all duration-200">
          <Sparkles className="w-4 h-4" />
          <span>How It Works</span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold">How RoamRoute Works</DialogTitle>
          <p className="text-muted-foreground text-sm mt-1">
            Plan your perfect road trip in minutes — powered by real routing data and AI.
          </p>
        </DialogHeader>

        <div className="mt-4 grid gap-4">
          {STEPS.map(({ icon: Icon, color, step, title, desc }) => (
            <div key={step} className="flex gap-4 p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0 mt-0.5`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-muted-foreground tracking-widest">STEP {step}</span>
                </div>
                <h4 className="font-bold text-foreground font-display leading-tight">{title}</h4>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-sm text-foreground/80 text-center font-medium">
            No account needed. No API keys. Just enter your route and go. 🚗
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
