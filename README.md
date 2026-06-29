# AI Code Reviewer 🤖

Herramienta web que conecta tu cuenta de GitHub via OAuth, analiza los cambios de tus Pull Requests en tiempo real con inteligencia artificial, genera fichas descriptivas del repositorio completo y guarda el historial de revisiones en Supabase.

Desarrollado por **Facundo Thibaut** como challenge técnico para **AranguriApps**.

🔗 [Ver demo en vivo](https://ai-code-reviewer-ten-mu.vercel.app/)

---

## 🛠️ Stack Tecnológico

| Tecnología | Uso |
|---|---|
| Next.js 14 + TypeScript | Frontend con App Router |
| Tailwind CSS | Estilos con tema oscuro |
| Sileo | Toast notifications con spring physics y SVG morphing |
| Supabase Auth | Login con GitHub OAuth |
| Supabase Database + RLS | Guardado de reviews con seguridad por usuario |
| Supabase Edge Functions | Llamada segura a la API de Grok (xAI) desde el servidor |
| Grok (xAI) API | Análisis de código y descripción de proyectos con el modelo `grok-3` en streaming |
| GitHub REST API v3 | Obtención de repos, PRs, diffs y archivos fuente |
| Jest | Unit tests |
| GitHub Actions | CI/CD automático en cada push |

---

## 🧠 Arquitectura y Decisiones Técnicas

**¿Por qué Next.js 14 con App Router?**
Permite combinar componentes server-side y client-side en el mismo proyecto, ideal para manejar el streaming de la IA desde el servidor y la UI interactiva en el cliente.

**¿Por qué Supabase?**
Resuelve de forma elegante tres problemas a la vez: autenticación OAuth con GitHub, base de datos con seguridad por usuario via RLS, y Edge Functions para llamar a la API de Grok de forma segura sin exponer la API key en el frontend.

**¿Por qué Edge Functions para llamar a Grok (xAI)?**
La API key de Grok nunca sale del servidor. La Edge Function valida el JWT del usuario, realiza la petición a `https://api.x.ai/v1/chat/completions` y redirige el stream directamente al cliente sin acumular la respuesta completa en memoria.

**¿Por qué streaming?**
El análisis de un PR o de un repositorio completo puede tardar varios segundos. Con streaming, el usuario ve el análisis aparecer palabra por palabra en tiempo real, en lugar de esperar con una pantalla bloqueada o en blanco.

---

## 🤖 Herramientas de IA Utilizadas

- **Antigravity** — Herramienta principal de desarrollo. Generó la arquitectura base, componentes de frontend, Edge Functions, componentes de UI personalizados y configuración de CI/CD. Permitió avanzar en días lo que normalmente llevaría semanas.

- **Claude (Anthropic)** — Usado como copiloto inicial para tomar decisiones técnicas, resolver errores complejos y auditar la salida generada por Antigravity.

Todo el código generado fue revisado, probado y ajustado manualmente antes de integrarse al proyecto. Las decisiones de arquitectura fueron evaluadas y validadas con criterio propio.

---

## 📱 Pantallas

- **Login** — Autenticación con GitHub OAuth.
- **Dashboard** — Lista de repositorios con búsqueda y filtros por lenguaje o tipo de visibilidad.
- **Pull Requests / Repositorio** — Vista principal del repo con opción de listar PRs o ir a la ficha del proyecto.
- **Analizar Proyecto Completo** — Genera descripciones automáticas estructuradas para LinkedIn, CV o tu Portafolio basadas 100% en el código fuente descargado en tiempo real. Permites copiar cada descripción al portapapeles con un solo clic.
- **Detalle de PR** — Diff del código + análisis de IA en streaming (Bugs, Performance, Seguridad, Estilo).
- **Historial** — Reviews guardados en Supabase con gráficos de evolución técnica, métricas y filtros.

---

## ⚙️ Cómo correrlo localmente

### Requisitos
- Node.js v18 o v20
- Cuenta en Supabase
- GitHub OAuth App configurada
- API Key de Grok (xAI)

### Instalación

```bash
git clone https://github.com/FacundoThibaut1010/ai-code-reviewer
cd ai-code-reviewer
npm install
```

Creá un archivo `.env.local` en la raíz:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

Configurá la API key de Grok en Supabase:

```bash
supabase secrets set GROK_API_KEY="tu-api-key"
```

Corré el proyecto:

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000)

### Tests

```bash
npm run test
```

---

## 🗄️ Base de Datos

Tabla `reviews` en Supabase con RLS habilitado — cada usuario solo puede ver, crear y eliminar sus propios reviews.

---

## 📝 Convención de Commits

Commits semánticos en español:
- `feat:` nueva funcionalidad
- `fix:` corrección de errores
- `chore:` mantenimiento
- `docs:` documentación
- `test:` pruebas unitarias