import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireGerencia?: boolean;
  requireManagement?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requireGerencia = false,
  requireManagement = false
}) => {
  const { user, loading, isAdmin, isGerencia, isManagement } = useAuth();

  // Show loading while authenticating OR while user permissions are being determined
  if (loading || (user && !isAdmin && !isGerencia && !isManagement && (requireAdmin || requireGerencia || requireManagement))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Only show access denied if we're sure the user doesn't have the required permissions
  // and we're not in a loading state
  if (requireAdmin && !isAdmin && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você precisa de permissões de administrador para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  if (requireGerencia && !isGerencia && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você precisa de permissões de gerência para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  if (requireManagement && !isManagement && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você precisa de permissões de gerência ou encarregado para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};