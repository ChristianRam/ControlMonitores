import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  GraduationCap, 
  Lock, 
  Mail, 
  ShieldCheck, 
  UserCheck, 
  ArrowRight,
  Database,
  Building2,
  CheckCircle2
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useApp();
  const [email, setEmail] = useState('coordinacion.laboratorios.fea@usco.edu.co');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'monitor'>('admin');
  const [logoError, setLogoError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(selectedRole, email);
  };

  const handleQuickLogin = (role: 'admin' | 'monitor') => {
    if (role === 'admin') {
      setEmail('coordinacion.laboratorios.fea@usco.edu.co');
      setSelectedRole('admin');
      login('admin', 'coordinacion.laboratorios.fea@usco.edu.co');
    } else {
      setEmail('valentina.rodriguez@usco.edu.co');
      setSelectedRole('monitor');
      login('monitor', 'valentina.rodriguez@usco.edu.co');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Visual Banner with Lab Photography in Azul FEA */}
        <div className="lg:col-span-5 bg-[#003561] text-white p-8 flex flex-col justify-between relative overflow-hidden">
          {/* Background image overlay */}
          <div className="absolute inset-0 opacity-15 bg-cover bg-center pointer-events-none" style={{ backgroundImage: "url('/src/assets/images/laboratorio_tecnologico_usco_1794373219963.jpg')" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#002545] via-[#003561]/90 to-transparent pointer-events-none" />

          {/* Top Brand */}
          <div className="relative z-10">
            {!logoError ? (
              <div className="mb-4 bg-white/95 rounded-lg p-2 max-w-[210px] shadow-sm">
                <img
                  src="https://www.usco.edu.co/imagen-institucional/facultades/economia-y-administracion.png"
                  alt="Facultad de Economía y Administración - Universidad Surcolombiana"
                  className="h-10 w-auto object-contain"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#8F141B] flex items-center justify-center text-white shadow-md">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-white">ControlMonitores</h1>
                  <p className="text-xs text-[#DFD4A6] font-medium">Universidad Surcolombiana</p>
                </div>
              </div>
            )}

            <div className="mt-4 space-y-2 text-xs text-slate-200">
              <div className="inline-block px-2 py-0.5 rounded bg-[#002545] text-[#DFD4A6] text-[11px] font-bold uppercase tracking-wider border border-[#DFD4A6]/30">
                Facultad de Economía y Administración
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight mt-1">Control de Monitores</h2>
              <p className="leading-relaxed text-slate-200">
                Sistema institucional para el control de asistencia, verificación de evidencias con Timemark y seguimiento de horas de cumplimiento en salas y laboratorios.
              </p>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="relative z-10 my-6 space-y-2.5">
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-[#DFD4A6] shrink-0" />
              <span>Verificación de evidencias fotográficas Timemark</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-[#DFD4A6] shrink-0" />
              <span>Validación de turnos y aprobación de horas</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-[#DFD4A6] shrink-0" />
              <span>Generación de certificados oficiales de paz y salvo</span>
            </div>
          </div>

          {/* Bottom Supabase Notice */}
          <div className="relative z-10 pt-4 border-t border-white/15 flex items-center gap-2 text-[11px] text-slate-300">
            <Database className="w-3.5 h-3.5 text-[#DFD4A6]" />
            <span>Arquitectura lista para Supabase</span>
          </div>
        </div>

        {/* Right Form Container */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Iniciar Sesión</h2>
            <p className="text-sm text-slate-600 mt-1">
              Ingresa con tu correo institucional asignado por la Universidad Surcolombiana.
            </p>
          </div>

          {/* Quick Demo Access Buttons */}
          <div className="mt-6 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <span>Acceso de demostración interactiva:</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="flex items-center justify-between p-2.5 bg-white border border-slate-200 hover:border-[#8F141B] hover:bg-[#8F141B]/5 rounded-lg text-left transition-all group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#8F141B]" />
                    <span>Coordinador FEA</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Panel administrativo & Timemark</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#8F141B] group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('monitor')}
                className="flex items-center justify-between p-2.5 bg-white border border-slate-200 hover:border-[#003561] hover:bg-[#003561]/5 rounded-lg text-left transition-all group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#003561]" />
                    <span>Monitor Académico</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Registro de turno con Timemark</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#003561] group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correo Electrónico Institucional
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@usco.edu.co"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003561]/20 focus:border-[#003561] text-slate-900 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Contraseña
                </label>
                <span className="text-[11px] text-[#003561] hover:underline cursor-pointer">
                  ¿Olvidaste tu clave?
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003561]/20 focus:border-[#003561] text-slate-900 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="remember"
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-[#8F141B] rounded border-slate-300 focus:ring-[#8F141B]"
              />
              <label htmlFor="remember" className="text-xs text-slate-600 cursor-pointer">
                Recordar dispositivo de confianza
              </label>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-4 bg-[#8F141B] hover:bg-[#751016] text-white font-semibold text-sm rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Acceder al Sistema</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Periodo Académico 2026 - I</span>
            <span className="flex items-center gap-1 text-slate-700 font-medium">
              <Building2 className="w-3.5 h-3.5 text-[#003561]" />
              Campus Central USCO · Neiva
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
