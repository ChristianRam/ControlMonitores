import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ArchivoEvidencia } from '../types/database';
import { 
  Clock, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  History, 
  GraduationCap,
  ChevronRight,
  ShieldCheck,
  Upload,
  X,
  FileCheck,
  Image as ImageIcon
} from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';

export const MonitorDashboardView: React.FC = () => {
  const { 
    currentMonitorData, 
    activeAsistenciaActual, 
    laboratorios, 
    asistencias, 
    periodo,
    registrarEntrada, 
    registrarSalida,
    setActiveTab,
    addToast
  } = useApp();

  // Reloj en tiempo real
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Formulario Entrada
  const [selectedLabId, setSelectedLabId] = useState<string>(
    currentMonitorData?.laboratorio_habitual_id || laboratorios[0]?.id || ''
  );
  const [notasEntrada, setNotasEntrada] = useState('');
  const [codigoTimemarkEntrada, setCodigoTimemarkEntrada] = useState('');
  const [fotoEntrada, setFotoEntrada] = useState<ArchivoEvidencia | null>(null);
  const fileInputEntradaRef = useRef<HTMLInputElement | null>(null);

  // Formulario Salida
  const [notasSalida, setNotasSalida] = useState('');
  const [codigoTimemarkSalida, setCodigoTimemarkSalida] = useState('');
  const [fotoSalida, setFotoSalida] = useState<ArchivoEvidencia | null>(null);
  const fileInputSalidaRef = useRef<HTMLInputElement | null>(null);

  // Monitor de respaldo si no hay logueado
  const monitor = currentMonitorData || {
    id: 'mon-01',
    nombres: 'Valentina',
    apellidos: 'Rodríguez Charry',
    codigo_estudiantil: '20221198450',
    programa_academico: 'Economía',
    semestre: 8,
    horas_asignadas: 112,
    horas_aprobadas: 54.5,
    horas_pendientes: 4.0,
    estado: 'en_turno',
    telefono: '+57 312 458 9012',
    correo_institucional: 'valentina.rodriguez@usco.edu.co',
    created_at: '2026-02-03T10:00:00Z',
  };

  const isEnTurno = Boolean(activeAsistenciaActual || monitor.estado === 'en_turno');
  const porcentaje = Math.min(100, Math.round((monitor.horas_aprobadas / (monitor.horas_asignadas || 1)) * 100));

  // Asistencias personales
  const misAsistencias = asistencias.filter(a => a.monitor_id === monitor.id);

  // Validación de Photo Code (14 caracteres alfanuméricos)
  const validarFormatoPhotoCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    return clean.length === 14 && /^[A-Z0-9]{14}$/.test(clean);
  };

  // Manejo de carga de archivo original de Entrada
  const handleFileChangeEntrada = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Archivo Inválido', 'Por favor selecciona un archivo de imagen válido (JPEG, PNG).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFotoEntrada({
        dataUrl,
        nombre: file.name,
        tamano: file.size,
        tipoMime: file.type,
      });
      addToast('Fotografía Original Cargada', `Archivo "${file.name}" cargado desde tu dispositivo sin alteraciones.`, 'info');
    };
    reader.readAsDataURL(file);
  };

  // Manejo de carga de archivo original de Salida
  const handleFileChangeSalida = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Archivo Inválido', 'Por favor selecciona un archivo de imagen válido (JPEG, PNG).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFotoSalida({
        dataUrl,
        nombre: file.name,
        tamano: file.size,
        tipoMime: file.type,
      });
      addToast('Fotografía Original Cargada', `Archivo "${file.name}" cargado desde tu dispositivo sin alteraciones.`, 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleMarcarEntrada = () => {
    const codigoLimpio = codigoTimemarkEntrada.trim().toUpperCase();

    if (!codigoLimpio) {
      addToast('Photo Code Requerido', 'Debes ingresar el Photo Code real de 14 caracteres de tu fotografía Timemark.', 'warning');
      return;
    }

    if (!validarFormatoPhotoCode(codigoLimpio)) {
      addToast(
        'Formato Inválido',
        `El Photo Code ingresado tiene ${codigoLimpio.length} caracteres. Debe tener exactamente 14 caracteres alfanuméricos.`,
        'error'
      );
      return;
    }

    if (!fotoEntrada) {
      addToast('Fotografía Requerida', 'Debes cargar la fotografía original tomada con Timemark desde tu dispositivo.', 'warning');
      return;
    }

    const ok = registrarEntrada(
      selectedLabId, 
      notasEntrada, 
      fotoEntrada,
      codigoLimpio
    );

    if (ok) {
      setNotasEntrada('');
      setCodigoTimemarkEntrada('');
      setFotoEntrada(null);
      if (fileInputEntradaRef.current) fileInputEntradaRef.current.value = '';
    }
  };

  const handleMarcarSalida = () => {
    if (!activeAsistenciaActual) {
      addToast('Aviso', 'Finalizando turno en demostración...', 'info');
      return;
    }

    const codigoLimpio = codigoTimemarkSalida.trim().toUpperCase();

    if (!codigoLimpio) {
      addToast('Photo Code Requerido', 'Debes ingresar el Photo Code real de 14 caracteres de tu fotografía de salida.', 'warning');
      return;
    }

    if (!validarFormatoPhotoCode(codigoLimpio)) {
      addToast(
        'Formato Inválido',
        `El Photo Code de salida tiene ${codigoLimpio.length} caracteres. Debe tener exactamente 14 caracteres alfanuméricos.`,
        'error'
      );
      return;
    }

    if (!fotoSalida) {
      addToast('Fotografía Requerida', 'Debes cargar la fotografía original de salida tomada con Timemark desde tu dispositivo.', 'warning');
      return;
    }

    const ok = registrarSalida(
      activeAsistenciaActual.id, 
      notasSalida, 
      fotoSalida,
      codigoLimpio
    );

    if (ok) {
      setNotasSalida('');
      setCodigoTimemarkSalida('');
      setFotoSalida(null);
      if (fileInputSalidaRef.current) fileInputSalidaRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Welcome Card & Real-Time Clock */}
      <div className="bg-gradient-to-r from-[#003561] via-[#00284a] to-[#0B1E38] text-white p-5 sm:p-6 rounded-2xl shadow-md border border-[#003561]/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#DFD4A6]">
            <GraduationCap className="w-4 h-4" />
            <span>Portal del Monitor Académico · FEA USCO</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1">
            Hola, {monitor.nombres}
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 mt-0.5">
            {monitor.programa_academico} · Código: <span className="font-mono text-[#DFD4A6]">{monitor.codigo_estudiantil}</span>
          </p>
        </div>

        {/* Live Clock Display */}
        <div className="bg-black/30 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 text-right self-start md:self-auto shrink-0">
          <span className="text-[10px] text-slate-300 uppercase tracking-wider block font-semibold">
            Hora Oficial del Sistema
          </span>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-white tabular-nums tracking-wider">
            {currentTime.toLocaleTimeString('es-CO')}
          </div>
          <div className="text-[11px] text-[#DFD4A6] capitalize">
            {currentTime.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Main Shift Action Card */}
      <div className="bg-white rounded-2xl border-2 border-[#003561]/30 shadow-md p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isEnTurno ? 'bg-[#8F141B]/10 text-[#8F141B]' : 'bg-[#003561]/10 text-[#003561]'}`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEnTurno ? 'Turno en Curso en el Laboratorio' : 'Registrar Inicio de Turno con Timemark'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEnTurno ? 'Jornada activa actualmente. Carga la fotografía original de salida al concluir.' : 'Selecciona la sala, adjunta tu foto Timemark original e ingresa el Photo Code.'}
              </p>
            </div>
          </div>

          <div>
            <StatusBadge type="monitor" value={isEnTurno ? 'en_turno' : 'activo'} />
          </div>
        </div>

        {isEnTurno ? (
          /* Estado: En Turno -> Marcación y Carga de Salida */
          <div className="space-y-4">
            <div className="p-4 bg-[#003561]/5 rounded-xl border border-[#003561]/20 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
              <div>
                <span className="text-[11px] text-[#003561] block font-bold">Laboratorio Asignado:</span>
                <p className="font-bold text-sm text-slate-900">
                  {activeAsistenciaActual?.laboratorio_nombre || 'Laboratorio 1 - Econometría y Finanzas'}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-[#003561] block font-bold">Hora de Entrada:</span>
                <p className="font-mono font-bold text-sm text-slate-900">
                  {activeAsistenciaActual?.hora_entrada || '14:00:00'}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-[#003561] block font-bold">Photo Code Entrada:</span>
                <p className="font-mono text-xs text-[#003561] font-semibold">
                  {activeAsistenciaActual?.timemark_entrada_codigo || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-[#003561] block font-bold">Foto Entrada:</span>
                {activeAsistenciaActual?.foto_entrada_url ? (
                  <img
                    src={activeAsistenciaActual.foto_entrada_url}
                    alt="Foto de entrada registrada"
                    className="w-10 h-10 object-cover rounded border border-slate-300 mt-0.5"
                  />
                ) : (
                  <span className="text-slate-400 text-[11px] italic">Sin foto</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resumen de Actividades Realizadas en Turno (Opcional):
              </label>
              <input
                type="text"
                value={notasSalida}
                onChange={(e) => setNotasSalida(e.target.value)}
                placeholder="Ej. Atención a clase de Econometría y soporte de software a 15 estudiantes..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:bg-white focus:border-[#003561]"
              />
            </div>

            {/* Timemark Salida: Carga de Fotografía Original y Photo Code */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8F141B]" />
                <span className="text-xs font-bold text-slate-900">
                  Evidencia Original de Salida (Timemark App) *
                </span>
              </div>

              <p className="text-[11px] text-[#4D626C]">
                Carga la fotografía original tomada con Timemark al momento de salir del laboratorio. El sistema conservará el archivo intacto con su marca de agua de origen para la verificación del coordinador.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                {/* Campo Photo Code Salida */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Photo Code de Salida (14 caracteres) *
                    </label>
                    <span className="text-[10px] font-mono text-[#4D626C]">
                      {codigoTimemarkSalida.trim().length} / 14
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    value={codigoTimemarkSalida}
                    onChange={(e) => setCodigoTimemarkSalida(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    placeholder="Ej. TMK20269482FE"
                    className={`w-full px-3 py-2 text-xs bg-white border rounded-lg text-slate-900 font-mono font-semibold outline-none transition-colors ${
                      codigoTimemarkSalida.trim().length === 14
                        ? 'border-[#003561] ring-1 ring-[#003561]/20'
                        : codigoTimemarkSalida.trim().length > 0
                        ? 'border-amber-400'
                        : 'border-slate-300'
                    }`}
                  />
                  <div className="mt-1 text-[10px]">
                    {codigoTimemarkSalida.trim().length === 14 ? (
                      <span className="text-[#003561] font-semibold flex items-center gap-1">
                        ✓ Formato de 14 caracteres alfanuméricos válido
                      </span>
                    ) : (
                      <span className="text-[#4D626C]">
                        Copia el Photo Code impreso en la marca de agua de tu foto Timemark.
                      </span>
                    )}
                  </div>
                </div>

                {/* Carga de archivo original */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Fotografía Original de Salida *
                  </label>
                  <input
                    ref={fileInputSalidaRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChangeSalida}
                    className="hidden"
                    id="file-salida-input"
                  />
                  {!fotoSalida ? (
                    <label
                      htmlFor="file-salida-input"
                      className="w-full py-2.5 px-3 bg-white border border-dashed border-slate-300 hover:border-[#8F141B] rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-[#8F141B]" />
                      <span>Seleccionar Fotografía Timemark</span>
                    </label>
                  ) : (
                    <div className="p-2.5 bg-white border border-[#003561]/30 rounded-lg flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <img 
                          src={fotoSalida.dataUrl} 
                          alt="Previsualización salida" 
                          className="w-10 h-10 object-cover rounded border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0 text-[11px]">
                          <p className="font-semibold text-slate-900 truncate">{fotoSalida.nombre}</p>
                          <p className="text-slate-500 font-mono text-[10px]">{formatFileSize(fotoSalida.tamano)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFotoSalida(null);
                          if (fileInputSalidaRef.current) fileInputSalidaRef.current.value = '';
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer shrink-0"
                        title="Quitar fotografía"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Botón Prominente de Salida */}
            <button
              onClick={handleMarcarSalida}
              className="w-full py-3.5 px-4 bg-[#8F141B] hover:bg-[#721015] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              <span>REGISTRAR SALIDA Y ENVIAR A REVISIÓN</span>
            </button>
          </div>
        ) : (
          /* Estado: Fuera de Turno -> Selector y Marcación de Entrada */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selecciona la Sala o Laboratorio a Ocupar *
              </label>
              <select
                value={selectedLabId}
                onChange={(e) => setSelectedLabId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:bg-white focus:border-[#003561] font-semibold cursor-pointer"
              >
                {laboratorios.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nombre} ({l.codigo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Propósito del Turno / Observación Inicial (Opcional):
              </label>
              <input
                type="text"
                value={notasEntrada}
                onChange={(e) => setNotasEntrada(e.target.value)}
                placeholder="Ej. Apertura de sala, atención y soporte en software SIIGO..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:bg-white focus:border-[#003561]"
              />
            </div>

            {/* Timemark Entrada: Carga de Fotografía Original y Photo Code */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#003561]" />
                <span className="text-xs font-bold text-slate-900">
                  Evidencia Original de Entrada (Timemark App) *
                </span>
              </div>

              <p className="text-[11px] text-[#4D626C]">
                Toma la fotografía en la entrada del laboratorio con la aplicación Timemark de tu dispositivo móvil y cárgala a continuación junto con su Photo Code de 14 caracteres.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                {/* Campo Photo Code Entrada */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Photo Code de Entrada (14 caracteres) *
                    </label>
                    <span className="text-[10px] font-mono text-[#4D626C]">
                      {codigoTimemarkEntrada.trim().length} / 14
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    value={codigoTimemarkEntrada}
                    onChange={(e) => setCodigoTimemarkEntrada(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    placeholder="Ej. TMK20268193FE"
                    className={`w-full px-3 py-2 text-xs bg-white border rounded-lg text-slate-900 font-mono font-semibold outline-none transition-colors ${
                      codigoTimemarkEntrada.trim().length === 14
                        ? 'border-[#003561] ring-1 ring-[#003561]/20'
                        : codigoTimemarkEntrada.trim().length > 0
                        ? 'border-amber-400'
                        : 'border-slate-300'
                    }`}
                  />
                  <div className="mt-1 text-[10px]">
                    {codigoTimemarkEntrada.trim().length === 14 ? (
                      <span className="text-[#003561] font-semibold flex items-center gap-1">
                        ✓ Formato de 14 caracteres alfanuméricos válido
                      </span>
                    ) : (
                      <span className="text-[#4D626C]">
                        Ingresa los 14 caracteres alfanuméricos del Photo Code de Timemark.
                      </span>
                    )}
                  </div>
                </div>

                {/* Carga de fotografía original */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Fotografía Original de Entrada *
                  </label>
                  <input
                    ref={fileInputEntradaRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChangeEntrada}
                    className="hidden"
                    id="file-entrada-input"
                  />
                  {!fotoEntrada ? (
                    <label
                      htmlFor="file-entrada-input"
                      className="w-full py-2.5 px-3 bg-white border border-dashed border-slate-300 hover:border-[#003561] rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-[#003561]" />
                      <span>Cargar Fotografía Timemark Original</span>
                    </label>
                  ) : (
                    <div className="p-2.5 bg-white border border-[#003561]/30 rounded-lg flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <img 
                          src={fotoEntrada.dataUrl} 
                          alt="Previsualización entrada" 
                          className="w-10 h-10 object-cover rounded border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0 text-[11px]">
                          <p className="font-semibold text-slate-900 truncate">{fotoEntrada.nombre}</p>
                          <p className="text-slate-500 font-mono text-[10px]">{formatFileSize(fotoEntrada.tamano)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFotoEntrada(null);
                          if (fileInputEntradaRef.current) fileInputEntradaRef.current.value = '';
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer shrink-0"
                        title="Quitar fotografía"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Botón Prominente de Entrada */}
            <button
              onClick={handleMarcarEntrada}
              className="w-full py-3.5 px-4 bg-[#8F141B] hover:bg-[#721015] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>REGISTRAR ENTRADA CON TIMEMARK</span>
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
          <span className="text-lg font-bold font-mono text-[#003561] tabular-nums">
            {porcentaje}%
          </span>
        </div>

        {/* Bar */}
        <div className="space-y-2">
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-[#003561] h-full rounded-full transition-all duration-500"
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
          <div className="p-3 bg-[#003561]/5 rounded-xl border border-[#003561]/20">
            <span className="text-[11px] text-[#003561] font-bold block">Horas Aprobadas</span>
            <p className="text-xl font-bold font-mono text-[#003561] mt-0.5 tabular-nums">
              {monitor.horas_aprobadas}
            </p>
          </div>

          <div className="p-3 bg-[#DFD4A6]/30 rounded-xl border border-[#DFD4A6]">
            <span className="text-[11px] text-[#8F141B] font-bold block">En Validación</span>
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
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#003561]" />
            <h3 className="text-sm font-bold text-slate-900">
              Mis Turnos Recientes y Evidencias Timemark
            </h3>
          </div>

          <button
            onClick={() => setActiveTab('novedades')}
            className="text-xs font-semibold text-[#8F141B] hover:text-[#721015] flex items-center gap-1 cursor-pointer"
          >
            <span>Radicar Corrección</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {misAsistencias.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              No tienes registros de asistencia en este periodo.
            </p>
          ) : (
            misAsistencias.map((asist) => (
              <div key={asist.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{asist.laboratorio_nombre}</p>
                    {asist.es_dato_prueba && (
                      <span className="text-[9px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                        Prueba visual
                      </span>
                    )}
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-[#003561]/10 text-[#003561] rounded">
                      Entrada: {asist.timemark_entrada_codigo || 'Sin código'}
                    </span>
                    {asist.timemark_salida_codigo && (
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-[#8F141B]/10 text-[#8F141B] rounded">
                        Salida: {asist.timemark_salida_codigo}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#4D626C] font-mono">
                    {asist.fecha} · {asist.hora_entrada} - {asist.hora_salida || 'En turno...'}
                  </p>

                  {asist.timemark_observaciones && (
                    <p className="text-[11px] text-[#003561] bg-[#003561]/5 px-2 py-0.5 rounded border border-[#003561]/10 inline-block">
                      Auditoría: {asist.timemark_observaciones}
                    </p>
                  )}
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0">
                  <span className="font-mono font-bold text-slate-900">
                    {asist.horas_calculadas > 0 ? `+${asist.horas_calculadas} hrs` : '0.0 hrs'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge type="asistencia" value={asist.estado} />
                    {asist.timemark_entrada_resultado && (
                      <StatusBadge type="timemark" value={asist.timemark_entrada_resultado} />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
