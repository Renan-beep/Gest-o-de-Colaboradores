import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { 
  UserCheck, 
  Calendar as CalendarIcon, 
  Save,
  Clock,
  Coffee,
  Home,
  Heart,
  X,
  Filter,
  AlertTriangle,
  ChevronRight,
  RotateCcw
} from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { supabase } from "@/integrations/supabase/client"

interface Colaborador {
  id: string
  matricula: string
  colaborador: string
  setor: string
  lideranca: string
  sabado_trabalho: string
  status: string
  admissao: string | null
}

const statusOptions = [
  { value: "presente", label: "Presente", icon: UserCheck, color: "status-present" },
  { value: "folga", label: "Folga", icon: Home, color: "status-break" },
  { value: "falta", label: "Falta", icon: X, color: "status-absent" },
  { value: "atestado", label: "Atestado", icon: Heart, color: "status-sick" },
  { value: "ferias", label: "Férias", icon: Coffee, color: "status-vacation" }
]

export default function Chamada() {
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [chamadas, setChamadas] = useState<{ [key: string]: string }>({})
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filterLideranca, setFilterLideranca] = useState("todos")
  const [datesWithPendencies, setDatesWithPendencies] = useState<string[]>([])
  const [loadingPendencies, setLoadingPendencies] = useState(false)
  const [primeiraDataChamada, setPrimeiraDataChamada] = useState<Date | null>(null)

  useEffect(() => {
    fetchColaboradores()
    fetchPrimeiraDataChamada()

    // Configurar listener para atualizações em tempo real na tabela colaboradores
    const colaboradoresChannel = supabase
      .channel('colaboradores-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'colaboradores'
        },
        (payload) => {
          console.log('Colaborador atualizado:', payload)
          // Recarregar colaboradores quando houver qualquer mudança
          fetchColaboradores()
        }
      )
      .subscribe((status) => {
        console.log('Status do canal de colaboradores:', status)
      })

    return () => {
      supabase.removeChannel(colaboradoresChannel)
    }
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchChamadasDoDia()
    }
  }, [selectedDate])

  useEffect(() => {
    if (colaboradores.length > 0) {
      fetchDatesWithPendencies()
    }
  }, [colaboradores, chamadas, selectedDate])

  const fetchPrimeiraDataChamada = async () => {
    try {
      const { data, error } = await supabase
        .from('chamadas')
        .select('data')
        .order('data', { ascending: true })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erro ao buscar primeira chamada:', error)
        return
      }

      if (data?.data) {
        setPrimeiraDataChamada(new Date(data.data))
      }
    } catch (error) {
      console.error('Erro ao buscar primeira data de chamada:', error)
    }
  }

  const fetchColaboradores = async () => {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('id, matricula, colaborador, setor, lideranca, sabado_trabalho, status, admissao')
        .order('colaborador')

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar colaboradores: " + error.message,
          variant: "destructive"
        })
        return
      }

      console.log('Colaboradores carregados:', data?.length, 'colaboradores')
      console.log('Lideranças disponíveis:', [...new Set(data?.map(c => c.lideranca).filter(l => l && l.trim() !== ''))])
      setColaboradores(data || [])
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

  const fetchChamadasDoDia = async () => {
    try {
      const { data, error } = await supabase
        .from('chamadas')
        .select('colaborador_id, status')
        .eq('data', selectedDate)

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar chamadas: " + error.message,
          variant: "destructive"
        })
        return
      }

      const chamadasMap: { [key: string]: string } = {}
      data?.forEach(chamada => {
        chamadasMap[chamada.colaborador_id] = chamada.status
      })
      setChamadas(chamadasMap)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar chamadas",
        variant: "destructive"
      })
    }
  }

  const fetchDatesWithPendencies = async () => {
    setLoadingPendencies(true)
    try {
      // Pegar o mês da data selecionada
      const [year, month] = selectedDate.split('-')
      const firstDay = new Date(parseInt(year), parseInt(month) - 1, 1)
      const lastDay = new Date(parseInt(year), parseInt(month), 0)
      
      const startDate = firstDay.toISOString().split('T')[0]
      const endDate = lastDay.toISOString().split('T')[0]

      console.log(`Buscando pendências do mês ${month}/${year} (${startDate} a ${endDate})`)

      // Buscar colaboradores ativos
      const activeColaboradores = colaboradores.filter(col => col.status === 'Ativo')
      if (activeColaboradores.length === 0) return

      // Buscar todas as chamadas do mês selecionado
      const { data: allChamadas, error: chamadasError } = await supabase
        .from('chamadas')
        .select('data, colaborador_id')
        .gte('data', startDate)
        .lte('data', endDate)

      if (chamadasError) {
        console.error('Erro ao buscar chamadas:', chamadasError)
        return
      }

      // Buscar movimentações aprovadas que afetam liderança
      const { data: movimentacoes, error: movError } = await supabase
        .from('solicitacoes_movimentacao')
        .select('colaborador_id, data_inicio, lideranca_origem, lideranca_destino')
        .eq('status', 'aprovada')
        .not('lideranca_destino', 'is', null)

      if (movError) {
        console.error('Erro ao buscar movimentações:', movError)
      }

      // Criar mapa de movimentações por colaborador
      const movimentacoesPorColaborador: { [key: string]: Array<{data_inicio: string, lideranca_origem: string | null, lideranca_destino: string | null}> } = {}
      movimentacoes?.forEach(mov => {
        if (!movimentacoesPorColaborador[mov.colaborador_id]) {
          movimentacoesPorColaborador[mov.colaborador_id] = []
        }
        movimentacoesPorColaborador[mov.colaborador_id].push({
          data_inicio: mov.data_inicio,
          lideranca_origem: mov.lideranca_origem,
          lideranca_destino: mov.lideranca_destino
        })
      })

      // Agrupar chamadas por data
      const chamadasByDate: { [key: string]: Set<string> } = {}
      allChamadas?.forEach(chamada => {
        if (!chamadasByDate[chamada.data]) {
          chamadasByDate[chamada.data] = new Set()
        }
        chamadasByDate[chamada.data].add(chamada.colaborador_id)
      })

      // Função para verificar qual era a liderança do colaborador em uma data específica
      const getLiderancaNaData = (colaboradorId: string, liderancaAtual: string, dataVerificar: string): string => {
        const movs = movimentacoesPorColaborador[colaboradorId]
        if (!movs || movs.length === 0) return liderancaAtual

        // Ordenar movimentações por data decrescente
        const movsOrdenadas = movs.sort((a, b) => b.data_inicio.localeCompare(a.data_inicio))

        // Encontrar a última movimentação antes ou igual à data verificada
        for (const mov of movsOrdenadas) {
          if (mov.data_inicio <= dataVerificar) {
            return mov.lideranca_destino || liderancaAtual
          }
        }

        const movMaisAntiga = movsOrdenadas[movsOrdenadas.length - 1]
        return movMaisAntiga.lideranca_origem || liderancaAtual
      }

      // Identificar datas com pendências no mês
      const datesWithPending: string[] = []
      const currentDate = new Date(firstDay)

      while (currentDate <= lastDay) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const dayOfWeek = currentDate.getDay()
        
        // Pular domingos
        if (dayOfWeek === 0) {
          currentDate.setDate(currentDate.getDate() + 1)
          continue
        }

        // Filtrar colaboradores esperados para esta data
        const colaboradoresEsperadosNaData = activeColaboradores.filter(col => {
          // Verificar se o colaborador já estava admitido nesta data
          const admissaoDate = col.admissao ? new Date(col.admissao) : null
          if (admissaoDate && admissaoDate > currentDate) {
            return false
          }

          const liderancaNaData = getLiderancaNaData(col.id, col.lideranca, dateStr)
          
          // Se não há liderança filtrada, incluir todos
          if (!filterLideranca || filterLideranca === 'todos') return true
          
          // Se há filtro de liderança, verificar se o colaborador pertencia a ela
          return liderancaNaData === filterLideranca
        })

        const chamadasNaData = chamadasByDate[dateStr] || new Set()
        const totalEsperado = colaboradoresEsperadosNaData.length
        const totalChamadas = chamadasNaData.size

        console.log(`${dateStr}: ${totalChamadas}/${totalEsperado} chamadas`)

        // CRÍTICO: Se falta pelo menos 1 colaborador, é pendência
        if (totalEsperado > 0 && totalChamadas < totalEsperado) {
          datesWithPending.push(dateStr)
          console.log(`⚠️ Pendência em ${dateStr}: faltam ${totalEsperado - totalChamadas} de ${totalEsperado} colaboradores`)
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }

      // Ordenar por data decrescente
      setDatesWithPendencies(
        datesWithPending.sort((a, b) => b.localeCompare(a))
      )
      
      console.log(`Total de datas com pendência no mês: ${datesWithPending.length}`)
    } catch (error) {
      console.error('Erro ao buscar datas com pendências:', error)
    } finally {
      setLoadingPendencies(false)
    }
  }

  const handleStatusChange = (colaboradorId: string, status: string) => {
    setChamadas(prev => ({
      ...prev,
      [colaboradorId]: status
    }))
  }

  const handleSaveChamada = async () => {
    const totalChamadas = Object.keys(chamadas).length
    if (totalChamadas === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos um status para salvar a chamada",
        variant: "destructive"
      })
      return
    }

    setSaving(true)

    try {
      // Preparar dados para inserção/atualização
      const chamadasToSave = Object.entries(chamadas).map(([colaboradorId, status]) => ({
        colaborador_id: colaboradorId,
        data: selectedDate,
        status: status
      }))

      // Primeiro, deletar registros existentes para esta data
      const { error: deleteError } = await supabase
        .from('chamadas')
        .delete()
        .eq('data', selectedDate)

      if (deleteError) throw deleteError

      // Depois, inserir os novos registros
      const { error: insertError } = await supabase
        .from('chamadas')
        .insert(chamadasToSave)

      if (insertError) throw insertError

      toast({
        title: "Sucesso",
        description: `Chamada salva para ${totalChamadas} colaborador(es)`,
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao salvar chamada: " + error.message,
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status)
    if (!statusOption) return null

    const IconComponent = statusOption.icon
    return (
      <Badge className={statusOption.color}>
        <IconComponent className="w-3 h-3 mr-1" />
        {statusOption.label}
      </Badge>
    )
  }

  const getStatusCounts = () => {
    const counts = statusOptions.reduce((acc, option) => {
      acc[option.value] = 0
      return acc
    }, {} as { [key: string]: number })

    Object.values(chamadas).forEach(status => {
      if (counts[status] !== undefined) {
        counts[status]++
      }
    })

    return counts
  }

  const getPendingColaboradores = () => {
    const filteredCols = getFilteredColaboradores()
    return filteredCols.filter(col => !chamadas[col.id])
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


  const statusCounts = getStatusCounts()
  const pendingColaboradores = getPendingColaboradores()
  const filteredColaboradores = getFilteredColaboradores()
  const liderancas = [...new Set(colaboradores.map(c => c.lideranca).filter(l => l && l.trim() !== ''))]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Chamada Diária</h1>
            <p className="text-muted-foreground">Carregando colaboradores...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Chamada Diária</h1>
            <p className="text-muted-foreground">Registre a presença dos colaboradores</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchColaboradores}
          disabled={loading}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Atualizar Lista
        </Button>
      </div>

      {/* Datas com Pendências */}
      {datesWithPendencies.length > 0 && (
        <Card className="shadow-card border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="w-5 h-5" />
              Datas com Pendências
            </CardTitle>
            <CardDescription className="text-yellow-600">
              Clique em uma data para ir diretamente para ela e resolver as pendências
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {datesWithPendencies.map(date => (
                <Button
                  key={date}
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(date)}
                  className={`flex items-center gap-2 ${
                    selectedDate === date 
                      ? 'bg-yellow-500 border-yellow-600 text-white hover:bg-yellow-600' 
                      : 'bg-white border-yellow-300 text-yellow-800 hover:bg-yellow-100'
                  }`}
                >
                  <CalendarIcon className="w-4 h-4" />
                  {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seleção de Data e Filtros */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Data da Chamada e Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Selecione a Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(new Date(selectedDate + 'T12:00:00'), "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate ? new Date(selectedDate + 'T12:00:00') : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const year = date.getFullYear()
                        const month = String(date.getMonth() + 1).padStart(2, '0')
                        const day = String(date.getDate()).padStart(2, '0')
                        setSelectedDate(`${year}-${month}-${day}`)
                      }
                    }}
                    disabled={(date) => {
                      const today = new Date()
                      today.setHours(23, 59, 59, 999)
                      
                      // Desabilitar datas futuras
                      if (date > today) return true
                      
                      // Desabilitar datas anteriores à primeira chamada
                      if (primeiraDataChamada) {
                        const dataChamada = new Date(primeiraDataChamada)
                        dataChamada.setHours(0, 0, 0, 0)
                        const dataCheck = new Date(date)
                        dataCheck.setHours(0, 0, 0, 0)
                        if (dataCheck < dataChamada) return true
                      }
                      
                      return false
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Filtrar por Liderança</Label>
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
              Pendências da Chamada
            </CardTitle>
            <CardDescription className="text-orange-600">
              {pendingColaboradores.length} colaborador(es) ainda não tiveram presença registrada
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
          <CardTitle>Indicadores do Dia</CardTitle>
          <CardDescription>
            Resumo quantitativo da chamada do dia {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {statusOptions.map(option => {
              const IconComponent = option.icon
              return (
                <div key={option.value} className="text-center p-4 border rounded-lg">
                  <div className={`w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-2 ${
                    option.value === 'presente' ? 'bg-green-100' :
                    option.value === 'falta' ? 'bg-red-100' :
                    option.value === 'folga' ? 'bg-orange-100' :
                    option.value === 'atestado' ? 'bg-pink-100' :
                    'bg-purple-100'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${
                      option.value === 'presente' ? 'text-green-600' :
                      option.value === 'falta' ? 'text-red-600' :
                      option.value === 'folga' ? 'text-orange-600' :
                      option.value === 'atestado' ? 'text-pink-600' :
                      'text-purple-600'
                    }`} />
                  </div>
                  <div className="text-2xl font-bold mb-1">{statusCounts[option.value]}</div>
                  <div className="text-sm text-muted-foreground">{option.label}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Colaboradores */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Lista de Colaboradores</CardTitle>
          <CardDescription>
            Clique nos botões para marcar a presença de cada colaborador
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
                    Matrícula: {colaborador.matricula} • {colaborador.setor}
                  </div>
                  {chamadas[colaborador.id] && (
                    <div className="mt-2">
                      {getStatusBadge(chamadas[colaborador.id])}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((option) => {
                    const IconComponent = option.icon
                    const isSelected = chamadas[colaborador.id] === option.value
                    
                    return (
                      <Button
                        key={option.value}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStatusChange(colaborador.id, option.value)}
                        className={isSelected ? option.color : ""}
                      >
                        <IconComponent className="w-4 h-4 mr-1" />
                        {option.label}
                      </Button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-4 pt-6 border-t">
            <Button 
              onClick={handleSaveChamada} 
              className="flex-1 sm:flex-none"
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Chamada"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setChamadas({})}
            >
              Limpar Seleções
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}