import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Calendar, User } from "lucide-react";

interface LinhaTempoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colaboradorId: string | null;
  colaboradorNome: string;
}

interface MovimentacaoHistorico {
  id: string;
  tipo_movimentacao: string;
  data_efetiva: string;
  tipo_substituicao: string | null;
  motivo_complementar: string | null;
  ativo: boolean;
  created_at: string;
  motivo_descricao: string | null;
  substituido_nome: string | null;
  substituido_matricula: string | null;
}

export function LinhaTempoModal({ open, onOpenChange, colaboradorId, colaboradorNome }: LinhaTempoModalProps) {
  const [historico, setHistorico] = useState<MovimentacaoHistorico[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && colaboradorId) {
      fetchHistorico();
    }
  }, [open, colaboradorId]);

  const fetchHistorico = async () => {
    if (!colaboradorId) return;
    setLoading(true);

    // Buscar movimentações onde este colaborador é o principal OU o substituído
    const { data: movs } = await supabase
      .from("headcount_movimentacoes")
      .select("*")
      .or(`headcount_colaborador_id.eq.${colaboradorId},colaborador_substituido_id.eq.${colaboradorId}`)
      .order("data_efetiva", { ascending: true });

    if (!movs) { setLoading(false); return; }

    // Enriquecer com nomes
    const enriched: MovimentacaoHistorico[] = [];
    for (const mov of movs) {
      let motivo_descricao = null;
      if (mov.motivo_id) {
        const { data: m } = await supabase.from("headcount_motivos").select("descricao").eq("id", mov.motivo_id).single();
        motivo_descricao = m?.descricao || null;
      }
      let substituido_nome = null;
      let substituido_matricula = null;
      if (mov.colaborador_substituido_id) {
        const { data: s } = await supabase.from("headcount_colaboradores").select("colaborador, matricula").eq("id", mov.colaborador_substituido_id).single();
        substituido_nome = s?.colaborador || null;
        substituido_matricula = s?.matricula || null;
      }
      enriched.push({
        ...mov,
        motivo_descricao,
        substituido_nome,
        substituido_matricula,
      });
    }

    setHistorico(enriched);
    setLoading(false);
  };

  const formatarData = (data: string) => {
    if (!data) return "-";
    const [y, m, d] = data.split("T")[0].split("-");
    return `${d}/${m}/${y}`;
  };

  const getTipoLabel = (tipo: string) => {
    return tipo === "aumento_quadro" ? "Aumento de Quadro" : "Substituição";
  };

  const getSubstituicaoLabel = (tipo: string | null) => {
    if (!tipo) return null;
    const map: Record<string, string> = { direta: "Direta (1:1)", indireta: "Indireta", parcial: "Parcial" };
    return map[tipo] || tipo;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Linha do Tempo da Vaga</DialogTitle>
          <p className="text-sm text-muted-foreground">{colaboradorNome}</p>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : historico.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Nenhuma movimentação registrada</div>
        ) : (
          <div className="relative pl-6 space-y-6">
            {/* Linha vertical */}
            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />

            {historico.map((mov, idx) => (
              <div key={mov.id} className="relative">
                {/* Dot */}
                <div className={`absolute -left-4 top-1 w-3 h-3 rounded-full border-2 ${mov.ativo ? 'bg-primary border-primary' : 'bg-muted border-muted-foreground'}`} />

                <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={mov.tipo_movimentacao === "aumento_quadro" ? "default" : "secondary"}>
                      {getTipoLabel(mov.tipo_movimentacao)}
                    </Badge>
                    {mov.tipo_substituicao && (
                      <Badge variant="outline">{getSubstituicaoLabel(mov.tipo_substituicao)}</Badge>
                    )}
                    {mov.ativo && <Badge className="bg-green-100 text-green-800">Ativa</Badge>}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {formatarData(mov.data_efetiva)}
                  </div>

                  {mov.motivo_descricao && (
                    <div className="text-sm">
                      <span className="font-medium">Motivo:</span> {mov.motivo_descricao}
                    </div>
                  )}

                  {mov.motivo_complementar && (
                    <div className="text-sm text-muted-foreground">{mov.motivo_complementar}</div>
                  )}

                  {mov.substituido_nome && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-3 h-3" />
                      <span>Substituiu: {mov.substituido_matricula} - {mov.substituido_nome}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
