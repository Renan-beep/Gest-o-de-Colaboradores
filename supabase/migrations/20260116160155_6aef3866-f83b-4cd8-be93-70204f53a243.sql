-- Adicionar coluna sexo na tabela colaboradores
ALTER TABLE public.colaboradores 
ADD COLUMN sexo text NULL;

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.colaboradores.sexo IS 'Sexo do colaborador: Masculino, Feminino ou Outro';