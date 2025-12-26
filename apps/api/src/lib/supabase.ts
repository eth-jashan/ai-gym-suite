import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

// Types for our database
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
      };
      exercises: {
        Row: {
          id: string;
          name: string;
          description: string;
          embedding: number[] | null;
        };
      };
    };
    Functions: {
      match_exercises: {
        Args: {
          query_embedding: number[];
          match_threshold: number;
          match_count: number;
        };
        Returns: {
          id: string;
          name: string;
          description: string;
          similarity: number;
        }[];
      };
    };
  };
};

// Supabase client for server-side operations (with service role key)
let supabaseAdmin: SupabaseClient<Database> | null = null;

// Supabase client for client-authenticated operations
let supabaseClient: SupabaseClient<Database> | null = null;

export const getSupabaseAdmin = (): SupabaseClient<Database> => {
  if (!supabaseAdmin) {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      throw new Error('Supabase credentials not configured');
    }
    supabaseAdmin = createClient<Database>(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return supabaseAdmin;
};

export const getSupabaseClient = (): SupabaseClient<Database> => {
  if (!supabaseClient) {
    if (!config.supabase.url || !config.supabase.anonKey) {
      throw new Error('Supabase credentials not configured');
    }
    supabaseClient = createClient<Database>(
      config.supabase.url,
      config.supabase.anonKey
    );
  }
  return supabaseClient;
};

// Create a client with user's JWT for authenticated operations
export const getSupabaseClientWithAuth = (accessToken: string): SupabaseClient<Database> => {
  if (!config.supabase.url || !config.supabase.anonKey) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient<Database>(
    config.supabase.url,
    config.supabase.anonKey,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );
};
