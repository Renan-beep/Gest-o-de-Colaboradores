import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, Circle, MessageCircle, X, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface OnlineUser {
  id: string
  email: string
  name: string
  online_at: string
  page?: string
}

interface Profile {
  user_id: string
  full_name: string | null
  email: string
  avatar_url: string | null
}

interface Conversa {
  id: string
  nome: string | null
  tipo: 'privada' | 'grupo'
  participantes?: { user_id: string; profile?: Profile }[]
}

interface Mensagem {
  id: string
  conversa_id: string
  sender_id: string
  conteudo: string
  created_at: string
  sender?: Profile
}

export function OnlineUsers() {
  const { user } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeConversa, setActiveConversa] = useState<Conversa | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [novaMensagem, setNovaMensagem] = useState("")
  const [loading, setLoading] = useState(false)

  // Buscar todos os perfis do sistema
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

  // Presença online
  useEffect(() => {
    if (!user) return

    const channel = supabase.channel('online-users', {
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
            if (presence.id !== user.id) {
              users.push(presence)
            }
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
            online_at: new Date().toISOString(),
            page: window.location.pathname
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // Subscription para mensagens da conversa ativa
  useEffect(() => {
    if (!activeConversa) return

    const channel = supabase
      .channel(`mensagens-${activeConversa.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens',
          filter: `conversa_id=eq.${activeConversa.id}`
        },
        async (payload) => {
          const novaMensagem = payload.new as Mensagem
          
          // Buscar dados do sender
          const { data: senderData } = await supabase
            .from('profiles')
            .select('user_id, full_name, email, avatar_url')
            .eq('user_id', novaMensagem.sender_id)
            .single()

          setMensagens(prev => [...prev, { ...novaMensagem, sender: senderData || undefined }])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeConversa])

  const isUserOnline = (userId: string) => {
    return onlineUsers.some(u => u.id === userId)
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const startChat = async (targetUserId: string) => {
    if (!user) return
    setLoading(true)

    try {
      const { data: conversaId, error } = await supabase
        .rpc('get_or_create_private_conversation', { other_user_id: targetUserId })

      if (error) throw error

      // Buscar detalhes da conversa
      const { data: conversaData } = await supabase
        .from('conversas')
        .select('*')
        .eq('id', conversaId)
        .single()

      if (conversaData) {
        const { data: participantes } = await supabase
          .from('conversas_participantes')
          .select('user_id')
          .eq('conversa_id', conversaData.id)

        const userIds = participantes?.map(p => p.user_id) || []
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, avatar_url')
          .in('user_id', userIds)

        const conversa: Conversa = {
          ...conversaData,
          tipo: conversaData.tipo as 'privada' | 'grupo',
          participantes: participantes?.map(p => ({
            user_id: p.user_id,
            profile: profiles?.find(pr => pr.user_id === p.user_id)
          })) || []
        }

        setActiveConversa(conversa)

        // Buscar mensagens
        const { data: mensagensData } = await supabase
          .from('mensagens')
          .select('*')
          .eq('conversa_id', conversaId)
          .order('created_at', { ascending: true })

        if (mensagensData) {
          const mensagensComSender = mensagensData.map(m => ({
            ...m,
            sender: profiles?.find(p => p.user_id === m.sender_id)
          }))
          setMensagens(mensagensComSender)
        }
      }
    } catch (error) {
      console.error('Erro ao iniciar chat:', error)
    } finally {
      setLoading(false)
    }
  }

  const enviarMensagem = async () => {
    if (!user || !activeConversa || !novaMensagem.trim()) return

    const { error } = await supabase
      .from('mensagens')
      .insert({
        conversa_id: activeConversa.id,
        sender_id: user.id,
        conteudo: novaMensagem.trim()
      })

    if (!error) {
      setNovaMensagem("")
    }
  }

  const getConversaNome = () => {
    if (!activeConversa || !user) return ''
    const outroParticipante = activeConversa.participantes?.find(p => p.user_id !== user.id)
    return outroParticipante?.profile?.full_name || outroParticipante?.profile?.email || 'Conversa'
  }

  const totalOnline = onlineUsers.length + 1

  if (!user) return null

  return (
    <div 
      className={cn(
        "fixed bottom-3 right-3 md:bottom-4 md:right-4 z-50 transition-all duration-300",
        isExpanded 
          ? activeConversa 
            ? "w-[calc(100vw-24px)] h-[calc(100vh-24px)] md:w-80 md:h-[450px]" 
            : "w-64 md:w-72" 
          : "w-auto"
      )}
    >
      <div 
        className={cn(
          "bg-card border shadow-lg rounded-xl overflow-hidden h-full flex flex-col",
          "animate-in slide-in-from-right-5 duration-300"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2 p-2 md:p-3 bg-primary text-primary-foreground">
          {activeConversa ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setActiveConversa(null)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{getConversaNome()}</p>
              </div>
            </>
          ) : (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 w-full"
            >
              <div className="relative">
                <Users className="w-4 h-4 md:w-5 md:h-5" />
                <Circle className="w-2 h-2 fill-green-400 text-green-400 absolute -top-0.5 -right-0.5" />
              </div>
              
              {!isExpanded ? (
                <span className="text-sm font-medium">{totalOnline} online</span>
              ) : (
                <span className="font-medium text-sm flex-1 text-left">
                  Usuários ({allProfiles.length + 1})
                </span>
              )}
            </button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => {
              setIsExpanded(false)
              setActiveConversa(null)
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Conteúdo */}
        {isExpanded && !activeConversa && (
          <ScrollArea className="flex-1 max-h-72">
            <div className="p-2">
              <p className="text-xs text-muted-foreground px-2 pb-2">
                {onlineUsers.length + 1} online de {allProfiles.length + 1} usuários
              </p>
              
              {/* Lista de todos os usuários */}
              {allProfiles.map((profile) => {
                const isOnline = isUserOnline(profile.user_id)
                return (
                  <button
                    key={profile.user_id}
                    onClick={() => startChat(profile.user_id)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className={cn(
                          "text-xs",
                          isOnline ? "bg-green-600 text-white" : "bg-muted"
                        )}>
                          {getInitials(profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <Circle 
                        className={cn(
                          "w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5",
                          isOnline ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"
                        )} 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {profile.full_name || profile.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                  </button>
                )
              })}
              
              {allProfiles.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum outro usuário encontrado
                </p>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Chat ativo */}
        {isExpanded && activeConversa && (
          <>
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {mensagens.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.sender_id === user.id ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                        msg.sender_id === user.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {msg.conteudo}
                    </div>
                  </div>
                ))}
                {mensagens.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Envie a primeira mensagem
                  </p>
                )}
              </div>
            </ScrollArea>
            
            {/* Input */}
            <div className="p-2 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={novaMensagem}
                  onChange={(e) => setNovaMensagem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && enviarMensagem()}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 text-sm px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button size="sm" onClick={enviarMensagem} disabled={!novaMensagem.trim()}>
                  Enviar
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
