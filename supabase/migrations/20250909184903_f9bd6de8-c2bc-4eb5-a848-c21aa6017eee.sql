-- Padronizar os valores de status dos colaboradores
UPDATE colaboradores 
SET status = 'Ativo' 
WHERE status = 'ativo';

-- Verificar se existem outros valores inconsistentes e padronizar
UPDATE colaboradores 
SET status = 'Afastado' 
WHERE status ILIKE 'afastado';