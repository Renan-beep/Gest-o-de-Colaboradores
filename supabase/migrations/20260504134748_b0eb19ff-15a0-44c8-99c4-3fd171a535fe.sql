CREATE TABLE public.movimentacoes_colaboradores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id UUID NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  setor_anterior TEXT,
  setor_novo TEXT,
  turno_anterior TEXT,
  turno_novo TEXT,
  movido_por UUID,
  movido_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_movimentacoes_colab ON public.movimentacoes_colaboradores(colaborador_id);
CREATE INDEX idx_movimentacoes_data ON public.movimentacoes_colaboradores(movido_em DESC);

ALTER TABLE public.movimentacoes_colaboradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ver movimentações de colaboradores"
ON public.movimentacoes_colaboradores
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Gerência, Admin e Encarregado podem registrar movimentações"
ON public.movimentacoes_colaboradores
FOR INSERT
TO authenticated
WITH CHECK (public.is_gerencia() OR public.is_admin() OR public.is_encarregado());

ALTER TABLE public.colaboradores REPLICA IDENTITY FULL;