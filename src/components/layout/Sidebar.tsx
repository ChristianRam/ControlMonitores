import React, { useState } from 'react';
import { useApp, NavigationTab } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Users, 
  MonitorPlay, 
  CalendarCheck2, 
  FileSpreadsheet, 
  AlertCircle, 
  Clock, 
  Database,
  Building,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { 
    activeTab, 
    setActiveTab, 
    currentRole, 
    asistencias, 
    novedades,
    monitores,
    currentMonitorData
  } = useApp();
  const [logoError, setLogoError] = useState(false);

  // Contadores para badges
  const pendientesAsistencia = asistencias.filter(a => a.estado === 'pendiente_validacion').length;
  const pendientesNovedades = currentRole === 'monitor' && currentMonitorData
    ? novedades.filter(n => n.monitor_id === currentMonitorData.id && n.estado === 'pendiente').length
    : novedades.filter(n => n.estado === 'pendiente').length;
  const monitoresEnTurno = monitores.filter(m => m.estado === 'en_turno').length;

  const handleNav = (tab: NavigationTab) => {
    setActiveTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Panel Administrativo',
      icon: LayoutDashboard,
      roles: ['admin'],
      badge: null,
    },
    {
      id: 'monitor_dashboard' as NavigationTab,
      label: 'Mi Turno / Marcación',
      icon: Clock,
      roles: ['monitor'],
      badge: 'Estudiante',
      highlight: true,
    },
    {
      id: 'monitores' as NavigationTab,
      label: 'Gestión de Monitores',
      icon: Users,
      roles: ['admin'],
      badge: `${monitoresEnTurno} en turno`,
    },
    {
      id: 'laboratorios' as NavigationTab,
      label: 'Salas y Laboratorios',
      icon: MonitorPlay,
      roles: ['admin'],
      badge: null,
    },
    {
      id: 'asistencia' as NavigationTab,
      label: 'Control de Asistencia',
      icon: CalendarCheck2,
      roles: ['admin'],
      badge: pendientesAsistencia > 0 ? `${pendientesAsistencia} pend.` : null,
      badgeColor: 'ocre',
    },
    {
      id: 'reportes' as NavigationTab,
      label: currentRole === 'monitor' ? 'Certificación' : 'Reportes y Certificados',
      icon: FileSpreadsheet,
      roles: ['admin', 'monitor'],
      badge: null,
    },
    {
      id: 'novedades' as NavigationTab,
      label: 'Novedades y Solicitudes',
      icon: AlertCircle,
      roles: ['admin', 'monitor'],
      badge: pendientesNovedades > 0 ? `${pendientesNovedades}` : null,
      badgeColor: 'vinotinto',
    },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(currentRole));

  return (
    <aside className="w-64 bg-[#003561] text-slate-200 flex flex-col h-full border-r border-[#002545] select-none">
      {/* Context Header with Faculty Branding */}
      <div className="p-4 border-b border-[#002545] bg-[#002b4f]">
        {!logoError ? (
          <div className="mb-2.5 bg-white/95 rounded p-1.5 flex items-center justify-center shadow-xs border border-white/20">
            <img
              src="https://www.usco.edu.co/imagen-institucional/facultades/economia-y-administracion.png"
              alt="Facultad de Economía y Administración - Universidad Surcolombiana"
              className="h-8 w-auto object-contain"
              referrerPolicy="no-referrer"
              onError={() => setLogoError(true)}
            />
          </div>
        ) : null}

        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#DFD4A6]">
          <Building className="w-4 h-4 text-[#DFD4A6]" />
          <span>Facultad de Economía</span>
        </div>
        <p className="text-[11px] text-slate-300 mt-0.5">
          Universidad Surcolombiana · Neiva
        </p>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-300">
          Módulos del Sistema
        </div>

        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group cursor-pointer ${
                isActive
                  ? 'bg-[#8F141B] text-white shadow-sm font-semibold'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-300 group-hover:text-[#DFD4A6]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-black/30 text-white'
                      : item.badgeColor === 'ocre'
                      ? 'bg-[#DFD4A6] text-[#003561] font-bold'
                      : item.badgeColor === 'vinotinto'
                      ? 'bg-[#8F141B] text-white font-bold'
                      : 'bg-[#002545] text-slate-200 border border-white/10'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Supabase Ready Badge / Architecture Info Box */}
      <div className="p-3.5 m-3 rounded-lg bg-[#002545] border border-[#0d4677] text-xs">
        <div className="flex items-center gap-2 font-medium text-[#DFD4A6]">
          <Database className="w-3.5 h-3.5" />
          <span>Arquitectura Supabase</span>
        </div>
        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
          Estructura SQL, esquemas de tablas y storage listos para conexión backend.
        </p>
        <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300 font-mono">
          <span>RLS & Auth</span>
          <span className="text-[#DFD4A6] flex items-center gap-1 font-sans font-semibold">
            <CheckCircle2 className="w-3 h-3 text-[#DFD4A6]" /> Preparado
          </span>
        </div>
      </div>
    </aside>
  );
};
