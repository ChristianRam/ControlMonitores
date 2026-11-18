-- =====================================================================
-- Cambios de base de datos para las modificaciones 2026-II
-- Ejecutar en Supabase > SQL Editor. REVISAR antes de ejecutar: no se
-- conoce el esquema real (columnas/RPC existentes), así que adapta nombres
-- si alguno no coincide. Haz primero una copia de seguridad.
-- =====================================================================

-- 1) Programa académico: si public.monitores.programa_academico tiene un CHECK
--    o un ENUM, debe aceptar los 5 programas nuevos.
--    (Ejemplo si es CHECK; ajusta el nombre real de la restricción.)
-- ALTER TABLE public.monitores DROP CONSTRAINT IF EXISTS monitores_programa_academico_check;
-- ALTER TABLE public.monitores ADD CONSTRAINT monitores_programa_academico_check
--   CHECK (programa_academico IN (
--     'Administración de Empresas','Administración Financiera',
--     'Administración Turística y Hotelera','Contaduría Pública','Economía'));

-- 2) "Otras actividades" como un ítem más de public.laboratorios
INSERT INTO public.laboratorios (nombre, codigo, estado)
SELECT 'Otras actividades', 'OTRAS-ACT', 'disponible'
WHERE NOT EXISTS (SELECT 1 FROM public.laboratorios WHERE codigo = 'OTRAS-ACT');
-- IMPORTANTE: la función registrar_inicio_turno NO debe marcar 'OTRAS-ACT' como
-- 'en_uso' ni rechazar un segundo monitor en esa opción (varios monitores pueden
-- estar en "otras actividades" a la vez). Revisa esa función.

-- 3) Nombre del laboratorio en el nombre de las salas (opcional)
-- UPDATE public.laboratorios SET nombre = replace(nombre, 'Sala Tecnológica', 'Sala') ...;

-- 4) Validación: no permitir el mismo Photo Code en ninguna entrada/salida.
--    (La app ya lo valida; esto lo garantiza en el servidor.)
--    Ajusta los nombres de columna si difieren.
CREATE UNIQUE INDEX IF NOT EXISTS asistencias_codigo_entrada_uq
  ON public.asistencias (upper(timemark_entrada_codigo))
  WHERE timemark_entrada_codigo IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS asistencias_codigo_salida_uq
  ON public.asistencias (upper(timemark_salida_codigo))
  WHERE timemark_salida_codigo IS NOT NULL;

CREATE OR REPLACE FUNCTION public.validar_codigos_distintos()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.timemark_entrada_codigo IS NOT NULL
     AND NEW.timemark_salida_codigo IS NOT NULL
     AND upper(NEW.timemark_entrada_codigo) = upper(NEW.timemark_salida_codigo) THEN
    RAISE EXCEPTION 'El código de entrada y el de salida no pueden ser iguales';
  END IF;
  IF NEW.timemark_salida_codigo IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.asistencias a
    WHERE a.id <> NEW.id AND upper(a.timemark_entrada_codigo) = upper(NEW.timemark_salida_codigo)
  ) THEN
    RAISE EXCEPTION 'El código de salida ya fue usado como código de entrada';
  END IF;
  IF NEW.timemark_entrada_codigo IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.asistencias a
    WHERE a.id <> NEW.id AND upper(a.timemark_salida_codigo) = upper(NEW.timemark_entrada_codigo)
  ) THEN
    RAISE EXCEPTION 'El código de entrada ya fue usado como código de salida';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_validar_codigos_distintos ON public.asistencias;
CREATE TRIGGER trg_validar_codigos_distintos
  BEFORE INSERT OR UPDATE ON public.asistencias
  FOR EACH ROW EXECUTE FUNCTION public.validar_codigos_distintos();

-- 5) Cierre automático de turnos que superan 8 h 10 min sin salida.
--    La app llama a esta función cuando detecta el vencimiento; además se
--    programa cada 5 minutos con pg_cron para cubrir el caso en que el
--    monitor cierre la página.
--    AJUSTA: nombres de columnas/estados según tu tabla. Las horas se limitan a 8.17.
CREATE OR REPLACE FUNCTION public.cerrar_turnos_vencidos(p_max_minutos int DEFAULT 490)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  WITH vencidos AS (
    UPDATE public.asistencias a
       SET hora_salida = ((a.fecha + a.hora_entrada) + make_interval(mins => p_max_minutos))::time,
           horas_calculadas = round(p_max_minutos / 60.0, 2),
           estado = 'observacion',
           notas_coordinador = 'Turno cerrado automáticamente: superó 8 h 10 min sin marcar salida.'
     WHERE a.estado = 'en_curso'
       AND now() AT TIME ZONE 'America/Bogota' >= (a.fecha + a.hora_entrada) + make_interval(mins => p_max_minutos)
    RETURNING a.monitor_id, a.laboratorio_id
  ), m AS (
    UPDATE public.monitores SET estado = 'activo'
     WHERE id IN (SELECT monitor_id FROM vencidos) AND estado = 'en_turno'
  ), l AS (
    UPDATE public.laboratorios SET estado = 'disponible', monitor_actual_id = NULL
     WHERE id IN (SELECT laboratorio_id FROM vencidos) AND codigo <> 'OTRAS-ACT'
  )
  SELECT count(*) INTO n FROM vencidos;
  RETURN n;
END $$;

-- Versión que llama la app (cualquier monitor autenticado dispara el cierre de turnos vencidos)
CREATE OR REPLACE FUNCTION public.cerrar_turno_vencido(p_max_minutos int DEFAULT 490)
RETURNS int LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.cerrar_turnos_vencidos(p_max_minutos);
$$;
GRANT EXECUTE ON FUNCTION public.cerrar_turno_vencido(int) TO authenticated;

-- Programación automática (requiere habilitar la extensión pg_cron en Supabase):
-- SELECT cron.schedule('cerrar-turnos-vencidos', '*/5 * * * *', $$SELECT public.cerrar_turnos_vencidos(490)$$);

-- 6) Cambio de coordinador: de Angie Paola a Ana María Aldana.
--    a) En Supabase > Authentication > Users: crea el usuario
--       ana.aldana@usco.edu.co (con contraseña) o cambia el correo del usuario del coordinador.
--    b) Luego ejecuta (reemplaza el correo viejo de Angie Paola):
-- UPDATE public.perfiles SET role = 'monitor' WHERE email = '<correo_angie_paola>';   -- o elimínala
-- INSERT INTO public.perfiles (id, email, nombre_completo, role)
--   SELECT id, email, 'Ana María Aldana', 'admin'
--   FROM auth.users WHERE email = 'ana.aldana@usco.edu.co'
--   ON CONFLICT (id) DO UPDATE SET nombre_completo = 'Ana María Aldana', role = 'admin';
-- La función obtener_coordinador_activo (usada en certificados) debe devolver
-- 'Ana María Aldana'; revisa que lea de public.perfiles con role = 'admin'.
