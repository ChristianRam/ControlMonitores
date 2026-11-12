import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Monitor, 
  Laboratorio, 
  Asistencia, 
  Novedad, 
  PeriodoAcademico, 
  UserProfile,
  TipoNovedad,
  Role,
  ArchivoEvidencia
} from '../types/database';
import { 
  mockMonitores, 
  mockLaboratorios, 
  mockAsistencias, 
  mockNovedades, 
  mockPeriodoActual, 
  mockUsuarios 
} from '../data/mockData';

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

interface AppContextType {
  currentUser: UserProfile | null;
  currentRole: Role;
  activeTab: NavigationTab;
  monitores: Monitor[];
  laboratorios: Laboratorio[];
  asistencias: Asistencia[];
  novedades: Novedad[];
  periodo: PeriodoAcademico;
  toasts: ToastMessage[];
  currentMonitorData: Monitor | null;
  activeAsistenciaActual: Asistencia | null;
  metaGeneralHoras: number;
  configurarMetaGeneral: (nuevasHoras: number, actualizarMonitoresExistentes?: boolean) => void;
  
  // Acciones de autenticación y navegación
  login: (role: Role, email?: string) => void;
  logout: () => void;
  switchRole: (role: Role) => void;
  setActiveTab: (tab: NavigationTab) => void;
  addToast: (title: string, message?: string, type?: ToastType) => void;
  removeToast: (id: string) => void;

  // Acciones de gestión de monitores
  agregarMonitor: (monitor: Omit<Monitor, 'id' | 'horas_aprobadas' | 'horas_pendientes' | 'created_at'>) => void;
  actualizarMonitor: (monitor: Monitor) => void;
  
  // Acciones de laboratorios
  actualizarLaboratorio: (lab: Laboratorio) => void;

  // Acciones de turnos y asistencias
  registrarEntrada: (laboratorioId: string, notas?: string, fotoArchivo?: ArchivoEvidencia | string, timemarkCodigo?: string) => boolean;
  registrarSalida: (asistenciaId: string, notas?: string, fotoArchivo?: ArchivoEvidencia | string, timemarkCodigo?: string) => boolean;
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
  // Estado inicial autenticado como administrador para exploración rápida
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(mockUsuarios[0]);
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  
  const [monitores, setMonitores] = useState<Monitor[]>(mockMonitores);
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>(mockLaboratorios);
  const [asistencias, setAsistencias] = useState<Asistencia[]>(mockAsistencias);
  const [novedades, setNovedades] = useState<Novedad[]>(mockNovedades);
  const [periodo] = useState<PeriodoAcademico>(mockPeriodoActual);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Meta general de horas de cumplimiento (configurable por coordinador, default 112)
  const [metaGeneralHoras, setMetaGeneralHoras] = useState<number>(112);

  const configurarMetaGeneral = (nuevasHoras: number, actualizarMonitoresExistentes: boolean = true) => {
    const horasValidas = Math.max(1, Math.round(Number(nuevasHoras) || 112));
    setMetaGeneralHoras(horasValidas);
    if (actualizarMonitoresExistentes) {
      setMonitores(prev => prev.map(m => ({ ...m, horas_asignadas: horasValidas })));
    }
    addToast('Meta Actualizada', `Se ha fijado la meta general de cumplimiento en ${horasValidas} horas.`, 'success');
  };

  // Monitor activo actual si el usuario es monitor
  const currentMonitorData = currentUser?.monitor_id 
    ? monitores.find(m => m.id === currentUser.monitor_id) || null 
    : null;

  // Asistencia en curso actual del monitor logueado
  const activeAsistenciaActual = currentMonitorData
    ? asistencias.find(a => a.monitor_id === currentMonitorData.id && a.estado === 'en_curso') || null
    : null;

