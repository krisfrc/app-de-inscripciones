const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('usuario'));
    
    // Seguridad: Si no es admin o no está logueado, fuera
    if (!user || user.rol_id !== 1) {
        window.location.href = '../login/login.html';
        return;
    }

    // Saludo con nombre completo
    const nombreCompleto = `${user.nombre} ${user.apellido || ''}`;
    document.getElementById('user-greeting').textContent = `Hola, ${nombreCompleto} (Administrador)`;

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('usuario');
        window.location.href = '../login/login.html';
    });

    // --- FUNCIÓN PARA MOSTRAR NOTIFICACIONES ---
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            border-radius: 5px;
            z-index: 9999;
            animation: slideIn 0.3s ease-out;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    // --- 1. CARGAR ESTADÍSTICAS DEL DASHBOARD ---
    async function cargarEstadisticas() {
        try {
            // Total de estudiantes
            const estudiantesRes = await fetch(`${API_URL}/admin/estudiantes?usuario_id=${user.id}`);
            const estudiantes = await estudiantesRes.json();
            const totalEstudiantes = document.getElementById('total-estudiantes');
            if (totalEstudiantes) totalEstudiantes.textContent = estudiantes.length;

            // Total de inscripciones activas
            const inscripcionesRes = await fetch(`${API_URL}/admin/inscripciones?usuario_id=${user.id}`);
            const inscripciones = await inscripcionesRes.json();
            const inscripcionesActivas = inscripciones.filter(i => i.estado === 'activo');
            const totalInscripciones = document.getElementById('total-inscripciones');
            if (totalInscripciones) totalInscripciones.textContent = inscripcionesActivas.length;

            // Total de usuarios
            const usuariosRes = await fetch(`${API_URL}/admin/usuarios?usuario_id=${user.id}`);
            const usuarios = await usuariosRes.json();
            const totalUsuarios = document.getElementById('total-usuarios');
            if (totalUsuarios) totalUsuarios.textContent = usuarios.length;
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }

    // --- 2. CARGAR LISTA DE ESTUDIANTES ---
    async function cargarListaEstudiantes() {
        const container = document.getElementById('estudiantes-container');
        if (!container) return;

        try {
            const res = await fetch(`${API_URL}/admin/estudiantes?usuario_id=${user.id}`);
            const estudiantes = await res.json();
            
            if (estudiantes.length === 0) {
                container.innerHTML = '<tr><td colspan="6" class="text-center">No hay estudiantes registrados.</td></tr>';
                return;
            }

            let html = '';
            estudiantes.forEach(est => {
                html += `
                    <tr>
                        <td>${est.id}</td>
                        <td>${est.nombre} ${est.apellido}</td>
                        <td>${est.cedula_escolar || 'N/A'}</td>
                        <td>${est.grado_nombre || 'Sin asignar'}</td>
                        <td>${est.tutor_nombre ? `${est.tutor_nombre} ${est.tutor_apellido}` : 'Sin tutor'}</td>
                        <td>
                            <button class="edit-estudiante-btn btn-sm" data-id="${est.id}">✏️ Editar</button>
                            <button class="delete-estudiante-btn btn-sm btn-danger" data-id="${est.id}">🗑️ Eliminar</button>
                        </td>
                    </tr>
                `;
            });
            container.innerHTML = html;

            // Event listeners para editar/eliminar
            document.querySelectorAll('.edit-estudiante-btn').forEach(btn => {
                btn.addEventListener('click', () => editarEstudiante(btn.dataset.id));
            });
            document.querySelectorAll('.delete-estudiante-btn').forEach(btn => {
                btn.addEventListener('click', () => eliminarEstudiante(btn.dataset.id));
            });
        } catch (error) {
            console.error('Error cargando estudiantes:', error);
            container.innerHTML = '<tr><td colspan="6" class="text-center error">Error al cargar estudiantes</td></tr>';
        }
    }

    // --- 3. CARGAR LISTA DE USUARIOS ---
    async function cargarListaUsuarios() {
        const container = document.getElementById('usuarios-container');
        if (!container) return;

        try {
            const res = await fetch(`${API_URL}/admin/usuarios?usuario_id=${user.id}`);
            const usuarios = await res.json();
            
            if (usuarios.length === 0) {
                container.innerHTML = '<tr><td colspan="7" class="text-center">No hay usuarios registrados.</td></tr>';
                return;
            }

            let html = '';
            usuarios.forEach(usr => {
                html += `
                    <tr>
                        <td>${usr.id}</td>
                        <td>${usr.nombre} ${usr.apellido}</td>
                        <td>${usr.cedula}</td>
                        <td>${usr.email}</td>
                        <td>${usr.rol_nombre}</td>
                        <td><span class="badge ${usr.activo ? 'badge-success' : 'badge-danger'}">${usr.activo ? 'Activo' : 'Inactivo'}</span></td>
                        <td>
                            <button class="toggle-usuario-btn btn-sm" data-id="${usr.id}" data-activo="${usr.activo}">
                                ${usr.activo ? '🔴 Desactivar' : '🟢 Activar'}
                            </button>
                        </td>
                    </tr>
                `;
            });
            container.innerHTML = html;

            document.querySelectorAll('.toggle-usuario-btn').forEach(btn => {
                btn.addEventListener('click', () => toggleUsuarioEstado(btn.dataset.id, btn.dataset.activo === 'true'));
            });
        } catch (error) {
            console.error('Error cargando usuarios:', error);
        }
    }

    // --- 4. CARGAR INSCRIPCIONES GLOBALES ---
    async function cargarInscripciones() {
        const container = document.getElementById('inscripciones-container');
        if (!container) return;

        try {
            const res = await fetch(`${API_URL}/admin/inscripciones?usuario_id=${user.id}`);
            const inscripciones = await res.json();
            
            if (inscripciones.length === 0) {
                container.innerHTML = '<tr><td colspan="8" class="text-center">No hay inscripciones registradas.</td></tr>';
                return;
            }

            let html = '';
            inscripciones.forEach(i => {
                html += `
                    <tr>
                        <td>${i.id}</td>
                        <td>${i.usuario_nombre} ${i.usuario_apellido}</td>
                        <td>${i.estudiante_nombre} ${i.estudiante_apellido}</td>
                        <td>${i.grado || 'N/A'}</td>
                        <td>${i.periodo_academico || 'N/A'}</td>
                        <td><span class="badge ${i.estado === 'activo' ? 'badge-success' : 'badge-danger'}">${i.estado}</span></td>
                        <td>${new Date(i.fecha_inscripcion).toLocaleDateString()}</td>
                        <td>
                            <button class="cancel-inscripcion-btn btn-sm" data-id="${i.id}" data-estado="${i.estado}">
                                ${i.estado === 'activo' ? '❌ Cancelar' : '✅ Activar'}
                            </button>
                            <button class="delete-inscripcion-btn btn-sm btn-danger" data-id="${i.id}">🗑️ Eliminar</button>
                        </td>
                    </tr>
                `;
            });
            container.innerHTML = html;

            // Event listeners
            document.querySelectorAll('.cancel-inscripcion-btn').forEach(btn => {
                btn.addEventListener('click', () => toggleInscripcionEstado(btn.dataset.id, btn.dataset.estado));
            });
            document.querySelectorAll('.delete-inscripcion-btn').forEach(btn => {
                btn.addEventListener('click', () => eliminarInscripcion(btn.dataset.id));
            });
        } catch (error) {
            console.error('Error cargando inscripciones:', error);
            container.innerHTML = '<tr><td colspan="8" class="text-center error">Error al cargar inscripciones</td></tr>';
        }
    }

    // --- 5. CARGAR DIRECCIONES GLOBALES ---
    async function cargarDirecciones() {
        const container = document.getElementById('direcciones-container');
        if (!container) return;

        try {
            const res = await fetch(`${API_URL}/admin/direcciones?usuario_id=${user.id}`);
            const direcciones = await res.json();
            
            if (direcciones.length === 0) {
                container.innerHTML = '<tr><td colspan="6" class="text-center">No hay direcciones registradas.</td></tr>';
                return;
            }

            let html = '';
            direcciones.forEach(d => {
                html += `
                    <tr>
                        <td>${d.usuario_nombre} ${d.usuario_apellido}</td>
                        <td>${d.calle || ''} ${d.avenida ? `y ${d.avenida}` : ''}</td>
                        <td>${d.numero_casa || 'S/N'}</td>
                        <td>${d.sector || 'N/A'}</td>
                        <td>${d.ciudad || ''}, ${d.estado || ''}</td>
                        <td>
                            <button class="delete-direccion-btn btn-sm btn-danger" data-id="${d.id}">🗑️ Eliminar</button>
                        </td>
                    </tr>
                `;
            });
            container.innerHTML = html;

            document.querySelectorAll('.delete-direccion-btn').forEach(btn => {
                btn.addEventListener('click', () => eliminarDireccion(btn.dataset.id));
            });
        } catch (error) {
            console.error('Error cargando direcciones:', error);
        }
    }

    // --- FUNCIONES CRUD ---

    // Editar estudiante
    async function editarEstudiante(id) {
        const nuevoNombre = prompt('Ingrese el nuevo nombre del estudiante:');
        if (!nuevoNombre) return;
        
        const nuevoGrado = prompt('Ingrese el nuevo grado del estudiante:');
        if (!nuevoGrado) return;

        try {
            const res = await fetch(`${API_URL}/estudiantes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    nombre: nuevoNombre, 
                    grado: nuevoGrado, 
                    usuario_id: user.id 
                })
            });
            
            if (res.ok) {
                showNotification('Estudiante actualizado exitosamente');
                cargarListaEstudiantes();
                cargarEstadisticas();
            } else {
                showNotification('Error al actualizar estudiante', 'error');
            }
        } catch (error) {
            showNotification('Error al actualizar estudiante', 'error');
        }
    }

    // Eliminar estudiante
    async function eliminarEstudiante(id) {
        if (!confirm('¿Estás seguro de eliminar este estudiante? Esta acción eliminará también sus inscripciones.')) return;
        
        try {
            const res = await fetch(`${API_URL}/estudiantes/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario_id: user.id })
            });
            
            if (res.ok) {
                showNotification('Estudiante eliminado exitosamente');
                cargarListaEstudiantes();
                cargarEstadisticas();
                // Recargar el select de estudiantes en inscripciones
                cargarSelectEstudiantes();
            } else {
                showNotification('Error al eliminar estudiante', 'error');
            }
        } catch (error) {
            showNotification('Error al eliminar estudiante', 'error');
        }
    }

    // Toggle estado de usuario
    async function toggleUsuarioEstado(id, isActive) {
        try {
            const res = await fetch(`${API_URL}/usuarios/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activo: !isActive, usuario_id: user.id })
            });
            
            if (res.ok) {
                showNotification(`Usuario ${!isActive ? 'activado' : 'desactivado'} exitosamente`);
                cargarListaUsuarios();
                cargarEstadisticas();
            } else {
                showNotification('Error al cambiar estado del usuario', 'error');
            }
        } catch (error) {
            showNotification('Error al cambiar estado del usuario', 'error');
        }
    }

    // Toggle estado de inscripción
    async function toggleInscripcionEstado(id, currentState) {
        const newState = currentState === 'activo' ? 'cancelado' : 'activo';
        
        try {
            const res = await fetch(`${API_URL}/inscripciones/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: newState, usuario_id: user.id })
            });
            
            if (res.ok) {
                showNotification(`Inscripción ${newState === 'activo' ? 'activada' : 'cancelada'} exitosamente`);
                cargarInscripciones();
                cargarEstadisticas();
            } else {
                showNotification('Error al cambiar estado de la inscripción', 'error');
            }
        } catch (error) {
            showNotification('Error al cambiar estado de la inscripción', 'error');
        }
    }

    // Eliminar inscripción
    async function eliminarInscripcion(id) {
        if (!confirm('¿Estás seguro de eliminar esta inscripción permanentemente?')) return;
        
        try {
            const res = await fetch(`${API_URL}/inscripciones/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario_id: user.id })
            });
            
            if (res.ok) {
                showNotification('Inscripción eliminada exitosamente');
                cargarInscripciones();
                cargarEstadisticas();
            } else {
                showNotification('Error al eliminar inscripción', 'error');
            }
        } catch (error) {
            showNotification('Error al eliminar inscripción', 'error');
        }
    }

    // Eliminar dirección
    async function eliminarDireccion(id) {
        if (!confirm('¿Estás seguro de eliminar esta dirección?')) return;
        
        try {
            const res = await fetch(`${API_URL}/direcciones/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario_id: user.id })
            });
            
            if (res.ok) {
                showNotification('Dirección eliminada exitosamente');
                cargarDirecciones();
            } else {
                showNotification('Error al eliminar dirección', 'error');
            }
        } catch (error) {
            showNotification('Error al eliminar dirección', 'error');
        }
    }

    // Cargar select de estudiantes para el formulario de inscripción
    async function cargarSelectEstudiantes() {
        const estudianteSelect = document.getElementById('inscripcion-estudiante');
        if (!estudianteSelect) return;

        try {
            const res = await fetch(`${API_URL}/admin/estudiantes?usuario_id=${user.id}`);
            const estudiantes = await res.json();
            
            estudianteSelect.innerHTML = '<option value="">Seleccione un estudiante</option>';
            estudiantes.forEach(est => {
                const opt = document.createElement('option');
                opt.value = est.id;
                opt.textContent = `${est.nombre} ${est.apellido} - ${est.grado_nombre || 'Sin grado'}`;
                estudianteSelect.appendChild(opt);
            });
        } catch (error) {
            console.error('Error cargando select de estudiantes:', error);
        }
    }

    // Cargar select de grados para el formulario de estudiante
    async function cargarSelectGrados() {
        const gradoSelect = document.getElementById('estudiante-grado');
        if (!gradoSelect) return;

        try {
            const res = await fetch(`${API_URL}/grados`);
            const grados = await res.json();
            
            gradoSelect.innerHTML = '<option value="">Seleccione un grado</option>';
            grados.forEach(grado => {
                const opt = document.createElement('option');
                opt.value = grado.id;
                opt.textContent = grado.nombre;
                gradoSelect.appendChild(opt);
            });
        } catch (error) {
            console.error('Error cargando select de grados:', error);
        }
    }

    // Cargar select de usuarios para el formulario de dirección
    async function cargarSelectUsuarios() {
        const usuarioSelect = document.getElementById('direccion-usuario');
        if (!usuarioSelect) return;

        try {
            const res = await fetch(`${API_URL}/admin/usuarios?usuario_id=${user.id}`);
            const usuarios = await res.json();
            
            usuarioSelect.innerHTML = '<option value="">Seleccione un usuario</option>';
            usuarios.forEach(usr => {
                const opt = document.createElement('option');
                opt.value = usr.id;
                opt.textContent = `${usr.nombre} ${usr.apellido} - ${usr.cedula}`;
                usuarioSelect.appendChild(opt);
            });
        } catch (error) {
            console.error('Error cargando select de usuarios:', error);
        }
    }

    // --- 6. FORMULARIOS (CREAR) ---

    // Crear Estudiante
    const estudianteForm = document.getElementById('estudiante-form');
    if (estudianteForm) {
        cargarSelectGrados();
        
        estudianteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {
                nombre: formData.get('nombre'),
                apellido: formData.get('apellido'),
                cedula_escolar: formData.get('cedula_escolar'),
                fecha_nacimiento: formData.get('fecha_nacimiento'),
                grado_id: parseInt(formData.get('grado_id')),
                tutor_id: user.id,
                usuario_id: user.id
            };

            try {
                const res = await fetch(`${API_URL}/estudiantes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (res.ok) {
                    showNotification('Estudiante creado exitosamente');
                    estudianteForm.reset();
                    cargarListaEstudiantes();
                    cargarEstadisticas();
                    cargarSelectEstudiantes();
                } else {
                    const error = await res.json();
                    showNotification(error.error || 'Error al crear estudiante', 'error');
                }
            } catch (error) {
                showNotification('Error al crear estudiante', 'error');
            }
        });
    }

    // Crear Inscripción
    const inscripcionForm = document.getElementById('inscripcion-form');
    if (inscripcionForm) {
        cargarSelectEstudiantes();
        
        inscripcionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {
                estudiante_id: parseInt(formData.get('estudiante_id')),
                periodo_academico: formData.get('periodo_academico'),
                observaciones: formData.get('observaciones'),
                usuario_id: user.id
            };

            if (!data.estudiante_id || !data.periodo_academico) {
                showNotification('Por favor complete todos los campos requeridos', 'error');
                return;
            }

            try {
                const res = await fetch(`${API_URL}/inscripciones`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (res.ok) {
                    showNotification('Inscripción creada exitosamente');
                    inscripcionForm.reset();
                    cargarInscripciones();
                    cargarEstadisticas();
                } else {
                    const error = await res.json();
                    showNotification(error.error || 'Error al crear inscripción', 'error');
                }
            } catch (error) {
                showNotification('Error al crear inscripción', 'error');
            }
        });
    }

    // Crear Dirección
    const direccionForm = document.getElementById('direccion-form');
    if (direccionForm) {
        cargarSelectUsuarios();
        
        direccionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {
                usuario_id: parseInt(formData.get('usuario_id')),
                calle: formData.get('calle'),
                avenida: formData.get('avenida'),
                sector: formData.get('sector'),
                numero_casa: formData.get('numero_casa'),
                ciudad: formData.get('ciudad'),
                estado: formData.get('estado'),
                codigo_postal: formData.get('codigo_postal'),
                es_principal: formData.get('es_principal') === 'on'
            };

            if (!data.usuario_id) {
                showNotification('Por favor seleccione un usuario', 'error');
                return;
            }

            try {
                const res = await fetch(`${API_URL}/direcciones`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (res.ok) {
                    showNotification('Dirección creada exitosamente');
                    direccionForm.reset();
                    cargarDirecciones();
                } else {
                    const error = await res.json();
                    showNotification(error.error || 'Error al crear dirección', 'error');
                }
            } catch (error) {
                showNotification('Error al crear dirección', 'error');
            }
        });
    }

    // --- INICIALIZAR CARGA DE DATOS ---
    cargarEstadisticas();
    cargarListaEstudiantes();
    cargarListaUsuarios();
    cargarInscripciones();
    cargarDirecciones();
});