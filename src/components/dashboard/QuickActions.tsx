import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Users, UserPlus, UserCheck, BarChart3, ArrowRight, Zap } from "lucide-react";

const quickActions = [
  {
    title: "Cadastro Rápido",
    description: "Adicionar novo colaborador",
    icon: UserPlus,
    path: "/cadastro",
    variant: "default" as const,
    className: "btn-gradient glow-hover"
  },
  {
    title: "Chamada Hoje",
    description: "Registrar presença",
    icon: UserCheck,
    path: "/chamada",
    variant: "default" as const,
    className: "bg-success hover:bg-success/90 text-white"
  },
  {
    title: "Relatórios",
    description: "Ver indicadores",
    icon: BarChart3,
    path: "/indicadores",
    variant: "secondary" as const,
    className: "card-hover"
  },
  {
    title: "Colaboradores",
    description: "Gerenciar equipe",
    icon: Users,
    path: "/lista-colaboradores",
    variant: "outline" as const,
    className: "card-hover"
  }
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Ações Rápidas</CardTitle>
            <CardDescription>Acesse as principais funcionalidades</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {quickActions.map((action) => (
          <Button
            key={action.path}
            variant={action.variant}
            size="lg"
            className={`w-full justify-between h-auto p-4 ${action.className}`}
            onClick={() => navigate(action.path)}
          >
            <div className="flex items-center gap-3">
              <action.icon className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">{action.title}</div>
                <div className="text-xs opacity-80">{action.description}</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4" />
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}