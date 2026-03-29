export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          username: string | null;
          avatar_url: string | null;
          total_fluency_score: number;
          current_streak: number;
          longest_streak: number;
          culture_badges: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          username?: string | null;
          avatar_url?: string | null;
          total_fluency_score?: number;
          current_streak?: number;
          longest_streak?: number;
          culture_badges?: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          username?: string | null;
          avatar_url?: string | null;
          total_fluency_score?: number;
          current_streak?: number;
          longest_streak?: number;
          culture_badges?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      game_records: {
        Row: {
          id: string;
          user_id: string;
          game_name: string;
          score: number;
          difficulty: string | null;
          correct_count: number | null;
          total_questions: number | null;
          played_at: string;
          grammar_topics: string | null;
          listening_topics: string | null;
          culture_quest_snapshot: string | null;
          won: boolean | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_name: string;
          score: number;
          difficulty?: string | null;
          correct_count?: number | null;
          total_questions?: number | null;
          played_at?: string;
          grammar_topics?: string | null;
          listening_topics?: string | null;
          culture_quest_snapshot?: string | null;
          won?: boolean | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_name?: string;
          score?: number;
          difficulty?: string | null;
          correct_count?: number | null;
          total_questions?: number | null;
          played_at?: string;
          grammar_topics?: string | null;
          listening_topics?: string | null;
          culture_quest_snapshot?: string | null;
          won?: boolean | null;
        };
        Relationships: [];
      };
      user_follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      saved_vocab: {
        Row: {
          id: string;
          user_id: string;
          spanish_word: string;
          english_translation: string;
          last_reviewed: string | null;
          mastery_level: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          spanish_word: string;
          english_translation: string;
          last_reviewed?: string | null;
          mastery_level?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          spanish_word?: string;
          english_translation?: string;
          last_reviewed?: string | null;
          mastery_level?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          user_id: string;
          preferred_dialect: string | null;
          difficulty_preference: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          preferred_dialect?: string | null;
          difficulty_preference?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          preferred_dialect?: string | null;
          difficulty_preference?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      leaderboard_palabra_bests: {
        Args: { p_difficulty: string; p_since: string | null };
        Returns: { user_id: string; best_score: number }[];
      };
      leaderboard_grammar_wins: {
        Args: { p_since: string | null };
        Returns: { user_id: string; wins: number }[];
      };
      leaderboard_weekly_activity: {
        Args: { p_since: string };
        Returns: { user_id: string; games_played: number }[];
      };
    };
    Enums: Record<string, never>;
  };
};
