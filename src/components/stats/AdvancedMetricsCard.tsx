import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Target, BarChart3, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendData {
  current: number;
  previous: number;
  label: string;
}

interface AdvancedMetricsProps {
  monthlyTrend: TrendData;
  weeklyAverage: number;
  bestMonth: { month: string; rate: number };
  worstMonth: { month: string; rate: number };
  consistency: number; // Desvio padrão
  targetAchievement: number; // % dos períodos que atingiram a meta
  loading?: boolean;
}

export function AdvancedMetricsCard({
  monthlyTrend,
  weeklyAverage,
  bestMonth,
  worstMonth,
  consistency,
  targetAchievement,
  loading = false
}: AdvancedMetricsProps) {
  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return "text-success";
    if (current < previous) return "text-error";
    return "text-muted-foreground";
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return TrendingUp;
    if (current < previous) return TrendingDown;
    return Activity;
  };

  const getConsistencyLabel = (score: number) => {
    if (score >= 90) return { label: "Excelente", color: "bg-success/10 text-success" };
    if (score >= 75) return { label: "Boa", color: "bg-primary/10 text-primary" };
    if (score >= 60) return { label: "Regular", color: "bg-warning/10 text-warning" };
    return { label: "Baixa", color: "bg-error/10 text-error" };
  };

  const TrendIcon = getTrendIcon(monthlyTrend.current, monthlyTrend.previous);
  const trendPercentage = monthlyTrend.previous > 0 
    ? ((monthlyTrend.current - monthlyTrend.previous) / monthlyTrend.previous) * 100 
    : 0;
  
  const consistencyData = getConsistencyLabel(consistency);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Tendência Mensal */}
      <Card className="glass-card hover:shadow-medium transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendIcon className="w-4 h-4" />
            Tendência Mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {monthlyTrend.current.toFixed(1)}%
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={trendPercentage > 0 ? "default" : trendPercentage < 0 ? "destructive" : "secondary"}
                className="text-xs"
              >
                {trendPercentage > 0 ? "+" : ""}{trendPercentage.toFixed(1)}%
              </Badge>
              <span className="text-xs text-muted-foreground">vs mês anterior</span>
            </div>
            <p className="text-xs text-muted-foreground">{monthlyTrend.label}</p>
          </div>
        </CardContent>
      </Card>

      {/* Média Semanal */}
      <Card className="glass-card hover:shadow-medium transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Média Semanal
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {weeklyAverage.toFixed(1)}%
            </div>
            <Badge 
              variant={weeklyAverage >= 85 ? "default" : "secondary"}
              className="text-xs"
            >
              {weeklyAverage >= 85 ? "Acima da meta" : "Abaixo da meta"}
            </Badge>
            <p className="text-xs text-muted-foreground">Taxa de presença média por semana</p>
          </div>
        </CardContent>
      </Card>

      {/* Consistência */}
      <Card className="glass-card hover:shadow-medium transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Consistência
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {consistency.toFixed(1)}%
            </div>
            <Badge 
              className={cn("text-xs", consistencyData.color)}
              variant="outline"
            >
              {consistencyData.label}
            </Badge>
            <p className="text-xs text-muted-foreground">Estabilidade das taxas de presença</p>
          </div>
        </CardContent>
      </Card>

      {/* Melhor Desempenho */}
      <Card className="glass-card hover:shadow-medium transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" />
            Melhor Período
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="text-2xl font-bold text-success">
              {bestMonth.rate.toFixed(1)}%
            </div>
            <div className="text-xs font-medium">{bestMonth.month}</div>
            <p className="text-xs text-muted-foreground">Maior taxa de presença registrada</p>
          </div>
        </CardContent>
      </Card>

      {/* Pior Desempenho */}
      <Card className="glass-card hover:shadow-medium transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-error" />
            Período Crítico
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="text-2xl font-bold text-error">
              {worstMonth.rate.toFixed(1)}%
            </div>
            <div className="text-xs font-medium">{worstMonth.month}</div>
            <p className="text-xs text-muted-foreground">Menor taxa de presença registrada</p>
          </div>
        </CardContent>
      </Card>

      {/* Atingimento de Meta */}
      <Card className="glass-card hover:shadow-medium transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Target className="w-4 h-4" />
            Atingimento de Meta
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {targetAchievement.toFixed(0)}%
            </div>
            <Badge 
              variant={targetAchievement >= 70 ? "default" : "destructive"}
              className="text-xs"
            >
              {targetAchievement >= 70 ? "Bom desempenho" : "Necessita atenção"}
            </Badge>
            <p className="text-xs text-muted-foreground">% dos períodos com meta atingida (85%)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}