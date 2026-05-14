// Hand-written DB types matching supabase/migrations/0001_initial.sql.
// If you start using `supabase gen types`, replace this with the generated file.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          handicap: number | null;
          default_ball: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          handicap?: number | null;
          default_ball?: string | null;
        };
        Update: {
          display_name?: string | null;
          handicap?: number | null;
          default_ball?: string | null;
        };
        Relationships: [];
      };
      user_clubs: {
        Row: {
          id: string;
          user_id: string;
          club_id: string;
          label: string;
          short: string;
          carry: number;
          position: number;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          club_id: string;
          label: string;
          short: string;
          carry?: number;
          position?: number;
          enabled?: boolean;
        };
        Update: {
          label?: string;
          short?: string;
          carry?: number;
          position?: number;
          enabled?: boolean;
        };
        Relationships: [];
      };
      user_balls: {
        Row: {
          id: string;
          user_id: string;
          ball_id: string;
          label: string;
          position: number;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          ball_id: string;
          label: string;
          position?: number;
          enabled?: boolean;
        };
        Update: {
          label?: string;
          position?: number;
          enabled?: boolean;
        };
        Relationships: [];
      };
      rounds: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          tee_id: string;
          ball: string | null;
          current_hole: number;
          status: "active" | "completed" | "abandoned";
          started_at: string;
          finished_at: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          course_id: string;
          tee_id: string;
          ball?: string | null;
          current_hole?: number;
          status?: "active" | "completed" | "abandoned";
        };
        Update: {
          course_id?: string;
          tee_id?: string;
          ball?: string | null;
          current_hole?: number;
          status?: "active" | "completed" | "abandoned";
          finished_at?: string | null;
        };
        Relationships: [];
      };
      round_holes: {
        Row: {
          id: string;
          round_id: string;
          hole_number: number;
          par: number;
          score: number | null;
          putts: number | null;
          fairway: boolean | null;
          gir: boolean | null;
          updated_at: string;
        };
        Insert: {
          round_id: string;
          hole_number: number;
          par: number;
          score?: number | null;
          putts?: number | null;
          fairway?: boolean | null;
          gir?: boolean | null;
        };
        Update: {
          par?: number;
          score?: number | null;
          putts?: number | null;
          fairway?: boolean | null;
          gir?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "round_holes_round_id_fkey";
            columns: ["round_id"];
            isOneToOne: false;
            referencedRelation: "rounds";
            referencedColumns: ["id"];
          },
        ];
      };
      courses: {
        Row: {
          id: string;
          name: string;
          region: string;
          par: number;
          rating: number;
          slope: number;
          holes_count: number;
          position: number;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          region: string;
          par: number;
          rating: number;
          slope: number;
          holes_count?: number;
          position?: number;
        };
        Update: {
          name?: string;
          region?: string;
          par?: number;
          rating?: number;
          slope?: number;
          holes_count?: number;
          position?: number;
        };
        Relationships: [];
      };
      course_tees: {
        Row: {
          course_id: string;
          tee_id: string;
          label: string;
          color: string;
          total: number;
        };
        Insert: {
          course_id: string;
          tee_id: string;
          label: string;
          color: string;
          total: number;
        };
        Update: {
          label?: string;
          color?: string;
          total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "course_tees_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      course_holes: {
        Row: {
          course_id: string;
          hole_number: number;
          par: number;
          stroke_index: number;
          white_m: number;
          yellow_m: number;
          red_m: number;
          layout: "straight" | "doglegLeft" | "doglegRight";
          bunkers: Json | null;
          water: Json | null;
        };
        Insert: {
          course_id: string;
          hole_number: number;
          par: number;
          stroke_index: number;
          white_m: number;
          yellow_m: number;
          red_m: number;
          layout?: "straight" | "doglegLeft" | "doglegRight";
          bunkers?: Json | null;
          water?: Json | null;
        };
        Update: {
          par?: number;
          stroke_index?: number;
          white_m?: number;
          yellow_m?: number;
          red_m?: number;
          layout?: "straight" | "doglegLeft" | "doglegRight";
          bunkers?: Json | null;
          water?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "course_holes_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      shots: {
        Row: {
          id: string;
          round_id: string;
          hole_number: number;
          n: number;
          club_id: string;
          ball_id: string | null;
          start_lie: "tee" | "fairway" | "rough" | "bunker" | "green";
          status: "in_flight" | "done";
          result: "in_play" | "out" | "hazard" | "lost" | null;
          dist: number | null;
          measured: boolean;
          lat: number | null;
          lng: number | null;
          accuracy: number | null;
          created_at: string;
        };
        Insert: {
          round_id: string;
          hole_number: number;
          n: number;
          club_id: string;
          ball_id?: string | null;
          start_lie: "tee" | "fairway" | "rough" | "bunker" | "green";
          status: "in_flight" | "done";
          result?: "in_play" | "out" | "hazard" | "lost" | null;
          dist?: number | null;
          measured?: boolean;
          lat?: number | null;
          lng?: number | null;
          accuracy?: number | null;
        };
        Update: {
          club_id?: string;
          ball_id?: string | null;
          start_lie?: "tee" | "fairway" | "rough" | "bunker" | "green";
          status?: "in_flight" | "done";
          result?: "in_play" | "out" | "hazard" | "lost" | null;
          dist?: number | null;
          measured?: boolean;
          lat?: number | null;
          lng?: number | null;
          accuracy?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "shots_round_id_fkey";
            columns: ["round_id"];
            isOneToOne: false;
            referencedRelation: "rounds";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
