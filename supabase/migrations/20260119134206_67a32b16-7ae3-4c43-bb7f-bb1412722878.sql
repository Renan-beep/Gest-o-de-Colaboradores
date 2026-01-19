-- Adicionar foreign key entre demissoes e colaboradores
ALTER TABLE public.demissoes
ADD CONSTRAINT fk_demissoes_colaborador
FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores(id);