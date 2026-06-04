import React from 'react';
import { Check } from 'lucide-react';
import { AuthThemeConfig } from '../../../utils/authTheme';

interface StepDef {
  id: number;
  label: string;
}

interface AuthStepIndicatorProps {
  steps: StepDef[];
  currentStep: number;
  theme: AuthThemeConfig;
}

export const AuthStepIndicator: React.FC<AuthStepIndicatorProps> = ({
  steps,
  currentStep,
  theme,
}) => (
  <div className="mb-8">
    <div className="flex items-center justify-between gap-2">
      {steps.map((step, index) => {
        const isDone = currentStep > step.id;
        const isActive = currentStep === step.id;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div
                className={`w-9 h-9 rounded-[5px] border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isDone
                    ? theme.stepDone
                    : isActive
                      ? theme.stepActive
                      : theme.stepIdle
                }`}
              >
                {isDone ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <span
                className={`mt-2 text-[10px] sm:text-xs font-medium text-center truncate w-full ${
                  isActive ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 max-w-12 mb-6 rounded-full transition-colors ${
                  currentStep > step.id ? theme.accentBg : 'bg-slate-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  </div>
);
