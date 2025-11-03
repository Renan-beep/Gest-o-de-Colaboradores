import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts'

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
}

export function GraficoPendenciasLideres({ selectedDate, colaboradores, movimentacoes }: GraficoPendenciasLideresProps) {
  const dadosGrafico = useMemo(() => {
    const [year, month] = selectedDate.split('-')
    const firstDay = new Date(parseInt(year), parseInt(month) - 1, 1)
    const lastDay = new Date(parseInt(year), parseInt(month), 0)

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

    // Contar dias pendentes por líder ao longo do mês
    const pendenciasPorLider: Record<string, number> = {}
    const currentDate = new Date(firstDay)

    while (currentDate <= lastDay) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const dayOfWeek = currentDate.getDay()
      
      // Pular domingos
      if (dayOfWeek !== 0) {
        // Para cada dia útil do mês, verificar colaboradores ativos
        colaboradores.forEach(colaborador => {
          if (colaborador.status !== 'Ativo') return

          // Verificar se o colaborador já estava admitido nesta data
          const admissaoDate = colaborador.admissao ? new Date(colaborador.admissao) : null
          if (admissaoDate && admissaoDate > currentDate) return

          const liderancaNaData = getLiderancaNaData(colaborador.id, colaborador.lideranca || '', dateStr)
          if (liderancaNaData) {
            // Incrementar contador de dias-colaborador por líder
            pendenciasPorLider[liderancaNaData] = (pendenciasPorLider[liderancaNaData] || 0) + 1
          }
        })
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Converter para array e ordenar do maior para o menor
    const dados = Object.entries(pendenciasPorLider)
      .map(([lideranca, total]) => ({ lideranca, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    return dados
  }, [selectedDate, colaboradores, movimentacoes])

  if (dadosGrafico.length === 0) {
    return null
  }

  // Cores gradientes do vermelho (mais pendências) ao verde (menos pendências)
  const getColor = (index: number, total: number) => {
    if (total === 0) return 'hsl(var(--success))'
    const ratio = index / Math.max(dadosGrafico.length - 1, 1)
    if (ratio < 0.33) return 'hsl(0, 70%, 50%)' // Vermelho
    if (ratio < 0.66) return 'hsl(30, 70%, 50%)' // Laranja
    return 'hsl(45, 70%, 50%)' // Amarelo
  }

  return (
    <Card className="p-4 bg-background/95 backdrop-blur border-border/50 h-full flex flex-col">
      <div className="text-sm font-medium text-muted-foreground mb-3">
        Pendências por Líder
      </div>
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dadosGrafico} layout="vertical" margin={{ top: 5, right: 40, bottom: 5, left: 70 }}>
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="lideranca" 
              width={65}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
            <Bar dataKey="total" radius={[0, 4, 4, 0]}>
              <LabelList 
                dataKey="total" 
                position="right" 
                style={{ fontSize: '12px', fontWeight: 'bold', fill: 'hsl(var(--foreground))' }}
              />
              {dadosGrafico.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(index, entry.total)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
