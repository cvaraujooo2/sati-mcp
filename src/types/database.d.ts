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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alternancy_hyperfocus: {
        Row: {
          alternancy_session_id: string
          duration_minutes: number
          hyperfocus_id: string
          id: string
          order_index: number
        }
        Insert: {
          alternancy_session_id: string
          duration_minutes: number
          hyperfocus_id: string
          id?: string
          order_index: number
        }
        Update: {
          alternancy_session_id?: string
          duration_minutes?: number
          hyperfocus_id?: string
          id?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "alternancy_hyperfocus_alternancy_session_id_fkey"
            columns: ["alternancy_session_id"]
            isOneToOne: false
            referencedRelation: "alternancy_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alternancy_hyperfocus_hyperfocus_id_fkey"
            columns: ["hyperfocus_id"]
            isOneToOne: false
            referencedRelation: "hyperfocus"
            referencedColumns: ["id"]
          },
        ]
      }
      alternancy_sessions: {
        Row: {
          active: boolean | null
          actual_duration_minutes: number | null
          completed_at: string | null
          created_at: string
          current_index: number | null
          feedback: string | null
          hyperfocus_sequence: Json
          id: string
          name: string | null
          started_at: string | null
          status: string | null
          transition_break_minutes: number | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          actual_duration_minutes?: number | null
          completed_at?: string | null
          created_at?: string
          current_index?: number | null
          feedback?: string | null
          hyperfocus_sequence?: Json
          id?: string
          name?: string | null
          started_at?: string | null
          status?: string | null
          transition_break_minutes?: number | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          actual_duration_minutes?: number | null
          completed_at?: string | null
          created_at?: string
          current_index?: number | null
          feedback?: string | null
          hyperfocus_sequence?: Json
          id?: string
          name?: string | null
          started_at?: string | null
          status?: string | null
          transition_break_minutes?: number | null
          user_id?: string
        }
        Relationships: []
      }
      focus_sessions: {
        Row: {
          actual_duration_minutes: number | null
          ended_at: string | null
          hyperfocus_id: string
          id: string
          interrupted: boolean | null
          notes: string | null
          planned_duration_minutes: number
          started_at: string
        }
        Insert: {
          actual_duration_minutes?: number | null
          ended_at?: string | null
          hyperfocus_id: string
          id?: string
          interrupted?: boolean | null
          notes?: string | null
          planned_duration_minutes: number
          started_at?: string
        }
        Update: {
          actual_duration_minutes?: number | null
          ended_at?: string | null
          hyperfocus_id?: string
          id?: string
          interrupted?: boolean | null
          notes?: string | null
          planned_duration_minutes?: number
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_hyperfocus_id_fkey"
            columns: ["hyperfocus_id"]
            isOneToOne: false
            referencedRelation: "hyperfocus"
            referencedColumns: ["id"]
          },
        ]
      }
      hyperfocus: {
        Row: {
          archived: boolean | null
          color: string | null
          created_at: string
          description: string | null
          estimated_time_minutes: number | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          estimated_time_minutes?: number | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          estimated_time_minutes?: number | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hyperfocus_context: {
        Row: {
          context_data: Json
          hyperfocus_id: string
          id: string
          saved_at: string
        }
        Insert: {
          context_data: Json
          hyperfocus_id: string
          id?: string
          saved_at?: string
        }
        Update: {
          context_data?: Json
          hyperfocus_id?: string
          id?: string
          saved_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hyperfocus_context_hyperfocus_id_fkey"
            columns: ["hyperfocus_id"]
            isOneToOne: true
            referencedRelation: "hyperfocus"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          description: string | null
          estimated_minutes: number | null
          hyperfocus_id: string
          id: string
          order_index: number
          title: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          hyperfocus_id: string
          id?: string
          order_index?: number
          title: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          hyperfocus_id?: string
          id?: string
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_hyperfocus_id_fkey"
            columns: ["hyperfocus_id"]
            isOneToOne: false
            referencedRelation: "hyperfocus"
            referencedColumns: ["id"]
          },
        ]
      }
      user_api_keys: {
        Row: {
          created_at: string
          encrypted_key: string
          id: string
          last_used_at: string | null
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_key: string
          id?: string
          last_used_at?: string | null
          provider?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_key?: string
          id?: string
          last_used_at?: string | null
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          preferred_provider: string
          preferred_model: string
          model_warnings_dismissed: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preferred_provider?: string
          preferred_model?: string
          model_warnings_dismissed?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preferred_provider?: string
          preferred_model?: string
          model_warnings_dismissed?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_usage_limits: {
        Row: {
          id: string
          user_id: string
          daily_requests_used: number
          monthly_requests_used: number
          last_request_date: string
          last_reset_date: string
          monthly_reset_date: string
          tier: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          daily_requests_used?: number
          monthly_requests_used?: number
          last_request_date?: string
          last_reset_date?: string
          monthly_reset_date?: string
          tier?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          daily_requests_used?: number
          monthly_requests_used?: number
          last_request_date?: string
          last_reset_date?: string
          monthly_reset_date?: string
          tier?: string
          created_at?: string
          updated_at?: string
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

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (DatabaseWithoutInternals["public"]["Tables"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof (DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (DatabaseWithoutInternals["public"]["Tables"] &
        DatabaseWithoutInternals["public"]["Views"])
    ? (DatabaseWithoutInternals["public"]["Tables"] &
        DatabaseWithoutInternals["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof DatabaseWithoutInternals["public"]["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof DatabaseWithoutInternals["public"]["Tables"]
    ? DatabaseWithoutInternals["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof DatabaseWithoutInternals["public"]["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof DatabaseWithoutInternals["public"]["Tables"]
    ? DatabaseWithoutInternals["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof DatabaseWithoutInternals["public"]["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof DatabaseWithoutInternals["public"]["Enums"]
    ? DatabaseWithoutInternals["public"]["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DatabaseWithoutInternals["public"]["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DatabaseWithoutInternals["public"]["CompositeTypes"]
    ? DatabaseWithoutInternals["public"]["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
