import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [vagasPendentesCount, setVagasPendentesCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchVagasPendentes = async () => {
      const { count, error } = await supabase
        .from('vagas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'aguardando_aprovacao');
      
      if (!error && count !== null) {
        setVagasPendentesCount(count);
      }
    };

    fetchVagasPendentes();

    // Subscrever a mudanças em tempo real
    const channel = supabase
      .channel('vagas-global-notification')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vagas'
        },
        () => {
          fetchVagasPendentes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleNotificationClick = () => {
    if (location.pathname !== '/recrutamento') {
      navigate('/recrutamento');
    } else {
      const element = document.getElementById('coluna-aguardando-aprovacao');
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          {/* Header with trigger */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40 flex items-center px-4 gap-4">
            <SidebarTrigger className="shrink-0" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Dashboard</h2>
            </div>
            
            {/* Notificação global de aprovações pendentes */}
            {vagasPendentesCount > 0 && (
              <div 
                className="flex items-center gap-2 bg-amber-500 text-white px-3 py-1.5 rounded-lg cursor-pointer hover:bg-amber-600 transition-colors animate-pulse"
                onClick={handleNotificationClick}
              >
                <Bell className="h-4 w-4 animate-bounce" />
                <span className="text-sm font-medium">
                  {vagasPendentesCount} {vagasPendentesCount === 1 ? 'aprovação pendente' : 'aprovações pendentes'}
                </span>
              </div>
            )}
          </header>
          
          {/* Main content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}