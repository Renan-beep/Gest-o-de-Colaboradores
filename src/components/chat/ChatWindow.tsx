import { useState, useEffect, useRef } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Circle, Users, MessageSquarePlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Conversa, Mensagem } from "./ChatContainer"
import { format, isToday, isYesterday } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ChatWindowProps {
  conversa: Conversa | null
  currentUserId: string
  isUserOnline: (userId: string) => boolean
}

export function ChatWindow({ conversa, currentUserId, isUserOnline }: ChatWindowProps) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [novaMensagem, setNovaMensagem] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!conversa) {
      setMensagens([])
      return
    }

    const fetchMensagens = async () => {
      const { data: mensagensData } = await supabase
        .from('mensagens')
        .select('*')
        .eq('conversa_id', conversa.id)
        .order('created_at', { ascending: true })

      if (mensagensData) {
        // Buscar perfis dos remetentes
        const senderIds = [...new Set(mensagensData.map(m => m.sender_id))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, avatar_url')
          .in('user_id', senderIds)

        const mensagensComSender = mensagensData.map(m => ({
          ...m,
          sender: profiles?.find(p => p.user_id === m.sender_id)
        }))

        setMensagens(mensagensComSender)

        // Marcar mensagens como lidas
        await supabase
          .from('mensagens')
          .update({ lida: true })
          .eq('conversa_id', conversa.id)
          .neq('sender_id', currentUserId)
          .eq('lida', false)
      }
    }

    fetchMensagens()

    // Subscription para novas mensagens
    const channel = supabase
      .channel(`chat-${conversa.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens',
          filter: `conversa_id=eq.${conversa.id}`
        },
        async (payload) => {
          const novaMensagem = payload.new as Mensagem
          
          // Buscar perfil do remetente
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, full_name, email, avatar_url')
            .eq('user_id', novaMensagem.sender_id)
            .single()

          const mensagemComSender = {
            ...novaMensagem,
            sender: profile || undefined
          }

          setMensagens(prev => [...prev, mensagemComSender])

          // Marcar como lida se não for do usuário atual
          if (novaMensagem.sender_id !== currentUserId) {
            await supabase
              .from('mensagens')
              .update({ lida: true })
              .eq('id', novaMensagem.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversa, currentUserId])

  // Auto scroll para última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [mensagens])

  // Focus no input ao abrir conversa
  useEffect(() => {
    if (conversa && inputRef.current) {
      inputRef.current.focus()
    }
  }, [conversa])

  const handleSendMessage = async () => {
    if (!novaMensagem.trim() || !conversa) return

    setIsLoading(true)
    const mensagemTexto = novaMensagem.trim()
    setNovaMensagem("")

    try {
      const { error } = await supabase
        .from('mensagens')
        .insert({
          conversa_id: conversa.id,
          sender_id: currentUserId,
          conteudo: mensagemTexto
        })

      if (error) throw error

      // Atualizar updated_at da conversa
      await supabase
        .from('conversas')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversa.id)

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      setNovaMensagem(mensagemTexto) // Restaurar mensagem em caso de erro
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getConversaName = () => {
    if (!conversa) return ''
    if (conversa.tipo === 'grupo') {
      return conversa.nome || 'Grupo'
    }
    const outroParticipante = conversa.participantes?.find(
      p => p.user_id !== currentUserId
    )
    return outroParticipante?.profile?.full_name || outroParticipante?.profile?.email || 'Usuário'
  }

  const getOutroParticipanteId = () => {
    if (!conversa || conversa.tipo === 'grupo') return null
    return conversa.participantes?.find(p => p.user_id !== currentUserId)?.user_id
  }

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) {
      return format(date, 'HH:mm')
    }
    if (isYesterday(date)) {
      return `Ontem ${format(date, 'HH:mm')}`
    }
    return format(date, 'dd/MM HH:mm', { locale: ptBR })
  }

  const groupMessagesByDate = (msgs: Mensagem[]) => {
    const groups: { [key: string]: Mensagem[] } = {}
    
    msgs.forEach(msg => {
      const date = new Date(msg.created_at)
      let key: string
      
      if (isToday(date)) {
        key = 'Hoje'
      } else if (isYesterday(date)) {
        key = 'Ontem'
      } else {
        key = format(date, "dd 'de' MMMM", { locale: ptBR })
      }
      
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(msg)
    })
    
    return groups
  }

  if (!conversa) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/10">
        <div className="text-center text-muted-foreground">
          <MessageSquarePlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Selecione uma conversa ou inicie uma nova</p>
        </div>
      </div>
    )
  }

  const outroId = getOutroParticipanteId()
  const isOnline = outroId ? isUserOnline(outroId) : false
  const messageGroups = groupMessagesByDate(mensagens)

  return (
    <div className="flex-1 flex flex-col w-full">
      {/* Header da conversa */}
      <div className="p-2 md:p-3 border-b bg-card flex items-center gap-2 md:gap-3">
        <div className="relative">
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
                getInitials(getConversaName())
              )}
            </AvatarFallback>
          </Avatar>
          {conversa.tipo === 'privada' && (
            <Circle className={cn(
              "w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5",
              isOnline ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"
            )} />
          )}
        </div>
        <div>
          <p className="font-medium text-sm">{getConversaName()}</p>
          <p className={cn(
            "text-xs",
            isOnline ? "text-green-600" : "text-muted-foreground"
          )}>
            {conversa.tipo === 'grupo' 
              ? `${conversa.participantes?.length || 0} participantes`
              : isOnline ? "Online" : "Offline"
            }
          </p>
        </div>
      </div>

      {/* Área de mensagens */}
      <ScrollArea ref={scrollRef} className="flex-1 p-3">
        <div className="space-y-4">
          {Object.entries(messageGroups).map(([dateLabel, msgs]) => (
            <div key={dateLabel}>
              {/* Separador de data */}
              <div className="flex items-center justify-center my-3">
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {dateLabel}
                </span>
              </div>
              
              {/* Mensagens do dia */}
              <div className="space-y-2">
                {msgs.map((mensagem) => {
                  const isOwn = mensagem.sender_id === currentUserId
                  
                  return (
                    <div
                      key={mensagem.id}
                      className={cn(
                        "flex items-end gap-2",
                        isOwn ? "justify-end" : "justify-start"
                      )}
                    >
                      {!isOwn && conversa.tipo === 'grupo' && (
                        <Avatar className="w-6 h-6 flex-shrink-0">
                          <AvatarFallback className="text-[10px] bg-muted">
                            {getInitials(mensagem.sender?.full_name || mensagem.sender?.email || 'U')}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div
                        className={cn(
                          "max-w-[70%] rounded-lg px-3 py-2",
                          isOwn 
                            ? "bg-primary text-primary-foreground rounded-br-none" 
                            : "bg-muted rounded-bl-none"
                        )}
                      >
                        {!isOwn && conversa.tipo === 'grupo' && (
                          <p className="text-xs font-medium mb-0.5 opacity-70">
                            {mensagem.sender?.full_name || mensagem.sender?.email}
                          </p>
                        )}
                        <p className="text-sm break-words">{mensagem.conteudo}</p>
                        <p className={cn(
                          "text-[10px] mt-1",
                          isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
                        )}>
                          {format(new Date(mensagem.created_at), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          
          {mensagens.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-sm">Nenhuma mensagem ainda</p>
              <p className="text-xs mt-1">Envie a primeira mensagem!</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input de mensagem */}
      <div className="p-2 md:p-3 border-t bg-card">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Digite sua mensagem..."
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
            className="flex-1 text-sm md:text-base"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!novaMensagem.trim() || isLoading}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
