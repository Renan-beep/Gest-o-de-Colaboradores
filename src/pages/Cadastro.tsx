import { useState, useEffect, useMemo } from "react"
import { PageTour } from "@/components/onboarding/PageTour"
import { cadastroTourSteps } from "@/constants/tourSteps"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Save, UserPlus, Settings } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useOpcoesCampos } from "@/hooks/useOpcoesCampos"
import { useCadastroInterdependente } from "@/hooks/useCadastroInterdependente"
import { ConfiguracaoOpcoesModal } from "@/components/cadastro/ConfiguracaoOpcoesModal"
import { useAuth } from "@/contexts/AuthContext"

export default function Cadastro() {
  const { toast } = useToast()
  const { isAdmin, isGerencia } = useAuth()
  const [loading, setLoading] = useState(false)
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const { getOpcoesPorCampo, refetch: refetchOpcoes } = useOpcoesCampos()
  
  const [formData, setFormData] = useState({
    matricula: "",
    colaborador: "",
    sexo: "",
    status: "",
    cargo: "",
    setor: "",
    subsetor: "",
    lideranca: "",
    turno: "",
    sabado_trabalho: "",
    sabado_horario: "",
    horario_almoco: "",
    horario_cafe: "",
    admissao: "",
  })

  // Hook para filtros interdependentes baseados nos colaboradores existentes
  const { opcoesDinamicas, loading: loadingColaboradores } = useCadastroInterdependente(formData)

  // Verifica se usuário pode configurar (admin ou gerência)
  const podeConfigurar = isAdmin || isGerencia

  // Limpa campos dependentes quando um campo pai muda
  useEffect(() => {
    // Quando um campo é alterado, verificar se os valores selecionados ainda são válidos
    const camposParaLimpar: string[] = []
    
    const campos = ['cargo', 'setor', 'subsetor', 'lideranca', 'turno', 'sabado_horario', 'horario_almoco', 'horario_cafe'] as const
    
    for (const campo of campos) {
      const valorAtual = formData[campo]
      if (valorAtual && !opcoesDinamicas[campo].includes(valorAtual)) {
        camposParaLimpar.push(campo)
      }
    }
    
    if (camposParaLimpar.length > 0) {
      setFormData(prev => {
        const newData = { ...prev }
        camposParaLimpar.forEach(campo => {
          (newData as Record<string, string | boolean>)[campo] = ""
        })
        return newData
      })
    }
  }, [opcoesDinamicas])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação - todos os campos obrigatórios exceto subsetor
    const camposObrigatorios = [
      { campo: 'matricula', nome: 'Matrícula' },
      { campo: 'colaborador', nome: 'Nome do Colaborador' },
      { campo: 'sexo', nome: 'Sexo' },
      { campo: 'status', nome: 'Status' },
      { campo: 'cargo', nome: 'Cargo' },
      { campo: 'setor', nome: 'Setor' },
      { campo: 'lideranca', nome: 'Liderança' },
      { campo: 'turno', nome: 'Turno' },
      { campo: 'sabado_trabalho', nome: 'Sábado trabalho' },
      { campo: 'horario_almoco', nome: 'Horário almoço' },
      { campo: 'horario_cafe', nome: 'Horário café' },
      { campo: 'admissao', nome: 'Admissão' },
    ]

    // Adiciona validação do horário de sábado se trabalha aos sábados
    if (formData.sabado_trabalho === "Sim") {
      camposObrigatorios.push({ campo: 'sabado_horario', nome: 'Horário de sábado' })
    }

    const camposFaltando = camposObrigatorios.filter(
      ({ campo }) => !formData[campo as keyof typeof formData]
    )

    if (formData.matricula && !/^\d+$/.test(formData.matricula)) {
      toast({ title: "Erro", description: "Matrícula deve conter apenas números", variant: "destructive" })
      return
    }

    if (camposFaltando.length > 0) {
      toast({
        title: "Erro",
        description: `Preencha os campos obrigatórios: ${camposFaltando.map(c => c.nome).join(', ')}`,
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('colaboradores')
        .insert([
          {
            matricula: formData.matricula,
            colaborador: formData.colaborador,
            sexo: formData.sexo || null,
            status: formData.status || 'Ativo',
            cargo: formData.cargo,
            setor: formData.setor,
            subsetor: formData.subsetor || null,
            lideranca: formData.lideranca,
            turno: formData.turno,
            sabado_trabalho: formData.sabado_trabalho,
            sabado_horario: formData.sabado_horario || null,
            horario_almoco: formData.horario_almoco || null,
            horario_cafe: formData.horario_cafe || null,
            admissao: formData.admissao || null,
            rapdo: formData.rapdo
          }
        ])

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao cadastrar colaborador: " + error.message,
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Sucesso",
        description: "Colaborador cadastrado com sucesso!",
      })
      
      // Reset form
      setFormData({
        matricula: "",
        colaborador: "",
        sexo: "",
        status: "",
        cargo: "",
        setor: "",
        subsetor: "",
        lideranca: "",
        turno: "",
        sabado_trabalho: "",
        sabado_horario: "",
        horario_almoco: "",
        horario_cafe: "",
        admissao: "",
        rapdo: false
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao cadastrar colaborador",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value === "__empty__" ? "" : value }))
  }

  // Obtém opções para um campo, com contador se filtradas
  const getOpcoesComContador = (campo: string) => {
    const opcoesBase = getOpcoesPorCampo(campo)
    const opcoesFiltradas = opcoesDinamicas[campo as keyof typeof opcoesDinamicas] || []
    
    // Se há seleções em outros campos, mostrar apenas opções compatíveis
    const temSelecaoEmOutrosCampo = ['cargo', 'setor', 'subsetor', 'lideranca', 'turno', 'sabado_horario', 'horario_almoco', 'horario_cafe']
      .filter(c => c !== campo)
      .some(c => formData[c as keyof typeof formData])
    
    if (temSelecaoEmOutrosCampo) {
      return {
        opcoes: opcoesFiltradas,
        total: opcoesBase.length,
        filtradas: opcoesFiltradas.length
      }
    }
    
    return {
      opcoes: opcoesBase.length > 0 ? opcoesBase : opcoesFiltradas,
      total: opcoesBase.length || opcoesFiltradas.length,
      filtradas: opcoesBase.length || opcoesFiltradas.length
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserPlus className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Cadastro de Colaboradores</h1>
            <p className="text-muted-foreground">Adicione novos colaboradores ao sistema</p>
          </div>
        </div>
        
        {podeConfigurar && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setConfigModalOpen(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurar Campos
          </Button>
        )}
      </div>

      <ConfiguracaoOpcoesModal 
        open={configModalOpen} 
        onOpenChange={setConfigModalOpen}
        onOptionsChanged={refetchOpcoes}
      />

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Dados do Colaborador</CardTitle>
          <CardDescription>
            Preencha as informações básicas do colaborador. Os campos se filtram automaticamente baseado nas combinações existentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Matrícula */}
              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula *</Label>
                <Input
                  id="matricula"
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex: 12345"
                  value={formData.matricula}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    handleChange("matricula", val)
                  }}
                />
              </div>

              {/* Nome do Colaborador */}
              <div className="space-y-2">
                <Label htmlFor="colaborador">Nome do Colaborador *</Label>
                <Input
                  id="colaborador"
                  placeholder="Ex: João Silva"
                  value={formData.colaborador}
                  onChange={(e) => handleChange("colaborador", e.target.value)}
                />
              </div>

              {/* Sexo */}
              <div className="space-y-2">
                <Label htmlFor="sexo">Sexo *</Label>
                <Select value={formData.sexo} onValueChange={(value) => handleChange("sexo", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o sexo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">(Vazio)</SelectItem>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">(Vazio)</SelectItem>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Afastado">Afastado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* RAPDO */}
              <div className="space-y-2">
                <Label htmlFor="rapdo">RAPDO</Label>
                <div className="flex items-center space-x-3 h-10">
                  <Switch
                    id="rapdo"
                    checked={formData.rapdo}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, rapdo: checked }))}
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.rapdo ? "Ativado" : "Desativado"}
                  </span>
                </div>
              </div>

              {/* Setor - Campo principal */}
              <div className="space-y-2">
                <Label htmlFor="setor">
                  Setor * 
                  {getOpcoesComContador("setor").filtradas !== getOpcoesComContador("setor").total && (
                    <span className="text-muted-foreground ml-1">
                      ({getOpcoesComContador("setor").filtradas})
                    </span>
                  )}
                </Label>
                <Select value={formData.setor} onValueChange={(value) => handleChange("setor", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">(Vazio)</SelectItem>
                    {getOpcoesComContador("setor").opcoes.map(valor => (
                      <SelectItem key={valor} value={valor}>{valor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subsetor */}
              <div className="space-y-2">
                <Label htmlFor="subsetor">
                  Subsetor (opcional)
                  {getOpcoesComContador("subsetor").filtradas !== getOpcoesComContador("subsetor").total && (
                    <span className="text-muted-foreground ml-1">
                      ({getOpcoesComContador("subsetor").filtradas})
                    </span>
                  )}
                </Label>
                <Select value={formData.subsetor} onValueChange={(value) => handleChange("subsetor", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o subsetor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">(Vazio)</SelectItem>
                    {getOpcoesComContador("subsetor").opcoes.map(valor => (
                      <SelectItem key={valor} value={valor}>{valor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Liderança */}
              <div className="space-y-2">
                <Label htmlFor="lideranca">
                  Liderança *
                  {getOpcoesComContador("lideranca").filtradas !== getOpcoesComContador("lideranca").total && (
                    <span className="text-muted-foreground ml-1">
                      ({getOpcoesComContador("lideranca").filtradas})
                    </span>
                  )}
                </Label>
                <Select value={formData.lideranca} onValueChange={(value) => handleChange("lideranca", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a liderança" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">(Vazio)</SelectItem>
                    {getOpcoesComContador("lideranca").opcoes.map(valor => (
                      <SelectItem key={valor} value={valor}>{valor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cargo */}
              <div className="space-y-2">
                <Label htmlFor="cargo">
                  Cargo *
                  {getOpcoesComContador("cargo").filtradas !== getOpcoesComContador("cargo").total && (
                    <span className="text-muted-foreground ml-1">
                      ({getOpcoesComContador("cargo").filtradas})
                    </span>
                  )}
                </Label>
                <Select value={formData.cargo} onValueChange={(value) => handleChange("cargo", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">(Vazio)</SelectItem>
                    {getOpcoesComContador("cargo").opcoes.map(valor => (
                      <SelectItem key={valor} value={valor}>{valor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Turno */}
              <div className="space-y-2">
                <Label htmlFor="turno">
                  Turno *
                  {getOpcoesComContador("turno").filtradas !== getOpcoesComContador("turno").total && (
                    <span className="text-muted-foreground ml-1">
                      ({getOpcoesComContador("turno").filtradas})
                    </span>
                  )}
                </Label>
                <Select value={formData.turno} onValueChange={(value) => handleChange("turno", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">(Vazio)</SelectItem>
                    {getOpcoesComContador("turno").opcoes.map(valor => (
                      <SelectItem key={valor} value={valor}>{valor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sábado Trabalho */}
              <div className="space-y-2">
                <Label htmlFor="sabado_trabalho">Sábado trabalho *</Label>
                <Select value={formData.sabado_trabalho} onValueChange={(value) => handleChange("sabado_trabalho", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">(Vazio)</SelectItem>
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sábado Horário - só aparece se trabalha sábado */}
              {formData.sabado_trabalho === "Sim" && (
                <div className="space-y-2">
                  <Label htmlFor="sabado_horario">
                    Horário Sábado *
                    {getOpcoesComContador("sabado_horario").filtradas !== getOpcoesComContador("sabado_horario").total && (
                      <span className="text-muted-foreground ml-1">
                        ({getOpcoesComContador("sabado_horario").filtradas})
                      </span>
                    )}
                  </Label>
                  <Select value={formData.sabado_horario} onValueChange={(value) => handleChange("sabado_horario", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o horário" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="__empty__">(Vazio)</SelectItem>
                      {getOpcoesComContador("sabado_horario").opcoes.map(valor => (
                        <SelectItem key={valor} value={valor}>{valor}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Horário Almoço */}
              <div className="space-y-2">
                <Label htmlFor="horario_almoco">
                  Horário almoço *
                  {getOpcoesComContador("horario_almoco").filtradas !== getOpcoesComContador("horario_almoco").total && (
                    <span className="text-muted-foreground ml-1">
                      ({getOpcoesComContador("horario_almoco").filtradas})
                    </span>
                  )}
                </Label>
                <Select value={formData.horario_almoco} onValueChange={(value) => handleChange("horario_almoco", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">(Vazio)</SelectItem>
                    {getOpcoesComContador("horario_almoco").opcoes.map(valor => (
                      <SelectItem key={valor} value={valor}>{valor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Horário Café */}
              <div className="space-y-2">
                <Label htmlFor="horario_cafe">
                  Horário café *
                  {getOpcoesComContador("horario_cafe").filtradas !== getOpcoesComContador("horario_cafe").total && (
                    <span className="text-muted-foreground ml-1">
                      ({getOpcoesComContador("horario_cafe").filtradas})
                    </span>
                  )}
                </Label>
                <Select value={formData.horario_cafe} onValueChange={(value) => handleChange("horario_cafe", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">(Vazio)</SelectItem>
                    {getOpcoesComContador("horario_cafe").opcoes.map(valor => (
                      <SelectItem key={valor} value={valor}>{valor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Data de Admissão */}
              <div className="space-y-2">
                <Label htmlFor="admissao">Admissão *</Label>
                <Input
                  id="admissao"
                  type="date"
                  value={formData.admissao}
                  onChange={(e) => handleChange("admissao", e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button type="submit" className="flex-1 sm:flex-none" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Salvando..." : "Salvar Colaborador"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setFormData({
                  matricula: "",
                  colaborador: "",
                  sexo: "",
                  status: "",
                  cargo: "",
                  setor: "",
                  subsetor: "",
                  lideranca: "",
                  turno: "",
                  sabado_trabalho: "",
                  sabado_horario: "",
                  horario_almoco: "",
                  horario_cafe: "",
                  admissao: "",
                  rapdo: false
                })}
              >
                Limpar Formulário
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <PageTour steps={cadastroTourSteps} />
    </div>
  )
}
