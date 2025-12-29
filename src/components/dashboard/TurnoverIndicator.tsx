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
      setLoading(true)
      
      // Buscar colaboradores ativos no início do ano selecionado
      const { data: colaboradoresAtivos, error: ativosError } = await supabase
        .from('colaboradores')
        .select('id, admissao')
        .ilike('status', 'ativo')
        .not('admissao', 'is', null)

      if (ativosError) throw ativosError

      // Buscar admissões do ano selecionado
      const inicioAno = `${anoSelecionado}-01-01`
      const fimAno = `${anoSelecionado}-12-31`
      
      const { data: admissoesAno, error: admissoesError } = await supabase
        .from('colaboradores')
        .select('id, admissao')
        .gte('admissao', inicioAno)
        .lte('admissao', fimAno)
        .not('admissao', 'is', null)

      if (admissoesError) throw admissoesError

      // Buscar demissões do ano selecionado
      const { data: demissoesAno, error: demissoesError } = await supabase
        .from('demissoes')
        .select('*')
        .gte('data_demissao', inicioAno)
        .lte('data_demissao', fimAno)

      if (demissoesError) throw demissoesError

      // Obter todos os anos disponíveis (a partir de 2024)
      const { data: todasAdmissoes, error: todasAdmissoesError } = await supabase
        .from('colaboradores')
        .select('admissao')
        .not('admissao', 'is', null)

      if (todasAdmissoesError) throw todasAdmissoesError

      const { data: todasDemissoes, error: todasDemissoesError } = await supabase
        .from('demissoes')
        .select('data_demissao')

      if (todasDemissoesError) throw todasDemissoesError

      // Calcular anos disponíveis (a partir de 2024)
      const anosAdmissoes = todasAdmissoes?.map(c => new Date(c.admissao).getFullYear()).filter(ano => !isNaN(ano) && ano >= 2024) || []
      const anosDemissoes = todasDemissoes?.map(d => new Date(d.data_demissao).getFullYear()).filter(ano => !isNaN(ano) && ano >= 2024) || []
      
      const anosUnicos = Array.from(new Set([...anosAdmissoes, ...anosDemissoes, 2024])).sort((a, b) => b - a)
      setAnosDisponiveis(anosUnicos)

      // Se não há anos ou o ano selecionado não está na lista, usar o mais recente
      if (anosUnicos.length > 0 && !anosUnicos.includes(anoSelecionado)) {
        setAnoSelecionado(anosUnicos[0])
        return
      }

      // Calcular colaboradores ativos no início do ano
      // (colaboradores admitidos antes do ano atual e que ainda estão ativos)
      const colaboradoresInicioAno = colaboradoresAtivos?.filter(c => {
        const anoAdmissao = new Date(c.admissao).getFullYear()
        return anoAdmissao <= anoSelecionado
      }) || []

      const admissoes = admissoesAno?.length || 0
      const demissoes = demissoesAno?.length || 0
      
      // Calcular o número médio de colaboradores durante o ano
      // Base inicial + (admissões / 2) - (demissões / 2)
      const colaboradoresBaseInicio = colaboradoresInicioAno.length - admissoes // Remove admissões do ano atual
      const mediaColaboradores = colaboradoresBaseInicio + (admissoes / 2) - (demissoes / 2)
      
      // Turnover = (Demissões / Média de colaboradores) * 100
      const turnover = mediaColaboradores > 0 ? ((demissoes / mediaColaboradores) * 100) : 0
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
          Taxa de rotatividade de pessoal calculada com base na média de colaboradores do ano
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

              <div className="text-center text-sm text-muted-foreground">
                <div>Taxa calculada: Demissões ÷ Média de colaboradores × 100</div>
                <span className={`text-lg font-bold ${getTurnoverColor(turnoverData.turnover)}`}>
                  {turnoverData.turnover}% ao ano
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