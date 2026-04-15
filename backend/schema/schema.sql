-- =====================================================
-- 1. TABLAS BASE (Catálogos/Entidades principales)
-- =====================================================

-- Roles de usuarios
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Módulos del sistema
CREATE TABLE modulos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usuarios del sistema
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    rol_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Direcciones (1:N con usuarios)
CREATE TABLE direcciones (
    id SERIAL PRIMARY KEY,
    calle VARCHAR(255),
    avenida VARCHAR(255),
    sector VARCHAR(100),
    numero_casa VARCHAR(50),
    ciudad VARCHAR(100),
    estado VARCHAR(100),
    codigo_postal VARCHAR(20),
    es_principal BOOLEAN DEFAULT FALSE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. TABLAS DE NEGOCIO
-- =====================================================

-- Grados escolares (catálogo)
CREATE TABLE grados (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    nivel VARCHAR(50), -- Primaria, Secundaria, etc.
    orden INTEGER,
    activo BOOLEAN DEFAULT TRUE
);

-- Estudiantes
CREATE TABLE estudiantes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    cedula_escolar VARCHAR(20) UNIQUE,
    fecha_nacimiento DATE,
    grado_id INTEGER REFERENCES grados(id) ON DELETE RESTRICT,
    tutor_id INTEGER REFERENCES usuarios(id) ON DELETE RESTRICT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. TABLAS N:M (Relaciones muchos a muchos)
-- =====================================================

-- Relación N:M entre roles y módulos (qué módulos puede ver cada rol)
CREATE TABLE roles_modulos (
    id SERIAL PRIMARY KEY,
    rol_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    modulo_id INTEGER NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
    UNIQUE(rol_id, modulo_id)
);

-- Permisos específicos por rol-módulo (CRUD)
CREATE TABLE permisos_roles_modulos (
    id SERIAL PRIMARY KEY,
    roles_modulos_id INTEGER NOT NULL REFERENCES roles_modulos(id) ON DELETE CASCADE,
    puede_crear BOOLEAN DEFAULT FALSE,
    puede_leer BOOLEAN DEFAULT TRUE,
    puede_editar BOOLEAN DEFAULT FALSE,
    puede_borrar BOOLEAN DEFAULT FALSE,
    puede_exportar BOOLEAN DEFAULT FALSE,
    UNIQUE(roles_modulos_id)
);

-- Páginas/endpoints por módulo
CREATE TABLE paginas (
    id SERIAL PRIMARY KEY,
    modulo_id INTEGER NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    ruta VARCHAR(255) NOT NULL,
    icono VARCHAR(100),
    orden INTEGER DEFAULT 0,
    UNIQUE(modulo_id, ruta)
);

-- Relación N:M entre roles y páginas (acceso directo a páginas)
CREATE TABLE roles_paginas (
    id SERIAL PRIMARY KEY,
    rol_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    pagina_id INTEGER NOT NULL REFERENCES paginas(id) ON DELETE CASCADE,
    UNIQUE(rol_id, pagina_id)
);

-- Inscripciones (N:M entre estudiantes y usuarios/tutores)
CREATE TABLE inscripciones (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    periodo_academico VARCHAR(20), -- Ej: '2024-1', '2024-2'
    estado VARCHAR(20) DEFAULT 'activo', -- activo, cancelado, finalizado
    observaciones TEXT,
    UNIQUE(estudiante_id, periodo_academico) -- Un estudiante no puede inscribirse dos veces al mismo periodo
);

-- =====================================================
-- 4. INSERCIONES DE DATOS (Después de todas las tablas)
-- =====================================================

-- Roles
INSERT INTO roles (nombre, descripcion) VALUES 
('admin', 'Administrador del sistema con acceso total'),
('user', 'Usuario regular con acceso básico'),
('tutor', 'Tutor o representante de estudiantes'),
('docente', 'Docente con acceso a gestión de cursos');

-- Módulos
INSERT INTO modulos (nombre, descripcion) VALUES 
('Inscripciones', 'Gestión de inscripciones de estudiantes'),
('Ajustes', 'Configuración del sistema'),
('Reportes', 'Generación de reportes y estadísticas'),
('Estudiantes', 'Gestión de estudiantes y sus datos'),
('Usuarios', 'Administración de usuarios del sistema');

-- Grados escolares
INSERT INTO grados (nombre, nivel, orden) VALUES 
('1er Grado', 'Primaria', 1),
('2do Grado', 'Primaria', 2),
('3er Grado', 'Primaria', 3),
('4to Grado', 'Primaria', 4),
('5to Grado', 'Primaria', 5),
('6to Grado', 'Primaria', 6),
('1er Año', 'Secundaria', 7),
('2do Año', 'Secundaria', 8),
('3er Año', 'Secundaria', 9),
('4to Año', 'Secundaria', 10),
('5to Año', 'Secundaria', 11);

-- Usuarios
INSERT INTO usuarios (nombre, apellido, cedula, email, contraseña, telefono, rol_id) VALUES 
('Admin', 'Sistema', '1010', 'admin@escuela.com', '123', '2615000001', 1),
('Facundo', 'Fereira', '2020', 'facundo@email.com', '123', '2615000002', 2),
('María', 'González', '3030', 'maria.gonzalez@email.com', '123', '2615000003', 3),
('Carlos', 'Rodríguez', '4040', 'carlos.rodriguez@email.com', '123', '2615000004', 4);

-- Direcciones
INSERT INTO direcciones (calle, avenida, sector, numero_casa, ciudad, estado, es_principal, usuario_id) VALUES 
('Av. San Martin', '9 de Julio', 'Centro', '150', 'Mendoza', 'Mendoza', TRUE, 2),
('Calle Las Heras', 'Av. España', 'Centro', '250', 'Mendoza', 'Mendoza', TRUE, 3),
('Av. Alem', 'Colón', 'Godoy Cruz', '320', 'Godoy Cruz', 'Mendoza', TRUE, 4);

-- Estudiantes
INSERT INTO estudiantes (nombre, apellido, cedula_escolar, fecha_nacimiento, grado_id, tutor_id) VALUES 
('Juanito', 'Pérez', 'E-001-2024', '2015-05-15', 5, 2),
('Ana', 'González', 'E-002-2024', '2016-08-22', 3, 3),
('Luis', 'Rodríguez', 'E-003-2024', '2014-11-10', 6, 4);

-- Relación roles_modulos (qué módulos para cada rol)
INSERT INTO roles_modulos (rol_id, modulo_id) VALUES 
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), -- Admin tiene todos
(2, 1), (2, 3), -- User tiene inscripciones y reportes
(3, 1), (3, 4), -- Tutor tiene inscripciones y estudiantes
(4, 1), (4, 3), (4, 4); -- Docente tiene inscripciones, reportes y estudiantes

