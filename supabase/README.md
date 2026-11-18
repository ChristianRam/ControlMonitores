# Pasos en Supabase (cambios 2026-II)

El código de la app ya está listo. Algunas funciones necesitan estos pasos en Supabase:

## 1. Ejecutar el SQL
Abre **Supabase → SQL Editor** y ejecuta `cambios_2026-II.sql`. Revísalo antes: hay
bloques comentados que debes adaptar a tus tablas. Este archivo:
- Crea la opción **Otras actividades** (`OTRAS-ACT`) en `laboratorios`.
- Impide repetir códigos Timemark en entrada y salida.
- Crea `cerrar_turno_vencido`, que cierra los turnos abiertos al cumplir 8 h 10 min.
- Incluye los pasos para dejar como coordinadora a **Ana María Aldana** (`ana.aldana@usco.edu.co`).

Opcional: activa la extensión `pg_cron` y descomenta la línea `cron.schedule`. Así los
turnos vencidos se cierran aunque nadie tenga la página abierta.

## 2. Desplegar la función para registrar y eliminar monitores
Con la [CLI de Supabase](https://supabase.com/docs/guides/cli) instalada:

```bash
supabase login
supabase link --project-ref <ID_DEL_PROYECTO>
supabase functions deploy gestionar-monitores
```

La función usa la clave `service_role` que Supabase le inyecta automáticamente. Esa clave
no debe ponerse nunca en el `.env` del frontend.

## 3. Revisar `registrar_inicio_turno`
Esa función (RPC) no está en este repositorio. Verifica que permita a varios monitores
usar **Otras actividades** al mismo tiempo y que no la marque como `en_uso`.

## 4. Coordinadora
1. En **Authentication → Users**, crea `ana.aldana@usco.edu.co`.
2. Ejecuta el bloque 6 del SQL para darle el rol `admin` en `perfiles`.
3. Quita el rol `admin` a la cuenta anterior.
