import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Download, Play } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";

export default function GuiaDoSistema() {
  const { startTour } = useOnboarding();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Passo a Passo do Sistema</h1>
          <p className="text-muted-foreground">Aprenda a usar todas as funcionalidades</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Download Card */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Manual em PDF
            </CardTitle>
            <CardDescription>
              Baixe o guia completo do sistema em formato PDF para consulta offline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              O manual contém instruções detalhadas sobre todas as funcionalidades do sistema, incluindo capturas de tela, dicas e boas práticas.
            </p>
            <Button asChild>
              <a href="/Passo_a_Passo_do_Sistema.pdf" download>
                <Download className="w-4 h-4 mr-2" />
                Baixar PDF do Manual
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Onboarding Tour Card */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Tour Interativo
            </CardTitle>
            <CardDescription>
              Inicie um tour guiado que explica cada menu e funcionalidade do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              O tour interativo guia você passo a passo pela interface, destacando cada funcionalidade e explicando como utilizá-la.
            </p>
            <Button onClick={startTour} variant="secondary">
              <Play className="w-4 h-4 mr-2" />
              Iniciar Tour do Sistema
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Sections overview */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Conteúdo do Manual</CardTitle>
          <CardDescription>Tópicos abordados no guia completo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { num: "1", title: "Visão Geral do Sistema" },
              { num: "2", title: "Login e Autenticação" },
              { num: "3", title: "Painel Inicial" },
              { num: "4", title: "Dashboard e Indicadores" },
              { num: "5", title: "Lista de Colaboradores" },
              { num: "6", title: "Cadastro de Colaboradores" },
              { num: "7", title: "Configurações de Conta" },
              { num: "8", title: "Solicitações de Movimentação" },
              { num: "9", title: "Controle de Presença" },
              { num: "10", title: "Banco de Chamadas" },
              { num: "11", title: "Previsão de Sábados" },
              { num: "12", title: "Operação (Mapa Visual)" },
              { num: "13", title: "Indicadores e Relatórios" },
              { num: "14", title: "Chat Interno" },
              { num: "15", title: "Dicas e Boas Práticas" },
            ].map(item => (
              <div key={item.num} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {item.num}
                </span>
                <span className="text-sm font-medium">{item.title}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
