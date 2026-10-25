# AutoVentas GT CRM

CRM académico con React, Vite, Tailwind, Express y PostgreSQL mediante `pg`.

## Ejecución local

En dos terminales, desde la raíz:

```powershell
npm.cmd --prefix backend run dev
npm.cmd --prefix frontend run dev
```

Usar la URL que indique Vite. El backend utiliza el puerto 3000 por defecto.
`npm.cmd` evita la restricción de scripts `npm.ps1` de algunas instalaciones de PowerShell.
Para una instalación nueva, ejecutar `npm.cmd ci` dentro de cada carpeta.

El backend necesita su `.env` local con las variables de `backend/.env.example`.
No subir `.env` ni credenciales a Git. Se requiere un `JWT_SECRET` privado.
El frontend usa `http://localhost:3000/api`; puede configurarse `VITE_API_URL`
siguiendo `frontend/.env.example`. Las variables `VITE_` son públicas: nunca incluir secretos.

## Autenticación y navegación

- `POST /api/auth/login`: recibe `{ correo, password }`, devuelve JWT y usuario.
- `GET /api/auth/me`: devuelve datos actuales del usuario autenticado.
- Cada solicitud protegida valida la firma HS256, el vencimiento, el estado activo y el rol actual en PostgreSQL.
- Context de React mantiene la sesión. JWT y datos básicos se guardan en `sessionStorage`: sobreviven a recargas en la misma pestaña, sin persistencia permanente. No se guardan contraseñas.
- Al restaurar la sesión se consulta `/auth/me` antes de mostrar contenido privado. Un fallo de red permite reintentar. Un 401 o el vencimiento cierran la sesión.
- Se consulta la sesión nuevamente al recuperar el foco de la ventana. Cambiar el propio usuario también actualiza la sesión.
- La navegación usa `#/dashboard`, `#/clientes`, `#/prospectos` y `#/usuarios`, sin instalar un router.
- Usuarios se muestra únicamente para ADMINISTRADOR y su API conserva la autorización del backend. El frontend no usa el JWT como prueba de permisos: consulta el usuario actual al servidor.
- Editar con contraseña vacía conserva la anterior. Las contraseñas nuevas requieren al menos 8 caracteres y como máximo 72 bytes por el límite de bcrypt.
- Cerrar sesión elimina los datos de esta pestaña. No hay lista de revocación de JWT al cerrar sesión: un token copiado conserva vigencia hasta vencer, salvo desactivación o cambio de permisos del usuario.

## Dashboard e integración pendiente

El Dashboard cuenta registros reales de `/api/clientes` y `/api/prospectos`.
Si un módulo falla, muestra «No disponible», sin inventar valores ni bloquear el otro.
Vehículos y Cotizaciones aún no tienen módulos implementados.

`database/base.sql` contiene solo Roles y Usuarios; no incluye un usuario inicial ni
las tablas Clientes, Prospectos, Notas o Actividades. Cada integrante debe aportar
el esquema de su módulo antes de probar su integración en una base nueva.

Los archivos de Clientes y Prospectos se conservan intactos. Sus componentes usan
URLs fijas a `localhost:3000` y sus endpoints permanecen públicos. Antes de desplegar,
coordinar con su responsable el uso del servicio API común y del middleware JWT.
Ocultar sus vistas detrás del Login no protege esos endpoints.

No se encontraron exportaciones o capturas de Stitch para Login, Dashboard o Usuarios.
Las nuevas vistas siguen la paleta azul, tarjetas y tablas de las pantallas existentes.
Queda pendiente contrastarlas visualmente con las referencias originales de Stitch.
Antes de exposición pública también corresponde limitar intentos de login, restringir CORS
a los orígenes del despliegue y usar HTTPS. No se cambiaron dependencias para esto.

## Comprobaciones

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run test:browser
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd --prefix backend audit
npm.cmd --prefix frontend audit
```

Las pruebas HTTP del backend utilizan las rutas reales, JWT y bcrypt con un sustituto
del pool; no escriben ni se conectan a PostgreSQL. Cubren permisos, revocación por
estado/rol, validación, duplicados y contraseña opcional.
Las pruebas unitarias del frontend verifican almacenamiento de sesión y comunicación API,
incluidos errores de red, autenticación y cancelación.

`test:browser` requiere Chrome o Edge instalado en Windows (o definir `CHROME_PATH`).
Abre un navegador sin ventana con un perfil temporal y una API local de prueba en memoria.
Comprueba errores de login, Dashboard ante fallos parciales, creación/edición/desactivación
de usuarios, contraseña opcional, restauración/cierre de sesión, permisos y menú móvil.
No usa usuarios reales ni escribe en PostgreSQL. El perfil temporal se elimina al terminar.

Si npm no reconoce los certificados corporativos y Node admite certificados del sistema,
puede ejecutarse la auditoría con `$env:NODE_OPTIONS='--use-system-ca'` en esa terminal.
No desactivar la verificación TLS.
