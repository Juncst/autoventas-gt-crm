# Calidad: pruebas y SonarQube

## Alcance

Trabajo en `feature/sonarqube-calidad`, creada desde el HEAD del `main` local.
No se modificaron archivos de producción, SQL ni funcionalidades. No se hizo
commit, push, merge ni Pull Request. El archivo sin seguimiento
`database/prospectos.sql` ya existía y se dejó intacto.

Se reutiliza `node:test`, disponible sin instalar un framework adicional.
Se agrega únicamente `c8@12.0.0` como dependencia de desarrollo en ambos paquetes:
convierte la cobertura V8 en reportes de texto, HTML, JSON y LCOV para SonarQube.
No se actualizaron los paquetes previamente presentes en los lockfiles.
La versión de c8 requiere Node >=20; esta validación utilizó Node v26.12.1.

## Ejecutar pruebas y cobertura

Desde la raíz, en PowerShell (se usa `npm.cmd` para evitar restricciones de npm.ps1):

```powershell
# Solo si faltan las dependencias; esta instalación requiere acceso a npm.
npm.cmd --prefix backend ci
npm.cmd --prefix frontend ci

# Todas las pruebas automatizadas existentes y nuevas.
npm.cmd --prefix backend test
npm.cmd --prefix frontend test

# Ejecuta las mismas pruebas y genera cobertura.
npm.cmd --prefix backend run test:coverage
npm.cmd --prefix frontend run test:coverage

# Comprobación de compilación.
npm.cmd --prefix frontend run build
```

Con las dependencias instaladas, las pruebas no necesitan Internet ni PostgreSQL.
Usan HTTP en la interfaz local con puertos temporales y sustituyen `pool.query`
dentro de cada proceso de pruebas. Esto verifica rutas, validaciones y respuestas,
pero no verifica SQL contra una base real, integridad referencial ni persistencia.
No se introducen Docker, servicios adicionales ni pruebas end-to-end.

Las 8 pruebas nuevas de `backend/test/modulos-crm.test.js` cubren:

1. Nombre requerido al crear y editar clientes.
2. Campos requeridos al crear y editar prospectos.
3. Precio, año y kilometraje inválidos en vehículos.
4. Estados y condiciones no permitidos en vehículos.
5. Registro válido de vehículo y valores predeterminados.
6. Cliente y vehículo requeridos con identificadores válidos en cotizaciones.
7. Montos, estados y fechas inválidos en cotizaciones.
8. Código y asesor requeridos en cotizaciones.

Se conservan las 14 pruebas de autenticación/permisos/usuarios del backend y
las 7 de sesión/API del frontend. No se ejecuta `test:browser`: su script apunta
a `test/navegador.mjs`, que no existe en el repositorio; no es parte de `npm test`.

## Evidencia local: 17 de noviembre de 2026

| Ejecución | Exitosas | Fallidas |
| --- | ---: | ---: |
| Backend (contador de Node) | 23 | 0 |
| Frontend | 7 | 0 |
| Total (contador de Node) | 30 | 0 |

Hay 29 escenarios efectivos: 22 backend y 7 frontend. Node también cuenta como
prueba el contenedor padre de las 14 pruebas de autenticación, por eso informa 30.
Los dos comandos `test:coverage` ejecutaron las suites completas, sin omitidas.

| Cobertura c8 | Líneas | Sentencias | Funciones | Ramas |
| --- | ---: | ---: | ---: | ---: |
| Backend | 57,36 % (900/1569) | 57,36 % | 78,26 % | 67,71 % |
| Frontend | 1,73 % (57/3289) | 1,73 % | 19,04 % | 62,50 % |

`--all` incluye también fuentes no ejecutadas, con cobertura cero. En frontend
se incluyen JS y JSX; no hay pruebas de renderizado de componentes. Los servicios
`api.js` y `sesion.js` tienen 100 % de líneas, pero eso no representa la cobertura
global del frontend. No se fija un porcentaje objetivo ni se excluye código
de producción para aumentar el resultado. Estas son métricas de c8: SonarQube
puede calcular cifras diferentes al importar LCOV.

Reportes locales, ignorados por Git:

- `backend/coverage/lcov.info` y `frontend/coverage/lcov.info`.
- `coverage/coverage-summary.json` dentro de cada paquete.
- `coverage/lcov-report/index.html` dentro de cada paquete.

