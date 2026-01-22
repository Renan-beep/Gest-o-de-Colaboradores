import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Factory } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Colaborador {
  id: string;
  colaborador: string;
  setor: string;
  cargo: string;
  matricula: string;
}

interface SetorData {
  nome: string;
  colaboradores: Colaborador[];
  total: number;
}

// Cores para os bonequinhos baseadas no seed
const personColors = [
  { body: "#3B82F6", head: "#60A5FA" }, // Azul
  { body: "#10B981", head: "#34D399" }, // Verde
  { body: "#8B5CF6", head: "#A78BFA" }, // Roxo
  { body: "#F59E0B", head: "#FBBF24" }, // Amarelo
  { body: "#EF4444", head: "#F87171" }, // Vermelho
  { body: "#EC4899", head: "#F472B6" }, // Rosa
  { body: "#06B6D4", head: "#22D3EE" }, // Ciano
  { body: "#F97316", head: "#FB923C" }, // Laranja
];

// Componente do Stickman animado (vista de cima) - Design moderno
const StickmanTopView = ({ 
  colaborador, 
  index,
}: { 
  colaborador: Colaborador; 
  index: number;
}) => {
  // Calcular posição aleatória mas estável baseada no index
  const seed = colaborador.id.charCodeAt(0) + colaborador.id.charCodeAt(1);
  const randomX = (seed % 75) + 12; // 12-87%
  const randomY = ((seed * 7) % 65) + 18; // 18-83%
  
  // Cor baseada no seed
  const colorIndex = seed % personColors.length;
  const colors = personColors[colorIndex];
  
  // Variação na animação baseada no index
  const animationDelay = (index * 0.2) % 4;
  const animationDuration = 3 + (seed % 2);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="absolute cursor-pointer transition-all hover:scale-[1.8] hover:z-50 z-10"
          style={{
            left: `${randomX}%`,
            top: `${randomY}%`,
            animation: `float ${animationDuration}s ease-in-out ${animationDelay}s infinite`,
          }}
        >
          {/* Bonequinho estilo avatar/emoji moderno */}
          <svg width="20" height="20" viewBox="0 0 32 32" className="drop-shadow-md">
            {/* Sombra suave */}
            <ellipse cx="16" cy="28" rx="6" ry="2" fill="rgba(0,0,0,0.15)" />
            
            {/* Corpo (formato de gota invertida) */}
            <path 
              d="M16 14 C10 14, 8 20, 8 24 C8 27, 11 28, 16 28 C21 28, 24 27, 24 24 C24 20, 22 14, 16 14Z" 
              fill={colors.body}
            />
            
            {/* Cabeça */}
            <circle cx="16" cy="10" r="7" fill={colors.head} />
            
            {/* Rosto - olhos */}
            <circle cx="13" cy="9" r="1.5" fill="white" />
            <circle cx="19" cy="9" r="1.5" fill="white" />
            <circle cx="13.5" cy="9.3" r="0.8" fill="#1e293b" />
            <circle cx="19.5" cy="9.3" r="0.8" fill="#1e293b" />
            
            {/* Sorriso */}
            <path 
              d="M13 12.5 Q16 15, 19 12.5" 
              fill="none" 
              stroke="#1e293b" 
              strokeWidth="1" 
              strokeLinecap="round"
            />
            
            {/* Brilho na cabeça */}
            <circle cx="12" cy="7" r="1.5" fill="rgba(255,255,255,0.4)" />
          </svg>
        </div>
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
  // Calcular tamanho relativo baseado na quantidade de colaboradores
  const ratio = setor.total / maxTotal;
  
  // Definir classes de tamanho baseadas no ratio
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

  // Cores baseadas no tamanho do setor
  const getBgGradient = () => {
    if (ratio >= 0.7) return "from-primary/20 to-primary/5";
    if (ratio >= 0.4) return "from-accent/20 to-accent/5";
    if (ratio >= 0.2) return "from-secondary/30 to-secondary/10";
    return "from-muted/50 to-muted/20";
  };

  return (
    <Card 
      className={`${sizeClass} relative overflow-hidden bg-gradient-to-br ${getBgGradient()} border-2 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group`}
      style={{ minHeight }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="truncate">{setor.nome}</span>
          <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
            <Users className="w-3 h-3" />
            {setor.total}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative h-full pb-4">
        {/* Área dos stickmen */}
        <div className="relative w-full h-full min-h-[100px]">
          {setor.colaboradores.map((colab, index) => (
            <StickmanTopView 
              key={colab.id} 
              colaborador={colab} 
              index={index}
            />
          ))}
        </div>
      </CardContent>
      
      {/* Efeito de hover */}
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </Card>
  );
};

export default function Operacao() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchColaboradores();

    // Realtime subscription
    const channel = supabase
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
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchColaboradores = async () => {
    const { data, error } = await supabase
      .from('colaboradores')
      .select('id, colaborador, setor, cargo, matricula')
      .eq('status', 'Ativo')
      .order('setor');

    if (!error && data) {
      setColaboradores(data);
    }
    setLoading(false);
  };

  // Agrupar colaboradores por setor
  const setoresData = useMemo<SetorData[]>(() => {
    const setorMap = new Map<string, Colaborador[]>();
    
    colaboradores.forEach(colab => {
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
  }, [colaboradores]);

  const maxTotal = useMemo(() => {
    return Math.max(...setoresData.map(s => s.total), 1);
  }, [setoresData]);

  const totalColaboradores = useMemo(() => {
    return colaboradores.length;
  }, [colaboradores]);

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Factory className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Mapa da Operação</h1>
            <p className="text-muted-foreground">
              Visualização em tempo real dos colaboradores por setor
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2">
          <Users className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Total na Operação</p>
            <p className="text-xl font-bold text-primary">{totalColaboradores}</p>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 32 32" className="drop-shadow-md">
            <ellipse cx="16" cy="28" rx="6" ry="2" fill="rgba(0,0,0,0.15)" />
            <path d="M16 14 C10 14, 8 20, 8 24 C8 27, 11 28, 16 28 C21 28, 24 27, 24 24 C24 20, 22 14, 16 14Z" fill="#3B82F6" />
            <circle cx="16" cy="10" r="7" fill="#60A5FA" />
            <circle cx="13" cy="9" r="1.5" fill="white" />
            <circle cx="19" cy="9" r="1.5" fill="white" />
            <circle cx="13.5" cy="9.3" r="0.8" fill="#1e293b" />
            <circle cx="19.5" cy="9.3" r="0.8" fill="#1e293b" />
            <path d="M13 12.5 Q16 15, 19 12.5" fill="none" stroke="#1e293b" strokeWidth="1" strokeLinecap="round" />
          </svg>
          <span>= 1 Colaborador</span>
        </div>
        <span className="text-border">|</span>
        <span>Passe o mouse sobre um colaborador para ver detalhes</span>
      </div>

      {/* Grid de Setores (Treemap-style) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 auto-rows-min">
        {setoresData.map((setor) => (
          <SetorCard 
            key={setor.nome} 
            setor={setor} 
            maxTotal={maxTotal}
          />
        ))}
      </div>

      {/* CSS para animação */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
        }
      `}</style>
    </div>
  );
}
