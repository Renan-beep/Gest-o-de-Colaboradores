
-- Tabela de motivos de movimentação (editável pelo usuário)
CREATE TABLE public.headcount_motivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.headcount_motivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ver motivos" ON public.headcount_motivos FOR SELECT USING (true);
CREATE POLICY "Gerência pode criar motivos" ON public.headcount_motivos FOR INSERT WITH CHECK (is_gerencia() OR is_admin());
CREATE POLICY "Gerência pode atualizar motivos" ON public.headcount_motivos FOR UPDATE USING (is_gerencia() OR is_admin());
CREATE POLICY "Gerência pode excluir motivos" ON public.headcount_motivos FOR DELETE USING (is_gerencia() OR is_admin());

-- Inserir motivos padrão
INSERT INTO public.headcount_motivos (descricao) VALUES
  ('Reposição por desligamento'),
  ('Expansão de operação'),
  ('Promoção interna'),
  ('Ajuste de dimensionamento');

-- Tabela histórica de colaboradores para headcount (cópia independente)
CREATE TABLE public.headcount_colaboradores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_origem_id UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  matricula TEXT NOT NULL,
  colaborador TEXT NOT NULL,
  cargo TEXT,
  setor TEXT,
  subsetor TEXT,
  turno TEXT,
  lideranca TEXT,
  sexo TEXT,
  admissao DATE,
  status TEXT NOT NULL DEFAULT 'Ativo',
  adicionado_manualmente BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.headcount_colaboradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ver headcount colaboradores" ON public.headcount_colaboradores FOR SELECT USING (true);
CREATE POLICY "Gerência pode criar headcount colaboradores" ON public.headcount_colaboradores FOR INSERT WITH CHECK (is_gerencia() OR is_admin() OR is_encarregado());
CREATE POLICY "Gerência pode atualizar headcount colaboradores" ON public.headcount_colaboradores FOR UPDATE USING (is_gerencia() OR is_admin());
CREATE POLICY "Gerência pode excluir headcount colaboradores" ON public.headcount_colaboradores FOR DELETE USING (is_gerencia() OR is_admin());

-- Índice para busca rápida por colaborador de origem
CREATE INDEX idx_headcount_colab_origem ON public.headcount_colaboradores(colaborador_origem_id);
CREATE INDEX idx_headcount_colab_matricula ON public.headcount_colaboradores(matricula);

-- Tabela de movimentações de headcount
CREATE TABLE public.headcount_movimentacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  headcount_colaborador_id UUID NOT NULL REFERENCES public.headcount_colaboradores(id) ON DELETE CASCADE,
  tipo_movimentacao TEXT NOT NULL CHECK (tipo_movimentacao IN ('aumento_quadro', 'substituicao')),
  motivo_id UUID REFERENCES public.headcount_motivos(id) ON DELETE SET NULL,
  motivo_complementar TEXT,
  data_efetiva DATE NOT NULL,
  tipo_substituicao TEXT CHECK (tipo_substituicao IN ('direta', 'indireta', 'parcial') OR tipo_substituicao IS NULL),
  colaborador_substituido_id UUID REFERENCES public.headcount_colaboradores(id) ON DELETE SET NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.headcount_movimentacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ver movimentações" ON public.headcount_movimentacoes FOR SELECT USING (true);
CREATE POLICY "Gerência pode criar movimentações" ON public.headcount_movimentacoes FOR INSERT WITH CHECK (is_gerencia() OR is_admin() OR is_encarregado());
CREATE POLICY "Gerência pode atualizar movimentações" ON public.headcount_movimentacoes FOR UPDATE USING (is_gerencia() OR is_admin());
CREATE POLICY "Gerência pode excluir movimentações" ON public.headcount_movimentacoes FOR DELETE USING (is_gerencia() OR is_admin());

CREATE INDEX idx_headcount_mov_colab ON public.headcount_movimentacoes(headcount_colaborador_id);
CREATE INDEX idx_headcount_mov_substituido ON public.headcount_movimentacoes(colaborador_substituido_id);

-- Triggers de updated_at
CREATE TRIGGER update_headcount_motivos_updated_at BEFORE UPDATE ON public.headcount_motivos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_headcount_colaboradores_updated_at BEFORE UPDATE ON public.headcount_colaboradores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_headcount_movimentacoes_updated_at BEFORE UPDATE ON public.headcount_movimentacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para sincronizar colaboradores existentes para a tabela de headcount
CREATE OR REPLACE FUNCTION public.sync_colaboradores_to_headcount()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Inserir colaboradores que ainda não existem na tabela de headcount
  INSERT INTO public.headcount_colaboradores (
    colaborador_origem_id, matricula, colaborador, cargo, setor, subsetor, 
    turno, lideranca, sexo, admissao, status
  )
  SELECT 
    c.id, c.matricula, c.colaborador, c.cargo, c.setor, c.subsetor,
    c.turno, c.lideranca, c.sexo, c.admissao, c.status
  FROM public.colaboradores c
  WHERE NOT EXISTS (
    SELECT 1 FROM public.headcount_colaboradores hc 
    WHERE hc.colaborador_origem_id = c.id
  );
END;
$$;

-- Trigger para adicionar automaticamente novos colaboradores ao headcount
CREATE OR REPLACE FUNCTION public.auto_add_to_headcount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.headcount_colaboradores (
    colaborador_origem_id, matricula, colaborador, cargo, setor, subsetor,
    turno, lideranca, sexo, admissao, status
  ) VALUES (
    NEW.id, NEW.matricula, NEW.colaborador, NEW.cargo, NEW.setor, NEW.subsetor,
    NEW.turno, NEW.lideranca, NEW.sexo, NEW.admissao, NEW.status
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_add_headcount
AFTER INSERT ON public.colaboradores
FOR EACH ROW
EXECUTE FUNCTION public.auto_add_to_headcount();

-- Executar sync inicial
SELECT public.sync_colaboradores_to_headcount();
