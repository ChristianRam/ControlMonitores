import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Configuración inicial del cliente de Supabase para ControlMonitores (Vite + React + TypeScript).
 * Utiliza exclusivamente variables de entorno públicas del cliente (VITE_).
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export interface SupabaseConfig {
  isConfigured: boolean;
  url: string | null;
  publishableKey: string | null;
}

export const getSupabaseConfig = (): SupabaseConfig => {
  return {
    isConfigured: isSupabaseConfigured,
    url: supabaseUrl || null,
    publishableKey: supabasePublishableKey || null,
  };
};
