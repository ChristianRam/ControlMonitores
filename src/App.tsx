/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { ToastContainer } from './components/ui/Toast';

import { LoginView } from './views/LoginView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { MonitoresView } from './views/MonitoresView';
import { LaboratoriosView } from './views/LaboratoriosView';
import { AsistenciaView } from './views/AsistenciaView';
import { ReportesView } from './views/ReportesView';
import { NovedadesView } from './views/NovedadesView';
import { MonitorDashboardView } from './views/MonitorDashboardView';
import { Loader2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentUser, currentRole, authInitializing, activeTab } = useApp();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  if (authInitializing) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-slate-700">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-8 py-7 flex flex-col items-center gap-3 max-w-sm w-full text-center">
          <div className="w-11 h-11 rounded-xl bg-[#8F141B] text-[#DFD4A6] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#8F141B]">Control de Monitores</p>
            <p className="text-xs text-[#4D626C] mt-1">Verificando sesión y perfil institucional...</p>
          </div>
        </div>
        <ToastContainer />
      </div>
    );
  }

  // Bloquear acceso si no hay usuario autenticado o rol válido
  if (
    !currentUser ||
    (currentRole !== 'admin' && currentRole !== 'monitor') ||
    activeTab === 'login'
  ) {
    return (
      <>
        <LoginView />
        <ToastContainer />
      </>
    );
  }

  const renderActiveView = () => {
    // Protección de rutas por rol
    if (currentRole === 'monitor') {
      if (activeTab === 'laboratorios' || activeTab === 'dashboard' || activeTab === 'monitores' || activeTab === 'asistencia') {
        return <MonitorDashboardView />;
      }
    } else if (currentRole === 'admin') {
      if (activeTab === 'monitor_dashboard') {
        return <AdminDashboardView />;
      }
    } else {
      return <LoginView />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboardView />;
      case 'monitores':
        return <MonitoresView />;
      case 'laboratorios':
        return <LaboratoriosView />;
      case 'asistencia':
        return <AsistenciaView />;
      case 'reportes':
        return <ReportesView />;
      case 'novedades':
        return <NovedadesView />;
      case 'monitor_dashboard':
        return <MonitorDashboardView />;
      default:
        return currentRole === 'admin' ? <AdminDashboardView /> : <MonitorDashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Header */}
      <Navbar onOpenMobileMenu={() => setIsMobileDrawerOpen(true)} />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0">
          <Sidebar />
        </div>

        {/* Dynamic Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Mobile Touch Navigation (Bottom Bar + Drawer) */}
      <MobileNav
        isDrawerOpen={isMobileDrawerOpen}
        onOpenDrawer={() => setIsMobileDrawerOpen(true)}
        onCloseDrawer={() => setIsMobileDrawerOpen(false)}
      />

      {/* Toast Feedback Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
