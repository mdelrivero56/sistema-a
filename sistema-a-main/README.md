# GobHub

Sitio web estático para consultar y administrar el catálogo institucional de sistemas digitales.

## Estructura

- `index.html`: página principal. GitHub Pages busca este archivo para mostrar el sitio.
- `catalogo.json`: datos del catálogo (categorías, sistemas y configuración inicial).
- `css/`: hojas de estilo fuente (numeradas; las últimas tienen prioridad). `22-minimalista.css` es la capa final de diseño (estilo minimalista profesional con el logotipo `img/logo-gobhub.png`); para volver al diseño anterior borra ese archivo y ejecuta `./construir.sh`. **`css/estilos.css` es el archivo que carga la página** y se genera uniendo todas las hojas.
- `fonts/`: tipografías (Plus Jakarta Sans y Archivo) alojadas en el sitio.
- `construir.sh`: regenera `css/estilos.css` y `js/app.min.js` y actualiza el número de versión en `index.html`. Ejecútalo (requiere Node.js) cada vez que edites un CSS o JS fuente, y sube también los archivos generados.
- `js/app.js`: lógica principal (fuente). La página carga `js/app.min.js`, versión minificada que incluye `app.js`, `demo-video.js`, `galeria-flechas.js` y `scroll-fx.js`.
- `SEGURIDAD.md`: controles aplicados, pruebas y pendientes (Supabase RLS, GitHub, Vercel).
- `vercel.json`: cabeceras de seguridad (CSP, HSTS…) para Vercel.
- `js/config.js`: configuración base e integración con servicios.

## Probar en tu computadora

Abre `index.html` en el navegador. Para una prueba más fiel, ejecuta un servidor local desde esta carpeta, por ejemplo con la extensión **Live Server** de Visual Studio Code.

## Publicar en GitHub Pages

1. Entra a https://github.com e inicia sesión.
2. Pulsa **New repository**. Ponle un nombre, por ejemplo `catalogo-sistemas`.
3. Elige **Public** si quieres que el sitio sea público (o la visibilidad que permita tu plan y organización). No subas información confidencial.
4. Dentro del repositorio, pulsa **Add file → Upload files**.
5. Descomprime este ZIP en tu computadora y arrastra al área de carga el contenido de esta carpeta: `index.html`, `catalogo.json`, `css/`, `js/`, y `README.md`. Debe quedar `index.html` en la raíz del repositorio, no dentro de otra carpeta.
6. Escribe un mensaje como `Agregar archivos iniciales` y pulsa **Commit changes**.
7. Abre **Settings → Pages**.
8. En **Build and deployment**, selecciona **Deploy from a branch**; elige la rama `main` y la carpeta `/(root)`, y guarda.
9. Espera a que termine la publicación. La dirección aparecerá en **Settings → Pages**, normalmente con formato `https://TU-USUARIO.github.io/NOMBRE-REPOSITORIO/`.

## Importante antes de publicarlo

- Este proyecto parece ser una aplicación de frontend estática. GitHub Pages publica archivos estáticos; no ejecuta servidores ni funciones privadas.
- `SEGURIDAD.md`: controles aplicados, pruebas y pendientes (Supabase RLS, GitHub, Vercel).
- `vercel.json`: cabeceras de seguridad (CSP, HSTS…) para Vercel.
- `js/config.js` contiene configuración del frontend y una clave publicable de Supabase. Las claves publicables están diseñadas para usarse en el cliente, pero la seguridad real debe configurarse con políticas RLS y permisos adecuados en Supabase. **Nunca** publiques una clave `service_role`, contraseñas, tokens privados ni secretos.
- La dirección de correo de administración incluida en el código puede quedar visible para cualquiera que descargue el sitio. Revisa si quieres publicarla.
- No uses el correo o una condición en JavaScript como única protección para funciones de superadministrador: la autorización importante debe validarse también en el servidor/base de datos.
- Revisa `catalogo.json` para asegurarte de que no contenga datos personales o información interna que no deba ser pública.
- La carpeta antigua `_respaldo-sin-usar/` se excluyó de esta versión limpia porque contiene copias antiguas de CSS y JavaScript que podrían causar confusión. Conserva el ZIP original como respaldo si necesitas recuperarlas.
