import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  route?: string;
}

const tourSteps: OnboardingStep[] = [
  // === BOAS-VINDAS ===
  {
    id: "welcome",
    title: "Bem-vindo ao Sistema! 👋",
    description: "Este tour vai guiar você por TODAS as funcionalidades do sistema de Gestão de Colaboradores. A cada passo, vamos explicar o que cada botão e recurso faz. Clique em 'Próximo' para começar!",
    route: "/",
  },

  // === PAINEL INICIAL ===
  {
    id: "menu-visao-geral",
    title: "🏠 Painel Inicial — Visão Geral",
    description: "Este é o Painel Inicial. Ele é dividido em seções com cards coloridos: Gestão, Chamada, Indicadores e Ajuda. Cada card leva a uma funcionalidade específica do sistema. Basta clicar no card desejado.",
    route: "/",
  },
  {
    id: "menu-btn-inicio",
    title: "🔵 Botão: Início",
    description: "O card 'Início' abre o Dashboard principal. Lá você encontra os indicadores gerais da empresa: total de colaboradores, ativos, afastados, gráficos de turnover e histórico de demissões. Os cards de indicadores são clicáveis e abrem popups com detalhes.",
    route: "/",
  },
  {
    id: "menu-btn-lista",
    title: "🟢 Botão: Lista de Colaboradores",
    description: "Abre a tabela completa de todos os colaboradores. Permite buscar por nome/matrícula, filtrar por Turno, Sexo, Liderança e Subsetor (multi-seleção), ordenar por qualquer coluna e exportar a lista para Excel. Tem abas para alternar entre Ativos e Demitidos.",
    route: "/",
  },
  {
    id: "menu-btn-cadastro",
    title: "🟣 Botão: Cadastro",
    description: "Formulário para cadastrar novos colaboradores no sistema. Preencha matrícula, nome, setor, turno, cargo, liderança, sexo e data de admissão. Os campos de seleção (setor, turno, etc.) são configuráveis pelo administrador.",
    route: "/",
  },
  {
    id: "menu-btn-conta",
    title: "⚫ Botão: Conta",
    description: "Configurações do seu perfil pessoal. Aqui você pode alterar seu nome, foto de avatar, logo da empresa (que aparece no cabeçalho para todos) e sua senha de acesso.",
    route: "/",
  },
  {
    id: "menu-btn-solicitacoes",
    title: "🟡 Botão: Solicitações",
    description: "Crie solicitações de movimentação de colaboradores: transferências de setor, turno ou cargo. A gerência recebe a solicitação e pode aprovar ou rejeitar com observações. Você acompanha o status em tempo real.",
    route: "/",
  },
  {
    id: "menu-btn-chamada",
    title: "🟢 Botão: Controle de Presença",
    description: "Registre a presença diária dos colaboradores. Defina o status de cada um: Presente, Falta, Atestado, Férias, Afastado, Folga ou Licença. Os indicadores do dia no topo são clicáveis e permitem filtrar a lista por status (seleção acumulativa).",
    route: "/",
  },
  {
    id: "menu-btn-banco",
    title: "🟦 Botão: Banco de Chamadas",
    description: "Acessa o histórico completo de chamadas. Consulte o registro de presença de qualquer colaborador em qualquer data passada. Útil para conferir faltas, atestados e padrões de ausência.",
    route: "/",
  },
  {
    id: "menu-btn-sabado",
    title: "🟪 Botão: Previsão de Sábados",
    description: "Planeje quem vai trabalhar nos sábados. Selecione a data do sábado no calendário, defina 'Virá' ou 'Não Virá' para cada colaborador e salve. Tem filtros por Liderança, Turno, Sexo, Setor e Subsetor, além de indicadores clicáveis.",
    route: "/",
  },
  {
    id: "menu-btn-operacao",
    title: "🟧 Botão: Operação",
    description: "Mapa visual da operação. Mostra a distribuição dos colaboradores por setor em tempo real, com cores indicando o status de presença de cada um. Ideal para ter uma visão rápida de quem está onde.",
    route: "/",
  },
  {
    id: "menu-btn-indicadores",
    title: "🔴 Botão: Indicadores",
    description: "Painel de métricas e relatórios avançados. Visualize dados de performance, tendências e estatísticas detalhadas sobre a força de trabalho da empresa.",
    route: "/",
  },
  {
    id: "menu-btn-guia",
    title: "🔵 Botão: Passo a Passo",
    description: "É onde você está agora! Este menu oferece o download do manual completo em PDF e o botão para iniciar este Tour Interativo sempre que precisar relembrar como usar o sistema.",
    route: "/",
  },

  // === DASHBOARD ===
  {
    id: "dashboard-cards",
    title: "🏠 Dashboard — Cards de Indicadores",
    description: "No Dashboard, os cards no topo mostram: Total de colaboradores, Ativos e Afastados. Cada card é CLICÁVEL — ao clicar, um popup aparece com a lista detalhada dos colaboradores daquela categoria.",
    route: "/dashboard",
  },
  {
    id: "dashboard-bi",
    title: "📊 Dashboard — Indicadores BI",
    description: "Abaixo dos cards, você encontra gráficos e tabelas de BI: distribuição por Setor, Turno, Liderança e Cargo. Cada barra/item é clicável e abre um popup com os nomes dos colaboradores daquela categoria.",
    route: "/dashboard",
  },
  {
    id: "dashboard-graficos",
    title: "📈 Dashboard — Gráficos de Turnover",
    description: "O Dashboard também mostra o indicador de Turnover (rotatividade) e o histórico de demissões com gráfico de linha. Esses dados ajudam a acompanhar a saúde da equipe ao longo do tempo.",
    route: "/dashboard",
  },

  // === LISTA DE COLABORADORES ===
  {
    id: "lista-busca",
    title: "👥 Lista — Busca e Filtros",
    description: "Na Lista de Colaboradores, use a barra de busca para encontrar por nome ou matrícula. Os filtros multi-seleção (Turno, Sexo, Liderança, Subsetor) permitem combinar critérios. O botão 'Limpar filtros' reseta tudo de uma vez.",
    route: "/lista-colaboradores",
  },
  {
    id: "lista-tabela",
    title: "👥 Lista — Tabela e Exportação",
    description: "A tabela permite ordenar por qualquer coluna (clique no cabeçalho). O botão 'Exportar Excel' gera uma planilha com todos os dados filtrados. As abas 'Ativos' e 'Demitidos' separam os colaboradores por situação.",
    route: "/lista-colaboradores",
  },
  {
    id: "lista-editar",
    title: "✏️ Lista — Editar Colaborador",
    description: "Clique em qualquer linha da tabela para abrir a página de edição do colaborador. Lá você pode alterar todos os dados cadastrais, registrar demissão ou reativar um colaborador demitido.",
    route: "/lista-colaboradores",
  },

  // === CHAMADA ===
  {
    id: "chamada-status",
    title: "✅ Chamada — Cards de Status",
    description: "No topo da chamada, os cards mostram a contagem do dia: Presentes, Faltas, Atestados, Férias, Afastados, Folga e Licença. CLIQUE nos cards para filtrar a lista — a seleção é ACUMULATIVA: clique em 'Falta' + 'Atestado' para ver ambos ao mesmo tempo.",
    route: "/chamada",
  },
  {
    id: "chamada-filtros",
    title: "🔍 Chamada — Filtros Avançados",
    description: "Use os filtros de Liderança, Turno, Sexo, Setor e Subsetor para focar na sua equipe. Combine com os cards de status para uma filtragem precisa. O botão 'Limpar filtros' (ícone X vermelho) reseta tudo rapidamente.",
    route: "/chamada",
  },
  {
    id: "chamada-registrar",
    title: "📝 Chamada — Registrar Presença",
    description: "Para cada colaborador, selecione o status no dropdown à direita da linha. A alteração é salva automaticamente. Use o seletor de data no topo para registrar ou consultar chamadas de outros dias.",
    route: "/chamada",
  },
  {
    id: "chamada-pendencias",
    title: "⚠️ Chamada — Pendências",
    description: "Colaboradores sem status definido aparecem como 'Pendente'. O card de pendências no topo mostra quantos faltam. Complete todas as pendências antes do fechamento do dia para manter o controle atualizado.",
    route: "/chamada",
  },

  // === PREVISÃO DE SÁBADOS ===
  {
    id: "sabado-calendario",
    title: "📅 Sábados — Selecionar Data",
    description: "Use o calendário para escolher o sábado que deseja planejar. Apenas sábados ficam disponíveis para seleção. Ao escolher, a lista de colaboradores elegíveis aparece automaticamente.",
    route: "/chamada-sabado",
  },
  {
    id: "sabado-definir",
    title: "📅 Sábados — Definir Previsão",
    description: "Para cada colaborador, clique em 'Virá' (verde) ou 'Não Virá' (vermelho). Os indicadores no topo (Virá, Não Virá, Pendente) são clicáveis e filtram a lista. Use 'Salvar Previsão' para gravar as definições.",
    route: "/chamada-sabado",
  },
  {
    id: "sabado-filtros",
    title: "📅 Sábados — Filtros",
    description: "Assim como na chamada diária, use os filtros de Liderança, Turno, Sexo, Setor e Subsetor para focar na sua equipe. O botão 'Limpar filtros' reseta tudo rapidamente.",
    route: "/chamada-sabado",
  },

  // === OPERAÇÃO ===
  {
    id: "operacao-mapa",
    title: "🏭 Operação — Mapa Visual",
    description: "O Mapa da Operação mostra os setores da empresa como blocos coloridos. Dentro de cada bloco, os colaboradores aparecem com cores indicando seu status: verde (presente), vermelho (falta), amarelo (atestado), etc. Perfeito para uma visão geral rápida.",
    route: "/operacao",
  },

  // === SOLICITAÇÕES ===
  {
    id: "solicitacoes-criar",
    title: "📝 Solicitações — Criar Nova",
    description: "Clique em 'Nova Solicitação' para pedir uma movimentação: transferência de setor, mudança de turno ou alteração de cargo. Preencha o colaborador, o destino e a justificativa. A gerência será notificada.",
    route: "/solicitacao-movimentacao",
  },
  {
    id: "solicitacoes-acompanhar",
    title: "📝 Solicitações — Acompanhar",
    description: "Todas as solicitações ficam listadas com seu status: Pendente, Aprovada ou Rejeitada. A gerência pode adicionar observações ao aprovar ou rejeitar. Você recebe o feedback diretamente na tela.",
    route: "/solicitacao-movimentacao",
  },

  // === CONTA ===
  {
    id: "conta-perfil",
    title: "⚙️ Conta — Perfil e Logo",
    description: "Em Configurações de Conta, altere seu nome de exibição, foto de avatar pessoal e logo da empresa. A logo carregada aqui aparece no cabeçalho do sistema para TODOS os usuários. Você também pode alterar sua senha.",
    route: "/configuracoes-conta",
  },

  // === FIM ===
  {
    id: "fim",
    title: "Tour Concluído! 🎉",
    description: "Parabéns! Você conheceu todos os recursos do sistema em detalhes. Sempre que precisar relembrar, acesse o menu 'Passo a Passo' no Painel Inicial para baixar o manual em PDF ou reiniciar este tour.",
    route: "/",
  },
];

