import { useState, useCallback } from "react";

export interface TourStep {
  title: string;
  description: string;
}

export function usePageTour(steps: TourStep[]) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const startTour = useCallback(() => {
    setCurrentStepIndex(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex + 1 >= steps.length) {
      setIsActive(false);
      return;
    }
    setCurrentStepIndex(prev => prev + 1);
  }, [currentStepIndex, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) setCurrentStepIndex(prev => prev - 1);
  }, [currentStepIndex]);

  const endTour = useCallback(() => {
    setIsActive(false);
  }, []);

  return {
    isActive,
    currentStep: steps[currentStepIndex] || null,
    currentStepIndex,
    totalSteps: steps.length,
    startTour,
    nextStep,
    prevStep,
    endTour,
  };
}
