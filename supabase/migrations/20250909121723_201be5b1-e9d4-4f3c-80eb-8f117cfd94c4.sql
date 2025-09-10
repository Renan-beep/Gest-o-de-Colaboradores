-- Remove existing RLS policies and create public access policies for colaboradores table
DROP POLICY IF EXISTS "Gerencia and Encarregados can view colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Only Gerencia can delete colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Only Gerencia can insert colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Only Gerencia can update colaboradores" ON public.colaboradores;

-- Create public access policies for colaboradores
CREATE POLICY "Public can view colaboradores" ON public.colaboradores
FOR SELECT USING (true);

CREATE POLICY "Public can insert colaboradores" ON public.colaboradores
FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update colaboradores" ON public.colaboradores
FOR UPDATE USING (true);

CREATE POLICY "Public can delete colaboradores" ON public.colaboradores
FOR DELETE USING (true);

-- Remove existing RLS policies and create public access policies for chamadas table
DROP POLICY IF EXISTS "Gerencia and Encarregados can view chamadas" ON public.chamadas;
DROP POLICY IF EXISTS "Gerencia and Encarregados can insert chamadas" ON public.chamadas;
DROP POLICY IF EXISTS "Gerencia and Encarregados can update chamadas" ON public.chamadas;
DROP POLICY IF EXISTS "Only Gerencia can delete chamadas" ON public.chamadas;

-- Create public access policies for chamadas
CREATE POLICY "Public can view chamadas" ON public.chamadas
FOR SELECT USING (true);

CREATE POLICY "Public can insert chamadas" ON public.chamadas
FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update chamadas" ON public.chamadas
FOR UPDATE USING (true);

CREATE POLICY "Public can delete chamadas" ON public.chamadas
FOR DELETE USING (true);

-- Remove existing RLS policies and create public access policies for solicitacoes_movimentacao table
DROP POLICY IF EXISTS "Encarregados can create requests" ON public.solicitacoes_movimentacao;
DROP POLICY IF EXISTS "Encarregados can view their own requests" ON public.solicitacoes_movimentacao;
DROP POLICY IF EXISTS "Gerencia can update requests" ON public.solicitacoes_movimentacao;
DROP POLICY IF EXISTS "Gerencia can view all requests" ON public.solicitacoes_movimentacao;

-- Create public access policies for solicitacoes_movimentacao
CREATE POLICY "Public can view solicitacoes" ON public.solicitacoes_movimentacao
FOR SELECT USING (true);

CREATE POLICY "Public can insert solicitacoes" ON public.solicitacoes_movimentacao
FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update solicitacoes" ON public.solicitacoes_movimentacao
FOR UPDATE USING (true);

CREATE POLICY "Public can delete solicitacoes" ON public.solicitacoes_movimentacao
FOR DELETE USING (true);