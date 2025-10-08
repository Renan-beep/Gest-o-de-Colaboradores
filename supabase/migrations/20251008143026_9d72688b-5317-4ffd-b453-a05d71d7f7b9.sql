-- Adicionar campos de liderança na tabela de movimentações para rastrear histórico
ALTER TABLE solicitacoes_movimentacao
ADD COLUMN IF NOT EXISTS lideranca_origem text,
ADD COLUMN IF NOT EXISTS lideranca_destino text;

-- Criar índice para melhorar performance de consultas de histórico
CREATE INDEX IF NOT EXISTS idx_solicitacoes_movimentacao_colaborador_data 
ON solicitacoes_movimentacao(colaborador_id, data_inicio);

-- Criar índice para consultas por status aprovado
CREATE INDEX IF NOT EXISTS idx_solicitacoes_movimentacao_status 
ON solicitacoes_movimentacao(status);