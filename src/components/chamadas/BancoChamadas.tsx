import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { 
  Search, 
  Calendar as CalendarIcon, 
  UserCheck, 
  X, 
  Home, 
  Heart, 
  Coffee,
  Database,
  Filter,
  RotateCcw
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { supabase } from "@/integrations/supabase/client"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Colaborador {
  id: string
  matricula: string
  colaborador: string
  setor: string
  lideranca: string
  status: string
}

interface Chamada {
  id: string
  colaborador_id: string
  data: string
  status: string
}

interface ColaboradorChamadas {
  colaborador: Colaborador
  chamadas: Chamada[]
  totais: {
    presente: number
    folga: number
    falta: number
    atestado: number
    ferias: number
    vira_sabado: number
    total: number
  }
}

const statusOptions = [
  { value: "presente", label: "Presente", icon: UserCheck, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { value: "folga", label: "Folga", icon: Home, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { value: "falta", label: "Falta", icon: X, color: "bg-red-500/10 text-red-600 border-red-500/20" },
  { value: "atestado", label: "Atestado", icon: Heart, color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  { value: "ferias", label: "Férias", icon: Coffee, color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  { value: "vira_sabado", label: "Vira Sábado", icon: CalendarIcon, color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" }
]

export function BancoChamadas() {
  const { toast } = useToast()
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [chamadas, setChamadas] = useState<Chamada[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLideranca, setFilterLideranca] = useState("todos")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchChamadas()
    }
  }, [selectedDate])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch colaboradores
      const { data: colabData, error: colabError } = await supabase
        .from('colaboradores')
        .select('id, matricula, colaborador, setor, lideranca, status')
        .in('status', ['Ativo', 'Afastado'])
        .order('colaborador')

      if (colabError) throw colabError
      setColaboradores(colabData || [])

      // Fetch all chamadas
      await fetchChamadas()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar dados: " + error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchChamadas = async () => {
    try {
      let query = supabase
        .from('chamadas')
        .select('id, colaborador_id, data, status')
        .order('data', { ascending: false })

      if (selectedDate) {
        query = query.eq('data', format(selectedDate, 'yyyy-MM-dd'))
      }

      const { data, error } = await query

      if (error) throw error
      setChamadas(data || [])
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar chamadas: " + error.message,
        variant: "destructive"
      })
    }
  }

  const liderancas = useMemo(() => {
    return [...new Set(colaboradores.map(c => c.lideranca).filter(l => l && l.trim() !== ''))].sort()
  }, [colaboradores])

  const colaboradoresFiltrados = useMemo(() => {
    let filtered = colaboradores

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(c => 
        c.colaborador.toLowerCase().includes(term) ||
        c.matricula.toLowerCase().includes(term)
      )
    }

    // Filter by lideranca
    if (filterLideranca !== "todos") {
      filtered = filtered.filter(c => c.lideranca === filterLideranca)
    }

    return filtered
  }, [colaboradores, searchTerm, filterLideranca])

  const colaboradoresComChamadas: ColaboradorChamadas[] = useMemo(() => {
    return colaboradoresFiltrados.map(colaborador => {
      const colabChamadas = chamadas.filter(c => c.colaborador_id === colaborador.id)
      
      const totais = {
        presente: colabChamadas.filter(c => c.status === 'presente').length,
        folga: colabChamadas.filter(c => c.status === 'folga').length,
        falta: colabChamadas.filter(c => c.status === 'falta').length,
        atestado: colabChamadas.filter(c => c.status === 'atestado').length,
        ferias: colabChamadas.filter(c => c.status === 'ferias').length,
        vira_sabado: colabChamadas.filter(c => c.status === 'vira_sabado').length,
        total: colabChamadas.length
      }

      return {
        colaborador,
        chamadas: colabChamadas,
        totais
      }
    })
  }, [colaboradoresFiltrados, chamadas])

  const totaisGerais = useMemo(() => {
    return colaboradoresComChamadas.reduce((acc, item) => ({
      presente: acc.presente + item.totais.presente,
      folga: acc.folga + item.totais.folga,
      falta: acc.falta + item.totais.falta,
      atestado: acc.atestado + item.totais.atestado,
      ferias: acc.ferias + item.totais.ferias,
      vira_sabado: acc.vira_sabado + item.totais.vira_sabado,
      total: acc.total + item.totais.total
    }), { presente: 0, folga: 0, falta: 0, atestado: 0, ferias: 0, vira_sabado: 0, total: 0 })
  }, [colaboradoresComChamadas])

  const handleClearFilters = () => {
    setSearchTerm("")
    setFilterLideranca("todos")
    setSelectedDate(undefined)
  }

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find(o => o.value === status)
    if (!option) return <Badge variant="outline">{status}</Badge>
    
    const Icon = option.icon
    return (
      <Badge className={cn("flex items-center gap-1", option.color)}>
        <Icon className="w-3 h-3" />
        {option.label}
      </Badge>
    )
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Database className="w-8 h-8 mx-auto mb-2 animate-pulse text-primary" />
          <p className="text-muted-foreground">Carregando banco de chamadas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Filtros</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label>Buscar Colaborador</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Nome ou matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Lideranca filter */}
            <div className="space-y-2">
              <Label>Liderança</Label>
              <Select value={filterLideranca} onValueChange={setFilterLideranca}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {liderancas.map(lid => (
                    <SelectItem key={lid} value={lid}>{lid}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totaisGerais.total}</p>
            <p className="text-xs text-muted-foreground">Total Registros</p>
          </CardContent>
        </Card>
        {statusOptions.map(option => {
          const Icon = option.icon
          const count = totaisGerais[option.value as keyof typeof totaisGerais]
          return (
            <Card key={option.value}>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <p className="text-2xl font-bold">{count}</p>
                </div>
                <p className="text-xs text-muted-foreground">{option.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Collaborators List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Colaboradores ({colaboradoresComChamadas.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead className="text-center">Presente</TableHead>
                  <TableHead className="text-center">Folga</TableHead>
                  <TableHead className="text-center">Falta</TableHead>
                  <TableHead className="text-center">Atestado</TableHead>
                  <TableHead className="text-center">Férias</TableHead>
                  <TableHead className="text-center">Vira Sáb.</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colaboradoresComChamadas.map(item => (
                  <TableRow key={item.colaborador.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.colaborador.colaborador}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.colaborador.matricula} • {item.colaborador.lideranca}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
                        {item.totais.presente}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                        {item.totais.folga}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-red-500/10 text-red-600">
                        {item.totais.falta}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600">
                        {item.totais.atestado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-600">
                        {item.totais.ferias}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600">
                        {item.totais.vira_sabado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {item.totais.total}
                    </TableCell>
                  </TableRow>
                ))}
                {colaboradoresComChamadas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum colaborador encontrado com os filtros aplicados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
