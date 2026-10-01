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
    PostgrestVersion: "14.5"
  }
  club: {
    Tables: {
      announcements: {
        Row: {
          audience: string
          body: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          organization_id: string | null
          pinned: boolean
          published_at: string
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          body: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          organization_id?: string | null
          pinned?: boolean
          published_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          body?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          organization_id?: string | null
          pinned?: boolean
          published_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      class_enrollments: {
        Row: {
          attended: boolean | null
          class_id: string
          enrolled_at: string
          id: string
          user_id: string
        }
        Insert: {
          attended?: boolean | null
          class_id: string
          enrolled_at?: string
          id?: string
          user_id: string
        }
        Update: {
          attended?: boolean | null
          class_id?: string
          enrolled_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes_public"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          attendance_taken_at: string | null
          capacity: number | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          level: Database["club"]["Enums"]["class_level"]
          meeting_url: string | null
          organization_id: string | null
          resources: Json | null
          session_notes: string | null
          starts_at: string
          status: Database["club"]["Enums"]["class_status"]
          title: string
          tutor_id: string | null
          updated_at: string
        }
        Insert: {
          attendance_taken_at?: string | null
          capacity?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          level?: Database["club"]["Enums"]["class_level"]
          meeting_url?: string | null
          organization_id?: string | null
          resources?: Json | null
          session_notes?: string | null
          starts_at: string
          status?: Database["club"]["Enums"]["class_status"]
          title: string
          tutor_id?: string | null
          updated_at?: string
        }
        Update: {
          attendance_taken_at?: string | null
          capacity?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          level?: Database["club"]["Enums"]["class_level"]
          meeting_url?: string | null
          organization_id?: string | null
          resources?: Json | null
          session_notes?: string | null
          starts_at?: string
          status?: Database["club"]["Enums"]["class_status"]
          title?: string
          tutor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_applications: {
        Row: {
          bio: string
          id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          specialties: string[]
          status: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          bio: string
          id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialties?: string[]
          status?: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          bio?: string
          id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialties?: string[]
          status?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: []
      }
      embeds: {
        Row: {
          config: Json
          created_at: string
          created_by: string | null
          embed_url: string
          expires_at: string | null
          id: string
          iframe_html: string | null
          kind: string
          label: string
          token: string
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by?: string | null
          embed_url: string
          expires_at?: string | null
          id?: string
          iframe_html?: string | null
          kind: string
          label: string
          token: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string | null
          embed_url?: string
          expires_at?: string | null
          id?: string
          iframe_html?: string | null
          kind?: string
          label?: string
          token?: string
        }
        Relationships: []
      }
      guardian_links: {
        Row: {
          child_user_id: string
          created_at: string
          created_by: string | null
          guardian_user_id: string
          id: string
          organization_id: string
        }
        Insert: {
          child_user_id: string
          created_at?: string
          created_by?: string | null
          guardian_user_id: string
          id?: string
          organization_id: string
        }
        Update: {
          child_user_id?: string
          created_at?: string
          created_by?: string | null
          guardian_user_id?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardian_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardian_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      login_events: {
        Row: {
          browser: string | null
          created_at: string
          device: string | null
          email: string | null
          id: string
          ip_address: string | null
          location: string | null
          method: string
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device?: string | null
          email?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          method?: string
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device?: string | null
          email?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          method?: string
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
          subject: string | null
          thread_id: string | null
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
          subject?: string | null
          thread_id?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          subject?: string | null
          thread_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          metadata: Json | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          link?: string | null
          metadata?: Json | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          metadata?: Json | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_memberships: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          cohort: string | null
          id: string
          joined_at: string
          organization_id: string
          role_in_org: string
          status: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          cohort?: string | null
          id?: string
          joined_at?: string
          organization_id: string
          role_in_org?: string
          status?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          cohort?: string | null
          id?: string
          joined_at?: string
          organization_id?: string
          role_in_org?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_default: boolean
          is_suspended: boolean | null
          join_code: string | null
          join_policy: string
          name: string
          owner_user_id: string | null
          program_tier: Database["club"]["Enums"]["organization_tier"] | null
          selected_plan_id: string | null
          student_count: number | null
          subscription_expires_at: string | null
          subscription_started_at: string | null
          subscription_status:
            | Database["club"]["Enums"]["subscription_status"]
            | null
          suspended_reason: string | null
          type: Database["club"]["Enums"]["organization_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          is_suspended?: boolean | null
          join_code?: string | null
          join_policy?: string
          name: string
          owner_user_id?: string | null
          program_tier?: Database["club"]["Enums"]["organization_tier"] | null
          selected_plan_id?: string | null
          student_count?: number | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_status?:
            | Database["club"]["Enums"]["subscription_status"]
            | null
          suspended_reason?: string | null
          type?: Database["club"]["Enums"]["organization_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          is_suspended?: boolean | null
          join_code?: string | null
          join_policy?: string
          name?: string
          owner_user_id?: string | null
          program_tier?: Database["club"]["Enums"]["organization_tier"] | null
          selected_plan_id?: string | null
          student_count?: number | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_status?:
            | Database["club"]["Enums"]["subscription_status"]
            | null
          suspended_reason?: string | null
          type?: Database["club"]["Enums"]["organization_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_selected_plan_fk"
            columns: ["selected_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_kobo: number
          authorization_url: string | null
          created_at: string
          currency: string
          id: string
          organization_id: string | null
          paid_at: string | null
          plan_id: string
          raw: Json | null
          reference: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_kobo: number
          authorization_url?: string | null
          created_at?: string
          currency?: string
          id?: string
          organization_id?: string | null
          paid_at?: string | null
          plan_id: string
          raw?: Json | null
          reference: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_kobo?: number
          authorization_url?: string | null
          created_at?: string
          currency?: string
          id?: string
          organization_id?: string | null
          paid_at?: string | null
          plan_id?: string
          raw?: Json | null
          reference?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          audience: string
          created_at: string
          currency: string
          description: string | null
          features: Json
          id: string
          interval: string
          is_active: boolean
          name: string
          price_kobo: number
          slug: string
          sort_order: number
          tier: string
          updated_at: string
        }
        Insert: {
          audience: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          name: string
          price_kobo: number
          slug: string
          sort_order?: number
          tier: string
          updated_at?: string
        }
        Update: {
          audience?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          name?: string
          price_kobo?: number
          slug?: string
          sort_order?: number
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_state: Database["club"]["Enums"]["account_state"] | null
          avatar_url: string | null
          billing_cycle: string | null
          bio: string | null
          chess_goals: string | null
          chess_rating: number | null
          coach_bio: string | null
          coach_specialties: string[]
          coach_verified: boolean
          coach_verified_at: string | null
          coach_verified_by: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          full_name: string
          gender: string | null
          id: string
          language: string | null
          last_active_at: string | null
          lecture_level: string | null
          location: string | null
          member_since: string | null
          membership_expires_at: string | null
          membership_level: Database["club"]["Enums"]["membership_level"] | null
          membership_type: string | null
          notification_prefs: Json
          onboarding_completed: boolean | null
          onboarding_step: number
          phone: string | null
          selected_plan_id: string | null
          theme: string | null
          timezone: string | null
          updated_at: string
          visibility: Database["club"]["Enums"]["profile_visibility"] | null
        }
        Insert: {
          account_state?: Database["club"]["Enums"]["account_state"] | null
          avatar_url?: string | null
          billing_cycle?: string | null
          bio?: string | null
          chess_goals?: string | null
          chess_rating?: number | null
          coach_bio?: string | null
          coach_specialties?: string[]
          coach_verified?: boolean
          coach_verified_at?: string | null
          coach_verified_by?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          full_name: string
          gender?: string | null
          id: string
          language?: string | null
          last_active_at?: string | null
          lecture_level?: string | null
          location?: string | null
          member_since?: string | null
          membership_expires_at?: string | null
          membership_level?:
            | Database["club"]["Enums"]["membership_level"]
            | null
          membership_type?: string | null
          notification_prefs?: Json
          onboarding_completed?: boolean | null
          onboarding_step?: number
          phone?: string | null
          selected_plan_id?: string | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          visibility?: Database["club"]["Enums"]["profile_visibility"] | null
        }
        Update: {
          account_state?: Database["club"]["Enums"]["account_state"] | null
          avatar_url?: string | null
          billing_cycle?: string | null
          bio?: string | null
          chess_goals?: string | null
          chess_rating?: number | null
          coach_bio?: string | null
          coach_specialties?: string[]
          coach_verified?: boolean
          coach_verified_at?: string | null
          coach_verified_by?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          full_name?: string
          gender?: string | null
          id?: string
          language?: string | null
          last_active_at?: string | null
          lecture_level?: string | null
          location?: string | null
          member_since?: string | null
          membership_expires_at?: string | null
          membership_level?:
            | Database["club"]["Enums"]["membership_level"]
            | null
          membership_type?: string | null
          notification_prefs?: Json
          onboarding_completed?: boolean | null
          onboarding_step?: number
          phone?: string | null
          selected_plan_id?: string | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          visibility?: Database["club"]["Enums"]["profile_visibility"] | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_selected_plan_fk"
            columns: ["selected_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_pairings: {
        Row: {
          black_user_id: string | null
          board: number
          created_at: string
          id: string
          result: string | null
          round_id: string
          tournament_id: string
          updated_at: string
          white_user_id: string | null
        }
        Insert: {
          black_user_id?: string | null
          board: number
          created_at?: string
          id?: string
          result?: string | null
          round_id: string
          tournament_id: string
          updated_at?: string
          white_user_id?: string | null
        }
        Update: {
          black_user_id?: string | null
          board?: number
          created_at?: string
          id?: string
          result?: string | null
          round_id?: string
          tournament_id?: string
          updated_at?: string
          white_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_pairings_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "tournament_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_pairings_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_participants: {
        Row: {
          id: string
          rank: number | null
          registered_at: string
          score: number | null
          seed: number | null
          tournament_id: string
          user_id: string
        }
        Insert: {
          id?: string
          rank?: number | null
          registered_at?: string
          score?: number | null
          seed?: number | null
          tournament_id: string
          user_id: string
        }
        Update: {
          id?: string
          rank?: number | null
          registered_at?: string
          score?: number | null
          seed?: number | null
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_rounds: {
        Row: {
          created_at: string
          id: string
          round_number: number
          status: string
          tournament_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          round_number: number
          status?: string
          tournament_id: string
        }
        Update: {
          created_at?: string
          id?: string
          round_number?: number
          status?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_rounds_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          format: Database["club"]["Enums"]["tournament_format"]
          id: string
          max_participants: number | null
          name: string
          organization_id: string | null
          rounds: number | null
          starts_at: string
          status: Database["club"]["Enums"]["tournament_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          format?: Database["club"]["Enums"]["tournament_format"]
          id?: string
          max_participants?: number | null
          name: string
          organization_id?: string | null
          rounds?: number | null
          starts_at: string
          status?: Database["club"]["Enums"]["tournament_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          format?: Database["club"]["Enums"]["tournament_format"]
          id?: string
          max_participants?: number | null
          name?: string
          organization_id?: string | null
          rounds?: number | null
          starts_at?: string
          status?: Database["club"]["Enums"]["tournament_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["club"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["club"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["club"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      classes_public: {
        Row: {
          capacity: number | null
          created_at: string | null
          description: string | null
          ends_at: string | null
          id: string | null
          level: Database["club"]["Enums"]["class_level"] | null
          organization_id: string | null
          starts_at: string | null
          status: Database["club"]["Enums"]["class_status"] | null
          title: string | null
          tutor_id: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string | null
          level?: Database["club"]["Enums"]["class_level"] | null
          organization_id?: string | null
          starts_at?: string | null
          status?: Database["club"]["Enums"]["class_status"] | null
          title?: string | null
          tutor_id?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string | null
          level?: Database["club"]["Enums"]["class_level"] | null
          organization_id?: string | null
          starts_at?: string | null
          status?: Database["club"]["Enums"]["class_status"] | null
          title?: string | null
          tutor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations_public: {
        Row: {
          address: string | null
          created_at: string | null
          id: string | null
          name: string | null
          student_count: number | null
          type: Database["club"]["Enums"]["organization_type"] | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          student_count?: number | null
          type?: Database["club"]["Enums"]["organization_type"] | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          student_count?: number | null
          type?: Database["club"]["Enums"]["organization_type"] | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          chess_rating: number | null
          full_name: string | null
          id: string | null
          member_since: string | null
          membership_level: Database["club"]["Enums"]["membership_level"] | null
          visibility: Database["club"]["Enums"]["profile_visibility"] | null
        }
        Insert: {
          avatar_url?: string | null
          chess_rating?: number | null
          full_name?: string | null
          id?: string | null
          member_since?: string | null
          membership_level?:
            | Database["club"]["Enums"]["membership_level"]
            | null
          visibility?: Database["club"]["Enums"]["profile_visibility"] | null
        }
        Update: {
          avatar_url?: string | null
          chess_rating?: number | null
          full_name?: string | null
          id?: string | null
          member_since?: string | null
          membership_level?:
            | Database["club"]["Enums"]["membership_level"]
            | null
          visibility?: Database["club"]["Enums"]["profile_visibility"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["club"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: { _role: Database["club"]["Enums"]["app_role"]; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _organization_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_privileged: {
        Args: { _org_id: string; _roles: string[] }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          _action: string
          _metadata?: Json
          _target_id?: string
          _target_type?: string
        }
        Returns: string
      }
    }
    Enums: {
      account_state:
        | "unverified"
        | "pending_payment"
        | "active"
        | "expired"
        | "suspended"
      app_role: "super_admin" | "org_admin" | "tutor" | "member"
      class_level: "beginner" | "intermediate" | "advanced" | "all_levels"
      class_status:
        | "draft"
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
      membership_level: "beginner" | "intermediate" | "advanced"
      organization_tier: "starter" | "standard" | "premium"
      organization_type: "school" | "club" | "academy" | "other"
      profile_visibility: "members_only" | "public"
      subscription_status:
        | "none"
        | "pending"
        | "active"
        | "expired"
        | "cancelled"
      tournament_format: "swiss" | "round_robin" | "knockout" | "arena"
      tournament_status:
        | "draft"
        | "registration_open"
        | "in_progress"
        | "completed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals["club"]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  club: {
    Enums: {
      account_state: [
        "unverified",
        "pending_payment",
        "active",
        "expired",
        "suspended",
      ],
      app_role: ["super_admin", "org_admin", "tutor", "member"],
      class_level: ["beginner", "intermediate", "advanced", "all_levels"],
      class_status: [
        "draft",
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ],
      membership_level: ["beginner", "intermediate", "advanced"],
      organization_tier: ["starter", "standard", "premium"],
      organization_type: ["school", "club", "academy", "other"],
      profile_visibility: ["members_only", "public"],
      subscription_status: [
        "none",
        "pending",
        "active",
        "expired",
        "cancelled",
      ],
      tournament_format: ["swiss", "round_robin", "knockout", "arena"],
      tournament_status: [
        "draft",
        "registration_open",
        "in_progress",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
