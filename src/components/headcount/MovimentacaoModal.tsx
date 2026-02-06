import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HeadcountColaborador {
  id: string;
  matricula: string;
  colaborador: string;
  cargo: string | null;
  setor: string | null;
  status: string;
}

interface Motivo {
  id: string;
  descricao: string;
}

interface MovimentacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colaborador: HeadcountColaborador | null;
  todosColaboradores: HeadcountColaborador[];
  onSuccess: () => void;
}

export function MovimentacaoModal({ open, onOpenChange, colaborador, todosColaboradores, onSuccess }: MovimentacaoModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [motivos, setMotivos] = useState<Motivo[]>([]);
  const [form, setForm] = useState({
    tipo_movimentacao: "" as "aumento_quadro" | "substituicao" | "",
    motivo_id: "",
    motivo_complementar: "",
    data_efetiva: new Date().toISOString().split("T")[0],
    tipo_substituicao: "" as "direta" | "indireta" | "parcial" | "",
    colaborador_substituido_id: "",
  });
  const [novoMotivo, setNovoMotivo] = useState("");
  const [mostrarNovoMotivo, setMostrarNovoMotivo] = useState(false);

  useEffect(() => {
    if (open) {
      fetchMotivos();
      setForm({
        tipo_movimentacao: "",
        motivo_id: "",
        motivo_complementar: "",
        data_efetiva: new Date().toISOString().split("T")[0],
        tipo_substituicao: "",
        colaborador_substituido_id: "",
      });
      setNovoMotivo("");
      setMostrarNovoMotivo(false);
    }
  }, [open]);

  const fetchMotivos = async () => {
    const { data } = await supabase
      .from("headcount_motivos")
      .select("id, descricao")
      .eq("ativo", true)
      .order("descricao");
    if (data) setMotivos(data);
  };

  const criarNovoMotivo = async () => {
    if (!novoMotivo.trim()) return;
    const { data, error } = await supabase
      .from("headcount_motivos")
      .insert({ descricao: novoMotivo.trim() })
      .select("id, descricao")
      .single();
    if (error) {
      toast({ title: "Erro", description: "Motivo já existe ou erro ao criar", variant: "destructive" });
      return;
    }
    if (data) {
      setMotivos(prev => [...prev, data].sort((a, b) => a.descricao.localeCompare(b.descricao)));
      setForm(prev => ({ ...prev, motivo_id: data.id }));
      setNovoMotivo("");
      setMostrarNovoMotivo(false);
    }
  };

  const handleSubmit = async () => {
    if (!colaborador || !form.tipo_movimentacao || !form.data_efetiva) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    if (form.tipo_movimentacao === "substituicao" && !form.tipo_substituicao) {
      toast({ title: "Erro", description: "Selecione o tipo de substituição", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Desativar movimentação anterior se existir
      await supabase
        .from("headcount_movimentacoes")
        .update({ ativo: false })
        .eq("headcount_colaborador_id", colaborador.id)
        .eq("ativo", true);

      const { error } = await supabase.from("headcount_movimentacoes").insert({
        headcount_colaborador_id: colaborador.id,
        tipo_movimentacao: form.tipo_movimentacao,
        motivo_id: form.motivo_id || null,
        motivo_complementar: form.motivo_complementar || null,
        data_efetiva: form.data_efetiva,
        tipo_substituicao: form.tipo_movimentacao === "substituicao" ? form.tipo_substituicao : null,
        colaborador_substituido_id: form.colaborador_substituido_id || null,
      });

      if (error) throw error;

      toast({ title: "Sucesso", description: "Movimentação registrada com sucesso" });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Movimentação</DialogTitle>
          {colaborador && (
            <p className="text-sm text-muted-foreground">
              {colaborador.matricula} - {colaborador.colaborador}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo de movimentação */}
          <div className="space-y-2">
            <Label>Tipo de Movimentação *</Label>
            <Select
              value={form.tipo_movimentacao}
              onValueChange={(v) => setForm(prev => ({ ...prev, tipo_movimentacao: v as any }))}
            >
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aumento_quadro">Aumento de Quadro</SelectItem>
                <SelectItem value="substituicao">Substituição</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.tipo_movimentacao && (
            <>
              {/* Data efetiva */}
              <div className="space-y-2">
                <Label>Data Efetiva *</Label>
                <Input
                  type="date"
                  value={form.data_efetiva}
                  onChange={(e) => setForm(prev => ({ ...prev, data_efetiva: e.target.value }))}
                />
              </div>

              {/* Motivo */}
              <div className="space-y-2">
                <Label>Motivo</Label>
                {!mostrarNovoMotivo ? (
                  <div className="space-y-2">
                    <Select
                      value={form.motivo_id}
                      onValueChange={(v) => setForm(prev => ({ ...prev, motivo_id: v }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione um motivo" /></SelectTrigger>
                      <SelectContent>
                        {motivos.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.descricao}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => setMostrarNovoMotivo(true)}>
                      + Criar novo motivo
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Novo motivo..."
                      value={novoMotivo}
                      onChange={(e) => setNovoMotivo(e.target.value)}
                    />
                    <Button size="sm" onClick={criarNovoMotivo}>Salvar</Button>
                    <Button variant="ghost" size="sm" onClick={() => setMostrarNovoMotivo(false)}>Cancelar</Button>
                  </div>
                )}
              </div>

              {/* Campo complementar */}
              <div className="space-y-2">
                <Label>Observação complementar</Label>
                <Textarea
                  placeholder="Detalhes adicionais..."
                  value={form.motivo_complementar}
                  onChange={(e) => setForm(prev => ({ ...prev, motivo_complementar: e.target.value }))}
                  rows={2}
                />
              </div>

              {/* Tipo de substituição */}
              {form.tipo_movimentacao === "substituicao" && (
                <>
                  <div className="space-y-2">
                    <Label>Tipo de Substituição *</Label>
                    <Select
                      value={form.tipo_substituicao}
                      onValueChange={(v) => setForm(prev => ({ ...prev, tipo_substituicao: v as any }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direta">Direta (1:1)</SelectItem>
                        <SelectItem value="indireta">Indireta</SelectItem>
                        <SelectItem value="parcial">Parcial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Colaborador substituído */}
                  <div className="space-y-2">
                    <Label>Colaborador Substituído</Label>
                    <Select
                      value={form.colaborador_substituido_id}
                      onValueChange={(v) => setForm(prev => ({ ...prev, colaborador_substituido_id: v }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                      <SelectContent>
                        {todosColaboradores
                          .filter(c => c.id !== colaborador?.id)
                          .map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.matricula} - {c.colaborador}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading || !form.tipo_movimentacao}>
            {loading ? "Salvando..." : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
