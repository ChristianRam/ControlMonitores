import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { 
  Monitor, 
  Laboratorio, 
  EstadoLaboratorio,
  EstadoMonitor,
  ProgramaAcademico,
  Asistencia, 
  Novedad, 
  PeriodoAcademico, 
  UserProfile,
  TipoNovedad,
  Role,
  ArchivoEvidencia,
  EstadoAsistencia,
  ResultadoVerificacionTimemark
} from '../types/database';
import { 
  mockAsistencias, 
  mockNovedades, 
  mockPeriodoActual
} from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  EVIDENCIAS_BUCKET,
  buildUniqueEvidenciaPath,
  validarArchivoEvidencia,
  validarFormatoPhotoCode,
} from '../lib/timemark';
import {
  NOMBRE_LABORATORIO,
  OTRAS_ACTIVIDADES_CODE,
  PROGRAMAS_ACADEMICOS,
  MAX_TURNO_MINUTOS,
} from '../lib/constants';

const OFFICIAL_SALA_CODES = ['SALA-01', 'SALA-02', 'SALA-03', 'SALA-04', 'SALA-05', 'SALA-06', OTRAS_ACTIVIDADES_CODE] as const;

const VALID_PROGRAMAS: ProgramaAcademico[] = PROGRAMAS_ACADEMICOS;

const mapMonitorRow = (row: Record<string, unknown>, fallbackHorasAsignadas = 112): Monitor => {
  const rawPrograma = typeof row.programa_academico === 'string' ? row.programa_academico.trim() : '';
  const programa_academico: ProgramaAcademico = VALID_PROGRAMAS.includes(rawPrograma as ProgramaAcademico)
    ? (rawPrograma as ProgramaAcademico)
    : 'Economía';

  const rawEstado = row.estado;
  const estado: EstadoMonitor =
    rawEstado === 'activo' || rawEstado === 'inactivo' || rawEstado === 'en_turno'
      ? rawEstado
      : 'activo';

  const rawCorreo =
    typeof row.correo_institucional === 'string' && row.correo_institucional.trim()
      ? row.correo_institucional.trim()
      : typeof row.correo === 'string' && row.correo.trim()
      ? row.correo.trim()
      : typeof row.email === 'string'
      ? row.email.trim()
      : '';

  return {
    id: String(row.id),
    user_id: row.user_id ? String(row.user_id) : undefined,
    nombres: String(row.nombres ?? ''),
    apellidos: String(row.apellidos ?? ''),
    codigo_estudiantil: String(row.codigo_estudiantil ?? ''),
    correo_institucional: rawCorreo,
    programa_academico,
    semestre: Number(row.semestre ?? 1),
    horas_asignadas: Number(row.horas_asignadas ?? fallbackHorasAsignadas),
    horas_aprobadas: Number(row.horas_aprobadas ?? 0),
    horas_pendientes: Number(row.horas_pendientes ?? 0),
    estado,
    telefono: String(row.telefono ?? ''),
    foto_url: typeof row.foto_url === 'string' && row.foto_url.trim() ? row.foto_url.trim() : undefined,
    laboratorio_habitual_id: row.laboratorio_habitual_id ? String(row.laboratorio_habitual_id) : undefined,
    created_at: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
  };
};

const mapLaboratorioRow = (row: Record<string, unknown>): Laboratorio => ({
  id: String(row.id),
  nombre: String(row.nombre ?? ''),
  codigo: String(row.codigo ?? '').trim().toUpperCase(),
  estado:
    row.estado === 'disponible' || row.estado === 'en_uso' || row.estado === 'mantenimiento'
      ? row.estado
      : 'disponible',
  monitor_actual_id: row.monitor_actual_id ? String(row.monitor_actual_id) : null,
  created_at: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
});

const VALID_ESTADOS_ASISTENCIA: EstadoAsistencia[] = [
  'en_curso',
  'pendiente_validacion',
  'aprobada',
  'rechazada',
  'observacion',
];

const VALID_RESULTADOS_TIMEMARK: ResultadoVerificacionTimemark[] = [
  'Pendiente',
  'Auténtico',
  'Falso',
  'No encontrado',
  'No se puede verificar',
];

const formatColombiaDate = (rawValue: unknown, fallbackTimestamp?: unknown): string => {
  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    if (trimmed) {
      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) {
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Bogota',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(parsed);
      }
    }
  }

  if (typeof fallbackTimestamp === 'string' && fallbackTimestamp.trim()) {
    const parsed = new Date(fallbackTimestamp.trim());
    if (!Number.isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(parsed);
    }
  }

  return '';
};

