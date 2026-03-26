import { useState } from 'react';
import { MapPin, Camera, Coffee, Fuel, Tent, Navigation, CheckCircle, Plus, GripVertical, Trash2, Edit2 } from 'lucide-react';
import { useTripStore } from '@/store/use-trip-store';
import { formatTripTime } from '@/utils/formatTripTime';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StopType, Stop } from '@workspace/api-client-react';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableStopItem({ stop, idx, isDiff, isNew }: { stop: Stop, idx: number, isDiff: boolean, isNew: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id });

  const { removeCustomStop } = useTripStore();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'attraction': return <Camera className="w-5 h-5" />;
      case 'viewpoint': return <Navigation className="w-5 h-5" />;
      case 'rest_area': return <Coffee className="w-5 h-5" />;
      case 'gas_station': return <Fuel className="w-5 h-5" />;
      case 'landmark': return <Tent className="w-5 h-5" />;
      default: return <MapPin className="w-5 h-5" />;
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/item">
      {/* Timeline dot */}
      <div className={`
        absolute -left-[3.5rem] sm:-left-[4.5rem] w-12 h-12 rounded-full border-4 border-background flex items-center justify-center text-white shadow-md z-10
        ${stop.isOpen ? 'bg-secondary' : 'bg-destructive'}
        ${isDiff ? 'ring-4 ring-accent/30 bg-accent' : ''}
        ${stop.isCustom ? 'bg-primary' : ''}
      `}>
        {getIcon(stop.type)}
      </div>

      <div className={`
        bg-card rounded-2xl p-6 border transition-all
        ${isDiff ? 'border-accent/50 bg-accent/5' : 'border-border/50'}
        ${stop.isCustom ? 'border-primary/50' : ''}
      `}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
          <div className="flex items-start gap-3">
            <button 
              {...attributes} 
              {...listeners}
              className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover/item:opacity-100 transition-opacity"
            >
              <GripVertical className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl font-bold font-display text-foreground">{stop.name}</h3>
                {stop.mustVisit && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold uppercase rounded flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Must Visit
                  </span>
                )}
                {stop.isCustom && (
                  <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-bold uppercase rounded">
                    Custom
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 capitalize">{stop.type.replace('_', ' ')} • {stop.distanceFromStart}</p>
            </div>
          </div>
          
          <div className="text-right shrink-0 flex items-start gap-4">
            <div>
              <div className="text-lg font-bold text-foreground">
                {formatTripTime(stop.estimatedArrivalTime)}
              </div>
              <div className="text-sm text-muted-foreground">
                Stop: {stop.estimatedStopDuration}
              </div>
            </div>
          </div>
        </div>

        <p className="text-foreground/80 text-sm leading-relaxed mb-4 ml-8">
          {stop.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-border/50 ml-8">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${stop.isOpen ? 'bg-secondary' : 'bg-destructive animate-pulse'}`} />
            <span className="text-sm font-semibold">
              {stop.isOpen ? 'Currently Open' : 'Closed at arrival time'}
            </span>
            {stop.openHours && <span className="text-sm text-muted-foreground hidden sm:inline">({stop.openHours})</span>}
          </div>
          
          <div className="flex items-center gap-2">
            {isDiff && (
              <span className="text-xs font-bold text-accent-foreground bg-accent/20 px-3 py-1 rounded-full">
                {isNew ? 'Added to Plan' : 'Time Adjusted'}
              </span>
            )}
            {stop.isCustom && (
              <Button variant="ghost" size="sm" onClick={() => removeCustomStop(stop.id)} className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="w-4 h-4 mr-1" /> Remove
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StopsTimeline() {
  const { plan, previousPlan, reorderStops, addCustomStop } = useTripStore();
  
  const [isAddStopOpen, setIsAddStopOpen] = useState(false);
  const [newStop, setNewStop] = useState<Partial<Stop>>({
    name: '',
    type: 'custom',
    description: '',
    estimatedStopDuration: '1h'
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!plan) return null;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = plan!.stops.findIndex((s) => s.id === active.id);
      const newIndex = plan!.stops.findIndex((s) => s.id === over.id);
      
      const newStops = arrayMove(plan!.stops, oldIndex, newIndex);
      reorderStops(newStops);
    }
  }

  const handleAddStop = () => {
    if (!newStop.name) return;
    addCustomStop({
      id: Math.random().toString(36).substring(7),
      name: newStop.name || 'Custom Stop',
      type: (newStop.type as any) || 'custom',
      description: newStop.description || '',
      estimatedArrivalTime: new Date().toISOString(), // Mock time
      estimatedStopDuration: newStop.estimatedStopDuration || '1h',
      distanceFromStart: 'Manual',
      mustVisit: false,
      isOpen: true,
      isCustom: true
    });
    setIsOpen(false);
    setNewStop({ name: '', type: 'custom', description: '', estimatedStopDuration: '1h' });
  };

  const setIsOpen = (open: boolean) => setIsAddStopOpen(open);

  return (
    <div>
      <div className="flex justify-end mb-6">
        <Dialog open={isAddStopOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="hover-elevate">
              <Plus className="w-4 h-4 mr-2" /> Add Custom Stop
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Custom Stop</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={newStop.name} 
                  onChange={(e) => setNewStop({...newStop, name: e.target.value})} 
                  placeholder="E.g., Grand Canyon Entrance" 
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newStop.type} onValueChange={(v) => setNewStop({...newStop, type: v as any})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(StopType).map(t => (
                      <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Estimated Duration</Label>
                <Input 
                  id="duration" 
                  value={newStop.estimatedStopDuration} 
                  onChange={(e) => setNewStop({...newStop, estimatedStopDuration: e.target.value})} 
                  placeholder="E.g., 2h 30m" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  value={newStop.description} 
                  onChange={(e) => setNewStop({...newStop, description: e.target.value})} 
                  placeholder="Optional notes..." 
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={handleAddStop}>Add Stop</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="py-6 pl-4 sm:pl-8 border-l-2 border-primary/20 space-y-12 relative">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={plan.stops.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {plan.stops.map((stop, idx) => {
              const prevStop = previousPlan?.stops.find(s => s.id === stop.id);
              const isNew = previousPlan && !prevStop;
              const timeChanged = prevStop && prevStop.estimatedArrivalTime !== stop.estimatedArrivalTime;
              const wasClosed = prevStop && !prevStop.isOpen && stop.isOpen;
              const isDiff = isNew || timeChanged || wasClosed || false;

              return (
                <SortableStopItem 
                  key={stop.id}
                  stop={stop}
                  idx={idx}
                  isDiff={!!isDiff}
                  isNew={!!isNew}
                />
              );
            })}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
