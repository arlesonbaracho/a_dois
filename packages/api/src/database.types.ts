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
          couple_id: string
          created_at: string
          expires_at: string
          id: string
          invited_by: string | null
          invited_email: string
          token_hash: string
          updated_at: string
          used_at: string | null
        }
        Insert: {
          couple_id: string
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          invited_email: string
          token_hash: string
          updated_at?: string
          used_at?: string | null
        }
        Update: {
          couple_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          invited_email?: string
          token_hash?: string
          updated_at?: string
          used_at?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_couple: { Args: never; Returns: string }
      is_couple_member: { Args: { couple_id: string }; Returns: boolean }
    }
    Enums: {
      couple_role: "dono" | "parceiro"
      goal_item_status: "desejado" | "pesquisando" | "comprado"
      goal_priority: "baixa" | "media" | "alta"
      income_band: "ate_2_sm" | "de_2_a_5_sm" | "de_5_a_10_sm" | "acima_10_sm"
      split_rule: "igual" | "proporcional"
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
      split_rule: ["igual", "proporcional"],
    },
  },
} as const

