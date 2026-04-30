// Top-level type aliases used throughout the app
export type UserRole = 'admin' | 'technician'
export type GigStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled'
export type GigType = 'single' | 'festival'
export type GigAssignmentStatus = 'pending' | 'accepted' | 'declined'
export type EquipmentRequestStatus = 'pending' | 'approved' | 'denied'
export type NotificationType =
  | 'gig_added'
  | 'gig_assignment_request'
  | 'gig_assignment_response'
  | 'comment_mention'
  | 'ticket_created'
  | 'equipment_request'
  | 'equipment_request_response'
export type TicketStatus = 'reported' | 'open' | 'in_progress' | 'implemented' | 'not_implemented' | 'closed'

// ─── Generated from Supabase (npx supabase gen types typescript --linked) ─────

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
      availability_blocks: {
        Row: {
          blocked_from: string
          blocked_until: string
          created_at: string | null
          id: string
          profile_id: string
          reason: string | null
        }
        Insert: {
          blocked_from: string
          blocked_until: string
          created_at?: string | null
          id?: string
          profile_id: string
          reason?: string | null
        }
        Update: {
          blocked_from?: string
          blocked_until?: string
          created_at?: string | null
          id?: string
          profile_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_blocks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_template_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          order_index: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          title?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      company_memberships: {
        Row: {
          company_id: string
          created_at: string
          id: string
          profile_id: string
          role: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          profile_id: string
          role?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          profile_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          needs_reorder: boolean
          needs_service: boolean
          quantity: number
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          needs_reorder?: boolean
          needs_service?: boolean
          quantity?: number
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          needs_reorder?: boolean
          needs_service?: boolean
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "equipment_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_checklist_items: {
        Row: {
          checked_at: string | null
          checked_by: string | null
          comment: string | null
          gig_id: string
          id: string
          is_checked: boolean
          is_na: boolean
          order_index: number
          template_item_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          checked_at?: string | null
          checked_by?: string | null
          comment?: string | null
          gig_id: string
          id?: string
          is_checked?: boolean
          is_na?: boolean
          order_index?: number
          template_item_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          checked_at?: string | null
          checked_by?: string | null
          comment?: string | null
          gig_id?: string
          id?: string
          is_checked?: boolean
          is_na?: boolean
          order_index?: number
          template_item_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gig_checklist_items_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_checklist_items_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_checklist_items_template_item_id_fkey"
            columns: ["template_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_template_items"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          gig_id: string
          id: string
          parent_id: string | null
          root_id: string | null
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          gig_id: string
          id?: string
          parent_id?: string | null
          root_id?: string | null
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          gig_id?: string
          id?: string
          parent_id?: string | null
          root_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gig_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_comments_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "gig_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_comments_root_id_fkey"
            columns: ["root_id"]
            isOneToOne: false
            referencedRelation: "gig_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_equipment: {
        Row: {
          equipment_id: string
          gig_id: string
          id: string
          notes: string | null
          packed: boolean
          quantity_needed: number
          request_status: Database["public"]["Enums"]["equipment_request_status"] | null
          requested_by: string | null
          responded_at: string | null
          responded_by: string | null
          response_note: string | null
        }
        Insert: {
          equipment_id: string
          gig_id: string
          id?: string
          notes?: string | null
          packed?: boolean
          quantity_needed?: number
          request_status?: Database["public"]["Enums"]["equipment_request_status"] | null
          requested_by?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response_note?: string | null
        }
        Update: {
          equipment_id?: string
          gig_id?: string
          id?: string
          notes?: string | null
          packed?: boolean
          quantity_needed?: number
          request_status?: Database["public"]["Enums"]["equipment_request_status"] | null
          requested_by?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gig_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_equipment_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_equipment_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_equipment_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_files: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          gig_id: string
          id: string
          mime_type: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          gig_id: string
          id?: string
          mime_type: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          gig_id?: string
          id?: string
          mime_type?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gig_files_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_external_personnel: {
        Row: {
          id: string
          gig_id: string
          name: string
          company: string | null
          role_on_gig: string | null
          notes: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          gig_id: string
          name: string
          company?: string | null
          role_on_gig?: string | null
          notes?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          gig_id?: string
          name?: string
          company?: string | null
          role_on_gig?: string | null
          notes?: string | null
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gig_external_personnel_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_external_personnel_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_personnel: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          assignment_status: Database["public"]["Enums"]["gig_assignment_status"]
          gig_id: string
          id: string
          notes: string | null
          profile_id: string
          responded_at: string | null
          response_note: string | null
          role_on_gig: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_status?: Database["public"]["Enums"]["gig_assignment_status"]
          gig_id: string
          id?: string
          notes?: string | null
          profile_id: string
          responded_at?: string | null
          response_note?: string | null
          role_on_gig?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_status?: Database["public"]["Enums"]["gig_assignment_status"]
          gig_id?: string
          id?: string
          notes?: string | null
          profile_id?: string
          responded_at?: string | null
          response_note?: string | null
          role_on_gig?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gig_personnel_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_personnel_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_personnel_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_program_item_equipment: {
        Row: {
          equipment_id: string
          id: string
          notes: string | null
          program_item_id: string
          quantity_needed: number
        }
        Insert: {
          equipment_id: string
          id?: string
          notes?: string | null
          program_item_id: string
          quantity_needed?: number
        }
        Update: {
          equipment_id?: string
          id?: string
          notes?: string | null
          program_item_id?: string
          quantity_needed?: number
        }
        Relationships: [
          {
            foreignKeyName: "gig_program_item_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_program_item_equipment_program_item_id_fkey"
            columns: ["program_item_id"]
            isOneToOne: false
            referencedRelation: "gig_program_items"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_program_item_personnel: {
        Row: {
          id: string
          notes: string | null
          profile_id: string
          program_item_id: string
          role_on_item: string | null
        }
        Insert: {
          id?: string
          notes?: string | null
          profile_id: string
          program_item_id: string
          role_on_item?: string | null
        }
        Update: {
          id?: string
          notes?: string | null
          profile_id?: string
          program_item_id?: string
          role_on_item?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gig_program_item_personnel_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_program_item_personnel_program_item_id_fkey"
            columns: ["program_item_id"]
            isOneToOne: false
            referencedRelation: "gig_program_items"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_program_items: {
        Row: {
          created_at: string
          description: string | null
          end_at: string
          gig_id: string
          id: string
          name: string
          start_at: string
          venue: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_at: string
          gig_id: string
          id?: string
          name: string
          start_at: string
          venue?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          end_at?: string
          gig_id?: string
          id?: string
          name?: string
          start_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gig_program_items_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
        ]
      }
      gigs: {
        Row: {
          client: string | null
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          end_date: string
          gig_type: string
          icloud_uid: string | null
          id: string
          name: string
          price: number | null
          price_notes: string | null
          public_report_enabled: boolean
          public_report_password_hash: string | null
          public_report_slug: string | null
          start_date: string
          status: string
          venue: string | null
        }
        Insert: {
          client?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          end_date: string
          gig_type?: string
          icloud_uid?: string | null
          id?: string
          name: string
          price?: number | null
          price_notes?: string | null
          public_report_enabled?: boolean
          public_report_password_hash?: string | null
          public_report_slug?: string | null
          start_date: string
          status?: string
          venue?: string | null
        }
        Update: {
          client?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          end_date?: string
          gig_type?: string
          icloud_uid?: string | null
          id?: string
          name?: string
          price?: number | null
          price_notes?: string | null
          public_report_enabled?: boolean
          public_report_password_hash?: string | null
          public_report_slug?: string | null
          start_date?: string
          status?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gigs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gigs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      icloud_settings: {
        Row: {
          app_password: string
          apple_id: string
          id: string
          updated_at: string
        }
        Insert: {
          app_password: string
          apple_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          app_password?: string
          apple_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      mobile_push_tokens: {
        Row: {
          created_at: string
          expo_push_token: string
          id: string
          is_active: boolean
          last_seen_at: string | null
          platform: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expo_push_token: string
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          platform: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expo_push_token?: string
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          platform?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mobile_push_tokens_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_outbox: {
        Row: {
          attempt_count: number
          body: string
          created_at: string
          id: string
          last_error: string | null
          next_retry_at: string
          notification_id: string | null
          payload: Json
          profile_id: string
          sent_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          body: string
          created_at?: string
          id?: string
          last_error?: string | null
          next_retry_at?: string
          notification_id?: string | null
          payload?: Json
          profile_id: string
          sent_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          body?: string
          created_at?: string
          id?: string
          last_error?: string | null
          next_retry_at?: string
          notification_id?: string | null
          payload?: Json
          profile_id?: string
          sent_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_outbox_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_outbox_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_push_attempts: {
        Row: {
          created_at: string
          error_code: string | null
          error_message: string | null
          expo_ticket_id: string | null
          id: string
          outbox_id: string
          response: Json | null
          status: string
          token_id: string | null
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          expo_ticket_id?: string | null
          id?: string
          outbox_id: string
          response?: Json | null
          status: string
          token_id?: string | null
        }
        Update: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          expo_ticket_id?: string | null
          id?: string
          outbox_id?: string
          response?: Json | null
          status?: string
          token_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_push_attempts_outbox_id_fkey"
            columns: ["outbox_id"]
            isOneToOne: false
            referencedRelation: "notification_outbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_push_attempts_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "mobile_push_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          comment_id: string | null
          created_at: string
          gig_id: string | null
          id: string
          read: boolean
          ticket_id: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          comment_id?: string | null
          created_at?: string
          gig_id?: string | null
          id?: string
          read?: boolean
          ticket_id?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          actor_id?: string | null
          comment_id?: string | null
          created_at?: string
          gig_id?: string | null
          id?: string
          read?: boolean
          ticket_id?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "gig_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_superadmin: boolean
          nickname: string | null
          phone: string | null
          primary_company_id: string | null
          primary_role: string | null
          role: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_superadmin?: boolean
          nickname?: string | null
          phone?: string | null
          primary_company_id?: string | null
          primary_role?: string | null
          role?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_superadmin?: boolean
          nickname?: string | null
          phone?: string | null
          primary_company_id?: string | null
          primary_role?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_primary_company_id_fkey"
            columns: ["primary_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_logs: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          ticket_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          ticket_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_logs_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string
          created_at: string
          created_by: string
          description: string
          id: string
          status: Database["public"]["Enums"]["ticket_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to: string
          created_at?: string
          created_by: string
          description: string
          id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_gig: { Args: { target_gig_id: string }; Returns: boolean }
      can_access_gig_file: { Args: { object_name: string }; Returns: boolean }
      can_access_program_item: { Args: { target_program_item_id: string }; Returns: boolean }
      complete_past_gigs: { Args: Record<PropertyKey, never>; Returns: undefined }
      has_company_access: { Args: { target_company_id: string }; Returns: boolean }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_admin_for_gig: { Args: { target_gig_id: string }; Returns: boolean }
      is_admin_for_program_item: { Args: { target_item_id: string }; Returns: boolean }
      is_admin_of_company: { Args: { target_company_id: string }; Returns: boolean }
      is_superadmin: { Args: Record<PropertyKey, never>; Returns: boolean }
    }
    Enums: {
      equipment_request_status: "pending" | "approved" | "denied"
      gig_assignment_status: "pending" | "accepted" | "declined"
      notification_type:
        | "gig_added"
        | "comment_mention"
        | "ticket_created"
        | "gig_assignment_request"
        | "gig_assignment_response"
        | "equipment_request"
        | "equipment_request_response"
      ticket_status:
        | "open"
        | "in_progress"
        | "closed"
        | "reported"
        | "implemented"
        | "not_implemented"
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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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

// ─── Convenience types ────────────────────────────────────────────────────────

export type Company = Database['public']['Tables']['companies']['Row']
export type CompanyMembership = Database['public']['Tables']['company_memberships']['Row']
export type CompanyMembershipWithProfile = CompanyMembership & {
  profiles: Pick<Profile, 'id' | 'full_name' | 'nickname' | 'avatar_url' | 'email'>
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Gig = Database['public']['Tables']['gigs']['Row']
export type Equipment = Database['public']['Tables']['equipment']['Row']
export type GigPersonnel = Database['public']['Tables']['gig_personnel']['Row']
export type GigEquipment = Database['public']['Tables']['gig_equipment']['Row']
export type GigFile = Database['public']['Tables']['gig_files']['Row']
export type GigExternalPersonnel = Database['public']['Tables']['gig_external_personnel']['Row']
export type GigExternalPersonnelInsert = Database['public']['Tables']['gig_external_personnel']['Insert']
export type GigExternalPersonnelUpdate = Database['public']['Tables']['gig_external_personnel']['Update']
export type GigProgramItem = Database['public']['Tables']['gig_program_items']['Row']
export type GigProgramItemPersonnel = Database['public']['Tables']['gig_program_item_personnel']['Row']
export type GigProgramItemEquipment = Database['public']['Tables']['gig_program_item_equipment']['Row']

export type GigProgramItemWithDetails = GigProgramItem & {
  gig_program_item_personnel: (GigProgramItemPersonnel & { profiles: Profile })[]
  gig_program_item_equipment: (GigProgramItemEquipment & { equipment: Equipment })[]
}

export type GigWithDetails = Gig & {
  gig_personnel: (GigPersonnel & { profiles: Profile })[]
  gig_equipment: (GigEquipment & { equipment: Equipment })[]
  gig_files: GigFile[]
  gig_program_items: GigProgramItemWithDetails[]
  gig_external_personnel: GigExternalPersonnel[]
}

export type GigEquipmentWithRequest = GigEquipment & {
  equipment: Equipment & { company: Company }
  requester: Pick<Profile, 'id' | 'full_name' | 'nickname'> | null
  gig: (Pick<Gig, 'id' | 'name' | 'start_date' | 'end_date' | 'company_id'> & { company: Company | null }) | null
}

export type GigComment = Database['public']['Tables']['gig_comments']['Row']
export type GigCommentWithAuthor = GigComment & {
  profiles: { id: string; full_name: string | null; nickname: string | null; avatar_url: string | null }
}
export type CommentThread = GigCommentWithAuthor & { replies: GigCommentWithAuthor[] }

export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationWithContext = Notification & {
  actor: { id: string; full_name: string | null; nickname: string | null; avatar_url: string | null } | null
  gig: { id: string; name: string } | null
  ticket: { id: string; title: string } | null
}

export type AvailabilityBlock = Database['public']['Tables']['availability_blocks']['Row']
export type ICloudSettings = Database['public']['Tables']['icloud_settings']['Row']
export type ChecklistTemplateItem = Database['public']['Tables']['checklist_template_items']['Row']
export type GigChecklistItem = Database['public']['Tables']['gig_checklist_items']['Row']
export type GigChecklistItemWithChecker = GigChecklistItem & {
  checker: { id: string; full_name: string | null; nickname: string | null } | null
}

export type Ticket = Database['public']['Tables']['tickets']['Row']
export type TicketLog = Database['public']['Tables']['ticket_logs']['Row']
export type MobilePushToken = Database['public']['Tables']['mobile_push_tokens']['Row']
export type NotificationOutbox = Database['public']['Tables']['notification_outbox']['Row']
export type NotificationPushAttempt = Database['public']['Tables']['notification_push_attempts']['Row']
