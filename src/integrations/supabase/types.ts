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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      itineraries: {
        Row: {
          budget_breakdown: Json
          content: Json
          created_at: string
          id: string
          packing_list: string[]
          plan_id: string | null
          trip_id: string
        }
        Insert: {
          budget_breakdown?: Json
          content?: Json
          created_at?: string
          id?: string
          packing_list?: string[]
          plan_id?: string | null
          trip_id: string
        }
        Update: {
          budget_breakdown?: Json
          content?: Json
          created_at?: string
          id?: string
          packing_list?: string[]
          plan_id?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itineraries_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "trip_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itineraries_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: true
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_responses: {
        Row: {
          accommodation: string | null
          additional_preferences: string | null
          anonymous_token: string
          available_dates: string[]
          budget_range: string | null
          created_at: string
          id: string
          interests: string[]
          transportation: string | null
          travel_style: string | null
          trip_id: string
        }
        Insert: {
          accommodation?: string | null
          additional_preferences?: string | null
          anonymous_token: string
          available_dates?: string[]
          budget_range?: string | null
          created_at?: string
          id?: string
          interests?: string[]
          transportation?: string | null
          travel_style?: string | null
          trip_id: string
        }
        Update: {
          accommodation?: string | null
          additional_preferences?: string | null
          anonymous_token?: string
          available_dates?: string[]
          budget_range?: string | null
          created_at?: string
          id?: string
          interests?: string[]
          transportation?: string | null
          travel_style?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participant_responses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      trip_plans: {
        Row: {
          activities: string[]
          compatibility_score: number
          created_at: string
          dates: string | null
          destination: string
          duration: number
          estimated_budget: number
          id: string
          is_selected: boolean
          plan_name: string
          reasoning: string[]
          score_availability: number
          score_budget: number
          score_interests: number
          trip_id: string
        }
        Insert: {
          activities?: string[]
          compatibility_score?: number
          created_at?: string
          dates?: string | null
          destination: string
          duration?: number
          estimated_budget?: number
          id?: string
          is_selected?: boolean
          plan_name: string
          reasoning?: string[]
          score_availability?: number
          score_budget?: number
          score_interests?: number
          trip_id: string
        }
        Update: {
          activities?: string[]
          compatibility_score?: number
          created_at?: string
          dates?: string | null
          destination?: string
          duration?: number
          estimated_budget?: number
          id?: string
          is_selected?: boolean
          plan_name?: string
          reasoning?: string[]
          score_availability?: number
          score_budget?: number
          score_interests?: number
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_plans_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          budget_max: number
          budget_min: number
          created_at: string
          destination: string
          duration: number
          end_date: string | null
          id: string
          invite_token: string
          organizer_id: string
          organizer_message: string | null
          participant_count: number
          start_date: string | null
          status: string
          trip_name: string
        }
        Insert: {
          budget_max?: number
          budget_min?: number
          created_at?: string
          destination: string
          duration?: number
          end_date?: string | null
          id?: string
          invite_token: string
          organizer_id?: string
          organizer_message?: string | null
          participant_count?: number
          start_date?: string | null
          status?: string
          trip_name: string
        }
        Update: {
          budget_max?: number
          budget_min?: number
          created_at?: string
          destination?: string
          duration?: number
          end_date?: string | null
          id?: string
          invite_token?: string
          organizer_id?: string
          organizer_message?: string | null
          participant_count?: number
          start_date?: string | null
          status?: string
          trip_name?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          anonymous_token: string
          created_at: string
          id: string
          plan_id: string
          trip_id: string
        }
        Insert: {
          anonymous_token: string
          created_at?: string
          id?: string
          plan_id: string
          trip_id: string
        }
        Update: {
          anonymous_token?: string
          created_at?: string
          id?: string
          plan_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "trip_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cast_plan_vote: {
        Args: { p_anon: string; p_plan_id: string; p_token: string }
        Returns: Json
      }
      get_trip_by_token: {
        Args: { p_anon?: string; p_token: string }
        Returns: Json
      }
      submit_participant_response: {
        Args: {
          p_accommodation: string
          p_anon: string
          p_budget: string
          p_dates: string[]
          p_interests: string[]
          p_notes: string
          p_style: string
          p_token: string
          p_transportation: string
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
