import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Factory, CalendarDays, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface Colaborador {
  id: string;
  colaborador: string;
  setor: string;
  cargo: string;
  matricula: string;
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
  };
  return statusMap[status.toLowerCase()] || status;
};

// Componente do nome do colaborador
const ColaboradorBadge = ({ 
  colaborador, 
}: { 
  colaborador: ColaboradorComStatus; 
}) => {
  const primeiroNome = colaborador.colaborador.split(' ')[0];
  
  const badgeClass = colaborador.presente
    ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700"
    : "bg-muted/50 text-muted-foreground/70 border-border/50";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span 
          className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border cursor-pointer transition-all hover:scale-105 hover:shadow-sm ${badgeClass}`}
        >
          {primeiroNome}
          {!colaborador.presente && colaborador.statusChamada && (
            <span className="ml-1 opacity-70">
              ({formatStatus(colaborador.statusChamada).substring(0, 3)})
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
      .select('id, colaborador, setor, cargo, matricula')
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

  // Agrupar TODOS os colaboradores por setor com status
  const setoresData = useMemo<SetorData[]>(() => {
    const setorMap = new Map<string, ColaboradorComStatus[]>();
    
    colaboradores.forEach(colab => {
      if (colab.setor) {
        const statusChamada = chamadasMap.get(colab.id) || null;
        const presente = statusChamada?.toLowerCase() === 'presente';
        
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
        
        return {
          nome,
          colaboradores: sorted,
          totalPresentes: colaboradores.filter(c => c.presente).length,
          totalColaboradores: colaboradores.length
        };
      })
      .sort((a, b) => b.totalColaboradores - a.totalColaboradores);
  }, [colaboradores, chamadasMap]);

  const maxTotal = useMemo(() => {
    return Math.max(...setoresData.map(s => s.totalColaboradores), 1);
  }, [setoresData]);

  const totalPresentes = useMemo(() => {
    return setoresData.reduce((acc, s) => acc + s.totalPresentes, 0);
  }, [setoresData]);

  const totalAtivos = colaboradores.length;

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

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full border bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700">
            Nome
          </span>
          <span>= Presente</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full border bg-muted/50 text-muted-foreground/70 border-border/50">
            Nome (Sta)
          </span>
          <span>= Ausente</span>
        </div>
        <span className="text-border">|</span>
        <span>Passe o mouse para ver detalhes</span>
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

    </div>
  );
}
