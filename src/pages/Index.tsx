import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, UserX, Clock, TrendingUp, Building2, Sparkles, UserPlus, UserCheck, BarChart3, ChevronRight } from "lucide-react";
import { StatCard } from "@/components/stats/StatCard";
import HistoricoDemissoes from "@/components/dashboard/HistoricoDemissoes";
import TurnoverIndicator from "@/components/dashboard/TurnoverIndicator";
import IndicadorContratacoes from "@/components/dashboard/IndicadorContratacoes";

interface Colaborador {
  id: string;
  matricula: string;
  colaborador: string;
  cargo: string | null;
  setor: string | null;
  turno: string | null;
  lideranca: string | null;
  status: string;
}

const Index = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [stats, setStats] = useState({
    totalColaboradores: 0,
    afastados: 0,
    presentesHoje: 0,
    taxaPresenca: 0
  });
  const [indicators, setIndicators] = useState({
    porSetor: {} as Record<string, number>,
    porTurno: {} as Record<string, number>,
    porLideranca: {} as Record<string, number>,
    porStatus: {} as Record<string, number>,
    porCargo: {} as Record<string, number>,
    porSubsetor: {} as Record<string, number>,
    porSabadoObrigatorio: {} as Record<string, number>,
    porHorarioAlmoco: {} as Record<string, number>,
    porHorarioCafe: {} as Record<string, number>
  });
  const [loading, setLoading] = useState(true);
  const [allColaboradores, setAllColaboradores] = useState<Colaborador[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogColaboradores, setDialogColaboradores] = useState<Colaborador[]>([]);
  
  useEffect(() => {
    fetchStats();
    
    // Setup real-time subscription for colaboradores table
    const channel = supabase
      .channel('colaboradores-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'colaboradores'
        },
        () => {
          // Refresh stats when collaborators table changes
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  const fetchStats = async () => {
    try {
      // Buscar todos os colaboradores para calcular indicadores
      const {
        data: colaboradores,
        error: colaboradoresError
      } = await supabase.from('colaboradores').select('*').order('colaborador');
      if (colaboradoresError) throw colaboradoresError;
      
      setAllColaboradores(colaboradores || []);
      
      const totalColaboradores = colaboradores?.filter(c => c.status?.toLowerCase() === 'ativo').length || 0;
      const afastados = colaboradores?.filter(c => c.status?.toLowerCase() === 'afastado').length || 0;

      // Calcular indicadores
      const porSetor: Record<string, number> = {};
      const porTurno: Record<string, number> = {};
      const porLideranca: Record<string, number> = {};
      const porStatus: Record<string, number> = {};
      const porCargo: Record<string, number> = {};
      const porSubsetor: Record<string, number> = {};
      const porSabadoObrigatorio: Record<string, number> = {};
      const porHorarioAlmoco: Record<string, number> = {};
      const porHorarioCafe: Record<string, number> = {};
      colaboradores?.forEach(colaborador => {
        // Por setor
        if (colaborador.setor) {
          porSetor[colaborador.setor] = (porSetor[colaborador.setor] || 0) + 1;
        }

        // Por turno
        if (colaborador.turno) {
          porTurno[colaborador.turno] = (porTurno[colaborador.turno] || 0) + 1;
        }

        // Por liderança
        if (colaborador.lideranca) {
          porLideranca[colaborador.lideranca] = (porLideranca[colaborador.lideranca] || 0) + 1;
        }

        // Por status
        if (colaborador.status) {
          porStatus[colaborador.status] = (porStatus[colaborador.status] || 0) + 1;
        }

        // Por cargo
        if (colaborador.cargo) {
          porCargo[colaborador.cargo] = (porCargo[colaborador.cargo] || 0) + 1;
        }

        // Por subsetor
        if (colaborador.subsetor) {
          porSubsetor[colaborador.subsetor] = (porSubsetor[colaborador.subsetor] || 0) + 1;
        }

        // Por sábado obrigatório
        if (colaborador.sabado_horario) {
          const key = colaborador.sabado_horario ? 'Com horário' : 'Sem horário';
          porSabadoObrigatorio[key] = (porSabadoObrigatorio[key] || 0) + 1;
        }

        // Por horário de almoço
        if (colaborador.horario_almoco) {
          porHorarioAlmoco[colaborador.horario_almoco] = (porHorarioAlmoco[colaborador.horario_almoco] || 0) + 1;
        }

        // Por horário de café
        if (colaborador.horario_cafe) {
          porHorarioCafe[colaborador.horario_cafe] = (porHorarioCafe[colaborador.horario_cafe] || 0) + 1;
        }
      });

      // Buscar chamadas de hoje
      const hoje = new Date().toISOString().split('T')[0];
      const {
        data: chamadasHoje,
        error: chamadasError
      } = await supabase.from('chamadas').select('status').eq('data', hoje);
      if (chamadasError && chamadasError.code !== 'PGRST116') throw chamadasError;
      const presentesHoje = chamadasHoje?.filter(c => c.status === 'presente').length || 0;
      const totalChamadas = chamadasHoje?.length || 0;
      const taxaPresenca = totalChamadas > 0 ? presentesHoje / totalChamadas * 100 : 0;
      setStats({
        totalColaboradores,
        afastados,
        presentesHoje,
        taxaPresenca
      });
      setIndicators({
        porSetor,
        porTurno,
        porLideranca,
        porStatus,
        porCargo,
        porSubsetor,
        porSabadoObrigatorio,
        porHorarioAlmoco,
        porHorarioCafe
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar estatísticas: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleIndicatorClick = (tipo: 'setor' | 'turno' | 'lideranca' | 'cargo', valor: string) => {
    let filtered: Colaborador[] = [];
    let title = "";
    
    switch (tipo) {
      case 'setor':
        filtered = allColaboradores.filter(c => c.setor === valor);
        title = `Colaboradores do setor: ${valor}`;
        break;
      case 'turno':
        filtered = allColaboradores.filter(c => c.turno === valor);
        title = `Colaboradores do turno: ${valor}`;
        break;
      case 'lideranca':
        filtered = allColaboradores.filter(c => c.lideranca === valor);
        title = `Colaboradores da liderança: ${valor}`;
        break;
      case 'cargo':
        filtered = allColaboradores.filter(c => c.cargo === valor);
        title = `Colaboradores com cargo: ${valor}`;
        break;
    }
    
    setDialogTitle(title);
    setDialogColaboradores(filtered);
    setDialogOpen(true);
  };

  const handleColaboradorClick = (colaboradorId: string) => {
    setDialogOpen(false);
    navigate(`/editar-colaborador/${colaboradorId}`);
  };
  const menuOptions = [{
    title: "Cadastro de Colaboradores",
    description: "Adicione novos colaboradores ao sistema",
    icon: UserPlus,
    path: "/cadastro",
    color: "text-blue-600",
    bgColor: "bg-blue-100"
  }, {
    title: "Tabela de Colaboradores",
    description: "Visualize e gerencie todos os colaboradores",
    icon: Users,
    path: "/dashboard",
    color: "text-green-600",
    bgColor: "bg-green-100"
  }, {
    title: "Chamada Diária",
    description: "Registre a presença dos colaboradores",
    icon: UserCheck,
    path: "/chamada",
    color: "text-purple-600",
    bgColor: "bg-purple-100"
  }, {
    title: "Indicadores",
    description: "Acompanhe métricas e relatórios",
    icon: BarChart3,
    path: "/indicadores",
    color: "text-orange-600",
    bgColor: "bg-orange-100"
  }];
  return <div className="space-y-8 animate-fade-in">
      {/* Modern Header with Gradient */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-hero rounded-2xl opacity-10"></div>
        
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total de Colaboradores" 
          value={loading ? '...' : (stats.totalColaboradores + stats.afastados)} 
          subtitle="Todos os colaboradores" 
          icon={Users} 
          variant="primary" 
          loading={loading} 
          className="animate-slide-in" 
        />
        
        <StatCard 
          title="Colaboradores Ativos" 
          value={loading ? '...' : stats.totalColaboradores} 
          subtitle="Trabalhando no sistema" 
          icon={UserCheck} 
          variant="success" 
          loading={loading} 
          className="animate-slide-in" 
        />
        
        <StatCard 
          title="Colaboradores Afastados" 
          value={loading ? '...' : stats.afastados} 
          subtitle="Temporariamente ausentes" 
          icon={UserX} 
          variant="error" 
          loading={loading} 
          className="animate-slide-in" 
        />
        
        <StatCard 
          title="Taxa de Presença" 
          value={loading ? '...' : `${stats.taxaPresenca.toFixed(1)}%`} 
          subtitle="Média do dia atual" 
          icon={TrendingUp} 
          variant="default" 
          loading={loading} 
          className="animate-slide-in" 
        />
      </div>

      {/* Dashboard Content */}
      <div className="space-y-6">
        {/* Indicador de Contratações */}
        <IndicadorContratacoes />

        {/* Histórico de Demissões */}
        <HistoricoDemissoes />

        {/* Indicador de Turnover */}
        <TurnoverIndicator />

        {/* Indicadores em Grid Moderno */}
        <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </span>
              Indicadores Detalhados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Por Setor */}
              <Card className="glass-card card-hover">
                <CardHeader>
                  <CardTitle className="text-lg">Distribuição por Setor</CardTitle>
                  <CardDescription>Colaboradores ativos organizados por área</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? <div className="space-y-2">
                      {[1, 2, 3].map(i => <div key={i} className="flex justify-between items-center">
                          <div className="w-24 h-4 bg-muted animate-pulse rounded" />
                          <div className="w-8 h-6 bg-muted animate-pulse rounded-full" />
                        </div>)}
                    </div> : Object.entries(indicators.porSetor).length > 0 ? Object.entries(indicators.porSetor).map(([setor, count]) => <div 
                        key={setor} 
                        onClick={() => handleIndicatorClick('setor', setor)}
                        className="flex justify-between items-center p-3 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer group"
                      >
                        <span className="text-base font-medium truncate group-hover:text-primary">{setor}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-semibold text-sm px-3 py-1">{count}</Badge>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>) : <div className="text-center text-muted-foreground text-sm py-4">
                      Nenhum dado disponível
                    </div>}
                </CardContent>
              </Card>

              {/* Por Turno */}
              <Card className="glass-card card-hover">
                <CardHeader>
                  <CardTitle className="text-lg">Distribuição por Turno</CardTitle>
                  <CardDescription>Organização dos horários de trabalho</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? <div className="space-y-2">
                      {[1, 2, 3].map(i => <div key={i} className="flex justify-between items-center">
                          <div className="w-20 h-4 bg-muted animate-pulse rounded" />
                          <div className="w-8 h-6 bg-muted animate-pulse rounded-full" />
                        </div>)}
                    </div> : Object.entries(indicators.porTurno).length > 0 ? Object.entries(indicators.porTurno).map(([turno, count]) => <div 
                        key={turno}
                        onClick={() => handleIndicatorClick('turno', turno)}
                        className="flex justify-between items-center p-3 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer group"
                      >
                        <span className="text-base font-medium truncate group-hover:text-primary">{turno}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-semibold text-sm px-3 py-1">{count}</Badge>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>) : <div className="text-center text-muted-foreground text-sm py-4">
                      Nenhum dado disponível
                    </div>}
                </CardContent>
              </Card>

              {/* Por Liderança */}
              <Card className="glass-card card-hover">
                <CardHeader>
                  <CardTitle className="text-lg">Estrutura de Liderança</CardTitle>
                  <CardDescription>Hierarquia organizacional</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? <div className="space-y-2">
                      {[1, 2, 3].map(i => <div key={i} className="flex justify-between items-center">
                          <div className="w-28 h-4 bg-muted animate-pulse rounded" />
                          <div className="w-8 h-6 bg-muted animate-pulse rounded-full" />
                        </div>)}
                    </div> : Object.entries(indicators.porLideranca).length > 0 ? Object.entries(indicators.porLideranca).map(([lideranca, count]) => <div 
                        key={lideranca}
                        onClick={() => handleIndicatorClick('lideranca', lideranca)}
                        className="flex justify-between items-center p-3 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer group"
                      >
                        <span className="text-base font-medium truncate group-hover:text-primary">{lideranca}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-semibold text-sm px-3 py-1">{count}</Badge>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>) : <div className="text-center text-muted-foreground text-sm py-4">
                      Nenhum dado disponível
                    </div>}
                </CardContent>
              </Card>

              {/* Por Cargo */}
              <Card className="glass-card card-hover">
                <CardHeader>
                  <CardTitle className="text-lg">Distribuição por Cargo</CardTitle>
                  <CardDescription>Funções e responsabilidades</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? <div className="space-y-2">
                      {[1, 2, 3].map(i => <div key={i} className="flex justify-between items-center">
                          <div className="w-32 h-4 bg-muted animate-pulse rounded" />
                          <div className="w-8 h-6 bg-muted animate-pulse rounded-full" />
                        </div>)}
                    </div> : Object.entries(indicators.porCargo).length > 0 ? Object.entries(indicators.porCargo).map(([cargo, count]) => <div 
                        key={cargo}
                        onClick={() => handleIndicatorClick('cargo', cargo)}
                        className="flex justify-between items-center p-3 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer group"
                      >
                        <span className="text-base font-medium truncate group-hover:text-primary">{cargo}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-semibold text-sm px-3 py-1">{count}</Badge>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>) : <div className="text-center text-muted-foreground text-sm py-4">
                      Nenhum dado disponível
                    </div>}
                </CardContent>
              </Card>
          </div>
        </div>
      </div>

      {/* Dialog para mostrar colaboradores */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {dialogTitle}
            </DialogTitle>
            <DialogDescription>
              Clique em um colaborador para ver seus detalhes
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-2">
              {dialogColaboradores.map((colab) => (
                <div
                  key={colab.id}
                  onClick={() => handleColaboradorClick(colab.id)}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-primary/10 hover:border-primary/30 transition-colors cursor-pointer group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground group-hover:text-primary truncate">
                      {colab.colaborador}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Mat: {colab.matricula} • {colab.cargo || 'Sem cargo'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <Badge 
                      variant={colab.status?.toLowerCase() === 'ativo' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {colab.status}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                </div>
              ))}
              {dialogColaboradores.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum colaborador encontrado
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

    </div>;
};
export default Index;