  const addToast = (title: string, message?: string, type: ToastType = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const login = (role: Role, email?: string) => {
    const user = mockUsuarios.find(u => u.role === role) || (
      role === 'admin' ? mockUsuarios[0] : mockUsuarios[1]
    );
    setCurrentUser(user);
    if (role === 'admin') {
      setActiveTab('dashboard');
      addToast('Sesión Iniciada', `Bienvenido al panel administrativo, ${user.nombre_completo}`, 'success');
    } else {
      setActiveTab('monitor_dashboard');
      addToast('Sesión Iniciada', `Bienvenida al portal de monitores, ${user.nombre_completo}`, 'success');
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveTab('login');
    addToast('Sesión Finalizada', 'Has cerrado sesión correctamente del sistema.', 'info');
  };

  const switchRole = (role: Role) => {
    const user = mockUsuarios.find(u => u.role === role);
    if (user) {
      setCurrentUser(user);
      if (role === 'admin') {
        setActiveTab('dashboard');
        addToast('Rol Cambiado', 'Ahora estás en modo Administrador / Coordinador.', 'info');
      } else {
        setActiveTab('monitor_dashboard');
        addToast('Rol Cambiado', 'Ahora estás en modo Monitor Académico.', 'info');
      }
    }
  };

  // Turno: Registrar Entrada con Fotografía Original Timemark
  const registrarEntrada = (
    laboratorioId: string, 
    notas?: string, 
    fotoArchivo?: ArchivoEvidencia | string, 
    timemarkCodigo?: string
  ) => {
    if (!currentMonitorData) {
      addToast('Error de Sesión', 'No hay un monitor activo identificado.', 'error');
      return false;
    }

    const lab = laboratorios.find(l => l.id === laboratorioId);
    if (!lab) {
      addToast('Error', 'Laboratorio no encontrado.', 'error');
      return false;
    }

    // 1. Validación estricta del Photo Code: exactamente 14 caracteres alfanuméricos
    const codigoLimpio = timemarkCodigo ? timemarkCodigo.trim().toUpperCase() : '';
    if (!codigoLimpio) {
      addToast('Photo Code Requerido', 'Debes ingresar el Photo Code de 14 caracteres impreso en tu fotografía de Timemark.', 'error');
      return false;
    }

    const esFormatoValido = /^[A-Z0-9]{14}$/.test(codigoLimpio);
    if (!esFormatoValido) {
      addToast(
        'Formato de Photo Code Inválido',
        `El Photo Code ingresado tiene ${codigoLimpio.length} caracteres. Debe tener exactamente 14 caracteres alfanuméricos (solo letras y números, sin guiones ni espacios).`,
        'error'
      );
      return false;
    }

    // 2. Validación de Fotografía Original cargada desde el dispositivo
    if (!fotoArchivo) {
      addToast('Fotografía Original Requerida', 'Debes cargar la fotografía original tomada con la aplicación Timemark.', 'warning');
      return false;
    }

    const now = new Date();
    const hora = now.toTimeString().split(' ')[0]; // HH:mm:ss
    const fecha = now.toISOString().split('T')[0]; // YYYY-MM-DD

    // Extracción de datos del archivo original cargado
    const fotoUrl = typeof fotoArchivo === 'string' ? fotoArchivo : fotoArchivo.dataUrl;
    const fotoNombre = typeof fotoArchivo === 'string' ? undefined : fotoArchivo.nombre;
    const fotoTamano = typeof fotoArchivo === 'string' ? undefined : fotoArchivo.tamano;

    const nuevaAsistencia: Asistencia = {
      id: `asist-${Date.now()}`,
      monitor_id: currentMonitorData.id,
      monitor_nombre: `${currentMonitorData.nombres} ${currentMonitorData.apellidos}`,
      laboratorio_id: lab.id,
      laboratorio_nombre: lab.nombre,
      fecha,
      hora_entrada: hora,
      hora_salida: null,
      horas_calculadas: 0,
      estado: 'en_curso',
      foto_entrada_url: fotoUrl,
      foto_entrada_nombre: fotoNombre,
      foto_entrada_tamano: fotoTamano,
      timemark_entrada_codigo: codigoLimpio,
      timemark_entrada_resultado: 'Pendiente',
      notas_estudiante: notas,
      es_dato_prueba: false,
      created_at: now.toISOString(),
    };

    setAsistencias(prev => [nuevaAsistencia, ...prev]);

    // Actualizar estado del monitor
    setMonitores(prev => prev.map(m => m.id === currentMonitorData.id ? { ...m, estado: 'en_turno' } : m));

    // Actualizar estado del laboratorio
    setLaboratorios(prev => prev.map(l => l.id === lab.id ? { ...l, estado: 'en_uso', monitor_actual_id: currentMonitorData.id } : l));

    addToast('Entrada Registrada', `Turno iniciado en ${lab.nombre}. Photo Code Timemark: ${codigoLimpio}.`, 'success');
    return true;
  };

  // Turno: Registrar Salida con Fotografía Original Timemark
  const registrarSalida = (
    asistenciaId: string, 
    notas?: string, 
    fotoArchivo?: ArchivoEvidencia | string, 
    timemarkCodigo?: string
  ) => {
    const asistencia = asistencias.find(a => a.id === asistenciaId);
    if (!asistencia) {
      addToast('Error', 'Registro de asistencia no localizado.', 'error');
      return false;
    }

    // 1. Validación estricta del Photo Code de Salida: exactamente 14 caracteres alfanuméricos
    const codigoLimpio = timemarkCodigo ? timemarkCodigo.trim().toUpperCase() : '';
    if (!codigoLimpio) {
      addToast('Photo Code Requerido', 'Debes ingresar el Photo Code de salida de 14 caracteres impreso en tu fotografía de Timemark.', 'error');
      return false;
    }

    const esFormatoValido = /^[A-Z0-9]{14}$/.test(codigoLimpio);
    if (!esFormatoValido) {
      addToast(
        'Formato de Photo Code Inválido',
        `El Photo Code de salida tiene ${codigoLimpio.length} caracteres. Debe tener exactamente 14 caracteres alfanuméricos.`,
        'error'
      );
      return false;
    }

    // 2. Validación de Fotografía Original cargada desde el dispositivo
    if (!fotoArchivo) {
      addToast('Fotografía Original Requerida', 'Debes cargar la fotografía original de salida tomada con la aplicación Timemark.', 'warning');
      return false;
    }

    const now = new Date();
    const horaSalida = now.toTimeString().split(' ')[0];

    // Cálculo de horas trabajadas exactas a partir de entrada y salida
    const [hEntrada, mEntrada] = asistencia.hora_entrada.split(':').map(Number);
    const [hSalida, mSalida] = horaSalida.split(':').map(Number);
    
    let minutosTotales = (hSalida * 60 + mSalida) - (hEntrada * 60 + mEntrada);
    if (minutosTotales <= 0) minutosTotales = 60; // Mínimo 1 hora para turnos continuos
    const horasCalculadas = Number((Math.max(0.5, minutosTotales / 60)).toFixed(1));

    const fotoUrl = typeof fotoArchivo === 'string' ? fotoArchivo : fotoArchivo.dataUrl;
    const fotoNombre = typeof fotoArchivo === 'string' ? undefined : fotoArchivo.nombre;
    const fotoTamano = typeof fotoArchivo === 'string' ? undefined : fotoArchivo.tamano;

    setAsistencias(prev => prev.map(a => {
      if (a.id === asistenciaId) {
        return {
          ...a,
          hora_salida: horaSalida,
          horas_calculadas: horasCalculadas,
          estado: 'pendiente_validacion',
          foto_salida_url: fotoUrl,
          foto_salida_nombre: fotoNombre,
          foto_salida_tamano: fotoTamano,
          timemark_salida_codigo: codigoLimpio,
          timemark_salida_resultado: 'Pendiente',
          notas_estudiante: notas ? (a.notas_estudiante ? `${a.notas_estudiante} | Salida: ${notas}` : notas) : a.notas_estudiante,
        };
      }
      return a;
    }));

    // Actualizar estado del monitor
    setMonitores(prev => prev.map(m => {
      if (m.id === asistencia.monitor_id) {
        return {
          ...m,
          estado: 'activo',
          horas_pendientes: Number((m.horas_pendientes + horasCalculadas).toFixed(1)),
        };
      }
      return m;
    }));

    // Actualizar estado del laboratorio
    setLaboratorios(prev => prev.map(l => {
      if (l.monitor_actual_id === asistencia.monitor_id) {
        return {
          ...l,
          estado: 'disponible',
          monitor_actual_id: null,
        };
      }
      return l;
    }));

    addToast('Salida Registrada', `Turno finalizado a las ${horaSalida}. Photo Code Timemark: ${codigoLimpio}. ${horasCalculadas} horas enviadas a revisión del coordinador.`, 'success');
    return true;
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
        updated.timemark_verificado_por = currentUser?.nombre_completo || 'Coordinador de Laboratorios';
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

    // Acreditar las horas al monitor
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

    // Descontar de pendientes
    setMonitores(prev => prev.map(m => {
      if (m.id === asistencia.monitor_id) {
        return {
          ...m,
          horas_pendientes: Math.max(0, Number((m.horas_pendientes - horas).toFixed(1))),
        };
      }
      return m;
    }));

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

  // Monitores: Crear Novedad
  const crearNovedad = (novedadData: {
    tipo: TipoNovedad;
    titulo: string;
    descripcion: string;
    fecha_incidencia: string;
    horas_solicitadas?: number;
    asistencia_id?: string | null;
  }) => {
    const monitor = currentMonitorData || monitores[0];
    const nuevaNovedad: Novedad = {
      id: `nov-${Date.now()}`,
      monitor_id: monitor.id,
      monitor_nombre: `${monitor.nombres} ${monitor.apellidos}`,
      asistencia_id: novedadData.asistencia_id || null,
      tipo: novedadData.tipo,
      titulo: novedadData.titulo,
      descripcion: novedadData.descripcion,
      fecha_incidencia: novedadData.fecha_incidencia,
      horas_solicitadas: novedadData.horas_solicitadas,
      estado: 'pendiente',
      created_at: new Date().toISOString(),
    };

    setNovedades(prev => [nuevaNovedad, ...prev]);
    addToast('Novedad Radicada', 'Tu solicitud fue enviada a la coordinación de laboratorios.', 'success');
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

    // Si fue aprobada y tenía horas solicitadas, convalidarlas en el monitor
    if (estado === 'aprobada' && nov.horas_solicitadas && nov.horas_solicitadas > 0) {
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

  // Agregar monitor
  const agregarMonitor = (data: Omit<Monitor, 'id' | 'horas_aprobadas' | 'horas_pendientes' | 'created_at'>) => {
    const nuevo: Monitor = {
      ...data,
      id: `mon-${Date.now()}`,
      horas_aprobadas: 0,
      horas_pendientes: 0,
      created_at: new Date().toISOString(),
    };
    setMonitores(prev => [nuevo, ...prev]);
    addToast('Monitor Registrado', `${nuevo.nombres} ${nuevo.apellidos} ha sido inscrito en el sistema.`, 'success');
  };

  // Actualizar monitor
  const actualizarMonitor = (mon: Monitor) => {
    setMonitores(prev => prev.map(m => m.id === mon.id ? mon : m));
    addToast('Monitor Actualizado', 'Los datos del monitor han sido guardados.', 'success');
  };

  // Actualizar laboratorio
  const actualizarLaboratorio = (lab: Laboratorio) => {
    setLaboratorios(prev => prev.map(l => l.id === lab.id ? lab : l));
    addToast('Laboratorio Actualizado', `Información de ${lab.nombre} actualizada.`, 'success');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole: currentUser?.role || 'admin',
        activeTab,
        monitores,
        laboratorios,
        asistencias,
        novedades,
        periodo,
        toasts,
        currentMonitorData,
        activeAsistenciaActual,
        metaGeneralHoras,
        configurarMetaGeneral,
        login,
        logout,
        switchRole,
        setActiveTab,
        addToast,
        removeToast,
        agregarMonitor,
        actualizarMonitor,
        actualizarLaboratorio,
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
