import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Users, Plus, Circle, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { Conversa, OnlineUser } from "./ChatContainer"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ChatSidebarProps {
  conversas: Conversa[]
  conversaAtiva: Conversa | null
  onSelectConversa: (conversa: Conversa) => void
  onlineUsers: OnlineUser[]
  onStartPrivateChat: (userId: string) => void
  onCreateGroup: () => void
  currentUserId: string
  isUserOnline: (userId: string) => boolean
  allProfiles: any[]
}

export function ChatSidebar({
  conversas,
  conversaAtiva,
  onSelectConversa,
  onlineUsers,
  onStartPrivateChat,
  onCreateGroup,
  currentUserId,
  isUserOnline,
  allProfiles
}: ChatSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getConversaName = (conversa: Conversa) => {
    if (conversa.tipo === 'grupo') {
      return conversa.nome || 'Grupo'
    }
    
    const outroParticipante = conversa.participantes?.find(
      p => p.user_id !== currentUserId
    )
    return outroParticipante?.profile?.full_name || outroParticipante?.profile?.email || 'Usuário'
  }

  const getOutroParticipanteId = (conversa: Conversa) => {
    if (conversa.tipo === 'grupo') return null
    return conversa.participantes?.find(p => p.user_id !== currentUserId)?.user_id
  }

  const filteredConversas = conversas.filter(c => 
    getConversaName(c).toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredProfiles = allProfiles.filter(p =>
    (p.full_name || p.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Usuários que não têm conversa ainda
  const usuariosSemConversa = filteredProfiles.filter(profile => {
    const temConversa = conversas.some(c => 
      c.tipo === 'privada' && 
      c.participantes?.some(p => p.user_id === profile.user_id)
    )
    return !temConversa
  })

  return (
    <div className="w-64 border-r flex flex-col bg-muted/30">
      {/* Busca */}
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      <Tabs defaultValue="conversas" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b h-9 p-0 bg-transparent">
          <TabsTrigger 
            value="conversas" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-9 text-xs"
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1" />
            Conversas
          </TabsTrigger>
          <TabsTrigger 
            value="usuarios" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-9 text-xs"
          >
            <Users className="w-3.5 h-3.5 mr-1" />
            Usuários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversas" className="flex-1 m-0 overflow-hidden">
          <div className="p-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs"
              onClick={onCreateGroup}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Criar Grupo
            </Button>
          </div>
          
          <ScrollArea className="flex-1 h-[calc(100%-60px)]">
            <div className="space-y-0.5 p-1">
              {filteredConversas.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhuma conversa
                </p>
              ) : (
                filteredConversas.map((conversa) => {
                  const outroId = getOutroParticipanteId(conversa)
                  const isOnline = outroId ? isUserOnline(outroId) : false
                  
                  return (
                    <button
                      key={conversa.id}
                      onClick={() => onSelectConversa(conversa)}
                      className={cn(
                        "w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted/80 transition-colors text-left",
                        conversaAtiva?.id === conversa.id && "bg-muted"
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className={cn(
                            "text-xs",
                            conversa.tipo === 'grupo' 
                              ? "bg-purple-600 text-white" 
                              : "bg-primary text-primary-foreground"
                          )}>
                            {conversa.tipo === 'grupo' ? (
                              <Users className="w-4 h-4" />
                            ) : (
                              getInitials(getConversaName(conversa))
                            )}
                          </AvatarFallback>
                        </Avatar>
                        {conversa.tipo === 'privada' && isOnline && (
                          <Circle className="w-2.5 h-2.5 fill-green-500 text-green-500 absolute -bottom-0.5 -right-0.5" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">
                            {getConversaName(conversa)}
                          </p>
                          {(conversa.nao_lidas || 0) > 0 && (
                            <Badge variant="destructive" className="text-[10px] h-4 px-1 ml-1">
                              {conversa.nao_lidas}
                            </Badge>
                          )}
                        </div>
                        {conversa.ultima_mensagem && (
                          <p className="text-xs text-muted-foreground truncate">
                            {conversa.ultima_mensagem.conteudo}
                          </p>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="usuarios" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-0.5 p-1">
              {/* Usuários online primeiro */}
              {onlineUsers
                .filter(u => u.id !== currentUserId)
                .map((onlineUser) => (
                  <button
                    key={onlineUser.id}
                    onClick={() => onStartPrivateChat(onlineUser.id)}
                    className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted/80 transition-colors text-left"
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getInitials(onlineUser.name)}
                        </AvatarFallback>
                      </Avatar>
                      <Circle className="w-2.5 h-2.5 fill-green-500 text-green-500 absolute -bottom-0.5 -right-0.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{onlineUser.name}</p>
                      <p className="text-xs text-green-600">Online</p>
                    </div>
                  </button>
                ))}

              {/* Usuários offline */}
              {usuariosSemConversa
                .filter(p => !isUserOnline(p.user_id))
                .map((profile) => (
                  <button
                    key={profile.user_id}
                    onClick={() => onStartPrivateChat(profile.user_id)}
                    className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted/80 transition-colors text-left"
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-muted-foreground/20 text-muted-foreground text-xs">
                          {getInitials(profile.full_name || profile.email)}
                        </AvatarFallback>
                      </Avatar>
                      <Circle className="w-2.5 h-2.5 fill-gray-400 text-gray-400 absolute -bottom-0.5 -right-0.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{profile.full_name || profile.email}</p>
                      <p className="text-xs text-muted-foreground">Offline</p>
                    </div>
                  </button>
                ))}

              {onlineUsers.filter(u => u.id !== currentUserId).length === 0 && 
               usuariosSemConversa.filter(p => !isUserOnline(p.user_id)).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhum usuário encontrado
                </p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
