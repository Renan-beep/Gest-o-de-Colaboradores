import { TourStep, usePageTour } from "@/hooks/usePageTour";
import { OnboardingOverlay } from "./OnboardingOverlay";
import { PageTourButton } from "./PageTourButton";

interface PageTourProps {
  steps: TourStep[];
}

export function PageTour({ steps }: PageTourProps) {
  const tour = usePageTour(steps);

  return (
    <>
      <PageTourButton onClick={tour.startTour} />
      <OnboardingOverlay
        isActive={tour.isActive}
        title={tour.currentStep?.title || ""}
        description={tour.currentStep?.description || ""}
        currentStep={tour.currentStepIndex}
        totalSteps={tour.totalSteps}
        onNext={tour.nextStep}
        onPrev={tour.prevStep}
        onClose={tour.endTour}
      />
    </>
  );
}
