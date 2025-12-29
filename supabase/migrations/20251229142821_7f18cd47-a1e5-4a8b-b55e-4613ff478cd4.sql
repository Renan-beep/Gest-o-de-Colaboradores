-- Permitir que usuários gerencia vejam profiles de admin e gerencia (para lista de aprovadores)
CREATE POLICY "Gerencia can view admin and gerencia profiles"
ON public.profiles
FOR SELECT
USING (
  is_gerencia() AND role IN ('admin', 'gerencia')
);