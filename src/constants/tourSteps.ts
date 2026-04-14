import { TourStep } from "@/hooks/usePageTour";

export const menuHomeTourSteps: TourStep[] = [
  {
    title: "🏠 Painel Inicial",
    description: "Este é o Painel Inicial do sistema. Aqui você encontra todos os menus organizados por seções: Gestão, Chamada, Relatórios e Ajuda. Basta clicar no card desejado para acessar a funcionalidade.",
  },
  {
    title: "🔵 Início (Dashboard)",
    description: "Abre o Dashboard principal com indicadores gerais: total de colaboradores, ativos e afastados. Os cards são clicáveis e abrem popups com a lista detalhada. Também mostra gráficos de turnover e histórico de demissões.",
  },
  {
    title: "🟢 Lista de Colaboradores",
    description: "Tabela completa de todos os colaboradores. Permite buscar por nome/matrícula, filtrar por Turno, Sexo, Liderança e Subsetor (multi-seleção), ordenar por qualquer coluna e exportar para Excel. Abas para Ativos e Demitidos.",
  },
  {
    title: "🟣 Cadastro",
    description: "Formulário para cadastrar novos colaboradores. Preencha matrícula, nome, setor, turno, cargo, liderança, sexo e data de admissão. Os campos de seleção são configuráveis pelo administrador.",
  },
  {
    title: "⚫ Conta",
    description: "Configurações do seu perfil: altere nome, foto de avatar, logo da empresa (aparece no cabeçalho para todos) e sua senha de acesso.",
  },
  {
    title: "🟡 Solicitações",
    description: "Crie solicitações de movimentação: transferência de setor, mudança de turno ou alteração de cargo. A gerência recebe e pode aprovar ou rejeitar com observações.",
  },
  {
    title: "🟢 Controle de Presença",
    description: "Registre a presença diária com 7 status: Presente, Falta, Atestado, Férias, Afastado, Folga e Licença. Os cards de indicadores são clicáveis e permitem filtro acumulativo.",
  },
  {
    title: "🟦 Banco de Chamadas",
    description: "Histórico completo de chamadas. Consulte o registro de presença de qualquer colaborador em qualquer data passada.",
  },
  {
    title: "🟪 Previsão de Sábados",
    description: "Planeje quem vai trabalhar nos sábados. Selecione a data, defina 'Virá' ou 'Não Virá' para cada colaborador. Tem filtros avançados e indicadores clicáveis.",
  },
  {
    title: "🟧 Operação",
    description: "Mapa visual mostrando a distribuição dos colaboradores por setor em tempo real, com cores indicando o status de presença.",
  },
  {
    title: "🔴 Indicadores",
    description: "Painel de métricas e relatórios avançados com dados de performance, tendências e estatísticas detalhadas.",
  },
  {
    title: "📘 Passo a Passo",
    description: "Acesse o manual completo em PDF para consulta offline. Contém instruções detalhadas de todas as funcionalidades.",
  },
];

export const dashboardTourSteps: TourStep[] = [
  {
    title: "🏠 Dashboard — Visão Geral",
    description: "O Dashboard mostra os indicadores gerais da empresa num relance. No topo, cards resumem Total de colaboradores, Ativos e Afastados.",
  },
  {
    title: "📊 Cards Clicáveis",
    description: "Cada card de indicador é CLICÁVEL. Ao clicar, um popup abre mostrando a lista detalhada dos colaboradores daquela categoria (ex: todos os afastados).",
  },
  {
    title: "📈 Indicadores BI",
    description: "As tabelas e gráficos de BI mostram distribuição por Setor, Turno, Liderança e Cargo. Cada item é clicável e abre popup com os nomes dos colaboradores.",
  },
  {
    title: "📉 Turnover e Demissões",
    description: "O indicador de Turnover mostra a rotatividade da equipe. O gráfico de histórico de demissões permite acompanhar tendências ao longo dos meses.",
  },
  {
    title: "🕐 Tempo de Empresa",
    description: "A tabela de Tempo de Empresa mostra há quanto tempo cada colaborador está na empresa, ajudando a identificar veteranos e novatos.",
  },
];

