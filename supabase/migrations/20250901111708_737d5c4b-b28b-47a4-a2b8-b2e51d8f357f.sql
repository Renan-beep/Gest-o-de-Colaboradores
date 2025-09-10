-- Add unique constraints to prevent duplicate data
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

-- Update RLS policies for colaboradores (only authenticated admins can access)
DROP POLICY IF EXISTS "Allow all operations on colaboradores" ON public.colaboradores;
CREATE POLICY "Admins can view colaboradores" ON public.colaboradores
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert colaboradores" ON public.colaboradores
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update colaboradores" ON public.colaboradores
  FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete colaboradores" ON public.colaboradores
  FOR DELETE TO authenticated USING (public.is_admin());

-- Update RLS policies for chamadas (only authenticated admins can access)
DROP POLICY IF EXISTS "Allow all operations on chamadas" ON public.chamadas;
CREATE POLICY "Admins can view chamadas" ON public.chamadas
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert chamadas" ON public.chamadas
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update chamadas" ON public.chamadas
  FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete chamadas" ON public.chamadas
  FOR DELETE TO authenticated USING (public.is_admin());

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- Add trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create more secure storage policies
DROP POLICY IF EXISTS "Allow all operations" ON storage.objects;

-- Only authenticated admins can upload files
CREATE POLICY "Admins can upload files" ON storage.objects
  FOR INSERT TO authenticated 
  WITH CHECK (
    bucket_id = 'excel-files' AND 
    public.is_admin() AND
    -- Restrict file types to Excel only
    (storage.extension(name) = 'xlsx' OR storage.extension(name) = 'xls')
  );

-- Only authenticated admins can view files
CREATE POLICY "Admins can view files" ON storage.objects
  FOR SELECT TO authenticated 
  USING (bucket_id = 'excel-files' AND public.is_admin());

-- Only authenticated admins can delete files
CREATE POLICY "Admins can delete files" ON storage.objects
  FOR DELETE TO authenticated 
  USING (bucket_id = 'excel-files' AND public.is_admin());