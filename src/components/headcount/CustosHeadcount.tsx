import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Save, Plus, Trash2 } from "lucide-react";
import type { HeadcountColaborador } from "@/types/headcount";

interface CustosHeadcountProps {
  colaboradores: HeadcountColaborador[];
}

interface CustoCargo {
  id?: string;
  cargo: string;
  custo_mensal: number;
  isNew?: boolean;
}

export function CustosHeadcount({ colaboradores }: CustosHeadcountProps) {
  const { toast } = useToast();
  const [custos, setCustos] = useState<CustoCargo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCustos(); }, []);

  const fetchCustos = async () => {
    setLoading(true);
    const { data } = await supabase.from("headcount_custos_cargo").select("*").order("cargo");
    setCustos((data || []).map(d => ({ ...d, custo_mensal: Number(d.custo_mensal) })));
    setLoading(false);
  };

  const custosMap = useMemo(() => {
    const map = new Map<string, number>();
    custos.forEach(c => map.set(c.cargo.toLowerCase(), c.custo_mensal));
    return map;
  }, [custos]);

  // Orçamento realizado
  const orcamentoRealizado = useMemo(() => {
    const ativos = colaboradores.filter(c => c.status?.toLowerCase() === "ativo");
    let total = 0;
    const porSetor = new Map<string, { qtd: number; custo: number }>();

    ativos.forEach(c => {
      const custo = custosMap.get((c.cargo || "").toLowerCase()) || 0;
      total += custo;
      const setor = c.setor || "Sem Setor";
      if (!porSetor.has(setor)) porSetor.set(setor, { qtd: 0, custo: 0 });
      const s = porSetor.get(setor)!;
      s.qtd++;
      s.custo += custo;
    });

    return { total, porSetor: Array.from(porSetor.entries()).map(([setor, v]) => ({ setor, ...v })).sort((a, b) => b.custo - a.custo) };
  }, [colaboradores, custosMap]);

  // Custo do crescimento (aumento de quadro)
  const custoAumento = useMemo(() => {
    return colaboradores
      .filter(c => c.movimentacao_tipo === "aumento_quadro")
      .reduce((sum, c) => sum + (custosMap.get((c.cargo || "").toLowerCase()) || 0), 0);
  }, [colaboradores, custosMap]);

  // Custo do turnover (substituições)
  const custoTurnover = useMemo(() => {
    return colaboradores
      .filter(c => c.movimentacao_tipo === "substituicao")
      .reduce((sum, c) => sum + (custosMap.get((c.cargo || "").toLowerCase()) || 0), 0);
  }, [colaboradores, custosMap]);

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const addCargo = () => {
    setCustos(prev => [...prev, { cargo: "", custo_mensal: 0, isNew: true }]);
  };

  const removeCargo = async (idx: number) => {
    const row = custos[idx];
    if (row.id) await supabase.from("headcount_custos_cargo").delete().eq("id", row.id);
    setCustos(prev => prev.filter((_, i) => i !== idx));
  };

  const updateCargo = (idx: number, field: "cargo" | "custo_mensal", val: string | number) => {
    setCustos(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  };

  const salvar = async () => {
    try {
      for (const row of custos) {
        if (!row.cargo.trim()) continue;
        if (row.id && !row.isNew) {
          await supabase.from("headcount_custos_cargo").update({ cargo: row.cargo, custo_mensal: row.custo_mensal }).eq("id", row.id);
        } else {
          await supabase.from("headcount_custos_cargo").upsert({ cargo: row.cargo, custo_mensal: row.custo_mensal }, { onConflict: "cargo" });
        }
      }
      toast({ title: "Salvo", description: "Custos atualizados." });
      fetchCustos();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  // Auto-popular cargos sem custo
  const cargosBase = useMemo(() => {
    return [...new Set(colaboradores.map(c => c.cargo).filter(Boolean))] as string[];
  }, [colaboradores]);

  const autoPopular = () => {
    const existentes = new Set(custos.map(c => c.cargo.toLowerCase()));
    const novos: CustoCargo[] = cargosBase.filter(c => !existentes.has(c.toLowerCase())).map(cargo => ({ cargo, custo_mensal: 0, isNew: true }));
    if (novos.length > 0) {
      setCustos(prev => [...prev, ...novos]);
      toast({ title: `${novos.length} cargos adicionados`, description: "Preencha os valores e salve." });
    } else {
      toast({ title: "Nenhum cargo novo", description: "Todos os cargos já estão cadastrados." });
    }
  };

  return (
    <div className="space-y-6">
      {/* Painel orçamentário */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xl font-bold">{formatCurrency(orcamentoRealizado.total)}</div>
            <div className="text-xs text-muted-foreground">Custo Mensal Realizado</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xl font-bold text-blue-600">{formatCurrency(custoAumento)}</div>
            <div className="text-xs text-muted-foreground">Custo Crescimento</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xl font-bold text-orange-600">{formatCurrency(custoTurnover)}</div>
            <div className="text-xs text-muted-foreground">Custo Turnover</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xl font-bold">{formatCurrency(orcamentoRealizado.total * 12)}</div>
            <div className="text-xs text-muted-foreground">Estimativa Anual</div>
          </CardContent>
        </Card>
      </div>

      {/* Custo por setor */}
      <Card>
        <CardHeader><CardTitle className="text-base">Custo por Setor</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Setor</TableHead>
                <TableHead className="text-right">Colaboradores</TableHead>
                <TableHead className="text-right">Custo Mensal</TableHead>
                <TableHead className="text-right">Custo Anual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orcamentoRealizado.porSetor.map((s, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{s.setor}</TableCell>
                  <TableCell className="text-right">{s.qtd}</TableCell>
                  <TableCell className="text-right">{formatCurrency(s.custo)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(s.custo * 12)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cadastro de custos por cargo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4" />Custo Médio por Cargo</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={autoPopular}>Auto-popular Cargos</Button>
              <Button variant="outline" size="sm" onClick={addCargo}><Plus className="w-4 h-4 mr-1" />Cargo</Button>
              <Button size="sm" onClick={salvar}><Save className="w-4 h-4 mr-1" />Salvar</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cargo</TableHead>
                <TableHead className="text-right">Custo Mensal (R$)</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {custos.map((c, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Input value={c.cargo} onChange={e => updateCargo(i, "cargo", e.target.value)} className="h-8" placeholder="Nome do cargo" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input type="number" value={c.custo_mensal} onChange={e => updateCargo(i, "custo_mensal", Number(e.target.value))} className="h-8 w-32 text-right" step="0.01" />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => removeCargo(i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {custos.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Nenhum custo cadastrado. Clique em "Auto-popular Cargos" para começar.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
