document.addEventListener('DOMContentLoaded', () => {
    // 1. Capturamos el contenedor de los botones
    const authContainer = document.querySelector('.auth-buttons-main');
    
    // 2. Revisamos si hay un usuario guardado en el navegador (del login anterior)
    const userStorage = localStorage.getItem('usuario');

    if (userStorage) {
        // Parseamos los datos (recordá que el backend devuelve un objeto dentro de un array o directo)
        const user = JSON.parse(userStorage);
        
        // 3. Si está logueado, LIMPIAMOS los botones de Login/Registro
        // y ponemos el botón para ir a SU panel y el de Cerrar Sesión
        const panelUrl = user.rol_id === 1 ? 'admin_dashboard.html' : 'usuario_dashboard.html';

        authContainer.innerHTML = `
            <span style="margin-right: 10px;">Hola, <strong>${user.nombre}</strong></span>
            <a href="${panelUrl}" class="btn-login">Mi Panel</a>
            <button id="logout-btn" class="btn-register" style="cursor:pointer; border:none;">Salir</button>
        `;

        // 4. Funcionalidad para Cerrar Sesión
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('usuario'); // Borra los datos
            window.location.reload(); // Recarga la página para que vuelvan Login/Registro
        });
    }

    // --- Otras funcionalidades del index ---
    
    // Botón de saludo
    const btnSaludo = document.getElementById('btn-saludo');
    if(btnSaludo) {
        btnSaludo.addEventListener('click', () => alert('¡Bienvenidos a la Escuela Ejemplo!'));
    }

    // Formulario de contacto (simulado)
    const contactForm = document.getElementById('contact-form');
    if(contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Mensaje enviado correctamente');
            contactForm.reset();
        });
    }
});