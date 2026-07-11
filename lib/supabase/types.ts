export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: { id: string; title: string; cwd: string | null; is_running: boolean; last_activity_at: string | null; raw_json: Json | null; updated_at: string }
        Insert: Omit<Database['public']['Tables']['sessions']['Row'], 'updated_at'>
        Update: Partial<Database['public']['Tables']['sessions']['Insert']>
      }
      tasks: {
        Row: { id: string; session_id: string | null; subject: string; description: string | null; status: 'pending' | 'in_progress' | 'completed' | 'deleted'; updated_at: string }
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'updated_at'>
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>
      }
      memory_files: {
        Row: { id: string; type: 'user' | 'feedback' | 'project' | 'reference' | null; name: string; content: string | null; file_path: string | null; updated_at: string }
        Insert: Omit<Database['public']['Tables']['memory_files']['Row'], 'updated_at'>
        Update: Partial<Database['public']['Tables']['memory_files']['Insert']>
      }
      skills: {
        Row: { id: string; name: string; description: string | null; skill_md_content: string | null; updated_at: string }
        Insert: Omit<Database['public']['Tables']['skills']['Row'], 'updated_at'>
        Update: Partial<Database['public']['Tables']['skills']['Insert']>
      }
      scheduled_jobs: {
        Row: { id: string; description: string | null; cron_expression: string | null; enabled: boolean; next_run_at: string | null; last_run_at: string | null; updated_at: string }
        Insert: Omit<Database['public']['Tables']['scheduled_jobs']['Row'], 'updated_at'>
        Update: Partial<Database['public']['Tables']['scheduled_jobs']['Insert']>
      }
      jobs_board: {
        Row: { id: string; title: string; client: string | null; value_usd: number; deadline: string | null; status: 'backlog' | 'in_progress' | 'review' | 'done'; notes: string | null; created_at: string; updated_at: string }
        Insert: Omit<Database['public']['Tables']['jobs_board']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['jobs_board']['Insert']>
      }
      chat_history: {
        Row: { id: string; role: 'user' | 'assistant'; content: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['chat_history']['Row'], 'id' | 'created_at'>
        Update: never
      }
      commands: {
        Row: { id: string; type: string; payload: Json | null; executed_at: string | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['commands']['Row'], 'id' | 'created_at'>
        Update: Partial<Pick<Database['public']['Tables']['commands']['Row'], 'executed_at'>>
      }
      daemon_status: {
        Row: { id: number; last_heartbeat: string | null; is_online: boolean }
        Insert: never
        Update: Partial<Omit<Database['public']['Tables']['daemon_status']['Row'], 'id'>>
      }
      revenue_cache: {
        Row: { id: string; source: string; amount_usd: number; period: string | null; metadata: Json | null; updated_at: string }
        Insert: Omit<Database['public']['Tables']['revenue_cache']['Row'], 'updated_at'>
        Update: Partial<Database['public']['Tables']['revenue_cache']['Insert']>
      }
    }
  }
}

export type Session = Database['public']['Tables']['sessions']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type MemoryFile = Database['public']['Tables']['memory_files']['Row']
export type Skill = Database['public']['Tables']['skills']['Row']
export type ScheduledJob = Database['public']['Tables']['scheduled_jobs']['Row']
export type JobBoard = Database['public']['Tables']['jobs_board']['Row']
export type ChatMessage = Database['public']['Tables']['chat_history']['Row']
export type Command = Database['public']['Tables']['commands']['Row']
export type RevenueCache = Database['public']['Tables']['revenue_cache']['Row']
