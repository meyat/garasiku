/**
 * Placeholder types. Once the Supabase project is created and migrations applied, generate
 * real types with:
 *
 *   npx supabase gen types typescript --project-id <project-id> > types/database.ts
 *
 * Using a permissive shape here so the app type-checks before that's run — the generated
 * file will replace this with fully-typed Row/Insert/Update per table.
 */
export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, any>;
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, any>;
        Returns: any;
      };
    };
    Enums: {
      [key: string]: string;
    };
    CompositeTypes: {
      [key: string]: Record<string, any>;
    };
  };
}

export interface Vehicle {
  id: string;
  owner_id: string;
  variant_id: string | null;
  nickname: string;
  brand_name: string;
  model_name: string;
  variant_name: string | null;
  production_year: number | null;
  license_plate: string | null;
  current_odometer: number;
  engine_cc: number | null;
  transmission: string | null;
  fuel_type: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  photo_url: string | null;
  notes: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}
