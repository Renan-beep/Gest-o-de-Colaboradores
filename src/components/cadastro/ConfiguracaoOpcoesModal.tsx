import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, Plus, Settings, ChevronDown, ChevronRight } from "lucide-react"
import { useOpcoesCampos, CAMPOS_CONFIGURÁVEIS, OpcaoCampo } from "@/hooks/useOpcoesCampos"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface ConfiguracaoOpcoesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOptionsChanged?: () => void
}

export function ConfiguracaoOpcoesModal({ open, onOpenChange, onOptionsChanged }: ConfiguracaoOpcoesModalProps) {
  const { opcoes, loading, adicionarOpcao, removerOpcao, refetch } = useOpcoesCampos()
  const [expandedCampos, setExpandedCampos] = useState<string[]>([])
  const [novasOpcoes, setNovasOpcoes] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const toggleExpanded = (campo: string) => {
    setExpandedCampos(prev => 
      prev.includes(campo) 
        ? prev.filter(c => c !== campo) 
        : [...prev, campo]
    )
  }

  const getOpcoesDoCampo = (campo: string): OpcaoCampo[] => {
    return opcoes.filter(o => o.campo === campo).sort((a, b) => a.ordem - b.ordem)
  }

  const handleAdicionarOpcao = async (campo: string) => {
    const valor = novasOpcoes[campo]?.trim()
    if (!valor) return

    setSaving(true)
    const success = await adicionarOpcao(campo, valor)
    if (success) {
      setNovasOpcoes(prev => ({ ...prev, [campo]: "" }))
      onOptionsChanged?.()
    }
    setSaving(false)
  }

  const handleRemoverOpcao = async (id: string) => {
    const success = await removerOpcao(id)
    if (success) {
      onOptionsChanged?.()
    }
  }

  const getCampoLabel = (key: string) => {
    return CAMPOS_CONFIGURÁVEIS.find(c => c.key === key)?.label || key
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuração das Opções dos Campos
          </DialogTitle>
          <DialogDescription>
            Gerencie as opções disponíveis em cada campo dropdown do cadastro de colaboradores.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {CAMPOS_CONFIGURÁVEIS.map(campo => {
                const opcoesDosCampo = getOpcoesDoCampo(campo.key)
                const isExpanded = expandedCampos.includes(campo.key)
                
                return (
                  <Collapsible key={campo.key} open={isExpanded} onOpenChange={() => toggleExpanded(campo.key)}>
                    <Card>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                              <span>{campo.label}</span>
                            </div>
                            <Badge variant="secondary">
                              {opcoesDosCampo.length} opções
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-3">
                          {/* Lista de opções existentes */}
                          <div className="flex flex-wrap gap-2">
                            {opcoesDosCampo.map(opcao => (
                              <Badge 
                                key={opcao.id} 
                                variant="outline"
                                className="flex items-center gap-1 py-1 px-2"
                              >
                                <span>{opcao.valor}</span>
                                <button
                                  onClick={() => handleRemoverOpcao(opcao.id)}
                                  className="ml-1 hover:text-destructive transition-colors"
                                  title="Remover opção"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                          
                          {opcoesDosCampo.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                              Nenhuma opção cadastrada
                            </p>
                          )}

                          {/* Adicionar nova opção */}
                          <div className="flex gap-2 pt-2 border-t">
                            <div className="flex-1">
                              <Input
                                placeholder={`Nova opção para ${campo.label}`}
                                value={novasOpcoes[campo.key] || ""}
                                onChange={(e) => setNovasOpcoes(prev => ({ 
                                  ...prev, 
                                  [campo.key]: e.target.value 
                                }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleAdicionarOpcao(campo.key)
                                  }
                                }}
                              />
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleAdicionarOpcao(campo.key)}
                              disabled={saving || !novasOpcoes[campo.key]?.trim()}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
