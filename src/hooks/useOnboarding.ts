import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  route?: string;
  targetSelector?: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
}

const tourSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao Sistema!",
    description: "Este tour vai guiar você pelas principais funcionalidades do sistema de Gestão de Colaboradores. Clique em 'Próximo' para continuar.",
    route: "/",
    position: "center",
  },
  {
    id: "menu-gestao",
    title: "Seção: Gestão",
    description: "Aqui ficam os menus de gestão: Dashboard com indicadores, lista de colaboradores, cadastro, configurações de conta e solicitações de movimentação.",
    route: "/",
    position: "center",
  },
  {
    id: "menu-chamada",
    title: "Seção: Chamada",
    description: "Controle de presença diária, banco de chamadas com histórico, previsão de sábados e o mapa visual da operação por setor.",
    route: "/",
    position: "center",
  },
  {
    id: "dashboard",
    title: "Dashboard (Início)",
    description: "O Dashboard mostra indicadores gerais: total de colaboradores, ativos e afastados. Clique nos cards para ver detalhes em popup. Também exibe gráficos de turnover e demissões.",
    route: "/dashboard",
    position: "center",
  },
  {
    id: "dashboard-bi",
    title: "Indicadores BI Clicáveis",
    description: "Os indicadores por Setor, Turno, Liderança e Cargo são clicáveis. Ao clicar, um popup exibe a lista detalhada dos colaboradores daquela categoria.",
    route: "/dashboard",
    position: "center",
  },
  {
    id: "lista-colab",
    title: "Lista de Colaboradores",
    description: "Tabela completa com busca, filtros multi-seleção (Turno, Sexo, Liderança, Subsetor), ordenação por coluna e exportação para Excel. Use as abas para alternar entre Ativos e Demitidos.",
    route: "/lista-colaboradores",
    position: "center",
  },
  {
    id: "chamada",
    title: "Controle de Presença",
    description: "Registre a presença diária dos colaboradores com 7 status: Presente, Falta, Atestado, Férias, Afastado, Folga e Licença. Os cards de indicadores no topo são clicáveis e acumulativos para filtrar.",
    route: "/chamada",
    position: "center",
  },
  {
    id: "chamada-filtros",
    title: "Filtros da Chamada",
    description: "Use os filtros de Liderança, Turno, Sexo, Setor e Subsetor para focar nos colaboradores da sua equipe. O botão 'Limpar filtros' reseta tudo rapidamente.",
    route: "/chamada",
    position: "center",
  },
  {
    id: "sabado",
    title: "Previsão de Sábados",
    description: "Planeje quem virá trabalhar no sábado. Selecione o sábado no calendário, defina 'Virá' ou 'Não Virá' para cada colaborador e salve. Os indicadores são clicáveis para filtrar.",
    route: "/chamada-sabado",
    position: "center",
  },
  {
    id: "operacao",
    title: "Mapa da Operação",
    description: "Visualize em tempo real a distribuição dos colaboradores por setor, com cores indicando o status de presença de cada um.",
    route: "/operacao",
    position: "center",
  },
  {
    id: "solicitacoes",
    title: "Solicitações de Movimentação",
    description: "Solicite transferências de colaboradores entre setores, turnos ou cargos. A gerência recebe notificação e pode aprovar ou rejeitar com observações.",
    route: "/solicitacao-movimentacao",
    position: "center",
  },
  {
    id: "conta",
    title: "Configurações de Conta",
    description: "Gerencie seu perfil: nome, avatar, logo da empresa e senha. A logo carregada aqui aparece para todos os usuários no cabeçalho.",
    route: "/configuracoes-conta",
    position: "center",
  },
  {
    id: "fim",
    title: "Tour Concluído! 🎉",
    description: "Você conheceu todas as funcionalidades do sistema! Lembre-se: o manual em PDF está disponível no menu 'Passo a Passo' para consulta a qualquer momento.",
    route: "/",
    position: "center",
  },
];

export function useOnboarding() {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const startTour = useCallback(() => {
    setCurrentStepIndex(0);
    setIsActive(true);
    if (tourSteps[0].route) {
      navigate(tourSteps[0].route);
    }
  }, [navigate]);

  const nextStep = useCallback(() => {
    const nextIdx = currentStepIndex + 1;
    if (nextIdx >= tourSteps.length) {
      setIsActive(false);
      return;
    }
    setCurrentStepIndex(nextIdx);
    const step = tourSteps[nextIdx];
    if (step.route) {
      navigate(step.route);
    }
  }, [currentStepIndex, navigate]);

  const prevStep = useCallback(() => {
    const prevIdx = currentStepIndex - 1;
    if (prevIdx < 0) return;
    setCurrentStepIndex(prevIdx);
    const step = tourSteps[prevIdx];
    if (step.route) {
      navigate(step.route);
    }
  }, [currentStepIndex, navigate]);

  const endTour = useCallback(() => {
    setIsActive(false);
    navigate("/");
  }, [navigate]);

  return {
    isActive,
    currentStep: tourSteps[currentStepIndex],
    currentStepIndex,
    totalSteps: tourSteps.length,
    startTour,
    nextStep,
    prevStep,
    endTour,
  };
}
