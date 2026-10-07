# E2E preparados; ejecución bloqueada

Esta etapa prepara Playwright, no provisiona MySQL ni habilita operaciones reales.
`npm run test:e2e` y `npm run test:e2e:ui` usan Playwright; el globalSetup
`helpers/safety.ts` falla deliberadamente antes de ejecutar cualquier flujo.
La fixture automática de `helpers/test.ts` aplica el mismo bloqueo para pruebas
individuales en UI, aunque no se haya ejecutado globalSetup.
No hay variable que permita saltar ese bloqueo. Un puerto distinto, por sí solo,
no demuestra que el backend esté conectado a otra base.

## Verificaciones sin backend

```sh
npx playwright test --list
npx tsc -p e2e/tsconfig.json
npm run test
npm run build
npm run lint
```

`--list` descubre tests sin ejecutar globalSetup, servidores ni navegadores.
Vitest incluye únicamente tests de src para no recoger las suites de Playwright.
No se instalaron navegadores en esta etapa. Antes de habilitar los flujos habrá
que instalar Chromium con `npx playwright install chromium`.

## Frontend preparado

- Chromium escritorio, un worker, sin retries: evita repetir escrituras fallidas.
- Vite mediante el script existente `npm run dev`, modo e2e, localhost:5174,
  strictPort y sin reutilizar un servidor ya abierto.
- `e2e/.env.e2e` contiene únicamente `VITE_API_URL=http://localhost:3001`.
  `e2e/vite.config.ts` reutiliza la configuración base y separa envDir a e2e:
  Vite no carga el `.env` habitual. El webServer también fuerza VITE_API_URL
  para evitar overrides locales. No se lee ni copia el archivo de desarrollo.
- `test-results`, `playwright-report`, `.auth` y archivos `*.local` ignorados.
- No se guardan estados de sesión, trazas, video ni capturas con credenciales.
- No se configura webServer del backend: aún no existe un script seguro E2E.

## Hallazgos del backend (solo revisión)

`src/mikro-orm.config.ts` importa `dotenv/config` y toma DB_HOST, DB_PORT,
DB_USER, DB_PASS y DB_NAME. `ConfigModule.forRoot` también carga `.env`.
`main.ts` acepta PORT, pero CORS está fijo en http://localhost:5173.
Existen `start:dev`, `start:prod`, `seed`, `seed:admin` y migraciones MikroORM;
no existe arranque/reset E2E con comprobación de DB. Los seeds existentes usan
la misma configuración ORM que la aplicación; no deben ejecutarse sin aislamiento.
El catálogo habitual no es el contrato de datos E2E descrito abajo.
El registro crea USER; un ADMIN necesita bootstrap separado, no registro público.

## Estrategia para la siguiente etapa (requiere autorización)

1. Provisionar una instancia MySQL descartable o schema `mygamesearcher_e2e`,
   preferentemente en una instancia separada en localhost:3307. Un usuario DB
   exclusivo debe tener permisos solamente sobre ese schema y ningún acceso a
   la base habitual. Nunca usar el usuario DB de desarrollo.
2. Preparar backend E2E con carga explícita de su archivo `.env.e2e.local`
   antes de importar ORM, sin fallback a `.env`. Usar NODE_ENV=test y una marca
   E2E exclusiva. Validar DB_NAME exacto y credenciales dedicadas antes de abrir
   conexión, migrar, sembrar o resetear. No basta configurar DOTENV_CONFIG_PATH:
   también hay que impedir que ConfigModule cargue el `.env` habitual.
3. Permitir CORS localhost:5174 mediante configuración y PORT=3001. Añadir un
   launcher/script E2E protegido; no asumir que existe hoy `start:e2e`.
4. Aplicar las migraciones existentes exclusivamente al schema E2E y ejecutar
   un seed E2E mínimo de datos ficticios. Validar destino antes de cada operación.
5. Ofrecer un preflight solo en modo E2E que compruebe la conexión efectiva,
   identidad del entorno y versión del seed (sin devolver secretos). Reemplazar
   el bloqueo de safety.ts por esa comprobación; debe fallar si no puede probar
   el aislamiento. Recién entonces añadir webServer del backend usando su nuevo
   script real. No retirar el bloqueo basándose únicamente en una variable local.
6. Resetear antes de cada suite/ejecución y descartar la DB al terminar mediante
   tooling específico protegido. Ante fallo, no limpiar la DB habitual. Se borran
   únicamente datos E2E: usuarios, bibliotecas, colecciones y cualquier dato ADMIN.

Variables propuestas para backend (no creadas ni cargadas aquí):
DB_HOST, DB_PORT=3307, DB_NAME=mygamesearcher_e2e, DB_USER y DB_PASS dedicados,
PORT=3001, JWT_SECRET temporal generado, NODE_ENV=test, marca E2E y origen CORS.
Los nombres de la marca/origen se definirán al implementar el soporte backend;
no son variables que el backend actual reconozca.
El bootstrap ADMIN existente usa ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NOMBRE y
ADMIN_APELLIDO. Generar email `e2e-admin-<run>@example.test` y contraseña temporal
en memoria; pasar también E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD al proceso Playwright.
Playwright no carga archivos de secretos automáticamente. Nunca usar admin@mail.com.

## Contrato del futuro seed E2E

Crear `E2E Juego base` y al menos dos candidatos ficticios con títulos distintos,
compartiendo géneros/plataformas/características para que el backend produzca
recomendaciones tras guardar el base. Sin usuarios USER preexistentes; cada test
registra uno con UUID, email @example.test y contraseña aleatoria. No depender de
IDs fijos: relaciones se seleccionan desde la UI y IDs de colección reales.
Crear un ADMIN exclusivo mediante bootstrap aislado. Este seed no está implementado
ni ejecutado, por la restricción de no modificar backend.

## Flujos preparados

- visitor: inicio → catálogo → login → registro.
- auth: registro único → login → saludo.
- library: agregar base → cambiar estado → favorito → eliminar.
- collections: crear → agregar base → filtro/búsqueda → eliminar.
- recommendations: biblioteca/colección base → seleccionar fuente → agregar
  recomendado → comparar UI con nuevo ranking real, manteniendo coleccionId.
- authorization: USER recibe acceso denegado; ADMIN aislado accede al panel/juegos.

No hay mocks HTTP en estos flujos. No recalculan el ranking. Son pruebas preparadas,
no pruebas aprobadas contra navegador/backend: quedan pendientes hasta provisionar,
verificar y habilitar el entorno aislado.

Configuración basada en la documentación oficial:
https://playwright.dev/docs/test-webserver
https://playwright.dev/docs/test-configuration
