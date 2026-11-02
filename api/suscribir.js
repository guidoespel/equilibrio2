import { supabase } from '../lib/supabase.js';
import { resend } from '../lib/resend.js';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { nombre, email, fechaNacimiento, pais } = req.body;

        // 1. Validación básica
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

        const edad = calcularEdad(fechaNacimiento);
        if (edad < 13 || edad > 120) {
            return res.status(400).json({ error: 'Edad fuera de rango válido' });
        }

        // 2. Verificar duplicados en Supabase
        const { data: existente } = await supabase
            .from('suscriptores')
            .select('id')
            .eq('email', email.toLowerCase().trim())
            .single();

        if (existente) {
            return res.status(409).json({ 
                error: 'Este email ya está registrado',
                mensaje: 'Ya te enviamos los libros. Revisa tu bandeja de entrada.'
            });
        }

        // 3. Insertar en Supabase
        const { data: nuevoSuscriptor, error: errorInsercion } = await supabase
            .from('suscriptores')
            .insert([{
                nombre: nombre.trim(),
                email: email.toLowerCase().trim(),
                fecha_nacimiento: fechaNacimiento,
                edad: edad,
                pais: pais,
                email_enviado: false
            }])
            .select()
            .single();

        if (errorInsercion) {
            if (errorInsercion.code === '23505') { // Unique violation
                return res.status(409).json({ error: 'Este email ya está registrado' });
            }
            throw new Error('Error al guardar en base de datos');
        }

        // 4. Enviar Email con PDFs adjuntos (Lectura local a Base64)
        try {
            const pdf1Path = path.join(process.cwd(), 'public', 'libro1-alquimia-interior.pdf');
            const pdf2Path = path.join(process.cwd(), 'public', 'libro2-mente-maestra.pdf');

            const pdf1Content = fs.readFileSync(pdf1Path).toString('base64');
            const pdf2Content = fs.readFileSync(pdf2Path).toString('base64');

            await resend.emails.send({
                from: 'Equilibrio <onboarding@resend.dev>', // Cambiar a 'contacto@equilibrio.org' cuando verifiques el dominio en Resend
                to: email,
                subject: '¡Bienvenido a Equilibrio! Tus libros te esperan 📚',
                html: generarHTMLBienvenida(nombre),
                attachments: [
                    { filename: 'La-Alquimia-Interior.pdf', content: pdf1Content },
                    { filename: 'El-Arte-de-la-Mente-Maestra.pdf', content: pdf2Content }
                ]
            });

            // 5. Marcar como enviado
            await supabase
                .from('suscriptores')
                .update({ email_enviado: true })
                .eq('id', nuevoSuscriptor.id);

        } catch (emailError) {
            console.error('Error enviando email:', emailError);
            // No fallamos la petición si el email falla, el usuario ya está registrado.
        }

        return res.status(200).json({ 
            success: true, 
            mensaje: '¡Suscripción exitosa! Revisa tu email en los próximos minutos.' 
        });

    } catch (error) {
        console.error('Error en /api/suscribir:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}

function calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    return edad;
}

function generarHTMLBienvenida(nombre) {
    return `
    <div style="font-family: Georgia, serif; color: #2C2C2C; line-height: 1.7; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1B3A57;">¡Bienvenido a Equilibrio, ${nombre}!</h1>
        <p>Gracias por unirte a nuestra comunidad de transformación personal.</p>
        <p>Adjunto encontrarás <strong>dos libros completos</strong> en formato PDF:</p>
        
        <div style="background: #FAF8F5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #B8860B;">
            <h3 style="color: #1B3A57; margin-top: 0;">⚗️ La Alquimia Interior</h3>
            <p>Un recorrido por el cuerpo, la mente y el espíritu a través de las tradiciones esotéricas.</p>
        </div>
        
        <div style="background: #FAF8F5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #B8860B;">
            <h3 style="color: #1B3A57; margin-top: 0;">🧠 El Arte de la Mente Maestra</h3>
            <p>Programación Neurolingüística: Herramientas para Reprogramar tu Realidad.</p>
        </div>

        <p>Si tienes alguna pregunta, no dudes en responder a este email.</p>
        <p>Un abrazo,<br><strong>El equipo de Equilibrio.org</strong></p>
        <hr style="margin: 40px 0; border: none; border-top: 1px solid #E0D8C8;">
        <p style="font-size: 12px; color: #666; text-align: center;">© 2026 Equilibrio.org</p>
    </div>`;
}