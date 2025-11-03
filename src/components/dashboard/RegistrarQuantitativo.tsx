import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { ptBR } from 'date-fns/locale'

export function RegistrarQuantitativo() {
  const [date, setDate] = useState<Date>()
  const [totalEsperado, setTotalEsperado] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRegistrarAutomatico = async () => {
    if (!date) {
      toast.error('Selecione uma data')
      return
    }

    setIsLoading(true)
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      
      // Buscar quantas chamadas existem nesta data
      const { count, error: countError } = await supabase
        .from('chamadas')
        .select('*', { count: 'exact', head: true })
        .eq('data', dateStr)

      if (countError) throw countError

      // Registrar o quantitativo baseado nas chamadas existentes
      const { error } = await supabase
        .from('historico_quantitativo_diario')
        .upsert({
          data: dateStr,
          total_esperado: count || 0
        })

      if (error) throw error

      toast.success(`Quantitativo registrado: ${count} colaboradores em ${format(date, 'dd/MM/yyyy', { locale: ptBR })}`)
      setDate(undefined)
      setTotalEsperado('')
    } catch (error) {
      console.error('Erro ao registrar quantitativo:', error)
      toast.error('Erro ao registrar quantitativo')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegistrar = async () => {
    if (!date || !totalEsperado) {
      toast.error('Selecione uma data e informe o total esperado')
      return
    }

    setIsLoading(true)
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      
      const { error } = await supabase
        .from('historico_quantitativo_diario')
        .upsert({
          data: dateStr,
          total_esperado: parseInt(totalEsperado)
        })

      if (error) throw error

      toast.success(`Quantitativo registrado para ${format(date, 'dd/MM/yyyy', { locale: ptBR })}`)
      setDate(undefined)
      setTotalEsperado('')
    } catch (error) {
      console.error('Erro ao registrar quantitativo:', error)
      toast.error('Erro ao registrar quantitativo')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold">Registrar Quantitativo do Dia</h3>
      
      <div className="flex flex-col gap-2">
        <Label htmlFor="data">Data</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione uma data'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="total">Total Esperado</Label>
        <Input
          id="total"
          type="number"
          value={totalEsperado}
          onChange={(e) => setTotalEsperado(e.target.value)}
          placeholder="Quantidade de colaboradores"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleRegistrarAutomatico} disabled={isLoading} className="flex-1">
          {isLoading ? 'Registrando...' : 'Auto (Usar Registros)'}
        </Button>
        <Button onClick={handleRegistrar} disabled={isLoading} variant="outline" className="flex-1">
          {isLoading ? 'Registrando...' : 'Manual'}
        </Button>
      </div>
    </div>
  )
}
