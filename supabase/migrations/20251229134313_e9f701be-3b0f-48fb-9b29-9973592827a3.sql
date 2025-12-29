-- Tabela principal de vagas
CREATE TABLE public.vagas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cargo TEXT NOT NULL,
  setor TEXT,
  motivo_abertura TEXT NOT NULL,
  colaborador_substituido_id UUID REFERENCES public.colaboradores(id),
  tipo_vaga TEXT DEFAULT 'CLT',
  gestor_solicitante_id UUID NOT NULL,
  gestor_solicitante_nome TEXT NOT NULL,
  quantidade_vagas INTEGER NOT NULL DEFAULT 1,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho',
  turno TEXT,
  lideranca TEXT,
  subsetor TEXT,
  aprovador_id UUID,
  aprovador_nome TEXT,
  data_aprovacao TIMESTAMP WITH TIME ZONE,
  comentarios_aprovacao TEXT,
  candidato_nome TEXT,
  candidato_matricula TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de histórico de aprovações
CREATE TABLE public.vagas_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vaga_id UUID NOT NULL REFERENCES public.vagas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL,
  usuario_nome TEXT NOT NULL,
  acao TEXT NOT NULL,
  status_anterior TEXT,
  status_novo TEXT,
  comentarios TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.vagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vagas_historico ENABLE ROW LEVEL SECURITY;

-- Políticas para vagas
CREATE POLICY "Usuários autenticados podem ver vagas"
ON public.vagas FOR SELECT
USING (true);

CREATE POLICY "Usuários autenticados podem criar vagas"
ON public.vagas FOR INSERT
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar vagas"
ON public.vagas FOR UPDATE
USING (true);

CREATE POLICY "Usuários autenticados podem deletar vagas"
ON public.vagas FOR DELETE
USING (true);

-- Políticas para histórico
CREATE POLICY "Usuários autenticados podem ver histórico"
ON public.vagas_historico FOR SELECT
USING (true);

CREATE POLICY "Usuários autenticados podem criar histórico"
ON public.vagas_historico FOR INSERT
WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_vagas_updated_at
BEFORE UPDATE ON public.vagas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();