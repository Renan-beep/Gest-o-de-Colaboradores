-- Tabela de conversas (privadas e grupos)
CREATE TABLE public.conversas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT, -- Nome do grupo (null para conversas privadas)
  tipo TEXT NOT NULL DEFAULT 'privada' CHECK (tipo IN ('privada', 'grupo')),
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Participantes das conversas
CREATE TABLE public.conversas_participantes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversa_id UUID NOT NULL REFERENCES public.conversas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ultima_leitura TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(conversa_id, user_id)
);

-- Mensagens
CREATE TABLE public.mensagens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversa_id UUID NOT NULL REFERENCES public.conversas(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  conteudo TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_mensagens_conversa ON public.mensagens(conversa_id);
CREATE INDEX idx_mensagens_created_at ON public.mensagens(created_at DESC);
CREATE INDEX idx_participantes_user ON public.conversas_participantes(user_id);
CREATE INDEX idx_participantes_conversa ON public.conversas_participantes(conversa_id);

-- Enable RLS
ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversas_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

-- Políticas para conversas
CREATE POLICY "Usuários podem ver conversas que participam"
ON public.conversas FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversas_participantes
    WHERE conversa_id = id AND user_id = auth.uid()
  )
);

CREATE POLICY "Usuários autenticados podem criar conversas"
ON public.conversas FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Criador pode atualizar conversa"
ON public.conversas FOR UPDATE
USING (criado_por = auth.uid());

-- Políticas para participantes
CREATE POLICY "Participantes podem ver outros participantes da conversa"
ON public.conversas_participantes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversas_participantes cp
    WHERE cp.conversa_id = conversa_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Usuários autenticados podem adicionar participantes"
ON public.conversas_participantes FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Participantes podem atualizar sua própria participação"
ON public.conversas_participantes FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Participantes podem sair da conversa"
ON public.conversas_participantes FOR DELETE
USING (user_id = auth.uid());

-- Políticas para mensagens
CREATE POLICY "Participantes podem ver mensagens da conversa"
ON public.mensagens FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversas_participantes
    WHERE conversa_id = mensagens.conversa_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Participantes podem enviar mensagens"
ON public.mensagens FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.conversas_participantes
    WHERE conversa_id = mensagens.conversa_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Remetente pode atualizar mensagem"
ON public.mensagens FOR UPDATE
USING (sender_id = auth.uid());

-- Trigger para updated_at
CREATE TRIGGER update_conversas_updated_at
BEFORE UPDATE ON public.conversas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para buscar ou criar conversa privada
CREATE OR REPLACE FUNCTION public.get_or_create_private_conversation(other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conversa_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Buscar conversa privada existente entre os dois usuários
  SELECT c.id INTO conversa_id
  FROM conversas c
  JOIN conversas_participantes cp1 ON c.id = cp1.conversa_id
  JOIN conversas_participantes cp2 ON c.id = cp2.conversa_id
  WHERE c.tipo = 'privada'
    AND cp1.user_id = current_user_id
    AND cp2.user_id = other_user_id
  LIMIT 1;
  
  -- Se não existe, criar nova conversa
  IF conversa_id IS NULL THEN
    INSERT INTO conversas (tipo, criado_por)
    VALUES ('privada', current_user_id)
    RETURNING id INTO conversa_id;
    
    -- Adicionar participantes
    INSERT INTO conversas_participantes (conversa_id, user_id)
    VALUES (conversa_id, current_user_id), (conversa_id, other_user_id);
  END IF;
  
  RETURN conversa_id;
END;
$$;