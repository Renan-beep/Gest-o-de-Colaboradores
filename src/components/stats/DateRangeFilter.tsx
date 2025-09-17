import { format, isBefore, isSameDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRangeFilterProps {
  startDate?: Date;
  endDate?: Date;
  onDateChange: (start?: Date, end?: Date) => void;
}

export function DateRangeFilter({ startDate, endDate, onDateChange }: DateRangeFilterProps) {
  const getCurrentRangeLabel = () => {
    if (!startDate || !endDate) return "Selecione um período";
    
    if (isSameDay(startDate, endDate)) {
      return format(startDate, "dd/MM/yyyy");
    }
    
    return `${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`;
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Período Personalizado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Período atual */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-sm">Período Selecionado</h3>
            <p className="text-lg font-semibold text-primary">{getCurrentRangeLabel()}</p>
          </div>
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>

        {/* Seleção de período personalizado */}
        <div>
          <h4 className="font-medium text-sm mb-3">Selecione o Período</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data de início */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Data de Início</label>
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
                    onSelect={(date) => date && onDateChange(date, endDate)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data de fim */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Data de Fim</label>
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
                    onSelect={(date) => date && onDateChange(startDate, date)}
                    disabled={(date) => startDate ? isBefore(date, startDate) : false}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            <p>💡 <strong>Dica:</strong> Selecione a mesma data para início e fim para visualizar dados de um único dia.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}