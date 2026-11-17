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
  CheckCircle2
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
      label: 'Salas',
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

  const filteredNavItems = navItems.filter(item =>
    currentRole ? item.roles.includes(currentRole) : false
  );

  return (
    <aside className="w-64 bg-[#8F141B] text-white/90 flex flex-col h-full border-r border-[#6E0F14] select-none">
      {/* Context Header with Institutional Branding */}
      <div className="p-4 border-b border-[#6E0F14] bg-[#751016]">
        {!logoError ? (
          <div className="mb-3 bg-white rounded-lg px-2.5 py-2 flex items-center justify-center shadow-xs border border-[#DFD4A6]/40">
            <img
              src="/assets/aistudio/IMG_7384_056b4251.PNG"
              alt="Universidad Surcolombiana - Laboratorio Tecnológico José Ignacio Hembuz Palomino - Facultad de Economía y Administración"
              className="w-full h-auto max-h-14 object-contain"
              onError={() => setLogoError(true)}
            />
          </div>
        ) : null}

        <div className="space-y-0.5">
          <div className="flex items-start gap-2 text-xs font-bold text-[#DFD4A6] leading-snug">
            <Building className="w-3.5 h-3.5 text-[#DFD4A6] shrink-0 mt-0.5" />
            <span>Facultad de Economía y Administración</span>
          </div>
          <p className="text-[11px] text-white/90 pl-5.5 leading-snug">
            Universidad Surcolombiana - Sede Neiva
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#DFD4A6]/90">
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
                  ? 'bg-white text-[#8F141B] shadow-sm font-bold border-l-4 border-[#DFD4A6]'
                  : 'text-white/90 hover:text-white hover:bg-[#751016]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#8F141B]' : 'text-[#DFD4A6]/90 group-hover:text-[#DFD4A6]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    isActive
                      ? 'bg-[#8F141B]/10 text-[#8F141B] font-bold'
                      : item.badgeColor === 'ocre'
                      ? 'bg-[#DFD4A6] text-[#6E0F14] font-bold'
                      : item.badgeColor === 'vinotinto'
                      ? 'bg-[#6E0F14] text-[#DFD4A6] border border-[#DFD4A6]/40 font-bold'
                      : 'bg-[#6E0F14] text-white/90 border border-white/15'
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
      <div className="p-3.5 m-3 rounded-lg bg-[#6E0F14] border border-[#DFD4A6]/25 text-xs">
        <div className="flex items-center gap-2 font-medium text-[#DFD4A6]">
          <Database className="w-3.5 h-3.5" />
          <span>Arquitectura Supabase</span>
        </div>
        <p className="text-[11px] text-white/85 mt-1 leading-relaxed">
          Estructura SQL, esquemas de tablas y storage listos para conexión backend.
        </p>
        <div className="mt-2 pt-2 border-t border-white/15 flex items-center justify-between text-[10px] text-white/80 font-mono">
          <span>RLS & Auth</span>
          <span className="text-[#DFD4A6] flex items-center gap-1 font-sans font-semibold">
            <CheckCircle2 className="w-3 h-3 text-[#DFD4A6]" /> Preparado
          </span>
        </div>
      </div>
    </aside>
  );
};
