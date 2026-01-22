-- Adicionar coluna rapdo como boolean
ALTER TABLE public.colaboradores 
ADD COLUMN rapdo boolean NOT NULL DEFAULT false;

-- Atualizar colaboradores que têm RAPDO no subsetor para rapdo = true
UPDATE public.colaboradores 
SET rapdo = true 
WHERE subsetor ILIKE '%RAPDO%' OR subsetor = 'RAPDO';

-- Limpar o valor RAPDO da coluna subsetor
UPDATE public.colaboradores 
SET subsetor = NULLIF(TRIM(REPLACE(REPLACE(subsetor, 'RAPDO', ''), '  ', ' ')), '')
WHERE subsetor ILIKE '%RAPDO%' OR subsetor = 'RAPDO';