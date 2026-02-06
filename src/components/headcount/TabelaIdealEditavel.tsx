import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PlanejadoRow {
  id: string;
  cargo: string;
  setor: string;
  quantidade: number;
}

interface TabelaIdealEditavelProps {
  onTotalChange: (total: number) => void;
}

export function TabelaIdealEditavel({ onTotalChange }: TabelaIdealEditavelProps) {
  const { toast } = useToast();
  const [rows, setRows] = useState<PlanejadoRow[]>([]);
  const [novoCargo, setNovoCargo] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const fetchData = useCallback(async () => {
    const { data, error } = await supabase
      .from("headcount_planejado")
      .select("id, cargo, setor, quantidade")
      .order("cargo");
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    const parsed = (data || []) as PlanejadoRow[];
    setRows(parsed);
    onTotalChange(parsed.reduce((s, r) => s + r.quantidade, 0));
  }, [onTotalChange, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateQuantidade = async (id: string, quantidade: number) => {
    const { error } = await supabase
      .from("headcount_planejado")
      .update({ quantidade })
      .eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    fetchData();
  };

  const addRow = async () => {
    const cargo = novoCargo.trim();
    if (!cargo) return;
    const { error } = await supabase
      .from("headcount_planejado")
      .insert({ cargo, setor: "Geral", quantidade: 0 });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    setNovoCargo("");
    fetchData();
  };

  const deleteRow = async (id: string) => {
    await supabase.from("headcount_planejado").delete().eq("id", id);
    fetchData();
  };

  const handleBlur = (id: string) => {
    const val = parseInt(editValue, 10);
    if (!isNaN(val) && val >= 0) {
      updateQuantidade(id, val);
    }
    setEditingId(null);
  };

  const total = rows.reduce((s, r) => s + r.quantidade, 0);

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base">Meta Ideal (Editável)</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold min-w-[120px]">Cargo</TableHead>
                <TableHead className="text-center font-bold w-[100px]">Qtd. Ideal</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium whitespace-nowrap">{row.cargo}</TableCell>
                  <TableCell className="text-center">
                    {editingId === row.id ? (
                      <Input
                        type="number"
                        min={0}
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => handleBlur(row.id)}
                        onKeyDown={e => e.key === "Enter" && handleBlur(row.id)}
                        className="h-7 w-16 mx-auto text-center text-xs"
                        autoFocus
                      />
                    ) : (
                      <span
                        className="cursor-pointer hover:bg-muted px-2 py-1 rounded"
                        onClick={() => {
                          setEditingId(row.id);
                          setEditValue(String(row.quantidade));
                        }}
                      >
                        {row.quantidade}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => deleteRow(row.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {/* Total row */}
              <TableRow className="border-t-2">
                <TableCell className="font-bold">Total (Meta)</TableCell>
                <TableCell className="text-center font-bold bg-primary/10">{total}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
        {/* Add row */}
        <div className="flex items-center gap-2 p-3 border-t">
          <Input
            placeholder="Novo cargo..."
            value={novoCargo}
            onChange={e => setNovoCargo(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addRow()}
            className="h-8 text-xs"
          />
          <Button size="sm" variant="outline" className="h-8" onClick={addRow}>
            <Plus className="h-3 w-3 mr-1" /> Adicionar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
