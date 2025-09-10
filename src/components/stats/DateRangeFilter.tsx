import { useState } from "react";
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { pt } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRangeFilterProps {
  startDate?: Date;
  endDate?: Date;
  onDateChange: (start?: Date, end?: Date) => void;
}

export function DateRangeFilter({ startDate, endDate, onDateChange }: DateRangeFilterProps) {
  const [showCustom, setShowCustom] = useState(false);

  const presetRanges = [
    {
      label: "Últimos 7 dias",
      getValue: () => ({ start: subDays(new Date(), 7), end: new Date() })
    },
    {
      label: "Últimos 30 dias", 
      getValue: () => ({ start: subDays(new Date(), 30), end: new Date() })
    },
    {
      label: "Últimos 60 dias",
      getValue: () => ({ start: subDays(new Date(), 60), end: new Date() })
    },
    {
      label: "Últimos 90 dias",
      getValue: () => ({ start: subDays(new Date(), 90), end: new Date() })
    },
    {
      label: "Este mês",
      getValue: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) })
    },
    {
      label: "Mês passado",
      getValue: () => {
        const lastMonth = subMonths(new Date(), 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      }
    },
    {
      label: "Últimos 6 meses",
      getValue: () => ({ start: subMonths(new Date(), 6), end: new Date() })
    },
    {
      label: "Este ano",
      getValue: () => ({ start: startOfYear(new Date()), end: endOfYear(new Date()) })
    }
  ];

  // Meses específicos dos últimos 12 meses
  const monthlyRanges = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    return {
      label: format(date, "MMMM yyyy", { locale: pt }),
      getValue: () => ({ start: monthStart, end: monthEnd })
    };
  });

  const handlePresetClick = (getValue: () => { start: Date; end: Date }) => {
    const { start, end } = getValue();
    onDateChange(start, end);
    setShowCustom(false);
  };

  const getCurrentRangeLabel = () => {
    if (!startDate || !endDate) return "Selecionar período";
    
    const diffInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays <= 1) {
      return format(startDate, "dd/MM/yyyy");
    }
    
    return `${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`;
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Filtro de Período
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Indicador do período atual */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="w-4 h-4" />
            Período selecionado:
          </div>
          <Badge variant="outline" className="mt-1">
            {getCurrentRangeLabel()}
          </Badge>
        </div>

        {/* Botões de períodos pré-definidos */}
        <div>
          <h4 className="text-sm font-medium mb-3">Períodos rápidos:</h4>
          <div className="grid grid-cols-2 gap-2">
            {presetRanges.map((range, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick(range.getValue)}
                className="text-xs justify-start"
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Meses específicos */}
        <div>
          <h4 className="text-sm font-medium mb-3">Por mês:</h4>
          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {monthlyRanges.map((range, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => handlePresetClick(range.getValue)}
                className="text-xs justify-start capitalize"
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Seleção customizada */}
        <div className="border-t pt-4">
          <Button
            variant="outline"
            onClick={() => setShowCustom(!showCustom)}
            className="w-full mb-3"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Período personalizado
          </Button>

          {showCustom && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Data Início</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "dd/MM/yyyy") : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => onDateChange(date, endDate)}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Data Fim</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "dd/MM/yyyy") : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => onDateChange(startDate, date)}
                        initialFocus
                        className="p-3 pointer-events-auto"
                        disabled={(date) => startDate ? date < startDate : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}