-- Criar tabela de demissões
CREATE TABLE public.demissoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id UUID NOT NULL,
  data_demissao DATE NOT NULL,
  motivo TEXT,
  tipo_demissao TEXT NOT NULL CHECK (tipo_demissao IN ('pedido', 'justa_causa', 'sem_justa_causa', 'fim_contrato', 'aposentadoria')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX idx_demissoes_colaborador_id ON public.demissoes(colaborador_id);
CREATE INDEX idx_demissoes_data_demissao ON public.demissoes(data_demissao);
CREATE INDEX idx_demissoes_tipo ON public.demissoes(tipo_demissao);

-- Habilitar RLS
ALTER TABLE public.demissoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Public can view demissoes" 
ON public.demissoes 
FOR SELECT 
USING (true);

CREATE POLICY "Public can insert demissoes" 
ON public.demissoes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can update demissoes" 
ON public.demissoes 
FOR UPDATE 
USING (true);

CREATE POLICY "Public can delete demissoes" 
ON public.demissoes 
FOR DELETE 
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_demissoes_updated_at
BEFORE UPDATE ON public.demissoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();