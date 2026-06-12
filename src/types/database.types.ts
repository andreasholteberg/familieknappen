/**
 * Database-typer for Familieknappen (speiler SQL-schemaet i supabase/migrations).
 *
 * Skrevet for hånd, men i samme form som `supabase gen types typescript` lager,
 * slik at det enkelt kan byttes ut med autogenererte typer senere:
 *   supabase gen types typescript --project-id <ref> > src/types/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = 'senior' | 'relative';
export type MemberRoleDb = 'senior' | 'primary_contact' | 'secondary_contact';
export type RequestStatusDb =
  | 'CREATED' | 'SENT' | 'DELIVERED' | 'VIEWED' | 'ANSWERED' | 'ESCALATED' | 'CLOSED';
export type QuickReplyTypeDb = 'DO_NOT_REPLY' | 'LOOKS_OK' | 'I_WILL_CALL';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          role: AppRole;
          phone: string | null;
          email: string | null;
          activity_sharing_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string;
          role?: AppRole;
          phone?: string | null;
          email?: string | null;
          activity_sharing_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          role?: AppRole;
          phone?: string | null;
          email?: string | null;
          activity_sharing_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      family_groups: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          subscription_status: string;
          billing_admin_user_id: string | null;
          trial_end: string | null;
          current_period_end: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          name?: string;
          created_at?: string;
          subscription_status?: string;
          billing_admin_user_id?: string | null;
          trial_end?: string | null;
          current_period_end?: string | null;
          created_by?: string | null;
        };
        Update: { id?: string; name?: string };
        Relationships: [];
      };
      family_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          relationship: string | null;
          member_role: MemberRoleDb;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          relationship?: string | null;
          member_role?: MemberRoleDb;
          created_at?: string;
        };
        Update: {
          relationship?: string | null;
          member_role?: MemberRoleDb;
        };
        Relationships: [];
      };
      help_requests: {
        Row: {
          id: string;
          family_group_id: string;
          senior_id: string;
          recipient_id: string | null;
          image_path: string | null;
          message: string | null;
          status: RequestStatusDb;
          seen_by_senior: boolean;
          created_at: string;
          updated_at: string;
          delivered_at: string | null;
          viewed_at: string | null;
          answered_at: string | null;
          escalated_at: string | null;
          escalation_due_at: string | null;
          escalation_level: number;
          closed_at: string | null;
          acknowledged_at: string | null;
          escalation_stopped_at: string | null;
        };
        Insert: {
          id?: string;
          family_group_id: string;
          senior_id: string;
          recipient_id?: string | null;
          image_path?: string | null;
          message?: string | null;
          status?: RequestStatusDb;
          seen_by_senior?: boolean;
          created_at?: string;
          delivered_at?: string | null;
          viewed_at?: string | null;
          answered_at?: string | null;
          escalated_at?: string | null;
          escalation_due_at?: string | null;
          escalation_level?: number;
          closed_at?: string | null;
          acknowledged_at?: string | null;
        };
        Update: {
          recipient_id?: string | null;
          image_path?: string | null;
          message?: string | null;
          status?: RequestStatusDb;
          seen_by_senior?: boolean;
          delivered_at?: string | null;
          viewed_at?: string | null;
          answered_at?: string | null;
          escalated_at?: string | null;
          escalation_due_at?: string | null;
          escalation_level?: number;
          closed_at?: string | null;
          acknowledged_at?: string | null;
        };
        Relationships: [];
      };
      help_responses: {
        Row: {
          id: string;
          help_request_id: string;
          responder_id: string;
          quick_reply_type: QuickReplyTypeDb | null;
          free_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          help_request_id: string;
          responder_id: string;
          quick_reply_type?: QuickReplyTypeDb | null;
          free_text?: string | null;
          created_at?: string;
        };
        Update: {
          quick_reply_type?: QuickReplyTypeDb | null;
          free_text?: string | null;
        };
        Relationships: [];
      };
      calendar_events: {
        Row: {
          id: string;
          family_group_id: string;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_group_id: string;
          title: string;
          description?: string | null;
          start_time: string;
          end_time?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          start_time?: string;
          end_time?: string | null;
        };
        Relationships: [];
      };
      activity_status: {
        Row: {
          user_id: string;
          last_seen_at: string;
          app_opened_today: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          last_seen_at?: string;
          app_opened_today?: boolean;
          updated_at?: string;
        };
        Update: {
          last_seen_at?: string;
          app_opened_today?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      group_invitations: {
        Row: {
          id: string;
          family_group_id: string;
          invited_email: string;
          invited_role: MemberRoleDb;
          token: string;
          expires_at: string;
          accepted_at: string | null;
          created_by: string | null;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_group_id: string;
          invited_email: string;
          invited_role?: MemberRoleDb;
          token?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_by?: string | null;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: {
          invited_role?: MemberRoleDb;
          expires_at?: string;
          accepted_at?: string | null;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      notification_tokens: {
        Row: {
          id: string;
          user_id: string;
          expo_push_token: string;
          platform: string | null;
          created_at: string;
          updated_at: string;
          last_used_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          expo_push_token: string;
          platform?: string | null;
          created_at?: string;
          updated_at?: string;
          last_used_at?: string | null;
        };
        Update: {
          expo_push_token?: string;
          platform?: string | null;
          updated_at?: string;
          last_used_at?: string | null;
        };
        Relationships: [];
      };
      notification_log: {
        Row: {
          id: string;
          user_id: string | null;
          type: string;
          related_help_request_id: string | null;
          status: string;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type: string;
          related_help_request_id?: string | null;
          status: string;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          status?: string;
          error_message?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_pairing_code: {
        Args: { p_group: string; p_role?: MemberRoleDb };
        Returns: Json;
      };
      pair_with_code: { Args: { p_code: string }; Returns: Json };
      is_group_member: { Args: { g: string }; Returns: boolean };
      shares_group_with: { Args: { other: string }; Returns: boolean };
      request_group: { Args: { req: string }; Returns: string };
      is_primary_contact: { Args: { g: string }; Returns: boolean };
      transfer_primary_contact: { Args: { p_group: string; p_new_user: string }; Returns: undefined };
      accept_group_invitation: { Args: { p_token: string }; Returns: Json };
      create_family_group: { Args: { p_name: string }; Returns: string };
    };
    Enums: {
      app_role: AppRole;
      member_role: MemberRoleDb;
      request_status: RequestStatusDb;
      quick_reply_type: QuickReplyTypeDb;
    };
    CompositeTypes: Record<string, never>;
  };
};

/** Hjelpetyper for å hente Row/Insert/Update enkelt. */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