const formatColombiaTime = (rawValue: unknown): string | null => {
  if (rawValue === null || rawValue === undefined) return null;
  if (typeof rawValue !== 'string') return null;

  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  // PostgreSQL TIME without time zone (ya emitido en hora local/servidor o sin offset)
  if (/^\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(trimmed)) {
    const [hh = '00', mm = '00', ssRaw = '00'] = trimmed.split(':');
    const ss = ssRaw.split('.')[0].padStart(2, '0');
    return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}:${ss}`;
  }

  // TIMESTAMPTZ o ISO datetime con offset -> convertir explícitamente a America/Bogota
  const isoCandidate = /^\d{2}:\d{2}/.test(trimmed) ? `1970-01-01T${trimmed}` : trimmed;
  const parsed = new Date(isoCandidate);
  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Bogota',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(parsed);
  }

  return trimmed;
};

const isDirectUrl = (val?: string | null): boolean =>
  Boolean(val && /^(https?:\/\/|data:)/i.test(val.trim()));

const mapAsistenciaRow = (
  row: Record<string, unknown>,
  labs: Laboratorio[],
  monitor?: Monitor | null
): Asistencia => {
  const labId = String(row.laboratorio_id ?? '');
  const labMatch = labs.find((l) => l.id === labId);

  const rawEstado = typeof row.estado === 'string' ? row.estado.trim() : '';
  const estado: EstadoAsistencia = VALID_ESTADOS_ASISTENCIA.includes(rawEstado as EstadoAsistencia)
    ? (rawEstado as EstadoAsistencia)
    : 'en_curso';

  const rawResultadoEntrada =
    typeof row.timemark_entrada_resultado === 'string'
      ? row.timemark_entrada_resultado.trim()
      : typeof row.resultado_timemark === 'string'
      ? row.resultado_timemark.trim()
      : '';
  const timemark_entrada_resultado: ResultadoVerificacionTimemark = VALID_RESULTADOS_TIMEMARK.includes(
    rawResultadoEntrada as ResultadoVerificacionTimemark
  )
    ? (rawResultadoEntrada as ResultadoVerificacionTimemark)
    : 'Pendiente';

  const rawResultadoSalida =
    typeof row.timemark_salida_resultado === 'string' ? row.timemark_salida_resultado.trim() : '';
  const hasExitInfo = Boolean(
    row.hora_salida ||
      row.hora_fin ||
      row.salida_at ||
      (typeof row.foto_salida_url === 'string' && row.foto_salida_url.trim()) ||
      (typeof row.foto_salida_path === 'string' && row.foto_salida_path.trim()) ||
      (typeof row.timemark_salida_codigo === 'string' && row.timemark_salida_codigo.trim())
  );
  const timemark_salida_resultado: ResultadoVerificacionTimemark | undefined = VALID_RESULTADOS_TIMEMARK.includes(
    rawResultadoSalida as ResultadoVerificacionTimemark
  )
    ? (rawResultadoSalida as ResultadoVerificacionTimemark)
    : hasExitInfo
    ? 'Pendiente'
    : undefined;

  const rawFotoEntradaUrl = typeof row.foto_entrada_url === 'string' ? row.foto_entrada_url.trim() : '';
  const rawFotoEntradaPath =
    typeof row.foto_entrada_path === 'string' && row.foto_entrada_path.trim()
      ? row.foto_entrada_path.trim()
      : typeof row.foto_path === 'string' && row.foto_path.trim()
      ? row.foto_path.trim()
      : rawFotoEntradaUrl && !isDirectUrl(rawFotoEntradaUrl)
      ? rawFotoEntradaUrl
      : undefined;

  const rawFotoSalidaUrl = typeof row.foto_salida_url === 'string' ? row.foto_salida_url.trim() : '';
  const rawFotoSalidaPath =
    typeof row.foto_salida_path === 'string' && row.foto_salida_path.trim()
      ? row.foto_salida_path.trim()
      : rawFotoSalidaUrl && !isDirectUrl(rawFotoSalidaUrl)
      ? rawFotoSalidaUrl
      : undefined;

  const rawCreatedAt = typeof row.created_at === 'string' ? row.created_at : new Date().toISOString();
  const horaEntrada =
    formatColombiaTime(row.hora_entrada ?? row.hora_inicio ?? row.entrada_at) ||
    formatColombiaTime(rawCreatedAt) ||
    '00:00:00';
  const horaSalida = formatColombiaTime(row.hora_salida ?? row.hora_fin ?? row.salida_at);
  const fecha = formatColombiaDate(row.fecha ?? row.fecha_asistencia, row.hora_entrada ?? rawCreatedAt);

  const rawCodigoEntrada =
    typeof row.timemark_entrada_codigo === 'string' && row.timemark_entrada_codigo.trim()
      ? row.timemark_entrada_codigo.trim()
      : typeof row.codigo_timemark === 'string' && row.codigo_timemark.trim()
      ? row.codigo_timemark.trim()
      : typeof row.codigo_timemark_entrada === 'string' && row.codigo_timemark_entrada.trim()
      ? row.codigo_timemark_entrada.trim()
      : undefined;

  return {
    id: String(row.id),
    monitor_id: String(row.monitor_id ?? ''),
    monitor_nombre:
      typeof row.monitor_nombre === 'string' && row.monitor_nombre.trim()
        ? row.monitor_nombre.trim()
        : monitor
        ? `${monitor.nombres} ${monitor.apellidos}`.trim()
        : undefined,
    laboratorio_id: labId,
    laboratorio_nombre:
      typeof row.laboratorio_nombre === 'string' && row.laboratorio_nombre.trim()
        ? row.laboratorio_nombre.trim()
        : labMatch?.nombre || 'Sala',
    fecha,
    hora_entrada: horaEntrada,
    hora_salida: horaSalida,
    horas_calculadas: Number(row.horas_calculadas ?? row.horas_trabajadas ?? 0),
    estado,
    foto_entrada_url: isDirectUrl(rawFotoEntradaUrl) ? rawFotoEntradaUrl : undefined,
    foto_entrada_path: rawFotoEntradaPath,
    foto_entrada_nombre:
      typeof row.foto_entrada_nombre === 'string'
        ? row.foto_entrada_nombre
        : typeof row.foto_nombre === 'string'
        ? row.foto_nombre
        : undefined,
    foto_entrada_tamano:
      row.foto_entrada_tamano !== undefined && row.foto_entrada_tamano !== null
        ? Number(row.foto_entrada_tamano)
        : row.foto_tamano !== undefined && row.foto_tamano !== null
        ? Number(row.foto_tamano)
        : undefined,
    foto_salida_url: isDirectUrl(rawFotoSalidaUrl) ? rawFotoSalidaUrl : undefined,
    foto_salida_path: rawFotoSalidaPath,
    foto_salida_nombre: typeof row.foto_salida_nombre === 'string' ? row.foto_salida_nombre : undefined,
    foto_salida_tamano:
      row.foto_salida_tamano !== undefined && row.foto_salida_tamano !== null
        ? Number(row.foto_salida_tamano)
        : undefined,
    timemark_entrada_codigo: rawCodigoEntrada,
    timemark_entrada_resultado,
    timemark_salida_codigo:
      typeof row.timemark_salida_codigo === 'string' ? row.timemark_salida_codigo.trim() : undefined,
    timemark_salida_resultado,
    timemark_verificado_por:
      typeof row.timemark_verificado_por === 'string' ? row.timemark_verificado_por : undefined,
    timemark_fecha_verificacion:
      typeof row.timemark_fecha_verificacion === 'string' ? row.timemark_fecha_verificacion : undefined,
    timemark_observaciones:
      typeof row.timemark_observaciones === 'string' ? row.timemark_observaciones : undefined,
    es_dato_prueba: false,
    latitud: row.latitud !== undefined && row.latitud !== null ? Number(row.latitud) : undefined,
    longitud: row.longitud !== undefined && row.longitud !== null ? Number(row.longitud) : undefined,
    notas_estudiante:
      typeof row.notas_estudiante === 'string'
        ? row.notas_estudiante
        : typeof row.notas === 'string'
        ? row.notas
        : undefined,
    notas_coordinador: typeof row.notas_coordinador === 'string' ? row.notas_coordinador : undefined,
    created_at: rawCreatedAt,
  };
};

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

export type NavigationTab = 
  | 'login'
  | 'dashboard'
  | 'monitores'
  | 'laboratorios'
  | 'asistencia'
  | 'reportes'
  | 'novedades'
  | 'monitor_dashboard';

export interface MonitorEditPayload {
  nombres: string;
  apellidos: string;
  codigo_estudiantil: string;
  correo_institucional: string;
  programa_academico: ProgramaAcademico;
  semestre: number;
  telefono: string;
  laboratorio_habitual_id: string | null;
}

export interface NuevoMonitorPayload {
  nombres: string;
  apellidos: string;
  codigo_estudiantil: string;
  correo_institucional: string;
  programa_academico: ProgramaAcademico;
  semestre: number;
  telefono: string;
  password: string;
}

interface AppContextType {
  currentUser: UserProfile | null;
  currentRole: Role | null;
  authInitializing: boolean;
  authLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  activeTab: NavigationTab;
  monitores: Monitor[];
  monitoresLoading: boolean;
  monitoresError: string | null;
  laboratorios: Laboratorio[];
  laboratoriosLoading: boolean;
  laboratoriosError: string | null;
  asistencias: Asistencia[];
  asistenciasLoading: boolean;
  asistenciasError: string | null;
  novedades: Novedad[];
  periodo: PeriodoAcademico;
  toasts: ToastMessage[];
  currentMonitorData: Monitor | null;
  activeAsistenciaActual: Asistencia | null;
  metaGeneralHoras: number;
  configurarMetaGeneral: (nuevasHoras: number, actualizarMonitoresExistentes?: boolean) => void;
  
  // Acciones de autenticación y navegación
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  setActiveTab: (tab: NavigationTab) => void;
  addToast: (title: string, message?: string, type?: ToastType) => void;
  removeToast: (id: string) => void;

  // Acciones de gestión de monitores (Fase 2: consulta + edición administrativa sin creación de cuentas)
  fetchMonitores: () => Promise<void>;
  fetchCurrentMonitor: () => Promise<Monitor | null>;
  actualizarInfoMonitor: (
    monitorId: string,
    payload: MonitorEditPayload
  ) => Promise<{ ok: boolean; error?: string; monitor?: Monitor }>;
  cambiarEstadoMonitor: (
    monitorId: string,
    nuevoEstado: 'activo' | 'inactivo'
  ) => Promise<{ ok: boolean; error?: string; monitor?: Monitor }>;
  actualizarHorasAsignadasMonitor: (
    monitorId: string,
    nuevasHoras: number
  ) => Promise<{ ok: boolean; error?: string; monitor?: Monitor }>;
  crearMonitor: (payload: NuevoMonitorPayload) => Promise<{ ok: boolean; error?: string }>;
  eliminarMonitor: (monitorId: string) => Promise<{ ok: boolean; error?: string }>;
  ajustarHorasMonitor: (
    monitorId: string,
    horas: number,
    operacion: 'sumar' | 'restar'
  ) => Promise<{ ok: boolean; error?: string; monitor?: Monitor }>;
  cerrarTurnoVencido: () => Promise<void>;
  agregarMonitor: (monitor: Omit<Monitor, 'id' | 'horas_aprobadas' | 'horas_pendientes' | 'created_at'>) => void;
  actualizarMonitor: (monitor: Monitor) => void;
  
  // Acciones de laboratorios (conectado a Supabase)
  fetchLaboratorios: () => Promise<void>;
  actualizarLaboratorio: (
    labId: string,
    estado: EstadoLaboratorio
  ) => Promise<{ ok: boolean; error?: string }>;

  // Acciones de turnos y asistencias
  fetchAsistencias: (monitorIdOverride?: string) => Promise<void>;
  registrarEntrada: (
    laboratorioId: string,
    notas?: string,
    fotoArchivo?: ArchivoEvidencia | File | string,
    timemarkCodigo?: string
  ) => Promise<{ ok: boolean; error?: string; pendingStorageCleanupPath?: string }>;
  registrarSalida: (
    fotoArchivo?: ArchivoEvidencia | File | string,
    timemarkCodigo?: string
  ) => Promise<{ ok: boolean; error?: string; pendingStorageCleanupPath?: string }>;
  actualizarVerificacionTimemark: (
    asistenciaId: string,
    tipo: 'entrada' | 'salida',
    resultado: import('../types/database').ResultadoVerificacionTimemark,
    observaciones?: string
  ) => void;
  aprobarAsistencia: (asistenciaId: string, notasCoordinador?: string) => void;
  rechazarAsistencia: (asistenciaId: string, motivo: string) => void;
  observarAsistencia: (asistenciaId: string, observacion: string) => void;

  // Acciones de novedades
  crearNovedad: (novedad: {
    tipo: TipoNovedad;
    titulo: string;
    descripcion: string;
    fecha_incidencia: string;
    horas_solicitadas?: number;
    asistencia_id?: string | null;
  }) => void;
  resolverNovedad: (novedadId: string, estado: 'aprobada' | 'rechazada', respuesta: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [authInitializing, setAuthInitializing] = useState<boolean>(true);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authenticatedMonitor, setAuthenticatedMonitor] = useState<Monitor | null>(null);
  const [activeTab, setActiveTab] = useState<NavigationTab>('login');

  const isManualLogoutRef = useRef<boolean>(false);
  const isRejectingUnauthorizedRef = useRef<boolean>(false);
  const wasAuthenticatedRef = useRef<boolean>(false);
  const currentRoleRef = useRef<Role | null>(null);
  currentRoleRef.current = currentUser?.role ?? null;
  
  const [monitores, setMonitores] = useState<Monitor[]>([]);
  const [monitoresLoading, setMonitoresLoading] = useState<boolean>(false);
  const [monitoresError, setMonitoresError] = useState<string | null>(null);
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [laboratoriosLoading, setLaboratoriosLoading] = useState<boolean>(false);
  const [laboratoriosError, setLaboratoriosError] = useState<string | null>(null);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [asistenciasLoading, setAsistenciasLoading] = useState<boolean>(false);
  const [asistenciasError, setAsistenciasError] = useState<string | null>(null);
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [periodo] = useState<PeriodoAcademico>(mockPeriodoActual);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const laboratoriosRef = useRef<Laboratorio[]>([]);
  laboratoriosRef.current = laboratorios;
  const currentMonitorRef = useRef<Monitor | null>(null);

  // Meta general de horas de cumplimiento (configurable en fase posterior)
  const [metaGeneralHoras, setMetaGeneralHoras] = useState<number>(112);

  const configurarMetaGeneral = (nuevasHoras: number) => {
    const horasValidas = Math.max(1, Math.round(Number(nuevasHoras) || 112));
    setMetaGeneralHoras(horasValidas);
    addToast('Meta de Referencia Actualizada', `Meta de referencia en sesión ajustada a ${horasValidas} horas.`, 'info');
  };

  // Monitor activo actual si el usuario autenticado es monitor
  const currentMonitorData = currentUser?.role === 'monitor' && currentUser.monitor_id
    ? monitores.find(m => m.id === currentUser.monitor_id) || authenticatedMonitor
    : null;
  currentMonitorRef.current = currentMonitorData;

  // Asistencia en curso actual del monitor logueado
  const activeAsistenciaActual = currentMonitorData
    ? asistencias.find(a => a.monitor_id === currentMonitorData.id && a.estado === 'en_curso') || null
    : null;

  const addToast = useCallback((title: string, message?: string, type: ToastType = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const clearSessionData = useCallback(() => {
    currentRoleRef.current = null;
    currentMonitorRef.current = null;
    setCurrentUser(null);
    setAuthenticatedMonitor(null);
    setMonitores([]);
    setMonitoresLoading(false);
    setMonitoresError(null);
    setLaboratorios([]);
    setLaboratoriosLoading(false);
    setLaboratoriosError(null);
    setAsistencias([]);
    setAsistenciasLoading(false);
    setAsistenciasError(null);
    setNovedades([]);
    setActiveTab('login');
  }, []);

  // 1. Inicializar sesión persistente y suscribirse a onAuthStateChange (SIN consultas a BD dentro del callback)
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setIsAuthReady(true);
      setAuthInitializing(false);
      setAuthLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          setSession(null);
          setAuthError('Tu sesión guardada expiró o no es válida. Por favor, inicia sesión nuevamente.');
          setIsAuthReady(true);
          setAuthInitializing(false);
          setAuthLoading(false);
          return;
        }
        setSession(data.session ?? null);
        setIsAuthReady(true);
        if (!data.session) {
          setAuthInitializing(false);
          setAuthLoading(false);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setSession(null);
        setAuthError('No fue posible verificar la sesión actual. Intenta iniciar sesión nuevamente.');
        setIsAuthReady(true);
        setAuthInitializing(false);
        setAuthLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        const wasAuth = wasAuthenticatedRef.current;
        const wasManual = isManualLogoutRef.current;
        const wasRejected = isRejectingUnauthorizedRef.current;

        wasAuthenticatedRef.current = false;
        isManualLogoutRef.current = false;
        isRejectingUnauthorizedRef.current = false;

        setSession(null);
        clearSessionData();
        setAuthLoading(false);
        setAuthInitializing(false);

        if (wasAuth && !wasManual && !wasRejected) {
          const expiredMsg = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
          setAuthError(expiredMsg);
          addToast('Sesión Expirada', expiredMsg, 'warning');
        }
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        setSession(nextSession ?? null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [clearSessionData, addToast]);

  // 2. Cargar perfil desde public.perfiles (y datos de monitor desde public.monitores) fuera de onAuthStateChange
  useEffect(() => {
    if (!isAuthReady) return;

    const authUser: User | undefined = session?.user;
    if (!authUser) {
      clearSessionData();
      setAuthInitializing(false);
      setAuthLoading(false);
      return;
    }

    if (!supabase) {
      clearSessionData();
      setAuthInitializing(false);
      setAuthLoading(false);
      return;
    }

    const client = supabase;
    let cancelled = false;

    const loadUserProfile = async () => {
      setAuthLoading(true);

      const denyAccess = async (message: string) => {
        if (cancelled) return;
        wasAuthenticatedRef.current = false;
        isRejectingUnauthorizedRef.current = true;
        clearSessionData();
        setAuthError(message);
        addToast('Acceso Denegado', message, 'error');
        setAuthInitializing(false);
        setAuthLoading(false);
        try {
          await client.auth.signOut();
        } catch {
          // Ignorar error secundario al limpiar sesión rechazada
        }
      };

      try {
        const { data: perfil, error: perfilError } = await client
          .from('perfiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (cancelled) return;

        if (perfilError) {
          const isRlsOrPermission =
            perfilError.code === '42501' ||
            perfilError.message?.toLowerCase().includes('permission denied') ||
            perfilError.message?.toLowerCase().includes('row-level security');

          const msg = isRlsOrPermission
            ? 'No fue posible consultar tu perfil en public.perfiles debido a restricciones de permisos o políticas RLS. Acceso denegado.'
            : `No se pudo consultar el perfil del usuario (${perfilError.message}). Acceso denegado.`;

          await denyAccess(msg);
          return;
        }

        if (!perfil) {
          await denyAccess('No existe un perfil registrado para este usuario en public.perfiles. Acceso denegado.');
          return;
        }

        const rawRole = perfil.role;
        if (rawRole !== 'admin' && rawRole !== 'monitor') {
          await denyAccess('El perfil del usuario no tiene un rol válido (admin o monitor). Acceso denegado.');
          return;
        }

        const role: Role = rawRole;
        const nombrePerfil =
          perfil.nombre_completo ||
          perfil.nombre ||
          (perfil.nombres ? `${perfil.nombres} ${perfil.apellidos || ''}`.trim() : '') ||
          authUser.user_metadata?.nombre_completo ||
          authUser.email ||
          'Usuario FEA';

        let monitorRecord: Monitor | null = null;

        if (role === 'monitor') {
          const { data: monitorRow, error: monitorError } = await client
            .from('monitores')
            .select('*')
            .eq('user_id', authUser.id)
            .maybeSingle();

          if (cancelled) return;

          if (monitorError) {
            const isRlsMonitor =
              monitorError.code === '42501' ||
              monitorError.message?.toLowerCase().includes('permission denied') ||
              monitorError.message?.toLowerCase().includes('row-level security');
            const msg = isRlsMonitor
              ? 'No fue posible consultar tus datos de monitor en public.monitores por permisos o RLS. Acceso denegado.'
              : `No se pudo cargar el registro de monitor (${monitorError.message}).`;
            await denyAccess(msg);
            return;
          }

          if (!monitorRow) {
            await denyAccess('Tu cuenta tiene rol monitor, pero no está vinculada a ningún registro en public.monitores (user_id).');
            return;
          }

          monitorRecord = mapMonitorRow(
            {
              ...monitorRow,
              nombres: monitorRow.nombres || String(nombrePerfil).split(' ')[0] || 'Monitor',
              apellidos: monitorRow.apellidos || String(nombrePerfil).split(' ').slice(1).join(' ') || '',
              correo_institucional: monitorRow.correo_institucional || authUser.email || '',
              user_id: monitorRow.user_id || authUser.id,
            },
            metaGeneralHoras
          );

          // Bloquear acceso a monitores con estado 'inactivo' antes de abrir vistas protegidas
          if (monitorRecord.estado === 'inactivo') {
            await denyAccess(
              'Tu cuenta de monitor se encuentra inactiva. Por favor, comunícate con el coordinador de salas para revisar tu habilitación.'
            );
            return;
          }

          setAuthenticatedMonitor(monitorRecord);
          setMonitores([monitorRecord]);
          setMonitoresLoading(false);
          setMonitoresError(null);
          // Separación estricta: no exponer registros simulados de otros estudiantes al rol monitor
          setAsistencias([]);
          setAsistenciasError(null);
          setNovedades([]);
        } else {
          setAuthenticatedMonitor(null);
          setMonitores([]);
          setMonitoresError(null);
          setAsistenciasError(null);
          setAsistenciasLoading(false);
          // Módulos administrativos aún pendientes de integración mantienen sus datos de demostración solo para la vista administrativa
          setAsistencias(mockAsistencias);
          setNovedades(mockNovedades);
        }

        const userProfile: UserProfile = {
          id: authUser.id,
          email: perfil.email || perfil.correo || authUser.email || '',
          nombre_completo: String(nombrePerfil),
          role,
          monitor_id: monitorRecord?.id,
          cargo_descripcion:
            perfil.cargo_descripcion ||
            perfil.cargo ||
            (role === 'admin'
              ? `Coordinador del ${NOMBRE_LABORATORIO} - Facultad de Economía y Administración`
              : 'Monitor Académico'),
        };

        wasAuthenticatedRef.current = true;
        isManualLogoutRef.current = false;
        isRejectingUnauthorizedRef.current = false;
        currentRoleRef.current = role;
        setAuthError(null);
        setCurrentUser(userProfile);
        setActiveTab(prevTab => {
          if (role === 'admin') {
            return prevTab === 'login' || prevTab === 'monitor_dashboard' ? 'dashboard' : prevTab;
          }
          return prevTab === 'login' || prevTab === 'dashboard' || prevTab === 'monitores' || prevTab === 'laboratorios' || prevTab === 'asistencia'
            ? 'monitor_dashboard'
            : prevTab;
        });
      } catch {
        if (!cancelled) {
          await denyAccess('Ocurrió un error inesperado al verificar tu perfil de usuario. Acceso denegado.');
        }
      } finally {
        if (!cancelled) {
          setAuthInitializing(false);
          setAuthLoading(false);
        }
      }
    };

    loadUserProfile();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, isAuthReady, clearSessionData, addToast]);

  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    isManualLogoutRef.current = false;
    isRejectingUnauthorizedRef.current = false;
    setAuthError(null);

    if (!supabase || !isSupabaseConfigured) {
      const msg = 'La conexión con Supabase no está configurada en las variables de entorno.';
      setAuthError(msg);
      addToast('Error de Configuración', msg, 'error');
      return { ok: false, error: msg };
    }

    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        let friendlyMsg = 'No fue posible iniciar sesión. Verifica tus credenciales.';
        const lower = error.message.toLowerCase();
        if (lower.includes('invalid login credentials')) {
          friendlyMsg = 'Correo electrónico o contraseña incorrectos.';
        } else if (lower.includes('email not confirmed')) {
          friendlyMsg = 'Tu correo electrónico aún no está confirmado en Supabase.';
        } else if (lower.includes('rate limit') || lower.includes('too many requests')) {
          friendlyMsg = 'Demasiados intentos de inicio de sesión. Espera unos minutos e intenta nuevamente.';
        }

        setAuthError(friendlyMsg);
        setAuthLoading(false);
        addToast('Error de Autenticación', friendlyMsg, 'error');
        return { ok: false, error: friendlyMsg };
      }

      if (!data.session) {
        const msg = 'No se recibió una sesión activa desde Supabase.';
        setAuthError(msg);
        setAuthLoading(false);
        return { ok: false, error: msg };
      }

      // La actualización de sesión dispara la carga del perfil en el useEffect fuera de onAuthStateChange
      setSession(data.session);
      return { ok: true };
    } catch {
      const msg = 'Error de red al intentar autenticar con Supabase.';
      setAuthError(msg);
      setAuthLoading(false);
      addToast('Error de Conexión', msg, 'error');
      return { ok: false, error: msg };
    }
  };

  const logout = async () => {
    isManualLogoutRef.current = true;
    setAuthError(null);

    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Continuar limpiando estado local incluso si la red falla al cerrar sesión
      }
    }

    wasAuthenticatedRef.current = false;
    setSession(null);
    clearSessionData();
    setAuthLoading(false);
    setAuthInitializing(false);
    addToast('Sesión Finalizada', 'Has cerrado sesión correctamente del sistema.', 'info');
  };

  // Consultar los monitores reales desde public.monitores en Supabase (exclusivo para coordinador)
  const fetchMonitores = useCallback(async () => {
    if (currentRoleRef.current !== 'admin') {
      return;
    }

    if (!supabase || !isSupabaseConfigured) {
      setMonitores([]);
      setMonitoresError('La conexión con Supabase no está configurada.');
      return;
    }

    setMonitoresLoading(true);
    setMonitoresError(null);

    try {
      const { data, error } = await supabase
        .from('monitores')
        .select('*')
        .order('nombres', { ascending: true })
        .order('apellidos', { ascending: true });

      if (error) {
        const isRlsOrPermission =
          error.code === '42501' ||
          error.message?.toLowerCase().includes('permission denied') ||
          error.message?.toLowerCase().includes('row-level security');

        const msg = isRlsOrPermission
          ? 'No tienes permisos o políticas RLS habilitadas para consultar public.monitores en Supabase.'
          : `No se pudieron cargar los monitores desde Supabase (${error.message}).`;

        setMonitoresError(msg);
        return;
      }

      const mapped = (data || []).map((row) =>
        mapMonitorRow(row as Record<string, unknown>, metaGeneralHoras)
      );

      setMonitores(mapped);
      setMonitoresError(null);
    } catch {
      setMonitoresError('Error de conexión al consultar los monitores en Supabase.');
    } finally {
      setMonitoresLoading(false);
    }
  }, [metaGeneralHoras]);

  // Consultar las seis salas reales desde public.laboratorios en Supabase
  const fetchLaboratorios = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured) {
      setLaboratorios([]);
      setLaboratoriosError('La conexión con Supabase no está configurada.');
      return;
    }

    setLaboratoriosLoading(true);
    setLaboratoriosError(null);

    try {
      const { data, error } = await supabase
        .from('laboratorios')
        .select('*')
        .in('codigo', [...OFFICIAL_SALA_CODES])
        .order('codigo', { ascending: true });

      if (error) {
        const isRlsOrPermission =
          error.code === '42501' ||
          error.message?.toLowerCase().includes('permission denied') ||
          error.message?.toLowerCase().includes('row-level security');

        const msg = isRlsOrPermission
          ? 'No tienes permisos o políticas RLS habilitadas para consultar public.laboratorios en Supabase.'
          : `No se pudieron cargar las salas desde Supabase (${error.message}).`;

        setLaboratoriosError(msg);
        return;
      }

      const seenCodes = new Set<string>();
      const mapped = (data || [])
        .map((row) => mapLaboratorioRow(row as Record<string, unknown>))
        .filter((lab) => {
          if (!OFFICIAL_SALA_CODES.includes(lab.codigo as typeof OFFICIAL_SALA_CODES[number])) {
            return false;
          }
          if (seenCodes.has(lab.codigo)) {
            return false;
          }
          seenCodes.add(lab.codigo);
          return true;
        })
        .sort((a, b) => OFFICIAL_SALA_CODES.indexOf(a.codigo as typeof OFFICIAL_SALA_CODES[number]) - OFFICIAL_SALA_CODES.indexOf(b.codigo as typeof OFFICIAL_SALA_CODES[number]));

      setLaboratorios(mapped);
      setLaboratoriosError(null);
    } catch {
      setLaboratoriosError('Error de conexión al consultar las salas en Supabase.');
    } finally {
      setLaboratoriosLoading(false);
    }
  }, []);

  // Consultar el registro real del monitor autenticado desde public.monitores
  const fetchCurrentMonitor = useCallback(async (): Promise<Monitor | null> => {
    if (currentRoleRef.current !== 'monitor') {
      return null;
    }

    if (!supabase || !isSupabaseConfigured) {
      return null;
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return null;
      }

      const { data: monitorRow, error: monitorError } = await supabase
        .from('monitores')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (monitorError || !monitorRow) {
        return null;
      }

      const updated = mapMonitorRow(monitorRow as Record<string, unknown>, metaGeneralHoras);
      setAuthenticatedMonitor(updated);
      setMonitores([updated]);
      return updated;
    } catch {
      return null;
    }
  }, [metaGeneralHoras]);

  // Consultar asistencias reales del monitor autenticado desde public.asistencias y firmar rutas privadas de evidencias-timemark
  const fetchAsistencias = useCallback(async (monitorIdOverride?: string) => {
    if (currentRoleRef.current !== 'monitor') {
      return;
    }

    const targetMonitorId = monitorIdOverride || currentMonitorRef.current?.id;
    if (!targetMonitorId) {
      return;
    }

    if (!supabase || !isSupabaseConfigured) {
      setAsistencias([]);
      setAsistenciasError('La conexión con Supabase no está configurada.');
      return;
    }

    setAsistenciasLoading(true);
    setAsistenciasError(null);

    try {
      const { data, error } = await supabase
        .from('asistencias')
        .select('*')
        .eq('monitor_id', targetMonitorId)
        .order('created_at', { ascending: false });

      if (error) {
        const isRlsOrPermission =
          error.code === '42501' ||
          error.message?.toLowerCase().includes('permission denied') ||
          error.message?.toLowerCase().includes('row-level security');

        const msg = isRlsOrPermission
          ? 'No tienes permisos o políticas RLS habilitadas para consultar tus asistencias en public.asistencias.'
          : `No se pudieron cargar tus asistencias desde Supabase (${error.message}).`;

        setAsistencias([]);
        setAsistenciasError(msg);
        return;
      }

      const mapped = (data || []).map((row) =>
        mapAsistenciaRow(
          row as Record<string, unknown>,
          laboratoriosRef.current,
          currentMonitorRef.current
        )
      );

      // Generar URLs firmadas temporales para fotografías almacenadas en el bucket privado evidencias-timemark
      const storagePaths = Array.from(
        new Set(
          mapped
            .flatMap((a) => [a.foto_entrada_path, a.foto_salida_path])
            .filter((p): p is string => Boolean(p && !isDirectUrl(p)))
        )
      );

      if (storagePaths.length > 0) {
        try {
          const { data: signedList, error: signedError } = await supabase.storage
            .from(EVIDENCIAS_BUCKET)
            .createSignedUrls(storagePaths, 3600);

          if (!signedError && Array.isArray(signedList)) {
            const signedMap = new Map<string, string>();
            for (const item of signedList) {
              if (item.path && item.signedUrl) {
                signedMap.set(item.path, item.signedUrl);
              }
            }

            for (const item of mapped) {
              if (!item.foto_entrada_url && item.foto_entrada_path) {
                item.foto_entrada_url = signedMap.get(item.foto_entrada_path);
              }
              if (!item.foto_salida_url && item.foto_salida_path) {
                item.foto_salida_url = signedMap.get(item.foto_salida_path);
              }
            }
          }
        } catch {
          // Si falla la firma de URLs no bloquear la carga tabular de asistencias
        }
      }

      setAsistencias(mapped);
      setAsistenciasError(null);
    } catch {
      setAsistencias([]);
      setAsistenciasError('Error de conexión al consultar tus asistencias en Supabase.');
    } finally {
      setAsistenciasLoading(false);
    }
  }, []);

  // Cargar las salas y datos reales según el rol automáticamente al autenticar
  useEffect(() => {
    if (currentUser) {
      void fetchLaboratorios();
      if (currentUser.role === 'admin') {
        void fetchMonitores();
      } else if (currentUser.role === 'monitor' && currentUser.monitor_id) {
        void fetchAsistencias(currentUser.monitor_id);
      }
    }
  }, [currentUser?.id, currentUser?.role, currentUser?.monitor_id, fetchLaboratorios, fetchMonitores, fetchAsistencias]);

  // Auxiliar compartido: validar evidencia Timemark (Photo Code + archivo <= 5MB) y subirla a Storage privado
  const subirEvidenciaTimemark = async (
    tipo: 'entrada' | 'salida',
    fotoArchivo?: ArchivoEvidencia | File | string,
    timemarkCodigo?: string
  ): Promise<
    | { ok: true; codigoLimpio: string; fotoPath: string; fileObj: File }
    | { ok: false; error: string }
  > => {
    const codigoCheck = validarFormatoPhotoCode(timemarkCodigo);
    if (!codigoCheck.valid) {
      const title = !codigoCheck.clean ? 'Photo Code Requerido' : 'Formato de Photo Code Inválido';
      const msg = codigoCheck.error || 'El Photo Code de Timemark no es válido.';
      addToast(title, msg, 'error');
      return { ok: false, error: msg };
    }

    const fileObj: File | undefined =
      fotoArchivo instanceof File
        ? fotoArchivo
        : typeof fotoArchivo === 'object' && fotoArchivo !== null
        ? fotoArchivo.file
        : undefined;

    const fileCheck = validarArchivoEvidencia(fileObj);
    if (!fileCheck.valid || !fileObj) {
      const msg = fileCheck.error || 'Debes seleccionar una fotografía original válida.';
      addToast('Fotografía Inválida', msg, 'warning');
      return { ok: false, error: msg };
    }

    if (!supabase || !isSupabaseConfigured) {
      const msg = 'La conexión con Supabase no está configurada.';
      addToast('Error de Configuración', msg, 'error');
      return { ok: false, error: msg };
    }

    const {
      data: { user },
      error: authUserError,
    } = await supabase.auth.getUser();

    if (authUserError || !user) {
      const msg = 'No se pudo verificar la sesión autenticada en Supabase. Inicia sesión nuevamente.';
      addToast('Sesión No Válida', msg, 'error');
      return { ok: false, error: msg };
    }

    const fotoPath = buildUniqueEvidenciaPath(user.id, fileObj.type, tipo);

    const { error: uploadError } = await supabase.storage
      .from(EVIDENCIAS_BUCKET)
      .upload(fotoPath, fileObj, {
        contentType: fileObj.type,
        upsert: false,
      });

    if (uploadError) {
      const lowerUploadMsg = uploadError.message?.toLowerCase() ?? '';
      const isStorageRls =
        lowerUploadMsg.includes('row-level security') ||
        lowerUploadMsg.includes('permission') ||
        lowerUploadMsg.includes('unauthorized') ||
        lowerUploadMsg.includes('policy');
      const msg = isStorageRls
        ? `No tienes permisos en Storage para subir la evidencia al bucket ${EVIDENCIAS_BUCKET}. (${uploadError.message})`
        : `No se pudo subir la fotografía de ${tipo} a Storage (${uploadError.message}). No se registró el movimiento.`;
      addToast('Error al Subir Evidencia', msg, 'error');
      return { ok: false, error: msg };
    }

    return {
      ok: true,
      codigoLimpio: codigoCheck.clean,
      fotoPath,
      fileObj,
    };
  };

  // Validación: el Photo Code y la fotografía no pueden repetirse entre entradas/salidas
  // (ni dentro de la misma jornada ni respecto a jornadas anteriores del monitor).
  const verificarEvidenciaNoDuplicada = (
    tipo: 'entrada' | 'salida',
    codigoLimpio: string,
    fotoArchivo?: ArchivoEvidencia | File | string
  ): string | null => {
    const monitorId = currentMonitorRef.current?.id;
    const propias = asistencias.filter((a) => a.monitor_id === monitorId && !a.es_dato_prueba);
    const codigo = codigoLimpio.trim().toUpperCase();

    for (const a of propias) {
      const usado = [a.timemark_entrada_codigo, a.timemark_salida_codigo]
        .filter((c): c is string => Boolean(c))
        .map((c) => c.trim().toUpperCase());
      if (usado.includes(codigo)) {
        return `El Photo Code ${codigo} ya fue utilizado en una marcación anterior (${a.fecha}). El código de entrada y el de salida deben ser distintos y no se pueden reutilizar.`;
      }
    }

    const fileObj: File | undefined =
      fotoArchivo instanceof File
        ? fotoArchivo
        : typeof fotoArchivo === 'object' && fotoArchivo !== null
        ? fotoArchivo.file
        : undefined;

    if (fileObj) {
      for (const a of propias) {
        const misma = (nombre?: string, tamano?: number) =>
          Boolean(nombre) && nombre === fileObj.name && tamano === fileObj.size;
        if (
          misma(a.foto_entrada_nombre, a.foto_entrada_tamano) ||
          misma(a.foto_salida_nombre, a.foto_salida_tamano)
        ) {
          return `La fotografía "${fileObj.name}" ya fue cargada en una marcación anterior (${a.fecha}). Debes tomar una fotografía nueva con Timemark para la ${tipo}.`;
        }
      }
    }

    return null;
  };

  // Turno: Registrar Inicio de Turno real en Supabase (Storage privado + RPC registrar_inicio_turno)
  const registrarEntrada = async (
    laboratorioId: string,
    notas?: string,
    fotoArchivo?: ArchivoEvidencia | File | string,
    timemarkCodigo?: string
  ): Promise<{ ok: boolean; error?: string; pendingStorageCleanupPath?: string }> => {
    if (currentRoleRef.current !== 'monitor' || !currentMonitorRef.current) {
      const msg = 'No hay un monitor autenticado para iniciar el turno.';
      addToast('Error de Sesión', msg, 'error');
      return { ok: false, error: msg };
    }

    const monitorActual = currentMonitorRef.current;

    if (!supabase || !isSupabaseConfigured) {
      const msg = 'La conexión con Supabase no está configurada.';
      addToast('Error de Configuración', msg, 'error');
      return { ok: false, error: msg };
    }

    // 1. Validar que el monitor esté activo y sin turno en curso
    if (monitorActual.estado === 'inactivo') {
      const msg = 'Tu perfil de monitor se encuentra inactivo y no puede iniciar turnos.';
      addToast('Monitor Inactivo', msg, 'error');
      return { ok: false, error: msg };
    }

    const yaTieneTurnoAbierto =
      monitorActual.estado === 'en_turno' ||
      asistencias.some((a) => a.monitor_id === monitorActual.id && a.estado === 'en_curso');

    if (yaTieneTurnoAbierto) {
      const msg = 'Ya tienes un turno en curso registrado. Debes finalizar tu turno actual antes de iniciar uno nuevo.';
      addToast('Turno Activo Existente', msg, 'warning');
      return { ok: false, error: msg };
    }

    // 2. Validar que haya seleccionado una sala disponible
    const lab = laboratoriosRef.current.find((l) => l.id === laboratorioId);
    if (!lab) {
      const msg = 'Debes seleccionar una sala oficial válida.';
      addToast('Sala No Válida', msg, 'error');
      return { ok: false, error: msg };
    }

    // "Otras actividades" no es una sala física: siempre se puede seleccionar
    if (lab.codigo !== OTRAS_ACTIVIDADES_CODE && lab.estado !== 'disponible') {
      const msg = `La sala "${lab.nombre}" se encuentra actualmente en estado "${lab.estado}". Selecciona una sala disponible.`;
      addToast('Sala No Disponible', msg, 'warning');
      return { ok: false, error: msg };
    }

    const codigoEntradaCheck = validarFormatoPhotoCode(timemarkCodigo);
    if (codigoEntradaCheck.valid) {
      const duplicado = verificarEvidenciaNoDuplicada('entrada', codigoEntradaCheck.clean, fotoArchivo);
      if (duplicado) {
        addToast('Evidencia Duplicada', duplicado, 'error');
        return { ok: false, error: duplicado };
      }
    }

    try {
      // 3. Validar evidencia de entrada y subir fotografía original a Storage privado
      const uploadRes = await subirEvidenciaTimemark('entrada', fotoArchivo, timemarkCodigo);
      if (!uploadRes.ok) {
        return { ok: false, error: uploadRes.error };
      }

      // 4. Invocar RPC registrar_inicio_turno (sin enviar fecha ni hora)
      const { error: rpcError } = await supabase.rpc('registrar_inicio_turno', {
        p_laboratorio_id: lab.id,
        p_codigo_timemark: uploadRes.codigoLimpio,
        p_foto_path: uploadRes.fotoPath,
        p_foto_nombre: uploadRes.fileObj.name,
        p_foto_tamano: uploadRes.fileObj.size,
        p_notas: notas?.trim() ? notas.trim() : null,
      });

      if (rpcError) {
        // El monitor no tiene permiso DELETE en Storage; informar explícitamente sin intentar borrar ni actualizar estado local
        const msg = `La fotografía se cargó en Storage (${uploadRes.fotoPath}), pero no se completó el registro de inicio de turno (${rpcError.message}). El archivo queda pendiente de limpieza administrativa posterior.`;
        addToast('Registro No Completado', msg, 'error');
        return { ok: false, error: msg, pendingStorageCleanupPath: uploadRes.fotoPath };
      }

      // 5. Resincronizar estado real desde Supabase (monitor, salas y asistencias)
      await Promise.all([
        fetchCurrentMonitor(),
        fetchLaboratorios(),
        fetchAsistencias(monitorActual.id),
      ]);

      addToast(
        'Inicio de Turno Registrado',
        `Turno iniciado en ${lab.nombre} con evidencia Timemark (${uploadRes.codigoLimpio}).`,
        'success'
      );
      return { ok: true };
    } catch {
      const msg = 'Error inesperado de conexión al registrar el inicio de turno en Supabase.';
      addToast('Error de Conexión', msg, 'error');
      return { ok: false, error: msg };
    }
  };

  // Turno: Registrar Salida real en Supabase con evidencia Timemark (Storage privado + RPC registrar_salida_turno)
  const registrarSalida = async (
    fotoArchivo?: ArchivoEvidencia | File | string,
    timemarkCodigo?: string
  ): Promise<{ ok: boolean; error?: string; pendingStorageCleanupPath?: string }> => {
    if (currentRoleRef.current !== 'monitor' || !currentMonitorRef.current) {
      const msg = 'No hay un monitor autenticado para finalizar el turno.';
      addToast('Error de Sesión', msg, 'error');
      return { ok: false, error: msg };
    }

    const monitorActual = currentMonitorRef.current;

    if (!supabase || !isSupabaseConfigured) {
      const msg = 'La conexión con Supabase no está configurada.';
      addToast('Error de Configuración', msg, 'error');
      return { ok: false, error: msg };
    }

    if (monitorActual.estado === 'inactivo') {
      const msg = 'Tu perfil de monitor se encuentra inactivo.';
      addToast('Monitor Inactivo', msg, 'error');
      return { ok: false, error: msg };
    }

    const tieneTurnoAbierto =
      monitorActual.estado === 'en_turno' ||
      asistencias.some((a) => a.monitor_id === monitorActual.id && a.estado === 'en_curso');

    if (!tieneTurnoAbierto) {
      const msg = 'No tienes un turno en curso abierto para registrar la salida.';
      addToast('Sin Turno Activo', msg, 'warning');
      return { ok: false, error: msg };
    }

    const codigoSalidaCheck = validarFormatoPhotoCode(timemarkCodigo);
    if (codigoSalidaCheck.valid) {
      const duplicado = verificarEvidenciaNoDuplicada('salida', codigoSalidaCheck.clean, fotoArchivo);
      if (duplicado) {
        addToast('Evidencia Duplicada', duplicado, 'error');
        return { ok: false, error: duplicado };
      }
    }

    try {
      // 1. Validar evidencia de salida y subir fotografía original a Storage privado (<auth.uid()>/<id>_salida.<ext>)
      const uploadRes = await subirEvidenciaTimemark('salida', fotoArchivo, timemarkCodigo);
      if (!uploadRes.ok) {
        return { ok: false, error: uploadRes.error };
      }

      // 2. Invocar RPC registrar_salida_turno con la evidencia de salida
      const { error: rpcError } = await supabase.rpc('registrar_salida_turno', {
        p_codigo_timemark: uploadRes.codigoLimpio,
        p_foto_path: uploadRes.fotoPath,
        p_foto_nombre: uploadRes.fileObj.name,
        p_foto_tamano: uploadRes.fileObj.size,
      });

      if (rpcError) {
        // El monitor no tiene permiso DELETE en Storage; informar explícitamente sin intentar borrar ni cerrar localmente
        const msg = `La fotografía de salida se cargó en Storage (${uploadRes.fotoPath}), pero no se pudo registrar la salida del turno (${rpcError.message}). El archivo queda pendiente de limpieza administrativa posterior y tu turno sigue activo.`;
        addToast('Error al Finalizar Turno', msg, 'error');
        return { ok: false, error: msg, pendingStorageCleanupPath: uploadRes.fotoPath };
      }

      // 3. Resincronizar asistencia, estado del monitor y sala desde Supabase (sin calcular ni alterar horas en React)
      await Promise.all([
        fetchAsistencias(monitorActual.id),
        fetchCurrentMonitor(),
        fetchLaboratorios(),
      ]);

      addToast(
        'Salida Registrada',
        `Tu turno finalizó correctamente con evidencia Timemark (${uploadRes.codigoLimpio}) y quedó pendiente de validación por la coordinación.`,
        'success'
      );
      return { ok: true };
    } catch {
      const msg = 'Error inesperado de conexión al registrar la salida del turno en Supabase.';
      addToast('Error de Conexión', msg, 'error');
      return { ok: false, error: msg };
    }
  };

  // Coordinador: Registrar Verificación Manual Timemark
  const actualizarVerificacionTimemark = (
    asistenciaId: string,
    tipo: 'entrada' | 'salida',
    resultado: import('../types/database').ResultadoVerificacionTimemark,
    observaciones?: string
  ) => {
    const now = new Date();
    setAsistencias(prev => prev.map(a => {
      if (a.id === asistenciaId) {
        const updated = { ...a };
        if (tipo === 'entrada') {
          updated.timemark_entrada_resultado = resultado;
        } else {
          updated.timemark_salida_resultado = resultado;
        }
        updated.timemark_verificado_por = currentUser?.nombre_completo || 'Coordinador de Salas';
        updated.timemark_fecha_verificacion = now.toISOString();
        if (observaciones) {
          updated.timemark_observaciones = observaciones;
        }
        return updated;
      }
      return a;
    }));

    addToast('Verificación Timemark Registrada', `Marcación de ${tipo} marcada como: ${resultado}`, 'info');
  };

  // Coordinador: Aprobar Asistencia (Exige evidencias Timemark completas)
  const aprobarAsistencia = (asistenciaId: string, notasCoordinador?: string) => {
    const asistencia = asistencias.find(a => a.id === asistenciaId);
    if (!asistencia) return;

    // Regla 9: Si falta una fotografía o su código, la jornada debe permanecer pendiente de revisión
    const faltaEvidenciaEntrada = !asistencia.foto_entrada_url || !asistencia.timemark_entrada_codigo;
    const faltaEvidenciaSalida = !asistencia.foto_salida_url || !asistencia.timemark_salida_codigo;

    if (faltaEvidenciaEntrada || faltaEvidenciaSalida) {
      addToast(
        'Evidencias Incompletas',
        'La jornada carece de fotografía original o Photo Code de Timemark (en entrada o salida). La jornada debe permanecer en estado pendiente de revisión.',
        'error'
      );
      return;
    }

    if (asistencia.timemark_entrada_resultado === 'Falso' || asistencia.timemark_salida_resultado === 'Falso') {
      addToast(
        'Evidencia Inválida',
        'No es posible convalidar una jornada que contiene evidencias clasificadas como Falsas tras la verificación en Timemark.',
        'error'
      );
      return;
    }

    const horas = asistencia.horas_calculadas;

    setAsistencias(prev => prev.map(a => {
      if (a.id === asistenciaId) {
        return {
          ...a,
          estado: 'aprobada',
          notas_coordinador: notasCoordinador || 'Horas convalidadas tras verificación manual en Timemark.',
        };
      }
      return a;
    }));

    // Acreditar las horas solo si la asistencia pertenece a un registro real (no datos de demostración)
    if (!asistencia.es_dato_prueba) {
      setMonitores(prev => prev.map(m => {
        if (m.id === asistencia.monitor_id) {
          const nuevasAprobadas = Number((m.horas_aprobadas + horas).toFixed(1));
          const nuevasPendientes = Math.max(0, Number((m.horas_pendientes - horas).toFixed(1)));
          return {
            ...m,
            horas_aprobadas: nuevasAprobadas,
            horas_pendientes: nuevasPendientes,
          };
        }
        return m;
      }));
    }

    addToast('Jornada Aprobada', `Se han convalidado ${horas} horas para ${asistencia.monitor_nombre}.`, 'success');
  };

  // Coordinador: Rechazar Asistencia
  const rechazarAsistencia = (asistenciaId: string, motivo: string) => {
    const asistencia = asistencias.find(a => a.id === asistenciaId);
    if (!asistencia) return;

    const horas = asistencia.horas_calculadas;

    setAsistencias(prev => prev.map(a => {
      if (a.id === asistenciaId) {
        return {
          ...a,
          estado: 'rechazada',
          notas_coordinador: motivo,
        };
      }
      return a;
    }));

    // Descontar de pendientes solo si no es dato de demostración
    if (!asistencia.es_dato_prueba) {
      setMonitores(prev => prev.map(m => {
        if (m.id === asistencia.monitor_id) {
          return {
            ...m,
            horas_pendientes: Math.max(0, Number((m.horas_pendientes - horas).toFixed(1))),
          };
        }
        return m;
      }));
    }

    addToast('Jornada Rechazada', 'El registro ha sido marcado como no válido.', 'warning');
  };

  // Coordinador: Observar Asistencia
  const observarAsistencia = (asistenciaId: string, observacion: string) => {
    setAsistencias(prev => prev.map(a => {
      if (a.id === asistenciaId) {
        return {
          ...a,
          estado: 'observacion',
          notas_coordinador: observacion,
        };
      }
      return a;
    }));
    addToast('Observación Registrada', 'Se ha guardado la anotación técnica.', 'info');
  };

  // Monitores: Crear Novedad (local en esta fase, sin fallback a otro monitor)
  const crearNovedad = (novedadData: {
    tipo: TipoNovedad;
    titulo: string;
    descripcion: string;
    fecha_incidencia: string;
    horas_solicitadas?: number;
    asistencia_id?: string | null;
  }) => {
    if (!currentMonitorData && currentUser?.role !== 'admin') {
      addToast('Error de Sesión', 'No hay un monitor autenticado para radicar la novedad.', 'error');
      return;
    }

    const monitorId = currentMonitorData?.id || currentUser?.id || 'admin-local';
    const monitorNombre = currentMonitorData
      ? `${currentMonitorData.nombres} ${currentMonitorData.apellidos}`.trim()
      : currentUser?.nombre_completo || 'Coordinación';

    const nuevaNovedad: Novedad = {
      id: `nov-${Date.now()}`,
      monitor_id: monitorId,
      monitor_nombre: monitorNombre,
      asistencia_id: novedadData.asistencia_id || null,
      tipo: novedadData.tipo,
      titulo: novedadData.titulo,
      descripcion: novedadData.descripcion,
      fecha_incidencia: novedadData.fecha_incidencia,
      horas_solicitadas: novedadData.horas_solicitadas,
      estado: 'pendiente',
      es_dato_prueba: false,
      created_at: new Date().toISOString(),
    };

    setNovedades(prev => [nuevaNovedad, ...prev]);
    addToast('Novedad Radicada', 'Tu solicitud fue enviada a la coordinación de salas.', 'success');
  };

  // Coordinador: Resolver Novedad
  const resolverNovedad = (novedadId: string, estado: 'aprobada' | 'rechazada', respuesta: string) => {
    const nov = novedades.find(n => n.id === novedadId);
    if (!nov) return;

    setNovedades(prev => prev.map(n => {
      if (n.id === novedadId) {
        return {
          ...n,
          estado,
          respuesta_coordinador: respuesta,
          fecha_resolucion: new Date().toISOString(),
        };
      }
      return n;
    }));

    // Solo ajustar horas en memoria si la novedad no corresponde a datos de demostración
    if (!nov.es_dato_prueba && estado === 'aprobada' && nov.horas_solicitadas && nov.horas_solicitadas > 0) {
      setMonitores(prev => prev.map(m => {
        if (m.id === nov.monitor_id) {
          return {
            ...m,
            horas_aprobadas: Number((m.horas_aprobadas + nov.horas_solicitadas!).toFixed(1)),
          };
        }
        return m;
      }));
    }

    addToast(
      estado === 'aprobada' ? 'Novedad Aprobada' : 'Novedad Rechazada', 
      `Se ha respondido la solicitud de ${nov.monitor_nombre}.`,
      estado === 'aprobada' ? 'success' : 'warning'
    );
  };

  // Auxiliar de formato de errores de escritura en public.monitores (incluye RLS, unicidad y triggers)
  const formatMonitorWriteError = (
    error: { code?: string; message?: string; details?: string; hint?: string },
    accion: string
  ): string => {
    const rawMsg = (error.message || '').toLowerCase();
    const isRlsOrPermission =
      error.code === '42501' ||
      rawMsg.includes('permission denied') ||
      rawMsg.includes('row-level security');

    if (isRlsOrPermission) {
      return `Permisos insuficientes (RLS) para ${accion}. Verifica las políticas UPDATE/SELECT en public.monitores (o permisos del trigger en historial_metas). (${error.message})`;
    }

    if (error.code === '23505') {
      if (rawMsg.includes('codigo')) {
        return 'Ya existe otro monitor registrado en Supabase con ese código estudiantil.';
      }
      if (rawMsg.includes('correo') || rawMsg.includes('email')) {
        return 'Ya existe otro monitor registrado en Supabase con ese correo institucional.';
      }
      return 'Ya existe un registro en Supabase con un código estudiantil o correo institucional duplicado.';
    }

    if (error.code === '23503') {
      return 'La sala habitual seleccionada no existe en public.laboratorios.';
    }

    if (error.code === '23514') {
      return `Uno de los valores no cumple las restricciones de validación en Supabase (${error.message}).`;
    }

    const extra = error.details ? ` Detalle: ${error.details}` : '';
    return `No se pudo ${accion} en Supabase (${error.code ? `${error.code}: ` : ''}${error.message || 'error desconocido'}).${extra}`;
  };

  // Fase 2 (Admin): Editar información personal/académica y sala habitual en public.monitores
  const actualizarInfoMonitor = async (
    monitorId: string,
    payload: MonitorEditPayload
  ): Promise<{ ok: boolean; error?: string; monitor?: Monitor }> => {
    if (currentRoleRef.current !== 'admin') {
      const msg = 'Solo el administrador coordinador tiene permisos para editar monitores.';
      addToast('Acceso Denegado', msg, 'error');
      return { ok: false, error: msg };
    }

    if (!supabase || !isSupabaseConfigured) {
      const msg = 'La conexión con Supabase no está configurada.';
      addToast('Error de Conexión', msg, 'error');
      return { ok: false, error: msg };
    }

    const existing = monitores.find((m) => m.id === monitorId);
    if (!existing) {
      const msg = 'No se encontró el monitor seleccionado.';
      addToast('Error', msg, 'error');
      return { ok: false, error: msg };
    }

    const nombres = payload.nombres.trim();
    const apellidos = payload.apellidos.trim();
    const codigo_estudiantil = payload.codigo_estudiantil.trim();
    const correo_institucional = payload.correo_institucional.trim().toLowerCase();
    const telefono = payload.telefono.trim();
    const semestre = Math.round(Number(payload.semestre));

    if (!nombres || !apellidos || !codigo_estudiantil || !correo_institucional || !telefono) {
      const msg = 'Todos los campos personales y académicos marcados como obligatorios deben estar completos.';
      addToast('Campos Obligatorios', msg, 'warning');
      return { ok: false, error: msg };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo_institucional)) {
      const msg = 'El correo institucional ingresado no tiene un formato válido.';
      addToast('Correo Inválido', msg, 'warning');
      return { ok: false, error: msg };
    }

    if (!VALID_PROGRAMAS.includes(payload.programa_academico)) {
      const msg = 'El programa académico seleccionado no es válido.';
      addToast('Programa Inválido', msg, 'warning');
      return { ok: false, error: msg };
    }

    if (!Number.isInteger(semestre) || semestre < 1 || semestre > 10) {
      const msg = 'El semestre debe ser un número entero entre 1 y 10.';
      addToast('Semestre Inválido', msg, 'warning');
      return { ok: false, error: msg };
    }

    const duplicateCodigo = monitores.some(
      (m) => m.id !== monitorId && m.codigo_estudiantil.trim().toLowerCase() === codigo_estudiantil.toLowerCase()
    );
    if (duplicateCodigo) {
      const msg = `El código estudiantil "${codigo_estudiantil}" ya está asignado a otro monitor.`;
      addToast('Código Duplicado', msg, 'warning');
      return { ok: false, error: msg };
    }

    const duplicateCorreo = monitores.some(
      (m) => m.id !== monitorId && m.correo_institucional.trim().toLowerCase() === correo_institucional
    );
    if (duplicateCorreo) {
      const msg = `El correo institucional "${correo_institucional}" ya está asignado a otro monitor.`;
      addToast('Correo Duplicado', msg, 'warning');
      return { ok: false, error: msg };
    }

    const labId = payload.laboratorio_habitual_id ? payload.laboratorio_habitual_id.trim() : null;
    if (labId !== null && !laboratorios.some((l) => l.id === labId)) {
      const msg = 'La sala habitual seleccionada no corresponde a una sala válida de public.laboratorios.';
      addToast('Sala Inválida', msg, 'error');
      return { ok: false, error: msg };
    }

    try {
      const { data, error } = await supabase
        .from('monitores')
        .update({
          nombres,
          apellidos,
          codigo_estudiantil,
          correo_institucional,
          programa_academico: payload.programa_academico,
          semestre,
          telefono,
          laboratorio_habitual_id: labId,
        })
        .eq('id', monitorId)
        .select('*')
        .maybeSingle();

      if (error) {
        const msg = formatMonitorWriteError(error, 'actualizar la información del monitor');
        addToast('Error al Guardar Monitor', msg, 'error');
        return { ok: false, error: msg };
      }

      if (!data) {
        const msg = 'Supabase no devolvió el registro actualizado. Verifica que tu perfil administrador tenga políticas RLS de UPDATE y SELECT en public.monitores.';
        addToast('Actualización No Confirmada', msg, 'error');
        return { ok: false, error: msg };
      }

      const updatedMonitor = mapMonitorRow(data as Record<string, unknown>, metaGeneralHoras);
      setMonitores((prev) => prev.map((m) => (m.id === monitorId ? updatedMonitor : m)));
      addToast(
        'Monitor Actualizado',
        `Los datos de ${updatedMonitor.nombres} ${updatedMonitor.apellidos} se guardaron en Supabase.`,
        'success'
      );
      return { ok: true, monitor: updatedMonitor };
    } catch {
      const msg = 'Error inesperado de red al actualizar el monitor en Supabase.';
      addToast('Error de Conexión', msg, 'error');
      return { ok: false, error: msg };
    }
  };

  // Fase 2 (Admin): Activar o inactivar monitor en public.monitores (sin permitir inactivar si está en_turno)
  const cambiarEstadoMonitor = async (
    monitorId: string,
    nuevoEstado: 'activo' | 'inactivo'
  ): Promise<{ ok: boolean; error?: string; monitor?: Monitor }> => {
    if (currentRoleRef.current !== 'admin') {
      const msg = 'Solo el administrador coordinador puede activar o inactivar monitores.';
      addToast('Acceso Denegado', msg, 'error');
      return { ok: false, error: msg };
    }

    if (nuevoEstado !== 'activo' && nuevoEstado !== 'inactivo') {
      const msg = 'Solo se permite cambiar el estado administrativo entre activo e inactivo.';
      addToast('Estado Inválido', msg, 'error');
      return { ok: false, error: msg };
    }

    if (!supabase || !isSupabaseConfigured) {
      const msg = 'La conexión con Supabase no está configurada.';
      addToast('Error de Conexión', msg, 'error');
      return { ok: false, error: msg };
    }

    const existing = monitores.find((m) => m.id === monitorId);
    if (!existing) {
      const msg = 'No se encontró el monitor seleccionado.';
      addToast('Error', msg, 'error');
      return { ok: false, error: msg };
    }

    if (existing.estado === 'en_turno' && nuevoEstado === 'inactivo') {
      const msg = 'No es posible inactivar un monitor cuyo estado actual es "en_turno".';
      addToast('Operación No Permitida', msg, 'warning');
      return { ok: false, error: msg };
    }

    if (existing.estado === nuevoEstado) {
      return { ok: true, monitor: existing };
    }

    try {
      const { data, error } = await supabase
        .from('monitores')
        .update({ estado: nuevoEstado })
        .eq('id', monitorId)
        .select('*')
        .maybeSingle();

      if (error) {
        const msg = formatMonitorWriteError(error, 'cambiar el estado del monitor');
        addToast('Error al Cambiar Estado', msg, 'error');
        return { ok: false, error: msg };
      }

      if (!data) {
        const msg = 'Supabase no devolvió el registro actualizado. Verifica las políticas RLS de UPDATE y SELECT en public.monitores.';
        addToast('Actualización No Confirmada', msg, 'error');
        return { ok: false, error: msg };
      }

      const updatedMonitor = mapMonitorRow(data as Record<string, unknown>, metaGeneralHoras);
      setMonitores((prev) => prev.map((m) => (m.id === monitorId ? updatedMonitor : m)));
      addToast(
        nuevoEstado === 'inactivo' ? 'Monitor Inactivado' : 'Monitor Reactivado',
        `${updatedMonitor.nombres} ${updatedMonitor.apellidos} ahora tiene estado "${updatedMonitor.estado}" en Supabase.`,
        'success'
      );
      return { ok: true, monitor: updatedMonitor };
    } catch {
      const msg = 'Error inesperado de red al actualizar el estado del monitor en Supabase.';
      addToast('Error de Conexión', msg, 'error');
      return { ok: false, error: msg };
    }
  };

  // Fase 2 (Admin): Modificar horas_asignadas individualmente en public.monitores (dispara trigger SQL registrar_cambio_meta si existe)
  const actualizarHorasAsignadasMonitor = async (
    monitorId: string,
    nuevasHoras: number
  ): Promise<{ ok: boolean; error?: string; monitor?: Monitor }> => {
    if (currentRoleRef.current !== 'admin') {
      const msg = 'Solo el administrador coordinador puede modificar las horas asignadas.';
      addToast('Acceso Denegado', msg, 'error');
      return { ok: false, error: msg };
    }

    if (!supabase || !isSupabaseConfigured) {
      const msg = 'La conexión con Supabase no está configurada.';
      addToast('Error de Conexión', msg, 'error');
      return { ok: false, error: msg };
    }

    const horasValidas = Number(nuevasHoras);
    if (!Number.isFinite(horasValidas) || horasValidas <= 0) {
      const msg = 'Las horas asignadas deben ser un número válido mayor que cero.';
      addToast('Valor Inválido', msg, 'warning');
      return { ok: false, error: msg };
    }

    const existing = monitores.find((m) => m.id === monitorId);
    if (!existing) {
      const msg = 'No se encontró el monitor seleccionado.';
      addToast('Error', msg, 'error');
      return { ok: false, error: msg };
    }

    if (horasValidas === existing.horas_asignadas) {
      return { ok: true, monitor: existing };
    }

    try {
      const { data, error } = await supabase
        .from('monitores')
        .update({ horas_asignadas: horasValidas })
        .eq('id', monitorId)
        .select('*')
        .maybeSingle();

      if (error) {
        const msg = formatMonitorWriteError(error, 'actualizar las horas asignadas del monitor');
        addToast('Error al Modificar Horas Asignadas', msg, 'error');
        return { ok: false, error: msg };
      }

      if (!data) {
        const msg = 'Supabase no devolvió el registro actualizado. Verifica las políticas RLS de UPDATE y SELECT en public.monitores.';
        addToast('Actualización No Confirmada', msg, 'error');
        return { ok: false, error: msg };
      }

      const updatedMonitor = mapMonitorRow(data as Record<string, unknown>, metaGeneralHoras);
      setMonitores((prev) => prev.map((m) => (m.id === monitorId ? updatedMonitor : m)));
      addToast(
        'Horas Asignadas Actualizadas',
        `Meta individual de ${updatedMonitor.nombres} ${updatedMonitor.apellidos} actualizada a ${updatedMonitor.horas_asignadas} horas en Supabase.`,
        'success'
      );
      return { ok: true, monitor: updatedMonitor };
    } catch {
      const msg = 'Error inesperado de red al modificar las horas asignadas en Supabase.';
      addToast('Error de Conexión', msg, 'error');
      return { ok: false, error: msg };
    }
  };

  // Coordinador: crear monitor (cuenta de Auth + perfil + registro) mediante la Edge Function "gestionar-monitores"
  const invocarGestionMonitores = async (
    body: Record<string, unknown>
  ): Promise<{ ok: boolean; error?: string }> => {
    if (currentRoleRef.current !== 'admin') {
      const msg = 'Solo el coordinador puede gestionar monitores.';
      addToast('Acceso Denegado', msg, 'error');
      return { ok: false, error: msg };
    }
    if (!supabase || !isSupabaseConfigured) {
      const msg = 'La conexión con Supabase no está configurada.';
      addToast('Error de Conexión', msg, 'error');
      return { ok: false, error: msg };
    }

    try {
      const { data, error } = await supabase.functions.invoke('gestionar-monitores', { body });
      if (error) {
        let detalle = error.message;
        const ctx = (error as { context?: Response }).context;
        if (ctx && typeof ctx.json === 'function') {
          try {
            const payload = await ctx.json();
            if (payload?.error) detalle = String(payload.error);
          } catch {
            // se conserva el mensaje original
          }
        }
        return { ok: false, error: detalle || 'La función gestionar-monitores no respondió correctamente.' };
      }
      if (data && typeof data === 'object' && 'error' in data && data.error) {
        return { ok: false, error: String(data.error) };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: 'Error de red al contactar la función gestionar-monitores en Supabase.' };
    }
  };

  const crearMonitor = async (payload: NuevoMonitorPayload): Promise<{ ok: boolean; error?: string }> => {
    const nombres = payload.nombres.trim();
    const apellidos = payload.apellidos.trim();
    const codigo = payload.codigo_estudiantil.trim();
    const correo = payload.correo_institucional.trim().toLowerCase();
    const telefono = payload.telefono.trim();
    const semestre = Math.round(Number(payload.semestre));

    const fail = (title: string, msg: string) => {
      addToast(title, msg, 'warning');
      return { ok: false, error: msg };
    };

    if (!nombres || !apellidos || !codigo || !correo || !telefono) {
      return fail('Campos Obligatorios', 'Completa todos los campos obligatorios del monitor.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return fail('Correo Inválido', 'El correo institucional no tiene un formato válido.');
    }
    if (!VALID_PROGRAMAS.includes(payload.programa_academico)) {
      return fail('Programa Inválido', 'El programa académico seleccionado no es válido.');
    }
    if (!Number.isInteger(semestre) || semestre < 1 || semestre > 10) {
      return fail('Semestre Inválido', 'El semestre debe ser un número entero entre 1 y 10.');
    }
    if (!payload.password || payload.password.length < 8) {
      return fail('Contraseña Débil', 'La contraseña temporal debe tener al menos 8 caracteres.');
    }
    if (monitores.some((m) => m.codigo_estudiantil.trim().toLowerCase() === codigo.toLowerCase())) {
      return fail('Código Duplicado', `El código estudiantil "${codigo}" ya está asignado a otro monitor.`);
    }
    if (monitores.some((m) => m.correo_institucional.trim().toLowerCase() === correo)) {
      return fail('Correo Duplicado', `El correo "${correo}" ya está asignado a otro monitor.`);
    }

    const res = await invocarGestionMonitores({
      accion: 'crear',
      nombres,
      apellidos,
      codigo_estudiantil: codigo,
      correo_institucional: correo,
      programa_academico: payload.programa_academico,
      semestre,
      telefono,
      password: payload.password,
      horas_asignadas: metaGeneralHoras,
    });

    if (!res.ok) {
      addToast('No se Pudo Crear el Monitor', res.error || 'Error desconocido.', 'error');
      return res;
    }

    await fetchMonitores();
    addToast('Monitor Registrado', `${nombres} ${apellidos} fue registrado y ya puede iniciar sesión.`, 'success');
    return { ok: true };
  };

  const eliminarMonitor = async (monitorId: string): Promise<{ ok: boolean; error?: string }> => {
    const existing = monitores.find((m) => m.id === monitorId);
    if (!existing) {
      const msg = 'No se encontró el monitor seleccionado.';
      addToast('Error', msg, 'error');
      return { ok: false, error: msg };
    }
    if (existing.estado === 'en_turno') {
      const msg = 'No se puede eliminar un monitor que está en turno. Espera a que finalice su jornada.';
      addToast('Monitor en Turno', msg, 'warning');
      return { ok: false, error: msg };
    }

    const res = await invocarGestionMonitores({ accion: 'eliminar', monitor_id: monitorId });
    if (!res.ok) {
      addToast('No se Pudo Eliminar el Monitor', res.error || 'Error desconocido.', 'error');
      return res;
    }

    setMonitores((prev) => prev.filter((m) => m.id !== monitorId));
    addToast('Monitor Eliminado', `${existing.nombres} ${existing.apellidos} fue eliminado del registro.`, 'success');
    return { ok: true };
  };

  // Coordinador: sumar o restar horas aprobadas manualmente a cualquier monitor
  const ajustarHorasMonitor = async (
    monitorId: string,
    horas: number,
    operacion: 'sumar' | 'restar'
  ): Promise<{ ok: boolean; error?: string; monitor?: Monitor }> => {
    if (currentRoleRef.current !== 'admin') {
      const msg = 'Solo el coordinador puede ajustar horas manualmente.';
      addToast('Acceso Denegado', msg, 'error');
      return { ok: false, error: msg };
    }
    if (!supabase || !isSupabaseConfigured) {
      const msg = 'La conexión con Supabase no está configurada.';
      addToast('Error de Conexión', msg, 'error');
      return { ok: false, error: msg };
    }

    const cantidad = Number(horas);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      const msg = 'Ingresa una cantidad de horas mayor que cero.';
      addToast('Valor Inválido', msg, 'warning');
      return { ok: false, error: msg };
    }

    const existing = monitores.find((m) => m.id === monitorId);
    if (!existing) {
      const msg = 'No se encontró el monitor seleccionado.';
      addToast('Error', msg, 'error');
      return { ok: false, error: msg };
    }

    const nuevoTotal =
      operacion === 'sumar'
        ? existing.horas_aprobadas + cantidad
        : existing.horas_aprobadas - cantidad;

    if (nuevoTotal < 0) {
      const msg = `No es posible restar ${cantidad} horas: el monitor solo tiene ${existing.horas_aprobadas} horas aprobadas.`;
      addToast('Horas Insuficientes', msg, 'warning');
      return { ok: false, error: msg };
    }

    try {
      const { data, error } = await supabase
        .from('monitores')
        .update({ horas_aprobadas: Number(nuevoTotal.toFixed(2)) })
        .eq('id', monitorId)
        .select('*')
        .maybeSingle();

      if (error) {
        const msg = formatMonitorWriteError(error, 'ajustar las horas del monitor');
        addToast('Error al Ajustar Horas', msg, 'error');
        return { ok: false, error: msg };
      }
      if (!data) {
        const msg = 'Supabase no devolvió el registro actualizado. Verifica las políticas RLS de UPDATE en public.monitores.';
        addToast('Ajuste No Confirmado', msg, 'error');
        return { ok: false, error: msg };
      }

      const updated = mapMonitorRow(data as Record<string, unknown>, metaGeneralHoras);
      setMonitores((prev) => prev.map((m) => (m.id === monitorId ? updated : m)));
      addToast(
        operacion === 'sumar' ? 'Horas Añadidas' : 'Horas Descontadas',
        `${updated.nombres} ${updated.apellidos} ahora tiene ${updated.horas_aprobadas} horas aprobadas.`,
        'success'
      );
      return { ok: true, monitor: updated };
    } catch {
      const msg = 'Error inesperado de red al ajustar las horas en Supabase.';
      addToast('Error de Conexión', msg, 'error');
      return { ok: false, error: msg };
    }
  };

  // Monitor: cierre automático de un turno que superó 8 h 10 min sin marcar salida
  const cerrarTurnoVencido = async (): Promise<void> => {
    const monitorActual = currentMonitorRef.current;
    if (currentRoleRef.current !== 'monitor' || !monitorActual || !supabase || !isSupabaseConfigured) {
      return;
    }

    try {
      const { error } = await supabase.rpc('cerrar_turno_vencido', {
        p_max_minutos: MAX_TURNO_MINUTOS,
      });
      if (error) {
        addToast(
          'Turno Vencido',
          `Tu turno superó las 8 h 10 min. No se pudo pausar automáticamente (${error.message}). Informa a la coordinación.`,
          'error'
        );
        return;
      }

      await Promise.all([
        fetchAsistencias(monitorActual.id),
        fetchCurrentMonitor(),
        fetchLaboratorios(),
      ]);
      addToast(
        'Turno Pausado Automáticamente',
        'Olvidaste marcar la salida: tu turno se cerró al cumplir 8 h 10 min y quedó en observación para la coordinación. Radica una novedad si necesitas ajustar las horas.',
        'warning'
      );
    } catch {
      // se reintentará en el siguiente ciclo del reloj
    }
  };

  // Fase 2: Sin creación de cuentas desde el cliente (se implementará en fase posterior con Edge Functions)
  const agregarMonitor = () => {
    addToast(
      'Acción No Habilitada en Fase 2',
      'La creación de nuevas cuentas de monitores en Supabase Auth se implementará en una fase posterior.',
      'info'
    );
  };

  const actualizarMonitor = () => {
    addToast(
      'Usar Acciones Específicas',
      'Utiliza las acciones de edición, cambio de estado o meta individual desde el módulo de Monitores.',
      'info'
    );
  };

  // Actualizar estado de sala en Supabase
  const actualizarLaboratorio = async (
    labId: string,
    estado: EstadoLaboratorio
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!supabase || !isSupabaseConfigured) {
      const msg = 'La conexión con Supabase no está configurada.';
      addToast('Error de Conexión', msg, 'error');
      return { ok: false, error: msg };
    }

    const existing = laboratorios.find((l) => l.id === labId);
    if (!existing) {
      const msg = 'No se encontró la sala seleccionada.';
      addToast('Error', msg, 'error');
      return { ok: false, error: msg };
    }

    if (estado === existing.estado) {
      return { ok: true };
    }

    try {
      const { data, error } = await supabase
        .from('laboratorios')
        .update({ estado })
        .eq('id', labId)
        .select('*')
        .maybeSingle();

      if (error) {
        const isRlsOrPermission =
          error.code === '42501' ||
          error.message?.toLowerCase().includes('permission denied') ||
          error.message?.toLowerCase().includes('row-level security');

        const msg = isRlsOrPermission
          ? 'No tienes permisos RLS para actualizar registros en public.laboratorios.'
          : `No se pudo actualizar el estado en Supabase (${error.message}).`;

        addToast('Error al Actualizar Sala', msg, 'error');
        return { ok: false, error: msg };
      }

      if (!data) {
        const msg = 'Supabase no devolvió el registro actualizado. Verifica las políticas RLS de actualización en public.laboratorios.';
        addToast('Actualización No Confirmada', msg, 'error');
        return { ok: false, error: msg };
      }

      const updatedLab = mapLaboratorioRow(data as Record<string, unknown>);
      setLaboratorios((prev) => prev.map((l) => (l.id === labId ? updatedLab : l)));
      addToast('Sala Actualizada', `Estado de ${updatedLab.nombre} guardado en Supabase.`, 'success');
      return { ok: true };
    } catch {
      const msg = 'Error inesperado de red al actualizar la sala en Supabase.';
      addToast('Error de Conexión', msg, 'error');
      return { ok: false, error: msg };
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole: currentUser?.role ?? null,
        authInitializing,
        authLoading,
        authError,
        clearAuthError,
        activeTab,
        monitores,
        monitoresLoading,
        monitoresError,
        laboratorios,
        laboratoriosLoading,
        laboratoriosError,
        asistencias,
        asistenciasLoading,
        asistenciasError,
        novedades,
        periodo,
        toasts,
        currentMonitorData,
        activeAsistenciaActual,
        metaGeneralHoras,
        configurarMetaGeneral,
        login,
        logout,
        setActiveTab,
        addToast,
        removeToast,
        fetchMonitores,
        fetchCurrentMonitor,
        actualizarInfoMonitor,
        cambiarEstadoMonitor,
        actualizarHorasAsignadasMonitor,
        crearMonitor,
        eliminarMonitor,
        ajustarHorasMonitor,
        cerrarTurnoVencido,
        agregarMonitor,
        actualizarMonitor,
        fetchLaboratorios,
        actualizarLaboratorio,
        fetchAsistencias,
        registrarEntrada,
        registrarSalida,
        actualizarVerificacionTimemark,
        aprobarAsistencia,
        rechazarAsistencia,
        observarAsistencia,
        crearNovedad,
        resolverNovedad,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser utilizado dentro de un AppProvider');
  }
  return context;
};
