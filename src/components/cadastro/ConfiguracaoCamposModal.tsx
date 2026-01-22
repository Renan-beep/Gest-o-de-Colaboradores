import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, Plus, Settings, ArrowRight, Lock } from "lucide-react"
import { useConfiguracaoCampos, CAMPOS_CADASTRO, ConfiguracaoCampo } from "@/hooks/useConfiguracaoCampos"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ConfiguracaoCamposModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRulesChanged?: () => void
}

export function ConfiguracaoCamposModal({ open, onOpenChange, onRulesChanged }: ConfiguracaoCamposModalProps) {
  const { 
    configuracoes, 
    loading, 
    criarConfiguracao, 
    excluirConfiguracao 
  } = useConfiguracaoCampos()

  const [novaCampo, setNovaCampo] = useState({
    campo_pai: "",
    valor_pai: "",
    campo_filho: "",
    valores_permitidos: [] as string[]
  })

  const [saving, setSaving] = useState(false)

  const campoPaiDefinicao = CAMPOS_CADASTRO.find(c => c.key === novaCampo.campo_pai)
  const campoFilhoDefinicao = CAMPOS_CADASTRO.find(c => c.key === novaCampo.campo_filho)

  // Filtra campos filho para não incluir o mesmo campo pai
  const camposFilhoDisponiveis = CAMPOS_CADASTRO.filter(c => c.key !== novaCampo.campo_pai)

  const handleCriarRegra = async () => {
    if (!novaCampo.campo_pai || !novaCampo.valor_pai || !novaCampo.campo_filho || novaCampo.valores_permitidos.length === 0) {
      return
    }

    setSaving(true)
    const success = await criarConfiguracao({
      campo_pai: novaCampo.campo_pai,
      valor_pai: novaCampo.valor_pai,
      campo_filho: novaCampo.campo_filho,
      valores_permitidos: novaCampo.valores_permitidos,
      ativo: true
    })

    if (success) {
      setNovaCampo({
        campo_pai: "",
        valor_pai: "",
        campo_filho: "",
        valores_permitidos: []
      })
      // Notifica o componente pai que as regras mudaram
      onRulesChanged?.()
    }
    setSaving(false)
  }

  const handleExcluirRegra = async (id: string) => {
    const success = await excluirConfiguracao(id)
    if (success) {
      onRulesChanged?.()
    }
  }

  const toggleValorPermitido = (valor: string) => {
    setNovaCampo(prev => ({
      ...prev,
      valores_permitidos: prev.valores_permitidos.includes(valor)
        ? prev.valores_permitidos.filter(v => v !== valor)
        : [...prev.valores_permitidos, valor]
    }))
  }

  const selecionarTodosValores = () => {
    if (campoFilhoDefinicao) {
      setNovaCampo(prev => ({
        ...prev,
        valores_permitidos: [...campoFilhoDefinicao.valores]
      }))
    }
  }

  const limparSelecao = () => {
    setNovaCampo(prev => ({
      ...prev,
      valores_permitidos: []
    }))
  }

  const getCampoLabel = (key: string) => {
    return CAMPOS_CADASTRO.find(c => c.key === key)?.label || key
  }

  // Agrupa configurações por campo pai
  const configuracoesAgrupadas = configuracoes.reduce((acc, config) => {
    const key = `${config.campo_pai}-${config.valor_pai}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(config)
    return acc
  }, {} as Record<string, ConfiguracaoCampo[]>)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuração de Campos do Cadastro
          </DialogTitle>
          <DialogDescription>
            Configure regras de dependência entre campos. Quando o campo pai for selecionado, 
            os campos filhos mostrarão apenas os valores permitidos.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="criar" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="criar">Criar Nova Regra</TabsTrigger>
            <TabsTrigger value="regras">
              Regras Existentes ({configuracoes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="criar" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Campo Pai */}
              <div className="space-y-2">
                <Label>Campo Pai (gatilho)</Label>
                <Select 
                  value={novaCampo.campo_pai} 
                  onValueChange={(value) => setNovaCampo(prev => ({ 
                    ...prev, 
                    campo_pai: value, 
                    valor_pai: "",
                    campo_filho: prev.campo_filho === value ? "" : prev.campo_filho
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o campo pai" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPOS_CADASTRO.map(campo => (
                      <SelectItem key={campo.key} value={campo.key}>
                        {campo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Valor do Campo Pai */}
              <div className="space-y-2">
                <Label>Quando o valor for</Label>
                <Select 
                  value={novaCampo.valor_pai} 
                  onValueChange={(value) => setNovaCampo(prev => ({ ...prev, valor_pai: value }))}
                  disabled={!novaCampo.campo_pai}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o valor" />
                  </SelectTrigger>
                  <SelectContent>
                    {campoPaiDefinicao?.valores.map(valor => (
                      <SelectItem key={valor} value={valor}>
                        {valor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-center py-2">
              <ArrowRight className="w-6 h-6 text-muted-foreground" />
            </div>

            {/* Campo Filho */}
            <div className="space-y-2">
              <Label>Campo Filho (será filtrado)</Label>
              <Select 
                value={novaCampo.campo_filho} 
                onValueChange={(value) => setNovaCampo(prev => ({ 
                  ...prev, 
                  campo_filho: value, 
                  valores_permitidos: [] 
                }))}
                disabled={!novaCampo.valor_pai}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o campo que será filtrado" />
                </SelectTrigger>
                <SelectContent>
                  {camposFilhoDisponiveis.map(campo => (
                    <SelectItem key={campo.key} value={campo.key}>
                      {campo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valores Permitidos */}
            {novaCampo.campo_filho && campoFilhoDefinicao && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Valores permitidos para {campoFilhoDefinicao.label}</Label>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={selecionarTodosValores}
                    >
                      Selecionar todos
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={limparSelecao}
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-48 border rounded-md p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {campoFilhoDefinicao.valores.map(valor => (
                      <div key={valor} className="flex items-center space-x-2">
                        <Checkbox
                          id={valor}
                          checked={novaCampo.valores_permitidos.includes(valor)}
                          onCheckedChange={() => toggleValorPermitido(valor)}
                        />
                        <label
                          htmlFor={valor}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {valor}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <p className="text-sm text-muted-foreground">
                  {novaCampo.valores_permitidos.length} de {campoFilhoDefinicao.valores.length} valores selecionados
                </p>
              </div>
            )}

            <Button 
              onClick={handleCriarRegra}
              disabled={saving || !novaCampo.campo_pai || !novaCampo.valor_pai || !novaCampo.campo_filho || novaCampo.valores_permitidos.length === 0}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Criar Regra"}
            </Button>
          </TabsContent>

          <TabsContent value="regras" className="mt-4">
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Carregando...</p>
                </div>
              ) : configuracoes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <Lock className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Nenhuma regra configurada</p>
                  <p className="text-sm text-muted-foreground">
                    Crie regras para controlar quais valores aparecem nos campos
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(configuracoesAgrupadas).map(([key, configs]) => {
                    const primeiraConfig = configs[0]
                    return (
                      <Card key={key}>
                        <CardHeader className="py-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Badge variant="outline">
                              {getCampoLabel(primeiraConfig.campo_pai)}
                            </Badge>
                            <span>=</span>
                            <Badge>{primeiraConfig.valor_pai}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 space-y-2">
                          {configs.map(config => (
                            <div 
                              key={config.id} 
                              className="flex items-start justify-between p-2 bg-muted/50 rounded-md"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium text-sm">
                                    {getCampoLabel(config.campo_filho)}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1 ml-6">
                                  {config.valores_permitidos.map(valor => (
                                    <Badge 
                                      key={valor} 
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {valor}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExcluirRegra(config.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
