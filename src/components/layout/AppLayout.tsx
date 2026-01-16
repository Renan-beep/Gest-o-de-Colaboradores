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
        <SidebarInset>
          {/* Header with trigger */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40 flex items-center px-4 gap-4">
            <SidebarTrigger className="shrink-0" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Dashboard</h2>
            </div>
          </header>
          
          {/* Main content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
        
        {/* Chat e indicador de usuários online */}
        <ChatContainer />
        <OnlineUsers />
      </div>
    </SidebarProvider>
  );
}
