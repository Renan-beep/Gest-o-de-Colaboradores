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

-- Create more secure storage policies (replace the overly permissive ones)
DROP POLICY IF EXISTS "Allow all operations" ON storage.objects;

-- Only authenticated admins can upload Excel files
CREATE POLICY "Admins can upload Excel files" ON storage.objects
  FOR INSERT TO authenticated 
  WITH CHECK (
    bucket_id = 'excel-files' AND 
    public.is_admin() AND
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