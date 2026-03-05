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
      activity_log: {
        Row: {
          client_id: string | null
          created_at: string | null
          event_type: string | null
          id: string
          metadata: Json | null
          trainer_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          event_type?: string | null
          id?: string
          metadata?: Json | null
          trainer_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          event_type?: string | null
          id?: string
          metadata?: Json | null
          trainer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_templates: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          location: string | null
          max_advance_days: number | null
          max_capacity: number | null
          min_advance_hours: number | null
          name: string
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes: number
          id?: string
          is_active?: boolean | null
          location?: string | null
          max_advance_days?: number | null
          max_capacity?: number | null
          min_advance_hours?: number | null
          name: string
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          location?: string | null
          max_advance_days?: number | null
          max_capacity?: number | null
          min_advance_hours?: number | null
          name?: string
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_type: string | null
          client_id: string | null
          created_at: string | null
          duration_minutes: number | null
          end_time: string
          id: string
          location: string | null
          location_type: string | null
          notes: string | null
          package_purchase_id: string | null
          payment_method: string | null
          price: number | null
          repeat_group_id: string | null
          start_time: string
          status: string | null
          template_id: string | null
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          appointment_type?: string | null
          client_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          end_time: string
          id?: string
          location?: string | null
          location_type?: string | null
          notes?: string | null
          package_purchase_id?: string | null
          payment_method?: string | null
          price?: number | null
          repeat_group_id?: string | null
          start_time: string
          status?: string | null
          template_id?: string | null
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_type?: string | null
          client_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          end_time?: string
          id?: string
          location?: string | null
          location_type?: string | null
          notes?: string | null
          package_purchase_id?: string | null
          payment_method?: string | null
          price?: number | null
          repeat_group_id?: string | null
          start_time?: string
          status?: string | null
          template_id?: string | null
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "appointment_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      body_measurements: {
        Row: {
          created_at: string | null
          id: string
          measurement_type: string
          recorded_at: string | null
          unit: string
          updated_at: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          measurement_type: string
          recorded_at?: string | null
          unit?: string
          updated_at?: string | null
          user_id: string
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          measurement_type?: string
          recorded_at?: string | null
          unit?: string
          updated_at?: string | null
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      bodyweight_entries: {
        Row: {
          created_at: string | null
          id: string
          recorded_at: string | null
          unit: string | null
          updated_at: string | null
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          recorded_at?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string | null
          id?: string
          recorded_at?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      calendar_tokens: {
        Row: {
          created_at: string | null
          id: string
          last_accessed_at: string | null
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_bookings: {
        Row: {
          booking_date: string | null
          booking_status: string | null
          challenge_schedule_id: string
          client_id: string
          created_at: string | null
          id: string
          notes: string | null
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          booking_date?: string | null
          booking_status?: string | null
          challenge_schedule_id: string
          client_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          booking_date?: string | null
          booking_status?: string | null
          challenge_schedule_id?: string
          client_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_bookings_challenge_schedule_id_fkey"
            columns: ["challenge_schedule_id"]
            isOneToOne: false
            referencedRelation: "challenge_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_results: {
        Row: {
          challenge_booking_id: string
          challenge_id: string
          client_id: string
          created_at: string | null
          id: string
          primary_result_value: number | null
          recorded_at: string | null
          result_data: Json
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          challenge_booking_id: string
          challenge_id: string
          client_id: string
          created_at?: string | null
          id?: string
          primary_result_value?: number | null
          recorded_at?: string | null
          result_data?: Json
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          challenge_booking_id?: string
          challenge_id?: string
          client_id?: string
          created_at?: string | null
          id?: string
          primary_result_value?: number | null
          recorded_at?: string | null
          result_data?: Json
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_results_challenge_booking_id_fkey"
            columns: ["challenge_booking_id"]
            isOneToOne: false
            referencedRelation: "challenge_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_results_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_schedules: {
        Row: {
          challenge_id: string
          created_at: string | null
          current_bookings: number | null
          end_time: string
          id: string
          location: string | null
          max_capacity: number
          notes: string | null
          scheduled_date: string
          start_time: string
          status: string | null
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          challenge_id: string
          created_at?: string | null
          current_bookings?: number | null
          end_time: string
          id?: string
          location?: string | null
          max_capacity: number
          notes?: string | null
          scheduled_date: string
          start_time: string
          status?: string | null
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          challenge_id?: string
          created_at?: string | null
          current_bookings?: number | null
          end_time?: string
          id?: string
          location?: string | null
          max_capacity?: number
          notes?: string | null
          scheduled_date?: string
          start_time?: string
          status?: string | null
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_schedules_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          expiration_days: number | null
          icon: string | null
          id: string
          instructions: string | null
          is_active: boolean | null
          location: string | null
          max_capacity: number | null
          name: string
          result_fields: Json | null
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          expiration_days?: number | null
          icon?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          location?: string | null
          max_capacity?: number | null
          name: string
          result_fields?: Json | null
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          expiration_days?: number | null
          icon?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          location?: string | null
          max_capacity?: number | null
          name?: string
          result_fields?: Json | null
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_media: {
        Row: {
          created_at: string | null
          downloaded_by_client: boolean | null
          downloaded_by_trainer: boolean | null
          expires_at: string | null
          file_path: string
          file_size: number | null
          id: string
          message_id: string | null
          mime_type: string | null
        }
        Insert: {
          created_at?: string | null
          downloaded_by_client?: boolean | null
          downloaded_by_trainer?: boolean | null
          expires_at?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          message_id?: string | null
          mime_type?: string | null
        }
        Update: {
          created_at?: string | null
          downloaded_by_client?: boolean | null
          downloaded_by_trainer?: boolean | null
          expires_at?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          message_id?: string | null
          mime_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_media_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      class_bookings: {
        Row: {
          amount_paid: number | null
          booking_date: string | null
          booking_status: string | null
          checked_in_at: string | null
          class_schedule_id: string
          client_id: string
          created_at: string | null
          id: string
          notes: string | null
          payment_status: string | null
          trainer_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          booking_date?: string | null
          booking_status?: string | null
          checked_in_at?: string | null
          class_schedule_id: string
          client_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          trainer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          booking_date?: string | null
          booking_status?: string | null
          checked_in_at?: string | null
          class_schedule_id?: string
          client_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          trainer_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_bookings_class_schedule_id_fkey"
            columns: ["class_schedule_id"]
            isOneToOne: false
            referencedRelation: "class_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_class_bookings_client_profile"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_schedules: {
        Row: {
          class_id: string
          created_at: string | null
          current_bookings: number | null
          end_time: string
          id: string
          location: string | null
          location_type: string
          max_capacity: number
          notes: string | null
          repeat_group_id: string | null
          scheduled_date: string
          start_time: string
          status: string | null
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          current_bookings?: number | null
          end_time: string
          id?: string
          location?: string | null
          location_type?: string
          max_capacity: number
          notes?: string | null
          repeat_group_id?: string | null
          scheduled_date: string
          start_time: string
          status?: string | null
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          current_bookings?: number | null
          end_time?: string
          id?: string
          location?: string | null
          location_type?: string
          max_capacity?: number
          notes?: string | null
          repeat_group_id?: string | null
          scheduled_date?: string
          start_time?: string
          status?: string | null
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          duration_minutes: number
          equipment_needed: string[] | null
          id: string
          image_settings: Json | null
          image_url: string | null
          is_active: boolean | null
          location: string | null
          location_type: string
          max_capacity: number
          name: string
          price: number | null
          recurring_pattern: Json | null
          skill_level: string | null
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number
          equipment_needed?: string[] | null
          id?: string
          image_settings?: Json | null
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          location_type?: string
          max_capacity?: number
          name: string
          price?: number | null
          recurring_pattern?: Json | null
          skill_level?: string | null
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number
          equipment_needed?: string[] | null
          id?: string
          image_settings?: Json | null
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          location_type?: string
          max_capacity?: number
          name?: string
          price?: number | null
          recurring_pattern?: Json | null
          skill_level?: string | null
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      client_app_settings: {
        Row: {
          created_at: string | null
          id: string
          notification_bar_bg_color: string | null
          notification_bar_color: string | null
          notification_bar_content_alignment: string | null
          notification_bar_enabled: boolean | null
          notification_bar_foreground_image: string | null
          notification_bar_foreground_image_position_x: number | null
          notification_bar_foreground_image_position_y: number | null
          notification_bar_foreground_image_rotation: number | null
          notification_bar_foreground_image_scale: number | null
          notification_bar_foreground_overlay_alpha: number | null
          notification_bar_foreground_overlay_color: string | null
          notification_bar_gradient_overlay: boolean | null
          notification_bar_image: string | null
          notification_bar_image_position_x: number | null
          notification_bar_image_position_y: number | null
          notification_bar_image_rotation: number | null
          notification_bar_image_scale: number | null
          notification_bar_label: string | null
          notification_bar_label_position: string | null
          notification_bar_link_screen: string | null
          notification_bar_link_type: string | null
          notification_bar_link_url: string | null
          notification_bar_overlay_alpha: number | null
          notification_bar_size: string | null
          notification_bar_text: string | null
          notification_bar_text_bg_alpha: number | null
          notification_bar_text_bg_blend: boolean | null
          notification_bar_text_bg_color: string | null
          notification_bar_text_bg_position: string | null
          notification_bar_text_color: string | null
          notification_bar_title: string | null
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_bar_bg_color?: string | null
          notification_bar_color?: string | null
          notification_bar_content_alignment?: string | null
          notification_bar_enabled?: boolean | null
          notification_bar_foreground_image?: string | null
          notification_bar_foreground_image_position_x?: number | null
          notification_bar_foreground_image_position_y?: number | null
          notification_bar_foreground_image_rotation?: number | null
          notification_bar_foreground_image_scale?: number | null
          notification_bar_foreground_overlay_alpha?: number | null
          notification_bar_foreground_overlay_color?: string | null
          notification_bar_gradient_overlay?: boolean | null
          notification_bar_image?: string | null
          notification_bar_image_position_x?: number | null
          notification_bar_image_position_y?: number | null
          notification_bar_image_rotation?: number | null
          notification_bar_image_scale?: number | null
          notification_bar_label?: string | null
          notification_bar_label_position?: string | null
          notification_bar_link_screen?: string | null
          notification_bar_link_type?: string | null
          notification_bar_link_url?: string | null
          notification_bar_overlay_alpha?: number | null
          notification_bar_size?: string | null
          notification_bar_text?: string | null
          notification_bar_text_bg_alpha?: number | null
          notification_bar_text_bg_blend?: boolean | null
          notification_bar_text_bg_color?: string | null
          notification_bar_text_bg_position?: string | null
          notification_bar_text_color?: string | null
          notification_bar_title?: string | null
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_bar_bg_color?: string | null
          notification_bar_color?: string | null
          notification_bar_content_alignment?: string | null
          notification_bar_enabled?: boolean | null
          notification_bar_foreground_image?: string | null
          notification_bar_foreground_image_position_x?: number | null
          notification_bar_foreground_image_position_y?: number | null
          notification_bar_foreground_image_rotation?: number | null
          notification_bar_foreground_image_scale?: number | null
          notification_bar_foreground_overlay_alpha?: number | null
          notification_bar_foreground_overlay_color?: string | null
          notification_bar_gradient_overlay?: boolean | null
          notification_bar_image?: string | null
          notification_bar_image_position_x?: number | null
          notification_bar_image_position_y?: number | null
          notification_bar_image_rotation?: number | null
          notification_bar_image_scale?: number | null
          notification_bar_label?: string | null
          notification_bar_label_position?: string | null
          notification_bar_link_screen?: string | null
          notification_bar_link_type?: string | null
          notification_bar_link_url?: string | null
          notification_bar_overlay_alpha?: number | null
          notification_bar_size?: string | null
          notification_bar_text?: string | null
          notification_bar_text_bg_alpha?: number | null
          notification_bar_text_bg_blend?: boolean | null
          notification_bar_text_bg_color?: string | null
          notification_bar_text_bg_position?: string | null
          notification_bar_text_color?: string | null
          notification_bar_title?: string | null
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      client_meal_plans: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assigned_date: string | null
          client_id: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          meal_plan_id: string | null
          notes: string | null
          start_date: string | null
          status: string | null
          trainer_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_date?: string | null
          client_id?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          meal_plan_id?: string | null
          notes?: string | null
          start_date?: string | null
          status?: string | null
          trainer_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_date?: string | null
          client_id?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          meal_plan_id?: string | null
          notes?: string | null
          start_date?: string | null
          status?: string | null
          trainer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_meal_plans_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      client_memberships: {
        Row: {
          class_credits_remaining: number | null
          classes_used_this_month: number | null
          classes_used_this_week: number | null
          client_id: string
          created_at: string | null
          current_period_start_date: string | null
          end_date: string | null
          id: string
          last_billing_date: string | null
          membership_plan_id: string
          month_start_date: string | null
          next_billing_date: string | null
          pause_date: string | null
          personal_training_credits_remaining: number | null
          resume_date: string | null
          start_date: string
          status: string | null
          trainer_id: string
          updated_at: string | null
          week_start_date: string | null
        }
        Insert: {
          class_credits_remaining?: number | null
          classes_used_this_month?: number | null
          classes_used_this_week?: number | null
          client_id: string
          created_at?: string | null
          current_period_start_date?: string | null
          end_date?: string | null
          id?: string
          last_billing_date?: string | null
          membership_plan_id: string
          month_start_date?: string | null
          next_billing_date?: string | null
          pause_date?: string | null
          personal_training_credits_remaining?: number | null
          resume_date?: string | null
          start_date: string
          status?: string | null
          trainer_id: string
          updated_at?: string | null
          week_start_date?: string | null
        }
        Update: {
          class_credits_remaining?: number | null
          classes_used_this_month?: number | null
          classes_used_this_week?: number | null
          client_id?: string
          created_at?: string | null
          current_period_start_date?: string | null
          end_date?: string | null
          id?: string
          last_billing_date?: string | null
          membership_plan_id?: string
          month_start_date?: string | null
          next_billing_date?: string | null
          pause_date?: string | null
          personal_training_credits_remaining?: number | null
          resume_date?: string | null
          start_date?: string
          status?: string | null
          trainer_id?: string
          updated_at?: string | null
          week_start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_memberships_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_memberships_membership_plan_id_fkey"
            columns: ["membership_plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_memberships_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_nutrition_goals: {
        Row: {
          client_id: string
          created_at: string | null
          daily_calories: number | null
          daily_carbs_g: number | null
          daily_fat_g: number | null
          daily_protein_g: number | null
          daily_water_ml: number | null
          id: string
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          daily_calories?: number | null
          daily_carbs_g?: number | null
          daily_fat_g?: number | null
          daily_protein_g?: number | null
          daily_water_ml?: number | null
          id?: string
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          daily_calories?: number | null
          daily_carbs_g?: number | null
          daily_fat_g?: number | null
          daily_protein_g?: number | null
          daily_water_ml?: number | null
          id?: string
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      client_package_purchases: {
        Row: {
          amount_paid: number
          client_id: string
          created_at: string | null
          expiry_date: string | null
          id: string
          package_id: string
          purchase_date: string | null
          sessions_remaining: number
          sessions_total: number
          status: string | null
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          amount_paid: number
          client_id: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          package_id: string
          purchase_date?: string | null
          sessions_remaining: number
          sessions_total: number
          status?: string | null
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number
          client_id?: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          package_id?: string
          purchase_date?: string | null
          sessions_remaining?: number
          sessions_total?: number
          status?: string | null
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_package_purchases_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "session_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      client_packages: {
        Row: {
          client_id: string | null
          created_at: string | null
          expiry_date: string | null
          id: string
          package_id: string | null
          purchase_date: string
          sessions_remaining: number | null
          sessions_total: number
          sessions_used: number | null
          status: string
          trainer_id: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          package_id?: string | null
          purchase_date?: string
          sessions_remaining?: number | null
          sessions_total: number
          sessions_used?: number | null
          status?: string
          trainer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          package_id?: string | null
          purchase_date?: string
          sessions_remaining?: number | null
          sessions_total?: number
          sessions_used?: number | null
          status?: string
          trainer_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "training_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      client_payments: {
        Row: {
          amount: number
          appointment_id: string | null
          class_booking_id: string | null
          client_id: string
          created_at: string | null
          currency: string | null
          description: string
          due_date: string | null
          event_booking_id: string | null
          external_reference: string | null
          id: string
          metadata: Json | null
          notes: string | null
          package_purchase_id: string | null
          payment_date: string | null
          payment_method: string | null
          payment_type: string
          status: string
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          class_booking_id?: string | null
          client_id: string
          created_at?: string | null
          currency?: string | null
          description: string
          due_date?: string | null
          event_booking_id?: string | null
          external_reference?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          package_purchase_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_type: string
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          class_booking_id?: string | null
          client_id?: string
          created_at?: string | null
          currency?: string | null
          description?: string
          due_date?: string | null
          event_booking_id?: string | null
          external_reference?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          package_purchase_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_type?: string
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_payments_class_booking_id_fkey"
            columns: ["class_booking_id"]
            isOneToOne: false
            referencedRelation: "class_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_payments_event_booking_id_fkey"
            columns: ["event_booking_id"]
            isOneToOne: false
            referencedRelation: "event_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_payments_package_purchase_id_fkey"
            columns: ["package_purchase_id"]
            isOneToOne: false
            referencedRelation: "client_package_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      client_programs: {
        Row: {
          assigned_at: string | null
          client_id: string
          created_at: string | null
          end_date: string | null
          id: string
          notes: string | null
          program_id: string
          start_date: string | null
          status: string | null
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          client_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          program_id: string
          start_date?: string | null
          status?: string | null
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          client_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          program_id?: string
          start_date?: string | null
          status?: string | null
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      client_push_tokens: {
        Row: {
          client_id: string
          created_at: string | null
          device_type: string | null
          id: string
          is_active: boolean | null
          push_token: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          push_token: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          push_token?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      client_workouts: {
        Row: {
          assigned_at: string | null
          client_id: string
          workout_id: string
        }
        Insert: {
          assigned_at?: string | null
          client_id: string
          workout_id: string
        }
        Update: {
          assigned_at?: string | null
          client_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_workouts_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          last_message_at: string | null
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          appointment_id: string | null
          balance_after: number
          class_schedule_id: string | null
          client_membership_id: string | null
          created_at: string | null
          created_by: string | null
          credit_type: string
          id: string
          notes: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          balance_after: number
          class_schedule_id?: string | null
          client_membership_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_type: string
          id?: string
          notes?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          balance_after?: number
          class_schedule_id?: string | null
          client_membership_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_type?: string
          id?: string
          notes?: string | null
          transaction_type?: string
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          client_id: string | null
          created_at: string | null
          email_type: string
          error_message: string | null
          external_message_id: string | null
          from_email: string
          from_name: string | null
          html_content: string
          id: string
          metadata: Json | null
          related_booking_id: string | null
          related_entity_type: string | null
          reply_to_email: string | null
          scheduled_for: string
          sent_at: string | null
          status: string | null
          subject: string
          text_content: string | null
          to_email: string
          to_name: string | null
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          email_type: string
          error_message?: string | null
          external_message_id?: string | null
          from_email: string
          from_name?: string | null
          html_content: string
          id?: string
          metadata?: Json | null
          related_booking_id?: string | null
          related_entity_type?: string | null
          reply_to_email?: string | null
          scheduled_for: string
          sent_at?: string | null
          status?: string | null
          subject: string
          text_content?: string | null
          to_email: string
          to_name?: string | null
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          external_message_id?: string | null
          from_email?: string
          from_name?: string | null
          html_content?: string
          id?: string
          metadata?: Json | null
          related_booking_id?: string | null
          related_entity_type?: string | null
          reply_to_email?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string | null
          subject?: string
          text_content?: string | null
          to_email?: string
          to_name?: string | null
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_reminder_settings: {
        Row: {
          app_appointment_reminders: boolean | null
          app_booking_confirmations: boolean | null
          app_cancellation_notifications: boolean | null
          app_class_reminders: boolean | null
          app_event_reminders: boolean | null
          app_waitlist_notifications: boolean | null
          appointment_reminder_hours: number[] | null
          appointment_reminder_template: string | null
          booking_confirmation_template: string | null
          cancellation_template: string | null
          class_reminder_hours: number[] | null
          class_reminder_template: string | null
          created_at: string | null
          custom_notification_activated_at: string | null
          custom_notification_expires_at: string | null
          custom_notification_message: string | null
          custom_notification_timer_hours: number | null
          custom_notification_timer_type: string | null
          custom_notification_title: string | null
          default_notification_type:
            | Database["public"]["Enums"]["default_notification_type"]
            | null
          email_appointment_reminders: boolean | null
          email_booking_confirmations: boolean | null
          email_cancellation_notifications: boolean | null
          email_class_reminders: boolean | null
          email_event_reminders: boolean | null
          email_waitlist_notifications: boolean | null
          event_reminder_hours: number[] | null
          event_reminder_template: string | null
          from_email: string | null
          from_name: string | null
          id: string
          previous_notification_message: string | null
          previous_notification_title: string | null
          previous_notification_type: string | null
          reply_to_email: string | null
          send_appointment_reminders: boolean | null
          send_booking_confirmations: boolean | null
          send_cancellation_notifications: boolean | null
          send_class_reminders: boolean | null
          send_event_reminders: boolean | null
          send_waitlist_notifications: boolean | null
          trainer_id: string
          updated_at: string | null
          waitlist_promotion_template: string | null
        }
        Insert: {
          app_appointment_reminders?: boolean | null
          app_booking_confirmations?: boolean | null
          app_cancellation_notifications?: boolean | null
          app_class_reminders?: boolean | null
          app_event_reminders?: boolean | null
          app_waitlist_notifications?: boolean | null
          appointment_reminder_hours?: number[] | null
          appointment_reminder_template?: string | null
          booking_confirmation_template?: string | null
          cancellation_template?: string | null
          class_reminder_hours?: number[] | null
          class_reminder_template?: string | null
          created_at?: string | null
          custom_notification_activated_at?: string | null
          custom_notification_expires_at?: string | null
          custom_notification_message?: string | null
          custom_notification_timer_hours?: number | null
          custom_notification_timer_type?: string | null
          custom_notification_title?: string | null
          default_notification_type?:
            | Database["public"]["Enums"]["default_notification_type"]
            | null
          email_appointment_reminders?: boolean | null
          email_booking_confirmations?: boolean | null
          email_cancellation_notifications?: boolean | null
          email_class_reminders?: boolean | null
          email_event_reminders?: boolean | null
          email_waitlist_notifications?: boolean | null
          event_reminder_hours?: number[] | null
          event_reminder_template?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          previous_notification_message?: string | null
          previous_notification_title?: string | null
          previous_notification_type?: string | null
          reply_to_email?: string | null
          send_appointment_reminders?: boolean | null
          send_booking_confirmations?: boolean | null
          send_cancellation_notifications?: boolean | null
          send_class_reminders?: boolean | null
          send_event_reminders?: boolean | null
          send_waitlist_notifications?: boolean | null
          trainer_id: string
          updated_at?: string | null
          waitlist_promotion_template?: string | null
        }
        Update: {
          app_appointment_reminders?: boolean | null
          app_booking_confirmations?: boolean | null
          app_cancellation_notifications?: boolean | null
          app_class_reminders?: boolean | null
          app_event_reminders?: boolean | null
          app_waitlist_notifications?: boolean | null
          appointment_reminder_hours?: number[] | null
          appointment_reminder_template?: string | null
          booking_confirmation_template?: string | null
          cancellation_template?: string | null
          class_reminder_hours?: number[] | null
          class_reminder_template?: string | null
          created_at?: string | null
          custom_notification_activated_at?: string | null
          custom_notification_expires_at?: string | null
          custom_notification_message?: string | null
          custom_notification_timer_hours?: number | null
          custom_notification_timer_type?: string | null
          custom_notification_title?: string | null
          default_notification_type?:
            | Database["public"]["Enums"]["default_notification_type"]
            | null
          email_appointment_reminders?: boolean | null
          email_booking_confirmations?: boolean | null
          email_cancellation_notifications?: boolean | null
          email_class_reminders?: boolean | null
          email_event_reminders?: boolean | null
          email_waitlist_notifications?: boolean | null
          event_reminder_hours?: number[] | null
          event_reminder_template?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          previous_notification_message?: string | null
          previous_notification_title?: string | null
          previous_notification_type?: string | null
          reply_to_email?: string | null
          send_appointment_reminders?: boolean | null
          send_booking_confirmations?: boolean | null
          send_cancellation_notifications?: boolean | null
          send_class_reminders?: boolean | null
          send_event_reminders?: boolean | null
          send_waitlist_notifications?: boolean | null
          trainer_id?: string
          updated_at?: string | null
          waitlist_promotion_template?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          available_variables: Json | null
          created_at: string | null
          description: string | null
          html_template: string
          id: string
          is_active: boolean | null
          is_system_template: boolean | null
          name: string
          subject_template: string
          template_type: string
          text_template: string | null
          trainer_id: string | null
          updated_at: string | null
        }
        Insert: {
          available_variables?: Json | null
          created_at?: string | null
          description?: string | null
          html_template: string
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          name: string
          subject_template: string
          template_type: string
          text_template?: string | null
          trainer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          available_variables?: Json | null
          created_at?: string | null
          description?: string | null
          html_template?: string
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          name?: string
          subject_template?: string
          template_type?: string
          text_template?: string | null
          trainer_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      equipment_types: {
        Row: {
          created_at: string | null
          id: string
          is_global: boolean | null
          name: string
          trainer_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_global?: boolean | null
          name: string
          trainer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_global?: boolean | null
          name?: string
          trainer_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_types_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_bookings: {
        Row: {
          amount_paid: number | null
          booking_date: string | null
          booking_status: string | null
          checked_in_at: string | null
          client_id: string
          created_at: string | null
          event_id: string
          id: string
          notes: string | null
          payment_status: string | null
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          booking_date?: string | null
          booking_status?: string | null
          checked_in_at?: string | null
          client_id: string
          created_at?: string | null
          event_id: string
          id?: string
          notes?: string | null
          payment_status?: string | null
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          booking_date?: string | null
          booking_status?: string | null
          checked_in_at?: string | null
          client_id?: string
          created_at?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          payment_status?: string | null
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_event_bookings_client_profile"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_event_bookings_trainer_profile"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_templates: {
        Row: {
          cancellation_policy: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          equipment_needed: string[] | null
          id: string
          is_active: boolean
          is_multi_day: boolean
          location: string | null
          location_type: string
          max_capacity: number
          name: string
          price: number
          registration_deadline_hours: number | null
          skill_level: string
          total_days: number | null
          trainer_id: string
          updated_at: string
        }
        Insert: {
          cancellation_policy?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          equipment_needed?: string[] | null
          id?: string
          is_active?: boolean
          is_multi_day?: boolean
          location?: string | null
          location_type?: string
          max_capacity?: number
          name: string
          price?: number
          registration_deadline_hours?: number | null
          skill_level?: string
          total_days?: number | null
          trainer_id: string
          updated_at?: string
        }
        Update: {
          cancellation_policy?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          equipment_needed?: string[] | null
          id?: string
          is_active?: boolean
          is_multi_day?: boolean
          location?: string | null
          location_type?: string
          max_capacity?: number
          name?: string
          price?: number
          registration_deadline_hours?: number | null
          skill_level?: string
          total_days?: number | null
          trainer_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          cancellation_policy: string | null
          created_at: string | null
          current_bookings: number | null
          description: string | null
          end_date: string | null
          end_time: string | null
          equipment_needed: string[] | null
          event_type: string
          id: string
          image_url: string | null
          is_active: boolean | null
          location: string | null
          location_type: string
          max_capacity: number | null
          name: string
          price: number | null
          registration_deadline: string | null
          repeat_group_id: string | null
          skill_level: string | null
          start_date: string
          start_time: string
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          cancellation_policy?: string | null
          created_at?: string | null
          current_bookings?: number | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          equipment_needed?: string[] | null
          event_type: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          location_type?: string
          max_capacity?: number | null
          name: string
          price?: number | null
          registration_deadline?: string | null
          repeat_group_id?: string | null
          skill_level?: string | null
          start_date: string
          start_time: string
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          cancellation_policy?: string | null
          created_at?: string | null
          current_bookings?: number | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          equipment_needed?: string[] | null
          event_type?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          location_type?: string
          max_capacity?: number | null
          name?: string
          price?: number | null
          registration_deadline?: string | null
          repeat_group_id?: string | null
          skill_level?: string | null
          start_date?: string
          start_time?: string
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      exercise_category_defaults: {
        Row: {
          category: string
          created_at: string | null
          fields: string[]
          id: string
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          fields: string[]
          id?: string
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          fields?: string[]
          id?: string
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      exercise_logs: {
        Row: {
          created_at: string | null
          duration: number | null
          exercise_id: string
          id: string
          notes: string | null
          reps: number | null
          set_number: number
          updated_at: string | null
          weight: number | null
          workout_log_id: string
        }
        Insert: {
          created_at?: string | null
          duration?: number | null
          exercise_id: string
          id?: string
          notes?: string | null
          reps?: number | null
          set_number: number
          updated_at?: string | null
          weight?: number | null
          workout_log_id: string
        }
        Update: {
          created_at?: string | null
          duration?: number | null
          exercise_id?: string
          id?: string
          notes?: string | null
          reps?: number | null
          set_number?: number
          updated_at?: string | null
          weight?: number | null
          workout_log_id?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          created_at: string | null
          description: string | null
          equipment: string | null
          id: string
          name: string
          trainer_id: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          equipment?: string | null
          id?: string
          name: string
          trainer_id?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          equipment?: string | null
          id?: string
          name?: string
          trainer_id?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      food_entries: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          fat: number
          food_name: string
          id: string
          logged_at: string
          logged_date: string
          meal_type: string
          protein: number
          serving_size: string
          user_id: string
        }
        Insert: {
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          food_name: string
          id?: string
          logged_at?: string
          logged_date: string
          meal_type: string
          protein?: number
          serving_size: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          food_name?: string
          id?: string
          logged_at?: string
          logged_date?: string
          meal_type?: string
          protein?: number
          serving_size?: string
          user_id?: string
        }
        Relationships: []
      }
      foods: {
        Row: {
          calories: number | null
          carbs: number | null
          category: string | null
          created_at: string
          fat: number | null
          id: number
          name: string
          protein: number | null
          serving_size: string | null
          updated_at: string
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          category?: string | null
          created_at?: string
          fat?: number | null
          id?: number
          name: string
          protein?: number | null
          serving_size?: string | null
          updated_at?: string
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          category?: string | null
          created_at?: string
          fat?: number | null
          id?: number
          name?: string
          protein?: number | null
          serving_size?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      form_responses: {
        Row: {
          completed_at: string | null
          created_at: string
          form_id: string
          id: string
          responses: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          form_id: string
          id?: string
          responses?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          form_id?: string
          id?: string
          responses?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          created_at: string
          id: string
          questions: Json
          title: string
          trainer_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          questions?: Json
          title: string
          trainer_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          questions?: Json
          title?: string
          trainer_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      "frontline-trainer-sessions": {
        Row: {
          created_at: string
          equipment: string[] | null
          id: string
          session_data: Json
          session_type: string
          title: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          equipment?: string[] | null
          id?: string
          session_data: Json
          session_type: string
          title: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          equipment?: string[] | null
          id?: string
          session_data?: Json
          session_type?: string
          title?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_conversations: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_conversations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          client_id: string
          group_id: string
          id: string
          joined_at: string | null
        }
        Insert: {
          client_id: string
          group_id: string
          id?: string
          joined_at?: string | null
        }
        Update: {
          client_id?: string
          group_id?: string
          id?: string
          joined_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "group_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "group_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          message_type: string | null
          metadata: Json | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "group_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      habit_completions: {
        Row: {
          client_id: string
          completed_at: string | null
          completion_date: string
          habit_id: string
          id: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          completion_date: string
          habit_id: string
          id?: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          completion_date?: string
          habit_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          client_id: string
          created_at: string | null
          custom_frequency_days: number[] | null
          frequency: string
          id: string
          is_active: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          custom_frequency_days?: number[] | null
          frequency: string
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          custom_frequency_days?: number[] | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      location_options: {
        Row: {
          created_at: string
          default_for_appointments: boolean | null
          default_for_challenges: boolean | null
          default_for_classes: boolean | null
          default_for_events: boolean | null
          id: string
          is_favorite: boolean | null
          location_name: string
          trainer_id: string
        }
        Insert: {
          created_at?: string
          default_for_appointments?: boolean | null
          default_for_challenges?: boolean | null
          default_for_classes?: boolean | null
          default_for_events?: boolean | null
          id?: string
          is_favorite?: boolean | null
          location_name: string
          trainer_id: string
        }
        Update: {
          created_at?: string
          default_for_appointments?: boolean | null
          default_for_challenges?: boolean | null
          default_for_classes?: boolean | null
          default_for_events?: boolean | null
          id?: string
          is_favorite?: boolean | null
          location_name?: string
          trainer_id?: string
        }
        Relationships: []
      }
      location_preferences: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          location_name: string
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_name: string
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_name?: string
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      meal_logs: {
        Row: {
          calories_consumed: number | null
          carbs_consumed: number | null
          client_id: string | null
          fat_consumed: number | null
          id: string
          image_url: string | null
          logged_at: string | null
          logged_date: string
          meal_id: string | null
          notes: string | null
          portion_size: number | null
          protein_consumed: number | null
        }
        Insert: {
          calories_consumed?: number | null
          carbs_consumed?: number | null
          client_id?: string | null
          fat_consumed?: number | null
          id?: string
          image_url?: string | null
          logged_at?: string | null
          logged_date?: string
          meal_id?: string | null
          notes?: string | null
          portion_size?: number | null
          protein_consumed?: number | null
        }
        Update: {
          calories_consumed?: number | null
          carbs_consumed?: number | null
          client_id?: string | null
          fat_consumed?: number | null
          id?: string
          image_url?: string | null
          logged_at?: string | null
          logged_date?: string
          meal_id?: string | null
          notes?: string | null
          portion_size?: number | null
          protein_consumed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_logs_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plan_days: {
        Row: {
          carbs_g: number | null
          created_at: string | null
          day_name: string
          day_number: number
          fat_g: number | null
          id: string
          meal_plan_id: string | null
          protein_g: number | null
          total_calories: number | null
        }
        Insert: {
          carbs_g?: number | null
          created_at?: string | null
          day_name: string
          day_number: number
          fat_g?: number | null
          id?: string
          meal_plan_id?: string | null
          protein_g?: number | null
          total_calories?: number | null
        }
        Update: {
          carbs_g?: number | null
          created_at?: string | null
          day_name?: string
          day_number?: number
          fat_g?: number | null
          id?: string
          meal_plan_id?: string | null
          protein_g?: number | null
          total_calories?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_days_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          carbs_g: number | null
          created_at: string | null
          days_count: number | null
          description: string | null
          fat_g: number | null
          id: string
          is_active: boolean | null
          name: string
          protein_g: number | null
          total_calories: number | null
          trainer_id: string | null
          updated_at: string | null
        }
        Insert: {
          carbs_g?: number | null
          created_at?: string | null
          days_count?: number | null
          description?: string | null
          fat_g?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          protein_g?: number | null
          total_calories?: number | null
          trainer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          carbs_g?: number | null
          created_at?: string | null
          days_count?: number | null
          description?: string | null
          fat_g?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          protein_g?: number | null
          total_calories?: number | null
          trainer_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      meals: {
        Row: {
          calories: number
          carbs_g: number | null
          created_at: string | null
          description: string | null
          fat_g: number | null
          id: string
          image_url: string | null
          ingredients: string | null
          instructions: string | null
          meal_plan_day_id: string | null
          meal_type: string
          name: string
          order_index: number | null
          protein_g: number | null
        }
        Insert: {
          calories?: number
          carbs_g?: number | null
          created_at?: string | null
          description?: string | null
          fat_g?: number | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          instructions?: string | null
          meal_plan_day_id?: string | null
          meal_type: string
          name: string
          order_index?: number | null
          protein_g?: number | null
        }
        Update: {
          calories?: number
          carbs_g?: number | null
          created_at?: string | null
          description?: string | null
          fat_g?: number | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          instructions?: string | null
          meal_plan_day_id?: string | null
          meal_type?: string
          name?: string
          order_index?: number | null
          protein_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meals_meal_plan_day_id_fkey"
            columns: ["meal_plan_day_id"]
            isOneToOne: false
            referencedRelation: "meal_plan_days"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          billing_period: string | null
          class_credits: number | null
          classes_per_month: number | null
          classes_per_week: number | null
          created_at: string | null
          credits_expire_in_days: number | null
          description: string | null
          display_order: number | null
          id: string
          includes_classes: boolean | null
          includes_personal_training: boolean | null
          is_active: boolean | null
          is_highlighted: boolean | null
          max_classes_per_period: number | null
          name: string
          personal_training_credits: number | null
          plan_type: string
          price: number
          trainer_id: string | null
          updated_at: string | null
        }
        Insert: {
          billing_period?: string | null
          class_credits?: number | null
          classes_per_month?: number | null
          classes_per_week?: number | null
          created_at?: string | null
          credits_expire_in_days?: number | null
          description?: string | null
          display_order?: number | null
          id?: string
          includes_classes?: boolean | null
          includes_personal_training?: boolean | null
          is_active?: boolean | null
          is_highlighted?: boolean | null
          max_classes_per_period?: number | null
          name: string
          personal_training_credits?: number | null
          plan_type: string
          price?: number
          trainer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_period?: string | null
          class_credits?: number | null
          classes_per_month?: number | null
          classes_per_week?: number | null
          created_at?: string | null
          credits_expire_in_days?: number | null
          description?: string | null
          display_order?: number | null
          id?: string
          includes_classes?: boolean | null
          includes_personal_training?: boolean | null
          is_active?: boolean | null
          is_highlighted?: boolean | null
          max_classes_per_period?: number | null
          name?: string
          personal_training_credits?: number | null
          plan_type?: string
          price?: number
          trainer_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          message_type: string | null
          metadata: Json | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          read_at?: string | null
          sender_id?: string
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
      notification_bar_slides: {
        Row: {
          bg_color: string | null
          color: string | null
          content_alignment: string | null
          created_at: string | null
          foreground_image: string | null
          foreground_image_opacity: number | null
          foreground_image_position_x: number | null
          foreground_image_position_y: number | null
          foreground_image_rotation: number | null
          foreground_image_scale: number | null
          foreground_overlay_alpha: number | null
          foreground_overlay_color: string | null
          id: string
          image: string | null
          image_position_x: number | null
          image_position_y: number | null
          image_rotation: number | null
          image_scale: number | null
          is_active: boolean
          label: string | null
          label_position: string | null
          link_screen: string | null
          link_type: string | null
          link_url: string | null
          main_text: string | null
          overlay_alpha: number | null
          position: number
          text_bg_alpha: number | null
          text_bg_blend: boolean | null
          text_bg_color: string | null
          text_bg_spread: number | null
          text_color: string | null
          title: string | null
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          bg_color?: string | null
          color?: string | null
          content_alignment?: string | null
          created_at?: string | null
          foreground_image?: string | null
          foreground_image_opacity?: number | null
          foreground_image_position_x?: number | null
          foreground_image_position_y?: number | null
          foreground_image_rotation?: number | null
          foreground_image_scale?: number | null
          foreground_overlay_alpha?: number | null
          foreground_overlay_color?: string | null
          id?: string
          image?: string | null
          image_position_x?: number | null
          image_position_y?: number | null
          image_rotation?: number | null
          image_scale?: number | null
          is_active?: boolean
          label?: string | null
          label_position?: string | null
          link_screen?: string | null
          link_type?: string | null
          link_url?: string | null
          main_text?: string | null
          overlay_alpha?: number | null
          position?: number
          text_bg_alpha?: number | null
          text_bg_blend?: boolean | null
          text_bg_color?: string | null
          text_bg_spread?: number | null
          text_color?: string | null
          title?: string | null
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          bg_color?: string | null
          color?: string | null
          content_alignment?: string | null
          created_at?: string | null
          foreground_image?: string | null
          foreground_image_opacity?: number | null
          foreground_image_position_x?: number | null
          foreground_image_position_y?: number | null
          foreground_image_rotation?: number | null
          foreground_image_scale?: number | null
          foreground_overlay_alpha?: number | null
          foreground_overlay_color?: string | null
          id?: string
          image?: string | null
          image_position_x?: number | null
          image_position_y?: number | null
          image_rotation?: number | null
          image_scale?: number | null
          is_active?: boolean
          label?: string | null
          label_position?: string | null
          link_screen?: string | null
          link_type?: string | null
          link_url?: string | null
          main_text?: string | null
          overlay_alpha?: number | null
          position?: number
          text_bg_alpha?: number | null
          text_bg_blend?: boolean | null
          text_bg_color?: string | null
          text_bg_spread?: number | null
          text_color?: string | null
          title?: string | null
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          appointment_id: string
          client_id: string
          created_at: string | null
          error_message: string | null
          id: string
          notification_type: string
          sent_at: string | null
          status: string | null
          trainer_id: string
        }
        Insert: {
          appointment_id: string
          client_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          notification_type?: string
          sent_at?: string | null
          status?: string | null
          trainer_id: string
        }
        Update: {
          appointment_id?: string
          client_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          notification_type?: string
          sent_at?: string | null
          status?: string | null
          trainer_id?: string
        }
        Relationships: []
      }
      notification_recipients: {
        Row: {
          clicked_at: string | null
          client_id: string
          created_at: string | null
          id: string
          notification_id: string
          read_at: string | null
        }
        Insert: {
          clicked_at?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          notification_id: string
          read_at?: string | null
        }
        Update: {
          clicked_at?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          notification_id?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_recipients_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "client_notifications"
            referencedColumns: ["notification_id"]
          },
          {
            foreignKeyName: "notification_recipients_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          message: string
          title: string
          trainer_id: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          title: string
          trainer_id: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          title?: string
          trainer_id?: string
          type?: string | null
        }
        Relationships: []
      }
      nutrition_goals: {
        Row: {
          calories_goal: number | null
          carbs_goal: number | null
          client_id: string | null
          created_at: string | null
          effective_date: string | null
          fat_goal: number | null
          fiber_goal: number | null
          id: string
          is_active: boolean | null
          protein_goal: number | null
          set_by: string | null
          sodium_goal: number | null
        }
        Insert: {
          calories_goal?: number | null
          carbs_goal?: number | null
          client_id?: string | null
          created_at?: string | null
          effective_date?: string | null
          fat_goal?: number | null
          fiber_goal?: number | null
          id?: string
          is_active?: boolean | null
          protein_goal?: number | null
          set_by?: string | null
          sodium_goal?: number | null
        }
        Update: {
          calories_goal?: number | null
          carbs_goal?: number | null
          client_id?: string | null
          created_at?: string | null
          effective_date?: string | null
          fat_goal?: number | null
          fiber_goal?: number | null
          id?: string
          is_active?: boolean | null
          protein_goal?: number | null
          set_by?: string | null
          sodium_goal?: number | null
        }
        Relationships: []
      }
      nutrition_integrations: {
        Row: {
          access_token: string | null
          client_id: string | null
          created_at: string | null
          daily_calories: number | null
          daily_carbs: number | null
          daily_fat: number | null
          daily_protein: number | null
          id: string
          is_active: boolean | null
          last_sync: string | null
          provider: string
          provider_user_id: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          client_id?: string | null
          created_at?: string | null
          daily_calories?: number | null
          daily_carbs?: number | null
          daily_fat?: number | null
          daily_protein?: number | null
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          provider: string
          provider_user_id?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          client_id?: string | null
          created_at?: string | null
          daily_calories?: number | null
          daily_carbs?: number | null
          daily_fat?: number | null
          daily_protein?: number | null
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          provider?: string
          provider_user_id?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      onboarding_reminders: {
        Row: {
          created_at: string | null
          feature: string
          id: string
          remind_after: string | null
          trainer_id: string
        }
        Insert: {
          created_at?: string | null
          feature: string
          id?: string
          remind_after?: string | null
          trainer_id: string
        }
        Update: {
          created_at?: string | null
          feature?: string
          id?: string
          remind_after?: string | null
          trainer_id?: string
        }
        Relationships: []
      }
      package_sessions: {
        Row: {
          appointment_id: string | null
          client_package_id: string | null
          created_by: string | null
          id: string
          notes: string | null
          used_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          client_package_id?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          used_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          client_package_id?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_sessions_client_package_id_fkey"
            columns: ["client_package_id"]
            isOneToOne: false
            referencedRelation: "client_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      package_usage_history: {
        Row: {
          appointment_id: string
          id: string
          purchase_id: string
          sessions_used: number | null
          used_at: string | null
        }
        Insert: {
          appointment_id: string
          id?: string
          purchase_id: string
          sessions_used?: number | null
          used_at?: string | null
        }
        Update: {
          appointment_id?: string
          id?: string
          purchase_id?: string
          sessions_used?: number | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_usage_history_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "client_package_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history: {
        Row: {
          amount: number | null
          client_id: string | null
          created_at: string | null
          id: string
          payment_method: string | null
          status: string | null
          trainer_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          payment_method?: string | null
          status?: string | null
          trainer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          payment_method?: string | null
          status?: string | null
          trainer_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      personal_bests: {
        Row: {
          achieved_at: string
          client_id: string
          created_at: string | null
          exercise_id: string
          id: string
          units: string
          updated_at: string | null
          value: number
        }
        Insert: {
          achieved_at: string
          client_id: string
          created_at?: string | null
          exercise_id: string
          id?: string
          units: string
          updated_at?: string | null
          value: number
        }
        Update: {
          achieved_at?: string
          client_id?: string
          created_at?: string | null
          exercise_id?: string
          id?: string
          units?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: []
      }
      program_workouts: {
        Row: {
          created_at: string | null
          day_number: number
          id: string
          notes: string | null
          program_id: string
          week_number: number
          workout_id: string
        }
        Insert: {
          created_at?: string | null
          day_number: number
          id?: string
          notes?: string | null
          program_id: string
          week_number: number
          workout_id: string
        }
        Update: {
          created_at?: string | null
          day_number?: number
          id?: string
          notes?: string | null
          program_id?: string
          week_number?: number
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_workouts_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_workouts_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          client_id: string | null
          created_at: string | null
          description: string | null
          duration_weeks: number | null
          id: string
          is_favorite: boolean
          program_type: string | null
          rest_days: Json | null
          subtitle: string | null
          template_id: string | null
          title: string
          trainer_id: string
          training_days_per_week: number | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_weeks?: number | null
          id?: string
          is_favorite?: boolean
          program_type?: string | null
          rest_days?: Json | null
          subtitle?: string | null
          template_id?: string | null
          title: string
          trainer_id: string
          training_days_per_week?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_weeks?: number | null
          id?: string
          is_favorite?: boolean
          program_type?: string | null
          rest_days?: Json | null
          subtitle?: string | null
          template_id?: string | null
          title?: string
          trainer_id?: string
          training_days_per_week?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_comparisons: {
        Row: {
          after_session_id: string | null
          before_session_id: string | null
          client_id: string | null
          comparison_name: string
          created_at: string | null
          id: string
          is_shared_with_trainer: boolean | null
          notes: string | null
          pose_type: string
        }
        Insert: {
          after_session_id?: string | null
          before_session_id?: string | null
          client_id?: string | null
          comparison_name: string
          created_at?: string | null
          id?: string
          is_shared_with_trainer?: boolean | null
          notes?: string | null
          pose_type: string
        }
        Update: {
          after_session_id?: string | null
          before_session_id?: string | null
          client_id?: string | null
          comparison_name?: string
          created_at?: string | null
          id?: string
          is_shared_with_trainer?: boolean | null
          notes?: string | null
          pose_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_comparisons_after_session_id_fkey"
            columns: ["after_session_id"]
            isOneToOne: false
            referencedRelation: "progress_photo_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_comparisons_before_session_id_fkey"
            columns: ["before_session_id"]
            isOneToOne: false
            referencedRelation: "progress_photo_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_photo_preferences: {
        Row: {
          client_id: string | null
          created_at: string | null
          ghost_overlay_enabled: boolean | null
          id: string
          last_reminder_sent: string | null
          preferred_poses: string[] | null
          privacy_mode: boolean | null
          reminder_day_of_week: number | null
          reminder_frequency: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          ghost_overlay_enabled?: boolean | null
          id?: string
          last_reminder_sent?: string | null
          preferred_poses?: string[] | null
          privacy_mode?: boolean | null
          reminder_day_of_week?: number | null
          reminder_frequency?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          ghost_overlay_enabled?: boolean | null
          id?: string
          last_reminder_sent?: string | null
          preferred_poses?: string[] | null
          privacy_mode?: boolean | null
          reminder_day_of_week?: number | null
          reminder_frequency?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      progress_photo_sessions: {
        Row: {
          body_fat_percentage: number | null
          client_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          session_date: string
          session_type: string | null
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          body_fat_percentage?: number | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          session_date?: string
          session_type?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          body_fat_percentage?: number | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          session_date?: string
          session_type?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          client_id: string | null
          created_at: string | null
          file_name: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          photo_type: string
          photo_url: string
          session_id: string | null
          upload_status: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          photo_type: string
          photo_url: string
          session_id?: string | null
          upload_status?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          photo_type?: string
          photo_url?: string
          session_id?: string | null
          upload_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_photos_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "progress_photo_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          app_type: string
          created_at: string | null
          id: string
          last_used_at: string | null
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          app_type?: string
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          platform: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          app_type?: string
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      saved_meals: {
        Row: {
          created_at: string
          id: string
          name: string
          total_calories: number
          total_carbs: number
          total_fat: number
          total_protein: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          total_calories?: number
          total_carbs?: number
          total_fat?: number
          total_protein?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          total_calories?: number
          total_carbs?: number
          total_fat?: number
          total_protein?: number
          user_id?: string
        }
        Relationships: []
      }
      saved_slide_templates: {
        Row: {
          bg_color: string | null
          color: string | null
          content_alignment: string | null
          created_at: string | null
          foreground_image: string | null
          foreground_image_opacity: number | null
          foreground_image_position_x: number | null
          foreground_image_position_y: number | null
          foreground_image_rotation: number | null
          foreground_image_scale: number | null
          foreground_overlay_alpha: number | null
          foreground_overlay_color: string | null
          id: string
          image: string | null
          image_position_x: number | null
          image_position_y: number | null
          image_rotation: number | null
          image_scale: number | null
          label: string | null
          label_position: string | null
          link_screen: string | null
          link_type: string | null
          link_url: string | null
          main_text: string | null
          name: string
          overlay_alpha: number | null
          text_bg_alpha: number | null
          text_bg_blend: boolean | null
          text_bg_color: string | null
          text_bg_spread: number | null
          text_color: string | null
          title: string | null
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          bg_color?: string | null
          color?: string | null
          content_alignment?: string | null
          created_at?: string | null
          foreground_image?: string | null
          foreground_image_opacity?: number | null
          foreground_image_position_x?: number | null
          foreground_image_position_y?: number | null
          foreground_image_rotation?: number | null
          foreground_image_scale?: number | null
          foreground_overlay_alpha?: number | null
          foreground_overlay_color?: string | null
          id?: string
          image?: string | null
          image_position_x?: number | null
          image_position_y?: number | null
          image_rotation?: number | null
          image_scale?: number | null
          label?: string | null
          label_position?: string | null
          link_screen?: string | null
          link_type?: string | null
          link_url?: string | null
          main_text?: string | null
          name: string
          overlay_alpha?: number | null
          text_bg_alpha?: number | null
          text_bg_blend?: boolean | null
          text_bg_color?: string | null
          text_bg_spread?: number | null
          text_color?: string | null
          title?: string | null
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          bg_color?: string | null
          color?: string | null
          content_alignment?: string | null
          created_at?: string | null
          foreground_image?: string | null
          foreground_image_opacity?: number | null
          foreground_image_position_x?: number | null
          foreground_image_position_y?: number | null
          foreground_image_rotation?: number | null
          foreground_image_scale?: number | null
          foreground_overlay_alpha?: number | null
          foreground_overlay_color?: string | null
          id?: string
          image?: string | null
          image_position_x?: number | null
          image_position_y?: number | null
          image_rotation?: number | null
          image_scale?: number | null
          label?: string | null
          label_position?: string | null
          link_screen?: string | null
          link_type?: string | null
          link_url?: string | null
          main_text?: string | null
          name?: string
          overlay_alpha?: number | null
          text_bg_alpha?: number | null
          text_bg_blend?: boolean | null
          text_bg_color?: string | null
          text_bg_spread?: number | null
          text_color?: string | null
          title?: string | null
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      session_packages: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_unlimited: boolean | null
          name: string
          price: number
          session_count: number
          trainer_id: string
          updated_at: string | null
          validity_days: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_unlimited?: boolean | null
          name: string
          price: number
          session_count: number
          trainer_id: string
          updated_at?: string | null
          validity_days?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_unlimited?: boolean | null
          name?: string
          price?: number
          session_count?: number
          trainer_id?: string
          updated_at?: string | null
          validity_days?: number | null
        }
        Relationships: []
      }
      shop_products: {
        Row: {
          active: boolean | null
          category: string
          colors: string[] | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          sizes: string[] | null
          trainer_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category: string
          colors?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          sizes?: string[] | null
          trainer_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string
          colors?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          sizes?: string[] | null
          trainer_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sleep_entries: {
        Row: {
          created_at: string | null
          hours: number
          id: string
          recorded_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          hours: number
          id?: string
          recorded_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          hours?: number
          id?: string
          recorded_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          created_at: string
          id: string
          stripe_customer_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stripe_customer_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stripe_customer_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          status: string
          stripe_payment_intent_id: string | null
          subscription_id: string
          trainer_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          status: string
          stripe_payment_intent_id?: string | null
          subscription_id: string
          trainer_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          subscription_id?: string
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "trainer_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          code: string
          created_at: string | null
          features: Json
          id: string
          is_active: boolean | null
          name: string
          price: number
          stripe_price_id: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          features: Json
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          features?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trainer_availability: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          start_time: string
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          start_time: string
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      trainer_availability_overrides: {
        Row: {
          created_at: string | null
          date: string
          end_time: string | null
          id: string
          override_type: string
          reason: string | null
          start_time: string | null
          trainer_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          end_time?: string | null
          id?: string
          override_type: string
          reason?: string | null
          start_time?: string | null
          trainer_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          end_time?: string | null
          id?: string
          override_type?: string
          reason?: string | null
          start_time?: string | null
          trainer_id?: string
        }
        Relationships: []
      }
      trainer_client: {
        Row: {
          appointment_status: string | null
          archived_at: string | null
          client_id: string
          created_at: string
          id: string
          status: string | null
          trainer_id: string
          updated_at: string
        }
        Insert: {
          appointment_status?: string | null
          archived_at?: string | null
          client_id: string
          created_at?: string
          id?: string
          status?: string | null
          trainer_id: string
          updated_at?: string
        }
        Update: {
          appointment_status?: string | null
          archived_at?: string | null
          client_id?: string
          created_at?: string
          id?: string
          status?: string | null
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_client_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_client_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_preferences: {
        Row: {
          business_name: string | null
          business_type: string | null
          certifications: string[] | null
          client_types: string[] | null
          created_at: string | null
          experience_years: number | null
          id: string
          location: string | null
          onboarding_completed: boolean | null
          specializations: string[] | null
          trainer_id: string
          training_approach: string | null
          updated_at: string | null
        }
        Insert: {
          business_name?: string | null
          business_type?: string | null
          certifications?: string[] | null
          client_types?: string[] | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          location?: string | null
          onboarding_completed?: boolean | null
          specializations?: string[] | null
          trainer_id: string
          training_approach?: string | null
          updated_at?: string | null
        }
        Update: {
          business_name?: string | null
          business_type?: string | null
          certifications?: string[] | null
          client_types?: string[] | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          location?: string | null
          onboarding_completed?: boolean | null
          specializations?: string[] | null
          trainer_id?: string
          training_approach?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trainer_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: string
          stripe_subscription_id: string | null
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          id?: string
          plan_id: string
          status: string
          stripe_subscription_id?: string | null
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: string
          stripe_subscription_id?: string | null
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_trainer_subscriptions_plan_id"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      training_packages: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          sessions: number
          trainer_id: string | null
          updated_at: string | null
          valid_for_days: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
          sessions?: number
          trainer_id?: string | null
          updated_at?: string | null
          valid_for_days?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          sessions?: number
          trainer_id?: string | null
          updated_at?: string | null
          valid_for_days?: number | null
        }
        Relationships: []
      }
      trialist_bookings: {
        Row: {
          class_schedule_id: string
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          status: string | null
          trainer_id: string
        }
        Insert: {
          class_schedule_id: string
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          status?: string | null
          trainer_id: string
        }
        Update: {
          class_schedule_id?: string
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          status?: string | null
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trialist_bookings_class_schedule_id_fkey"
            columns: ["class_schedule_id"]
            isOneToOne: false
            referencedRelation: "class_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          can_build_workouts: boolean | null
          can_edit_assigned_workouts: boolean | null
          created_at: string | null
          id: string
          linked_trainer_id: string | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          updated_at: string | null
          user_id: string
          user_type: string | null
        }
        Insert: {
          can_build_workouts?: boolean | null
          can_edit_assigned_workouts?: boolean | null
          created_at?: string | null
          id?: string
          linked_trainer_id?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          updated_at?: string | null
          user_id: string
          user_type?: string | null
        }
        Update: {
          can_build_workouts?: boolean | null
          can_edit_assigned_workouts?: boolean | null
          created_at?: string | null
          id?: string
          linked_trainer_id?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          updated_at?: string | null
          user_id?: string
          user_type?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          accept_marketing: boolean | null
          avatar_url: string | null
          bio: string | null
          business_name: string | null
          created_at: string
          current_weight: number | null
          daily_calorie_goal: number | null
          date_of_birth: string | null
          distance_unit: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string | null
          fitness_level: string | null
          gender: string | null
          goal_weight: number | null
          height: number | null
          id: string
          is_active: boolean | null
          join_date: string | null
          last_name: string | null
          membership_type: string | null
          name: string | null
          phone: string | null
          status: string | null
          subscription_plan: string | null
          updated_at: string
          user_type: string | null
          weight_unit: string | null
        }
        Insert: {
          accept_marketing?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          created_at?: string
          current_weight?: number | null
          daily_calorie_goal?: number | null
          date_of_birth?: string | null
          distance_unit?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          fitness_level?: string | null
          gender?: string | null
          goal_weight?: number | null
          height?: number | null
          id: string
          is_active?: boolean | null
          join_date?: string | null
          last_name?: string | null
          membership_type?: string | null
          name?: string | null
          phone?: string | null
          status?: string | null
          subscription_plan?: string | null
          updated_at?: string
          user_type?: string | null
          weight_unit?: string | null
        }
        Update: {
          accept_marketing?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          created_at?: string
          current_weight?: number | null
          daily_calorie_goal?: number | null
          date_of_birth?: string | null
          distance_unit?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          fitness_level?: string | null
          gender?: string | null
          goal_weight?: number | null
          height?: number | null
          id?: string
          is_active?: boolean | null
          join_date?: string | null
          last_name?: string | null
          membership_type?: string | null
          name?: string | null
          phone?: string | null
          status?: string | null
          subscription_plan?: string | null
          updated_at?: string
          user_type?: string | null
          weight_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_subscription_plan_fkey"
            columns: ["subscription_plan"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      water_entries: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      website_settings: {
        Row: {
          coming_soon_message: string | null
          created_at: string | null
          id: string
          maintenance_message: string | null
          mode: string
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          coming_soon_message?: string | null
          created_at?: string | null
          id?: string
          maintenance_message?: string | null
          mode?: string
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          coming_soon_message?: string | null
          created_at?: string | null
          id?: string
          maintenance_message?: string | null
          mode?: string
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      workout_completions: {
        Row: {
          client_id: string
          completed_at: string | null
          completion_date: string | null
          created_at: string | null
          day_number: number | null
          duration_minutes: number | null
          id: string
          notes: string | null
          program_id: string | null
          week_number: number | null
          workout_id: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          completion_date?: string | null
          created_at?: string | null
          day_number?: number | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          program_id?: string | null
          week_number?: number | null
          workout_id: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          completion_date?: string | null
          created_at?: string | null
          day_number?: number | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          program_id?: string | null
          week_number?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_completions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_completions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          calories: number | null
          distance: number | null
          dropset_application: string | null
          dropset_calories: number[] | null
          dropset_distance: number[] | null
          dropset_notes: string[] | null
          dropset_reps: string[] | null
          dropset_time: string[] | null
          dropset_weights: Json | null
          exercise_id: string
          hidden_fields: string[] | null
          is_dropset: boolean | null
          measurement_type: string | null
          notes: string | null
          position: number
          reps: string | null
          rest_seconds: number | null
          set_count: number | null
          superset_id: string | null
          time: number | null
          weight: number | null
          workout_id: string
        }
        Insert: {
          calories?: number | null
          distance?: number | null
          dropset_application?: string | null
          dropset_calories?: number[] | null
          dropset_distance?: number[] | null
          dropset_notes?: string[] | null
          dropset_reps?: string[] | null
          dropset_time?: string[] | null
          dropset_weights?: Json | null
          exercise_id: string
          hidden_fields?: string[] | null
          is_dropset?: boolean | null
          measurement_type?: string | null
          notes?: string | null
          position: number
          reps?: string | null
          rest_seconds?: number | null
          set_count?: number | null
          superset_id?: string | null
          time?: number | null
          weight?: number | null
          workout_id: string
        }
        Update: {
          calories?: number | null
          distance?: number | null
          dropset_application?: string | null
          dropset_calories?: number[] | null
          dropset_distance?: number[] | null
          dropset_notes?: string[] | null
          dropset_reps?: string[] | null
          dropset_time?: string[] | null
          dropset_weights?: Json | null
          exercise_id?: string
          hidden_fields?: string[] | null
          is_dropset?: boolean | null
          measurement_type?: string | null
          notes?: string | null
          position?: number
          reps?: string | null
          rest_seconds?: number | null
          set_count?: number | null
          superset_id?: string | null
          time?: number | null
          weight?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_instance_exercises: {
        Row: {
          calories: string | null
          created_at: string | null
          distance: string | null
          dropset_application: string | null
          dropset_calories: string | null
          dropset_distance: string | null
          dropset_notes: string | null
          dropset_reps: string | null
          dropset_time: string | null
          dropset_weights: string | null
          exercise_id: string
          id: string
          is_dropset: boolean | null
          notes: string | null
          position: number
          reps: string
          rest_seconds: number | null
          set_count: string
          superset_id: string | null
          time: string | null
          updated_at: string | null
          weight: string | null
          workout_instance_id: string
        }
        Insert: {
          calories?: string | null
          created_at?: string | null
          distance?: string | null
          dropset_application?: string | null
          dropset_calories?: string | null
          dropset_distance?: string | null
          dropset_notes?: string | null
          dropset_reps?: string | null
          dropset_time?: string | null
          dropset_weights?: string | null
          exercise_id: string
          id?: string
          is_dropset?: boolean | null
          notes?: string | null
          position?: number
          reps?: string
          rest_seconds?: number | null
          set_count?: string
          superset_id?: string | null
          time?: string | null
          updated_at?: string | null
          weight?: string | null
          workout_instance_id: string
        }
        Update: {
          calories?: string | null
          created_at?: string | null
          distance?: string | null
          dropset_application?: string | null
          dropset_calories?: string | null
          dropset_distance?: string | null
          dropset_notes?: string | null
          dropset_reps?: string | null
          dropset_time?: string | null
          dropset_weights?: string | null
          exercise_id?: string
          id?: string
          is_dropset?: boolean | null
          notes?: string | null
          position?: number
          reps?: string
          rest_seconds?: number | null
          set_count?: string
          superset_id?: string | null
          time?: string | null
          updated_at?: string | null
          weight?: string | null
          workout_instance_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_instance_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_instance_exercises_workout_instance_id_fkey"
            columns: ["workout_instance_id"]
            isOneToOne: false
            referencedRelation: "workout_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_instances: {
        Row: {
          created_at: string | null
          day_number: number
          id: string
          notes: string | null
          program_id: string
          title: string
          updated_at: string | null
          week_number: number
          workout_template_id: string
        }
        Insert: {
          created_at?: string | null
          day_number?: number
          id?: string
          notes?: string | null
          program_id: string
          title: string
          updated_at?: string | null
          week_number?: number
          workout_template_id: string
        }
        Update: {
          created_at?: string | null
          day_number?: number
          id?: string
          notes?: string | null
          program_id?: string
          title?: string
          updated_at?: string | null
          week_number?: number
          workout_template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_instances_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_instances_workout_template_id_fkey"
            columns: ["workout_template_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_notes: {
        Row: {
          created_at: string | null
          id: string
          note_text: string
          position: number
          updated_at: string | null
          workout_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          note_text: string
          position: number
          updated_at?: string | null
          workout_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          note_text?: string
          position?: number
          updated_at?: string | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_notes_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_set_history: {
        Row: {
          client_id: string
          created_at: string
          distance: number | null
          exercise_id: string
          id: string
          is_personal_best: boolean | null
          kcal: number | null
          logged_at: string | null
          notes: string | null
          program_workout_id: string | null
          reps: number
          rir: number | null
          rpe: number | null
          set_number: number | null
          time_minutes: number | null
          time_seconds: number | null
          weight: number
          workout_date: string | null
          workout_id: string | null
          workout_instance_id: string | null
          workout_session_id: string | null
          workout_template_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          distance?: number | null
          exercise_id: string
          id?: string
          is_personal_best?: boolean | null
          kcal?: number | null
          logged_at?: string | null
          notes?: string | null
          program_workout_id?: string | null
          reps: number
          rir?: number | null
          rpe?: number | null
          set_number?: number | null
          time_minutes?: number | null
          time_seconds?: number | null
          weight: number
          workout_date?: string | null
          workout_id?: string | null
          workout_instance_id?: string | null
          workout_session_id?: string | null
          workout_template_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          distance?: number | null
          exercise_id?: string
          id?: string
          is_personal_best?: boolean | null
          kcal?: number | null
          logged_at?: string | null
          notes?: string | null
          program_workout_id?: string | null
          reps?: number
          rir?: number | null
          rpe?: number | null
          set_number?: number | null
          time_minutes?: number | null
          time_seconds?: number | null
          weight?: number
          workout_date?: string | null
          workout_id?: string | null
          workout_instance_id?: string | null
          workout_session_id?: string | null
          workout_template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_set_history_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_set_history_program_workout_id_fkey"
            columns: ["program_workout_id"]
            isOneToOne: false
            referencedRelation: "program_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_set_history_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_set_history_workout_instance_id_fkey"
            columns: ["workout_instance_id"]
            isOneToOne: false
            referencedRelation: "workout_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_set_history_workout_template_id_fkey"
            columns: ["workout_template_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string | null
          distance_unit: string | null
          duration: string | null
          est_duration: string | null
          id: string
          title: string
          trainer_id: string | null
          weight_unit: string | null
        }
        Insert: {
          created_at?: string | null
          distance_unit?: string | null
          duration?: string | null
          est_duration?: string | null
          id?: string
          title: string
          trainer_id?: string | null
          weight_unit?: string | null
        }
        Update: {
          created_at?: string | null
          distance_unit?: string | null
          duration?: string | null
          est_duration?: string | null
          id?: string
          title?: string
          trainer_id?: string | null
          weight_unit?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      client_notifications: {
        Row: {
          clicked_at: string | null
          client_id: string | null
          created_at: string | null
          expires_at: string | null
          is_active: boolean | null
          message: string | null
          notification_id: string | null
          read_at: string | null
          recipient_id: string | null
          title: string | null
          trainer_id: string | null
          type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_credits: {
        Args: {
          p_amount: number
          p_credit_type: string
          p_membership_id: string
          p_notes?: string
        }
        Returns: boolean
      }
      archive_client: {
        Args: {
          p_archived_at: string
          p_client_id: string
          p_trainer_id: string
        }
        Returns: undefined
      }
      auto_complete_past_appointments: { Args: never; Returns: number }
      calculate_quarterly_estimates: {
        Args: { quarter_num: number; tax_year_str: string; user_uuid: string }
        Returns: undefined
      }
      can_book_class: {
        Args: { p_client_id: string; p_trainer_id: string }
        Returns: boolean
      }
      check_and_process_expired_notification: {
        Args: { client_user_id: string }
        Returns: {
          custom_notification_activated_at: string
          custom_notification_expires_at: string
          custom_notification_message: string
          custom_notification_timer_hours: number
          custom_notification_timer_type: string
          custom_notification_title: string
          default_notification_type: string
          previous_notification_message: string
          previous_notification_title: string
          previous_notification_type: string
        }[]
      }
      check_onboarding_status: {
        Args: { p_user_id: string }
        Returns: {
          needs_onboarding: boolean
          onboarding_completed: boolean
          user_type: string
        }[]
      }
      cleanup_expired_chat_media: { Args: never; Returns: number }
      cleanup_old_push_tokens: { Args: { days_old?: number }; Returns: number }
      create_auth_user: {
        Args: { user_email: string; user_id: string; user_password: string }
        Returns: Json
      }
      deduct_class_session: {
        Args: {
          p_class_schedule_id: string
          p_client_id: string
          p_notes?: string
          p_trainer_id: string
        }
        Returns: boolean
      }
      deduct_credits: {
        Args: {
          p_amount: number
          p_appointment_id?: string
          p_class_schedule_id?: string
          p_credit_type: string
          p_membership_id: string
          p_notes?: string
        }
        Returns: boolean
      }
      deduct_session_fifo: {
        Args: { p_client_id: string; p_trainer_id: string }
        Returns: undefined
      }
      delete_conversation: {
        Args: { conversation_id_param: string }
        Returns: undefined
      }
      generate_available_appointments: {
        Args: {
          p_duration_minutes?: number
          p_end_date: string
          p_start_date: string
          p_trainer_id: string
        }
        Returns: undefined
      }
      get_class_waitlist_info: {
        Args: { schedule_id: string }
        Returns: {
          available_spots: number
          total_confirmed: number
          total_waitlist: number
          waitlist_clients: Json
        }[]
      }
      get_client_active_packages: {
        Args: { p_client_id: string; p_trainer_id: string }
        Returns: {
          expiry_date: string
          is_unlimited: boolean
          package_name: string
          purchase_id: string
          sessions_remaining: number
        }[]
      }
      get_client_habits_for_today: {
        Args: { client_user_id: string }
        Returns: {
          frequency: string
          habit_id: string
          is_completed: boolean
          title: string
        }[]
      }
      get_default_notification_message: {
        Args: { p_client_id?: string; p_trainer_id: string }
        Returns: {
          message: string
          title: string
          type: string
        }[]
      }
      get_or_create_conversation: {
        Args: { p_client_id: string; p_trainer_id: string }
        Returns: string
      }
      get_or_create_group_conversation: {
        Args: { p_group_id: string }
        Returns: string
      }
      get_trainer_available_slots: {
        Args: {
          p_date: string
          p_duration_minutes?: number
          p_trainer_id: string
        }
        Returns: {
          available_end: string
          available_start: string
        }[]
      }
      get_trainer_notification_settings_for_client: {
        Args: { client_user_id: string }
        Returns: {
          custom_notification_activated_at: string
          custom_notification_expires_at: string
          custom_notification_message: string
          custom_notification_timer_hours: number
          custom_notification_timer_type: string
          custom_notification_title: string
          default_notification_type: string
          previous_notification_message: string
          previous_notification_title: string
          previous_notification_type: string
        }[]
      }
      get_trainer_package_stats: {
        Args: { p_trainer_id: string }
        Returns: {
          active_packages: number
          sessions_used_this_month: number
          total_packages_sold: number
          total_revenue: number
        }[]
      }
      get_trainer_payment_summary: {
        Args: { p_trainer_id: string }
        Returns: {
          pending_amount: number
          this_month_revenue: number
          total_revenue: number
          total_transactions: number
        }[]
      }
      get_trainer_subscription_features: {
        Args: { p_trainer_id: string }
        Returns: Json
      }
      get_user_by_id: {
        Args: { user_id: string }
        Returns: {
          email: string
          id: string
          raw_user_meta_data: Json
        }[]
      }
      mark_group_message_read: {
        Args: { p_message_id: string; p_user_id: string }
        Returns: undefined
      }
      mark_media_downloaded: {
        Args: { media_id: string; user_type: string }
        Returns: boolean
      }
      process_appointment_completions: { Args: never; Returns: Json }
      process_expired_custom_notifications: {
        Args: never
        Returns: {
          processed_count: number
          reverted_to: string
          trainer_id: string
        }[]
      }
      promote_specific_waitlist_client: {
        Args: { booking_id: string; trainer_id_param: string }
        Returns: boolean
      }
      refund_package_session: {
        Args: { p_notes?: string; p_package_session_id: string }
        Returns: boolean
      }
      reset_monthly_class_usage: { Args: never; Returns: undefined }
      reset_weekly_class_usage: { Args: never; Returns: undefined }
      restore_class_session: {
        Args: {
          p_class_schedule_id: string
          p_client_id: string
          p_trainer_id: string
        }
        Returns: boolean
      }
      send_appointment_notification: {
        Args: {
          p_client_id: string
          p_new_time: string
          p_old_time: string
          p_trainer_id: string
        }
        Returns: string
      }
      send_program_assignment_notification: {
        Args: {
          p_client_id: string
          p_program_name: string
          p_trainer_id: string
        }
        Returns: string
      }
      test_appointment_notification: {
        Args: { p_appointment_id: string }
        Returns: Json
      }
      use_package_session:
        | {
            Args: {
              p_appointment_id?: string
              p_client_package_id: string
              p_notes?: string
            }
            Returns: boolean
          }
        | {
            Args: {
              p_appointment_id: string
              p_purchase_id: string
              p_sessions_to_use?: number
            }
            Returns: boolean
          }
    }
    Enums: {
      default_notification_type:
        | "workout_reminder"
        | "food_tracking"
        | "hydration_reminder"
        | "personal_best"
        | "custom"
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
      default_notification_type: [
        "workout_reminder",
        "food_tracking",
        "hydration_reminder",
        "personal_best",
        "custom",
      ],
    },
  },
} as const
