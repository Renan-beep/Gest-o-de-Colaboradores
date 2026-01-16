import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Search } from "lucide-react"

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateGroup: (nome: string, participantes: string[]) => void
  profiles: any[]
}

export function CreateGroupModal({ 
  isOpen, 
  onClose, 
  onCreateGroup, 
  profiles 
}: CreateGroupModalProps) {
  const [nomeGrupo, setNomeGrupo] = useState("")
  const [participantesSelecionados, setParticipantesSelecionados] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleToggleParticipante = (userId: string) => {
    setParticipantesSelecionados(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleCreate = () => {
    if (nomeGrupo.trim() && participantesSelecionados.length > 0) {
      onCreateGroup(nomeGrupo.trim(), participantesSelecionados)
      handleClose()
    }
  }

  const handleClose = () => {
    setNomeGrupo("")
    setParticipantesSelecionados([])
    setSearchTerm("")
    onClose()
  }

  const filteredProfiles = profiles.filter(p =>
    (p.full_name || p.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Criar Grupo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do grupo</Label>
            <Input
              id="nome"
              placeholder="Ex: Time de Vendas"
              value={nomeGrupo}
              onChange={(e) => setNomeGrupo(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Participantes ({participantesSelecionados.length} selecionados)</Label>
            
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <ScrollArea className="h-48 border rounded-md">
              <div className="p-2 space-y-1">
                {filteredProfiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum usuário encontrado
                  </p>
                ) : (
                  filteredProfiles.map((profile) => (
                    <div
                      key={profile.user_id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleToggleParticipante(profile.user_id)}
                    >
                      <Checkbox
                        checked={participantesSelecionados.includes(profile.user_id)}
                        onCheckedChange={() => handleToggleParticipante(profile.user_id)}
                      />
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          {getInitials(profile.full_name || profile.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {profile.full_name || 'Sem nome'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {profile.email}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={!nomeGrupo.trim() || participantesSelecionados.length === 0}
          >
            Criar Grupo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
