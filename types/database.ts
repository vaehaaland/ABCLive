export type UserRole = 'admin' | 'technician'
export type GigStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled'
export type GigType = 'single' | 'festival'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
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
        }
      }
      equipment: {
        Row: {
          id: string
          name: string
          category: string | null
          description: string | null
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
          description?: string | null
          quantity?: number
          created_at?: string
        }
        Update: {
          name?: string
          category?: string | null
          description?: string | null
          quantity?: number
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
        }
        Insert: {
          id?: string
          gig_id: string
          equipment_id: string
          quantity_needed?: number
          notes?: string | null
        }
        Update: {
          quantity_needed?: number
          notes?: string | null
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
