# AI Code Reviewer 🤖

Herramienta web que conecta tu cuenta de GitHub via OAuth, analiza los cambios
de tus Pull Requests en tiempo real con inteligencia artificial y guarda el
historial de revisiones en Supabase.

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
| Supabase Edge Functions | Llamada segura a la API de Claude desde el servidor |
| Anthropic Claude API | Análisis de código con IA en streaming |
| GitHub REST API v3 | Obtención de repos, PRs y diffs |
| Jest | Unit tests |
| GitHub Actions | CI/CD automático en cada push |

---

## 🧠 Arquitectura y Decisiones Técnicas

**¿Por qué Next.js 14 con App Router?**
Permite combinar componentes server-side y client-side en el mismo proyecto,
ideal para manejar el streaming de la IA desde el servidor y la UI interactiva
en el cliente.

**¿Por qué Supabase?**
Resuelve de forma elegante tres problemas a la vez: autenticación OAuth con
GitHub, base de datos con seguridad por usuario via RLS, y Edge Functions para
llamar a la API de Claude de forma segura sin exponer la API key en el frontend.

**¿Por qué Edge Functions para llamar a Claude?**
La API key de Anthropic nunca sale del servidor. La Edge Function valida el JWT
del usuario, llama a Claude y redirige el stream directamente al cliente sin
acumular la respuesta en memoria.

**¿Por qué streaming?**
El análisis de un PR puede tardar varios segundos. Con streaming el usuario ve
el review aparecer palabra por palabra en tiempo real, como ChatGPT, en lugar
de esperar una pantalla en blanco.

---

## 🤖 Herramientas de IA Utilizadas

- **Antigravity** — Herramienta principal de desarrollo. Generó la arquitectura
  base, componentes de frontend, Edge Functions y configuración de CI/CD.
  Permitió avanzar en días lo que normalmente llevaría semanas.

- **Claude (Anthropic)** — Usado como copiloto para tomar decisiones técnicas,
  resolver errores complejos y auditar la salida generada por Antigravity.

Todo el código generado fue revisado, probado y ajustado manualmente antes de
integrarse al proyecto. Las decisiones de arquitectura fueron evaluadas y
validadas con criterio propio.

---

## 📱 Pantallas

- **Login** — Autenticación con GitHub OAuth
- **Dashboard** — Lista de repositorios con búsqueda y filtros
- **Pull Requests** — PRs del repo con indicador de review
- **Detalle de PR** — Diff del código + análisis de IA en streaming
- **Historial** — Reviews guardados con métricas y filtros

---

## ⚙️ Cómo correrlo localmente

### Requisitos
- Node.js v18 o v20
- Cuenta en Supabase
- GitHub OAuth App configurada
- API Key de Anthropic

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

Configurá la API key de Anthropic en Supabase:

```bash
supabase secrets set ANTHROPIC_API_KEY="tu-api-key"
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

Tabla `reviews` en Supabase con RLS habilitado — cada usuario solo puede
ver, crear y eliminar sus propios reviews.

---

## 📝 Convención de Commits

Commits semánticos en español:
- `feat:` nueva funcionalidad
- `fix:` corrección de errores
- `chore:` mantenimiento
- `docs:` documentación
- `test:` pruebas unitarias