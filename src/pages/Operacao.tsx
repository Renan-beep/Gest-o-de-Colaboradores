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

interface SetorData {
  nome: string;
  colaboradores: Colaborador[];
  total: number;
}

// Cores para os badges baseadas no seed
const badgeColors = [
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-green-100 text-green-800 border-green-200",
  "bg-purple-100 text-purple-800 border-purple-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-rose-100 text-rose-800 border-rose-200",
  "bg-pink-100 text-pink-800 border-pink-200",
  "bg-cyan-100 text-cyan-800 border-cyan-200",
  "bg-orange-100 text-orange-800 border-orange-200",
];

// Componente do nome do colaborador
const ColaboradorBadge = ({ 
  colaborador, 
}: { 
  colaborador: Colaborador; 
}) => {
  const seed = colaborador.id.charCodeAt(0) + colaborador.id.charCodeAt(1);
  const colorIndex = seed % badgeColors.length;
  const colorClass = badgeColors[colorIndex];
  
  // Pegar primeiro nome
  const primeiroNome = colaborador.colaborador.split(' ')[0];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span 
          className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border cursor-pointer transition-all hover:scale-105 hover:shadow-sm ${colorClass}`}
        >
          {primeiroNome}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-popover border border-border shadow-lg">
        <div className="text-sm">
          <p className="font-semibold">{colaborador.colaborador}</p>
          <p className="text-muted-foreground text-xs">{colaborador.cargo}</p>
          <p className="text-muted-foreground text-xs">Mat: {colaborador.matricula}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

// Componente do quadro do setor
const SetorCard = ({ setor, maxTotal }: { setor: SetorData; maxTotal: number }) => {
  const ratio = setor.total / maxTotal;
  
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
          <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
            <Users className="w-3 h-3" />
            {setor.total}
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

  // Filtrar apenas colaboradores presentes (status em minúsculo no banco)
  const colaboradoresPresentes = useMemo(() => {
    const presentesIds = new Set(
      chamadas
        .filter(c => c.status.toLowerCase() === 'presente')
        .map(c => c.colaborador_id)
    );
    
    return colaboradores.filter(c => presentesIds.has(c.id));
  }, [colaboradores, chamadas]);

  // Agrupar colaboradores presentes por setor
  const setoresData = useMemo<SetorData[]>(() => {
    const setorMap = new Map<string, Colaborador[]>();
    
    colaboradoresPresentes.forEach(colab => {
      if (colab.setor) {
        const existing = setorMap.get(colab.setor) || [];
        existing.push(colab);
        setorMap.set(colab.setor, existing);
      }
    });

    return Array.from(setorMap.entries())
      .map(([nome, colaboradores]) => ({
        nome,
        colaboradores,
        total: colaboradores.length
      }))
      .sort((a, b) => b.total - a.total);
  }, [colaboradoresPresentes]);

  const maxTotal = useMemo(() => {
    return Math.max(...setoresData.map(s => s.total), 1);
  }, [setoresData]);

  const totalPresentes = colaboradoresPresentes.length;
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
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full border bg-blue-100 text-blue-800 border-blue-200">
            Nome
          </span>
          <span>= 1 Colaborador presente</span>
        </div>
        <span className="text-border">|</span>
        <span>Passe o mouse para ver detalhes</span>
      </div>

      {/* Mensagem se não houver presentes */}
      {totalPresentes === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum colaborador presente</h3>
            <p className="text-muted-foreground max-w-md">
              {isToday 
                ? "Ainda não há registros de presença para hoje. Acesse o Controle de Presença para registrar."
                : `Não há registros de presença para ${format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.`
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grid de Setores */}
      {totalPresentes > 0 && (
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