export const listaColaboradoresTourSteps: TourStep[] = [
  {
    title: "👥 Lista de Colaboradores",
    description: "Esta é a tabela principal com todos os colaboradores cadastrados no sistema. Aqui você tem controle total sobre visualização e busca.",
  },
  {
    title: "🔍 Barra de Busca",
    description: "Digite o nome ou matrícula do colaborador na barra de busca para encontrá-lo rapidamente. A busca filtra em tempo real.",
  },
  {
    title: "🎯 Filtros Multi-Seleção",
    description: "Use os filtros de Turno, Sexo, Liderança e Subsetor. Cada filtro permite selecionar MÚLTIPLAS opções ao mesmo tempo para refinar a lista.",
  },
  {
    title: "↕️ Ordenação por Coluna",
    description: "Clique no cabeçalho de qualquer coluna para ordenar a tabela. Clique novamente para inverter a ordem (crescente/decrescente).",
  },
  {
    title: "📥 Exportar para Excel",
    description: "O botão 'Exportar Excel' gera uma planilha com todos os dados atualmente filtrados. Perfeito para relatórios e análises externas.",
  },
  {
    title: "📑 Abas: Ativos e Demitidos",
    description: "Use as abas no topo para alternar entre colaboradores Ativos e Demitidos. Cada aba tem sua própria contagem.",
  },
  {
    title: "✏️ Editar Colaborador",
    description: "Clique em qualquer linha da tabela para abrir a edição do colaborador. Lá você pode alterar dados cadastrais, registrar demissão ou reativar.",
  },
];

export const chamadaTourSteps: TourStep[] = [
  {
    title: "✅ Controle de Presença",
    description: "Esta é a tela principal de registro de presença diária dos colaboradores. Aqui você define o status de cada um para o dia selecionado.",
  },
  {
    title: "📅 Seletor de Data",
    description: "Use o seletor de data no topo para escolher o dia. Você pode registrar presença para hoje ou consultar/editar dias anteriores.",
  },
  {
    title: "📊 Cards de Status do Dia",
    description: "Os cards coloridos no topo mostram a contagem por status: Presentes, Faltas, Atestados, Férias, Afastados, Folga e Licença. São CLICÁVEIS para filtrar a lista!",
  },
  {
    title: "🔗 Filtro Acumulativo",
    description: "A seleção dos cards de status é ACUMULATIVA: clique em 'Falta' + 'Atestado' para ver ambos ao mesmo tempo. Clique novamente para desmarcar.",
  },
  {
    title: "🎯 Filtros Avançados",
    description: "Os filtros de Liderança, Turno, Sexo, Setor e Subsetor permitem focar na sua equipe. Combine com os cards de status para filtragem precisa.",
  },
  {
    title: "🧹 Limpar Filtros",
    description: "O botão 'Limpar filtros' (ícone X vermelho) aparece quando há filtros ativos e reseta TUDO de uma vez — cards e filtros de seleção.",
  },
  {
    title: "📝 Registrar Status",
    description: "Para cada colaborador, use o dropdown à direita para selecionar o status. A alteração é salva automaticamente no banco de dados.",
  },
  {
    title: "⚠️ Pendências",
    description: "Colaboradores sem status definido aparecem como 'Pendente'. O card de pendências mostra quantos faltam. Complete todos antes do fechamento do dia!",
  },
  {
    title: "📋 Banco de Chamadas",
    description: "Use a aba 'Banco de Chamadas' para consultar o histórico completo de presença de qualquer colaborador em qualquer período.",
  },
];

export const chamadaSabadoTourSteps: TourStep[] = [
  {
    title: "📅 Previsão de Sábados",
    description: "Planeje quem vai trabalhar nos sábados. Defina a previsão de cada colaborador para o sábado selecionado.",
  },
  {
    title: "📆 Selecionar Sábado",
    description: "Use o calendário para escolher o sábado que deseja planejar. Apenas sábados ficam disponíveis para seleção.",
  },
  {
    title: "✅❌ Definir Previsão",
    description: "Para cada colaborador, clique em 'Virá' (verde) ou 'Não Virá' (vermelho). Colaboradores sem definição ficam como 'Pendente'.",
  },
  {
    title: "📊 Indicadores Clicáveis",
    description: "Os cards Virá, Não Virá e Pendente no topo são clicáveis e filtram a lista. A seleção é acumulativa — clique em mais de um para combinar.",
  },
  {
    title: "🎯 Filtros Avançados",
    description: "Use os filtros de Liderança, Turno, Sexo, Setor e Subsetor para focar na sua equipe. Iguais aos da Chamada diária.",
  },
  {
    title: "🧹 Limpar Filtros",
    description: "O botão 'Limpar filtros' reseta todos os filtros e seleções de indicadores de uma vez.",
  },
  {
    title: "💾 Salvar Previsão",
    description: "Após definir todos os status, clique em 'Salvar Previsão' para gravar as definições no sistema.",
  },
];

