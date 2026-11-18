import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
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
  const { currentUser, currentRole, logout, periodo, novedades, setActiveTab, addToast } = useApp();

  // Campanita: novedades pendientes por revisar (solo coordinador)
  const [isBellOpen, setIsBellOpen] = useState(false);
  const pendientes = novedades.filter((n) => n.estado === 'pendiente');
  const prevPendientesRef = useRef<number | null>(null);

  useEffect(() => {
    if (currentRole !== 'admin') {
      prevPendientesRef.current = null;
      return;
    }
    const previo = prevPendientesRef.current;
    if (previo !== null && pendientes.length > previo) {
      addToast('Nueva Novedad', 'Llegó una nueva novedad para revisión de la coordinación.', 'info');
    }
    prevPendientesRef.current = pendientes.length;
  }, [pendientes.length, currentRole, addToast]);

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

        {/* Campanita de novedades */}
        {currentRole === 'admin' && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsBellOpen((v) => !v)}
              className="relative p-1.5 text-white/90 hover:text-[#DFD4A6] hover:bg-[#6E0F14] rounded-lg transition-colors cursor-pointer"
              aria-label={`Novedades pendientes: ${pendientes.length}`}
              title="Novedades"
            >
              <Bell className="w-4.5 h-4.5" />
              {pendientes.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-[#DFD4A6] text-[#6E0F14] text-[10px] font-bold flex items-center justify-center">
                  {pendientes.length > 9 ? '9+' : pendientes.length}
                </span>
              )}
            </button>

            {isBellOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsBellOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 max-w-[85vw] bg-white text-slate-800 rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                  <div className="px-3.5 py-2.5 border-b border-slate-100 text-xs font-bold text-slate-900">
                    Novedades pendientes ({pendientes.length})
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {pendientes.length === 0 ? (
                      <p className="px-3.5 py-4 text-xs text-slate-500 text-center">No hay novedades por revisar.</p>
                    ) : (
                      pendientes.slice(0, 8).map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            setIsBellOpen(false);
                            setActiveTab('novedades');
                          }}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 cursor-pointer"
                        >
                          <p className="text-xs font-semibold text-slate-900 truncate">{n.titulo}</p>
                          <p className="text-[11px] text-slate-500 truncate">{n.monitor_nombre || 'Monitor'}</p>
                        </button>
                      ))
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsBellOpen(false);
                      setActiveTab('novedades');
                    }}
                    className="w-full px-3.5 py-2 text-xs font-semibold text-[#8F141B] bg-[#faf8ef] border-t border-[#DFD4A6] hover:bg-[#DFD4A6]/40 cursor-pointer"
                  >
                    Ver todas las novedades
                  </button>
                </div>
              </>
            )}
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
