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
          rapdo: boolean
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
          rapdo?: boolean
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
          rapdo?: boolean
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
      configuracao_campos_cadastro: {
        Row: {
          ativo: boolean
          campo_filho: string
          campo_pai: string
          created_at: string
          criado_por: string | null
          id: string
          updated_at: string
          valor_pai: string
          valores_permitidos: string[]
        }
        Insert: {
          ativo?: boolean
          campo_filho: string
          campo_pai: string
          created_at?: string
          criado_por?: string | null
          id?: string
          updated_at?: string
          valor_pai: string
          valores_permitidos: string[]
        }
        Update: {
          ativo?: boolean
          campo_filho?: string
          campo_pai?: string
          created_at?: string
          criado_por?: string | null
          id?: string
          updated_at?: string
          valor_pai?: string
          valores_permitidos?: string[]
        }
        Relationships: []
      }
      conversas: {
        Row: {
          created_at: string
          criado_por: string | null
          id: string
          nome: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          id?: string
          nome?: string | null
          tipo?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          id?: string
          nome?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversas_participantes: {
        Row: {
          conversa_id: string
          id: string
          joined_at: string
          ultima_leitura: string | null
          user_id: string
        }
        Insert: {
          conversa_id: string
          id?: string
          joined_at?: string
          ultima_leitura?: string | null
          user_id: string
        }
        Update: {
          conversa_id?: string
          id?: string
          joined_at?: string
          ultima_leitura?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversas_participantes_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "fk_demissoes_colaborador"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
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
      headcount_colaboradores: {
        Row: {
          adicionado_manualmente: boolean
          admissao: string | null
          cargo: string | null
          colaborador: string
          colaborador_origem_id: string | null
          created_at: string
          id: string
          lideranca: string | null
          matricula: string
          setor: string | null
          sexo: string | null
          status: string
          subsetor: string | null
          turno: string | null
          updated_at: string
          vaga_id: string | null
        }
        Insert: {
          adicionado_manualmente?: boolean
          admissao?: string | null
          cargo?: string | null
          colaborador: string
          colaborador_origem_id?: string | null
          created_at?: string
          id?: string
          lideranca?: string | null
          matricula: string
          setor?: string | null
          sexo?: string | null
          status?: string
          subsetor?: string | null
          turno?: string | null
          updated_at?: string
          vaga_id?: string | null
        }
        Update: {
          adicionado_manualmente?: boolean
          admissao?: string | null
          cargo?: string | null
          colaborador?: string
          colaborador_origem_id?: string | null
          created_at?: string
          id?: string
          lideranca?: string | null
          matricula?: string
          setor?: string | null
          sexo?: string | null
          status?: string
          subsetor?: string | null
          turno?: string | null
          updated_at?: string
          vaga_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "headcount_colaboradores_colaborador_origem_id_fkey"
            columns: ["colaborador_origem_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "headcount_colaboradores_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "headcount_vagas"
            referencedColumns: ["id"]
          },
        ]
      }
      headcount_custos_cargo: {
        Row: {
          cargo: string
          created_at: string
          custo_mensal: number
          id: string
          updated_at: string
        }
        Insert: {
          cargo: string
          created_at?: string
          custo_mensal?: number
          id?: string
          updated_at?: string
        }
        Update: {
          cargo?: string
          created_at?: string
          custo_mensal?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      headcount_motivos: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string
          id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao: string
          id?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      headcount_movimentacoes: {
        Row: {
          ativo: boolean
          colaborador_substituido_id: string | null
          created_at: string
          criado_por: string | null
          data_efetiva: string
          headcount_colaborador_id: string
          id: string
          motivo_complementar: string | null
          motivo_id: string | null
          tipo_movimentacao: string
          tipo_substituicao: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          colaborador_substituido_id?: string | null
          created_at?: string
          criado_por?: string | null
          data_efetiva: string
          headcount_colaborador_id: string
          id?: string
          motivo_complementar?: string | null
          motivo_id?: string | null
          tipo_movimentacao: string
          tipo_substituicao?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          colaborador_substituido_id?: string | null
          created_at?: string
          criado_por?: string | null
          data_efetiva?: string
          headcount_colaborador_id?: string
          id?: string
          motivo_complementar?: string | null
          motivo_id?: string | null
          tipo_movimentacao?: string
          tipo_substituicao?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "headcount_movimentacoes_colaborador_substituido_id_fkey"
            columns: ["colaborador_substituido_id"]
            isOneToOne: false
            referencedRelation: "headcount_colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "headcount_movimentacoes_headcount_colaborador_id_fkey"
            columns: ["headcount_colaborador_id"]
            isOneToOne: false
            referencedRelation: "headcount_colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "headcount_movimentacoes_motivo_id_fkey"
            columns: ["motivo_id"]
            isOneToOne: false
            referencedRelation: "headcount_motivos"
            referencedColumns: ["id"]
          },
        ]
      }
      headcount_planejado: {
        Row: {
          cargo: string
          created_at: string
          criado_por: string | null
          id: string
          lideranca: string | null
          mes_referencia: string
          quantidade: number
          setor: string
          subsetor: string | null
          turno: string | null
          updated_at: string
        }
        Insert: {
          cargo: string
          created_at?: string
          criado_por?: string | null
          id?: string
          lideranca?: string | null
          mes_referencia?: string
          quantidade?: number
          setor: string
          subsetor?: string | null
          turno?: string | null
          updated_at?: string
        }
        Update: {
          cargo?: string
          created_at?: string
          criado_por?: string | null
          id?: string
          lideranca?: string | null
          mes_referencia?: string
          quantidade?: number
          setor?: string
          subsetor?: string | null
          turno?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      headcount_vagas: {
        Row: {
          ativa: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
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
      mensagens: {
        Row: {
          conteudo: string
          conversa_id: string
          created_at: string
          id: string
          lida: boolean | null
          sender_id: string
        }
        Insert: {
          conteudo: string
          conversa_id: string
          created_at?: string
          id?: string
          lida?: boolean | null
          sender_id: string
        }
        Update: {
          conteudo?: string
          conversa_id?: string
          created_at?: string
          id?: string
          lida?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
        ]
      }
      opcoes_campos_cadastro: {
        Row: {
          ativo: boolean
          campo: string
          created_at: string
          id: string
          ordem: number | null
          updated_at: string
          valor: string
        }
        Insert: {
          ativo?: boolean
          campo: string
          created_at?: string
          id?: string
          ordem?: number | null
          updated_at?: string
          valor: string
        }
        Update: {
          ativo?: boolean
          campo?: string
          created_at?: string
          id?: string
          ordem?: number | null
          updated_at?: string
          valor?: string
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
      get_or_create_private_conversation: {
        Args: { other_user_id: string }
        Returns: string
      }
      is_admin: { Args: never; Returns: boolean }
      is_encarregado: { Args: never; Returns: boolean }
      is_gerencia: { Args: never; Returns: boolean }
      is_management: { Args: never; Returns: boolean }
      is_valid_email: { Args: { email: string }; Returns: boolean }
      processar_fechamento_mensal: { Args: never; Returns: number }
      registrar_quantitativo_diario: { Args: never; Returns: undefined }
      sync_colaboradores_to_headcount: { Args: never; Returns: undefined }
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
