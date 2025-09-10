import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Hook simplificado para operações básicas do Supabase
export const useSupabase = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Função para mostrar toast de erro
  const showError = (message: string) => {
    toast({
      title: 'Erro',
      description: message,
      variant: 'destructive',
    });
  };

  // Função para mostrar toast de sucesso
  const showSuccess = (message: string) => {
    toast({
      title: 'Sucesso',
      description: message,
    });
  };

  return {
    loading,
    setLoading,
    showError,
    showSuccess,
    supabase,
  };
};