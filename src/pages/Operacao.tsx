import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Factory, CalendarDays, AlertCircle, UserCheck, X, Home, Heart, Coffee, ShieldOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageTour } from "@/components/onboarding/PageTour";
import { operacaoTourSteps } from "@/constants/tourSteps";
import { CargoPorHorario } from "@/components/operacao/CargoPorHorario";
import { Layers, Clock } from "lucide-react";

interface Colaborador {
  id: string;
  colaborador: string;
  setor: string;
  cargo: string;
  matricula: string;
  turno: string | null;
}

interface Chamada {
  colaborador_id: string;
  status: string;
}

interface ColaboradorComStatus extends Colaborador {
  presente: boolean;
  statusChamada: string | null;
}

interface SetorData {
  nome: string;
  colaboradores: ColaboradorComStatus[];
  totalPresentes: number;
  totalColaboradores: number;
}


// Formatar status para exibição
const formatStatus = (status: string | null): string => {
  if (!status) return "Sem registro";
  const statusMap: Record<string, string> = {
    'falta': 'Falta',
    'ferias': 'Férias',
    'atestado': 'Atestado',
    'afastado': 'Afastado',
    'folga': 'Folga',
    'presente': 'Presente',
    'licenca': 'Licença',
  };
  return statusMap[status.toLowerCase()] || status;
};

// Cores por status
const getStatusStyle = (status: string | null): string => {
  if (!status) return "bg-gray-200 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600";
  
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case 'presente':
      return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-400 dark:border-green-700";
    case 'falta':
      return "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-400 dark:border-red-700";
    case 'atestado':
      return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-700";
    case 'ferias':
      return "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-400 dark:border-purple-700";
    case 'afastado':
      return "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-700";
    case 'folga':
      return "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/40 dark:text-cyan-400 dark:border-cyan-700";
    case 'licenca':
      return "bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900/40 dark:text-teal-400 dark:border-teal-700";
    default:
      return "bg-gray-200 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600";
  }
};

// Ícone de empilhadeira SVG
const ForkliftIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 17h2a2 2 0 0 0 2-2V5H5v12z" />
    <path d="M2 17h1" />
    <path d="M9 17h6" />
    <path d="M19 17h3v-6l-3-4h-4v10" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);

