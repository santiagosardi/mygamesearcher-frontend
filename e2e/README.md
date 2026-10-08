# Pruebas E2E con Playwright

Las pruebas usan un entorno y una base de datos separados de producción.
Antes de ejecutar los flujos, se aplican comprobaciones que abortan si falta algún requisito:
archivo local obligatorio, VITE_API_URL exacto http://127.0.0.1:3001,
E2E_FRONTEND_URL exacto http://127.0.0.1:5174 y E2E_RUN_ALLOWED=YES.
Después se realiza únicamente GET /juegos, sin redirects, con timeout de 5 segundos,
validando respuesta exitosa, array y presencia de E2E Juego base. GlobalSetup y
fixture automática protegen también pruebas individuales en UI.

No existe un endpoint de diagnóstico DB. El seed es una comprobación adicional,
NO una prueba de identidad de DB. El aislamiento fuerte depende del launcher backend,
DB_NAME=mygamesearcher_e2e y del usuario MySQL exclusivo verificado por el equipo.
No se modifica backend ni se inventa un endpoint. Backend caído, seed ausente,
API en 3000 o permiso ausente abortan antes de cualquier flujo de escritura.

Copiar e2e/.env.e2e.example a e2e/.env.e2e y completar localmente.
Ese archivo está ignorado. E2E_RUN_ALLOWED=NO es el valor seguro de ejemplo.
No se heredan credenciales ADMIN del proceso ni del .env habitual: el test ADMIN
lee E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD exclusivamente del archivo E2E.
Usar email @example.test y la contraseña del ADMIN aislado; no admin@mail.com.
No imprimir archivos/credenciales. No guardar JWT ni secretos DB en frontend.

Vite usa configuración separada con envDir:false y lectura exclusiva del archivo
E2E. Solo se define VITE_API_URL en el navegador; ADMIN nunca se expone.
Playwright inicia Vite en 127.0.0.1:5174 con strictPort, sin reutilizar servidores.
No inicia backend ni hace reset; ambos pasos se realizan manualmente.
Se utiliza un worker, cero retries y Chromium,
sin capturas/video/trazas; reportes ignorados por Git.

Para los siguientes comandos, ubicar los repositorios mygamesearcher-frontend
y mygamesearcher-backend en carpetas hermanas. Ejecutar desde la raíz del frontend,
solo después de verificar la configuración de la base E2E y autorizar su reset:

```powershell
npm --prefix ../mygamesearcher-backend run e2e:db:reset
npm --prefix ../mygamesearcher-backend run start:e2e
# En otra terminal, después del arranque, archivo local completo y permiso YES:
npm run test:e2e
```

Instalar Chromium si aún falta: npx playwright install chromium.
El reset se hace solo manualmente sobre la DB E2E; elimina datos temporales de
usuarios, bibliotecas y colecciones entre ejecuciones, nunca la DB habitual.
No copiar ni cargar el archivo backend desde el frontend.

Preparados 7 tests en 6 specs: visitante, registro/login, biblioteca, colecciones,
recomendaciones, autorización USER y acceso ADMIN. Los datos USER/colección usan UUID.
El seed backend incluye E2E Juego base y candidatos compatibles; los tests no
recalculan recomendaciones, comparan la UI con la respuesta real del backend.

Validaciones seguras: npm run test, npm run build, npm run lint, npm audit,
npx tsc -p e2e/tsconfig.json y npx playwright test --list. --list no ejecuta
setup, servidores, navegador ni peticiones. Estas comprobaciones no equivalen
a ejecutar los flujos E2E contra el entorno aislado.
