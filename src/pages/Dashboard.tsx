import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Users, 
  Search, 
  Filter, 
  Edit,
  UserCheck,
  UserX,
  Briefcase,
  MapPin,
  X
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"
import HistoricoDemissoes from "@/components/dashboard/HistoricoDemissoes"
import TempoEmpresaTable from "@/components/dashboard/TempoEmpresaTable"

interface Colaborador {
  id: string
  matricula: string
  colaborador: string
  status: string
  cargo: string
  setor: string
  subsetor: string
  lideranca: string
  turno: string
  sabado_trabalho: string
  admissao: string
}

export default function Dashboard() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSetor, setFilterSetor] = useState("todos")
  const [filterStatus, setFilterStatus] = useState("todos")
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog state for BI indicator click
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTitle, setDialogTitle] = useState("")
  const [dialogColaboradores, setDialogColaboradores] = useState<Colaborador[]>([])
  const [dialogSearch, setDialogSearch] = useState("")
  const [dialogFilterSetor, setDialogFilterSetor] = useState("todos")

  useEffect(() => {
    fetchColaboradores()
  }, [])

  const fetchColaboradores = async () => {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
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
        description: "Erro inesperado ao carregar dados",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredColaboradores = colaboradores.filter(colaborador => {
    const matchesSearch = colaborador.colaborador.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         colaborador.matricula.includes(searchTerm)
    const matchesSetor = !filterSetor || filterSetor === "todos" || colaborador.setor === filterSetor
    const matchesStatus = !filterStatus || filterStatus === "todos" || colaborador.status === filterStatus
    
    return matchesSearch && matchesSetor && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    return status === "ativo" ? (
      <Badge className="status-present">
        <UserCheck className="w-3 h-3 mr-1" />
        Ativo
      </Badge>
    ) : (
      <Badge className="status-absent">
        <UserX className="w-3 h-3 mr-1" />
        Afastado
      </Badge>
    )
  }

  const setores = [...new Set(colaboradores.map(c => c.setor).filter(setor => setor && setor.trim() !== ''))]
  const cargos = [...new Set(colaboradores.map(c => c.cargo).filter(c => c && c.trim() !== ''))]
  const liderancas = [...new Set(colaboradores.map(c => c.lideranca).filter(l => l && l.trim() !== ''))]

  // BI Counts
  const totalColaboradores = colaboradores.length
  const totalAtivos = colaboradores.filter(c => c.status === 'ativo').length
  const totalAfastados = colaboradores.filter(c => c.status !== 'ativo').length

  // Counts by setor
  const setorCounts = setores.map(s => ({
    setor: s,
    count: colaboradores.filter(c => c.setor === s && c.status === 'ativo').length
  })).sort((a, b) => b.count - a.count)

  // Counts by cargo
  const cargoCounts = cargos.map(c => ({
    cargo: c,
    count: colaboradores.filter(col => col.cargo === c && col.status === 'ativo').length
  })).sort((a, b) => b.count - a.count)

  // Counts by lideranca
  const liderancaCounts = liderancas.map(l => ({
    lideranca: l,
    count: colaboradores.filter(c => c.lideranca === l && c.status === 'ativo').length
  })).sort((a, b) => b.count - a.count)

  const handleIndicatorClick = (title: string, list: Colaborador[]) => {
    setDialogTitle(title)
    setDialogColaboradores(list)
    setDialogSearch("")
    setDialogFilterSetor("todos")
    setDialogOpen(true)
  }

  const filteredDialogColaboradores = dialogColaboradores.filter(c => {
    const matchesSearch = c.colaborador.toLowerCase().includes(dialogSearch.toLowerCase()) ||
                         c.matricula.includes(dialogSearch)
    const matchesSetor = dialogFilterSetor === "todos" || c.setor === dialogFilterSetor
    return matchesSearch && matchesSetor
  })

  const dialogSetores = [...new Set(dialogColaboradores.map(c => c.setor).filter(s => s && s.trim() !== ''))]

  const biCards = [
    {
      title: "Total de Colaboradores",
      value: totalColaboradores,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      list: colaboradores,
    },
    {
      title: "Ativos",
      value: totalAtivos,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-100",
      list: colaboradores.filter(c => c.status === 'ativo'),
    },
    {
      title: "Afastados / Inativos",
      value: totalAfastados,
      icon: UserX,
      color: "text-red-600",
      bgColor: "bg-red-100",
      list: colaboradores.filter(c => c.status !== 'ativo'),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Tabela de Colaboradores</h1>
          <p className="text-muted-foreground">Gerencie todos os colaboradores cadastrados</p>
        </div>
      </div>

      {/* BI Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {biCards.map(card => {
          const Icon = card.icon
          return (
            <Card
              key={card.title}
              className="shadow-card cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => handleIndicatorClick(card.title, card.list)}
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <div className="text-sm text-muted-foreground">{card.title}</div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* BI by Setor, Cargo, Liderança */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* By Setor */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Por Setor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-60 overflow-y-auto">
            {setorCounts.map(s => (
              <div
                key={s.setor}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleIndicatorClick(`Setor: ${s.setor}`, colaboradores.filter(c => c.setor === s.setor && c.status === 'ativo'))}
              >
                <span className="text-sm truncate">{s.setor}</span>
                <Badge variant="secondary" className="ml-2">{s.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* By Cargo */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Por Cargo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-60 overflow-y-auto">
            {cargoCounts.map(c => (
              <div
                key={c.cargo}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleIndicatorClick(`Cargo: ${c.cargo}`, colaboradores.filter(col => col.cargo === c.cargo && col.status === 'ativo'))}
              >
                <span className="text-sm truncate">{c.cargo}</span>
                <Badge variant="secondary" className="ml-2">{c.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* By Liderança */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Por Liderança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-60 overflow-y-auto">
            {liderancaCounts.map(l => (
              <div
                key={l.lideranca}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleIndicatorClick(`Liderança: ${l.lideranca}`, colaboradores.filter(c => c.lideranca === l.lideranca && c.status === 'ativo'))}
              >
                <span className="text-sm truncate">{l.lideranca}</span>
                <Badge variant="secondary" className="ml-2">{l.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Dialog for indicator details */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{filteredDialogColaboradores.length} colaborador(es)</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome ou matrícula..."
                value={dialogSearch}
                onChange={(e) => setDialogSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={dialogFilterSetor} onValueChange={setDialogFilterSetor}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Todos os setores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os setores</SelectItem>
                {dialogSetores.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-y-auto flex-1 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Liderança</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDialogColaboradores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      Nenhum colaborador encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDialogColaboradores.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.matricula}</TableCell>
                      <TableCell>{c.colaborador}</TableCell>
                      <TableCell>{c.cargo}</TableCell>
                      <TableCell>{c.setor}</TableCell>
                      <TableCell>{c.lideranca}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Histórico de Demissões */}
      <HistoricoDemissoes />

      {/* Tempo de Empresa */}
      <TempoEmpresaTable />

      {/* Filtros e Busca */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros e Pesquisa
          </CardTitle>
          <CardDescription>
            Use os filtros para encontrar colaboradores específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nome ou matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterSetor} onValueChange={setFilterSetor}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Todos os setores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os setores</SelectItem>
                {setores.map(setor => (
                  <SelectItem key={setor} value={setor}>{setor}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Todos status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="afastado">Afastado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Colaboradores */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Colaboradores Cadastrados</CardTitle>
          <CardDescription>
            {filteredColaboradores.length} colaborador(es) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Liderança</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredColaboradores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum colaborador encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredColaboradores.map((colaborador) => (
                    <TableRow key={colaborador.id}>
                      <TableCell className="font-medium">{colaborador.matricula}</TableCell>
                      <TableCell>{colaborador.colaborador}</TableCell>
                      <TableCell>{getStatusBadge(colaborador.status)}</TableCell>
                      <TableCell>{colaborador.cargo}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{colaborador.setor}</div>
                          <div className="text-sm text-muted-foreground">{colaborador.subsetor}</div>
                        </div>
                      </TableCell>
                      <TableCell>{colaborador.lideranca}</TableCell>
                      <TableCell className="capitalize">{colaborador.turno}</TableCell>
                       <TableCell>
                         <div className="flex gap-2">
                           <Button 
                             variant="outline" 
                             size="sm"
                             onClick={() => navigate(`/editar-colaborador/${colaborador.id}`)}
                           >
                             <Edit className="w-4 h-4" />
                           </Button>
                         </div>
                        </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
