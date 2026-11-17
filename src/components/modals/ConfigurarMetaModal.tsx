import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Target, CheckCircle2, Clock } from 'lucide-react';

interface ConfigurarMetaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfigurarMetaModal: React.FC<ConfigurarMetaModalProps> = ({ isOpen, onClose }) => {
  const { metaGeneralHoras, configurarMetaGeneral, monitores } = useApp();
  const [horasInput, setHorasInput] = useState<number>(metaGeneralHoras);
  const [actualizarTodos, setActualizarTodos] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    configurarMetaGeneral(horasInput, actualizarTodos);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#8F141B]/10 rounded-lg text-[#8F141B]">
              <Target className="w-5 h-5 text-[#8F141B]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Configurar Meta de Cumplimiento
              </h3>
              <p className="text-xs text-[#4D626C]">Salas Facultad de Economía y Administración</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Meta General de Cumplimiento (Horas) *
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="500"
                step="1"
                required
                value={horasInput}
                onChange={(e) => setHorasInput(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm font-mono font-bold outline-none focus:bg-white focus:border-[#8F141B]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                horas
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
              Define la meta general requerida para el cumplimiento de horas de monitoría en el periodo.
            </p>
          </div>

          {/* Quick preset buttons */}
          <div>
            <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
              Valores sugeridos:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHorasInput(112)}
                className={`px-3 py-1 text-xs rounded border transition-colors font-mono cursor-pointer ${
                  horasInput === 112 
                    ? 'bg-[#8F141B] text-white border-[#8F141B] font-bold' 
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                112 hrs (Estándar)
              </button>
              <button
                type="button"
                onClick={() => setHorasInput(80)}
                className={`px-3 py-1 text-xs rounded border transition-colors font-mono cursor-pointer ${
                  horasInput === 80 
                    ? 'bg-[#8F141B] text-white border-[#8F141B] font-bold' 
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                80 hrs
              </button>
              <button
                type="button"
                onClick={() => setHorasInput(120)}
                className={`px-3 py-1 text-xs rounded border transition-colors font-mono cursor-pointer ${
                  horasInput === 120 
                    ? 'bg-[#8F141B] text-white border-[#8F141B] font-bold' 
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                120 hrs
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={actualizarTodos}
                onChange={(e) => setActualizarTodos(e.target.checked)}
                className="mt-0.5 rounded text-[#8F141B] focus:ring-[#8F141B] accent-[#8F141B]"
              />
              <span className="text-[11px] text-slate-700 leading-normal">
                Actualizar automáticamente la meta a los <strong>{monitores.length} monitores</strong> registrados en el sistema.
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#8F141B] hover:bg-[#721015] text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Guardar Meta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
