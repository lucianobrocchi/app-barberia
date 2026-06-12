import type { Database } from './database';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Barbershop = Database['public']['Tables']['barbershops']['Row'];
export type Service = Database['public']['Tables']['services']['Row'];
export type Cut = Database['public']['Tables']['cuts']['Row'];
export type Reservation = Database['public']['Tables']['reservations']['Row'];
export type Client = Database['public']['Tables']['clients']['Row'];
export type CashRegisterSession = Database['public']['Tables']['cash_register_sessions']['Row'];

export type UserRole = 'owner' | 'barber';
export type PaymentMethod = 'cash' | 'mercadopago' | 'transfer' | 'other';
export type ReservationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export type CutWithRelations = Cut & {
  service: Service;
  barber: Profile;
  client: Client | null;
};

export type ReservationWithRelations = Reservation & {
  service: Service;
  barber: Profile | null;
  client: Client;
};
