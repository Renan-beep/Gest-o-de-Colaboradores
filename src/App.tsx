import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import MenuHome from "./pages/MenuHome";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Cadastro from "./pages/Cadastro";
import Chamada from "./pages/Chamada";
import ChamadaSabado from "./pages/ChamadaSabado";
import Operacao from "./pages/Operacao";
import Indicadores from "./pages/Indicadores";
import ConfiguracoesConta from "./pages/ConfiguracoesConta";

import ListaColaboradores from "./pages/ListaColaboradores";
import EditarColaborador from "./pages/EditarColaborador";

import Dashboard from "./pages/Dashboard";
import SolicitacaoMovimentacao from "./pages/SolicitacaoMovimentacao";
import MovimentacoesHeadcount from "./pages/MovimentacoesHeadcount";
import NotFound from "./pages/NotFound";

// Configuração do React Query com configurações otimizadas
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (renomeado de cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
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
              <Route path="/operacao" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Operacao />
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
              <Route path="/configuracoes-conta" element={
                <ProtectedRoute>
                  <AppLayout>
                    <ConfiguracoesConta />
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
              <Route path="/movimentacoes-headcount" element={
                <ProtectedRoute>
                  <AppLayout>
                    <MovimentacoesHeadcount />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
