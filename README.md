# GobHub

Sitio web estático para consultar y administrar el catálogo institucional de sistemas digitales.

## Estructura

- `index.html`: página principal. GitHub Pages busca este archivo para mostrar el sitio.
- `catalogo.json`: datos del catálogo (categorías, sistemas y configuración inicial).
- `css/`: hojas de estilo de la interfaz (`15-escritorio-moderno.css` tiene el diseño de escritorio y los ajustes de celular).
- `js/app.js`: lógica principal de la aplicación.
- `js/config.js`: configuración base e integración con servicios.
- `js/demo-video.js` y `js/galeria-flechas.js`: funciones auxiliares de la interfaz.

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
- `js/config.js` contiene configuración del frontend y una clave publicable de Supabase. Las claves publicables están diseñadas para usarse en el cliente, pero la seguridad real debe configurarse con políticas RLS y permisos adecuados en Supabase. **Nunca** publiques una clave `service_role`, contraseñas, tokens privados ni secretos.
- La dirección de correo de administración incluida en el código puede quedar visible para cualquiera que descargue el sitio. Revisa si quieres publicarla.
- No uses el correo o una condición en JavaScript como única protección para funciones de superadministrador: la autorización importante debe validarse también en el servidor/base de datos.
- Revisa `catalogo.json` para asegurarte de que no contenga datos personales o información interna que no deba ser pública.
- La carpeta antigua `_respaldo-sin-usar/` se excluyó de esta versión limpia porque contiene copias antiguas de CSS y JavaScript que podrían causar confusión. Conserva el ZIP original como respaldo si necesitas recuperarlas.
