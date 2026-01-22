-- Remover RAPDO das opções de subsetor
DELETE FROM opcoes_campos_cadastro WHERE campo = 'subsetor' AND valor ILIKE '%RAPDO%';