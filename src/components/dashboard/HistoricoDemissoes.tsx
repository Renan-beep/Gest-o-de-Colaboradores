import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UserMinus, Calendar } from "lucide-react"
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
      // Buscar demissões
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

      // Buscar dados dos colaboradores
      const colaboradorIds = demissoesData.map(d => d.colaborador_id)
      const { data: colaboradoresData, error: colaboradoresError } = await supabase
        .from('colaboradores')
        .select('id, matricula, colaborador, cargo, setor')
        .in('id', colaboradorIds)

      if (colaboradoresError) throw colaboradoresError

      // Combinar os dados
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
      month: '2-digit', 
      year: 'numeric'
    })
  }

  const getMotivoColor = (tipo: string) => {
    switch (tipo) {
      case 'justa_causa': return "destructive"
      case 'pedido': return "secondary"
      case 'fim_contrato': return "outline"
      case 'aposentadoria': return "default"
      default: return "default"
    }
  }

  const formatarTipo = (tipo: string) => {
    const tipos: Record<string, string> = {
      'pedido': 'Pedido do Funcionário',
      'justa_causa': 'Demissão por Justa Causa',
      'sem_justa_causa': 'Demissão sem Justa Causa',
      'fim_contrato': 'Fim de Contrato',
      'aposentadoria': 'Aposentadoria'
    }
    return tipos[tipo] || tipo
  }

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserMinus className="w-5 h-5 text-destructive" />
            Últimas Demissões
          </CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
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
          <UserMinus className="w-5 h-5 text-destructive" />
          Últimas Demissões
        </CardTitle>
        <CardDescription>
          Histórico dos colaboradores demitidos recentemente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demissoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma demissão registrada
                  </TableCell>
                </TableRow>
              ) : (
                demissoes.map((demissao) => (
                  <TableRow key={demissao.id}>
                    <TableCell className="font-medium">
                      {demissao.colaboradores?.colaborador || 'N/A'}
                    </TableCell>
                    <TableCell>{demissao.colaboradores?.matricula || 'N/A'}</TableCell>
                    <TableCell>{demissao.colaboradores?.cargo || 'N/A'}</TableCell>
                    <TableCell>{demissao.colaboradores?.setor || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {formatarData(demissao.data_demissao)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getMotivoColor(demissao.tipo_demissao)} className="text-xs">
                        {formatarTipo(demissao.tipo_demissao)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}