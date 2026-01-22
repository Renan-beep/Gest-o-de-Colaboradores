-- Criar tabela para armazenar regras de configuração de campos do cadastro
CREATE TABLE public.configuracao_campos_cadastro (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campo_pai TEXT NOT NULL,
  valor_pai TEXT NOT NULL,
  campo_filho TEXT NOT NULL,
  valores_permitidos TEXT[] NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  criado_por UUID REFERENCES auth.users(id),
  UNIQUE(campo_pai, valor_pai, campo_filho)
);

-- Habilitar RLS
ALTER TABLE public.configuracao_campos_cadastro ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura - todos autenticados podem ver
CREATE POLICY "Autenticados podem ver configurações"
ON public.configuracao_campos_cadastro
FOR SELECT
USING (true);

-- Políticas de inserção - apenas admin e gerência
CREATE POLICY "Admin e gerência podem criar configurações"
ON public.configuracao_campos_cadastro
FOR INSERT
WITH CHECK (is_admin() OR is_gerencia());

-- Políticas de atualização - apenas admin e gerência
CREATE POLICY "Admin e gerência podem atualizar configurações"
ON public.configuracao_campos_cadastro
FOR UPDATE
USING (is_admin() OR is_gerencia());

-- Políticas de exclusão - apenas admin e gerência
CREATE POLICY "Admin e gerência podem excluir configurações"
ON public.configuracao_campos_cadastro
FOR DELETE
USING (is_admin() OR is_gerencia());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_configuracao_campos_updated_at
BEFORE UPDATE ON public.configuracao_campos_cadastro
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();