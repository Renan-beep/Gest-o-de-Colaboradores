-- Criar tabela para armazenar opções de dropdown dos campos do cadastro
CREATE TABLE public.opcoes_campos_cadastro (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campo TEXT NOT NULL,
  valor TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campo, valor)
);

-- Enable RLS
ALTER TABLE public.opcoes_campos_cadastro ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ver
CREATE POLICY "Autenticados podem ver opções" 
ON public.opcoes_campos_cadastro 
FOR SELECT 
USING (true);

-- Admin e gerência podem criar
CREATE POLICY "Admin e gerência podem criar opções" 
ON public.opcoes_campos_cadastro 
FOR INSERT 
WITH CHECK (is_admin() OR is_gerencia());

-- Admin e gerência podem atualizar
CREATE POLICY "Admin e gerência podem atualizar opções" 
ON public.opcoes_campos_cadastro 
FOR UPDATE 
USING (is_admin() OR is_gerencia());

-- Admin e gerência podem excluir
CREATE POLICY "Admin e gerência podem excluir opções" 
ON public.opcoes_campos_cadastro 
FOR DELETE 
USING (is_admin() OR is_gerencia());

-- Trigger para updated_at
CREATE TRIGGER update_opcoes_campos_cadastro_updated_at
BEFORE UPDATE ON public.opcoes_campos_cadastro
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir opções atuais extraídas dos colaboradores
INSERT INTO public.opcoes_campos_cadastro (campo, valor, ordem) VALUES
-- Cargos
('cargo', 'Analista de Logística Sr', 1),
('cargo', 'Assistente de Estoque Jr', 2),
('cargo', 'Assistente de Estoque Pl', 3),
('cargo', 'Coordenador de Logística', 4),
('cargo', 'Encarregado de Estoque', 5),
('cargo', 'Operador de Empilhadeira Jr', 6),
('cargo', 'Repositor de Estoque', 7),
('cargo', 'Supervisor de Estoque', 8),
-- Setores
('setor', 'Armazenagem', 1),
('setor', 'Conferência', 2),
('setor', 'Controle dos pedidos', 3),
('setor', 'Coordenação', 4),
('setor', 'Embalagem', 5),
('setor', 'Encarregado', 6),
('setor', 'Expedição', 7),
('setor', 'Garantia', 8),
('setor', 'Inventário', 9),
('setor', 'Logística', 10),
('setor', 'Operador de empilhadeira', 11),
('setor', 'Recebimento', 12),
('setor', 'Ressuprimento', 13),
('setor', 'Retira', 14),
('setor', 'SAC', 15),
('setor', 'Separação', 16),
('setor', 'Separação Retira', 17),
('setor', 'Supervisão', 18),
-- Subsetores
('subsetor', 'Estado', 1),
('subsetor', 'Gaiola/ Retorno estoque', 2),
('subsetor', 'RAPDO', 3),
('subsetor', 'Ressuprimento', 4),
('subsetor', 'Transferências', 5),
('subsetor', 'Transferências/ Vendas', 6),
('subsetor', 'Transportadora', 7),
-- Lideranças
('lideranca', 'Alexson de Moura Dettmann', 1),
('lideranca', 'Almir Ribeiro de Queiroz', 2),
('lideranca', 'Arivaldo Arlindo da Silva', 3),
('lideranca', 'Bruno Martins Euzebio', 4),
('lideranca', 'Carlos Eduardo Cavalcantes da Silva', 5),
('lideranca', 'Davisson da Costa Rebuli', 6),
('lideranca', 'Josimar Santos Silva', 7),
('lideranca', 'Klaine Xavier da Silva Martins', 8),
-- Turnos
('turno', '06:00 - 15:15', 1),
('turno', '06:00 - 16:03', 2),
('turno', '07:00 - 17:03', 3),
('turno', '08:00 - 17:15', 4),
('turno', '08:00 - 18:03', 5),
('turno', '10:00 - 20:03', 6),
('turno', '10:45 - 20:03', 7),
('turno', '12:00 - 22:03', 8),
('turno', '12:45 - 22:00', 9),
('turno', '22:00 - 06:52', 10),
-- Sábado horário
('sabado_horario', '08:00 - 12:00', 1),
('sabado_horario', '10:00 - 14:00', 2),
('sabado_horario', '12:00 - 16:00', 3),
-- Horário almoço
('horario_almoco', '01:30 - 02:45', 1),
('horario_almoco', '11:00 - 12:15', 2),
('horario_almoco', '11:45 - 13:00', 3),
('horario_almoco', '12:15 - 13:30', 4),
('horario_almoco', '13:00 - 14:15', 5),
('horario_almoco', '14:45 - 16:00', 6),
-- Horário café
('horario_cafe', '05:00 - 05:10', 1),
('horario_cafe', '15:00 - 15:10', 2),
('horario_cafe', '15:15 - 15:25', 3),
('horario_cafe', '15:30 - 15:40', 4),
('horario_cafe', '17:00 - 17:10', 5),
('horario_cafe', '19:00 - 19:10', 6);

-- Podemos remover a tabela antiga se não for mais necessária (opcional)
-- DROP TABLE IF EXISTS public.configuracao_campos_cadastro;