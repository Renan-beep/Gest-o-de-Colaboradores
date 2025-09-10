import { supabase } from '@/integrations/supabase/client';

export const updateUserRole = async (email: string, newRole: 'admin' | 'gerencia' | 'encarregado') => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('email', email)
      .select();

    if (error) {
      console.error('Error updating user role:', error);
      return { success: false, error: error.message };
    }

    if (data && data.length > 0) {
      console.log('User role updated successfully:', data[0]);
      return { success: true, data: data[0] };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
};

// Função específica para alterar o Renan para gerente
export const updateRenanToManager = async () => {
  return await updateUserRole('renan.mirandola@outlook.com', 'gerencia');
};