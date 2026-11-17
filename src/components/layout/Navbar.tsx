import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, 
  UserCheck, 
  ShieldCheck, 
  LogOut, 
  Menu
} from 'lucide-react';

interface NavbarProps {
  onOpenMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu }) => {
  const { currentUser, currentRole, logout, periodo } = useApp();

  const displayName =
    currentUser?.nombre_completo?.trim().split(/\s+/).slice(0, 2).join(' ') ||
    currentUser?.email ||
    'Usuario';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-[#8F141B] text-white border-b border-[#6E0F14] shadow-sm">
      {/* Zone 1: Mobile menu button & Application Title (No logo in Header) */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 -ml-1 text-white/90 hover:text-white hover:bg-[#6E0F14] rounded-lg transition-colors cursor-pointer shrink-0"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="leading-tight min-w-0">
          <h1 className="font-bold text-xs sm:text-sm md:text-base tracking-tight text-white truncate">
            Control de Monitores - Laboratorios Tecnológicos
          </h1>
          <p className="text-[11px] text-[#DFD4A6] hidden md:block truncate">
            Universidad Surcolombiana · Sede Neiva
          </p>
        </div>
      </div>

      {/* Zone 2: Middle Meta (Periodo) */}
      <div className="hidden xl:flex items-center gap-2 text-xs text-white/90 bg-[#6E0F14] px-3 py-1.5 rounded-md border border-[#DFD4A6]/30 shrink-0">
        <Building2 className="w-3.5 h-3.5 text-[#DFD4A6]" />
        <span>Sede Central Neiva</span>
        <span className="text-[#DFD4A6]/50">·</span>
        <span className="font-mono text-[#DFD4A6] font-semibold">{periodo.codigo}</span>
      </div>

      {/* Zone 3: Authenticated Role Badge & Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {currentRole && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#6E0F14] border border-[#DFD4A6]/30 text-xs font-medium text-[#DFD4A6]">
            {currentRole === 'admin' ? (
              <ShieldCheck className="w-3.5 h-3.5" />
            ) : (
              <UserCheck className="w-3.5 h-3.5" />
            )}
            <span>{currentRole === 'admin' ? 'Coordinador' : 'Monitor'}</span>
          </div>
        )}

        {/* User Card & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/20">
          <div className="hidden sm:block text-right leading-none">
            <p className="text-xs font-medium text-white max-w-[160px] truncate">
              {displayName}
            </p>
            {currentRole === 'monitor' && (
              <p className="text-[10px] text-[#DFD4A6] mt-1 font-medium">
                Monitor Académico
              </p>
            )}
          </div>

          <button
            onClick={logout}
            className="p-1.5 text-white/90 hover:text-[#DFD4A6] hover:bg-[#6E0F14] rounded-lg transition-colors cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
