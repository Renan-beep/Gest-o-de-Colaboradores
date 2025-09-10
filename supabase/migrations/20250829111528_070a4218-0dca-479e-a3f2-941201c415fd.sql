-- Criar bucket para arquivos Excel
INSERT INTO storage.buckets (id, name, public) 
VALUES ('excel-files', 'excel-files', false);

-- Criar políticas de storage para arquivos Excel
CREATE POLICY "Allow authenticated users to upload excel files" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'excel-files');

CREATE POLICY "Allow authenticated users to view their excel files" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'excel-files');

CREATE POLICY "Allow authenticated users to delete their excel files" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'excel-files');