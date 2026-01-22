import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export interface ConfiguracaoCampo {
  id: string
  campo_pai: string
  valor_pai: string
  campo_filho: string
  valores_permitidos: string[]
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface CampoDefinicao {
  key: string
  label: string
  valores: string[]
}

// Definição de todos os campos do cadastro com seus valores possíveis
export const CAMPOS_CADASTRO: CampoDefinicao[] = [
  {
    key: "setor",
    label: "Setor",
    valores: [
      "Armazenagem", "Conferência", "Controle dos pedidos", "Coordenação",
      "Embalagem", "Encarregado", "Expedição", "Garantia", "Inventário",
      "Logística", "Operador de empilhadeira", "Recebimento", "Ressuprimento",
      "Retira", "SAC", "Separação", "Separação Retira", "Supervisão"
    ]
  },
  {
    key: "subsetor",
    label: "Subsetor",
    valores: [
      "Estado", "Gaiola/Retorno estoque", "RAPDO", "Ressuprimento",
      "Transferências", "Transferências/Vendas", "Transportadora"
    ]
  },
  {
    key: "lideranca",
    label: "Liderança",
    valores: [
      "Alexson de Moura Dettmann", "Almir Ribeiro de Queiroz",
      "Arivaldo Arlindo da Silva", "Bruno Martins Euzebio",
      "Carlos Eduardo Cavalcantes da Silva", "Davisson da Costa Rebuli",
      "Josimar Santos Silva", "Klaine Xavier da Silva Martins"
    ]
  },
  {
    key: "turno",
    label: "Turno",
    valores: [
      "06:00 - 15:15", "06:00 - 16:03", "07:00 - 17:03", "08:00 - 17:15",
      "08:00 - 18:03", "10:00 - 20:03", "10:45 - 20:03", "12:00 - 22:03",
      "12:45 - 22:00", "22:00 - 06:52"
    ]
  },
  {
    key: "horario_almoco",
    label: "Horário Almoço",
    valores: [
      "01:30 - 02:45", "11:00 - 12:15", "11:45 - 13:00",
      "12:15 - 13:30", "13:00 - 14:15", "14:45 - 16:00"
    ]
  },
  {
    key: "horario_cafe",
    label: "Horário Café",
    valores: [
      "05:00 - 05:10", "15:00 - 15:10", "15:15 - 15:25",
      "15:30 - 15:40", "17:00 - 17:10", "19:00 - 19:10"
    ]
  },
  {
    key: "cargo",
    label: "Cargo",
    valores: [
      "Analista de Logística Sr", "Assistente de Estoque Jr", "Assistente de Estoque Pl",
      "Coordenador de Logística", "Encarregado de Estoque", "Operador de Empilhadeira Jr",
      "Operador de Empilhadeira Pl", "Repositor de Estoque", "Supervisor de Estoque"
    ]
  },
  {
    key: "sabado_horario",
    label: "Horário Sábado",
    valores: ["08:00 - 12:00", "10:00 - 14:00", "12:00 - 16:00"]
  }
]

export function useConfiguracaoCampos() {
  const { toast } = useToast()
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoCampo[]>([])
  const [loading, setLoading] = useState(true)

  const fetchConfiguracoes = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracao_campos_cadastro')
        .select('*')
        .eq('ativo', true)
        .order('campo_pai', { ascending: true })

      if (error) throw error
      setConfiguracoes(data || [])
    } catch (error: any) {
      console.error('Erro ao buscar configurações:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfiguracoes()
  }, [])

  const criarConfiguracao = async (config: Omit<ConfiguracaoCampo, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('configuracao_campos_cadastro')
        .insert({
          ...config,
          criado_por: user?.id
        })

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Erro",
            description: "Já existe uma regra para esta combinação de campos",
            variant: "destructive"
          })
          return false
        }
        throw error
      }

      toast({
        title: "Sucesso",
        description: "Regra de campo criada com sucesso!"
      })
      
      await fetchConfiguracoes()
      return true
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao criar regra: " + error.message,
        variant: "destructive"
      })
      return false
    }
  }

  const atualizarConfiguracao = async (id: string, updates: Partial<ConfiguracaoCampo>) => {
    try {
      const { error } = await supabase
        .from('configuracao_campos_cadastro')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Regra atualizada com sucesso!"
      })
      
      await fetchConfiguracoes()
      return true
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar regra: " + error.message,
        variant: "destructive"
      })
      return false
    }
  }

  const excluirConfiguracao = async (id: string) => {
    try {
      const { error } = await supabase
        .from('configuracao_campos_cadastro')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Regra excluída com sucesso!"
      })
      
      await fetchConfiguracoes()
      return true
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao excluir regra: " + error.message,
        variant: "destructive"
      })
      return false
    }
  }

  // Função que retorna os valores permitidos para um campo filho baseado no valor do campo pai
  const getValoresPermitidos = (campoPai: string, valorPai: string, campoFilho: string): string[] | null => {
    const config = configuracoes.find(
      c => c.campo_pai === campoPai && 
           c.valor_pai === valorPai && 
           c.campo_filho === campoFilho
    )
    return config?.valores_permitidos || null
  }

  // Função que verifica se um campo deve estar bloqueado (tem regra mas campo pai não foi selecionado)
  const isCampoBloqueado = (campoFilho: string, formData: Record<string, string>): boolean => {
    const regrasParaCampo = configuracoes.filter(c => c.campo_filho === campoFilho)
    
    if (regrasParaCampo.length === 0) return false
    
    // Verifica se algum campo pai necessário está vazio
    for (const regra of regrasParaCampo) {
      if (!formData[regra.campo_pai]) {
        return true
      }
    }
    
    return false
  }

  // Função que retorna os valores filtrados para um campo baseado nas regras configuradas
  const getValoresFiltrados = (campo: string, formData: Record<string, string>): string[] => {
    const campoDefinicao = CAMPOS_CADASTRO.find(c => c.key === campo)
    if (!campoDefinicao) return []

    const regrasParaCampo = configuracoes.filter(c => c.campo_filho === campo)
    
    if (regrasParaCampo.length === 0) {
      return campoDefinicao.valores
    }

    // Encontra regras aplicáveis baseado nos valores dos campos pai
    let valoresFiltrados: string[] | null = null
    
    for (const regra of regrasParaCampo) {
      if (formData[regra.campo_pai] === regra.valor_pai) {
        if (valoresFiltrados === null) {
          valoresFiltrados = [...regra.valores_permitidos]
        } else {
          // Intersecção dos valores se múltiplas regras
          valoresFiltrados = valoresFiltrados.filter(v => regra.valores_permitidos.includes(v))
        }
      }
    }

    return valoresFiltrados || campoDefinicao.valores
  }

  return {
    configuracoes,
    loading,
    criarConfiguracao,
    atualizarConfiguracao,
    excluirConfiguracao,
    getValoresPermitidos,
    isCampoBloqueado,
    getValoresFiltrados,
    refetch: fetchConfiguracoes
  }
}
