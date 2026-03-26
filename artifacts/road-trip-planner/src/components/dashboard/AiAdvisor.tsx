import { useState } from 'react';
import { useTripStore } from '@/store/use-trip-store';
import { useGetAiRecommendations, AiRecommendationCategory, AiRecommendationPriority, AiRecommendationsRequestUserPreferencesTravelStyle, AiRecommendationsRequestUserPreferencesBudget } from '@workspace/api-client-react';
import { Bot, Sparkles, X, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';

export function AiAdvisor() {
  const { request, plan, addCustomStop } = useTripStore();
  const getRecs = useGetAiRecommendations();
  
  const [isOpen, setIsOpen] = useState(false);
  const [style, setStyle] = useState<AiRecommendationsRequestUserPreferencesTravelStyle>(AiRecommendationsRequestUserPreferencesTravelStyle.adventure);
  const [budget, setBudget] = useState<AiRecommendationsRequestUserPreferencesBudget>(AiRecommendationsRequestUserPreferencesBudget.moderate);
  const [interests, setInterests] = useState<string[]>(['nature']);

  const availableInterests = ['nature', 'history', 'food', 'art', 'adventure', 'shopping', 'photography'];

  const toggleInterest = (i: string) => {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const handleGetRecs = () => {
    getRecs.mutate({
      data: {
        tripRequest: request,
        currentPlan: plan || undefined,
        userPreferences: {
          travelStyle: style,
          budget: budget,
          interests
        }
      }
    });
  };

  const handleAddRec = (rec: any) => {
    addCustomStop({
      id: Math.random().toString(),
      name: rec.name,
      type: 'custom',
      description: rec.description,
      estimatedArrivalTime: new Date().toISOString(), // Mock time
      estimatedStopDuration: rec.estimatedTime || '1h',
      distanceFromStart: 'Unknown',
      mustVisit: rec.priority === 'must_see',
      isOpen: true
    });
    toast({ title: `Added ${rec.name} to stops!` });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 transition-transform z-40 active-elevate-2">
          <Bot className="w-7 h-7" />
        </button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col border-l border-border/50">
        <div className="p-6 bg-primary text-primary-foreground flex flex-col">
          <SheetHeader>
            <SheetTitle className="text-primary-foreground flex items-center gap-2 text-2xl font-display font-bold">
              <Sparkles className="w-6 h-6" /> AI Advisor
            </SheetTitle>
          </SheetHeader>
          <p className="text-primary-foreground/80 text-sm mt-2">
            Personalized recommendations for your journey.
          </p>
        </div>

        <ScrollArea className="flex-1 p-6">
          {!getRecs.data ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-foreground">Travel Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(AiRecommendationsRequestUserPreferencesTravelStyle).map(s => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium capitalize border transition-all ${style === s ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border hover:border-primary/50'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-foreground">Budget</label>
                <div className="flex gap-2">
                  {Object.values(AiRecommendationsRequestUserPreferencesBudget).map(b => (
                    <button
                      key={b}
                      onClick={() => setBudget(b)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize border transition-all ${budget === b ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border hover:border-primary/50'}`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-foreground">Interests</label>
                <div className="flex flex-wrap gap-2">
                  {availableInterests.map(i => (
                    <button
                      key={i}
                      onClick={() => toggleInterest(i)}
                      className={`py-1.5 px-3 rounded-full text-xs font-semibold capitalize border transition-all ${interests.includes(i) ? 'bg-secondary text-secondary-foreground border-secondary' : 'bg-background border-border hover:border-secondary/50'}`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full mt-4 hover-elevate" 
                size="lg" 
                onClick={handleGetRecs}
                disabled={getRecs.isPending}
              >
                {getRecs.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
                Get Insights
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-muted/40 rounded-xl p-4 text-sm leading-relaxed border border-border/50">
                <div className="font-bold text-primary mb-1">General Advice</div>
                {getRecs.data.generalAdvice}
              </div>

              {getRecs.data.recommendations.map((rec, i) => (
                <div key={i} className="border border-border/60 rounded-xl p-4 bg-card shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 inline-block
                        ${rec.priority === 'must_see' ? 'bg-orange-500/20 text-orange-600' : 'bg-blue-500/20 text-blue-600'}
                      `}>
                        {rec.category} • {rec.priority.replace('_', ' ')}
                      </span>
                      <h4 className="font-bold text-base leading-tight">{rec.name}</h4>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 mb-3">{rec.description}</p>
                  <div className="text-xs bg-muted/50 p-2 rounded text-foreground/80 mb-3">
                    <span className="font-semibold">Why:</span> {rec.reason}
                  </div>
                  
                  {(rec.category === 'attraction' || rec.category === 'restaurant' || rec.category === 'activity') && (
                    <Button variant="outline" size="sm" className="w-full text-xs hover-elevate" onClick={() => handleAddRec(rec)}>
                      <Plus className="w-3 h-3 mr-1" /> Add to Route
                    </Button>
                  )}
                </div>
              ))}

              {getRecs.data.packingTips && (
                <div className="mt-8">
                  <h4 className="font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                    Packing Tips
                  </h4>
                  <ul className="space-y-2">
                    {getRecs.data.packingTips.map((tip, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
