import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _admin: SupabaseClient | null = null;
let _public: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase env vars not set');
    _admin = createClient(url, key);
  }
  return _admin;
}

export function getSupabasePublic(): SupabaseClient {
  if (!_public) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Supabase env vars not set');
    _public = createClient(url, key);
  }
  return _public;
}

// Aliases for backward compatibility
export const supabaseAdmin = {
  get from() { return getSupabaseAdmin().from.bind(getSupabaseAdmin()); },
  get storage() { return getSupabaseAdmin().storage; },
};

export const supabasePublic = {
  get from() { return getSupabasePublic().from.bind(getSupabasePublic()); },
  get storage() { return getSupabasePublic().storage; },
};

export function getImageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const client = getSupabasePublic();
  const { data } = client.storage.from('book-images').getPublicUrl(path);
  return data.publicUrl;
}
