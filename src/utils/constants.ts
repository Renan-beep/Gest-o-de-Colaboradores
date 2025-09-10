// Constantes do sistema
export const USER_ROLES = {
  ADMIN: 'admin',
  GERENCIA: 'gerencia',
  ENCARREGADO: 'encarregado',
} as const;

export const STATUS_COLABORADOR = {
  ATIVO: 'ativo',
  AFASTADO: 'afastado',
} as const;

export const STATUS_CHAMADA = {
  PRESENTE: 'presente',
  AUSENTE: 'ausente',
  JUSTIFICADO: 'justificado',
} as const;

export const STATUS_SOLICITACAO = {
  PENDENTE: 'pendente',
  APROVADA: 'aprovada',
  REJEITADA: 'rejeitada',
} as const;

export const TIPOS_MOVIMENTACAO = {
  TRANSFERENCIA: 'transferencia',
  PROMOCAO: 'promocao',
  MUDANCA_TURNO: 'mudanca_turno',
  AFASTAMENTO: 'afastamento',
  RETORNO: 'retorno',
} as const;

export const TURNOS = {
  MANHA: 'manhã',
  TARDE: 'tarde',
  NOITE: 'noite',
  ADMINISTRATIVO: 'administrativo',
} as const;

// Mensagens padrão
export const MESSAGES = {
  SUCCESS: {
    SAVE: 'Dados salvos com sucesso!',
    UPDATE: 'Dados atualizados com sucesso!',
    DELETE: 'Item removido com sucesso!',
    LOGIN: 'Login realizado com sucesso!',
    LOGOUT: 'Logout realizado com sucesso!',
  },
  ERROR: {
    GENERIC: 'Ocorreu um erro inesperado. Tente novamente.',
    NETWORK: 'Erro de conexão. Verifique sua internet.',
    UNAUTHORIZED: 'Você não tem permissão para esta ação.',
    NOT_FOUND: 'Item não encontrado.',
    VALIDATION: 'Dados inválidos. Verifique os campos.',
  },
  LOADING: {
    SAVING: 'Salvando...',
    LOADING: 'Carregando...',
    PROCESSING: 'Processando...',
  },
} as const;

// Configurações de paginação
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

// Validações
export const VALIDATION = {
  EMAIL_REGEX: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  PHONE_REGEX: /^\(\d{2}\) \d{4,5}-\d{4}$/,
  MIN_PASSWORD_LENGTH: 6,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
} as const;

// Formatação
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  ISO: 'yyyy-MM-dd',
  DATETIME: 'dd/MM/yyyy HH:mm',
} as const;