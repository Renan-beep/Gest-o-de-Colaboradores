import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { OnlineUsers } from "@/components/common/OnlineUsers";
import { ChatContainer } from "@/components/chat";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 min-w-0">
          {/* Header with trigger */}
          <header className="h-14 md:h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40 flex items-center px-3 md:px-4 gap-2 md:gap-4">
            <SidebarTrigger className="shrink-0" />
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-lg font-semibold truncate">Dashboard</h2>
            </div>
          </header>
          
          {/* Main content */}
          <main className="flex-1 p-3 md:p-6 pb-20 md:pb-6">
            {children}
          </main>
        </SidebarInset>
        
        {/* Chat e indicador de usuários online - escondidos em mobile muito pequeno */}
        <div className="hidden sm:block">
          <ChatContainer />
        </div>
        <OnlineUsers />
      </div>
    </SidebarProvider>
  );
}
