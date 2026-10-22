export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TenantStatus = 'active' | 'suspended' | 'inactive';
export type MembershipRole = 'owner' | 'manager' | 'staff';
export type PlanCycle = 'monthly' | 'yearly';
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'suspended'
  | 'expired';
export type OrderType = 'takeaway' | 'pickup_scheduled';
export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'cancelled';
export type PaymentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'refunded'
  | 'cash_on_pickup';

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          banner_url: string | null;
          status: TenantStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          banner_url?: string | null;
          status?: TenantStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          banner_url?: string | null;
          status?: TenantStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          is_super_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          is_super_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          is_super_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      memberships: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          role: MembershipRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          role: MembershipRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          role?: MembershipRole;
          created_at?: string;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          name: string;
          code: string;
          price: number;
          currency: string;
          billing_cycle: PlanCycle;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          price?: number;
          currency?: string;
          billing_cycle?: PlanCycle;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          price?: number;
          currency?: string;
          billing_cycle?: PlanCycle;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      features: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      plan_features: {
        Row: {
          id: string;
          plan_id: string;
          feature_id: string;
          value: Json;
        };
        Insert: {
          id?: string;
          plan_id: string;
          feature_id: string;
          value?: Json;
        };
        Update: {
          id?: string;
          plan_id?: string;
          feature_id?: string;
          value?: Json;
        };
        Relationships: [];
      };
      tenant_feature_overrides: {
        Row: {
          id: string;
          tenant_id: string;
          feature_id: string;
          value: Json;
          reason: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          feature_id: string;
          value: Json;
          reason?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          feature_id?: string;
          value?: Json;
          reason?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          tenant_id: string;
          plan_id: string;
          status: SubscriptionStatus;
          current_period_start: string;
          current_period_end: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          plan_id: string;
          status?: SubscriptionStatus;
          current_period_start?: string;
          current_period_end: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          plan_id?: string;
          status?: SubscriptionStatus;
          current_period_start?: string;
          current_period_end?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tenant_settings: {
        Row: {
          id: string;
          tenant_id: string;
          currency: string;
          current_preparation_time_minutes: number;
          is_ordering_paused: boolean;
          pause_reason: string | null;
          accepts_cash: boolean;
          accepts_mercadopago: boolean;
          mercadopago_access_token: string | null;
          mercadopago_public_key: string | null;
          mercadopago_sandbox_mode: boolean;
          whatsapp_phone: string | null;
          address: string | null;
          slogan: string | null;
          card_style: 'con_foto' | 'sin_foto' | 'vintage';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          currency?: string;
          current_preparation_time_minutes?: number;
          is_ordering_paused?: boolean;
          pause_reason?: string | null;
          accepts_cash?: boolean;
          accepts_mercadopago?: boolean;
          mercadopago_access_token?: string | null;
          mercadopago_public_key?: string | null;
          mercadopago_sandbox_mode?: boolean;
          whatsapp_phone?: string | null;
          address?: string | null;
          slogan?: string | null;
          card_style?: 'con_foto' | 'sin_foto' | 'vintage';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          currency?: string;
          current_preparation_time_minutes?: number;
          is_ordering_paused?: boolean;
          pause_reason?: string | null;
          accepts_cash?: boolean;
          accepts_mercadopago?: boolean;
          mercadopago_access_token?: string | null;
          mercadopago_public_key?: string | null;
          mercadopago_sandbox_mode?: boolean;
          whatsapp_phone?: string | null;
          address?: string | null;
          slogan?: string | null;
          card_style?: 'con_foto' | 'sin_foto' | 'vintage';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      menu_themes: {
        Row: {
          id: string;
          tenant_id: string;
          preset_code: string;
          tokens: Json;
          layout_config: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          preset_code?: string;
          tokens?: Json;
          layout_config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          preset_code?: string;
          tokens?: Json;
          layout_config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          sort_order: number;
          is_active: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          tenant_id: string;
          category_id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          preparation_time_minutes: number;
          is_available: boolean;
          is_featured: boolean;
          sort_order: number;
          is_combo: boolean;
          original_price: number | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          category_id: string;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          preparation_time_minutes?: number;
          is_available?: boolean;
          is_featured?: boolean;
          sort_order?: number;
          is_combo?: boolean;
          original_price?: number | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          category_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          preparation_time_minutes?: number;
          is_available?: boolean;
          is_featured?: boolean;
          sort_order?: number;
          is_combo?: boolean;
          original_price?: number | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_option_groups: {
        Row: {
          id: string;
          tenant_id: string;
          product_id: string;
          name: string;
          min_selectable: number;
          max_selectable: number;
          is_required: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          product_id: string;
          name: string;
          min_selectable?: number;
          max_selectable?: number;
          is_required?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          product_id?: string;
          name?: string;
          min_selectable?: number;
          max_selectable?: number;
          is_required?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      product_options: {
        Row: {
          id: string;
          group_id: string;
          name: string;
          extra_price: number;
          is_available: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          name: string;
          extra_price?: number;
          is_available?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          name?: string;
          extra_price?: number;
          is_available?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string | null;
          name: string;
          phone: string;
          email: string | null;
          points_balance: number;
          total_orders: number;
          total_spent: number;
          last_order_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id?: string | null;
          name: string;
          phone: string;
          email?: string | null;
          points_balance?: number;
          total_orders?: number;
          total_spent?: number;
          last_order_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string | null;
          name?: string;
          phone?: string;
          email?: string | null;
          points_balance?: number;
          total_orders?: number;
          total_spent?: number;
          last_order_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      coupons: {
        Row: {
          id: string;
          tenant_id: string;
          code: string;
          discount_type: 'percentage' | 'fixed_amount';
          discount_value: number;
          min_order_amount: number;
          max_discount_amount: number | null;
          max_uses: number | null;
          current_uses: number;
          valid_from: string;
          valid_until: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          code: string;
          discount_type: 'percentage' | 'fixed_amount';
          discount_value: number;
          min_order_amount?: number;
          max_discount_amount?: number | null;
          max_uses?: number | null;
          current_uses?: number;
          valid_from?: string;
          valid_until?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          code?: string;
          discount_type?: 'percentage' | 'fixed_amount';
          discount_value?: number;
          min_order_amount?: number;
          max_discount_amount?: number | null;
          max_uses?: number | null;
          current_uses?: number;
          valid_from?: string;
          valid_until?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      customer_points_ledger: {
        Row: {
          id: string;
          tenant_id: string;
          customer_id: string;
          points: number;
          reason: string;
          order_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          customer_id: string;
          points: number;
          reason: string;
          order_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          customer_id?: string;
          points?: number;
          reason?: string;
          order_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          tenant_id: string;
          order_number: number;
          customer_id: string | null;
          customer_name: string;
          customer_phone: string;
          order_type: OrderType;
          scheduled_for: string | null;
          order_status: OrderStatus;
          payment_status: PaymentStatus;
          subtotal: number;
          discount: number;
          coupon_id: string | null;
          total: number;
          gateway_payment_id: string | null;
          gateway_preference_id: string | null;
          gateway_init_point: string | null;
          estimated_ready_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          order_number?: number;
          customer_id?: string | null;
          customer_name: string;
          customer_phone: string;
          order_type?: OrderType;
          scheduled_for?: string | null;
          order_status?: OrderStatus;
          payment_status?: PaymentStatus;
          subtotal?: number;
          discount?: number;
          coupon_id?: string | null;
          total?: number;
          gateway_payment_id?: string | null;
          gateway_preference_id?: string | null;
          gateway_init_point?: string | null;
          estimated_ready_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          order_number?: number;
          customer_id?: string | null;
          customer_name?: string;
          customer_phone?: string;
          order_type?: OrderType;
          scheduled_for?: string | null;
          order_status?: OrderStatus;
          payment_status?: PaymentStatus;
          subtotal?: number;
          discount?: number;
          coupon_id?: string | null;
          total?: number;
          gateway_payment_id?: string | null;
          gateway_preference_id?: string | null;
          gateway_init_point?: string | null;
          estimated_ready_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          unit_price: number;
          quantity: number;
          subtotal: number;
          options_snapshot: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          unit_price: number;
          quantity: number;
          subtotal: number;
          options_snapshot?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name?: string;
          unit_price?: number;
          quantity?: number;
          subtotal?: number;
          options_snapshot?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      product_combo_items: {
        Row: {
          id: string;
          parent_product_id: string;
          item_product_id: string;
          quantity: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_product_id: string;
          item_product_id: string;
          quantity?: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          parent_product_id?: string;
          item_product_id?: string;
          quantity?: number;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      raffles: {
        Row: {
          id: string;
          tenant_id: string;
          title: string;
          description: string | null;
          prize: string;
          image_url: string | null;
          end_date: string | null;
          status: 'active' | 'completed' | 'cancelled';
          winner_name: string | null;
          winner_email: string | null;
          winner_drawn_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          title: string;
          description?: string | null;
          prize: string;
          image_url?: string | null;
          end_date?: string | null;
          status?: 'active' | 'completed' | 'cancelled';
          winner_name?: string | null;
          winner_email?: string | null;
          winner_drawn_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          title?: string;
          description?: string | null;
          prize?: string;
          image_url?: string | null;
          end_date?: string | null;
          status?: 'active' | 'completed' | 'cancelled';
          winner_name?: string | null;
          winner_email?: string | null;
          winner_drawn_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      raffle_entries: {
        Row: {
          id: string;
          raffle_id: string;
          tenant_id: string;
          customer_id: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          raffle_id: string;
          tenant_id: string;
          customer_id?: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          raffle_id?: string;
          tenant_id?: string;
          customer_id?: string | null;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          tenant_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          tenant_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          tenant_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      tenant_status: TenantStatus;
      membership_role: MembershipRole;
      plan_cycle: PlanCycle;
      subscription_status: SubscriptionStatus;
      order_type: OrderType;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
