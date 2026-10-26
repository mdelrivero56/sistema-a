# GobHub · Seguridad

Resumen de lo aplicado, cómo se probó y lo que falta configurar fuera del código.
Referencias: OWASP Top 10 (2021) y OWASP ASVS nivel 1.

## Aplicado en este paquete
| Control | Dónde | Cubre |
|---|---|---|
| Política de contenido (CSP) estricta: solo scripts propios + jsDelivr/unpkg (Supabase), sin `eval`, sin objetos, sin iframes ajenos salvo YouTube/Vimeo | `vercel.json` (cabecera) e `index.html` (meta, para otros hosts) | A03 Inyección/XSS, A05 Configuración |
| HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY` + `frame-ancestors 'none'`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP | `vercel.json` | A05, clickjacking, fuga de referer |
| Adjuntos activos (HTML, SVG, XML, JS) ya no se abren en el sitio: se fuerzan como descarga neutra | `js/app.js` y `js/app.min.js` (`dataToBlob`) | XSS almacenado por archivo subido |
| Caché larga e inmutable solo para css/js/fonts/img | `vercel.json` | Rendimiento sin servir versiones viejas (versión `?v=` en index) |

Ya existían y se verificaron: escape de todo texto dinámico (`esc`), URLs solo `http/https` (`urlOk`), imágenes solo `data:image/*` (`imgOk`), sin controladores `onclick=` en línea, sin `eval`, autenticación y reglas de acceso con Supabase (Auth + RLS), clave pública (`sb_publishable_…`), `.env` ignorado.

## Pruebas realizadas
1. **Fuzz XSS dinámico:** se envenenó cada texto del catálogo con `"><img onerror=…><svg onload=…>` y se visitaron 28 rutas (inicio, sistemas, categorías, fichas, búsqueda, avisos, ayuda, contacto, rutas con carga maliciosa en la URL). Resultado: **0 ejecuciones, 0 elementos inyectados**; el texto se muestra literal.
2. **CSP en navegador real:** carga completa, modo visualizador y 9 rutas con la cabecera CSP activa: **0 violaciones, 0 errores**.
3. **Revisión estática:** búsqueda de `eval`, `new Function`, `document.write`, `insertAdjacentHTML`, controladores en línea y `window.open` (corregido el único caso de blob peligroso).

> No se pudo probar contra el Supabase real (sin red en el entorno de pruebas). Los puntos siguientes dependen de tu proyecto.

## Pendiente en Supabase (lo más importante)
La validación de roles en el navegador (`CORREO_SUPER`, `correoAdmin`) **no es una barrera de seguridad**: cualquiera puede leer `config.js`. La protección real debe ser **RLS** en la base:
1. Activa RLS en **todas** las tablas (`catalogo`, `solicitudes`, perfiles/usuarios, notificaciones…): `alter table <tabla> enable row level security;`
2. `catalogo`: lectura pública solo de la fila publicada; **escritura solo superadmin** (por `auth.uid()` en tabla de perfiles con rol, no por correo del cliente). Ejemplo base:
   ```sql
   create policy "leer catalogo" on catalogo for select using (true);
   create policy "escribir catalogo" on catalogo for all
     using (exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'superadmin'))
     with check (exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'superadmin'));
   ```
   (ajusta nombres de tabla/columnas a los tuyos)
3. `solicitudes`: el usuario solo lee/crea las suyas (`usuario_id = auth.uid()`); admins leen todas.
4. Perfiles: nadie puede cambiarse el propio `rol`/`estado` (política `with check` o trigger).
5. Authentication → activa: confirmación de correo, **protección de contraseñas filtradas**, longitud mínima 10, **CAPTCHA** en registro/login, límites de tasa, y **MFA** para el superadministrador.
6. Mueve el correo del propietario fuera de `config.js` si el repositorio es público.

## Pendiente en GitHub / Vercel
- GitHub: 2FA para todos, protección de la rama `main`, *Secret scanning* y *Dependabot* activados.
- Vercel: el despliegue ya aplica `vercel.json`; verifica en <https://securityheaders.com> (debe dar A/A+) y <https://observatory.mozilla.org>.
- **SRI / sin CDN:** para quitar la dependencia de jsDelivr/unpkg, descarga `supabase-js@2.45.4` (`npm pack @supabase/supabase-js@2.45.4`, toma `dist/umd/supabase.min.js`), colócalo en `js/vendor/` y cambia las dos URLs de `fuentes` en `js/app.js` por esa ruta; luego puedes quitar ambos dominios de `script-src`. Si prefieres mantener CDN: `openssl dss1 -sha384 -binary supabase.min.js | openssl base64 -A` y añade `integrity="sha384-…" crossorigin="anonymous"` al `<script>` creado en `cargarScript`.
- Publica `/.well-known/security.txt` con el contacto de seguridad real (campos `Contact` y `Expires`).

## Si algo deja de cargar tras la CSP
Abre la consola del navegador: un bloqueo aparece como «Refused to … Content Security Policy». Añade solo el dominio necesario a la directiva indicada en `vercel.json` e `index.html`.
