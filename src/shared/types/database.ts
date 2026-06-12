export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      barbershops: {
        Row: {
          id: string;
          name: string;
          slug: string;
          address: string | null;
          phone: string | null;
          timezone: string;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          address?: string | null;
          phone?: string | null;
          timezone?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          address?: string | null;
          phone?: string | null;
          timezone?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          barbershop_id: string;
          full_name: string;
          role: 'owner' | 'barber';
          avatar_url: string | null;
          phone: string | null;
          is_active: boolean;
          pin_hash: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          barbershop_id: string;
          full_name: string;
          role: 'owner' | 'barber';
          avatar_url?: string | null;
          phone?: string | null;
          is_active?: boolean;
          pin_hash?: string | null;
          created_at?: string;
        };
        Update: {
          barbershop_id?: string;
          full_name?: string;
          role?: 'owner' | 'barber';
          avatar_url?: string | null;
          phone?: string | null;
          is_active?: boolean;
          pin_hash?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_barbershop_id_fkey';
            columns: ['barbershop_id'];
            referencedRelation: 'barbershops';
            referencedColumns: ['id'];
          },
        ];
      };
      services: {
        Row: {
          id: string;
          barbershop_id: string;
          name: string;
          price: number;
          duration_minutes: number;
          is_active: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          barbershop_id: string;
          name: string;
          price: number;
          duration_minutes?: number;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          barbershop_id?: string;
          name?: string;
          price?: number;
          duration_minutes?: number;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          barbershop_id: string;
          full_name: string | null;
          phone: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          barbershop_id: string;
          full_name?: string | null;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          barbershop_id?: string;
          full_name?: string | null;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      cuts: {
        Row: {
          id: string;
          barbershop_id: string;
          barber_id: string;
          service_id: string;
          client_id: string | null;
          price: number;
          payment_method: 'cash' | 'mercadopago' | 'transfer' | 'other';
          notes: string | null;
          performed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          barbershop_id: string;
          barber_id: string;
          service_id: string;
          client_id?: string | null;
          price: number;
          payment_method: 'cash' | 'mercadopago' | 'transfer' | 'other';
          notes?: string | null;
          performed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          barbershop_id?: string;
          barber_id?: string;
          service_id?: string;
          client_id?: string | null;
          price?: number;
          payment_method?: 'cash' | 'mercadopago' | 'transfer' | 'other';
          notes?: string | null;
          performed_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      reservations: {
        Row: {
          id: string;
          barbershop_id: string;
          barber_id: string | null;
          service_id: string;
          client_id: string;
          scheduled_at: string;
          duration_minutes: number;
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
          cut_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          barbershop_id: string;
          barber_id?: string | null;
          service_id: string;
          client_id: string;
          scheduled_at: string;
          duration_minutes: number;
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
          cut_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          barbershop_id?: string;
          barber_id?: string | null;
          service_id?: string;
          client_id?: string;
          scheduled_at?: string;
          duration_minutes?: number;
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
          cut_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      cash_register_sessions: {
        Row: {
          id: string;
          barbershop_id: string;
          opened_at: string;
          closed_at: string | null;
          opened_by: string | null;
          closed_by: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          barbershop_id: string;
          opened_at?: string;
          closed_at?: string | null;
          opened_by?: string | null;
          closed_by?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          barbershop_id?: string;
          opened_at?: string;
          closed_at?: string | null;
          opened_by?: string | null;
          closed_by?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      user_barbershop_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      user_role: {
        Args: Record<string, never>;
        Returns: 'owner' | 'barber';
      };
      barberos_para_login: {
        Args: Record<string, never>;
        Returns: { id: string; full_name: string; role: 'owner' | 'barber'; is_active: boolean }[];
      };
      login_local: {
        Args: { p_usuario: string; p_password_hash: string };
        Returns: string | null;
      };
    };
    Enums: {
      user_role: 'owner' | 'barber';
      payment_method: 'cash' | 'mercadopago' | 'transfer' | 'other';
      reservation_status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
    };
    CompositeTypes: Record<string, never>;
  };
};
