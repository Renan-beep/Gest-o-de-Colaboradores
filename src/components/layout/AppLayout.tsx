import { useNavigate, useLocation } from "react-router-dom";
import { ChatContainer } from "@/components/chat";
import { OnlineUsers } from "@/components/common/OnlineUsers";

import { LayoutGrid } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Derive page title from route
  const getPageTitle = () => {
    const map: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/cadastro': 'Cadastro',
      '/chamada': 'Chamada',
      '/chamada-sabado': 'Previsão de Sábados',
      '/operacao': 'Operação',
      '/indicadores': 'Indicadores',
      '/configuracoes-conta': 'Configurações',
      '/lista-colaboradores': 'Lista de Colaboradores',
      '/solicitacao-movimentacao': 'Solicitações',
      '/movimentacoes-headcount': 'Movimentações HC',
    };
    if (location.pathname.startsWith('/editar-colaborador')) return 'Editar Colaborador';
    return map[location.pathname] || 'Página';
  };

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {/* Simple top bar with back to menu */}
      <header className="h-14 md:h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40 flex items-center px-3 md:px-6 gap-3">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="hidden sm:inline">Menu</span>
        </button>
        
        <div className="w-px h-6 bg-border" />
        
        <h2 className="text-base md:text-lg font-semibold truncate">{getPageTitle()}</h2>
      </header>
      
      {/* Main content */}
      <main className="flex-1 p-3 md:p-6 pb-20 md:pb-6 max-w-[1400px] mx-auto w-full">
        {children}
      </main>
      
      {/* Chat, online users and AI */}
      <div className="hidden sm:block">
        <ChatContainer />
      </div>
      <OnlineUsers />
    </div>
  );
}
