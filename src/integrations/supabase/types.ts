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
      arretes: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          date_effet: string | null
          date_fin: string | null
          date_publication: string | null
          date_signature: string | null
          documents: Json | null
          id: string
          metadata: Json | null
          numero: string
          organization_id: string | null
          signataire: string | null
          status: Database["public"]["Enums"]["arrete_status"] | null
          title: string
          type: Database["public"]["Enums"]["arrete_type"]
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          date_effet?: string | null
          date_fin?: string | null
          date_publication?: string | null
          date_signature?: string | null
          documents?: Json | null
          id?: string
          metadata?: Json | null
          numero: string
          organization_id?: string | null
          signataire?: string | null
          status?: Database["public"]["Enums"]["arrete_status"] | null
          title: string
          type: Database["public"]["Enums"]["arrete_type"]
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          date_effet?: string | null
          date_fin?: string | null
          date_publication?: string | null
          date_signature?: string | null
          documents?: Json | null
          id?: string
          metadata?: Json | null
          numero?: string
          organization_id?: string | null
          signataire?: string | null
          status?: Database["public"]["Enums"]["arrete_status"] | null
          title?: string
          type?: Database["public"]["Enums"]["arrete_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arretes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      associations: {
        Row: {
          address: Json | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          documents: Json | null
          id: string
          members_count: number | null
          metadata: Json | null
          name: string
          owner_id: string
          president_name: string | null
          registration_number: string | null
          secretary_name: string | null
          status: Database["public"]["Enums"]["entity_status"] | null
          treasurer_name: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          documents?: Json | null
          id?: string
          members_count?: number | null
          metadata?: Json | null
          name: string
          owner_id: string
          president_name?: string | null
          registration_number?: string | null
          secretary_name?: string | null
          status?: Database["public"]["Enums"]["entity_status"] | null
          treasurer_name?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          documents?: Json | null
          id?: string
          members_count?: number | null
          metadata?: Json | null
          name?: string
          owner_id?: string
          president_name?: string | null
          registration_number?: string | null
          secretary_name?: string | null
          status?: Database["public"]["Enums"]["entity_status"] | null
          treasurer_name?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: Json | null
          capital: number | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          documents: Json | null
          employees_count: number | null
          id: string
          legal_form: string | null
          metadata: Json | null
          name: string
          owner_id: string
          registration_number: string | null
          sector: string | null
          status: Database["public"]["Enums"]["entity_status"] | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          capital?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          documents?: Json | null
          employees_count?: number | null
          id?: string
          legal_form?: string | null
          metadata?: Json | null
          name: string
          owner_id: string
          registration_number?: string | null
          sector?: string | null
          status?: Database["public"]["Enums"]["entity_status"] | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          capital?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          documents?: Json | null
          employees_count?: number | null
          id?: string
          legal_form?: string | null
          metadata?: Json | null
          name?: string
          owner_id?: string
          registration_number?: string | null
          sector?: string | null
          status?: Database["public"]["Enums"]["entity_status"] | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      correspondence_logs: {
        Row: {
          attachments: Json | null
          content: string | null
          created_at: string | null
          delivered_at: string | null
          document_ids: string[] | null
          error_message: string | null
          folder_id: string | null
          id: string
          is_urgent: boolean | null
          metadata: Json | null
          recipient_email: string
          recipient_name: string | null
          recipient_org: string | null
          sender_id: string
          sent_at: string | null
          status: Database["public"]["Enums"]["correspondence_status"] | null
          subject: string
          template_used: string | null
        }
        Insert: {
          attachments?: Json | null
          content?: string | null
          created_at?: string | null
          delivered_at?: string | null
          document_ids?: string[] | null
          error_message?: string | null
          folder_id?: string | null
          id?: string
          is_urgent?: boolean | null
          metadata?: Json | null
          recipient_email: string
          recipient_name?: string | null
          recipient_org?: string | null
          sender_id: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["correspondence_status"] | null
          subject: string
          template_used?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string | null
          created_at?: string | null
          delivered_at?: string | null
          document_ids?: string[] | null
          error_message?: string | null
          folder_id?: string | null
          id?: string
          is_urgent?: boolean | null
          metadata?: Json | null
          recipient_email?: string
          recipient_name?: string | null
          recipient_org?: string | null
          sender_id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["correspondence_status"] | null
          subject?: string
          template_used?: string | null
        }
        Relationships: []
      }
      cv_data: {
        Row: {
          certifications: Json | null
          created_at: string | null
          cv_references: Json | null
          education: Json | null
          experiences: Json | null
          id: string
          languages: Json | null
          personal_info: Json | null
          skills: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          certifications?: Json | null
          created_at?: string | null
          cv_references?: Json | null
          education?: Json | null
          experiences?: Json | null
          id?: string
          languages?: Json | null
          personal_info?: Json | null
          skills?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          certifications?: Json | null
          created_at?: string | null
          cv_references?: Json | null
          education?: Json | null
          experiences?: Json | null
          id?: string
          languages?: Json | null
          personal_info?: Json | null
          skills?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      deliberations: {
        Row: {
          abstentions: number | null
          content: string | null
          created_at: string | null
          created_by: string | null
          documents: Json | null
          id: string
          metadata: Json | null
          numero: string
          organization_id: string | null
          rapporteur: string | null
          resultat: Database["public"]["Enums"]["deliberation_result"] | null
          session_date: string
          title: string
          updated_at: string | null
          votes_contre: number | null
          votes_pour: number | null
        }
        Insert: {
          abstentions?: number | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          documents?: Json | null
          id?: string
          metadata?: Json | null
          numero: string
          organization_id?: string | null
          rapporteur?: string | null
          resultat?: Database["public"]["Enums"]["deliberation_result"] | null
          session_date: string
          title: string
          updated_at?: string | null
          votes_contre?: number | null
          votes_pour?: number | null
        }
        Update: {
          abstentions?: number | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          documents?: Json | null
          id?: string
          metadata?: Json | null
          numero?: string
          organization_id?: string | null
          rapporteur?: string | null
          resultat?: Database["public"]["Enums"]["deliberation_result"] | null
          session_date?: string
          title?: string
          updated_at?: string | null
          votes_contre?: number | null
          votes_pour?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deliberations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_settings_audit: {
        Row: {
          action: string
          changes: Json | null
          created_at: string | null
          field_changed: string | null
          id: string
          ip_address: string | null
          new_value: string | null
          old_value: string | null
          organization_id: string | null
          settings_id: string
          user_agent: string | null
          user_email: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string | null
          field_changed?: string | null
          id?: string
          ip_address?: string | null
          new_value?: string | null
          old_value?: string | null
          organization_id?: string | null
          settings_id: string
          user_agent?: string | null
          user_email?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string | null
          field_changed?: string | null
          id?: string
          ip_address?: string | null
          new_value?: string | null
          old_value?: string | null
          organization_id?: string | null
          settings_id?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_settings_audit_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_vault: {
        Row: {
          category: string
          created_at: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          is_archived: boolean | null
          is_favorite: boolean | null
          is_verified: boolean | null
          last_used_at: string | null
          metadata: Json | null
          name: string
          original_name: string | null
          source: string | null
          tags: string[] | null
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
          is_archived?: boolean | null
          is_favorite?: boolean | null
          is_verified?: boolean | null
          last_used_at?: string | null
          metadata?: Json | null
          name: string
          original_name?: string | null
          source?: string | null
          tags?: string[] | null
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
          is_archived?: boolean | null
          is_favorite?: boolean | null
          is_verified?: boolean | null
          last_used_at?: string | null
          metadata?: Json | null
          name?: string
          original_name?: string | null
          source?: string | null
          tags?: string[] | null
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
      knowledge_base: {
        Row: {
          author_id: string | null
          category: string
          content: string
          created_at: string | null
          helpful_count: number | null
          id: string
          metadata: Json | null
          organization_id: string | null
          status: Database["public"]["Enums"]["kb_status"] | null
          subcategory: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          category: string
          content: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          status?: Database["public"]["Enums"]["kb_status"] | null
          subcategory?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string
          content?: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          status?: Database["public"]["Enums"]["kb_status"] | null
          subcategory?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      notification_preferences: {
        Row: {
          created_at: string | null
          email_arretes: boolean | null
          email_deliberations: boolean | null
          email_services: boolean | null
          email_urgences: boolean | null
          id: string
          phone_number: string | null
          sms_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_arretes?: boolean | null
          email_deliberations?: boolean | null
          email_services?: boolean | null
          email_urgences?: boolean | null
          id?: string
          phone_number?: string | null
          sms_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_arretes?: boolean | null
          email_deliberations?: boolean | null
          email_services?: boolean | null
          email_urgences?: boolean | null
          id?: string
          phone_number?: string | null
          sms_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
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
          latitude: number | null
          logo_url: string | null
          longitude: number | null
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
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
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
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
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
      service_document_settings: {
        Row: {
          cabinet: string | null
          commune: string | null
          created_at: string | null
          footer_address: string | null
          footer_email: string | null
          id: string
          logo_url: string | null
          motto: string | null
          organization_id: string | null
          primary_color: string | null
          province: string | null
          republic: string | null
          service_role: string
          signature_title: string | null
          updated_at: string | null
        }
        Insert: {
          cabinet?: string | null
          commune?: string | null
          created_at?: string | null
          footer_address?: string | null
          footer_email?: string | null
          id?: string
          logo_url?: string | null
          motto?: string | null
          organization_id?: string | null
          primary_color?: string | null
          province?: string | null
          republic?: string | null
          service_role: string
          signature_title?: string | null
          updated_at?: string | null
        }
        Update: {
          cabinet?: string | null
          commune?: string | null
          created_at?: string | null
          footer_address?: string | null
          footer_email?: string | null
          id?: string
          logo_url?: string | null
          motto?: string | null
          organization_id?: string | null
          primary_color?: string | null
          province?: string | null
          republic?: string | null
          service_role?: string
          signature_title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_document_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          created_at: string
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
          created_at?: string
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
          created_at?: string
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
      urbanisme_dossiers: {
        Row: {
          address: Json | null
          assigned_to: string | null
          created_at: string | null
          date_decision: string | null
          date_depot: string | null
          demandeur_id: string
          description: string | null
          documents: Json | null
          id: string
          metadata: Json | null
          motif_decision: string | null
          numero: string
          organization_id: string | null
          status: Database["public"]["Enums"]["urbanisme_status"] | null
          surface_construction: number | null
          surface_terrain: number | null
          title: string
          type: Database["public"]["Enums"]["urbanisme_type"]
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          assigned_to?: string | null
          created_at?: string | null
          date_decision?: string | null
          date_depot?: string | null
          demandeur_id: string
          description?: string | null
          documents?: Json | null
          id?: string
          metadata?: Json | null
          motif_decision?: string | null
          numero: string
          organization_id?: string | null
          status?: Database["public"]["Enums"]["urbanisme_status"] | null
          surface_construction?: number | null
          surface_terrain?: number | null
          title: string
          type: Database["public"]["Enums"]["urbanisme_type"]
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          assigned_to?: string | null
          created_at?: string | null
          date_decision?: string | null
          date_depot?: string | null
          demandeur_id?: string
          description?: string | null
          documents?: Json | null
          id?: string
          metadata?: Json | null
          motif_decision?: string | null
          numero?: string
          organization_id?: string | null
          status?: Database["public"]["Enums"]["urbanisme_status"] | null
          surface_construction?: number | null
          surface_terrain?: number | null
          title?: string
          type?: Database["public"]["Enums"]["urbanisme_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "urbanisme_dossiers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      arrete_status: "DRAFT" | "SIGNED" | "PUBLISHED" | "ABROGATED"
      arrete_type: "MUNICIPAL" | "INDIVIDUEL" | "REGLEMENTAIRE" | "TEMPORAIRE"
      correspondence_status:
        | "PENDING"
        | "SENT"
        | "DELIVERED"
        | "FAILED"
        | "BOUNCED"
      deliberation_result: "ADOPTED" | "REJECTED" | "POSTPONED" | "WITHDRAWN"
      entity_status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED"
      kb_status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
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
      urbanisme_status:
        | "SUBMITTED"
        | "IN_REVIEW"
        | "ADDITIONAL_INFO"
        | "APPROVED"
        | "REJECTED"
        | "WITHDRAWN"
      urbanisme_type:
        | "PERMIS_CONSTRUIRE"
        | "DECLARATION_TRAVAUX"
        | "PERMIS_DEMOLIR"
        | "PERMIS_AMENAGER"
        | "CERTIFICAT_URBANISME"
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
      arrete_status: ["DRAFT", "SIGNED", "PUBLISHED", "ABROGATED"],
      arrete_type: ["MUNICIPAL", "INDIVIDUEL", "REGLEMENTAIRE", "TEMPORAIRE"],
      correspondence_status: [
        "PENDING",
        "SENT",
        "DELIVERED",
        "FAILED",
        "BOUNCED",
      ],
      deliberation_result: ["ADOPTED", "REJECTED", "POSTPONED", "WITHDRAWN"],
      entity_status: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"],
      kb_status: ["DRAFT", "PUBLISHED", "ARCHIVED"],
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
      urbanisme_status: [
        "SUBMITTED",
        "IN_REVIEW",
        "ADDITIONAL_INFO",
        "APPROVED",
        "REJECTED",
        "WITHDRAWN",
      ],
      urbanisme_type: [
        "PERMIS_CONSTRUIRE",
        "DECLARATION_TRAVAUX",
        "PERMIS_DEMOLIR",
        "PERMIS_AMENAGER",
        "CERTIFICAT_URBANISME",
      ],
    },
  },
} as const
