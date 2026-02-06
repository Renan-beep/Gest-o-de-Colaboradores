export interface HeadcountColaborador {
  id: string;
  colaborador_origem_id: string | null;
  matricula: string;
  colaborador: string;
  cargo: string | null;
  setor: string | null;
  subsetor: string | null;
  turno: string | null;
  lideranca: string | null;
  sexo: string | null;
  admissao: string | null;
  status: string;
  adicionado_manualmente: boolean;
  movimentacao_tipo?: string | null;
  movimentacao_data?: string | null;
  movimentacao_id?: string | null;
}
