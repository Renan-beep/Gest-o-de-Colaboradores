import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PageTourButtonProps {
  onClick: () => void;
}

export function PageTourButton({ onClick }: PageTourButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick}
          size="icon"
          variant="outline"
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg border-2 border-primary/30 bg-card hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110"
        >
          <HelpCircle className="w-6 h-6" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>Tour desta página</p>
      </TooltipContent>
    </Tooltip>
  );
}
