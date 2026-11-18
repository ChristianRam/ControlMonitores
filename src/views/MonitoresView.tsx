import React, { useState, useEffect } from 'react';
import { useApp, MonitorEditPayload, NuevoMonitorPayload } from '../context/AppContext';
import { PROGRAMAS_ACADEMICOS } from '../lib/constants';
import { Monitor, ProgramaAcademico } from '../types/database';
import {
  Users,
  Search,
  X,
  ArrowUpRight,
  Target,
  AlertCircle,
  Loader2,
  RefreshCw,
  Pencil,
  Power,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Building2,
  UserPlus,
  Trash2,
  Plus,
  Minus,
} from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfigurarMetaModal } from '../components/modals/ConfigurarMetaModal';

const FORM_NUEVO_MONITOR_VACIO: NuevoMonitorPayload = {
  nombres: '',
  apellidos: '',
  codigo_estudiantil: '',
  correo_institucional: '',
  programa_academico: PROGRAMAS_ACADEMICOS[0],
  semestre: 1,
  telefono: '',
  password: '',
};

export const MonitoresView: React.FC = () => {
  const {
    monitores,
    monitoresLoading,
    monitoresError,
    fetchMonitores,
    laboratorios,
    laboratoriosLoading,
    laboratoriosError,
    asistencias,
    metaGeneralHoras,
    currentRole,
    setActiveTab,
    actualizarInfoMonitor,
    cambiarEstadoMonitor,
    actualizarHorasAsignadasMonitor,
    crearMonitor,
    eliminarMonitor,
    ajustarHorasMonitor,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPrograma, setFilterPrograma] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');

  // Modales principales y de administración (Fase 2)
  const [isConfigMetaOpen, setIsConfigMetaOpen] = useState(false);
  const [selectedMonitorId, setSelectedMonitorId] = useState<string | null>(null);

  // Modal de edición de información personal/académica + sala habitual
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null);
  const [editForm, setEditForm] = useState<MonitorEditPayload>({
    nombres: '',
    apellidos: '',
    codigo_estudiantil: '',
    correo_institucional: '',
    programa_academico: 'Economía',
    semestre: 1,
    telefono: '',
    laboratorio_habitual_id: null,
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Modal de confirmación para activar / inactivar monitor
  const [statusTarget, setStatusTarget] = useState<{
    monitor: Monitor;
    nuevoEstado: 'activo' | 'inactivo';
  } | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  // Modal de modificación individual de horas_asignadas (con paso de confirmación)
  const [horasTarget, setHorasTarget] = useState<Monitor | null>(null);
  const [horasInput, setHorasInput] = useState<string>('');
  const [horasStep, setHorasStep] = useState<'form' | 'confirm'>('form');
  const [horasError, setHorasError] = useState<string | null>(null);
  const [isSavingHoras, setIsSavingHoras] = useState(false);

  // Registrar (crear) monitor
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<NuevoMonitorPayload>(FORM_NUEVO_MONITOR_VACIO);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Eliminar monitor
  const [deleteTarget, setDeleteTarget] = useState<Monitor | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Añadir / quitar horas manualmente
  const [ajusteTarget, setAjusteTarget] = useState<Monitor | null>(null);
  const [ajusteOperacion, setAjusteOperacion] = useState<'sumar' | 'restar'>('sumar');
  const [ajusteHoras, setAjusteHoras] = useState<string>('');
  const [ajusteError, setAjusteError] = useState<string | null>(null);
  const [isAjustando, setIsAjustando] = useState(false);

  useEffect(() => {
    if (currentRole === 'admin') {
      void fetchMonitores();
    }
  }, [currentRole, fetchMonitores]);

  const selectedMonitor = selectedMonitorId
    ? monitores.find((m) => m.id === selectedMonitorId) || null
    : null;

  // Restricción de acceso estricta para coordinadores
  if (currentRole !== 'admin') {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3 max-w-lg mx-auto my-12 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-red-50 text-[#8F141B] flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Acceso Restringido a Coordinadores</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          La consulta y administración de la nómina general de monitores está reservada exclusivamente para la Coordinación de Salas de la Facultad.
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

  // Filtrado de monitores reales
  const filteredMonitores = monitores.filter((m) => {
    const query = searchTerm.toLowerCase();
    const matchSearch =
      m.nombres.toLowerCase().includes(query) ||
      m.apellidos.toLowerCase().includes(query) ||
      m.codigo_estudiantil.toLowerCase().includes(query) ||
      m.correo_institucional.toLowerCase().includes(query);

    const matchPrograma = filterPrograma === 'todos' || m.programa_academico === filterPrograma;
    const matchEstado = filterEstado === 'todos' || m.estado === filterEstado;

    return matchSearch && matchPrograma && matchEstado;
  });

  const getInitials = (m: Monitor) =>
    `${m.nombres?.[0] || 'M'}${m.apellidos?.[0] || ''}`.toUpperCase();

  // Abrir modal de edición
  const openEditModal = (monitor: Monitor) => {
    const hasOfficialLab =
      Boolean(monitor.laboratorio_habitual_id) &&
      laboratorios.some((l) => l.id === monitor.laboratorio_habitual_id);

    setEditingMonitor(monitor);
    setEditForm({
      nombres: monitor.nombres,
      apellidos: monitor.apellidos,
      codigo_estudiantil: monitor.codigo_estudiantil,
      correo_institucional: monitor.correo_institucional,
      programa_academico: monitor.programa_academico,
      semestre: monitor.semestre,
      telefono: monitor.telefono,
      laboratorio_habitual_id: hasOfficialLab ? monitor.laboratorio_habitual_id! : null,
    });
    setEditError(null);
  };

  const closeEditModal = () => {
    if (isSavingEdit) return;
    setEditingMonitor(null);
    setEditError(null);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMonitor || isSavingEdit) return;

    setEditError(null);

    const nombres = editForm.nombres.trim();
    const apellidos = editForm.apellidos.trim();
    const codigo = editForm.codigo_estudiantil.trim();
    const correo = editForm.correo_institucional.trim().toLowerCase();
    const telefono = editForm.telefono.trim();
    const semestre = Math.round(Number(editForm.semestre));

    if (!nombres || !apellidos || !codigo || !correo || !telefono) {
      setEditError('Todos los campos personales y académicos obligatorios deben estar diligenciados.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      setEditError('Ingresa un correo institucional con formato válido.');
      return;
    }

    if (!Number.isInteger(semestre) || semestre < 1 || semestre > 10) {
      setEditError('El semestre debe ser un número entero entre 1 y 10.');
      return;
    }

    const dupCodigo = monitores.some(
      (m) =>
        m.id !== editingMonitor.id &&
        m.codigo_estudiantil.trim().toLowerCase() === codigo.toLowerCase()
    );
    if (dupCodigo) {
      setEditError(`El código estudiantil "${codigo}" ya pertenece a otro monitor registrado.`);
      return;
    }

    const dupCorreo = monitores.some(
      (m) =>
        m.id !== editingMonitor.id &&
        m.correo_institucional.trim().toLowerCase() === correo
    );
    if (dupCorreo) {
      setEditError(`El correo institucional "${correo}" ya pertenece a otro monitor registrado.`);
      return;
    }

    if (
      editForm.laboratorio_habitual_id &&
      !laboratorios.some((l) => l.id === editForm.laboratorio_habitual_id)
    ) {
      setEditError('La sala habitual seleccionada no corresponde a ninguna de las salas oficiales.');
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await actualizarInfoMonitor(editingMonitor.id, {
        ...editForm,
        nombres,
        apellidos,
        codigo_estudiantil: codigo,
        correo_institucional: correo,
        semestre,
        telefono,
        laboratorio_habitual_id: editForm.laboratorio_habitual_id || null,
      });

      if (!res.ok) {
        setEditError(res.error || 'No se pudo actualizar la información del monitor en Supabase.');
        return;
      }

      setEditingMonitor(null);
      setEditError(null);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Abrir modal de confirmación de cambio de estado
  const openStatusModal = (monitor: Monitor) => {
    if (monitor.estado === 'en_turno') return;
    const nuevoEstado: 'activo' | 'inactivo' =
      monitor.estado === 'inactivo' ? 'activo' : 'inactivo';
    setStatusTarget({ monitor, nuevoEstado });
    setStatusError(null);
  };

  const closeStatusModal = () => {
    if (isSavingStatus) return;
    setStatusTarget(null);
    setStatusError(null);
  };

  const handleConfirmStatusChange = async () => {
    if (!statusTarget || isSavingStatus) return;
    setStatusError(null);
    setIsSavingStatus(true);
    try {
      const res = await cambiarEstadoMonitor(statusTarget.monitor.id, statusTarget.nuevoEstado);
      if (!res.ok) {
        setStatusError(res.error || 'No se pudo cambiar el estado del monitor en Supabase.');
        return;
      }
      setStatusTarget(null);
      setStatusError(null);
    } finally {
      setIsSavingStatus(false);
    }
  };

  // Abrir modal de modificación individual de horas_asignadas
  const openHorasModal = (monitor: Monitor) => {
    setHorasTarget(monitor);
    setHorasInput(String(monitor.horas_asignadas));
    setHorasStep('form');
    setHorasError(null);
  };

  const closeHorasModal = () => {
    if (isSavingHoras) return;
    setHorasTarget(null);
    setHorasStep('form');
    setHorasError(null);
  };

  const handleValidateHorasStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!horasTarget) return;
    setHorasError(null);

    const parsed = Number(horasInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setHorasError('Debes ingresar un valor numérico positivo mayor que cero.');
      return;
    }

    if (parsed === horasTarget.horas_asignadas) {
      setHorasError('El nuevo valor debe ser diferente a las horas asignadas actuales.');
      return;
    }

    setHorasStep('confirm');
  };

  const handleConfirmHorasSave = async () => {
    if (!horasTarget || isSavingHoras) return;
    const parsed = Number(horasInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setHorasError('Las horas asignadas deben ser mayores que cero.');
      setHorasStep('form');
      return;
    }

    setHorasError(null);
    setIsSavingHoras(true);
    try {
      const res = await actualizarHorasAsignadasMonitor(horasTarget.id, parsed);
      if (!res.ok) {
        setHorasError(res.error || 'No se pudo actualizar la meta individual en Supabase.');
        return;
      }
      setHorasTarget(null);
      setHorasStep('form');
      setHorasError(null);
    } finally {
      setIsSavingHoras(false);
    }
  };

  const closeCreateModal = () => {
    if (isCreating) return;
    setIsCreateOpen(false);
    setCreateError(null);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;
    setCreateError(null);
    setIsCreating(true);
    try {
      const res = await crearMonitor(createForm);
      if (!res.ok) {
        setCreateError(res.error || 'No se pudo registrar el monitor.');
        return;
      }
      setIsCreateOpen(false);
      setCreateForm(FORM_NUEVO_MONITOR_VACIO);
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setDeleteError(null);
    setIsDeleting(true);
    try {
      const res = await eliminarMonitor(deleteTarget.id);
      if (!res.ok) {
        setDeleteError(res.error || 'No se pudo eliminar el monitor.');
        return;
      }
      if (selectedMonitorId === deleteTarget.id) setSelectedMonitorId(null);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const openAjusteModal = (monitor: Monitor, operacion: 'sumar' | 'restar') => {
    setAjusteTarget(monitor);
    setAjusteOperacion(operacion);
    setAjusteHoras('');
    setAjusteError(null);
  };

  const handleSubmitAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ajusteTarget || isAjustando) return;
    setAjusteError(null);
    setIsAjustando(true);
    try {
      const res = await ajustarHorasMonitor(ajusteTarget.id, Number(ajusteHoras), ajusteOperacion);
      if (!res.ok) {
        setAjusteError(res.error || 'No se pudo ajustar las horas.');
        return;
      }
      setAjusteTarget(null);
    } finally {
      setIsAjustando(false);
    }
  };

  const inputCls =
    'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:bg-white focus:border-[#8F141B] disabled:opacity-60';

  return (
    <div className="space-y-6">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8F141B]">
            <span>Facultad de Economía y Administración</span>
            <span className="text-[#4D626C]">·</span>
            <span className="text-[#4D626C]">Gestión de Estudiantes</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Registro de Monitores de Salas
          </h1>
          <p className="text-xs sm:text-sm text-[#4D626C] mt-0.5">
            Administración oficial en Supabase: edición de datos, estado operativo, sala habitual y horas asignadas individuales.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="flex items-center gap-2 text-xs bg-[#faf8ef] border border-[#DFD4A6] px-3 py-2 rounded-lg text-[#6E6130] font-semibold">
            <Users className="w-4 h-4 text-[#8F141B]" />
            <span>
              {monitoresLoading ? 'Consultando...' : `${monitores.length} Monitores`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setCreateForm(FORM_NUEVO_MONITOR_VACIO);
              setCreateError(null);
              setIsCreateOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#8F141B] hover:bg-[#751016] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Monitor</span>
          </button>

          <button
            onClick={() => setIsConfigMetaOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-[#faf8ef] text-[#8F141B] border border-slate-300 hover:border-[#8F141B] text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Configurar meta general de referencia"
          >
            <Target className="w-4 h-4 text-[#8F141B]" />
            <span>Meta: {metaGeneralHoras} hrs</span>
          </button>

          <button
            type="button"
            onClick={() => void fetchMonitores()}
            disabled={monitoresLoading}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#8F141B] rounded-lg text-[#4D626C] hover:text-[#8F141B] transition-colors cursor-pointer disabled:opacity-50"
            title="Recargar monitores desde Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${monitoresLoading ? 'animate-spin text-[#8F141B]' : ''}`} />
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
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#8F141B]/20 focus:border-[#8F141B] outline-none text-slate-900"
          />
        </div>

        {/* Filter Programa */}
        <div className="sm:col-span-4">
          <select
            value={filterPrograma}
            onChange={(e) => setFilterPrograma(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:border-[#8F141B] outline-none cursor-pointer"
          >
            <option value="todos">Programas de la facultad</option>
            {PROGRAMAS_ACADEMICOS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Filter Estado */}
        <div className="sm:col-span-3">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:border-[#8F141B] outline-none cursor-pointer"
          >
            <option value="todos">Todos los Estados</option>
            <option value="en_turno">En Turno Ahora</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo / Completado</option>
          </select>
        </div>
      </div>

      {/* Estado de Carga */}
      {monitoresLoading && monitores.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 flex flex-col items-center justify-center text-center gap-3 shadow-xs">
          <Loader2 className="w-7 h-7 text-[#8F141B] animate-spin" />
          <div>
            <p className="text-sm font-bold text-slate-900">Cargando monitores desde Supabase...</p>
            <p className="text-xs text-[#4D626C] mt-0.5">
              Consultando los registros oficiales en <span className="font-mono">public.monitores</span>.
            </p>
          </div>
        </div>
      ) : monitoresError ? (
        /* Estado de Error */
        <div
          role="alert"
          className="bg-rose-50 border border-rose-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#8F141B] shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h2 className="text-sm font-bold text-[#8F141B]">
                Error al consultar los monitores en Supabase
              </h2>
              <p className="text-rose-800 leading-relaxed">{monitoresError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void fetchMonitores()}
            className="px-4 py-2 bg-[#8F141B] hover:bg-[#751016] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 self-start sm:self-center"
          >
            Reintentar
          </button>
        </div>
      ) : monitores.length === 0 ? (
        /* Estado Vacío: sin monitores registrados en Supabase */
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-3 shadow-xs">
          <div className="w-11 h-11 rounded-full bg-[#faf8ef] border border-[#DFD4A6] text-[#8F141B] flex items-center justify-center mx-auto">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">No hay monitores registrados</h2>
            <p className="text-xs text-[#4D626C] mt-1 max-w-md mx-auto">
              La consulta a <span className="font-mono">public.monitores</span> no devolvió registros disponibles para mostrar.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchMonitores()}
            className="px-4 py-2 bg-[#8F141B] hover:bg-[#751016] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Volver a consultar
          </button>
        </div>
      ) : (
        /* Monitores Table */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Monitor / Código</th>
                  <th className="py-3 px-4">Programa & Semestre</th>
                  <th className="py-3 px-4">Horas / Cumplimiento</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredMonitores.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No se encontraron monitores con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredMonitores.map((monitor) => {
                    const porcentaje = Math.min(
                      100,
                      Math.round((monitor.horas_aprobadas / (monitor.horas_asignadas || 1)) * 100)
                    );
                    const isEnTurno = monitor.estado === 'en_turno';

                    return (
                      <tr key={monitor.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#8F141B] text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {getInitials(monitor)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs">
                                {monitor.nombres} {monitor.apellidos}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                                <span>{monitor.codigo_estudiantil || 'Sin código'}</span>
                                <span>·</span>
                                <span className="truncate max-w-[160px] font-sans">
                                  {monitor.correo_institucional || 'Sin correo'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-800">{monitor.programa_academico}</p>
                          <p className="text-[11px] text-[#4D626C]">Semestre {monitor.semestre}°</p>
                        </td>

                        <td className="py-3.5 px-4 min-w-[180px]">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-mono font-bold text-slate-900 tabular-nums">
                                {monitor.horas_aprobadas} / {monitor.horas_asignadas} hrs
                              </span>
                              <span className="font-bold text-[#8F141B] tabular-nums">
                                {porcentaje}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-[#8F141B] h-full rounded-full transition-all duration-300"
                                style={{ width: `${porcentaje}%` }}
                              />
                            </div>
                            {monitor.horas_pendientes > 0 && (
                              <p className="text-[10px] text-[#6E6130] font-semibold">
                                +{monitor.horas_pendientes} hrs en revisión
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <StatusBadge type="monitor" value={monitor.estado} />
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(monitor)}
                              className="px-2 py-1 text-xs font-semibold text-slate-700 hover:text-[#8F141B] bg-white hover:bg-[#faf8ef] rounded border border-slate-200 hover:border-[#8F141B]/40 transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Editar información y sala habitual"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Editar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openStatusModal(monitor)}
                              disabled={isEnTurno}
                              className={`px-2 py-1 text-xs font-semibold rounded border transition-colors inline-flex items-center gap-1 ${
                                isEnTurno
                                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                  : monitor.estado === 'inactivo'
                                  ? 'text-emerald-800 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                                  : 'text-[#6E6130] bg-[#faf8ef] border-[#DFD4A6] hover:bg-[#DFD4A6]/40 cursor-pointer'
                              }`}
                              title={
                                isEnTurno
                                  ? 'No se puede inactivar un monitor en turno activo'
                                  : monitor.estado === 'inactivo'
                                  ? 'Reactivar monitor'
                                  : 'Inactivar monitor'
                              }
                            >
                              <Power className="w-3 h-3" />
                              <span>{monitor.estado === 'inactivo' ? 'Activar' : 'Inactivar'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedMonitorId(monitor.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-[#8F141B] hover:text-[#751016] bg-[#8F141B]/5 hover:bg-[#8F141B]/10 rounded border border-[#8F141B]/20 transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <span>Ficha</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setDeleteTarget(monitor);
                                setDeleteError(null);
                              }}
                              disabled={isEnTurno}
                              className={`px-2 py-1 text-xs font-semibold rounded border transition-colors inline-flex items-center gap-1 ${
                                isEnTurno
                                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                  : 'text-rose-800 bg-rose-50 border-rose-200 hover:bg-rose-100 cursor-pointer'
                              }`}
                              title={isEnTurno ? 'No se puede eliminar un monitor en turno activo' : 'Eliminar monitor'}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Eliminar</span>
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
      )}

      {/* Modal: Registrar Monitor */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Registrar Monitor</h3>
                <p className="text-xs text-slate-500">Crea la cuenta de acceso y el registro del monitor.</p>
              </div>
              <button onClick={closeCreateModal} disabled={isCreating} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg disabled:opacity-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => void handleSubmitCreate(e)} className="p-5 space-y-3 text-xs">
              {createError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#8F141B] shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombres *</label>
                  <input required disabled={isCreating} value={createForm.nombres} onChange={(e) => setCreateForm((p) => ({ ...p, nombres: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Apellidos *</label>
                  <input required disabled={isCreating} value={createForm.apellidos} onChange={(e) => setCreateForm((p) => ({ ...p, apellidos: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código estudiantil *</label>
                  <input required disabled={isCreating} value={createForm.codigo_estudiantil} onChange={(e) => setCreateForm((p) => ({ ...p, codigo_estudiantil: e.target.value }))} className={`${inputCls} font-mono`} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono *</label>
                  <input required disabled={isCreating} value={createForm.telefono} onChange={(e) => setCreateForm((p) => ({ ...p, telefono: e.target.value }))} className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correo institucional *</label>
                <input type="email" required disabled={isCreating} placeholder="usuario@usco.edu.co" value={createForm.correo_institucional} onChange={(e) => setCreateForm((p) => ({ ...p, correo_institucional: e.target.value }))} className={inputCls} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Programa académico *</label>
                  <select disabled={isCreating} value={createForm.programa_academico} onChange={(e) => setCreateForm((p) => ({ ...p, programa_academico: e.target.value as ProgramaAcademico }))} className={`${inputCls} cursor-pointer`}>
                    {PROGRAMAS_ACADEMICOS.map((prog) => (
                      <option key={prog} value={prog}>{prog}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Semestre *</label>
                  <input type="number" min={1} max={10} step={1} required disabled={isCreating} value={createForm.semestre} onChange={(e) => setCreateForm((p) => ({ ...p, semestre: Number(e.target.value) }))} className={`${inputCls} font-mono`} />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contraseña temporal * (mínimo 8 caracteres)</label>
                <input type="text" required minLength={8} disabled={isCreating} value={createForm.password} onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))} className={`${inputCls} font-mono`} autoComplete="off" />
                <p className="text-[11px] text-[#4D626C] mt-1">Entrégasela al monitor para su primer ingreso.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={closeCreateModal} disabled={isCreating} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isCreating} className="px-4 py-2 bg-[#8F141B] hover:bg-[#751016] text-white font-semibold rounded-lg shadow-sm cursor-pointer disabled:opacity-60 inline-flex items-center gap-1.5">
                  {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isCreating ? 'Registrando...' : 'Registrar Monitor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Eliminar Monitor */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-5 space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-50 text-[#8F141B] flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Eliminar monitor</h3>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Vas a eliminar a <strong>{deleteTarget.nombres} {deleteTarget.apellidos}</strong> ({deleteTarget.codigo_estudiantil}). Su cuenta de acceso y su registro dejarán de existir. Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
              {deleteError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#8F141B] shrink-0 mt-0.5" />
                  <span>{deleteError}</span>
                </div>
              )}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => !isDeleting && setDeleteTarget(null)} disabled={isDeleting} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50">
                  Cancelar
                </button>
                <button type="button" onClick={() => void handleConfirmDelete()} disabled={isDeleting} className="px-4 py-2 bg-[#8F141B] hover:bg-[#751016] text-white font-semibold rounded-lg cursor-pointer disabled:opacity-60 inline-flex items-center gap-1.5">
                  {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isDeleting ? 'Eliminando...' : 'Sí, eliminar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Añadir / Quitar horas manualmente */}
      {ajusteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden">
            <form onSubmit={(e) => void handleSubmitAjuste(e)} className="p-5 space-y-3 text-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {ajusteOperacion === 'sumar' ? 'Añadir horas' : 'Quitar horas'}
                </h3>
                <p className="text-slate-600 mt-0.5">
                  {ajusteTarget.nombres} {ajusteTarget.apellidos} · Horas aprobadas actuales:{' '}
                  <strong className="font-mono">{ajusteTarget.horas_aprobadas}</strong>
                </p>
              </div>

              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                {(['sumar', 'restar'] as const).map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setAjusteOperacion(op)}
                    className={`flex-1 px-3 py-1.5 rounded-md font-semibold cursor-pointer ${
                      ajusteOperacion === op ? 'bg-white text-[#8F141B] shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    {op === 'sumar' ? 'Añadir' : 'Quitar'}
                  </button>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cantidad de horas *</label>
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  required
                  autoFocus
                  disabled={isAjustando}
                  value={ajusteHoras}
                  onChange={(e) => setAjusteHoras(e.target.value)}
                  className={`${inputCls} font-mono`}
                />
              </div>

              {ajusteError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#8F141B] shrink-0 mt-0.5" />
                  <span>{ajusteError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => !isAjustando && setAjusteTarget(null)} disabled={isAjustando} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isAjustando} className="px-4 py-2 bg-[#8F141B] hover:bg-[#751016] text-white font-semibold rounded-lg cursor-pointer disabled:opacity-60 inline-flex items-center gap-1.5">
                  {isAjustando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isAjustando ? 'Guardando...' : 'Guardar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ficha Detallada del Monitor (con acciones administrativas de Fase 2) */}
      {selectedMonitor && (() => {
        const selectedLab = laboratorios.find((l) => l.id === selectedMonitor.laboratorio_habitual_id);
        const selectedPorcentaje = Math.min(
          100,
          Math.round((selectedMonitor.horas_aprobadas / (selectedMonitor.horas_asignadas || 1)) * 100)
        );
        const realSessions = asistencias.filter(
          (a) => a.monitor_id === selectedMonitor.id && !a.es_dato_prueba
        );
        const isEnTurno = selectedMonitor.estado === 'en_turno';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between p-5 border-b border-[#6E0F14] bg-[#8F141B] text-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#6E0F14] border border-[#DFD4A6]/40 text-[#DFD4A6] flex items-center justify-center font-bold text-sm">
                    {getInitials(selectedMonitor)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {selectedMonitor.nombres} {selectedMonitor.apellidos}
                    </h3>
                    <p className="text-xs text-[#DFD4A6] font-mono">
                      Código USCO: {selectedMonitor.codigo_estudiantil || 'No registrado'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMonitorId(null)}
                  className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                {/* Progress Box + Individual Hours Goal Action */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800">Cumplimiento de Horas</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#8F141B] text-sm">
                        {selectedMonitor.horas_aprobadas} / {selectedMonitor.horas_asignadas} hrs ({selectedPorcentaje}%)
                      </span>
                      <button
                        type="button"
                        onClick={() => openHorasModal(selectedMonitor)}
                        className="px-2 py-1 text-[11px] font-semibold bg-white hover:bg-[#faf8ef] text-[#8F141B] border border-[#8F141B]/30 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Modificar meta individual de horas asignadas"
                      >
                        <Clock className="w-3 h-3" />
                        <span>Modificar Meta</span>
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#8F141B] h-full rounded-full"
                      style={{ width: `${selectedPorcentaje}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Pendientes de validar: {selectedMonitor.horas_pendientes} hrs</span>
                    <span>
                      Faltan:{' '}
                      {Math.max(
                        0,
                        Number((selectedMonitor.horas_asignadas - selectedMonitor.horas_aprobadas).toFixed(1))
                      )}{' '}
                      hrs para cumplimiento total
                    </span>
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
                    <p className="font-medium text-slate-800 break-all">
                      {selectedMonitor.correo_institucional || 'No registrado'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Teléfono de Contacto</span>
                    <p className="font-medium text-slate-800">{selectedMonitor.telefono || 'No registrado'}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Sala Habitual</span>
                    <p className="font-semibold text-slate-800">
                      {selectedLab ? `${selectedLab.nombre} (${selectedLab.codigo})` : 'Rotativo'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-0.5">Estado</span>
                    <StatusBadge type="monitor" value={selectedMonitor.estado} />
                  </div>
                </div>

                {/* Barra de Acciones Administrativas del Monitor */}
                <div className="p-3.5 bg-[#faf8ef] border border-[#DFD4A6] rounded-xl flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-[#6E6130]">
                    Acciones de Coordinación
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(selectedMonitor)}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#8F141B]" />
                      <span>Editar Datos / Sala</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openHorasModal(selectedMonitor)}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-[#8F141B] border border-[#8F141B]/30 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Horas Asignadas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openAjusteModal(selectedMonitor, 'sumar')}
                      className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir Horas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openAjusteModal(selectedMonitor, 'restar')}
                      className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-800 border border-rose-300 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>Quitar Horas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openStatusModal(selectedMonitor)}
                      disabled={isEnTurno}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 border transition-colors ${
                        isEnTurno
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : selectedMonitor.estado === 'inactivo'
                          ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-700 cursor-pointer'
                          : 'bg-[#8F141B] hover:bg-[#751016] text-white border-[#8F141B] cursor-pointer'
                      }`}
                      title={
                        isEnTurno
                          ? 'No se puede inactivar un monitor mientras está en turno'
                          : selectedMonitor.estado === 'inactivo'
                          ? 'Reactivar monitor en Supabase'
                          : 'Inactivar monitor en Supabase'
                      }
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{selectedMonitor.estado === 'inactivo' ? 'Reactivar' : 'Inactivar'}</span>
                    </button>
                  </div>
                </div>

                {isEnTurno && (
                  <p className="text-[11px] text-[#8F141B] bg-[#8F141B]/5 border border-[#8F141B]/20 rounded-lg px-3 py-2">
                    Este monitor se encuentra actualmente en estado <strong>en_turno</strong>; no es posible inactivarlo hasta que finalice su jornada.
                  </p>
                )}

                {/* Recent real sessions by this monitor */}
                <div className="pt-1">
                  <h4 className="font-semibold text-slate-900 mb-2">Jornadas Registradas Recientes</h4>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {realSessions.length === 0 ? (
                      <p className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-500 text-center">
                        Aún no hay jornadas sincronizadas desde Supabase para este monitor.
                      </p>
                    ) : (
                      realSessions.slice(0, 4).map((a) => (
                        <div
                          key={a.id}
                          className="p-2 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-[11px]"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">{a.fecha}</span>
                            <span className="text-slate-500 ml-2 font-mono">
                              {a.hora_entrada} - {a.hora_salida || 'En curso'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium text-slate-700">{a.horas_calculadas} hrs</span>
                            <StatusBadge type="asistencia" value={a.estado} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 border-t border-slate-100">
                <span className="text-[11px] text-slate-500">Ficha oficial de monitoría FEA</span>
                <button
                  type="button"
                  onClick={() => setSelectedMonitorId(null)}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: Editar Información del Monitor y Sala Habitual */}
      {editingMonitor && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-[#6E0F14] bg-[#8F141B] text-white sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#6E0F14] border border-[#DFD4A6]/30 rounded-lg text-[#DFD4A6]">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Editar Información del Monitor
                  </h3>
                  <p className="text-[11px] text-[#DFD4A6]">
                    Actualización directa en <span className="font-mono">public.monitores</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                disabled={isSavingEdit}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-5 space-y-4 text-xs">
              {editError && (
                <div
                  role="alert"
                  className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-800"
                >
                  <AlertCircle className="w-4 h-4 text-[#8F141B] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{editError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    disabled={isSavingEdit}
                    value={editForm.nombres}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, nombres: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:bg-white focus:border-[#8F141B] disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    disabled={isSavingEdit}
                    value={editForm.apellidos}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, apellidos: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:bg-white focus:border-[#8F141B] disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código Estudiantil *</label>
                  <input
                    type="text"
                    required
                    disabled={isSavingEdit}
                    value={editForm.codigo_estudiantil}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, codigo_estudiantil: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono outline-none focus:bg-white focus:border-[#8F141B] disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono *</label>
                  <input
                    type="text"
                    required
                    disabled={isSavingEdit}
                    value={editForm.telefono}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, telefono: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono outline-none focus:bg-white focus:border-[#8F141B] disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correo Institucional *</label>
                <input
                  type="email"
                  required
                  disabled={isSavingEdit}
                  value={editForm.correo_institucional}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, correo_institucional: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:bg-white focus:border-[#8F141B] disabled:opacity-60"
                />
                <p className="text-[11px] text-[#4D626C] mt-1 leading-relaxed">
                  Importante: Editar este campo actualiza únicamente{' '}
                  <span className="font-mono">public.monitores.correo_institucional</span> y{' '}
                  <strong>no</strong> modifica el correo ni las credenciales de autenticación en{' '}
                  <span className="font-mono">public.perfiles</span> o Supabase Auth.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Programa Académico *</label>
                  <select
                    value={editForm.programa_academico}
                    disabled={isSavingEdit}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        programa_academico: e.target.value as ProgramaAcademico,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:bg-white focus:border-[#8F141B] cursor-pointer disabled:opacity-60"
                  >
                    {PROGRAMAS_ACADEMICOS.map((prog) => (
                      <option key={prog} value={prog}>
                        {prog}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Semestre *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    step={1}
                    required
                    disabled={isSavingEdit}
                    value={editForm.semestre}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        semestre: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono outline-none focus:bg-white focus:border-[#8F141B] disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Asignación de Sala Habitual */}
              <div className="p-3.5 bg-[#faf8ef] border border-[#DFD4A6] rounded-xl space-y-2">
                <label className="flex items-center gap-1.5 font-bold text-[#8F141B]">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Sala Habitual Asignada</span>
                </label>

                {laboratoriosLoading && laboratorios.length === 0 ? (
                  <p className="text-[11px] text-[#4D626C]">Cargando salas oficiales desde Supabase...</p>
                ) : laboratoriosError ? (
                  <p className="text-[11px] text-[#8F141B]">
                    No se pudieron cargar las salas oficiales ({laboratoriosError}). Puedes conservar la asignación como Rotativo o reintentar.
                  </p>
                ) : (
                  <select
                    value={editForm.laboratorio_habitual_id || ''}
                    disabled={isSavingEdit}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        laboratorio_habitual_id: e.target.value ? e.target.value : null,
                      }))
                    }
                    className="w-full px-3 py-2 bg-white border border-[#DFD4A6] rounded-lg text-slate-900 font-semibold outline-none focus:border-[#8F141B] cursor-pointer disabled:opacity-60"
                  >
                    <option value="">Rotativo (sin sala habitual asignada)</option>
                    {laboratorios.map((lab) => (
                      <option key={lab.id} value={lab.id}>
                        {lab.nombre} ({lab.codigo})
                      </option>
                    ))}
                  </select>
                )}

                <p className="text-[11px] text-[#4D626C]">
                  Solo se permiten las salas oficiales registradas en <span className="font-mono">public.laboratorios</span> o la opción Rotativo.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={isSavingEdit}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 bg-[#8F141B] hover:bg-[#751016] text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60"
                >
                  {isSavingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSavingEdit ? 'Guardando en Supabase...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmación de Activación / Inactivación */}
      {statusTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-lg ${
                    statusTarget.nuevoEstado === 'inactivo'
                      ? 'bg-[#8F141B]/10 text-[#8F141B]'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {statusTarget.nuevoEstado === 'inactivo'
                      ? 'Confirmar Inactivación de Monitor'
                      : 'Confirmar Reactivación de Monitor'}
                  </h3>
                  <p className="text-[11px] text-[#4D626C]">
                    Cambio de estado administrativo en Supabase
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeStatusModal}
                disabled={isSavingStatus}
                className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {statusError && (
                <div
                  role="alert"
                  className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-800"
                >
                  <AlertCircle className="w-4 h-4 text-[#8F141B] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{statusError}</span>
                </div>
              )}

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <p className="font-bold text-slate-900 text-sm">
                  {statusTarget.monitor.nombres} {statusTarget.monitor.apellidos}
                </p>
                <p className="font-mono text-[11px] text-[#4D626C]">
                  Código: {statusTarget.monitor.codigo_estudiantil} · Estado actual:{' '}
                  <strong className="text-slate-900">{statusTarget.monitor.estado}</strong> → Nuevo estado:{' '}
                  <strong className="text-[#8F141B]">{statusTarget.nuevoEstado}</strong>
                </p>
              </div>

              <p className="text-slate-600 leading-relaxed">
                {statusTarget.nuevoEstado === 'inactivo'
                  ? 'Al confirmar, el monitor quedará marcado como "inactivo" en public.monitores y se bloqueará su acceso en futuros inicios de sesión desde la verificación de perfil. No se eliminan ni alteran cuentas en Supabase Auth.'
                  : 'Al confirmar, el monitor quedará habilitado nuevamente con estado "activo" en public.monitores y podrá acceder normalmente al sistema.'}
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeStatusModal}
                  disabled={isSavingStatus}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmStatusChange()}
                  disabled={isSavingStatus}
                  className={`px-4 py-2 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60 ${
                    statusTarget.nuevoEstado === 'inactivo'
                      ? 'bg-[#8F141B] hover:bg-[#751016]'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  {isSavingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {isSavingStatus
                      ? 'Actualizando...'
                      : statusTarget.nuevoEstado === 'inactivo'
                      ? 'Confirmar Inactivación'
                      : 'Confirmar Reactivación'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Modificación Individual de Horas Asignadas */}
      {horasTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-[#6E0F14] bg-[#8F141B] text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#6E0F14] border border-[#DFD4A6]/30 rounded-lg text-[#DFD4A6]">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Modificar Horas Asignadas
                  </h3>
                  <p className="text-[11px] text-[#DFD4A6]">
                    Meta individual en <span className="font-mono">public.monitores</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeHorasModal}
                disabled={isSavingHoras}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {horasError && (
                <div
                  role="alert"
                  className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-800"
                >
                  <AlertCircle className="w-4 h-4 text-[#8F141B] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{horasError}</span>
                </div>
              )}

              {/* Resumen del monitor y valores actuales */}
              <div className="p-3.5 bg-[#faf8ef] border border-[#DFD4A6] rounded-xl space-y-2">
                <p className="font-bold text-slate-900 text-sm">
                  {horasTarget.nombres} {horasTarget.apellidos}
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2 bg-white rounded border border-[#DFD4A6]/60">
                    <span className="text-[10px] text-[#6E6130] block font-semibold">Meta Actual</span>
                    <span className="font-mono font-bold text-[#8F141B] text-sm">
                      {horasTarget.horas_asignadas} hrs
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Aprobadas</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      {horasTarget.horas_aprobadas} hrs
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Pendientes</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      {horasTarget.horas_pendientes} hrs
                    </span>
                  </div>
                </div>
              </div>

              {horasStep === 'form' ? (
                <form onSubmit={handleValidateHorasStep} className="space-y-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nueva Meta Individual de Horas Asignadas *
                    </label>
                    <input
                      type="number"
                      min={1}
                      step="any"
                      required
                      value={horasInput}
                      onChange={(e) => setHorasInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold text-sm outline-none focus:bg-white focus:border-[#8F141B]"
                    />
                    <p className="text-[11px] text-[#4D626C] mt-1.5 leading-relaxed">
                      Esta operación actualiza únicamente <span className="font-mono">horas_asignadas</span> para este monitor. No modifica <span className="font-mono">horas_aprobadas</span> ni <span className="font-mono">horas_pendientes</span>.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={closeHorasModal}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#8F141B] hover:bg-[#751016] text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                    >
                      Continuar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <CheckCircle2 className="w-4 h-4 text-[#8F141B]" />
                      <span>Confirmar Cambio de Meta Individual</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Se actualizarán las horas asignadas de{' '}
                      <strong className="font-mono text-slate-900">{horasTarget.horas_asignadas} hrs</strong> a{' '}
                      <strong className="font-mono text-[#8F141B]">{Number(horasInput)} hrs</strong> en{' '}
                      <span className="font-mono">public.monitores</span>.
                    </p>
                    <p className="text-[11px] text-[#4D626C]">
                      Las horas aprobadas ({horasTarget.horas_aprobadas} hrs), horas pendientes ({horasTarget.horas_pendientes} hrs) y registros históricos permanecerán intactos. Si el trigger <span className="font-mono">registrar_cambio_meta</span> está activo en Supabase, registrará automáticamente el historial.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setHorasError(null);
                        setHorasStep('form');
                      }}
                      disabled={isSavingHoras}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer disabled:opacity-50"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleConfirmHorasSave()}
                      disabled={isSavingHoras}
                      className="px-4 py-2 bg-[#8F141B] hover:bg-[#751016] text-white font-semibold rounded-lg shadow-xs cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {isSavingHoras && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{isSavingHoras ? 'Guardando...' : 'Confirmar y Guardar'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Configuración de Meta General de Referencia */}
      <ConfigurarMetaModal
        isOpen={isConfigMetaOpen}
        onClose={() => setIsConfigMetaOpen(false)}
      />
    </div>
  );
};
