import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts'
import { Calendar, CalendarDays } from 'lucide-react'

interface GraficoPendenciasLideresProps {
  selectedDate: string
  colaboradores: Array<{
    id: string
    lideranca: string | null
    status: string
    admissao: string | null
  }>
  movimentacoes: Array<{
    colaborador_id: string
    data_inicio: string
    lideranca_origem: string | null
    lideranca_destino: string | null
  }>
  chamadas?: Array<{
    colaborador_id: string
    data: string
    status: string
  }>
}

export function GraficoPendenciasLideres({ selectedDate, colaboradores, movimentacoes, chamadas = [] }: GraficoPendenciasLideresProps) {
  // Função para obter liderança do colaborador em uma data específica
  const getLiderancaNaData = (colaboradorId: string, liderancaAtual: string, dataVerificar: string): string => {
    const movs = movimentacoes.filter(m => m.colaborador_id === colaboradorId && m.lideranca_destino)
    if (movs.length === 0) return liderancaAtual

    const movsOrdenadas = movs.sort((a, b) => b.data_inicio.localeCompare(a.data_inicio))
    
    for (const mov of movsOrdenadas) {
      if (mov.data_inicio <= dataVerificar) {
        return mov.lideranca_destino || liderancaAtual
      }
    }

    const movMaisAntiga = movsOrdenadas[movsOrdenadas.length - 1]
    return movMaisAntiga.lideranca_origem || liderancaAtual
  }

  // Dados do gráfico MENSAL
  const dadosGraficoMensal = useMemo(() => {
    const [year, month] = selectedDate.split('-')
    const firstDay = new Date(parseInt(year), parseInt(month) - 1, 1)
    const lastDay = new Date(parseInt(year), parseInt(month), 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Criar set de chamadas registradas para busca rápida
    const chamadasSet = new Set(
      chamadas.map(c => `${c.colaborador_id}_${c.data}`)
    )

    // Contar pendências por líder apenas no mês selecionado
    const pendenciasPorLider: Record<string, number> = {}
    const currentDate = new Date(firstDay)

    while (currentDate <= lastDay && currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const dayOfWeek = currentDate.getDay()
      
      // Pular domingos
      if (dayOfWeek !== 0) {
        colaboradores.forEach(colaborador => {
          if (colaborador.status !== 'Ativo') return

          const admissaoDate = colaborador.admissao ? new Date(colaborador.admissao) : null
          if (admissaoDate && admissaoDate > currentDate) return

          const temChamada = chamadasSet.has(`${colaborador.id}_${dateStr}`)
          
          if (!temChamada) {
            const liderancaNaData = getLiderancaNaData(colaborador.id, colaborador.lideranca || '', dateStr)
            if (liderancaNaData) {
              pendenciasPorLider[liderancaNaData] = (pendenciasPorLider[liderancaNaData] || 0) + 1
            }
          }
        })
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return Object.entries(pendenciasPorLider)
      .map(([lideranca, total]) => ({ lideranca, total }))
      .filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [selectedDate, colaboradores, movimentacoes, chamadas])

  // Dados do gráfico DIÁRIO
  const dadosGraficoDiario = useMemo(() => {
    const chamadasDoDia = chamadas.filter(c => c.data === selectedDate)
    const chamadasSet = new Set(chamadasDoDia.map(c => c.colaborador_id))

    const pendenciasPorLider: Record<string, number> = {}
    const selectedDateObj = new Date(selectedDate + 'T00:00:00')

    colaboradores.forEach(colaborador => {
      if (colaborador.status !== 'Ativo') return

      const admissaoDate = colaborador.admissao ? new Date(colaborador.admissao) : null
      if (admissaoDate && admissaoDate > selectedDateObj) return

      const temChamada = chamadasSet.has(colaborador.id)
      
      if (!temChamada) {
        const liderancaNaData = getLiderancaNaData(colaborador.id, colaborador.lideranca || '', selectedDate)
        if (liderancaNaData) {
          pendenciasPorLider[liderancaNaData] = (pendenciasPorLider[liderancaNaData] || 0) + 1
        }
      }
    })

    return Object.entries(pendenciasPorLider)
      .map(([lideranca, total]) => ({ lideranca, total }))
      .filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [selectedDate, colaboradores, movimentacoes, chamadas])

  // Cores gradientes do vermelho (mais pendências) ao amarelo (menos pendências)
  const getColor = (index: number, dataLength: number) => {
    if (dataLength === 0) return 'hsl(var(--success))'
    const ratio = index / Math.max(dataLength - 1, 1)
    if (ratio < 0.33) return 'hsl(0, 70%, 50%)' // Vermelho
    if (ratio < 0.66) return 'hsl(30, 70%, 50%)' // Laranja
    return 'hsl(45, 70%, 50%)' // Amarelo
  }

  const renderChart = (dados: Array<{lideranca: string, total: number}>, titulo: string, icon: React.ReactNode) => (
    <Card className="p-4 bg-background/95 backdrop-blur border-border/50 h-full flex flex-col">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
        {icon}
        {titulo}
      </div>
      {dados.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Nenhuma pendência
        </div>
      ) : (
        <div className="flex-1 min-h-[250px]">
          <ResponsiveContainer key={`chart-${titulo}`} width="100%" height="100%">
            <BarChart data={dados} layout="vertical" margin={{ top: 10, right: 45, bottom: 10, left: 75 }} barCategoryGap="20%">
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="lideranca" 
                width={65}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                <LabelList 
                  dataKey="total" 
                  position="right" 
                  style={{ fontSize: '11px', fontWeight: 'bold', fill: 'hsl(var(--foreground))' }}
                />
                {dados.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(index, dados.length)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )

  return (
    <div className="grid grid-cols-1 gap-4 h-full">
      {renderChart(
        dadosGraficoDiario, 
        `Pendências do Dia (${new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})`,
        <Calendar className="w-4 h-4" />
      )}
      {renderChart(
        dadosGraficoMensal, 
        `Pendências do Mês (${new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long' })})`,
        <CalendarDays className="w-4 h-4" />
      )}
    </div>
  )
}
