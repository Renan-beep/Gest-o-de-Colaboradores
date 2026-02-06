
-- Tabela simples de vagas para headcount
CREATE TABLE public.headcount_vagas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.headcount_vagas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ver vagas headcount" ON public.headcount_vagas FOR SELECT USING (true);
CREATE POLICY "Gerência pode criar vagas headcount" ON public.headcount_vagas FOR INSERT WITH CHECK (is_gerencia() OR is_admin());
CREATE POLICY "Gerência pode atualizar vagas headcount" ON public.headcount_vagas FOR UPDATE USING (is_gerencia() OR is_admin());
CREATE POLICY "Gerência pode excluir vagas headcount" ON public.headcount_vagas FOR DELETE USING (is_gerencia() OR is_admin());

-- Adicionar coluna vaga_id na tabela de colaboradores headcount
ALTER TABLE public.headcount_colaboradores 
  ADD COLUMN vaga_id UUID REFERENCES public.headcount_vagas(id) ON DELETE SET NULL;

-- Trigger para updated_at
CREATE TRIGGER update_headcount_vagas_updated_at
  BEFORE UPDATE ON public.headcount_vagas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
