export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      alocacoes: {
        Row: {
          equipe_id: string
          matricula_colaborador: string
        }
        Insert: {
          equipe_id: string
          matricula_colaborador: string
        }
        Update: {
          equipe_id?: string
          matricula_colaborador?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_colaborador"
            columns: ["matricula_colaborador"]
            isOneToOne: true
            referencedRelation: "colaboradores"
            referencedColumns: ["matricula"]
          },
          {
            foreignKeyName: "fk_equipe"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
        ]
      }
      chamadas: {
        Row: {
          colaborador_id: string
          created_at: string
          data: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          colaborador_id: string
          created_at?: string
          data: string
          id?: string
          status: string
          updated_at?: string
        }
        Update: {
          colaborador_id?: string
          created_at?: string
          data?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chamadas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores: {
        Row: {
          admissao: string | null
          cargo: string | null
          colaborador: string
          created_at: string
          horario_almoco: string | null
          horario_cafe: string | null
          id: string
          lideranca: string | null
          matricula: string
          sabado_horario: string | null
          sabado_trabalho: string | null
          setor: string | null
          sexo: string | null
          status: string
          subsetor: string | null
          turno: string | null
          updated_at: string
        }
        Insert: {
          admissao?: string | null
          cargo?: string | null
          colaborador: string
          created_at?: string
          horario_almoco?: string | null
          horario_cafe?: string | null
          id?: string
          lideranca?: string | null
          matricula: string
          sabado_horario?: string | null
          sabado_trabalho?: string | null
          setor?: string | null
          sexo?: string | null
          status: string
          subsetor?: string | null
          turno?: string | null
          updated_at?: string
        }
        Update: {
          admissao?: string | null
          cargo?: string | null
          colaborador?: string
          created_at?: string
          horario_almoco?: string | null
          horario_cafe?: string | null
          id?: string
          lideranca?: string | null
          matricula?: string
          sabado_horario?: string | null
          sabado_trabalho?: string | null
          setor?: string | null
          sexo?: string | null
          status?: string
          subsetor?: string | null
          turno?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      demissoes: {
        Row: {
          colaborador_id: string
          created_at: string
          data_demissao: string
          id: string
          motivo: string | null
          observacoes: string | null
          tipo_demissao: string
          updated_at: string
        }
        Insert: {
          colaborador_id: string
          created_at?: string
          data_demissao: string
          id?: string
          motivo?: string | null
          observacoes?: string | null
          tipo_demissao: string
          updated_at?: string
        }
        Update: {
          colaborador_id?: string
          created_at?: string
          data_demissao?: string
          id?: string
          motivo?: string | null
          observacoes?: string | null
          tipo_demissao?: string
          updated_at?: string
        }
        Relationships: []
      }
      equipes: {
        Row: {
          ativa: boolean
          grupo: string
          id: string
          nome: string
          premiacoes: number
        }
        Insert: {
          ativa?: boolean
          grupo: string
          id?: string
          nome: string
          premiacoes?: number
        }
        Update: {
          ativa?: boolean
          grupo?: string
          id?: string
          nome?: string
          premiacoes?: number
        }
        Relationships: []
      }
      historico_chamadas_pendentes: {
        Row: {
          created_at: string
          data_fechamento: string
          id: string
          mes_ano: string
          total_pendentes: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_fechamento?: string
          id?: string
          mes_ano: string
          total_pendentes?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_fechamento?: string
          id?: string
          mes_ano?: string
          total_pendentes?: number
          updated_at?: string
        }
        Relationships: []
      }
      historico_quantitativo_diario: {
        Row: {
          created_at: string
          data: string
          id: string
          por_lideranca: Json | null
          total_esperado: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          por_lideranca?: Json | null
          total_esperado?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          por_lideranca?: Json | null
          total_esperado?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_logo_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_logo_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_logo_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      solicitacoes_movimentacao: {
        Row: {
          aprovado_por: string | null
          cargo_destino: string | null
          cargo_origem: string | null
          colaborador_id: string
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          id: string
          justificativa: string
          lideranca_destino: string | null
          lideranca_origem: string | null
          observacoes_gerencia: string | null
          setor_destino: string | null
          setor_origem: string | null
          solicitante_id: string
          status: string
          tipo_movimentacao: string
          turno_destino: string | null
          turno_origem: string | null
          updated_at: string
        }
        Insert: {
          aprovado_por?: string | null
          cargo_destino?: string | null
          cargo_origem?: string | null
          colaborador_id: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          justificativa: string
          lideranca_destino?: string | null
          lideranca_origem?: string | null
          observacoes_gerencia?: string | null
          setor_destino?: string | null
          setor_origem?: string | null
          solicitante_id: string
          status?: string
          tipo_movimentacao: string
          turno_destino?: string | null
          turno_origem?: string | null
          updated_at?: string
        }
        Update: {
          aprovado_por?: string | null
          cargo_destino?: string | null
          cargo_origem?: string | null
          colaborador_id?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          justificativa?: string
          lideranca_destino?: string | null
          lideranca_origem?: string | null
          observacoes_gerencia?: string | null
          setor_destino?: string | null
          setor_origem?: string | null
          solicitante_id?: string
          status?: string
          tipo_movimentacao?: string
          turno_destino?: string | null
          turno_origem?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_solicitacoes_colaborador"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_movimentacao_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "solicitacoes_movimentacao_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vagas: {
        Row: {
          aprovador_id: string | null
          aprovador_nome: string | null
          candidato_matricula: string | null
          candidato_nome: string | null
          cargo: string
          colaborador_substituido_id: string | null
          comentarios_aprovacao: string | null
          created_at: string
          data_aprovacao: string | null
          descricao: string | null
          gestor_solicitante_id: string
          gestor_solicitante_nome: string
          id: string
          lideranca: string | null
          motivo_abertura: string
          quantidade_vagas: number
          setor: string | null
          status: string
          subsetor: string | null
          tipo_vaga: string | null
          turno: string | null
          updated_at: string
        }
        Insert: {
          aprovador_id?: string | null
          aprovador_nome?: string | null
          candidato_matricula?: string | null
          candidato_nome?: string | null
          cargo: string
          colaborador_substituido_id?: string | null
          comentarios_aprovacao?: string | null
          created_at?: string
          data_aprovacao?: string | null
          descricao?: string | null
          gestor_solicitante_id: string
          gestor_solicitante_nome: string
          id?: string
          lideranca?: string | null
          motivo_abertura: string
          quantidade_vagas?: number
          setor?: string | null
          status?: string
          subsetor?: string | null
          tipo_vaga?: string | null
          turno?: string | null
          updated_at?: string
        }
        Update: {
          aprovador_id?: string | null
          aprovador_nome?: string | null
          candidato_matricula?: string | null
          candidato_nome?: string | null
          cargo?: string
          colaborador_substituido_id?: string | null
          comentarios_aprovacao?: string | null
          created_at?: string
          data_aprovacao?: string | null
          descricao?: string | null
          gestor_solicitante_id?: string
          gestor_solicitante_nome?: string
          id?: string
          lideranca?: string | null
          motivo_abertura?: string
          quantidade_vagas?: number
          setor?: string | null
          status?: string
          subsetor?: string | null
          tipo_vaga?: string | null
          turno?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vagas_colaborador_substituido_id_fkey"
            columns: ["colaborador_substituido_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      vagas_historico: {
        Row: {
          acao: string
          comentarios: string | null
          created_at: string
          id: string
          status_anterior: string | null
          status_novo: string | null
          usuario_id: string
          usuario_nome: string
          vaga_id: string
        }
        Insert: {
          acao: string
          comentarios?: string | null
          created_at?: string
          id?: string
          status_anterior?: string | null
          status_novo?: string | null
          usuario_id: string
          usuario_nome: string
          vaga_id: string
        }
        Update: {
          acao?: string
          comentarios?: string | null
          created_at?: string
          id?: string
          status_anterior?: string | null
          status_novo?: string | null
          usuario_id?: string
          usuario_nome?: string
          vaga_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vagas_historico_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_chamadas: { Args: { days_to_keep?: number }; Returns: number }
      get_current_user_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_encarregado: { Args: never; Returns: boolean }
      is_gerencia: { Args: never; Returns: boolean }
      is_management: { Args: never; Returns: boolean }
      is_valid_email: { Args: { email: string }; Returns: boolean }
      processar_fechamento_mensal: { Args: never; Returns: number }
      registrar_quantitativo_diario: { Args: never; Returns: undefined }
      verificar_limpeza_mensal: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
