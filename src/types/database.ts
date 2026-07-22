export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          detail: Json | null
          id: string
          recruit_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          detail?: Json | null
          id?: string
          recruit_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          detail?: Json | null
          id?: string
          recruit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_recruit_id_fkey"
            columns: ["recruit_id"]
            isOneToOne: false
            referencedRelation: "recruits"
            referencedColumns: ["id"]
          },
        ]
      }
      recruits: {
        Row: {
          assigned_va_id: string | null
          created_at: string
          email: string
          ghl_contact_id: string | null
          id: string
          name: string
          notes: string | null
          onboarded_at: string | null
          payment_status: string | null
          phone: string | null
          source: Database["public"]["Enums"]["recruit_source"]
          stage_id: string
          stripe_customer_id: string | null
          track: Database["public"]["Enums"]["track"]
          updated_at: string
          zoom_meeting_link: string | null
        }
        Insert: {
          assigned_va_id?: string | null
          created_at?: string
          email: string
          ghl_contact_id?: string | null
          id?: string
          name: string
          notes?: string | null
          onboarded_at?: string | null
          payment_status?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["recruit_source"]
          stage_id: string
          stripe_customer_id?: string | null
          track: Database["public"]["Enums"]["track"]
          updated_at?: string
          zoom_meeting_link?: string | null
        }
        Update: {
          assigned_va_id?: string | null
          created_at?: string
          email?: string
          ghl_contact_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          onboarded_at?: string | null
          payment_status?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["recruit_source"]
          stage_id?: string
          stripe_customer_id?: string | null
          track?: Database["public"]["Enums"]["track"]
          updated_at?: string
          zoom_meeting_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recruits_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      stages: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          track: Database["public"]["Enums"]["track"]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order: number
          track: Database["public"]["Enums"]["track"]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          track?: Database["public"]["Enums"]["track"]
        }
        Relationships: []
      }
      templates: {
        Row: {
          body: string
          created_by: string | null
          id: string
          name: string
          stage_id: string | null
          subject: string
          track: Database["public"]["Enums"]["track"]
          updated_at: string
        }
        Insert: {
          body: string
          created_by?: string | null
          id?: string
          name: string
          stage_id?: string | null
          subject: string
          track: Database["public"]["Enums"]["track"]
          updated_at?: string
        }
        Update: {
          body?: string
          created_by?: string | null
          id?: string
          name?: string
          stage_id?: string | null
          subject?: string
          track?: Database["public"]["Enums"]["track"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_clerk_user_id: { Args: never; Returns: string }
      current_role_name: { Args: never; Returns: string }
      move_recruit_stage: {
        Args: { p_actor_id: string; p_new_stage_id: string; p_recruit_id: string }
        Returns: undefined
      }
      reassign_recruit: {
        Args: { p_actor_id: string; p_new_va_id: string; p_recruit_id: string }
        Returns: undefined
      }
      update_recruit_notes: {
        Args: { p_actor_id: string; p_notes: string; p_recruit_id: string }
        Returns: undefined
      }
      swap_stage_order: {
        Args: { p_stage_a: string; p_stage_b: string }
        Returns: undefined
      }
    }
    Enums: {
      recruit_source: "manual" | "ghl" | "stripe"
      track: "team" | "roa_newbuild" | "mastermind"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]
export type Enums<T extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][T]
