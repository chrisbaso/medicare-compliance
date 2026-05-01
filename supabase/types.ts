export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          timezone: string;
          vertical_slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          timezone?: string;
          vertical_slug?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          auth_user_id: string | null;
          organization_id: string;
          full_name: string;
          email: string;
          license_type: Database["public"]["Enums"]["license_type"];
          team: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          organization_id: string;
          full_name: string;
          email: string;
          license_type?: Database["public"]["Enums"]["license_type"];
          team?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Insert"]>;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          organization_id: string;
          first_name: string;
          last_name: string;
          dob: string | null;
          phone: string | null;
          email: string | null;
          state: string;
          preferred_contact_method: string;
          status: string;
          tags: string[];
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          first_name: string;
          last_name: string;
          dob?: string | null;
          phone?: string | null;
          email?: string | null;
          state: string;
          preferred_contact_method?: string;
          status: string;
          tags?: string[];
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          owner_user_id: string | null;
          channel: string;
          status: string;
          started_at: string;
          ended_at: string | null;
          summary: string | null;
          medicare_scope: string;
          routing_state: string;
          detected_topics: string[];
          retirement_interest_detected: boolean;
          next_step: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id: string;
          owner_user_id?: string | null;
          channel: string;
          status: string;
          started_at: string;
          ended_at?: string | null;
          summary?: string | null;
          medicare_scope: string;
          routing_state: string;
          detected_topics?: string[];
          retirement_interest_detected?: boolean;
          next_step?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>;
        Relationships: [];
      };
      conversation_messages: {
        Row: {
          id: string;
          organization_id: string;
          conversation_id: string;
          speaker_type: string;
          speaker_name: string;
          utterance: string;
          spoken_at: string;
          sequence_number: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          conversation_id: string;
          speaker_type: string;
          speaker_name: string;
          utterance: string;
          spoken_at: string;
          sequence_number: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["conversation_messages"]["Insert"]>;
        Relationships: [];
      };
      consents: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          conversation_id: string | null;
          retirement_opportunity_id: string | null;
          consent_type: string;
          category: Database["public"]["Enums"]["consent_category"];
          status: Database["public"]["Enums"]["consent_status"];
          disclosure_version: string;
          channel: string;
          captured_at: string;
          captured_by_user_id: string | null;
          source: string;
          capture_method: string;
          evidence_ref: string | null;
          evidence_complete: boolean;
          notes: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id: string;
          conversation_id?: string | null;
          retirement_opportunity_id?: string | null;
          consent_type: string;
          category: Database["public"]["Enums"]["consent_category"];
          status: Database["public"]["Enums"]["consent_status"];
          disclosure_version: string;
          channel: string;
          captured_at: string;
          captured_by_user_id?: string | null;
          source: string;
          capture_method: string;
          evidence_ref?: string | null;
          evidence_complete?: boolean;
          notes?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["consents"]["Insert"]>;
        Relationships: [];
      };
      workflow_states: {
        Row: {
          id: string;
          organization_id: string;
          domain: Database["public"]["Enums"]["workflow_domain"];
          entity_type: string;
          entity_id: string;
          state: string;
          updated_by_user_id: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          domain: Database["public"]["Enums"]["workflow_domain"];
          entity_type: string;
          entity_id: string;
          state: string;
          updated_by_user_id?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workflow_states"]["Insert"]>;
        Relationships: [];
      };
      workflow_transitions: {
        Row: {
          id: string;
          organization_id: string;
          workflow_state_id: string;
          from_state: string;
          to_state: string;
          action: string;
          actor_user_id: string | null;
          source: string;
          consent_status_snapshot: string | null;
          next_action: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          workflow_state_id: string;
          from_state: string;
          to_state: string;
          action: string;
          actor_user_id?: string | null;
          source: string;
          consent_status_snapshot?: string | null;
          next_action?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workflow_transitions"]["Insert"]>;
        Relationships: [];
      };
      compliance_flags: {
        Row: {
          id: string;
          organization_id: string;
          conversation_id: string;
          client_id: string;
          flag_type: string;
          severity: Database["public"]["Enums"]["flag_severity"];
          status: Database["public"]["Enums"]["flag_status"];
          rule_id: string;
          transcript_offset_start: number | null;
          transcript_offset_end: number | null;
          quoted_text: string | null;
          reasoning: string;
          suggested_remediation: string;
          detected_by: string;
          assigned_user_id: string | null;
          reviewer_user_id: string | null;
          reviewer_reason: string | null;
          flagged_at: string;
          reviewed_at: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          organization_id: string;
          conversation_id: string;
          client_id: string;
          flag_type: string;
          severity: Database["public"]["Enums"]["flag_severity"];
          status?: Database["public"]["Enums"]["flag_status"];
          rule_id: string;
          transcript_offset_start?: number | null;
          transcript_offset_end?: number | null;
          quoted_text?: string | null;
          reasoning: string;
          suggested_remediation: string;
          detected_by: string;
          assigned_user_id?: string | null;
          reviewer_user_id?: string | null;
          reviewer_reason?: string | null;
          flagged_at?: string;
          reviewed_at?: string | null;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["compliance_flags"]["Insert"]>;
        Relationships: [];
      };
      retirement_opportunities: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          source_conversation_id: string;
          signal_type: string;
          signal_summary: string;
          status: string;
          explicit_consent_status: Database["public"]["Enums"]["consent_status"];
          assigned_user_id: string | null;
          requested_at: string;
          last_updated_at: string;
          next_step: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id: string;
          source_conversation_id: string;
          signal_type: string;
          signal_summary: string;
          status: string;
          explicit_consent_status?: Database["public"]["Enums"]["consent_status"];
          assigned_user_id?: string | null;
          requested_at?: string;
          last_updated_at?: string;
          next_step: string;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["retirement_opportunities"]["Insert"]>;
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string | null;
          source_type: string;
          source_id: string;
          title: string;
          queue: string;
          status: Database["public"]["Enums"]["task_status"];
          priority: Database["public"]["Enums"]["task_priority"];
          assigned_user_id: string | null;
          due_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id?: string | null;
          source_type: string;
          source_id: string;
          title: string;
          queue: string;
          status?: Database["public"]["Enums"]["task_status"];
          priority?: Database["public"]["Enums"]["task_priority"];
          assigned_user_id?: string | null;
          due_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          organization_id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          actor_user_id: string | null;
          actor_role: string | null;
          event_at: string;
          source: string;
          correlation_id: string;
          before_state: Json | null;
          after_state: Json | null;
          consent_status_snapshot: string | null;
          next_action: string | null;
          detail: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          organization_id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          actor_user_id?: string | null;
          actor_role?: string | null;
          event_at?: string;
          source: string;
          correlation_id: string;
          before_state?: Json | null;
          after_state?: Json | null;
          consent_status_snapshot?: string | null;
          next_action?: string | null;
          detail: string;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_org_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      current_user_roles: {
        Args: Record<string, never>;
        Returns: Database["public"]["Enums"]["app_role"][];
      };
      prevent_update_delete: {
        Args: Record<string, never>;
        Returns: never;
      };
    };
    Enums: {
      app_role: "admin" | "manager" | "agent" | "compliance_reviewer" | "service_staff";
      license_type: "none" | "medicare_only" | "life_health" | "series65_plus";
      consent_status: "granted" | "revoked" | "pending" | "expired";
      consent_category: "medicare" | "separate_retirement_follow_up";
      flag_status: "open" | "confirmed" | "dismissed" | "resolved" | "escalated";
      flag_severity: "low" | "medium" | "high" | "critical";
      workflow_domain: "medicare" | "separate_retirement_follow_up";
      task_status: "open" | "in_progress" | "blocked" | "done";
      task_priority: "low" | "normal" | "high" | "urgent";
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

