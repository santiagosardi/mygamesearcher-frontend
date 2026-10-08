# MyGameSearcher

Aplicación web para descubrir, organizar y recibir recomendaciones de videojuegos según los gustos del usuario.

**[Abrir MyGameSearcher](https://mygamesearcher-frontend-fawn.vercel.app)**

Este repositorio contiene el frontend. El backend es una aplicación separada.

## Funcionalidades

- Catálogo de videojuegos con búsqueda y filtros.
- Registro e inicio de sesión, con autenticación mediante JWT y roles USER y ADMIN.
- Biblioteca personal con estados: pendiente, jugando, completado y abandonado.
- Marcado de juegos favoritos.
- Colecciones personalizadas para organizar juegos.
- Recomendaciones determinísticas y explicables según la biblioteca o una colección, calculadas por el backend.
- Panel de administración para usuarios ADMIN.
- Diseño responsive para escritorio, tablet y móvil.

## Arquitectura

```text
React / Vercel
      ↓ HTTP / API REST
NestJS / Render
      ↓ MikroORM
MySQL / Aiven
```

Frontend y backend se comunican mediante una API REST. El frontend presenta los datos y realiza peticiones con Axios; el backend gestiona la autenticación, las reglas de negocio y el acceso a la base de datos.

El backend utiliza NestJS, TypeScript, MikroORM 7, JWT y bcrypt. La base de producción es MySQL 8 en Aiven, con conexión SSL, migraciones aplicadas y un seed de catálogo de 50 juegos.

## Tecnologías

- **Frontend:** React 19, TypeScript, Vite, React Router, Axios, Bootstrap y CSS tradicional.
- **Testing:** Vitest, Testing Library y Playwright.
- **Infraestructura:** Vercel para el frontend, Render para el backend y Aiven MySQL para la base de datos.

## Requisitos

- Node.js compatible con las dependencias del proyecto. El desarrollo fue validado con Node 24; `package.json` no fija una versión de Node.
- npm.
- Backend disponible para utilizar las funcionalidades conectadas a la API.

## Instalación

```bash
git clone https://github.com/santiagosardi/mygamesearcher-frontend.git
cd mygamesearcher-frontend
npm ci
```

Copiar `.env.example` a `.env` en la raíz del proyecto y configurar la URL del backend.

## Variables de entorno

```env
VITE_API_URL=http://localhost:3000
```

Axios utiliza esta variable como URL base de la API. En producción apunta a `https://mygamesearcher-backend.onrender.com` y se configura en Vercel antes del build.

Las variables `VITE_` se incorporan al frontend durante el build y son públicas: no deben contener secretos. El archivo `.env` local está ignorado por Git.

## Ejecución local

Con el backend disponible en la URL configurada:

```bash
npm run dev
```

Abrir la URL que indique Vite en la terminal.

## Scripts principales

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo de Vite. |
| `npm run build` | Comprueba TypeScript y genera el build en `dist`. |
| `npm run preview` | Sirve el build generado para revisarlo localmente. |
| `npm run lint` | Ejecuta Oxlint. |
| `npm test` | Ejecuta las pruebas de Vitest una vez. |
| `npm run test:watch` | Ejecuta Vitest en modo watch. |
| `npm run test:e2e` | Ejecuta Playwright con el entorno E2E preparado. |
| `npm run test:e2e:ui` | Abre la interfaz de Playwright para las pruebas E2E. |

## Testing

Vitest y Testing Library se utilizan para las pruebas del frontend. La validación final registró **91 tests aprobados en 8 archivos**.

El proyecto también incluye infraestructura E2E con Playwright. Estas pruebas requieren un backend y una base de datos aislados; no forman parte de los 91 tests de Vitest y no deben ejecutarse contra producción.

Consultar la preparación y ejecución en [e2e/README.md](e2e/README.md).

## Deploy

- **Frontend — Vercel:** https://mygamesearcher-frontend-fawn.vercel.app
- **Backend — Render:** https://mygamesearcher-backend.onrender.com
- **Base de datos:** Aiven MySQL.

La producción de ambos repositorios utiliza la rama `main`. Vercel ejecuta `npm run build` y publica `dist`.

`vercel.json` incluye el rewrite hacia `/index.html` necesario para que BrowserRouter resuelva las rutas internas al acceder directamente o refrescar la página.

## Backend

- **Repositorio:** https://github.com/santiagosardi/mygamesearcher-backend
- **API:** https://mygamesearcher-backend.onrender.com

Las instrucciones de instalación y configuración del backend corresponden a su propio repositorio.
