import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { 
  CalendarCheck, 
  Save,
  Clock,
  Filter,
  AlertTriangle,
  CheckCircle,
  X,
  CalendarIcon
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

interface Colaborador {
  id: string
  matricula: string
  colaborador: string
  setor: string
  lideranca: string
  status: string
}

export default function ChamadaSabado() {
  const { toast } = useToast()
  const [selectedSaturday, setSelectedSaturday] = useState<Date | undefined>(undefined)
  const [previsoes, setPrevisoes] = useState<{ [key: string]: boolean }>({})
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filterLideranca, setFilterLideranca] = useState("todos")

  useEffect(() => {
    fetchColaboradores()
  }, [])

  useEffect(() => {
    if (selectedSaturday) {
      fetchPrevisoesDaSemana()
    }
  }, [selectedSaturday])

  const fetchColaboradores = async () => {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('id, matricula, colaborador, setor, lideranca, status')
        .order('colaborador')

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar colaboradores: " + error.message,
          variant: "destructive"
        })
        return
      }

      setColaboradores(data || [])
      
      // Definir automaticamente o próximo sábado
      if (!selectedSaturday) {
        const today = new Date()
        const nextSaturday = new Date(today)
        const daysUntilSaturday = 6 - today.getDay()
        nextSaturday.setDate(today.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday))
        setSelectedSaturday(nextSaturday)
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar colaboradores",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPrevisoesDaSemana = async () => {
    if (!selectedSaturday) return
    
    try {
      const selectedDate = selectedSaturday.toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('chamadas')
        .select('colaborador_id, status')
        .eq('data', selectedDate)

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar previsões: " + error.message,
          variant: "destructive"
        })
        return
      }

      const previsoesMap: { [key: string]: boolean } = {}
      data?.forEach(chamada => {
        previsoesMap[chamada.colaborador_id] = chamada.status === "vira_sabado"
      })
      setPrevisoes(previsoesMap)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar previsões",
        variant: "destructive"
      })
    }
  }

  const handlePrevisaoChange = (colaboradorId: string, vira: boolean) => {
    setPrevisoes(prev => ({
      ...prev,
      [colaboradorId]: vira
    }))
  }

  const handleSavePrevisoes = async () => {
    const totalPrevisoes = Object.keys(previsoes).length
    if (totalPrevisoes === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos uma previsão para salvar",
        variant: "destructive"
      })
      return
    }

    setSaving(true)

    try {
      if (!selectedSaturday) {
        toast({
          title: "Erro",
          description: "Selecione um sábado primeiro",
          variant: "destructive"
        })
        return
      }

      const selectedDate = selectedSaturday.toISOString().split('T')[0]
      
      // Preparar dados para inserção/atualização
      const previsoesToSave = Object.entries(previsoes)
        .filter(([_, vira]) => vira) // Apenas os que virão no sábado
        .map(([colaboradorId]) => ({
          colaborador_id: colaboradorId,
          data: selectedDate,
          status: "vira_sabado"
        }))

      // Primeiro, deletar registros existentes para esta data
      const { error: deleteError } = await supabase
        .from('chamadas')
        .delete()
        .eq('data', selectedDate)

      if (deleteError) throw deleteError

      // Depois, inserir os novos registros (apenas os que virão)
      if (previsoesToSave.length > 0) {
        const { error: insertError } = await supabase
          .from('chamadas')
          .insert(previsoesToSave)

        if (insertError) throw insertError
      }

      toast({
        title: "Sucesso",
        description: `Previsão salva para ${previsoesToSave.length} colaborador(es) que virão no sábado`,
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao salvar previsão: " + error.message,
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const getSaturdayDates = () => {
    const today = new Date()
    const year = today.getFullYear()
    const saturdays = []
    
    // Buscar todos os sábados do ano
    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day)
        if (date.getDay() === 6) {
          saturdays.push(date.toISOString().split('T')[0])
        }
      }
    }
    
    return saturdays
  }

  const isSaturday = (date: Date) => {
    return date.getDay() === 6
  }

  const getPendingColaboradores = () => {
    const filteredCols = getFilteredColaboradores()
    return filteredCols.filter(col => previsoes[col.id] === undefined)
  }

  const getFilteredColaboradores = () => {
    let filtered = colaboradores

    // Filtrar apenas colaboradores ativos
    filtered = filtered.filter(col => col.status === 'Ativo')

    // Filtrar por liderança
    if (filterLideranca !== "todos") {
      filtered = filtered.filter(col => col.lideranca === filterLideranca)
    }

    return filtered
  }

  const getPrevisaoSummary = () => {
    const total = getFilteredColaboradores().length
    const confirmados = Object.values(previsoes).filter(v => v === true).length
    const naoVirao = Object.values(previsoes).filter(v => v === false).length
    const pendentes = total - confirmados - naoVirao
    
    return { total, confirmados, naoVirao, pendentes }
  }

  const pendingColaboradores = getPendingColaboradores()
  const filteredColaboradores = getFilteredColaboradores()
  const liderancas = [...new Set(colaboradores.map(c => c.lideranca).filter(l => l && l.trim() !== ''))]
  const summary = getPrevisaoSummary()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <CalendarCheck className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Previsão de Sábados</h1>
            <p className="text-muted-foreground">Carregando colaboradores...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarCheck className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Previsão de Sábados</h1>
          <p className="text-muted-foreground">Defina quem virá trabalhar nos sábados do mês</p>
        </div>
      </div>

      {/* Seleção de Sábado e Filtros */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5" />
            Sábado e Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecione o Sábado</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedSaturday && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedSaturday ? (
                      format(selectedSaturday, "dd/MM/yyyy")
                    ) : (
                      <span>Escolha um sábado</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedSaturday}
                    onSelect={setSelectedSaturday}
                    disabled={(date) => !isSaturday(date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Filtrar por Liderança</label>
              <Select value={filterLideranca} onValueChange={setFilterLideranca}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as lideranças" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as lideranças</SelectItem>
                  {liderancas.map(lideranca => (
                    <SelectItem key={lideranca} value={lideranca}>{lideranca}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {filteredColaboradores.length} colaboradores
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indicador de Pendências */}
      {pendingColaboradores.length > 0 && (
        <Card className="shadow-card border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="w-5 h-5" />
              Pendências da Previsão
            </CardTitle>
            <CardDescription className="text-orange-600">
              {pendingColaboradores.length} colaborador(es) ainda não tiveram previsão definida
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingColaboradores.map(col => (
                <div key={col.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="font-medium">{col.colaborador}</span>
                  <span className="text-sm text-muted-foreground">Liderança: {col.lideranca}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Indicadores Quantitativos */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Indicadores de Previsão</CardTitle>
          <CardDescription>
            Resumo da previsão para o sábado {selectedSaturday ? selectedSaturday.toLocaleDateString('pt-BR') : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-2 bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold mb-1">{summary.confirmados}</div>
              <div className="text-sm text-muted-foreground">Virá no Sábado</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-2 bg-red-100">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-2xl font-bold mb-1">{summary.naoVirao}</div>
              <div className="text-sm text-muted-foreground">Não Vira</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Colaboradores */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Lista de Colaboradores</CardTitle>
          <CardDescription>
            Defina quem virá trabalhar no sábado selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredColaboradores.map((colaborador) => (
              <div 
                key={colaborador.id} 
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 mb-4 sm:mb-0">
                  <div className="font-medium">{colaborador.colaborador}</div>
                  <div className="text-sm text-muted-foreground">
                    Matrícula: {colaborador.matricula} • {colaborador.setor} • Liderança: {colaborador.lideranca}
                  </div>
                  {previsoes[colaborador.id] !== undefined && (
                    <div className="mt-2">
                      <Badge className={previsoes[colaborador.id] ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {previsoes[colaborador.id] ? "Virá no sábado" : "Não virá"}
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant={previsoes[colaborador.id] === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePrevisaoChange(colaborador.id, true)}
                    className={previsoes[colaborador.id] === true ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Virá no Sábado
                  </Button>
                  <Button
                    variant={previsoes[colaborador.id] === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePrevisaoChange(colaborador.id, false)}
                    className={previsoes[colaborador.id] === false ? "bg-red-600 hover:bg-red-700" : ""}
                  >
                    Não Virá
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-4 pt-6 border-t">
            <Button 
              onClick={handleSavePrevisoes} 
              className="flex-1 sm:flex-none"
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Previsão"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setPrevisoes({})}
            >
              Limpar Seleções
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}