import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { UserPlus, Calendar, TrendingUp } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface ContratacaoMensal {
  mes: string
  contratacoes: number
  mesNumero: number
}

export default function IndicadorContratacoes() {
  const { toast } = useToast()
  const [dadosContratacoes, setDadosContratacoes] = useState<ContratacaoMensal[]>([])
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([])
  const [anoSelecionado, setAnoSelecionado] = useState<number>(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [totalContratacoes, setTotalContratacoes] = useState(0)

  const mesesNomes = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ]

  useEffect(() => {
    fetchDadosContratacoes()
  }, [anoSelecionado])

  const fetchDadosContratacoes = async () => {
    try {
      // Buscar todos os colaboradores com data de admissão
      const { data: colaboradores, error } = await supabase
        .from('colaboradores')
        .select('admissao')
        .not('admissao', 'is', null)

      if (error) throw error

      if (!colaboradores || colaboradores.length === 0) {
        setDadosContratacoes([])
        setAnosDisponiveis([])
        setTotalContratacoes(0)
        return
      }

      // Extrair anos disponíveis (apenas 2024 em diante)
      const anosSet = new Set<number>()
      colaboradores.forEach(colaborador => {
        if (colaborador.admissao) {
          const ano = new Date(colaborador.admissao).getFullYear()
          if (!isNaN(ano) && ano >= 2024) {
            anosSet.add(ano)
          }
        }
      })

      const anosArray = Array.from(anosSet).sort((a, b) => b - a)
      setAnosDisponiveis(anosArray)

      // Se não há anos disponíveis, mostrar dados vazios
      if (anosArray.length === 0) {
        setDadosContratacoes([])
        setTotalContratacoes(0)
        return
      }

      // Inicializar dados mensais para o ano selecionado
      const dadosMensais: ContratacaoMensal[] = mesesNomes.map((mes, index) => ({
        mes,
        contratacoes: 0,
        mesNumero: index + 1
      }))

      // Contar contratações por mês no ano selecionado
      let totalAno = 0
      colaboradores.forEach(colaborador => {
        if (colaborador.admissao) {
          const dataAdmissao = new Date(colaborador.admissao)
          const ano = dataAdmissao.getFullYear()
          const mes = dataAdmissao.getMonth()

          if (ano === anoSelecionado) {
            dadosMensais[mes].contratacoes += 1
            totalAno += 1
          }
        }
      })

      setDadosContratacoes(dadosMensais)
      setTotalContratacoes(totalAno)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de contratações: " + error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`${label} ${anoSelecionado}`}</p>
          <p className="text-primary">
            {`Contratações: ${payload[0].value}`}
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Indicador de Contratações
          </CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          Contratações por Mês
        </CardTitle>
        <CardDescription>
          Distribuição mensal das contratações em {anoSelecionado}
        </CardDescription>
        
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-4">
            <Select 
              value={anoSelecionado.toString()} 
              onValueChange={(value) => setAnoSelecionado(Number(value))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {anosDisponiveis.map(ano => (
                  <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-primary">
              {totalContratacoes} contratações em {anoSelecionado}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {anosDisponiveis.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma contratação registrada a partir de 2024</p>
          </div>
        ) : (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosContratacoes} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="mes" 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: 'currentColor', opacity: 0.3 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: 'currentColor', opacity: 0.3 }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="contratacoes" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                  className="opacity-80 hover:opacity-100 transition-opacity"
                />
              </BarChart>
            </ResponsiveContainer>

            {/* Estatísticas rápidas */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.max(...dadosContratacoes.map(d => d.contratacoes))}
                </div>
                <div className="text-xs text-muted-foreground">Pico mensal</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {(totalContratacoes / 12).toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Média mensal</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {dadosContratacoes.filter(d => d.contratacoes > 0).length}
                </div>
                <div className="text-xs text-muted-foreground">Meses ativos</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}