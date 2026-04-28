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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_audit_log: {
        Row: {
          action_detail: Json | null
          action_type: string
          agent_name: string
          created_at: string
          duration_ms: number | null
          id: string
          result: string
          target_entity: string | null
          target_entity_type: string | null
          triggered_by: string | null
        }
        Insert: {
          action_detail?: Json | null
          action_type: string
          agent_name: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          result?: string
          target_entity?: string | null
          target_entity_type?: string | null
          triggered_by?: string | null
        }
        Update: {
          action_detail?: Json | null
          action_type?: string
          agent_name?: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          result?: string
          target_entity?: string | null
          target_entity_type?: string | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      agent_jobs: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          current_step: string | null
          error: string | null
          expires_at: string
          id: string
          input_json: Json
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          progress: number | null
          result_json: Json | null
          run_after: string
          started_at: string | null
          status: string
          total_steps: number | null
          type: string
          user_id: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          current_step?: string | null
          error?: string | null
          expires_at?: string
          id?: string
          input_json: Json
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          progress?: number | null
          result_json?: Json | null
          run_after?: string
          started_at?: string | null
          status?: string
          total_steps?: number | null
          type: string
          user_id: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          current_step?: string | null
          error?: string | null
          expires_at?: string
          id?: string
          input_json?: Json
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          progress?: number | null
          result_json?: Json | null
          run_after?: string
          started_at?: string | null
          status?: string
          total_steps?: number | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_context: {
        Row: {
          conversation_id: string
          created_at: string
          current_intent: string | null
          entities: Json | null
          global_context: Json | null
          id: string
          pending_actions: Json | null
          session_context: Json | null
          updated_at: string
          user_context: Json | null
          version: number | null
        }
        Insert: {
          conversation_id: string
          created_at?: string
          current_intent?: string | null
          entities?: Json | null
          global_context?: Json | null
          id?: string
          pending_actions?: Json | null
          session_context?: Json | null
          updated_at?: string
          user_context?: Json | null
          version?: number | null
        }
        Update: {
          conversation_id?: string
          created_at?: string
          current_intent?: string | null
          entities?: Json | null
          global_context?: Json | null
          id?: string
          pending_actions?: Json | null
          session_context?: Json | null
          updated_at?: string
          user_context?: Json | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_context_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_runs: {
        Row: {
          agent_name: string
          agent_type: Database["public"]["Enums"]["agent_type"]
          completed_at: string | null
          conversation_id: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          estimated_cost_usd: number | null
          id: string
          input_data: Json
          input_tokens: number | null
          metadata: Json | null
          model_name: string | null
          output_data: Json | null
          output_tokens: number | null
          status: Database["public"]["Enums"]["ai_run_status"] | null
          temperature: number | null
          total_tokens: number | null
          user_id: string
        }
        Insert: {
          agent_name: string
          agent_type: Database["public"]["Enums"]["agent_type"]
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          estimated_cost_usd?: number | null
          id?: string
          input_data: Json
          input_tokens?: number | null
          metadata?: Json | null
          model_name?: string | null
          output_data?: Json | null
          output_tokens?: number | null
          status?: Database["public"]["Enums"]["ai_run_status"] | null
          temperature?: number | null
          total_tokens?: number | null
          user_id: string
        }
        Update: {
          agent_name?: string
          agent_type?: Database["public"]["Enums"]["agent_type"]
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          estimated_cost_usd?: number | null
          id?: string
          input_data?: Json
          input_tokens?: number | null
          metadata?: Json | null
          model_name?: string | null
          output_data?: Json | null
          output_tokens?: number | null
          status?: Database["public"]["Enums"]["ai_run_status"] | null
          temperature?: number | null
          total_tokens?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_runs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      apartments: {
        Row: {
          address: string | null
          amenities: string[] | null
          available_from: string | null
          available_to: string | null
          bathrooms: number | null
          bedrooms: number | null
          building_amenities: string[] | null
          city: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          deposit_amount: number | null
          description: string | null
          featured: boolean | null
          floor_number: number | null
          freshness_status: string | null
          furnished: boolean | null
          host_id: string | null
          host_name: string | null
          host_response_time: string | null
          id: string
          images: string[] | null
          last_checked_at: string | null
          latitude: number | null
          location: unknown
          longitude: number | null
          maximum_stay_days: number | null
          metadata: Json | null
          minimum_stay_days: number | null
          neighborhood: string
          parking_included: boolean | null
          pet_friendly: boolean | null
          price_daily: number | null
          price_monthly: number | null
          price_weekly: number | null
          rating: number | null
          raw_amenities: Json | null
          review_count: number | null
          size_sqm: number | null
          slug: string | null
          smoking_allowed: boolean | null
          source_listing_id: string | null
          source_url: string | null
          status: string | null
          title: string
          total_floors: number | null
          updated_at: string
          utilities_included: boolean | null
          verified: boolean | null
          video_url: string | null
          virtual_tour_url: string | null
          wifi_speed: number | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          available_from?: string | null
          available_to?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          building_amenities?: string[] | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deposit_amount?: number | null
          description?: string | null
          featured?: boolean | null
          floor_number?: number | null
          freshness_status?: string | null
          furnished?: boolean | null
          host_id?: string | null
          host_name?: string | null
          host_response_time?: string | null
          id?: string
          images?: string[] | null
          last_checked_at?: string | null
          latitude?: number | null
          location?: unknown
          longitude?: number | null
          maximum_stay_days?: number | null
          metadata?: Json | null
          minimum_stay_days?: number | null
          neighborhood: string
          parking_included?: boolean | null
          pet_friendly?: boolean | null
          price_daily?: number | null
          price_monthly?: number | null
          price_weekly?: number | null
          rating?: number | null
          raw_amenities?: Json | null
          review_count?: number | null
          size_sqm?: number | null
          slug?: string | null
          smoking_allowed?: boolean | null
          source_listing_id?: string | null
          source_url?: string | null
          status?: string | null
          title: string
          total_floors?: number | null
          updated_at?: string
          utilities_included?: boolean | null
          verified?: boolean | null
          video_url?: string | null
          virtual_tour_url?: string | null
          wifi_speed?: number | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          available_from?: string | null
          available_to?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          building_amenities?: string[] | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deposit_amount?: number | null
          description?: string | null
          featured?: boolean | null
          floor_number?: number | null
          freshness_status?: string | null
          furnished?: boolean | null
          host_id?: string | null
          host_name?: string | null
          host_response_time?: string | null
          id?: string
          images?: string[] | null
          last_checked_at?: string | null
          latitude?: number | null
          location?: unknown
          longitude?: number | null
          maximum_stay_days?: number | null
          metadata?: Json | null
          minimum_stay_days?: number | null
          neighborhood?: string
          parking_included?: boolean | null
          pet_friendly?: boolean | null
          price_daily?: number | null
          price_monthly?: number | null
          price_weekly?: number | null
          rating?: number | null
          raw_amenities?: Json | null
          review_count?: number | null
          size_sqm?: number | null
          slug?: string | null
          smoking_allowed?: boolean | null
          source_listing_id?: string | null
          source_url?: string | null
          status?: string | null
          title?: string
          total_floors?: number | null
          updated_at?: string
          utilities_included?: boolean | null
          verified?: boolean | null
          video_url?: string | null
          virtual_tour_url?: string | null
          wifi_speed?: number | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_type: Database["public"]["Enums"]["booking_type"]
          cancelled_at: string | null
          confirmation_code: string | null
          confirmed_at: string | null
          created_at: string
          currency: string | null
          end_date: string | null
          end_time: string | null
          id: string
          metadata: Json | null
          notes: string | null
          party_size: number | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          quantity: number | null
          resource_id: string
          resource_title: string
          special_requests: string | null
          start_date: string
          start_time: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number | null
          trip_id: string | null
          unit_price: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_type: Database["public"]["Enums"]["booking_type"]
          cancelled_at?: string | null
          confirmation_code?: string | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          party_size?: number | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          quantity?: number | null
          resource_id: string
          resource_title: string
          special_requests?: string | null
          start_date: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number | null
          trip_id?: string | null
          unit_price?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_type?: Database["public"]["Enums"]["booking_type"]
          cancelled_at?: string | null
          confirmation_code?: string | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          party_size?: number | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          quantity?: number | null
          resource_id?: string
          resource_title?: string
          special_requests?: string | null
          start_date?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number | null
          trip_id?: string | null
          unit_price?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_tracking: {
        Row: {
          ai_recommendations: Json | null
          alert_threshold: number | null
          alerts_sent: Json | null
          categories: Json | null
          created_at: string
          currency: string | null
          id: string
          last_optimization_at: string | null
          total_budget: number
          total_pending: number | null
          total_spent: number | null
          trip_id: string
          updated_at: string
        }
        Insert: {
          ai_recommendations?: Json | null
          alert_threshold?: number | null
          alerts_sent?: Json | null
          categories?: Json | null
          created_at?: string
          currency?: string | null
          id?: string
          last_optimization_at?: string | null
          total_budget: number
          total_pending?: number | null
          total_spent?: number | null
          trip_id: string
          updated_at?: string
        }
        Update: {
          ai_recommendations?: Json | null
          alert_threshold?: number | null
          alerts_sent?: Json | null
          categories?: Json | null
          created_at?: string
          currency?: string | null
          id?: string
          last_optimization_at?: string | null
          total_budget?: number
          total_pending?: number | null
          total_spent?: number | null
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_tracking_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: true
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      car_rentals: {
        Row: {
          available_from: string | null
          available_to: string | null
          color: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          delivery_available: boolean | null
          deposit_amount: number | null
          description: string | null
          doors: number | null
          featured: boolean | null
          features: string[] | null
          fuel_type: string | null
          has_ac: boolean | null
          has_bluetooth: boolean | null
          has_gps: boolean | null
          id: string
          images: string[] | null
          insurance_included: boolean | null
          make: string
          mileage_limit_daily: number | null
          minimum_rental_days: number | null
          model: string
          pickup_locations: Json | null
          price_daily: number
          price_monthly: number | null
          price_weekly: number | null
          rating: number | null
          rental_company: string | null
          review_count: number | null
          seats: number | null
          slug: string | null
          status: string | null
          transmission: string | null
          unlimited_mileage: boolean | null
          updated_at: string
          vehicle_type: string | null
          year: number | null
        }
        Insert: {
          available_from?: string | null
          available_to?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          delivery_available?: boolean | null
          deposit_amount?: number | null
          description?: string | null
          doors?: number | null
          featured?: boolean | null
          features?: string[] | null
          fuel_type?: string | null
          has_ac?: boolean | null
          has_bluetooth?: boolean | null
          has_gps?: boolean | null
          id?: string
          images?: string[] | null
          insurance_included?: boolean | null
          make: string
          mileage_limit_daily?: number | null
          minimum_rental_days?: number | null
          model: string
          pickup_locations?: Json | null
          price_daily: number
          price_monthly?: number | null
          price_weekly?: number | null
          rating?: number | null
          rental_company?: string | null
          review_count?: number | null
          seats?: number | null
          slug?: string | null
          status?: string | null
          transmission?: string | null
          unlimited_mileage?: boolean | null
          updated_at?: string
          vehicle_type?: string | null
          year?: number | null
        }
        Update: {
          available_from?: string | null
          available_to?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          delivery_available?: boolean | null
          deposit_amount?: number | null
          description?: string | null
          doors?: number | null
          featured?: boolean | null
          features?: string[] | null
          fuel_type?: string | null
          has_ac?: boolean | null
          has_bluetooth?: boolean | null
          has_gps?: boolean | null
          id?: string
          images?: string[] | null
          insurance_included?: boolean | null
          make?: string
          mileage_limit_daily?: number | null
          minimum_rental_days?: number | null
          model?: string
          pickup_locations?: Json | null
          price_daily?: number
          price_monthly?: number | null
          price_weekly?: number | null
          rating?: number | null
          rental_company?: string | null
          review_count?: number | null
          seats?: number | null
          slug?: string | null
          status?: string | null
          transmission?: string | null
          unlimited_mileage?: boolean | null
          updated_at?: string
          vehicle_type?: string | null
          year?: number | null
        }
        Relationships: []
      }
      collections: {
        Row: {
          color: string | null
          cover_image_url: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          emoji: string | null
          id: string
          is_public: boolean | null
          item_count: number | null
          name: string
          share_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          cover_image_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_public?: boolean | null
          item_count?: number | null
          name: string
          share_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          cover_image_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_public?: boolean | null
          item_count?: number | null
          name?: string
          share_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conflict_resolutions: {
        Row: {
          affected_items: Json
          created_at: string
          description: string
          detected_at: string
          id: string
          metadata: Json | null
          resolution_options: Json | null
          resolved_at: string | null
          resolved_by: string | null
          selected_resolution: Json | null
          severity: number
          status: Database["public"]["Enums"]["resolution_status"] | null
          title: string
          trip_id: string
          type: Database["public"]["Enums"]["conflict_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          affected_items?: Json
          created_at?: string
          description: string
          detected_at?: string
          id?: string
          metadata?: Json | null
          resolution_options?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          selected_resolution?: Json | null
          severity: number
          status?: Database["public"]["Enums"]["resolution_status"] | null
          title: string
          trip_id: string
          type: Database["public"]["Enums"]["conflict_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          affected_items?: Json
          created_at?: string
          description?: string
          detected_at?: string
          id?: string
          metadata?: Json | null
          resolution_options?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          selected_resolution?: Json | null
          severity?: number
          status?: Database["public"]["Enums"]["resolution_status"] | null
          title?: string
          trip_id?: string
          type?: Database["public"]["Enums"]["conflict_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conflict_resolutions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflict_resolutions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          agent_type: Database["public"]["Enums"]["agent_type"]
          created_at: string
          deleted_at: string | null
          id: string
          last_message_at: string | null
          message_count: number | null
          session_data: Json | null
          status: Database["public"]["Enums"]["conversation_status"] | null
          title: string
          trip_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_type: Database["public"]["Enums"]["agent_type"]
          created_at?: string
          deleted_at?: string | null
          id?: string
          last_message_at?: string | null
          message_count?: number | null
          session_data?: Json | null
          status?: Database["public"]["Enums"]["conversation_status"] | null
          title: string
          trip_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_type?: Database["public"]["Enums"]["agent_type"]
          created_at?: string
          deleted_at?: string | null
          id?: string
          last_message_at?: string | null
          message_count?: number | null
          session_data?: Json | null
          status?: Database["public"]["Enums"]["conversation_status"] | null
          title?: string
          trip_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          cache_expires_at: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          data_freshness: string | null
          description: string | null
          details: Json | null
          email: string | null
          event_end_time: string | null
          event_start_time: string
          event_type: string | null
          external_id: string | null
          google_place_id: string | null
          id: string
          images: Json | null
          is_active: boolean
          is_verified: boolean
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          postal_code: string | null
          primary_image_url: string | null
          rating: number | null
          rating_count: number | null
          source: string
          state: string | null
          subcategory: string | null
          tags: string[] | null
          ticket_price_max: number | null
          ticket_price_min: number | null
          ticket_url: string | null
          ticketmaster_id: string | null
          timezone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          cache_expires_at?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          data_freshness?: string | null
          description?: string | null
          details?: Json | null
          email?: string | null
          event_end_time?: string | null
          event_start_time: string
          event_type?: string | null
          external_id?: string | null
          google_place_id?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          postal_code?: string | null
          primary_image_url?: string | null
          rating?: number | null
          rating_count?: number | null
          source?: string
          state?: string | null
          subcategory?: string | null
          tags?: string[] | null
          ticket_price_max?: number | null
          ticket_price_min?: number | null
          ticket_url?: string | null
          ticketmaster_id?: string | null
          timezone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          cache_expires_at?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          data_freshness?: string | null
          description?: string | null
          details?: Json | null
          email?: string | null
          event_end_time?: string | null
          event_start_time?: string
          event_type?: string | null
          external_id?: string | null
          google_place_id?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          primary_image_url?: string | null
          rating?: number | null
          rating_count?: number | null
          source?: string
          state?: string | null
          subcategory?: string | null
          tags?: string[] | null
          ticket_price_max?: number | null
          ticket_price_min?: number | null
          ticket_url?: string | null
          ticketmaster_id?: string | null
          timezone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      idempotency_keys: {
        Row: {
          created_at: string
          endpoint: string
          key: string
          response: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          endpoint: string
          key: string
          response: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          endpoint?: string
          key?: string
          response?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_agent_id: string | null
          created_at: string
          email: string | null
          id: string
          idempotency_key: string | null
          metadata: Json
          neighborhood_id: string | null
          notes: string | null
          phone: string | null
          score: number | null
          source: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_agent_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          neighborhood_id?: string | null
          notes?: string | null
          phone?: string | null
          score?: number | null
          source?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_agent_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          neighborhood_id?: string | null
          notes?: string | null
          phone?: string | null
          score?: number | null
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          agent_name: string | null
          content: string
          conversation_id: string
          created_at: string
          function_call: Json | null
          function_response: Json | null
          id: string
          input_tokens: number | null
          latency_ms: number | null
          metadata: Json | null
          output_tokens: number | null
          role: Database["public"]["Enums"]["message_role"]
          total_tokens: number | null
        }
        Insert: {
          agent_name?: string | null
          content: string
          conversation_id: string
          created_at?: string
          function_call?: Json | null
          function_response?: Json | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          metadata?: Json | null
          output_tokens?: number | null
          role: Database["public"]["Enums"]["message_role"]
          total_tokens?: number | null
        }
        Update: {
          agent_name?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          function_call?: Json | null
          function_response?: Json | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          metadata?: Json | null
          output_tokens?: number | null
          role?: Database["public"]["Enums"]["message_role"]
          total_tokens?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      neighborhoods: {
        Row: {
          city: string
          created_at: string
          id: string
          metadata: Json
          name: string
          nomad_score: number | null
          safety_score: number | null
          slug: string
          updated_at: string
          walkability_score: number | null
        }
        Insert: {
          city?: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          nomad_score?: number | null
          safety_score?: number | null
          slug: string
          updated_at?: string
          walkability_score?: number | null
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          nomad_score?: number | null
          safety_score?: number | null
          slug?: string
          updated_at?: string
          walkability_score?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          metadata: Json
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      outbound_clicks: {
        Row: {
          affiliate_tag: string | null
          created_at: string
          id: string
          listing_id: string
          source_url: string
          surface: string
          user_id: string | null
        }
        Insert: {
          affiliate_tag?: string | null
          created_at?: string
          id?: string
          listing_id: string
          source_url: string
          surface: string
          user_id?: string | null
        }
        Update: {
          affiliate_tag?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          source_url?: string
          surface?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          id: string
          metadata: Json
          status: string
          stripe_customer_id: string | null
          stripe_event_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          status?: string
          stripe_customer_id?: string | null
          stripe_event_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          status?: string
          stripe_customer_id?: string | null
          stripe_event_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      proactive_suggestions: {
        Row: {
          action_url: string | null
          agent_name: string | null
          confidence_score: number | null
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          priority: number | null
          reasoning: string | null
          responded_at: string | null
          shown_at: string | null
          status: string | null
          suggestion_data: Json | null
          title: string
          trip_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          agent_name?: string | null
          confidence_score?: number | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          priority?: number | null
          reasoning?: string | null
          responded_at?: string | null
          shown_at?: string | null
          status?: string | null
          suggestion_data?: Json | null
          title: string
          trip_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          agent_name?: string | null
          confidence_score?: number | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          priority?: number | null
          reasoning?: string | null
          responded_at?: string | null
          shown_at?: string | null
          status?: string | null
          suggestion_data?: Json | null
          title?: string
          trip_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proactive_suggestions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proactive_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_enabled: boolean | null
          avatar_url: string | null
          created_at: string
          currency: string | null
          deleted_at: string | null
          email: string
          full_name: string | null
          id: string
          language: string | null
          last_active_at: string | null
          notification_preferences: Json | null
          onboarding_completed: boolean | null
          proactive_suggestions_enabled: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          timezone: string | null
          updated_at: string
        }
        Insert: {
          ai_enabled?: boolean | null
          avatar_url?: string | null
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          email: string
          full_name?: string | null
          id: string
          language?: string | null
          last_active_at?: string | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          proactive_suggestions_enabled?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          ai_enabled?: boolean | null
          avatar_url?: string | null
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          language?: string | null
          last_active_at?: string | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          proactive_suggestions_enabled?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      property_verifications: {
        Row: {
          apartment_id: string
          created_at: string
          id: string
          metadata: Json
          notes: string | null
          status: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          apartment_id: string
          created_at?: string
          id?: string
          metadata?: Json
          notes?: string | null
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          apartment_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          notes?: string | null
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_verifications_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: true
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_hits: {
        Row: {
          bucket_key: string
          count: number
          window_start: string
        }
        Insert: {
          bucket_key: string
          count?: number
          window_start: string
        }
        Update: {
          bucket_key?: string
          count?: number
          window_start?: string
        }
        Relationships: []
      }
      rental_applications: {
        Row: {
          ai_summary: string | null
          apartment_id: string
          applicant_id: string
          created_at: string
          documents: Json
          id: string
          idempotency_key: string | null
          lead_id: string | null
          metadata: Json
          status: string
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          apartment_id: string
          applicant_id: string
          created_at?: string
          documents?: Json
          id?: string
          idempotency_key?: string | null
          lead_id?: string | null
          metadata?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          apartment_id?: string
          applicant_id?: string
          created_at?: string
          documents?: Json
          id?: string
          idempotency_key?: string | null
          lead_id?: string | null
          metadata?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_applications_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_applications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_freshness_log: {
        Row: {
          checked_at: string
          created_at: string
          html_signature_match: boolean | null
          http_status: number | null
          id: string
          listing_id: string
          status: string
        }
        Insert: {
          checked_at?: string
          created_at?: string
          html_signature_match?: boolean | null
          http_status?: number | null
          id?: string
          listing_id: string
          status: string
        }
        Update: {
          checked_at?: string
          created_at?: string
          html_signature_match?: boolean | null
          http_status?: number | null
          id?: string
          listing_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_freshness_log_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_listing_images: {
        Row: {
          created_at: string
          height: number | null
          id: string
          listing_id: string
          mime_type: string | null
          sort_order: number | null
          source_url: string | null
          storage_path: string
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          listing_id: string
          mime_type?: string | null
          sort_order?: number | null
          source_url?: string | null
          storage_path: string
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          listing_id?: string
          mime_type?: string | null
          sort_order?: number | null
          source_url?: string | null
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_listing_sources: {
        Row: {
          base_url: string | null
          created_at: string
          id: string
          is_enabled: boolean
          last_crawl_at: string | null
          rate_limit_config: Json | null
          source_key: string
          updated_at: string
        }
        Insert: {
          base_url?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_crawl_at?: string | null
          rate_limit_config?: Json | null
          source_key: string
          updated_at?: string
        }
        Update: {
          base_url?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_crawl_at?: string | null
          rate_limit_config?: Json | null
          source_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      rental_search_sessions: {
        Row: {
          created_at: string
          filter_json: Json
          id: string
          result_ids: string[] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          filter_json?: Json
          id?: string
          result_ids?: string[] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          filter_json?: Json
          id?: string
          result_ids?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      rentals: {
        Row: {
          address: string | null
          availability_end: string | null
          availability_start: string | null
          cache_expires_at: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          daily_rate: number | null
          data_freshness: string | null
          description: string | null
          details: Json | null
          email: string | null
          external_id: string | null
          hourly_rate: number | null
          id: string
          images: Json | null
          is_active: boolean
          is_available: boolean
          is_verified: boolean
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          postal_code: string | null
          primary_image_url: string | null
          rating: number | null
          rating_count: number | null
          rental_features: string[] | null
          source: string
          state: string | null
          subcategory: string | null
          tags: string[] | null
          updated_at: string
          vehicle_type: string | null
          website: string | null
          weekly_rate: number | null
        }
        Insert: {
          address?: string | null
          availability_end?: string | null
          availability_start?: string | null
          cache_expires_at?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          daily_rate?: number | null
          data_freshness?: string | null
          description?: string | null
          details?: Json | null
          email?: string | null
          external_id?: string | null
          hourly_rate?: number | null
          id?: string
          images?: Json | null
          is_active?: boolean
          is_available?: boolean
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          postal_code?: string | null
          primary_image_url?: string | null
          rating?: number | null
          rating_count?: number | null
          rental_features?: string[] | null
          source?: string
          state?: string | null
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string
          vehicle_type?: string | null
          website?: string | null
          weekly_rate?: number | null
        }
        Update: {
          address?: string | null
          availability_end?: string | null
          availability_start?: string | null
          cache_expires_at?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          daily_rate?: number | null
          data_freshness?: string | null
          description?: string | null
          details?: Json | null
          email?: string | null
          external_id?: string | null
          hourly_rate?: number | null
          id?: string
          images?: Json | null
          is_active?: boolean
          is_available?: boolean
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          primary_image_url?: string | null
          rating?: number | null
          rating_count?: number | null
          rental_features?: string[] | null
          source?: string
          state?: string | null
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string
          vehicle_type?: string | null
          website?: string | null
          weekly_rate?: number | null
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          address: string | null
          ambiance: string[] | null
          cache_expires_at: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          cuisine_types: string[]
          data_freshness: string | null
          description: string | null
          details: Json | null
          dietary_options: string[] | null
          email: string | null
          external_id: string | null
          google_place_id: string | null
          hours_of_operation: Json
          id: string
          images: Json | null
          is_active: boolean
          is_open_now: boolean | null
          is_verified: boolean
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          postal_code: string | null
          price_level: number
          primary_image_url: string | null
          rating: number | null
          rating_count: number | null
          source: string
          state: string | null
          subcategory: string | null
          tags: string[] | null
          updated_at: string
          website: string | null
          yelp_id: string | null
        }
        Insert: {
          address?: string | null
          ambiance?: string[] | null
          cache_expires_at?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          cuisine_types?: string[]
          data_freshness?: string | null
          description?: string | null
          details?: Json | null
          dietary_options?: string[] | null
          email?: string | null
          external_id?: string | null
          google_place_id?: string | null
          hours_of_operation?: Json
          id?: string
          images?: Json | null
          is_active?: boolean
          is_open_now?: boolean | null
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          postal_code?: string | null
          price_level: number
          primary_image_url?: string | null
          rating?: number | null
          rating_count?: number | null
          source?: string
          state?: string | null
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string
          website?: string | null
          yelp_id?: string | null
        }
        Update: {
          address?: string | null
          ambiance?: string[] | null
          cache_expires_at?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          cuisine_types?: string[]
          data_freshness?: string | null
          description?: string | null
          details?: Json | null
          dietary_options?: string[] | null
          email?: string | null
          external_id?: string | null
          google_place_id?: string | null
          hours_of_operation?: Json
          id?: string
          images?: Json | null
          is_active?: boolean
          is_open_now?: boolean | null
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          price_level?: number
          primary_image_url?: string | null
          rating?: number | null
          rating_count?: number | null
          source?: string
          state?: string | null
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string
          website?: string | null
          yelp_id?: string | null
        }
        Relationships: []
      }
      saved_places: {
        Row: {
          collection_id: string | null
          id: string
          is_favorite: boolean | null
          last_viewed_at: string | null
          location_id: string
          location_type: string
          notes: string | null
          priority: number | null
          saved_at: string
          tags: string[] | null
          trip_id: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          collection_id?: string | null
          id?: string
          is_favorite?: boolean | null
          last_viewed_at?: string | null
          location_id: string
          location_type: string
          notes?: string | null
          priority?: number | null
          saved_at?: string
          tags?: string[] | null
          trip_id?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          collection_id?: string | null
          id?: string
          is_favorite?: boolean | null
          last_viewed_at?: string | null
          location_id?: string
          location_type?: string
          notes?: string | null
          priority?: number | null
          saved_at?: string
          tags?: string[] | null
          trip_id?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_places_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_places_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_places_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      showings: {
        Row: {
          apartment_id: string
          created_at: string
          host_notes: string | null
          id: string
          lead_id: string
          metadata: Json
          renter_notes: string | null
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          apartment_id: string
          created_at?: string
          host_notes?: string | null
          id?: string
          lead_id: string
          metadata?: Json
          renter_notes?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          apartment_id?: string
          created_at?: string
          host_notes?: string | null
          id?: string
          lead_id?: string
          metadata?: Json
          renter_notes?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "showings_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "showings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      tourist_destinations: {
        Row: {
          accessibility_features: string[] | null
          address: string | null
          age_max: number | null
          age_min: number | null
          audio_guide_available: boolean | null
          audio_guide_languages: string[] | null
          best_for: string[] | null
          best_time_to_visit: string | null
          booking_required: boolean | null
          booking_url: string | null
          cache_expires_at: string | null
          cancellation_policy: string | null
          category: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          crowd_level: string | null
          currency: string | null
          data_freshness: string | null
          departure_times: string[] | null
          description: string | null
          details: Json | null
          difficulty_level: string | null
          email: string | null
          entry_fee: string | null
          entry_fee_amount: number | null
          estimated_visit_duration: string | null
          external_id: string | null
          facebook_url: string | null
          family_friendly: boolean | null
          google_place_id: string | null
          group_size_max: number | null
          group_size_min: number | null
          guided_tour_available: boolean | null
          id: string
          images: Json | null
          instagram_handle: string | null
          is_active: boolean
          is_open_now: boolean | null
          is_verified: boolean
          languages_available: string[] | null
          latitude: number | null
          longitude: number | null
          name: string
          nearby_attractions: string[] | null
          opening_hours: Json | null
          parking_available: boolean | null
          parking_fee: number | null
          peak_season: string | null
          pet_friendly: boolean | null
          phone: string | null
          physical_requirements: string | null
          pickup_location: string | null
          pickup_location_lat: number | null
          pickup_location_lng: number | null
          postal_code: string | null
          primary_image_url: string | null
          public_transport_access: string | null
          rating: number | null
          rating_count: number | null
          related_destinations: string[] | null
          seasonal_availability: string | null
          seasonal_end: string | null
          seasonal_start: string | null
          self_guided: boolean | null
          source: string
          state: string | null
          stroller_accessible: boolean | null
          subcategory: string | null
          tags: string[] | null
          tour_duration_hours: number | null
          tour_duration_text: string | null
          tour_exclusions: string[] | null
          tour_inclusions: string[] | null
          tour_operator: string | null
          tour_operator_website: string | null
          tripadvisor_id: string | null
          tripadvisor_url: string | null
          twitter_handle: string | null
          updated_at: string
          video_url: string | null
          virtual_tour_url: string | null
          weather_dependent: boolean | null
          website: string | null
          what_to_bring: string[] | null
          wheelchair_accessible: boolean | null
          youtube_url: string | null
        }
        Insert: {
          accessibility_features?: string[] | null
          address?: string | null
          age_max?: number | null
          age_min?: number | null
          audio_guide_available?: boolean | null
          audio_guide_languages?: string[] | null
          best_for?: string[] | null
          best_time_to_visit?: string | null
          booking_required?: boolean | null
          booking_url?: string | null
          cache_expires_at?: string | null
          cancellation_policy?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          crowd_level?: string | null
          currency?: string | null
          data_freshness?: string | null
          departure_times?: string[] | null
          description?: string | null
          details?: Json | null
          difficulty_level?: string | null
          email?: string | null
          entry_fee?: string | null
          entry_fee_amount?: number | null
          estimated_visit_duration?: string | null
          external_id?: string | null
          facebook_url?: string | null
          family_friendly?: boolean | null
          google_place_id?: string | null
          group_size_max?: number | null
          group_size_min?: number | null
          guided_tour_available?: boolean | null
          id?: string
          images?: Json | null
          instagram_handle?: string | null
          is_active?: boolean
          is_open_now?: boolean | null
          is_verified?: boolean
          languages_available?: string[] | null
          latitude?: number | null
          longitude?: number | null
          name: string
          nearby_attractions?: string[] | null
          opening_hours?: Json | null
          parking_available?: boolean | null
          parking_fee?: number | null
          peak_season?: string | null
          pet_friendly?: boolean | null
          phone?: string | null
          physical_requirements?: string | null
          pickup_location?: string | null
          pickup_location_lat?: number | null
          pickup_location_lng?: number | null
          postal_code?: string | null
          primary_image_url?: string | null
          public_transport_access?: string | null
          rating?: number | null
          rating_count?: number | null
          related_destinations?: string[] | null
          seasonal_availability?: string | null
          seasonal_end?: string | null
          seasonal_start?: string | null
          self_guided?: boolean | null
          source?: string
          state?: string | null
          stroller_accessible?: boolean | null
          subcategory?: string | null
          tags?: string[] | null
          tour_duration_hours?: number | null
          tour_duration_text?: string | null
          tour_exclusions?: string[] | null
          tour_inclusions?: string[] | null
          tour_operator?: string | null
          tour_operator_website?: string | null
          tripadvisor_id?: string | null
          tripadvisor_url?: string | null
          twitter_handle?: string | null
          updated_at?: string
          video_url?: string | null
          virtual_tour_url?: string | null
          weather_dependent?: boolean | null
          website?: string | null
          what_to_bring?: string[] | null
          wheelchair_accessible?: boolean | null
          youtube_url?: string | null
        }
        Update: {
          accessibility_features?: string[] | null
          address?: string | null
          age_max?: number | null
          age_min?: number | null
          audio_guide_available?: boolean | null
          audio_guide_languages?: string[] | null
          best_for?: string[] | null
          best_time_to_visit?: string | null
          booking_required?: boolean | null
          booking_url?: string | null
          cache_expires_at?: string | null
          cancellation_policy?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          crowd_level?: string | null
          currency?: string | null
          data_freshness?: string | null
          departure_times?: string[] | null
          description?: string | null
          details?: Json | null
          difficulty_level?: string | null
          email?: string | null
          entry_fee?: string | null
          entry_fee_amount?: number | null
          estimated_visit_duration?: string | null
          external_id?: string | null
          facebook_url?: string | null
          family_friendly?: boolean | null
          google_place_id?: string | null
          group_size_max?: number | null
          group_size_min?: number | null
          guided_tour_available?: boolean | null
          id?: string
          images?: Json | null
          instagram_handle?: string | null
          is_active?: boolean
          is_open_now?: boolean | null
          is_verified?: boolean
          languages_available?: string[] | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          nearby_attractions?: string[] | null
          opening_hours?: Json | null
          parking_available?: boolean | null
          parking_fee?: number | null
          peak_season?: string | null
          pet_friendly?: boolean | null
          phone?: string | null
          physical_requirements?: string | null
          pickup_location?: string | null
          pickup_location_lat?: number | null
          pickup_location_lng?: number | null
          postal_code?: string | null
          primary_image_url?: string | null
          public_transport_access?: string | null
          rating?: number | null
          rating_count?: number | null
          related_destinations?: string[] | null
          seasonal_availability?: string | null
          seasonal_end?: string | null
          seasonal_start?: string | null
          self_guided?: boolean | null
          source?: string
          state?: string | null
          stroller_accessible?: boolean | null
          subcategory?: string | null
          tags?: string[] | null
          tour_duration_hours?: number | null
          tour_duration_text?: string | null
          tour_exclusions?: string[] | null
          tour_inclusions?: string[] | null
          tour_operator?: string | null
          tour_operator_website?: string | null
          tripadvisor_id?: string | null
          tripadvisor_url?: string | null
          twitter_handle?: string | null
          updated_at?: string
          video_url?: string | null
          virtual_tour_url?: string | null
          weather_dependent?: boolean | null
          website?: string | null
          what_to_bring?: string[] | null
          wheelchair_accessible?: boolean | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      trip_items: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_at: string | null
          id: string
          item_type: string
          latitude: number | null
          location_name: string | null
          longitude: number | null
          metadata: Json | null
          source_id: string
          start_at: string | null
          title: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          item_type: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          metadata?: Json | null
          source_id: string
          start_at?: string | null
          title: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          item_type?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          metadata?: Json | null
          source_id?: string
          start_at?: string | null
          title?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          budget: number | null
          created_at: string
          currency: string | null
          deleted_at: string | null
          description: string | null
          destination: string | null
          end_date: string
          id: string
          start_date: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          description?: string | null
          destination?: string | null
          end_date: string
          id?: string
          start_date: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          description?: string | null
          destination?: string | null
          end_date?: string
          id?: string
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          adventure_level: string | null
          ai_proactivity_level: string | null
          ai_suggestion_frequency: string | null
          ambiance_preferences: string[] | null
          created_at: string
          default_budget_per_day: number | null
          default_currency: string | null
          dietary_restrictions: string[] | null
          event_categories: string[] | null
          event_price_range: string | null
          favorite_cuisines: string[] | null
          id: string
          notification_preferences: Json | null
          preferred_event_times: string[] | null
          price_range_preference: string | null
          rental_features: string[] | null
          travel_style: string[] | null
          updated_at: string
          user_id: string
          vehicle_types: string[] | null
        }
        Insert: {
          adventure_level?: string | null
          ai_proactivity_level?: string | null
          ai_suggestion_frequency?: string | null
          ambiance_preferences?: string[] | null
          created_at?: string
          default_budget_per_day?: number | null
          default_currency?: string | null
          dietary_restrictions?: string[] | null
          event_categories?: string[] | null
          event_price_range?: string | null
          favorite_cuisines?: string[] | null
          id?: string
          notification_preferences?: Json | null
          preferred_event_times?: string[] | null
          price_range_preference?: string | null
          rental_features?: string[] | null
          travel_style?: string[] | null
          updated_at?: string
          user_id: string
          vehicle_types?: string[] | null
        }
        Update: {
          adventure_level?: string | null
          ai_proactivity_level?: string | null
          ai_suggestion_frequency?: string | null
          ambiance_preferences?: string[] | null
          created_at?: string
          default_budget_per_day?: number | null
          default_currency?: string | null
          dietary_restrictions?: string[] | null
          event_categories?: string[] | null
          event_price_range?: string | null
          favorite_cuisines?: string[] | null
          id?: string
          notification_preferences?: Json | null
          preferred_event_times?: string[] | null
          price_range_preference?: string | null
          rental_features?: string[] | null
          travel_style?: string[] | null
          updated_at?: string
          user_id?: string
          vehicle_types?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          message_count: number
          phone_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          message_count?: number
          phone_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          message_count?: number
          phone_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          content: string
          created_at: string
          direction: string
          external_id: string | null
          id: string
          message_type: string | null
          phone_number: string
          raw_payload: Json | null
          sender: string
          status: string | null
          to_number: string | null
        }
        Insert: {
          content: string
          created_at?: string
          direction: string
          external_id?: string | null
          id?: string
          message_type?: string | null
          phone_number: string
          raw_payload?: Json | null
          sender: string
          status?: string | null
          to_number?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          direction?: string
          external_id?: string | null
          id?: string
          message_type?: string | null
          phone_number?: string
          raw_payload?: Json | null
          sender?: string
          status?: string | null
          to_number?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      apartment_save_counts: {
        Args: { apartment_ids: string[] }
        Returns: {
          apartment_id: string
          save_count: number
        }[]
      }
      calculate_distance: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      check_rate_limit: {
        Args: { p_key: string; p_max: number; p_window_seconds: number }
        Returns: Json
      }
      claim_agent_job: {
        Args: { p_job_types?: string[]; p_worker_id: string }
        Returns: string
      }
      cleanup_expired_agent_jobs: { Args: never; Returns: number }
      complete_agent_job: {
        Args: { p_job_id: string; p_result: Json }
        Returns: boolean
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      fail_agent_job: {
        Args: { p_error: string; p_job_id: string }
        Returns: boolean
      }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      gettransactionid: { Args: never; Returns: unknown }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_moderator: { Args: never; Returns: boolean }
      log_outbound_click: {
        Args: {
          p_affiliate_tag?: string
          p_listing_id: string
          p_source_url: string
          p_surface?: string
        }
        Returns: string
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      p1_schedule_tour_atomic: {
        Args: {
          p_apartment_id: string
          p_email: string
          p_idempotency_key: string
          p_lead_metadata: Json
          p_neighborhood_id: string
          p_notes: string
          p_phone: string
          p_renter_notes: string
          p_scheduled_at: string
          p_showing_metadata: Json
          p_source: string
          p_user_id: string
        }
        Returns: Json
      }
      p1_start_rental_application_atomic: {
        Args: {
          p_apartment_id: string
          p_application_metadata: Json
          p_idempotency_key: string
          p_lead_metadata: Json
          p_neighborhood_id: string
          p_notes: string
          p_source: string
          p_user_id: string
        }
        Returns: Json
      }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      release_stale_agent_job_locks: {
        Args: { p_stale_threshold?: string }
        Returns: number
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      update_agent_job_progress: {
        Args: { p_current_step?: string; p_job_id: string; p_progress: number }
        Returns: boolean
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      agent_type:
        | "local_scout"
        | "dining_orchestrator"
        | "event_curator"
        | "itinerary_optimizer"
        | "budget_guardian"
        | "booking_assistant"
        | "general_concierge"
      ai_run_status:
        | "pending"
        | "running"
        | "success"
        | "error"
        | "timeout"
        | "cancelled"
      booking_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      booking_type: "apartment" | "car" | "restaurant" | "event" | "tour"
      conflict_type:
        | "time_overlap"
        | "budget_exceeded"
        | "location_distance"
        | "booking_unavailable"
        | "preference_mismatch"
        | "weather_issue"
        | "capacity_issue"
      conversation_status: "active" | "archived" | "completed" | "abandoned"
      message_role: "user" | "assistant" | "system" | "function"
      payment_status: "pending" | "paid" | "refunded" | "failed"
      resolution_status:
        | "detected"
        | "pending_review"
        | "auto_resolved"
        | "user_resolved"
        | "ignored"
      user_role: "user" | "moderator" | "admin" | "super_admin"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
      agent_type: [
        "local_scout",
        "dining_orchestrator",
        "event_curator",
        "itinerary_optimizer",
        "budget_guardian",
        "booking_assistant",
        "general_concierge",
      ],
      ai_run_status: [
        "pending",
        "running",
        "success",
        "error",
        "timeout",
        "cancelled",
      ],
      booking_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      booking_type: ["apartment", "car", "restaurant", "event", "tour"],
      conflict_type: [
        "time_overlap",
        "budget_exceeded",
        "location_distance",
        "booking_unavailable",
        "preference_mismatch",
        "weather_issue",
        "capacity_issue",
      ],
      conversation_status: ["active", "archived", "completed", "abandoned"],
      message_role: ["user", "assistant", "system", "function"],
      payment_status: ["pending", "paid", "refunded", "failed"],
      resolution_status: [
        "detected",
        "pending_review",
        "auto_resolved",
        "user_resolved",
        "ignored",
      ],
      user_role: ["user", "moderator", "admin", "super_admin"],
    },
  },
} as const
