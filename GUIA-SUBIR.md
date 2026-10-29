# Cómo subir los cambios (GitHub → Vercel, con Supabase)

Tu sitio ya está publicado en Vercel y conectado a Supabase. Estos cambios son SOLO de diseño (CSS), así que **no tienes que tocar Supabase**. Lo único que hay que hacer es subir los archivos nuevos a GitHub; Vercel publica solo.

## Qué cambió
- `css/26-oscuro-remate.css` (archivo NUEVO)
- `css/mis-correcciones.css` (archivo NUEVO, para tus ajustes futuros)
- `css/estilos.css` (reemplaza al anterior)
- `index.html` (cambió el número de versión del CSS)
- `README.md`

## PARTE 1 · GitHub (subir los archivos)
1. Descomprime el ZIP en tu computadora.
2. Entra a https://github.com e inicia sesión.
3. Abre tu repositorio (el del Catálogo de Sistemas).
4. Entra a la carpeta **css**.
5. Pulsa el botón **Add file** → **Upload files**.
6. Arrastra desde tu computadora, de la carpeta `css`: **26-oscuro-remate.css** y **estilos.css** (si GitHub pregunta, acepta reemplazar).
7. Abajo, en el cuadro de mensaje escribe: `Mejora modo oscuro` y pulsa el botón verde **Commit changes**.
8. Regresa a la raíz del repositorio (pulsa el nombre del repositorio, arriba). Pulsa **Add file** → **Upload files**, arrastra **index.html** y **README.md**, escribe `Actualiza versión` y pulsa **Commit changes**.

## PARTE 2 · Vercel (se publica solo)
1. Entra a https://vercel.com e inicia sesión.
2. Abre tu proyecto (sistema-a-silk).
3. Pulsa la pestaña **Deployments**. En 1 a 2 minutos aparecerá un despliegue nuevo.
4. Cuando diga **Ready** (verde), abre https://gobhub.vercel.app
5. Si ves lo anterior, recarga forzado: Windows `Ctrl + Shift + R`; Mac `Cmd + Shift + R`.

Si NO aparece despliegue nuevo: en el proyecto entra a **Settings → Git** y revisa que esté conectado a tu repositorio y a la rama `main`.

## PARTE 3 · Supabase (solo verificar)
No se requiere ningún cambio. Para comprobar que todo sigue conectado:
1. Entra a https://supabase.com → tu proyecto.
2. En **Table Editor** confirma que ves tus tablas con datos.
3. En **Authentication → URL Configuration**, confirma que **Site URL** sea `https://gobhub.vercel.app`.

## Cómo probar el modo oscuro
En el sitio, pulsa el botón azul redondo de accesibilidad (abajo a la derecha) y elige el tema **Oscuro**. Revisa Inicio, Sistemas, una ficha y «Solicitar».

## Si algún día editas CSS tú mismo
Ejecuta `bash construir.sh` (necesita Node.js) y sube también `css/estilos.css` y `index.html`.
