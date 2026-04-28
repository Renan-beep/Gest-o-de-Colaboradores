import { useState, ReactNode } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FullscreenWrapperProps {
  children: (isFullscreen: boolean) => ReactNode;
}

export function FullscreenWrapper({ children }: FullscreenWrapperProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div
      className={cn(
        isFullscreen &&
          "fixed inset-0 z-50 bg-background p-4 overflow-hidden flex flex-col"
      )}
    >
      <div className="flex justify-end mb-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsFullscreen((v) => !v)}
          className="gap-2"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-4 h-4" />
              Sair da tela cheia
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4" />
              Tela cheia
            </>
          )}
        </Button>
      </div>
      <div className={cn(isFullscreen && "flex-1 min-h-0 overflow-auto")}>
        {children(isFullscreen)}
      </div>
    </div>
  );
}
