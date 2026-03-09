import { useNavigate } from "react-router-dom";
import { 
  Home, Users, UserPlus, UserCog, FileText, ArrowRightLeft,
  UserCheck, ClipboardList, CalendarCheck, Factory, BarChart3, LogOut, Building2, User
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatContainer } from "@/components/chat";
import { OnlineUsers } from "@/components/common/OnlineUsers";

interface MenuItem {
  title: string;
  description: string;
  url: string;
  icon: React.ElementType;
  gradient: string;
  iconColor: string;
}

const gestaoItems: MenuItem[] = [
  { title: "Início", description: "Dashboard e indicadores", url: "/dashboard", icon: Home, gradient: "from-blue-500 to-blue-700", iconColor: "text-white" },
  { title: "Lista de Colaboradores", description: "Visualizar e gerenciar", url: "/lista-colaboradores", icon: Users, gradient: "from-emerald-500 to-emerald-700", iconColor: "text-white" },
  { title: "Cadastro", description: "Cadastrar colaboradores", url: "/cadastro", icon: UserPlus, gradient: "from-violet-500 to-violet-700", iconColor: "text-white" },
  { title: "Conta", description: "Perfil e preferências", url: "/configuracoes-conta", icon: UserCog, gradient: "from-slate-500 to-slate-700", iconColor: "text-white" },
  { title: "Solicitações", description: "Movimentações", url: "/solicitacao-movimentacao", icon: FileText, gradient: "from-amber-500 to-amber-700", iconColor: "text-white" },
  { title: "Movimentações HC", description: "Headcount", url: "/movimentacoes-headcount", icon: ArrowRightLeft, gradient: "from-cyan-500 to-cyan-700", iconColor: "text-white" },
];

const chamadaItems: MenuItem[] = [
  { title: "Controle de Presença", description: "Registrar presença diária", url: "/chamada", icon: UserCheck, gradient: "from-green-500 to-green-700", iconColor: "text-white" },
  { title: "Banco de Chamadas", description: "Histórico por colaborador", url: "/chamada?tab=banco", icon: ClipboardList, gradient: "from-teal-500 to-teal-700", iconColor: "text-white" },
  { title: "Previsão de Sábados", description: "Definir trabalho aos sábados", url: "/chamada-sabado", icon: CalendarCheck, gradient: "from-indigo-500 to-indigo-700", iconColor: "text-white" },
  { title: "Operação", description: "Mapa visual dos setores", url: "/operacao", icon: Factory, gradient: "from-orange-500 to-orange-700", iconColor: "text-white" },
];

const indicadoresItems: MenuItem[] = [
  { title: "Indicadores", description: "Métricas e relatórios", url: "/indicadores", icon: BarChart3, gradient: "from-rose-500 to-rose-700", iconColor: "text-white" },
];

const encarregadoGestaoItems: MenuItem[] = [
  { title: "Início", description: "Dashboard e indicadores", url: "/dashboard", icon: Home, gradient: "from-blue-500 to-blue-700", iconColor: "text-white" },
  { title: "Lista de Colaboradores", description: "Visualizar colaboradores", url: "/lista-colaboradores", icon: Users, gradient: "from-emerald-500 to-emerald-700", iconColor: "text-white" },
  { title: "Conta", description: "Perfil e preferências", url: "/configuracoes-conta", icon: UserCog, gradient: "from-slate-500 to-slate-700", iconColor: "text-white" },
  { title: "Solicitações", description: "Movimentações", url: "/solicitacao-movimentacao", icon: FileText, gradient: "from-amber-500 to-amber-700", iconColor: "text-white" },
];

export default function MenuHome() {
  const navigate = useNavigate();
  const { user, signOut, isGerencia, isEncarregado } = useAuth();
  const { toast } = useToast();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('avatar_url, company_logo_url').eq('user_id', user.id).single();
      if (data) {
        if (data.avatar_url) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(data.avatar_url);
          setAvatarUrl(publicUrl);
        }
        if (data.company_logo_url) {
          const { data: { publicUrl } } = supabase.storage.from('company-logos').getPublicUrl(data.company_logo_url);
          setCompanyLogoUrl(publicUrl);
        }
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    const fetchPending = async () => {
      const { count } = await supabase.from('solicitacoes_movimentacao').select('*', { count: 'exact', head: true }).eq('status', 'pendente');
      if (count !== null) setPendingCount(count);
    };
    fetchPending();
    const channel = supabase.channel('menu-solicitacoes').on('postgres_changes', { event: '*', schema: 'public', table: 'solicitacoes_movimentacao' }, () => fetchPending()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Logout realizado", description: "Você foi desconectado com sucesso" });
      navigate("/auth");
    } catch {
      toast({ title: "Erro", description: "Erro ao fazer logout", variant: "destructive" });
    }
  };

  const currentGestaoItems = isGerencia ? gestaoItems : encarregadoGestaoItems;

  const renderGroup = (title: string, items: MenuItem[]) => (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {items.map((item) => (
          <button
            key={item.url}
            onClick={() => navigate(item.url)}
            className="group relative flex flex-col items-center justify-center gap-2 md:gap-3 p-4 md:p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] overflow-hidden"
          >
            {/* Gradient background on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
            
            {/* Icon circle */}
            <div className={`relative z-10 w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-md group-hover:bg-white/20 group-hover:shadow-lg transition-all`}>
              <item.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            
            {/* Title */}
            <div className="relative z-10 text-center">
              <span className="text-sm md:text-base font-semibold text-foreground group-hover:text-white transition-colors leading-tight block">
                {item.title}
              </span>
              {item.title === "Solicitações" && pendingCount > 0 && (
                <span className="inline-flex items-center justify-center mt-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5">
                  {pendingCount}
                </span>
              )}
              <span className="text-xs text-muted-foreground group-hover:text-white/80 transition-colors mt-0.5 block">
                {item.description}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {companyLogoUrl ? (
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                <img src={companyLogoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <div>
              <h1 className="font-bold text-base md:text-lg leading-tight">Gestão de Colaboradores</h1>
              <p className="text-xs text-muted-foreground">
                {isGerencia ? 'Gerência' : isEncarregado ? 'Encarregado' : 'Usuário'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm text-muted-foreground truncate max-w-[150px]">{user?.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8 pb-20 md:pb-8">
        {renderGroup("Gestão", currentGestaoItems)}
        {renderGroup("Chamada", chamadaItems)}
        {isGerencia && renderGroup("Relatórios", indicadoresItems)}
      </main>

      {/* Chat and Online Users */}
      <div className="hidden sm:block">
        <ChatContainer />
      </div>
      <OnlineUsers />
    </div>
  );
}
