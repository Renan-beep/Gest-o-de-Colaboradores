import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'

interface GraficoPendenciasLideresProps {
  chamadas: { [key: string]: string }
  colaboradores: Array<{
    id: string
    lideranca: string | null
  }>
}

export function GraficoPendenciasLideres({ chamadas, colaboradores }: GraficoPendenciasLideresProps) {
  const dadosGrafico = useMemo(() => {
    // Contar pendências por líder (colaboradores sem chamada registrada)
    const pendenciasPorLider: Record<string, number> = {}

    colaboradores.forEach(colaborador => {
      if (!chamadas[colaborador.id] && colaborador.lideranca) {
        pendenciasPorLider[colaborador.lideranca] = (pendenciasPorLider[colaborador.lideranca] || 0) + 1
      }
    })

    // Converter para array e ordenar do maior para o menor
    const dados = Object.entries(pendenciasPorLider)
      .map(([lideranca, total]) => ({ lideranca, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5) // Top 5 líderes

    return dados
  }, [chamadas, colaboradores])

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
    <Card className="p-4 bg-background/95 backdrop-blur border-border/50">
      <div className="text-sm font-medium text-muted-foreground mb-3">
        Pendências por Líder
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={dadosGrafico} layout="vertical" margin={{ top: 5, right: 10, bottom: 5, left: 70 }}>
          <XAxis type="number" hide />
          <YAxis 
            type="category" 
            dataKey="lideranca" 
            width={65}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          />
          <Bar dataKey="total" radius={[0, 4, 4, 0]}>
            {dadosGrafico.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(index, entry.total)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
