import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Cadastro from "./pages/Cadastro";
import Chamada from "./pages/Chamada";
import ChamadaSabado from "./pages/ChamadaSabado";
import Indicadores from "./pages/Indicadores";
import MetricasChamada from "./pages/MetricasChamada";
import EditarColaborador from "./pages/EditarColaborador";
import SolicitacaoMovimentacao from "./pages/SolicitacaoMovimentacao";
import ListaColaboradores from "./pages/ListaColaboradores";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout>
                  <Index />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/cadastro" element={
              <ProtectedRoute requireGerencia>
                <AppLayout>
                  <Cadastro />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/chamada" element={
              <ProtectedRoute>
                <AppLayout>
                  <Chamada />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/chamada-sabado" element={
              <ProtectedRoute>
                <AppLayout>
                  <ChamadaSabado />
                </AppLayout>
              </ProtectedRoute>
            } />
          <Route path="/indicadores" element={
            <ProtectedRoute>
              <AppLayout>
                <Indicadores />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/metricas-chamada" element={
            <ProtectedRoute>
              <AppLayout>
                <MetricasChamada />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/lista-colaboradores" element={
            <ProtectedRoute>
              <AppLayout>
                <ListaColaboradores />
              </AppLayout>
            </ProtectedRoute>
          } />
            <Route path="/editar-colaborador/:id" element={
              <ProtectedRoute requireGerencia>
                <AppLayout>
                  <EditarColaborador />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/solicitacao-movimentacao" element={
              <ProtectedRoute>
                <AppLayout>
                  <SolicitacaoMovimentacao />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
