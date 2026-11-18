import type { ProgramaAcademico } from '../types/database';

/** Nombre oficial que se muestra en toda la aplicación. */
export const NOMBRE_LABORATORIO = 'Laboratorio Tecnológico - José Ignacio Hémbuz Palomino';

/** Periodo académico vigente. */
export const PERIODO_CODIGO = '2026-II';
export const PERIODO_NOMBRE = 'Periodo Académico 2026-II';

/** Programas de la facultad (lista oficial, en este orden). */
export const PROGRAMAS_ACADEMICOS: ProgramaAcademico[] = [
  'Administración de Empresas',
  'Administración Financiera',
  'Administración Turística y Hotelera',
  'Contaduría Pública',
  'Economía',
];

/** Código de la opción "Otras actividades" (se registra en public.laboratorios). */
export const OTRAS_ACTIVIDADES_CODE = 'OTRAS-ACT';

/** Enlace para tomar la evidencia fotográfica (app Timemark). */
export const LINK_TOMAR_EVIDENCIA = 'https://apps.apple.com/app/id6446071834';

/** Duración máxima de un turno abierto: 8 h 10 min. */
export const MAX_TURNO_MINUTOS = 8 * 60 + 10;
