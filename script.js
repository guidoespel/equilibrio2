100 %
// =============================================
// MENÚ MÓVIL
// =============================================

const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navMenu = document.querySelector('.nav-menu');

if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Cerrar menú al hacer click en un enlace
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });
}

// =============================================
// FORMULARIO DE DESCARGA
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    const downloadForm = document.getElementById('downloadForm');
    const successMessage = document.getElementById('successMessage');

    // Si no existe el formulario en esta página, no hacemos nada
    if (!downloadForm) return;

    downloadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = downloadForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Enviando...';
        submitBtn.disabled = true;

        const formData = {
            nombre: document.getElementById('nombre').value,
            email: document.getElementById('email').value,
            fechaNacimiento: document.getElementById('fechaNacimiento').value,
            pais: document.getElementById('pais').value,
        };

        try {
            const response = await fetch('/api/suscribir', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al procesar la solicitud');
            }

            downloadForm.style.display = 'none';
            if (successMessage) successMessage.style.display = 'block';
            alert('¡Gracias! Revisá tu email para descargar los libros.');

        } catch (error) {
            alert(error.message || 'Hubo un error. Intentá nuevamente.');
            console.error(error);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
});
