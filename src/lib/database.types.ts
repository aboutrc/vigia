export interface Database {
  public: {
    Tables: {
      recordings: {
        Row: {
          id: string;
          recording_url: string;
          created_at: string;
          location: string;
          public_url: string;
          session_id: string;
        };
        Insert: {
          id?: string;
          recording_url: string;
          created_at?: string;
          location?: string;
          public_url: string;
          session_id: string;
        };
        Update: {
          id?: string;
          recording_url?: string;
          created_at?: string;
          location?: string;
          public_url?: string;
          session_id?: string;
        };
      };
      markers: {
        Row: {
          id: string;
          category: string;
          latitude: number;
          longitude: number;
          created_at: string;
          user_id: string | null;
          active: boolean;
          last_confirmed: string;
          confirmations_count: number;
          last_status_change: string;
          reliability_score: number;
          negative_confirmations: number;
        };
      };
    };
  };
}