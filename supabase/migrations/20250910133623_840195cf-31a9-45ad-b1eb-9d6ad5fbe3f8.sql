-- Adicionar triggers para updated_at em todas as tabelas que não têm
DROP TRIGGER IF EXISTS update_colaboradores_updated_at ON public.colaboradores;
CREATE TRIGGER update_colaboradores_updated_at
  BEFORE UPDATE ON public.colaboradores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_chamadas_updated_at ON public.chamadas;
CREATE TRIGGER update_chamadas_updated_at
  BEFORE UPDATE ON public.chamadas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_solicitacoes_movimentacao_updated_at ON public.solicitacoes_movimentacao;
CREATE TRIGGER update_solicitacoes_movimentacao_updated_at
  BEFORE UPDATE ON public.solicitacoes_movimentacao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_colaboradores_status ON public.colaboradores(status);
CREATE INDEX IF NOT EXISTS idx_colaboradores_setor ON public.colaboradores(setor);
CREATE INDEX IF NOT EXISTS idx_colaboradores_matricula ON public.colaboradores(matricula);
CREATE INDEX IF NOT EXISTS idx_chamadas_data ON public.chamadas(data);
CREATE INDEX IF NOT EXISTS idx_chamadas_colaborador_data ON public.chamadas(colaborador_id, data);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Adicionar função para validar emails
CREATE OR REPLACE FUNCTION public.is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Adicionar validação para matrícula única
CREATE OR REPLACE FUNCTION public.validate_unique_matricula()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.colaboradores 
    WHERE matricula = NEW.matricula 
    AND id != COALESCE(NEW.id, gen_random_uuid())
  ) THEN
    RAISE EXCEPTION 'Matrícula % já existe no sistema', NEW.matricula;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para validação de matrícula
DROP TRIGGER IF EXISTS validate_matricula_trigger ON public.colaboradores;
CREATE TRIGGER validate_matricula_trigger
  BEFORE INSERT OR UPDATE ON public.colaboradores
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_unique_matricula();

-- Adicionar função para limpar dados antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_chamadas(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.chamadas 
  WHERE data < CURRENT_DATE - INTERVAL '%s days' % days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;