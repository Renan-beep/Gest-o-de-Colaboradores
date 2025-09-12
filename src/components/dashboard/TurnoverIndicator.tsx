import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, Users, Calendar } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface TurnoverData {
  ano: number
  admissoes: number
  demissoes: number
  turnover: number
  saldo: number
}

export default function TurnoverIndicator() {
  const { toast } = useToast()
  const [turnoverData, setTurnoverData] = useState<TurnoverData | null>(null)
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([])
  const [anoSelecionado, setAnoSelecionado] = useState<number>(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTurnoverData()
  }, [anoSelecionado])

  const fetchTurnoverData = async () => {
    try {
      // Buscar todos os colaboradores para calcular admissões
      const { data: colaboradores, error: colaboradoresError } = await supabase
        .from('colaboradores')
        .select('admissao')
        .not('admissao', 'is', null)

      if (colaboradoresError) throw colaboradoresError

      // Buscar demissões reais
      const { data: demissoesData, error: demissoesError } = await supabase
        .from('demissoes')
        .select('data_demissao')

      if (demissoesError) throw demissoesError

      // Agrupar admissões por ano
      const admissoesPorAno: { [key: number]: number } = {}
      
      colaboradores?.forEach(colaborador => {
        if (colaborador.admissao) {
          const ano = new Date(colaborador.admissao).getFullYear()
          if (!isNaN(ano)) {
            admissoesPorAno[ano] = (admissoesPorAno[ano] || 0) + 1
          }
        }
      })

      // Agrupar demissões por ano
      const demissoesPorAno: { [key: number]: number } = {}
      
      demissoesData?.forEach(demissao => {
        const ano = new Date(demissao.data_demissao).getFullYear()
        if (!isNaN(ano)) {
          demissoesPorAno[ano] = (demissoesPorAno[ano] || 0) + 1
        }
      })

      // Obter anos disponíveis (apenas 2024 em diante)
      const anosUnicos = Array.from(new Set([
        ...Object.keys(admissoesPorAno).map(Number),
        ...Object.keys(demissoesPorAno).map(Number)
      ])).filter(ano => ano >= 2024).sort((a, b) => b - a)

      setAnosDisponiveis(anosUnicos)

      // Se não há anos ou o ano selecionado não está na lista, usar o mais recente ou atual
      if (anosUnicos.length > 0 && !anosUnicos.includes(anoSelecionado)) {
        setAnoSelecionado(anosUnicos[0])
        return
      }

      // Calcular dados para o ano selecionado
      const admissoes = admissoesPorAno[anoSelecionado] || 0
      const demissoes = demissoesPorAno[anoSelecionado] || 0
      const totalColaboradores = colaboradores?.length || 1
      const turnover = totalColaboradores > 0 ? ((demissoes / totalColaboradores) * 100) : 0
      const saldo = admissoes - demissoes

      setTurnoverData({
        ano: anoSelecionado,
        admissoes,
        demissoes,
        turnover: Number(turnover.toFixed(1)),
        saldo
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao calcular turnover: " + error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getTurnoverColor = (turnover: number) => {
    if (turnover <= 5) return "text-green-600"
    if (turnover <= 15) return "text-yellow-600"
    return "text-red-600"
  }

  const getTurnoverVariant = (turnover: number) => {
    if (turnover <= 5) return "default"
    if (turnover <= 15) return "secondary"
    return "destructive"
  }

  const getSaldoIcon = (saldo: number) => {
    if (saldo > 0) return <TrendingUp className="w-4 h-4 text-green-600" />
    if (saldo < 0) return <TrendingDown className="w-4 h-4 text-red-600" />
    return <Users className="w-4 h-4 text-muted-foreground" />
  }

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Indicador de Turnover
          </CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="w-16 h-4 bg-muted animate-pulse rounded" />
                <div className="w-32 h-4 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Indicador de Turnover
        </CardTitle>
        <CardDescription>
          Análise de admissões versus demissões do ano selecionado
        </CardDescription>
        <div className="pt-4">
          <Select value={anoSelecionado.toString()} onValueChange={(value) => setAnoSelecionado(Number(value))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecionar ano" />
            </SelectTrigger>
            <SelectContent>
              {anosDisponiveis.map(ano => (
                <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!turnoverData ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum dado de turnover disponível para o ano selecionado
            </div>
          ) : (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold text-lg">{turnoverData.ano}</span>
                </div>
                <Badge 
                  variant={getTurnoverVariant(turnoverData.turnover)}
                  className="text-xs"
                >
                  {turnoverData.turnover}% Turnover
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-green-600 font-semibold text-2xl">+{turnoverData.admissoes}</div>
                  <div className="text-muted-foreground">Admissões</div>
                </div>
                <div className="text-center">
                  <div className="text-red-600 font-semibold text-2xl">-{turnoverData.demissoes}</div>
                  <div className="text-muted-foreground">Demissões</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 font-semibold text-2xl">
                    {getSaldoIcon(turnoverData.saldo)}
                    <span className={turnoverData.saldo >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {turnoverData.saldo > 0 ? '+' : ''}{turnoverData.saldo}
                    </span>
                  </div>
                  <div className="text-muted-foreground">Saldo</div>
                </div>
              </div>

              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    turnoverData.turnover <= 5 ? 'bg-green-500' :
                    turnoverData.turnover <= 15 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(turnoverData.turnover, 50)}%` }}
                />
              </div>

              <div className="text-center">
                <span className={`text-lg font-bold ${getTurnoverColor(turnoverData.turnover)}`}>
                  Taxa de Turnover: {turnoverData.turnover}%
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Turnover até 5%: Excelente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span>Turnover 5-15%: Aceitável</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span>Turnover acima de 15%: Atenção</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}