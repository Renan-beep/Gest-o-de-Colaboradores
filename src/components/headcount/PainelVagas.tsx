import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { HeadcountVaga } from "@/types/headcount";

interface PainelVagasProps {
  vagas: HeadcountVaga[];
  onRefresh: () => void;
}

export function PainelVagas({ vagas, onRefresh }: PainelVagasProps) {
  const { toast } = useToast();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);

  const criarVaga = async () => {
    if (!nome.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("headcount_vagas")
        .insert({ nome: nome.trim(), descricao: descricao.trim() || null });
      if (error) throw error;
      toast({ title: "Vaga criada com sucesso" });
      setNome("");
      setDescricao("");
      onRefresh();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const excluirVaga = async (id: string) => {
    try {
      const { error } = await supabase.from("headcount_vagas").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Vaga removida" });
      onRefresh();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const vagasAtivas = vagas.filter(v => v.ativa);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Tag className="w-4 h-4" />
          Vagas ({vagasAtivas.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Form criar vaga */}
        <div className="space-y-2">
          <Label className="text-xs">Nome da Vaga</Label>
          <Input
            placeholder="Ex: Operador A"
            value={nome}
            onChange={e => setNome(e.target.value)}
            className="h-8 text-sm"
          />
          <Label className="text-xs">Descrição (opcional)</Label>
          <Textarea
            placeholder="Detalhes..."
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            className="text-sm min-h-[50px]"
            rows={2}
          />
          <Button size="sm" onClick={criarVaga} disabled={!nome.trim() || loading} className="w-full">
            <Plus className="w-3 h-3 mr-1" />Criar Vaga
          </Button>
        </div>

        {/* Lista vagas */}
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {vagasAtivas.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">Nenhuma vaga criada</p>
          )}
          {vagasAtivas.map(v => (
            <div key={v.id} className="flex items-center justify-between gap-1 p-1.5 rounded border text-xs">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{v.nome}</div>
                {v.descricao && <div className="text-muted-foreground truncate">{v.descricao}</div>}
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => excluirVaga(v.id)}>
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
