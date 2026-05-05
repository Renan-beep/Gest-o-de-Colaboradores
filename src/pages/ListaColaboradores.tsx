import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelect } from "@/components/ui/multi-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Users, Filter, Search, Download, RefreshCw, Edit, UserCheck, UserX, Clock, Eye, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageTour } from "@/components/onboarding/PageTour";
import { listaColaboradoresTourSteps } from "@/constants/tourSteps";
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
  sexo: string;
  rapdo: boolean;
  created_at: string;
  updated_at: string;
}

interface Demitido {
  id: string;
  colaborador_id: string;
  data_demissao: string;
  tipo_demissao: string;
  motivo: string | null;
  observacoes: string | null;
  // Dados do colaborador
  matricula: string;
  colaborador: string;
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
  sexo: string;
}

interface TempoEmpresa {
  anos: number;
  meses: number;
  totalMeses: number;
}

export default function ListaColaboradores() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isGerencia } = useAuth();
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [filteredColaboradores, setFilteredColaboradores] = useState<Colaborador[]>([]);
  const [demitidos, setDemitidos] = useState<Demitido[]>([]);
  const [filteredDemitidos, setFilteredDemitidos] = useState<Demitido[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ativos");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
    horarioAlmoco: [] as string[],
    horarioCafe: [] as string[],
    sexo: [] as string[],
    rapdo: "todos" as "todos" | "sim" | "nao",
    tempoEmpresa: "todos"
  });

  // Filtros para demitidos
  const [filtrosDemitidos, setFiltrosDemitidos] = useState({
    busca: "",
    tipoDemissao: [] as string[],
    setor: [] as string[],
    lideranca: [] as string[],
  });
  
  // Estado para exportação com demitidos
  const [exportarComDemitidos, setExportarComDemitidos] = useState(false);

  // Listas para filtros
  const [opcoesFiltros, setOpcoesFiltros] = useState({
    cargos: [] as string[],
    setores: [] as string[],
    subsetores: [] as string[],
    liderancas: [] as string[],
    turnos: [] as string[],
    horariosAlmoco: [] as string[],
    horariosCafe: [] as string[]
  });

  useEffect(() => {
    fetchColaboradores();
    fetchDemitidos();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [colaboradores, filtros]);

  useEffect(() => {
    aplicarFiltrosDemitidos();
  }, [demitidos, filtrosDemitidos]);

  const fetchColaboradores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .neq('status', 'Demitido') // Excluir demitidos da lista principal
        .order('colaborador');

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
      const horariosAlmoco = [...new Set(data?.map(c => c.horario_almoco).filter(h => h && h.trim() !== '') || [])];
      const horariosCafe = [...new Set(data?.map(c => c.horario_cafe).filter(h => h && h.trim() !== '') || [])];
      setOpcoesFiltros({
        cargos: cargos.sort(),
        setores: setores.sort(),
        subsetores: subsetores.sort(),
        liderancas: liderancas.sort(),
        turnos: turnos.sort(),
        horariosAlmoco: horariosAlmoco.sort(),
        horariosCafe: horariosCafe.sort()
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

  const fetchDemitidos = async () => {
    try {
      const { data: demissoesData, error } = await supabase
        .from('demissoes')
        .select(`
          *,
          colaboradores (
            matricula, colaborador, cargo, setor, subsetor, 
            lideranca, turno, sabado_trabalho, sabado_horario, 
            horario_almoco, horario_cafe, admissao, sexo
          )
        `)
        .order('data_demissao', { ascending: false });

      if (error) {
        console.error('Erro ao buscar demitidos:', error);
        return;
      }

      const demitidosFormatados: Demitido[] = (demissoesData || []).map(d => {
        const col = d.colaboradores as any;
        return {
          id: d.id,
          colaborador_id: d.colaborador_id,
          data_demissao: d.data_demissao,
          tipo_demissao: d.tipo_demissao,
          motivo: d.motivo,
          observacoes: d.observacoes,
          matricula: col?.matricula || 'N/A',
          colaborador: col?.colaborador || 'N/A',
          cargo: col?.cargo || '',
          setor: col?.setor || '',
          subsetor: col?.subsetor || '',
          lideranca: col?.lideranca || '',
          turno: col?.turno || '',
          sabado_trabalho: col?.sabado_trabalho || '',
          sabado_horario: col?.sabado_horario || '',
          horario_almoco: col?.horario_almoco || '',
          horario_cafe: col?.horario_cafe || '',
          admissao: col?.admissao || '',
          sexo: col?.sexo || ''
        };
      });

      setDemitidos(demitidosFormatados);
    } catch (error) {
      console.error('Erro ao buscar demitidos:', error);
    }
  };

  // Opções de filtros dinâmicas baseadas nos outros filtros selecionados
  const opcoesFiltrosDinamicos = useMemo(() => {
    // Função helper para filtrar colaboradores baseado em todos os filtros EXCETO o filtro atual
    const getColaboradoresFiltrados = (excluirFiltro: string) => {
      let filtered = colaboradores;

      const matchesField = (selected: string[], value: any) => {
        const isEmpty = !value || (typeof value === 'string' && value.trim() === '');
        if (selected.includes('(Vazio)') && isEmpty) return true;
        return selected.includes(value);
      };

      if (excluirFiltro !== 'status' && filtros.status.length > 0) {
        filtered = filtered.filter(c => matchesField(filtros.status, c.status));
      }
      if (excluirFiltro !== 'cargo' && filtros.cargo.length > 0) {
        filtered = filtered.filter(c => matchesField(filtros.cargo, c.cargo));
      }
      if (excluirFiltro !== 'setor' && filtros.setor.length > 0) {
        filtered = filtered.filter(c => matchesField(filtros.setor, c.setor));
      }
      if (excluirFiltro !== 'subsetor' && filtros.subsetor.length > 0) {
        filtered = filtered.filter(c => matchesField(filtros.subsetor, c.subsetor));
      }
      if (excluirFiltro !== 'lideranca' && filtros.lideranca.length > 0) {
        filtered = filtered.filter(c => matchesField(filtros.lideranca, c.lideranca));
      }
      if (excluirFiltro !== 'turno' && filtros.turno.length > 0) {
        filtered = filtered.filter(c => matchesField(filtros.turno, c.turno));
      }
      if (excluirFiltro !== 'sabadoTrabalho' && filtros.sabadoTrabalho.length > 0) {
        filtered = filtered.filter(c => matchesField(filtros.sabadoTrabalho, c.sabado_trabalho));
      }
      if (excluirFiltro !== 'horarioAlmoco' && filtros.horarioAlmoco.length > 0) {
        filtered = filtered.filter(c => matchesField(filtros.horarioAlmoco, c.horario_almoco));
      }
      if (excluirFiltro !== 'horarioCafe' && filtros.horarioCafe.length > 0) {
        filtered = filtered.filter(c => matchesField(filtros.horarioCafe, c.horario_cafe));
      }
      if (excluirFiltro !== 'sexo' && filtros.sexo.length > 0) {
        filtered = filtered.filter(c => matchesField(filtros.sexo, c.sexo));
      }

      return filtered;
    };

    // Adiciona "(Vazio)" como opção quando houver registros sem valor
    const buildOpcoes = (lista: any[], campo: string) => {
      const valores = lista.map(c => c[campo]);
      const opcoes = [...new Set(valores.filter(v => v && String(v).trim() !== ''))].sort() as string[];
      const temVazio = valores.some(v => !v || (typeof v === 'string' && v.trim() === ''));
      return temVazio ? ['(Vazio)', ...opcoes] : opcoes;
    };

    return {
      cargos: buildOpcoes(getColaboradoresFiltrados('cargo'), 'cargo'),
      setores: buildOpcoes(getColaboradoresFiltrados('setor'), 'setor'),
      subsetores: buildOpcoes(getColaboradoresFiltrados('subsetor'), 'subsetor'),
      liderancas: buildOpcoes(getColaboradoresFiltrados('lideranca'), 'lideranca'),
      turnos: buildOpcoes(getColaboradoresFiltrados('turno'), 'turno'),
      horariosAlmoco: buildOpcoes(getColaboradoresFiltrados('horarioAlmoco'), 'horario_almoco'),
      horariosCafe: buildOpcoes(getColaboradoresFiltrados('horarioCafe'), 'horario_cafe'),
      sexos: buildOpcoes(getColaboradoresFiltrados('sexo'), 'sexo')
    };
  }, [colaboradores, filtros]);

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
    if (filtros.horarioAlmoco.length > 0) {
      filtered = filtered.filter(c => filtros.horarioAlmoco.includes(c.horario_almoco));
    }
    if (filtros.horarioCafe.length > 0) {
      filtered = filtered.filter(c => filtros.horarioCafe.includes(c.horario_cafe));
    }
    if (filtros.sexo.length > 0) {
      filtered = filtered.filter(c => filtros.sexo.includes(c.sexo));
    }
    if (filtros.rapdo !== "todos") {
      filtered = filtered.filter(c => filtros.rapdo === "sim" ? c.rapdo === true : c.rapdo === false);
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

  const aplicarFiltrosDemitidos = () => {
    let filtered = demitidos;

    if (filtrosDemitidos.busca) {
      const busca = filtrosDemitidos.busca.toLowerCase();
      filtered = filtered.filter(d => 
        d.colaborador.toLowerCase().includes(busca) || 
        d.matricula.toLowerCase().includes(busca) || 
        d.cargo?.toLowerCase().includes(busca) || 
        d.setor?.toLowerCase().includes(busca)
      );
    }

    if (filtrosDemitidos.tipoDemissao.length > 0) {
      filtered = filtered.filter(d => filtrosDemitidos.tipoDemissao.includes(d.tipo_demissao));
    }

    if (filtrosDemitidos.setor.length > 0) {
      filtered = filtered.filter(d => filtrosDemitidos.setor.includes(d.setor));
    }

    if (filtrosDemitidos.lideranca.length > 0) {
      filtered = filtered.filter(d => filtrosDemitidos.lideranca.includes(d.lideranca));
    }

    setFilteredDemitidos(filtered);
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
      horarioAlmoco: [],
      horarioCafe: [],
      sexo: [],
      rapdo: "todos",
      tempoEmpresa: "todos"
    });
  };

  const limparFiltrosDemitidos = () => {
    setFiltrosDemitidos({
      busca: "",
      tipoDemissao: [],
      setor: [],
      lideranca: [],
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

  const getTipoDemissaoBadge = (tipo: string) => {
    const tipoConfig: Record<string, { variant: "default" | "destructive" | "outline" | "secondary", label: string }> = {
      'pedido_demissao': { variant: 'secondary', label: 'Pedido de Demissão' },
      'dispensa_sem_justa_causa': { variant: 'destructive', label: 'Dispensa s/ Justa Causa' },
      'dispensa_com_justa_causa': { variant: 'destructive', label: 'Dispensa c/ Justa Causa' },
      'termino_contrato': { variant: 'outline', label: 'Término de Contrato' },
      'aposentadoria': { variant: 'default', label: 'Aposentadoria' },
      'falecimento': { variant: 'secondary', label: 'Falecimento' },
    };
    const config = tipoConfig[tipo] || { variant: 'outline' as const, label: tipo };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getSabadoBadge = (sabadoTrabalho: string) => {
    if (!sabadoTrabalho) return null;
    const variant = sabadoTrabalho === "Sim" ? "default" : "outline";
    return <Badge variant={variant}>{sabadoTrabalho}</Badge>;
  };

  const formatarData = (data: string) => {
    if (!data) return "-";
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

  const calcularTempoAteDesligamento = (dataAdmissao: string, dataDesligamento: string): TempoEmpresa => {
    if (!dataAdmissao || !dataDesligamento) {
      return { anos: 0, meses: 0, totalMeses: 0 };
    }

    try {
      const admissao = parseISO(dataAdmissao);
      const desligamento = parseISO(dataDesligamento);
      
      const totalMeses = differenceInMonths(desligamento, admissao);
      const anos = differenceInYears(desligamento, admissao);
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

      // Se marcado para incluir demitidos
      if (exportarComDemitidos) {
        const demitidosFormatados = demitidos.map(d => {
          const tempoAteDesligamento = calcularTempoAteDesligamento(d.admissao, d.data_demissao);
          return {
            matricula: d.matricula,
            colaborador: d.colaborador,
            status: 'Demitido',
            cargo: d.cargo,
            setor: d.setor,
            subsetor: d.subsetor,
            lideranca: d.lideranca,
            turno: d.turno,
            sabado_trabalho: d.sabado_trabalho,
            sabado_horario: d.sabado_horario,
            horario_almoco: d.horario_almoco,
            horario_cafe: d.horario_cafe,
            admissao: formatarData(d.admissao),
            tempo_empresa: formatarTempoEmpresa(tempoAteDesligamento),
            data_demissao: formatarData(d.data_demissao),
            motivo_demissao: d.motivo || ""
          };
        });
        
        dadosParaExportar = [...dadosParaExportar, ...demitidosFormatados];
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

  const exportarDemitidosParaExcel = () => {
    try {
      const dadosParaExportar = filteredDemitidos.map(d => {
        const tempoAteDesligamento = calcularTempoAteDesligamento(d.admissao, d.data_demissao);
        return {
          matricula: d.matricula,
          colaborador: d.colaborador,
          sexo: d.sexo || "",
          cargo: d.cargo,
          setor: d.setor,
          subsetor: d.subsetor,
          lideranca: d.lideranca,
          turno: d.turno,
          admissao: formatarData(d.admissao),
          data_demissao: formatarData(d.data_demissao),
          tipo_demissao: d.tipo_demissao,
          motivo: d.motivo || "",
          tempo_empresa: formatarTempoEmpresa(tempoAteDesligamento),
          observacoes: d.observacoes || ""
        };
      });

      const nomeArquivo = `demitidos_${new Date().toISOString().split('T')[0]}`;
      exportToExcel(dadosParaExportar, nomeArquivo);
      
      toast({
        title: "Sucesso",
        description: `${dadosParaExportar.length} demitidos exportados para Excel`,
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

  // Obter opções únicas para filtros de demitidos
  const tiposDemissao = [...new Set(demitidos.map(d => d.tipo_demissao).filter(t => t))];
  const setoresDemitidos = [...new Set(demitidos.map(d => d.setor).filter(s => s))];
  const liderancasDemitidos = [...new Set(demitidos.map(d => d.lideranca).filter(l => l))];

  return <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Lista de Colaboradores</h1>
          <p className="text-muted-foreground">Gerencie e visualize todos os colaboradores</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="ativos" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Ativos/Afastados ({colaboradores.length})
          </TabsTrigger>
          <TabsTrigger value="demitidos" className="flex items-center gap-2">
            <UserX className="w-4 h-4" />
            Demitidos ({demitidos.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab de Colaboradores Ativos/Afastados */}
        <TabsContent value="ativos" className="space-y-6">
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
                    options={["Ativo", "Afastado"]}
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
                  <Label>Cargo {opcoesFiltrosDinamicos.cargos.length < opcoesFiltros.cargos.length && <span className="text-xs text-muted-foreground">({opcoesFiltrosDinamicos.cargos.length})</span>}</Label>
                  <MultiSelect
                    options={opcoesFiltrosDinamicos.cargos}
                    selected={filtros.cargo}
                    onChange={(values) => setFiltros(prev => ({ ...prev, cargo: values }))}
                    placeholder="Todos os cargos"
                  />
                </div>

                {/* Setor */}
                <div className="space-y-2">
                  <Label>Setor {opcoesFiltrosDinamicos.setores.length < opcoesFiltros.setores.length && <span className="text-xs text-muted-foreground">({opcoesFiltrosDinamicos.setores.length})</span>}</Label>
                  <MultiSelect
                    options={opcoesFiltrosDinamicos.setores}
                    selected={filtros.setor}
                    onChange={(values) => setFiltros(prev => ({ ...prev, setor: values }))}
                    placeholder="Todos os setores"
                  />
                </div>

                {/* Subsetor */}
                <div className="space-y-2">
                  <Label>Subsetor {opcoesFiltrosDinamicos.subsetores.length < opcoesFiltros.subsetores.length && <span className="text-xs text-muted-foreground">({opcoesFiltrosDinamicos.subsetores.length})</span>}</Label>
                  <MultiSelect
                    options={opcoesFiltrosDinamicos.subsetores}
                    selected={filtros.subsetor}
                    onChange={(values) => setFiltros(prev => ({ ...prev, subsetor: values }))}
                    placeholder="Todos os subsetores"
                  />
                </div>

                {/* Liderança */}
                <div className="space-y-2">
                  <Label>Liderança {opcoesFiltrosDinamicos.liderancas.length < opcoesFiltros.liderancas.length && <span className="text-xs text-muted-foreground">({opcoesFiltrosDinamicos.liderancas.length})</span>}</Label>
                  <MultiSelect
                    options={opcoesFiltrosDinamicos.liderancas}
                    selected={filtros.lideranca}
                    onChange={(values) => setFiltros(prev => ({ ...prev, lideranca: values }))}
                    placeholder="Todas as lideranças"
                  />
                </div>

                {/* Turno */}
                <div className="space-y-2">
                  <Label>Turno {opcoesFiltrosDinamicos.turnos.length < opcoesFiltros.turnos.length && <span className="text-xs text-muted-foreground">({opcoesFiltrosDinamicos.turnos.length})</span>}</Label>
                  <MultiSelect
                    options={opcoesFiltrosDinamicos.turnos}
                    selected={filtros.turno}
                    onChange={(values) => setFiltros(prev => ({ ...prev, turno: values }))}
                    placeholder="Todos os turnos"
                  />
                </div>

                {/* Horário Almoço */}
                <div className="space-y-2">
                  <Label>Horário Almoço {opcoesFiltrosDinamicos.horariosAlmoco.length < opcoesFiltros.horariosAlmoco.length && <span className="text-xs text-muted-foreground">({opcoesFiltrosDinamicos.horariosAlmoco.length})</span>}</Label>
                  <MultiSelect
                    options={opcoesFiltrosDinamicos.horariosAlmoco}
                    selected={filtros.horarioAlmoco}
                    onChange={(values) => setFiltros(prev => ({ ...prev, horarioAlmoco: values }))}
                    placeholder="Todos os horários"
                  />
                </div>

                {/* Horário Café */}
                <div className="space-y-2">
                  <Label>Horário Café {opcoesFiltrosDinamicos.horariosCafe.length < opcoesFiltros.horariosCafe.length && <span className="text-xs text-muted-foreground">({opcoesFiltrosDinamicos.horariosCafe.length})</span>}</Label>
                  <MultiSelect
                    options={opcoesFiltrosDinamicos.horariosCafe}
                    selected={filtros.horarioCafe}
                    onChange={(values) => setFiltros(prev => ({ ...prev, horarioCafe: values }))}
                    placeholder="Todos os horários"
                  />
                </div>

                {/* Sexo */}
                <div className="space-y-2">
                  <Label>Sexo {opcoesFiltrosDinamicos.sexos.length < 2 && <span className="text-xs text-muted-foreground">({opcoesFiltrosDinamicos.sexos.length})</span>}</Label>
                  <MultiSelect
                    options={opcoesFiltrosDinamicos.sexos.length > 0 ? opcoesFiltrosDinamicos.sexos : ["Masculino", "Feminino"]}
                    selected={filtros.sexo}
                    onChange={(values) => setFiltros(prev => ({ ...prev, sexo: values }))}
                    placeholder="Todos"
                  />
                </div>

                {/* RAPDO */}
                <div className="space-y-2">
                  <Label>RAPDO</Label>
                  <Select value={filtros.rapdo} onValueChange={value => setFiltros(prev => ({
                    ...prev,
                    rapdo: value as "todos" | "sim" | "nao"
                  }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="sim">Sim</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <span>Afastados: {filteredColaboradores.filter(c => c.status?.toLowerCase() === "afastado").length}</span>
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
                      {[
                        { key: 'matricula', label: 'Matrícula' },
                        { key: 'colaborador', label: 'Nome' },
                        { key: 'sexo', label: 'Sexo' },
                        { key: 'status', label: 'Status' },
                        { key: 'cargo', label: 'Cargo' },
                        { key: 'setor', label: 'Setor' },
                        { key: 'subsetor', label: 'Subsetor' },
                        { key: 'lideranca', label: 'Liderança' },
                        { key: 'turno', label: 'Turno' },
                        { key: 'sabado_trabalho', label: 'Sábado' },
                        { key: 'sabado_horario', label: 'Horário Sábado' },
                        { key: 'horario_almoco', label: 'Horário Almoço' },
                        { key: 'horario_cafe', label: 'Horário Café' },
                        { key: 'admissao', label: 'Admissão' },
                        { key: 'tempo_empresa', label: 'Tempo de Empresa' },
                      ].map(col => (
                        <TableHead
                          key={col.key}
                          className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            if (sortColumn === col.key) {
                              setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortColumn(col.key);
                              setSortDirection('asc');
                            }
                          }}
                        >
                          <div className="flex items-center gap-1">
                            {col.label}
                            {sortColumn === col.key ? (
                              sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />
                            )}
                          </div>
                        </TableHead>
                      ))}
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...filteredColaboradores].sort((a, b) => {
                      if (!sortColumn) return 0;
                      const dir = sortDirection === 'asc' ? 1 : -1;
                      if (sortColumn === 'tempo_empresa') {
                        return dir * (calcularTempoEmpresa(a.admissao).totalMeses - calcularTempoEmpresa(b.admissao).totalMeses);
                      }
                      const valA = (a[sortColumn as keyof Colaborador] ?? '').toString().toLowerCase();
                      const valB = (b[sortColumn as keyof Colaborador] ?? '').toString().toLowerCase();
                      return dir * valA.localeCompare(valB, 'pt-BR', { numeric: true });
                    }).map(colaborador => {
                      const tempoEmpresa = calcularTempoEmpresa(colaborador.admissao);
                      return (
                        <TableRow key={colaborador.id}>
                          <TableCell className="font-medium">{colaborador.matricula}</TableCell>
                          <TableCell>{colaborador.colaborador}</TableCell>
                          <TableCell>{colaborador.sexo || "-"}</TableCell>
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
        </TabsContent>

        {/* Tab de Demitidos */}
        <TabsContent value="demitidos" className="space-y-6">
          {/* Filtros Demitidos */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros de Pesquisa - Demitidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Busca Geral */}
                <div className="space-y-2 lg:col-span-2">
                  <Label>Busca Geral</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Nome, matrícula, cargo, setor..." value={filtrosDemitidos.busca} onChange={e => setFiltrosDemitidos(prev => ({
                    ...prev,
                    busca: e.target.value
                  }))} className="pl-8" />
                  </div>
                </div>

                {/* Tipo Demissão */}
                <div className="space-y-2">
                  <Label>Tipo de Demissão</Label>
                  <MultiSelect
                    options={tiposDemissao}
                    selected={filtrosDemitidos.tipoDemissao}
                    onChange={(values) => setFiltrosDemitidos(prev => ({ ...prev, tipoDemissao: values }))}
                    placeholder="Todos os tipos"
                  />
                </div>

                {/* Setor */}
                <div className="space-y-2">
                  <Label>Setor</Label>
                  <MultiSelect
                    options={setoresDemitidos}
                    selected={filtrosDemitidos.setor}
                    onChange={(values) => setFiltrosDemitidos(prev => ({ ...prev, setor: values }))}
                    placeholder="Todos os setores"
                  />
                </div>

                {/* Liderança */}
                <div className="space-y-2">
                  <Label>Liderança</Label>
                  <MultiSelect
                    options={liderancasDemitidos}
                    selected={filtrosDemitidos.lideranca}
                    onChange={(values) => setFiltrosDemitidos(prev => ({ ...prev, lideranca: values }))}
                    placeholder="Todas as lideranças"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-4">
                <Button variant="outline" onClick={limparFiltrosDemitidos}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Limpar Filtros
                </Button>
                
                <Button variant="default" onClick={exportarDemitidosParaExcel}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Demitidos para Excel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resumo Demitidos */}
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Exibindo {filteredDemitidos.length} de {demitidos.length} demitidos
                </div>
                <div className="flex gap-4 text-sm">
                  <span>Total de Demissões: {demitidos.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela Demitidos */}
          <Card className="shadow-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Sexo</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Subsetor</TableHead>
                      <TableHead>Liderança</TableHead>
                      <TableHead>Turno</TableHead>
                      <TableHead>Admissão</TableHead>
                      <TableHead>Data Demissão</TableHead>
                      <TableHead>Tempo de Empresa</TableHead>
                      <TableHead>Tipo Demissão</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDemitidos.map(demitido => {
                      const tempoEmpresa = calcularTempoAteDesligamento(demitido.admissao, demitido.data_demissao);
                      return (
                        <TableRow key={demitido.id}>
                          <TableCell className="font-medium">{demitido.matricula}</TableCell>
                          <TableCell>{demitido.colaborador}</TableCell>
                          <TableCell>{demitido.sexo || "-"}</TableCell>
                          <TableCell>{demitido.cargo || "-"}</TableCell>
                          <TableCell>{demitido.setor || "-"}</TableCell>
                          <TableCell>{demitido.subsetor || "-"}</TableCell>
                          <TableCell>{demitido.lideranca || "-"}</TableCell>
                          <TableCell>{demitido.turno || "-"}</TableCell>
                          <TableCell>{formatarData(demitido.admissao)}</TableCell>
                          <TableCell>{formatarData(demitido.data_demissao)}</TableCell>
                          <TableCell>
                            {demitido.admissao ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3 h-3 text-muted-foreground" />
                                  <span className="font-medium text-sm">{formatarTempoEmpresa(tempoEmpresa)}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{getTipoDemissaoBadge(demitido.tipo_demissao)}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={demitido.motivo || ''}>
                            {demitido.motivo || "-"}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => navigate(`/editar-colaborador/${demitido.colaborador_id}`)} 
                              className="hover:bg-muted transition-colors" 
                              title="Visualizar detalhes"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              {filteredDemitidos.length === 0 && <div className="text-center py-8">
                  <UserX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <div className="text-muted-foreground">Nenhum demitido encontrado com os filtros aplicados</div>
                </div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <PageTour steps={listaColaboradoresTourSteps} />
    </div>;
}
