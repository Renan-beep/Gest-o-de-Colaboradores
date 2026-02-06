import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { TrendingUp, ArrowRightLeft, Users, Shield, Activity } from "lucide-react";
import type { HeadcountColaborador } from "@/types/headcount";

interface DashboardBIProps {
  colaboradores: HeadcountColaborador[];
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(210, 70%, 50%)", "hsl(40, 80%, 50%)", "hsl(150, 60%, 40%)", "hsl(280, 50%, 50%)"];

export function DashboardBI({ colaboradores }: DashboardBIProps) {
  const totalAtivos = colaboradores.filter(c => c.status?.toLowerCase() === "ativo").length;
  const totalDemitidos = colaboradores.filter(c => c.status?.toLowerCase() === "demitido").length;
  const totalAfastados = colaboradores.filter(c => !["ativo", "demitido"].includes(c.status?.toLowerCase() || "")).length;
  const totalAumento = colaboradores.filter(c => c.movimentacao_tipo === "aumento_quadro").length;
  const totalSubstituicao = colaboradores.filter(c => c.movimentacao_tipo === "substituicao").length;
  const crescimentoLiquido = totalAumento - totalDemitidos;

  const pctAumento = totalAumento + totalSubstituicao > 0 ? ((totalAumento / (totalAumento + totalSubstituicao)) * 100).toFixed(1) : "0";
  const pctSubst = totalAumento + totalSubstituicao > 0 ? ((totalSubstituicao / (totalAumento + totalSubstituicao)) * 100).toFixed(1) : "0";

  // Headcount por setor
  const porSetor = useMemo(() => {
    const map = new Map<string, { ativos: number; aumento: number; substituicao: number }>();
    colaboradores.forEach(c => {
      const setor = c.setor || "Sem Setor";
      if (!map.has(setor)) map.set(setor, { ativos: 0, aumento: 0, substituicao: 0 });
      const s = map.get(setor)!;
      if (c.status?.toLowerCase() === "ativo") s.ativos++;
      if (c.movimentacao_tipo === "aumento_quadro") s.aumento++;
      if (c.movimentacao_tipo === "substituicao") s.substituicao++;
    });
    return Array.from(map.entries()).map(([setor, v]) => ({ setor, ...v })).sort((a, b) => b.ativos - a.ativos);
  }, [colaboradores]);

  // Matriz de estabilidade
  const matrizEstabilidade = useMemo(() => {
    return porSetor.map(s => {
      const totalMov = s.aumento + s.substituicao;
      const taxaSubstituicao = s.ativos > 0 ? (s.substituicao / s.ativos * 100) : 0;
      return {
        setor: s.setor,
        ativos: s.ativos,
        substituicoes: s.substituicao,
        aumentos: s.aumento,
        taxaSubstituicao: taxaSubstituicao.toFixed(1),
        estabilidade: taxaSubstituicao <= 5 ? "Alta" : taxaSubstituicao <= 15 ? "Média" : "Baixa",
      };
    }).sort((a, b) => Number(b.taxaSubstituicao) - Number(a.taxaSubstituicao));
  }, [porSetor]);

  // Movimentação pie
  const movPieData = [
    { name: "Aumento de Quadro", value: totalAumento },
    { name: "Substituição", value: totalSubstituicao },
    { name: "Sem Movimentação", value: colaboradores.length - totalAumento - totalSubstituicao },
  ].filter(d => d.value > 0);

  // Score de saúde
  const scoreData = useMemo(() => {
    const taxaSubstGlobal = totalAtivos > 0 ? totalSubstituicao / totalAtivos : 0;
    const taxaCrescimento = totalAtivos > 0 ? totalAumento / totalAtivos : 0;
    const setoresEstaveis = matrizEstabilidade.filter(s => s.estabilidade === "Alta").length;
    const totalSetores = matrizEstabilidade.length;
    const pctEstaveis = totalSetores > 0 ? setoresEstaveis / totalSetores : 0;

    // Score: 100 - penalizações
    let score = 100;
    score -= Math.min(taxaSubstGlobal * 200, 40); // alta substituição penaliza até 40pts
    score -= Math.max(0, 10 - taxaCrescimento * 100) * 0.5; // sem crescimento penaliza levemente
    score -= (1 - pctEstaveis) * 30; // instabilidade por área
    score = Math.max(0, Math.min(100, Math.round(score)));

    return { score, taxaSubstGlobal, taxaCrescimento, pctEstaveis };
  }, [totalAtivos, totalSubstituicao, totalAumento, matrizEstabilidade]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Saudável";
    if (score >= 60) return "Atenção";
    return "Crítico";
  };

  const getEstabilidadeColor = (est: string) => {
    if (est === "Alta") return "bg-green-100 text-green-800";
    if (est === "Média") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-6">
      {/* Cards executivos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{colaboradores.length}</div><div className="text-xs text-muted-foreground">Total Base</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{totalAtivos}</div><div className="text-xs text-muted-foreground">Ativos</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className={`text-2xl font-bold ${crescimentoLiquido >= 0 ? "text-green-600" : "text-red-600"}`}>{crescimentoLiquido >= 0 ? "+" : ""}{crescimentoLiquido}</div><div className="text-xs text-muted-foreground">Crescimento Líq.</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{totalAumento}</div><div className="text-xs text-muted-foreground">Aumento ({pctAumento}%)</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-orange-600">{totalSubstituicao}</div><div className="text-xs text-muted-foreground">Substituição ({pctSubst}%)</div></CardContent></Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${getScoreColor(scoreData.score)}`}>{scoreData.score}</div>
            <div className="text-xs text-muted-foreground">Score Saúde</div>
            <Badge className={`mt-1 text-[10px] ${getScoreColor(scoreData.score) === "text-green-600" ? "bg-green-100 text-green-800" : getScoreColor(scoreData.score) === "text-yellow-600" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
              {getScoreLabel(scoreData.score)}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Headcount por setor */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" />Headcount por Setor</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={porSetor} key={`setor-${porSetor.length}`}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="setor" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="ativos" fill="hsl(150, 60%, 40%)" name="Ativos" />
                <Bar dataKey="aumento" fill="hsl(210, 70%, 50%)" name="Aumento" />
                <Bar dataKey="substituicao" fill="hsl(30, 80%, 50%)" name="Substituição" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de movimentações */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ArrowRightLeft className="w-4 h-4" />Distribuição de Movimentações</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart key={`pie-${movPieData.length}`}>
                <Pie data={movPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                  {movPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Matriz de estabilidade */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" />Matriz de Estabilidade por Área</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">Setor</th>
                  <th className="text-right p-3">Ativos</th>
                  <th className="text-right p-3">Substituições</th>
                  <th className="text-right p-3">Aumentos</th>
                  <th className="text-right p-3">Taxa Subst. (%)</th>
                  <th className="text-center p-3">Estabilidade</th>
                </tr>
              </thead>
              <tbody>
                {matrizEstabilidade.map((s, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-3 font-medium">{s.setor}</td>
                    <td className="p-3 text-right">{s.ativos}</td>
                    <td className="p-3 text-right">{s.substituicoes}</td>
                    <td className="p-3 text-right">{s.aumentos}</td>
                    <td className="p-3 text-right">{s.taxaSubstituicao}%</td>
                    <td className="p-3 text-center"><Badge className={getEstabilidadeColor(s.estabilidade)}>{s.estabilidade}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Score de Saúde detalhado */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4" />Score de Saúde do Headcount</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className={`text-4xl font-bold ${getScoreColor(scoreData.score)}`}>{scoreData.score}</div>
              <div className="text-sm text-muted-foreground mt-1">Score Geral</div>
              <Badge className={`mt-2 ${getScoreColor(scoreData.score) === "text-green-600" ? "bg-green-100 text-green-800" : getScoreColor(scoreData.score) === "text-yellow-600" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                {getScoreLabel(scoreData.score)}
              </Badge>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="text-2xl font-bold">{(scoreData.taxaCrescimento * 100).toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground mt-1">Taxa Crescimento</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="text-2xl font-bold">{(scoreData.taxaSubstGlobal * 100).toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground mt-1">Taxa Substituição</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="text-2xl font-bold">{(scoreData.pctEstaveis * 100).toFixed(0)}%</div>
              <div className="text-sm text-muted-foreground mt-1">Áreas Estáveis</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
