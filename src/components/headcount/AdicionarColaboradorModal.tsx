import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdicionarColaboradorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AdicionarColaboradorModal({ open, onOpenChange, onSuccess }: AdicionarColaboradorModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    matricula: "",
    colaborador: "",
    cargo: "",
    setor: "",
    subsetor: "",
    turno: "",
    lideranca: "",
    sexo: "",
    admissao: "",
    status: "Demitido",
  });

  const handleSubmit = async () => {
    if (!form.matricula.trim() || !form.colaborador.trim()) {
      toast({ title: "Erro", description: "Matrícula e nome são obrigatórios", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("headcount_colaboradores").insert({
        matricula: form.matricula.trim(),
        colaborador: form.colaborador.trim(),
        cargo: form.cargo || null,
        setor: form.setor || null,
        subsetor: form.subsetor || null,
        turno: form.turno || null,
        lideranca: form.lideranca || null,
        sexo: form.sexo || null,
        admissao: form.admissao || null,
        status: form.status,
        adicionado_manualmente: true,
      });

      if (error) throw error;

      toast({ title: "Sucesso", description: "Colaborador adicionado ao histórico de headcount" });
      onSuccess();
      onOpenChange(false);
      setForm({ matricula: "", colaborador: "", cargo: "", setor: "", subsetor: "", turno: "", lideranca: "", sexo: "", admissao: "", status: "Demitido" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Colaborador Histórico</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Adicione um colaborador que não existe mais no banco atual, apenas para fins de controle histórico.
          </p>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Matrícula *</Label>
              <Input value={form.matricula} onChange={e => setForm(p => ({ ...p, matricula: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Demitido">Demitido</SelectItem>
                  <SelectItem value="Afastado">Afastado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Nome *</Label>
            <Input value={form.colaborador} onChange={e => setForm(p => ({ ...p, colaborador: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Cargo</Label>
              <Input value={form.cargo} onChange={e => setForm(p => ({ ...p, cargo: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Setor</Label>
              <Input value={form.setor} onChange={e => setForm(p => ({ ...p, setor: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Liderança</Label>
              <Input value={form.lideranca} onChange={e => setForm(p => ({ ...p, lideranca: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Turno</Label>
              <Input value={form.turno} onChange={e => setForm(p => ({ ...p, turno: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Sexo</Label>
              <Select value={form.sexo} onValueChange={v => setForm(p => ({ ...p, sexo: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Admissão</Label>
              <Input type="date" value={form.admissao} onChange={e => setForm(p => ({ ...p, admissao: e.target.value }))} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Salvando..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
