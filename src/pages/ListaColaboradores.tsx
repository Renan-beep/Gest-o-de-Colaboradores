import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelect } from "@/components/ui/multi-select";
import { useToast } from "@/hooks/use-toast";
import { Users, Filter, Search, Download, RefreshCw, Edit, UserCheck, UserX, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInMonths, differenceInYears, parseISO } from "date-fns";
import { exportToExcel } from "@/utils/secureExcel";
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

interface TempoEmpresa {
  anos: number;
  meses: number;
  totalMeses: number;
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

  // Filtros com seleção múltipla
  const [filtros, setFiltros] = useState({
    busca: "",
    status: [] as string[],
    cargo: [] as string[],
    setor: [] as string[],
    subsetor: [] as string[],
    lideranca: [] as string[],
    turno: [] as string[],
    sabadoTrabalho: [] as string[],
    tempoEmpresa: "todos"
  });
  
  // Estado para exportação com demitidos
  const [exportarComDemitidos, setExportarComDemitidos] = useState(false);

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
      filtered = filtered.filter(c => 
        c.colaborador.toLowerCase().includes(busca) || 
        c.matricula.toLowerCase().includes(busca) || 
        c.cargo?.toLowerCase().includes(busca) || 
        c.setor?.toLowerCase().includes(busca) || 
        c.lideranca?.toLowerCase().includes(busca)
      );
    }

    // Filtros de seleção múltipla
    if (filtros.status.length > 0) {
      filtered = filtered.filter(c => filtros.status.includes(c.status));
    }
    if (filtros.cargo.length > 0) {
      filtered = filtered.filter(c => filtros.cargo.includes(c.cargo));
    }
    if (filtros.setor.length > 0) {
      filtered = filtered.filter(c => filtros.setor.includes(c.setor));
    }
    if (filtros.subsetor.length > 0) {
      filtered = filtered.filter(c => filtros.subsetor.includes(c.subsetor));
    }
    if (filtros.lideranca.length > 0) {
      filtered = filtered.filter(c => filtros.lideranca.includes(c.lideranca));
    }
    if (filtros.turno.length > 0) {
      filtered = filtered.filter(c => filtros.turno.includes(c.turno));
    }
    if (filtros.sabadoTrabalho.length > 0) {
      filtered = filtered.filter(c => filtros.sabadoTrabalho.includes(c.sabado_trabalho));
    }
    if (filtros.tempoEmpresa !== "todos") {
      filtered = filtered.filter(c => {
        const tempo = calcularTempoEmpresa(c.admissao);
        if (filtros.tempoEmpresa === "novo") return tempo.totalMeses < 6;
        if (filtros.tempoEmpresa === "adaptacao") return tempo.totalMeses >= 6 && tempo.totalMeses < 12;
        if (filtros.tempoEmpresa === "experiente") return tempo.anos >= 1 && tempo.anos < 5;
        if (filtros.tempoEmpresa === "veterano") return tempo.anos >= 5;
        return true;
      });
    }
    setFilteredColaboradores(filtered);
  };

  const limparFiltros = () => {
    setFiltros({
      busca: "",
      status: [],
      cargo: [],
      setor: [],
      subsetor: [],
      lideranca: [],
      turno: [],
      sabadoTrabalho: [],
      tempoEmpresa: "todos"
    });
  };
  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "ativo") {
      return <Badge className="status-present">
        <UserCheck className="w-3 h-3 mr-1" />
        Ativo
      </Badge>;
    } else if (statusLower === "demitido") {
      return <Badge variant="destructive">
        <UserX className="w-3 h-3 mr-1" />
        Demitido
      </Badge>;
    } else {
      return <Badge className="status-absent">
        <Clock className="w-3 h-3 mr-1" />
        Afastado
      </Badge>;
    }
  };
  const getSabadoBadge = (sabadoTrabalho: string) => {
    if (!sabadoTrabalho) return null;
    const variant = sabadoTrabalho === "Sim" ? "default" : "outline";
    return <Badge variant={variant}>{sabadoTrabalho}</Badge>;
  };
  const formatarData = (data: string) => {
    if (!data) return "-";
    // Parse ISO date and format in local timezone to avoid timezone issues
    const [year, month, day] = data.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  const calcularTempoEmpresa = (dataAdmissao: string): TempoEmpresa => {
    if (!dataAdmissao) {
      return { anos: 0, meses: 0, totalMeses: 0 };
    }

    try {
      const admissao = parseISO(dataAdmissao);
      const hoje = new Date();
      
      const totalMeses = differenceInMonths(hoje, admissao);
      const anos = differenceInYears(hoje, admissao);
      const meses = totalMeses - (anos * 12);

      return {
        anos,
        meses,
        totalMeses
      };
    } catch (error) {
      return { anos: 0, meses: 0, totalMeses: 0 };
    }
  };

  const formatarTempoEmpresa = (tempo: TempoEmpresa): string => {
    if (tempo.anos === 0 && tempo.meses === 0) {
      return "Menos de 1 mês";
    }
    
    if (tempo.anos === 0) {
      return `${tempo.meses} ${tempo.meses === 1 ? 'mês' : 'meses'}`;
    }
    
    if (tempo.meses === 0) {
      return `${tempo.anos} ${tempo.anos === 1 ? 'ano' : 'anos'}`;
    }
    
    return `${tempo.anos} ${tempo.anos === 1 ? 'ano' : 'anos'} e ${tempo.meses} ${tempo.meses === 1 ? 'mês' : 'meses'}`;
  };

  const getTempoEmpresaBadge = (tempo: TempoEmpresa) => {
    if (tempo.totalMeses < 6) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Novo</Badge>;
    } else if (tempo.totalMeses < 12) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Adaptação</Badge>;
    } else if (tempo.anos < 5) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Experiente</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Veterano</Badge>;
    }
  };

  const exportarParaExcel = async () => {
    try {
      let dadosParaExportar = filteredColaboradores.map(colaborador => {
        const tempoEmpresa = calcularTempoEmpresa(colaborador.admissao);
        return {
          matricula: colaborador.matricula,
          colaborador: colaborador.colaborador,
          status: colaborador.status,
          cargo: colaborador.cargo || "",
          setor: colaborador.setor || "",
          subsetor: colaborador.subsetor || "",
          lideranca: colaborador.lideranca || "",
          turno: colaborador.turno || "",
          sabado_trabalho: colaborador.sabado_trabalho || "",
          sabado_horario: colaborador.sabado_horario || "",
          horario_almoco: colaborador.horario_almoco || "",
          horario_cafe: colaborador.horario_cafe || "",
          admissao: formatarData(colaborador.admissao),
          tempo_empresa: formatarTempoEmpresa(tempoEmpresa),
          data_demissao: "",
          motivo_demissao: ""
        };
      });

      // Se marcado para incluir demitidos, buscar dados da tabela demissoes
      if (exportarComDemitidos) {
        const { data: demissoes, error } = await supabase
          .from('demissoes')
          .select(`
            *,
            colaboradores (
              matricula, colaborador, cargo, setor, subsetor, 
              lideranca, turno, sabado_trabalho, sabado_horario, 
              horario_almoco, horario_cafe, admissao
            )
          `)
          .order('data_demissao', { ascending: false });

        if (error) {
          console.error('Erro ao buscar demissões:', error);
        } else if (demissoes) {
          const demitidosFormatados = demissoes.map(d => {
            const col = d.colaboradores as any;
            return {
              matricula: col?.matricula || 'N/A',
              colaborador: col?.colaborador || 'N/A',
              status: 'Demitido',
              cargo: col?.cargo || "",
              setor: col?.setor || "",
              subsetor: col?.subsetor || "",
              lideranca: col?.lideranca || "",
              turno: col?.turno || "",
              sabado_trabalho: col?.sabado_trabalho || "",
              sabado_horario: col?.sabado_horario || "",
              horario_almoco: col?.horario_almoco || "",
              horario_cafe: col?.horario_cafe || "",
              admissao: col?.admissao ? formatarData(col.admissao) : "",
              tempo_empresa: col?.admissao ? formatarTempoEmpresa(calcularTempoEmpresa(col.admissao)) : "",
              data_demissao: formatarData(d.data_demissao),
              motivo_demissao: d.motivo || ""
            };
          });
          
          // Adicionar demitidos que não estão na lista filtrada
          const matriculasExistentes = new Set(dadosParaExportar.map(d => d.matricula));
          demitidosFormatados.forEach(d => {
            if (!matriculasExistentes.has(d.matricula)) {
              dadosParaExportar.push(d);
            }
          });
        }
      }

      const nomeArquivo = `colaboradores_${exportarComDemitidos ? 'com_demitidos_' : ''}${new Date().toISOString().split('T')[0]}`;
      exportToExcel(dadosParaExportar, nomeArquivo);
      
      toast({
        title: "Sucesso",
        description: `${dadosParaExportar.length} colaboradores exportados para Excel`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar arquivo. Tente novamente.",
        variant: "destructive"
      });
      console.error("Erro na exportação:", error);
    }
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
              <MultiSelect
                options={["Ativo", "Afastado", "Demitido"]}
                selected={filtros.status}
                onChange={(values) => setFiltros(prev => ({ ...prev, status: values }))}
                placeholder="Todos os status"
              />
            </div>

            {/* Sábado Trabalho */}
            <div className="space-y-2">
              <Label>Trabalha no Sábado</Label>
              <MultiSelect
                options={["Sim", "Não"]}
                selected={filtros.sabadoTrabalho}
                onChange={(values) => setFiltros(prev => ({ ...prev, sabadoTrabalho: values }))}
                placeholder="Todos"
              />
            </div>

            {/* Cargo */}
            <div className="space-y-2">
              <Label>Cargo</Label>
              <MultiSelect
                options={opcoesFiltros.cargos}
                selected={filtros.cargo}
                onChange={(values) => setFiltros(prev => ({ ...prev, cargo: values }))}
                placeholder="Todos os cargos"
              />
            </div>

            {/* Setor */}
            <div className="space-y-2">
              <Label>Setor</Label>
              <MultiSelect
                options={opcoesFiltros.setores}
                selected={filtros.setor}
                onChange={(values) => setFiltros(prev => ({ ...prev, setor: values }))}
                placeholder="Todos os setores"
              />
            </div>

            {/* Subsetor */}
            <div className="space-y-2">
              <Label>Subsetor</Label>
              <MultiSelect
                options={opcoesFiltros.subsetores}
                selected={filtros.subsetor}
                onChange={(values) => setFiltros(prev => ({ ...prev, subsetor: values }))}
                placeholder="Todos os subsetores"
              />
            </div>

            {/* Liderança */}
            <div className="space-y-2">
              <Label>Liderança</Label>
              <MultiSelect
                options={opcoesFiltros.liderancas}
                selected={filtros.lideranca}
                onChange={(values) => setFiltros(prev => ({ ...prev, lideranca: values }))}
                placeholder="Todas as lideranças"
              />
            </div>

            {/* Turno */}
            <div className="space-y-2">
              <Label>Turno</Label>
              <MultiSelect
                options={opcoesFiltros.turnos}
                selected={filtros.turno}
                onChange={(values) => setFiltros(prev => ({ ...prev, turno: values }))}
                placeholder="Todos os turnos"
              />
            </div>

            {/* Tempo de Empresa */}
            <div className="space-y-2">
              <Label>Tempo de Empresa</Label>
              <Select value={filtros.tempoEmpresa} onValueChange={value => setFiltros(prev => ({
              ...prev,
              tempoEmpresa: value
            }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="novo">Novo (menos de 6 meses)</SelectItem>
                  <SelectItem value="adaptacao">Adaptação (6-12 meses)</SelectItem>
                  <SelectItem value="experiente">Experiente (1-5 anos)</SelectItem>
                  <SelectItem value="veterano">Veterano (5+ anos)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-4">
            <Button variant="outline" onClick={limparFiltros}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Limpar Filtros
            </Button>
            
            <div className="flex items-center gap-2">
              <Checkbox 
                id="exportarComDemitidos"
                checked={exportarComDemitidos}
                onCheckedChange={(checked) => setExportarComDemitidos(checked === true)}
              />
              <Label htmlFor="exportarComDemitidos" className="text-sm cursor-pointer">
                Com demitidos
              </Label>
            </div>
            
            <Button variant="default" onClick={exportarParaExcel}>
              <Download className="w-4 h-4 mr-2" />
              Exportar para Excel
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
                  <TableHead>Tempo de Empresa</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredColaboradores.map(colaborador => {
                  const tempoEmpresa = calcularTempoEmpresa(colaborador.admissao);
                  return (
                    <TableRow key={colaborador.id}>
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
                        {colaborador.admissao ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="font-medium text-sm">{formatarTempoEmpresa(tempoEmpresa)}</span>
                            </div>
                            <div>{getTempoEmpresaBadge(tempoEmpresa)}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
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
                    </TableRow>
                  );
                })}
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