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
| Supabase Auth | Login con GitHub OAuth |
| Supabase Database + RLS | Guardado de reviews con seguridad por usuario |
| Supabase Edge Functions | Llamada segura a la API de Claude desde el servidor |
| Anthropic Claude API | Análisis de código con IA en streaming |
| GitHub REST API v3 | Obtención de repos, PRs y diffs |
| Jest | Unit tests |
| GitHub Actions | CI/CD automático en cada push |

---

## 🤖 Herramientas de IA Utilizadas

- **Antigravity** — Herramienta principal de desarrollo. Generó la arquitectura,
  componentes, Edge Functions y configuración de CI/CD. Permitió avanzar en días
  lo que normalmente llevaría semanas.

- **Claude (Anthropic)** — Usado para tomar decisiones técnicas, resolver errores
  complejos y auditar la salida generada por Antigravity.

Todo el código generado fue revisado, probado y ajustado manualmente antes de
integrarse al proyecto.

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