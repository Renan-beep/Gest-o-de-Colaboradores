-- Add missing sabado_horario column to colaboradores table
ALTER TABLE public.colaboradores 
ADD COLUMN sabado_horario text;