// Componente do nome do colaborador
const ColaboradorBadge = ({ 
  colaborador,
}: { 
  colaborador: ColaboradorComStatus;
}) => {
  const primeiroNome = colaborador.colaborador.split(' ')[0];
  const badgeClass = getStatusStyle(colaborador.statusChamada);
  const statusAbrev = !colaborador.presente && colaborador.statusChamada 
    ? formatStatus(colaborador.statusChamada).substring(0, 3).toUpperCase()
    : null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span 
          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border cursor-pointer transition-all hover:scale-105 hover:shadow-sm ${badgeClass}`}
        >
          {primeiroNome}
          {statusAbrev && (
            <span className="font-bold text-[10px] opacity-90">
              • {statusAbrev}
            </span>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-popover border border-border shadow-lg">
        <div className="text-sm">
          <p className="font-semibold">{colaborador.colaborador}</p>
          <p className="text-muted-foreground text-xs">{colaborador.cargo}</p>
          <p className="text-muted-foreground text-xs">Mat: {colaborador.matricula}</p>
          <p className={`text-xs mt-1 font-medium ${colaborador.presente ? 'text-green-600' : 'text-muted-foreground'}`}>
            Status: {formatStatus(colaborador.statusChamada)}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

// Componente do quadro do setor
const SetorCard = ({ setor, maxTotal }: { setor: SetorData; maxTotal: number }) => {
  const ratio = setor.totalColaboradores / maxTotal;
  const presencaRatio = setor.totalPresentes / setor.totalColaboradores;
  
  let sizeClass = "col-span-1 row-span-1";
  let minHeight = "180px";
  
  if (ratio >= 0.8) {
    sizeClass = "col-span-2 row-span-2";
    minHeight = "320px";
  } else if (ratio >= 0.5) {
    sizeClass = "col-span-2 row-span-1";
    minHeight = "220px";
  } else if (ratio >= 0.3) {
    sizeClass = "col-span-1 row-span-2";
    minHeight = "280px";
  } else if (ratio >= 0.15) {
    sizeClass = "col-span-1 row-span-1";
    minHeight = "200px";
  } else {
    sizeClass = "col-span-1 row-span-1";
    minHeight = "160px";
  }

  const getBgGradient = () => {
    if (ratio >= 0.7) return "from-primary/20 to-primary/5";
    if (ratio >= 0.4) return "from-accent/20 to-accent/5";
    if (ratio >= 0.2) return "from-secondary/30 to-secondary/10";
    return "from-muted/50 to-muted/20";
  };

  return (
    <Card 
      className={`${sizeClass} flex flex-col overflow-hidden bg-gradient-to-br ${getBgGradient()} border-2 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group`}
      style={{ minHeight }}
    >
      <CardHeader className="pb-1 pt-3 px-3">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="truncate">{setor.nome}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
            presencaRatio >= 0.8 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
              : presencaRatio >= 0.5 
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            <Users className="w-3 h-3" />
            {setor.totalPresentes}/{setor.totalColaboradores}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative flex-1 pb-4 pt-0">
        <div className="flex flex-wrap gap-1.5 items-start content-start p-2">
          {setor.colaboradores.map((colab) => (
            <ColaboradorBadge 
              key={colab.id} 
              colaborador={colab}
            />
          ))}
        </div>
      </CardContent>
      
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </Card>
  );
};

export default function Operacao() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [chamadas, setChamadas] = useState<Chamada[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [semNoturno, setSemNoturno] = useState(false);
  const [somentePresentes, setSomentePresentes] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"macro" | "cargoHorario">("macro");

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const isToday = format(new Date(), 'yyyy-MM-dd') === formattedDate;

  useEffect(() => {
    fetchData();

    // Realtime subscription para chamadas
    const chamadasChannel = supabase
      .channel('operacao-chamadas')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chamadas'
      }, () => {
        fetchChamadas();
      })
      .subscribe();

    // Realtime para colaboradores
    const colaboradoresChannel = supabase
      .channel('operacao-colaboradores')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'colaboradores'
      }, () => {
        fetchColaboradores();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chamadasChannel);
      supabase.removeChannel(colaboradoresChannel);
    };
  }, []);

  useEffect(() => {
    fetchChamadas();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchColaboradores(), fetchChamadas()]);
    setLoading(false);
  };

  const fetchColaboradores = async () => {
    const { data, error } = await supabase
      .from('colaboradores')
      .select('id, colaborador, setor, cargo, matricula, turno')
      .eq('status', 'Ativo')
      .order('setor');

    if (!error && data) {
      setColaboradores(data);
    }
  };

  const fetchChamadas = async () => {
    const { data, error } = await supabase
      .from('chamadas')
      .select('colaborador_id, status')
      .eq('data', formattedDate);

    if (!error && data) {
      setChamadas(data);
    }
  };

  // Mapear status das chamadas por colaborador_id
  const chamadasMap = useMemo(() => {
    const map = new Map<string, string>();
    chamadas.forEach(c => map.set(c.colaborador_id, c.status));
    return map;
  }, [chamadas]);

  // Filtrar colaboradores base (sem noturno se ativado)
  const colaboradoresFiltrados = useMemo(() => {
    if (!semNoturno) return colaboradores;
    return colaboradores.filter(c => c.turno !== '22:00 - 06:52');
  }, [colaboradores, semNoturno]);

  // Agrupar colaboradores por setor com status
  const setoresData = useMemo<SetorData[]>(() => {
    const setorMap = new Map<string, ColaboradorComStatus[]>();
    
    colaboradoresFiltrados.forEach(colab => {
      if (colab.setor) {
        const statusChamada = chamadasMap.get(colab.id) || null;
        const presente = statusChamada?.toLowerCase() === 'presente';
        
        // Se "Somente Presentes" está ativado, só adiciona presentes
        if (somentePresentes && !presente) return;
        
        // Filtro por status clicado nos indicadores
        if (filtroStatus) {
          const statusLower = statusChamada?.toLowerCase() || null;
          if (filtroStatus === 'semRegistro') {
            if (statusLower) return;
          } else if (statusLower !== filtroStatus) {
            return;
          }
        }
        
        const colabComStatus: ColaboradorComStatus = {
          ...colab,
          presente,
          statusChamada
        };
        
        const existing = setorMap.get(colab.setor) || [];
        existing.push(colabComStatus);
        setorMap.set(colab.setor, existing);
      }
    });

    return Array.from(setorMap.entries())
      .map(([nome, colaboradores]) => {
        // Ordenar: presentes primeiro, depois por nome
        const sorted = colaboradores.sort((a, b) => {
          if (a.presente && !b.presente) return -1;
          if (!a.presente && b.presente) return 1;
          return a.colaborador.localeCompare(b.colaborador);
        });
        
        // Para o total, consideramos todos os colaboradores do setor (filtrados por noturno se aplicável)
        const todosDoSetor = colaboradoresFiltrados.filter(c => c.setor === nome);
        const presentesDoSetor = todosDoSetor.filter(c => {
          const status = chamadasMap.get(c.id);
          return status?.toLowerCase() === 'presente';
        });
        
        return {
          nome,
          colaboradores: sorted,
          totalPresentes: presentesDoSetor.length,
          totalColaboradores: todosDoSetor.length
        };
      })
      .filter(s => s.colaboradores.length > 0) // Remove setores vazios quando só presentes
      .sort((a, b) => b.totalColaboradores - a.totalColaboradores);
  }, [colaboradoresFiltrados, chamadasMap, somentePresentes, filtroStatus]);

  const maxTotal = useMemo(() => {
    return Math.max(...setoresData.map(s => s.totalColaboradores), 1);
  }, [setoresData]);

  const totalPresentes = useMemo(() => {
    return setoresData.reduce((acc, s) => acc + s.totalPresentes, 0);
  }, [setoresData]);

  const totalAtivos = colaboradoresFiltrados.length;

  // Contagem por status para os indicadores
  const statusCounts = useMemo(() => {
    const counts = {
      presente: 0,
      falta: 0,
      folga: 0,
      atestado: 0,
      ferias: 0,
      licenca: 0,
      semRegistro: 0
    };
    
    colaboradoresFiltrados.forEach(colab => {
      const status = chamadasMap.get(colab.id)?.toLowerCase();
      if (!status) {
        counts.semRegistro++;
      } else if (status === 'presente') {
        counts.presente++;
      } else if (status === 'falta') {
        counts.falta++;
      } else if (status === 'folga') {
        counts.folga++;
      } else if (status === 'atestado') {
        counts.atestado++;
      } else if (status === 'ferias') {
        counts.ferias++;
      } else if (status === 'licenca') {
        counts.licenca++;
      }
    });
    
    return counts;
  }, [colaboradoresFiltrados, chamadasMap]);

  const statusIndicators = [
    { key: 'presente', label: 'Presente', icon: UserCheck, bgColor: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-600 dark:text-green-400' },
    { key: 'falta', label: 'Falta', icon: X, bgColor: 'bg-red-100 dark:bg-red-900/30', textColor: 'text-red-600 dark:text-red-400' },
    { key: 'folga', label: 'Folga', icon: Home, bgColor: 'bg-orange-100 dark:bg-orange-900/30', textColor: 'text-orange-600 dark:text-orange-400' },
    { key: 'atestado', label: 'Atestado', icon: Heart, bgColor: 'bg-pink-100 dark:bg-pink-900/30', textColor: 'text-pink-600 dark:text-pink-400' },
    { key: 'ferias', label: 'Férias', icon: Coffee, bgColor: 'bg-purple-100 dark:bg-purple-900/30', textColor: 'text-purple-600 dark:text-purple-400' },
    { key: 'licenca', label: 'Licença', icon: ShieldOff, bgColor: 'bg-teal-100 dark:bg-teal-900/30', textColor: 'text-teal-600 dark:text-teal-400' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Factory className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Mapa da Operação</h1>
            <p className="text-muted-foreground">
              Colaboradores presentes por setor
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Seletor de Data */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarDays className="w-4 h-4" />
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                {isToday && <Badge variant="secondary" className="ml-1 text-xs">Hoje</Badge>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={ptBR}
                disabled={(date) => date > new Date()}
              />
            </PopoverContent>
          </Popover>

          {/* Contador */}
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Presentes</p>
              <p className="text-xl font-bold text-primary">
                {totalPresentes}
                <span className="text-sm font-normal text-muted-foreground">/{totalAtivos}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Seletor de Visão */}
      <div className="flex items-center gap-2 p-1 bg-muted/40 rounded-lg border w-fit">
        <Button
          variant={viewMode === "macro" ? "default" : "ghost"}
          size="sm"
          onClick={() => setViewMode("macro")}
          className="gap-2"
        >
          <Layers className="w-4 h-4" />
          Visão Macro
        </Button>
        <Button
          variant={viewMode === "cargoHorario" ? "default" : "ghost"}
          size="sm"
          onClick={() => setViewMode("cargoHorario")}
          className="gap-2"
        >
          <Clock className="w-4 h-4" />
          Visão Cargo por Horário
        </Button>
      </div>

      {viewMode === "cargoHorario" ? (
        <CargoPorHorario colaboradores={colaboradoresFiltrados} />
      ) : (
        <>
      {/* Indicadores do Dia */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 md:gap-4">
        {statusIndicators.map(indicator => {
          const IconComponent = indicator.icon;
          const count = statusCounts[indicator.key as keyof typeof statusCounts];
          const isActive = filtroStatus === indicator.key;
          return (
            <div 
              key={indicator.key} 
              className={`text-center p-2 md:p-4 border rounded-lg bg-card cursor-pointer transition-all hover:shadow-md ${isActive ? 'ring-2 ring-primary shadow-md scale-[1.02]' : 'hover:scale-[1.01]'}`}
              onClick={() => setFiltroStatus(isActive ? null : indicator.key)}
            >
              <div className={`w-8 h-8 md:w-12 md:h-12 mx-auto rounded-lg flex items-center justify-center mb-1 md:mb-2 ${indicator.bgColor}`}>
                <IconComponent className={`w-4 h-4 md:w-6 md:h-6 ${indicator.textColor}`} />
              </div>
              <div className="text-lg md:text-2xl font-bold">{count}</div>
              <div className="text-xs md:text-sm text-muted-foreground">{indicator.label}</div>
            </div>
          );
        })}
      </div>
      {filtroStatus && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary" className="text-xs">
            Filtrando: {statusIndicators.find(s => s.key === filtroStatus)?.label}
          </Badge>
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setFiltroStatus(null)}>
            Limpar filtro
          </Button>
        </div>
      )}

      {/* Filtros Toggle */}
      <div className="flex flex-wrap items-center gap-6 p-3 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <Switch
            id="sem-noturno"
            checked={semNoturno}
            onCheckedChange={setSemNoturno}
          />
          <Label htmlFor="sem-noturno" className="text-sm cursor-pointer">
            Sem o Noturno
          </Label>
          {semNoturno && (
            <Badge variant="secondary" className="text-xs">
              Excluindo 22:00 - 06:52
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Switch
            id="somente-presentes"
            checked={somentePresentes}
            onCheckedChange={setSomentePresentes}
          />
          <Label htmlFor="somente-presentes" className="text-sm cursor-pointer">
            Somente os Presentes
          </Label>
          {somentePresentes && (
            <Badge variant="secondary" className="text-xs">
              Ocultando ausentes
            </Badge>
          )}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="font-medium">Legenda:</span>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
          <span>Presente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
          <span>Falta</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
          <span>Atestado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-purple-500"></span>
          <span>Férias</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-orange-500"></span>
          <span>Afastado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-cyan-500"></span>
          <span>Folga</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-teal-500"></span>
          <span>Licença</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-gray-400"></span>
          <span>Sem registro</span>
        </div>
      </div>

      {/* Mensagem se não houver colaboradores */}
      {setoresData.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum colaborador cadastrado</h3>
            <p className="text-muted-foreground max-w-md">
              Não há colaboradores ativos com setor definido.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grid de Setores */}
      {setoresData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 auto-rows-min">
          {setoresData.map((setor) => (
            <SetorCard 
              key={setor.nome} 
              setor={setor} 
              maxTotal={maxTotal}
            />
          ))}
        </div>
      )}

      <PageTour steps={operacaoTourSteps} />
    </div>
  );
}
