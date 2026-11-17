import React, { useState } from 'react';
import { useApp, NavigationTab } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Clock, 
  CalendarCheck2, 
  AlertCircle, 
  MoreHorizontal,
  X,
  Users,
  MonitorPlay,
  FileSpreadsheet,
  GraduationCap
} from 'lucide-react';

interface MobileNavProps {
  isDrawerOpen: boolean;
  onCloseDrawer: () => void;
  onOpenDrawer: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isDrawerOpen,
  onCloseDrawer,
  onOpenDrawer,
}) => {
  const { activeTab, setActiveTab, currentRole, asistencias, novedades, currentMonitorData } = useApp();

  const pendientesAsistencia = asistencias.filter(a => a.estado === 'pendiente_validacion').length;
  const pendientesNovedades = currentRole === 'monitor' && currentMonitorData
    ? novedades.filter(n => n.monitor_id === currentMonitorData.id && n.estado === 'pendiente').length
    : novedades.filter(n => n.estado === 'pendiente').length;

  const handleNav = (tab: NavigationTab) => {
    setActiveTab(tab);
    onCloseDrawer();
  };

  return (
    <>
      {/* Bottom bar for mobile touch screens */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#8F141B] border-t border-[#6E0F14] px-2 py-1 flex items-center justify-around shadow-lg">
        {currentRole === 'admin' ? (
          <button
            onClick={() => handleNav('dashboard')}
            className={`flex flex-col items-center py-1.5 px-3 rounded-lg text-[10px] font-medium transition-colors ${
              activeTab === 'dashboard' ? 'text-[#DFD4A6] font-bold' : 'text-white/85 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span>Inicio</span>
          </button>
        ) : (
          <button
            onClick={() => handleNav('monitor_dashboard')}
            className={`flex flex-col items-center py-1.5 px-3 rounded-lg text-[10px] font-medium transition-colors ${
              activeTab === 'monitor_dashboard' ? 'text-[#DFD4A6] font-bold' : 'text-white/85 hover:text-white'
            }`}
          >
            <Clock className="w-5 h-5 mb-0.5" />
            <span>Mi Turno</span>
          </button>
        )}

        {currentRole === 'admin' && (
          <button
            onClick={() => handleNav('asistencia')}
            className={`relative flex flex-col items-center py-1.5 px-3 rounded-lg text-[10px] font-medium transition-colors ${
              activeTab === 'asistencia' ? 'text-[#DFD4A6] font-bold' : 'text-white/85 hover:text-white'
            }`}
          >
            <CalendarCheck2 className="w-5 h-5 mb-0.5" />
            <span>Asistencia</span>
            {pendientesAsistencia > 0 && (
              <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-[#DFD4A6]" />
            )}
          </button>
        )}

        {currentRole === 'monitor' && (
          <button
            onClick={() => handleNav('reportes')}
            className={`flex flex-col items-center py-1.5 px-3 rounded-lg text-[10px] font-medium transition-colors ${
              activeTab === 'reportes' ? 'text-[#DFD4A6] font-bold' : 'text-white/85 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5 mb-0.5" />
            <span>Certificado</span>
          </button>
        )}

        <button
          onClick={() => handleNav('novedades')}
          className={`relative flex flex-col items-center py-1.5 px-3 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'novedades' ? 'text-[#DFD4A6] font-bold' : 'text-white/85 hover:text-white'
          }`}
        >
          <AlertCircle className="w-5 h-5 mb-0.5" />
          <span>Novedades</span>
          {pendientesNovedades > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-[#DFD4A6]" />
          )}
        </button>

        <button
          onClick={onOpenDrawer}
          className="flex flex-col items-center py-1.5 px-3 rounded-lg text-[10px] font-medium text-white/85 hover:text-white transition-colors cursor-pointer"
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span>Más</span>
        </button>
      </nav>

      {/* Drawer Overlay for Mobile */}
      {isDrawerOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end"
          onClick={onCloseDrawer}
        >
          <div 
            className="w-4/5 max-w-xs h-full bg-[#8F141B] text-white flex flex-col p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-[#6E0F14] gap-2">
              <div className="space-y-0.5">
                <h3 className="font-bold text-sm text-white">Control de Monitores</h3>
                <p className="text-[11px] text-[#DFD4A6] font-semibold">Facultad de Economía y Administración</p>
                <p className="text-[10px] text-white/85">Universidad Surcolombiana - Sede Neiva</p>
              </div>
              <button
                onClick={onCloseDrawer}
                className="p-1.5 text-white/85 hover:text-white rounded-lg hover:bg-[#6E0F14]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-1 flex-1 overflow-y-auto">
              {currentRole === 'admin' && (
                <>
                  <button
                    onClick={() => handleNav('dashboard')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-left ${
                      activeTab === 'dashboard' ? 'bg-white text-[#8F141B] font-bold shadow-xs' : 'text-white/90 hover:bg-[#751016]'
                    }`}
                  >
                    <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-[#8F141B]' : 'text-[#DFD4A6]'}`} />
                    <span>Panel Administrativo</span>
                  </button>
                  <button
                    onClick={() => handleNav('monitores')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-left ${
                      activeTab === 'monitores' ? 'bg-white text-[#8F141B] font-bold shadow-xs' : 'text-white/90 hover:bg-[#751016]'
                    }`}
                  >
                    <Users className={`w-4 h-4 ${activeTab === 'monitores' ? 'text-[#8F141B]' : 'text-[#DFD4A6]'}`} />
                    <span>Gestión de Monitores</span>
                  </button>
                </>
              )}

              {currentRole === 'monitor' && (
                <button
                  onClick={() => handleNav('monitor_dashboard')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-left ${
                    activeTab === 'monitor_dashboard' ? 'bg-white text-[#8F141B] font-bold shadow-xs' : 'text-white/90 hover:bg-[#751016]'
                  }`}
                >
                  <Clock className={`w-4 h-4 ${activeTab === 'monitor_dashboard' ? 'text-[#8F141B]' : 'text-[#DFD4A6]'}`} />
                  <span>Portal del Monitor (Marcación)</span>
                </button>
              )}

              {currentRole === 'admin' && (
                <button
                  onClick={() => handleNav('laboratorios')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-left ${
                    activeTab === 'laboratorios' ? 'bg-white text-[#8F141B] font-bold shadow-xs' : 'text-white/90 hover:bg-[#751016]'
                  }`}
                >
                  <MonitorPlay className={`w-4 h-4 ${activeTab === 'laboratorios' ? 'text-[#8F141B]' : 'text-[#DFD4A6]'}`} />
                  <span>Salas</span>
                </button>
              )}

              {currentRole === 'admin' && (
                <button
                  onClick={() => handleNav('asistencia')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-left ${
                    activeTab === 'asistencia' ? 'bg-white text-[#8F141B] font-bold shadow-xs' : 'text-white/90 hover:bg-[#751016]'
                  }`}
                >
                  <CalendarCheck2 className={`w-4 h-4 ${activeTab === 'asistencia' ? 'text-[#8F141B]' : 'text-[#DFD4A6]'}`} />
                  <span>Control de Asistencia & Timemark</span>
                </button>
              )}

              <button
                onClick={() => handleNav('reportes')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-left ${
                  activeTab === 'reportes' ? 'bg-white text-[#8F141B] font-bold shadow-xs' : 'text-white/90 hover:bg-[#751016]'
                }`}
              >
                <FileSpreadsheet className={`w-4 h-4 ${activeTab === 'reportes' ? 'text-[#8F141B]' : 'text-[#DFD4A6]'}`} />
                <span>{currentRole === 'monitor' ? 'Certificación' : 'Reportes y Certificaciones'}</span>
              </button>

              <button
                onClick={() => handleNav('novedades')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-left ${
                  activeTab === 'novedades' ? 'bg-white text-[#8F141B] font-bold shadow-xs' : 'text-white/90 hover:bg-[#751016]'
                }`}
              >
                <AlertCircle className={`w-4 h-4 ${activeTab === 'novedades' ? 'text-[#8F141B]' : 'text-[#DFD4A6]'}`} />
                <span>Novedades y Solicitudes</span>
              </button>
            </div>

            <div className="pt-3 border-t border-[#6E0F14] text-[11px] text-[#DFD4A6] text-center font-medium">
              Universidad Surcolombiana · Sede Neiva
            </div>
          </div>
        </div>
      )}
    </>
  );
};
