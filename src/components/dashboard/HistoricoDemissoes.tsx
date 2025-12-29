import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UserMinus, Calendar, Briefcase, Building2, TrendingDown } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface DemissaoHistorico {
  id: string
  colaborador_id: string
  data_demissao: string
  motivo: string
  tipo_demissao: string
  observacoes?: string
  colaboradores?: {
    matricula: string
    colaborador: string
    cargo: string
    setor: string
  }
}

export default function HistoricoDemissoes() {
  const { toast } = useToast()
  const [demissoes, setDemissoes] = useState<DemissaoHistorico[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDemissoes()
  }, [])

  const fetchDemissoes = async () => {
    try {
      const { data: demissoesData, error: demissoesError } = await supabase
        .from('demissoes')
        .select('*')
        .order('data_demissao', { ascending: false })
        .limit(10)

      if (demissoesError) throw demissoesError

      if (!demissoesData || demissoesData.length === 0) {
        setDemissoes([])
        return
      }

      const colaboradorIds = demissoesData.map(d => d.colaborador_id)
      const { data: colaboradoresData, error: colaboradoresError } = await supabase
        .from('colaboradores')
        .select('id, matricula, colaborador, cargo, setor')
        .in('id', colaboradorIds)

      if (colaboradoresError) throw colaboradoresError

      const demissoesComColaboradores = demissoesData.map(demissao => ({
        ...demissao,
        colaboradores: colaboradoresData?.find(c => c.id === demissao.colaborador_id) || null
      }))

      setDemissoes(demissoesComColaboradores)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar demissões: " + error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatarData = (dataString: string) => {
    const data = new Date(dataString)
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getTipoBadge = (tipo: string) => {
    const config: Record<string, { variant: "destructive" | "secondary" | "outline" | "default", label: string, className: string }> = {
      'justa_causa': { 
        variant: "destructive", 
        label: 'Justa Causa',
        className: 'bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/20'
      },
      'pedido': { 
        variant: "secondary", 
        label: 'Pedido',
        className: 'bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20'
      },
      'sem_justa_causa': { 
        variant: "default", 
        label: 'Sem Justa Causa',
        className: 'bg-orange-500/10 text-orange-600 border-orange-200 hover:bg-orange-500/20'
      },
      'fim_contrato': { 
        variant: "outline", 
        label: 'Fim Contrato',
        className: 'bg-slate-500/10 text-slate-600 border-slate-200 hover:bg-slate-500/20'
      },
      'aposentadoria': { 
        variant: "default", 
        label: 'Aposentadoria',
        className: 'bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20'
      }
    }
    return config[tipo] || { variant: "default", label: tipo, className: 'bg-muted text-muted-foreground' }
  }

  if (loading) {
    return (
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-muted/30">
        <CardHeader className="bg-gradient-to-r from-destructive/5 to-orange-500/5 border-b border-border/50">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-lg bg-destructive/10">
              <UserMinus className="w-5 h-5 text-destructive" />
            </div>
            Últimas Demissões
          </CardTitle>
          <CardDescription>Carregando histórico...</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-muted/50 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-muted/30">
      <CardHeader className="bg-gradient-to-r from-destructive/5 to-orange-500/5 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <UserMinus className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-lg">Últimas Demissões</CardTitle>
              <CardDescription className="mt-1">
                Histórico dos desligamentos recentes
              </CardDescription>
            </div>
          </div>
          {demissoes.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-sm font-medium">
              <TrendingDown className="w-4 h-4" />
              {demissoes.length} registro{demissoes.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {demissoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <div className="p-4 rounded-full bg-muted/50 mb-4">
              <UserMinus className="w-8 h-8" />
            </div>
            <p className="text-sm font-medium">Nenhuma demissão registrada</p>
            <p className="text-xs mt-1">Os desligamentos aparecerão aqui</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold text-foreground">Colaborador</TableHead>
                  <TableHead className="font-semibold text-foreground">Cargo</TableHead>
                  <TableHead className="font-semibold text-foreground">Setor</TableHead>
                  <TableHead className="font-semibold text-foreground">Data</TableHead>
                  <TableHead className="font-semibold text-foreground">Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demissoes.map((demissao, index) => {
                  const tipoBadge = getTipoBadge(demissao.tipo_demissao)
                  return (
                    <TableRow 
                      key={demissao.id}
                      className="group hover:bg-muted/50 transition-colors"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {demissao.colaboradores?.colaborador || 'N/A'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Mat: {demissao.colaboradores?.matricula || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Briefcase className="w-3.5 h-3.5" />
                          <span className="text-sm">{demissao.colaboradores?.cargo || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="w-3.5 h-3.5" />
                          <span className="text-sm">{demissao.colaboradores?.setor || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {formatarData(demissao.data_demissao)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={`text-xs font-medium ${tipoBadge.className}`}
                        >
                          {tipoBadge.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
