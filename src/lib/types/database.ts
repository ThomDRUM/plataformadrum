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
      exercise_answers: {
        Row: {
          answer_text: string | null
          created_at: string | null
          id: string
          question_id: string
          submitted_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answer_text?: string | null
          created_at?: string | null
          id?: string
          question_id: string
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answer_text?: string | null
          created_at?: string | null
          id?: string
          question_id?: string
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "exercise_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_questions: {
        Row: {
          exercise_id: string
          id: string
          order_index: number
          question_text: string
        }
        Insert: {
          exercise_id: string
          id?: string
          order_index?: number
          question_text: string
        }
        Update: {
          exercise_id?: string
          id?: string
          order_index?: number
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_questions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string | null
          id: string
          instructions: string | null
          order_index: number
          title: string
          topic_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          instructions?: string | null
          order_index?: number
          title: string
          topic_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instructions?: string | null
          order_index?: number
          title?: string
          topic_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          business_name: string
          created_at: string
          history: string
          id: string
          mission: string
          name: string
          updated_at: string
          values: string
          vision: string
        }
        Insert: {
          business_name?: string
          created_at?: string
          history?: string
          id?: string
          mission?: string
          name: string
          updated_at?: string
          values?: string
          vision?: string
        }
        Update: {
          business_name?: string
          created_at?: string
          history?: string
          id?: string
          mission?: string
          name?: string
          updated_at?: string
          values?: string
          vision?: string
        }
        Relationships: []
      }
      family_asset_ownership: {
        Row: {
          asset_id: string
          family_member_id: string | null
          id: string
          member_name: string | null
          percentage: number | null
        }
        Insert: {
          asset_id: string
          family_member_id?: string | null
          id?: string
          member_name?: string | null
          percentage?: number | null
        }
        Update: {
          asset_id?: string
          family_member_id?: string | null
          id?: string
          member_name?: string | null
          percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "family_asset_ownership_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "family_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_asset_ownership_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      family_assets: {
        Row: {
          asset_type: string
          created_at: string | null
          description: string | null
          family_id: string
          id: string
          name: string
          order_index: number
          updated_at: string | null
        }
        Insert: {
          asset_type: string
          created_at?: string | null
          description?: string | null
          family_id: string
          id?: string
          name: string
          order_index?: number
          updated_at?: string | null
        }
        Update: {
          asset_type?: string
          created_at?: string | null
          description?: string | null
          family_id?: string
          id?: string
          name?: string
          order_index?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_assets_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      family_governance_items: {
        Row: {
          created_at: string | null
          domain: string
          family_id: string
          has_today: boolean | null
          id: string
          item_text: string
          order_index: number
          updated_at: string | null
          wants: boolean | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          family_id: string
          has_today?: boolean | null
          id?: string
          item_text: string
          order_index?: number
          updated_at?: string | null
          wants?: boolean | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          family_id?: string
          has_today?: boolean | null
          id?: string
          item_text?: string
          order_index?: number
          updated_at?: string | null
          wants?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "family_governance_items_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          business_role: string
          created_at: string
          family_id: string
          family_role: string
          generation: number
          id: string
          initials: string
          name: string
          notes: string
          order_index: number
          parent_id: string | null
          profile_url: string | null
          spouse_id: string | null
          updated_at: string
          works_in_business: boolean
        }
        Insert: {
          business_role?: string
          created_at?: string
          family_id: string
          family_role?: string
          generation?: number
          id?: string
          initials?: string
          name?: string
          notes?: string
          order_index?: number
          parent_id?: string | null
          profile_url?: string | null
          spouse_id?: string | null
          updated_at?: string
          works_in_business?: boolean
        }
        Update: {
          business_role?: string
          created_at?: string
          family_id?: string
          family_role?: string
          generation?: number
          id?: string
          initials?: string
          name?: string
          notes?: string
          order_index?: number
          parent_id?: string | null
          profile_url?: string | null
          spouse_id?: string | null
          updated_at?: string
          works_in_business?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_spouse_id_fkey"
            columns: ["spouse_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_answer_notes: {
        Row: {
          answer_id: string
          created_at: string | null
          id: string
          mentor_id: string
          note: string
          updated_at: string | null
        }
        Insert: {
          answer_id: string
          created_at?: string | null
          id?: string
          mentor_id: string
          note: string
          updated_at?: string | null
        }
        Update: {
          answer_id?: string
          created_at?: string | null
          id?: string
          mentor_id?: string
          note?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentor_answer_notes_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "exercise_answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_answer_notes_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_projects: {
        Row: {
          created_at: string
          id: string
          mentor_id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mentor_id: string
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mentor_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_projects_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string | null
          id: string
          intention: string | null
          order_index: number
          title: string
          trail_id: string
          updated_at: string | null
          why: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          intention?: string | null
          order_index?: number
          title: string
          trail_id: string
          updated_at?: string | null
          why?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          intention?: string | null
          order_index?: number
          title?: string
          trail_id?: string
          updated_at?: string | null
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_trail_id_fkey"
            columns: ["trail_id"]
            isOneToOne: false
            referencedRelation: "trails"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          project_id: string | null
          role: string
          student_type: string | null
          termometro_pdf_url: string | null
          trail_id: string | null
          yearly_intention: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          project_id?: string | null
          role?: string
          student_type?: string | null
          termometro_pdf_url?: string | null
          trail_id?: string | null
          yearly_intention?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          project_id?: string | null
          role?: string
          student_type?: string | null
          termometro_pdf_url?: string | null
          trail_id?: string | null
          yearly_intention?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_desired_outcomes: {
        Row: {
          created_at: string
          id: string
          order_index: number
          project_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_index?: number
          project_id: string
          text?: string
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number
          project_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_desired_outcomes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_events: {
        Row: {
          created_at: string
          date: string | null
          id: string
          notes: string
          schedule_id: string
          title: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          id?: string
          notes?: string
          schedule_id: string
          title?: string
        }
        Update: {
          created_at?: string
          date?: string | null
          id?: string
          notes?: string
          schedule_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_events_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "project_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      project_meetings: {
        Row: {
          created_at: string | null
          id: string
          meeting_date: string | null
          name: string
          notes: string | null
          participantes: string | null
          perguntas_principais: string | null
          project_id: string
          proposito: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          meeting_date?: string | null
          name: string
          notes?: string | null
          participantes?: string | null
          perguntas_principais?: string | null
          project_id: string
          proposito?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          meeting_date?: string | null
          name?: string
          notes?: string | null
          participantes?: string | null
          perguntas_principais?: string | null
          project_id?: string
          proposito?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_overview: {
        Row: {
          created_at: string
          id: string
          intention: string
          mwta: string
          point_a: string
          point_b: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          intention?: string
          mwta?: string
          point_a?: string
          point_b?: string
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          intention?: string
          mwta?: string
          point_a?: string
          point_b?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_overview_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_roles: {
        Row: {
          created_at: string
          description: string
          id: string
          order_index: number
          person_name: string
          project_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          order_index?: number
          person_name?: string
          project_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          order_index?: number
          person_name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_roles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_rules: {
        Row: {
          created_at: string
          description: string
          id: string
          order_index: number
          project_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          order_index?: number
          project_id: string
          title?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          order_index?: number
          project_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_rules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_schedule: {
        Row: {
          created_at: string
          end_date: string | null
          has_events: boolean
          id: string
          mentor_notes: string
          order_index: number
          project_id: string
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          has_events?: boolean
          id?: string
          mentor_notes?: string
          order_index?: number
          project_id: string
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          has_events?: boolean
          id?: string
          mentor_notes?: string
          order_index?: number
          project_id?: string
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_schedule_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          duration_months: number | null
          end_date: string | null
          family_id: string
          id: string
          name: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_months?: number | null
          end_date?: string | null
          family_id: string
          id?: string
          name: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_months?: number | null
          end_date?: string | null
          family_id?: string
          id?: string
          name?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      repertoire_items: {
        Row: {
          content_html: string | null
          content_type: string
          created_at: string | null
          id: string
          order_index: number
          title: string
          topic_id: string
          updated_at: string | null
          youtube_url: string | null
        }
        Insert: {
          content_html?: string | null
          content_type: string
          created_at?: string | null
          id?: string
          order_index?: number
          title: string
          topic_id: string
          updated_at?: string | null
          youtube_url?: string | null
        }
        Update: {
          content_html?: string | null
          content_type?: string
          created_at?: string | null
          id?: string
          order_index?: number
          title?: string
          topic_id?: string
          updated_at?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repertoire_items_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string | null
          id: string
          learning_objective: string | null
          module_id: string
          order_index: number
          title: string
          updated_at: string | null
          why: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          learning_objective?: string | null
          module_id: string
          order_index?: number
          title: string
          updated_at?: string | null
          why?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          learning_objective?: string | null
          module_id?: string
          order_index?: number
          title?: string
          updated_at?: string | null
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topics_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      trails: {
        Row: {
          created_at: string | null
          id: string
          intention: string | null
          title: string
          trail_type: string
          updated_at: string | null
          why: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          intention?: string | null
          title: string
          trail_type: string
          updated_at?: string | null
          why?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          intention?: string | null
          title?: string
          trail_type?: string
          updated_at?: string | null
          why?: string | null
        }
        Relationships: []
      }
      user_module_access: {
        Row: {
          created_at: string | null
          force_unlocked: boolean | null
          force_unlocked_at: string | null
          force_unlocked_by: string | null
          id: string
          module_id: string
          unlock_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          force_unlocked?: boolean | null
          force_unlocked_at?: string | null
          force_unlocked_by?: string | null
          id?: string
          module_id: string
          unlock_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          force_unlocked?: boolean | null
          force_unlocked_at?: string | null
          force_unlocked_by?: string | null
          id?: string
          module_id?: string
          unlock_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_access_force_unlocked_by_fkey"
            columns: ["force_unlocked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_module_access_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_module_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_topic_progress: {
        Row: {
          completed_at: string | null
          exercise_completed: boolean | null
          id: string
          repertoire_viewed: boolean | null
          topic_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          exercise_completed?: boolean | null
          id?: string
          repertoire_viewed?: boolean | null
          topic_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          exercise_completed?: boolean | null
          id?: string
          repertoire_viewed?: boolean | null
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_topic_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_topic_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: { Args: never; Returns: string }
      is_mentor_of_project: { Args: { p_project_id: string }; Returns: boolean }
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
