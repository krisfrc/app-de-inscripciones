const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES DE AUTENTICACIÓN Y PERMISOS
// ============================================

// Middleware para verificar si el usuario existe
const verificarUsuario = async (req, res, next) => {
    try {
        const usuario_id = req.query?.usuario_id || req.body?.usuario_id || req.headers['x-usuario-id'];
        
        if (!usuario_id) {
            return res.status(403).json({ error: "Falta ID de usuario para verificar permisos" });
        }

        const result = await pool.query('SELECT id, rol_id, activo FROM usuarios WHERE id = $1', [usuario_id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        
        if (!result.rows[0].activo) {
            return res.status(403).json({ error: "Usuario inactivo" });
        }
        
        req.usuario = result.rows[0];
        next();
    } catch (err) {
        console.error("Error en verificarUsuario:", err);
        res.status(500).json({ error: "Error interno al verificar usuario" });
    }
};

// Middleware para proteger rutas de Admin (rol_id = 1)
const verificarAdmin = async (req, res, next) => {
    try {
        const usuario_id = req.query?.usuario_id || req.body?.usuario_id || req.headers['x-usuario-id'];
        
        if (!usuario_id) {
            return res.status(403).json({ error: "Falta ID de usuario para verificar permisos" });
        }

        const result = await pool.query('SELECT rol_id, activo FROM usuarios WHERE id = $1', [usuario_id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        
        if (!result.rows[0].activo) {
            return res.status(403).json({ error: "Usuario inactivo" });
        }
        
        if (result.rows[0].rol_id === 1) {
            req.esAdmin = true;
            next();
        } else {
            res.status(403).json({ error: "Acceso denegado: Se requieren permisos de administrador" });
        }
    } catch (err) {
        console.error("Error en verificarAdmin:", err);
        res.status(500).json({ error: "Error interno al verificar permisos" });
    }
};

// Middleware para verificar permisos específicos (opcional)
const verificarPermiso = (modulo, accion) => {
    return async (req, res, next) => {
        try {
            const usuario_id = req.query?.usuario_id || req.body?.usuario_id || req.headers['x-usuario-id'];
            
            const result = await pool.query(`
                SELECT prm.puede_${accion}
                FROM usuarios u
                JOIN roles_modulos rm ON u.rol_id = rm.rol_id
                JOIN modulos m ON rm.modulo_id = m.id
                JOIN permisos_roles_modulos prm ON rm.id = prm.roles_modulos_id
                WHERE u.id = $1 AND m.nombre = $2
            `, [usuario_id, modulo]);
            
            if (result.rows.length > 0 && result.rows[0][`puede_${accion}`]) {
                next();
            } else {
                res.status(403).json({ error: `No tienes permiso para ${accion} en ${modulo}` });
            }
        } catch (err) {
            console.error("Error en verificarPermiso:", err);
            res.status(500).json({ error: "Error interno al verificar permisos" });
        }
    };
};

// ============================================
// RUTAS PÚBLICAS
// ============================================

// Registro de usuarios
app.post('/api/usuarios', async (req, res) => {
    const { nombre, apellido, cedula, email, contraseña, telefono } = req.body;
    
    // Validaciones básicas
    if (!nombre || !apellido || !cedula || !email || !contraseña) {
        return res.status(400).json({ error: "Faltan campos requeridos" });
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO usuarios (nombre, apellido, cedula, email, contraseña, telefono, rol_id) 
             VALUES ($1, $2, $3, $4, $5, $6, 2) 
             RETURNING id, cedula, email, nombre, apellido`,
            [nombre, apellido, cedula, email, contraseña, telefono || null]
        );
        res.status(201).json({ 
            message: "Usuario registrado exitosamente", 
            usuario: result.rows[0] 
        });
    } catch (err) {
        if (err.code === '23505') {
            if (err.constraint === 'usuarios_cedula_key') {
                return res.status(400).json({ error: "La cédula ya está registrada" });
            }
            if (err.constraint === 'usuarios_email_key') {
                return res.status(400).json({ error: "El email ya está registrado" });
            }
        }
        res.status(500).json({ error: "Error al registrar: " + err.message });
    }
});

// Login de usuarios
app.post('/api/login', async (req, res) => {
    const { cedula, contraseña } = req.body;
    
    if (!cedula || !contraseña) {
        return res.status(400).json({ error: "Faltan cédula o contraseña" });
    }
    
    try {
        const result = await pool.query(
            `SELECT u.*, r.nombre as rol_nombre 
             FROM usuarios u 
             JOIN roles r ON u.rol_id = r.id 
             WHERE u.cedula = $1 AND u.contraseña = $2 AND u.activo = true`,
            [cedula, contraseña]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Cédula o contraseña incorrecta, o usuario inactivo" });
        }
        
        // No enviar la contraseña al frontend
        const { contraseña: _, ...usuarioSinPass } = result.rows[0];
        
        res.json({ 
            message: "Login exitoso", 
            usuario: usuarioSinPass 
        });
    } catch (err) {
        console.error("Error en login:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// RUTAS DE ADMIN (Requieren verificarAdmin)
// ============================================

// Obtener todas las inscripciones con detalles (Admin)
app.get('/api/admin/inscripciones', verificarAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                i.id, 
                i.periodo_academico,
                i.fecha_inscripcion,
                i.estado,
                i.observaciones,
                e.id AS estudiante_id,
                e.nombre AS estudiante_nombre, 
                e.apellido AS estudiante_apellido,
                e.cedula_escolar,
                g.nombre AS grado,
                u.id AS usuario_id,
                u.nombre AS usuario_nombre, 
                u.apellido AS usuario_apellido,
                u.email AS usuario_email
            FROM inscripciones i
            JOIN estudiantes e ON i.estudiante_id = e.id
            JOIN grados g ON e.grado_id = g.id
            JOIN usuarios u ON i.usuario_id = u.id
            ORDER BY i.fecha_inscripcion DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Error en /api/admin/inscripciones:", err);
        res.status(500).json({ error: err.message });
    }
});

// Obtener todas las direcciones (Admin)
app.get('/api/admin/direcciones', verificarAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                d.*, 
                u.id AS usuario_id,
                u.nombre AS usuario_nombre, 
                u.apellido AS usuario_apellido,
                u.email AS usuario_email
            FROM direcciones d 
            JOIN usuarios u ON d.usuario_id = u.id
            ORDER BY d.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Error en /api/admin/direcciones:", err);
        res.status(500).json({ error: err.message });
    }
});

// Obtener todos los usuarios (Admin)
app.get('/api/admin/usuarios', verificarAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.nombre, u.apellido, u.cedula, u.email, 
                   u.telefono, u.activo, u.created_at,
                   r.nombre AS rol_nombre, r.id AS rol_id
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            ORDER BY u.id
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Error en /api/admin/usuarios:", err);
        res.status(500).json({ error: err.message });
    }
});

// Obtener todos los estudiantes (Admin)
app.get('/api/admin/estudiantes', verificarAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                e.id, e.nombre, e.apellido, e.cedula_escolar, 
                e.fecha_nacimiento, e.activo, e.created_at,
                g.id AS grado_id, g.nombre AS grado_nombre,
                u.id AS tutor_id, u.nombre AS tutor_nombre, u.apellido AS tutor_apellido
            FROM estudiantes e
            LEFT JOIN grados g ON e.grado_id = g.id
            LEFT JOIN usuarios u ON e.tutor_id = u.id
            ORDER BY e.id
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Error en /api/admin/estudiantes:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// RUTAS DE ESTUDIANTES
// ============================================

// Obtener estudiantes de un usuario específico
app.get('/api/estudiantes', verificarUsuario, async (req, res) => {
    const { usuario_id } = req.query;
    
    try {
        let query, params;
        
        // Si es admin, puede ver todos los estudiantes
        if (req.usuario.rol_id === 1) {
            query = `
                SELECT 
                    e.id, e.nombre, e.apellido, e.cedula_escolar, 
                    e.fecha_nacimiento, e.activo,
                    g.id AS grado_id, g.nombre AS grado_nombre
                FROM estudiantes e
                LEFT JOIN grados g ON e.grado_id = g.id
                ORDER BY e.id
            `;
            params = [];
        } else {
            // Usuario normal ve solo sus estudiantes (como tutor)
            query = `
                SELECT 
                    e.id, e.nombre, e.apellido, e.cedula_escolar, 
                    e.fecha_nacimiento, e.activo,
                    g.id AS grado_id, g.nombre AS grado_nombre
                FROM estudiantes e
                LEFT JOIN grados g ON e.grado_id = g.id
                WHERE e.tutor_id = $1
                ORDER BY e.id
            `;
            params = [usuario_id];
        }
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Error en /api/estudiantes:", err);
        res.status(500).json({ error: err.message });
    }
});

// Crear un nuevo estudiante
app.post('/api/estudiantes', verificarUsuario, async (req, res) => {
    const { nombre, apellido, cedula_escolar, fecha_nacimiento, grado_id, tutor_id } = req.body;
    
    if (!nombre || !apellido || !grado_id) {
        return res.status(400).json({ error: "Faltan campos requeridos (nombre, apellido, grado)" });
    }
    
    try {
        // Determinar el tutor_id (si no se envía, usar el usuario actual)
        let idTutor = tutor_id;
        if (!idTutor && req.usuario.rol_id !== 1) {
            idTutor = req.usuario.id;
        } else if (!idTutor) {
            return res.status(400).json({ error: "Se requiere tutor_id para el estudiante" });
        }
        
        const result = await pool.query(
            `INSERT INTO estudiantes (nombre, apellido, cedula_escolar, fecha_nacimiento, grado_id, tutor_id) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [nombre, apellido, cedula_escolar || null, fecha_nacimiento || null, grado_id, idTutor]
        );
        res.status(201).json({ message: "Estudiante registrado exitosamente", estudiante: result.rows[0] });
    } catch (err) {
        console.error("Error en POST /api/estudiantes:", err);
        res.status(500).json({ error: err.message });
    }
});

// Actualizar un estudiante (solo admin o el tutor)
app.put('/api/estudiantes/:id', verificarUsuario, async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, cedula_escolar, fecha_nacimiento, grado_id, activo } = req.body;
    
    try {
        // Verificar permisos
        let puedeEditar = false;
        if (req.usuario.rol_id === 1) {
            puedeEditar = true;
        } else {
            const checkResult = await pool.query(
                'SELECT tutor_id FROM estudiantes WHERE id = $1',
                [id]
            );
            if (checkResult.rows.length > 0 && checkResult.rows[0].tutor_id === req.usuario.id) {
                puedeEditar = true;
            }
        }
        
        if (!puedeEditar) {
            return res.status(403).json({ error: "No tienes permiso para editar este estudiante" });
        }
        
        const result = await pool.query(
            `UPDATE estudiantes 
             SET nombre = COALESCE($1, nombre),
                 apellido = COALESCE($2, apellido),
                 cedula_escolar = COALESCE($3, cedula_escolar),
                 fecha_nacimiento = COALESCE($4, fecha_nacimiento),
                 grado_id = COALESCE($5, grado_id),
                 activo = COALESCE($6, activo),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $7 
             RETURNING *`,
            [nombre, apellido, cedula_escolar, fecha_nacimiento, grado_id, activo, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Estudiante no encontrado" });
        }
        
        res.json({ message: "Estudiante actualizado exitosamente", estudiante: result.rows[0] });
    } catch (err) {
        console.error("Error en PUT /api/estudiantes:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// RUTAS DE DIRECCIONES
// ============================================

// Obtener direcciones de un usuario
app.get('/api/direcciones', verificarUsuario, async (req, res) => {
    const { usuario_id } = req.query;
    
    try {
        let query, params;
        
        if (req.usuario.rol_id === 1 && usuario_id) {
            // Admin puede ver direcciones de cualquier usuario
            query = 'SELECT * FROM direcciones WHERE usuario_id = $1 ORDER BY es_principal DESC, created_at DESC';
            params = [usuario_id];
        } else {
            // Usuario normal solo ve sus propias direcciones
            query = 'SELECT * FROM direcciones WHERE usuario_id = $1 ORDER BY es_principal DESC, created_at DESC';
            params = [req.usuario.id];
        }
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Error en /api/direcciones:", err);
        res.status(500).json({ error: err.message });
    }
});

// Crear una nueva dirección
app.post('/api/direcciones', verificarUsuario, async (req, res) => {
    const { calle, avenida, sector, numero_casa, ciudad, estado, codigo_postal, es_principal } = req.body;
    const usuario_id = req.usuario.id;
    
    try {
        // Si es principal, desmarcar otras direcciones principales
        if (es_principal) {
            await pool.query(
                'UPDATE direcciones SET es_principal = false WHERE usuario_id = $1',
                [usuario_id]
            );
        }
        
        const result = await pool.query(
            `INSERT INTO direcciones (calle, avenida, sector, numero_casa, ciudad, estado, codigo_postal, es_principal, usuario_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             RETURNING *`,
            [calle || null, avenida || null, sector || null, numero_casa || null, 
             ciudad || null, estado || null, codigo_postal || null, es_principal || false, usuario_id]
        );
        res.status(201).json({ message: "Dirección agregada exitosamente", direccion: result.rows[0] });
    } catch (err) {
        console.error("Error en POST /api/direcciones:", err);
        res.status(500).json({ error: err.message });
    }
});

// Eliminar una dirección
app.delete('/api/direcciones/:id', verificarUsuario, async (req, res) => {
    const { id } = req.params;
    
    try {
        let query, params;
        
        if (req.usuario.rol_id === 1) {
            // Admin puede eliminar cualquier dirección
            query = 'DELETE FROM direcciones WHERE id = $1 RETURNING *';
            params = [id];
        } else {
            // Usuario normal solo puede eliminar sus propias direcciones
            query = 'DELETE FROM direcciones WHERE id = $1 AND usuario_id = $2 RETURNING *';
            params = [id, req.usuario.id];
        }
        
        const result = await pool.query(query, params);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Dirección no encontrada o sin permisos" });
        }
        
        res.json({ message: "Dirección eliminada exitosamente" });
    } catch (err) {
        console.error("Error en DELETE /api/direcciones:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// RUTAS DE INSCRIPCIONES
// ============================================

// Obtener inscripciones de un usuario
app.get('/api/inscripciones', verificarUsuario, async (req, res) => {
    const { usuario_id, estudiante_id } = req.query;
    
    try {
        let query, params;
        
        if (req.usuario.rol_id === 1) {
            // Admin puede ver todas las inscripciones
            if (estudiante_id) {
                query = `
                    SELECT i.*, e.nombre AS estudiante_nombre, e.apellido AS estudiante_apellido, g.nombre AS grado
                    FROM inscripciones i
                    JOIN estudiantes e ON i.estudiante_id = e.id
                    LEFT JOIN grados g ON e.grado_id = g.id
                    WHERE i.estudiante_id = $1
                    ORDER BY i.fecha_inscripcion DESC
                `;
                params = [estudiante_id];
            } else {
                query = `
                    SELECT i.*, e.nombre AS estudiante_nombre, e.apellido AS estudiante_apellido, g.nombre AS grado
                    FROM inscripciones i
                    JOIN estudiantes e ON i.estudiante_id = e.id
                    LEFT JOIN grados g ON e.grado_id = g.id
                    ORDER BY i.fecha_inscripcion DESC
                `;
                params = [];
            }
        } else {
            // Usuario normal ve solo sus inscripciones
            query = `
                SELECT i.*, e.nombre AS estudiante_nombre, e.apellido AS estudiante_apellido, g.nombre AS grado
                FROM inscripciones i
                JOIN estudiantes e ON i.estudiante_id = e.id
                LEFT JOIN grados g ON e.grado_id = g.id
                WHERE i.usuario_id = $1
                ORDER BY i.fecha_inscripcion DESC
            `;
            params = [req.usuario.id];
        }
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Error en /api/inscripciones:", err);
        res.status(500).json({ error: err.message });
    }
});

// Crear una inscripción
app.post('/api/inscripciones', verificarUsuario, async (req, res) => {
    const { estudiante_id, periodo_academico, observaciones } = req.body;
    
    if (!estudiante_id || !periodo_academico) {
        return res.status(400).json({ error: "Faltan campos requeridos (estudiante_id, periodo_academico)" });
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO inscripciones (estudiante_id, usuario_id, periodo_academico, observaciones, estado) 
             VALUES ($1, $2, $3, $4, 'activo') 
             RETURNING *`,
            [estudiante_id, req.usuario.id, periodo_academico, observaciones || null]
        );
        res.status(201).json({ message: "Inscripción realizada exitosamente", inscripcion: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: "El estudiante ya está inscrito en este período académico" });
        }
        console.error("Error en POST /api/inscripciones:", err);
        res.status(500).json({ error: err.message });
    }
});

// Actualizar estado de una inscripción (cancelar/completar)
app.put('/api/inscripciones/:id', verificarUsuario, async (req, res) => {
    const { id } = req.params;
    const { estado, observaciones } = req.body;
    
    try {
        let query, params;
        
        if (req.usuario.rol_id === 1) {
            // Admin puede modificar cualquier inscripción
            query = `
                UPDATE inscripciones 
                SET estado = COALESCE($1, estado),
                    observaciones = COALESCE($2, observaciones)
                WHERE id = $3 
                RETURNING *
            `;
            params = [estado, observaciones, id];
        } else {
            // Usuario normal solo puede modificar sus propias inscripciones
            query = `
                UPDATE inscripciones 
                SET estado = COALESCE($1, estado),
                    observaciones = COALESCE($2, observaciones)
                WHERE id = $3 AND usuario_id = $4
                RETURNING *
            `;
            params = [estado, observaciones, id, req.usuario.id];
        }
        
        const result = await pool.query(query, params);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Inscripción no encontrada o sin permisos" });
        }
        
        res.json({ message: "Inscripción actualizada exitosamente", inscripcion: result.rows[0] });
    } catch (err) {
        console.error("Error en PUT /api/inscripciones:", err);
        res.status(500).json({ error: err.message });
    }
});

// Eliminar una inscripción (solo admin)
app.delete('/api/inscripciones/:id', verificarAdmin, async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await pool.query('DELETE FROM inscripciones WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Inscripción no encontrada" });
        }
        
        res.json({ message: "Inscripción eliminada exitosamente" });
    } catch (err) {
        console.error("Error en DELETE /api/inscripciones:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// RUTAS DE GRADOS (Catálogo)
// ============================================

// Obtener todos los grados
app.get('/api/grados', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM grados WHERE activo = true ORDER BY orden, id'
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error en /api/grados:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// RUTAS DE REPORTES (Con joins avanzados)
// ============================================

// Reporte de inscripciones por período
app.get('/api/reportes/inscripciones', verificarUsuario, async (req, res) => {
    const { periodo } = req.query;
    
    try {
        let query, params;
        
        if (periodo) {
            query = `
                SELECT 
                    periodo_academico,
                    COUNT(*) as total,
                    COUNT(CASE WHEN estado = 'activo' THEN 1 END) as activas,
                    COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as canceladas,
                    COUNT(CASE WHEN estado = 'finalizado' THEN 1 END) as finalizadas
                FROM inscripciones
                WHERE periodo_academico = $1
                GROUP BY periodo_academico
            `;
            params = [periodo];
        } else {
            query = `
                SELECT 
                    periodo_academico,
                    COUNT(*) as total,
                    COUNT(CASE WHEN estado = 'activo' THEN 1 END) as activas,
                    COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as canceladas,
                    COUNT(CASE WHEN estado = 'finalizado' THEN 1 END) as finalizadas
                FROM inscripciones
                GROUP BY periodo_academico
                ORDER BY periodo_academico DESC
            `;
            params = [];
        }
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Error en /api/reportes/inscripciones:", err);
        res.status(500).json({ error: err.message });
    }
});

// Reporte de estudiantes por grado
app.get('/api/reportes/estudiantes-por-grado', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                g.nombre as grado,
                COUNT(e.id) as cantidad_estudiantes
            FROM grados g
            LEFT JOIN estudiantes e ON g.id = e.grado_id AND e.activo = true
            WHERE g.activo = true
            GROUP BY g.id, g.nombre, g.orden
            ORDER BY g.orden
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Error en /api/reportes/estudiantes-por-grado:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// RUTA DE HEALTH CHECK
// ============================================

app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'OK', database: 'connected', timestamp: new Date() });
    } catch (err) {
        res.status(500).json({ status: 'ERROR', database: 'disconnected', error: err.message });
    }
});

// ============================================
// INICIO DEL SERVIDOR
// ============================================

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`API disponible en http://localhost:${PORT}/api`);
});