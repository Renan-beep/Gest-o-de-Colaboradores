import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Map, Plus, Save, Trash2 } from "lucide-react";
import type { HeadcountColaborador } from "@/types/headcount";

interface MapaHeadcountProps {
  colaboradores: HeadcountColaborador[];
}

interface PlanejadoRow {
  id?: string;
  setor: string;
  subsetor: string;
  cargo: string;
  lideranca: string;
  turno: string;
  quantidade: number;
  mes_referencia: string;
  isNew?: boolean;
}

export function MapaHeadcount({ colaboradores }: MapaHeadcountProps) {
  const { toast } = useToast();
  const [planejado, setPlanejado] = useState<PlanejadoRow[]>([]);
  const [loadingPlanejado, setLoadingPlanejado] = useState(false);
  const [mesRef, setMesRef] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // Realizado: agrupar colaboradores ativos por setor/cargo
  const realizado = useMemo(() => {
    const ativos = colaboradores.filter(c => c.status?.toLowerCase() === "ativo");
    const grouped: Record<string, { setor: string; subsetor: string; cargo: string; lideranca: string; turno: string; quantidade: number }> = {};
    ativos.forEach(c => {
      const key = `${c.setor || "—"}|${c.subsetor || "—"}|${c.cargo || "—"}|${c.lideranca || "—"}|${c.turno || "—"}`;
      if (grouped[key]) {
        grouped[key].quantidade++;
      } else {
        grouped[key] = { setor: c.setor || "—", subsetor: c.subsetor || "—", cargo: c.cargo || "—", lideranca: c.lideranca || "—", turno: c.turno || "—", quantidade: 1 };
      }
    });
    return Object.values(grouped).sort((a, b) => a.setor.localeCompare(b.setor) || a.cargo.localeCompare(b.cargo));
  }, [colaboradores]);

  const totalRealizado = useMemo(() => realizado.reduce((s, r) => s + r.quantidade, 0), [realizado]);

  useEffect(() => { fetchPlanejado(); }, [mesRef]);

  const fetchPlanejado = async () => {
    setLoadingPlanejado(true);
    const { data } = await supabase
      .from("headcount_planejado")
      .select("*")
      .eq("mes_referencia", mesRef)
      .order("setor");
    if (data && data.length > 0) {
      setPlanejado(data.map(d => ({ ...d, subsetor: d.subsetor || "", lideranca: d.lideranca || "", turno: d.turno || "" })));
    } else {
      // Espelhar realizado
      setPlanejado(realizado.map(r => ({ ...r, mes_referencia: mesRef, isNew: true })));
    }
    setLoadingPlanejado(false);
  };

  const totalPlanejado = useMemo(() => planejado.reduce((s, r) => s + r.quantidade, 0), [planejado]);

  const updatePlanejadoQtd = (idx: number, val: number) => {
    setPlanejado(prev => prev.map((r, i) => i === idx ? { ...r, quantidade: val, isNew: r.isNew || !r.id } : r));
  };

  const addPlanejadoRow = () => {
    setPlanejado(prev => [...prev, { setor: "", subsetor: "", cargo: "", lideranca: "", turno: "", quantidade: 0, mes_referencia: mesRef, isNew: true }]);
  };

  const removePlanejadoRow = async (idx: number) => {
    const row = planejado[idx];
    if (row.id) {
      await supabase.from("headcount_planejado").delete().eq("id", row.id);
    }
    setPlanejado(prev => prev.filter((_, i) => i !== idx));
  };

  const salvarPlanejado = async () => {
    try {
      for (const row of planejado) {
        if (row.id && !row.isNew) {
          await supabase.from("headcount_planejado").update({ quantidade: row.quantidade, setor: row.setor, subsetor: row.subsetor || null, cargo: row.cargo, lideranca: row.lideranca || null, turno: row.turno || null }).eq("id", row.id);
        } else {
          const { setor, subsetor, cargo, lideranca, turno, quantidade, mes_referencia } = row;
          if (!setor || !cargo) continue;
          await supabase.from("headcount_planejado").insert({ setor, subsetor: subsetor || null, cargo, lideranca: lideranca || null, turno: turno || null, quantidade, mes_referencia });
        }
      }
      toast({ title: "Salvo", description: "Planejamento atualizado." });
      fetchPlanejado();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const updatePlanejadoField = (idx: number, field: keyof PlanejadoRow, val: string) => {
    setPlanejado(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="realizado">
        <TabsList>
          <TabsTrigger value="realizado">🔹 Realizado</TabsTrigger>
          <TabsTrigger value="planejado">🔹 Planejado</TabsTrigger>
        </TabsList>

        <TabsContent value="realizado">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Map className="w-5 h-5" />Mapa Realizado — {totalRealizado} colaboradores ativos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Setor</TableHead><TableHead>Subsetor</TableHead><TableHead>Cargo</TableHead>
                      <TableHead>Liderança</TableHead><TableHead>Turno</TableHead><TableHead className="text-right">Qtd</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {realizado.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{r.setor}</TableCell>
                        <TableCell>{r.subsetor}</TableCell>
                        <TableCell>{r.cargo}</TableCell>
                        <TableCell>{r.lideranca}</TableCell>
                        <TableCell>{r.turno}</TableCell>
                        <TableCell className="text-right font-bold">{r.quantidade}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planejado">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Map className="w-5 h-5" />Mapa Planejado — {totalPlanejado} posições</CardTitle>
                <div className="flex items-center gap-2">
                  <Label>Mês Ref:</Label>
                  <Input type="month" value={mesRef} onChange={e => setMesRef(e.target.value)} className="w-40" />
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Badge variant={totalPlanejado > totalRealizado ? "default" : totalPlanejado < totalRealizado ? "destructive" : "secondary"}>
                  Δ {totalPlanejado - totalRealizado} ({totalPlanejado > totalRealizado ? "+" : ""}{totalRealizado > 0 ? ((totalPlanejado - totalRealizado) / totalRealizado * 100).toFixed(1) : 0}%)
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Setor</TableHead><TableHead>Subsetor</TableHead><TableHead>Cargo</TableHead>
                      <TableHead>Liderança</TableHead><TableHead>Turno</TableHead><TableHead className="text-right">Qtd</TableHead><TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {planejado.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell><Input value={r.setor} onChange={e => updatePlanejadoField(i, "setor", e.target.value)} className="h-8 w-28" /></TableCell>
                        <TableCell><Input value={r.subsetor} onChange={e => updatePlanejadoField(i, "subsetor", e.target.value)} className="h-8 w-24" /></TableCell>
                        <TableCell><Input value={r.cargo} onChange={e => updatePlanejadoField(i, "cargo", e.target.value)} className="h-8 w-28" /></TableCell>
                        <TableCell><Input value={r.lideranca} onChange={e => updatePlanejadoField(i, "lideranca", e.target.value)} className="h-8 w-24" /></TableCell>
                        <TableCell><Input value={r.turno} onChange={e => updatePlanejadoField(i, "turno", e.target.value)} className="h-8 w-20" /></TableCell>
                        <TableCell className="text-right">
                          <Input type="number" value={r.quantidade} onChange={e => updatePlanejadoQtd(i, Number(e.target.value))} className="h-8 w-16 text-right" />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => removePlanejadoRow(i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex gap-2 p-4">
                <Button variant="outline" size="sm" onClick={addPlanejadoRow}><Plus className="w-4 h-4 mr-1" />Linha</Button>
                <Button size="sm" onClick={salvarPlanejado}><Save className="w-4 h-4 mr-1" />Salvar Planejamento</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
