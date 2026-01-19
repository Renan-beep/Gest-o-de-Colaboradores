import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { UserPlus, Calendar, TrendingUp, ChevronRight, Users } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface ContratacaoMensal {
  mes: string
  contratacoes: number
  mesNumero: number
}

interface Colaborador {
  id: string
  matricula: string
  colaborador: string
  cargo: string | null
  setor: string | null
  admissao: string | null
  status: string
}

export default function IndicadorContratacoes() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [dadosContratacoes, setDadosContratacoes] = useState<ContratacaoMensal[]>([])
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([])
  const [anoSelecionado, setAnoSelecionado] = useState<number>(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [totalContratacoes, setTotalContratacoes] = useState(0)
  const [allColaboradores, setAllColaboradores] = useState<Colaborador[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTitle, setDialogTitle] = useState("")
  const [dialogColaboradores, setDialogColaboradores] = useState<Colaborador[]>([])
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)

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
        .select('id, matricula, colaborador, cargo, setor, admissao, status')
        .not('admissao', 'is', null)

      if (error) throw error

      if (!colaboradores || colaboradores.length === 0) {
        setDadosContratacoes([])
        setAnosDisponiveis([])
        setTotalContratacoes(0)
        setAllColaboradores([])
        return
      }

      setAllColaboradores(colaboradores)

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

  const mesesCompletos = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const mesIndex = data.activePayload[0].payload.mesNumero - 1
      const mesNome = mesesCompletos[mesIndex]
      
      // Filtrar colaboradores contratados neste mês e ano
      const contratadosMes = allColaboradores.filter(c => {
        if (!c.admissao) return false
        const dataAdmissao = new Date(c.admissao + 'T12:00:00')
        return dataAdmissao.getFullYear() === anoSelecionado && dataAdmissao.getMonth() === mesIndex
      }).sort((a, b) => {
        const dateA = new Date(a.admissao + 'T12:00:00')
        const dateB = new Date(b.admissao + 'T12:00:00')
        return dateA.getTime() - dateB.getTime()
      })

      if (contratadosMes.length > 0) {
        setDialogTitle(`Contratações em ${mesNome} de ${anoSelecionado}`)
        setDialogColaboradores(contratadosMes)
        setDialogOpen(true)
      }
    }
  }

  const handleColaboradorClick = (colaboradorId: string) => {
    setDialogOpen(false)
    navigate(`/editar-colaborador/${colaboradorId}`)
  }

  const formatarData = (dataString: string | null) => {
    if (!dataString) return 'N/A'
    const data = new Date(dataString + 'T12:00:00')
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`${label} ${anoSelecionado}`}</p>
          <p className="text-primary">
            {`Contratações: ${payload[0].value}`}
          </p>
          {payload[0].value > 0 && (
            <p className="text-xs text-muted-foreground mt-1">Clique para ver detalhes</p>
          )}
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
            <ResponsiveContainer key={`chart-${anoSelecionado}`} width="100%" height={300}>
              <BarChart 
                data={dadosContratacoes} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                onClick={handleBarClick}
                style={{ cursor: 'pointer' }}
              >
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
                  radius={[4, 4, 0, 0]}
                  onMouseEnter={(_, index) => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {dadosContratacoes.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.contratacoes > 0 
                        ? (hoveredBar === index ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.7)')
                        : 'hsl(var(--muted))'}
                      style={{ 
                        cursor: entry.contratacoes > 0 ? 'pointer' : 'default',
                        transition: 'fill 0.2s ease'
                      }}
                    />
                  ))}
                </Bar>
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

      {/* Dialog para mostrar colaboradores contratados */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {dialogTitle}
            </DialogTitle>
            <DialogDescription>
              Clique em um colaborador para ver seus detalhes
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-2">
              {dialogColaboradores.map((colab) => (
                <div
                  key={colab.id}
                  onClick={() => handleColaboradorClick(colab.id)}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-primary/10 hover:border-primary/30 transition-colors cursor-pointer group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground group-hover:text-primary truncate">
                      {colab.colaborador}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Mat: {colab.matricula} • {colab.cargo || 'Sem cargo'}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      Admissão: {formatarData(colab.admissao)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <Badge 
                      variant={colab.status?.toLowerCase() === 'ativo' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {colab.status}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                </div>
              ))}
              {dialogColaboradores.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum colaborador encontrado
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  )
}