// Edge Function: gestionar-monitores
// Permite al COORDINADOR crear y eliminar monitores (cuenta de Auth + perfil + registro).
// Se despliega con:  supabase functions deploy gestionar-monitores
// Usa la service role key (inyectada automáticamente por Supabase), nunca expuesta al navegador.

import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization') ?? '';

    const admin = createClient(url, serviceKey);

    // 1. Verificar que quien llama es un coordinador (role = admin en public.perfiles)
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: 'Sesión no válida.' }, 401);

    const { data: perfil } = await admin
      .from('perfiles')
      .select('role')
      .eq('id', userData.user.id)
      .maybeSingle();
    if (perfil?.role !== 'admin') return json({ error: 'Solo el coordinador puede gestionar monitores.' }, 403);

    const body = await req.json();

    // 2. Crear monitor
    if (body.accion === 'crear') {
      const {
        nombres, apellidos, codigo_estudiantil, correo_institucional,
        programa_academico, semestre, telefono, password, horas_asignadas,
      } = body;

      if (!nombres || !apellidos || !codigo_estudiantil || !correo_institucional || !password) {
        return json({ error: 'Faltan campos obligatorios.' }, 400);
      }

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: correo_institucional,
        password,
        email_confirm: true,
        user_metadata: { nombre_completo: `${nombres} ${apellidos}` },
      });
      if (createErr || !created.user) {
        return json({ error: `No se pudo crear la cuenta: ${createErr?.message ?? 'error desconocido'}` }, 400);
      }
      const uid = created.user.id;

      const rollback = async () => {
        await admin.from('perfiles').delete().eq('id', uid);
        await admin.auth.admin.deleteUser(uid);
      };

      const { error: perfilErr } = await admin.from('perfiles').insert({
        id: uid,
        email: correo_institucional,
        nombre_completo: `${nombres} ${apellidos}`,
        role: 'monitor',
      });
      if (perfilErr) {
        await rollback();
        return json({ error: `No se pudo crear el perfil: ${perfilErr.message}` }, 400);
      }

      const { error: monErr } = await admin.from('monitores').insert({
        user_id: uid,
        nombres,
        apellidos,
        codigo_estudiantil,
        correo_institucional,
        programa_academico,
        semestre,
        telefono,
        horas_asignadas: horas_asignadas ?? 112,
        horas_aprobadas: 0,
        horas_pendientes: 0,
        estado: 'activo',
      });
      if (monErr) {
        await rollback();
        return json({ error: `No se pudo crear el registro del monitor: ${monErr.message}` }, 400);
      }

      return json({ ok: true });
    }

    // 3. Eliminar monitor
    if (body.accion === 'eliminar') {
      const { data: monitor } = await admin
        .from('monitores')
        .select('id, user_id, estado')
        .eq('id', body.monitor_id)
        .maybeSingle();
      if (!monitor) return json({ error: 'El monitor no existe.' }, 404);
      if (monitor.estado === 'en_turno') return json({ error: 'El monitor está en turno.' }, 400);

      const { error: delMonErr } = await admin.from('monitores').delete().eq('id', monitor.id);
      if (delMonErr) {
        return json({
          error: `No se pudo eliminar (${delMonErr.message}). Si el monitor tiene asistencias registradas, inactívalo en lugar de eliminarlo.`,
        }, 400);
      }

      if (monitor.user_id) {
        await admin.from('perfiles').delete().eq('id', monitor.user_id);
        await admin.auth.admin.deleteUser(monitor.user_id);
      }
      return json({ ok: true });
    }

    return json({ error: 'Acción no reconocida.' }, 400);
  } catch (e) {
    return json({ error: `Error interno: ${(e as Error).message}` }, 500);
  }
});
