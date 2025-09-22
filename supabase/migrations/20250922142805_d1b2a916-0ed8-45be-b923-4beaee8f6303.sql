-- Padronizar todos os status para ter a primeira letra maiúscula
UPDATE colaboradores 
SET status = CASE 
  WHEN LOWER(status) = 'ativo' THEN 'Ativo'
  WHEN LOWER(status) = 'afastado' THEN 'Afastado'
  ELSE status
END
WHERE status != 'Ativo' AND status != 'Afastado';