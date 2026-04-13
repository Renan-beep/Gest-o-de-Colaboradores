import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface OnboardingOverlayProps {
  isActive: boolean;
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export function OnboardingOverlay({
  isActive,
  title,
  description,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onClose,
}: OnboardingOverlayProps) {
  if (!isActive) return null;

  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <Card className="relative z-10 w-[90vw] max-w-lg mx-4 shadow-2xl border-2 border-primary/20 animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {currentStep + 1} / {totalSteps}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          <Progress value={progress} className="mt-4 h-1.5" />
        </CardContent>
        <CardFooter className="flex justify-between pt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrev}
            disabled={isFirst}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
          <Button
            size="sm"
            onClick={onNext}
          >
            {isLast ? "Concluir" : "Próximo"}
            {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
