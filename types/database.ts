export type UserRole = 'admin' | 'technician'
export type GigStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled'
export type GigType = 'single' | 'festival'
export type NotificationType = 'gig_added' | 'comment_mention' | 'ticket_created'
export type TicketStatus = 'reported' | 'open' | 'in_progress' | 'implemented' | 'not_implemented' | 'closed'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          nickname: string | null
          role: UserRole
          primary_role: string | null
          phone: string | null
          email: string | null
          avatar_url: string | null
          is_superadmin: boolean
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          nickname?: string | null
          role?: UserRole
          primary_role?: string | null
          phone?: string | null
          email?: string | null
          avatar_url?: string | null
          is_superadmin?: boolean
          created_at?: string
        }
        Update: {
          full_name?: string | null
          nickname?: string | null
          role?: UserRole
          primary_role?: string | null
          phone?: string | null
          email?: string | null
          avatar_url?: string | null
          is_superadmin?: boolean
        }
      }
      gigs: {
        Row: {
          id: string
          name: string
          gig_type: GigType
          public_report_enabled: boolean
          public_report_slug: string | null
          public_report_password_hash: string | null
          venue: string | null
          client: string | null
          start_date: string
          end_date: string
          description: string | null
          status: GigStatus
          price: number | null
          price_notes: string | null
          created_by: string | null
          created_at: string
          icloud_uid: string | null
        }
        Insert: {
          id?: string
          name: string
          gig_type?: GigType
          public_report_enabled?: boolean
          public_report_slug?: string | null
          public_report_password_hash?: string | null
          venue?: string | null
          client?: string | null
          start_date: string
          end_date: string
          description?: string | null
          status?: GigStatus
          price?: number | null
          price_notes?: string | null
          created_by?: string | null
          created_at?: string
          icloud_uid?: string | null
        }
        Update: {
          name?: string
          gig_type?: GigType
          public_report_enabled?: boolean
          public_report_slug?: string | null
          public_report_password_hash?: string | null
          venue?: string | null
          client?: string | null
          start_date?: string
          end_date?: string
          description?: string | null
          status?: GigStatus
          price?: number | null
          price_notes?: string | null
          icloud_uid?: string | null
        }
      }
      equipment: {
        Row: {
          id: string
          name: string
          category: string | null
          description: string | null
          quantity: number
          needs_service: boolean
          needs_reorder: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
          description?: string | null
          quantity?: number
          needs_service?: boolean
          needs_reorder?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          category?: string | null
          description?: string | null
          quantity?: number
          needs_service?: boolean
          needs_reorder?: boolean
        }
      }
      gig_personnel: {
        Row: {
          id: string
          gig_id: string
          profile_id: string
          role_on_gig: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          gig_id: string
          profile_id: string
          role_on_gig?: string | null
          notes?: string | null
        }
        Update: {
          role_on_gig?: string | null
          notes?: string | null
        }
      }
      gig_equipment: {
        Row: {
          id: string
          gig_id: string
          equipment_id: string
          quantity_needed: number
          notes: string | null
          packed: boolean
        }
        Insert: {
          id?: string
          gig_id: string
          equipment_id: string
          quantity_needed?: number
          notes?: string | null
          packed?: boolean
        }
        Update: {
          quantity_needed?: number
          notes?: string | null
          packed?: boolean
        }
      }
      gig_files: {
        Row: {
          id: string
          gig_id: string
          uploaded_by: string | null
          file_name: string
          file_size: number
          mime_type: string
          storage_path: string
          created_at: string
        }
        Insert: {
          id?: string
          gig_id: string
          uploaded_by?: string | null
          file_name: string
          file_size: number
          mime_type: string
          storage_path: string
          created_at?: string
        }
        Update: {
          file_name?: string
        }
      }
      gig_program_items: {
        Row: {
          id: string
          gig_id: string
          name: string
          venue: string | null
          start_at: string
          end_at: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          gig_id: string
          name: string
          venue?: string | null
          start_at: string
          end_at: string
          description?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          venue?: string | null
          start_at?: string
          end_at?: string
          description?: string | null
        }
      }
      gig_program_item_personnel: {
        Row: {
          id: string
          program_item_id: string
          profile_id: string
          role_on_item: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          program_item_id: string
          profile_id: string
          role_on_item?: string | null
          notes?: string | null
        }
        Update: {
          role_on_item?: string | null
          notes?: string | null
        }
      }
      gig_program_item_equipment: {
        Row: {
          id: string
          program_item_id: string
          equipment_id: string
          quantity_needed: number
          notes: string | null
        }
        Insert: {
          id?: string
          program_item_id: string
          equipment_id: string
          quantity_needed?: number
          notes?: string | null
        }
        Update: {
          quantity_needed?: number
          notes?: string | null
        }
      }
      gig_comments: {
        Row: {
          id: string
          gig_id: string
          author_id: string
          parent_id: string | null
          root_id: string | null
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          gig_id: string
          author_id: string
          parent_id?: string | null
          root_id?: string | null
          body: string
          created_at?: string
        }
        Update: {
          body?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          actor_id: string | null
          type: NotificationType
          gig_id: string | null
          comment_id: string | null
          ticket_id: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          actor_id?: string | null
          type: NotificationType
          gig_id?: string | null
          comment_id?: string | null
          ticket_id?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          read?: boolean
        }
      }
      availability_blocks: {
        Row: {
          id: string
          profile_id: string
          blocked_from: string
          blocked_until: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          blocked_from: string
          blocked_until: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          blocked_from?: string
          blocked_until?: string
          reason?: string | null
        }
      }
      icloud_settings: {
        Row: {
          id: string
          apple_id: string
          app_password: string
          updated_at: string
        }
        Insert: {
          id?: string
          apple_id: string
          app_password: string
          updated_at?: string
        }
        Update: {
          apple_id?: string
          app_password?: string
          updated_at?: string
        }
      }
      checklist_template_items: {
        Row: {
          id: string
          title: string
          description: string | null
          order_index: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          order_index?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          order_index?: number
          is_active?: boolean
        }
        Relationships: []
      }
      gig_checklist_items: {
        Row: {
          id: string
          gig_id: string
          template_item_id: string | null
          title: string
          is_checked: boolean
          is_na: boolean
          checked_by: string | null
          checked_at: string | null
          comment: string | null
          order_index: number
          updated_at: string
        }
        Insert: {
          id?: string
          gig_id: string
          template_item_id?: string | null
          title: string
          is_checked?: boolean
          is_na?: boolean
          checked_by?: string | null
          checked_at?: string | null
          comment?: string | null
          order_index?: number
          updated_at?: string
        }
        Update: {
          title?: string
          is_checked?: boolean
          is_na?: boolean
          checked_by?: string | null
          checked_at?: string | null
          comment?: string | null
          order_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          id: string
          title: string
          description: string
          status: TicketStatus
          created_by: string
          assigned_to: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          status?: TicketStatus
          created_by: string
          assigned_to: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string
          status?: TicketStatus
          assigned_to?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tickets_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tickets_assigned_to_fkey'
            columns: ['assigned_to']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      ticket_logs: {
        Row: {
          id: string
          ticket_id: string
          author_id: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          author_id: string
          body: string
          created_at?: string
        }
        Update: {
          body?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ticket_logs_ticket_id_fkey'
            columns: ['ticket_id']
            isOneToOne: false
            referencedRelation: 'tickets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ticket_logs_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Gig = Database['public']['Tables']['gigs']['Row']
export type Equipment = Database['public']['Tables']['equipment']['Row']
export type GigPersonnel = Database['public']['Tables']['gig_personnel']['Row']
export type GigEquipment = Database['public']['Tables']['gig_equipment']['Row']
export type GigFile = Database['public']['Tables']['gig_files']['Row']
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
