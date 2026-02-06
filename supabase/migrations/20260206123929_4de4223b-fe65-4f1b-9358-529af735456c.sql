
-- Tabela de custos médios por cargo
CREATE TABLE public.headcount_custos_cargo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cargo TEXT NOT NULL UNIQUE,
  custo_mensal NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.headcount_custos_cargo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ver custos" ON public.headcount_custos_cargo
  FOR SELECT USING (true);
CREATE POLICY "Gerência pode criar custos" ON public.headcount_custos_cargo
  FOR INSERT WITH CHECK (is_gerencia() OR is_admin());
CREATE POLICY "Gerência pode atualizar custos" ON public.headcount_custos_cargo
  FOR UPDATE USING (is_gerencia() OR is_admin());
CREATE POLICY "Gerência pode excluir custos" ON public.headcount_custos_cargo
  FOR DELETE USING (is_gerencia() OR is_admin());

CREATE TRIGGER update_headcount_custos_cargo_updated_at
  BEFORE UPDATE ON public.headcount_custos_cargo
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de headcount planejado (simulações)
CREATE TABLE public.headcount_planejado (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setor TEXT NOT NULL,
  subsetor TEXT,
  cargo TEXT NOT NULL,
  lideranca TEXT,
  turno TEXT,
  quantidade INTEGER NOT NULL DEFAULT 0,
  mes_referencia TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  criado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.headcount_planejado ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ver planejado" ON public.headcount_planejado
  FOR SELECT USING (true);
CREATE POLICY "Gerência pode criar planejado" ON public.headcount_planejado
  FOR INSERT WITH CHECK (is_gerencia() OR is_admin());
CREATE POLICY "Gerência pode atualizar planejado" ON public.headcount_planejado
  FOR UPDATE USING (is_gerencia() OR is_admin());
CREATE POLICY "Gerência pode excluir planejado" ON public.headcount_planejado
  FOR DELETE USING (is_gerencia() OR is_admin());

CREATE TRIGGER update_headcount_planejado_updated_at
  BEFORE UPDATE ON public.headcount_planejado
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
