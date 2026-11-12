/**
 * Definición de tipos de base de datos para ControlMonitores
 * Diseñado conforme a la arquitectura y esquema de tablas de Supabase (PostgreSQL).
 */

export type Role = 'admin' | 'monitor';

export type ProgramaAcademico = 
  | 'Administración de Empresas'
  | 'Contaduría Pública'
  | 'Economía';

export type EstadoMonitor = 'activo' | 'inactivo' | 'en_turno';

export type EstadoLaboratorio = 'disponible' | 'en_uso' | 'mantenimiento';

export type EstadoAsistencia = 'en_curso' | 'pendiente_validacion' | 'aprobada' | 'rechazada' | 'observacion';

export type TipoNovedad = 
  | 'olvido_salida'
  | 'cambio_turno'
  | 'justificacion_inasistencia'
  | 'dano_equipo'
  | 'otro';

export type EstadoNovedad = 'pendiente' | 'aprobada' | 'rechazada';

// 1. Tabla: monitores
export interface Monitor {
  id: string;
  user_id?: string; // Vinculado a auth.users en Supabase
  nombres: string;
  apellidos: string;
  codigo_estudiantil: string;
  correo_institucional: string;
  programa_academico: ProgramaAcademico;
  semestre: number;
  horas_asignadas: number; // Meta general de cumplimiento de horas (configurable por el coordinador, default 112 horas)
  horas_aprobadas: number;
  horas_pendientes: number;
  estado: EstadoMonitor;
  telefono: string;
  foto_url?: string; // Supabase Storage bucket 'avatars'
  laboratorio_habitual_id?: string;
  created_at: string;
}

// 2. Tabla: laboratorios
export interface Laboratorio {
  id: string;
  nombre: string;
  codigo: string; // Ej: LAB-FEA-01
  ubicacion: string; // Ej: Edificio Central, Piso 2, Ala Sur
  capacidad_equipos: number;
  equipos_operativos: number;
  software_instalado: string[];
  descripcion: string;
  estado: EstadoLaboratorio;
  monitor_actual_id?: string | null;
  horario_atencion: string;
  created_at: string;
}

export type ResultadoVerificacionTimemark = 
  | 'Pendiente'
  | 'Auténtico'
  | 'Falso'
  | 'No encontrado'
  | 'No se puede verificar';

export interface EvidenciaTimemark {
  tipo: 'entrada' | 'salida';
  foto_url?: string;
  photo_code: string; // Código alfanumérico generado por Timemark (ej: TMK-849204-FEA)
  resultado_verificacion: ResultadoVerificacionTimemark;
  fecha_verificacion?: string;
  verificado_por?: string;
  observaciones_verificacion?: string;
}

// 3. Tabla: asistencias (Registros de turnos)
export interface Asistencia {
  id: string;
  monitor_id: string;
  monitor_nombre?: string;
  laboratorio_id: string;
  laboratorio_nombre?: string;
  fecha: string; // YYYY-MM-DD
  hora_entrada: string; // HH:mm:ss
  hora_salida?: string | null; // HH:mm:ss
  horas_calculadas: number;
  estado: EstadoAsistencia;
  foto_entrada_url?: string; // Supabase Storage bucket 'evidencias-timemark'
  foto_entrada_nombre?: string;
  foto_entrada_tamano?: number;
  foto_salida_url?: string;
  foto_salida_nombre?: string;
  foto_salida_tamano?: number;
  
  // Evidencias Timemark oficiales
  timemark_entrada_codigo?: string; // Photo Code de 14 caracteres de Timemark
  timemark_entrada_resultado?: ResultadoVerificacionTimemark;
  timemark_salida_codigo?: string; // Photo Code de 14 caracteres de Timemark
  timemark_salida_resultado?: ResultadoVerificacionTimemark;
  timemark_verificado_por?: string;
  timemark_fecha_verificacion?: string;
  timemark_observaciones?: string;

  // Identificador de registros de demostración visual
  es_dato_prueba?: boolean;

  latitud?: number;
  longitud?: number;
  notas_estudiante?: string;
  notas_coordinador?: string;
  created_at: string;
}

export interface ArchivoEvidencia {
  dataUrl: string;
  nombre: string;
  tamano: number;
  tipoMime: string;
}

// 4. Tabla: novedades (Solicitudes de corrección e incidencias)
export interface Novedad {
  id: string;
  monitor_id: string;
  monitor_nombre?: string;
  asistencia_id?: string | null;
  tipo: TipoNovedad;
  titulo: string;
  descripcion: string;
  fecha_incidencia: string;
  horas_solicitadas?: number;
  estado: EstadoNovedad;
  respuesta_coordinador?: string;
  fecha_resolucion?: string;
  evidencia_url?: string;
  created_at: string;
}

// 5. Tabla: periodos_academicos
export interface PeriodoAcademico {
  id: string;
  codigo: string; // '2026-1'
  nombre: string; // 'Periodo Académico 2026 - I'
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
}

// Perfil de usuario para autenticación
export interface UserProfile {
  id: string;
  email: string;
  nombre_completo: string;
  role: Role;
  monitor_id?: string; // Solo si el usuario es monitor
  cargo_descripcion?: string;
}
