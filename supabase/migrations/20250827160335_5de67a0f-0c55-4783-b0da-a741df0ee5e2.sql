-- Criar tabela de colaboradores
CREATE TABLE public.colaboradores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  matricula TEXT NOT NULL UNIQUE,
  colaborador TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo',
  cargo TEXT,
  setor TEXT,
  subsetor TEXT,
  lideranca TEXT,
  turno TEXT,
  sabado_trabalho TEXT DEFAULT 'nao',
  horario_almoco TEXT,
  horario_cafe TEXT,
  admissao DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de chamadas diárias
CREATE TABLE public.chamadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id UUID NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(colaborador_id, data)
);

-- Habilitar Row Level Security
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamadas ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS (acesso público para demonstração)
CREATE POLICY "Permitir leitura de colaboradores" 
ON public.colaboradores 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserção de colaboradores" 
ON public.colaboradores 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir atualização de colaboradores" 
ON public.colaboradores 
FOR UPDATE 
USING (true);

CREATE POLICY "Permitir exclusão de colaboradores" 
ON public.colaboradores 
FOR DELETE 
USING (true);

CREATE POLICY "Permitir leitura de chamadas" 
ON public.chamadas 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserção de chamadas" 
ON public.chamadas 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir atualização de chamadas" 
ON public.chamadas 
FOR UPDATE 
USING (true);

CREATE POLICY "Permitir exclusão de chamadas" 
ON public.chamadas 
FOR DELETE 
USING (true);

-- Criar função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para atualização automática de timestamps
CREATE TRIGGER update_colaboradores_updated_at
  BEFORE UPDATE ON public.colaboradores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chamadas_updated_at
  BEFORE UPDATE ON public.chamadas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados de exemplo
INSERT INTO public.colaboradores (matricula, colaborador, status, cargo, setor, subsetor, lideranca, turno, sabado_trabalho, admissao) VALUES
('12345', 'João Silva', 'ativo', 'Analista', 'TI', 'Desenvolvimento', 'Maria Santos', 'integral', 'nao', '2023-01-15'),
('12346', 'Ana Costa', 'ativo', 'Gerente', 'RH', 'Recrutamento', 'Carlos Lima', 'manha', 'sim', '2022-03-10'),
('12347', 'Pedro Oliveira', 'afastado', 'Técnico', 'Produção', 'Montagem', 'Ana Costa', 'tarde', 'nao', '2023-06-20'),
('12348', 'Maria Santos', 'ativo', 'Coordenadora', 'Vendas', 'Comercial', 'João Silva', 'integral', 'nao', '2022-08-15'),
('12349', 'Carlos Lima', 'ativo', 'Diretor', 'Financeiro', 'Controladoria', 'CEO', 'integral', 'sim', '2021-02-01');