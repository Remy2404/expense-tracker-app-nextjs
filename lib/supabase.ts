import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { auth } from './firebase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

class AuthenticatedSupabaseClient {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {},
        fetch: this.authenticatedFetch.bind(this),
      },
    });
  }

  private async authenticatedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const user = auth.currentUser;
    let token = null;

    if (user) {
      token = await user.getIdToken();
    }
    
    const headers = new Headers(init?.headers);
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    const response = await fetch(input, {
      ...init,
      headers,
    });

    if (response.status === 401) {
      const clone = response.clone();
      try {
        const body = await clone.json();
        if (body.code === 'PGRST301') {
          console.error('Supabase Auth Error (PGRST301): Firebase JWT rejected.');
        }
      } catch {
        // ignore
      }
    }

    return response;
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}

export const supabaseAuth = new AuthenticatedSupabaseClient();
export const supabase = supabaseAuth.getClient();
