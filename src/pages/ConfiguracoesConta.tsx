import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Building2, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function ConfiguracoesConta() {
  const { toast } = useToast();
  const { user, isGerencia } = useAuth();
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, company_logo_url')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data?.avatar_url) {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(data.avatar_url);
        setAvatarUrl(publicUrl);
      }

      if (data?.company_logo_url) {
        const { data: { publicUrl } } = supabase.storage
          .from('company-logos')
          .getPublicUrl(data.company_logo_url);
        setCompanyLogoUrl(publicUrl);
      }
    } catch (error: any) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma imagem válida",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5242880) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingAvatar(true);

    try {
      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Atualizar perfil com a URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: fileName })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);

      toast({
        title: "Sucesso",
        description: "Foto de perfil atualizada com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao fazer upload da foto: " + error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const uploadCompanyLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma imagem válida",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5242880) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingLogo(true);

    try {
      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `company/${Date.now()}.${fileExt}`;

      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Atualizar perfil com a URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ company_logo_url: fileName })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      setCompanyLogoUrl(publicUrl);

      toast({
        title: "Sucesso",
        description: "Logo da empresa atualizado com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao fazer upload do logo: " + error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <User className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Configurações da Conta</h1>
          <p className="text-muted-foreground">Gerencie seu perfil e informações da empresa</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Foto de Perfil */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Foto de Perfil
            </CardTitle>
            <CardDescription>
              Adicione ou atualize sua foto de perfil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-32 h-32">
                <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User className="w-16 h-16" />
                </AvatarFallback>
              </Avatar>

              <div className="w-full">
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={uploadingAvatar}
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    {uploadingAvatar ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {avatarUrl ? 'Alterar Foto' : 'Adicionar Foto'}
                      </>
                    )}
                  </Button>
                </Label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={uploadAvatar}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Formatos aceitos: JPG, PNG, WEBP (máx. 5MB)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Logo da Empresa */}
        {isGerencia && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Logo da Empresa
              </CardTitle>
              <CardDescription>
                Adicione ou atualize o logo da empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/30">
                  {companyLogoUrl ? (
                    <img
                      src={companyLogoUrl}
                      alt="Logo da Empresa"
                      className="max-w-full max-h-full object-contain p-2"
                    />
                  ) : (
                    <Building2 className="w-16 h-16 text-muted-foreground" />
                  )}
                </div>

                <div className="w-full">
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={uploadingLogo}
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      {uploadingLogo ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          {companyLogoUrl ? 'Alterar Logo' : 'Adicionar Logo'}
                        </>
                      )}
                    </Button>
                  </Label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={uploadCompanyLogo}
                    className="hidden"
                    disabled={uploadingLogo}
                  />
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Formatos aceitos: JPG, PNG, WEBP (máx. 5MB)
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
