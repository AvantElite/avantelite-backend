function _esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
var _cf = document.getElementById('contactForm');
if (_cf) _cf.addEventListener('submit', function (e) {
    e.preventDefault();

    // Obtener todos los campos
    const formData = {
        nombre: document.getElementById('nombre').value,
        apellido: document.getElementById('apellido').value,
        correo: document.getElementById('correo').value,
        telefono: document.getElementById('telefono').value,
        producto: document.getElementById('producto').value,
        problema: document.getElementById('problema').value,
        mensaje: document.getElementById('mensaje').value,
        origen: document.getElementById('origen').value
    };

    const panel = document.getElementById('confirmationPanel');
    const dataDiv = document.getElementById('submittedData');
    const submitBtn = this.querySelector('button[type="submit"]');

    // Deshabilitar botón mientras se envía
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    // Limpiar clases previas del panel
    panel.className = 'confirmation-panel';

    var endpoint = (typeof AVANTSERVICE_CONFIG !== 'undefined') ? AVANTSERVICE_CONFIG.API_CONTACT : 'http://localhost:3000/contacto';
    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.success) {
            panel.classList.add('success');
            dataDiv.innerHTML = `
                <h3>✅ ¡Mensaje Enviado!</h3>
                <p>Hola <strong>${_esc(formData.nombre)}</strong>, hemos recibido tu consulta sobre <strong>${_esc(formData.producto)}</strong>.</p>
                <p>Nos pondremos en contacto contigo en breve al correo <em>${_esc(formData.correo)}</em>.</p>
            `;
            document.getElementById('contactForm').reset();
        } else {
            panel.classList.add('error');
            dataDiv.innerHTML = `
                <h3>⚠️ Error al enviar</h3>
                <p>Hubo un problema al procesar los datos. Por favor, inténtalo de nuevo.</p>
            `;
        }
        panel.style.display = 'block';
    })
    .catch((error) => {
        panel.classList.add('error');
        dataDiv.innerHTML = `
            <h3>❌ Error de Conexión</h3>
            <p>No se pudo conectar con el servidor. Por favor, inténtalo de nuevo más tarde.</p>
        `;
        panel.style.display = 'block';
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'ENVIAR A AVANTSTORE';
        
        // Ocultar el panel después de 8 segundos si fue exitoso
        if (panel.classList.contains('success')) {
            setTimeout(() => {
                panel.style.display = 'none';
            }, 8000);
        }
    });
});

// Funcionalidad para las tarjetas de servicios (Acordeón)
document.addEventListener('DOMContentLoaded', () => {
    const services = document.querySelectorAll('.service');
    
    services.forEach(service => {
        service.addEventListener('click', () => {
            // Opcional: Cerrar otras tarjetas si se desea comportamiento de acordeón
            // services.forEach(s => {
            //     if (s !== service) s.classList.remove('active');
            // });
            
            service.classList.toggle('active');
        });
    });

    // Auto-expandir si venimos desde el botón de "Ver subcategorías"
    if (window.location.hash === '#subcategories') {
        setTimeout(() => {
            services.forEach(service => service.classList.add('active'));
            const target = document.querySelector('.service-details') || document.querySelector('.service-container');
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }
});
