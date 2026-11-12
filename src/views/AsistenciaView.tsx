import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Asistencia, ResultadoVerificacionTimemark } from '../types/database';
import { 
  CalendarCheck2, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Eye, 
  X, 
  FileText,
  Camera,
  Calendar,
  ThumbsDown,
  ThumbsUp,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Copy,
  Info,
  Maximize2,
  AlertTriangle
} from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';

export const AsistenciaView: React.FC = () => {
  const { 
    asistencias, 
    monitores, 
    laboratorios, 
    aprobarAsistencia, 
    rechazarAsistencia, 
    observarAsistencia,
    actualizarVerificacionTimemark,
    addToast
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterLab, setFilterLab] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterTimemark, setFilterTimemark] = useState('todos');
  const [filterFecha, setFilterFecha] = useState('');

  // Modal de Detalle / Validación con Timemark
  const [selectedAsistencia, setSelectedAsistencia] = useState<Asistencia | null>(null);
  const [notasCoordinador, setNotasCoordinador] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [isRejectMode, setIsRejectMode] = useState(false);

  // Modal de zoom para ver fotografía original a tamaño completo
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState<{ url: string; titulo: string } | null>(null);

  // Estados locales en el modal para editar verificación de Timemark antes de guardar
  const [tempEntradaResultado, setTempEntradaResultado] = useState<ResultadoVerificacionTimemark>('Pendiente');
  const [tempSalidaResultado, setTempSalidaResultado] = useState<ResultadoVerificacionTimemark>('Pendiente');
  const [tempTimemarkObs, setTempTimemarkObs] = useState('');

  // Filtrado
  const filteredAsistencias = asistencias.filter((a) => {
    const matchSearch = 
      (a.monitor_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.laboratorio_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.timemark_entrada_codigo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.timemark_salida_codigo || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchLab = filterLab === 'todos' || a.laboratorio_id === filterLab;
    const matchEstado = filterEstado === 'todos' || a.estado === filterEstado;
    const matchFecha = !filterFecha || a.fecha === filterFecha;

    const matchTimemark = filterTimemark === 'todos' 
      ? true 
      : a.timemark_entrada_resultado === filterTimemark || a.timemark_salida_resultado === filterTimemark;

    return matchSearch && matchLab && matchEstado && matchFecha && matchTimemark;
  });

  const handleOpenDetail = (asistencia: Asistencia) => {
    setSelectedAsistencia(asistencia);
    setNotasCoordinador(asistencia.notas_coordinador || '');
    setIsRejectMode(false);
    setMotivoRechazo('');
    setTempEntradaResultado(asistencia.timemark_entrada_resultado || 'Pendiente');
    setTempSalidaResultado(asistencia.timemark_salida_resultado || 'Pendiente');
    setTempTimemarkObs(asistencia.timemark_observaciones || '');
  };

  const handleGuardarVerificacionTimemark = (tipo: 'entrada' | 'salida', nuevoResultado: ResultadoVerificacionTimemark) => {
    if (!selectedAsistencia) return;
    if (tipo === 'entrada') {
      setTempEntradaResultado(nuevoResultado);
    } else {
      setTempSalidaResultado(nuevoResultado);
    }
    actualizarVerificacionTimemark(selectedAsistencia.id, tipo, nuevoResultado, tempTimemarkObs);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    addToast('Photo Code Copiado', `Código "${code}" copiado al portapapeles para verificar en verify.timemark.com/es.`, 'info');
  };

  const handleApprove = () => {
    if (!selectedAsistencia) return;
    aprobarAsistencia(selectedAsistencia.id, notasCoordinador);
    setSelectedAsistencia(null);
  };

  const handleReject = () => {
    if (!selectedAsistencia || !motivoRechazo.trim()) return;
    rechazarAsistencia(selectedAsistencia.id, motivoRechazo);
    setSelectedAsistencia(null);
  };

  const handleObserve = () => {
    if (!selectedAsistencia || !notasCoordinador.trim()) return;
    observarAsistencia(selectedAsistencia.id, notasCoordinador);
    setSelectedAsistencia(null);
  };

  const opcionesVerificacion: ResultadoVerificacionTimemark[] = [
    'Pendiente',
    'Auténtico',
    'Falso',
    'No encontrado',
    'No se puede verificar'
  ];

  // Comprobar si las evidencias obligatorias están completas
  const evidenciasCompletas = (asist: Asistencia) => {
    const tieneEntrada = Boolean(asist.foto_entrada_url && asist.timemark_entrada_codigo);
    const tieneSalida = Boolean(asist.hora_salida ? (asist.foto_salida_url && asist.timemark_salida_codigo) : true);
    return tieneEntrada && tieneSalida;
  };

  return (
    <div className="space-y-6">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#003561]">
            <span>Facultad de Economía y Administración</span>
            <span className="text-[#DFD4A6]">·</span>
            <span>Control de Asistencia & Evidencias Timemark</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Registro de Jornadas y Verificación Timemark
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Auditoría de fotografías originales tomadas con Timemark, consulta de Photo Codes en el portal oficial y convalidación de horas.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center shadow-xs">
        {/* Search */}
        <div className="sm:col-span-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por monitor, sala o Photo Code..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:bg-white focus:border-[#003561]"
          />
        </div>

        {/* Filter Sala */}
        <div className="sm:col-span-3">
          <select
            value={filterLab}
            onChange={(e) => setFilterLab(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none focus:bg-white cursor-pointer"
          >
            <option value="todos">Todos los Laboratorios</option>
            {laboratorios.map((l) => (
              <option key={l.id} value={l.id}>{l.nombre}</option>
            ))}
          </select>
        </div>

        {/* Filter Estado Jornada */}
        <div className="sm:col-span-2">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none focus:bg-white cursor-pointer"
          >
            <option value="todos">Todos los Estados</option>
            <option value="en_curso">En Turno Ahora</option>
            <option value="pendiente_validacion">Pendientes de Revisión</option>
            <option value="aprobada">Convalidadas / Aprobadas</option>
            <option value="rechazada">Rechazadas</option>
            <option value="observacion">Con Observación</option>
          </select>
        </div>

        {/* Filter Verificación Timemark */}
        <div className="sm:col-span-3">
          <select
            value={filterTimemark}
            onChange={(e) => setFilterTimemark(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none focus:bg-white cursor-pointer"
          >
            <option value="todos">Cualquier Estado Timemark</option>
            <option value="Pendiente">Timemark: Pendiente</option>
            <option value="Auténtico">Timemark: Auténtico</option>
            <option value="Falso">Timemark: Falso</option>
            <option value="No encontrado">Timemark: No encontrado</option>
            <option value="No se puede verificar">Timemark: No se puede verificar</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#003561]/5 text-slate-700 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Estudiante Monitor</th>
                <th className="py-3 px-4">Laboratorio Asignado</th>
                <th className="py-3 px-4">Horario Marcación</th>
                <th className="py-3 px-4">Evidencias Timemark (Photo Codes)</th>
                <th className="py-3 px-4">Horas</th>
                <th className="py-3 px-4">Estado Jornada</th>
                <th className="py-3 px-4 text-right">Auditoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAsistencias.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-[#003561] mx-auto mb-2 opacity-80" />
                    <p className="font-semibold text-slate-800 text-sm">No se encontraron registros</p>
                    <p className="text-xs mt-0.5">Ajusta los filtros de búsqueda o el laboratorio.</p>
                  </td>
                </tr>
              ) : (
                filteredAsistencias.map((asist) => {
                  const tieneEvidenciasCompletas = evidenciasCompletas(asist);

                  return (
                    <tr key={asist.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 text-xs">{asist.monitor_nombre}</p>
                          {asist.es_dato_prueba && (
                            <span className="text-[9px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200" title="Registro de demostración para visualización">
                              Demo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#4D626C] font-mono mt-0.5">{asist.fecha}</p>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {asist.laboratorio_nombre}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700">
                        {asist.hora_entrada} — {asist.hora_salida || <span className="text-[#8F141B] font-bold">En turno...</span>}
                      </td>

                      {/* Evidencias Timemark */}
                      <td className="py-3 px-4 min-w-[220px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="font-semibold text-slate-500 w-14">Entrada:</span>
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              {asist.timemark_entrada_codigo || 'Sin código'}
                            </span>
                            <StatusBadge type="timemark" value={asist.timemark_entrada_resultado || 'Pendiente'} />
                          </div>

                          {asist.hora_salida && (
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="font-semibold text-slate-500 w-14">Salida:</span>
                              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                {asist.timemark_salida_codigo || 'Sin código'}
                              </span>
                              <StatusBadge type="timemark" value={asist.timemark_salida_resultado || 'Pendiente'} />
                            </div>
                          )}

                          {!tieneEvidenciasCompletas && (
                            <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Evidencia pendiente</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {asist.horas_calculadas > 0 ? (
                          <span className="font-mono font-bold text-[#003561] bg-[#003561]/10 px-2 py-0.5 rounded border border-[#003561]/25 tabular-nums">
                            {asist.horas_calculadas} hrs
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">0.0 hrs</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge type="asistencia" value={asist.estado} />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {asist.estado === 'pendiente_validacion' && (
                            <button
                              onClick={() => handleOpenDetail(asist)}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-[#8F141B] hover:bg-[#721015] rounded-md transition-colors cursor-pointer shadow-2xs"
                            >
                              Auditar Timemark
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenDetail(asist)}
                            className="p-1 text-slate-500 hover:text-[#003561] hover:bg-slate-100 rounded cursor-pointer"
                            title="Ver detalles completos de evidencias"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Detalle de Asistencia & Auditoría Oficial Timemark */}
      {selectedAsistencia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-[#003561] text-white sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#8F141B] rounded-lg text-white">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      Auditoría de Evidencias Timemark y Convalidación
                    </h3>
                    {selectedAsistencia.es_dato_prueba && (
                      <span className="text-[10px] font-semibold bg-[#DFD4A6] text-[#003561] px-2 py-0.5 rounded">
                        Dato de Demostración
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#DFD4A6] font-mono">
                    Registro #{selectedAsistencia.id} · Fecha: {selectedAsistencia.fecha}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAsistencia(null)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5 text-xs">
              {/* Resumen del Turno */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[11px] text-[#4D626C] block font-semibold">Monitor Asignado:</span>
                  <p className="font-bold text-slate-900 text-xs mt-0.5">{selectedAsistencia.monitor_nombre}</p>
                </div>
                <div>
                  <span className="text-[11px] text-[#4D626C] block font-semibold">Laboratorio:</span>
                  <p className="font-bold text-slate-900 text-xs mt-0.5">{selectedAsistencia.laboratorio_nombre}</p>
                </div>
                <div>
                  <span className="text-[11px] text-[#4D626C] block font-semibold">Horario Registrado:</span>
                  <p className="font-mono text-slate-800 text-xs mt-0.5">
                    {selectedAsistencia.hora_entrada} — {selectedAsistencia.hora_salida || 'En turno'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-[#4D626C] block font-semibold">Horas a Convalidar:</span>
                  <p className="font-mono font-bold text-[#003561] text-sm mt-0.5">
                    {selectedAsistencia.horas_calculadas} hrs
                  </p>
                </div>
              </div>

              {/* Banner de Verificación Oficial Timemark con URL oficial */}
              <div className="p-4 bg-[#f0f5fa] border border-[#003561]/25 rounded-xl space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#003561]">
                    <ShieldCheck className="w-4 h-4 text-[#003561]" />
                    <span>Servicio Oficial de Verificación Manual Timemark</span>
                  </div>
                  <a
                    href="https://verify.timemark.com/es"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#003561] hover:bg-[#002545] text-white text-[11px] font-semibold rounded-lg transition-colors cursor-pointer shrink-0 shadow-2xs"
                  >
                    <span>Abrir verify.timemark.com/es</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Copia el Photo Code de 14 caracteres impreso en la marca de agua de la fotografía original y pégalo en el portal oficial <strong>https://verify.timemark.com/es</strong> para verificar autenticidad, hora oficial y coordenadas GPS. A continuación registra manualmente el resultado de la auditoría.
                </p>
              </div>

              {/* Advertencia si faltan evidencias para cumplir con la regla 9 */}
              {!evidenciasCompletas(selectedAsistencia) && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-xs">Evidencias Incompletas (Regla Institucional)</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Falta la fotografía original o el Photo Code en la marcación de entrada o de salida. Conforme a las normas de control de monitorías, la jornada <strong>debe permanecer en estado pendiente de revisión</strong> hasta que se aporten las evidencias completas.
                    </p>
                  </div>
                </div>
              )}

              {/* Sección de Evidencias Originales y Photo Codes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Marcación de Entrada */}
                <div className="p-4 bg-white border-2 border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-[#003561]" />
                      <span>1. Fotografía Original de Entrada</span>
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-[#003561]">
                      {selectedAsistencia.hora_entrada}
                    </span>
                  </div>

                  {/* Vista de Fotografía Original sin marcas sintéticas */}
                  {selectedAsistencia.foto_entrada_url ? (
                    <div className="space-y-1.5">
                      <div className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-300 group flex items-center justify-center">
                        <img 
                          src={selectedAsistencia.foto_entrada_url} 
                          alt="Fotografía original de entrada"
                          className="w-full h-full object-contain"
                        />
                        {selectedAsistencia.es_dato_prueba && (
                          <div className="absolute top-2 left-2 bg-[#8F141B]/90 text-white text-[9px] font-bold px-2 py-0.5 rounded tracking-wide uppercase shadow-xs">
                            Foto de Demostración Visual
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setZoomPhotoUrl({ 
                            url: selectedAsistencia.foto_entrada_url!, 
                            titulo: `Fotografía Original de Entrada · Monitor: ${selectedAsistencia.monitor_nombre} · Fecha: ${selectedAsistencia.fecha}` 
                          })}
                          className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/70 hover:bg-black text-white text-[10px] font-semibold rounded flex items-center gap-1 opacity-90 transition-opacity cursor-pointer"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>Ver Original Completa</span>
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Archivo: {selectedAsistencia.foto_entrada_nombre || 'timemark_entrada.jpg'}</span>
                        {selectedAsistencia.es_dato_prueba && (
                          <span className="text-[#8F141B] font-semibold">[DATO DE PRUEBA]</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center text-slate-500">
                      <Camera className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <p className="font-semibold text-slate-700">Sin fotografía adjunta</p>
                      <p className="text-[11px]">El monitor no cargó la foto de entrada.</p>
                    </div>
                  )}

                  {/* Photo Code Entrada Campo */}
                  <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="min-w-0">
                      <span className="text-[10px] text-[#4D626C] font-semibold block uppercase">Photo Code Entrada (14 car.):</span>
                      <span className="font-mono font-bold text-slate-900 text-xs tracking-wider truncate block">
                        {selectedAsistencia.timemark_entrada_codigo || 'No registrado'}
                      </span>
                    </div>
                    {selectedAsistencia.timemark_entrada_codigo && (
                      <button
                        type="button"
                        onClick={() => handleCopyCode(selectedAsistencia.timemark_entrada_codigo!)}
                        className="p-1.5 text-[#003561] hover:bg-[#003561]/10 rounded transition-colors cursor-pointer shrink-0"
                        title="Copiar Photo Code para verificar en verify.timemark.com/es"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Selector Manual de Verificación Entrada */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Resultado Manual de Verificación Entrada:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {opcionesVerificacion.map((opc) => (
                        <button
                          key={opc}
                          type="button"
                          onClick={() => handleGuardarVerificacionTimemark('entrada', opc)}
                          className={`px-2 py-1.5 rounded text-[11px] font-semibold text-center border transition-all cursor-pointer ${
                            tempEntradaResultado === opc
                              ? opc === 'Auténtico'
                                ? 'bg-[#003561] text-white border-[#003561]'
                                : opc === 'Falso'
                                ? 'bg-[#8F141B] text-white border-[#8F141B]'
                                : 'bg-[#DFD4A6] text-[#003561] border-[#DFD4A6] font-bold'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {opc}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Marcación de Salida */}
                <div className="p-4 bg-white border-2 border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-[#8F141B]" />
                      <span>2. Fotografía Original de Salida</span>
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-[#8F141B]">
                      {selectedAsistencia.hora_salida || 'En turno'}
                    </span>
                  </div>

                  {selectedAsistencia.hora_salida ? (
                    <>
                      {/* Vista de Foto Original Salida */}
                      {selectedAsistencia.foto_salida_url ? (
                        <div className="space-y-1.5">
                          <div className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-300 group flex items-center justify-center">
                            <img 
                              src={selectedAsistencia.foto_salida_url} 
                              alt="Fotografía original de salida"
                              className="w-full h-full object-contain"
                            />
                            {selectedAsistencia.es_dato_prueba && (
                              <div className="absolute top-2 left-2 bg-[#8F141B]/90 text-white text-[9px] font-bold px-2 py-0.5 rounded tracking-wide uppercase shadow-xs">
                                Foto de Demostración Visual
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setZoomPhotoUrl({ 
                                url: selectedAsistencia.foto_salida_url!, 
                                titulo: `Fotografía Original de Salida · Monitor: ${selectedAsistencia.monitor_nombre} · Fecha: ${selectedAsistencia.fecha}` 
                              })}
                              className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/70 hover:bg-black text-white text-[10px] font-semibold rounded flex items-center gap-1 opacity-90 transition-opacity cursor-pointer"
                            >
                              <Maximize2 className="w-3 h-3" />
                              <span>Ver Original Completa</span>
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                            <span>Archivo: {selectedAsistencia.foto_salida_nombre || 'timemark_salida.jpg'}</span>
                            {selectedAsistencia.es_dato_prueba && (
                              <span className="text-[#8F141B] font-semibold">[DATO DE PRUEBA]</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center text-slate-500">
                          <Camera className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                          <p className="font-semibold text-slate-700">Sin fotografía de salida</p>
                          <p className="text-[11px]">El monitor finalizó turno sin adjuntar foto.</p>
                        </div>
                      )}

                      {/* Photo Code Salida */}
                      <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="min-w-0">
                          <span className="text-[10px] text-[#4D626C] font-semibold block uppercase">Photo Code Salida (14 car.):</span>
                          <span className="font-mono font-bold text-slate-900 text-xs tracking-wider truncate block">
                            {selectedAsistencia.timemark_salida_codigo || 'No registrado'}
                          </span>
                        </div>
                        {selectedAsistencia.timemark_salida_codigo && (
                          <button
                            type="button"
                            onClick={() => handleCopyCode(selectedAsistencia.timemark_salida_codigo!)}
                            className="p-1.5 text-[#003561] hover:bg-[#003561]/10 rounded transition-colors cursor-pointer shrink-0"
                            title="Copiar Photo Code para verificar en verify.timemark.com/es"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Selector Manual Verificación Salida */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Resultado Manual de Verificación Salida:
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {opcionesVerificacion.map((opc) => (
                            <button
                              key={opc}
                              type="button"
                              onClick={() => handleGuardarVerificacionTimemark('salida', opc)}
                              className={`px-2 py-1.5 rounded text-[11px] font-semibold text-center border transition-all cursor-pointer ${
                                tempSalidaResultado === opc
                                  ? opc === 'Auténtico'
                                    ? 'bg-[#003561] text-white border-[#003561]'
                                    : opc === 'Falso'
                                    ? 'bg-[#8F141B] text-white border-[#8F141B]'
                                    : 'bg-[#DFD4A6] text-[#003561] border-[#DFD4A6] font-bold'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {opc}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-12 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-slate-500">
                      <Clock className="w-6 h-6 text-[#003561] mx-auto mb-1 animate-pulse" />
                      <p className="font-semibold text-slate-800">Turno en curso</p>
                      <p className="text-[11px] mt-0.5">La fotografía original de salida se registrará al finalizar la jornada.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Observaciones del Coordinador */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Observaciones de la Auditoría Manual Timemark:
                </label>
                <textarea
                  rows={2}
                  value={tempTimemarkObs}
                  onChange={(e) => setTempTimemarkObs(e.target.value)}
                  placeholder="Registra hallazgos de la verificación manual (ej: verificado en verify.timemark.com/es, coinciden fecha, hora y coordenadas de la FEA)..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:bg-white focus:border-[#003561]"
                />
              </div>

              {/* Notas del Estudiante */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reporte de Actividades del Monitor:
                </label>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 italic">
                  {selectedAsistencia.notas_estudiante || 'Sin comentarios registrados por el monitor.'}
                </div>
              </div>

              {/* Modo Rechazo o Modo Normal */}
              {isRejectMode ? (
                <div className="space-y-2 p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
                  <label className="block font-bold text-[#8F141B]">
                    Motivo formal de rechazo de la jornada *
                  </label>
                  <textarea
                    rows={2}
                    value={motivoRechazo}
                    onChange={(e) => setMotivoRechazo(e.target.value)}
                    placeholder="Indica el motivo por el cual no se convalidan estas horas (ej: evidencia fotográfica Timemark no auténtica o discrepancia en horarios)..."
                    className="w-full p-2.5 bg-white border border-rose-300 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-[#8F141B]"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsRejectMode(false)}
                      className="px-3 py-1.5 text-xs border border-rose-300 text-rose-800 rounded bg-white hover:bg-rose-100 cursor-pointer"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-[#8F141B] hover:bg-[#751016] rounded cursor-pointer shadow-sm"
                    >
                      Confirmar Rechazo
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Notas de Convalidación de Horas
                  </label>
                  <input
                    type="text"
                    value={notasCoordinador}
                    onChange={(e) => setNotasCoordinador(e.target.value)}
                    placeholder="Ej. Turno verificado y convalidado conforme a la programación de los laboratorios."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:bg-white focus:border-[#003561]"
                  />
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border-t border-slate-200 sticky bottom-0 z-10">
              {!isRejectMode && (
                <button
                  type="button"
                  onClick={() => setIsRejectMode(true)}
                  className="px-3 py-1.5 text-xs text-[#8F141B] hover:bg-[#8F141B]/10 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 border border-[#8F141B]/30"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>Rechazar Jornada</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setSelectedAsistencia(null)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cerrar
                </button>

                {!isRejectMode && (
                  <>
                    <button
                      type="button"
                      onClick={handleObserve}
                      className="px-3 py-1.5 bg-[#4D626C] hover:bg-[#3d4f57] text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Guardar Observación
                    </button>
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={!evidenciasCompletas(selectedAsistencia)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors ${
                        evidenciasCompletas(selectedAsistencia)
                          ? 'bg-[#8F141B] hover:bg-[#751016] text-white cursor-pointer'
                          : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      }`}
                      title={
                        evidenciasCompletas(selectedAsistencia)
                          ? 'Aprobar jornada y convalidar horas hacia la meta de cumplimiento'
                          : 'No es posible convalidar porque faltan evidencias obligatorias'
                      }
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Convalidar Horas ({selectedAsistencia.horas_calculadas} hrs)</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Zoom de Fotografía Original */}
      {zoomPhotoUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 rounded-xl max-w-4xl max-h-[90vh] w-full overflow-hidden flex flex-col border border-white/20">
            <div className="p-3 bg-black/60 flex items-center justify-between text-white border-b border-white/10">
              <span className="text-xs font-medium truncate">{zoomPhotoUrl.titulo}</span>
              <button
                type="button"
                onClick={() => setZoomPhotoUrl(null)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex-1 overflow-auto flex items-center justify-center bg-black/90">
              <img 
                src={zoomPhotoUrl.url} 
                alt="Fotografía original ampliada" 
                className="max-h-[75vh] w-auto object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