-- Permisos por rol-módulo
INSERT INTO permisos_roles_modulos (roles_modulos_id, puede_crear, puede_leer, puede_editar, puede_borrar, puede_exportar) VALUES
(1, TRUE, TRUE, TRUE, TRUE, TRUE),   -- Admin-Inscripciones
(2, TRUE, TRUE, TRUE, TRUE, TRUE),   -- Admin-Ajustes
(3, TRUE, TRUE, TRUE, TRUE, TRUE),   -- Admin-Reportes
(4, TRUE, TRUE, TRUE, TRUE, TRUE),   -- Admin-Estudiantes
(5, TRUE, TRUE, TRUE, TRUE, TRUE),   -- Admin-Usuarios
(6, TRUE, TRUE, TRUE, FALSE, TRUE),  -- User-Inscripciones
(7, FALSE, TRUE, FALSE, FALSE, TRUE),-- User-Reportes
(8, TRUE, TRUE, FALSE, FALSE, FALSE),-- Tutor-Inscripciones
(9, FALSE, TRUE, FALSE, FALSE, FALSE),-- Tutor-Estudiantes
(10, TRUE, TRUE, TRUE, FALSE, TRUE), -- Docente-Inscripciones
(11, FALSE, TRUE, FALSE, FALSE, TRUE),-- Docente-Reportes
(12, FALSE, TRUE, TRUE, FALSE, FALSE); -- Docente-Estudiantes

-- Páginas
INSERT INTO paginas (modulo_id, nombre, ruta, icono, orden) VALUES
(1, 'Lista de Inscripciones', '/inscripciones', 'fa-book', 1),
(1, 'Nueva Inscripción', '/inscripciones/nueva', 'fa-plus', 2),
(2, 'Configuración General', '/ajustes', 'fa-cog', 1),
(2, 'Respaldos', '/ajustes/respaldos', 'fa-database', 2),
(3, 'Reporte de Inscripciones', '/reportes/inscripciones', 'fa-chart-bar', 1),
(3, 'Reporte de Estudiantes', '/reportes/estudiantes', 'fa-users', 2),
(4, 'Lista de Estudiantes', '/estudiantes', 'fa-child', 1),
(4, 'Registrar Estudiante', '/estudiantes/nuevo', 'fa-user-plus', 2),
(5, 'Lista de Usuarios', '/usuarios', 'fa-user-cog', 1),
(5, 'Crear Usuario', '/usuarios/nuevo', 'fa-user-plus', 2);