El frontend compiló correctamente con Vite. Todos los JS de `backend/src`
pasaron `node --check`; el backend arrancó y `/api/health` devolvió HTTP 200
con `ok: true`. No se llamó a `/api/test-db` ni se consultó PostgreSQL.

## Ejecutar SonarQube posteriormente

`sonar-project.properties` configura:

- Clave local del proyecto: `autoventas-gt-crm`.
- Fuentes: `backend/src` y `frontend/src`.
- Pruebas: ambos directorios `test`, incluyendo solo `*.test.js` y `*.test.mjs`.
- Exclusiones de dependencias, compilados, cobertura, generados y temporales.
- Importación de los dos reportes mediante `sonar.javascript.lcov.reportPaths`.

No hay servidor, URL, token, credenciales, Quality Gate ni resultados inventados.
No se instaló el scanner como dependencia del CRM.

1. Disponer de una instancia real de SonarQube y de SonarScanner CLI instalado
   según los requisitos de esa versión. No hace falta cambiar el CRM.
2. Crear o seleccionar el proyecto `autoventas-gt-crm` en esa instancia y obtener
   un token con permiso de análisis. Si la instancia requiere otra clave, pasar
   `-Dsonar.projectKey=CLAVE_REAL` al scanner.
3. Regenerar ambos reportes con los comandos de cobertura anteriores.
4. Desde la raíz del repositorio, introducir los datos reales solo en la sesión:

```powershell
$env:SONAR_HOST_URL = Read-Host 'URL real de tu instancia SonarQube'
$tokenSeguro = Read-Host 'Token real de análisis' -AsSecureString
$env:SONAR_TOKEN = [System.Net.NetworkCredential]::new('', $tokenSeguro).Password
try {
    sonar-scanner -Dsonar.qualitygate.wait=true
} finally {
    Remove-Item Env:SONAR_TOKEN
    Remove-Item Env:SONAR_HOST_URL
    Remove-Variable tokenSeguro
}
```

No guardar el token en archivos del proyecto. No se configura
`sonar.branch.name`, para no depender de soporte de branches de una edición
específica; ejecutar desde la branch solicitada. En una instancia compartida,
usar un proyecto dedicado para evitar reemplazar el análisis principal de otro
proyecto. La ejecución del scanner necesita conectividad a la instancia.

5. Revisar la finalización del análisis y el Quality Gate en SonarQube. Conservar
   como evidencia la fecha, revisión de Git, versión de servidor/scanner, log del
   análisis y capturas/exportaciones de Quality Gate, bugs, vulnerabilidades,
   security hotspots, code smells, mantenibilidad, duplicación y cobertura.
   Los nombres de las métricas dependen de la versión y modo del servidor.
6. Registrar los hallazgos indicando archivo/línea, regla, impacto y posible
   causa. No corregirlos automáticamente ni cambiar exclusiones para aprobar
   el Quality Gate. Si este falla, conservar el resultado real como evidencia.

Documentación oficial utilizada:
[LCOV en SonarQube](https://docs.sonarsource.com/sonarqube-server/analyzing-source-code/test-coverage/javascript-typescript-test-coverage)
y [c8](https://github.com/bcoe/c8).

## Hallazgos pendientes, sin correcciones

- No hubo fallos en las pruebas ejecutadas. SonarQube todavía no se ejecutó;
  sus métricas y hallazgos están pendientes.
- `frontend/package.json`: `test:browser` referencia un archivo ausente
  (`test/navegador.mjs`). Detectado por inspección del script y del árbol de
  archivos, no por las pruebas automáticas; posible causa: script residual o
  archivo no incorporado al repositorio. Se conservó sin cambios.
- `backend/src/server.js`: los montajes de clientes, prospectos, vehículos y
  cotizaciones no aplican middleware JWT/roles; tampoco sus routers lo aplican.
  Hallazgo de revisión estática, no una prueba de seguridad de extremo a extremo.
  Posible causa: autenticación incorporada solo a usuarios/roles. Las pruebas
  nuevas ejercitan routers aislados y no certifican protección de estas rutas.
  Queda pendiente confirmar la política de acceso esperada y decidir cambios.

## Revisión de alcance

Antes de entregar se revisan `git status`, `git diff`, los archivos nuevos y
que `git diff -- backend/src frontend/src database` esté vacío. El SQL sin
seguimiento preexistente debe seguir apareciendo sin alteraciones. No se
incluyen reportes generados ni secretos. No se realiza commit ni publicación.
