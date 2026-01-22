import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Save, UserPlus, Settings } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useConfiguracaoCampos, CAMPOS_CADASTRO } from "@/hooks/useConfiguracaoCampos"
import { ConfiguracaoCamposModal } from "@/components/cadastro/ConfiguracaoCamposModal"
import { useAuth } from "@/contexts/AuthContext"

export default function Cadastro() {
  const { toast } = useToast()
  const { isAdmin, isGerencia } = useAuth()
  const [loading, setLoading] = useState(false)
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const { getValoresFiltrados, isCampoBloqueado, configuracoes, refetch: refetchConfiguracoes } = useConfiguracaoCampos()
  
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
    admissao: ""
  })

  // Limpa campos filhos quando o campo pai muda
  useEffect(() => {
    const camposParaLimpar: string[] = []
    
    configuracoes.forEach(config => {
      if (formData[config.campo_pai as keyof typeof formData] !== config.valor_pai) {
        // Se o valor do campo pai não corresponde, verifica se o valor do campo filho é válido
        const valoresPermitidos = getValoresFiltrados(config.campo_filho, formData)
        const valorAtual = formData[config.campo_filho as keyof typeof formData]
        
        if (valorAtual && !valoresPermitidos.includes(valorAtual)) {
          camposParaLimpar.push(config.campo_filho)
        }
      }
    })
    
    if (camposParaLimpar.length > 0) {
      setFormData(prev => {
        const newData = { ...prev }
        camposParaLimpar.forEach(campo => {
          newData[campo as keyof typeof formData] = ""
        })
        return newData
      })
    }
  }, [formData.setor, formData.turno, configuracoes])

  // Verifica se usuário pode configurar (admin ou gerência)
  const podeConfigurar = isAdmin || isGerencia

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
            subsetor: formData.subsetor,
            lideranca: formData.lideranca,
            turno: formData.turno,
            sabado_trabalho: formData.sabado_trabalho,
            sabado_horario: formData.sabado_horario,
            horario_almoco: formData.horario_almoco || null,
            horario_cafe: formData.horario_cafe || null,
            admissao: formData.admissao || null
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
        admissao: ""
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
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Função helper para obter valores de um campo
  const getOpcoesParaCampo = (campo: string): string[] => {
    return getValoresFiltrados(campo, formData)
  }

  // Função helper para verificar se campo está bloqueado
  const campoEstaBloqueado = (campo: string): boolean => {
    return isCampoBloqueado(campo, formData)
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

      <ConfiguracaoCamposModal 
        open={configModalOpen} 
        onOpenChange={setConfigModalOpen}
        onRulesChanged={refetchConfiguracoes}
      />

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Dados do Colaborador</CardTitle>
          <CardDescription>
            Preencha as informações básicas do colaborador
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
                  type="number"
                  placeholder="Ex: 12345"
                  value={formData.matricula}
                  onChange={(e) => handleChange("matricula", e.target.value)}
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
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Afastado">Afastado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cargo */}
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo *</Label>
                <Select 
                  value={formData.cargo} 
                  onValueChange={(value) => handleChange("cargo", value)}
                  disabled={campoEstaBloqueado("cargo")}
                >
                  <SelectTrigger className={campoEstaBloqueado("cargo") ? "opacity-50" : ""}>
                    <SelectValue placeholder={campoEstaBloqueado("cargo") ? "Selecione o campo pai primeiro" : "Selecione o cargo"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getOpcoesParaCampo("cargo").map(valor => (
                      <SelectItem key={valor} value={valor}>{valor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Setor */}
              <div className="space-y-2">
                <Label htmlFor="setor">Setor *</Label>
                <Select value={formData.setor} onValueChange={(value) => handleChange("setor", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Armazenagem">Armazenagem</SelectItem>
                    <SelectItem value="Conferência">Conferência</SelectItem>
                    <SelectItem value="Controle dos pedidos">Controle dos pedidos</SelectItem>
                    <SelectItem value="Coordenação">Coordenação</SelectItem>
                    <SelectItem value="Embalagem">Embalagem</SelectItem>
                    <SelectItem value="Encarregado">Encarregado</SelectItem>
                    <SelectItem value="Expedição">Expedição</SelectItem>
                    <SelectItem value="Garantia">Garantia</SelectItem>
                    <SelectItem value="Inventário">Inventário</SelectItem>
                    <SelectItem value="Logística">Logística</SelectItem>
                    <SelectItem value="Operador de empilhadeira">Operador de empilhadeira</SelectItem>
                    <SelectItem value="Recebimento">Recebimento</SelectItem>
                    <SelectItem value="Ressuprimento">Ressuprimento</SelectItem>
                    <SelectItem value="Retira">Retira</SelectItem>
                    <SelectItem value="SAC">SAC</SelectItem>
                    <SelectItem value="Separação">Separação</SelectItem>
                    <SelectItem value="Separação Retira">Separação Retira</SelectItem>
                    <SelectItem value="Supervisão">Supervisão</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subsetor */}
              <div className="space-y-2">
                <Label htmlFor="subsetor">Subsetor (opcional)</Label>
                <Select 
                  value={formData.subsetor} 
                  onValueChange={(value) => handleChange("subsetor", value)}
                  disabled={campoEstaBloqueado("subsetor")}
                >
                  <SelectTrigger className={campoEstaBloqueado("subsetor") ? "opacity-50" : ""}>
                    <SelectValue placeholder={campoEstaBloqueado("subsetor") ? "Selecione o campo pai primeiro" : "Selecione o subsetor"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getOpcoesParaCampo("subsetor").map(valor => (
                      <SelectItem key={valor} value={valor}>{valor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Liderança */}
              <div className="space-y-2">
                <Label htmlFor="lideranca">Liderança *</Label>
                <Select 
                  value={formData.lideranca} 
                  onValueChange={(value) => handleChange("lideranca", value)}
                  disabled={campoEstaBloqueado("lideranca")}
                >
                  <SelectTrigger className={campoEstaBloqueado("lideranca") ? "opacity-50" : ""}>
                    <SelectValue placeholder={campoEstaBloqueado("lideranca") ? "Selecione o campo pai primeiro" : "Selecione a liderança"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getOpcoesParaCampo("lideranca").map(valor => (
                      <SelectItem key={valor} value={valor}>{valor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Turno */}
              <div className="space-y-2">
                <Label htmlFor="turno">Turno *</Label>
                <Select 
                  value={formData.turno} 
                  onValueChange={(value) => handleChange("turno", value)}
                  disabled={campoEstaBloqueado("turno")}
                >
                  <SelectTrigger className={campoEstaBloqueado("turno") ? "opacity-50" : ""}>
                    <SelectValue placeholder={campoEstaBloqueado("turno") ? "Selecione o campo pai primeiro" : "Selecione o turno"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getOpcoesParaCampo("turno").map(valor => (
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
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sábado Horário - só aparece se trabalha sábado */}
              {formData.sabado_trabalho === "Sim" && (
                <div className="space-y-2">
                  <Label htmlFor="sabado_horario">Sábado *</Label>
                  <Select 
                    value={formData.sabado_horario} 
                    onValueChange={(value) => handleChange("sabado_horario", value)}
                    disabled={campoEstaBloqueado("sabado_horario")}
                  >
                    <SelectTrigger className={campoEstaBloqueado("sabado_horario") ? "opacity-50" : ""}>
                      <SelectValue placeholder={campoEstaBloqueado("sabado_horario") ? "Selecione o campo pai primeiro" : "Selecione o horário"} />
                    </SelectTrigger>
                    <SelectContent>
                      {getOpcoesParaCampo("sabado_horario").map(valor => (
                        <SelectItem key={valor} value={valor}>{valor}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Horário Almoço */}
              <div className="space-y-2">
                <Label htmlFor="horario_almoco">Horário almoço *</Label>
                <Select 
                  value={formData.horario_almoco} 
                  onValueChange={(value) => handleChange("horario_almoco", value)}
                  disabled={campoEstaBloqueado("horario_almoco")}
                >
                  <SelectTrigger className={campoEstaBloqueado("horario_almoco") ? "opacity-50" : ""}>
                    <SelectValue placeholder={campoEstaBloqueado("horario_almoco") ? "Selecione o campo pai primeiro" : "Selecione o horário"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getOpcoesParaCampo("horario_almoco").map(valor => (
                      <SelectItem key={valor} value={valor}>{valor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Horário Café */}
              <div className="space-y-2">
                <Label htmlFor="horario_cafe">Horário café *</Label>
                <Select 
                  value={formData.horario_cafe} 
                  onValueChange={(value) => handleChange("horario_cafe", value)}
                  disabled={campoEstaBloqueado("horario_cafe")}
                >
                  <SelectTrigger className={campoEstaBloqueado("horario_cafe") ? "opacity-50" : ""}>
                    <SelectValue placeholder={campoEstaBloqueado("horario_cafe") ? "Selecione o campo pai primeiro" : "Selecione o horário"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getOpcoesParaCampo("horario_cafe").map(valor => (
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
                  admissao: ""
                })}
              >
                Limpar Formulário
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}