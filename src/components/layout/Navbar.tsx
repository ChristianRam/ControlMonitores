import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, 
  UserCheck, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  GraduationCap
} from 'lucide-react';

interface NavbarProps {
  onOpenMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu }) => {
  const { currentUser, currentRole, switchRole, logout, periodo } = useApp();
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-2.5 bg-[#003561] text-white border-b border-[#002545] shadow-sm">
      {/* Zone 1: Brand & Faculty Identity */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 -ml-1 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          {/* Official Faculty Logo with Fallback */}
          {!logoError ? (
            <div className="h-9 w-auto max-w-[170px] sm:max-w-[210px] bg-white/95 rounded p-1 flex items-center justify-center shrink-0 shadow-xs border border-white/20">
              <img
                src="https://www.usco.edu.co/imagen-institucional/facultades/economia-y-administracion.png"
                alt="Facultad de Economía y Administración - Universidad Surcolombiana"
                className="h-full w-auto max-h-7 object-contain"
                referrerPolicy="no-referrer"
                onError={() => setLogoError(true)}
              />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-lg bg-[#8F141B] flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
          )}

          <div className="leading-tight pl-1 border-l border-white/20">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm sm:text-base tracking-tight text-white">ControlMonitores</span>
              <span className="hidden sm:inline-block text-[10px] font-semibold text-[#DFD4A6] bg-[#002545] border border-[#DFD4A6]/40 px-1.5 py-0.2 rounded uppercase">
                FEA USCO
              </span>
            </div>
            <p className="text-[11px] text-slate-200 hidden md:block">
              Laboratorios Tecnológicos · Universidad Surcolombiana
            </p>
          </div>
        </div>
      </div>

      {/* Zone 2: Middle Meta (Periodo) */}
      <div className="hidden xl:flex items-center gap-2 text-xs text-slate-200 bg-[#002545] px-3 py-1.5 rounded-md border border-[#0d4677]">
        <Building2 className="w-3.5 h-3.5 text-[#DFD4A6]" />
        <span>Sede Central Neiva</span>
        <span className="text-slate-400">·</span>
        <span className="font-mono text-[#DFD4A6] font-semibold">{periodo.codigo}</span>
      </div>

      {/* Zone 3: User Role Switcher & Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Selector de rol de prueba rápida */}
        <div className="flex items-center bg-[#002545] p-0.5 rounded-lg border border-[#0d4677]">
          <button
            onClick={() => switchRole('admin')}
            title="Ver sistema como Administrador / Coordinador de Laboratorios"
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              currentRole === 'admin'
                ? 'bg-[#8F141B] text-white shadow-xs font-semibold'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Coordinador</span>
          </button>
          <button
            onClick={() => switchRole('monitor')}
            title="Ver sistema como Monitor de Laboratorio"
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              currentRole === 'monitor'
                ? 'bg-[#8F141B] text-white shadow-xs font-semibold'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Monitor</span>
          </button>
        </div>

        {/* User Card & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/20">
          <div className="hidden sm:block text-right leading-none">
            <p className="text-xs font-medium text-white max-w-[130px] truncate">
              {currentUser?.nombre_completo.split(' ')[0]} {currentUser?.nombre_completo.split(' ')[1]}
            </p>
            <p className="text-[10px] text-[#DFD4A6] mt-1 capitalize font-medium">
              {currentRole === 'admin' ? 'Coordinador FEA' : 'Monitor Académico'}
            </p>
          </div>

          <button
            onClick={logout}
            className="p-1.5 text-slate-200 hover:text-rose-200 hover:bg-[#8F141B]/30 rounded-lg transition-colors cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
