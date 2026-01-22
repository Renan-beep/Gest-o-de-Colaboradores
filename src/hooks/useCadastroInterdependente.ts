import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/integrations/supabase/client"

export interface ColaboradorParaFiltro {
  cargo: string | null
  setor: string | null
  subsetor: string | null
  lideranca: string | null
  turno: string | null
  sabado_horario: string | null
  horario_almoco: string | null
  horario_cafe: string | null
}

interface FormData {
  cargo: string
  setor: string
  subsetor: string
  lideranca: string
  turno: string
  sabado_horario: string
  horario_almoco: string
  horario_cafe: string
  rapdo?: boolean
  [key: string]: string | boolean | undefined
}

const CAMPOS_INTERDEPENDENTES = [
  'cargo', 'setor', 'subsetor', 'lideranca', 'turno', 
  'sabado_horario', 'horario_almoco', 'horario_cafe'
] as const

type CampoInterdependente = typeof CAMPOS_INTERDEPENDENTES[number]

export function useCadastroInterdependente(formData: FormData) {
  const [colaboradores, setColaboradores] = useState<ColaboradorParaFiltro[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchColaboradores = async () => {
      try {
        const { data, error } = await supabase
          .from('colaboradores')
          .select('cargo, setor, subsetor, lideranca, turno, sabado_horario, horario_almoco, horario_cafe')

        if (error) throw error
        setColaboradores(data || [])
      } catch (error) {
        console.error('Erro ao buscar colaboradores:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchColaboradores()
  }, [])

  // Função para filtrar colaboradores com base nos campos selecionados, excluindo um campo específico
  const getColaboradoresFiltrados = (excluirCampo: CampoInterdependente): ColaboradorParaFiltro[] => {
    return colaboradores.filter(colab => {
      for (const campo of CAMPOS_INTERDEPENDENTES) {
        if (campo === excluirCampo) continue
        const valorForm = formData[campo]
        if (valorForm && colab[campo] !== valorForm) {
          return false
        }
      }
      return true
    })
  }

  // Calcula opções dinâmicas para cada campo
  const opcoesDinamicas = useMemo(() => {
    const result: Record<CampoInterdependente, string[]> = {
      cargo: [],
      setor: [],
      subsetor: [],
      lideranca: [],
      turno: [],
      sabado_horario: [],
      horario_almoco: [],
      horario_cafe: []
    }

    for (const campo of CAMPOS_INTERDEPENDENTES) {
      const colabsFiltrados = getColaboradoresFiltrados(campo)
      const valores = new Set<string>()
      
      colabsFiltrados.forEach(colab => {
        const valor = colab[campo]
        if (valor && valor.trim()) {
          valores.add(valor)
        }
      })
      
      result[campo] = Array.from(valores).sort()
    }

    return result
  }, [colaboradores, formData.cargo, formData.setor, formData.subsetor, formData.lideranca, formData.turno, formData.sabado_horario, formData.horario_almoco, formData.horario_cafe])

  return {
    loading,
    opcoesDinamicas,
    totalColaboradores: colaboradores.length
  }
}
