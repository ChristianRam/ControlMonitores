import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Laboratorio, EstadoLaboratorio } from '../types/database';
import { 
  MonitorPlay, 
  Settings2, 
  X,
  AlertCircle,
  Building,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';

export const LaboratoriosView: React.FC = () => {
  const { 
    laboratorios, 
    laboratoriosLoading, 
    laboratoriosError, 
    monitores, 
    fetchLaboratorios, 
    actualizarLaboratorio, 
    currentRole, 
    setActiveTab 
  } = useApp();

  const [selectedLab, setSelectedLab] = useState<Laboratorio | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<EstadoLaboratorio>('disponible');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Consultar directamente public.laboratorios al entrar al módulo
  useEffect(() => {
    if (currentRole === 'admin') {
      void fetchLaboratorios();
    }
  }, [currentRole, fetchLaboratorios]);

  // Restricción de acceso estricta para coordinadores
  if (currentRole !== 'admin') {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3 max-w-lg mx-auto my-12 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-red-50 text-[#8F141B] flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Acceso Restringido a Coordinadores</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          La consulta y gestión de salas está reservada exclusivamente para la Coordinación de Salas de la Facultad. Los monitores no tienen permisos para acceder ni modificar esta información.
        </p>
        <button
          onClick={() => setActiveTab('monitor_dashboard')}
          className="px-4 py-2 bg-[#8F141B] text-white text-xs font-semibold rounded-lg hover:bg-[#751016] transition-colors cursor-pointer"
        >
          Ir a Mi Turno
        </button>
      </div>
    );
  }

  const handleOpenEdit = (lab: Laboratorio) => {
    setSelectedLab(lab);
    setSaveError(null);
    setEstadoSeleccionado(lab.estado);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLab) return;

    setIsSaving(true);
    setSaveError(null);

    const result = await actualizarLaboratorio(selectedLab.id, estadoSeleccionado);

    setIsSaving(false);

    if (!result.ok) {
      setSaveError(result.error || 'No se pudo actualizar el estado de la sala en Supabase.');
      return;
    }

    setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8F141B]">
            <Building className="w-4 h-4 text-[#8F141B]" />
            <span>Facultad de Economía y Administración</span>
            <span className="text-[#4D626C]">·</span>
            <span className="text-[#4D626C]">Coordinación de Salas</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Salas
          </h1>
          <p className="text-xs sm:text-sm text-[#4D626C] mt-0.5">
            Supervisión de disponibilidad y monitor asignado en las seis salas oficiales.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="flex items-center gap-2 text-xs bg-[#faf8ef] border border-[#DFD4A6] px-3 py-2 rounded-lg text-[#6E6130] font-semibold">
            <MonitorPlay className="w-4 h-4 text-[#8F141B]" />
            <span>
              {laboratoriosLoading ? 'Consultando...' : `${laboratorios.length} Salas Registradas`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void fetchLaboratorios()}
            disabled={laboratoriosLoading}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#8F141B] rounded-lg text-[#4D626C] hover:text-[#8F141B] transition-colors cursor-pointer disabled:opacity-50"
            title="Recargar salas desde Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${laboratoriosLoading ? 'animate-spin text-[#8F141B]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Estado de Carga */}
      {laboratoriosLoading && laboratorios.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 flex flex-col items-center justify-center text-center gap-3 shadow-xs">
          <Loader2 className="w-7 h-7 text-[#8F141B] animate-spin" />
          <div>
            <p className="text-sm font-bold text-slate-900">Cargando salas desde Supabase...</p>
            <p className="text-xs text-[#4D626C] mt-0.5">
              Consultando los registros oficiales en <span className="font-mono">public.laboratorios</span>.
            </p>
          </div>
        </div>
      ) : laboratoriosError ? (
        /* Estado de Error */
        <div
          role="alert"
          className="bg-rose-50 border border-rose-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#8F141B] shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h2 className="text-sm font-bold text-[#8F141B]">
                Error al consultar las salas en Supabase
              </h2>
              <p className="text-rose-800 leading-relaxed">
                {laboratoriosError}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void fetchLaboratorios()}
            className="px-4 py-2 bg-[#8F141B] hover:bg-[#751016] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 self-start sm:self-center"
          >
            Reintentar
          </button>
        </div>
      ) : laboratorios.length === 0 ? (
        /* Estado de Ausencia de Registros */
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-3 shadow-xs">
          <div className="w-11 h-11 rounded-full bg-[#faf8ef] border border-[#DFD4A6] text-[#8F141B] flex items-center justify-center mx-auto">
            <MonitorPlay className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              No hay salas disponibles para mostrar
            </h2>
            <p className="text-xs text-[#4D626C] mt-1 max-w-md mx-auto">
              La consulta a <span className="font-mono">public.laboratorios</span> no devolvió registros para las salas configuradas (SALA-01 a SALA-06).
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchLaboratorios()}
            className="px-4 py-2 bg-[#8F141B] hover:bg-[#751016] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Volver a consultar
          </button>
        </div>
      ) : (
        /* Grid of Laboratories (solo nombre, código, estado y monitor asignado) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {laboratorios.map((lab) => {
            const monitorActual = monitores.find(
              (m) => m.id === lab.monitor_actual_id || (m.user_id && m.user_id === lab.monitor_actual_id)
            );

            return (
              <div
                key={lab.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-shadow p-5 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {lab.codigo}
                      </span>
                      <StatusBadge type="laboratorio" value={lab.estado} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-2.5">
                      {lab.nombre}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(lab)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Cambiar estado de la sala"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Monitor asignado + acción de estado */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {monitorActual ? (
                    <div className="flex items-center gap-2.5 text-xs min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#8F141B] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        {monitorActual.nombres[0]}{monitorActual.apellidos[0]}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-[#8F141B] font-bold block leading-none uppercase tracking-wider">
                          MONITOR EN SALA
                        </span>
                        <p className="font-bold text-slate-900 text-xs mt-0.5 truncate">
                          {monitorActual.nombres} {monitorActual.apellidos}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                      <span>Sin monitor asignado</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleOpenEdit(lab)}
                    className="text-xs font-semibold text-[#8F141B] hover:text-[#751016] cursor-pointer shrink-0"
                  >
                    Cambiar estado
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal (solo actualización de estado persistente en Supabase) */}
      {isEditModalOpen && selectedLab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Editar {selectedLab.nombre}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedLab.codigo}</p>
              </div>
              <button
                onClick={() => !isSaving && setIsEditModalOpen(false)}
                disabled={isSaving}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => void handleSaveEdit(e)} className="p-5 space-y-4 text-xs">
              {saveError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#8F141B] shrink-0 mt-0.5" />
                  <span>{saveError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Estado de la Sala
                </label>
                <select
                  value={estadoSeleccionado}
                  onChange={(e) => setEstadoSeleccionado(e.target.value as EstadoLaboratorio)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-[#8F141B] font-medium"
                >
                  <option value="disponible">Disponible</option>
                  <option value="en_uso">En uso</option>
                  <option value="mantenimiento">Mantenimiento</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#8F141B] hover:bg-[#751016] text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center gap-1.5"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
