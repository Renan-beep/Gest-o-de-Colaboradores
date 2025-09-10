-- Remove existing constraint and add new one
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new constraint with all roles
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('user', 'admin', 'gerencia', 'encarregado'));

-- Now update existing admin user to gerencia role
UPDATE profiles 
SET role = 'gerencia' 
WHERE email = 'renan.mirandola@outlook.com';

-- Create table for movement requests
CREATE TABLE public.solicitacoes_movimentacao (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id uuid NOT NULL,
  solicitante_id uuid NOT NULL REFERENCES profiles(user_id),
  tipo_movimentacao text NOT NULL CHECK (tipo_movimentacao IN ('transferencia', 'promocao', 'mudanca_setor', 'mudanca_turno', 'ferias', 'licenca')),
  setor_origem text,
  setor_destino text,
  cargo_origem text,
  cargo_destino text,
  turno_origem text,
  turno_destino text,
  justificativa text NOT NULL,
  data_inicio date,
  data_fim date,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada')),
  observacoes_gerencia text,
  aprovado_por uuid REFERENCES profiles(user_id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.solicitacoes_movimentacao ENABLE ROW LEVEL SECURITY;

-- Create policies for movement requests
CREATE POLICY "Encarregados can view their own requests"
ON public.solicitacoes_movimentacao
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND (p.role = 'encarregado' AND solicitante_id = auth.uid())
  )
);

CREATE POLICY "Encarregados can create requests"
ON public.solicitacoes_movimentacao
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'encarregado'
    AND solicitante_id = auth.uid()
  )
);

CREATE POLICY "Gerencia can view all requests"
ON public.solicitacoes_movimentacao
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'gerencia'
  )
);

CREATE POLICY "Gerencia can update requests"
ON public.solicitacoes_movimentacao
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'gerencia'
  )
);

-- Update existing RLS policies to include new roles
-- Update colaboradores policies
DROP POLICY IF EXISTS "Admins can view colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Admins can insert colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Admins can update colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Admins can delete colaboradores" ON public.colaboradores;

DROP POLICY IF EXISTS "Gerencia and Encarregados can view colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Only Gerencia can insert colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Only Gerencia can update colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Only Gerencia can delete colaboradores" ON public.colaboradores;

CREATE POLICY "Gerencia and Encarregados can view colaboradores"
ON public.colaboradores
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('gerencia', 'encarregado')
  )
);

CREATE POLICY "Only Gerencia can insert colaboradores"
ON public.colaboradores
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'gerencia'
  )
);

CREATE POLICY "Only Gerencia can update colaboradores"
ON public.colaboradores
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'gerencia'
  )
);

CREATE POLICY "Only Gerencia can delete colaboradores"
ON public.colaboradores
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'gerencia'
  )
);

-- Update chamadas policies
DROP POLICY IF EXISTS "Admins can view chamadas" ON public.chamadas;
DROP POLICY IF EXISTS "Admins can insert chamadas" ON public.chamadas;
DROP POLICY IF EXISTS "Admins can update chamadas" ON public.chamadas;
DROP POLICY IF EXISTS "Admins can delete chamadas" ON public.chamadas;

DROP POLICY IF EXISTS "Gerencia and Encarregados can view chamadas" ON public.chamadas;
DROP POLICY IF EXISTS "Gerencia and Encarregados can insert chamadas" ON public.chamadas;
DROP POLICY IF EXISTS "Gerencia and Encarregados can update chamadas" ON public.chamadas;
DROP POLICY IF EXISTS "Only Gerencia can delete chamadas" ON public.chamadas;

CREATE POLICY "Gerencia and Encarregados can view chamadas"
ON public.chamadas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('gerencia', 'encarregado')
  )
);

CREATE POLICY "Gerencia and Encarregados can insert chamadas"
ON public.chamadas
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('gerencia', 'encarregado')
  )
);

CREATE POLICY "Gerencia and Encarregados can update chamadas"
ON public.chamadas
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('gerencia', 'encarregado')
  )
);

CREATE POLICY "Only Gerencia can delete chamadas"
ON public.chamadas
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'gerencia'
  )
);

-- Update database functions
CREATE OR REPLACE FUNCTION public.is_gerencia()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_current_user_role() = 'gerencia';
$$;

CREATE OR REPLACE FUNCTION public.is_encarregado()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_current_user_role() = 'encarregado';
$$;

CREATE OR REPLACE FUNCTION public.is_management()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_current_user_role() IN ('gerencia', 'encarregado');
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_solicitacoes_movimentacao_updated_at
BEFORE UPDATE ON public.solicitacoes_movimentacao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();