import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Calendar, Clock, Archive, Trash2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"

interface HistoricoPendencia {
  id: string
  mes_ano: string
  total_pendentes: number
  data_fechamento: string
  created_at: string
}

export default function HistoricoPendencias() {
  const { toast } = useToast()
  const { isGerencia } = useAuth()
  const [historico, setHistorico] = useState<HistoricoPendencia[]>([])
  const [loading, setLoading] = useState(true)
  const [processando, setProcessando] = useState(false)

  useEffect(() => {
    fetchHistorico()
  }, [])

  const fetchHistorico = async () => {
    try {
      const { data, error } = await supabase
        .from('historico_chamadas_pendentes')
        .select('*')
        .order('data_fechamento', { ascending: false })

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar histórico: " + error.message,
          variant: "destructive"
        })
        return
      }

      setHistorico(data || [])
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar histórico",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatarMesAno = (mesAno: string) => {
    const [ano, mes] = mesAno.split('-')
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return `${meses[parseInt(mes) - 1]} ${ano}`
  }

  const formatarData = (dataString: string) => {
    const data = new Date(dataString)
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const processarFechamentoManual = async () => {
    if (!isGerencia) {
      toast({
        title: "Acesso Negado",
        description: "Apenas gerência pode executar fechamento manual",
        variant: "destructive"
      })
      return
    }

    setProcessando(true)
    try {
      const { data, error } = await supabase.functions.invoke('processar-fechamento-mensal', {
        body: { manual: true }
      })

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao processar fechamento: " + error.message,
          variant: "destructive"
        })
        return
      }

      const result = data as { processedCount: number, processed: boolean }

      toast({
        title: "Fechamento Processado",
        description: result.processed 
          ? `${result.processedCount || 0} chamadas pendentes foram arquivadas`
          : "Nenhuma chamada pendente encontrada para arquivar",
        duration: 5000,
      })

      // Recarregar histórico
      fetchHistorico()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao processar fechamento",
        variant: "destructive"
      })
    } finally {
      setProcessando(false)
    }
  }

  const verificarUltimoDiaMes = () => {
    const hoje = new Date()
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    return hoje.getDate() === ultimoDia.getDate()
  }

  const totalPendenciasAcumuladas = historico.reduce((acc, item) => acc + item.total_pendentes, 0)

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Histórico de Pendências Mensais</CardTitle>
              <CardDescription>
                Chamadas que ficaram pendentes por mês e foram arquivadas
              </CardDescription>
            </div>
          </div>

          {isGerencia && (
            <div className="flex items-center gap-2">
              {verificarUltimoDiaMes() && (
                <Badge variant="outline" className="text-warning">
                  <Clock className="w-3 h-3 mr-1" />
                  Último dia do mês
                </Badge>
              )}
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={processando}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Fechamento Manual
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Fechamento Manual</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação irá contar todas as chamadas pendentes do mês atual, 
                      salvá-las no histórico e limpar da lista de pendências. 
                      Esta operação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={processarFechamentoManual}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Processar Fechamento
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {totalPendenciasAcumuladas > 0 && (
          <div className="mb-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Acumulado de Pendências:</span>
              <Badge variant="secondary" className="text-lg font-bold">
                {totalPendenciasAcumuladas}
              </Badge>
            </div>
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês/Ano</TableHead>
                <TableHead>Pendências</TableHead>
                <TableHead>Data de Fechamento</TableHead>
                <TableHead>Processado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Carregando histórico...
                  </TableCell>
                </TableRow>
              ) : historico.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum histórico de pendências encontrado
                  </TableCell>
                </TableRow>
              ) : (
                historico.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {formatarMesAno(item.mes_ano)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={item.total_pendentes > 0 ? "destructive" : "secondary"}
                        className="font-bold"
                      >
                        {item.total_pendentes}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {formatarData(item.data_fechamento)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatarData(item.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {historico.length > 0 && (
          <div className="mt-4 text-xs text-muted-foreground">
            * O sistema automaticamente processa o fechamento mensal no último dia de cada mês
          </div>
        )}
      </CardContent>
    </Card>
  )
}