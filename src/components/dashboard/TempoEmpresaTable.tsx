import { useState, useEffect } from "react"
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
  Calendar, 
  Search, 
  Filter,
  Clock
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { differenceInMonths, differenceInYears, format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Colaborador {
  id: string
  matricula: string
  colaborador: string
  status: string
  cargo: string
  setor: string
  admissao: string
}

interface TempoEmpresa {
  anos: number
  meses: number
  totalMeses: number
}

export default function TempoEmpresaTable() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSetor, setFilterSetor] = useState("todos")
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchColaboradores()
  }, [])

  const fetchColaboradores = async () => {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('id, matricula, colaborador, status, cargo, setor, admissao')
        .eq('status', 'Ativo')
        .not('admissao', 'is', null)
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

  const calcularTempoEmpresa = (dataAdmissao: string): TempoEmpresa => {
    if (!dataAdmissao) {
      return { anos: 0, meses: 0, totalMeses: 0 }
    }

    try {
      const admissao = parseISO(dataAdmissao)
      const hoje = new Date()
      
      const totalMeses = differenceInMonths(hoje, admissao)
      const anos = differenceInYears(hoje, admissao)
      const meses = totalMeses - (anos * 12)

      return {
        anos,
        meses,
        totalMeses
      }
    } catch (error) {
      return { anos: 0, meses: 0, totalMeses: 0 }
    }
  }

  const formatarTempoEmpresa = (tempo: TempoEmpresa): string => {
    if (tempo.anos === 0 && tempo.meses === 0) {
      return "Menos de 1 mês"
    }
    
    if (tempo.anos === 0) {
      return `${tempo.meses} ${tempo.meses === 1 ? 'mês' : 'meses'}`
    }
    
    if (tempo.meses === 0) {
      return `${tempo.anos} ${tempo.anos === 1 ? 'ano' : 'anos'}`
    }
    
    return `${tempo.anos} ${tempo.anos === 1 ? 'ano' : 'anos'} e ${tempo.meses} ${tempo.meses === 1 ? 'mês' : 'meses'}`
  }

  const getTempoEmpresaBadge = (tempo: TempoEmpresa) => {
    if (tempo.totalMeses < 6) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Novo</Badge>
    } else if (tempo.totalMeses < 12) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Adaptação</Badge>
    } else if (tempo.anos < 5) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Experiente</Badge>
    } else {
      return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Veterano</Badge>
    }
  }

  const formatarDataAdmissao = (dataAdmissao: string): string => {
    if (!dataAdmissao) return "-"
    try {
      return format(parseISO(dataAdmissao), "dd/MM/yyyy", { locale: ptBR })
    } catch {
      return "-"
    }
  }

  const filteredColaboradores = colaboradores.filter(colaborador => {
    const matchesSearch = colaborador.colaborador.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         colaborador.matricula.includes(searchTerm)
    const matchesSetor = !filterSetor || filterSetor === "todos" || colaborador.setor === filterSetor
    
    return matchesSearch && matchesSetor
  })

  // Ordenar por tempo de empresa (mais antigos primeiro)
  const sortedColaboradores = [...filteredColaboradores].sort((a, b) => {
    const tempoA = calcularTempoEmpresa(a.admissao)
    const tempoB = calcularTempoEmpresa(b.admissao)
    return tempoB.totalMeses - tempoA.totalMeses
  })

  const setores = [...new Set(colaboradores.map(c => c.setor).filter(setor => setor && setor.trim() !== ''))]

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Tempo de Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Tempo de Empresa dos Colaboradores
        </CardTitle>
        <CardDescription>
          Tempo de serviço baseado na data de admissão - {sortedColaboradores.length} colaborador(es) ativo(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
        </div>

        {/* Tabela */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matrícula</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Data Admissão</TableHead>
                <TableHead>Tempo de Empresa</TableHead>
                <TableHead>Categoria</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedColaboradores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum colaborador encontrado
                  </TableCell>
                </TableRow>
              ) : (
                sortedColaboradores.map((colaborador) => {
                  const tempoEmpresa = calcularTempoEmpresa(colaborador.admissao)
                  return (
                    <TableRow key={colaborador.id}>
                      <TableCell className="font-medium">{colaborador.matricula}</TableCell>
                      <TableCell>{colaborador.colaborador}</TableCell>
                      <TableCell>{colaborador.cargo}</TableCell>
                      <TableCell>{colaborador.setor}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {formatarDataAdmissao(colaborador.admissao)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatarTempoEmpresa(tempoEmpresa)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {tempoEmpresa.totalMeses} {tempoEmpresa.totalMeses === 1 ? 'mês total' : 'meses totais'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getTempoEmpresaBadge(tempoEmpresa)}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}