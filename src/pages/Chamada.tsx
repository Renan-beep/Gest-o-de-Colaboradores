import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect } from "@/components/ui/multi-select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  ChevronUp,
  RotateCcw,
  Settings,
  Database,
  ShieldOff
} from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { supabase } from "@/integrations/supabase/client"
import { GraficoPendenciasLideres } from "@/components/dashboard/GraficoPendenciasLideres"
import { PainelPendencias } from "@/components/dashboard/PainelPendencias"
import { BancoChamadas } from "@/components/chamadas/BancoChamadas"

interface Colaborador {
  id: string
  matricula: string
  colaborador: string
  setor: string
  subsetor: string
  lideranca: string
  turno: string
  sexo: string
  sabado_trabalho: string
  status: string
  admissao: string | null
}

const statusOptions = [
  { value: "presente", label: "Presente", icon: UserCheck, color: "status-present" },
  { value: "folga", label: "Folga", icon: Home, color: "status-break" },
  { value: "falta", label: "Falta", icon: X, color: "status-absent" },
  { value: "atestado", label: "Atestado", icon: Heart, color: "status-sick" },
  { value: "ferias", label: "Férias", icon: Coffee, color: "status-vacation" },
  { value: "afastado", label: "Afastado", icon: AlertTriangle, color: "status-away" },
  { value: "licenca", label: "Licença", icon: ShieldOff, color: "status-license" }
]

