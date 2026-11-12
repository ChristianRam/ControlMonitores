import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  Clock, 
  AlertCircle, 
  CalendarCheck2, 
  MonitorPlay, 
  ArrowUpRight, 
  CheckCircle2, 
  Activity,
  Layers,
  ChevronRight,
  TrendingUp,
  Building,
  ShieldCheck,
  Camera,
  Target
} from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfigurarMetaModal } from '../components/modals/ConfigurarMetaModal';

export const AdminDashboardView: React.FC = () => {
  const { 
    monitores, 
    laboratorios, 
    asistencias, 
    novedades, 
    periodo,
    setActiveTab, 
    aprobarAsistencia,
    metaGeneralHoras 
  } = useApp();

  const [isConfigMetaOpen, setIsConfigMetaOpen] = React.useState(false);

  // Cálculos estadísticos
  const totalMonitores = monitores.length;
  const monitoresActivos = monitores.filter(m => m.estado === 'activo' || m.estado === 'en_turno').length;
  const monitoresEnTurno = monitores.filter(m => m.estado === 'en_turno').length;

  const totalHorasAprobadas = monitores.reduce((acc, m) => acc + m.horas_aprobadas, 0);
  const totalHorasMeta = monitores.reduce((acc, m) => acc + m.horas_asignadas, 0);
  const porcentajeCumplimientoGlobal = Math.round((totalHorasAprobadas / (totalHorasMeta || 1)) * 100);

  const jornadasPendientes = asistencias.filter(a => a.estado === 'pendiente_validacion');
  const novedadesAbiertas = novedades.filter(n => n.estado === 'pendiente');

  const laboratoriosEnUso = laboratorios.filter(l => l.estado === 'en_uso').length;
  const totalLaboratorios = laboratorios.length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Academic Context */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#003561]">
            <span>Facultad de Economía y Administración</span>
            <span className="text-[#DFD4A6]">·</span>
            <span className="font-mono text-[#8F141B]">{periodo.nombre}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Panel de Coordinación de Laboratorios
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Supervisión institucional de salas, verificación de evidencias Timemark y control de horas de monitoría.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={() => setIsConfigMetaOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-[#003561] border border-slate-300 hover:border-[#003561] text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Configurar meta general de horas de cumplimiento"
          >
            <Target className="w-4 h-4 text-[#003561]" />
            <span>Meta: {metaGeneralHoras} hrs</span>
          </button>
          <button
            onClick={() => setActiveTab('asistencia')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#8F141B] hover:bg-[#751016] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <CalendarCheck2 className="w-4 h-4" />
            <span>Validar Jornadas Timemark ({jornadasPendientes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('reportes')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-[#003561] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <span>Generar Reporte</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 4 Metric KPI Cards with Institutional Palette */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Monitores */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[#4D626C]">
            <span className="text-xs font-bold uppercase tracking-wider">Monitores Activos</span>
            <div className="p-2 bg-[#003561]/10 rounded-lg text-[#003561]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {monitoresActivos}
            </span>
            <span className="text-xs text-slate-500 font-normal">
              de {totalMonitores} asignados
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1 text-[#003561] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#8F141B] inline-block" />
              {monitoresEnTurno} en turno ahora
            </span>
            <button 
              onClick={() => setActiveTab('monitores')} 
              className="text-[#4D626C] hover:text-[#003561] text-[11px] font-medium"
            >
              Ver nómina
            </button>
          </div>
        </div>

        {/* KPI 2: Horas Convalidadas */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[#4D626C]">
            <span className="text-xs font-bold uppercase tracking-wider">Horas Convalidadas</span>
            <div className="p-2 bg-[#003561]/10 rounded-lg text-[#003561]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {totalHorasAprobadas.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 font-normal">
              / {totalHorasMeta} hrs meta
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-slate-600">
              <TrendingUp className="w-3.5 h-3.5 text-[#003561]" />
              <span>Avance global {porcentajeCumplimientoGlobal}%</span>
            </div>
            <button 
              onClick={() => setActiveTab('reportes')} 
              className="text-[#4D626C] hover:text-[#003561] text-[11px] font-medium"
            >
              Consolidado
            </button>
          </div>
        </div>

        {/* KPI 3: Jornadas por Validar */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[#4D626C]">
            <span className="text-xs font-bold uppercase tracking-wider">Jornadas Timemark</span>
            <div className={`p-2 rounded-lg ${jornadasPendientes.length > 0 ? 'bg-[#DFD4A6]/30 text-[#7a6e3e]' : 'bg-slate-100 text-slate-700'}`}>
              <CalendarCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono tabular-nums ${jornadasPendientes.length > 0 ? 'text-[#8F141B]' : 'text-slate-900'}`}>
              {jornadasPendientes.length}
            </span>
            <span className="text-xs text-slate-500 font-normal">
              por verificar
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Control de asistencia</span>
            <button 
              onClick={() => setActiveTab('asistencia')} 
              className="text-[#003561] hover:text-[#8F141B] font-semibold text-[11px]"
            >
              Revisar todas
            </button>
          </div>
        </div>

        {/* KPI 4: Novedades / Incidencias */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[#4D626C]">
            <span className="text-xs font-bold uppercase tracking-wider">Novedades Abiertas</span>
            <div className={`p-2 rounded-lg ${novedadesAbiertas.length > 0 ? 'bg-[#8F141B]/10 text-[#8F141B]' : 'bg-slate-100 text-slate-700'}`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono tabular-nums ${novedadesAbiertas.length > 0 ? 'text-[#8F141B]' : 'text-slate-900'}`}>
              {novedadesAbiertas.length}
            </span>
            <span className="text-xs text-slate-500 font-normal">
              solicitudes pendientes
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Ajustes y correcciones</span>
            <button 
              onClick={() => setActiveTab('novedades')} 
              className="text-[#003561] hover:text-[#8F141B] font-semibold text-[11px]"
            >
              Gestionar
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Laboratory Status & Pending Validation Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Estado de Salas y Laboratorios en Vivo */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <MonitorPlay className="w-4 h-4 text-[#003561]" />
                <span>Estado de Salas y Laboratorios en Vivo</span>
              </h2>
              <p className="text-xs text-[#4D626C] mt-0.5">
                {laboratoriosEnUso} de {totalLaboratorios} salas con servicio activo en la Facultad
              </p>
            </div>
            <button
              onClick={() => setActiveTab('laboratorios')}
              className="text-xs font-semibold text-[#003561] hover:text-[#8F141B] flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todas</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {laboratorios.map((lab) => {
              const monitorAsignado = monitores.find(m => m.id === lab.monitor_actual_id);

              return (
                <div
                  key={lab.id}
                  className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">{lab.nombre}</span>
                      <span className="font-mono text-[11px] text-[#4D626C] bg-white border border-slate-200 px-1.5 py-0.2 rounded font-bold">
                        {lab.codigo}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{lab.ubicacion}</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{lab.equipos_operativos}/{lab.capacidad_equipos} PCs funcionales</span>
                    </div>
                    {monitorAsignado ? (
                      <div className="text-xs text-[#003561] font-semibold flex items-center gap-1.5 pt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8F141B] animate-pulse" />
                        <span>Monitor en turno: {monitorAsignado.nombres} {monitorAsignado.apellidos}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">Sin monitor en turno en este momento</p>
                    )}
                  </div>

                  <div className="shrink-0 self-start sm:self-center">
                    <StatusBadge type="laboratorio" value={lab.estado} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (5 cols): Jornadas Pendientes de Aprobación Inmediata con Timemark */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <CalendarCheck2 className="w-4 h-4 text-[#8F141B]" />
                <span>Jornadas por Validar</span>
              </h2>
              <p className="text-xs text-[#4D626C] mt-0.5">
                Revisión de evidencias Timemark y horas registradas
              </p>
            </div>
            <button
              onClick={() => setActiveTab('asistencia')}
              className="text-xs font-semibold text-[#003561] hover:text-[#8F141B] flex items-center gap-1 cursor-pointer"
            >
              <span>Ver {jornadasPendientes.length}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {jornadasPendientes.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-[#003561] mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-slate-800">¡Al día con las validaciones!</p>
              <p className="mt-0.5">No hay jornadas pendientes de revisión en este momento.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jornadasPendientes.slice(0, 4).map((jornada) => (
                <div
                  key={jornada.id}
                  className="p-3 rounded-lg border border-slate-200 bg-white hover:border-[#003561]/40 transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {jornada.monitor_nombre}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                        {jornada.laboratorio_nombre}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#003561] bg-[#003561]/10 px-2 py-0.5 rounded border border-[#003561]/25 tabular-nums">
                      +{jornada.horas_calculadas} hrs
                    </span>
                  </div>

                  {/* Timemark Badge and Photo Codes */}
                  <div className="flex items-center gap-2 text-[11px] bg-slate-50 p-1.5 rounded border border-slate-100">
                    <Camera className="w-3.5 h-3.5 text-[#003561] shrink-0" />
                    <div className="flex-1 truncate">
                      <span className="text-slate-500">Timemark Entrada: </span>
                      <span className="font-mono font-bold text-slate-800">{jornada.timemark_entrada_codigo || 'Sin código'}</span>
                    </div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                      jornada.timemark_entrada_resultado === 'Auténtico'
                        ? 'bg-[#003561]/10 text-[#003561]'
                        : 'bg-[#DFD4A6]/30 text-[#7a6e3e]'
                    }`}>
                      {jornada.timemark_entrada_resultado || 'Pendiente'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 flex items-center justify-between">
                    <span>Fecha: {jornada.fecha}</span>
                    <span className="font-mono">{jornada.hora_entrada} - {jornada.hora_salida}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setActiveTab('asistencia')}
                      className="px-2.5 py-1 text-xs font-medium text-[#003561] hover:underline cursor-pointer"
                    >
                      Verificar Timemark
                    </button>
                    <button
                      onClick={() => aprobarAsistencia(jornada.id)}
                      className="px-3 py-1 text-xs font-semibold bg-[#8F141B] hover:bg-[#751016] text-white rounded transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Convalidar Horas</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Bottom Table: Novedades e Incidencias Recientes */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#8F141B]" />
              <span>Novedades y Solicitudes de Corrección Recientes</span>
            </h2>
            <p className="text-xs text-[#4D626C] mt-0.5">
              Peticiones de monitores por cambio de horario, olvido de marcación o fallos técnicos
            </p>
          </div>
          <button
            onClick={() => setActiveTab('novedades')}
            className="text-xs font-semibold text-[#003561] hover:text-[#8F141B] flex items-center gap-1 cursor-pointer"
          >
            <span>Ir al panel de novedades</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f7f8] text-[#4D626C] uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Monitor</th>
                <th className="py-2.5 px-3">Asunto / Solicitud</th>
                <th className="py-2.5 px-3">Fecha Suceso</th>
                <th className="py-2.5 px-3">Horas en Disputa</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {novedades.slice(0, 4).map((nov) => (
                <tr key={nov.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    {nov.monitor_nombre}
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-800">{nov.titulo}</p>
                    <p className="text-[11px] text-slate-500 truncate max-w-sm">{nov.descripcion}</p>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">
                    {nov.fecha_incidencia}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">
                    {nov.horas_solicitadas ? `${nov.horas_solicitadas} hrs` : 'N/A'}
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge type="novedad" value={nov.estado} />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => setActiveTab('novedades')}
                      className="text-xs font-semibold text-[#003561] hover:text-[#8F141B] cursor-pointer"
                    >
                      Revisar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Configuración de Meta General de Cumplimiento */}
      <ConfigurarMetaModal
        isOpen={isConfigMetaOpen}
        onClose={() => setIsConfigMetaOpen(false)}
      />
    </div>
  );
};
