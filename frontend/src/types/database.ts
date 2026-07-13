export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type JobStatus =
  | "NEW"
  | "SAVED"
  | "APPLIED"
  | "INTERVIEW"
  | "REJECTED"
  | "OFFER"
  | "HIDDEN";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string | null;
          email: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      preferences: {
        Row: {
          id: string;
          user_id: string;
          skills: Json;
          preferred_locations: Json;
          preferred_keywords: Json;
          remote_only: boolean;
          top_companies: Json;
          excluded_keywords: Json;
          min_score: number;
          max_job_age_hours: number;
          resume_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          skills?: Json;
          preferred_locations?: Json;
          preferred_keywords?: Json;
          remote_only?: boolean;
          top_companies?: Json;
          excluded_keywords?: Json;
          min_score?: number;
          max_job_age_hours?: number;
          resume_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          skills?: Json;
          preferred_locations?: Json;
          preferred_keywords?: Json;
          remote_only?: boolean;
          top_companies?: Json;
          excluded_keywords?: Json;
          min_score?: number;
          max_job_age_hours?: number;
          resume_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          external_id: string;
          job_hash: string;
          title: string;
          company: string;
          location: string | null;
          url: string | null;
          source: string;
          score: number;
          is_active: boolean;
          posted_at: string | null;
          description: string | null;
          match_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          external_id: string;
          job_hash: string;
          title: string;
          company: string;
          location?: string | null;
          url?: string | null;
          source: string;
          score?: number;
          is_active?: boolean;
          posted_at?: string | null;
          description?: string | null;
          match_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          external_id?: string;
          job_hash?: string;
          title?: string;
          company?: string;
          location?: string | null;
          url?: string | null;
          source?: string;
          score?: number;
          is_active?: boolean;
          posted_at?: string | null;
          description?: string | null;
          match_reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_jobs: {
        Row: {
          id: string;
          user_id: string;
          job_id: string;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_id: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_id?: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_jobs_job_id_fkey";
            columns: ["job_id"];
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_jobs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      active_job_sources: {
        Row: {
          source: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_jobs_for_user: {
        Args: {
          p_status?: string;
          p_min_score?: number;
          p_recency_cutoff?: string | null;
          p_source?: string | null;
          p_remote?: boolean;
          p_search?: string | null;
          p_sort?: string;
          p_dir?: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          id: string;
          external_id: string;
          job_hash: string;
          title: string;
          company: string;
          location: string | null;
          url: string | null;
          source: string;
          score: number;
          is_active: boolean;
          posted_at: string | null;
          description: string | null;
          match_reason: string | null;
          created_at: string;
          user_job_id: string | null;
          user_job_status: JobStatus | null;
          user_job_notes: string | null;
          user_job_updated_at: string | null;
          total_count: number;
        }[];
      };
    };
    Enums: {
      job_status: JobStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type PreferencesRow = Database["public"]["Tables"]["preferences"]["Row"];
export type Preferences = Omit<
  PreferencesRow,
  "skills" | "preferred_locations" | "preferred_keywords" | "top_companies" | "excluded_keywords"
> & {
  skills: string[];
  preferred_locations: string[];
  preferred_keywords: string[];
  top_companies: string[];
  excluded_keywords: string[];
  max_job_age_hours: number;
};
export type Job = Database["public"]["Tables"]["jobs"]["Row"];
export type UserJobRow = Database["public"]["Tables"]["user_jobs"]["Row"];
export type UserJob = Omit<UserJobRow, "status"> & {
  status: JobStatus;
};

export type JobWithUserJob = Job & {
  user_jobs: UserJob | null;
};

export type TrackedJob = UserJob & {
  job: Job;
};
