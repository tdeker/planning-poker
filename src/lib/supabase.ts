import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Indique si la config est présente, sans faire planter le serveur au
// démarrage : l'interface affiche un message clair plutôt qu'un crash 500.
export const supabaseConfigured = Boolean(url && anonKey);

if (!supabaseConfigured && typeof window !== "undefined") {
  console.error(
    "Variables Supabase manquantes : définis NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(
  url ?? "https://placeholder.supabase.co",
  anonKey ?? "placeholder-anon-key",
  { realtime: { params: { eventsPerSecond: 10 } } }
);

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
