import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side client with service role (full access)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Client-side / public client (read-only via RLS)
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

export function getImageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const { data } = supabasePublic.storage.from('book-images').getPublicUrl(path);
  return data.publicUrl;
}