-- Inscripciones (N:M)
INSERT INTO inscripciones (estudiante_id, usuario_id, periodo_academico, estado, observaciones) VALUES 
(1, 2, '2024-1', 'activo', 'Inscripción regular'),
(2, 3, '2024-1', 'activo', 'Inscripción con beca'),
(3, 4, '2024-1', 'activo', 'Inscripción regular');

-- =====================================================
-- 5. EJEMPLOS DE CONSULTAS CON JOINS
-- =====================================================

-- 1. Obtener todos los estudiantes con su grado y tutor
SELECT 
    e.id,
    e.nombre AS estudiante_nombre,
    e.apellido AS estudiante_apellido,
    g.nombre AS grado,
    u.nombre AS tutor_nombre,
    u.apellido AS tutor_apellido,
    u.email AS tutor_email
FROM estudiantes e
LEFT JOIN grados g ON e.grado_id = g.id
LEFT JOIN usuarios u ON e.tutor_id = u.id
WHERE e.activo = TRUE
ORDER BY g.orden, e.apellido;

-- 2. Inscripciones con detalles completos
SELECT 
    i.id,
    i.periodo_academico,
    i.fecha_inscripcion,
    i.estado,
    e.nombre AS estudiante_nombre,
    e.apellido AS estudiante_apellido,
    g.nombre AS grado,
    u.nombre AS usuario_nombre,
    u.apellido AS usuario_apellido,
    d.ciudad,
    d.estado
FROM inscripciones i
INNER JOIN estudiantes e ON i.estudiante_id = e.id
INNER JOIN grados g ON e.grado_id = g.id
INNER JOIN usuarios u ON i.usuario_id = u.id
LEFT JOIN direcciones d ON u.id = d.usuario_id AND d.es_principal = TRUE
ORDER BY i.fecha_inscripcion DESC;

-- 3. Permisos por rol (vista detallada)
SELECT 
    r.nombre AS rol,
    m.nombre AS modulo,
    prm.puede_crear,
    prm.puede_leer,
    prm.puede_editar,
    prm.puede_borrar,
    prm.puede_exportar
FROM roles r
INNER JOIN roles_modulos rm ON r.id = rm.rol_id
INNER JOIN modulos m ON rm.modulo_id = m.id
INNER JOIN permisos_roles_modulos prm ON rm.id = prm.roles_modulos_id
ORDER BY r.id, m.id;

-- 4. Usuarios activos con sus direcciones principales
SELECT 
    u.id,
    u.nombre,
    u.apellido,
    u.email,
    u.telefono,
    r.nombre AS rol,
    d.calle,
    d.avenida,
    d.ciudad,
    d.estado
FROM usuarios u
INNER JOIN roles r ON u.rol_id = r.id
LEFT JOIN direcciones d ON u.id = d.usuario_id AND d.es_principal = TRUE
WHERE u.activo = TRUE
ORDER BY u.id;

-- 5. Estadísticas de inscripciones por periodo
SELECT 
    periodo_academico,
    COUNT(*) AS total_inscripciones,
    COUNT(CASE WHEN estado = 'activo' THEN 1 END) AS activas,
    COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) AS canceladas
FROM inscripciones
GROUP BY periodo_academico
ORDER BY periodo_academico DESC;

-- =====================================================
-- 6. ÍNDICES PARA OPTIMIZACIÓN (A largo plazo)
-- =====================================================

CREATE INDEX idx_usuarios_cedula ON usuarios(cedula);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol_id);
CREATE INDEX idx_estudiantes_grado ON estudiantes(grado_id);
CREATE INDEX idx_estudiantes_tutor ON estudiantes(tutor_id);
CREATE INDEX idx_inscripciones_estudiante ON inscripciones(estudiante_id);
CREATE INDEX idx_inscripciones_periodo ON inscripciones(periodo_academico);
CREATE INDEX idx_direcciones_usuario ON direcciones(usuario_id);
CREATE INDEX idx_roles_modulos_rol ON roles_modulos(rol_id);
CREATE INDEX idx_roles_modulos_modulo ON roles_modulos(modulo_id);