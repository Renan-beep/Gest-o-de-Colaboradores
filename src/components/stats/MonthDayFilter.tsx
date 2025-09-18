import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"
import { format } from "date-fns"
import { Calendar, Check, X } from "lucide-react"

interface MonthData {
  year: number
  month: number
  label: string
  days: number[]
}

interface MonthDayFilterProps {
  selectedMonth?: string
  selectedDays?: string[]
  onSelectionChange: (month?: string, days?: string[]) => void
}

export function MonthDayFilter({ selectedMonth, selectedDays = [], onSelectionChange }: MonthDayFilterProps) {
  const [availableMonths, setAvailableMonths] = useState<MonthData[]>([])
  const [availableDays, setAvailableDays] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAvailableMonths()
  }, [])

  useEffect(() => {
    if (selectedMonth) {
      fetchAvailableDays(selectedMonth)
    } else {
      setAvailableDays([])
    }
  }, [selectedMonth])

  const fetchAvailableMonths = async () => {
    setLoading(true)
    try {
      const { data: chamadas, error } = await supabase
        .from('chamadas')
        .select('data')
        .order('data', { ascending: false })

      if (error) throw error

      // Agrupar datas por mês/ano
      const monthsMap = new Map<string, { year: number; month: number; days: Set<number> }>()

      chamadas?.forEach(chamada => {
        const date = new Date(chamada.data)
        const year = date.getFullYear()
        const month = date.getMonth()
        const day = date.getDate()
        const key = `${year}-${month}`

        if (!monthsMap.has(key)) {
          monthsMap.set(key, { year, month, days: new Set() })
        }
        monthsMap.get(key)!.days.add(day)
      })

      // Converter para array e ordenar
      const months: MonthData[] = Array.from(monthsMap.entries())
        .map(([key, data]) => ({
          year: data.year,
          month: data.month,
          label: format(new Date(data.year, data.month), 'MMMM yyyy'),
          days: Array.from(data.days).sort((a, b) => a - b)
        }))
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year
          return b.month - a.month
        })

      setAvailableMonths(months)
    } catch (error) {
      console.error('Erro ao buscar meses disponíveis:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableDays = async (monthKey: string) => {
    const [year, month] = monthKey.split('-').map(Number)
    const monthData = availableMonths.find(m => m.year === year && m.month === month)
    setAvailableDays(monthData?.days || [])
  }

  const handleMonthChange = (month: string) => {
    onSelectionChange(month, [])
  }

  const handleDayToggle = (day: string, checked: boolean) => {
    const currentDays = selectedDays || []
    const newDays = checked
      ? [...currentDays, day]
      : currentDays.filter(d => d !== day)
    
    onSelectionChange(selectedMonth, newDays)
  }

  const handleSelectAllDays = () => {
    if (!selectedMonth) return
    
    const [year, month] = selectedMonth.split('-').map(Number)
    const allDaysForMonth = availableDays.map(day => 
      format(new Date(year, month, day), 'yyyy-MM-dd')
    )
    
    onSelectionChange(selectedMonth, allDaysForMonth)
  }

  const handleClearDays = () => {
    onSelectionChange(selectedMonth, [])
  }

  const getSelectedCount = () => {
    return selectedDays?.length || 0
  }

  const monthOptions = availableMonths.map(month => ({
    value: `${month.year}-${month.month}`,
    label: month.label
  }))

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" />
          Filtros por Período
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seleção de Mês */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Selecionar Mês:</label>
          <Select value={selectedMonth} onValueChange={handleMonthChange}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um mês..." />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Seleção de Dias */}
        {selectedMonth && availableDays.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Dias com chamadas ({getSelectedCount()} selecionados):
              </label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSelectAllDays}
                  className="h-8 px-2 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Todos
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearDays}
                  className="h-8 px-2 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              </div>
            </div>

            <ScrollArea className="h-32 w-full rounded-md border p-2">
              <div className="grid grid-cols-7 gap-2">
                {availableDays.map(day => {
                  const [year, month] = selectedMonth.split('-').map(Number)
                  const dayDate = format(new Date(year, month, day), 'yyyy-MM-dd')
                  const isSelected = selectedDays?.includes(dayDate) || false

                  return (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => handleDayToggle(dayDate, !!checked)}
                      />
                      <label
                        htmlFor={`day-${day}`}
                        className="text-sm cursor-pointer hover:text-primary"
                      >
                        {day}
                      </label>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            {getSelectedCount() > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedDays?.map(date => {
                  const dayNum = new Date(date).getDate()
                  return (
                    <Badge key={date} variant="secondary" className="text-xs">
                      {dayNum}
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {selectedMonth && availableDays.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">
            Nenhum dia com chamadas encontrado para este mês
          </div>
        )}

        {loading && (
          <div className="text-sm text-muted-foreground text-center py-4">
            Carregando meses disponíveis...
          </div>
        )}
      </CardContent>
    </Card>
  )
}