import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Novedad, TipoNovedad } from '../types/database';
import { 
  AlertCircle, 
  PlusCircle, 
  Search, 
  CheckCircle2, 
  X, 
  MessageSquare, 
  ThumbsUp,
  ThumbsDown,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';

export const NovedadesView: React.FC = () => {
  const { novedades, currentRole, currentMonitorData, currentUser, crearNovedad, resolverNovedad } = useApp();

  const isMonitor = currentRole === 'monitor';
  const myMonitorId = currentMonitorData?.id || currentUser?.monitor_id;

  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Modales
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedNovedad, setSelectedNovedad] = useState<Novedad | null>(null);

  // Formulario nueva novedad
  const [nuevaNovedad, setNuevaNovedad] = useState<{
    tipo: TipoNovedad;
    titulo: string;
    descripcion: string;
    fecha_incidencia: string;
    horas_solicitadas: number;
  }>({
    tipo: 'olvido_salida',
    titulo: '',
    descripcion: '',
    fecha_incidencia: new Date().toISOString().split('T')[0],
    horas_solicitadas: 4.0,
  });

  // Resolución
  const [respuestaResolucion, setRespuestaResolucion] = useState('');

  const handleCrearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    crearNovedad({
      tipo: nuevaNovedad.tipo,
      titulo: nuevaNovedad.titulo,
      descripcion: nuevaNovedad.descripcion,
      fecha_incidencia: nuevaNovedad.fecha_incidencia,
      horas_solicitadas: Number(nuevaNovedad.horas_solicitadas),
    });
    setIsNewModalOpen(false);
    setNuevaNovedad({
      tipo: 'olvido_salida',
      titulo: '',
      descripcion: '',
      fecha_incidencia: new Date().toISOString().split('T')[0],
      horas_solicitadas: 4.0,
    });
  };

  const handleResolver = (estado: 'aprobada' | 'rechazada') => {
    if (!selectedNovedad) return;
    resolverNovedad(
      selectedNovedad.id, 
      estado, 
      respuestaResolucion || (estado === 'aprobada' ? 'Aprobado formalmente por coordinación de laboratorios.' : 'Rechazado tras revisión técnica.')
    );
    setSelectedNovedad(null);
    setRespuestaResolucion('');
  };

  // Restricción por rol: El monitor solo ve sus novedades radicadas
  const baseNovedades = isMonitor
    ? novedades.filter(n => n.monitor_id === myMonitorId)
    : novedades;

  const filteredNovedades = baseNovedades.filter((n) => {
    const matchSearch = 
      n.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (!isMonitor && (n.monitor_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()));

    const matchEstado = filterEstado === 'todos' || n.estado === filterEstado;
    const matchTipo = filterTipo === 'todos' || n.tipo === filterTipo;

    return matchSearch && matchEstado && matchTipo;
  });

  const getTipoLabel = (tipo: TipoNovedad) => {
    switch (tipo) {
      case 'olvido_salida':
        return 'Olvido de Registro de Salida';
      case 'cambio_turno':
        return 'Solicitud de Cambio de Turno';
      case 'justificacion_inasistencia':
        return 'Justificación Médica / Académica';
      case 'dano_equipo':
        return 'Reporte de Daño en Equipo';
      case 'otro':
        return 'Otra Novedad Especial';
      default:
        return tipo;
    }
  };

  const totalPendientes = baseNovedades.filter(n => n.estado === 'pendiente').length;

  return (
    <div className="space-y-6">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#003561]">
            <span>Facultad de Economía y Administración</span>
            <span>·</span>
            <span>{isMonitor ? 'Portal del Monitor' : 'Mesa de Ayuda y Correcciones'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            {isMonitor ? 'Mis Novedades y Solicitudes' : 'Panel de Novedades y Solicitudes de Corrección'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {isMonitor
              ? 'Seguimiento a tus solicitudes individuales de ajuste, justificaciones médicas y novedades radicadas.'
              : 'Gestión y resolución de solicitudes de ajuste de horarios, justificaciones médicas y reportes de laboratorios.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isMonitor && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-[#003561]/5 border border-[#003561]/20 rounded-lg text-xs font-semibold text-[#003561]">
              <UserCheck className="w-4 h-4 text-[#003561]" />
              <span>{baseNovedades.length} radicadas ({totalPendientes} pendientes)</span>
            </div>
          )}

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#8F141B] hover:bg-[#721015] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Radicar Nueva Novedad</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-[#4D626C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isMonitor ? "Buscar en mis solicitudes..." : "Buscar por asunto, monitor o detalle..."}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:bg-white focus:border-[#003561]"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none cursor-pointer"
          >
            <option value="todos">Todos los Tipos de Novedad</option>
            <option value="olvido_salida">Olvido de Registro de Salida</option>
            <option value="cambio_turno">Cambio de Turno</option>
            <option value="justificacion_inasistencia">Justificación de Inasistencia</option>
            <option value="dano_equipo">Daño o Avería en Computador</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none cursor-pointer"
          >
            <option value="todos">Todos los Estados</option>
            <option value="pendiente">Pendientes de Respuesta</option>
            <option value="aprobada">Aprobadas / Resueltas</option>
            <option value="rechazada">Rechazadas</option>
          </select>
        </div>
      </div>

      {/* List of Novedades */}
      <div className="space-y-3">
        {filteredNovedades.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-xs text-slate-500 shadow-xs">
            <CheckCircle2 className="w-8 h-8 text-[#003561] mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-slate-800 text-sm">
              {isMonitor ? 'No tienes novedades radicadas' : 'No hay novedades registradas'}
            </p>
            <p className="mt-1">
              {isMonitor
                ? 'No se encontraron solicitudes asociadas a tu perfil de monitor con los filtros aplicados.'
                : 'No se encontraron solicitudes con los filtros aplicados.'}
            </p>
          </div>
        ) : (
          filteredNovedades.map((novedad) => (
            <div
              key={novedad.id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#003561] bg-[#003561]/10 px-2 py-0.5 rounded border border-[#003561]/20">
                    {getTipoLabel(novedad.tipo)}
                  </span>
                  <StatusBadge type="novedad" value={novedad.estado} />
                  <span className="text-[11px] text-[#4D626C] font-mono">
                    Fecha del suceso: {novedad.fecha_incidencia}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900">
                  {novedad.titulo}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                  {novedad.descripcion}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-[#4D626C] pt-1">
                  {!isMonitor && (
                    <span>Monitor: <strong className="text-slate-800">{novedad.monitor_nombre}</strong></span>
                  )}
                  {novedad.horas_solicitadas && (
                    <span>Horas solicitadas: <strong className="text-[#003561] font-mono">+{novedad.horas_solicitadas} hrs</strong></span>
                  )}
                </div>

                {novedad.respuesta_coordinador && (
                  <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <p className="font-semibold text-slate-800 text-[11px]">Respuesta de Coordinación:</p>
                    <p className="text-slate-600 text-[11px] mt-0.5">{novedad.respuesta_coordinador}</p>
                  </div>
                )}
              </div>

              <div className="shrink-0 flex items-center gap-2 self-start sm:self-center">
                {currentRole === 'admin' && novedad.estado === 'pendiente' && (
                  <button
                    onClick={() => {
                      setSelectedNovedad(novedad);
                      setRespuestaResolucion('');
                    }}
                    className="px-3 py-1.5 bg-[#8F141B] hover:bg-[#721015] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Dar Respuesta</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedNovedad(novedad);
                    setRespuestaResolucion(novedad.respuesta_coordinador || '');
                  }}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  Detalles
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Radicar Nueva Novedad */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#8F141B]/10 rounded-lg text-[#8F141B]">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Radicar Solicitud o Novedad
                  </h3>
                  <p className="text-xs text-slate-500">Mesa de ayuda de laboratorios FEA</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Novedad *</label>
                <select
                  value={nuevaNovedad.tipo}
                  onChange={(e) => setNuevaNovedad({ ...nuevaNovedad, tipo: e.target.value as TipoNovedad })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none cursor-pointer"
                >
                  <option value="olvido_salida">Olvido de Registro de Salida</option>
                  <option value="cambio_turno">Cambio de Turno entre Monitores</option>
                  <option value="justificacion_inasistencia">Justificación de Inasistencia (Médica / Académica)</option>
                  <option value="dano_equipo">Reporte de Daño en Equipo de Cómputo</option>
                  <option value="otro">Otro Asunto Administrativo</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título Breve / Asunto *</label>
                <input
                  type="text"
                  required
                  value={nuevaNovedad.titulo}
                  onChange={(e) => setNuevaNovedad({ ...nuevaNovedad, titulo: e.target.value })}
                  placeholder="Ej. Olvido de registro de salida por corte de luz"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-[#003561]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha de la Incidencia *</label>
                  <input
                    type="date"
                    required
                    value={nuevaNovedad.fecha_incidencia}
                    onChange={(e) => setNuevaNovedad({ ...nuevaNovedad, fecha_incidencia: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-[#003561]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Horas en Disputa</label>
                  <input
                    type="number"
                    step="0.5"
                    value={nuevaNovedad.horas_solicitadas}
                    onChange={(e) => setNuevaNovedad({ ...nuevaNovedad, horas_solicitadas: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none font-mono focus:border-[#003561]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción Detallada y Justificación *</label>
                <textarea
                  rows={4}
                  required
                  value={nuevaNovedad.descripcion}
                  onChange={(e) => setNuevaNovedad({ ...nuevaNovedad, descripcion: e.target.value })}
                  placeholder="Explica detalladamente la situación y los soportes que acreditan el turno..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none resize-none focus:border-[#003561]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#8F141B] hover:bg-[#721015] text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Radicar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ver Detalles y Resolver Novedad */}
      {selectedNovedad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedNovedad.titulo}
                </h3>
                <p className="text-xs text-[#4D626C]">
                  {!isMonitor ? `Solicitante: ${selectedNovedad.monitor_nombre} · ` : ''}{selectedNovedad.fecha_incidencia}
                </p>
              </div>
              <button
                onClick={() => setSelectedNovedad(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Tipo: {getTipoLabel(selectedNovedad.tipo)}</span>
                  <StatusBadge type="novedad" value={selectedNovedad.estado} />
                </div>
                <p className="text-slate-600 leading-relaxed italic">
                  "{selectedNovedad.descripcion}"
                </p>
                {selectedNovedad.horas_solicitadas && (
                  <p className="text-[11px] font-bold text-[#003561]">
                    Ajuste solicitado: +{selectedNovedad.horas_solicitadas} horas
                  </p>
                )}
              </div>

              {currentRole === 'admin' && selectedNovedad.estado === 'pendiente' ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Respuesta Oficial del Coordinador *
                  </label>
                  <textarea
                    rows={3}
                    value={respuestaResolucion}
                    onChange={(e) => setRespuestaResolucion(e.target.value)}
                    placeholder="Escribe la respuesta formal para el estudiante..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none resize-none focus:border-[#003561]"
                  />
                </div>
              ) : selectedNovedad.respuesta_coordinador ? (
                <div>
                  <span className="font-semibold text-slate-800 block mb-1">Respuesta Registrada:</span>
                  <div className="p-3 bg-[#003561]/5 border border-[#003561]/20 rounded text-slate-700">
                    {selectedNovedad.respuesta_coordinador}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 p-4 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedNovedad(null)}
                className="px-4 py-1.5 border border-slate-300 rounded text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Cerrar
              </button>

              {currentRole === 'admin' && selectedNovedad.estado === 'pendiente' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleResolver('rechazada')}
                    className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>Rechazar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolver('aprobada')}
                    className="px-3 py-1.5 bg-[#003561] hover:bg-[#002747] text-white rounded text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Aprobar Solicitud</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
