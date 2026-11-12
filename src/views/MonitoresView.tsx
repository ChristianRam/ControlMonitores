import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Monitor, ProgramaAcademico, EstadoMonitor } from '../types/database';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  GraduationCap, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  X,
  ExternalLink,
  BookOpen,
  ArrowUpRight,
  Target
} from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfigurarMetaModal } from '../components/modals/ConfigurarMetaModal';

export const MonitoresView: React.FC = () => {
  const { monitores, laboratorios, asistencias, agregarMonitor, actualizarMonitor, metaGeneralHoras } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPrograma, setFilterPrograma] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  
  // Modales
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isConfigMetaOpen, setIsConfigMetaOpen] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);

  // Formulario nuevo monitor
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    codigo_estudiantil: '',
    correo_institucional: '',
    programa_academico: 'Economía' as ProgramaAcademico,
    semestre: 6,
    horas_asignadas: metaGeneralHoras,
    estado: 'activo' as EstadoMonitor,
    telefono: '',
    laboratorio_habitual_id: 'lab-01',
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    agregarMonitor({
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      codigo_estudiantil: formData.codigo_estudiantil,
      correo_institucional: formData.correo_institucional,
      programa_academico: formData.programa_academico,
      semestre: Number(formData.semestre),
      horas_asignadas: Number(formData.horas_asignadas),
      estado: formData.estado,
      telefono: formData.telefono,
      laboratorio_habitual_id: formData.laboratorio_habitual_id,
    });
    setIsNewModalOpen(false);
    setFormData({
      nombres: '',
      apellidos: '',
      codigo_estudiantil: '',
      correo_institucional: '',
      programa_academico: 'Economía',
      semestre: 6,
      horas_asignadas: metaGeneralHoras,
      estado: 'activo',
      telefono: '',
      laboratorio_habitual_id: 'lab-01',
    });
  };

  // Filtrado de monitores
  const filteredMonitores = monitores.filter((m) => {
    const matchSearch = 
      m.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.codigo_estudiantil.includes(searchTerm) ||
      m.correo_institucional.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchPrograma = filterPrograma === 'todos' || m.programa_academico === filterPrograma;
    const matchEstado = filterEstado === 'todos' || m.estado === filterEstado;

    return matchSearch && matchPrograma && matchEstado;
  });

  return (
    <div className="space-y-6">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#003561]">
            <span>Facultad de Economía y Administración</span>
            <span className="text-[#DFD4A6]">·</span>
            <span>Gestión de Estudiantes</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Nómina de Monitores de Laboratorio
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Registro, asignación de turnos y seguimiento individual de horas de cumplimiento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsConfigMetaOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-[#003561] border border-slate-300 hover:border-[#003561] text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Configurar meta general de cumplimiento de horas"
          >
            <Target className="w-4 h-4 text-[#003561]" />
            <span>Meta: {metaGeneralHoras} hrs</span>
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#8F141B] hover:bg-[#751016] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Vincular Nuevo Monitor</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Search */}
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, código o correo..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#003561]/20 focus:border-[#003561] outline-none text-slate-900"
          />
        </div>

        {/* Filter Programa */}
        <div className="sm:col-span-4">
          <select
            value={filterPrograma}
            onChange={(e) => setFilterPrograma(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:border-[#003561] outline-none cursor-pointer"
          >
            <option value="todos">Todos los Programas Académicos</option>
            <option value="Economía">Economía</option>
            <option value="Contaduría Pública">Contaduría Pública</option>
            <option value="Administración de Empresas">Administración de Empresas</option>
          </select>
        </div>

        {/* Filter Estado */}
        <div className="sm:col-span-3">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:border-[#003561] outline-none cursor-pointer"
          >
            <option value="todos">Todos los Estados</option>
            <option value="en_turno">En Turno Ahora</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo / Completado</option>
          </select>
        </div>
      </div>

      {/* Monitores Table / Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Monitor / Código</th>
                <th className="py-3 px-4">Programa & Semestre</th>
                <th className="py-3 px-4">Laboratorio Habitual</th>
                <th className="py-3 px-4">Horas / Cumplimiento</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredMonitores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No se encontraron monitores con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredMonitores.map((monitor) => {
                  const lab = laboratorios.find(l => l.id === monitor.laboratorio_habitual_id);
                  const porcentaje = Math.min(100, Math.round((monitor.horas_aprobadas / (monitor.horas_asignadas || 1)) * 100));

                  return (
                    <tr key={monitor.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#003561] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {monitor.nombres[0]}{monitor.apellidos[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">
                              {monitor.nombres} {monitor.apellidos}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                              <span>{monitor.codigo_estudiantil}</span>
                              <span>·</span>
                              <span className="truncate max-w-[140px] font-sans">{monitor.correo_institucional}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{monitor.programa_academico}</p>
                        <p className="text-[11px] text-[#4D626C]">Semestre {monitor.semestre}°</p>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {lab ? (
                          <span className="text-slate-800 font-medium">{lab.nombre.split('-')[1] || lab.nombre}</span>
                        ) : (
                          <span className="text-slate-400">Rotativo</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 min-w-[180px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono font-bold text-slate-900 tabular-nums">
                              {monitor.horas_aprobadas} / {monitor.horas_asignadas} hrs
                            </span>
                            <span className="font-bold text-[#003561] tabular-nums">
                              {porcentaje}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#003561] h-full rounded-full transition-all duration-300"
                              style={{ width: `${porcentaje}%` }}
                            />
                          </div>
                          {monitor.horas_pendientes > 0 && (
                            <p className="text-[10px] text-[#8F141B] font-semibold">
                              +{monitor.horas_pendientes} hrs en revisión
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge type="monitor" value={monitor.estado} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedMonitor(monitor)}
                          className="px-2.5 py-1 text-xs font-semibold text-[#003561] hover:text-[#8F141B] bg-[#003561]/5 hover:bg-[#003561]/10 rounded border border-[#003561]/20 transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Ver Ficha</span>
                          <ArrowUpRight className="w-3 h-3" />
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

      {/* Modal: Vincular Nuevo Monitor */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#003561]/10 rounded-lg text-[#003561]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Vincular Monitor de Laboratorio</h3>
                  <p className="text-xs text-slate-500">Registro de estudiante monitor de laboratorio</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    placeholder="Ej. Valentina"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#003561] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    placeholder="Ej. Rodríguez Charry"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#003561] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código Estudiantil USCO *</label>
                  <input
                    type="text"
                    required
                    value={formData.codigo_estudiantil}
                    onChange={(e) => setFormData({ ...formData, codigo_estudiantil: e.target.value })}
                    placeholder="Ej. 20221198450"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#003561] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono Móvil *</label>
                  <input
                    type="text"
                    required
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="+57 312 000 0000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#003561] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correo Institucional *</label>
                <input
                  type="email"
                  required
                  value={formData.correo_institucional}
                  onChange={(e) => setFormData({ ...formData, correo_institucional: e.target.value })}
                  placeholder="estudiante@usco.edu.co"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#003561] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Programa Académico</label>
                  <select
                    value={formData.programa_academico}
                    onChange={(e) => setFormData({ ...formData, programa_academico: e.target.value as ProgramaAcademico })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#003561] outline-none"
                  >
                    <option value="Economía">Economía</option>
                    <option value="Contaduría Pública">Contaduría Pública</option>
                    <option value="Administración de Empresas">Administración de Empresas</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Semestre Actual</label>
                  <select
                    value={formData.semestre}
                    onChange={(e) => setFormData({ ...formData, semestre: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#003561] outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                      <option key={s} value={s}>{s}° Semestre</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Meta de Cumplimiento (Horas)</label>
                  <input
                    type="number"
                    value={formData.horas_asignadas}
                    onChange={(e) => setFormData({ ...formData, horas_asignadas: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#003561] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Laboratorio Asignado</label>
                  <select
                    value={formData.laboratorio_habitual_id}
                    onChange={(e) => setFormData({ ...formData, laboratorio_habitual_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#003561] outline-none"
                  >
                    {laboratorios.map(l => (
                      <option key={l.id} value={l.id}>{l.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#8F141B] hover:bg-[#751016] text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Guardar Monitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ficha Detallada del Monitor */}
      {selectedMonitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-[#003561] text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#8F141B] text-white flex items-center justify-center font-bold text-sm">
                  {selectedMonitor.nombres[0]}{selectedMonitor.apellidos[0]}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedMonitor.nombres} {selectedMonitor.apellidos}
                  </h3>
                  <p className="text-xs text-[#DFD4A6] font-mono">
                    Código USCO: {selectedMonitor.codigo_estudiantil}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMonitor(null)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Progress Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Cumplimiento de Horas</span>
                  <span className="font-mono font-bold text-[#003561] text-sm">
                    {selectedMonitor.horas_aprobadas} / {selectedMonitor.horas_asignadas} horas
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#003561] h-full rounded-full"
                    style={{ width: `${Math.min(100, Math.round((selectedMonitor.horas_aprobadas / selectedMonitor.horas_asignadas) * 100))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Pendientes de validar: {selectedMonitor.horas_pendientes} hrs</span>
                  <span>Faltan: {Math.max(0, selectedMonitor.horas_asignadas - selectedMonitor.horas_aprobadas)} hrs para cumplimiento total</span>
                </div>
              </div>

              {/* Data fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] text-slate-500 block">Programa Académico</span>
                  <p className="font-semibold text-slate-800">{selectedMonitor.programa_academico}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Semestre Cursando</span>
                  <p className="font-semibold text-slate-800">{selectedMonitor.semestre}° Semestre</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Correo Institucional</span>
                  <p className="font-medium text-slate-800">{selectedMonitor.correo_institucional}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Teléfono de Contacto</span>
                  <p className="font-medium text-slate-800">{selectedMonitor.telefono}</p>
                </div>
              </div>

              {/* Recent sessions by this monitor */}
              <div className="pt-2">
                <h4 className="font-semibold text-slate-900 mb-2">Jornadas Registradas Recientes</h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {asistencias
                    .filter(a => a.monitor_id === selectedMonitor.id)
                    .slice(0, 4)
                    .map(a => (
                      <div key={a.id} className="p-2 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-semibold text-slate-800">{a.fecha}</span>
                          <span className="text-slate-500 ml-2 font-mono">{a.hora_entrada} - {a.hora_salida || 'En curso'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-slate-700">{a.horas_calculadas} hrs</span>
                          <StatusBadge type="asistencia" value={a.estado} />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">Ficha oficial de monitoría FEA</span>
              <button
                onClick={() => setSelectedMonitor(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Configuración de Meta General de Cumplimiento */}
      <ConfigurarMetaModal
        isOpen={isConfigMetaOpen}
        onClose={() => setIsConfigMetaOpen(false)}
      />
    </div>
  );
};
