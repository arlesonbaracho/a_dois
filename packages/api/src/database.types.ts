// Tipos do banco.
//
// PROVISÓRIO: escrito à mão a partir de
// supabase/migrations/20260910003818_esquema_inicial.sql, porque esta máquina
// ainda não tem Docker e o stack local não sobe. Assim que subir, este arquivo
// é substituído pelo gerado:
//
//   npm run db:types
//
// Este cabeçalho some junto. Qualquer coisa no diff além dele significa que a
// versão escrita à mão estava errada — vale olhar linha a linha nessa hora.
// Depois disso não se edita à mão: mexe na migration e regenera.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      couples: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      couple_members: {
        Row: {
          couple_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["couple_role"];
          split_rule: Database["public"]["Enums"]["split_rule"];
          income_band: Database["public"]["Enums"]["income_band"] | null;
          is_adult: boolean;
          display_name: string | null;
          left_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          couple_id: string;
          user_id: string;
          role?: Database["public"]["Enums"]["couple_role"];
          split_rule?: Database["public"]["Enums"]["split_rule"];
          income_band?: Database["public"]["Enums"]["income_band"] | null;
          is_adult?: boolean;
          display_name?: string | null;
          left_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          couple_id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["couple_role"];
          split_rule?: Database["public"]["Enums"]["split_rule"];
          income_band?: Database["public"]["Enums"]["income_band"] | null;
          is_adult?: boolean;
          display_name?: string | null;
          left_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      couple_invites: {
        Row: {
          id: string;
          couple_id: string;
          token_hash: string;
          invited_email: string;
          invited_by: string | null;
          expires_at: string;
          used_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          token_hash: string;
          invited_email: string;
          invited_by?: string | null;
          expires_at?: string;
          used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          token_hash?: string;
          invited_email?: string;
          invited_by?: string | null;
          expires_at?: string;
          used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          couple_id: string;
          title: string;
          category: string;
          target_amount_cents: number;
          deadline_at: string | null;
          priority: Database["public"]["Enums"]["goal_priority"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          title: string;
          category: string;
          target_amount_cents?: number;
          deadline_at?: string | null;
          priority?: Database["public"]["Enums"]["goal_priority"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          title?: string;
          category?: string;
          target_amount_cents?: number;
          deadline_at?: string | null;
          priority?: Database["public"]["Enums"]["goal_priority"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      goal_items: {
        Row: {
          id: string;
          couple_id: string;
          goal_id: string;
          name: string;
          estimated_price_cents: number | null;
          status: Database["public"]["Enums"]["goal_item_status"];
          url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          goal_id: string;
          name: string;
          estimated_price_cents?: number | null;
          status?: Database["public"]["Enums"]["goal_item_status"];
          url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          goal_id?: string;
          name?: string;
          estimated_price_cents?: number | null;
          status?: Database["public"]["Enums"]["goal_item_status"];
          url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contributions: {
        Row: {
          id: string;
          couple_id: string;
          goal_id: string;
          user_id: string | null;
          amount_cents: number;
          contributed_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          goal_id: string;
          user_id?: string | null;
          amount_cents: number;
          contributed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          goal_id?: string;
          user_id?: string | null;
          amount_cents?: number;
          contributed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      price_quotes: {
        Row: {
          id: string;
          couple_id: string;
          goal_item_id: string;
          price_cents: number;
          source_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          goal_item_id: string;
          price_cents: number;
          source_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          goal_item_id?: string;
          price_cents?: number;
          source_url?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      create_couple: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_couple_member: {
        Args: { couple_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      couple_role: "dono" | "parceiro";
      split_rule: "igual" | "proporcional";
      income_band: "ate_2_sm" | "de_2_a_5_sm" | "de_5_a_10_sm" | "acima_10_sm";
      goal_priority: "baixa" | "media" | "alta";
      goal_item_status: "desejado" | "pesquisando" | "comprado";
    };
    CompositeTypes: { [_ in never]: never };
  };
};