export default function Chamada() {
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [chamadas, setChamadas] = useState<{ [key: string]: string }>({})
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filterLideranca, setFilterLideranca] = useState<string[]>([])
  const [filterTurno, setFilterTurno] = useState<string[]>([])
  const [filterSexo, setFilterSexo] = useState<string[]>([])
  const [filterSubsetor, setFilterSubsetor] = useState<string[]>([])
  const [filterSetor, setFilterSetor] = useState<string[]>([])
  const [activeStatusFilter, setActiveStatusFilter] = useState<string | null>(null)
  const [datesWithPendencies, setDatesWithPendencies] = useState<string[]>([])
  const [loadingPendencies, setLoadingPendencies] = useState(false)
  const [primeiraDataChamada, setPrimeiraDataChamada] = useState<Date | null>(null)
  const [domingoEspecificoAtivo, setDomingoEspecificoAtivo] = useState(false)
  const [domingoEspecificoData, setDomingoEspecificoData] = useState<string | null>(null)
  const [movimentacoes, setMovimentacoes] = useState<Array<{colaborador_id: string, data_inicio: string, lideranca_origem: string | null, lideranca_destino: string | null, tipo_movimentacao: string}>>([])
  const [highlightedColaborador, setHighlightedColaborador] = useState<string | null>(null)
  const colaboradorRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const pendenciasRef = useRef<HTMLDivElement | null>(null)
  const [showBackButton, setShowBackButton] = useState(false)
  const [chamadasMes, setChamadasMes] = useState<Array<{colaborador_id: string, data: string, status: string}>>([])
  const [pendenciasVersion, setPendenciasVersion] = useState(0) // Trigger para recalcular pendências

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

    // Configurar listener para atualizações em tempo real na tabela chamadas
    // Isso garante sincronização quando múltiplos usuários editam simultaneamente
    const chamadasChannel = supabase
      .channel('chamadas-realtime-sync')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'chamadas'
        },
        (payload) => {
          console.log('📡 Chamada atualizada por outro usuário:', payload)
          
          // Atualizar estado local com a mudança recebida
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newRecord = payload.new as { colaborador_id: string; data: string; status: string }
            
            // Só atualiza se for da data selecionada
            if (newRecord.data === selectedDate) {
              setChamadas(prev => ({
                ...prev,
                [newRecord.colaborador_id]: newRecord.status
              }))
            }
          } else if (payload.eventType === 'DELETE') {
            const oldRecord = payload.old as { colaborador_id: string; data: string }
            
            if (oldRecord.data === selectedDate) {
              setChamadas(prev => {
                const updated = { ...prev }
                delete updated[oldRecord.colaborador_id]
                return updated
              })
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Status do canal de chamadas:', status)
      })

    return () => {
      supabase.removeChannel(colaboradoresChannel)
      supabase.removeChannel(chamadasChannel)
    }
  }, [selectedDate])

  // Não é mais necessário - lógica foi movida para fetchDatesWithPendencies
  const registrarQuantitativosAntigos = async () => {
    // Removido - agora calculamos dinamicamente considerando admissão, demissão e movimentações
  }

  useEffect(() => {
    if (selectedDate) {
      fetchChamadasDoDia()
    }
  }, [selectedDate])

  // Calcular pendências: no carregamento inicial, quando mês muda, ou após salvar chamadas
  const currentMonth = selectedDate.substring(0, 7)
  useEffect(() => {
    if (colaboradores.length > 0) {
      // Pequeno delay apenas para evitar múltiplas chamadas simultâneas
      const timer = setTimeout(() => {
        fetchDatesWithPendencies()
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [colaboradores.length, currentMonth, movimentacoes.length, pendenciasVersion])

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
        .select('id, matricula, colaborador, setor, subsetor, lideranca, turno, sexo, sabado_trabalho, status, admissao')
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

      console.log(`🔍 Verificando pendências: ${startDate} a ${endDate}`)

      // Buscar demissões
      const { data: demissoes, error: demissoesError } = await supabase
        .from('demissoes')
        .select('colaborador_id, data_demissao')

      if (demissoesError) {
        console.error('Erro ao buscar demissões:', demissoesError)
      }

      // Buscar TODAS as chamadas do mês SEM filtros adicionais (paginando para evitar limite de 1000)
      let allChamadas: { data: string; colaborador_id: string; status: string }[] = []
      let from = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data: batch, error: chamadasError } = await supabase
          .from('chamadas')
          .select('data, colaborador_id, status')
          .gte('data', startDate)
          .lte('data', endDate)
          .range(from, from + pageSize - 1)

        if (chamadasError) {
          console.error('❌ Erro ao buscar chamadas:', chamadasError)
          return
        }
        allChamadas = allChamadas.concat(batch || [])
        hasMore = (batch?.length || 0) === pageSize
        from += pageSize
      }

      // Salvar chamadas do mês para o gráfico de pendências
      setChamadasMes(allChamadas || [])

      console.log(`📊 Total de chamadas encontradas no período: ${allChamadas?.length || 0}`)
      
      // Debug específico para 10/10
      const chamadas1010 = allChamadas?.filter(c => c.data === '2025-10-10') || []
      console.log(`🔎 Chamadas em 2025-10-10: ${chamadas1010.length}`)

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

      // Só verificar chamadas a partir de 16/01/2026
      const dataInicioSistema = new Date('2026-01-16')
      
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
        const colaboradoresEsperadosNaData = colaboradores.filter(col => {
          // Apenas colaboradores ativos hoje
          if (col.status !== 'Ativo') return false

          // Data mínima = maior entre admissão e movimentação mais recente
          let dataMinima: Date | null = null
          
          // Data de admissão
          if (col.admissao) {
            dataMinima = new Date(col.admissao)
          }
          
          // Verificar movimentações
          const colMovimentacoes = movimentacoes.filter(m => m.colaborador_id === col.id)
          if (colMovimentacoes.length > 0) {
            const movsAplicaveis = colMovimentacoes
              .filter(m => m.data_inicio && m.data_inicio <= dateStr)
              .sort((a, b) => b.data_inicio.localeCompare(a.data_inicio))
            
            if (movsAplicaveis.length > 0) {
              const movMaisRecente = movsAplicaveis[0]
              const dataMov = new Date(movMaisRecente.data_inicio)
              
              if (!dataMinima || dataMov > dataMinima) {
                dataMinima = dataMov
              }
            }
          }
          
          // Se existe data mínima, colaborador só deveria aparecer a partir dela
          if (dataMinima) {
            const dataAtual = new Date(dateStr)
            if (dataAtual < dataMinima) {
              return false
            }
          }
          
          // Verificar se estava demitido nesta data
          const demissao = demissoes?.find(d => d.colaborador_id === col.id)
          if (demissao && demissao.data_demissao <= dateStr) {
            return false
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
      console.log(`📋 Total de datas com pendência: ${datesWithPendencies.length}`)
      
    } catch (error) {
      console.error('Erro ao buscar pendências:', error)
    } finally {
      setLoadingPendencies(false)
    }
  }

  const handleStatusChange = (colaboradorId: string, status: string) => {
    setChamadas(prev => {
      // Se o valor atual já é o mesmo, desseleciona (remove do estado)
      if (prev[colaboradorId] === status) {
        const newState = { ...prev }
        delete newState[colaboradorId]
        return newState
      }
      return {
        ...prev,
        [colaboradorId]: status
      }
    })
  }

  const handleSaveChamada = async (_event?: React.MouseEvent, retryCount = 0) => {
    const MAX_RETRIES = 3
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
      // Preparar dados para upsert (INSERT ON CONFLICT UPDATE)
      // Isso é atômico e thread-safe - múltiplos usuários podem salvar simultaneamente
      const chamadasToUpsert = Object.entries(chamadas).map(([colaboradorId, status]) => ({
        colaborador_id: colaboradorId,
        data: selectedDate,
        status: status,
        updated_at: new Date().toISOString()
      }))

      console.log(`💾 Salvando ${totalChamadas} chamadas para ${selectedDate}...`)

      // Usar upsert com onConflict para garantir atomicidade
      // O índice único em (colaborador_id, data) garante que não haverá duplicatas
      const { error: upsertError } = await supabase
        .from('chamadas')
        .upsert(chamadasToUpsert, {
          onConflict: 'colaborador_id,data',
          ignoreDuplicates: false // Atualiza se já existir
        })

      if (upsertError) {
        console.error('Erro ao salvar chamadas:', upsertError)
        throw upsertError
      }

      console.log(`✅ ${totalChamadas} chamadas salvas com sucesso`)

      toast({
        title: "Sucesso",
        description: `Chamada salva para ${totalChamadas} colaborador(es)`,
      })

      // Recarregar as chamadas do dia e atualizar pendências
      await fetchChamadasDoDia()
      
      // Forçar recálculo das pendências após salvar
      setPendenciasVersion(v => v + 1)
    } catch (error: any) {
      console.error('Erro ao salvar chamada:', error)
      
      // Retry automático para erros de rede ou timeout
      const isNetworkError = !error.code || error.message?.includes('network') || error.message?.includes('timeout') || error.message?.includes('fetch')
      
      if (isNetworkError && retryCount < MAX_RETRIES) {
        console.log(`🔄 Tentando novamente (${retryCount + 1}/${MAX_RETRIES})...`)
        
        toast({
          title: "Reconectando...",
          description: `Tentativa ${retryCount + 1} de ${MAX_RETRIES}`,
        })
        
        // Aguardar antes de tentar novamente (backoff exponencial)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
        
        setSaving(false)
        return handleSaveChamada(undefined, retryCount + 1)
      }
      
      // Mensagem de erro mais específica
      let errorMessage = error.message
      if (error.code === '23505') {
        errorMessage = 'Conflito de dados detectado. A página será atualizada automaticamente.'
        // Recarregar dados em caso de conflito
        await fetchChamadasDoDia()
      } else if (error.code === '23503') {
        errorMessage = 'Colaborador não encontrado. Verifique se o colaborador ainda está ativo.'
      } else if (isNetworkError) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.'
      }
      
      toast({
        title: "Erro ao salvar",
        description: errorMessage,
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

    // Filtrar por liderança considerando movimentações (agora com multi-seleção)
    if (filterLideranca.length > 0) {
      filtered = filtered.filter(col => {
        const colMovimentacoes = movimentacoes.filter(m => m.colaborador_id === col.id && m.lideranca_destino)
        
        if (colMovimentacoes.length === 0) {
          return filterLideranca.includes(col.lideranca)
        }

        // Ordenar movimentações por data
        const movsOrdenadas = [...colMovimentacoes].sort((a, b) => b.data_inicio.localeCompare(a.data_inicio))

        // Encontrar a liderança válida para a data selecionada
        for (const mov of movsOrdenadas) {
          if (mov.data_inicio <= selectedDate) {
            return filterLideranca.includes(mov.lideranca_destino || '')
          }
        }

        // Se nenhuma movimentação é anterior à data selecionada, usar liderança de origem da mais antiga
        const movMaisAntiga = movsOrdenadas[movsOrdenadas.length - 1]
        return filterLideranca.includes(movMaisAntiga.lideranca_origem || '') || filterLideranca.includes(col.lideranca)
      })
    }

    // Filtrar por turno
    if (filterTurno.length > 0) {
      filtered = filtered.filter(col => filterTurno.includes(col.turno))
    }

    // Filtrar por sexo
    if (filterSexo.length > 0) {
      filtered = filtered.filter(col => filterSexo.includes(col.sexo))
    }

    // Filtrar por setor
    if (filterSetor.length > 0) {
      filtered = filtered.filter(col => filterSetor.includes(col.setor))
    }

    // Filtrar por subsetor
    if (filterSubsetor.length > 0) {
      filtered = filtered.filter(col => filterSubsetor.includes(col.subsetor))
    }

    // Filtrar por status da chamada (clique nos indicadores)
    if (activeStatusFilter) {
      if (activeStatusFilter === 'pendente') {
        filtered = filtered.filter(col => !chamadas[col.id])
      } else {
        filtered = filtered.filter(col => chamadas[col.id] === activeStatusFilter)
      }
    }

    return filtered
  }

  const scrollToColaborador = (colaboradorId: string) => {
    const element = colaboradorRefs.current[colaboradorId]
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightedColaborador(colaboradorId)
      setShowBackButton(true)
      setTimeout(() => setHighlightedColaborador(null), 3000)
    }
  }

  const scrollToPendencias = () => {
    pendenciasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setShowBackButton(false)
  }


  const statusCounts = getStatusCounts()
  const pendingColaboradores = getPendingColaboradores()
  const filteredColaboradores = getFilteredColaboradores()
  const liderancas = [...new Set(colaboradores.map(c => c.lideranca).filter(l => l && l.trim() !== ''))]
  const turnos = [...new Set(colaboradores.map(c => c.turno).filter(t => t && t.trim() !== ''))]
  const subsetores = [...new Set(colaboradores.map(c => c.subsetor).filter(s => s && s.trim() !== ''))]
  const setores = [...new Set(colaboradores.map(c => c.setor).filter(s => s && s.trim() !== ''))]

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
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 md:gap-3">
          <UserCheck className="w-6 h-6 md:w-8 md:h-8 text-primary" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Controle de Chamadas</h1>
            <p className="text-sm text-muted-foreground hidden md:block">Gerencie a presença dos colaboradores</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {/* Controle de Domingo Específico - Hidden on mobile */}
          <Card className="shadow-sm hidden lg:block">
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
            className="text-xs md:text-sm"
          >
            <RotateCcw className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Atualizar Lista</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue={new URLSearchParams(window.location.search).get('tab') === 'banco' ? 'banco-chamadas' : 'chamada-diaria'} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chamada-diaria" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <UserCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Chamada Diária</span>
            <span className="sm:hidden">Chamada</span>
          </TabsTrigger>
          <TabsTrigger value="banco-chamadas" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Banco de Chamadas</span>
            <span className="sm:hidden">Histórico</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chamada-diaria" className="mt-4 md:mt-6 space-y-4 md:space-y-6">
          {/* Gráfico de Pendências e Datas com Pendências */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        {/* Gráfico de Pendências por Líder */}
        <div className="lg:col-span-1">
          <GraficoPendenciasLideres 
            selectedDate={selectedDate}
            colaboradores={colaboradores}
            movimentacoes={movimentacoes}
            chamadas={chamadasMes}
          />
        </div>

        {/* Painel de Pendências - Novo */}
        <div className="lg:col-span-2">
          <PainelPendencias 
            mesAno={selectedDate.substring(0, 7)}
            onDateClick={(date) => setSelectedDate(date)}
          />
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div ref={pendenciasRef}>
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
        </div>
      )}

      {/* Botão flutuante para voltar às pendências */}
      {showBackButton && pendingColaboradores.length > 0 && (
        <Button
          onClick={scrollToPendencias}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full shadow-lg h-12 w-12 p-0"
          size="icon"
        >
          <ChevronUp className="w-6 h-6" />
        </Button>
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
          {/* Active filter indicator */}
          {activeStatusFilter && (
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="text-sm">
                Filtrando por: {activeStatusFilter === 'pendente' ? 'Pendentes' : statusOptions.find(o => o.value === activeStatusFilter)?.label}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => setActiveStatusFilter(null)} className="h-6 w-6 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2 md:gap-3">
            {/* Pendentes card */}
            {(() => {
              const totalFiltered = filteredColaboradores.length
              const pendentes = filteredColaboradores.filter(c => !chamadas[c.id]).length
              const isActive = activeStatusFilter === 'pendente'
              return (
                <div
                  className={cn(
                    "text-center p-2 md:p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md",
                    isActive ? "ring-2 ring-primary border-primary bg-primary/5" : "hover:bg-muted/50"
                  )}
                  onClick={() => setActiveStatusFilter(isActive ? null : 'pendente')}
                >
                  <div className="w-8 h-8 md:w-12 md:h-12 mx-auto rounded-lg flex items-center justify-center mb-1 md:mb-2 bg-gray-100">
                    <Clock className="w-4 h-4 md:w-6 md:h-6 text-gray-600" />
                  </div>
                  <div className="text-lg md:text-2xl font-bold mb-0.5 md:mb-1">{pendentes}</div>
                  <div className="text-[10px] md:text-xs text-muted-foreground">Pendentes</div>
                  <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5">de {totalFiltered}</div>
                </div>
              )
            })()}

            {statusOptions.map(option => {
              const IconComponent = option.icon
              const count = statusCounts[option.value]
              const totalFiltered = filteredColaboradores.length
              const isActive = activeStatusFilter === option.value
              return (
                <div
                  key={option.value}
                  className={cn(
                    "text-center p-2 md:p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md",
                    isActive ? "ring-2 ring-primary border-primary bg-primary/5" : "hover:bg-muted/50"
                  )}
                  onClick={() => setActiveStatusFilter(isActive ? null : option.value)}
                >
                  <div className={`w-8 h-8 md:w-12 md:h-12 mx-auto rounded-lg flex items-center justify-center mb-1 md:mb-2 ${
                    option.value === 'presente' ? 'bg-green-100' :
                    option.value === 'falta' ? 'bg-red-100' :
                    option.value === 'folga' ? 'bg-orange-100' :
                    option.value === 'atestado' ? 'bg-pink-100' :
                    option.value === 'afastado' ? 'bg-amber-100' :
                    option.value === 'licenca' ? 'bg-teal-100' :
                    'bg-purple-100'
                  }`}>
                    <IconComponent className={`w-4 h-4 md:w-6 md:h-6 ${
                      option.value === 'presente' ? 'text-green-600' :
                      option.value === 'falta' ? 'text-red-600' :
                      option.value === 'folga' ? 'text-orange-600' :
                      option.value === 'atestado' ? 'text-pink-600' :
                      option.value === 'afastado' ? 'text-amber-600' :
                      option.value === 'licenca' ? 'text-teal-600' :
                      'text-purple-600'
                    }`} />
                  </div>
                  <div className="text-lg md:text-2xl font-bold mb-0.5 md:mb-1">{count}</div>
                  <div className="text-[10px] md:text-xs text-muted-foreground">{option.label}</div>
                  <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{count}/{totalFiltered}</div>
                </div>
              )
            })}
          </div>

          {/* Taxa por Setor */}
          {(() => {
            const setoresUnicos = [...new Set(filteredColaboradores.map(c => c.setor).filter(s => s && s.trim() !== ''))].sort()
            if (setoresUnicos.length === 0) return null

            const dadosSetor = setoresUnicos.map(setor => {
              const colsSetor = filteredColaboradores.filter(c => c.setor === setor)
              const total = colsSetor.length
              const presentes = colsSetor.filter(c => chamadas[c.id] === 'presente').length
              const faltas = colsSetor.filter(c => chamadas[c.id] === 'falta').length
              const atestados = colsSetor.filter(c => chamadas[c.id] === 'atestado').length
              const licencas = colsSetor.filter(c => chamadas[c.id] === 'licenca').length
              const ausencias = faltas + atestados + licencas
              const taxaPresenca = total > 0 ? Math.round((presentes / total) * 100) : 0
              const taxaAusencia = total > 0 ? Math.round((ausencias / total) * 100) : 0
              return { setor, total, presentes, ausencias, taxaPresenca, taxaAusencia }
            })

            return (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Taxa por Setor</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dadosSetor.map(d => (
                    <div key={d.setor} className="border rounded-lg p-3">
                      <div className="font-medium text-sm mb-2 truncate">{d.setor}</div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${d.taxaPresenca}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-green-600 w-12 text-right">{d.taxaPresenca}%</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{d.presentes}/{d.total} presentes</span>
                        <span className="text-red-500">{d.ausencias} ausências ({d.taxaAusencia}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
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
        </TabsContent>

        <TabsContent value="banco-chamadas" className="mt-6">
          <BancoChamadas />
        </TabsContent>
      </Tabs>
    </div>
  )
}