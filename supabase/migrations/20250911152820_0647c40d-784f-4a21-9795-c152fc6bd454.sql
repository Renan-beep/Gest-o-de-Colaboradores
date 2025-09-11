-- Criar tabela para histórico de chamadas pendentes por mês
CREATE TABLE public.historico_chamadas_pendentes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mes_ano TEXT NOT NULL, -- formato: "2024-01", "2024-02", etc
  total_pendentes INTEGER NOT NULL DEFAULT 0,
  data_fechamento DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.historico_chamadas_pendentes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Public can view historico chamadas pendentes" 
ON public.historico_chamadas_pendentes 
FOR SELECT 
USING (true);

CREATE POLICY "Public can insert historico chamadas pendentes" 
ON public.historico_chamadas_pendentes 
FOR INSERT 
WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_historico_chamadas_mes_ano ON public.historico_chamadas_pendentes(mes_ano);
CREATE INDEX idx_historico_chamadas_data ON public.historico_chamadas_pendentes(data_fechamento);

-- Função para processar fechamento mensal de chamadas
CREATE OR REPLACE FUNCTION public.processar_fechamento_mensal()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mes_atual TEXT;
  total_pendentes INTEGER;
  data_corte DATE;
BEGIN
  -- Determinar o mês atual no formato YYYY-MM
  mes_atual := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  
  -- Data de corte (último dia do mês anterior)
  data_corte := DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day';
  
  -- Contar chamadas pendentes do mês que está fechando
  SELECT COUNT(*) INTO total_pendentes
  FROM public.chamadas 
  WHERE status != 'presente' 
  AND data <= data_corte
  AND TO_CHAR(data, 'YYYY-MM') = TO_CHAR(data_corte, 'YYYY-MM');
  
  -- Se houver chamadas pendentes, salvar no histórico
  IF total_pendentes > 0 THEN
    -- Inserir ou atualizar histórico do mês
    INSERT INTO public.historico_chamadas_pendentes (mes_ano, total_pendentes, data_fechamento)
    VALUES (TO_CHAR(data_corte, 'YYYY-MM'), total_pendentes, data_corte)
    ON CONFLICT (mes_ano) 
    DO UPDATE SET 
      total_pendentes = EXCLUDED.total_pendentes,
      data_fechamento = EXCLUDED.data_fechamento,
      updated_at = now();
    
    -- Limpar chamadas pendentes do mês fechado
    DELETE FROM public.chamadas 
    WHERE status != 'presente' 
    AND data <= data_corte
    AND TO_CHAR(data, 'YYYY-MM') = TO_CHAR(data_corte, 'YYYY-MM');
  END IF;
  
  RETURN total_pendentes;
END;
$$;

-- Função para verificar se deve executar limpeza automática
CREATE OR REPLACE FUNCTION public.verificar_limpeza_mensal()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ultimo_dia_mes DATE;
  hoje DATE;
BEGIN
  hoje := CURRENT_DATE;
  ultimo_dia_mes := (DATE_TRUNC('month', hoje) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- Retorna true se hoje é o último dia do mês
  RETURN hoje = ultimo_dia_mes;
END;
$$;

-- Adicionar constraint para garantir unicidade do mes_ano
ALTER TABLE public.historico_chamadas_pendentes 
ADD CONSTRAINT unique_mes_ano UNIQUE (mes_ano);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_historico_chamadas_updated_at
  BEFORE UPDATE ON public.historico_chamadas_pendentes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();