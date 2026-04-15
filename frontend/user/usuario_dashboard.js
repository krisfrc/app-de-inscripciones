const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('usuario'));
    
    // Seguridad: Si no hay usuario, redirigir al login
    if (!user) {
        window.location.href = '../login/login.html';
        return;
    }

    // Mostrar información del usuario
    const nombreCompleto = `${user.nombre} ${user.apellido || ''}`;
    const userGreeting = document.getElementById('user-greeting');
    if (userGreeting) userGreeting.textContent = `Hola, ${nombreCompleto}`;
    
    // Mostrar email y cédula si existen en el HTML
    const userEmail = document.getElementById('user-email');
    if (userEmail) userEmail.textContent = user.email || '';
    
    const userCedula = document.getElementById('user-cedula');
    if (userCedula) userCedula.textContent = user.cedula || '';

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.removeItem('usuario');
            window.location.href = '../login/login.html';
        };
    }

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

    // --- CARGAR DATOS INICIALES ---
    cargarEstadisticas();
    cargarMisEstudiantes();
    cargarMisInscripciones();
    cargarMisDirecciones();
    cargarSelectGrados();
    cargarSelectEstudiantes();

    // --- FORMULARIOS ---

    // 1. Crear Estudiante
    const estudianteForm = document.getElementById('estudiante-form');
    if (estudianteForm) {
        estudianteForm.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {
                nombre: formData.get('nombre'),
                apellido: formData.get('apellido'),
                cedula_escolar: formData.get('cedula_escolar') || null,
                fecha_nacimiento: formData.get('fecha_nacimiento') || null,
                grado_id: parseInt(formData.get('grado_id')),
                tutor_id: user.id,
                usuario_id: user.id
            };

            // Validaciones
            if (!data.nombre || !data.apellido || !data.grado_id) {
                showNotification('Por favor complete los campos requeridos', 'error');
                return;
            }

            try {
                const res = await fetch(`${API_URL}/estudiantes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (res.ok) {
                    showNotification('✅ Estudiante registrado exitosamente');
                    estudianteForm.reset();
                    cargarMisEstudiantes();
                    cargarEstadisticas();
                    cargarSelectEstudiantes();
                } else {
                    const error = await res.json();
                    showNotification(error.error || 'Error al registrar estudiante', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Error al conectar con el servidor', 'error');
            }
        };
    }

    // 2. Crear Dirección
    const direccionForm = document.getElementById('direccion-form');
    if (direccionForm) {
        direccionForm.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {
                usuario_id: user.id,
                calle: formData.get('calle') || null,
                avenida: formData.get('avenida') || null,
                sector: formData.get('sector') || null,
                numero_casa: formData.get('numero_casa') || null,
                ciudad: formData.get('ciudad') || null,
                estado: formData.get('estado') || null,
                codigo_postal: formData.get('codigo_postal') || null,
                es_principal: formData.get('es_principal') === 'on'
            };

            try {
                const res = await fetch(`${API_URL}/direcciones`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (res.ok) {
                    showNotification('✅ Dirección agregada exitosamente');
                    direccionForm.reset();
                    cargarMisDirecciones();
                    cargarEstadisticas();
                } else {
                    const error = await res.json();
                    showNotification(error.error || 'Error al agregar dirección', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Error al conectar con el servidor', 'error');
            }
        };
    }

    // 3. Crear Inscripción
    const inscripcionForm = document.getElementById('inscripcion-form');
    if (inscripcionForm) {
        inscripcionForm.onsubmit = async (e) => {
            e.preventDefault();
            const estudiante_id = document.getElementById('estudiante-select').value;
            const periodo_academico = document.getElementById('periodo_academico').value;
            const observaciones = document.getElementById('observaciones')?.value || '';

            if (!estudiante_id) {
                showNotification('Por favor seleccione un estudiante', 'error');
                return;
            }

            if (!periodo_academico) {
                showNotification('Por favor ingrese el período académico', 'error');
                return;
            }

            try {
                const res = await fetch(`${API_URL}/inscripciones`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        estudiante_id: parseInt(estudiante_id), 
                        periodo_academico: periodo_academico,
                        observaciones: observaciones || null,
                        usuario_id: user.id 
                    })
                });
                
                if (res.ok) {
                    showNotification('✅ Inscripción creada exitosamente');
                    inscripcionForm.reset();
                    cargarMisInscripciones();
                    cargarEstadisticas();
                } else {
                    const error = await res.json();
                    showNotification(error.error || 'Error al crear inscripción', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Error al conectar con el servidor', 'error');
            }
        };
    }

    // --- FUNCIONES DE CARGA ---

    // Cargar estadísticas del usuario
    async function cargarEstadisticas() {
        try {
            // Total de estudiantes
            const estudiantesRes = await fetch(`${API_URL}/estudiantes?usuario_id=${user.id}`);
            const estudiantes = await estudiantesRes.json();
            const totalEstudiantes = document.getElementById('total-estudiantes');
            if (totalEstudiantes) totalEstudiantes.textContent = estudiantes.length;

            // Total de inscripciones activas
            const inscripcionesRes = await fetch(`${API_URL}/inscripciones?usuario_id=${user.id}`);
            const inscripciones = await inscripcionesRes.json();
            const inscripcionesActivas = inscripciones.filter(i => i.estado === 'activo');
            const totalInscripciones = document.getElementById('total-inscripciones');
            if (totalInscripciones) totalInscripciones.textContent = inscripcionesActivas.length;

            // Total de direcciones
            const direccionesRes = await fetch(`${API_URL}/direcciones?usuario_id=${user.id}`);
            const direcciones = await direccionesRes.json();
            const totalDirecciones = document.getElementById('total-direcciones');
            if (totalDirecciones) totalDirecciones.textContent = direcciones.length;
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }

    // Cargar lista de estudiantes del usuario
    async function cargarMisEstudiantes() {
        const container = document.getElementById('mis-estudiantes-container');
        if (!container) return;

        try {
            const res = await fetch(`${API_URL}/estudiantes?usuario_id=${user.id}`);
            const estudiantes = await res.json();
            
            if (estudiantes.length === 0) {
                container.innerHTML = '<tr><td colspan="6" class="text-center">No tienes estudiantes registrados.</td></tr>';
                return;
            }

            let html = '';
            estudiantes.forEach(est => {
                html += `
                    <tr>
                        <td>${est.id}</td>
                        <td>${est.nombre} ${est.apellido || ''}</td>
                        <td>${est.cedula_escolar || 'N/A'}</td>
                        <td>${est.grado_nombre || 'Sin asignar'}</td>
                        <td>${est.fecha_nacimiento ? new Date(est.fecha_nacimiento).toLocaleDateString() : 'N/A'}</td>
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
                btn.onclick = () => editarMiEstudiante(btn.dataset.id);
            });
            document.querySelectorAll('.delete-estudiante-btn').forEach(btn => {
                btn.onclick = () => eliminarMiEstudiante(btn.dataset.id);
            });
        } catch (error) {
            console.error('Error cargando estudiantes:', error);
            container.innerHTML = '<tr><td colspan="6" class="text-center error">❌ Error al cargar estudiantes</td></tr>';
        }
    }

    // Cargar inscripciones del usuario
    async function cargarMisInscripciones() {
        const container = document.getElementById('mis-inscripciones-container');
        if (!container) return;

        try {
            const res = await fetch(`${API_URL}/inscripciones?usuario_id=${user.id}`);
            const inscripciones = await res.json();
            
            if (inscripciones.length === 0) {
                container.innerHTML = '<tr><td colspan="6" class="text-center">No tienes inscripciones registradas.</td></tr>';
                return;
            }

            let html = '';
            inscripciones.forEach(i => {
                html += `
                    <tr>
                        <td>${i.id}</td>
                        <td>${i.estudiante_nombre} ${i.estudiante_apellido || ''}</td>
                        <td>${i.grado || 'N/A'}</td>
                        <td>${i.periodo_academico || 'N/A'}</td>
                        <td><span class="badge ${i.estado === 'activo' ? 'badge-success' : 'badge-danger'}">${i.estado}</span></td>
                        <td>${new Date(i.fecha_inscripcion).toLocaleDateString()}</td>
                        <td>
                            <button class="delete-inscripcion-btn btn-sm btn-danger" data-id="${i.id}">🗑️ Eliminar</button>
                        </td>
                    </tr>
                `;
            });
            container.innerHTML = html;

            // Event listeners para eliminar inscripciones
            document.querySelectorAll('.delete-inscripcion-btn').forEach(btn => {
                btn.onclick = () => eliminarMiInscripcion(btn.dataset.id);
            });
        } catch (error) {
            console.error('Error cargando inscripciones:', error);
            container.innerHTML = '<tr><td colspan="6" class="text-center error">❌ Error al cargar inscripciones</td></tr>';
        }
    }

    // Cargar direcciones del usuario
    async function cargarMisDirecciones() {
        const container = document.getElementById('mis-direcciones-container');
        if (!container) return;

        try {
            const res = await fetch(`${API_URL}/direcciones?usuario_id=${user.id}`);
            const direcciones = await res.json();
            
            if (direcciones.length === 0) {
                container.innerHTML = '<tr><td colspan="6" class="text-center">No tienes direcciones registradas.</td></tr>';
                return;
            }

            let html = '';
            direcciones.forEach(d => {
                html += `
                    <tr>
                        <td>${d.calle || ''} ${d.avenida ? `y ${d.avenida}` : ''}</td>
                        <td>${d.numero_casa || 'S/N'}</td>
                        <td>${d.sector || 'N/A'}</td>
                        <td>${d.ciudad || ''}, ${d.estado || ''}</td>
                        <td>${d.codigo_postal || 'N/A'}</td>
                        <td>${d.es_principal ? '🏠 Principal' : ''}</td>
                        <td>
                            <button class="delete-direccion-btn btn-sm btn-danger" data-id="${d.id}">🗑️ Eliminar</button>
                        </td>
                    </tr>
                `;
            });
            container.innerHTML = html;

            // Event listeners para eliminar direcciones
            document.querySelectorAll('.delete-direccion-btn').forEach(btn => {
                btn.onclick = () => eliminarMiDireccion(btn.dataset.id);
            });
        } catch (error) {
            console.error('Error cargando direcciones:', error);
            container.innerHTML = '<tr><td colspan="6" class="text-center error">❌ Error al cargar direcciones</td></tr>';
        }
    }

    // Cargar select de grados
    async function cargarSelectGrados() {
        const gradoSelect = document.getElementById('grado-select');
        if (!gradoSelect) return;

        try {
            const res = await fetch(`${API_URL}/grados`);
            const grados = await res.json();
            
            gradoSelect.innerHTML = '<option value="">Seleccione un grado</option>';
            grados.forEach(grado => {
                const option = document.createElement('option');
                option.value = grado.id;
                option.textContent = grado.nombre;
                gradoSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error cargando grados:', error);
            gradoSelect.innerHTML = '<option value="">Error al cargar grados</option>';
        }
    }

    // Cargar select de estudiantes para inscripciones
    async function cargarSelectEstudiantes() {
        const estudianteSelect = document.getElementById('estudiante-select');
        if (!estudianteSelect) return;

        try {
            const res = await fetch(`${API_URL}/estudiantes?usuario_id=${user.id}`);
            const estudiantes = await res.json();
            
            estudianteSelect.innerHTML = '<option value="">Seleccione un estudiante</option>';
            estudiantes.forEach(est => {
                if (est.activo !== false) {
                    const option = document.createElement('option');
                    option.value = est.id;
                    option.textContent = `${est.nombre} ${est.apellido || ''} - ${est.grado_nombre || 'Sin grado'}`;
                    estudianteSelect.appendChild(option);
                }
            });
        } catch (error) {
            console.error('Error cargando select de estudiantes:', error);
            estudianteSelect.innerHTML = '<option value="">Error al cargar estudiantes</option>';
        }
    }

    // --- FUNCIONES CRUD ---

    // Editar estudiante
    async function editarMiEstudiante(id) {
        try {
            const res = await fetch(`${API_URL}/estudiantes?usuario_id=${user.id}`);
            const estudiantes = await res.json();
            const estudiante = estudiantes.find(e => e.id == id);
            
            if (!estudiante) {
                showNotification('Estudiante no encontrado', 'error');
                return;
            }
            
            const nuevoNombre = prompt('Ingrese el nuevo nombre:', estudiante.nombre);
            if (!nuevoNombre) return;
            
            const nuevoApellido = prompt('Ingrese el nuevo apellido:', estudiante.apellido || '');
            if (!nuevoApellido) return;
            
            const updateRes = await fetch(`${API_URL}/estudiantes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    nombre: nuevoNombre,
                    apellido: nuevoApellido,
                    usuario_id: user.id 
                })
            });
            
            if (updateRes.ok) {
                showNotification('✅ Estudiante actualizado exitosamente');
                cargarMisEstudiantes();
                cargarSelectEstudiantes();
            } else {
                showNotification('Error al actualizar estudiante', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error al editar estudiante', 'error');
        }
    }

    // Eliminar estudiante
    async function eliminarMiEstudiante(id) {
        if (!confirm('¿Estás seguro de eliminar este estudiante? Esta acción también eliminará sus inscripciones.')) return;
        
        try {
            const res = await fetch(`${API_URL}/estudiantes/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario_id: user.id })
            });
            
            if (res.ok) {
                showNotification('✅ Estudiante eliminado exitosamente');
                cargarMisEstudiantes();
                cargarMisInscripciones();
                cargarEstadisticas();
                cargarSelectEstudiantes();
            } else {
                const error = await res.json();
                showNotification(error.error || 'Error al eliminar estudiante', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error al eliminar estudiante', 'error');
        }
    }

    // Eliminar inscripción
    async function eliminarMiInscripcion(id) {
        if (!confirm('¿Estás seguro de eliminar esta inscripción permanentemente?')) return;
        
        try {
            const res = await fetch(`${API_URL}/inscripciones/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario_id: user.id })
            });
            
            if (res.ok) {
                showNotification('✅ Inscripción eliminada exitosamente');
                cargarMisInscripciones();
                cargarEstadisticas();
            } else {
                showNotification('Error al eliminar inscripción', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error al eliminar inscripción', 'error');
        }
    }

    // Eliminar dirección
    async function eliminarMiDireccion(id) {
        if (!confirm('¿Estás seguro de eliminar esta dirección?')) return;
        
        try {
            const res = await fetch(`${API_URL}/direcciones/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario_id: user.id })
            });
            
            if (res.ok) {
                showNotification('✅ Dirección eliminada exitosamente');
                cargarMisDirecciones();
                cargarEstadisticas();
            } else {
                showNotification('Error al eliminar dirección', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error al eliminar dirección', 'error');
        }
    }
});