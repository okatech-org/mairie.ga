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
      active_sessions: {
        Row: {
          browser: string | null
          created_at: string
          device_info: string | null
          id: string
          ip_address: string | null
          is_current: boolean | null
          last_activity: string
          location: string | null
          os: string | null
          session_token: string
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: string | null
          is_current?: boolean | null
          last_activity?: string
          location?: string | null
          os?: string | null
          session_token: string
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: string | null
          is_current?: boolean | null
          last_activity?: string
          location?: string | null
          os?: string | null
          session_token?: string
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          agent_id: string | null
          appointment_date: string
          citizen_id: string
          created_at: string
          duration_minutes: number | null
          id: string
          notes: string | null
          organization_id: string
          request_id: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          appointment_date: string
          citizen_id: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          request_id?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          appointment_date?: string
          citizen_id?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          request_id?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          session_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          session_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_sessions: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_vault: {
        Row: {
          category: string
          created_at: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          is_verified: boolean | null
          last_used_at: string | null
          metadata: Json | null
          name: string
          original_name: string | null
          source: string | null
          thumbnail_path: string | null
          updated_at: string
          user_id: string
          verification_date: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_verified?: boolean | null
          last_used_at?: string | null
          metadata?: Json | null
          name: string
          original_name?: string | null
          source?: string | null
          thumbnail_path?: string | null
          updated_at?: string
          user_id: string
          verification_date?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_verified?: boolean | null
          last_used_at?: string | null
          metadata?: Json | null
          name?: string
          original_name?: string | null
          source?: string | null
          thumbnail_path?: string | null
          updated_at?: string
          user_id?: string
          verification_date?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string | null
          created_at: string
          expiration_date: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          name: string
          request_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          expiration_date?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name: string
          request_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          expiration_date?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name?: string
          request_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: string | null
          success: boolean
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          success?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean
        }
        Relationships: []
      }
      organizations: {
        Row: {
          address: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          country_code: string | null
          created_at: string
          departement: string | null
          enabled_services: string[] | null
          id: string
          jurisdiction: string[]
          logo_url: string | null
          maire_name: string | null
          name: string
          population: number | null
          province: string | null
          settings: Json | null
          type: Database["public"]["Enums"]["organization_type"]
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          departement?: string | null
          enabled_services?: string[] | null
          id?: string
          jurisdiction: string[]
          logo_url?: string | null
          maire_name?: string | null
          name: string
          population?: number | null
          province?: string | null
          settings?: Json | null
          type: Database["public"]["Enums"]["organization_type"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          departement?: string | null
          enabled_services?: string[] | null
          id?: string
          jurisdiction?: string[]
          logo_url?: string | null
          maire_name?: string | null
          name?: string
          population?: number | null
          province?: string | null
          settings?: Json | null
          type?: Database["public"]["Enums"]["organization_type"]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: Json | null
          arrondissement: string | null
          consulate_file: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          emergency_contact_first_name: string | null
          emergency_contact_last_name: string | null
          emergency_contact_phone: string | null
          employer: string | null
          father_name: string | null
          first_name: string
          id: string
          last_name: string
          lieu_naissance: string | null
          mother_name: string | null
          nationality: string | null
          numero_cni: string | null
          phone: string | null
          pin_code: string | null
          pin_enabled: boolean | null
          profession: string | null
          quartier: string | null
          situation_matrimoniale: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: Json | null
          arrondissement?: string | null
          consulate_file?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          emergency_contact_first_name?: string | null
          emergency_contact_last_name?: string | null
          emergency_contact_phone?: string | null
          employer?: string | null
          father_name?: string | null
          first_name: string
          id?: string
          last_name: string
          lieu_naissance?: string | null
          mother_name?: string | null
          nationality?: string | null
          numero_cni?: string | null
          phone?: string | null
          pin_code?: string | null
          pin_enabled?: boolean | null
          profession?: string | null
          quartier?: string | null
          situation_matrimoniale?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: Json | null
          arrondissement?: string | null
          consulate_file?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          emergency_contact_first_name?: string | null
          emergency_contact_last_name?: string | null
          emergency_contact_phone?: string | null
          employer?: string | null
          father_name?: string | null
          first_name?: string
          id?: string
          last_name?: string
          lieu_naissance?: string | null
          mother_name?: string | null
          nationality?: string | null
          numero_cni?: string | null
          phone?: string | null
          pin_code?: string | null
          pin_enabled?: boolean | null
          profession?: string | null
          quartier?: string | null
          situation_matrimoniale?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      requests: {
        Row: {
          assigned_to: string | null
          assigned_to_name: string | null
          attached_documents: string[] | null
          citizen_email: string
          citizen_id: string
          citizen_name: string
          citizen_phone: string | null
          created_at: string
          date_rdv: string | null
          demandeur_type: string | null
          description: string | null
          expected_completion_date: string | null
          id: string
          internal_notes: string | null
          montant_frais: number | null
          motif_rejet: string | null
          numero_dossier: string | null
          organization_id: string | null
          paiement_statut: string | null
          priority: Database["public"]["Enums"]["request_priority"]
          required_documents: string[] | null
          service_id: string | null
          status: Database["public"]["Enums"]["request_status"]
          subject: string
          type: Database["public"]["Enums"]["request_type"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          assigned_to_name?: string | null
          attached_documents?: string[] | null
          citizen_email: string
          citizen_id: string
          citizen_name: string
          citizen_phone?: string | null
          created_at?: string
          date_rdv?: string | null
          demandeur_type?: string | null
          description?: string | null
          expected_completion_date?: string | null
          id?: string
          internal_notes?: string | null
          montant_frais?: number | null
          motif_rejet?: string | null
          numero_dossier?: string | null
          organization_id?: string | null
          paiement_statut?: string | null
          priority?: Database["public"]["Enums"]["request_priority"]
          required_documents?: string[] | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          subject: string
          type: Database["public"]["Enums"]["request_type"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          assigned_to_name?: string | null
          attached_documents?: string[] | null
          citizen_email?: string
          citizen_id?: string
          citizen_name?: string
          citizen_phone?: string | null
          created_at?: string
          date_rdv?: string | null
          demandeur_type?: string | null
          description?: string | null
          expected_completion_date?: string | null
          id?: string
          internal_notes?: string | null
          montant_frais?: number | null
          motif_rejet?: string | null
          numero_dossier?: string | null
          organization_id?: string | null
          paiement_statut?: string | null
          priority?: Database["public"]["Enums"]["request_priority"]
          required_documents?: string[] | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          subject?: string
          type?: Database["public"]["Enums"]["request_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          price: number | null
          processing_time_days: number | null
          required_documents: string[] | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          price?: number | null
          processing_time_days?: number | null
          required_documents?: string[] | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          price?: number | null
          processing_time_days?: number | null
          required_documents?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      session_history: {
        Row: {
          browser: string | null
          device_info: string | null
          id: string
          ip_address: string | null
          location: string | null
          login_at: string
          logout_at: string | null
          os: string | null
          session_token: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          device_info?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          login_at?: string
          logout_at?: string | null
          os?: string | null
          session_token?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          device_info?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          login_at?: string
          logout_at?: string | null
          os?: string | null
          session_token?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_sessions: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "agent" | "citizen"
      appointment_status:
      | "SCHEDULED"
      | "CONFIRMED"
      | "COMPLETED"
      | "CANCELLED"
      | "NO_SHOW"
      organization_type:
      | "CONSULAT_GENERAL"
      | "CONSULAT"
      | "AMBASSADE"
      | "HAUT_COMMISSARIAT"
      | "MISSION_PERMANENTE"
      request_priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"
      request_status:
      | "PENDING"
      | "IN_PROGRESS"
      | "AWAITING_DOCUMENTS"
      | "VALIDATED"
      | "REJECTED"
      | "COMPLETED"
      request_type:
      | "PASSPORT"
      | "VISA"
      | "CIVIL_REGISTRY"
      | "LEGALIZATION"
      | "CONSULAR_CARD"
      | "ATTESTATION"
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
    Enums: {
      app_role: ["super_admin", "admin", "agent", "citizen"],
      appointment_status: [
        "SCHEDULED",
        "CONFIRMED",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ],
      organization_type: [
        "CONSULAT_GENERAL",
        "CONSULAT",
        "AMBASSADE",
        "HAUT_COMMISSARIAT",
        "MISSION_PERMANENTE",
      ],
      request_priority: ["LOW", "NORMAL", "HIGH", "URGENT"],
      request_status: [
        "PENDING",
        "IN_PROGRESS",
        "AWAITING_DOCUMENTS",
        "VALIDATED",
        "REJECTED",
        "COMPLETED",
      ],
      request_type: [
        "PASSPORT",
        "VISA",
        "CIVIL_REGISTRY",
        "LEGALIZATION",
        "CONSULAR_CARD",
        "ATTESTATION",
      ],
    },
  },
} as const