export const operacaoTourSteps: TourStep[] = [
  {
    title: "🏭 Mapa da Operação",
    description: "Visualize a distribuição dos colaboradores por setor em formato de mapa visual. Cada bloco representa um setor da empresa.",
  },
  {
    title: "🎨 Cores de Status",
    description: "Dentro de cada setor, os colaboradores aparecem com cores: verde (presente), vermelho (falta), amarelo (atestado), azul (férias), cinza (afastado), etc.",
  },
  {
    title: "📅 Seleção de Data",
    description: "Use o seletor de data para ver o mapa de qualquer dia. Por padrão mostra o dia atual.",
  },
  {
    title: "👁️ Visão Rápida",
    description: "Passe o mouse sobre qualquer colaborador para ver detalhes como nome, cargo e status atual. Ideal para uma visão geral rápida da operação.",
  },
];

export const solicitacaoTourSteps: TourStep[] = [
  {
    title: "📝 Solicitações de Movimentação",
    description: "Gerencie transferências de colaboradores entre setores, turnos ou cargos. Crie, acompanhe e (se gerência) aprove ou rejeite solicitações.",
  },
  {
    title: "➕ Nova Solicitação",
    description: "Clique em 'Nova Solicitação' para pedir uma movimentação. Selecione o colaborador, o tipo (transferência de setor, turno ou cargo), o destino e escreva a justificativa.",
  },
  {
    title: "📋 Lista de Solicitações",
    description: "Todas as solicitações ficam listadas com status: Pendente (amarelo), Aprovada (verde) ou Rejeitada (vermelho). Clique para ver detalhes.",
  },
  {
    title: "✅ Aprovar/Rejeitar",
    description: "Se você é gerência, pode aprovar ou rejeitar solicitações pendentes. Ao decidir, pode adicionar observações que o solicitante verá.",
  },
];

export const contaTourSteps: TourStep[] = [
  {
    title: "⚙️ Configurações de Conta",
    description: "Gerencie seu perfil pessoal e configurações do sistema nesta página.",
  },
  {
    title: "👤 Nome e Avatar",
    description: "Altere seu nome de exibição e foto de avatar. O avatar aparece no cabeçalho e no chat interno.",
  },
  {
    title: "🏢 Logo da Empresa",
    description: "Carregue a logo da empresa. Ela aparecerá no cabeçalho do sistema para TODOS os usuários, não apenas para você.",
  },
  {
    title: "🔒 Alterar Senha",
    description: "Mude sua senha de acesso ao sistema. Digite a nova senha e confirme para salvar.",
  },
];

export const indicadoresTourSteps: TourStep[] = [
  {
    title: "📊 Indicadores e Relatórios",
    description: "Painel avançado de métricas da força de trabalho. Visualize dados consolidados e tendências.",
  },
  {
    title: "📈 Métricas Detalhadas",
    description: "Veja indicadores por período, com filtros de data. Analise tendências de presença, faltas e rotatividade ao longo do tempo.",
  },
  {
    title: "📋 Relatórios",
    description: "Gere relatórios customizados para apresentações e análises gerenciais.",
  },
];

export const cadastroTourSteps: TourStep[] = [
  {
    title: "📝 Cadastro de Colaborador",
    description: "Formulário para adicionar novos colaboradores ao sistema. Todos os campos obrigatórios estão marcados.",
  },
  {
    title: "📋 Campos do Formulário",
    description: "Preencha: Matrícula, Nome, Setor, Subsetor, Turno, Cargo, Liderança, Sexo e Data de Admissão. Os campos de seleção são configuráveis.",
  },
  {
    title: "⚙️ Configurar Opções",
    description: "Use o botão de configuração (engrenagem) ao lado dos campos para adicionar, editar ou remover opções dos dropdowns (ex: novos setores, cargos).",
  },
  {
    title: "💾 Salvar",
    description: "Após preencher todos os campos, clique em 'Cadastrar' para salvar o novo colaborador. Ele aparecerá automaticamente nas listas e chamadas.",
  },
];
