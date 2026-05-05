// PLACEHOLDER until Supabase local can be started.
// Regenerate with:  npx supabase gen types typescript --local > lib/types/database.ts
// Schema source of truth: supabase/migrations/20260505_initial.sql

export type UserRole = "member" | "trainer" | "admin";
export type CheckinType = "personal" | "self";
export type AvatarState = "normal" | "lonely" | "celebrating";
export type FeedbackType = "comment" | "like";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; role: UserRole; display_name: string; created_at: string };
        Insert: { id: string; role?: UserRole; display_name: string; created_at?: string };
        Update: Partial<{ role: UserRole; display_name: string }>;
        Relationships: [];
      };
      members: {
        Row: { user_id: string; current_xp: number; current_level: number; joined_at: string };
        Insert: { user_id: string; current_xp?: number; current_level?: number; joined_at?: string };
        Update: Partial<{ current_xp: number; current_level: number }>;
        Relationships: [];
      };
      avatars: {
        Row: {
          member_id: string;
          name: string;
          hatched_at: string;
          current_skin: string;
          state: AvatarState;
        };
        Insert: {
          member_id: string;
          name: string;
          hatched_at?: string;
          current_skin?: string;
          state?: AvatarState;
        };
        Update: Partial<{ name: string; current_skin: string; state: AvatarState }>;
        Relationships: [];
      };
      check_ins: {
        Row: {
          id: string;
          member_id: string;
          date: string;
          type: CheckinType;
          points_awarded: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          date?: string;
          type: CheckinType;
          points_awarded?: number;
          created_at?: string;
        };
        Update: Partial<{ date: string; type: CheckinType }>;
        Relationships: [];
      };
      weights: {
        Row: {
          id: string;
          member_id: string;
          date: string;
          weight_kg: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          date?: string;
          weight_kg: number;
          created_at?: string;
        };
        Update: Partial<{ date: string; weight_kg: number }>;
        Relationships: [];
      };
      trainings: {
        Row: {
          id: string;
          member_id: string;
          date: string;
          content: string;
          duration_min: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          date?: string;
          content: string;
          duration_min: number;
          created_at?: string;
        };
        Update: Partial<{ date: string; content: string; duration_min: number }>;
        Relationships: [];
      };
      feedbacks: {
        Row: {
          id: string;
          training_id: string;
          trainer_id: string;
          type: FeedbackType;
          content: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          training_id: string;
          trainer_id: string;
          type?: FeedbackType;
          content?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          type: FeedbackType;
          content: string | null;
          read_at: string | null;
        }>;
        Relationships: [];
      };
      streaks: {
        Row: {
          member_id: string;
          current_streak: number;
          longest_streak: number;
          last_activity_date: string | null;
        };
        Insert: {
          member_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
        };
        Update: Partial<{
          current_streak: number;
          longest_streak: number;
          last_activity_date: string | null;
        }>;
        Relationships: [];
      };
      badges: {
        Row: { id: string; member_id: string; badge_type: string; earned_at: string };
        Insert: { id?: string; member_id: string; badge_type: string; earned_at?: string };
        Update: Partial<{ badge_type: string }>;
        Relationships: [];
      };
      point_settings: {
        Row: {
          id: number;
          personal_points: number;
          self_points: number;
          weight_log_points: number;
          training_log_points: number;
          trainer_like_bonus: number;
          updated_at: string;
        };
        Insert: { id?: number };
        Update: Partial<{
          personal_points: number;
          self_points: number;
          weight_log_points: number;
          training_log_points: number;
          trainer_like_bonus: number;
        }>;
        Relationships: [];
      };
      level_thresholds: {
        Row: { level: number; xp_required: number; skin_id: string };
        Insert: { level: number; xp_required: number; skin_id: string };
        Update: Partial<{ xp_required: number; skin_id: string }>;
        Relationships: [];
      };
      exercise_sets: {
        Row: {
          id: string;
          training_id: string;
          exercise_name: string;
          weight_kg: number | null;
          reps: number | null;
          sets: number | null;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          training_id: string;
          exercise_name: string;
          weight_kg?: number | null;
          reps?: number | null;
          sets?: number | null;
          position?: number;
          created_at?: string;
        };
        Update: Partial<{
          exercise_name: string;
          weight_kg: number | null;
          reps: number | null;
          sets: number | null;
          position: number;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      checkin_type: CheckinType;
      avatar_state: AvatarState;
      feedback_type: FeedbackType;
    };
  };
};
