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
      programs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          sheet_sync_enabled: boolean
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          sheet_sync_enabled?: boolean
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          sheet_sync_enabled?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      recruit_checklist_items: {
        Row: {
          completed_at: string
          completed_by: string | null
          id: string
          recruit_id: string
          stage_id: string
        }
        Insert: {
          completed_at?: string
          completed_by?: string | null
          id?: string
          recruit_id: string
          stage_id: string
        }
        Update: {
          completed_at?: string
          completed_by?: string | null
          id?: string
          recruit_id?: string
          stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruit_checklist_items_recruit_id_fkey"
            columns: ["recruit_id"]
            isOneToOne: false
            referencedRelation: "recruits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruit_checklist_items_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
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
          program_id: string
          source: Database["public"]["Enums"]["recruit_source"]
          stripe_customer_id: string | null
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
          program_id: string
          source?: Database["public"]["Enums"]["recruit_source"]
          stripe_customer_id?: string | null
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
          program_id?: string
          source?: Database["public"]["Enums"]["recruit_source"]
          stripe_customer_id?: string | null
          updated_at?: string
          zoom_meeting_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recruits_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      stages: {
        Row: {
          created_at: string
          days_to_complete: number | null
          description: string | null
          id: string
          name: string
          program_id: string
          required: boolean
          sort_order: number
        }
        Insert: {
          created_at?: string
          days_to_complete?: number | null
          description?: string | null
          id?: string
          name: string
          program_id: string
          required?: boolean
          sort_order: number
        }
        Update: {
          created_at?: string
          days_to_complete?: number | null
          description?: string | null
          id?: string
          name?: string
          program_id?: string
          required?: boolean
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "stages_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          body: string
          created_by: string | null
          id: string
          name: string
          program_id: string
          sort_order: number
          stage_id: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          created_by?: string | null
          id?: string
          name: string
          program_id: string
          sort_order?: number
          stage_id?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_by?: string | null
          id?: string
          name?: string
          program_id?: string
          sort_order?: number
          stage_id?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
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
      reassign_recruit: {
        Args: { p_actor_id: string; p_new_va_id: string; p_recruit_id: string }
        Returns: undefined
      }
      reorder_stages: {
        Args: { p_ordered_ids: string[]; p_program_id: string }
        Returns: undefined
      }
      swap_stage_order: {
        Args: { p_stage_a: string; p_stage_b: string }
        Returns: undefined
      }
      swap_template_order: {
        Args: { p_template_a: string; p_template_b: string }
        Returns: undefined
      }
      toggle_checklist_item: {
        Args: {
          p_actor_id: string
          p_completed: boolean
          p_recruit_id: string
          p_stage_id: string
        }
        Returns: undefined
      }
      update_recruit_notes: {
        Args: { p_actor_id: string; p_notes: string; p_recruit_id: string }
        Returns: undefined
      }
    }
    Enums: {
      recruit_source: "manual" | "ghl" | "stripe"
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
