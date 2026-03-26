import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Step1Vehicle } from '@/components/wizard/Step1Vehicle';
import { Step2Route } from '@/components/wizard/Step2Route';
import { Step3Routes } from '@/components/wizard/Step3Routes';

export default function PlanWizard() {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-border rounded-full z-0" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-500 ease-out" 
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
            
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-colors duration-300 border-4 border-background
                  ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                `}
              >
                {s}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            <span className={step >= 1 ? 'text-primary' : ''}>Vehicle</span>
            <span className={step >= 2 ? 'text-primary' : ''}>Route</span>
            <span className={step >= 3 ? 'text-primary' : ''}>Options</span>
          </div>
        </div>

        {/* Render Active Step */}
        <div className="bg-card rounded-3xl p-6 sm:p-10 shadow-xl shadow-black/5 border border-border/60">
          {step === 1 && <Step1Vehicle onNext={() => setStep(2)} />}
          {step === 2 && <Step2Route onNext={() => setStep(3)} />}
          {step === 3 && <Step3Routes />}
        </div>
      </main>
    </div>
  );
}
