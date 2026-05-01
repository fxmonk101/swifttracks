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
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shipment_events: {
        Row: {
          created_at: string
          description: string | null
          id: string
          location: string | null
          shipment_id: string
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          shipment_id: string
          status: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          shipment_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_location_snapshots: {
        Row: {
          created_at: string
          id: string
          lat: number
          lng: number
          shipment_id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lat: number
          lng: number
          shipment_id: string
          source?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          shipment_id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipment_location_snapshots_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          actual_delivery_date: string | null
          assigned_driver: string | null
          created_at: string
          created_by: string | null
          current_lat: number | null
          current_lng: number | null
          dimensions_height: number | null
          dimensions_length: number | null
          dimensions_width: number | null
          estimated_delivery_date: string | null
          id: string
          receiver_city: string
          receiver_country: string | null
          receiver_name: string
          receiver_state: string
          receiver_street: string | null
          receiver_zip: string | null
          requires_signature: boolean | null
          sender_city: string
          sender_country: string | null
          sender_name: string
          sender_state: string
          sender_street: string | null
          sender_zip: string | null
          service_type: string
          status: string
          tracking_id: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          actual_delivery_date?: string | null
          assigned_driver?: string | null
          created_at?: string
          created_by?: string | null
          current_lat?: number | null
          current_lng?: number | null
          dimensions_height?: number | null
          dimensions_length?: number | null
          dimensions_width?: number | null
          estimated_delivery_date?: string | null
          id?: string
          receiver_city: string
          receiver_country?: string | null
          receiver_name: string
          receiver_state: string
          receiver_street?: string | null
          receiver_zip?: string | null
          requires_signature?: boolean | null
          sender_city: string
          sender_country?: string | null
          sender_name: string
          sender_state: string
          sender_street?: string | null
          sender_zip?: string | null
          service_type?: string
          status?: string
          tracking_id: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          actual_delivery_date?: string | null
          assigned_driver?: string | null
          created_at?: string
          created_by?: string | null
          current_lat?: number | null
          current_lng?: number | null
          dimensions_height?: number | null
          dimensions_length?: number | null
          dimensions_width?: number | null
          estimated_delivery_date?: string | null
          id?: string
          receiver_city?: string
          receiver_country?: string | null
          receiver_name?: string
          receiver_state?: string
          receiver_street?: string | null
          receiver_zip?: string | null
          requires_signature?: boolean | null
          sender_city?: string
          sender_country?: string | null
          sender_name?: string
          sender_state?: string
          sender_street?: string | null
          sender_zip?: string | null
          service_type?: string
          status?: string
          tracking_id?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_shipment_analytics: { Args: { p_shipment_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      queue_delivery_notification: {
        Args: { p_event_type: string; p_shipment_id: string }
        Returns: Json
      }
      set_admin_role: { Args: { p_user_id: string }; Returns: Json }
      simulate_trip_step: {
        Args: {
          p_dest_lat: number
          p_dest_lng: number
          p_origin_lat: number
          p_origin_lng: number
          p_shipment_id: string
          p_step: number
        }
        Returns: Json
      }
      update_shipment_location: {
        Args: {
          p_lat: number
          p_lng: number
          p_shipment_id: string
          p_source?: string
        }
        Returns: Json
      }
      update_shipment_status: {
        Args: {
          p_description?: string
          p_location?: string
          p_new_status: string
          p_shipment_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "driver"
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
      app_role: ["admin", "moderator", "user", "driver"],
    },
  },
} as const