interface OnboardingContextType {
  isActive: boolean;
  currentStep: OnboardingStep | null;
  currentStepIndex: number;
  totalSteps: number;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const startTour = useCallback(() => {
    setCurrentStepIndex(0);
    setIsActive(true);
    if (tourSteps[0].route) navigate(tourSteps[0].route);
  }, [navigate]);

  const nextStep = useCallback(() => {
    const nextIdx = currentStepIndex + 1;
    if (nextIdx >= tourSteps.length) {
      setIsActive(false);
      return;
    }
    setCurrentStepIndex(nextIdx);
    if (tourSteps[nextIdx].route) navigate(tourSteps[nextIdx].route);
  }, [currentStepIndex, navigate]);

  const prevStep = useCallback(() => {
    const prevIdx = currentStepIndex - 1;
    if (prevIdx < 0) return;
    setCurrentStepIndex(prevIdx);
    if (tourSteps[prevIdx].route) navigate(tourSteps[prevIdx].route);
  }, [currentStepIndex, navigate]);

  const endTour = useCallback(() => {
    setIsActive(false);
    navigate("/");
  }, [navigate]);

  return (
    <OnboardingContext.Provider value={{
      isActive,
      currentStep: isActive ? tourSteps[currentStepIndex] : null,
      currentStepIndex,
      totalSteps: tourSteps.length,
      startTour,
      nextStep,
      prevStep,
      endTour,
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
