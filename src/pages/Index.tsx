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
    turnoverRate: 0,
    masculino: 0,
    feminino: 0
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
    porHorarioCafe: {} as Record<string, number>,
    porSexo: {} as Record<string, number>
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
      const porSexo: Record<string, number> = {};
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

        // Por sexo (todos os colaboradores ativos e afastados)
        if (colaborador.sexo && colaborador.status?.toLowerCase() !== 'demitido') {
          porSexo[colaborador.sexo] = (porSexo[colaborador.sexo] || 0) + 1;
        }
      });

      // Calcular turnover do ano atual
      const anoAtual = new Date().getFullYear();
      const { data: demissoes, error: demissoesError } = await supabase
        .from('demissoes')
        .select('data_demissao')
        .gte('data_demissao', `${anoAtual}-01-01`)
        .lte('data_demissao', `${anoAtual}-12-31`);
      
      if (demissoesError) throw demissoesError;

      const admissoesAno = colaboradores?.filter(c => {
        if (!c.admissao) return false;
        const ano = new Date(c.admissao + 'T12:00:00').getFullYear();
        return ano === anoAtual;
      }).length || 0;
      
      const demissoesAno = demissoes?.length || 0;
      const mediaColaboradores = totalColaboradores > 0 ? totalColaboradores : 1;
      const turnoverRate = ((admissoesAno + demissoesAno) / 2 / mediaColaboradores) * 100;

      // Calcular estatísticas de gênero
      const masculino = porSexo['Masculino'] || 0;
      const feminino = porSexo['Feminino'] || 0;

      setStats({
        totalColaboradores,
        afastados,
        turnoverRate,
        masculino,
        feminino
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
        porHorarioCafe,
        porSexo
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
  return <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Modern Header with Gradient */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-hero rounded-2xl opacity-10"></div>
        
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
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
          title="Turnover Anual" 
          value={loading ? '...' : `${stats.turnoverRate.toFixed(1)}%`} 
          subtitle={`Taxa de rotatividade ${new Date().getFullYear()}`}
          icon={TrendingUp} 
          variant={stats.turnoverRate > 10 ? "error" : stats.turnoverRate > 5 ? "warning" : "success"} 
          loading={loading} 
          className="animate-slide-in" 
        />
      </div>

      {/* Indicador de Gênero */}
      <Card className="glass-card card-hover">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Distribuição por Gênero
          </CardTitle>
          <CardDescription>Quantitativo de colaboradores por sexo</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex gap-8 justify-center">
              <div className="w-32 h-24 bg-muted animate-pulse rounded-lg" />
              <div className="w-32 h-24 bg-muted animate-pulse rounded-lg" />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {/* Homens */}
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 md:p-4 text-center border border-blue-200 dark:border-blue-800">
                <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.masculino}</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Homens</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                  {(stats.masculino + stats.feminino) > 0 
                    ? `${((stats.masculino / (stats.masculino + stats.feminino)) * 100).toFixed(1)}%` 
                    : '0%'}
                </div>
              </div>
              
              {/* Mulheres */}
              <div className="bg-pink-50 dark:bg-pink-950/30 rounded-xl p-3 md:p-4 text-center border border-pink-200 dark:border-pink-800">
                <div className="text-2xl md:text-3xl font-bold text-pink-600 dark:text-pink-400">{stats.feminino}</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Mulheres</div>
                <div className="text-xs text-pink-600 dark:text-pink-400 font-medium mt-1">
                  {(stats.masculino + stats.feminino) > 0 
                    ? `${((stats.feminino / (stats.masculino + stats.feminino)) * 100).toFixed(1)}%` 
                    : '0%'}
                </div>
              </div>

              {/* Barra de proporção */}
              <div className="col-span-2 flex flex-col justify-center">
                <div className="text-xs text-muted-foreground mb-2">Proporção do total</div>
                <div className="h-4 rounded-full overflow-hidden bg-muted flex">
                  <div 
                    className="bg-blue-500 h-full transition-all duration-500"
                    style={{ width: (stats.masculino + stats.feminino) > 0 ? `${(stats.masculino / (stats.masculino + stats.feminino)) * 100}%` : '50%' }}
                  />
                  <div 
                    className="bg-pink-500 h-full transition-all duration-500"
                    style={{ width: (stats.masculino + stats.feminino) > 0 ? `${(stats.feminino / (stats.masculino + stats.feminino)) * 100}%` : '50%' }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-blue-600">Masculino</span>
                  <span className="text-pink-600">Feminino</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
              <span className="w-7 h-7 md:w-8 md:h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
              </span>
              Indicadores Detalhados
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
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