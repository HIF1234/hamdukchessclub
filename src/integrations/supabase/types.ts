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
  public: {
    Tables: {
      announcements: {
        Row: {
          audience: string
          body: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          pinned: boolean
          published_at: string
          school_id: string | null
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
          pinned?: boolean
          published_at?: string
          school_id?: string | null
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
          pinned?: boolean
          published_at?: string
          school_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_public"
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
          level: Database["public"]["Enums"]["class_level"]
          meeting_url: string | null
          resources: Json | null
          school_id: string | null
          session_notes: string | null
          starts_at: string
          status: Database["public"]["Enums"]["class_status"]
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
          level?: Database["public"]["Enums"]["class_level"]
          meeting_url?: string | null
          resources?: Json | null
          school_id?: string | null
          session_notes?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["class_status"]
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
          level?: Database["public"]["Enums"]["class_level"]
          meeting_url?: string | null
          resources?: Json | null
          school_id?: string | null
          session_notes?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["class_status"]
          title?: string
          tutor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_public"
            referencedColumns: ["id"]
          },
        ]
      }
      hamduk_accounts: {
        Row: {
          admin_note: string | null
          created_at: string
          hamduk_username: string
          id: string
          last_synced_at: string | null
          link_status: string
          sync_error: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          hamduk_username: string
          id?: string
          last_synced_at?: string | null
          link_status?: string
          sync_error?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          hamduk_username?: string
          id?: string
          last_synced_at?: string | null
          link_status?: string
          sync_error?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hamduk_embeds: {
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
      hamduk_games: {
        Row: {
          black: string | null
          black_rating_delta: number | null
          end_reason: string | null
          game_id: string
          id: string
          moves: number | null
          pgn: string | null
          played_at: string | null
          rated: boolean | null
          result: string | null
          status: string | null
          synced_at: string
          time_control: string | null
          user_id: string
          variant: string | null
          white: string | null
          white_rating_delta: number | null
        }
        Insert: {
          black?: string | null
          black_rating_delta?: number | null
          end_reason?: string | null
          game_id: string
          id?: string
          moves?: number | null
          pgn?: string | null
          played_at?: string | null
          rated?: boolean | null
          result?: string | null
          status?: string | null
          synced_at?: string
          time_control?: string | null
          user_id: string
          variant?: string | null
          white?: string | null
          white_rating_delta?: number | null
        }
        Update: {
          black?: string | null
          black_rating_delta?: number | null
          end_reason?: string | null
          game_id?: string
          id?: string
          moves?: number | null
          pgn?: string | null
          played_at?: string | null
          rated?: boolean | null
          result?: string | null
          status?: string | null
          synced_at?: string
          time_control?: string | null
          user_id?: string
          variant?: string | null
          white?: string | null
          white_rating_delta?: number | null
        }
        Relationships: []
      }
      hamduk_ratings: {
        Row: {
          breakdown: Json
          classical_rating: number | null
          country: string | null
          hamduk_username: string
          id: string
          synced_at: string
          user_id: string
        }
        Insert: {
          breakdown?: Json
          classical_rating?: number | null
          country?: string | null
          hamduk_username: string
          id?: string
          synced_at?: string
          user_id: string
        }
        Update: {
          breakdown?: Json
          classical_rating?: number | null
          country?: string | null
          hamduk_username?: string
          id?: string
          synced_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hamduk_webhook_events: {
        Row: {
          event: string
          id: string
          payload: Json | null
          received_at: string
          signature_valid: boolean
        }
        Insert: {
          event: string
          id?: string
          payload?: Json | null
          received_at?: string
          signature_valid?: boolean
        }
        Update: {
          event?: string
          id?: string
          payload?: Json | null
          received_at?: string
          signature_valid?: boolean
        }
        Relationships: []
      }
      hamduk_webhooks: {
        Row: {
          created_at: string
          disabled: boolean
          events: string[]
          id: string
          remote_id: string
          signing_secret: string
          url: string
        }
        Insert: {
          created_at?: string
          disabled?: boolean
          events?: string[]
          id?: string
          remote_id: string
          signing_secret: string
          url: string
        }
        Update: {
          created_at?: string
          disabled?: boolean
          events?: string[]
          id?: string
          remote_id?: string
          signing_secret?: string
          url?: string
        }
        Relationships: []
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
      payments: {
        Row: {
          amount_kobo: number
          authorization_url: string | null
          created_at: string
          currency: string
          id: string
          paid_at: string | null
          plan_id: string
          raw: Json | null
          reference: string
          school_id: string | null
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
          paid_at?: string | null
          plan_id: string
          raw?: Json | null
          reference: string
          school_id?: string | null
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
          paid_at?: string | null
          plan_id?: string
          raw?: Json | null
          reference?: string
          school_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
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
          account_state: Database["public"]["Enums"]["account_state"] | null
          avatar_url: string | null
          bio: string | null
          chess_goals: string | null
          chess_rating: number | null
          created_at: string
          date_of_birth: string | null
          email: string
          full_name: string
          gender: string | null
          id: string
          language: string | null
          last_active_at: string | null
          location: string | null
          member_since: string | null
          membership_expires_at: string | null
          membership_level:
            | Database["public"]["Enums"]["membership_level"]
            | null
          notification_prefs: Json
          onboarding_completed: boolean | null
          onboarding_step: number
          phone: string | null
          selected_plan_id: string | null
          theme: string | null
          timezone: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["profile_visibility"] | null
        }
        Insert: {
          account_state?: Database["public"]["Enums"]["account_state"] | null
          avatar_url?: string | null
          bio?: string | null
          chess_goals?: string | null
          chess_rating?: number | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          full_name: string
          gender?: string | null
          id: string
          language?: string | null
          last_active_at?: string | null
          location?: string | null
          member_since?: string | null
          membership_expires_at?: string | null
          membership_level?:
            | Database["public"]["Enums"]["membership_level"]
            | null
          notification_prefs?: Json
          onboarding_completed?: boolean | null
          onboarding_step?: number
          phone?: string | null
          selected_plan_id?: string | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["profile_visibility"] | null
        }
        Update: {
          account_state?: Database["public"]["Enums"]["account_state"] | null
          avatar_url?: string | null
          bio?: string | null
          chess_goals?: string | null
          chess_rating?: number | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          full_name?: string
          gender?: string | null
          id?: string
          language?: string | null
          last_active_at?: string | null
          location?: string | null
          member_since?: string | null
          membership_expires_at?: string | null
          membership_level?:
            | Database["public"]["Enums"]["membership_level"]
            | null
          notification_prefs?: Json
          onboarding_completed?: boolean | null
          onboarding_step?: number
          phone?: string | null
          selected_plan_id?: string | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["profile_visibility"] | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_selected_plan_id_fkey"
            columns: ["selected_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      school_memberships: {
        Row: {
          cohort: string | null
          id: string
          joined_at: string
          role_in_school: string
          school_id: string
          user_id: string
        }
        Insert: {
          cohort?: string | null
          id?: string
          joined_at?: string
          role_in_school?: string
          school_id: string
          user_id: string
        }
        Update: {
          cohort?: string | null
          id?: string
          joined_at?: string
          role_in_school?: string
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_memberships_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_memberships_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_public"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_suspended: boolean | null
          name: string
          owner_user_id: string | null
          program_tier:
            | Database["public"]["Enums"]["school_program_tier"]
            | null
          selected_plan_id: string | null
          student_count: number | null
          subscription_expires_at: string | null
          subscription_started_at: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          suspended_reason: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_suspended?: boolean | null
          name: string
          owner_user_id?: string | null
          program_tier?:
            | Database["public"]["Enums"]["school_program_tier"]
            | null
          selected_plan_id?: string | null
          student_count?: number | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          suspended_reason?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_suspended?: boolean | null
          name?: string
          owner_user_id?: string | null
          program_tier?:
            | Database["public"]["Enums"]["school_program_tier"]
            | null
          selected_plan_id?: string | null
          student_count?: number | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          suspended_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schools_selected_plan_id_fkey"
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
          format: Database["public"]["Enums"]["tournament_format"]
          id: string
          max_participants: number | null
          name: string
          rounds: number | null
          school_id: string | null
          starts_at: string
          status: Database["public"]["Enums"]["tournament_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          format?: Database["public"]["Enums"]["tournament_format"]
          id?: string
          max_participants?: number | null
          name: string
          rounds?: number | null
          school_id?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["tournament_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          format?: Database["public"]["Enums"]["tournament_format"]
          id?: string
          max_participants?: number | null
          name?: string
          rounds?: number | null
          school_id?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["tournament_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
          level: Database["public"]["Enums"]["class_level"] | null
          school_id: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["class_status"] | null
          title: string | null
          tutor_id: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string | null
          level?: Database["public"]["Enums"]["class_level"] | null
          school_id?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["class_status"] | null
          title?: string | null
          tutor_id?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string | null
          level?: Database["public"]["Enums"]["class_level"] | null
          school_id?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["class_status"] | null
          title?: string | null
          tutor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          chess_rating: number | null
          full_name: string | null
          id: string | null
          member_since: string | null
          membership_level:
            | Database["public"]["Enums"]["membership_level"]
            | null
          visibility: Database["public"]["Enums"]["profile_visibility"] | null
        }
        Insert: {
          avatar_url?: string | null
          chess_rating?: number | null
          full_name?: string | null
          id?: string | null
          member_since?: string | null
          membership_level?:
            | Database["public"]["Enums"]["membership_level"]
            | null
          visibility?: Database["public"]["Enums"]["profile_visibility"] | null
        }
        Update: {
          avatar_url?: string | null
          chess_rating?: number | null
          full_name?: string | null
          id?: string | null
          member_since?: string | null
          membership_level?:
            | Database["public"]["Enums"]["membership_level"]
            | null
          visibility?: Database["public"]["Enums"]["profile_visibility"] | null
        }
        Relationships: []
      }
      schools_public: {
        Row: {
          address: string | null
          created_at: string | null
          id: string | null
          name: string | null
          student_count: number | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          student_count?: number | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          student_count?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_school_member: {
        Args: { _school_id: string; _user_id: string }
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
      app_role: "super_admin" | "school_admin" | "tutor" | "member"
      class_level: "beginner" | "intermediate" | "advanced" | "all_levels"
      class_status:
        | "draft"
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
      membership_level: "beginner" | "intermediate" | "advanced"
      profile_visibility: "members_only" | "public"
      school_program_tier: "starter" | "standard" | "premium"
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
      account_state: [
        "unverified",
        "pending_payment",
        "active",
        "expired",
        "suspended",
      ],
      app_role: ["super_admin", "school_admin", "tutor", "member"],
      class_level: ["beginner", "intermediate", "advanced", "all_levels"],
      class_status: [
        "draft",
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ],
      membership_level: ["beginner", "intermediate", "advanced"],
      profile_visibility: ["members_only", "public"],
      school_program_tier: ["starter", "standard", "premium"],
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
