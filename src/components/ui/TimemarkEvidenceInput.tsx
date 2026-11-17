import React, { useRef } from 'react';
import { ShieldCheck, Upload, X } from 'lucide-react';
import { ArchivoEvidencia } from '../../types/database';
import {
  formatEvidenciaFileSize,
  normalizePhotoCode,
  validarArchivoEvidencia,
} from '../../lib/timemark';

interface TimemarkEvidenceInputProps {
  tipo: 'entrada' | 'salida';
  inputId: string;
  codigo: string;
  onCodigoChange: (value: string) => void;
  foto: ArchivoEvidencia | null;
  onFotoChange: (archivo: ArchivoEvidencia | null) => void;
  onValidationError?: (message: string, title?: string) => void;
  onFileLoaded?: (archivo: ArchivoEvidencia) => void;
  onClearError?: () => void;
  disabled?: boolean;
  codePlaceholder?: string;
}

export const TimemarkEvidenceInput: React.FC<TimemarkEvidenceInputProps> = ({
  tipo,
  inputId,
  codigo,
  onCodigoChange,
  foto,
  onFotoChange,
  onValidationError,
  onFileLoaded,
  onClearError,
  disabled = false,
  codePlaceholder = 'Ej. TMK20268193FE',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const etiquetaMomento = tipo === 'entrada' ? 'Entrada' : 'Salida';
  const codigoLen = codigo.trim().length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onClearError?.();

    const check = validarArchivoEvidencia(file);
    if (!check.valid) {
      onValidationError?.(check.error || 'Archivo inválido.', 'Archivo Inválido');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = typeof event.target?.result === 'string' ? event.target.result : '';
      const evidencia: ArchivoEvidencia = {
        dataUrl,
        nombre: file.name,
        tamano: file.size,
        tipoMime: file.type,
        file,
      };
      onFotoChange(evidencia);
      onFileLoaded?.(evidencia);
    };
    reader.onerror = () => {
      onValidationError?.(
        'No se pudo leer la fotografía seleccionada desde tu dispositivo.',
        'Error de Lectura'
      );
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    onFotoChange(null);
    onClearError?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#8F141B]" />
        <span className="text-xs font-bold text-slate-900">
          Evidencia Original de {etiquetaMomento} (Timemark App) *
        </span>
      </div>

      <p className="text-[11px] text-[#4D626C]">
        {tipo === 'entrada'
          ? 'Toma la fotografía en la entrada de la sala con la aplicación Timemark de tu dispositivo móvil y cárgala en formato JPEG, PNG o WEBP (máximo 5 MB) junto con su Photo Code de 14 caracteres.'
          : 'Toma la fotografía al finalizar tu turno con la aplicación Timemark y cárgala en formato JPEG, PNG o WEBP (máximo 5 MB) junto con su Photo Code de 14 caracteres.'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
        {/* Campo Photo Code */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor={`${inputId}-code`} className="text-[11px] font-semibold text-slate-700">
              Photo Code de {etiquetaMomento} (14 caracteres) *
            </label>
            <span className="text-[10px] font-mono text-[#4D626C]">{codigoLen} / 14</span>
          </div>
          <input
            id={`${inputId}-code`}
            type="text"
            required
            maxLength={14}
            disabled={disabled}
            value={codigo}
            onChange={(e) => {
              onCodigoChange(normalizePhotoCode(e.target.value));
              onClearError?.();
            }}
            placeholder={codePlaceholder}
            className={`w-full px-3 py-2 text-xs bg-white border rounded-lg text-slate-900 font-mono font-semibold outline-none transition-colors disabled:opacity-60 ${
              codigoLen === 14
                ? 'border-emerald-600 ring-1 ring-emerald-600/20'
                : codigoLen > 0
                ? 'border-amber-400'
                : 'border-slate-300'
            }`}
          />
          <div className="mt-1 text-[10px]">
            {codigoLen === 14 ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                ✓ Formato de 14 caracteres alfanuméricos válido
              </span>
            ) : (
              <span className="text-[#4D626C]">
                Ingresa los 14 caracteres alfanuméricos del Photo Code de Timemark.
              </span>
            )}
          </div>
        </div>

        {/* Carga de fotografía original */}
        <div>
          <label htmlFor={inputId} className="block text-[11px] font-semibold text-slate-700 mb-1">
            Fotografía Original de {etiquetaMomento} (JPEG, PNG, WEBP · máx. 5 MB) *
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={disabled}
            onChange={handleFileChange}
            className="hidden"
            id={inputId}
          />
          {!foto ? (
            <label
              htmlFor={inputId}
              className={`w-full py-2.5 px-3 bg-white border border-dashed border-slate-300 hover:border-[#8F141B] rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 ${
                disabled ? 'opacity-60 pointer-events-none' : 'cursor-pointer'
              }`}
            >
              <Upload className="w-4 h-4 text-[#8F141B]" />
              <span>Cargar Fotografía Timemark Original</span>
            </label>
          ) : (
            <div className="p-2.5 bg-white border border-[#8F141B]/30 rounded-lg flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={foto.dataUrl}
                  alt={`Previsualización ${tipo}`}
                  className="w-10 h-10 object-cover rounded border border-slate-200 shrink-0"
                />
                <div className="min-w-0 text-[11px]">
                  <p className="font-semibold text-slate-900 truncate">{foto.nombre}</p>
                  <p className="text-slate-500 font-mono text-[10px]">
                    {formatEvidenciaFileSize(foto.tamano)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={handleRemoveFile}
                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer shrink-0 disabled:opacity-50"
                title="Quitar fotografía"
                aria-label={`Quitar fotografía de ${tipo}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
