-- First, let's find and clean up duplicate matriculas
WITH duplicates AS (
  SELECT matricula, MIN(id) as keep_id
  FROM public.colaboradores 
  WHERE matricula IS NOT NULL
  GROUP BY matricula 
  HAVING COUNT(*) > 1
)
DELETE FROM public.colaboradores 
WHERE id NOT IN (SELECT keep_id FROM duplicates)
  AND matricula IN (SELECT matricula FROM duplicates);

-- Now add the unique constraint
ALTER TABLE public.colaboradores ADD CONSTRAINT colaboradores_matricula_unique UNIQUE (matricula);

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'manager')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.get_current_user_role() = 'admin';
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;