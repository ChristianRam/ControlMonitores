import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  Building2, 
  ArrowDownToLine,
  ShieldCheck,
  UserCheck,
  Target,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { ConfigurarMetaModal } from '../components/modals/ConfigurarMetaModal';

export const ReportesView: React.FC = () => {
  const { monitores, monitoresLoading, monitoresError, periodo, asistencias, addToast, currentRole, currentMonitorData, metaGeneralHoras } = useApp();

  // Si es monitor, solo puede ver la ficha individual de su propia monitoría
  const isMonitor = currentRole === 'monitor';
  
  // Monitor asignado al usuario actual (sin fallback a otro monitor)
  const myMonitorRecord = isMonitor ? (currentMonitorData ?? null) : null;

  const [activeTab, setActiveTab] = useState<'general' | 'individual'>(isMonitor ? 'individual' : 'general');
  const [selectedMonitorId, setSelectedMonitorId] = useState<string>(
    isMonitor ? (myMonitorRecord?.id || '') : (monitores[0]?.id || '')
  );
  const [filterPrograma, setFilterPrograma] = useState<string>('todos');
  const [isConfigMetaOpen, setIsConfigMetaOpen] = useState(false);
  const [coordinadorNombre, setCoordinadorNombre] = useState<string | null>(null);
  const [coordinadorLoading, setCoordinadorLoading] = useState<boolean>(false);
  const [coordinadorError, setCoordinadorError] = useState<{
    kind: 'query_error' | 'not_configured';
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!isMonitor && monitores.length > 0 && !monitores.some((m) => m.id === selectedMonitorId)) {
      setSelectedMonitorId(monitores[0].id);
    }
  }, [isMonitor, monitores, selectedMonitorId]);

  // Monitor seleccionado: estrictamente el monitor autenticado si es rol monitor (sin respaldo ajeno)
  const selectedMonitor = isMonitor
    ? myMonitorRecord
    : (monitores.find(m => m.id === selectedMonitorId) || monitores[0] || null);

  const fetchCoordinadorActivo = useCallback(async (): Promise<
    | { ok: true; nombre: string }
    | { ok: false; kind: 'query_error' | 'not_configured'; title: string; message: string }
  > => {
    if (!supabase || !isSupabaseConfigured) {
      const errState = {
        kind: 'query_error' as const,
        title: 'No fue posible consultar el coordinador',
        message: 'No hay conexión configurada con Supabase para consultar el coordinador activo.',
      };
      setCoordinadorNombre(null);
      setCoordinadorError(errState);
      return { ok: false, ...errState };
    }

    setCoordinadorLoading(true);
    setCoordinadorError(null);

    try {
      const { data, error } = await supabase.rpc('obtener_coordinador_activo');

      if (error) {
        const lowerMessage = error.message?.toLowerCase() ?? '';
        const isPermissionError =
          error.code === '42501' ||
          lowerMessage.includes('permission denied') ||
          lowerMessage.includes('row-level security');

        const errState = {
          kind: 'query_error' as const,
          title: 'No fue posible consultar el coordinador',
          message: isPermissionError
            ? 'No fue posible consultar al coordinador activo en Supabase por permisos insuficientes al ejecutar la función RPC. No se puede generar el certificado.'
            : 'No fue posible consultar al coordinador activo mediante la función RPC de Supabase. No se puede generar el certificado en este momento.',
        };
        setCoordinadorNombre(null);
        setCoordinadorError(errState);
        return { ok: false, ...errState };
      }

      const nombre = typeof data === 'string' ? data.trim() : '';
      if (!nombre) {
        const errState = {
          kind: 'not_configured' as const,
          title: 'No se ha configurado el coordinador activo',
          message: 'No existe un coordinador activo válido configurado con nombre completo en el sistema.',
        };
        setCoordinadorNombre(null);
        setCoordinadorError(errState);
        return { ok: false, ...errState };
      }

      setCoordinadorNombre(nombre);
      setCoordinadorError(null);
      return { ok: true, nombre };
    } catch {
      const errState = {
        kind: 'query_error' as const,
        title: 'No fue posible consultar el coordinador',
        message: 'Ocurrió un error inesperado al consultar al coordinador activo en Supabase. No se puede generar el certificado.',
      };
      setCoordinadorNombre(null);
      setCoordinadorError(errState);
      return { ok: false, ...errState };
    } finally {
      setCoordinadorLoading(false);
    }
  }, []);

  // Obtener dinámicamente el nombre del coordinador cada vez que se accede/genera la ficha individual
  useEffect(() => {
    if (activeTab === 'individual' || isMonitor) {
      void fetchCoordinadorActivo();
    }
  }, [activeTab, isMonitor, selectedMonitor?.id, fetchCoordinadorActivo]);

  // Filtros del consolidado general (solo para coordinadores)
  const filteredMonitores = monitores.filter(m => {
    return filterPrograma === 'todos' || m.programa_academico === filterPrograma;
  });

  const totalHorasAprobadas = filteredMonitores.reduce((acc, m) => acc + m.horas_aprobadas, 0);
  const totalHorasMetaFiltrada = filteredMonitores.reduce((acc, m) => acc + (m.horas_asignadas || metaGeneralHoras), 0);
  const totalMonitoresCompletados = filteredMonitores.filter(m => m.horas_aprobadas >= m.horas_asignadas).length;

  const handleExportCSV = () => {
    addToast('Archivo Generado', 'Descargando reporte consolidado en formato Excel / CSV...', 'success');
  };

  const handleExportPDF = async () => {
    const result = await fetchCoordinadorActivo();
    if (!result.ok) {
      addToast(result.title, result.message, 'error');
      return;
    }
    addToast('PDF Generado', 'Descargando Ficha Oficial de Certificación para el estudiante...', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePrintCertificate = async () => {
    const result = await fetchCoordinadorActivo();
    if (!result.ok) {
      addToast(result.title, result.message, 'error');
      return;
    }
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8F141B]">
            <span>Facultad de Economía y Administración</span>
            <span>·</span>
            <span>Módulo de Certificaciones</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            {isMonitor ? 'Certificación' : 'Reportes y Certificación de Monitorías'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {isMonitor 
              ? 'Consulta de constancia individual de horas cumplidas y trazabilidad de evidencias Timemark.' 
              : 'Consolidado general de horas y emisión de constancias individuales de cumplimiento con evidencias Timemark.'}
          </p>
        </div>

        {/* Tab Switcher: Solo visible para coordinadores */}
        {!isMonitor ? (
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto shrink-0">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'general'
                  ? 'bg-white text-[#8F141B] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-[#8F141B]" />
              <span>Consolidado General</span>
            </button>
            <button
              onClick={() => setActiveTab('individual')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'individual'
                  ? 'bg-white text-[#8F141B] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-[#8F141B]" />
              <span>Ficha Individual / Paz y Salvo</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-[#faf8ef] border border-[#DFD4A6] px-3 py-1.5 rounded-lg text-xs font-semibold text-[#8F141B]">
            <UserCheck className="w-4 h-4 text-[#8F141B]" />
            <span>Perfil Monitor: Vista Individual Exclusiva</span>
          </div>
        )}
      </div>

      {activeTab === 'general' && !isMonitor ? (
        /* Pestaña: Consolidado General (Solo Coordinadores) */
        <div className="space-y-4">
          {/* Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Horas Totales Acreditadas</span>
              <p className="text-2xl font-bold text-[#8F141B] font-mono mt-1 tabular-nums">
                {totalHorasAprobadas.toFixed(1)} hrs
              </p>
              <p className="text-[11px] text-slate-500 mt-1">En el periodo {periodo.codigo}</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500">Meta de Cumplimiento</span>
                <p className="text-2xl font-bold text-slate-900 font-mono mt-1 tabular-nums">
                  {metaGeneralHoras} hrs
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Por monitor asignado</p>
              </div>
              <button
                onClick={() => setIsConfigMetaOpen(true)}
                className="p-2 bg-slate-50 hover:bg-[#faf8ef] border border-slate-200 hover:border-[#8F141B] rounded-lg text-[#8F141B] transition-colors cursor-pointer"
                title="Configurar meta general de horas"
              >
                <Target className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Monitores con 100% Cumplido</span>
              <p className="text-2xl font-bold text-[#8F141B] font-mono mt-1 tabular-nums">
                {totalMonitoresCompletados} de {filteredMonitores.length}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Listos para emisión de Paz y Salvo</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Promedio de Avance</span>
              <p className="text-2xl font-bold text-slate-900 font-mono mt-1 tabular-nums">
                {filteredMonitores.length > 0 && totalHorasMetaFiltrada > 0
                  ? Math.round((totalHorasAprobadas / totalHorasMetaFiltrada) * 100)
                  : 0}%
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Sobre {totalHorasMetaFiltrada} horas asignadas totales
              </p>
            </div>
          </div>

          {/* Action and Filter Strip */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">Filtrar por Programa:</span>
              <select
                value={filterPrograma}
                onChange={(e) => setFilterPrograma(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none"
              >
                <option value="todos">Todos los Programas de la Facultad</option>
                <option value="Economía">Economía</option>
                <option value="Contaduría Pública">Contaduría Pública</option>
                <option value="Administración de Empresas">Administración de Empresas</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Exportar Excel (.xlsx)</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#8F141B] hover:bg-[#751016] rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Listado</span>
              </button>
            </div>
          </div>

          {/* Table Consolidado */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#8F141B]/5 text-slate-700 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Estudiante Monitor</th>
                    <th className="py-3 px-4">Código USCO</th>
                    <th className="py-3 px-4">Programa Académico</th>
                    <th className="py-3 px-4">Meta</th>
                    <th className="py-3 px-4">Horas Aprobadas</th>
                    <th className="py-3 px-4">Porcentaje</th>
                    <th className="py-3 px-4">Estado Paz y Salvo</th>
                    <th className="py-3 px-4 text-right">Constancia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {monitoresLoading && monitores.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        Cargando nómina real de monitores desde Supabase...
                      </td>
                    </tr>
                  ) : monitoresError ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#8F141B]">
                        {monitoresError}
                      </td>
                    </tr>
                  ) : filteredMonitores.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No hay monitores registrados para mostrar con el filtro seleccionado.
                      </td>
                    </tr>
                  ) : (
                    filteredMonitores.map((m) => {
                      const cumplido = m.horas_aprobadas >= m.horas_asignadas;
                      const porcentaje = Math.min(100, Math.round((m.horas_aprobadas / (m.horas_asignadas || 1)) * 100));

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {m.nombres} {m.apellidos}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {m.codigo_estudiantil}
                          </td>
                          <td className="py-3 px-4">
                            {m.programa_academico}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {m.horas_asignadas} hrs
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-[#8F141B]">
                            {m.horas_aprobadas} hrs
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-100 rounded-full h-1.5">
                                <div
                                  className={`h-full rounded-full ${cumplido ? 'bg-[#8F141B]' : 'bg-[#4D626C]'}`}
                                  style={{ width: `${porcentaje}%` }}
                                />
                              </div>
                              <span className="font-mono text-[11px] font-semibold">{porcentaje}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {cumplido ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                Paz y Salvo Aprobado
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#4D626C] font-medium">
                                En proceso (Faltan {Math.max(0, m.horas_asignadas - m.horas_aprobadas).toFixed(1)} hrs)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedMonitorId(m.id);
                                setActiveTab('individual');
                              }}
                              className="text-xs font-semibold text-[#8F141B] hover:text-[#721015] cursor-pointer"
                            >
                              Ver Ficha
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Pestaña: Ficha Individual / Paz y Salvo Oficial */
        <div className="space-y-4">
          {/* Barra superior de selección/información */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {!isMonitor ? (
              /* Coordinador: Puede seleccionar cualquier estudiante real */
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-700">Seleccionar Estudiante:</label>
                <select
                  value={selectedMonitorId}
                  onChange={(e) => setSelectedMonitorId(e.target.value)}
                  disabled={monitores.length === 0}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none font-semibold cursor-pointer disabled:opacity-60"
                >
                  {monitores.length === 0 ? (
                    <option value="">
                      {monitoresLoading ? 'Cargando monitores...' : 'Sin monitores registrados'}
                    </option>
                  ) : (
                    monitores.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombres} {m.apellidos} ({m.programa_academico} - {m.codigo_estudiantil})
                      </option>
                    ))
                  )}
                </select>
              </div>
            ) : (
              /* Monitor: Solo ve su propia información fija sin selector de terceros */
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-slate-600">Monitor Titular:</span>
                {selectedMonitor ? (
                  <>
                    <span className="text-xs font-bold text-[#8F141B] bg-[#faf8ef] px-3 py-1 rounded-lg border border-[#DFD4A6]">
                      {selectedMonitor.nombres} {selectedMonitor.apellidos} ({selectedMonitor.codigo_estudiantil})
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium hidden md:inline">
                      · {selectedMonitor.programa_academico}
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-[#8F141B]">
                    Información de monitor no disponible
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => void handleExportPDF()}
                disabled={coordinadorLoading || !coordinadorNombre || !selectedMonitor}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#8F141B] hover:bg-[#751016] disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <span>Descargar Certificado (PDF)</span>
              </button>
              <button
                onClick={() => void handlePrintCertificate()}
                disabled={coordinadorLoading || !coordinadorNombre || !selectedMonitor}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#8F141B] bg-white border border-slate-300 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Ficha</span>
              </button>
            </div>
          </div>

          {!selectedMonitor && (
            <div
              role="alert"
              className="bg-amber-50 border border-amber-200 rounded-xl p-6 max-w-4xl mx-auto flex items-start gap-3 text-amber-900 shadow-xs"
            >
              <AlertCircle className="w-5 h-5 text-[#8F141B] shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h3 className="text-sm font-bold text-[#8F141B]">
                  {isMonitor ? 'No se encontró tu información real de monitor' : 'No hay monitores disponibles para certificar'}
                </h3>
                <p className="leading-relaxed text-amber-900">
                  {isMonitor
                    ? 'No fue posible obtener tu registro oficial desde public.monitores en Supabase. Por seguridad, no se utilizan datos de respaldo ni de otros estudiantes para generar certificados.'
                    : 'No existen registros de monitores cargados desde Supabase para emitir constancias.'}
                </p>
              </div>
            </div>
          )}

          {/* Estado de carga o error de coordinador activo antes de emitir certificado */}
          {coordinadorLoading && !coordinadorNombre && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs max-w-4xl mx-auto flex flex-col items-center justify-center text-center gap-3">
              <Loader2 className="w-6 h-6 text-[#8F141B] animate-spin" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Consultando coordinador activo...</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verificando la firma institucional autorizada en Supabase antes de generar el certificado.
                </p>
              </div>
            </div>
          )}

          {!coordinadorLoading && (!coordinadorNombre || coordinadorError) && (
            <div
              role="alert"
              className="bg-rose-50 border border-rose-200 rounded-xl p-6 max-w-4xl mx-auto flex items-start gap-3 text-rose-900 shadow-xs"
            >
              <AlertCircle className="w-5 h-5 text-[#8F141B] shrink-0 mt-0.5" />
              <div className="space-y-1.5 text-xs">
                <h3 className="text-sm font-bold text-[#8F141B]">
                  {coordinadorError?.title || 'No se ha configurado el coordinador activo'}
                </h3>
                <p className="leading-relaxed text-rose-800">
                  {coordinadorError?.message ||
                    'No existe un coordinador activo válido configurado con nombre completo en el sistema.'}
                </p>
                <p className="text-[11px] text-rose-700 font-medium">
                  {coordinadorError?.kind === 'query_error'
                    ? 'Para evitar emitir un certificado con información incorrecta, la generación e impresión de la constancia permanecen bloqueadas hasta que se restablezca la consulta del coordinador activo.'
                    : 'Para evitar emitir un certificado con información incorrecta, la generación e impresión de la constancia permanecen bloqueadas hasta que exista un coordinador activo válido.'}
                </p>
              </div>
            </div>
          )}

          {/* Formato Oficial de Certificación Impresa */}
          {selectedMonitor && coordinadorNombre && !coordinadorError && (
            <div className="bg-white rounded-xl border border-slate-300 p-8 sm:p-12 shadow-sm max-w-4xl mx-auto print:shadow-none print:border-none print:p-0">
              {/* Header Documento Institucional */}
              <div className="border-b-2 border-[#8F141B] pb-6 mb-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#8F141B] flex items-center justify-center text-white shrink-0 shadow-xs">
                      <Building2 className="w-7 h-7 text-[#DFD4A6]" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8F141B]">
                        <span>Universidad Surcolombiana</span>
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-950 mt-0.5 uppercase tracking-tight">
                        Facultad de Economía y Administración
                      </h2>
                      <p className="text-xs text-[#4D626C] font-medium">
                        Coordinación General de Salas Tecnológicas y Salas de Cómputo
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-xs font-mono text-slate-600 shrink-0">
                    <p className="font-bold text-[#8F141B]">CONSTANCIA FEA-{periodo.codigo}-084</p>
                    <p>Fecha de emisión: {new Date().toLocaleDateString('es-CO')}</p>
                    <p>Neiva, Huila</p>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <span className="text-sm font-bold tracking-wider uppercase text-[#8F141B] border-b-2 border-[#DFD4A6] pb-1">
                    Certificación de Cumplimiento de Horas
                  </span>
                </div>
              </div>

              {/* Cuerpo del Certificado */}
              <div className="space-y-6 text-xs text-slate-800 leading-relaxed">
                <p>
                  El suscrito Coordinador de Salas Tecnológicas de la Facultad de Economía y Administración de la 
                  <strong> Universidad Surcolombiana</strong>, hace constar que el (la) estudiante:
                </p>

                {/* Ficha del Estudiante */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] text-[#4D626C] block font-medium">Nombres y Apellidos:</span>
                    <p className="font-bold text-sm text-slate-950">{selectedMonitor.nombres} {selectedMonitor.apellidos}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#4D626C] block font-medium">Código Estudiantil:</span>
                    <p className="font-mono font-bold text-sm text-[#8F141B]">{selectedMonitor.codigo_estudiantil}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#4D626C] block font-medium">Programa Académico:</span>
                    <p className="font-semibold text-slate-900">{selectedMonitor.programa_academico}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#4D626C] block font-medium">Periodo Académico:</span>
                    <p className="font-semibold text-slate-900">{periodo.nombre}</p>
                  </div>
                </div>

                <p>
                  Ha prestado satisfactoriamente sus servicios de monitoría académica y soporte tecnológico en las salas de cómputo de la Facultad, acumulando el siguiente registro certificado y validado con evidencias fotográficas Timemark:
                </p>

                {/* Balance de horas */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-slate-100 rounded border border-slate-200">
                    <span className="text-[11px] text-[#4D626C] block font-medium">Horas Asignadas (Meta)</span>
                    <span className="text-lg font-bold font-mono text-slate-900">{selectedMonitor.horas_asignadas} hrs</span>
                  </div>
                  <div className="p-3 bg-[#faf8ef] rounded border border-[#DFD4A6]">
                    <span className="text-[11px] text-[#6E6130] block font-bold">Horas Convalidadas</span>
                    <span className="text-lg font-bold font-mono text-[#8F141B]">{selectedMonitor.horas_aprobadas} hrs</span>
                  </div>
                  <div className="p-3 bg-slate-100 rounded border border-slate-200">
                    <span className="text-[11px] text-[#4D626C] block font-medium">Porcentaje de Avance</span>
                    <span className="text-lg font-bold font-mono text-[#8F141B]">
                      {Math.min(100, Math.round((selectedMonitor.horas_aprobadas / (selectedMonitor.horas_asignadas || 1)) * 100))}%
                    </span>
                  </div>
                </div>

                {/* Detalle de turnos con Timemark */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Registro Cronológico de Jornadas y Evidencias Timemark:
                    </h4>
                    <span className="text-[11px] text-[#4D626C] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#8F141B]" />
                      <span>Verificado con Timemark Photo Code</span>
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-[#8F141B]/5 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Fecha</th>
                          <th className="py-2 px-3">Sala</th>
                          <th className="py-2 px-3">Horario</th>
                          <th className="py-2 px-3">Horas</th>
                          <th className="py-2 px-3">Timemark Photo Code</th>
                          <th className="py-2 px-3">Auditoría Timemark</th>
                          <th className="py-2 px-3">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {(() => {
                          const realAsistencias = asistencias.filter(
                            (a) => a.monitor_id === selectedMonitor.id && !a.es_dato_prueba
                          );
                          if (realAsistencias.length === 0) {
                            return (
                              <tr>
                                <td colSpan={7} className="py-4 px-3 text-center text-slate-500">
                                  Sin jornadas sincronizadas en Supabase para este monitor en el periodo actual.
                                </td>
                              </tr>
                            );
                          }
                          return realAsistencias.map((a) => (
                            <tr key={a.id}>
                              <td className="py-2 px-3 font-mono">{a.fecha}</td>
                              <td className="py-2 px-3">{a.laboratorio_nombre}</td>
                              <td className="py-2 px-3 font-mono">{a.hora_entrada} - {a.hora_salida || 'En curso'}</td>
                              <td className="py-2 px-3 font-mono font-bold">{a.horas_calculadas} hrs</td>
                              <td className="py-2 px-3 font-mono text-[10px] text-[#8F141B] font-semibold">
                                {a.timemark_entrada_codigo || 'N/A'}
                              </td>
                              <td className="py-2 px-3">
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  a.timemark_entrada_resultado === 'Auténtico'
                                    ? 'bg-emerald-50 text-emerald-800'
                                    : a.timemark_entrada_resultado === 'Falso'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-[#DFD4A6]/40 text-[#6E6130]'
                                }`}>
                                  {a.timemark_entrada_resultado || 'Pendiente'}
                                </span>
                              </td>
                              <td className="py-2 px-3 capitalize">{a.estado.replace('_', ' ')}</td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Firma de Constancia */}
                <div className="pt-14 flex justify-center text-center">
                  <div className="w-full max-w-xs sm:max-w-sm border-t border-slate-400 pt-2">
                    <p className="font-bold text-slate-900">{coordinadorNombre}</p>
                    <p className="text-[11px] text-[#4D626C]">Coordinador de Salas Tecnológicas</p>
                    <p className="text-[10px] text-slate-500">Facultad de Economía y Administración - USCO</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Configurar Meta General de Cumplimiento */}
      <ConfigurarMetaModal
        isOpen={isConfigMetaOpen}
        onClose={() => setIsConfigMetaOpen(false)}
      />
    </div>
  );
};
