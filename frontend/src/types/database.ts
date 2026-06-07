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
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
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
