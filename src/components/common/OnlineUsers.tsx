import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Users, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

interface OnlineUser {
  id: string
  email: string
  name: string
  online_at: string
  page?: string
}

export function OnlineUsers() {
  const { user } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

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
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('👤 Usuário entrou:', newPresences)
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('👤 Usuário saiu:', leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const userInfo: OnlineUser = {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
            online_at: new Date().toISOString(),
            page: window.location.pathname
          }
          
          await channel.track(userInfo)
          console.log('📡 Presença registrada:', userInfo)
        }
      })

    // Atualizar página atual quando navegar
    const handleRouteChange = async () => {
      if (channel.state === 'joined') {
        const userInfo: OnlineUser = {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
          online_at: new Date().toISOString(),
          page: window.location.pathname
        }
        await channel.track(userInfo)
      }
    }

    window.addEventListener('popstate', handleRouteChange)

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
      supabase.removeChannel(channel)
    }
  }, [user])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getPageName = (path: string) => {
    const routes: { [key: string]: string } = {
      '/': 'Dashboard',
      '/chamada': 'Controle de Presença',
      '/chamada-sabado': 'Previsão de Sábados',
      '/lista-colaboradores': 'Lista de Colaboradores',
      '/cadastro': 'Cadastro',
      '/configuracoes-conta': 'Conta',
      '/solicitacao-movimentacao': 'Solicitações'
    }
    return routes[path] || path
  }

  const totalOnline = onlineUsers.length + 1 // +1 para incluir o próprio usuário
  return (
    <div 
      className={cn(
        "fixed bottom-4 right-4 z-50 transition-all duration-300",
        isExpanded ? "w-64" : "w-auto"
      )}
    >
      <div 
        className={cn(
          "bg-card border shadow-lg rounded-xl overflow-hidden",
          "animate-in slide-in-from-right-5 duration-300"
        )}
      >
        {/* Header - sempre visível */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors"
        >
          <div className="relative">
            <Users className="w-5 h-5 text-primary" />
            <Circle className="w-2.5 h-2.5 fill-green-500 text-green-500 absolute -top-0.5 -right-0.5" />
          </div>
          
          {!isExpanded ? (
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">{totalOnline}</span>
              {onlineUsers.length > 0 && (
                <div className="flex -space-x-2 ml-1">
                  {onlineUsers.slice(0, 3).map((onlineUser) => (
                    <Tooltip key={onlineUser.id}>
                      <TooltipTrigger asChild>
                        <Avatar className="w-6 h-6 border-2 border-background">
                          <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                            {getInitials(onlineUser.name)}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="font-medium">{onlineUser.name}</p>
                        {onlineUser.page && (
                          <p className="text-xs text-muted-foreground">
                            em {getPageName(onlineUser.page)}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              )}
              {onlineUsers.length > 3 && (
                <Badge variant="secondary" className="text-xs px-1.5">
                  +{onlineUsers.length - 3}
                </Badge>
              )}
            </div>
          ) : (
            <span className="font-medium text-sm flex-1 text-left">
              {totalOnline} online
            </span>
          )}
        </button>

        {/* Lista expandida */}
        {isExpanded && (
          <div className="border-t max-h-48 overflow-y-auto">
            {/* Próprio usuário */}
            {user && (
              <div className="flex items-center gap-3 p-3 bg-muted/20">
                <div className="relative">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-green-600 text-white text-xs">
                      {getInitials(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Eu')}
                    </AvatarFallback>
                  </Avatar>
                  <Circle className="w-2.5 h-2.5 fill-green-500 text-green-500 absolute -bottom-0.5 -right-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]} <span className="text-muted-foreground">(você)</span>
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {getPageName(window.location.pathname)}
                  </p>
                </div>
              </div>
            )}
            
            {/* Outros usuários */}
            {onlineUsers.map((onlineUser) => (
              <div 
                key={onlineUser.id}
                className="flex items-center gap-3 p-3 hover:bg-muted/30"
              >
                <div className="relative">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(onlineUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <Circle className="w-2.5 h-2.5 fill-green-500 text-green-500 absolute -bottom-0.5 -right-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{onlineUser.name}</p>
                  {onlineUser.page && (
                    <p className="text-xs text-muted-foreground truncate">
                      {getPageName(onlineUser.page)}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {onlineUsers.length === 0 && (
              <div className="p-3 text-center text-sm text-muted-foreground">
                Nenhum outro usuário online
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
