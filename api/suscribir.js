import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { nombre, email, fechaNacimiento, pais } = req.body;

    if (!nombre || !email || !fechaNacimiento || !pais) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const fechaNac = new Date(fechaNacimiento);
    const hoy = new Date();
    if (fechaNac > hoy) {
      return res.status(400).json({ error: 'Fecha de nacimiento inválida' });
    }

    const edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    const edadFinal = mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate()) ? edad - 1 : edad;

    if (edadFinal < 13 || edadFinal > 120) {
      return res.status(400).json({ error: 'Edad fuera de rango válido' });
    }

    const emailLimpio = email.toLowerCase().trim();

    const { data: existente } = await supabase
      .from('suscriptores')
      .select('id')
      .eq('email', emailLimpio)
      .single();

    if (existente) {
      return res.status(409).json({
        error: 'Este email ya está registrado',
        mensaje: 'Ya te enviamos los libros. Revisa tu bandeja de entrada.'
      });
    }

    const { data: nuevo, error: errIns } = await supabase
      .from('suscriptores')
      .insert([{
        nombre: nombre.trim(),
        email: emailLimpio,
        fecha_nacimiento: fechaNacimiento,
        edad: edadFinal,
        pais: pais,
        email_enviado: false
      }])
      .select()
      .single();

    if (errIns) {
      console.error('Error insertando:', errIns);
      return res.status(500).json({ error: 'Error al guardar en base de datos' });
    }

    try {
      await resend.emails.send({
        from: 'Equilibrioalfa <onboarding@resend.dev>',
        to: emailLimpio,
        subject: '¡Bienvenido a Equilibrioalfa! Tus libros te esperan 📚',
        html: `
          <div style="font-family: Georgia, serif; color: #2C2C2C; line-height: 1.7; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1B3A57;">¡Bienvenido a Equilibrioalfa, ${nombre}!</h1>
            <p>Gracias por unirte a nuestra comunidad de transformación personal.</p>
            <p>Pronto recibirás los libros en tu correo.</p>
            <p>Un abrazo,<br><strong>Equilibrioalfa.org</strong></p>
          </div>
        `
      });

      await supabase
        .from('suscriptores')
        .update({ email_enviado: true })
        .eq('id', nuevo.id);

    } catch (emailError) {
      console.error('Error enviando email:', emailError);
    }

    return res.status(200).json({
      success: true,
      mensaje: '¡Suscripción exitosa! Revisa tu email.'
    });

  } catch (error) {
    console.error('Error en /api/suscribir:', error);
    return res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
  }
}
