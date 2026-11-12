import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Laboratorio, EstadoLaboratorio } from '../types/database';
import { 
  MonitorPlay, 
  Settings2, 
  X,
  AlertCircle,
  Building
} from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';

export const LaboratoriosView: React.FC = () => {
  const { laboratorios, monitores, actualizarLaboratorio, currentRole, setActiveTab } = useApp();

  const [selectedLab, setSelectedLab] = useState<Laboratorio | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Formulario para actualizar sala (solo estado y descripción requeridos por coordinación)
  const [editFormData, setEditFormData] = useState<{
    estado: EstadoLaboratorio;
    descripcion: string;
  }>({
    estado: 'disponible',
    descripcion: '',
  });

  // Restricción de acceso estricta para coordinadores
  if (currentRole !== 'admin') {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3 max-w-lg mx-auto my-12 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-red-50 text-[#8F141B] flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Acceso Restringido a Coordinadores</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          La consulta técnica y gestión de salas y laboratorios está reservada exclusivamente para la Coordinación de Laboratorios de la Facultad. Los monitores no tienen permisos para acceder ni modificar esta información.
        </p>
        <button
          onClick={() => setActiveTab('monitor_dashboard')}
          className="px-4 py-2 bg-[#003561] text-white text-xs font-semibold rounded-lg hover:bg-[#00284a] transition-colors cursor-pointer"
        >
          Ir a Mi Turno
        </button>
      </div>
    );
  }

  const handleOpenEdit = (lab: Laboratorio) => {
    setSelectedLab(lab);
    setEditFormData({
      estado: lab.estado,
      descripcion: lab.descripcion,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLab) return;

    actualizarLaboratorio({
      ...selectedLab,
      estado: editFormData.estado,
      descripcion: editFormData.descripcion,
    });

    setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#003561]">
            <Building className="w-4 h-4 text-[#DFD4A6]" />
            <span>Facultad de Economía y Administración</span>
            <span className="text-[#DFD4A6]">·</span>
            <span>Coordinación de Laboratorios</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Salas y Laboratorios
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Gestión y supervisión de disponibilidad de salas y asignación de monitores en turno.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-700 font-medium">
          <MonitorPlay className="w-4 h-4 text-[#003561]" />
          <span>
            {laboratorios.length} Salas Registradas
          </span>
        </div>
      </div>

      {/* Grid of Laboratories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {laboratorios.map((lab) => {
          const monitorActual = monitores.find(m => m.id === lab.monitor_actual_id);

          return (
            <div
              key={lab.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-shadow p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Title & Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {lab.codigo}
                      </span>
                      <StatusBadge type="laboratorio" value={lab.estado} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-2">
                      {lab.nombre}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(lab)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Editar estado y descripción de la sala"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  {lab.descripcion}
                </p>
              </div>

              {/* Bottom Monitor In-Duty Banner */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {monitorActual ? (
                  <div className="flex items-center gap-2.5 text-xs">
                    <div className="w-7 h-7 rounded-full bg-[#003561] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      {monitorActual.nombres[0]}{monitorActual.apellidos[0]}
                    </div>
                    <div>
                      <span className="text-[10px] text-[#003561] font-bold block leading-none uppercase tracking-wider">
                        MONITOR EN SALA
                      </span>
                      <p className="font-bold text-slate-900 text-xs mt-0.5">
                        {monitorActual.nombres} {monitorActual.apellidos}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <span>Sin monitor asignado en este momento</span>
                  </div>
                )}

                <button
                  onClick={() => handleOpenEdit(lab)}
                  className="text-xs font-semibold text-[#003561] hover:text-[#8F141B] cursor-pointer"
                >
                  Gestionar Sala
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal (Admin only) */}
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
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estado Operativo de la Sala</label>
                <select
                  value={editFormData.estado}
                  onChange={(e) => setEditFormData({ ...editFormData, estado: e.target.value as EstadoLaboratorio })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-[#003561] font-medium"
                >
                  <option value="disponible">Disponible</option>
                  <option value="en_uso">En Servicio Activo</option>
                  <option value="mantenimiento">En Mantenimiento</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción del Laboratorio</label>
                <textarea
                  rows={4}
                  value={editFormData.descripcion}
                  onChange={(e) => setEditFormData({ ...editFormData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-[#003561] resize-none"
                  placeholder="Descripción de la sala..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#8F141B] hover:bg-[#751016] text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
