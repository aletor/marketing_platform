# Despliegue (Vercel): marketing + Media Composer

Hay **dos proyectos Next.js** enlazados por configuración:

| Repo / app | Rol | Raíz HTTP típica |
|------------|-----|------------------|
| Este repo (`marketing-platform`) | Marketing, conocimiento, campañas, labs, `demo_runway`, etc. | `https://app.tudominio.com` |
| [mediacomposer](https://github.com/aletor/mediacomposer) | Canvas Spaces, Runway/Grok/Gemini, composición | `https://composer.tudominio.com` |

## 1. Dos proyectos en Vercel

1. **Importar** cada repositorio como proyecto distinto (Settings → Git → root del repo; ambos usan la raíz del monorepo del repo, no hay carpeta `apps/`).
2. **Framework preset:** Next.js. **Build:** `npm run build`, **Install:** `npm install`.
3. Despliega primero **Media Composer**, copia su URL de producción.

## 2. Enlazar Labs → Composer

En el proyecto **marketing** (Vercel → Settings → Environment Variables):

| Variable | Valor ejemplo |
|----------|----------------|
| `NEXT_PUBLIC_MEDIA_COMPOSER_URL` | `https://tu-mediacomposer.vercel.app` |

Así la tarjeta “Media Composer” en `/labs` abre la app del composer en una pestaña nueva. Sin esta variable, esa tarjeta no se muestra.

## 3. Variables de entorno (marketing)

Configura según las funciones que uses: `OPENAI_API_KEY`, `AWS_*` y bucket S3 para conocimiento/subidas, `HEYGEN_API_KEY`, `ELEVENLABS_API_KEY`, APIs de vídeo, etc. Revisa las rutas bajo `src/app/api/` que necesites.

Para **`demo_runway`**: `RUNWAYML_API_KEY` (o `RUNWAYML_API_SECRET` si tu SDK lo exige), `GROK_API_KEY`.

## 4. Variables de entorno (Media Composer)

Ver `DEPLOY.md` en el repo [mediacomposer](https://github.com/aletor/mediacomposer): `OPENAI_API_KEY`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`, `GROK_API_KEY`, `RUNWAYML_API_KEY`, `REPLICATE_API_TOKEN`, credenciales AWS para S3, etc.

## 5. CORS y cookies

Si en el futuro el marketing llama al composer por API desde el navegador, habrá que alinear dominios (CORS) o usar solo enlaces (`NEXT_PUBLIC_*`) como ahora.
