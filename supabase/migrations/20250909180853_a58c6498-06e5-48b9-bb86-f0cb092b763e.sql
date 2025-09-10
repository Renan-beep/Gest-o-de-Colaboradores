-- Add foreign key constraint for colaborador_id
ALTER TABLE public.solicitacoes_movimentacao 
ADD CONSTRAINT fk_solicitacoes_colaborador 
FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores(id);