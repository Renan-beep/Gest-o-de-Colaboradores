import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface PendenciaData {
  data: string
  esperado: number
  registrado: number
}

interface PainelPendenciasProps {
  mesAno: string // formato: "2025-10"
  onDateClick?: (date: string) => void
}

export function PainelPendencias({ mesAno, onDateClick }: PainelPendenciasProps) {
  const [pendencias, setPendencias] = useState<PendenciaData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    calcularPendencias()
  }, [mesAno])

  const calcularPendencias = async () => {
    setLoading(true)
    try {
      const [year, month] = mesAno.split('-')
      const firstDay = new Date(parseInt(year), parseInt(month) - 1, 1)
      const lastDay = new Date(parseInt(year), parseInt(month), 0)
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const lastDayToCheck = lastDay < today ? lastDay : today
      
      const startDate = firstDay.toISOString().split('T')[0]
      const endDate = lastDayToCheck.toISOString().split('T')[0]

      // 1. Buscar colaboradores ativos (com campos necessários)
      const { data: colaboradores, error: colError } = await supabase
        .from('colaboradores')
        .select('id, admissao, status, turno, sabado_trabalho')
        .eq('status', 'Ativo')

      if (colError) throw colError

      // 2. Buscar demissões
      const { data: demissoes, error: demError } = await supabase
        .from('demissoes')
        .select('colaborador_id, data_demissao')

      if (demError) throw demError

      // 3. Buscar movimentações aprovadas
      const { data: movimentacoes, error: movError } = await supabase
        .from('solicitacoes_movimentacao')
        .select('colaborador_id, data_inicio')
        .eq('status', 'aprovada')

      if (movError) throw movError

      // 4. Buscar TODAS as chamadas do período (paginando para evitar limite de 1000)
      let allChamadas: { data: string; colaborador_id: string }[] = []
      let from = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data: batch, error: chamError } = await supabase
          .from('chamadas')
          .select('data, colaborador_id')
          .gte('data', startDate)
          .lte('data', endDate)
          .range(from, from + pageSize - 1)

        if (chamError) throw chamError
        allChamadas = allChamadas.concat(batch || [])
        hasMore = (batch?.length || 0) === pageSize
        from += pageSize
      }

      const chamadas = allChamadas

      // Agrupar chamadas por data
      const chamadasPorData = new Map<string, Set<string>>()
      chamadas?.forEach(ch => {
        if (!chamadasPorData.has(ch.data)) {
          chamadasPorData.set(ch.data, new Set())
        }
        chamadasPorData.get(ch.data)!.add(ch.colaborador_id)
      })

      // Calcular pendências dia por dia
      const pendenciasEncontradas: PendenciaData[] = []
      // Só verificar chamadas a partir de 16/01/2026
      const dataInicioSistema = new Date('2026-01-16')
      const currentDate = new Date(firstDay)

      console.log('🔍 [PainelPendencias] Iniciando cálculo para:', mesAno)
      console.log('📅 Período:', startDate, 'até', endDate)
      console.log('👥 Total colaboradores ativos:', colaboradores?.length)
      console.log('📊 Total chamadas carregadas:', chamadas?.length)

      while (currentDate <= lastDayToCheck) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const dayOfWeek = currentDate.getDay()
        
        // Pular datas antes do sistema e domingos
        if (currentDate < dataInicioSistema || dayOfWeek === 0) {
          currentDate.setDate(currentDate.getDate() + 1)
          continue
        }

        const isSabado = dayOfWeek === 6

        // Nos sábados, só considerar pendência se houver pelo menos 1 registro na data
        if (isSabado) {
          const registrosNaData = chamadasPorData.get(dateStr)
          if (!registrosNaData || registrosNaData.size === 0) {
            currentDate.setDate(currentDate.getDate() + 1)
            continue
          }
        }

        // Calcular colaboradores esperados nesta data (mesma lógica da página Chamada)
        const colaboradoresEsperados = colaboradores?.filter(col => {
          // Apenas colaboradores ativos
          if (col.status !== 'Ativo') return false

          // Nos sábados: excluir turno noturno e quem não trabalha no sábado
          if (isSabado) {
            if (col.turno === '22:00 - 06:52') return false
            if (col.sabado_trabalho !== 'Sim') return false
          }

          // Data mínima = maior entre admissão e movimentação mais recente
          let dataMinima: string | null = null
          
          if (col.admissao) {
            dataMinima = col.admissao
          }
          
          const colMovs = movimentacoes?.filter(m => m.colaborador_id === col.id) || []
          if (colMovs.length > 0) {
            const movsAplicaveis = colMovs
              .filter(m => m.data_inicio && m.data_inicio <= dateStr)
              .sort((a, b) => b.data_inicio.localeCompare(a.data_inicio))
            
            if (movsAplicaveis.length > 0) {
              const movMaisRecente = movsAplicaveis[0]
              if (!dataMinima || movMaisRecente.data_inicio > dataMinima) {
                dataMinima = movMaisRecente.data_inicio
              }
            }
          }
          
          if (dataMinima && dateStr < dataMinima) return false
          
          const demissao = demissoes?.find(d => d.colaborador_id === col.id)
          if (demissao && demissao.data_demissao <= dateStr) return false

          return true
        }) || []

        const totalEsperado = colaboradoresEsperados.length
        const registrosNaData = chamadasPorData.get(dateStr) || new Set()
        
        // Contar apenas registros dos colaboradores ESPERADOS (ignorar registros de inativos)
        const totalRegistrado = colaboradoresEsperados.filter(col => registrosNaData.has(col.id)).length

        // Log detalhado para cada data
        console.log(`📊 [Painel] ${dateStr}: registrados=${totalRegistrado}/${totalEsperado} (total na tabela: ${registrosNaData.size})${isSabado ? ' (sábado)' : ''}`)

        // Só adicionar se houver pendência (falta pelo menos 1 registro)
        if (totalRegistrado < totalEsperado && totalEsperado > 0) {
          pendenciasEncontradas.push({
            data: dateStr,
            esperado: totalEsperado,
            registrado: totalRegistrado
          })
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }

      console.log(`✅ Total de pendências encontradas: ${pendenciasEncontradas.length}`)

      setPendencias(pendenciasEncontradas.sort((a, b) => b.data.localeCompare(a.data)))
    } catch (error) {
      console.error('Erro ao calcular pendências:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Datas com Pendências
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando pendências...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Datas com Pendências
            </CardTitle>
            <CardDescription>
              {pendencias.length === 0 
                ? "Nenhuma pendência encontrada" 
                : `${pendencias.length} data(s) com registros incompletos`}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={calcularPendencias}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {pendencias.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            ✅ Todas as datas estão completas!
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {pendencias.map(p => {
              const faltam = p.esperado - p.registrado
              const percentual = Math.round((p.registrado / p.esperado) * 100)
              
              return (
                <button
                  key={p.data}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    // Executar callback imediatamente sem aguardar
                    if (onDateClick) {
                      onDateClick(p.data)
                    }
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <div className="font-medium">
                        {format(new Date(p.data + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {p.registrado}/{p.esperado} registros
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={percentual >= 80 ? "secondary" : "destructive"}>
                      Faltam {faltam}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {percentual}%
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
