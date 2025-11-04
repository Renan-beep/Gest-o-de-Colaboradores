import { useState, useEffect, useRef } from "react"
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
  RotateCcw,
  Settings
} from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { supabase } from "@/integrations/supabase/client"
import { GraficoPendenciasLideres } from "@/components/dashboard/GraficoPendenciasLideres"

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
  const [domingoEspecificoAtivo, setDomingoEspecificoAtivo] = useState(false)
  const [domingoEspecificoData, setDomingoEspecificoData] = useState<string | null>(null)
  const [movimentacoes, setMovimentacoes] = useState<Array<{colaborador_id: string, data_inicio: string, lideranca_origem: string | null, lideranca_destino: string | null, tipo_movimentacao: string}>>([])
  const [highlightedColaborador, setHighlightedColaborador] = useState<string | null>(null)
  const colaboradorRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})


  useEffect(() => {
    fetchColaboradores()
    fetchPrimeiraDataChamada()
    fetchMovimentacoes()
    registrarQuantitativosAntigos()

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

  // Não é mais necessário - lógica foi movida para fetchDatesWithPendencies
  const registrarQuantitativosAntigos = async () => {
    // Removido - agora calculamos dinamicamente considerando admissão, demissão e movimentações
  }

  useEffect(() => {
    if (selectedDate) {
      fetchChamadasDoDia()
    }
  }, [selectedDate])

  useEffect(() => {
    if (colaboradores.length > 0) {
      // Usar um pequeno delay para garantir que os estados estão sincronizados
      const timer = setTimeout(() => {
        fetchDatesWithPendencies()
      }, 200)
      
      return () => clearTimeout(timer)
    }
  }, [colaboradores, chamadas, selectedDate, filterLideranca])

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

  const fetchMovimentacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('solicitacoes_movimentacao')
        .select('colaborador_id, data_inicio, lideranca_origem, lideranca_destino, tipo_movimentacao')
        .eq('status', 'aprovada')

      if (error) {
        console.error('Erro ao buscar movimentações:', error)
        return
      }

      setMovimentacoes(data || [])
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error)
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
      const [year, month] = selectedDate.split('-')
      const firstDay = new Date(parseInt(year), parseInt(month) - 1, 1)
      const lastDay = new Date(parseInt(year), parseInt(month), 0)
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const lastDayToCheck = lastDay < today ? lastDay : today
      
      const startDate = firstDay.toISOString().split('T')[0]
      const endDate = lastDayToCheck.toISOString().split('T')[0]

      console.log(`Verificando pendências: ${startDate} a ${endDate}`)

      // Buscar demissões
      const { data: demissoes, error: demissoesError } = await supabase
        .from('demissoes')
        .select('colaborador_id, data_demissao')

      if (demissoesError) {
        console.error('Erro ao buscar demissões:', demissoesError)
      }

      // Buscar chamadas do mês
      const { data: allChamadas, error: chamadasError } = await supabase
        .from('chamadas')
        .select('data, colaborador_id')
        .gte('data', startDate)
        .lte('data', endDate)

      if (chamadasError) {
        console.error('Erro ao buscar chamadas:', chamadasError)
        return
      }

      console.log(`📊 Total de chamadas encontradas no período: ${allChamadas?.length || 0}`)

      // Agrupar chamadas por data (Set com IDs dos colaboradores que TÊM registro)
      const chamadasPorData: { [key: string]: Set<string> } = {}
      allChamadas?.forEach(chamada => {
        if (!chamadasPorData[chamada.data]) {
          chamadasPorData[chamada.data] = new Set()
        }
        chamadasPorData[chamada.data].add(chamada.colaborador_id)
      })

      const datesWithPending: string[] = []
      const currentDate = new Date(firstDay)

      // Só verificar chamadas de setembro/2025 em diante
      const dataInicioSistema = new Date('2025-09-01')
      
      while (currentDate <= lastDayToCheck) {
        const dateStr = currentDate.toISOString().split('T')[0]
        
        // Pular datas antes de setembro/2025
        if (currentDate < dataInicioSistema) {
          currentDate.setDate(currentDate.getDate() + 1)
          continue
        }
        
        const dayOfWeek = currentDate.getDay()
        
        // Pular domingos e sábados
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          currentDate.setDate(currentDate.getDate() + 1)
          continue
        }

        // Calcular quantos colaboradores DEVERIAM ter registro nesta data
        // Considerando admissão, demissão e movimentações
        const colaboradoresEsperadosNaData = colaboradores.filter(col => {
          // Apenas colaboradores ativos hoje
          if (col.status !== 'Ativo') return false

          // Data mínima = maior entre admissão e movimentação mais recente
          let dataMinima: Date | null = null
          
          // Data de admissão
          if (col.admissao) {
            dataMinima = new Date(col.admissao)
          }
          
          // Verificar movimentações (mudança de líder, afastamento->ativo, etc)
          const colMovimentacoes = movimentacoes.filter(m => m.colaborador_id === col.id)
          if (colMovimentacoes.length > 0) {
            // Encontrar a movimentação mais recente ANTES ou igual à data analisada
            const movsAplicaveis = colMovimentacoes
              .filter(m => m.data_inicio && m.data_inicio <= dateStr)
              .sort((a, b) => b.data_inicio.localeCompare(a.data_inicio))
            
            if (movsAplicaveis.length > 0) {
              const movMaisRecente = movsAplicaveis[0]
              const dataMov = new Date(movMaisRecente.data_inicio)
              
              // Se a movimentação é mais recente que a admissão, usar ela como data mínima
              if (!dataMinima || dataMov > dataMinima) {
                dataMinima = dataMov
              }
            }
          }
          
          // Se existe data mínima, colaborador só deveria aparecer a partir dela
          if (dataMinima) {
            const dataAtual = new Date(dateStr)
            if (dataAtual < dataMinima) {
              return false // Não deveria ter chamada antes da data mínima
            }
          }
          
          // Verificar se estava demitido nesta data
          const demissao = demissoes?.find(d => d.colaborador_id === col.id)
          if (demissao && demissao.data_demissao <= dateStr) {
            return false // Não deveria ter chamada após demissão
          }
          
          return true
        })

        const totalEsperado = colaboradoresEsperadosNaData.length
        const registrosNaData = chamadasPorData[dateStr] || new Set()
        const totalComRegistro = registrosNaData.size
        
        // Marcar como pendente apenas se faltam registros
        if (totalComRegistro < totalEsperado) {
          console.log(`⚠️ ${dateStr}: ${totalComRegistro}/${totalEsperado} registros - PENDENTE`)
          datesWithPending.push(dateStr)
        } else {
          console.log(`✅ ${dateStr}: ${totalComRegistro}/${totalEsperado} registros - COMPLETO`)
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }

      setDatesWithPendencies(datesWithPending.sort((a, b) => b.localeCompare(a)))
      console.log(`Total de datas com pendência: ${datesWithPending.length}`)
      
    } catch (error) {
      console.error('Erro ao buscar pendências:', error)
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

      // Recarregar as chamadas do dia para atualizar o estado e as pendências
      await fetchChamadasDoDia()
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

  const handleAtualizarLista = async () => {
    setLoading(true)
    try {
      // Recarregar todos os dados
      await fetchColaboradores()
      await fetchMovimentacoes()
      await fetchChamadasDoDia()
      
      // Aguardar um pouco para garantir que os estados foram atualizados
      setTimeout(() => {
        fetchDatesWithPendencies()
      }, 100)
      
      toast({
        title: "Atualizado",
        description: "Dados atualizados com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar dados",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
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

    // Determinar a data mínima de ativação para cada colaborador
    // Considera: admissão, movimentações e mudanças de status (especialmente Afastado -> Ativo)
    filtered = filtered.filter(col => {
      const selectedDateObj = new Date(selectedDate)
      
      // Data de admissão como base
      let dataMinima = col.admissao ? new Date(col.admissao) : null
      
      // Verificar todas as movimentações do colaborador
      const colMovimentacoes = movimentacoes.filter(m => m.colaborador_id === col.id)
      
      if (colMovimentacoes.length > 0) {
        // Encontrar movimentações relevantes que sejam <= selectedDate
        const movsAplicaveis = colMovimentacoes
          .filter(m => m.data_inicio && m.data_inicio <= selectedDate)
          .sort((a, b) => b.data_inicio.localeCompare(a.data_inicio))
        
        if (movsAplicaveis.length > 0) {
          const movMaisRecente = movsAplicaveis[0]
          const dataMov = new Date(movMaisRecente.data_inicio)
          
          // Se foi uma movimentação de mudança de status (ex: Afastado -> Ativo)
          // ou qualquer outra movimentação, usar essa data como mínima
          if (!dataMinima || dataMov > dataMinima) {
            dataMinima = dataMov
          }
        }
      }
      
      // Colaborador só aparece se a data selecionada for >= data mínima
      if (!dataMinima) return true
      return selectedDateObj >= dataMinima
    })

    // Filtrar por liderança considerando movimentações
    if (filterLideranca !== "todos") {
      filtered = filtered.filter(col => {
        const colMovimentacoes = movimentacoes.filter(m => m.colaborador_id === col.id && m.lideranca_destino)
        
        if (colMovimentacoes.length === 0) {
          return col.lideranca === filterLideranca
        }

        // Ordenar movimentações por data
        const movsOrdenadas = [...colMovimentacoes].sort((a, b) => b.data_inicio.localeCompare(a.data_inicio))

        // Encontrar a liderança válida para a data selecionada
        for (const mov of movsOrdenadas) {
          if (mov.data_inicio <= selectedDate) {
            return mov.lideranca_destino === filterLideranca
          }
        }

        // Se nenhuma movimentação é anterior à data selecionada, usar liderança de origem da mais antiga
        const movMaisAntiga = movsOrdenadas[movsOrdenadas.length - 1]
        return movMaisAntiga.lideranca_origem === filterLideranca || col.lideranca === filterLideranca
      })
    }

    return filtered
  }

  const scrollToColaborador = (colaboradorId: string) => {
    const element = colaboradorRefs.current[colaboradorId]
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightedColaborador(colaboradorId)
      setTimeout(() => setHighlightedColaborador(null), 3000)
    }
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
        <div className="flex items-center gap-3">
          {/* Controle de Domingo Específico */}
          <Card className="shadow-sm">
            <CardContent className="p-3">
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">Domingo Especial</Label>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "justify-start text-left font-normal",
                          !domingoEspecificoData && "text-muted-foreground"
                        )}
                        disabled={!domingoEspecificoAtivo}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {domingoEspecificoData 
                          ? format(new Date(domingoEspecificoData + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })
                          : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={domingoEspecificoData ? new Date(domingoEspecificoData + 'T12:00:00') : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const year = date.getFullYear()
                            const month = String(date.getMonth() + 1).padStart(2, '0')
                            const day = String(date.getDate()).padStart(2, '0')
                            setDomingoEspecificoData(`${year}-${month}-${day}`)
                          }
                        }}
                        disabled={(date) => {
                          // Apenas permitir domingos
                          return date.getDay() !== 0
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant={domingoEspecificoAtivo ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const newValue = !domingoEspecificoAtivo
                      setDomingoEspecificoAtivo(newValue)
                      if (!newValue) {
                        setDomingoEspecificoData(null)
                      }
                    }}
                  >
                    {domingoEspecificoAtivo ? "Ativo" : "Inativo"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleAtualizarLista}
            disabled={loading}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Atualizar Lista
          </Button>
        </div>
      </div>

      {/* Gráfico de Pendências e Datas com Pendências */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfico de Pendências por Líder */}
        <div className="lg:col-span-1">
          <GraficoPendenciasLideres 
            selectedDate={selectedDate}
            colaboradores={colaboradores}
            movimentacoes={movimentacoes}
          />
        </div>

        {/* Datas com Pendências */}
        {datesWithPendencies.length > 0 && (
          <Card className="shadow-card border-yellow-200 bg-yellow-50 lg:col-span-2">
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
      </div>

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
                      
                      // Bloquear domingos por padrão
                      const dayOfWeek = date.getDay()
                      if (dayOfWeek === 0) {
                        // Se o domingo específico está ativo, verificar se é esta data
                        if (domingoEspecificoAtivo && domingoEspecificoData) {
                          const domingoDate = new Date(domingoEspecificoData + 'T12:00:00')
                          const year = date.getFullYear()
                          const month = date.getMonth()
                          const day = date.getDate()
                          const domingoYear = domingoDate.getFullYear()
                          const domingoMonth = domingoDate.getMonth()
                          const domingoDay = domingoDate.getDate()
                          
                          // Permitir apenas o domingo específico selecionado
                          if (year === domingoYear && month === domingoMonth && day === domingoDay) {
                            return false
                          }
                        }
                        // Bloquear todos os outros domingos
                        return true
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
                <div 
                  key={col.id} 
                  onClick={() => scrollToColaborador(col.id)}
                  className="flex items-center justify-between p-2 bg-white rounded border cursor-pointer hover:bg-orange-100 transition-colors"
                >
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
          {/* Botões de ação no topo */}
          <div className="flex gap-4 pb-6 border-b mb-6">
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

          <div className="space-y-4">
            {filteredColaboradores.map((colaborador) => (
              <div 
                key={colaborador.id}
                ref={(el) => colaboradorRefs.current[colaborador.id] = el}
                className={cn(
                  "flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg transition-all duration-300",
                  highlightedColaborador === colaborador.id 
                    ? "bg-orange-100 border-orange-400 shadow-lg scale-[1.02]" 
                    : "hover:bg-muted/50"
                )}
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
        </CardContent>
      </Card>
    </div>
  )
}