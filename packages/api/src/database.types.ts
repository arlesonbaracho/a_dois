export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      contributions: {
        Row: {
          amount_cents: number
          contributed_at: string
          couple_id: string
          created_at: string
          goal_id: string
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          contributed_at?: string
          couple_id: string
          created_at?: string
          goal_id: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          contributed_at?: string
          couple_id?: string
          created_at?: string
          goal_id?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contributions_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_goal_id_couple_id_fkey"
            columns: ["goal_id", "couple_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id", "couple_id"]
          },
        ]
      }
      couple_invites: {
        Row: {
          channel: Database["public"]["Enums"]["invite_channel"]
          claimed_at: string | null
          claimed_by_user_id: string | null
          confirmed_at: string | null
          couple_id: string
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          invited_email: string | null
          invited_user_id: string | null
          rejected_at: string | null
          revoked_at: string | null
          status: Database["public"]["Enums"]["invite_status"]
          token_hash: string
          updated_at: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["invite_channel"]
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          confirmed_at?: string | null
          couple_id: string
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          invited_email?: string | null
          invited_user_id?: string | null
          rejected_at?: string | null
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
          token_hash: string
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["invite_channel"]
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          confirmed_at?: string | null
          couple_id?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          invited_email?: string | null
          invited_user_id?: string | null
          rejected_at?: string | null
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_invites_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_members: {
        Row: {
          couple_id: string
          created_at: string
          display_name: string | null
          fixed_share_cents: number | null
          income_band: Database["public"]["Enums"]["income_band"] | null
          is_adult: boolean
          left_at: string | null
          role: Database["public"]["Enums"]["couple_role"]
          split_rule: Database["public"]["Enums"]["split_rule"]
          updated_at: string
          user_id: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          display_name?: string | null
          fixed_share_cents?: number | null
          income_band?: Database["public"]["Enums"]["income_band"] | null
          is_adult?: boolean
          left_at?: string | null
          role?: Database["public"]["Enums"]["couple_role"]
          split_rule?: Database["public"]["Enums"]["split_rule"]
          updated_at?: string
          user_id: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          display_name?: string | null
          fixed_share_cents?: number | null
          income_band?: Database["public"]["Enums"]["income_band"] | null
          is_adult?: boolean
          left_at?: string | null
          role?: Database["public"]["Enums"]["couple_role"]
          split_rule?: Database["public"]["Enums"]["split_rule"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_members_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couples: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      goal_items: {
        Row: {
          couple_id: string
          created_at: string
          estimated_price_cents: number | null
          goal_id: string
          id: string
          name: string
          status: Database["public"]["Enums"]["goal_item_status"]
          updated_at: string
          url: string | null
        }
        Insert: {
          couple_id: string
          created_at?: string
          estimated_price_cents?: number | null
          goal_id: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["goal_item_status"]
          updated_at?: string
          url?: string | null
        }
        Update: {
          couple_id?: string
          created_at?: string
          estimated_price_cents?: number | null
          goal_id?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["goal_item_status"]
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_items_goal_id_couple_id_fkey"
            columns: ["goal_id", "couple_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id", "couple_id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string
          couple_id: string
          created_at: string
          deadline_at: string | null
          id: string
          priority: Database["public"]["Enums"]["goal_priority"]
          target_amount_cents: number
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          couple_id: string
          created_at?: string
          deadline_at?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["goal_priority"]
          target_amount_cents?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          couple_id?: string
          created_at?: string
          deadline_at?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["goal_priority"]
          target_amount_cents?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      price_quotes: {
        Row: {
          couple_id: string
          created_at: string
          goal_item_id: string
          id: string
          price_cents: number
          source_url: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          goal_item_id: string
          id?: string
          price_cents: number
          source_url: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          goal_item_id?: string
          id?: string
          price_cents?: number
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_quotes_goal_item_id_couple_id_fkey"
            columns: ["goal_item_id", "couple_id"]
            isOneToOne: false
            referencedRelation: "goal_items"
            referencedColumns: ["id", "couple_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          consent_analytics_at: string | null
          consent_income_band_at: string | null
          consent_marketing_at: string | null
          created_at: string
          discoverable_by_nickname: boolean
          display_name: string | null
          nickname: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          consent_analytics_at?: string | null
          consent_income_band_at?: string | null
          consent_marketing_at?: string | null
          created_at?: string
          discoverable_by_nickname?: boolean
          display_name?: string | null
          nickname?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          consent_analytics_at?: string | null
          consent_income_band_at?: string | null
          consent_marketing_at?: string | null
          created_at?: string
          discoverable_by_nickname?: boolean
          display_name?: string | null
          nickname?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_hits: {
        Row: {
          acao: string
          chave: string
          created_at: string
          id: number
        }
        Insert: {
          acao: string
          chave: string
          created_at?: string
          id?: never
        }
        Update: {
          acao?: string
          chave?: string
          created_at?: string
          id?: never
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      active_invites: {
        Args: never
        Returns: {
          channel: Database["public"]["Enums"]["invite_channel"]
          created_at: string
          email_mascarado: string
          expires_at: string
          invite_id: string
          status: Database["public"]["Enums"]["invite_status"]
        }[]
      }
      add_contribution: {
        Args: {
          p_amount_cents: number
          p_contributed_at?: string
          p_goal_id: string
        }
        Returns: string
      }
      add_goal: {
        Args: {
          p_category?: string
          p_deadline_at?: string
          p_priority?: Database["public"]["Enums"]["goal_priority"]
          p_target_amount_cents?: number
          p_title: string
        }
        Returns: string
      }
      add_goal_item: {
        Args: {
          p_estimated_price_cents?: number
          p_goal_id: string
          p_name: string
          p_url?: string
        }
        Returns: string
      }
      add_price_quote: {
        Args: {
          p_goal_item_id: string
          p_price_cents: number
          p_source_url: string
        }
        Returns: string
      }
      casal_vazio: { Args: { p_couple_id: string }; Returns: boolean }
      checar_limite: {
        Args: {
          p_acao: string
          p_chave: string
          p_janela: string
          p_limite: number
        }
        Returns: boolean
      }
      claim_invite: { Args: { p_token: string }; Returns: string }
      confirm_invite: { Args: { p_invite_id: string }; Returns: undefined }
      create_couple: { Args: never; Returns: string }
      create_couple_for: { Args: { p_user_id: string }; Returns: string }
      create_invite: {
        Args: {
          p_channel: Database["public"]["Enums"]["invite_channel"]
          p_email?: string
          p_nickname?: string
        }
        Returns: {
          resultado: string
          token: string
        }[]
      }
      delete_account: {
        Args: { p_confirmacao: string; p_confirmo_apagar?: boolean }
        Returns: string
      }
      delete_goal: {
        Args: { p_confirmo_apagar?: boolean; p_goal_id: string }
        Returns: string
      }
      expire_and_purge: { Args: never; Returns: undefined }
      export_my_data: { Args: never; Returns: Json }
      find_by_nickname: {
        Args: { p_nickname: string }
        Returns: {
          avatar_url: string
          display_name: string
          nickname: string
        }[]
      }
      gerar_token: { Args: never; Returns: string }
      hash_token: { Args: { p_token: string }; Returns: string }
      is_couple_member: { Args: { couple_id: string }; Returns: boolean }
      leave_couple: { Args: { p_confirmo_apagar?: boolean }; Returns: string }
      mascarar_email: { Args: { p_email: string }; Returns: string }
      mascarar_pedaco: {
        Args: { p_texto: string; p_visivel: number }
        Returns: string
      }
      membros_ativos: { Args: { p_couple_id: string }; Returns: number }
      meu_casal_id: { Args: never; Returns: string }
      pending_claim: {
        Args: never
        Returns: {
          avatar_url: string
          channel: Database["public"]["Enums"]["invite_channel"]
          conta_criada_ha_dias: number
          display_name: string
          email_mascarado: string
          invite_id: string
          nickname: string
        }[]
      }
      reject_invite: { Args: { p_invite_id: string }; Returns: undefined }
      revoke_invite: { Args: { p_invite_id: string }; Returns: undefined }
      sair_do_casal_interno: {
        Args: {
          p_confirmo_apagar: boolean
          p_recriar_plano: boolean
          p_user_id: string
        }
        Returns: string
      }
      set_consent: {
        Args: { p_aceito: boolean; p_tipo: string }
        Returns: undefined
      }
      set_profile: {
        Args: {
          p_discoverable?: boolean
          p_display_name: string
          p_nickname: string
        }
        Returns: undefined
      }
    }
    Enums: {
      couple_role: "dono" | "parceiro"
      goal_item_status: "desejado" | "pesquisando" | "comprado"
      goal_priority: "baixa" | "media" | "alta"
      income_band: "ate_2_sm" | "de_2_a_5_sm" | "de_5_a_10_sm" | "acima_10_sm"
      invite_channel: "email" | "nickname" | "link"
      invite_status:
        | "pending"
        | "claimed"
        | "confirmed"
        | "rejected"
        | "revoked"
        | "expired"
      split_rule: "igual" | "proporcional" | "fixo"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      couple_role: ["dono", "parceiro"],
      goal_item_status: ["desejado", "pesquisando", "comprado"],
      goal_priority: ["baixa", "media", "alta"],
      income_band: ["ate_2_sm", "de_2_a_5_sm", "de_5_a_10_sm", "acima_10_sm"],
      invite_channel: ["email", "nickname", "link"],
      invite_status: [
        "pending",
        "claimed",
        "confirmed",
        "rejected",
        "revoked",
        "expired",
      ],
      split_rule: ["igual", "proporcional", "fixo"],
    },
  },
} as const

