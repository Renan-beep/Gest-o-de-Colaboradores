import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { updateRenanToManager } from '@/utils/updateUserRole';
import { Eye, EyeOff } from 'lucide-react';
import logoGrupoReal from '@/assets/logo-grupo-real.png';
export default function Auth() {
  const {
    user,
    signIn,
    signUp,
    resetPassword,
    loading
  } = useAuth();
  const {
    toast
  } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [userType, setUserType] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Função para alterar o Renan para gerente
  const handleUpdateRenanRole = async () => {
    const result = await updateRenanToManager();
    if (result.success) {
      toast({
        title: 'Sucesso',
        description: 'Tipo de usuário do Renan alterado para Gerente',
      });
    } else {
      toast({
        title: 'Erro',
        description: result.error || 'Erro ao alterar tipo de usuário',
        variant: 'destructive'
      });
    }
  };

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const {
      error
    } = await signIn(email, password);
    if (error) {
      setError(error.message);
      toast({
        title: 'Erro no login',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Login realizado com sucesso',
        description: 'Bem-vindo ao sistema!'
      });
    }
    setIsLoading(false);
  };
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setIsLoading(false);
      return;
    }
    if (!userType) {
      setError('Selecione o tipo de usuário');
      setIsLoading(false);
      return;
    }
    
    const {
      error
    } = await signUp(email, password, fullName, userType);
    if (error) {
      setError(error.message);
      toast({
        title: 'Erro no cadastro',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Cadastro realizado com sucesso',
        description: 'Verifique seu email para confirmar a conta.'
      });
      setUserType(''); // Reset user type
    }
    setIsLoading(false);
  };
  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const {
      error
    } = await resetPassword(resetEmail);
    if (error) {
      setError(error.message);
      toast({
        title: 'Erro ao enviar email',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Email enviado',
        description: 'Verifique seu email para redefinir sua senha.'
      });
      setIsResettingPassword(false);
      setResetEmail('');
    }
    setIsLoading(false);
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
          <p className="mt-1 text-xs text-muted-foreground">URL atual: {window.location.origin}</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen flex items-center justify-center p-3 md:p-4 relative overflow-hidden">
      {/* Background with gradient and animated elements */}
      <div className="absolute inset-0 bg-gradient-surface">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-primary rounded-full mix-blend-multiply filter blur-xl opacity-20 floating"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-accent rounded-full mix-blend-multiply filter blur-xl opacity-20 floating" style={{
        animationDelay: '2s'
      }}></div>
        <div className="absolute bottom-20 left-40 w-80 h-80 bg-gradient-hero rounded-full mix-blend-multiply filter blur-xl opacity-20 floating" style={{
        animationDelay: '4s'
      }}></div>
      </div>

      <Card className="w-full max-w-md glass-card shadow-strong animate-fade-in relative z-10">
        <CardHeader className="text-center pb-8">
          <div className="flex items-center justify-center mb-6">
            <img 
              src={logoGrupoReal} 
              alt="Grupo Real" 
              className="w-24 h-24 object-contain"
            />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">Gestão de Colaboradores</CardTitle>
          <CardDescription className="text-lg">
            Sistema Inteligente de Gestão de Colaboradores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 glass-effect">
              <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Login
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Cadastro
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="seu@email.com" required className="glass-effect border-border/50 focus:border-primary transition-all duration-300" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      name="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Sua senha" 
                      required 
                      className="glass-effect border-border/50 focus:border-primary transition-all duration-300 pr-10" 
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                {error && <Alert variant="destructive" className="glass-effect border-error/50">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>}
                
                <Button type="submit" className="w-full btn-gradient glow-hover h-12 text-base font-medium" disabled={isLoading}>
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
                
                <div className="text-center">
                  <Button type="button" variant="link" className="text-sm text-muted-foreground hover:text-primary transition-colors" onClick={() => setIsResettingPassword(true)}>
                    Esqueci minha senha
                  </Button>
                </div>
              </form>
              
              {isResettingPassword && <div className="mt-6 p-6 glass-card border border-border/30 rounded-xl animate-fade-in">
                  <h3 className="font-semibold mb-4 text-lg">Redefinir senha</h3>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="resetEmail" className="text-sm font-medium">Email</Label>
                      <Input id="resetEmail" type="email" placeholder="seu@email.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required className="glass-effect border-border/50 focus:border-primary transition-all duration-300" />
                    </div>
                    <div className="flex gap-3">
                      <Button type="submit" disabled={isLoading} className="flex-1 btn-gradient">
                        {isLoading ? 'Enviando...' : 'Enviar email'}
                      </Button>
                      <Button type="button" variant="outline" className="btn-glass" onClick={() => {
                    setIsResettingPassword(false);
                    setResetEmail('');
                    setError('');
                  }}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </div>}
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">Nome Completo</Label>
                  <Input id="fullName" name="fullName" type="text" placeholder="Seu nome completo" required className="glass-effect border-border/50 focus:border-primary transition-all duration-300" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="seu@email.com" required className="glass-effect border-border/50 focus:border-primary transition-all duration-300" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      name="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Mínimo 6 caracteres" 
                      required 
                      className="glass-effect border-border/50 focus:border-primary transition-all duration-300 pr-10" 
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar Senha</Label>
                  <div className="relative">
                    <Input 
                      id="confirmPassword" 
                      name="confirmPassword" 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="Confirme sua senha" 
                      required 
                      className="glass-effect border-border/50 focus:border-primary transition-all duration-300 pr-10" 
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userType" className="text-sm font-medium">Tipo de Usuário</Label>
                  <Select value={userType} onValueChange={setUserType} required>
                    <SelectTrigger className="glass-effect border-border/50 focus:border-primary transition-all duration-300">
                      <SelectValue placeholder="Selecione o tipo de usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gerencia">Gerente - Acesso total ao sistema</SelectItem>
                      <SelectItem value="encarregado">Encarregado - Acesso limitado (sem edição de colaboradores)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {error && <Alert variant="destructive" className="glass-effect border-error/50">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>}
                
                <Button type="submit" className="w-full btn-gradient glow-hover h-12 text-base font-medium" disabled={isLoading}>
                  {isLoading ? 'Criando conta...' : 'Criar conta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Botão temporário para alterar o Renan para gerente */}
      <div className="fixed bottom-4 right-4">
        <Button onClick={handleUpdateRenanRole} variant="outline" size="sm">
          Alterar Renan para Gerente
        </Button>
      </div>
    </div>;
}