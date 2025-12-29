-- Remover políticas restritivas existentes na tabela demissoes
DROP POLICY IF EXISTS "Public can view demissoes" ON public.demissoes;
DROP POLICY IF EXISTS "Public can insert demissoes" ON public.demissoes;
DROP POLICY IF EXISTS "Public can update demissoes" ON public.demissoes;
DROP POLICY IF EXISTS "Public can delete demissoes" ON public.demissoes;

-- Criar novas políticas PERMISSIVAS (padrão)
CREATE POLICY "Permitir visualização de demissões"
ON public.demissoes
FOR SELECT
USING (true);

CREATE POLICY "Permitir inserção de demissões"
ON public.demissoes
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir atualização de demissões"
ON public.demissoes
FOR UPDATE
USING (true);

CREATE POLICY "Permitir exclusão de demissões"
ON public.demissoes
FOR DELETE
USING (true);