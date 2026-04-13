import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MultiSelect } from "@/components/ui/multi-select"
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
  subsetor: string | null
  lideranca: string
  status: string
  turno: string | null
  sexo: string | null
}

export default function ChamadaSabado() {
  const { toast } = useToast()
  const [selectedSaturday, setSelectedSaturday] = useState<Date | undefined>(undefined)
  const [previsoes, setPrevisoes] = useState<{ [key: string]: boolean }>({})
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filterLideranca, setFilterLideranca] = useState<string[]>([])
  const [filterTurno, setFilterTurno] = useState<string[]>([])
  const [filterSexo, setFilterSexo] = useState<string[]>([])
  const [filterSetor, setFilterSetor] = useState<string[]>([])
  const [filterSubsetor, setFilterSubsetor] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string[]>([])

  useEffect(() => {
    fetchColaboradores()

    const chamadasChannel = supabase
      .channel('chamadas-sabado-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chamadas'
        },
        (payload) => {
          if (!selectedSaturday) return
          const selectedDate = selectedSaturday.toISOString().split('T')[0]
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newRecord = payload.new as { colaborador_id: string; data: string; status: string }
            if (newRecord.data === selectedDate) {
              if (newRecord.status === 'vira_sabado') {
                setPrevisoes(prev => ({ ...prev, [newRecord.colaborador_id]: true }))
              } else if (newRecord.status === 'nao_vira_sabado') {
                setPrevisoes(prev => ({ ...prev, [newRecord.colaborador_id]: false }))
              }
            }
          } else if (payload.eventType === 'DELETE') {
            const oldRecord = payload.old as { colaborador_id: string; data: string }
            if (oldRecord.data === selectedDate) {
              setPrevisoes(prev => {
                const newPrevisoes = { ...prev }
                delete newPrevisoes[oldRecord.colaborador_id]
                return newPrevisoes
              })
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(chamadasChannel)
    }
  }, [selectedSaturday])

  useEffect(() => {
    if (selectedSaturday) {
      fetchPrevisoesDaSemana()
    }
  }, [selectedSaturday])

  const fetchColaboradores = async () => {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('id, matricula, colaborador, setor, subsetor, lideranca, status, turno, sexo')
        .order('colaborador')

      if (error) {
        toast({ title: "Erro", description: "Erro ao carregar colaboradores: " + error.message, variant: "destructive" })
        return
      }

      setColaboradores(data || [])
      
      if (!selectedSaturday) {
        const today = new Date()
        const nextSaturday = new Date(today)
        const daysUntilSaturday = 6 - today.getDay()
        nextSaturday.setDate(today.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday))
        setSelectedSaturday(nextSaturday)
      }
    } catch (error) {
      toast({ title: "Erro", description: "Erro inesperado ao carregar colaboradores", variant: "destructive" })
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
        toast({ title: "Erro", description: "Erro ao carregar previsões: " + error.message, variant: "destructive" })
        return
      }

      const previsoesMap: { [key: string]: boolean } = {}
      data?.forEach(chamada => {
        if (chamada.status === "vira_sabado") {
          previsoesMap[chamada.colaborador_id] = true
        } else if (chamada.status === "nao_vira_sabado") {
          previsoesMap[chamada.colaborador_id] = false
        }
      })
      setPrevisoes(previsoesMap)
    } catch (error) {
      toast({ title: "Erro", description: "Erro inesperado ao carregar previsões", variant: "destructive" })
    }
  }

  const handlePrevisaoChange = (colaboradorId: string, vira: boolean) => {
    setPrevisoes(prev => {
      if (prev[colaboradorId] === vira) {
        const newState = { ...prev }
        delete newState[colaboradorId]
        return newState
      }
      return { ...prev, [colaboradorId]: vira }
    })
  }

  const handleSavePrevisoes = async () => {
    const totalPrevisoes = Object.keys(previsoes).length
    if (totalPrevisoes === 0) {
      toast({ title: "Atenção", description: "Selecione pelo menos uma previsão para salvar", variant: "destructive" })
      return
    }

    setSaving(true)

    try {
      if (!selectedSaturday) {
        toast({ title: "Erro", description: "Selecione um sábado primeiro", variant: "destructive" })
        return
      }

      const selectedDate = selectedSaturday.toISOString().split('T')[0]
      
      const allPrevisoes = Object.entries(previsoes).map(([colaboradorId, vira]) => ({
        colaborador_id: colaboradorId,
        data: selectedDate,
        status: vira ? "vira_sabado" : "nao_vira_sabado"
      }))

      if (allPrevisoes.length > 0) {
        const { error: upsertError } = await supabase
          .from('chamadas')
          .upsert(allPrevisoes, { onConflict: 'colaborador_id,data', ignoreDuplicates: false })

        if (upsertError) throw upsertError
      }

      const colaboradoresQueVirao = Object.values(previsoes).filter(v => v === true).length
      const colaboradoresQueNaoVirao = Object.values(previsoes).filter(v => v === false).length

      toast({ title: "Sucesso", description: `Previsão salva: ${colaboradoresQueVirao} virão no sábado, ${colaboradoresQueNaoVirao} não virão` })
    } catch (error: any) {
      toast({ title: "Erro", description: "Erro ao salvar previsão: " + error.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const disableNonSaturdays = (date: Date) => {
    return date.getDay() !== 6
  }

  const getBaseColaboradores = () => {
    let filtered = colaboradores
    // Apenas ativos
    filtered = filtered.filter(col => col.status === 'Ativo')
    // Excluir turno noturno
    filtered = filtered.filter(col => col.turno !== '22:00 - 06:52')
    return filtered
  }

  const getFilteredColaboradores = () => {
    let filtered = getBaseColaboradores()

    if (filterLideranca.length > 0) {
      filtered = filtered.filter(col => filterLideranca.includes(col.lideranca))
    }
    if (filterTurno.length > 0) {
      filtered = filtered.filter(col => col.turno && filterTurno.includes(col.turno))
    }
    if (filterSexo.length > 0) {
      filtered = filtered.filter(col => col.sexo && filterSexo.includes(col.sexo))
    }
    if (filterSetor.length > 0) {
      filtered = filtered.filter(col => filterSetor.includes(col.setor))
    }
    if (filterSubsetor.length > 0) {
      filtered = filtered.filter(col => col.subsetor && filterSubsetor.includes(col.subsetor))
    }
    if (filterStatus.length > 0) {
      filtered = filtered.filter(col => {
        if (filterStatus.includes('vira') && previsoes[col.id] === true) return true
        if (filterStatus.includes('nao_vira') && previsoes[col.id] === false) return true
        if (filterStatus.includes('pendente') && previsoes[col.id] === undefined) return true
        return false
      })
    }

    return filtered
  }

  const getPendingColaboradores = () => {
    return getFilteredColaboradores().filter(col => previsoes[col.id] === undefined)
  }

  const getPrevisaoSummary = () => {
    const base = getBaseColaboradores()
    const total = base.length
    const confirmados = base.filter(c => previsoes[c.id] === true).length
    const naoVirao = base.filter(c => previsoes[c.id] === false).length
    const pendentes = total - confirmados - naoVirao
    
    return { total, confirmados, naoVirao, pendentes }
  }

  const pendingColaboradores = getPendingColaboradores()
  const filteredColaboradores = getFilteredColaboradores()
  const base = getBaseColaboradores()
  const liderancas = [...new Set(base.map(c => c.lideranca).filter(l => l && l.trim() !== ''))]
  const turnos = [...new Set(base.map(c => c.turno).filter((t): t is string => !!t && t.trim() !== ''))]
  const setores = [...new Set(base.map(c => c.setor).filter(s => s && s.trim() !== ''))]
  const subsetores = [...new Set(base.map(c => c.subsetor).filter((s): s is string => !!s && s.trim() !== ''))]
  const summary = getPrevisaoSummary()

  const handleStatusFilterToggle = (status: string) => {
    setFilterStatus(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    )
  }

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Selecione o Sábado</Label>
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
                    disabled={disableNonSaturdays}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Filtrar por Liderança</Label>
              <MultiSelect
                options={liderancas}
                selected={filterLideranca}
                onChange={setFilterLideranca}
                placeholder="Todas as lideranças"
              />
            </div>

            <div className="space-y-2">
              <Label>Filtrar por Turno</Label>
              <MultiSelect
                options={turnos}
                selected={filterTurno}
                onChange={setFilterTurno}
                placeholder="Todos os turnos"
              />
            </div>

            <div className="space-y-2">
              <Label>Filtrar por Sexo</Label>
              <MultiSelect
                options={["Masculino", "Feminino"]}
                selected={filterSexo}
                onChange={setFilterSexo}
                placeholder="Todos"
              />
            </div>

            <div className="space-y-2">
              <Label>Filtrar por Setor</Label>
              <MultiSelect
                options={setores}
                selected={filterSetor}
                onChange={setFilterSetor}
                placeholder="Todos os setores"
              />
            </div>

            <div className="space-y-2">
              <Label>Filtrar por Subsetor</Label>
              <MultiSelect
                options={subsetores}
                selected={filterSubsetor}
                onChange={setFilterSubsetor}
                placeholder="Todos os subsetores"
              />
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
          <div className="grid grid-cols-3 gap-4">
            <div 
              className={cn(
                "text-center p-4 border rounded-lg cursor-pointer transition-all hover:scale-105",
                filterStatus.includes('vira') && "ring-2 ring-green-500"
              )}
              onClick={() => handleStatusFilterToggle('vira')}
            >
              <div className="w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-2 bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold mb-1">{summary.confirmados}</div>
              <div className="text-sm text-muted-foreground">Virá no Sábado</div>
              {summary.total > 0 && (
                <div className="text-xs font-medium text-green-600 mt-1">
                  {((summary.confirmados / summary.total) * 100).toFixed(1)}% do total
                </div>
              )}
            </div>
            <div 
              className={cn(
                "text-center p-4 border rounded-lg cursor-pointer transition-all hover:scale-105",
                filterStatus.includes('nao_vira') && "ring-2 ring-red-500"
              )}
              onClick={() => handleStatusFilterToggle('nao_vira')}
            >
              <div className="w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-2 bg-red-100">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-2xl font-bold mb-1">{summary.naoVirao}</div>
              <div className="text-sm text-muted-foreground">Não Virá</div>
              {summary.total > 0 && (
                <div className="text-xs font-medium text-red-600 mt-1">
                  {((summary.naoVirao / summary.total) * 100).toFixed(1)}% do total
                </div>
              )}
            </div>
            <div 
              className={cn(
                "text-center p-4 border rounded-lg cursor-pointer transition-all hover:scale-105",
                filterStatus.includes('pendente') && "ring-2 ring-orange-500"
              )}
              onClick={() => handleStatusFilterToggle('pendente')}
            >
              <div className="w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-2 bg-orange-100">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold mb-1">{summary.pendentes}</div>
              <div className="text-sm text-muted-foreground">Pendente</div>
              {summary.total > 0 && (
                <div className="text-xs font-medium text-orange-600 mt-1">
                  {((summary.pendentes / summary.total) * 100).toFixed(1)}% do total
                </div>
              )}
            </div>
          </div>

          {filterStatus.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtros ativos:</span>
              {filterStatus.map(s => (
                <Badge key={s} variant="secondary" className="cursor-pointer" onClick={() => handleStatusFilterToggle(s)}>
                  {s === 'vira' ? 'Virá' : s === 'nao_vira' ? 'Não Virá' : 'Pendente'}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setFilterStatus([])}>
                Limpar
              </Button>
            </div>
          )}
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
          
          <div className="flex gap-4 pt-4 border-t -mt-2">
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
