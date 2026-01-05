-- Padronizar status 'ativo' para 'Ativo'
UPDATE colaboradores 
SET status = 'Ativo', updated_at = now()
WHERE status = 'ativo';