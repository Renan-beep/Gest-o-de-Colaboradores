import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Users, UserCheck, BarChart3, Plus, Home, Building2, CalendarCheck, LogOut, User, FileText, Settings, TrendingUp, UserPlus, UserCog, Bot, Briefcase } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
const gerenciaItems = [{
  title: "Início",
  url: "/",
  icon: Home,
  description: "Tela principal"
}, {
  title: "Lista de Colaboradores",
  url: "/lista-colaboradores",
  icon: Users,
  description: "Visualizar e gerenciar colaboradores"
}, {
  title: "Cadastro",
  url: "/cadastro",
  icon: UserPlus,
  description: "Cadastrar colaboradores"
}, {
  title: "Recrutamento",
  url: "/recrutamento",
  icon: Briefcase,
  description: "ATS - Vagas e Contratações"
}, {
  title: "Assistente IA",
  url: "/assistente-ia",
  icon: Bot,
  description: "Relatórios e automação com IA"
}, {
  title: "Configurações",
  url: "/indicadores",
  icon: Settings,
  description: "Configurações do sistema"
}, {
  title: "Conta",
  url: "/configuracoes-conta",
  icon: UserCog,
  description: "Perfil e preferências"
}, {
  title: "Solicitações",
  url: "/solicitacao-movimentacao",
  icon: FileText,
  description: "Movimentações"
}];
const chamadaGroupItems = [{
  title: "Controle de presença",
  url: "/chamada",
  icon: UserCheck,
  description: "Registrar presença diária"
}, {
  title: "Previsão de sábados",
  url: "/chamada-sabado",
  icon: CalendarCheck,
  description: "Definir trabalho aos sábados"
}, {
  title: "Métricas da chamada",
  url: "/metricas-chamada",
  icon: TrendingUp,
  description: "KPIs e relatórios"
}];
const encarregadoItems = [{
  title: "Início",
  url: "/",
  icon: Home,
  description: "Tela principal"
}, {
  title: "Lista de Colaboradores",
  url: "/lista-colaboradores",
  icon: Users,
  description: "Visualizar todos os colaboradores"
}, {
  title: "Assistente IA",
  url: "/assistente-ia",
  icon: Bot,
  description: "Relatórios e automação com IA"
}, {
  title: "Configurações",
  url: "/indicadores",
  icon: Settings,
  description: "Configurações do sistema"
}, {
  title: "Conta",
  url: "/configuracoes-conta",
  icon: UserCog,
  description: "Perfil e preferências"
}, {
  title: "Solicitações",
  url: "/solicitacao-movimentacao",
  icon: FileText,
  description: "Movimentações"
}];
const encarregadoChamadaItems = [{
  title: "Controle de presença",
  url: "/chamada",
  icon: UserCheck,
  description: "Registrar presença diária"
}, {
  title: "Previsão de sábados",
  url: "/chamada-sabado",
  icon: CalendarCheck,
  description: "Definir trabalho aos sábados"
}, {
  title: "Métricas da chamada",
  url: "/metricas-chamada",
  icon: TrendingUp,
  description: "KPIs e relatórios"
}];
export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { toast } = useToast();
  const { user, signOut, isGerencia, isEncarregado } = useAuth();
  const isActive = (path: string) => currentPath === path;
  const isCollapsed = state === "collapsed";
  const [pendingCount, setPendingCount] = useState(0);
  const [profile, setProfile] = useState<any>(null);

  // Buscar solicitações pendentes
  useEffect(() => {
    const fetchPendingCount = async () => {
      const { count, error } = await supabase
        .from('solicitacoes_movimentacao')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente');
      
      if (!error && count !== null) {
        setPendingCount(count);
      }
    };

    fetchPendingCount();

    // Subscrever a mudanças em tempo real
    const channel = supabase
      .channel('solicitacoes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'solicitacoes_movimentacao'
        },
        () => {
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Buscar perfil do usuário
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setProfile(data);
      }
    };

    fetchProfile();
  }, [user]);

  // Determine navigation items based on user role
  const navigationItems = isGerencia ? gerenciaItems : encarregadoItems;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer logout",
        variant: "destructive"
      });
    }
  };
  return <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            {!isCollapsed && <div>
                <h1 className="font-semibold text-sm">Gestão de Colaboradores</h1>
                <p className="text-xs text-muted-foreground">Sistema de Gestão</p>
              </div>}
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} className="flex items-center gap-3 rounded-lg transition-colors hover:bg-accent mx-0 px-[12px] py-[30px]">
                      <item.icon className="w-5 h-5" />
                      {!isCollapsed && <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">
                            {item.title}
                            {item.title === "Solicitações" && pendingCount > 0 && (
                              <span className="ml-1 text-primary">({pendingCount})</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </div>
                        </div>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Chamada Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Chamada</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(isGerencia ? chamadaGroupItems : encarregadoChamadaItems).map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} className="flex items-center gap-3 rounded-lg transition-colors hover:bg-accent mx-0 px-[12px] py-[30px]">
                      <item.icon className="w-5 h-5" />
                      {!isCollapsed && <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{item.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </div>
                        </div>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout Button - Outside groups */}
        <div className="px-4 py-2 mt-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10" 
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && "Sair"}
          </Button>
        </div>
        </SidebarContent>
        
        {/* Footer with user info */}
        <SidebarFooter>
          <div className="p-4 border-t border-border">
            {!isCollapsed && user && <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile?.avatar_url} alt="Avatar" />
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{user.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {isGerencia ? 'Gerência' : isEncarregado ? 'Encarregado' : 'Usuário'}
                  </div>
                </div>
              </div>}
            {isCollapsed && user && <div className="flex justify-center">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile?.avatar_url} alt="Avatar" />
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              </div>}
          </div>
        </SidebarFooter>
      </Sidebar>;
}