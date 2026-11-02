// ========================================
// MENÚ MÓVIL
// ========================================

const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navMenu = document.querySelector('.nav-menu');

mobileMenuBtn.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Cerrar menú al hacer click en un enlace
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// ========================================
// FORMULARIO DE DESCARGA
// ========================================

const downloadForm = document.getElementById('downloadForm');
const successMessage = document.getElementById('successMessage');

downloadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Obtener datos del formulario
    const formData = {
        nombre: document.getElementById('nombre').value,
        email: document.getElementById('email').value,
        fechaNacimiento: document.getElementById('fechaNacimiento').value,
        pais: document.getElementById('pais').value,
        timestamp: new Date().toISOString()
    };
    
    // Calcular edad
    const edad = calcularEdad(formData.fechaNacimiento);
    formData.edad = edad;
    
    try {
        // OPCIÓN 1: Enviar a Google Sheets (GRATIS)
        await enviarAGoogleSheets(formData);
        
        // OPCIÓN 2: Enviar a tu backend propio
        // await fetch('/api/download', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(formData)
        // });
        
        // Mostrar mensaje de éxito
        downloadForm.style.display = 'none';
        successMessage.style.display = 'block';
        
        // Aquí se enviaría el email automáticamente
        // (ver sección de configuración de emails)
        
    } catch (error) {
        alert('Hubo un error al procesar tu solicitud. Por favor intenta nuevamente.');
        console.error(error);
    }
});

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

// ========================================
// ENVÍO A GOOGLE SHEETS
// ========================================

async function enviarAGoogleSheets(data) {
    // Necesitarás crear un Google Apps Script
    // Ver instrucciones en la guía
    const GOOGLE_SCRIPT_URL = 'TU_URL_DE_GOOGLE_APPS_SCRIPT_AQUI';
    
    const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    
    return response;
}

// ========================================
// ANIMACIONES AL HACER SCROLL
// ========================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Aplicar animación a secciones
document.querySelectorAll('section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
});

// ========================================
// NAVBAR CON SOMBRA AL HACER SCROLL
// ========================================

window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
    } else {
        navbar.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
    }
});