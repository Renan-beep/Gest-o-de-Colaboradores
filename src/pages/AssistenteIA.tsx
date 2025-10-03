import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Bot, Send, Trash2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AssistenteIA() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Olá! Sou seu assistente de IA especializado em recursos humanos. Posso ajudá-lo com:\n\n" +
        "📊 Gerar relatórios sobre colaboradores\n" +
        "👥 Criar e gerenciar equipes automaticamente\n" +
        "📈 Analisar dados de chamadas e presença\n" +
        "📉 Fornecer insights sobre demissões\n" +
        "🔍 Realizar análises personalizadas\n\n" +
        "Como posso ajudá-lo hoje?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { messages: [...messages, userMessage] }
      });

      if (error) throw error;

      if (data?.message) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.message
        }]);
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erro",
        description: "Erro ao comunicar com o assistente de IA",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        role: "assistant",
        content: "Conversa limpa! Como posso ajudá-lo?"
      }
    ]);
  };

  const suggestedPrompts = [
    "Gere um relatório de todos os colaboradores ativos",
    "Crie 5 equipes automaticamente com os colaboradores do setor Produção",
    "Mostre estatísticas de chamadas dos últimos 30 dias",
    "Liste colaboradores veteranos (5+ anos)",
    "Analise as demissões do último trimestre"
  ];

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Bot className="w-8 h-8 text-primary" />
          <Sparkles className="w-4 h-4 text-primary absolute -top-1 -right-1" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Assistente de IA</h1>
          <p className="text-muted-foreground">Geração de relatórios e automação inteligente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 h-[calc(100%-5rem)]">
        <Card className="shadow-card flex flex-col h-full">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Chat com Assistente
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.role === "assistant" && (
                          <Bot className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5" />
                        <div className="flex gap-1">
                          <span className="animate-bounce">●</span>
                          <span className="animate-bounce delay-100">●</span>
                          <span className="animate-bounce delay-200">●</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {messages.length === 1 && (
              <div className="p-4 border-t bg-muted/50">
                <p className="text-sm font-medium mb-3">Sugestões:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedPrompts.map((prompt, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => setInput(prompt)}
                    >
                      {prompt}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Digite sua solicitação aqui... (Enter para enviar, Shift+Enter para nova linha)"
                  className="min-h-[60px] resize-none"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="lg"
                  className="px-8"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Usando modelo Gemini 2.5 Flash - Grátis até 6 de outubro
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
