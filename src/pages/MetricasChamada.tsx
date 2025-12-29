import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { TrendingUp, Calendar, Users, CheckCircle, XCircle, Coffee, Heart, Home, Clock, Activity, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from "recharts";
import { AdvancedMetricsCard } from "@/components/stats/AdvancedMetricsCard";
import { MonthDayFilter } from "@/components/stats/MonthDayFilter";
import { StatCard } from "@/components/stats/StatCard";
import HistoricoPendencias from "@/components/dashboard/HistoricoPendencias";
interface LiderancaPendencia {
  lideranca: string;
  colaboradores: number;
  diasPendentes: number;
  ultimaData: string;
}
interface MetricasSemana {
  semana: string;
  totalColaboradores: number;
  presentes: number;
  faltas: number;
  folgas: number;
  atestados: number;
  ferias: number;
  taxaPresenca: number;
}
interface MetricasMes {
  mes: string;
  totalColaboradores: number;
  presentes: number;
  faltas: number;
  folgas: number;
  atestados: number;
  ferias: number;
  taxaPresenca: number;
}
interface MetricasDia {
  data: string;
  presentes: number;
  faltas: number;
  folgas: number;
  atestados: number;
  ferias: number;
  taxaPresenca: number;
}
export default function MetricasChamada() {
  const {
    toast
  } = useToast();
  const [metricas, setMetricas] = useState<MetricasSemana[]>([]);
  const [metricasMensais, setMetricasMensais] = useState<MetricasMes[]>([]);
  const [metricasDiarias, setMetricasDiarias] = useState<MetricasDia[]>([]);
  const [liderancasPendencias, setLiderancasPendencias] = useState<LiderancaPendencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<"semanal" | "mensal" | "diario">("mensal");

  // Inicializar com o mês atual
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth()}`;
  };
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // Buscar dados na montagem inicial
  useEffect(() => {
    fetchMetricas();
    fetchLiderancasPendencias();
  }, []);

  // Buscar dados quando filtros mudam
  useEffect(() => {
    if (selectedMonth || selectedDays.length > 0) {
      fetchMetricas();
      fetchLiderancasPendencias();
    }
  }, [selectedMonth, selectedDays, viewType]);
  const fetchMetricas = async () => {
    setLoading(true);
    try {
      // Determinar as datas para filtrar baseado na seleção
      let dateFilter: any = supabase.from('chamadas').select('data, status');
      if (selectedDays.length > 0) {
        // Filtrar por dias específicos
        dateFilter = dateFilter.in('data', selectedDays);
      } else if (selectedMonth) {
        // Filtrar por mês inteiro
        const [year, month] = selectedMonth.split('-').map(Number);
        const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0];
        const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0];
        dateFilter = dateFilter.gte('data', startOfMonth).lte('data', endOfMonth);
      } else {
        // Se nenhum filtro aplicado, não buscar nada
        setMetricas([]);
        setMetricasMensais([]);
        setMetricasDiarias([]);
        setLoading(false);
        return;
      }
      const {
        data: chamadas,
        error
      } = await dateFilter;
      if (error) throw error;

      // Buscar total de colaboradores ativos
      const {
        data: colaboradores,
        error: colaboradoresError
      } = await supabase.from('colaboradores').select('id').eq('status', 'Ativo');
      if (colaboradoresError) throw colaboradoresError;
      const totalColaboradores = colaboradores?.length || 0;
      if (viewType === "diario") {
        // Agrupar chamadas por dia
        const metricasPorDia: {
          [key: string]: MetricasDia;
        } = {};
        chamadas?.forEach(chamada => {
          const dataKey = chamada.data;
          if (!metricasPorDia[dataKey]) {
            metricasPorDia[dataKey] = {
              data: new Date(dataKey).toLocaleDateString('pt-BR'),
              presentes: 0,
              faltas: 0,
              folgas: 0,
              atestados: 0,
              ferias: 0,
              taxaPresenca: 0
            };
          }
          const metrica = metricasPorDia[dataKey];
          switch (chamada.status) {
            case 'presente':
              metrica.presentes++;
              break;
            case 'falta':
              metrica.faltas++;
              break;
            case 'folga':
              metrica.folgas++;
              break;
            case 'atestado':
              metrica.atestados++;
              break;
            case 'ferias':
              metrica.ferias++;
              break;
          }
        });
        Object.values(metricasPorDia).forEach(metrica => {
          const total = metrica.presentes + metrica.faltas + metrica.folgas + metrica.atestados + metrica.ferias;
          metrica.taxaPresenca = total > 0 ? metrica.presentes / total * 100 : 0;
        });
        const metricasArray = Object.values(metricasPorDia).sort((a, b) => new Date(b.data.split('/').reverse().join('-')).getTime() - new Date(a.data.split('/').reverse().join('-')).getTime());
        setMetricasDiarias(metricasArray);
      } else if (viewType === "mensal") {
        // Agrupar chamadas por mês
        const metricasPorMes: {
          [key: string]: MetricasMes;
        } = {};
        chamadas?.forEach(chamada => {
          const data = new Date(chamada.data);
          const mesKey = `${data.getFullYear()}-${data.getMonth()}`;
          const mesFormatado = `${data.toLocaleDateString('pt-BR', {
            month: 'long'
          })} ${data.getFullYear()}`;
          if (!metricasPorMes[mesKey]) {
            metricasPorMes[mesKey] = {
              mes: mesFormatado,
              totalColaboradores,
              presentes: 0,
              faltas: 0,
              folgas: 0,
              atestados: 0,
              ferias: 0,
              taxaPresenca: 0
            };
          }
          const metrica = metricasPorMes[mesKey];
          switch (chamada.status) {
            case 'presente':
              metrica.presentes++;
              break;
            case 'falta':
              metrica.faltas++;
              break;
            case 'folga':
              metrica.folgas++;
              break;
            case 'atestado':
              metrica.atestados++;
              break;
            case 'ferias':
              metrica.ferias++;
              break;
          }
        });
        Object.values(metricasPorMes).forEach(metrica => {
          const total = metrica.presentes + metrica.faltas + metrica.folgas + metrica.atestados + metrica.ferias;
          metrica.taxaPresenca = total > 0 ? metrica.presentes / total * 100 : 0;
        });
        const metricasArray = Object.values(metricasPorMes).sort((a, b) => new Date(b.mes).getTime() - new Date(a.mes).getTime());
        setMetricasMensais(metricasArray);
      } else {
        // Agrupar chamadas por semana (código original)
        const metricasPorSemana: {
          [key: string]: MetricasSemana;
        } = {};
        chamadas?.forEach(chamada => {
          const data = new Date(chamada.data);
          const inicioSemana = new Date(data);
          inicioSemana.setDate(data.getDate() - data.getDay());
          const semanaKey = inicioSemana.toISOString().split('T')[0];
          const semanaFormatada = `${inicioSemana.getDate()}/${inicioSemana.getMonth() + 1} - ${new Date(inicioSemana.getTime() + 6 * 24 * 60 * 60 * 1000).getDate()}/${new Date(inicioSemana.getTime() + 6 * 24 * 60 * 60 * 1000).getMonth() + 1}`;
          if (!metricasPorSemana[semanaKey]) {
            metricasPorSemana[semanaKey] = {
              semana: semanaFormatada,
              totalColaboradores,
              presentes: 0,
              faltas: 0,
              folgas: 0,
              atestados: 0,
              ferias: 0,
              taxaPresenca: 0
            };
          }
          const metrica = metricasPorSemana[semanaKey];
          switch (chamada.status) {
            case 'presente':
              metrica.presentes++;
              break;
            case 'falta':
              metrica.faltas++;
              break;
            case 'folga':
              metrica.folgas++;
              break;
            case 'atestado':
              metrica.atestados++;
              break;
            case 'ferias':
              metrica.ferias++;
              break;
          }
        });
        Object.values(metricasPorSemana).forEach(metrica => {
          const totalChamadas = metrica.presentes + metrica.faltas + metrica.folgas + metrica.atestados + metrica.ferias;
          metrica.taxaPresenca = totalChamadas > 0 ? metrica.presentes / totalChamadas * 100 : 0;
        });
        const metricasArray = Object.values(metricasPorSemana).sort((a, b) => new Date(b.semana.split(' - ')[0]).getTime() - new Date(a.semana.split(' - ')[0]).getTime());
        setMetricas(metricasArray);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar métricas: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const fetchLiderancasPendencias = async () => {
    try {
      if (!selectedMonth && selectedDays.length === 0) return;

      // Buscar colaboradores ativos com suas lideranças
      const {
        data: colaboradores,
        error: colaboradoresError
      } = await supabase.from('colaboradores').select('id, colaborador, lideranca').eq('status', 'Ativo');
      if (colaboradoresError) throw colaboradoresError;

      // Buscar chamadas no período
      let chamadasQuery = supabase.from('chamadas').select('colaborador_id, data, status');
      if (selectedDays.length > 0) {
        chamadasQuery = chamadasQuery.in('data', selectedDays);
      } else if (selectedMonth) {
        const [year, month] = selectedMonth.split('-').map(Number);
        const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0];
        const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0];
        chamadasQuery = chamadasQuery.gte('data', startOfMonth).lte('data', endOfMonth);
      }
      const {
        data: chamadas,
        error: chamadasError
      } = await chamadasQuery;
      if (chamadasError) throw chamadasError;

      // Mapear colaboradores por ID
      const colaboradoresMap = new Map(colaboradores?.map(col => [col.id, col]) || []);

      // Agrupar colaboradores por liderança
      const liderancaGroups = colaboradores?.reduce((acc, col) => {
        const lideranca = col.lideranca || 'Sem Liderança';
        if (!acc[lideranca]) acc[lideranca] = [];
        acc[lideranca].push(col);
        return acc;
      }, {} as {
        [key: string]: typeof colaboradores;
      }) || {};

      // Criar conjunto de colaboradores que fizeram chamada
      const colaboradoresComChamada = new Set(chamadas?.map(c => c.colaborador_id) || []);

      // Calcular pendências por liderança
      const pendencias: LiderancaPendencia[] = Object.entries(liderancaGroups).map(([lideranca, cols]) => {
        const colaboradoresSemChamada = cols.filter(col => !colaboradoresComChamada.has(col.id));

        // Calcular dias únicos com pendências (últimos 7 dias úteis)
        const today = new Date();
        const diasUteis = [];
        for (let i = 0; i < 7; i++) {
          const dia = new Date(today);
          dia.setDate(today.getDate() - i);
          const dayOfWeek = dia.getDay();
          // Pular finais de semana (sábado = 6, domingo = 0)
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            diasUteis.push(dia.toISOString().split('T')[0]);
          }
        }
        const diasComPendencia = diasUteis.filter(dia => {
          return cols.some(col => !chamadas?.some(ch => ch.colaborador_id === col.id && ch.data === dia));
        });
        return {
          lideranca,
          colaboradores: colaboradoresSemChamada.length,
          diasPendentes: diasComPendencia.length,
          ultimaData: diasUteis[0] || ''
        };
      }).filter(p => p.colaboradores > 0 || p.diasPendentes > 0).sort((a, b) => b.colaboradores - a.colaboradores);
      setLiderancasPendencias(pendencias);
    } catch (error: any) {
      console.error('Erro ao buscar pendências de liderança:', error);
    }
  };

  // Calcular métricas avançadas
  const getAdvancedMetrics = () => {
    const data = viewType === "semanal" ? metricas : viewType === "mensal" ? metricasMensais : metricasDiarias;
    if (data.length === 0) {
      return {
        monthlyTrend: {
          current: 0,
          previous: 0,
          label: "Sem dados"
        },
        weeklyAverage: 0,
        bestMonth: {
          month: "N/A",
          rate: 0
        },
        worstMonth: {
          month: "N/A",
          rate: 0
        },
        consistency: 0,
        targetAchievement: 0
      };
    }

    // Tendência (atual vs anterior)
    const current = data[0]?.taxaPresenca || 0;
    const previous = data[1]?.taxaPresenca || 0;
    const monthlyTrend = {
      current,
      previous,
      label: current > previous ? "Tendência de alta" : current < previous ? "Tendência de baixa" : "Estável"
    };

    // Média semanal
    const weeklyAverage = data.reduce((acc, item) => acc + item.taxaPresenca, 0) / data.length;

    // Melhor e pior período
    const sortedByRate = [...data].sort((a, b) => b.taxaPresenca - a.taxaPresenca);
    const bestMonth = {
      month: viewType === "semanal" ? (sortedByRate[0] as MetricasSemana).semana : viewType === "mensal" ? (sortedByRate[0] as MetricasMes).mes : (sortedByRate[0] as MetricasDia).data,
      rate: sortedByRate[0]?.taxaPresenca || 0
    };
    const worstMonth = {
      month: viewType === "semanal" ? (sortedByRate[sortedByRate.length - 1] as MetricasSemana).semana : viewType === "mensal" ? (sortedByRate[sortedByRate.length - 1] as MetricasMes).mes : (sortedByRate[sortedByRate.length - 1] as MetricasDia).data,
      rate: sortedByRate[sortedByRate.length - 1]?.taxaPresenca || 0
    };

    // Consistência (baseada no desvio padrão)
    const rates = data.map(d => d.taxaPresenca);
    const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
    const variance = rates.reduce((acc, rate) => acc + Math.pow(rate - mean, 2), 0) / rates.length;
    const stdDev = Math.sqrt(variance);
    const consistency = Math.max(0, 100 - stdDev); // Inverter para que menor desvio = maior consistência

    // Atingimento de meta (85%)
    const periodsAboveTarget = data.filter(d => d.taxaPresenca >= 85).length;
    const targetAchievement = periodsAboveTarget / data.length * 100;
    return {
      monthlyTrend,
      weeklyAverage,
      bestMonth,
      worstMonth,
      consistency,
      targetAchievement
    };
  };
  const getMetricasGerais = () => {
    let totalPresentes = 0;
    let totalChamadas = 0;
    let totalColaboradores = 0;
    if (viewType === "semanal" && metricas.length > 0) {
      totalPresentes = metricas.reduce((acc, m) => acc + m.presentes, 0);
      totalChamadas = metricas.reduce((acc, m) => acc + m.presentes + m.faltas + m.folgas + m.atestados + m.ferias, 0);
      totalColaboradores = metricas[0]?.totalColaboradores || 0;
    } else if (viewType === "mensal" && metricasMensais.length > 0) {
      totalPresentes = metricasMensais.reduce((acc, m) => acc + m.presentes, 0);
      totalChamadas = metricasMensais.reduce((acc, m) => acc + m.presentes + m.faltas + m.folgas + m.atestados + m.ferias, 0);
      totalColaboradores = metricasMensais[0]?.totalColaboradores || 0;
    } else if (viewType === "diario" && metricasDiarias.length > 0) {
      totalPresentes = metricasDiarias.reduce((acc, m) => acc + m.presentes, 0);
      totalChamadas = metricasDiarias.reduce((acc, m) => acc + m.presentes + m.faltas + m.folgas + m.atestados + m.ferias, 0);
    }
    const mediaPresenca = totalChamadas > 0 ? totalPresentes / totalChamadas * 100 : 0;
    return {
      mediaPresenca,
      totalChamadas,
      totalColaboradores
    };
  };
  const getChartData = () => {
    if (viewType === "semanal") {
      return metricas.map(m => ({
        periodo: m.semana,
        presentes: m.presentes,
        faltas: m.faltas,
        folgas: m.folgas,
        atestados: m.atestados,
        ferias: m.ferias,
        taxaPresenca: m.taxaPresenca
      }));
    } else if (viewType === "mensal") {
      return metricasMensais.map(m => ({
        periodo: m.mes,
        presentes: m.presentes,
        faltas: m.faltas,
        folgas: m.folgas,
        atestados: m.atestados,
        ferias: m.ferias,
        taxaPresenca: m.taxaPresenca
      }));
    } else {
      return metricasDiarias.map(m => ({
        periodo: m.data,
        presentes: m.presentes,
        faltas: m.faltas,
        folgas: m.folgas,
        atestados: m.atestados,
        ferias: m.ferias,
        taxaPresenca: m.taxaPresenca
      }));
    }
  };
  const getPieChartData = () => {
    const data = getChartData();
    const totals = data.reduce((acc, item) => ({
      presentes: acc.presentes + item.presentes,
      faltas: acc.faltas + item.faltas,
      folgas: acc.folgas + item.folgas,
      atestados: acc.atestados + item.atestados,
      ferias: acc.ferias + item.ferias
    }), {
      presentes: 0,
      faltas: 0,
      folgas: 0,
      atestados: 0,
      ferias: 0
    });
    return [{
      name: 'Presentes',
      value: totals.presentes,
      color: '#22c55e'
    }, {
      name: 'Faltas',
      value: totals.faltas,
      color: '#ef4444'
    }, {
      name: 'Folgas',
      value: totals.folgas,
      color: '#f97316'
    }, {
      name: 'Atestados',
      value: totals.atestados,
      color: '#ec4899'
    }, {
      name: 'Férias',
      value: totals.ferias,
      color: '#8b5cf6'
    }].filter(item => item.value > 0);
  };
  const metricasGerais = getMetricasGerais();
  const chartData = getChartData();
  const pieChartData = getPieChartData();
  const advancedMetrics = getAdvancedMetrics();
  const handleFilterChange = (month?: string, days?: string[]) => {
    setSelectedMonth(month);
    setSelectedDays(days || []);
  };
  return <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Métricas da Chamada</h1>
          
        </div>
      </div>

      {/* Indicadores Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Colaboradores Ativos" value={loading ? '...' : metricasGerais.totalColaboradores} icon={Users} variant="primary" loading={loading} />

        <StatCard title="Folgas" value={loading ? '...' : (() => {
        if (viewType === "semanal") return metricas.reduce((acc, m) => acc + m.folgas, 0);
        if (viewType === "mensal") return metricasMensais.reduce((acc, m) => acc + m.folgas, 0);
        return metricasDiarias.reduce((acc, m) => acc + m.folgas, 0);
      })()} icon={Home} variant="warning" loading={loading} />

        <StatCard title="Taxa de Presença" value={loading ? '...' : `${metricasGerais.mediaPresenca.toFixed(1)}%`} icon={Target} variant={metricasGerais.mediaPresenca >= 85 ? "success" : "error"} loading={loading} subtitle={metricasGerais.mediaPresenca >= 85 ? "Meta atingida" : "Abaixo da meta"} />
      </div>

      {/* Filtro por Mês e Dia */}
      <div className="max-w-2xl">
        <MonthDayFilter selectedMonth={selectedMonth} selectedDays={selectedDays} onSelectionChange={handleFilterChange} />
      </div>

      {/* Métricas Avançadas */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Indicadores Estatísticos Avançados</h2>
            <p className="text-sm text-muted-foreground">Análise detalhada de performance e tendências</p>
          </div>
        </div>
        
        <AdvancedMetricsCard monthlyTrend={advancedMetrics.monthlyTrend} weeklyAverage={advancedMetrics.weeklyAverage} bestMonth={advancedMetrics.bestMonth} worstMonth={advancedMetrics.worstMonth} consistency={advancedMetrics.consistency} targetAchievement={advancedMetrics.targetAchievement} loading={loading} />
      </div>

      {/* Gráficos de Análise */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras - Evolução */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Evolução da Presença</CardTitle>
            <CardDescription>
              Gráfico de barras mostrando a evolução {viewType === "diario" ? "diária" : viewType === "semanal" ? "semanal" : "mensal"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <div className="h-[300px] flex items-center justify-center">
                <div className="text-muted-foreground">Carregando gráfico...</div>
              </div> : chartData.length > 0 ? <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" tick={{
                fontSize: 12
              }} angle={-45} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="presentes" fill="#22c55e" name="Presentes" />
                  <Bar dataKey="faltas" fill="#ef4444" name="Faltas" />
                  <Bar dataKey="folgas" fill="#f97316" name="Folgas" />
                </BarChart>
              </ResponsiveContainer> : <div className="h-[300px] flex items-center justify-center">
                <div className="text-muted-foreground">Nenhum dado disponível</div>
              </div>}
          </CardContent>
        </Card>

        {/* Gráfico de Pizza - Distribuição */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Distribuição de Status</CardTitle>
            <CardDescription>
              Distribuição geral dos status de presença
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <div className="h-[300px] flex items-center justify-center">
                <div className="text-muted-foreground">Carregando gráfico...</div>
              </div> : pieChartData.length > 0 ? <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieChartData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({
                name,
                percent
              }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer> : <div className="h-[300px] flex items-center justify-center">
                <div className="text-muted-foreground">Nenhum dado disponível</div>
              </div>}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Linha - Taxa de Presença */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Taxa de Presença ao Longo do Tempo</CardTitle>
          <CardDescription>
            Evolução da taxa de presença com meta de 85%
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <div className="h-[300px] flex items-center justify-center">
              <div className="text-muted-foreground">Carregando gráfico...</div>
            </div> : chartData.length > 0 ? <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodo" tick={{
              fontSize: 12
            }} angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip formatter={value => [`${Number(value).toFixed(1)}%`, 'Taxa de Presença']} />
                <Line type="monotone" dataKey="taxaPresenca" stroke="#2563eb" strokeWidth={2} name="Taxa de Presença" />
                <Line type="monotone" dataKey={() => 85} stroke="#ef4444" strokeDasharray="5 5" name="Meta (85%)" />
              </LineChart>
            </ResponsiveContainer> : <div className="h-[300px] flex items-center justify-center">
              <div className="text-muted-foreground">Nenhum dado disponível</div>
            </div>}
        </CardContent>
      </Card>

      {/* Tabela de Histórico */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>
            Histórico {viewType === "diario" ? "Diário" : viewType === "semanal" ? "Semanal" : "Mensal"}
          </CardTitle>
          <CardDescription>
            Tabela detalhada com os dados {viewType === "diario" ? "diários" : viewType === "semanal" ? "semanais" : "mensais"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8">
              <div className="text-muted-foreground">Carregando histórico...</div>
            </div> : (() => {
          const data = viewType === "semanal" ? metricas : viewType === "mensal" ? metricasMensais : metricasDiarias;
          return data.length > 0 ? <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{viewType === "diario" ? "Data" : viewType === "semanal" ? "Semana" : "Mês"}</TableHead>
                      <TableHead className="text-right">Presentes</TableHead>
                      <TableHead className="text-right">Faltas</TableHead>
                      <TableHead className="text-right">Folgas</TableHead>
                      <TableHead className="text-right">Atestados</TableHead>
                      <TableHead className="text-right">Férias</TableHead>
                      <TableHead className="text-right">Taxa Presença</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item, index) => <TableRow key={index}>
                        <TableCell className="font-medium">
                          {viewType === "semanal" ? (item as MetricasSemana).semana : viewType === "mensal" ? (item as MetricasMes).mes : (item as MetricasDia).data}
                        </TableCell>
                        <TableCell className="text-right">{item.presentes}</TableCell>
                        <TableCell className="text-right">{item.faltas}</TableCell>
                        <TableCell className="text-right">{item.folgas}</TableCell>
                        <TableCell className="text-right">{item.atestados}</TableCell>
                        <TableCell className="text-right">{item.ferias}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={item.taxaPresenca >= 85 ? "default" : "destructive"}>
                            {item.taxaPresenca.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </div> : <div className="text-center py-8">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-muted-foreground">Nenhum dado encontrado para o período selecionado</div>
              </div>;
        })()}
        </CardContent>
      </Card>

      {/* Lideranças com Pendências */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Lideranças com Pendências de Chamada
          </CardTitle>
          <CardDescription>
            Lideranças que possuem colaboradores sem chamada registrada
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <div className="h-[200px] flex items-center justify-center">
              <div className="text-muted-foreground">Carregando pendências...</div>
            </div> : liderancasPendencias.length > 0 ? <div className="space-y-4">
              {liderancasPendencias.map((lideranca, index) => <div key={lideranca.lideranca} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold", index < 3 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700")}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{lideranca.lideranca}</div>
                      <div className="text-sm text-muted-foreground">
                        {lideranca.colaboradores} colaborador{lideranca.colaboradores > 1 ? 'es' : ''} sem chamada
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={lideranca.diasPendentes > 3 ? "destructive" : "secondary"}>
                      {lideranca.diasPendentes} dia{lideranca.diasPendentes > 1 ? 's' : ''} pendente{lideranca.diasPendentes > 1 ? 's' : ''}
                    </Badge>
                    {lideranca.ultimaData && <div className="text-xs text-muted-foreground mt-1">
                        Última data: {new Date(lideranca.ultimaData).toLocaleDateString('pt-BR')}
                      </div>}
                  </div>
                </div>)}
            </div> : <div className="h-[100px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <div>Nenhuma pendência de chamada encontrada!</div>
              </div>
            </div>}
        </CardContent>
      </Card>

      {/* Histórico de Pendências Mensais */}
      <HistoricoPendencias />
    </div>;
}