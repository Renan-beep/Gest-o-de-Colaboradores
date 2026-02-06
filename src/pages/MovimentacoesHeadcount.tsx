import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowRightLeft, UserCheck, TrendingUp, Table2, Map, BarChart3, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TabelaHeadcount } from "@/components/headcount/TabelaHeadcount";
import { MapaHeadcount } from "@/components/headcount/MapaHeadcount";
import { DashboardBI } from "@/components/headcount/DashboardBI";
import { CustosHeadcount } from "@/components/headcount/CustosHeadcount";
import type { HeadcountColaborador } from "@/types/headcount";

export default function MovimentacoesHeadcount() {
  const { toast } = useToast();
  const [colaboradores, setColaboradores] = useState<HeadcountColaborador[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchColaboradores(); }, []);

  const fetchColaboradores = async () => {
    setLoading(true);
    try {
      const { data: hcData, error } = await supabase
        .from("headcount_colaboradores")
        .select("*")
        .order("colaborador");
      if (error) throw error;

      const { data: movs } = await supabase
        .from("headcount_movimentacoes")
        .select("id, headcount_colaborador_id, tipo_movimentacao, data_efetiva")
        .eq("ativo", true);

      const movsRecord: Record<string, typeof movs extends (infer T)[] | null ? T : never> = {};
      (movs || []).forEach(m => { movsRecord[m.headcount_colaborador_id] = m; });

      const enriched: HeadcountColaborador[] = (hcData || []).map(c => ({
        ...c,
        movimentacao_tipo: movsRecord[c.id]?.tipo_movimentacao || null,
        movimentacao_data: movsRecord[c.id]?.data_efetiva || null,
        movimentacao_id: movsRecord[c.id]?.id || null,
      }));

      setColaboradores(enriched);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const totalAtivos = colaboradores.filter(c => c.status?.toLowerCase() === "ativo").length;
  const totalAumento = colaboradores.filter(c => c.movimentacao_tipo === "aumento_quadro").length;
  const totalSubstituicao = colaboradores.filter(c => c.movimentacao_tipo === "substituicao").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ArrowRightLeft className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Movimentações de Headcount</h1>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ArrowRightLeft className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Movimentações de Headcount</h1>
          <p className="text-muted-foreground">Governança, planejamento e inteligência de headcount</p>
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{colaboradores.length}</div><div className="text-sm text-muted-foreground">Total Base</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{totalAtivos}</div><div className="text-sm text-muted-foreground">Ativos</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{totalAumento}</div><div className="text-sm text-muted-foreground">Aumento de Quadro</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-orange-600">{totalSubstituicao}</div><div className="text-sm text-muted-foreground">Substituições</div></CardContent></Card>
      </div>

      {/* Abas */}
      <Tabs defaultValue="tabela" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="tabela" className="flex items-center gap-1"><Table2 className="w-4 h-4" />Tabela</TabsTrigger>
          <TabsTrigger value="mapa" className="flex items-center gap-1"><Map className="w-4 h-4" />Mapa</TabsTrigger>
          <TabsTrigger value="bi" className="flex items-center gap-1"><BarChart3 className="w-4 h-4" />BI</TabsTrigger>
          <TabsTrigger value="custos" className="flex items-center gap-1"><DollarSign className="w-4 h-4" />Custos</TabsTrigger>
        </TabsList>

        <TabsContent value="tabela">
          <TabelaHeadcount colaboradores={colaboradores} onRefresh={fetchColaboradores} />
        </TabsContent>

        <TabsContent value="mapa">
          <MapaHeadcount colaboradores={colaboradores} />
        </TabsContent>

        <TabsContent value="bi">
          <DashboardBI colaboradores={colaboradores} />
        </TabsContent>

        <TabsContent value="custos">
          <CustosHeadcount colaboradores={colaboradores} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
