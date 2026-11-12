import React from 'react';
import { EstadoMonitor, EstadoLaboratorio, EstadoAsistencia, EstadoNovedad, ResultadoVerificacionTimemark } from '../../types/database';
import { CheckCircle2, Clock, AlertTriangle, AlertCircle, Ban, Activity, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';

interface StatusBadgeProps {
  type: 'monitor' | 'laboratorio' | 'asistencia' | 'novedad' | 'timemark';
  value: EstadoMonitor | EstadoLaboratorio | EstadoAsistencia | EstadoNovedad | ResultadoVerificacionTimemark | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value }) => {
  // Paleta Institucional: Azul (#003561), Vinotinto (#8F141B), Gris (#4D626C), Ocre (#DFD4A6)

  if (type === 'timemark') {
    switch (value) {
      case 'Auténtico':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#003561] bg-[#003561]/10 px-2 py-0.5 rounded border border-[#003561]/30">
            <ShieldCheck className="w-3.5 h-3.5 text-[#003561]" />
            Timemark: Auténtico
          </span>
        );
      case 'Pendiente':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6E6130] bg-[#DFD4A6]/30 px-2 py-0.5 rounded border border-[#c9bea0]">
            <Clock className="w-3.5 h-3.5 text-[#7a6e3e]" />
            Timemark: Pendiente
          </span>
        );
      case 'Falso':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8F141B] bg-[#8F141B]/10 px-2 py-0.5 rounded border border-[#8F141B]/30">
            <ShieldAlert className="w-3.5 h-3.5 text-[#8F141B]" />
            Timemark: Falso / Alterado
          </span>
        );
      case 'No encontrado':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4D626C] bg-[#4D626C]/10 px-2 py-0.5 rounded border border-[#4D626C]/30">
            <ShieldQuestion className="w-3.5 h-3.5 text-[#4D626C]" />
            Timemark: No encontrado
          </span>
        );
      case 'No se puede verificar':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            Timemark: No verificable
          </span>
        );
      default:
        return <span className="text-xs text-slate-600">{value}</span>;
    }
  }

  if (type === 'monitor') {
    switch (value) {
      case 'en_turno':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#003561] bg-[#003561]/10 px-2 py-0.5 rounded border border-[#003561]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8F141B] animate-pulse" />
            En Turno
          </span>
        );
      case 'activo':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4D626C] bg-[#4D626C]/10 px-2 py-0.5 rounded border border-[#4D626C]/25">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#003561]" />
            Activo
          </span>
        );
      case 'inactivo':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            <Ban className="w-3.5 h-3.5 text-slate-400" />
            Inactivo
          </span>
        );
      default:
        return <span className="text-xs text-slate-600">{value}</span>;
    }
  }

  if (type === 'laboratorio') {
    switch (value) {
      case 'disponible':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#003561] bg-[#003561]/10 px-2.5 py-1 rounded border border-[#003561]/25">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#003561]" />
            Disponible
          </span>
        );
      case 'en_uso':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8F141B] bg-[#8F141B]/10 px-2.5 py-1 rounded border border-[#8F141B]/25">
            <Activity className="w-3.5 h-3.5 text-[#8F141B]" />
            En Servicio Activo
          </span>
        );
      case 'mantenimiento':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7a6e3e] bg-[#DFD4A6]/30 px-2.5 py-1 rounded border border-[#c9bea0]">
            <AlertTriangle className="w-3.5 h-3.5 text-[#7a6e3e]" />
            Mantenimiento
          </span>
        );
      default:
        return <span className="text-xs text-slate-600">{value}</span>;
    }
  }

  if (type === 'asistencia') {
    switch (value) {
      case 'en_curso':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#003561] bg-[#003561]/10 px-2 py-0.5 rounded border border-[#003561]/30">
            <Clock className="w-3 h-3 text-[#003561]" />
            En curso
          </span>
        );
      case 'pendiente_validacion':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#7a6e3e] bg-[#DFD4A6]/30 px-2 py-0.5 rounded border border-[#c9bea0]">
            <Clock className="w-3 h-3 text-[#7a6e3e]" />
            Por validar
          </span>
        );
      case 'aprobada':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#003561] bg-[#003561]/10 px-2 py-0.5 rounded border border-[#003561]/30">
            <CheckCircle2 className="w-3 h-3 text-[#003561]" />
            Aprobada
          </span>
        );
      case 'observacion':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
            <AlertCircle className="w-3 h-3 text-amber-700" />
            Con observación
          </span>
        );
      case 'rechazada':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#8F141B] bg-[#8F141B]/10 px-2 py-0.5 rounded border border-[#8F141B]/30">
            <AlertCircle className="w-3 h-3 text-[#8F141B]" />
            Rechazada
          </span>
        );
      default:
        return <span className="text-xs text-slate-600">{value}</span>;
    }
  }

  if (type === 'novedad') {
    switch (value) {
      case 'pendiente':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#7a6e3e] bg-[#DFD4A6]/30 px-2 py-0.5 rounded border border-[#c9bea0]">
            <Clock className="w-3 h-3 text-[#7a6e3e]" />
            Pendiente
          </span>
        );
      case 'aprobada':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#003561] bg-[#003561]/10 px-2 py-0.5 rounded border border-[#003561]/30">
            <CheckCircle2 className="w-3 h-3 text-[#003561]" />
            Resuelta (Aprobada)
          </span>
        );
      case 'rechazada':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#8F141B] bg-[#8F141B]/10 px-2 py-0.5 rounded border border-[#8F141B]/30">
            <AlertCircle className="w-3 h-3 text-[#8F141B]" />
            Rechazada
          </span>
        );
      default:
        return <span className="text-xs text-slate-600">{value}</span>;
    }
  }

  return <span className="text-xs text-slate-600">{value}</span>;
};
