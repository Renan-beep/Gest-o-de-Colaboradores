import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
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
  UserX
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Tabela de Colaboradores</h1>
          <p className="text-muted-foreground">Gerencie todos os colaboradores cadastrados</p>
        </div>
      </div>

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