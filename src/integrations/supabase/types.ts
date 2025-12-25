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
      event_views: {
        Row: {
          device_type: string | null
          event_id: string
          id: string
          ip_address: string | null
          referrer: string | null
          user_agent: string | null
          viewed_at: string | null
        }
        Insert: {
          device_type?: string | null
          event_id: string
          id?: string
          ip_address?: string | null
          referrer?: string | null
          user_agent?: string | null
          viewed_at?: string | null
        }
        Update: {
          device_type?: string | null
          event_id?: string
          id?: string
          ip_address?: string | null
          referrer?: string | null
          user_agent?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_views_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          allow_plus_ones: boolean | null
          collect_meal_prefs: boolean | null
          cover_image_url: string | null
          created_at: string | null
          custom_questions: Json | null
          custom_social_links: Json | null
          description: string | null
          design_template: string | null
          dress_code: string | null
          end_date: string | null
          event_name: string
          event_type: string
          facebook_link: string | null
          gallery_link: string | null
          host_names: string | null
          id: string
          instagram_handle: string | null
          parking_notes: string | null
          qr_code_url: string | null
          rsvp_deadline: string | null
          rsvp_enabled: boolean | null
          share_count: number | null
          slug: string
          start_date: string
          status: string | null
          theme_color: string | null
          twitter_handle: string | null
          updated_at: string | null
          user_id: string
          venue_address: string | null
          venue_lat: number | null
          venue_lng: number | null
          venue_name: string | null
          view_count: number | null
          google_photos_url: string | null
          google_drive_url: string | null
          youtube_link: string | null
        }
        Insert: {
          allow_plus_ones?: boolean | null
          collect_meal_prefs?: boolean | null
          cover_image_url?: string | null
          created_at?: string | null
          custom_questions?: Json | null
          custom_social_links?: Json | null
          description?: string | null
          design_template?: string | null
          dress_code?: string | null
          end_date?: string | null
          event_name: string
          event_type: string
          facebook_link?: string | null
          gallery_link?: string | null
          google_photos_url?: string | null
          google_drive_url?: string | null
          host_names?: string | null
          id?: string
          instagram_handle?: string | null
          parking_notes?: string | null
          qr_code_url?: string | null
          rsvp_deadline?: string | null
          rsvp_enabled?: boolean | null
          share_count?: number | null
          slug: string
          start_date: string
          status?: string | null
          theme_color?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          user_id: string
          venue_address?: string | null
          venue_lat?: number | null
          venue_lng?: number | null
          venue_name?: string | null
          view_count?: number | null
          youtube_link?: string | null
        }
        Update: {
          allow_plus_ones?: boolean | null
          collect_meal_prefs?: boolean | null
          cover_image_url?: string | null
          created_at?: string | null
          custom_questions?: Json | null
          custom_social_links?: Json | null
          description?: string | null
          design_template?: string | null
          dress_code?: string | null
          end_date?: string | null
          event_name?: string
          event_type?: string
          facebook_link?: string | null
          gallery_link?: string | null
          google_photos_url?: string | null
          google_drive_url?: string | null
          host_names?: string | null
          id?: string
          instagram_handle?: string | null
          parking_notes?: string | null
          qr_code_url?: string | null
          rsvp_deadline?: string | null
          rsvp_enabled?: boolean | null
          share_count?: number | null
          slug?: string
          start_date?: string
          status?: string | null
          theme_color?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          user_id?: string
          venue_address?: string | null
          venue_lat?: number | null
          venue_lng?: number | null
          venue_name?: string | null
          view_count?: number | null
          youtube_link?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          name: string | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rsvps: {
        Row: {
          checked_in: boolean | null
          checked_in_at: string | null
          custom_responses: Json | null
          event_id: string
          guest_email: string | null
          guest_name: string
          guest_phone: string | null
          id: string
          meal_preferences: string[] | null
          message: string | null
          num_guests: number | null
          status: string | null
          submitted_at: string | null
        }
        Insert: {
          checked_in?: boolean | null
          checked_in_at?: string | null
          custom_responses?: Json | null
          event_id: string
          guest_email?: string | null
          guest_name: string
          guest_phone?: string | null
          id?: string
          meal_preferences?: string[] | null
          message?: string | null
          num_guests?: number | null
          status?: string | null
          submitted_at?: string | null
        }
        Update: {
          checked_in?: boolean | null
          checked_in_at?: string | null
          custom_responses?: Json | null
          event_id?: string
          guest_email?: string | null
          guest_name?: string
          guest_phone?: string | null
          id?: string
          meal_preferences?: string[] | null
          message?: string | null
          num_guests?: number | null
          status?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_events: {
        Row: {
          created_at: string | null
          date_time: string
          description: string | null
          event_id: string
          id: string
          location_address: string | null
          location_name: string | null
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          date_time: string
          description?: string | null
          event_id: string
          id?: string
          location_address?: string | null
          location_name?: string | null
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          date_time?: string
          description?: string | null
          event_id?: string
          id?: string
          location_address?: string | null
          location_name?: string | null
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_unique_slug: { Args: { event_name: string }; Returns: string }
      increment_view_count: { Args: { event_id: string }; Returns: void }
      create_guest_rsvp: {
        Args: {
          p_event_id: string
          p_guest_name: string
          p_guest_email: string
          p_guest_phone?: string | null
          p_status: string
          p_num_guests: number
          p_message?: string | null
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
