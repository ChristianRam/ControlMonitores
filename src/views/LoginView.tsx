import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  GraduationCap, 
  Lock, 
  Mail, 
  ArrowRight,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { NOMBRE_LABORATORIO, PERIODO_NOMBRE } from '../lib/constants';

export const LoginView: React.FC = () => {
  const { login, authLoading, authError, clearAuthError } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const errorMessage = localError || authError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setLocalError('Por favor ingresa tu correo institucional y contraseña.');
      return;
    }

    await login(trimmedEmail, password);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Visual Banner in USCO Vinotinto */}
        <div className="lg:col-span-5 bg-[#8F141B] text-white p-8 flex flex-col justify-between relative overflow-hidden">
          {/* Background image overlay */}
          <div className="absolute inset-0 opacity-15 bg-cover bg-center pointer-events-none" style={{ backgroundImage: "url('/src/assets/images/laboratorio_tecnologico_usco_1794373219963.jpg')" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#5E0C11] via-[#8F141B]/90 to-transparent pointer-events-none" />

          {/* Top Brand */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#6E0F14] border border-[#DFD4A6]/40 flex items-center justify-center text-[#DFD4A6] shadow-md shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white">Control de Monitores</h1>
                <p className="text-xs text-[#DFD4A6] font-medium">Universidad Surcolombiana - Sede Neiva</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-white/90">
              <div className="inline-block px-2.5 py-0.5 rounded bg-[#6E0F14] text-[#DFD4A6] text-[11px] font-bold tracking-wide border border-[#DFD4A6]/35">
                Facultad de Economía y Administración
              </div>
              <h2 className="text-base font-bold text-white tracking-tight mt-1">
                {NOMBRE_LABORATORIO}
              </h2>
              <p className="leading-relaxed text-white/90">
                Sistema institucional para el control de asistencia, verificación de evidencias con Timemark y seguimiento de horas de cumplimiento en el laboratorio.
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
              <span>Generación de certificados oficiales de cumplimiento</span>
            </div>
          </div>

          {/* Bottom Supabase Notice */}
          <div className="relative z-10 pt-4 border-t border-white/15 flex items-center gap-2 text-[11px] text-slate-300">
            <Database className="w-3.5 h-3.5 text-[#DFD4A6]" />
            <span>Autenticación segura con Supabase</span>
          </div>
        </div>

        {/* Right Form Container */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Iniciar Sesión</h2>
            <p className="text-sm text-slate-600 mt-1">
              Ingresa con tu correo institucional y contraseña registrados en el sistema.
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mt-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs"
            >
              <AlertCircle className="w-4 h-4 text-[#8F141B] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#8F141B]">No fue posible acceder</p>
                <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

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
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) {
                      setLocalError(null);
                      clearAuthError();
                    }
                  }}
                  placeholder="usuario@usco.edu.co"
                  autoComplete="email"
                  disabled={authLoading}
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#8F141B]/20 focus:border-[#8F141B] text-slate-900 outline-none transition-colors disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) {
                      setLocalError(null);
                      clearAuthError();
                    }
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={authLoading}
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#8F141B]/20 focus:border-[#8F141B] text-slate-900 outline-none transition-colors disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full mt-2 py-2.5 px-4 bg-[#8F141B] hover:bg-[#751016] disabled:bg-[#8F141B]/70 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando sesión...</span>
                </>
              ) : (
                <>
                  <span>Acceder al Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#4D626C]">
            <span>{PERIODO_NOMBRE}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
