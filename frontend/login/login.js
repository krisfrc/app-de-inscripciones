const API_URL = 'http://localhost:3000/api';

// --- 1. TU LÓGICA VISUAL (Está perfecta) ---
const urlParams = new URLSearchParams(window.location.search);
const formType = urlParams.get('form'); 

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

if(formType === 'login'){
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
} else if(formType === 'register'){
    registerForm.style.display = 'flex';
    loginForm.style.display = 'none';
} else {
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
}

// --- 2. LÓGICA DE ENVÍO AL BACKEND ---

// Evento para Registro
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const datos = Object.fromEntries(formData); // Esto toma nombre, apellido, cedula, contraseña

    try {
        const res = await fetch(`${API_URL}/usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (res.ok) {
            alert('¡Registro exitoso! Ahora podés loguearte.');
            window.location.href = 'login.html?form=login';
        } else {
            const err = await res.json();
            alert('Error: ' + err.error);
        }
    } catch (error) {
        alert('No se pudo conectar con el servidor');
    }
});

// Evento para Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const datos = Object.fromEntries(formData);

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        const data = await res.json();

        if (res.ok) {
            // Guardamos el usuario (con su rol) en el navegador
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            
            alert('¡Bienvenido!');
            // Redirección según rol de la DB (1=Admin, 2=User)
            window.location.href = data.usuario.rol_id === 1 
                ? '../admin/admin_dashboard.html' 
                : '../user/usuario_dashboard.html';
        } else {
            alert('Cédula o contraseña incorrecta');
        }
    } catch (error) {
        alert('Error en la conexión');
    }
});