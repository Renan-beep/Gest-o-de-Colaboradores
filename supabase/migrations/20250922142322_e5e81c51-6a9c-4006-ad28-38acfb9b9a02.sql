-- Habilitar realtime para a tabela colaboradores
ALTER TABLE public.colaboradores REPLICA IDENTITY FULL;

-- Adicionar a tabela à publicação do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.colaboradores;