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

const MainLayout: React.FC = () => {
  const { currentUser, currentRole, activeTab } = useApp();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Si no hay usuario autenticado o está explícitamente en la vista de login
  if (!currentUser || activeTab === 'login') {
    return <LoginView />;
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
