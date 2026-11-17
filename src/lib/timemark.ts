export const EVIDENCIAS_BUCKET = 'evidencias-timemark';
export const MAX_EVIDENCIA_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_EVIDENCIA_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const TIMEMARK_PHOTO_CODE_REGEX = /^[A-Z0-9]{14}$/;

export const normalizePhotoCode = (code: string): string =>
  code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 14);

export const validarFormatoPhotoCode = (
  code?: string
): { valid: boolean; clean: string; error?: string } => {
  const clean = (code || '').trim().toUpperCase();

  if (!clean) {
    return {
      valid: false,
      clean,
      error: 'Debes ingresar el Photo Code de 14 caracteres impreso en tu fotografía de Timemark.',
    };
  }

  if (!TIMEMARK_PHOTO_CODE_REGEX.test(clean)) {
    return {
      valid: false,
      clean,
      error: `El Photo Code ingresado tiene ${clean.length} caracteres. Debe tener exactamente 14 caracteres alfanuméricos (solo letras y números).`,
    };
  }

  return { valid: true, clean };
};

export const formatEvidenciaFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const validarArchivoEvidencia = (
  file?: File | null
): { valid: boolean; error?: string } => {
  if (!file) {
    return {
      valid: false,
      error: 'Debes seleccionar el archivo de fotografía original tomada con Timemark desde tu dispositivo.',
    };
  }

  if (!ALLOWED_EVIDENCIA_MIME_TYPES.includes(file.type as (typeof ALLOWED_EVIDENCIA_MIME_TYPES)[number])) {
    return {
      valid: false,
      error: 'Formato de imagen no permitido. Solo se admiten fotografías originales JPEG, PNG o WEBP.',
    };
  }

  if (file.size <= 0 || file.size > MAX_EVIDENCIA_BYTES) {
    return {
      valid: false,
      error: `El archivo "${file.name}" (${formatEvidenciaFileSize(file.size)}) supera el límite máximo permitido de 5 MB.`,
    };
  }

  return { valid: true };
};

export const getExtensionForMime = (mimeType: string): string => {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'jpg';
  }
};

export const buildUniqueEvidenciaPath = (
  authUid: string,
  mimeType: string,
  tipo: 'entrada' | 'salida'
): string => {
  const randomSuffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  const identificador = `${Date.now()}_${randomSuffix}`;
  const ext = getExtensionForMime(mimeType);
  return `${authUid}/${identificador}_${tipo}.${ext}`;
};
