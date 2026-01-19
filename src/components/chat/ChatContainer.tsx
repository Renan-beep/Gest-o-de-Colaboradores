import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { ChatSidebar } from "./ChatSidebar"
import { ChatWindow } from "./ChatWindow"
import { CreateGroupModal } from "./CreateGroupModal"
import { MessageCircle, X, Minimize2, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export interface Conversa {
  id: string
  nome: string | null
  tipo: 'privada' | 'grupo'
  created_at: string
  updated_at: string
  participantes?: Participante[]
  ultima_mensagem?: Mensagem | null
  nao_lidas?: number
}

export interface Participante {
  user_id: string
  profile?: {
    full_name: string | null
    email: string
    avatar_url: string | null
  }
}

export interface Mensagem {
  id: string
  conversa_id: string
  sender_id: string
  conteudo: string
  lida: boolean
  created_at: string
  sender?: {
    full_name: string | null
    email: string
    avatar_url: string | null
  }
}

export interface OnlineUser {
  id: string
  email: string
  name: string
  online_at: string
}

export function ChatContainer() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [conversaAtiva, setConversaAtiva] = useState<Conversa | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [totalNaoLidas, setTotalNaoLidas] = useState(0)
  const [allProfiles, setAllProfiles] = useState<any[]>([])
  const [showSidebarMobile, setShowSidebarMobile] = useState(true)

  // Buscar todos os perfis para o modal de criar grupo
  useEffect(() => {
    if (!user) return
    
    const fetchProfiles = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
      
      if (data) {
        setAllProfiles(data.filter(p => p.user_id !== user.id))
      }
    }
    
    fetchProfiles()
  }, [user])

  // Buscar conversas
  useEffect(() => {
    if (!user) return

    const fetchConversas = async () => {
      // Buscar conversas do usuário
      const { data: participacoes } = await supabase
        .from('conversas_participantes')
        .select('conversa_id')
        .eq('user_id', user.id)

      if (!participacoes || participacoes.length === 0) {
        setConversas([])
        return
      }

      const conversaIds = participacoes.map(p => p.conversa_id)

      // Buscar detalhes das conversas
      const { data: conversasData } = await supabase
        .from('conversas')
        .select('*')
        .in('id', conversaIds)
        .order('updated_at', { ascending: false })

      if (!conversasData) {
        setConversas([])
        return
      }

      // Para cada conversa, buscar participantes e última mensagem
      const conversasCompletas = await Promise.all(
        conversasData.map(async (conversa) => {
          // Buscar participantes
          const { data: participantes } = await supabase
            .from('conversas_participantes')
            .select('user_id')
            .eq('conversa_id', conversa.id)

          // Buscar perfis dos participantes
          const userIds = participantes?.map(p => p.user_id) || []
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, email, avatar_url')
            .in('user_id', userIds)

          // Buscar última mensagem
          const { data: mensagens } = await supabase
            .from('mensagens')
            .select('*')
            .eq('conversa_id', conversa.id)
            .order('created_at', { ascending: false })
            .limit(1)

          // Contar não lidas
          const { count } = await supabase
            .from('mensagens')
            .select('*', { count: 'exact', head: true })
            .eq('conversa_id', conversa.id)
            .eq('lida', false)
            .neq('sender_id', user.id)

          return {
            ...conversa,
            participantes: participantes?.map(p => ({
              user_id: p.user_id,
              profile: profiles?.find(pr => pr.user_id === p.user_id)
            })) || [],
            ultima_mensagem: mensagens?.[0] || null,
            nao_lidas: count || 0
          } as Conversa
        })
      )

      setConversas(conversasCompletas)
      setTotalNaoLidas(conversasCompletas.reduce((acc, c) => acc + (c.nao_lidas || 0), 0))
    }

    fetchConversas()

    // Subscription para novas mensagens
    const channel = supabase
      .channel('chat-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mensagens'
        },
        () => {
          fetchConversas()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversas'
        },
        () => {
          fetchConversas()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // Subscription para usuários online
  useEffect(() => {
    if (!user) return

    const channel = supabase.channel('chat-presence', {
      config: {
        presence: {
          key: user.id,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users: OnlineUser[] = []
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: OnlineUser) => {
            users.push(presence)
          })
        })
        
        setOnlineUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
            online_at: new Date().toISOString()
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const handleStartPrivateChat = async (targetUserId: string) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .rpc('get_or_create_private_conversation', { other_user_id: targetUserId })

      if (error) throw error

      // Buscar a conversa criada/encontrada
      const { data: conversaData } = await supabase
        .from('conversas')
        .select('*')
        .eq('id', data)
        .single()

      if (conversaData) {
        // Buscar participantes
        const { data: participantes } = await supabase
          .from('conversas_participantes')
          .select('user_id')
          .eq('conversa_id', conversaData.id)

        const userIds = participantes?.map(p => p.user_id) || []
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, avatar_url')
          .in('user_id', userIds)

        const conversaCompleta: Conversa = {
          ...conversaData,
          tipo: conversaData.tipo as 'privada' | 'grupo',
          participantes: participantes?.map(p => ({
            user_id: p.user_id,
            profile: profiles?.find(pr => pr.user_id === p.user_id)
          })) || []
        }

        setConversaAtiva(conversaCompleta)
        setIsOpen(true)
        setIsMinimized(false)
      }
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error)
    }
  }

  const handleCreateGroup = async (nome: string, participantesIds: string[]) => {
    if (!user) return

    try {
      // Criar conversa de grupo
      const { data: conversa, error: conversaError } = await supabase
        .from('conversas')
        .insert({
          nome,
          tipo: 'grupo',
          criado_por: user.id
        })
        .select()
        .single()

      if (conversaError) throw conversaError

      // Adicionar participantes (incluindo o criador)
      const participantesData = [...participantesIds, user.id].map(userId => ({
        conversa_id: conversa.id,
        user_id: userId
      }))

      const { error: participantesError } = await supabase
        .from('conversas_participantes')
        .insert(participantesData)

      if (participantesError) throw participantesError

      setShowCreateGroup(false)
      
      // Atualizar lista de conversas
      const { data: participantes } = await supabase
        .from('conversas_participantes')
        .select('user_id')
        .eq('conversa_id', conversa.id)

      const userIds = participantes?.map(p => p.user_id) || []
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds)

      const conversaCompleta: Conversa = {
        ...conversa,
        tipo: conversa.tipo as 'privada' | 'grupo',
        participantes: participantes?.map(p => ({
          user_id: p.user_id,
          profile: profiles?.find(pr => pr.user_id === p.user_id)
        })) || []
      }

      setConversas(prev => [conversaCompleta, ...prev])
      setConversaAtiva(conversaCompleta)
    } catch (error) {
      console.error('Erro ao criar grupo:', error)
    }
  }

  const isUserOnline = (userId: string) => {
    return onlineUsers.some(u => u.id === userId)
  }

  if (!user) return null

  return (
    <>
      {/* Botão flutuante removido - chat integrado ao OnlineUsers */}

      {/* Container do Chat */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-50 bg-background border rounded-lg shadow-2xl transition-all duration-300",
            isMinimized
              ? "bottom-3 right-16 md:bottom-4 md:right-20 w-64 md:w-80 h-12"
              : "bottom-0 left-0 right-0 top-0 md:bottom-4 md:right-20 md:left-auto md:top-auto md:w-[700px] md:h-[500px] md:rounded-lg rounded-none"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-2 md:p-3 border-b bg-primary text-primary-foreground md:rounded-t-lg">
            <div className="flex items-center gap-2">
              {/* Botão voltar em mobile quando está em conversa */}
              {!showSidebarMobile && conversaAtiva && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20 md:hidden"
                  onClick={() => setShowSidebarMobile(true)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium text-sm md:text-base">Chat</span>
              {totalNaoLidas > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {totalNaoLidas}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20 hidden md:flex"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Conteúdo */}
          {!isMinimized && (
            <div className="flex h-[calc(100%-48px)] md:h-[calc(100%-48px)]">
              {/* Sidebar - visível em desktop sempre, em mobile apenas quando showSidebarMobile */}
              <div className={cn(
                "md:block",
                showSidebarMobile ? "block w-full md:w-auto" : "hidden"
              )}>
                <ChatSidebar
                  conversas={conversas}
                  conversaAtiva={conversaAtiva}
                  onSelectConversa={(conversa) => {
                    setConversaAtiva(conversa)
                    setShowSidebarMobile(false)
                  }}
                  onlineUsers={onlineUsers}
                  onStartPrivateChat={(userId) => {
                    handleStartPrivateChat(userId)
                    setShowSidebarMobile(false)
                  }}
                  onCreateGroup={() => setShowCreateGroup(true)}
                  currentUserId={user.id}
                  isUserOnline={isUserOnline}
                  allProfiles={allProfiles}
                />
              </div>
              {/* Window - visível em desktop sempre, em mobile apenas quando !showSidebarMobile */}
              <div className={cn(
                "flex-1 md:flex",
                !showSidebarMobile ? "flex w-full" : "hidden md:flex"
              )}>
                <ChatWindow
                  conversa={conversaAtiva}
                  currentUserId={user.id}
                  isUserOnline={isUserOnline}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de criar grupo */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreateGroup={handleCreateGroup}
        profiles={allProfiles}
      />
    </>
  )
}
