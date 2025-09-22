import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { 
  UserCheck, 
  Calendar, 
  Save,
  Clock,
  Coffee,
  Home,
  Heart,
  X,
  Filter,
  AlertTriangle,
  ChevronRight
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

interface Colaborador {
  id: string
  matricula: string
  colaborador: string
  setor: string
  lideranca: string
  sabado_trabalho: string
  status: string
}

const statusOptions = [
  { value: "presente", label: "Presente", icon: UserCheck, color: "status-present" },
  { value: "folga", label: "Folga", icon: Home, color: "status-break" },
  { value: "falta", label: "Falta", icon: X, color: "status-absent" },
  { value: "atestado", label: "Atestado", icon: Heart, color: "status-sick" },
  { value: "ferias", label: "Férias", icon: Coffee, color: "status-vacation" }
]

export default function Chamada() {
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [chamadas, setChamadas] = useState<{ [key: string]: string }>({})
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filterLideranca, setFilterLideranca] = useState("todos")
  const [datesWithPendencies, setDatesWithPendencies] = useState<string[]>([])
  const [loadingPendencies, setLoadingPendencies] = useState(false)

  useEffect(() => {
    fetchColaboradores()

    // Configurar listener para atualizações em tempo real na tabela colaboradores
    const colaboradoresChannel = supabase
      .channel('colaboradores-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'colaboradores'
        },
        () => {
          // Recarregar colaboradores quando houver qualquer mudança
          fetchColaboradores()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(colaboradoresChannel)
    }
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchChamadasDoDia()
    }
  }, [selectedDate])

  useEffect(() => {
    if (colaboradores.length > 0) {
      fetchDatesWithPendencies()
    }
  }, [colaboradores])

  const fetchColaboradores = async () => {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('id, matricula, colaborador, setor, lideranca, sabado_trabalho, status')
        .order('colaborador')

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar colaboradores: " + error.message,
          variant: "destructive"
        })
        return
      }

      setColaboradores(data || [])
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar colaboradores",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchChamadasDoDia = async () => {
    try {
      const { data, error } = await supabase
        .from('chamadas')
        .select('colaborador_id, status')
        .eq('data', selectedDate)

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar chamadas: " + error.message,
          variant: "destructive"
        })
        return
      }

      const chamadasMap: { [key: string]: string } = {}
      data?.forEach(chamada => {
        chamadasMap[chamada.colaborador_id] = chamada.status
      })
      setChamadas(chamadasMap)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar chamadas",
        variant: "destructive"
      })
    }
  }

  const fetchDatesWithPendencies = async () => {
    setLoadingPendencies(true)
    try {
      // Buscar colaboradores ativos
      const activeColaboradores = colaboradores.filter(col => col.status === 'Ativo')
      if (activeColaboradores.length === 0) return

      // Buscar datas dos últimos 30 dias
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const startDate = thirtyDaysAgo.toISOString().split('T')[0]
      const today = new Date().toISOString().split('T')[0]

      // Buscar todas as chamadas dos últimos 30 dias
      const { data: allChamadas, error } = await supabase
        .from('chamadas')
        .select('data, colaborador_id')
        .gte('data', startDate)
        .lte('data', today)

      if (error) {
        console.error('Erro ao buscar chamadas:', error)
        return
      }

      // Agrupar chamadas por data
      const chamadasByDate: { [key: string]: Set<string> } = {}
      allChamadas?.forEach(chamada => {
        if (!chamadasByDate[chamada.data]) {
          chamadasByDate[chamada.data] = new Set()
        }
        chamadasByDate[chamada.data].add(chamada.colaborador_id)
      })

      // Identificar datas com pendências (apenas datas que têm pelo menos 1 chamada registrada)
      const datesWithPending: string[] = []
      
      // Verificar apenas as datas que têm registros de chamada
      Object.keys(chamadasByDate).forEach(dateStr => {
        const chamadasNaData = chamadasByDate[dateStr]
        
        // Verificar se há colaboradores ativos sem chamada nesta data
        // (só considera se a data tem pelo menos 1 registro, indicando que a chamada foi iniciada)
        const hasPendency = activeColaboradores.some(col => !chamadasNaData.has(col.id))
        
        if (hasPendency && dateStr !== selectedDate) {
          datesWithPending.push(dateStr)
        }
      })

      // Ordenar por data decrescente (mais recente primeiro) e pegar apenas as 5 mais recentes
      setDatesWithPendencies(
        datesWithPending
          .sort((a, b) => b.localeCompare(a))
          .slice(0, 5)
      )
    } catch (error) {
      console.error('Erro ao buscar datas com pendências:', error)
    } finally {
      setLoadingPendencies(false)
    }
  }

  const handleStatusChange = (colaboradorId: string, status: string) => {
    setChamadas(prev => ({
      ...prev,
      [colaboradorId]: status
    }))
  }

  const handleSaveChamada = async () => {
    const totalChamadas = Object.keys(chamadas).length
    if (totalChamadas === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos um status para salvar a chamada",
        variant: "destructive"
      })
      return
    }

    setSaving(true)

    try {
      // Preparar dados para inserção/atualização
      const chamadasToSave = Object.entries(chamadas).map(([colaboradorId, status]) => ({
        colaborador_id: colaboradorId,
        data: selectedDate,
        status: status
      }))

      // Primeiro, deletar registros existentes para esta data
      const { error: deleteError } = await supabase
        .from('chamadas')
        .delete()
        .eq('data', selectedDate)

      if (deleteError) throw deleteError

      // Depois, inserir os novos registros
      const { error: insertError } = await supabase
        .from('chamadas')
        .insert(chamadasToSave)

      if (insertError) throw insertError

      toast({
        title: "Sucesso",
        description: `Chamada salva para ${totalChamadas} colaborador(es)`,
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao salvar chamada: " + error.message,
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status)
    if (!statusOption) return null

    const IconComponent = statusOption.icon
    return (
      <Badge className={statusOption.color}>
        <IconComponent className="w-3 h-3 mr-1" />
        {statusOption.label}
      </Badge>
    )
  }

  const getStatusCounts = () => {
    const counts = statusOptions.reduce((acc, option) => {
      acc[option.value] = 0
      return acc
    }, {} as { [key: string]: number })

    Object.values(chamadas).forEach(status => {
      if (counts[status] !== undefined) {
        counts[status]++
      }
    })

    return counts
  }

  const getPendingColaboradores = () => {
    const filteredCols = getFilteredColaboradores()
    return filteredCols.filter(col => !chamadas[col.id])
  }

  const getFilteredColaboradores = () => {
    let filtered = colaboradores

    // Filtrar apenas colaboradores ativos
    filtered = filtered.filter(col => col.status === 'Ativo')

    // Filtrar por liderança
    if (filterLideranca !== "todos") {
      filtered = filtered.filter(col => col.lideranca === filterLideranca)
    }

    return filtered
  }


  const statusCounts = getStatusCounts()
  const pendingColaboradores = getPendingColaboradores()
  const filteredColaboradores = getFilteredColaboradores()
  const liderancas = [...new Set(colaboradores.map(c => c.lideranca).filter(l => l && l.trim() !== ''))]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Chamada Diária</h1>
            <p className="text-muted-foreground">Carregando colaboradores...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UserCheck className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Chamada Diária</h1>
          <p className="text-muted-foreground">Registre a presença dos colaboradores</p>
        </div>
      </div>

      {/* Datas com Pendências */}
      {datesWithPendencies.length > 0 && (
        <Card className="shadow-card border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="w-5 h-5" />
              Datas com Pendências
            </CardTitle>
            <CardDescription className="text-yellow-600">
              Clique em uma data para ir diretamente para ela e resolver as pendências
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {datesWithPendencies.map(date => (
                <Button
                  key={date}
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(date)}
                  className="flex items-center gap-2 bg-white border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                >
                  <Calendar className="w-4 h-4" />
                  {new Date(date).toLocaleDateString('pt-BR')}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seleção de Data e Filtros */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Data da Chamada e Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Selecione a Data</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Filtrar por Liderança</Label>
              <Select value={filterLideranca} onValueChange={setFilterLideranca}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as lideranças" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as lideranças</SelectItem>
                  {liderancas.map(lideranca => (
                    <SelectItem key={lideranca} value={lideranca}>{lideranca}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {filteredColaboradores.length} colaboradores
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indicador de Pendências */}
      {pendingColaboradores.length > 0 && (
        <Card className="shadow-card border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="w-5 h-5" />
              Pendências da Chamada
            </CardTitle>
            <CardDescription className="text-orange-600">
              {pendingColaboradores.length} colaborador(es) ainda não tiveram presença registrada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingColaboradores.map(col => (
                <div key={col.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="font-medium">{col.colaborador}</span>
                  <span className="text-sm text-muted-foreground">Liderança: {col.lideranca}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Indicadores Quantitativos */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Indicadores do Dia</CardTitle>
          <CardDescription>
            Resumo quantitativo da chamada do dia {new Date(selectedDate).toLocaleDateString('pt-BR')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {statusOptions.map(option => {
              const IconComponent = option.icon
              return (
                <div key={option.value} className="text-center p-4 border rounded-lg">
                  <div className={`w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-2 ${
                    option.value === 'presente' ? 'bg-green-100' :
                    option.value === 'falta' ? 'bg-red-100' :
                    option.value === 'folga' ? 'bg-orange-100' :
                    option.value === 'atestado' ? 'bg-pink-100' :
                    'bg-purple-100'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${
                      option.value === 'presente' ? 'text-green-600' :
                      option.value === 'falta' ? 'text-red-600' :
                      option.value === 'folga' ? 'text-orange-600' :
                      option.value === 'atestado' ? 'text-pink-600' :
                      'text-purple-600'
                    }`} />
                  </div>
                  <div className="text-2xl font-bold mb-1">{statusCounts[option.value]}</div>
                  <div className="text-sm text-muted-foreground">{option.label}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Colaboradores */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Lista de Colaboradores</CardTitle>
          <CardDescription>
            Clique nos botões para marcar a presença de cada colaborador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredColaboradores.map((colaborador) => (
              <div 
                key={colaborador.id} 
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 mb-4 sm:mb-0">
                  <div className="font-medium">{colaborador.colaborador}</div>
                  <div className="text-sm text-muted-foreground">
                    Matrícula: {colaborador.matricula} • {colaborador.setor}
                  </div>
                  {chamadas[colaborador.id] && (
                    <div className="mt-2">
                      {getStatusBadge(chamadas[colaborador.id])}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((option) => {
                    const IconComponent = option.icon
                    const isSelected = chamadas[colaborador.id] === option.value
                    
                    return (
                      <Button
                        key={option.value}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStatusChange(colaborador.id, option.value)}
                        className={isSelected ? option.color : ""}
                      >
                        <IconComponent className="w-4 h-4 mr-1" />
                        {option.label}
                      </Button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-4 pt-6 border-t">
            <Button 
              onClick={handleSaveChamada} 
              className="flex-1 sm:flex-none"
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Chamada"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setChamadas({})}
            >
              Limpar Seleções
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}