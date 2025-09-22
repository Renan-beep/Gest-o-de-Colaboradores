import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Save, UserPlus } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

export default function Cadastro() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    matricula: "",
    colaborador: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação básica
    if (!formData.matricula || !formData.colaborador) {
      toast({
        title: "Erro",
        description: "Matrícula e nome do colaborador são obrigatórios",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UserPlus className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Cadastro de Colaboradores</h1>
          <p className="text-muted-foreground">Adicione novos colaboradores ao sistema</p>
        </div>
      </div>

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

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
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
                <Label htmlFor="cargo">Cargo</Label>
                <Select value={formData.cargo} onValueChange={(value) => handleChange("cargo", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Analista de Logística Sr">Analista de Logística Sr</SelectItem>
                    <SelectItem value="Assistente de Estoque Jr">Assistente de Estoque Jr</SelectItem>
                    <SelectItem value="Assistente de Estoque Pl">Assistente de Estoque Pl</SelectItem>
                    <SelectItem value="Coordenador de Logística">Coordenador de Logística</SelectItem>
                    <SelectItem value="Encarregado de Estoque">Encarregado de Estoque</SelectItem>
                    <SelectItem value="Operador de Empilhadeira Jr">Operador de Empilhadeira Jr</SelectItem>
                    <SelectItem value="Operador de Empilhadeira Pl">Operador de Empilhadeira Pl</SelectItem>
                    <SelectItem value="Repositor de Estoque">Repositor de Estoque</SelectItem>
                    <SelectItem value="Supervisor de Estoque">Supervisor de Estoque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Setor */}
              <div className="space-y-2">
                <Label htmlFor="setor">Setor</Label>
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
                <Select value={formData.subsetor} onValueChange={(value) => handleChange("subsetor", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o subsetor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Estado">Estado</SelectItem>
                    <SelectItem value="Gaiola/Retorno estoque">Gaiola/Retorno estoque</SelectItem>
                    <SelectItem value="RAPDO">RAPDO</SelectItem>
                    <SelectItem value="Ressuprimento">Ressuprimento</SelectItem>
                    <SelectItem value="Transferências">Transferências</SelectItem>
                    <SelectItem value="Transferências/Vendas">Transferências/Vendas</SelectItem>
                    <SelectItem value="Transportadora">Transportadora</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Liderança */}
              <div className="space-y-2">
                <Label htmlFor="lideranca">Liderança</Label>
                <Select value={formData.lideranca} onValueChange={(value) => handleChange("lideranca", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a liderança" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alexson de Moura Dettmann">Alexson de Moura Dettmann</SelectItem>
                    <SelectItem value="Almir Ribeiro de Queiroz">Almir Ribeiro de Queiroz</SelectItem>
                    <SelectItem value="Arivaldo Arlindo da Silva">Arivaldo Arlindo da Silva</SelectItem>
                    <SelectItem value="Bruno Martins Euzebio">Bruno Martins Euzebio</SelectItem>
                    <SelectItem value="Carlos Eduardo Cavalcantes da Silva">Carlos Eduardo Cavalcantes da Silva</SelectItem>
                    <SelectItem value="Davisson da Costa Rebuli">Davisson da Costa Rebuli</SelectItem>
                    <SelectItem value="Josimar Santos Silva">Josimar Santos Silva</SelectItem>
                    <SelectItem value="Klaine Xavier da Silva Martins">Klaine Xavier da Silva Martins</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Turno */}
              <div className="space-y-2">
                <Label htmlFor="turno">Turno</Label>
                <Select value={formData.turno} onValueChange={(value) => handleChange("turno", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="06:00 - 15:15">06:00 - 15:15</SelectItem>
                    <SelectItem value="06:00 - 16:03">06:00 - 16:03</SelectItem>
                    <SelectItem value="07:00 - 17:03">07:00 - 17:03</SelectItem>
                    <SelectItem value="08:00 - 17:15">08:00 - 17:15</SelectItem>
                    <SelectItem value="08:00 - 18:03">08:00 - 18:03</SelectItem>
                    <SelectItem value="10:00 - 20:03">10:00 - 20:03</SelectItem>
                    <SelectItem value="10:45 - 20:03">10:45 - 20:03</SelectItem>
                    <SelectItem value="12:00 - 22:03">12:00 - 22:03</SelectItem>
                    <SelectItem value="12:45 - 22:00">12:45 - 22:00</SelectItem>
                    <SelectItem value="22:00 - 06:52">22:00 - 06:52</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sábado Trabalho */}
              <div className="space-y-2">
                <Label htmlFor="sabado_trabalho">Sábado trabalho</Label>
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
                  <Label htmlFor="sabado_horario">Sábado</Label>
                  <Select value={formData.sabado_horario} onValueChange={(value) => handleChange("sabado_horario", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o horário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="08:00 - 12:00">08:00 - 12:00</SelectItem>
                      <SelectItem value="10:00 - 14:00">10:00 - 14:00</SelectItem>
                      <SelectItem value="12:00 - 16:00">12:00 - 16:00</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Horário Almoço */}
              <div className="space-y-2">
                <Label htmlFor="horario_almoco">Horário almoço</Label>
                <Select value={formData.horario_almoco} onValueChange={(value) => handleChange("horario_almoco", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="01:30 - 02:45">01:30 - 02:45</SelectItem>
                    <SelectItem value="11:00 - 12:15">11:00 - 12:15</SelectItem>
                    <SelectItem value="11:45 - 13:00">11:45 - 13:00</SelectItem>
                    <SelectItem value="12:15 - 13:30">12:15 - 13:30</SelectItem>
                    <SelectItem value="13:00 - 14:15">13:00 - 14:15</SelectItem>
                    <SelectItem value="14:45 - 16:00">14:45 - 16:00</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Horário Café */}
              <div className="space-y-2">
                <Label htmlFor="horario_cafe">Horário café</Label>
                <Select value={formData.horario_cafe} onValueChange={(value) => handleChange("horario_cafe", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="05:00 - 05:10">05:00 - 05:10</SelectItem>
                    <SelectItem value="15:00 - 15:10">15:00 - 15:10</SelectItem>
                    <SelectItem value="15:15 - 15:25">15:15 - 15:25</SelectItem>
                    <SelectItem value="15:30 - 15:40">15:30 - 15:40</SelectItem>
                    <SelectItem value="17:00 - 17:10">17:00 - 17:10</SelectItem>
                    <SelectItem value="19:00 - 19:10">19:00 - 19:10</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Data de Admissão */}
              <div className="space-y-2">
                <Label htmlFor="admissao">Admissão</Label>
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