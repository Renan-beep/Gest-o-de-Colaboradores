-- Criar tabela para histórico de quantitativo diário
CREATE TABLE public.historico_quantitativo_diario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL,
  total_esperado INTEGER NOT NULL DEFAULT 0,
  por_lideranca JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para busca rápida por data
CREATE INDEX idx_historico_quantitativo_data ON public.historico_quantitativo_diario(data);

-- Constraint para garantir uma entrada por data
CREATE UNIQUE INDEX idx_historico_quantitativo_data_unique ON public.historico_quantitativo_diario(data);

-- Enable RLS
ALTER TABLE public.historico_quantitativo_diario ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Permitir leitura para todos autenticados"
  ON public.historico_quantitativo_diario
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção para autenticados"
  ON public.historico_quantitativo_diario
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização para autenticados"
  ON public.historico_quantitativo_diario
  FOR UPDATE
  USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_historico_quantitativo_updated_at
  BEFORE UPDATE ON public.historico_quantitativo_diario
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para registrar o quantitativo do dia atual
CREATE OR REPLACE FUNCTION public.registrar_quantitativo_diario()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  hoje DATE;
  total_ativos INTEGER;
  lideres JSONB;
BEGIN
  hoje := CURRENT_DATE;
  
  -- Contar colaboradores ativos hoje
  SELECT COUNT(*) INTO total_ativos
  FROM public.colaboradores
  WHERE status = 'Ativo';
  
  -- Agrupar por liderança
  SELECT jsonb_object_agg(lideranca, total)
  INTO lideres
  FROM (
    SELECT 
      COALESCE(lideranca, 'Sem Liderança') as lideranca,
      COUNT(*) as total
    FROM public.colaboradores
    WHERE status = 'Ativo'
    GROUP BY lideranca
  ) sub;
  
  -- Inserir ou atualizar
  INSERT INTO public.historico_quantitativo_diario (data, total_esperado, por_lideranca)
  VALUES (hoje, total_ativos, lideres)
  ON CONFLICT (data)
  DO UPDATE SET
    total_esperado = EXCLUDED.total_esperado,
    por_lideranca = EXCLUDED.por_lideranca,
    updated_at = now();
END;
$$;