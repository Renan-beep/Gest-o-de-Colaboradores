import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users, Filter, Search, Download, RefreshCw, Edit, UserCheck, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
interface Colaborador {
  id: string;
  matricula: string;
  colaborador: string;
  status: string;
  cargo: string;
  setor: string;
  subsetor: string;
  lideranca: string;
  turno: string;
  sabado_trabalho: string;
  sabado_horario: string;
  horario_almoco: string;
  horario_cafe: string;
  admissao: string;
  created_at: string;
  updated_at: string;
}
export default function ListaColaboradores() {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const {
    isGerencia
  } = useAuth();
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [filteredColaboradores, setFilteredColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtros, setFiltros] = useState({
    busca: "",
    status: "todos",
    cargo: "todos",
    setor: "todos",
    subsetor: "todos",
    lideranca: "todos",
    turno: "todos",
    sabadoTrabalho: "todos"
  });

  // Listas para filtros
  const [opcoesFiltros, setOpcoesFiltros] = useState({
    cargos: [] as string[],
    setores: [] as string[],
    subsetores: [] as string[],
    liderancas: [] as string[],
    turnos: [] as string[]
  });
  useEffect(() => {
    fetchColaboradores();
  }, []);
  useEffect(() => {
    aplicarFiltros();
  }, [colaboradores, filtros]);
  const fetchColaboradores = async () => {
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.from('colaboradores').select('*').order('colaborador');
      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar colaboradores: " + error.message,
          variant: "destructive"
        });
        return;
      }
      setColaboradores(data || []);

      // Extrair opções únicas para filtros
      const cargos = [...new Set(data?.map(c => c.cargo).filter(c => c && c.trim() !== '') || [])];
      const setores = [...new Set(data?.map(c => c.setor).filter(s => s && s.trim() !== '') || [])];
      const subsetores = [...new Set(data?.map(c => c.subsetor).filter(s => s && s.trim() !== '') || [])];
      const liderancas = [...new Set(data?.map(c => c.lideranca).filter(l => l && l.trim() !== '') || [])];
      const turnos = [...new Set(data?.map(c => c.turno).filter(t => t && t.trim() !== '') || [])];
      setOpcoesFiltros({
        cargos: cargos.sort(),
        setores: setores.sort(),
        subsetores: subsetores.sort(),
        liderancas: liderancas.sort(),
        turnos: turnos.sort()
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar colaboradores",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const aplicarFiltros = () => {
    let filtered = colaboradores;

    // Filtro de busca geral
    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase();
      filtered = filtered.filter(c => c.colaborador.toLowerCase().includes(busca) || c.matricula.toLowerCase().includes(busca) || c.cargo?.toLowerCase().includes(busca) || c.setor?.toLowerCase().includes(busca) || c.lideranca?.toLowerCase().includes(busca));
    }

    // Filtros específicos
    if (filtros.status !== "todos") {
      filtered = filtered.filter(c => c.status?.toLowerCase() === filtros.status.toLowerCase());
    }
    if (filtros.cargo !== "todos") {
      filtered = filtered.filter(c => c.cargo === filtros.cargo);
    }
    if (filtros.setor !== "todos") {
      filtered = filtered.filter(c => c.setor === filtros.setor);
    }
    if (filtros.subsetor !== "todos") {
      filtered = filtered.filter(c => c.subsetor === filtros.subsetor);
    }
    if (filtros.lideranca !== "todos") {
      filtered = filtered.filter(c => c.lideranca === filtros.lideranca);
    }
    if (filtros.turno !== "todos") {
      filtered = filtered.filter(c => c.turno === filtros.turno);
    }
    if (filtros.sabadoTrabalho !== "todos") {
      filtered = filtered.filter(c => c.sabado_trabalho === filtros.sabadoTrabalho);
    }
    setFilteredColaboradores(filtered);
  };
  const limparFiltros = () => {
    setFiltros({
      busca: "",
      status: "todos",
      cargo: "todos",
      setor: "todos",
      subsetor: "todos",
      lideranca: "todos",
      turno: "todos",
      sabadoTrabalho: "todos"
    });
  };
  const getStatusBadge = (status: string) => {
    const isAtivo = status?.toLowerCase() === "ativo";
    return isAtivo ? <Badge className="status-present">
        <UserCheck className="w-3 h-3 mr-1" />
        Ativo
      </Badge> : <Badge className="status-absent">
        <UserX className="w-3 h-3 mr-1" />
        Afastado
      </Badge>;
  };
  const getSabadoBadge = (sabadoTrabalho: string) => {
    if (!sabadoTrabalho) return null;
    const variant = sabadoTrabalho === "Sim" ? "default" : "outline";
    return <Badge variant={variant}>{sabadoTrabalho}</Badge>;
  };
  const formatarData = (data: string) => {
    if (!data) return "-";
    return new Date(data).toLocaleDateString('pt-BR');
  };
  if (loading) {
    return <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Lista de Colaboradores</h1>
            <p className="text-muted-foreground">Carregando colaboradores...</p>
          </div>
        </div>
      </div>;
  }
  return <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Lista de Colaboradores</h1>
          <p className="text-muted-foreground">Gerencie e visualize todos os colaboradores</p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros de Pesquisa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Busca Geral */}
            <div className="space-y-2 lg:col-span-2">
              <Label>Busca Geral</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Nome, matrícula, cargo, setor..." value={filtros.busca} onChange={e => setFiltros(prev => ({
                ...prev,
                busca: e.target.value
              }))} className="pl-8" />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filtros.status} onValueChange={value => setFiltros(prev => ({
              ...prev,
              status: value
            }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Afastado">Afastado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sábado Trabalho */}
            <div className="space-y-2">
              <Label>Trabalha no Sábado</Label>
              <Select value={filtros.sabadoTrabalho} onValueChange={value => setFiltros(prev => ({
              ...prev,
              sabadoTrabalho: value
            }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Sim">Sim</SelectItem>
                  <SelectItem value="Não">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cargo */}
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Select value={filtros.cargo} onValueChange={value => setFiltros(prev => ({
              ...prev,
              cargo: value
            }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {opcoesFiltros.cargos.map(cargo => <SelectItem key={cargo} value={cargo}>{cargo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Setor */}
            <div className="space-y-2">
              <Label>Setor</Label>
              <Select value={filtros.setor} onValueChange={value => setFiltros(prev => ({
              ...prev,
              setor: value
            }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {opcoesFiltros.setores.map(setor => <SelectItem key={setor} value={setor}>{setor}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Subsetor */}
            <div className="space-y-2">
              <Label>Subsetor</Label>
              <Select value={filtros.subsetor} onValueChange={value => setFiltros(prev => ({
              ...prev,
              subsetor: value
            }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {opcoesFiltros.subsetores.map(subsetor => <SelectItem key={subsetor} value={subsetor}>{subsetor}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Liderança */}
            <div className="space-y-2">
              <Label>Liderança</Label>
              <Select value={filtros.lideranca} onValueChange={value => setFiltros(prev => ({
              ...prev,
              lideranca: value
            }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {opcoesFiltros.liderancas.map(lideranca => <SelectItem key={lideranca} value={lideranca}>{lideranca}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Turno */}
            <div className="space-y-2">
              <Label>Turno</Label>
              <Select value={filtros.turno} onValueChange={value => setFiltros(prev => ({
              ...prev,
              turno: value
            }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {opcoesFiltros.turnos.map(turno => <SelectItem key={turno} value={turno}>{turno}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={limparFiltros}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Limpar Filtros
            </Button>
            
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Exibindo {filteredColaboradores.length} de {colaboradores.length} colaboradores
            </div>
            <div className="flex gap-4 text-sm">
              <span>Ativos: {filteredColaboradores.filter(c => c.status?.toLowerCase() === "ativo").length}</span>
              <span>Sábado: {filteredColaboradores.filter(c => c.sabado_trabalho === "Sim").length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card className="shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Subsetor</TableHead>
                  <TableHead>Liderança</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Sábado</TableHead>
                  <TableHead>Horário Sábado</TableHead>
                  <TableHead>Horário Almoço</TableHead>
                  <TableHead>Horário Café</TableHead>
                  <TableHead>Admissão</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredColaboradores.map(colaborador => <TableRow key={colaborador.id}>
                    <TableCell className="font-medium">{colaborador.matricula}</TableCell>
                    <TableCell>{colaborador.colaborador}</TableCell>
                    <TableCell>{getStatusBadge(colaborador.status)}</TableCell>
                    <TableCell>{colaborador.cargo || "-"}</TableCell>
                    <TableCell>{colaborador.setor || "-"}</TableCell>
                    <TableCell>{colaborador.subsetor || "-"}</TableCell>
                    <TableCell>{colaborador.lideranca || "-"}</TableCell>
                    <TableCell>{colaborador.turno || "-"}</TableCell>
                    <TableCell>{getSabadoBadge(colaborador.sabado_trabalho)}</TableCell>
                    <TableCell>{colaborador.sabado_horario || "-"}</TableCell>
                    <TableCell>{colaborador.horario_almoco || "-"}</TableCell>
                    <TableCell>{colaborador.horario_cafe || "-"}</TableCell>
                    <TableCell>{formatarData(colaborador.admissao)}</TableCell>
                    <TableCell>
                       <div className="flex gap-2">
                         {isGerencia ? <Button variant="outline" size="sm" onClick={() => navigate(`/editar-colaborador/${colaborador.id}`)} className="hover:bg-primary hover:text-primary-foreground transition-colors" title="Editar colaborador">
                             <Edit className="w-4 h-4 mr-1" />
                             Editar
                           </Button> : <Button variant="outline" size="sm" onClick={() => navigate(`/editar-colaborador/${colaborador.id}`)} className="hover:bg-muted transition-colors" title="Visualizar detalhes do colaborador">
                             <Edit className="w-4 h-4 mr-1" />
                             Ver Detalhes
                           </Button>}
                       </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </div>
          
          {filteredColaboradores.length === 0 && <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-muted-foreground">Nenhum colaborador encontrado com os filtros aplicados</div>
            </div>}
        </CardContent>
      </Card>
    </div>;
}