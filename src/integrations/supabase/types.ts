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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number
          created_at: string
          id: string
          identifier: string
          method: string
          name: string
          password: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          identifier: string
          method?: string
          name: string
          password: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          identifier?: string
          method?: string
          name?: string
          password?: string
        }
        Relationships: []
      }
      money_requests: {
        Row: {
          amount: number
          at: string
          decided_at: string | null
          from_number: string | null
          id: string
          identifier: string
          kind: string
          name: string
          proof: string | null
          proof_name: string | null
          status: string
        }
        Insert: {
          amount: number
          at?: string
          decided_at?: string | null
          from_number?: string | null
          id?: string
          identifier: string
          kind: string
          name: string
          proof?: string | null
          proof_name?: string | null
          status?: string
        }
        Update: {
          amount?: number
          at?: string
          decided_at?: string | null
          from_number?: string | null
          id?: string
          identifier?: string
          kind?: string
          name?: string
          proof?: string | null
          proof_name?: string | null
          status?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          at: string
          id: string
          identifier: string
          seen: boolean
          text: string
          title: string
        }
        Insert: {
          at?: string
          id?: string
          identifier: string
          seen?: boolean
          text: string
          title: string
        }
        Update: {
          at?: string
          id?: string
          identifier?: string
          seen?: boolean
          text?: string
          title?: string
        }
        Relationships: []
      }
      pay_settings: {
        Row: {
          data: Json
          id: number
        }
        Insert: {
          data: Json
          id?: number
        }
        Update: {
          data?: Json
          id?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          credited: boolean
          duration_ms: number
          id: string
          identifier: string
          return_amount: number
          started_at: number
          tax: number
          tax_paid: boolean
          tax_proof_name: string | null
          tax_sender_number: string | null
          tax_submitted_at: string | null
        }
        Insert: {
          amount: number
          credited?: boolean
          duration_ms: number
          id?: string
          identifier: string
          return_amount: number
          started_at: number
          tax?: number
          tax_paid?: boolean
          tax_proof_name?: string | null
          tax_sender_number?: string | null
          tax_submitted_at?: string | null
        }
        Update: {
          amount?: number
          credited?: boolean
          duration_ms?: number
          id?: string
          identifier?: string
          return_amount?: number
          started_at?: number
          tax?: number
          tax_paid?: boolean
          tax_proof_name?: string | null
          tax_sender_number?: string | null
          tax_submitted_at?: string | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          at: string
          id: string
          identifier: string
          image: string | null
          name: string
          sender: string
          text: string
        }
        Insert: {
          at?: string
          id?: string
          identifier: string
          image?: string | null
          name: string
          sender: string
          text: string
        }
        Update: {
          at?: string
          id?: string
          identifier?: string
          image?: string | null
          name?: string
          sender?: string
          text?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
