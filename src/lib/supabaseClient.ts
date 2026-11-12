import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente Oficial de Supabase para ControlMonitores
 * 
 * Permite la conexión a Supabase como backend, base de datos PostgreSQL,
 * autenticación de usuarios y almacenamiento de evidencias fotográficas Timemark.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Cliente oficial instanciado si las credenciales están presentes
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export interface SupabaseConfig {
  isConfigured: boolean;
  url: string | null;
  anonKey: string | null;
}

export const getSupabaseConfig = (): SupabaseConfig => {
  return {
    isConfigured: isSupabaseConfigured,
    url: supabaseUrl || null,
    anonKey: supabaseAnonKey || null,
  };
};

/**
 * Información arquitectónica de tablas y storage en Supabase para FEA USCO
 */
export const SUPABASE_ARCHITECTURE_INFO = {
  version: '2.0-ready',
  tablesPrepared: [
    'public.monitores',
    'public.laboratorios',
    'public.asistencias',
    'public.novedades',
    'public.periodos_academicos',
  ],
  storageBucketsPrepared: [
    'evidencias-timemark (almacenamiento de fotos originales sin compresión)',
    'documentos-monitores (constancias y certificaciones)',
  ],
  rlsPolicies: [
    'Monitores pueden leer sus propios registros y crear asistencias/novedades',
    'Coordinadores (admin) tienen permisos completos de lectura/escritura/auditoría',
  ],
};
