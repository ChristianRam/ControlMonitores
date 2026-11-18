import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ArchivoEvidencia } from '../types/database';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  History,
  GraduationCap,
  ChevronRight,
  ShieldCheck,
  X,
  Loader2,
  RefreshCw,
  ImageOff,
} from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';
import { TimemarkEvidenceInput } from '../components/ui/TimemarkEvidenceInput';
import { formatEvidenciaFileSize, validarFormatoPhotoCode } from '../lib/timemark';
import { LINK_TOMAR_EVIDENCIA, MAX_TURNO_MINUTOS, OTRAS_ACTIVIDADES_CODE } from '../lib/constants';

// "Otras actividades" no es una sala física: siempre está seleccionable
const labSeleccionable = (l: { codigo: string; estado: string }) =>
  l.codigo === OTRAS_ACTIVIDADES_CODE || l.estado === 'disponible';

export const MonitorDashboardView: React.FC = () => {
  const {
    currentMonitorData,
    authLoading,
    authInitializing,
    activeAsistenciaActual,
    laboratorios,
    laboratoriosLoading,
    laboratoriosError,
    fetchLaboratorios,
    fetchCurrentMonitor,
    asistencias,
    asistenciasLoading,
    asistenciasError,
    fetchAsistencias,
    periodo,
    registrarEntrada,
    registrarSalida,
    cerrarTurnoVencido,
    setActiveTab,
    addToast,
    logout,
  } = useApp();

  // Reloj en tiempo real (hora oficial de Colombia)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Turno abierto: minutos transcurridos desde la entrada (hora de Colombia, UTC-5 sin horario de verano)
  const minutosTurno = (() => {
    if (!activeAsistenciaActual?.fecha || !activeAsistenciaActual.hora_entrada) return null;
    const inicio = new Date(`${activeAsistenciaActual.fecha}T${activeAsistenciaActual.hora_entrada}-05:00`);
    if (Number.isNaN(inicio.getTime())) return null;
    return Math.max(0, Math.floor((currentTime.getTime() - inicio.getTime()) / 60000));
  })();
  const turnoVencido = minutosTurno !== null && minutosTurno >= MAX_TURNO_MINUTOS;

  // Si el monitor olvidó marcar salida, el turno se pausa/cierra automáticamente a las 8 h 10 min
  const cierreIntentadoRef = useRef<string | null>(null);
  useEffect(() => {
    const turnoId = activeAsistenciaActual?.id;
    if (!turnoVencido || !turnoId) return;
    if (cierreIntentadoRef.current === turnoId) return;
    cierreIntentadoRef.current = turnoId;
    void cerrarTurnoVencido();
  }, [turnoVencido, activeAsistenciaActual?.id, cerrarTurnoVencido]);

  // Formulario Entrada
  const [selectedLabId, setSelectedLabId] = useState<string>('');
  const [notasEntrada, setNotasEntrada] = useState('');
  const [codigoTimemarkEntrada, setCodigoTimemarkEntrada] = useState('');
  const [fotoEntrada, setFotoEntrada] = useState<ArchivoEvidencia | null>(null);
  const [isSubmittingEntrada, setIsSubmittingEntrada] = useState(false);
  const [entradaError, setEntradaError] = useState<string | null>(null);

  // Modal y Formulario de Salida con Evidencia Timemark
  const [isSalidaModalOpen, setIsSalidaModalOpen] = useState(false);
  const [codigoTimemarkSalida, setCodigoTimemarkSalida] = useState('');
  const [fotoSalida, setFotoSalida] = useState<ArchivoEvidencia | null>(null);
  const [isSubmittingSalida, setIsSubmittingSalida] = useState(false);
  const [salidaError, setSalidaError] = useState<string | null>(null);

  // Control de fallback visual si alguna URL firmada de imagen falla al renderizar
  const [brokenPreviewIds, setBrokenPreviewIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (laboratorios.length === 0) return;

    const currentValid = laboratorios.find((l) => l.id === selectedLabId);
    if (currentValid) return;

    const preferredId = currentMonitorData?.laboratorio_habitual_id;
    const preferredAvailable = preferredId
      ? laboratorios.find((l) => l.id === preferredId && labSeleccionable(l))
      : undefined;
    const firstAvailable = laboratorios.find((l) => labSeleccionable(l));
    const fallback = preferredAvailable || firstAvailable || laboratorios[0];

    if (fallback) {
      setSelectedLabId(fallback.id);
    }
  }, [laboratorios, selectedLabId, currentMonitorData?.laboratorio_habitual_id]);

  if (authInitializing || authLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 max-w-xl mx-auto my-8 flex flex-col items-center justify-center text-center gap-3 shadow-xs">
        <Loader2 className="w-7 h-7 text-[#8F141B] animate-spin" />
        <div>
          <p className="text-sm font-bold text-slate-900">Cargando tu perfil de monitor...</p>
          <p className="text-xs text-[#4D626C] mt-0.5">
            Consultando tu registro oficial en Supabase.
          </p>
        </div>
      </div>
    );
  }

  if (!currentMonitorData) {
    return (
      <div
        role="alert"
        className="bg-rose-50 border border-rose-200 rounded-2xl p-8 max-w-xl mx-auto my-8 text-center space-y-3 shadow-xs"
      >
        <div className="w-11 h-11 rounded-full bg-white border border-rose-200 text-[#8F141B] flex items-center justify-center mx-auto">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h2 className="text-base font-bold text-[#8F141B]">
          No se encontró tu registro de monitor
        </h2>
        <p className="text-xs text-rose-800 leading-relaxed">
          No fue posible cargar tus datos reales desde <span className="font-mono">public.monitores</span>. Por seguridad, no se muestran datos de respaldo. Comunícate con el coordinador de salas o vuelve a iniciar sesión.
        </p>
        <button
          type="button"
          onClick={() => void logout()}
          className="px-4 py-2 bg-[#8F141B] hover:bg-[#751016] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          Cerrar Sesión
        </button>
      </div>
    );
  }

  const monitor = currentMonitorData;
  const salaHabitual = laboratorios.find((l) => l.id === monitor.laboratorio_habitual_id);
  const isEnTurno = Boolean(activeAsistenciaActual || monitor.estado === 'en_turno');
  const porcentaje = Math.min(100, Math.round((monitor.horas_aprobadas / (monitor.horas_asignadas || 1)) * 100));
  const salasDisponibles = laboratorios.filter((l) => labSeleccionable(l));
  const selectedLab = laboratorios.find((l) => l.id === selectedLabId);

  // Asistencias reales del monitor autenticado (sin datos de demostración)
  const misAsistencias = asistencias.filter((a) => a.monitor_id === monitor.id && !a.es_dato_prueba);

  const resolveLabName = (labId?: string, fallbackName?: string) => {
    if (labId) {
      const match = laboratorios.find((l) => l.id === labId);
      if (match) return match.nombre;
    }
    return fallbackName || 'Sala';
  };

  const handleMarcarEntrada = async () => {
    if (isSubmittingEntrada) return;

    setEntradaError(null);

    if (monitor.estado === 'inactivo') {
      const msg = 'Tu perfil de monitor se encuentra inactivo. Comunícate con la coordinación.';
      setEntradaError(msg);
      addToast('Monitor Inactivo', msg, 'error');
      return;
    }

    if (isEnTurno) {
      const msg = 'Ya tienes un turno en curso. Debes finalizarlo antes de iniciar uno nuevo.';
      setEntradaError(msg);
      addToast('Turno Activo', msg, 'warning');
      return;
    }

    if (!selectedLab) {
      const msg = 'Debes seleccionar una sala oficial válida antes de registrar el inicio.';
      setEntradaError(msg);
      addToast('Sala Requerida', msg, 'warning');
      return;
    }

    if (!labSeleccionable(selectedLab)) {
      const msg = `La sala "${selectedLab.nombre}" no está disponible (estado actual: ${selectedLab.estado}). Selecciona otra sala disponible.`;
      setEntradaError(msg);
      addToast('Sala No Disponible', msg, 'warning');
      return;
    }

    const codigoCheck = validarFormatoPhotoCode(codigoTimemarkEntrada);
    if (!codigoCheck.valid) {
      const msg = codigoCheck.error || 'El Photo Code de entrada no es válido.';
      setEntradaError(msg);
      addToast(!codigoCheck.clean ? 'Photo Code Requerido' : 'Formato Inválido', msg, 'error');
      return;
    }

    if (!fotoEntrada?.file) {
      const msg = 'Debes cargar la fotografía original tomada con Timemark desde tu dispositivo.';
      setEntradaError(msg);
      addToast('Fotografía Requerida', msg, 'warning');
      return;
    }

    setIsSubmittingEntrada(true);
    try {
      const res = await registrarEntrada(selectedLab.id, notasEntrada, fotoEntrada, codigoCheck.clean);

      if (res.ok) {
        setNotasEntrada('');
        setCodigoTimemarkEntrada('');
        setFotoEntrada(null);
        setEntradaError(null);
      } else {
        setEntradaError(res.error || 'No fue posible registrar el inicio de turno en Supabase.');
      }
    } finally {
      setIsSubmittingEntrada(false);
    }
  };

  const handleOpenSalidaModal = () => {
    setSalidaError(null);
    setIsSalidaModalOpen(true);
  };

  const handleCloseSalidaModal = () => {
    if (isSubmittingSalida) return;
    setIsSalidaModalOpen(false);
  };

  const handleConfirmarSalida = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmittingSalida) return;

    setSalidaError(null);

    const codigoCheck = validarFormatoPhotoCode(codigoTimemarkSalida);
    if (!codigoCheck.valid) {
      const msg = codigoCheck.error || 'El Photo Code de salida no es válido.';
      setSalidaError(msg);
      addToast(!codigoCheck.clean ? 'Photo Code Requerido' : 'Formato Inválido', msg, 'error');
      return;
    }

    if (!fotoSalida?.file) {
      const msg = 'Debes cargar la fotografía original de salida tomada con Timemark desde tu dispositivo.';
      setSalidaError(msg);
      addToast('Fotografía Requerida', msg, 'warning');
      return;
    }

    setIsSubmittingSalida(true);

    try {
      const res = await registrarSalida(fotoSalida, codigoCheck.clean);
      if (res.ok) {
        setIsSalidaModalOpen(false);
        setCodigoTimemarkSalida('');
        setFotoSalida(null);
        setSalidaError(null);
      } else {
        setSalidaError(
          res.error || 'No se pudo registrar la salida del turno en Supabase. Tu turno continúa activo.'
        );
      }
    } finally {
      setIsSubmittingSalida(false);
    }
  };

  const salidaCodigoValido = validarFormatoPhotoCode(codigoTimemarkSalida).valid;
  const salidaFormularioCompleto = Boolean(fotoSalida?.file && salidaCodigoValido);

  const handleReintentarSincronizacion = async () => {
    await Promise.all([
      fetchCurrentMonitor(),
      fetchLaboratorios(),
      fetchAsistencias(monitor.id),
    ]);
  };

  const horaColombiaFormateada = currentTime.toLocaleTimeString('es-CO', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const fechaColombiaFormateada = currentTime.toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Welcome Card & Real-Time Clock (Colombia) */}
      <div className="bg-gradient-to-r from-[#8F141B] via-[#751016] to-[#560B10] text-white p-5 sm:p-6 rounded-2xl shadow-md border border-[#8F141B]/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#DFD4A6]">
            <GraduationCap className="w-4 h-4" />
            <span>Portal del Monitor Académico · USCO</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1">
            Hola, {monitor.nombres}
          </h1>
          <p className="text-xs sm:text-sm text-white/85 mt-0.5">
            {monitor.programa_academico} · Código:{' '}
            <span className="font-mono text-[#DFD4A6]">{monitor.codigo_estudiantil}</span>
          </p>
        </div>

        {/* Live Clock Display */}
        <div className="bg-black/30 backdrop-blur-xs p-3.5 rounded-xl border border-[#DFD4A6]/20 text-right self-start md:self-auto shrink-0">
          <span className="text-[10px] text-[#DFD4A6]/90 uppercase tracking-wider block font-semibold">
            Hora Oficial · Colombia
          </span>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-white tabular-nums tracking-wider">
            {horaColombiaFormateada}
          </div>
          <div className="text-[11px] text-[#DFD4A6] capitalize">{fechaColombiaFormateada}</div>
        </div>
      </div>

      {/* Main Shift Action Card */}
      <div className="bg-white rounded-2xl border-2 border-[#8F141B]/25 shadow-md p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-lg ${
                isEnTurno ? 'bg-[#8F141B]/10 text-[#8F141B]' : 'bg-[#DFD4A6]/40 text-[#8F141B]'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEnTurno ? 'Turno en Curso en la Sala' : 'Registrar Inicio de Turno con Timemark'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEnTurno
                  ? 'Jornada activa registrada en Supabase. Confirma tu salida al concluir.'
                  : 'Selecciona una sala disponible, adjunta tu foto Timemark original e ingresa el Photo Code.'}
              </p>
            </div>
          </div>

          <div>
            <StatusBadge type="monitor" value={isEnTurno ? 'en_turno' : monitor.estado} />
          </div>
        </div>

        {isEnTurno ? (
          /* Estado: En Turno -> Visualización del turno activo y confirmación de salida via RPC */
          <div className="space-y-4">
            {asistenciasLoading && !activeAsistenciaActual && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs text-[#4D626C]">
                <Loader2 className="w-4 h-4 text-[#8F141B] animate-spin shrink-0" />
                <span>Sincronizando los detalles de tu turno activo desde Supabase...</span>
              </div>
            )}

            {asistenciasError && !activeAsistenciaActual && (
              <div
                role="alert"
                className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#8F141B] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#8F141B]">No se pudo consultar el detalle del turno</p>
                    <p className="mt-0.5">{asistenciasError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleReintentarSincronizacion()}
                  className="px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-100 text-[#8F141B] font-semibold rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reintentar</span>
                </button>
              </div>
            )}

            {turnoVencido ? (
              <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-[#8F141B] shrink-0 mt-0.5" />
                <p>
                  <span className="font-bold text-[#8F141B]">Turno pausado: </span>
                  superaste las 8 h 10 min sin marcar la salida. El sistema lo cierra automáticamente y queda en observación; si necesitas ajustar las horas, radica una novedad.
                </p>
              </div>
            ) : minutosTurno !== null && minutosTurno >= MAX_TURNO_MINUTOS - 30 ? (
              <div role="alert" className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p>
                  Tu turno está por cumplir 8 h 10 min ({MAX_TURNO_MINUTOS - minutosTurno} min restantes). Marca tu salida o se pausará automáticamente.
                </p>
              </div>
            ) : null}

            <div className="p-4 bg-[#faf8ef] rounded-xl border border-[#DFD4A6] grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
              <div>
                <span className="text-[11px] text-[#8F141B] block font-bold">Sala Asignada:</span>
                <p className="font-bold text-sm text-slate-900">
                  {resolveLabName(
                    activeAsistenciaActual?.laboratorio_id,
                    activeAsistenciaActual?.laboratorio_nombre || salaHabitual?.nombre
                  )}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-[#8F141B] block font-bold">Entrada (Colombia):</span>
                <p className="font-mono font-bold text-sm text-slate-900">
                  {activeAsistenciaActual?.hora_entrada || 'Sincronizando...'}
                </p>
                {activeAsistenciaActual?.fecha && (
                  <p className="text-[10px] font-mono text-[#4D626C]">{activeAsistenciaActual.fecha}</p>
                )}
              </div>
              <div>
                <span className="text-[11px] text-[#8F141B] block font-bold">Photo Code Entrada:</span>
                <p className="font-mono text-xs text-[#8F141B] font-semibold">
                  {activeAsistenciaActual?.timemark_entrada_codigo || 'Sin registro'}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-[#8F141B] block font-bold">Evidencia Recibida:</span>
                {activeAsistenciaActual?.foto_entrada_url &&
                !brokenPreviewIds[activeAsistenciaActual.id] ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <img
                      src={activeAsistenciaActual.foto_entrada_url}
                      alt="Foto de entrada registrada"
                      onError={() =>
                        setBrokenPreviewIds((prev) => ({
                          ...prev,
                          [activeAsistenciaActual.id]: true,
                        }))
                      }
                      className="w-10 h-10 object-cover rounded border border-slate-300 shrink-0"
                    />
                    <span className="text-[10px] text-slate-600 truncate max-w-[110px]">
                      {activeAsistenciaActual.foto_entrada_nombre || 'Imagen Timemark'}
                    </span>
                  </div>
                ) : activeAsistenciaActual?.foto_entrada_path ||
                  activeAsistenciaActual?.foto_entrada_nombre ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-0.5">
                    <ImageOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Vista previa no disponible</span>
                  </div>
                ) : (
                  <span className="text-slate-400 text-[11px] italic">Sin foto</span>
                )}
              </div>
            </div>

            {activeAsistenciaActual?.notas_estudiante && (
              <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#4D626C]">
                <span className="font-semibold text-slate-700">Observación inicial: </span>
                {activeAsistenciaActual.notas_estudiante}
              </div>
            )}

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8F141B]" />
                <span className="text-xs font-bold text-slate-900">
                  Evidencia de Salida y Cierre Oficial en Supabase
                </span>
              </div>
              <p className="text-[11px] text-[#4D626C] leading-relaxed">
                Al pulsar el botón inferior se abrirá el formulario para adjuntar tu fotografía original de salida tomada con Timemark y su Photo Code de 14 caracteres. Una vez validada, el servidor registrará la hora oficial de Colombia, calculará las horas trabajadas, liberará la sala y dejará el turno en estado{' '}
                <span className="font-semibold text-slate-800">pendiente de validación</span>.
              </p>
            </div>

            {salidaError && !isSalidaModalOpen && (
              <div
                role="alert"
                className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800"
              >
                <AlertCircle className="w-4 h-4 text-[#8F141B] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#8F141B]">No se pudo finalizar el turno</p>
                  <p className="mt-0.5">{salidaError}</p>
                </div>
              </div>
            )}

            {/* Botón Prominente de Salida */}
            <button
              type="button"
              disabled={isSubmittingSalida}
              onClick={handleOpenSalidaModal}
              className="w-full py-3.5 px-4 bg-[#8F141B] hover:bg-[#721015] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmittingSalida ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>REGISTRANDO SALIDA...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-5 h-5" />
                  <span>REGISTRAR SALIDA CON TIMEMARK</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Estado: Fuera de Turno -> Selector y Marcación de Entrada */
          <div className="space-y-4">
            {laboratoriosError && (
              <div
                role="alert"
                className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-2 text-xs text-rose-800"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#8F141B] shrink-0" />
                  <span>{laboratoriosError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void fetchLaboratorios()}
                  className="px-2.5 py-1 bg-white border border-rose-300 rounded-md font-semibold text-[#8F141B] hover:bg-rose-100 cursor-pointer shrink-0"
                >
                  Reintentar
                </button>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Selecciona la Sala a Ocupar *
                </label>
                {laboratoriosLoading && (
                  <span className="text-[10px] text-[#4D626C] flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Actualizando salas...
                  </span>
                )}
              </div>
              <select
                value={selectedLabId}
                disabled={isSubmittingEntrada || laboratorios.length === 0}
                onChange={(e) => {
                  setSelectedLabId(e.target.value);
                  setEntradaError(null);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:bg-white focus:border-[#8F141B] font-semibold cursor-pointer disabled:opacity-60"
              >
                {laboratorios.length === 0 ? (
                  <option value="">No hay salas disponibles para seleccionar</option>
                ) : (
                  laboratorios.map((l) => (
                    <option key={l.id} value={l.id} disabled={!labSeleccionable(l)}>
                      {l.nombre} ({l.codigo}) —{' '}
                      {labSeleccionable(l)
                        ? 'Disponible'
                        : l.estado === 'en_uso'
                        ? 'En uso'
                        : 'Mantenimiento'}
                    </option>
                  ))
                )}
              </select>
              {!laboratoriosLoading && laboratorios.length > 0 && salasDisponibles.length === 0 && (
                <p className="mt-1 text-[11px] text-amber-700 font-medium">
                  Todas las salas se encuentran actualmente en uso o en mantenimiento.
                </p>
              )}
              {selectedLab && !labSeleccionable(selectedLab) && (
                <p className="mt-1 text-[11px] text-[#8F141B] font-medium">
                  La sala seleccionada ({selectedLab.nombre}) está en estado {selectedLab.estado}. Elige una sala disponible.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vínculo para tomar la evidencia:
              </label>
              <a
                href={LINK_TOMAR_EVIDENCIA}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-3 py-2 text-xs bg-[#faf8ef] border border-[#DFD4A6] rounded-lg text-[#8F141B] font-semibold underline break-all hover:bg-[#DFD4A6]/30 transition-colors"
              >
                {LINK_TOMAR_EVIDENCIA}
              </a>
            </div>

            {/* Timemark Entrada: Componente reutilizable */}
            <TimemarkEvidenceInput
              tipo="entrada"
              inputId="file-entrada-input"
              codigo={codigoTimemarkEntrada}
              onCodigoChange={setCodigoTimemarkEntrada}
              foto={fotoEntrada}
              onFotoChange={setFotoEntrada}
              disabled={isSubmittingEntrada}
              codePlaceholder="Ej. TMK20268193FE"
              onClearError={() => setEntradaError(null)}
              onValidationError={(msg, title) => {
                setEntradaError(msg);
                addToast(title || 'Evidencia Inválida', msg, 'error');
              }}
              onFileLoaded={(evidencia) =>
                addToast(
                  'Fotografía Original Cargada',
                  `Archivo "${evidencia.nombre}" (${formatEvidenciaFileSize(evidencia.tamano)}) listo para subir a evidencias-timemark.`,
                  'info'
                )
              }
            />

            {entradaError && (
              <div
                role="alert"
                className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800"
              >
                <AlertCircle className="w-4 h-4 text-[#8F141B] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#8F141B]">No se pudo iniciar el turno</p>
                  <p className="mt-0.5 leading-relaxed">{entradaError}</p>
                </div>
              </div>
            )}

            {/* Botón Prominente de Entrada */}
            <button
              type="button"
              disabled={isSubmittingEntrada || monitor.estado === 'inactivo'}
              onClick={() => void handleMarcarEntrada()}
              className="w-full py-3.5 px-4 bg-[#8F141B] hover:bg-[#721015] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmittingEntrada ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>SUBIENDO EVIDENCIA Y REGISTRANDO INICIO...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>REGISTRAR ENTRADA CON TIMEMARK</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Progress Cards: Horas Acumuladas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Tu Progreso de Cumplimiento de Horas
            </h3>
            <p className="text-xs text-[#4D626C]">
              Meta establecida para el semestre {periodo.codigo}: {monitor.horas_asignadas} horas
            </p>
          </div>
          <span className="text-lg font-bold font-mono text-[#8F141B] tabular-nums">
            {porcentaje}%
          </span>
        </div>

        {/* Bar */}
        <div className="space-y-2">
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-[#8F141B] h-full rounded-full transition-all duration-500"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-[#4D626C]">
            <span>0 hrs</span>
            <span>Meta: {monitor.horas_asignadas} hrs</span>
          </div>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-[11px] text-emerald-800 font-bold block">Horas Aprobadas</span>
            <p className="text-xl font-bold font-mono text-emerald-700 mt-0.5 tabular-nums">
              {monitor.horas_aprobadas}
            </p>
          </div>

          <div className="p-3 bg-[#DFD4A6]/30 rounded-xl border border-[#DFD4A6]">
            <span className="text-[11px] text-[#6E6130] font-bold block">En Validación</span>
            <p className="text-xl font-bold font-mono text-[#8F141B] mt-0.5 tabular-nums">
              {monitor.horas_pendientes}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] text-[#4D626C] font-semibold block">Horas Restantes</span>
            <p className="text-xl font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
              {Math.max(0, Number((monitor.horas_asignadas - monitor.horas_aprobadas).toFixed(1)))}
            </p>
          </div>
        </div>
      </div>

      {/* Historial Reciente del Monitor & Botón de Novedad */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#8F141B]" />
            <h3 className="text-sm font-bold text-slate-900">
              Mis Turnos Recientes y Evidencias Timemark
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={asistenciasLoading}
              onClick={() => void fetchAsistencias(monitor.id)}
              className="text-xs font-semibold text-[#4D626C] hover:text-[#8F141B] flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Actualizar mis asistencias desde Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${asistenciasLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('novedades')}
              className="text-xs font-semibold text-[#8F141B] hover:text-[#721015] flex items-center gap-1 cursor-pointer"
            >
              <span>Radicar Corrección</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {asistenciasError && (
          <div
            role="alert"
            className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#8F141B] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#8F141B]">Error al consultar asistencias en Supabase</p>
                <p className="mt-0.5">{asistenciasError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void fetchAsistencias(monitor.id)}
              className="px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-100 text-[#8F141B] font-semibold rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reintentar</span>
            </button>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {asistenciasLoading && misAsistencias.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-[#4D626C]">
              <Loader2 className="w-5 h-5 text-[#8F141B] animate-spin" />
              <span>Cargando tus turnos reales desde Supabase...</span>
            </div>
          ) : !asistenciasError && misAsistencias.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              No tienes turnos registrados en Supabase todavía.
            </p>
          ) : (
            misAsistencias.map((asist) => {
              const hasSalidaInfo = Boolean(
                asist.hora_salida ||
                  asist.foto_salida_url ||
                  asist.foto_salida_path ||
                  asist.timemark_salida_codigo ||
                  asist.estado !== 'en_curso'
              );
              const entradaBrokenKey = `${asist.id}:entrada`;
              const salidaBrokenKey = `${asist.id}:salida`;

              return (
                <div key={asist.id} className="py-3.5 space-y-2.5 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {resolveLabName(asist.laboratorio_id, asist.laboratorio_nombre)}
                      </p>
                      <p className="text-[11px] text-[#4D626C] font-mono">
                        {asist.fecha} · {asist.hora_entrada} - {asist.hora_salida || 'En curso'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="font-mono font-bold text-slate-900">
                        {asist.estado === 'en_curso'
                          ? 'En curso'
                          : asist.horas_calculadas > 0
                          ? `+${asist.horas_calculadas} hrs`
                          : '0.0 hrs'}
                      </span>
                      <StatusBadge type="asistencia" value={asist.estado} />
                    </div>
                  </div>

                  {/* Evidencias de Entrada y Salida separadas */}
                  <div className={`grid grid-cols-1 ${hasSalidaInfo ? 'md:grid-cols-2' : ''} gap-2.5`}>
                    {/* Evidencia de Entrada */}
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {asist.foto_entrada_url && !brokenPreviewIds[entradaBrokenKey] ? (
                          <img
                            src={asist.foto_entrada_url}
                            alt={`Evidencia entrada ${asist.fecha}`}
                            onError={() =>
                              setBrokenPreviewIds((prev) => ({
                                ...prev,
                                [entradaBrokenKey]: true,
                              }))
                            }
                            className="w-11 h-11 object-cover rounded-lg border border-slate-200 shrink-0"
                          />
                        ) : asist.foto_entrada_path || asist.foto_entrada_nombre ? (
                          <div
                            className="w-11 h-11 rounded-lg border border-slate-200 bg-white flex items-center justify-center shrink-0 text-slate-400"
                            title="Vista previa no disponible"
                          >
                            <ImageOff className="w-4 h-4" />
                          </div>
                        ) : null}

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-[#8F141B]">
                              Entrada
                            </span>
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-[#DFD4A6]/35 text-[#6E6130] rounded">
                              {asist.timemark_entrada_codigo || 'Sin código'}
                            </span>
                          </div>
                          {asist.foto_entrada_nombre ? (
                            <p className="text-[10px] text-slate-500 truncate">
                              {asist.foto_entrada_nombre}
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic">Sin archivo</p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        <StatusBadge
                          type="timemark"
                          value={asist.timemark_entrada_resultado || 'Pendiente'}
                        />
                      </div>
                    </div>

                    {/* Evidencia de Salida (cuando exista o la jornada haya concluido) */}
                    {hasSalidaInfo && (
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {asist.foto_salida_url && !brokenPreviewIds[salidaBrokenKey] ? (
                            <img
                              src={asist.foto_salida_url}
                              alt={`Evidencia salida ${asist.fecha}`}
                              onError={() =>
                                setBrokenPreviewIds((prev) => ({
                                  ...prev,
                                  [salidaBrokenKey]: true,
                                }))
                              }
                              className="w-11 h-11 object-cover rounded-lg border border-slate-200 shrink-0"
                            />
                          ) : asist.foto_salida_path || asist.foto_salida_nombre ? (
                            <div
                              className="w-11 h-11 rounded-lg border border-slate-200 bg-white flex items-center justify-center shrink-0 text-slate-400"
                              title="Vista previa no disponible"
                            >
                              <ImageOff className="w-4 h-4" />
                            </div>
                          ) : null}

                          <div className="min-w-0 space-y-0.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wide text-[#4D626C]">
                                Salida
                              </span>
                              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-[#8F141B]/10 text-[#8F141B] rounded">
                                {asist.timemark_salida_codigo || 'Sin código'}
                              </span>
                            </div>
                            {asist.foto_salida_nombre ? (
                              <p className="text-[10px] text-slate-500 truncate">
                                {asist.foto_salida_nombre}
                              </p>
                            ) : (
                              <p className="text-[10px] text-slate-400 italic">Sin archivo</p>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0">
                          <StatusBadge
                            type="timemark"
                            value={asist.timemark_salida_resultado || 'Pendiente'}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {asist.timemark_observaciones && (
                    <p className="text-[11px] text-[#4D626C] bg-slate-50 px-2.5 py-1 rounded border border-slate-200 inline-block">
                      Auditoría: {asist.timemark_observaciones}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de Registro de Salida con Evidencia Timemark */}
      {isSalidaModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-salida-titulo"
        >
          <form
            onSubmit={(e) => void handleConfirmarSalida(e)}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#8F141B]/10 text-[#8F141B]">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="modal-salida-titulo" className="text-base font-bold text-slate-900">
                    Registrar Salida de Turno con Timemark
                  </h3>
                  <p className="text-xs text-[#4D626C]">
                    Adjunta la fotografía original de salida y su Photo Code de 14 caracteres.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSubmittingSalida}
                onClick={handleCloseSalidaModal}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer disabled:opacity-50"
                aria-label="Cerrar ventana"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-[#faf8ef] border border-[#DFD4A6] rounded-xl text-xs grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-700">
              <div>
                <span className="font-semibold text-[#8F141B] block text-[11px]">Sala en curso:</span>
                <span className="font-bold text-slate-900">
                  {resolveLabName(
                    activeAsistenciaActual?.laboratorio_id,
                    activeAsistenciaActual?.laboratorio_nombre || salaHabitual?.nombre
                  )}
                </span>
              </div>
              <div>
                <span className="font-semibold text-[#8F141B] block text-[11px]">Entrada (Colombia):</span>
                <span className="font-mono font-semibold text-slate-900">
                  {activeAsistenciaActual?.fecha ? `${activeAsistenciaActual.fecha} · ` : ''}
                  {activeAsistenciaActual?.hora_entrada || 'Sincronizada'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-[#8F141B] block text-[11px]">Photo Code Entrada:</span>
                <span className="font-mono font-semibold text-[#8F141B]">
                  {activeAsistenciaActual?.timemark_entrada_codigo || 'Registrado'}
                </span>
              </div>
            </div>

            <TimemarkEvidenceInput
              tipo="salida"
              inputId="file-salida-input"
              codigo={codigoTimemarkSalida}
              onCodigoChange={setCodigoTimemarkSalida}
              foto={fotoSalida}
              onFotoChange={setFotoSalida}
              disabled={isSubmittingSalida}
              codePlaceholder="Ej. TMK20269482FE"
              onClearError={() => setSalidaError(null)}
              onValidationError={(msg, title) => {
                setSalidaError(msg);
                addToast(title || 'Evidencia Inválida', msg, 'error');
              }}
              onFileLoaded={(evidencia) =>
                addToast(
                  'Fotografía de Salida Cargada',
                  `Archivo "${evidencia.nombre}" (${formatEvidenciaFileSize(evidencia.tamano)}) listo para subir a evidencias-timemark.`,
                  'info'
                )
              }
            />

            <p className="text-[11px] text-[#4D626C] bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 leading-relaxed">
              El servidor registrará la hora oficial de Colombia (<span className="font-mono">America/Bogota</span>), calculará las horas trabajadas, liberará la sala y dejará el turno en estado{' '}
              <span className="font-semibold text-slate-900">pendiente de validación</span>. No se admiten salidas que crucen la medianoche.
            </p>

            {salidaError && (
              <div
                role="alert"
                className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800"
              >
                <AlertCircle className="w-4 h-4 text-[#8F141B] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#8F141B]">No se pudo registrar la salida</p>
                  <p className="mt-0.5 leading-relaxed">{salidaError}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-1">
              <span className="text-[11px] text-[#4D626C]">
                {!salidaFormularioCompleto
                  ? 'Completa el Photo Code de 14 caracteres y adjunta la foto original para habilitar el envío.'
                  : 'Evidencia lista para subir y cerrar el turno.'}
              </span>

              <div className="flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  disabled={isSubmittingSalida}
                  onClick={handleCloseSalidaModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSalida || !salidaFormularioCompleto}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#8F141B] hover:bg-[#721015] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingSalida ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Subiendo y finalizando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirmar Salida</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};


