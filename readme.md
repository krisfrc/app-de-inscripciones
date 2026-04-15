📚 Sistema de Inscripciones - Estudiantes
Aplicación backend para gestión de inscripciones de estudiantes, con autenticación de representantes y control administrativo.

📋 Requisitos previos
Node.js (v18 o superior)

PostgreSQL (v14 o superior)

npm o yarn

🚀 Instalación y configuración
1. Clonar el repositorio
bash
git clone <url-del-repositorio>
cd nombre-del-proyecto
2. Instalar dependencias
Ejecuta el siguiente comando en la raíz del proyecto:

bash
npm install
Esto instalará automáticamente las siguientes dependencias:

Dependencia	Versión	Descripción
body-parser	^2.2.2	Analiza cuerpos de solicitudes HTTP
cors	^2.8.6	Habilita CORS en el servidor
dotenv	^17.4.1	Carga variables de entorno desde archivo .env
express	^5.2.1	Framework web para Node.js
pg	^8.20.0	Cliente de PostgreSQL para Node.js


🗄️ Configuración de PostgreSQL (local)
1. Instalar PostgreSQL
Windows: Descargar desde postgresql.org
macOS: brew install postgresql
Linux (Ubuntu/Debian): sudo apt install postgresql postgresql-contrib

2. Iniciar servicio de PostgreSQL
bash
# Windows (como administrador)
net start postgresql

# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
3. Acceder a PostgreSQL
bash
sudo -u postgres psql
# o
psql -U postgres
4. Crear base de datos y usuario
Dentro de psql, ejecuta:

sql
-- Crear usuario (cambia 'tu_usuario' y 'tu_contraseña')
CREATE USER tu_usuario WITH PASSWORD 'tu_contraseña';

-- Crear base de datos
CREATE DATABASE inscripciones_db;

-- Dar todos los privilegios al usuario
GRANT ALL PRIVILEGES ON DATABASE inscripciones_db TO tu_usuario;

-- Salir de psql
\q

5. Ejecutar script de tablas (ejemplo básico)
Conecta a la base de datos y crea las tablas necesarias:

bash
psql -U tu_usuario -d inscripciones_db -f schema/schema.sql

🔐 Variables de entorno
Crea un archivo .env en la raíz del proyecto:

env
# Servidor
PORT=3000

# Base de datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=inscripciones_db

# Seguridad
JWT_SECRET=tu_clave_secreta_super_segura_cambiala
JWT_EXPIRES_IN=7d

# Opcional: entorno
NODE_ENV=development
Explicación de variables:

Variable	Descripción
PORT	Puerto donde correrá el servidor Express
DB_HOST	Dirección del servidor PostgreSQL (local: localhost)
DB_PORT	Puerto de PostgreSQL (default: 5432)
DB_USER	Usuario creado en PostgreSQL
DB_PASSWORD	Contraseña del usuario
DB_NAME	Nombre de la base de datos
JWT_SECRET	Clave para firmar tokens JWT
JWT_EXPIRES_IN	Tiempo de expiración del token
NODE_ENV	Entorno (development/production)


🛠️ Posibles errores y soluciones
Error	Solución
ECONNREFUSED 5432	PostgreSQL no está corriendo. Inicia el servicio.
role "usuario" does not exist	El usuario no existe en PostgreSQL. Créalo con CREATE USER.
database "inscripciones_db" does not exist	Crea la base de datos con CREATE DATABASE.
JWT_SECRET is not defined	Agrega JWT_SECRET en el archivo .env.
ER_NO_SUCH_TABLE	Ejecuta el script schema.sql para crear las tablas.
📦 Comandos útiles
bash
# Ver estado de PostgreSQL
sudo systemctl status postgresql  # Linux
pg_isready                         # macOS/Windows

# Conectar a psql
psql -U tu_usuario -d inscripciones_db

# Listar bases de datos
\l

# Listar tablas
\dt

# Salir de psql
\q
📄 Licencia
Este proyecto es de uso interno para gestión de inscripciones.


