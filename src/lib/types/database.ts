export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: { checked: boolean; created_at: string; id: string; order_index: number; title: string; user_id: string }
        Insert: { checked?: boolean; created_at?: string; id?: string; order_index?: number; title: string; user_id: string }
        Update: { checked?: boolean; created_at?: string; id?: string; order_index?: number; title?: string; user_id?: string }
        Relationships: [{ foreignKeyName: "achievements_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      competencies: {
        Row: { created_at: string; description: string | null; drum_vision: string | null; id: string; module_id: string; order_index: number; title: string }
        Insert: { created_at?: string; description?: string | null; drum_vision?: string | null; id?: string; module_id: string; order_index?: number; title: string }
        Update: { created_at?: string; description?: string | null; drum_vision?: string | null; id?: string; module_id?: string; order_index?: number; title?: string }
        Relationships: [{ foreignKeyName: "competencies_module_id_fkey"; columns: ["module_id"]; isOneToOne: false; referencedRelation: "modules"; referencedColumns: ["id"] }]
      }
      deliverable_submissions: {
        Row: { deliverable_id: string; external_link: string | null; file_name: string | null; file_url: string | null; id: string; status: string; text_content: string | null; updated_at: string; user_id: string }
        Insert: { deliverable_id: string; external_link?: string | null; file_name?: string | null; file_url?: string | null; id?: string; status?: string; text_content?: string | null; updated_at?: string; user_id: string }
        Update: { deliverable_id?: string; external_link?: string | null; file_name?: string | null; file_url?: string | null; id?: string; status?: string; text_content?: string | null; updated_at?: string; user_id?: string }
        Relationships: [{ foreignKeyName: "deliverable_submissions_deliverable_id_fkey"; columns: ["deliverable_id"]; isOneToOne: false; referencedRelation: "deliverables"; referencedColumns: ["id"] }, { foreignKeyName: "deliverable_submissions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      deliverables: {
        Row: { competency_id: string; created_at: string; id: string; instructions_html: string | null; is_primary: boolean; title: string }
        Insert: { competency_id: string; created_at?: string; id?: string; instructions_html?: string | null; is_primary?: boolean; title: string }
        Update: { competency_id?: string; created_at?: string; id?: string; instructions_html?: string | null; is_primary?: boolean; title?: string }
        Relationships: [{ foreignKeyName: "deliverables_competency_id_fkey"; columns: ["competency_id"]; isOneToOne: false; referencedRelation: "competencies"; referencedColumns: ["id"] }]
      }
      families: {
        Row: { business_name: string; created_at: string; history: string; id: string; mission: string; name: string; updated_at: string; values: string; vision: string }
        Insert: { business_name?: string; created_at?: string; history?: string; id?: string; mission?: string; name: string; updated_at?: string; values?: string; vision?: string }
        Update: { business_name?: string; created_at?: string; history?: string; id?: string; mission?: string; name?: string; updated_at?: string; values?: string; vision?: string }
        Relationships: []
      }
      family_members: {
        Row: { business_role: string; created_at: string; family_id: string; family_role: string; generation: number; id: string; initials: string; name: string; notes: string; parent_id: string | null; updated_at: string; works_in_business: boolean }
        Insert: { business_role?: string; created_at?: string; family_id: string; family_role?: string; generation?: number; id?: string; initials?: string; name?: string; notes?: string; parent_id?: string | null; updated_at?: string; works_in_business?: boolean }
        Update: { business_role?: string; created_at?: string; family_id?: string; family_role?: string; generation?: number; id?: string; initials?: string; name?: string; notes?: string; parent_id?: string | null; updated_at?: string; works_in_business?: boolean }
        Relationships: [{ foreignKeyName: "family_members_family_id_fkey"; columns: ["family_id"]; isOneToOne: false; referencedRelation: "families"; referencedColumns: ["id"] }, { foreignKeyName: "family_members_parent_id_fkey"; columns: ["parent_id"]; isOneToOne: false; referencedRelation: "family_members"; referencedColumns: ["id"] }]
      }
      mentor_projects: {
        Row: { created_at: string; id: string; mentor_id: string; project_id: string }
        Insert: { created_at?: string; id?: string; mentor_id: string; project_id: string }
        Update: { created_at?: string; id?: string; mentor_id?: string; project_id?: string }
        Relationships: [{ foreignKeyName: "mentor_projects_mentor_id_fkey"; columns: ["mentor_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }, { foreignKeyName: "mentor_projects_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "projects"; referencedColumns: ["id"] }]
      }
      modules: {
        Row: { created_at: string; id: string; order_index: number; short_context: string | null; title: string; trail_id: string }
        Insert: { created_at?: string; id?: string; order_index?: number; short_context?: string | null; title: string; trail_id: string }
        Update: { created_at?: string; id?: string; order_index?: number; short_context?: string | null; title?: string; trail_id?: string }
        Relationships: [{ foreignKeyName: "modules_trail_id_fkey"; columns: ["trail_id"]; isOneToOne: false; referencedRelation: "trails"; referencedColumns: ["id"] }]
      }
      profiles: {
        Row: { created_at: string; full_name: string; id: string; project_id: string | null; role: string; trail_id: string | null; yearly_intention: string | null }
        Insert: { created_at?: string; full_name: string; id: string; project_id?: string | null; role?: string; trail_id?: string | null; yearly_intention?: string | null }
        Update: { created_at?: string; full_name?: string; id?: string; project_id?: string | null; role?: string; trail_id?: string | null; yearly_intention?: string | null }
        Relationships: [{ foreignKeyName: "profiles_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "projects"; referencedColumns: ["id"] }, { foreignKeyName: "profiles_trail_id_fkey"; columns: ["trail_id"]; isOneToOne: false; referencedRelation: "trails"; referencedColumns: ["id"] }]
      }
      project_desired_outcomes: {
        Row: { created_at: string; id: string; order_index: number; project_id: string; text: string }
        Insert: { created_at?: string; id?: string; order_index?: number; project_id: string; text?: string }
        Update: { created_at?: string; id?: string; order_index?: number; project_id?: string; text?: string }
        Relationships: [{ foreignKeyName: "project_desired_outcomes_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "projects"; referencedColumns: ["id"] }]
      }
      project_events: {
        Row: { created_at: string; date: string | null; id: string; notes: string; schedule_id: string; title: string }
        Insert: { created_at?: string; date?: string | null; id?: string; notes?: string; schedule_id: string; title?: string }
        Update: { created_at?: string; date?: string | null; id?: string; notes?: string; schedule_id?: string; title?: string }
        Relationships: [{ foreignKeyName: "project_events_schedule_id_fkey"; columns: ["schedule_id"]; isOneToOne: false; referencedRelation: "project_schedule"; referencedColumns: ["id"] }]
      }
      project_overview: {
        Row: { created_at: string; id: string; intention: string; mwta: string; point_a: string; point_b: string; project_id: string; updated_at: string }
        Insert: { created_at?: string; id?: string; intention?: string; mwta?: string; point_a?: string; point_b?: string; project_id: string; updated_at?: string }
        Update: { created_at?: string; id?: string; intention?: string; mwta?: string; point_a?: string; point_b?: string; project_id?: string; updated_at?: string }
        Relationships: [{ foreignKeyName: "project_overview_project_id_fkey"; columns: ["project_id"]; isOneToOne: true; referencedRelation: "projects"; referencedColumns: ["id"] }]
      }
      project_roles: {
        Row: { created_at: string; description: string; id: string; order_index: number; person_name: string; project_id: string }
        Insert: { created_at?: string; description?: string; id?: string; order_index?: number; person_name?: string; project_id: string }
        Update: { created_at?: string; description?: string; id?: string; order_index?: number; person_name?: string; project_id?: string }
        Relationships: [{ foreignKeyName: "project_roles_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "projects"; referencedColumns: ["id"] }]
      }
      project_rules: {
        Row: { created_at: string; description: string; id: string; order_index: number; project_id: string; title: string }
        Insert: { created_at?: string; description?: string; id?: string; order_index?: number; project_id: string; title?: string }
        Update: { created_at?: string; description?: string; id?: string; order_index?: number; project_id?: string; title?: string }
        Relationships: [{ foreignKeyName: "project_rules_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "projects"; referencedColumns: ["id"] }]
      }
      project_schedule: {
        Row: { created_at: string; end_date: string | null; has_events: boolean; id: string; mentor_notes: string; order_index: number; project_id: string; start_date: string | null; status: string; title: string; updated_at: string }
        Insert: { created_at?: string; end_date?: string | null; has_events?: boolean; id?: string; mentor_notes?: string; order_index?: number; project_id: string; start_date?: string | null; status?: string; title: string; updated_at?: string }
        Update: { created_at?: string; end_date?: string | null; has_events?: boolean; id?: string; mentor_notes?: string; order_index?: number; project_id?: string; start_date?: string | null; status?: string; title?: string; updated_at?: string }
        Relationships: [{ foreignKeyName: "project_schedule_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "projects"; referencedColumns: ["id"] }]
      }
      projects: {
        Row: { created_at: string; duration_months: number | null; end_date: string | null; family_id: string; id: string; name: string; start_date: string | null; status: string; updated_at: string }
        Insert: { created_at?: string; duration_months?: number | null; end_date?: string | null; family_id: string; id?: string; name: string; start_date?: string | null; status?: string; updated_at?: string }
        Update: { created_at?: string; duration_months?: number | null; end_date?: string | null; family_id?: string; id?: string; name?: string; start_date?: string | null; status?: string; updated_at?: string }
        Relationships: [{ foreignKeyName: "projects_family_id_fkey"; columns: ["family_id"]; isOneToOne: false; referencedRelation: "families"; referencedColumns: ["id"] }]
      }
      reflection_answers: {
        Row: { answer_text: string; id: string; question_id: string; updated_at: string; user_id: string }
        Insert: { answer_text?: string; id?: string; question_id: string; updated_at?: string; user_id: string }
        Update: { answer_text?: string; id?: string; question_id?: string; updated_at?: string; user_id?: string }
        Relationships: [{ foreignKeyName: "reflection_answers_question_id_fkey"; columns: ["question_id"]; isOneToOne: false; referencedRelation: "reflection_questions"; referencedColumns: ["id"] }, { foreignKeyName: "reflection_answers_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      reflection_questions: {
        Row: { id: string; order_index: number; question_text: string; reflection_id: string }
        Insert: { id?: string; order_index?: number; question_text: string; reflection_id: string }
        Update: { id?: string; order_index?: number; question_text?: string; reflection_id?: string }
        Relationships: [{ foreignKeyName: "reflection_questions_reflection_id_fkey"; columns: ["reflection_id"]; isOneToOne: false; referencedRelation: "reflections"; referencedColumns: ["id"] }]
      }
      reflections: {
        Row: { competency_id: string; context: string | null; created_at: string; id: string; is_required: boolean; title: string }
        Insert: { competency_id: string; context?: string | null; created_at?: string; id?: string; is_required?: boolean; title: string }
        Update: { competency_id?: string; context?: string | null; created_at?: string; id?: string; is_required?: boolean; title?: string }
        Relationships: [{ foreignKeyName: "reflections_competency_id_fkey"; columns: ["competency_id"]; isOneToOne: false; referencedRelation: "competencies"; referencedColumns: ["id"] }]
      }
      repertoire_items: {
        Row: { competency_id: string; content_html: string | null; created_at: string; external_url: string | null; full_summary: string | null; id: string; level: number; material_type: string | null; short_summary: string | null; title: string; type: string }
        Insert: { competency_id: string; content_html?: string | null; created_at?: string; external_url?: string | null; full_summary?: string | null; id?: string; level?: number; material_type?: string | null; short_summary?: string | null; title: string; type?: string }
        Update: { competency_id?: string; content_html?: string | null; created_at?: string; external_url?: string | null; full_summary?: string | null; id?: string; level?: number; material_type?: string | null; short_summary?: string | null; title?: string; type?: string }
        Relationships: [{ foreignKeyName: "repertoire_items_competency_id_fkey"; columns: ["competency_id"]; isOneToOne: false; referencedRelation: "competencies"; referencedColumns: ["id"] }]
      }
      trails: {
        Row: { created_at: string; description: string | null; id: string; name: string }
        Insert: { created_at?: string; description?: string | null; id?: string; name: string }
        Update: { created_at?: string; description?: string | null; id?: string; name?: string }
        Relationships: []
      }
      user_module_status: {
        Row: { id: string; module_id: string; status: string; updated_at: string; user_id: string }
        Insert: { id?: string; module_id: string; status?: string; updated_at?: string; user_id: string }
        Update: { id?: string; module_id?: string; status?: string; updated_at?: string; user_id?: string }
        Relationships: [{ foreignKeyName: "user_module_status_module_id_fkey"; columns: ["module_id"]; isOneToOne: false; referencedRelation: "modules"; referencedColumns: ["id"] }, { foreignKeyName: "user_module_status_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      user_repertoire_consumed: {
        Row: { consumed_at: string; repertoire_item_id: string; user_id: string }
        Insert: { consumed_at?: string; repertoire_item_id: string; user_id: string }
        Update: { consumed_at?: string; repertoire_item_id?: string; user_id?: string }
        Relationships: [{ foreignKeyName: "user_repertoire_consumed_repertoire_item_id_fkey"; columns: ["repertoire_item_id"]; isOneToOne: false; referencedRelation: "repertoire_items"; referencedColumns: ["id"] }, { foreignKeyName: "user_repertoire_consumed_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      current_user_role: { Args: never; Returns: string }
      is_mentor_of_project: { Args: { p_project_id: string }; Returns: boolean }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends { Row: infer R } ? R : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends { Row: infer R } ? R : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Insert: infer I } ? I : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Insert: infer I } ? I : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Update: infer U } ? U : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Update: infer U } ? U : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"] : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"] : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: { Enums: {} },
} as const
