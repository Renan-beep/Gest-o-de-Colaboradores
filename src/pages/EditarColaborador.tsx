import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { User, Save, ArrowLeft, Clock, Calendar, Trash2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { useOpcoesCampos } from "@/hooks/useOpcoesCampos"

interface ColaboradorForm {
  matricula: string
  colaborador: string
  status: string
  cargo: string
  setor: string
  subsetor: string
  lideranca: string
  turno: string
  sabado_trabalho: string
  sabado_horario: string
  horario_almoco: string
  horario_cafe: string
  admissao: string
  sexo: string
}

export default function EditarColaborador() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { isGerencia } = useAuth()
  const { getOpcoesPorCampo } = useOpcoesCampos()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const [showDismissalDialog, setShowDismissalDialog] = useState(false)
  const [dismissalReason, setDismissalReason] = useState("")
  const [dismissing, setDismissing] = useState(false)
  const [formData, setFormData] = useState<ColaboradorForm>({
    matricula: "",
    colaborador: "",
    status: "Ativo",
    cargo: "",
    setor: "",
    subsetor: "",
    lideranca: "",
    turno: "",
    sabado_trabalho: "Não",
    sabado_horario: "",
    horario_almoco: "",
    horario_cafe: "",
    admissao: "",
    sexo: ""
  })

  useEffect(() => {
    if (id) {
      fetchColaborador()
    }
  }, [id])

  const fetchColaborador = async () => {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do colaborador: " + error.message,
          variant: "destructive"
        })
        navigate('/lista-colaboradores')
        return
      }

      if (data) {
        setFormData({
          matricula: data.matricula || "",
          colaborador: data.colaborador || "",
          status: data.status || "Ativo",
          cargo: data.cargo || "",
          setor: data.setor || "",
          subsetor: data.subsetor || "",
          lideranca: data.lideranca || "",
          turno: data.turno ? data.turno.replace(/[()]/g, '') : "",
          sabado_trabalho: data.sabado_trabalho || "Não",
          sabado_horario: data.sabado_horario || "",
          horario_almoco: data.horario_almoco ? data.horario_almoco.replace(/[()]/g, '') : "",
          horario_cafe: data.horario_cafe ? data.horario_cafe.replace(/[()]/g, '') : "",
          admissao: data.admissao || "",
          sexo: data.sexo || ""
        })
        setLastUpdated(data.updated_at || data.created_at || "")
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar dados",
        variant: "destructive"
      })
      navigate('/lista-colaboradores')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof ColaboradorForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value === "__empty__" ? "" : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.matricula || !formData.colaborador) {
      toast({
        title: "Erro",
        description: "Matrícula e nome do colaborador são obrigatórios",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('colaboradores')
        .update({
          matricula: formData.matricula,
          colaborador: formData.colaborador,
          status: formData.status,
          cargo: formData.cargo || null,
          setor: formData.setor || null,
          subsetor: formData.subsetor || null,
          lideranca: formData.lideranca || null,
          turno: formData.turno || null,
          sabado_trabalho: formData.sabado_trabalho || null,
          sabado_horario: formData.sabado_horario || null,
          horario_almoco: formData.horario_almoco || null,
          horario_cafe: formData.horario_cafe || null,
          admissao: formData.admissao || null,
          sexo: formData.sexo || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao atualizar colaborador: " + error.message,
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Sucesso",
        description: "Colaborador atualizado com sucesso!",
        duration: 3000,
      })

      navigate('/lista-colaboradores')
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar colaborador",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDismissal = async () => {
    if (!dismissalReason) {
      toast({
        title: "Erro",
        description: "Por favor, selecione o motivo da demissão",
        variant: "destructive"
      })
      return
    }

    setDismissing(true)
    try {
      // Mapear motivo para tipo_demissao
      const tipoMap: Record<string, string> = {
        "Abandono de emprego": "justa_causa",
        "Fim antecipado/contrato Empregado": "pedido",
        "Fim antecipado/contrato Empresa": "sem_justa_causa",
        "Fim do contrato de trabalho": "fim_contrato",
        "Iniciativa colaborador": "pedido",
        "Iniciativa empregadora/sem justa causa": "sem_justa_causa",
        "Iniciativa empresa/com justa causa": "justa_causa",
        "Iniciativa empresa/sem justa causa": "sem_justa_causa",
      }

      const tipoDemissao = tipoMap[dismissalReason] || "sem_justa_causa"

      // 1. Primeiro, salvar registro na tabela de demissões
      const { error: demissaoError } = await supabase
        .from('demissoes')
        .insert({
          colaborador_id: id,
          data_demissao: new Date().toISOString().split('T')[0],
          tipo_demissao: tipoDemissao,
          motivo: dismissalReason,
          observacoes: null
        })

      if (demissaoError) {
        toast({
          title: "Erro",
          description: "Erro ao registrar demissão: " + demissaoError.message,
          variant: "destructive"
        })
        return
      }

      // 2. Atualizar status do colaborador para "Demitido"
      const { error: updateError } = await supabase
        .from('colaboradores')
        .update({ 
          status: 'Demitido',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateError) {
        toast({
          title: "Erro",
          description: "Erro ao atualizar status: " + updateError.message,
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Colaborador Demitido",
        description: `Colaborador demitido com sucesso. Motivo: ${dismissalReason}`,
        duration: 5000,
      })

      navigate('/lista-colaboradores')
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao demitir colaborador",
        variant: "destructive"
      })
    } finally {
      setDismissing(false)
      setShowDismissalDialog(false)
    }
  }

  const dismissalReasons = [
    "Abandono de emprego",
    "Fim antecipado/contrato Empregado",
    "Fim antecipado/contrato Empresa", 
    "Fim do contrato de trabalho",
    "Iniciativa colaborador",
    "Iniciativa empregadora/sem justa causa",
    "Iniciativa empresa/com justa causa",
    "Iniciativa empresa/sem justa causa",
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <User className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Editar Colaborador</h1>
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">
              {isGerencia ? "Editar Colaborador" : "Visualizar Colaborador"}
            </h1>
            <p className="text-muted-foreground">
              {isGerencia ? "Atualize os dados do colaborador" : "Detalhes do colaborador"}
            </p>
          </div>
        </div>
        
        {lastUpdated && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Última atualização: {new Date(lastUpdated).toLocaleDateString('pt-BR')}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => navigate('/lista-colaboradores')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Dados do Colaborador
            {formData.status && (
              <Badge variant={
                formData.status === "Ativo" ? "default" : 
                formData.status === "Demitido" ? "destructive" : "secondary"
              }>
                {formData.status}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {isGerencia ? "Edite as informações do colaborador abaixo" : "Visualize as informações do colaborador"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula *</Label>
                <Input
                  id="matricula"
                  value={formData.matricula}
                  onChange={(e) => handleChange('matricula', e.target.value)}
                  placeholder="Digite a matrícula"
                  required
                  disabled={!isGerencia}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="colaborador">Nome do Colaborador *</Label>
                <Input
                  id="colaborador"
                  value={formData.colaborador}
                  onChange={(e) => handleChange('colaborador', e.target.value)}
                  placeholder="Digite o nome completo"
                  required
                  disabled={!isGerencia}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sexo">Sexo</Label>
                <Select 
                  value={formData.sexo} 
                  onValueChange={(value) => handleChange('sexo', value)}
                  disabled={!isGerencia}
                >
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

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleChange('status', value)}
                  disabled={!isGerencia || formData.status === 'Demitido'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">(Vazio)</SelectItem>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Afastado">Afastado</SelectItem>
                    {formData.status === 'Demitido' && (
                      <SelectItem value="Demitido">Demitido</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Select 
                  value={formData.cargo} 
                  onValueChange={(value) => handleChange('cargo', value)}
                  disabled={!isGerencia}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">(Vazio)</SelectItem>
                    {Array.from(new Set([...getOpcoesPorCampo('cargo'), ...(formData.cargo ? [formData.cargo] : [])])).map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="setor">Setor</Label>
                <Select 
                  value={formData.setor} 
                  onValueChange={(value) => handleChange('setor', value)}
                  disabled={!isGerencia}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">(Vazio)</SelectItem>
                    {Array.from(new Set([...getOpcoesPorCampo('setor'), ...(formData.setor ? [formData.setor] : [])])).map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subsetor">Subsetor</Label>
                <Select 
                  value={formData.subsetor} 
                  onValueChange={(value) => handleChange('subsetor', value)}
                  disabled={!isGerencia}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o subsetor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">(Vazio)</SelectItem>
                    {Array.from(new Set([...getOpcoesPorCampo('subsetor'), ...(formData.subsetor ? [formData.subsetor] : [])])).map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lideranca">Liderança</Label>
                <Select 
                  value={formData.lideranca} 
                  onValueChange={(value) => handleChange('lideranca', value)}
                  disabled={!isGerencia}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a liderança" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">(Vazio)</SelectItem>
                    {Array.from(new Set([...getOpcoesPorCampo('lideranca'), ...(formData.lideranca ? [formData.lideranca] : [])])).map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="turno">Turno</Label>
                <Select 
                  value={formData.turno || ""} 
                  onValueChange={(value) => handleChange('turno', value)}
                  disabled={!isGerencia}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">(Vazio)</SelectItem>
                    {Array.from(new Set([...getOpcoesPorCampo('turno'), ...(formData.turno ? [formData.turno] : [])])).map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sabado_trabalho">Trabalha aos Sábados</Label>
                <Select 
                  value={formData.sabado_trabalho} 
                  onValueChange={(value) => { 
                    handleChange('sabado_trabalho', value); 
                    if (value === 'Não') handleChange('sabado_horario', ''); 
                  }}
                  disabled={!isGerencia}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Trabalha aos sábados?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">(Vazio)</SelectItem>
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.sabado_trabalho === "Sim" && (
                <div className="space-y-2">
                  <Label htmlFor="sabado_horario">Horário Sábado</Label>
                  <Select 
                    value={formData.sabado_horario} 
                    onValueChange={(value) => handleChange('sabado_horario', value)}
                    disabled={!isGerencia}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o horário" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="__empty__">(Vazio)</SelectItem>
                      <SelectItem value="08:00 - 12:00">08:00 - 12:00</SelectItem>
                      <SelectItem value="10:00 - 14:00">10:00 - 14:00</SelectItem>
                      <SelectItem value="12:00 - 16:00">12:00 - 16:00</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="horario_almoco">Horário de Almoço</Label>
                <Select 
                  value={formData.horario_almoco || ""} 
                  onValueChange={(value) => handleChange('horario_almoco', value)}
                  disabled={!isGerencia}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">(Vazio)</SelectItem>
                    <SelectItem value="01:30 - 02:45">01:30 - 02:45</SelectItem>
                    <SelectItem value="11:00 - 12:15">11:00 - 12:15</SelectItem>
                    <SelectItem value="11:45 - 13:00">11:45 - 13:00</SelectItem>
                    <SelectItem value="12:15 - 13:30">12:15 - 13:30</SelectItem>
                    <SelectItem value="13:00 - 14:15">13:00 - 14:15</SelectItem>
                    <SelectItem value="14:45 - 16:00">14:45 - 16:00</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="horario_cafe">Horário do Café</Label>
                <Select 
                  value={formData.horario_cafe || ""} 
                  onValueChange={(value) => handleChange('horario_cafe', value)}
                  disabled={!isGerencia}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">(Vazio)</SelectItem>
                    <SelectItem value="05:00 - 05:10">05:00 - 05:10</SelectItem>
                    <SelectItem value="15:00 - 15:10">15:00 - 15:10</SelectItem>
                    <SelectItem value="15:15 - 15:25">15:15 - 15:25</SelectItem>
                    <SelectItem value="15:30 - 15:40">15:30 - 15:40</SelectItem>
                    <SelectItem value="17:00 - 17:10">17:00 - 17:10</SelectItem>
                    <SelectItem value="19:00 - 19:10">19:00 - 19:10</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admissao">Data de Admissão</Label>
                <Input
                  id="admissao"
                  type="date"
                  value={formData.admissao}
                  onChange={(e) => handleChange('admissao', e.target.value)}
                  disabled={!isGerencia}
                />
              </div>
            </div>

              <div className="flex gap-4 pt-4">
                {isGerencia ? (
                  <>
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <Save className="w-4 h-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Atualizar Colaborador
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => navigate('/lista-colaboradores')}
                    >
                      Cancelar
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          type="button" 
                          variant="destructive"
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Demitir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Demissão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja demitir o colaborador <strong>{formData.colaborador}</strong>? 
                            Esta ação não pode ser desfeita e o colaborador será removido permanentemente da base de dados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => setShowDismissalDialog(true)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Confirmar Demissão
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => navigate('/lista-colaboradores')}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar à Lista
                  </Button>
                )}
              </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showDismissalDialog} onOpenChange={setShowDismissalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motivo da Demissão</DialogTitle>
            <DialogDescription>
              Selecione o motivo da demissão do colaborador {formData.colaborador}:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dismissal-reason">Motivo do Desligamento</Label>
              <Select value={dismissalReason} onValueChange={setDismissalReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="__empty__">(Vazio)</SelectItem>
                  {dismissalReasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDismissalDialog(false)
                setDismissalReason("")
              }}
              disabled={dismissing}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDismissal}
              disabled={!dismissalReason || dismissing}
            >
              {dismissing ? "Processando..." : "Confirmar Demissão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}