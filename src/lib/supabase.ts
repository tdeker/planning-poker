import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Variables Supabase manquantes. Copie .env.example vers .env.local et renseigne NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(url, anonKey, {
  realtime: { params: { eventsPerSecond: 10 } },
});

export type Vote = {
  id: string;
  room: string;
  member_id: string;
  member_name: string;
  card: string | null;
  updated_at: string;
};

export type Room = {
  room: string;
  story_title: string;
  revealed: boolean;
  updated_at: string;
};
