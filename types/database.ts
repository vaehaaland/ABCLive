export type UserRole = 'admin' | 'technician'
export type GigStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: UserRole
          phone: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: UserRole
          phone?: string | null
          created_at?: string
        }
        Update: {
          full_name?: string | null
          role?: UserRole
          phone?: string | null
        }
      }
      gigs: {
        Row: {
          id: string
          name: string
          venue: string | null
          client: string | null
          start_date: string
          end_date: string
          description: string | null
          status: GigStatus
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          venue?: string | null
          client?: string | null
          start_date: string
          end_date: string
          description?: string | null
          status?: GigStatus
          created_by?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          venue?: string | null
          client?: string | null
          start_date?: string
          end_date?: string
          description?: string | null
          status?: GigStatus
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

export type GigWithDetails = Gig & {
  gig_personnel: (GigPersonnel & { profiles: Profile })[]
  gig_equipment: (GigEquipment & { equipment: Equipment })[]
}
