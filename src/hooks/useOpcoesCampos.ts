import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export interface OpcaoCampo {
  id: string
  campo: string
  valor: string
  ativo: boolean
  ordem: number
  created_at: string
  updated_at: string
}

export const CAMPOS_CONFIGURÁVEIS = [
  { key: "cargo", label: "Cargo" },
  { key: "setor", label: "Setor" },
  { key: "subsetor", label: "Subsetor" },
  { key: "lideranca", label: "Liderança" },
  { key: "turno", label: "Turno" },
  { key: "sabado_horario", label: "Horário Sábado" },
  { key: "horario_almoco", label: "Horário Almoço" },
  { key: "horario_cafe", label: "Horário Café" }
]

export function useOpcoesCampos() {
  const { toast } = useToast()
  const [opcoes, setOpcoes] = useState<OpcaoCampo[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOpcoes = async () => {
    try {
      const { data, error } = await supabase
        .from('opcoes_campos_cadastro')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true })

      if (error) throw error
      setOpcoes(data || [])
    } catch (error: any) {
      console.error('Erro ao buscar opções:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOpcoes()
  }, [])

  const getOpcoesPorCampo = (campo: string): string[] => {
    return opcoes
      .filter(o => o.campo === campo)
      .map(o => o.valor)
  }

  const adicionarOpcao = async (campo: string, valor: string) => {
    try {
      const maxOrdem = opcoes
        .filter(o => o.campo === campo)
        .reduce((max, o) => Math.max(max, o.ordem), 0)

      const { error } = await supabase
        .from('opcoes_campos_cadastro')
        .insert({ campo, valor, ordem: maxOrdem + 1 })

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Erro",
            description: "Esta opção já existe para este campo",
            variant: "destructive"
          })
          return false
        }
        throw error
      }

      toast({
        title: "Sucesso",
        description: "Opção adicionada com sucesso!"
      })
      
      await fetchOpcoes()
      return true
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar opção: " + error.message,
        variant: "destructive"
      })
      return false
    }
  }

  const removerOpcao = async (id: string) => {
    try {
      const { error } = await supabase
        .from('opcoes_campos_cadastro')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Opção removida com sucesso!"
      })
      
      await fetchOpcoes()
      return true
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao remover opção: " + error.message,
        variant: "destructive"
      })
      return false
    }
  }

  const atualizarOrdem = async (id: string, novaOrdem: number) => {
    try {
      const { error } = await supabase
        .from('opcoes_campos_cadastro')
        .update({ ordem: novaOrdem })
        .eq('id', id)

      if (error) throw error
      await fetchOpcoes()
      return true
    } catch (error: any) {
      console.error('Erro ao atualizar ordem:', error)
      return false
    }
  }

  return {
    opcoes,
    loading,
    getOpcoesPorCampo,
    adicionarOpcao,
    removerOpcao,
    atualizarOrdem,
    refetch: fetchOpcoes
  }
}
