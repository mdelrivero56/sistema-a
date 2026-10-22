/* ==========================================================================
   Catálogo de Sistemas · lógica de la aplicación
   La configuración básica está en js/config.js.

   Contenido (en este orden):
   - Utilidades
   - Datos de ejemplo
   - Persistencia (IndexedDB, con respaldo en memoria)
   - Estado
   - Ayudas de interfaz
   - Texto enriquecido (párrafos, viñetas, **negritas**, enlaces)
   - Video de muestra (enlace de YouTube/Vimeo/.mp4 o archivo pequeño)
   - Formato de la descripción: tamaño, color y viñetas
   - Editor de videos (destacados y capturas)
   - Piezas reutilizables
   - Cuentas y sesión (correo + contraseña)
   - Registro propio y notificaciones (sin códigos ni correos)
   - Avisos para usuarios + campana flotante
   - Acceso: pestañas, campos obligatorios y dependencia
   - Superadministrador: autorización con código por correo
   - Mi cuenta
   - Administración de usuarios
   - Roles en Supabase: guardar cambios en la tabla perfiles
   - Apariencia
   - Router
   - Vistas públicas
   - Ficha del sistema
   - Solicitud de sistema
   - Lista de verificación de requisitos
   - Superadministrador: bandeja de solicitudes recibidas
   - Administración
   - Vista previa en vivo de la apariencia (tema + color)
   - Editor de sistema
   - Carga de imágenes y archivos
   - Acceso rápido de administrador y cambio de imagen
   - Modo de pruebas (QA)
   - Renombrar sistema y editar categorías
   - Acciones
   - Arranque
   - Supabase: catálogo público + acceso real (Auth + RLS)
   - Superadministrador (Supabase): código de un solo uso al correo del propietario
   - Recuperar contraseña por enlace al correo (Supabase)
   - Accesibilidad: preferencias guardadas en este dispositivo
   - Registro de dependencias, opciones del formulario y textos legales
   ========================================================================== */
(function () {
"use strict";

const SB_ON = !!(SUPABASE_URL && SUPABASE_KEY);
const URL_RECUP = SB_ON && /[#&?]type=recovery/.test(location.hash + location.search);
const URL_ERR = SB_ON && /[#&?](error_code|error_description)=/.test(location.hash + location.search);
const correoPermitido = (c) => { const x = String(c || "").trim().toLowerCase(); return !DOMINIO_PERMITIDO || x === String(CORREO_SUPER).toLowerCase() || x.endsWith("@" + DOMINIO_PERMITIDO) || x.endsWith("." + DOMINIO_PERMITIDO); };
const avisoDominio = () => `Solo se aceptan correos institucionales que terminen en ${DOMINIO_PERMITIDO}.`;
const ROLES = { visitante: "Usuario", gestor: "Colaborador", superadmin: "Superadministrador" };
const rolDe = (r) => (r === "admin" ? "superadmin" : r === "usuario" ? "visitante" : ROLES[r] ? r : "visitante");

/* ---------- Utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const enc = encodeURIComponent;
const uid = (p) => p + "-" + Math.random().toString(36).slice(2, 9);
const pad = (n) => String(n).padStart(2, "0");
const hoyISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const parseISO = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
const fmtFecha = (iso) => { const d = parseISO(iso); return d ? `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}` : "—"; };
const hace = (iso) => {
  const d = parseISO(iso); if (!d) return "";
  const dias = Math.round((Date.now() - d.getTime()) / 864e5);
  if (dias <= 0) return "hoy"; if (dias === 1) return "ayer";
  if (dias < 30) return `hace ${dias} días`;
  if (dias < 365) { const m = Math.max(1, Math.round(dias / 30)); return `hace ${m} ${m === 1 ? "mes" : "meses"}`; }
  const a = Math.round(dias / 365); return `hace ${a} ${a === 1 ? "año" : "años"}`;
};
const bytes = (n) => n < 1024 ? n + " B" : n < 1048576 ? (n / 1024).toFixed(0) + " KB" : (n / 1048576).toFixed(1) + " MB";
const urlOk = (u) => { try { const x = new URL(String(u || "").trim()); return /^https?:$/.test(x.protocol) ? x.href : ""; } catch (e) { return ""; } };
const correoOk = (c) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(c || "").trim());
const imgOk = (s) => typeof s === "string" && /^data:image\/(png|jpe?g|gif|webp|svg\+xml)[;,]/.test(s);
const clone = (o) => JSON.parse(JSON.stringify(o));
const norm = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const plural = (n, a, b) => (n === 1 ? a : b);

const COLORES = {
  azul: ["#3B82D6", "#004EAA"], celeste: ["#7FB0EC", "#2F7BD0"], marino: ["#2F6FC4", "#003F8A"],
  lila: ["#B392DD", "#9568C6"], orquidea: ["#CDB5EA", "#A47BD0"], violeta: ["#A47BD0", "#6D45A3"]
};
/* Solo se ofrecen tonos de la paleta (azul #004EAA y lila #9568C6). Los nombres antiguos se convierten a su tono equivalente. */
const COLORES_UI = ["azul", "celeste", "marino", "lila", "orquidea", "violeta"];
const COLOR_LEGACY = { indigo: "marino", morado: "lila", rosa: "orquidea", rojo: "violeta", naranja: "celeste", amarillo: "orquidea", verde: "azul", turquesa: "celeste", grafito: "marino" };
for (const [o, n] of Object.entries(COLOR_LEGACY)) COLORES[o] = COLORES[n];
const colorUI = (c) => (COLORES_UI.includes(c) ? c : (COLOR_LEGACY[c] || "azul"));
/* Colores antiguos: siguen funcionando pero se muestran con la paleta oficial (azul / lila). */
const GLIFOS = ["votacion", "calendario", "documento", "candado", "ayuda", "caja", "usuarios", "identidad", "capas", "app", "chart", "mensaje", "mapa", "nube", "tablet", "qr", "correo", "reloj", "estrella", "ajustes", "escudo", "libro", "rayo", "globo", "casa", "carpeta", "pin", "telefono", "camara", "megafono", "balanza", "maletin", "bombilla", "corazon", "tarjeta", "graduacion", "trofeo", "bandera", "herramienta", "basedatos", "codigo", "impresora", "wifi", "microfono", "pastel", "hoja", "salud"];
const ESTADOS = ["Disponible", "Requiere validación", "Próximamente", "En mantenimiento"];
const TIPOS_USO = ["Evento o reunión", "Uso institucional recurrente", "Prueba o demostración", "Otro"];
const USOS_SUGERIDOS = ["Eventos", "Reuniones", "Sesiones", "Votaciones", "Registro de asistentes", "Trámites", "Documentos", "Seguridad", "Soporte"];

const glifo = (n, cls = "") => `<svg class="g ${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#g-${esc(n)}"/></svg>`;
const colorVars = (c) => { const p = COLORES[c] || COLORES.azul; return `--c1:${p[0]};--c2:${p[1]}`; };
function icono(s, size = "s64") {
  const i = s.icono || {};
  const inner = imgOk(i.imagen) ? `<img src="${esc(i.imagen)}" alt="">` : glifo(GLIFOS.includes(i.glifo) ? i.glifo : "app");
  return `<span class="ico ${size}" style="${colorVars(i.color)}">${inner}</span>`;
}

const catInner = (k) => imgOk(k.imagen) ? `<img src="${esc(k.imagen)}" alt="">` : glifo(GLIFOS.includes(k.glifo) ? k.glifo : "app");
const catCls = (k) => (imgOk(k.imagen) ? " has-img" : "");
/* ---------- Datos de ejemplo ---------- */
function mock(color, v, titulo) {
  const [a, b] = COLORES[color] || COLORES.azul;
  let body = "";
  if (v === 0) {
    for (let i = 0; i < 5; i++) { const y = 92 + i * 74; body += `<rect x="32" y="${y}" width="736" height="60" rx="14" fill="#fff"/><circle cx="66" cy="${y + 30}" r="16" fill="${a}" opacity=".85"/><rect x="96" y="${y + 17}" width="${200 + ((i * 53) % 140)}" height="10" rx="5" fill="#2b3340" opacity=".8"/><rect x="96" y="${y + 36}" width="${120 + ((i * 37) % 100)}" height="8" rx="4" fill="#9aa3b2"/><rect x="668" y="${y + 19}" width="68" height="22" rx="11" fill="${a}" opacity=".3"/>`; }
  } else if (v === 1) {
    [0, 1, 2].forEach((i) => { body += `<rect x="${32 + i * 248}" y="88" width="224" height="96" rx="16" fill="#fff"/><rect x="${52 + i * 248}" y="110" width="80" height="8" rx="4" fill="#9aa3b2"/><rect x="${52 + i * 248}" y="134" width="${90 + i * 20}" height="26" rx="8" fill="${b}" opacity=".85"/>`; });
    body += `<rect x="32" y="204" width="736" height="264" rx="16" fill="#fff"/>`;
    [140, 190, 110, 220, 170, 90, 200].forEach((h, i) => { body += `<rect x="${72 + i * 96}" y="${440 - h}" width="52" height="${h}" rx="10" fill="${i % 2 ? a : b}" opacity="${i % 2 ? .55 : .9}"/>`; });
  } else {
    body += `<rect x="32" y="88" width="736" height="380" rx="16" fill="#fff"/>`;
    for (let i = 0; i < 4; i++) { const x = 64 + (i % 2) * 352, y = 120 + Math.floor(i / 2) * 100; body += `<rect x="${x}" y="${y}" width="90" height="8" rx="4" fill="#9aa3b2"/><rect x="${x}" y="${y + 18}" width="320" height="42" rx="10" fill="#f1f3f8" stroke="#dfe3ec"/>`; }
    body += `<rect x="64" y="330" width="200" height="40" rx="12" fill="${b}"/><rect x="278" y="330" width="120" height="40" rx="12" fill="#e8ecf4"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><rect width="800" height="500" fill="#f2f4f9"/><rect width="800" height="64" fill="${b}"/><circle cx="36" cy="32" r="10" fill="#fff" opacity=".9"/><text x="58" y="39" font-family="system-ui,sans-serif" font-size="20" font-weight="700" fill="#fff">${esc(titulo)}</text>${body}</svg>`;
  return { src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg), pie: ["Vista principal", "Resultados y reportes", "Configuración"][v] };
}
const capturas = (c, t) => [0, 1, 2].map((v) => mock(c, v, t));
/* Video corto de demostración (6 s) para probar cómo se ve un video de muestra */

function sistemaBase(o) {
  return Object.assign({
    id: uid("sis"), nombre: "", subtitulo: "", icono: { glifo: "app", color: "azul", imagen: "" }, portada: "",
    categorias: [], usos: [], estado: "Disponible", publicado: true, destacado: false, etiqueta: "", tipoSis: "", ligados: [],
    version: "1.0", actualizado: hoyISO(), area: "", contacto: { correo: "", telefono: "" },
    descripcion: "", plataforma: "Web", requisitos: [], pasos: [], enlaces: [], tecnica: [],
    dependencias: [], novedades: [], capturas: [], archivos: [], videos: [], videoDestacado: { url: "", data: "", nombre: "" }, descTam: "16", descColor: "", ejemplo: false
  }, o);
}

const CATEGORIAS_BASE = [
  {
    "id": "desarrollo",
    "nombre": "Desarrollo de Software",
    "glifo": "app",
    "color": "azul",
    "descripcion": "Herramientas y soluciones digitales institucionales."
  },
  {
    "id": "reuniones",
    "nombre": "Reuniones y Eventos",
    "glifo": "calendario",
    "color": "celeste",
    "descripcion": "Para organizar reuniones, agendas y eventos."
  },
  {
    "id": "votaciones-elecciones",
    "nombre": "Votaciones y Elecciones",
    "glifo": "votacion",
    "color": "azul",
    "descripcion": "Para gestionar procesos de votación y selección."
  },
  {
    "id": "encuestas",
    "nombre": "Encuestas y Formularios",
    "glifo": "mensaje",
    "color": "celeste",
    "descripcion": "Para recopilar información y respuestas."
  },
  {
    "id": "portales",
    "nombre": "Portales y Trámites",
    "glifo": "globo",
    "color": "morado",
    "descripcion": "Portales informativos y trámites digitales."
  },
  {
    "id": "etica-denuncias",
    "nombre": "Ética y Denuncias",
    "glifo": "candado",
    "color": "morado",
    "descripcion": "Para asuntos relacionados con la ética institucional."
  },
  {
    "id": "capacitacion",
    "nombre": "Capacitación y Aprendizaje",
    "glifo": "estrella",
    "color": "morado",
    "descripcion": "Para cursos, formación y desarrollo de conocimientos."
  },
  {
    "id": "gestion-administrativa",
    "nombre": "Gestión Administrativa y Sistemas",
    "glifo": "chart",
    "color": "azul",
    "descripcion": "Para herramientas de control y gestión institucional."
  }
];
/* Textos oficiales de cada sistema: frase corta (máx. 5 palabras), texto destacado y descripción resumida.
   Se usan en el catálogo inicial y en Administración → Datos y publicación → «Actualizar textos de los sistemas». */
const TEXTOS_SISTEMAS = [
  {
    "id": "sis-votaciones",
    "alias": [
      "votaciones",
      "sistema de votaciones"
    ],
    "nombre": "Sistema de Votaciones",
    "subtitulo": "Cada voto cuenta",
    "etiqueta": "Digitaliza votaciones y controla la participación en eventos.",
    "glifo": "votacion",
    "color": "azul",
    "categoria": "votaciones-elecciones",
    "usos": [
      "Votaciones",
      "Eventos",
      "Reuniones"
    ],
    "destacado": true,
    "descripcion": "El **Sistema de Votaciones** permite realizar **votaciones electrónicas** en reuniones, sesiones y eventos con tablets individuales, y obtener resultados al instante.\n\n**Funcionalidades principales:**\n- Votaciones con **tablets individuales**\n- Preguntas con **dos o tres opciones**\n- **Registro de participación** y de quién ya votó\n- **Conteo y resultados** de cada votación\n- Menos **papeletas** y registros manuales"
  },
  {
    "id": "sis-encuestas",
    "alias": [
      "encuestas interactivas",
      "encuestas"
    ],
    "nombre": "Encuestas Interactivas",
    "subtitulo": "Pregunta, recopila y descubre",
    "etiqueta": "Crea formularios y concentra las respuestas en un solo lugar.",
    "glifo": "mensaje",
    "color": "celeste",
    "categoria": "encuestas",
    "usos": [
      "Encuestas",
      "Consultas",
      "Registros"
    ],
    "destacado": true,
    "descripcion": "**Encuestas Interactivas** permite **crear, publicar y administrar formularios** digitales para recopilar información y analizar las respuestas.\n\n**Funcionalidades principales:**\n- Creación de **encuestas y formularios**\n- Distribución mediante **enlaces**\n- **Respuestas concentradas** en un mismo espacio\n- **Filtrado y descarga** de datos para análisis\n- Apoyo a la elaboración de **reportes**"
  },
  {
    "id": "sis-sigta",
    "alias": [
      "sigta",
      "sigta 3",
      "sigta 3.1"
    ],
    "nombre": "SIGTA 3",
    "subtitulo": "Tecnología y gestión integradas",
    "etiqueta": "Centraliza el acceso a las herramientas institucionales.",
    "glifo": "chart",
    "color": "azul",
    "categoria": "gestion-administrativa",
    "usos": [
      "Gestión",
      "Herramientas"
    ],
    "destacado": true,
    "descripcion": "**SIGTA 3** es un sistema institucional que **centraliza el acceso** a las herramientas digitales disponibles para usuarios autorizados.\n\n**Funcionalidades principales:**\n- Acceso a **herramientas digitales** institucionales\n- Consulta de funciones **según tus permisos**\n- **Centralización** de recursos en una sola plataforma\n- Apoyo a la **gestión** de recursos tecnológicos"
  },
  {
    "id": "sis-gafetes",
    "alias": [
      "gafetes digitales",
      "gafetes"
    ],
    "nombre": "Gafetes Digitales",
    "subtitulo": "Identificación digital, más sencilla",
    "etiqueta": "Administra gafetes digitales de forma centralizada.",
    "glifo": "identidad",
    "color": "morado",
    "categoria": "gestion-administrativa",
    "usos": [
      "Identificación",
      "Eventos"
    ],
    "destacado": false,
    "descripcion": "**Gafetes Digitales** facilita la **administración de la identificación digital** de la institución, con la información organizada en un solo lugar.\n\n**Funcionalidades principales:**\n- Administración de **gafetes digitales**\n- Información de identificación **organizada**\n- Consulta de datos **según permisos**\n- Transición de procesos **manuales a digitales**"
  },
  {
    "id": "sis-orden-dia",
    "alias": [
      "sistema de orden del dia",
      "orden del dia"
    ],
    "nombre": "Sistema de Orden del Día",
    "subtitulo": "Reuniones con rumbo claro",
    "etiqueta": "Organiza actividades, horarios y expositores en una agenda digital.",
    "glifo": "reloj",
    "color": "celeste",
    "categoria": "reuniones",
    "usos": [
      "Reuniones",
      "Sesiones",
      "Eventos"
    ],
    "destacado": false,
    "descripcion": "El **Sistema de Orden del Día** facilita planear reuniones y eventos con **agendas digitales** estructuradas, y se integra con el **Gestor de Eventos**.\n\n**Funcionalidades principales:**\n- Creación de **órdenes del día**\n- Temas, **horarios** y **expositores** por actividad\n- **Enlaces** y archivos complementarios\n- Uso **independiente** o vinculado al Gestor de Eventos"
  },
  {
    "id": "sis-gestor-eventos",
    "alias": [
      "gestor de eventos"
    ],
    "nombre": "Gestor de Eventos",
    "subtitulo": "Tus eventos, bien organizados",
    "etiqueta": "Consulta y organiza los eventos de tu institución.",
    "glifo": "calendario",
    "color": "azul",
    "categoria": "reuniones",
    "usos": [
      "Eventos",
      "Reuniones"
    ],
    "destacado": false,
    "descripcion": "El **Gestor de Eventos** permite **registrar, organizar y consultar** las actividades de la institución, desde posadas hasta ceremonias y reuniones.\n\n**Funcionalidades principales:**\n- Registro de **nombre, fecha y ubicación**\n- Clasificación por **categoría y tipo**\n- **Consulta** de la información registrada\n- Vinculación con el **Orden del Día**"
  },
  {
    "id": "sis-votaciones-etica",
    "alias": [
      "votaciones del comite de etica"
    ],
    "nombre": "Votaciones del Comité de Ética",
    "subtitulo": "Votación por etapas, resultados claros",
    "etiqueta": "Gestiona etapas de votación y consulta resultados.",
    "glifo": "escudo",
    "color": "morado",
    "categoria": "votaciones-elecciones",
    "usos": [
      "Votaciones",
      "Ética"
    ],
    "destacado": false,
    "descripcion": "**Votaciones del Comité de Ética** organiza procesos de selección con **votaciones digitales por etapas**, concentrando los resultados conforme a las reglas del Comité.\n\n**Funcionalidades principales:**\n- Presentación de **candidatos**\n- Procesos en **fases** según las reglas\n- **Registro de votos** y resultados por fase\n- Identificación de las **candidaturas más votadas**\n- Medidas de **confidencialidad**"
  },
  {
    "id": "sis-stem",
    "alias": [
      "pagina stem chihuahua",
      "stem chihuahua"
    ],
    "nombre": "Página STEM Chihuahua",
    "subtitulo": "Ciencia y tecnología para Chihuahua",
    "etiqueta": "Conoce los centros e iniciativas STEM de Chihuahua.",
    "glifo": "rayo",
    "color": "celeste",
    "categoria": "portales",
    "usos": [
      "Información",
      "Ciencia y tecnología"
    ],
    "destacado": false,
    "descripcion": "La **Página STEM Chihuahua** es un portal informativo que difunde **centros, capacidades e iniciativas** de ciencia, tecnología, ingeniería y matemáticas.\n\n**Funcionalidades principales:**\n- **Directorio** de centros STEM\n- Información de **laboratorios** y capacidades\n- **Noticias**, convocatorias y actividades\n- Acceso a **documentación institucional**"
  },
  {
    "id": "sis-portal-chihuahua",
    "alias": [
      "portal chihuahua"
    ],
    "nombre": "Portal CHIHUAHUA",
    "subtitulo": "Servicios del estado, al alcance",
    "etiqueta": "Información, trámites y servicios en un solo portal.",
    "glifo": "globo",
    "color": "azul",
    "categoria": "portales",
    "usos": [
      "Información",
      "Trámites"
    ],
    "destacado": false,
    "descripcion": "El **Portal CHIHUAHUA** es el sitio oficial del Gobierno del Estado: un punto de acceso a **información pública, trámites y servicios**.\n\n**Funcionalidades principales:**\n- **Noticias** y comunicados oficiales\n- Información de **dependencias** estatales\n- Localización de **trámites y servicios**\n- Acceso a **plataformas digitales** y transparencia"
  },
  {
    "id": "sis-cpd-web",
    "alias": [
      "pagina web cpd",
      "pagina web cpd coordinacion de politica digital",
      "pagina web cpd — coordinacion de politica digital"
    ],
    "nombre": "Página Web CPD",
    "subtitulo": "Innovación digital para Chihuahua",
    "etiqueta": "Conoce proyectos y soluciones tecnológicas de la CPD.",
    "glifo": "app",
    "color": "morado",
    "categoria": "portales",
    "usos": [
      "Información",
      "Innovación"
    ],
    "destacado": false,
    "descripcion": "La **Página Web de la CPD** difunde las **actividades, proyectos e iniciativas** de la Coordinación de Política Digital del Gobierno de Chihuahua.\n\n**Funcionalidades principales:**\n- Proyectos de **transformación digital**\n- **Noticias** y comunicados\n- Información de **servicios y soluciones** tecnológicas\n- Enlaces a **plataformas** institucionales"
  },
  {
    "id": "sis-mitch",
    "alias": [
      "mitch",
      "mitch — mi tramite chihuahua",
      "mitch mi tramite chihuahua"
    ],
    "nombre": "MITCH",
    "subtitulo": "Tus trámites, ahora digitales",
    "etiqueta": "Consulta trámites y servicios del Gobierno de Chihuahua.",
    "glifo": "documento",
    "color": "celeste",
    "categoria": "portales",
    "usos": [
      "Trámites",
      "Información"
    ],
    "destacado": false,
    "descripcion": "**MITCH (Mi Trámite Chihuahua)** facilita consultar **trámites y servicios** del Gobierno del Estado, con sus requisitos y procedimientos.\n\n**Funcionalidades principales:**\n- **Búsqueda** de trámites por nombre o dependencia\n- Consulta de **requisitos, costos y plazos**\n- **Registro** e inicio de sesión\n- **Solicitudes digitales** en trámites habilitados"
  }
];

function datosEjemplo() {
  const area = "Coordinación de Política Digital";
  const S = (o) => sistemaBase(Object.assign({ area, ejemplo: false, plataforma: "Web", version: "1.0" }, o));
  return {
    formato: 2, editado: false, actualizado: hoyISO(),
    config: clone(CONFIG_BASE),
    categorias: clone(CATEGORIAS_BASE),
    sistemas: TEXTOS_SISTEMAS.map((t) => S({ id: t.id, nombre: t.nombre, subtitulo: t.subtitulo, etiqueta: t.etiqueta, descripcion: t.descripcion, categorias: [t.categoria], icono: { glifo: t.glifo, color: t.color, imagen: "" }, usos: t.usos.slice(), destacado: t.destacado }))
  };
}

function migrar(c) {
  c = c || {};
  const base = datosEjemplo();
  const out = { formato: 2, editado: !!c.editado, actualizado: c.actualizado || hoyISO(), config: Object.assign({}, CONFIG_BASE, c.config || {}) };
  delete out.config.whatsapp;
  out.config.correoDestino = ""; out.config.endpoint = ""; out.config.correoOficio = String(out.config.correoOficio || "").trim();
  if (!String(out.config.correoAdmin || "").trim()) out.config.correoAdmin = CONFIG_BASE.correoAdmin;
  out.usuarios = Array.isArray(c.usuarios) ? c.usuarios.filter((u) => u && (u.correo || u.rfc) && u.hash).map((u) => Object.assign({}, u, { rol: rolDe(u.rol) })) : [];
  out.avisos = Array.isArray(c.avisos) ? c.avisos.filter((a) => a && a.id).slice(0, 300) : [];
  out.notificaciones = Array.isArray(c.notificaciones) ? c.notificaciones.filter((n) => n && n.id).slice(0, 200) : [];
  /* Categorías eliminadas: no se vuelven a agregar las de base (antes reaparecían en cada carga). */
  out.categoriasEliminadas = Array.isArray(c.categoriasEliminadas) ? c.categoriasEliminadas.filter((x) => typeof x === "string") : [];
  out.categorias = (Array.isArray(c.categorias) ? c.categorias.filter((cc) => cc && cc.id) : base.categorias)
    .filter((cc) => !out.categoriasEliminadas.includes(cc.id));
  out.sistemas = (Array.isArray(c.sistemas) ? c.sistemas : []).map((s) => {
    const b = sistemaBase({});
    const r = Object.assign(b, s, { id: s.id || uid("sis") });
    r.icono = Object.assign({ glifo: "app", color: "azul", imagen: "" }, s.icono || {});
    r.contacto = Object.assign({ correo: "", telefono: "" }, s.contacto || {});
    ["categorias", "usos", "requisitos", "pasos", "enlaces", "tecnica", "dependencias", "novedades", "capturas", "archivos", "videos"].forEach((k) => { if (!Array.isArray(r[k])) r[k] = []; });
    r.videoDestacado = Object.assign({ url: "", data: "", nombre: "" }, r.videoDestacado && typeof r.videoDestacado === "object" ? r.videoDestacado : {});
    if (FORMATO_AUTOMATICO && typeof r.descripcion === "string") r.descripcion = formatoAuto(r.descripcion, r.nombre);
    return r;
  });
  out.sistemas.forEach((s) => { if (s.id === "sis-cpd-academy" && s.nombre === "CPD ACADEMY") s.nombre = "CPD Academy"; });
  return out;
}
const catValido = (j) => j && typeof j === "object" && Array.isArray(j.sistemas) && Array.isArray(j.categorias);

/* ---------- Persistencia (IndexedDB, con respaldo en memoria) ---------- */
const IDB = {
  db: null,
  open() {
    return new Promise((res) => {
      try {
        const r = indexedDB.open("catalogo-sistemas", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("kv");
        r.onsuccess = () => { this.db = r.result; res(true); };
        r.onerror = () => res(false); r.onblocked = () => res(false);
      } catch (e) { res(false); }
    });
  },
  get(k) {
    return new Promise((res) => {
      if (!this.db) return res(undefined);
      try { const q = this.db.transaction("kv").objectStore("kv").get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(undefined); } catch (e) { res(undefined); }
    });
  },
  set(k, v) {
    return new Promise((res) => {
      if (!this.db) return res(false);
      try { const t = this.db.transaction("kv", "readwrite"); t.objectStore("kv").put(v, k); t.oncomplete = () => res(true); t.onerror = () => res(false); t.onabort = () => res(false); } catch (e) { res(false); }
    });
  },
  del(k) {
    return new Promise((res) => {
      if (!this.db) return res(false);
      try { const t = this.db.transaction("kv", "readwrite"); t.objectStore("kv").delete(k); t.oncomplete = () => res(true); t.onerror = () => res(false); } catch (e) { res(false); }
    });
  }
};

/* ---------- Estado ---------- */
const S = { cat: null, user: null, guest: false, super: false, qa: false, qaSnap: null, qaLog: [], qaRes: null, authView: "login", authInfo: null, sols: [], admin: false, q: "", pub: null, drafts: {}, cfg: null, memoria: false };

let tGuardar = null, guardadoPend = false;
let catRev = 0;
function guardarCatalogo(marcar = true) {
  if (marcar) { S.cat.editado = true; S.cat.actualizado = hoyISO(); catRev++; }
  clearTimeout(tGuardar);
  if (S.qa) return;
  guardadoPend = true;
  tGuardar = setTimeout(async () => {
    guardadoPend = false;
    if (S.qa) return;
    const ok = await IDB.set("catalogo", Object.assign({}, S.cat, { sinPublicar: !!(SB && S.admin) }));
    if (!ok) toast("No se pudieron guardar los cambios en este navegador. Descarga el catálogo para no perderlos.");
    if (SB && S.admin) sbEnCola();
  }, 250);
}
async function guardarSolicitudes() { if (S.qa) return; const ok = await IDB.set("solicitudes", S.sols); if (!ok) toast("No se pudo guardar el historial en este dispositivo."); }

const vis = () => S.cat.sistemas.filter((s) => s.publicado || S.admin);
const byId = (id) => S.cat.sistemas.find((s) => s.id === id);
const catById = (id) => S.cat.categorias.find((c) => c.id === id);
const cfg = () => S.cat.config;
const todosUsos = () => { const m = new Map(); vis().forEach((s) => s.usos.forEach((u) => m.set(u, (m.get(u) || 0) + 1))); return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es")); };

/* ---------- Ayudas de interfaz ---------- */
const layer = $("#layer");
const view = $("#view");

function toast(msg) {
  $$(".toast", layer).forEach((t) => t.remove());
  const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg; layer.appendChild(t);
  clearTimeout(toast._t); toast._t = setTimeout(() => t.remove(), 3400);
}
async function copiar(texto, msg = "Copiado") {
  try { await navigator.clipboard.writeText(texto); toast(msg); return; } catch (e) { /* respaldo */ }
  const ta = document.createElement("textarea"); ta.value = texto; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
  document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); toast(msg); } catch (e) { toast("Selecciona el texto y cópialo manualmente."); }
  ta.remove();
}

let modalPrev = null, modalOnClose = null, confFin = null;
function modal({ titulo, body, pie = "", wide = false, onclose = null }) {
  cerrarModal();
  modalPrev = document.activeElement; modalOnClose = onclose;
  const m = document.createElement("div"); m.className = "modal"; m.id = "modal";
  m.innerHTML = `<div class="sheet ${wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="mt"><header><h2 id="mt">${esc(titulo)}</h2><button class="iconbtn" data-act="cerrar-modal" aria-label="Cerrar">${glifo("x")}</button></header><div class="body">${body}</div>${pie ? `<footer>${pie}</footer>` : ""}</div>`;
  m.addEventListener("mousedown", (e) => { if (e.target === m) cerrarModal(); });
  layer.appendChild(m);
  const f = $("input,textarea,select", m) || $(".sheet footer .btn:last-child", m) || $(".iconbtn", m);
  if (f) f.focus();
}
function cerrarModal() {
  const m = $("#modal"); if (!m) return;
  m.remove();
  const cb = modalOnClose; modalOnClose = null; if (cb) cb();
  try { if (modalPrev && modalPrev.focus) modalPrev.focus(); } catch (e) {}
}
function confirmar({ titulo, texto, si = "Aceptar", peligro = false, no = "Cancelar" }) {
  return new Promise((res) => {
    let hecho = false;
    confFin = (v) => { if (hecho) return; hecho = true; confFin = null; cerrarModal(); res(v); };
    modal({
      titulo, body: `<p class="muted">${esc(texto)}</p>`,
      pie: `<button class="btn sec" data-act="conf-no">${esc(no)}</button><button class="btn ${peligro ? "danger" : ""}" data-act="conf-si">${esc(si)}</button>`,
      onclose: () => { if (!hecho) { hecho = true; confFin = null; res(false); } }
    });
  });
}

let lb = null;
function abrirLightbox(items, i) { lb = { items, i }; pintarLightbox(); }
function pintarLightbox() {
  let el = $("#lb");
  if (!el) { el = document.createElement("div"); el.id = "lb"; el.className = "lightbox"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Vista ampliada"); layer.appendChild(el); }
  const it = lb.items[lb.i], uno = lb.items.length < 2;
  el.innerHTML = `<header><span>${lb.i + 1} / ${lb.items.length}</span><button class="iconbtn" data-act="lb-cerrar" aria-label="Cerrar">${glifo("x")}</button></header>
    <div class="stage">${uno ? "" : `<button class="nav l" data-act="lb-prev" aria-label="Anterior">${glifo("back")}</button>`}<img src="${esc(it.src)}" alt="${esc(it.pie || "Imagen ampliada")}">${uno ? "" : `<button class="nav r" data-act="lb-next" aria-label="Siguiente">${glifo("chev")}</button>`}</div>
    <footer>${esc(it.pie || "")}</footer>`;
  const b = $('[data-act="lb-cerrar"]', el); if (b) b.focus();
}
function cerrarLightbox() { const el = $("#lb"); if (el) el.remove(); lb = null; }

/* ---------- Texto enriquecido (párrafos, viñetas, **negritas**, enlaces) ---------- */
const inline = (s) => aplicarFormato(esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")).replace(/(https?:\/\/[^\s<]*[^\s<.,;:!?)&])/g, (u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`);
function rich(t) {
  const lines = String(t || "").replace(/\r/g, "").split("\n");
  let out = "", lista = false, par = [];
  const fp = () => { if (par.length) { out += "<p>" + par.map(inline).join("<br>") + "</p>"; par = []; } };
  const fl = () => { if (lista) { out += "</ul>"; lista = false; } };
  for (const l of lines) {
    const m = /^\s*(?:[-•*]\s+|[>›»→▸►]+\s*)(.*)$/.exec(l);
    if (m) { fp(); if (!lista) { out += "<ul>"; lista = true; } out += "<li>" + inline(m[1]) + "</li>"; }
    else if (!l.trim()) { fp(); fl(); }
    else { fl(); par.push(l); }
  }
  fp(); fl(); return out;
}

/* ---------- Video de muestra (enlace de YouTube/Vimeo/.mp4 o archivo pequeño) ---------- */
const LIMITE_VIDEO = 6 * 1024 * 1024;   // 6 MB por video subido; para videos largos usa un enlace
const videoOk = (s) => typeof s === "string" && /^data:video\/(mp4|webm|ogg|quicktime)[;,]/.test(s);
function videoInfo(v) {
  if (!v || typeof v !== "object") return null;
  if (videoOk(v.data)) return { tipo: "archivo", src: v.data, etiqueta: v.nombre || "Video subido" };
  const u = urlOk(v.url); if (!u) return null;
  try {
    const x = new URL(u), h = x.hostname.replace(/^www\./, "");
    let id = "";
    if (h === "youtu.be") id = x.pathname.slice(1).split("/")[0];
    else if (/(^|\.)youtube\.com$/.test(h)) id = x.searchParams.get("v") || ((/^\/(embed|shorts|live)\/([\w-]{6,})/.exec(x.pathname) || [])[2] || "");
    if (id && /^[\w-]{6,20}$/.test(id)) return { tipo: "yt", src: `https://www.youtube-nocookie.com/embed/${id}?rel=0`, etiqueta: "YouTube" };
    if (h === "vimeo.com" || h === "player.vimeo.com") { const n = /(\d{6,})/.exec(x.pathname); if (n) return { tipo: "vimeo", src: `https://player.vimeo.com/video/${n[1]}`, etiqueta: "Vimeo" }; }
    if (/\.(mp4|webm|ogg|mov)$/i.test(x.pathname)) return { tipo: "archivo", src: u, etiqueta: hostDe(u) };
  } catch (e) { return null; }
  return { tipo: "enlace", src: u, etiqueta: hostDe(u) };
}
function videoHtml(info, titulo) {
  if (!info) return "";
  const t = esc(titulo || "Video de muestra");
  if (info.tipo === "yt" || info.tipo === "vimeo") return `<iframe src="${esc(info.src)}" title="${t}" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  if (info.tipo === "archivo") return `<video controls playsinline preload="metadata" src="${esc(info.src)}" aria-label="${t}">Tu navegador no puede reproducir este video.</video>`;
  return `<div class="vlink"><p>Este video se abre en otra pestaña.</p><a class="btn" href="${esc(info.src)}" target="_blank" rel="noopener noreferrer">${glifo("play")}Abrir video</a></div>`;
}
function abrirVideo(v, titulo) {
  const info = videoInfo(v);
  if (!info) { toast("Este video no está disponible."); return; }
  modal({ titulo: titulo || "Video de muestra", wide: true, body: `<div class="vplayer">${videoHtml(info, titulo)}</div>`, pie: `<button class="btn" data-act="cerrar-modal">Cerrar</button>` });
}
const vidBtn = (s) => videoInfo(s.videoDestacado) ? `<button type="button" class="hmore hvid" data-act="ver-video" data-k="dest" data-id="${esc(s.id)}">${glifo("play")}Ver video</button>` : "";

/* ---------- Formato de la descripción: tamaño, color y viñetas ---------- */
const TAM_TOKEN = { chico: "0.85em", normal: "1em", grande: "1.3em", enorme: "1.7em" };
const TAM_BASE = [14, 16, 18, 21];
const COLORES_TXT = [["Negro", "#172b34"], ["Azul", "#004EAA"], ["Morado", "#6B46A8"], ["Rojo", "#C62828"], ["Verde", "#2E7D32"], ["Naranja", "#D9650B"], ["Gris", "#637680"]];
function aplicarFormato(h) {
  let prev;
  do {
    prev = h;
    h = h.replace(/\[tam=(chico|normal|grande|enorme)\]((?:(?!\[tam=)[\s\S])*?)\[\/tam\]/g, (m, k, t) => `<span style="font-size:${TAM_TOKEN[k]}">${t}</span>`)
      .replace(/\[color=(#[0-9a-fA-F]{6})\]((?:(?!\[color=)[\s\S])*?)\[\/color\]/g, (m, c, t) => `<span class="rc" style="color:${c}">${t}</span>`);
  } while (h !== prev);
  return h;
}
const descEstilo = (s) => {
  const px = TAM_BASE.includes(+s.descTam) ? +s.descTam : 16, c = /^#[0-9a-fA-F]{6}$/.test(s.descColor || "") ? s.descColor : "";
  return `font-size:${px}px;${c ? `color:${c};` : ""}`;
};
const MARCA_VINETA = /^\s*(?:[-•*–—▪◦●·]\s+|[>›»→▸►]+\s*)(.*)$/;
const CONECTOR = /^(?:de|del|la|las|el|los|un|una|unos|unas|para|en|con|y|e|o|a|al|por|según|mediante|que|como|desde|hasta|sobre|entre|su|sus|tu|tus)$/i;
function negritaInicio(c) {
  if (/^[\[*]/.test(c)) return c;
  const pal = c.split(/\s+/); if (pal.length < 3 || CONECTOR.test(pal[0])) return c;
  let k = 1; while (k < pal.length && k < 3 && !CONECTOR.test(pal[k])) k++;
  const m = /^([\s\S]*?)([.,;:]*)$/.exec(pal.slice(0, k).join(" "));
  return `**${m[1]}**${m[2]} ${pal.slice(k).join(" ")}`.trim();
}
function formatoAuto(txt, nombre) {
  const enNoNeg = (s, fn) => s.split("**").map((seg, i) => (i % 2 === 0 ? fn(seg) : seg)).join("**");
  let r = String(txt || "").replace(/\r/g, "").split("\n").map((raw) => {
    const l = raw.replace(/\s+$/g, ""); if (!l.trim()) return "";
    const b = MARCA_VINETA.exec(l);
    if (b) {
      let c = b[1].trim(); if (!c) return "";
      if (!c.includes("**")) { const m = /^([^:]{3,48}):\s+(.+)$/.exec(c); c = m ? `**${m[1]}:** ${m[2]}` : negritaInicio(c); }
      return "- " + c;
    }
    const x = l.trim(); return !x.includes("**") && x.length <= 70 && /:$/.test(x) ? `**${x}**` : x;
  }).join("\n").replace(/\n{3,}/g, "\n\n").trim();
  const nom = String(nombre || "").trim();
  if (nom.length > 2 && !r.split("**").some((seg, i) => i % 2 === 1 && seg.includes(nom))) {
    let hecho = false; const re = new RegExp(nom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    r = enNoNeg(r, (s) => (hecho ? s : s.replace(re, (m) => { hecho = true; return `**${m}**`; })));
  }
  r = enNoNeg(r, (s) => s.replace(/\b[A-ZÁÉÍÓÚÑ]{3,}\b/g, (m) => `**${m}**`));
  return r;
}
function envolverLineas(sel, abre, cierra) {
  return sel.split("\n").map((l) => { if (!l.trim()) return l; const m = /^(\s*(?:(?:[-•*]\s+)|(?:[>›»→▸►]+\s*))?)([\s\S]*)$/.exec(l); return m[1] + abre + m[2] + cierra; }).join("\n");
}
function fmtAplicar(f, v) {
  const ta = $("#e-descripcion"), dr = draftActual(); if (!ta || !dr) return;
  let a = ta.selectionStart, b = ta.selectionEnd, txt = ta.value;
  if (f === "auto") { txt = formatoAuto(txt, dr.s.nombre); a = b = txt.length; }
  else if (f === "bullets") {
    const ini = txt.lastIndexOf("\n", a - 1) + 1; let fin = txt.indexOf("\n", b); if (fin < 0) fin = txt.length;
    const bloque = txt.slice(ini, fin).split("\n"), con = (l) => /^\s*(?:[-•*]\s+|[>›»→▸►]+\s*)/.test(l);
    const todas = bloque.filter((l) => l.trim()).length > 0 && bloque.filter((l) => l.trim()).every(con);
    const nuevo = bloque.map((l) => !l.trim() ? l : todas ? l.replace(/^(\s*)(?:[-•*]\s+|[>›»→▸►]+\s*)/, "$1") : con(l) ? l : "- " + l.trim()).join("\n");
    txt = txt.slice(0, ini) + nuevo + txt.slice(fin); a = ini; b = ini + nuevo.length;
  } else {
    if (a === b) { toast("Primero selecciona el texto que quieres cambiar."); return; }
    const sel = txt.slice(a, b); let nuevo = sel;
    if (f === "bold") nuevo = /^\*\*[\s\S]+\*\*$/.test(sel) ? sel.slice(2, -2) : envolverLineas(sel, "**", "**");
    else if (f === "tam") { if (!TAM_TOKEN[v]) return; nuevo = envolverLineas(sel.replace(/\[tam=\w+\]|\[\/tam\]/g, ""), `[tam=${v}]`, "[/tam]"); }
    else if (f === "color") { if (!/^#[0-9a-fA-F]{6}$/.test(v || "")) return; nuevo = envolverLineas(sel.replace(/\[color=#[0-9a-fA-F]{6}\]|\[\/color\]/g, ""), `[color=${v}]`, "[/color]"); }
    else if (f === "clear") nuevo = sel.replace(/\[tam=\w+\]|\[\/tam\]|\[color=#[0-9a-fA-F]{6}\]|\[\/color\]|\*\*/g, "");
    txt = txt.slice(0, a) + nuevo + txt.slice(b); b = a + nuevo.length;
  }
  ta.value = txt; dr.s.descripcion = txt; dr.dirty = true;
  ta.focus(); ta.setSelectionRange(a, b);
  actualizarPrevDesc();
  const sb = $(".savebar .muted"); if (sb) sb.textContent = "Tienes cambios sin guardar.";
}
function actualizarPrevDesc() {
  const dr = draftActual(), p = $("#desc-prev"); if (!dr || !p) return;
  p.setAttribute("style", descEstilo(dr.s)); p.innerHTML = dr.s.descripcion.trim() ? rich(dr.s.descripcion) : '<p class="muted">Aquí verás cómo se mostrará la descripción.</p>';
}
function toolbarDescripcion(s) {
  const tam = [["", "Tamaño…"], ["chico", "Pequeño"], ["normal", "Normal"], ["grande", "Grande"], ["enorme", "Muy grande"]];
  return `<div class="rtb" role="toolbar" aria-label="Formato de la descripción">
    <button type="button" data-act="fmt" data-f="bold" title="Negrita (selecciona texto)" aria-label="Negrita"><b>N</b></button>
    <button type="button" data-act="fmt" data-f="bullets" title="Viñetas (lista con puntos)" aria-label="Viñetas">${glifo("lista")}<span>Viñetas</span></button>
    <label class="rtb-s"><span class="sr">Tamaño del texto seleccionado</span><select data-fmt-size aria-label="Tamaño del texto seleccionado">${tam.map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select></label>
    <span class="rtb-c" role="group" aria-label="Color del texto seleccionado">${COLORES_TXT.map(([n, h]) => `<button type="button" class="sw" data-act="fmt" data-f="color" data-c="${h}" style="background:${h}" title="${n}" aria-label="Color ${n}"></button>`).join("")}<label class="sw custom" title="Otro color"><span class="sr">Otro color</span><input type="color" data-fmt-color value="#004eaa" aria-label="Otro color"></label></span>
    <button type="button" data-act="fmt" data-f="clear" title="Quitar formato del texto seleccionado">Quitar formato</button>
    <button type="button" data-act="fmt" data-f="auto" title="Formato automático: negrita azul en palabras importantes y viñetas azules en lugar de «>» o guiones">Formato automático</button></div>`;
}
function editorDescripcion(s) {
  const px = TAM_BASE.includes(+s.descTam) ? +s.descTam : 16;
  return `${toolbarDescripcion(s)}
    <div class="field"><label class="sr" for="e-descripcion">Descripción</label><textarea id="e-descripcion" data-path="descripcion" style="min-height:220px">${esc(s.descripcion)}</textarea></div>
    <div class="fields" style="margin-top:12px">
      <div class="field"><label for="e-descTam">Tamaño de letra de toda la descripción</label><select class="select" id="e-descTam" data-path="descTam">${TAM_BASE.map((n, i) => `<option value="${n}" ${n === px ? "selected" : ""}>${["Pequeña", "Normal", "Grande", "Muy grande"][i]} (${n} px)</option>`).join("")}</select></div>
      <div class="field"><label for="e-descColor">Color del texto de toda la descripción</label><div class="up"><input type="color" id="e-descColor" data-path="descColor" value="${/^#[0-9a-fA-F]{6}$/.test(s.descColor || "") ? s.descColor : "#172b34"}" aria-label="Color del texto"><button type="button" class="btn ghost sm" data-act="desc-color-reset">Color original</button></div></div>
    </div>
    <div class="field" style="margin-top:14px"><span class="lbl">Así se verá en la ficha</span><div class="prose rtprev" id="desc-prev" style="${descEstilo(s)}">${s.descripcion.trim() ? rich(s.descripcion) : '<p class="muted">Aquí verás cómo se mostrará la descripción.</p>'}</div></div>`;
}

/* ---------- Editor de videos (destacados y capturas) ---------- */
function videoDestacadoEditor(s) {
  const vd = s.videoDestacado || { url: "", data: "", nombre: "" }, info = videoInfo(vd);
  return `<div class="field full vbox"><span class="lbl">Video de muestra del sistema (destacados)</span>
    <span class="muted" style="font-size:12.5px">Aparece con el botón «Ver video» en la tarjeta destacada de la portada y como reproductor en la ficha del sistema.</span>
    ${info ? `<div class="vstate">${glifo("video")}<span><b>${vd.data ? "Video subido" : esc(info.etiqueta)}</b>${vd.data ? " · " + esc(vd.nombre || "") : ""}</span><button type="button" class="btn sec sm" data-act="e-ver-video" data-k="dest">${glifo("play")}Probar</button><button type="button" class="btn ghost sm" data-act="e-quitar-videodest">Quitar video</button></div>` : ""}
    <input id="e-videoDestacado.url" type="url" data-path="videoDestacado.url" value="${esc(vd.data ? "" : vd.url || "")}" placeholder="Pega un enlace de YouTube, Vimeo o un archivo .mp4" autocomplete="off" aria-label="Enlace del video destacado">
    <div class="up"><input type="file" id="up-videodest" accept="video/mp4,video/webm,video/ogg,video/quicktime" data-up="videodest"><label class="btn sec sm" for="up-videodest">${glifo("upload")}Subir video (máx. ${bytes(LIMITE_VIDEO)})</label><span class="muted" style="font-size:12.5px">Para videos largos, mejor pega el enlace de YouTube.</span></div></div>`;
}
function videosEditor(s) {
  const lista = Array.isArray(s.videos) ? s.videos : [];
  return `<div class="field vbox" style="margin-top:18px"><span class="lbl">Videos de muestra del sistema</span>
    <span class="muted" style="font-size:12.5px">Se muestran junto a las capturas en «Vista previa» de la ficha.</span>
    ${lista.map((v, i) => { const info = videoInfo(v); return `<div class="ed-item vitem"><div class="vstate">${glifo("video")}<span><b>${info ? (v.data ? "Video subido" : esc(info.etiqueta)) : "Enlace no válido"}</b>${v.nombre ? " · " + esc(v.nombre) : ""}</span></div><input type="text" data-path="videos.${i}.pie" value="${esc(v.pie || "")}" placeholder="Título del video (opcional)" aria-label="Título del video ${i + 1}"><div class="line" style="justify-content:flex-end;gap:2px"><button type="button" class="iconbtn" data-act="e-ver-video" data-k="lista" data-i="${i}" aria-label="Probar video ${i + 1}">${glifo("play")}</button><button type="button" class="iconbtn" data-act="e-mover" data-path="videos" data-i="${i}" data-d="-1" ${i === 0 ? "disabled" : ""} aria-label="Subir">${glifo("up")}</button><button type="button" class="iconbtn" data-act="e-mover" data-path="videos" data-i="${i}" data-d="1" ${i === lista.length - 1 ? "disabled" : ""} aria-label="Bajar">${glifo("down")}</button><button type="button" class="iconbtn bad" data-act="e-del" data-path="videos" data-i="${i}" aria-label="Quitar video ${i + 1}">${glifo("trash")}</button></div></div>`; }).join("")}
    <div style="display:flex;gap:8px;flex-wrap:wrap"><input id="vid-url" type="url" placeholder="Enlace de YouTube, Vimeo o .mp4" aria-label="Enlace del video" autocomplete="off" style="flex:1;min-width:200px"><button type="button" class="btn sec sm" data-act="vid-add-url">${glifo("plus")}Agregar enlace</button></div>
    <div class="up"><input type="file" id="up-video" accept="video/mp4,video/webm,video/ogg,video/quicktime" multiple data-up="video"><label class="btn sec sm" for="up-video">${glifo("video")}Subir video (máx. ${bytes(LIMITE_VIDEO)})</label></div>
    <div class="vstate">${glifo("estrella")}<span><b>¿Quieres ver cómo luciría?</b> Carga 3 imágenes y un video de prueba en este sistema (puedes quitarlos después).</span><button type="button" class="btn sec sm" data-act="demo-media">Cargar imágenes y video de prueba</button></div></div>`;
}

/* ---------- Piezas reutilizables ---------- */
function btnGet(s, cls = "", sinNota = false) {
  if (S.super) return `<span class="get-wrap"><a class="get ${cls}" href="#/solicitudes">Ver solicitudes</a></span>`;
  const e = s.estado, dis = e === "En mantenimiento";
  const label = e === "Próximamente" ? "Me interesa" : "Solicitar";
  const nota = e === "Disponible" || sinNota ? "" : e;
  return `<span class="get-wrap"><button class="get ${cls}" data-act="solicitar" data-id="${esc(s.id)}" ${dis ? "disabled" : ""} aria-label="${label} ${esc(s.nombre)}">${label}</button>${nota ? `<small class="get-note">${esc(nota)}</small>` : ""}</span>`;
}
function fila(s, sub) {
  const aviso = !s.publicado ? `<span class="tag">No publicado</span>` : "";
  return `<div class="row"><a class="row-main" href="#/sistema/${enc(s.id)}">${icono(s, "s64")}<span class="row-t"><b>${esc(s.nombre)}</b><small class="row-meta">${aviso}${tipoTag(s)}<span class="row-sub">${esc(sub ?? s.subtitulo)}</span></small></span></a>${btnGet(s)}</div>`;
}
function feat(s) {
  const cap = s.capturas[0];
  const art = imgOk(s.portada)
    ? `<img src="${esc(s.portada)}" alt="">`
    : `<span class="feat-glyph">${glifo(GLIFOS.includes(s.icono.glifo) ? s.icono.glifo : "app")}</span>${cap && imgOk(cap.src) ? `<span class="feat-shot"><img src="${esc(cap.src)}" alt=""></span>` : ""}`;
  return `<article class="feat" style="${colorVars(s.icono.color)}">
    <a class="feat-txt" href="#/sistema/${enc(s.id)}"><span class="eyebrow">${etqChip(s)}</span><strong>${esc(s.nombre)}</strong><span class="sub">${esc(s.subtitulo)}</span></a>
    <div class="feat-card"><a class="feat-art" href="#/sistema/${enc(s.id)}" tabindex="-1" aria-hidden="true">${art}</a>
      <div class="feat-bar">${icono(s, "s48")}<span class="t"><b>${esc(s.nombre)}</b><small>${esc(s.subtitulo)}</small></span>${btnGet(s, "glass")}</div></div></article>`;
}
function navbar({ mid = "", right = "", back = true } = {}) {
  return `<div class="navbar" id="nb">${back ? `<button class="circ" data-act="back" aria-label="Volver">${glifo("back")}</button>` : ""}<div class="mid">${mid}</div>${mid ? "" : '<div class="spacer"></div>'}<div class="right">${right}</div></div>`;
}
function cabecera(titulo, sub = "", cuando = "") {
  return `<header class="pagehead"><div>${cuando ? `<div class="when">${esc(cuando)}</div>` : ""}<h1 class="large-title">${esc(titulo)}</h1>${sub ? `<p class="lede">${esc(sub)}</p>` : ""}</div>${S.admin ? `<a class="avatar on" href="#/admin" aria-label="Administración">${glifo("edit")}</a>` : S.user ? `<button class="avatar" data-act="mi-cuenta" aria-label="Mi cuenta">${esc(iniciales(S.user.nombre))}</button>` : ""}</header>`;
}
function vacio(titulo, texto, extra = "") { return `<div class="empty">${glifo("search")}<b>${esc(titulo)}</b><p>${esc(texto)}</p>${extra}</div>`; }
const LOGO_MARCAS = {
  nodos: { n: "Nodos", d: '<g transform="translate(0 4.5)"><circle cx="32" cy="32" r="19" fill="none" stroke="#fff" stroke-width="1.6" opacity=".28"/><g stroke="#fff" stroke-width="2.8" stroke-linecap="round" opacity=".85"><path d="M32 32V13M32 32L48.5 41.5M32 32L15.5 41.5"/></g><circle cx="32" cy="32" r="9" fill="#fff"/><circle cx="32" cy="32" r="3.6" fill="#004EAA" opacity=".9"/><circle cx="32" cy="13" r="5" fill="#fff" opacity=".95"/><circle cx="15.5" cy="41.5" r="5" fill="#fff" opacity=".95"/><circle cx="48.5" cy="41.5" r="5.4" fill="#f2b632"/></g>' },
  facetas: { n: "Facetas", d: '<g transform="translate(32 32) rotate(45) scale(1.16) translate(-32 -32)"><rect x="18.5" y="18.5" width="12" height="12" rx="3.6" fill="#fff"/><rect x="33.5" y="18.5" width="12" height="12" rx="3.6" fill="#fff" opacity=".7"/><rect x="18.5" y="33.5" width="12" height="12" rx="3.6" fill="#fff" opacity=".5"/><rect x="33.5" y="33.5" width="12" height="12" rx="3.6" fill="#fff" opacity=".3"/></g>' },
  mosaico: { n: "Mosaico", d: '<rect x="17" y="17" width="13" height="13" rx="3.5" fill="#fff"/><circle cx="41" cy="23.5" r="6.5" fill="#fff" opacity=".78"/><rect x="17" y="34" width="13" height="13" rx="3.5" fill="#fff" opacity=".78"/><rect x="34" y="34" width="13" height="13" rx="3.5" fill="#fff" opacity=".5"/>' },
  capas: { n: "Capas", d: '<path d="M32 15 49 24.5 32 34 15 24.5Z" fill="#fff"/><path d="M15 33 32 42.5 49 33" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" opacity=".75"/><path d="M15 41.5 32 51 49 41.5" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" opacity=".5"/>' },
  orbita: { n: "Órbita", d: '<circle cx="32" cy="32" r="16" fill="none" stroke="#fff" stroke-width="3.4" opacity=".6"/><circle cx="32" cy="32" r="6.5" fill="#fff"/><circle cx="43.3" cy="20.7" r="4" fill="#fff"/>' },
  cubo: { n: "Cubo", d: '<path d="M32 14 48 23v18L32 50 16 41V23Z" fill="none" stroke="#fff" stroke-width="3.4" stroke-linejoin="round"/><path d="M16 23 32 32 48 23M32 32v18" fill="none" stroke="#fff" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round" opacity=".7"/>' },
  onda: { n: "Onda", d: '<path d="M14 24c6-8 12-8 18 0s12 8 18 0" fill="none" stroke="#fff" stroke-width="3.8" stroke-linecap="round"/><path d="M14 33c6-8 12-8 18 0s12 8 18 0" fill="none" stroke="#fff" stroke-width="3.8" stroke-linecap="round" opacity=".7"/><path d="M14 42c6-8 12-8 18 0s12 8 18 0" fill="none" stroke="#fff" stroke-width="3.8" stroke-linecap="round" opacity=".45"/>' },
  inicial: { n: "Inicial", d: null }
};
const LOGO_FORMAS = { squircle: ["Redondeado", 18], circulo: ["Círculo", 32], cuadrado: ["Cuadrado", 8] };
let logoN = 0;
function logoSvg(c) {
  const m = LOGO_MARCAS[c.logoMarca] ? c.logoMarca : "facetas", col = COLORES[c.logoColor] || COLORES.azul, f = LOGO_FORMAS[c.logoForma] || LOGO_FORMAS.squircle, id = "lgd" + (++logoN);
  const ini = esc((String(c.nombre || "C").trim()[0] || "C").toUpperCase());
  const marca = m === "inicial" ? `<text x="32" y="43.5" text-anchor="middle" font-size="32" font-weight="700" fill="#fff" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">${ini}</text>` : LOGO_MARCAS[m].d;
  return `<svg class="logo-svg" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${col[0]}"/><stop offset="1" stop-color="${col[1]}"/></linearGradient><radialGradient id="${id}h" cx=".25" cy=".15" r=".95"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="64" height="64" rx="${f[1]}" fill="url(#${id})"/><rect width="64" height="64" rx="${f[1]}" fill="url(#${id}h)"/><rect x=".5" y=".5" width="63" height="63" rx="${f[1] - .5}" fill="none" stroke="#fff" stroke-opacity=".22"/>${marca}</svg>`;
}
const logoInner = (c) => imgOk(c.logo) ? `<img src="${esc(c.logo)}" alt="">` : logoSvg(c);
const logoHtml = (c) => `<span class="ico s40${imgOk(c.logo) ? "" : " lg"}" style="${colorVars("azul")}">${logoInner(c)}</span>`;

const TIPOS = { sistema: "Sistema", web: "Portal / Sitio web" };
const TIPOS_DESC = { sistema: "Aplicación institucional: requiere solicitar acceso.", web: "Página en internet: se consulta abriendo el enlace." };
const TIPO_ICO = { sistema: "app", web: "globo" };
const tipoDe = (s) => (TIPOS[s.tipoSis] ? s.tipoSis : (s.categorias || []).includes("portales") ? "web" : "sistema");
const tipoNom = (s) => TIPOS[tipoDe(s)];
const tipoTag = (s) => `<span class="tipo-tag t-${tipoDe(s)}">${glifo(TIPO_ICO[tipoDe(s)])}${esc(tipoNom(s))}</span>`;
function ligadosDe(s) {
  const ids = new Set(Array.isArray(s.ligados) ? s.ligados : []);
  vis().forEach((x) => { if (x.id !== s.id && Array.isArray(x.ligados) && x.ligados.includes(s.id)) ids.add(x.id); });
  return [...ids].map((i) => byId(i)).filter((x) => x && x.id !== s.id && (x.publicado || S.admin));
}
function relacionados(s, n = 6) {
  const pts = (x) => { let p = 0; x.usos.forEach((u) => { if (s.usos.includes(u)) p += 3; }); x.categorias.forEach((c) => { if (s.categorias.includes(c)) p += 2; }); return p; };
  const otros = vis().filter((x) => x.id !== s.id);
  const con = otros.map((x) => ({ x, p: pts(x) })).filter((o) => o.p > 0).sort((a, b) => b.p - a.p).map((o) => o.x);
  const resto = otros.filter((x) => !con.includes(x));
  return con.concat(resto).slice(0, n);
}
const motivo = (s, x) => { const c = x.usos.find((u) => s.usos.includes(u)); return c ? `También sirve para ${c.toLowerCase()}` : x.subtitulo; };

/* ---------- Cuentas y sesión (correo + contraseña) ---------- */
const normCorreo = (v) => String(v || "").trim().toLowerCase();
const mismoCorreo = (a, b) => !!normCorreo(a) && normCorreo(a) === normCorreo(b);
const buscarPorCorreo = (c) => S.cat.usuarios.find((u) => mismoCorreo(u.correo, c));
const claveOk = (p) => typeof p === "string" && p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);
const CLAVE_AYUDA = "Mínimo 8 caracteres, con letras y números.";
const iniciales = (n) => String(n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase() || "?";
const hashQuery = () => { const o = {}; new URLSearchParams(location.hash.split("?")[1] || "").forEach((v, k) => (o[k] = v)); return o; };
const nuevoSalt = () => uid("s") + Math.random().toString(36).slice(2, 10);
function cyrb53(str) { let h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16); }
async function hashClave(pass, salt) {
  try {
    if (window.crypto && crypto.subtle) {
      const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveBits"]);
      const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 120000 }, k, 256);
      return "p1:" + [...new Uint8Array(bits)].map((x) => x.toString(16).padStart(2, "0")).join("");
    }
  } catch (e) { /* respaldo */ }
  return "c1:" + cyrb53(salt + "|" + pass);
}
function claveTemporal() {
  const L = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz", N = "23456789", a = new Uint32Array(10);
  if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a); else a.forEach((_, i) => (a[i] = Math.floor(Math.random() * 4294967295)));
  let r = ""; for (let i = 0; i < 7; i++) r += L[a[i] % L.length]; for (let i = 7; i < 10; i++) r += N[a[i] % N.length];
  return r;
}
function aplicarRol(u) { const r = u ? rolDe(u.rol) : ""; S.super = r === "superadmin"; S.admin = r === "superadmin" || r === "gestor"; }
const guardarSesion = (u, recordar) => { try { (recordar ? localStorage : sessionStorage).setItem("catalogo-sesion", u.id); } catch (e) {} };
const leerSesion = () => { try { return sessionStorage.getItem("catalogo-sesion") || localStorage.getItem("catalogo-sesion"); } catch (e) { return null; } };
function limpiarSesion() {
  if (SB) SB.auth.signOut();
  if (S.qa) restaurarQA();
  try { sessionStorage.removeItem("catalogo-sesion"); localStorage.removeItem("catalogo-sesion"); } catch (e) {}
  S.user = null; S.admin = false; S.super = false; S.guest = false; try { sessionStorage.removeItem("catalogo-visitante"); } catch (e) {} S.drafts = {}; S.cfgDraft = null; S.authView = "login"; S.authInfo = null;
  F.ini = null; F.sel = []; F.errs = {}; F.vals = { contactoPref: "Correo electrónico", acepto: false };
}
function restaurarSesion() {
  const id = leerSesion(), u = id && S.cat.usuarios.find((x) => x.id === id && x.estado === "activo");
  S.user = u || null; aplicarRol(u || null);
  S.guest = !u;
}
function revalidarSesion() {
  if (!S.user) return;
  const u = S.cat.usuarios.find((x) => x.id === S.user.id && x.estado === "activo");
  if (!u) limpiarSesion(); else { S.user = u; aplicarRol(u); }
}
const esUltimoAdmin = (u) => rolDe(u.rol) === "superadmin" && u.estado === "activo" && S.cat.usuarios.filter((x) => rolDe(x.rol) === "superadmin" && x.estado === "activo").length <= 1;
function intentosDe(rfc) { try { return (JSON.parse(localStorage.getItem("catalogo-intentos") || "{}"))[rfc] || { n: 0, hasta: 0 }; } catch (e) { return { n: 0, hasta: 0 }; } }
function setIntentos(rfc, v) { try { const o = JSON.parse(localStorage.getItem("catalogo-intentos") || "{}"); if (v) o[rfc] = v; else delete o[rfc]; localStorage.setItem("catalogo-intentos", JSON.stringify(o)); } catch (e) {} }
const val = (id) => { const e = $("#" + id); return e ? e.value.trim() : ""; };
const authErr = (t) => { const e = $("#a-err"); if (e) e.textContent = t; };
function abrirSesion(u, recordar) {
  const volver = S.retorno && !/^#\/acceso/.test(S.retorno) ? S.retorno : ""; S.retorno = null;
  S.user = u; aplicarRol(u); S.guest = false; try { sessionStorage.removeItem("catalogo-visitante"); } catch (e) {} guardarSesion(u, recordar); S.authView = "login";
  if (/^#\/acceso/.test(location.hash)) history.replaceState(null, "", volver || "#/");
  const vuelveAForm = !!S.folioPendiente && /^#\/solicitar/.test(volver); S.folioPendiente = false;
  if (vuelveAForm) { const v0 = F.vals; if (!v0.nombre) v0.nombre = u.nombre || ""; if (!v0.correo) v0.correo = u.correo || ""; if (!v0.dependencia) v0.dependencia = u.dependencia || ""; if (!v0.cargo) v0.cargo = u.cargo || ""; if (!v0.telefono) v0.telefono = u.telefono || ""; }
  render(true); if (vuelveAForm && !u.debeCambiar && !u.completar) toast("Listo. Presiona «Enviar solicitud» para generar tu folio."); else if (!u.debeCambiar && !u.completar) toast(nNoLeidas() ? `Bienvenido(a), ${u.nombre.split(" ")[0]} · tienes ${nNoLeidas()} ${nNoLeidas() === 1 ? "notificación nueva" : "notificaciones nuevas"}` : `Bienvenido(a), ${u.nombre.split(" ")[0]}`);
}

/* ---------- Registro propio y notificaciones (sin códigos ni correos) ---------- */
function notificar(tipo, titulo, detalle) {
  if (!Array.isArray(S.cat.notificaciones)) S.cat.notificaciones = [];
  S.cat.notificaciones.unshift({ id: uid("not"), tipo, titulo, detalle: detalle || {}, fecha: new Date().toISOString(), leida: false });
  S.cat.notificaciones = S.cat.notificaciones.slice(0, 200);
}
const nNoLeidas = () => (S.super && Array.isArray(S.cat.notificaciones) ? S.cat.notificaciones.filter((n) => !n.leida).length : 0);
/* Las solicitudes nuevas se muestran como notificaciones leyendo la tabla «solicitudes» (ids «sol-…»); lo leído/oculto se recuerda en este dispositivo. */
const SOL_LEIDAS = "cat-sol-leidas", SOL_OCULTAS = "cat-sol-ocultas", esNotifSol = (id) => String(id).startsWith("sol-");
const lsSet = (k) => { try { return new Set(JSON.parse(localStorage.getItem(k) || "[]")); } catch (e) { return new Set(); } };
const lsGuardar = (k, set) => { try { localStorage.setItem(k, JSON.stringify([...set].slice(-500))); } catch (e) {} };
async function sbNotifs() {
  if (!SB) return;
  let reales = null, sols = [];
  try {
    const { data, error } = await SB.from("notificaciones").select("*").order("creado", { ascending: false }).limit(200);
    if (!error && data) reales = data.map((x) => ({ id: x.id, tipo: x.tipo, titulo: x.titulo, detalle: x.detalle || {}, fecha: x.creado, leida: !!x.leida }));
  } catch (e) { /* sin avisos */ }
  try {
    let r = await SB.from("solicitudes").select("id,folio,creado,datos,sistemas,estado,notif_leida,notif_oculta").order("creado", { ascending: false }).limit(60);
    S.solCol = !r.error;   // true = ya existen las columnas compartidas (supabase-notificaciones.sql)
    if (r.error) r = await SB.from("solicitudes").select("id,folio,creado,datos,sistemas,estado").order("creado", { ascending: false }).limit(60);
    const { data, error } = r;
    if (!error && data) {
      const ocultas = lsSet(SOL_OCULTAS), leidas = lsSet(SOL_LEIDAS), limite = Date.now() - 3 * 864e5;
      sols = data.filter((x) => !ocultas.has("sol-" + x.id) && !x.notif_oculta).map((x) => {
        const d = x.datos || {}, nom = (x.sistemas || []).map((y) => y.nombre).join(", ");
        return { id: "sol-" + x.id, tipo: "solicitud", titulo: `${d.nombre || "Alguien"} ${x.estado === "cancelada" ? "canceló su solicitud de" : "solicitó"} ${nom}`, fecha: x.creado,
          leida: !!x.notif_leida || leidas.has("sol-" + x.id) || (!S.solCol && new Date(x.creado).getTime() < limite),
          detalle: { folio: x.folio, nombre: d.nombre, correo: d.correo, telefono: d.telefono, dependencia: d.dependencia, area: d.area, cargo: d.cargo, sistemas: nom, cancelada: x.estado === "cancelada" } };
      });
    }
  } catch (e) { /* sin solicitudes */ }
  const base = reales || (S.cat.notificaciones || []).filter((n) => !esNotifSol(n.id));
  S.cat.notificaciones = base.concat(sols).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 200);
}
/* Vigilancia: revisa cada 15 s (y al instante si Supabase Realtime está activo) y avisa cuando llega una solicitud nueva */
let vigilaTimer = null, vigilaCanal = null;
async function vigilarNotifs() {
  if (!S.super || !SB) { if (vigilaTimer) { clearInterval(vigilaTimer); vigilaTimer = null; } return; }
  if (document.hidden) return;
  const antes = new Set((S.cat.notificaciones || []).filter((n) => !n.leida).map((n) => n.id));
  await sbNotifs();
  const nuevas = (S.cat.notificaciones || []).filter((n) => !n.leida && !antes.has(n.id));
  refrescarCampana();
  if (nuevas.length) {
    toast(nuevas.length === 1 ? (nuevas[0].detalle && nuevas[0].detalle.cancelada ? nuevas[0].titulo : `Nueva solicitud: ${nuevas[0].titulo}`) : `${nuevas.length} notificaciones nuevas`);
    if (/^#\/admin\/notificaciones/.test(location.hash)) keep(() => render(false));
  }
}
function iniciarVigilancia() {
  if (!SB || vigilaTimer) return;
  vigilaTimer = setInterval(vigilarNotifs, 15000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) vigilarNotifs(); });
  try { vigilaCanal = SB.channel("solicitudes-nuevas").on("postgres_changes", { event: "*", schema: "public", table: "solicitudes" }, () => vigilarNotifs()).subscribe(); } catch (e) { /* queda la revisión cada 15 s */ }
}
async function borrarNotifs(ids) {
  if (!ids.length) return;
  const idsSol = ids.filter(esNotifSol);
  if (idsSol.length) {
    let ok = false;
    if (SB && S.solCol) { try { const r = await SB.from("solicitudes").update({ notif_oculta: true }).in("id", idsSol.map((x) => x.slice(4))).select("id"); ok = !r.error && !!r.data && r.data.length > 0; } catch (e) {} }
    if (!ok) { const o = lsSet(SOL_OCULTAS); idsSol.forEach((x) => o.add(x)); lsGuardar(SOL_OCULTAS, o); }   // respaldo: solo este dispositivo
  }
  const idsReales = ids.filter((x) => !esNotifSol(x));
  if (SB && idsReales.length) {
    let r; try { r = await SB.from("notificaciones").delete().in("id", idsReales).select("id"); } catch (e) { r = { error: e }; }
    if (!r || r.error || !r.data || !r.data.length) return toast("No se pudo eliminar: falta el permiso en Supabase. Ejecuta supabase-notificaciones-borrar.sql.");
  }
  const s = new Set(ids); S.cat.notificaciones = (S.cat.notificaciones || []).filter((n) => !s.has(n.id));
  if (!SB) guardarCatalogo();
  refrescarCampana(); keep(() => render(false));
  toast(ids.length === 1 ? "Notificación eliminada" : `${ids.length} notificaciones eliminadas`);
}
async function marcarNotifs(id) {
  const l = (S.cat.notificaciones || []).filter((n) => (id ? n.id === id : !n.leida));
  l.forEach((n) => (n.leida = true));
  const lSol = l.filter((n) => esNotifSol(n.id)), lReal = l.filter((n) => !esNotifSol(n.id));
  if (lSol.length) {
    let ok = false;
    if (SB && S.solCol) { try { const r = await SB.from("solicitudes").update({ notif_leida: true }).in("id", lSol.map((n) => n.id.slice(4))).select("id"); ok = !r.error && !!r.data && r.data.length > 0; } catch (e) {} }
    if (!ok) { const o = lsSet(SOL_LEIDAS); lSol.forEach((n) => o.add(n.id)); lsGuardar(SOL_LEIDAS, o); }   // respaldo: solo este dispositivo
  }
  if (SB && lReal.length) { try { await SB.from("notificaciones").update({ leida: true }).in("id", lReal.map((n) => n.id)); } catch (e) {} } else if (!SB) guardarCatalogo();
}
async function registrarse() {
  authErr("");
  const d = { nombre: val("a-nombre"), dependencia: val("a-dep"), area: val("a-area"), cargo: val("a-cargo"), correo: normCorreo(val("a-correo")), telefono: val("a-tel") };
  const p1 = $("#a-pass").value, p2 = $("#a-pass2").value;
  const falta = [], mal = (id, m) => falta.push([id, m]);
  if (d.nombre.length < 3) mal("a-nombre", "Escribe tu nombre completo.");
  if (d.cargo.length < 2) mal("a-cargo", "Escribe tu cargo.");
  if (d.dependencia.length < 2) mal($("#a-depsel") && $("#a-dep-wrap").hidden ? "a-depsel" : "a-dep", "Elige o escribe tu dependencia u organización.");
  if (!correoOk(d.correo)) mal("a-correo", "Escribe un correo electrónico válido.");
  else if (d.correo === normCorreo(CORREO_SUPER)) mal("a-correo", "Ese correo está reservado para el superadministrador. Usa la pestaña «Superadministrador».");
  if (d.telefono.replace(/\D/g, "").length < 8) mal("a-tel", "Escribe un teléfono de al menos 8 dígitos.");
  if (!claveOk(p1)) mal("a-pass", CLAVE_AYUDA); else if (normCorreo(p1) === d.correo) mal("a-pass", "La contraseña no puede ser tu correo.");
  if (p1 !== p2) mal("a-pass2", "Las contraseñas no coinciden.");
  if (!$("#a-acepto").checked) mal("a-acepto", "Acepta el aviso de privacidad para continuar.");
  if (falta.length) return marcarFaltantes(falta);
    const btn = $("#a-reg-btn"); if (btn) { btn.disabled = true; btn.textContent = "Creando tu cuenta…"; }
  const fin = (m) => { if (btn) { btn.disabled = false; btn.textContent = "Crear mi cuenta"; } authErr(m); };
  if (SB_ON) return sbRegistro(d, p1, fin);
  if (buscarPorCorreo(d.correo)) return fin("Ese correo ya está registrado. Inicia sesión.");
  const salt = nuevoSalt();
  const u = { id: uid("usr"), nombre: d.nombre, correo: d.correo, dependencia: d.dependencia, area: d.area, cargo: d.cargo, telefono: d.telefono, rol: "visitante", estado: "activo", salt, hash: await hashClave(p1, salt), debeCambiar: false, creado: hoyISO(), registro: true };
  S.cat.usuarios.push(u);
  notificar("registro", `Se unió ${d.nombre}`, { userId: u.id, nombre: d.nombre, correo: d.correo, dependencia: d.dependencia, area: d.area, cargo: d.cargo, telefono: d.telefono });
  depsRegistrar(d.dependencia);
  guardarCatalogo(); abrirSesion(u, true);
}
async function sbRegistro(d, p1, fin) {
  if (!correoPermitido(d.correo)) return fin(avisoDominio());
  if (!SB) return fin("No se pudo conectar con el servicio de acceso. Revisa tu conexión.");
  const { data, error } = await SB.auth.signUp({ email: d.correo, password: p1, options: { data: { nombre: d.nombre } } });
  if (error) return fin(/regist|already|exists/i.test(error.message) ? "Ese correo ya está registrado. Inicia sesión." : "No se pudo crear la cuenta: " + error.message);
  if (!data.session) return fin("Tu cuenta se creó, pero el servicio pide confirmar el correo. El administrador debe desactivar «Confirm email» en Supabase (Authentication → Providers → Email).");
  const perfil = { id: data.user.id, nombre: d.nombre, correo: d.correo, rol: "visitante", estado: "activo", dependencia: d.dependencia, area: d.area, cargo: d.cargo, telefono: d.telefono };
  const { error: e2 } = await SB.from("perfiles").insert(perfil);
  if (e2) { await SB.auth.signOut(); return fin("No se pudo guardar tu perfil. Avisa al administrador."); }
  try { await SB.from("notificaciones").insert({ tipo: "registro", titulo: `Se unió ${d.nombre}`, detalle: { userId: data.user.id, nombre: d.nombre, correo: d.correo, dependencia: d.dependencia, area: d.area, cargo: d.cargo, telefono: d.telefono } }); } catch (e) {}
  try { await depsRegistrar(d.dependencia); } catch (e) {}
  const u = await sbPerfil(data.user);
  if (!u) return fin("Tu cuenta se creó, pero no se pudo iniciar la sesión. Inicia sesión con tu correo y contraseña.");
  abrirSesion(u, true);
}
function solicitarRecuperacion() {
  if (SB_ON) return sbRecuperar();
  const correo = normCorreo(val("a-correo"));
  authErr("");
  if (!correoOk(correo)) return authErr("Escribe el correo con el que te registraste.");
  const u = buscarPorCorreo(correo);
  if (u) notificar("recuperacion", `${u.nombre} pidió restablecer su contraseña`, { userId: u.id, nombre: u.nombre, correo: u.correo, dependencia: u.dependencia || "" });
  guardarCatalogo(); S.authView = "login"; render(false);
  toast("Listo: avisamos al administrador para que te genere una contraseña temporal.");
}
function vAdminNotif() {
  const L = Array.isArray(S.cat.notificaciones) ? S.cat.notificaciones : [], nl = L.filter((n) => !n.leida).length;
  const fecha = (iso) => { try { return new Date(iso).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }); } catch (e) { return ""; } };
  const dato = (k, v) => (v ? `<div><span class="k">${k}</span><span class="v">${esc(v)}</span></div>` : "");
  const sinSB = SB_ON ? "" : `<div class="note warn" style="margin-bottom:14px">${glifo("warn")}<div>Sin servidor conectado, estos avisos solo aparecen cuando la persona se registra <b>en este mismo navegador</b>. Para recibirlos desde cualquier dispositivo, conecta Supabase.</div></div>`;
  return `<div class="admbar" style="margin-top:0"><span class="muted">${L.length ? `${nl} sin leer · ${L.length} en total` : "Sin notificaciones"}</span>${nl ? `<button class="btn sec sm" data-act="notif-todas">${glifo("check")}Marcar todas como leídas</button>` : ""}${L.length - nl ? `<button class="btn sec sm" data-act="notif-borrar-leidas">${glifo("trash")}Borrar leídas</button>` : ""}${L.length ? `<button class="btn danger sm" data-act="notif-borrar-todas">${glifo("trash")}Borrar todas</button>` : ""}</div>${sinSB}
  ${L.length ? `<div class="list-card">${L.map((n) => { const d = n.detalle || {}, rec = n.tipo === "recuperacion", sol = n.tipo === "solicitud"; return `<div class="arow" style="align-items:flex-start;${n.leida ? "opacity:.72" : ""}"><span class="avatar-i" style="${n.leida ? "" : "background:linear-gradient(145deg,var(--accent),#2bb5a0);color:#fff"}">${glifo(rec ? "candado" : sol ? "send" : "user")}</span>
    <div class="t"><b>${esc(n.titulo)}</b> ${n.leida ? "" : '<span class="badge acc">Nueva</span>'}<small>${esc(fecha(n.fecha))}</small>
      <div class="kv" style="margin-top:8px">${dato("Folio", d.folio)}${dato("Sistemas", d.sistemas)}${dato("Dependencia", d.dependencia)}${dato("Área", d.area)}${dato("Cargo", d.cargo)}${dato("Nombre", sol ? d.nombre : "")}${dato("Correo", d.correo)}${dato("Teléfono", d.telefono)}</div></div>
    <div class="acts">${rec && d.userId ? `<button class="btn sm" data-act="usr-reset" data-id="${esc(d.userId)}">Restablecer contraseña</button>` : sol ? `<a class="btn sm" href="#/solicitudes/${enc(d.folio || "")}" data-act="notif-ver-sol" data-id="${esc(n.id)}">Ver solicitud</a>` : `<a class="btn sm sec" href="#/admin/usuarios">Ver en Usuarios</a>`}${n.leida ? "" : `<button class="btn sm ghost" data-act="notif-leer" data-id="${esc(n.id)}">Marcar leída</button>`}<button class="btn sm danger" data-act="notif-borrar" data-id="${esc(n.id)}" aria-label="Eliminar notificación">${glifo("trash")}</button></div></div>`; }).join("")}</div>`
    : vacio("Todo al día", "Cuando alguien solicite un sistema, se registre o pida restablecer su contraseña, lo verás aquí.", "")}`;
}

/* ---------- Avisos para usuarios + campana flotante ---------- */
const TIPOS_AVISO = { sistema: "Sistema nuevo", recordatorio: "Recordatorio", general: "Aviso" };
const AUDIENCIAS = { todos: "Todos", usuarios: "Usuarios registrados", visualizadores: "Visualizadores" };
const leidosKey = () => "catalogo-leidos-" + (S.user ? S.user.id : "visualizador");
const leidosSet = () => { try { return new Set(JSON.parse(localStorage.getItem(leidosKey()) || "[]")); } catch (e) { return new Set(); } };
const guardarLeidos = (set) => { try { localStorage.setItem(leidosKey(), JSON.stringify([...set].slice(-300))); } catch (e) {} };
function avisosVis() {
  const hoy = hoyISO(), L = Array.isArray(S.cat.avisos) ? S.cat.avisos : [];
  return L.filter((a) => (a.publicar || "") <= hoy && (!a.vence || a.vence >= hoy) && (a.audiencia === "usuarios" ? !!S.user : a.audiencia === "visualizadores" ? !S.user : true))
    .sort((x, y) => (y.fijado ? 1 : 0) - (x.fijado ? 1 : 0) || (y.publicar || "").localeCompare(x.publicar || ""));
}
const nAvisosNo = () => { const l = leidosSet(); return avisosVis().filter((a) => !l.has(a.id)).length; };
const nCampana = () => nAvisosNo() + nNoLeidas();
function marcarAvisos(id) { const l = leidosSet(); (id ? [id] : avisosVis().map((a) => a.id)).forEach((x) => l.add(x)); guardarLeidos(l); }
let nPrev = 0;
function iniciarCampana() {
  if ($("#campana")) return;
  const b = document.createElement("button"); b.id = "campana"; b.type = "button"; b.dataset.act = "notif-abrir"; b.setAttribute("aria-haspopup", "dialog"); b.setAttribute("aria-expanded", "false");
  document.body.appendChild(b);
  window.addEventListener("scroll", () => b.classList.toggle("scrolled", window.scrollY > 8), { passive: true });
}
function actualizarCampana() {
  iniciarCampana();
  const b = $("#campana"), n = nCampana();
  b.setAttribute("aria-label", "Notificaciones" + (n ? ` (${n} sin leer)` : "")); b.setAttribute("aria-expanded", String(!!S.nOpen));
  b.innerHTML = glifo("campana") + (n ? `<b class="nbadge">${n > 9 ? "9+" : n}</b>` : "");
  if (n > nPrev) { b.classList.remove("ring"); void b.offsetWidth; b.classList.add("ring"); }
  nPrev = n;
}
function refrescarCampana() { renderChrome(hashParts()[0]); if (S.nOpen) pintarNotif(); }
function itemAviso(a, leido) {
  return `<button class="nitem ${leido ? "" : "nuevo"} t-${esc(a.tipo || "general")}" data-act="aviso-ir" data-id="${esc(a.id)}"><span class="ndot" aria-hidden="true"></span><span class="ntxt"><span class="ntipo">${esc(TIPOS_AVISO[a.tipo] || "Aviso")}${a.fijado ? " · Fijado" : ""}</span><b>${esc(a.titulo)}</b>${a.mensaje ? `<small>${esc(a.mensaje)}</small>` : ""}</span><time>${esc(hace(a.publicar))}</time></button>`;
}
function itemAcceso(n) {
  const d = n.detalle || {};
  return `<div class="nitem ${n.leida ? "" : "nuevo"} t-acceso"><span class="ndot" aria-hidden="true"></span><span class="ntxt"><span class="ntipo">${n.tipo === "recuperacion" ? "Contraseña" : n.tipo === "solicitud" ? (d.cancelada ? "Solicitud cancelada" : "Nueva solicitud") : "Nuevo registro"}</span><b>${esc(n.titulo)}</b><small>${esc((n.tipo === "solicitud" ? [d.folio, d.dependencia] : [d.dependencia, d.cargo]).filter(Boolean).join(" · "))}</small></span><span class="nacts">${n.tipo === "recuperacion" && d.userId ? `<button class="nlink" data-act="notif-reset" data-id="${esc(d.userId)}">Restablecer</button>` : `${n.tipo === "solicitud" ? `<a class="nlink" href="#/solicitudes/${enc(d.folio || "")}" data-act="notif-ver-sol" data-id="${esc(n.id)}">Ver</a>` : `<a class="nlink" href="#/admin/usuarios" data-act="notif-cerrar">Ver</a>`}`}${n.leida ? "" : `<button class="nlink" data-act="notif-leer" data-id="${esc(n.id)}">Leída</button>`}</span></div>`;
}
function htmlNotif() {
  const A = avisosVis(), l = leidosSet(), an = A.filter((a) => !l.has(a.id)).length, ac = Array.isArray(S.cat.notificaciones) ? S.cat.notificaciones : [], acn = nNoLeidas();
  const tab = S.super && S.nTab === "accesos" ? "accesos" : "avisos";
  const tabs = S.super ? `<div class="ntabs" role="tablist"><button role="tab" aria-selected="${tab === "avisos"}" data-act="notif-tab" data-v="avisos">Avisos${an ? ` <i>${an}</i>` : ""}</button><button role="tab" aria-selected="${tab === "accesos"}" data-act="notif-tab" data-v="accesos">Actividad${acn ? ` <i>${acn}</i>` : ""}</button></div>` : "";
  const lista = tab === "avisos"
    ? (A.length ? A.slice(0, 12).map((a) => itemAviso(a, l.has(a.id))).join("") : `<div class="nvacio">${glifo("campana")}<b>Todo al día</b><span>No hay avisos por ahora.</span></div>`)
    : (ac.length ? ac.slice(0, 12).map(itemAcceso).join("") : `<div class="nvacio">${glifo("campana")}<b>Sin novedades</b><span>Aquí verás solicitudes de sistemas, registros nuevos y cambios de contraseña.</span></div>`);
  const pie = tab === "avisos"
    ? `<button class="nlink" data-act="avisos-leer-todo" ${an ? "" : "disabled"}>Marcar todo como leído</button><span class="nsp"></span>${S.super ? `<a class="nlink" href="#/admin/avisos" data-act="notif-cerrar">Administrar</a>` : ""}<a class="nlink fuerte" href="#/avisos" data-act="notif-cerrar">Ver todos</a>`
    : `<button class="nlink" data-act="notif-todas" ${acn ? "" : "disabled"}>Marcar todo como leído</button><span class="nsp"></span>${S.super && ac.length ? `<button class="nlink" data-act="notif-borrar-todas">Borrar todo</button>` : ""}<a class="nlink fuerte" href="#/admin/notificaciones" data-act="notif-cerrar">Ver todo</a>`;
  return `<header><b>Notificaciones</b><button class="iconbtn" data-act="notif-cerrar" aria-label="Cerrar">${glifo("x")}</button></header>${tabs}<div class="nlist">${lista}</div><footer>${pie}</footer>`;
}
function pintarNotif() { const p = $("#notifpop"); if (p) p.innerHTML = htmlNotif(); }
function abrirNotif() {
  let p = $("#notifpop");
  if (!p) { p = document.createElement("div"); p.id = "notifpop"; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", "Notificaciones"); p.tabIndex = -1; document.body.appendChild(p); }
  if (S.nOpen) return cerrarNotif();
  if (S.super && SB) vigilarNotifs();   // trae solicitudes nuevas
  S.nOpen = true; if (S.super && !S.nTab) S.nTab = nAvisosNo() || !nNoLeidas() ? "avisos" : "accesos";
  p.innerHTML = htmlNotif(); p.hidden = false; requestAnimationFrame(() => p.classList.add("on")); document.querySelectorAll('[data-act="notif-abrir"]').forEach((b) => b.setAttribute("aria-expanded", "true")); p.focus({ preventScroll: true });
}
function cerrarNotif() {
  const p = $("#notifpop"); S.nOpen = false; if (!p) return;
  p.classList.remove("on"); setTimeout(() => { if (!S.nOpen) p.hidden = true; }, 160);
  document.querySelectorAll('[data-act="notif-abrir"]').forEach((b) => b.setAttribute("aria-expanded", "false"));
}
document.addEventListener("click", (e) => { if (S.nOpen && !e.target.closest("#notifpop") && !e.target.closest('[data-act="notif-abrir"]')) cerrarNotif(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && S.nOpen) { cerrarNotif(); const b = $("#campana"); if (b) b.focus(); } });
window.addEventListener("hashchange", () => { if (S.nOpen) cerrarNotif(); });

function bannerAviso() {
  const l = leidosSet(), a = avisosVis().find((x) => x.fijado && !l.has(x.id)); if (!a) return "";
  return `<aside class="aviso-banner t-${esc(a.tipo || "general")}" role="status"><span class="ndot" aria-hidden="true"></span><div><span class="ntipo">${esc(TIPOS_AVISO[a.tipo] || "Aviso")}</span><b>${esc(a.titulo)}</b>${a.mensaje ? `<span class="amsg">${esc(a.mensaje)}</span>` : ""}</div><button class="btn sm" data-act="aviso-ir" data-id="${esc(a.id)}">${a.sistemaId && byId(a.sistemaId) ? "Ver sistema" : "Leer"}</button><button class="iconbtn" data-act="aviso-cerrar" data-id="${esc(a.id)}" aria-label="Descartar aviso">${glifo("x")}</button></aside>`;
}
function vAvisos() {
  const A = avisosVis(), l = leidosSet();
  return `${cabecera("Avisos", "Novedades y recordatorios del catálogo.")}
    ${A.length ? `<div class="admbar" style="margin-top:0"><span class="muted">${A.length} ${plural(A.length, "aviso", "avisos")} · ${A.filter((a) => !l.has(a.id)).length} sin leer</span><button class="btn sec sm" data-act="avisos-leer-todo">${glifo("check")}Marcar todo como leído</button></div>
    <div class="avlist">${A.map((a) => { const s = a.sistemaId && byId(a.sistemaId); return `<article class="avcard t-${esc(a.tipo || "general")} ${l.has(a.id) ? "" : "nuevo"}"><span class="ndot" aria-hidden="true"></span><div><span class="ntipo">${esc(TIPOS_AVISO[a.tipo] || "Aviso")}${a.fijado ? " · Fijado" : ""} · ${esc(fmtFecha(a.publicar))}</span><h3>${esc(a.titulo)}</h3>${a.mensaje ? `<p>${esc(a.mensaje).replace(/\n/g, "<br>")}</p>` : ""}${s ? `<a class="btn sm" href="#/sistema/${enc(s.id)}" data-act="aviso-leer" data-id="${esc(a.id)}">Ver ${esc(s.nombre)}</a>` : ""}</div></article>`; }).join("")}</div>`
    : vacio("Todo al día", "Cuando haya novedades o recordatorios, aparecerán aquí.", `<a class="btn" href="#/sistemas">Ver sistemas</a>`)}`;
}
function vAdminAvisos() {
  const L = Array.isArray(S.cat.avisos) ? [...S.cat.avisos] : [], hoy = hoyISO();
  L.sort((x, y) => (y.publicar || "").localeCompare(x.publicar || ""));
  const est = (a) => (a.publicar > hoy ? ["Programado", "warn"] : a.vence && a.vence < hoy ? ["Vencido", ""] : ["Activo", "ok"]);
  return `<div class="admbar" style="margin-top:0"><span class="muted">${L.length} ${plural(L.length, "aviso", "avisos")}</span>${L.length ? `<button class="btn danger sm" data-act="aviso-borrar-todos">${glifo("trash")}Borrar todos</button>` : ""}<button class="btn" data-act="aviso-nuevo">${glifo("plus")}Nuevo aviso</button></div>
  <div class="note info" style="margin-bottom:14px">${glifo("info")}<div>Los usuarios los ven en la campana y en «Avisos». ${SB_ON ? "Se publican con el catálogo." : "Viajan dentro del catálogo publicado: después de crear o editar avisos, descarga el catálogo y súbelo junto a index.html."}</div></div>
  ${L.length ? `<div class="list-card">${L.map((a) => { const [e, c] = est(a); return `<div class="arow"><span class="avatar-i ndot-lg t-${esc(a.tipo || "general")}"><i></i></span><div class="t"><b>${esc(a.titulo)}</b><small><span class="badge ${c}">${e}</span><span class="badge">${esc(TIPOS_AVISO[a.tipo] || "Aviso")}</span><span class="badge">${esc(AUDIENCIAS[a.audiencia] || "Todos")}</span>${a.fijado ? '<span class="badge acc">Fijado</span>' : ""}<br>Desde ${esc(fmtFecha(a.publicar))}${a.vence ? ` · hasta ${esc(fmtFecha(a.vence))}` : ""}</small></div>
    <div class="acts"><button class="btn sm sec" data-act="aviso-editar" data-id="${esc(a.id)}">${glifo("edit")}Editar</button><button class="btn sm danger" data-act="aviso-borrar" data-id="${esc(a.id)}" aria-label="Eliminar aviso">${glifo("trash")}Eliminar</button></div></div>`; }).join("")}</div>`
    : vacio("Aún no hay avisos", "Publica el primero: un sistema nuevo, un recordatorio o un comunicado.", `<button class="btn" data-act="aviso-nuevo">${glifo("plus")}Nuevo aviso</button>`)}`;
}
function abrirAviso(id, pre) {
  if (!S.super) return toast("Solo el superadministrador puede crear avisos.");
  const a = Object.assign({ tipo: "general", titulo: "", mensaje: "", sistemaId: "", publicar: hoyISO(), vence: "", fijado: false, audiencia: "todos" }, id ? (S.cat.avisos || []).find((x) => x.id === id) : {}, pre || {});
  const op = (obj, cur) => Object.keys(obj).map((k) => `<option value="${k}" ${k === cur ? "selected" : ""}>${obj[k]}</option>`).join("");
  modal({
    titulo: id ? "Editar aviso" : "Nuevo aviso", wide: true,
    body: `<form id="form-aviso" data-id="${esc(id || "")}" novalidate><div class="fields">
      <div class="field"><label for="av-tipo">Tipo</label><select class="select" id="av-tipo">${op(TIPOS_AVISO, a.tipo)}</select></div>
      <div class="field"><label for="av-aud">Para quién</label><select class="select" id="av-aud">${op(AUDIENCIAS, a.audiencia)}</select></div>
      <div class="field full"><label for="av-titulo">Título</label><input id="av-titulo" type="text" maxlength="90" value="${esc(a.titulo)}" autocomplete="off"></div>
      <div class="field full"><label for="av-msg">Mensaje</label><textarea id="av-msg" rows="4" maxlength="500">${esc(a.mensaje)}</textarea></div>
      <div class="field full"><label for="av-sis">Sistema relacionado (opcional)</label><select class="select" id="av-sis"><option value="">Ninguno</option>${S.cat.sistemas.map((x) => `<option value="${esc(x.id)}" ${x.id === a.sistemaId ? "selected" : ""}>${esc(x.nombre || "Sin nombre")}</option>`).join("")}</select></div>
      <div class="field"><label for="av-pub">Publicar desde</label><input id="av-pub" type="date" value="${esc(a.publicar)}"></div>
      <div class="field"><label for="av-vence">Vence (opcional)</label><input id="av-vence" type="date" value="${esc(a.vence || "")}"></div>
      <label class="chk full"><input type="checkbox" id="av-fijado" ${a.fijado ? "checked" : ""}><span>Fijar: mostrarlo como banner en la portada hasta que lo lean</span></label></div>
      <div class="err" id="av-err" role="alert" style="margin-top:10px"></div></form>`,
    pie: `<button class="btn sec" data-act="cerrar-modal">Cancelar</button><button class="btn" type="submit" form="form-aviso">${id ? "Guardar cambios" : "Publicar aviso"}</button>`
  });
}
function guardarAviso(f) {
  if (!S.super) return;
  const er = $("#av-err"), id = f.dataset.id;
  const d = { tipo: $("#av-tipo").value, audiencia: $("#av-aud").value, titulo: val("av-titulo"), mensaje: $("#av-msg").value.trim(), sistemaId: $("#av-sis").value, publicar: $("#av-pub").value, vence: $("#av-vence").value, fijado: $("#av-fijado").checked };
  if (!TIPOS_AVISO[d.tipo]) d.tipo = "general"; if (!AUDIENCIAS[d.audiencia]) d.audiencia = "todos";
  if (d.titulo.length < 3) { er.textContent = "Escribe un título."; return; }
  if (!d.publicar) { er.textContent = "Elige la fecha de publicación."; return; }
  if (d.vence && d.vence < d.publicar) { er.textContent = "La fecha de vencimiento no puede ser anterior a la de publicación."; return; }
  if (!Array.isArray(S.cat.avisos)) S.cat.avisos = [];
  if (id) { const a = S.cat.avisos.find((x) => x.id === id); if (a) Object.assign(a, d); } else S.cat.avisos.unshift(Object.assign({ id: uid("avi"), creado: hoyISO() }, d));
  guardarCatalogo(); cerrarModal(); toast(id ? "Aviso actualizado" : "Aviso publicado"); refrescarCampana(); keep(() => render(false));
}

async function iniciarSesion() {
  if (SB_ON) return sbLogin();
  const correo = normCorreo(val("a-correo")), pass = $("#a-pass").value, rec = $("#a-rec") && $("#a-rec").checked;
  authErr("");
  const fl = []; if (!correoOk(correo)) fl.push(["a-correo", "Escribe un correo electrónico válido."]); if (!pass) fl.push(["a-pass", "Escribe tu contraseña."]);
  if (fl.length) return marcarFaltantes(fl);
  const it = intentosDe(correo);
  if (it.hasta > Date.now()) return authErr(`Demasiados intentos. Vuelve a intentar en ${Math.ceil((it.hasta - Date.now()) / 60000)} min.`);
  const u = buscarPorCorreo(correo);
  const ok = !!u && (await hashClave(pass, u.salt)) === u.hash;
  if (!ok) {
    const n = (it.hasta && it.hasta <= Date.now() ? 0 : it.n) + 1;
    setIntentos(correo, n >= 5 ? { n: 0, hasta: Date.now() + 5 * 60000 } : { n, hasta: 0 });
    return authErr(n >= 5 ? "Demasiados intentos. Espera 5 minutos o solicita recuperar tu contraseña." : "Correo o contraseña incorrectos.");
  }
  if (u.estado === "bloqueado") return authErr("Tu usuario está bloqueado. Contacta al administrador.");
  setIntentos(correo, null); abrirSesion(u, rec);
}

/* ---------- Acceso: pestañas, campos obligatorios y dependencia ---------- */
function authTabs(a) {
  if (SB_ON) return "";
  if (false) return `<div class="auth-tabs three" role="tablist" aria-label="Tipo de acceso"><button type="button" role="tab" aria-selected="${a === "usuario"}" data-act="auth-ir" data-v="login">Usuario</button><button id="tab-colaborador" type="button" role="tab" aria-selected="${a === "colab"}" data-act="auth-ir" data-v="colab">Colaborador</button><button id="tab-superadmin" type="button" role="tab" aria-selected="${a === "super"}" data-act="auth-ir" data-v="super">Superadministrador</button></div>`;
  const correoActual = normCorreo(document.getElementById("a-correo")?.value || "");
  const flujoSuper = ["super", "codigo", "supercod"].includes(S.authView);
  const mostrarSuper = correoActual === "delrivero25@gmail.com" || flujoSuper;
  return `<div class="auth-tabs" role="tablist" aria-label="Tipo de acceso"><button type="button" role="tab" aria-selected="${a === "usuario"}" data-act="auth-ir" data-v="login">Usuario</button><button id="tab-superadmin" type="button" role="tab" aria-selected="${a === "super"}" data-act="auth-ir" data-v="super" ${mostrarSuper ? "" : "hidden"}>Superadministrador</button></div>`;
}
function marcarFaltantes(lista) {
  document.querySelectorAll(".authcard .bad").forEach((x) => x.classList.remove("bad"));
  document.querySelectorAll(".authcard [aria-invalid]").forEach((x) => x.removeAttribute("aria-invalid"));
  let primero = null;
  lista.forEach(([id]) => { const el = $("#" + id); if (!el) return; const w = el.closest(".field, .chk"); if (w) w.classList.add("bad"); el.setAttribute("aria-invalid", "true"); if (!primero) primero = el; });
  if (primero) { primero.scrollIntoView({ block: "center", behavior: "smooth" }); if (primero.focus) primero.focus({ preventScroll: true }); }
  const extra = lista.length > 1 ? ` Faltan ${lista.length - 1} ${lista.length - 1 === 1 ? "campo más" : "campos más"} marcados con *.` : "";
  authErr(lista[0][1] + extra);
}
document.addEventListener("input", (e) => { const w = e.target.closest && e.target.closest(".authcard .field.bad, .authcard .chk.bad"); if (w) { w.classList.remove("bad"); const i = e.target; if (i.removeAttribute) i.removeAttribute("aria-invalid"); } });
document.addEventListener("input", (e) => {
  if (!e.target || e.target.id !== "a-correo") return;
  const ow = document.getElementById("a-owner");
  if (ow) ow.style.display = normCorreo(e.target.value) === normCorreo(CORREO_SUPER) ? "" : "none";
  const tab = document.getElementById("tab-superadmin");
  if (tab && !SB_ON) tab.hidden = normCorreo(e.target.value) !== "delrivero25@gmail.com";
});
function depCampoAuth() {
  const L = depsNombres(), hay = L.length > 0;
  return `<div class="field"><label for="${hay ? "a-depsel" : "a-dep"}">Dependencia u organización <span class="req" aria-hidden="true">*</span></label>${hay ? `<select class="in select" id="a-depsel" aria-required="true" style="width:100%"><option value="">Selecciona…</option>${L.map((x) => `<option>${esc(x)}</option>`).join("")}<option value="__nuevo">Otra dependencia (escribir)…</option></select>` : ""}<div id="a-dep-wrap" ${hay ? "hidden" : ""} style="${hay ? "margin-top:8px" : ""}"><input id="a-dep" type="text" autocomplete="organization" aria-required="true" placeholder="Nombre de tu dependencia u organización"></div>${hay ? '<span class="muted" style="font-size:12.5px">Si no aparece, elige «Otra» y escríbela: quedará registrada.</span>' : ""}</div>`;
}
function depAuthCambio(t) {
  const w = $("#a-dep-wrap"), i = $("#a-dep"); if (!w || !i) return;
  if (t.value === "__nuevo") { w.hidden = false; i.value = ""; i.focus(); } else { w.hidden = true; i.value = t.value; }
}
const reqMark = ' <span class="req" aria-hidden="true">*</span>';
const linksLegales = () => "";
/* ---------- Superadministrador: autorización con código por correo ---------- */
const CODIGO_VIDA_MIN = 15, CODIGO_MAX_INTENTOS = 5, CODIGO_ESPERA_MS = 60000;
const maskCorreo = (e) => { const [u, d] = String(e).split("@"); return (u || "").slice(0, 1) + "•••" + (u || "").slice(-2) + "@" + (d || ""); };
const normCodigo = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const pendSuper = {
  leer() { try { return JSON.parse(localStorage.getItem("catalogo-pend-super") || "null"); } catch (e) { return null; } },
  guardar(v) { try { if (v) localStorage.setItem("catalogo-pend-super", JSON.stringify(v)); else localStorage.removeItem("catalogo-pend-super"); } catch (e) {} }
};
function nuevoCodigo() {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", a = new Uint32Array(8);
  if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a); else a.forEach((_, i) => (a[i] = Math.floor(Math.random() * 4294967295)));
  const r = [...a].map((x) => A[x % A.length]).join("");
  return r.slice(0, 4) + "-" + r.slice(4);
}
async function enviarAvisoCorreo(para, asunto, campos) {
  if (!correoOk(para)) return false;
  if (S.qa) { S.qaLog.unshift({ fecha: new Date().toLocaleString("es-MX"), para, asunto, campos }); return true; }
  try {
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 15000);
    const r = await fetch("https://formsubmit.co/ajax/" + para.trim(), {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, signal: ctl.signal,
      body: JSON.stringify(Object.assign({ _subject: asunto, _template: "table", _captcha: "false" }, campos))
    });
    clearTimeout(tm);
    const j = await r.json().catch(() => ({}));
    S.mailErr = /activat/i.test(String(j.message || "")) ? "activar" : "";
    return r.ok && (j.success === true || String(j.success || "").toLowerCase() === "true" || String(j.success || "").toLowerCase() === "email sent");
  } catch (e) { S.mailErr = "red"; return false; }
}
const avisoMailFallo = () => S.mailErr === "activar" ? "El servicio de correo (FormSubmit) necesita activarse: abre el correo que te envió y pulsa «Activate Form». Mientras tanto se abrirá tu correo para enviar a mano." : S.mailErr === "red" ? "No hay conexión con el servicio de correo. Se abrirá tu correo para enviar a mano." : "No se pudo enviar automáticamente. Se abrirá tu correo.";
const enviarCodigoSuper = (pend, codigo) => enviarAvisoCorreo(CORREO_SUPER, `Autorización de Superadministrador · ${pend.nombre}`, {
  "Nombre": pend.nombre, "Usuario": pend.correo, "Tipo de cuenta": "Superadministrador",
  "Código de autorización": codigo, "Fecha": new Date().toLocaleString("es-MX"),
  "Instrucciones": "Si autorizas esta cuenta, comparte el código con la persona. Si no la reconoces, ignora este correo."
});
async function solicitarSuper() {
  const nombre = val("a-nombre"), correo = normCorreo(val("a-correo")), p1 = $("#a-pass").value, p2 = $("#a-pass2").value;
  authErr("");
  if (nombre.length < 3) return authErr("Escribe tu nombre completo.");
  if (!correoOk(correo)) return authErr("Escribe un correo válido.");
  if (correo !== "delrivero25@gmail.com") return authErr("El acceso de Superadministrador está reservado al correo autorizado.");
  if (!claveOk(p1)) return authErr(CLAVE_AYUDA);
  if (normCorreo(p1) === correo) return authErr("La contraseña no puede ser tu correo.");
  if (p1 !== p2) return authErr("Las contraseñas no coinciden.");
  if (buscarPorCorreo(correo)) return authErr("Ese correo ya tiene un usuario. Inicia sesión o recupera tu contraseña.");
  const prev = pendSuper.leer();
  if (prev && Date.now() - prev.enviado < CODIGO_ESPERA_MS) return authErr(`Espera ${Math.ceil((CODIGO_ESPERA_MS - (Date.now() - prev.enviado)) / 1000)} s antes de pedir otro código.`);
  const btn = $("#a-super-btn"); if (btn) { btn.disabled = true; btn.textContent = "Enviando código…"; }
  const codigo = nuevoCodigo(), cs = nuevoSalt(), ps = nuevoSalt();
  const pend = { nombre, correo, salt: ps, hash: await hashClave(p1, ps), codeSalt: cs, codeHash: await hashClave(normCodigo(codigo), cs), exp: Date.now() + CODIGO_VIDA_MIN * 60000, enviado: Date.now(), n: 0 };
  const ok = await enviarCodigoSuper(pend, codigo);
  if (!ok) {
    if (btn) { btn.disabled = false; btn.textContent = "Solicitar código de autorización"; }
    return authErr("No se pudo enviar el código al correo del propietario. Revisa tu conexión e inténtalo de nuevo.");
  }
  pendSuper.guardar(pend); S.authView = "codigo"; render(false);
  const i = $("#a-codigo"); if (i) i.focus();
}
async function reenviarCodigoSuper() {
  const pend = pendSuper.leer(); if (!pend) { S.authView = "super"; render(false); return; }
  const espera = CODIGO_ESPERA_MS - (Date.now() - pend.enviado);
  if (espera > 0) return authErr(`Espera ${Math.ceil(espera / 1000)} s antes de pedir otro código.`);
  authErr("");
  const codigo = nuevoCodigo(); pend.codeSalt = nuevoSalt(); pend.codeHash = await hashClave(normCodigo(codigo), pend.codeSalt);
  pend.exp = Date.now() + CODIGO_VIDA_MIN * 60000; pend.enviado = Date.now(); pend.n = 0;
  const ok = await enviarCodigoSuper(pend, codigo);
  if (!ok) return authErr("No se pudo enviar el código. Revisa tu conexión e inténtalo de nuevo.");
  pendSuper.guardar(pend); toast("Enviamos un código nuevo al propietario.");
}
async function verificarCodigoSuper() {
  const pend = pendSuper.leer(), cod = normCodigo(val("a-codigo"));
  authErr("");
  if (!pend) { S.authView = "super"; render(false); return; }
  if (Date.now() > pend.exp) return authErr("El código venció. Usa «Reenviar código» para pedir uno nuevo.");
  if (pend.n >= CODIGO_MAX_INTENTOS) return authErr("Demasiados intentos. Usa «Reenviar código» para pedir uno nuevo.");
  if (cod.length !== 8) return authErr("Escribe el código completo (8 caracteres).");
  if ((await hashClave(cod, pend.codeSalt)) !== pend.codeHash) {
    pend.n++; pendSuper.guardar(pend);
    return authErr(pend.n >= CODIGO_MAX_INTENTOS ? "Demasiados intentos. Usa «Reenviar código» para pedir uno nuevo." : `Código incorrecto. Te quedan ${CODIGO_MAX_INTENTOS - pend.n} intentos.`);
  }
  if (buscarPorCorreo(pend.correo)) { pendSuper.guardar(null); S.authView = "login"; render(false); return toast("Ese correo ya tiene un usuario."); }
  const u = { id: uid("usr"), nombre: pend.nombre, correo: pend.correo, dependencia: "", cargo: "", telefono: "", rol: "superadmin", estado: "activo", salt: pend.salt, hash: pend.hash, debeCambiar: false, creado: hoyISO() };
  S.cat.usuarios.push(u); guardarCatalogo(); pendSuper.guardar(null); abrirSesion(u, false);
}
async function guardarClaveObligatoria() {
  const p1 = $("#a-pass").value, p2 = $("#a-pass2").value, u = S.user;
  authErr("");
  if (!claveOk(p1)) return authErr(CLAVE_AYUDA);
  if (normCorreo(p1) === normCorreo(u.correo)) return authErr("La contraseña no puede ser tu correo.");
  if (p1 !== p2) return authErr("Las contraseñas no coinciden.");
  u.salt = nuevoSalt(); u.hash = await hashClave(p1, u.salt); u.debeCambiar = false; guardarCatalogo();
  toast("Contraseña actualizada"); render(true);
}
const folioDe = (p) => `${p}-${hoyISO().replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
async function prepararEnvio(tipo, asunto, cuerpo, folio) {
  const c = cfg(), para = (c.correoAdmin || c.correoDestino || CORREO_SUPER || "").trim();
  S.authInfo = { tipo, asunto, cuerpo, folio, para, enviando: true, auto: false }; S.authView = "enviado"; render(false);
  const ok = await enviarAvisoCorreo(para, asunto, { Folio: folio, Mensaje: cuerpo });
  if (!S.authInfo || S.authInfo.folio !== folio) return;
  S.authInfo.enviando = false; S.authInfo.auto = ok; render(false);
  if (!ok && para) { toast(avisoMailFallo()); setTimeout(() => { window.open(mailtoAdmin(S.authInfo), "_blank", "noopener"); }, 600); }
}
const gmailCompose = (to, subject, body) => `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to || "")}&su=${encodeURIComponent(subject || "")}&body=${encodeURIComponent(body || "")}`; const mailtoAdmin = (i) => gmailCompose(i.para, i.asunto, i.cuerpo);

function vAuth() {
  if (SB_ON) return vAuthSB();
  const c = cfg(), forzar = !!(S.user && S.user.debeCambiar), hay = S.cat.usuarios.length > 0;
  let v = S.authView;
  /* La creación de Superadministrador NO se ofrece al público: solo existe para la instalación inicial (sin cuentas) y únicamente por el enlace privado #/acceso/propietario. */
  if (v === "codigo" && !pendSuper.leer()) v = "login";
  const logo = logoInner(c);
  const fld = (id, label, o = {}) => `<div class="field"><label for="${id}">${label}${o.req ? reqMark : ""}</label>${o.pw
    ? `<div class="pwrow"><input id="${id}" type="password" autocomplete="${o.auto || "current-password"}" ${o.req ? 'aria-required="true"' : ""}><button type="button" class="showpw" data-act="ver-pass" aria-label="Mostrar u ocultar contraseña">Mostrar</button></div>`
    : `<input id="${id}" type="${o.tipo || "text"}" autocomplete="${o.auto || "off"}" placeholder="${esc(o.ph || "")}" value="${esc(o.val || "")}" ${o.extra || ""} ${o.req ? 'aria-required="true"' : ""}>`}${o.hint ? `<span class="muted" style="font-size:12.5px">${o.hint}</span>` : ""}</div>`;
  const correoF = (label = "Correo electrónico") => fld("a-correo", label, { tipo: "email", req: 1, ph: "tucorreo@ejemplo.com", auto: "username", extra: 'autocapitalize="none" spellcheck="false"' });
  const err = `<div class="err" id="a-err" role="alert"></div>`;
  const visitante = `<button class="btn sec big auth-alt" type="button" data-act="entrar-visitante">${glifo("eye")}Entrar como visualizador</button>`;
  const ayudaRoles = `<details class="auth-alt"><summary class="muted" style="cursor:pointer;font-size:14px">¿Qué tipo de acceso necesito?</summary><ul class="rolhelp">
    <li><b>Visualizador:</b> consulta el catálogo sin cuenta. Solo al enviar una solicitud (para generar su folio) se le pide iniciar sesión.</li><li><b>Usuario:</b> te registras tú mismo con tus datos y puedes consultar y solicitar sistemas.</li>
    <li><b>Colaborador:</b> ayuda a manejar el catálogo (sistemas y categorías). Lo autoriza el administrador.</li>
    <li><b>Superadministrador:</b> control total. Se entra desde la pestaña «Superadministrador» con un código que llega al correo del propietario.</li></ul></details>`;
  let t, sub, body;
  if (forzar) {
    t = "Crea tu nueva contraseña"; sub = "Tu contraseña actual es temporal. Elige una nueva para continuar.";
    body = `<form id="form-cambiar" novalidate>${fld("a-pass", "Nueva contraseña", { pw: 1, auto: "new-password" })}<span class="muted" style="font-size:12.5px;margin-top:-8px">${CLAVE_AYUDA}</span>${fld("a-pass2", "Confirma la contraseña", { pw: 1, auto: "new-password", req: 1 })}${err}<button class="btn big" type="submit">Guardar y entrar</button></form>
      <div class="auth-links"><button type="button" data-act="cerrar-sesion">Cerrar sesión</button></div>`;
  } else if (v === "super") {
    const pend = pendSuper.leer();
    t = hay ? "Acceso de Superadministrador" : "Crea la cuenta de Superadministrador";
    sub = hay ? "Accede a la administración del catálogo. Después de iniciar sesión, podrás personalizar la identidad visual y añadir tu propio logotipo en Configuración > General."
              : "Es el primer acceso. Se enviará un código de autorización al correo del propietario del sistema; sin ese código no se crea la cuenta.";
    body = `<form id="form-super" novalidate><p class="auth-req"><b>*</b> Campo obligatorio</p>${fld("a-nombre", "Nombre completo", { auto: "name", req: 1 })}${fld("a-correo", "Correo electrónico", { tipo: "email", auto: "email", ph: "tucorreo@ejemplo.com" })}${fld("a-pass", "Contraseña", { pw: 1, auto: "new-password", hint: CLAVE_AYUDA, req: 1 })}${fld("a-pass2", "Confirma la contraseña", { pw: 1, auto: "new-password", req: 1 })}
      <div class="note info">${glifo("info")}<div>El código llegará a <b>${esc(maskCorreo(CORREO_SUPER))}</b>. Pídeselo a la persona propietaria y escríbelo en el siguiente paso.</div></div>
      ${err}<button class="btn big" type="submit" id="a-super-btn">Solicitar código de autorización</button></form>
      <div class="auth-links">${pend ? `<button type="button" data-act="auth-ir" data-v="codigo">Ya tengo un código</button>` : ""}${hay ? `<button type="button" data-act="auth-ir" data-v="login">Ya tengo usuario</button>` : ""}</div>${visitante}`;
  } else if (v === "codigo") {
    const pend = pendSuper.leer();
    t = "Escribe el código de autorización"; sub = `Enviamos un código a ${maskCorreo(CORREO_SUPER)} para autorizar la cuenta de ${pend.nombre}. Vence en ${CODIGO_VIDA_MIN} minutos.`;
    body = `<form id="form-codigo" novalidate>${fld("a-codigo", "Código de autorización", { ph: "XXXX-XXXX", extra: 'maxlength="9" autocapitalize="characters" spellcheck="false" style="text-transform:uppercase;letter-spacing:.12em"' })}${err}<button class="btn big" type="submit">Verificar y crear cuenta</button></form>
      <div class="note info" style="margin-top:12px">${glifo("info")}<div>Si no llega en un par de minutos, revisa spam. La primera vez, el servicio de correo (FormSubmit) pide al propietario confirmar su correo.</div></div>
      <div class="auth-links"><button type="button" data-act="super-reenviar">Reenviar código</button><button type="button" data-act="super-cancelar">Cancelar solicitud</button></div>`;
  } else if (v === "registro") {
    t = "Crea tu cuenta"; sub = "Regístrate con tus datos y entra al instante: no necesitas códigos ni esperar autorización. Después inicias sesión con tu correo y contraseña.";
    body = `<form id="form-reg" novalidate><p class="auth-req"><b>*</b> Campo obligatorio</p>${fld("a-nombre", "Nombre completo", { auto: "name", req: 1 })}${fld("a-cargo", "Cargo", { auto: "organization-title", req: 1 })}${depCampoAuth()}${fld("a-area", "Área o unidad (opcional)")}${fld("a-correo", "Correo electrónico", { tipo: "email", auto: "email", ph: "tucorreo@ejemplo.com", extra: 'autocapitalize="none" spellcheck="false"', req: 1 })}${fld("a-tel", "Teléfono de contacto", { tipo: "tel", auto: "tel", req: 1 })}${fld("a-pass", "Contraseña", { pw: 1, auto: "new-password", hint: CLAVE_AYUDA, req: 1 })}${fld("a-pass2", "Confirma la contraseña", { pw: 1, auto: "new-password", req: 1 })}
      <label class="chk"><input type="checkbox" id="a-acepto" aria-required="true"><span>${reqMark.trim()} ${esc(c.privacidad)}${linksLegales()}</span></label>${err}<button class="btn big" type="submit" id="a-reg-btn">Crear mi cuenta</button></form>
      <div class="auth-links"><button type="button" data-act="auth-ir" data-v="login">Ya tengo cuenta</button></div>${visitante}`;
  } else if (v === "recuperar") {
    t = "Recuperar contraseña"; sub = "Escribe el correo con el que te registraste. Avisaremos al administrador dentro del sistema para que te genere una contraseña temporal.";
    body = `<form id="form-rec" novalidate>${correoF("Correo registrado")}${err}<button class="btn big" type="submit">Solicitar recuperación</button></form>
      <div class="auth-links"><button type="button" data-act="auth-ir" data-v="login">Volver a iniciar sesión</button></div>`;
  } else if (v === "enviado" && S.authInfo) {
    const i = S.authInfo, rec = i.tipo === "recuperacion";
    t = i.enviando ? "Enviando solicitud…" : i.auto ? "Solicitud enviada" : "Solicitud preparada"; sub = `Folio ${i.folio}`;
    const paso1 = i.enviando ? ["Enviando tu solicitud", "Un momento, la estamos enviando al administrador."]
      : i.auto ? ["Solicitud enviada", "Ya llegó al administrador. No tienes que hacer nada más por ahora."]
      : ["Envía el correo", i.para ? `No se pudo enviar automáticamente, así que se abrió tu aplicación de correo con el mensaje dirigido a ${esc(i.para)}. Solo presiona «Enviar».` : "Copia el mensaje y envíalo al administrador del catálogo."];
    body = `<ol class="timeline auth-steps">
      <li><span class="n">1</span><div><b>${paso1[0]}</b><span>${paso1[1]}</span></div></li>
      <li><span class="n">2</span><div><b>El administrador lo revisa</b><span>${rec ? "Verifica que el correo coincida con el registrado y restablece tu acceso." : "Valida tus datos y crea tu usuario."}</span></div></li>
      <li><span class="n">3</span><div><b>Recibes tu contraseña temporal</b><span>Entra con tu correo y esa contraseña; el sistema te pedirá crear una nueva.</span></div></li></ol>
      ${!i.enviando && !i.auto && i.para ? `<a class="btn big" href="${esc(mailtoAdmin(i))}">${glifo("correo")}Abrir correo</a>` : ""}
      ${!i.enviando && !i.auto ? `<button class="btn sec big" type="button" data-act="auth-copiar" style="margin-top:10px">${glifo("copy")}Copiar mensaje</button>` : ""}
      <div class="auth-links"><button type="button" data-act="auth-ir" data-v="login">Volver a iniciar sesión</button></div>`;
  } else {
    t = "Iniciar sesión"; sub = "¡Te damos la bienvenida! Inicia sesión con tu correo y contraseña, o explora el catálogo como visitante.";
    if (!hay) sub = "Aún no hay cuentas guardadas en este navegador. Si ya tienes cuenta, abre el catálogo desde el mismo enlace o dispositivo donde se creó, o explora como visitante.";
    body = `<form id="form-login" novalidate><p class="auth-req"><b>*</b> Campo obligatorio</p>${correoF()}${fld("a-pass", "Contraseña", { pw: 1, req: 1 })}
      <label class="chk"><input type="checkbox" id="a-rec"><span>Mantener la sesión en este dispositivo</span></label>${err}<button class="btn big" type="submit">Iniciar sesión</button></form>
      <button class="btn sec big auth-alt" type="button" data-act="auth-ir" data-v="registro">${glifo("user")}Registrarse</button>
      ${visitante}
      <div class="auth-links"><button type="button" data-act="auth-ir" data-v="recuperar">¿Olvidaste tu contraseña?</button><button type="button" data-act="auth-ir" data-v="registro">Registrarse</button></div>${ayudaRoles}`;
  }
  return `<div class="authwrap"><div class="authcard"><div class="auth-brand"><span class="auth-logo${imgOk(c.logo) ? "" : " lg"}">${logo}</span><div><b>${esc(c.nombre)}</b><small>${esc(c.organizacion)}</small></div></div>${forzar ? "" : v === "super" || v === "codigo" ? authTabs("super") : !["registro", "recuperar", "enviado"].includes(v) ? authTabs("usuario") : ""}<h1>${t}</h1><p class="lede">${sub}</p>${body}</div><p class="auth-foot">${esc(c.organizacion)}</p></div>`;
}

/* ---- Mi cuenta ---- */
function abrirMiCuenta() {
  const u = S.user;
  if (!u) { ACT["ir-login"](); return; }
  modal({
    titulo: "Mi cuenta",
    body: `<div style="display:flex;gap:14px;align-items:center;margin-bottom:14px"><span class="avatar-i" style="width:52px;height:52px;font-size:18px">${esc(iniciales(u.nombre))}</span><div><b style="font-size:17px">${esc(u.nombre)}</b><div class="muted" style="font-size:14px">${ROLES[rolDe(u.rol)]}</div></div></div>
      <div class="kv">${u.correo ? `<div><span class="k">Correo</span><span class="v">${esc(u.correo)}</span></div>` : ""}${u.dependencia ? `<div><span class="k">Dependencia</span><span class="v">${esc(u.dependencia)}</span></div>` : ""}${u.cargo ? `<div><span class="k">Cargo</span><span class="v">${esc(u.cargo)}</span></div>` : ""}</div>`,
    pie: `<button class="btn sec" data-act="cambiar-pass">${glifo("candado")}Cambiar contraseña</button><button class="btn sec" data-act="notif-desde-cuenta">${glifo("campana")}Notificaciones${nCampana() ? ` (${nCampana()})` : ""}</button>${S.admin ? `<a class="btn sec" href="#/admin" data-act="cerrar-modal">${glifo("ajustes")}Administración</a>` : ""}<button class="btn danger" data-act="cerrar-sesion">Cerrar sesión</button>`
  });
}
function abrirCambiarClave() {
  cerrarModal();
  modal({
    titulo: "Cambiar contraseña",
    body: `<form id="form-pass" novalidate style="display:grid;gap:12px">
      <div class="field"><label for="pw0">Contraseña actual</label><input id="pw0" type="password" autocomplete="current-password"></div>
      <div class="field"><label for="pw1">Nueva contraseña</label><input id="pw1" type="password" autocomplete="new-password"><span class="muted" style="font-size:12.5px">${CLAVE_AYUDA}</span></div>
      <div class="field"><label for="pw2">Confirma la nueva contraseña</label><input id="pw2" type="password" autocomplete="new-password"></div>
      <div class="err" id="pw-err" role="alert"></div></form>`,
    pie: `<button class="btn sec" data-act="cerrar-modal">Cancelar</button><button class="btn" type="submit" form="form-pass">Guardar</button>`
  });
}
async function cambiarMiClave() {
  const u = S.user, a = $("#pw0").value, n = $("#pw1").value, n2 = $("#pw2").value, er = $("#pw-err");
  if (SB_ON && u.sb) {
    if (!claveOk(n)) { er.textContent = CLAVE_AYUDA; return; }
    if (n !== n2) { er.textContent = "Las contraseñas nuevas no coinciden."; return; }
    const sinActual = !a && mismoCorreo(u.correo, CORREO_SUPER);
    const { error: e1 } = sinActual ? { error: null } : await SB.auth.signInWithPassword({ email: u.correo, password: a });
    if (e1) { er.textContent = "La contraseña actual no es correcta."; return; }
    const { error: e2 } = await SB.auth.updateUser({ password: n });
    if (e2) { er.textContent = /same|different/i.test(e2.message) ? "La nueva contraseña debe ser distinta a la actual." : "No se pudo actualizar. Inténtalo de nuevo."; return; }
    cerrarModal(); toast("Contraseña actualizada"); return;
  }
  if ((await hashClave(a, u.salt)) !== u.hash) { er.textContent = "La contraseña actual no es correcta."; return; }
  if (!claveOk(n)) { er.textContent = CLAVE_AYUDA; return; }
  if (normCorreo(n) === normCorreo(u.correo)) { er.textContent = "La contraseña no puede ser tu correo."; return; }
  if (n !== n2) { er.textContent = "Las contraseñas nuevas no coinciden."; return; }
  u.salt = nuevoSalt(); u.hash = await hashClave(n, u.salt); guardarCatalogo(); cerrarModal(); toast("Contraseña actualizada");
}

/* ---- Administración de usuarios ---- */
function vAdminUsuarios() {
  const U = S.cat.usuarios, c = cfg();
  post = () => {
    const q = hashQuery(); if (!q.nuevo && !q.reset) return;
    history.replaceState(null, "", location.pathname + location.search + "#/admin/usuarios");
    if (q.nuevo) abrirCrearUsuario({ nombre: q.nombre, correo: q.correo, dep: q.dep, cargo: q.cargo, tel: q.tel });
    else abrirReset(q.reset);
  };
  const n = (r) => U.filter((u) => rolDe(u.rol) === r).length;
  const opt = (cur) => Object.keys(ROLES).map((r) => `<option value="${r}" ${r === cur ? "selected" : ""}>${ROLES[r]}</option>`).join("");
  return `<div class="admbar" style="margin-top:0"><span class="muted">${U.length} ${plural(U.length, "usuario", "usuarios")} · ${n("superadmin")} ${plural(n("superadmin"), "superadministrador", "superadministradores")} · ${n("gestor")} ${plural(n("gestor"), "colaborador", "colaboradores")}</span><button class="btn" data-act="usr-nuevo">${glifo("plus")}Crear usuario</button></div>
  <div class="note info">${glifo("info")}<div>Como superadministrador creas los usuarios aquí mismo, al instante y sin códigos de verificación. Las demás personas se registran solas como Usuario; desde aquí subes su nivel (Colaborador o Superadministrador) cuando haga falta.
    <ul class="rolhelp"><li><b>Usuario:</b> con sesión, consulta y solicita sistemas.</li><li><b>Colaborador:</b> edita sistemas y categorías, pero no usuarios, configuración ni publicación.</li><li><b>Superadministrador:</b> control total.</li></ul></div></div>
  <div class="list-card" style="margin-top:14px">${U.map((u) => { const r = rolDe(u.rol), yo = u.id === S.user.id; return `<div class="arow"><span class="avatar-i">${esc(iniciales(u.nombre))}</span>
    <div class="t"><b>${esc(u.nombre)}</b><small>${esc(u.correo || u.rfc || "")}${u.dependencia ? " · " + esc(u.dependencia) : ""}<br><span class="badge ${r === "superadmin" ? "acc" : r === "gestor" ? "ok" : ""}">${ROLES[r]}</span><span class="badge ${u.estado === "activo" ? "ok" : "warn"}">${u.estado === "activo" ? "Activo" : "Bloqueado"}</span>${u.debeCambiar ? '<span class="badge warn">Contraseña temporal</span>' : ""}</small></div>
    <div class="acts"><label class="sr" for="rol-${esc(u.id)}">Tipo de acceso</label><select class="select" id="rol-${esc(u.id)}" data-usr-rol="${esc(u.id)}" ${yo ? "disabled" : ""}>${opt(r)}</select>
      <button class="btn sm ${r === "superadmin" ? "sec" : ""}" data-act="usr-super" data-id="${esc(u.id)}" ${yo ? "disabled" : ""}>${glifo("user")}${r === "superadmin" ? "Quitar superadministrador" : "Hacer superadministrador"}</button>
      <button class="btn sm sec" data-act="usr-reset" data-id="${esc(u.id)}">Restablecer contraseña</button>
      <button class="btn sm ghost" data-act="usr-toggle" data-id="${esc(u.id)}" ${yo ? "disabled" : ""}>${u.estado === "activo" ? "Bloquear" : "Activar"}</button>
      <button class="btn sm danger" data-act="usr-del" data-id="${esc(u.id)}" aria-label="Eliminar ${esc(u.nombre)}" ${yo ? "disabled" : ""}>${glifo("trash")}Eliminar</button></div></div>`; }).join("")}</div>
  `;
}
function abrirCrearUsuario(q) {
  if (!S.super) return toast("Solo el superadministrador puede crear usuarios.");
  q = q || {}; cerrarModal();
  const f = (id, l, v, o = {}) => `<div class="field ${o.full ? "full" : ""}"><label for="${id}">${l}</label><input id="${id}" type="${o.tipo || "text"}" value="${esc(v || "")}" autocomplete="off" ${o.extra || ""}></div>`;
  modal({
    titulo: "Crear usuario", wide: true,
    body: `<form id="form-usr" novalidate><div class="fields">
      ${f("uc-correo", "Correo electrónico (es su usuario)", q.correo, { tipo: "email", full: true, extra: 'autocapitalize="none" spellcheck="false"' })}
      ${f("uc-nombre", "Nombre completo", q.nombre)}
      <div class="field"><label for="uc-rol">Tipo de acceso</label><select class="select" id="uc-rol"><option value="visitante">Usuario</option><option value="gestor" selected>Colaborador</option><option value="superadmin">Superadministrador</option></select></div>
      <div class="field full"><label for="uc-pass">Contraseña</label><div class="pwrow"><input id="uc-pass" type="text" value="${esc(claveTemporal())}" autocomplete="off" spellcheck="false"><button type="button" class="showpw" data-act="usr-gen">Generar otra</button></div><span class="muted" style="font-size:12.5px">${CLAVE_AYUDA} Puedes escribir la que prefieras.</span></div>
      ${f("uc-dep", "Dependencia (opcional)", q.dep)}${f("uc-cargo", "Cargo (opcional)", q.cargo)}
      ${f("uc-tel", "Teléfono (opcional)", q.tel, { tipo: "tel" })}
      ${SB_ON ? "" : `<label class="chk full"><input type="checkbox" id="uc-cambiar" checked><span>Pedir que cambie la contraseña al entrar por primera vez</span></label>`}</div>
      <div class="err" id="uc-err" role="alert" style="margin-top:10px"></div></form>`,
    pie: `<button class="btn sec" data-act="cerrar-modal">Cancelar</button><button class="btn" type="submit" form="form-usr">Crear usuario</button>`
  });
}
async function crearUsuarioAdmin() {
  if (!S.super) return;
  if (SB_ON) {
    const er = $("#uc-err"), correo = normCorreo(val("uc-correo")), nombre = val("uc-nombre"), pass = $("#uc-pass").value.trim();
    if (!correoOk(correo)) { er.textContent = "Escribe un correo electrónico válido."; return; }
    if (S.cat.usuarios.some((x) => mismoCorreo(x.correo, correo))) { er.textContent = "Ya existe un usuario con ese correo."; return; }
    if (nombre.length < 3) { er.textContent = "Escribe el nombre completo."; return; }
    if (!claveOk(pass)) { er.textContent = CLAVE_AYUDA; return; }
    const rolSel = ROLES[$("#uc-rol").value] ? $("#uc-rol").value : "visitante";
    const bt = $('button[form="form-usr"]'); if (bt) { bt.disabled = true; bt.textContent = "Creando…"; }
    const r = await sbCrearUsuario({ correo, nombre, pass, rol: rolSel, dep: val("uc-dep"), cargo: val("uc-cargo"), tel: val("uc-tel") });
    if (!r.ok) { if (bt) { bt.disabled = false; bt.textContent = "Crear usuario"; } er.textContent = r.msg; return; }
    const nuevo = S.cat.usuarios.find((x) => mismoCorreo(x.correo, correo));
    cerrarModal(); render(false); toast(r.aviso || "Usuario creado"); if (nuevo) mostrarClaveTemporal(Object.assign({}, nuevo, { debeCambiar: false }), pass, "creado");
    return;
  }
  const er = $("#uc-err"), correo = normCorreo(val("uc-correo")), nombre = val("uc-nombre"), pass = $("#uc-pass").value.trim();
  if (!correoOk(correo)) { er.textContent = "Escribe un correo electrónico válido."; return; }
  if (buscarPorCorreo(correo)) { er.textContent = "Ya existe un usuario con ese correo."; return; }
  if (nombre.length < 3) { er.textContent = "Escribe el nombre completo."; return; }
  if (!claveOk(pass)) { er.textContent = CLAVE_AYUDA; return; }
  const salt = nuevoSalt();
  const u = { id: uid("usr"), nombre, correo, dependencia: val("uc-dep"), cargo: val("uc-cargo"), telefono: val("uc-tel"), rol: ROLES[$("#uc-rol").value] ? $("#uc-rol").value : "gestor", estado: "activo", salt, hash: await hashClave(pass, salt), debeCambiar: !!$("#uc-cambiar").checked, creado: hoyISO() };
  S.cat.usuarios.push(u); guardarCatalogo(); cerrarModal(); render(false); toast("Usuario creado"); mostrarClaveTemporal(u, pass, "creado");
}
function mostrarClaveTemporal(u, temp, modo) {
  const asunto = modo === "reset" ? "Contraseña temporal del catálogo de sistemas" : "Tu usuario del catálogo de sistemas";
  const cuerpo = [`Hola ${u.nombre},`, "", modo === "reset" ? "Se restableció tu contraseña." : "Tu usuario fue creado.", "", `Sitio: ${location.href.split("#")[0]}`, `Usuario (correo): ${u.correo}`, `Contraseña${u.debeCambiar ? " temporal" : ""}: ${temp}`, "", u.debeCambiar ? "Al entrar, el sistema te pedirá crear una contraseña nueva. No compartas este mensaje." : "No compartas este mensaje."].join("\n");
  modal({
    titulo: modo === "reset" ? "Contraseña restablecida" : "Usuario creado",
    body: `<p class="muted" style="margin-bottom:12px">Comparte estos datos con ${esc(u.nombre)}. La contraseña solo se muestra ahora.</p>
      <div class="kv"><div><span class="k">Correo</span><span class="v">${esc(u.correo)}</span></div></div>
      <div class="tmp" style="margin-top:12px">${esc(temp)}</div>
      <div style="margin-top:10px"><button class="btn ghost sm" data-act="copiar" data-v="${esc(temp)}">${glifo("copy")}Copiar contraseña</button></div>
      ${u.debeCambiar ? `<div class="note info" style="margin-top:12px">${glifo("info")}<div>La persona deberá cambiarla al iniciar sesión.</div></div>` : ""}`,
    pie: `<button class="btn sec" data-act="copiar" data-v="${esc(cuerpo)}">${glifo("copy")}Copiar mensaje</button>${u.correo ? `<a class="btn" href="mailto:${esc(u.correo)}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}">${glifo("correo")}Enviar por correo</a>` : `<button class="btn" data-act="cerrar-modal">Listo</button>`}`
  });
}
function abrirReset(ref, correoSol) {
  cerrarModal();
  const u = S.cat.usuarios.find((x) => x.id === ref || mismoCorreo(x.correo, ref));
  if (!u) { toast("No hay un usuario con ese correo. Puedes crearlo."); abrirCrearUsuario({ correo: ref }); return; }
  const coincide = correoSol ? norm(correoSol) === norm(u.correo) : null;
  modal({
    titulo: "Restablecer contraseña",
    body: `<div class="kv"><div><span class="k">Nombre</span><span class="v">${esc(u.nombre)}</span></div><div><span class="k">Correo registrado</span><span class="v">${esc(u.correo || "—")}</span></div>${correoSol ? `<div><span class="k">Correo de la solicitud</span><span class="v">${esc(correoSol)}</span></div>` : ""}</div>
      ${coincide === true ? `<div class="note info" style="margin-top:12px">${glifo("check")}<div>El correo de la solicitud coincide con el registrado.</div></div>` : ""}
      ${coincide === false ? `<div class="note warn" style="margin-top:12px">${glifo("warn")}<div><b>El correo no coincide</b> con el registrado. Confirma la identidad por otro medio antes de continuar.</div></div>` : ""}
      <p class="muted" style="margin-top:12px">${SB_ON ? `Se enviará un enlace de recuperación al correo ${esc(u.correo || "registrado")} para que la persona elija una contraseña nueva.` : "Se generará una contraseña temporal y la actual dejará de funcionar."}</p>`,
    pie: `<button class="btn sec" data-act="cerrar-modal">Cancelar</button><button class="btn" data-act="usr-reset-ok" data-id="${esc(u.id)}">${SB_ON ? "Enviar enlace de recuperación" : "Generar contraseña temporal"}</button>`
  });
}
async function restablecerClave(id) {
  if (!S.super) return;
  const u = S.cat.usuarios.find((x) => x.id === id); if (!u) return;
  if (SB_ON) { if (!correoOk(u.correo)) return toast("Este usuario no tiene un correo válido."); let r; try { r = await SB.auth.resetPasswordForEmail(u.correo, { redirectTo: location.origin + location.pathname }); } catch (e) { r = { error: e }; } cerrarModal(); if (r && r.error) return toast("No se pudo enviar el enlace. Inténtalo de nuevo en un minuto."); return toast(`Enviamos un enlace de recuperación a ${u.correo}`); }
  const temp = claveTemporal(); u.salt = nuevoSalt(); u.hash = await hashClave(temp, u.salt); u.debeCambiar = true;
  setIntentos(normCorreo(u.correo), null); guardarCatalogo(); cerrarModal(); render(false); mostrarClaveTemporal(u, temp, "reset");
}

/* ---------- Roles en Supabase: guardar cambios en la tabla perfiles ---------- */
async function sbPerfilUpd(id, campos) {
  if (!SB) return { ok: false, msg: "No hay conexión con el servicio de acceso. Revisa tu internet." };
  let r; try { r = await SB.from("perfiles").update(campos).eq("id", id).select("id"); } catch (e) { r = { error: e }; }
  if (r.error || !r.data || !r.data.length) return { ok: false, msg: "No se pudo guardar: tu cuenta no tiene permiso para modificar perfiles. Ejecuta supabase-roles.sql en Supabase (SQL Editor)." };
  return { ok: true };
}
async function sbCrearUsuario(d) {
  if (!window.supabase) return { ok: false, msg: "No hay conexión con el servicio de acceso." };
  const tmp = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data, error } = await tmp.auth.signUp({ email: d.correo, password: d.pass, options: { data: { nombre: d.nombre } } });
  if (error) return { ok: false, msg: /regist|already|exists/i.test(error.message) ? "Ya existe una cuenta con ese correo." : "No se pudo crear la cuenta: " + error.message };
  if (!data || !data.user) return { ok: false, msg: "No se pudo crear la cuenta." };
  if (!data.session) return { ok: false, msg: "La cuenta se creó, pero Supabase pide confirmar el correo. Desactiva «Confirm email» en Authentication → Providers → Email." };
  const perfil = { id: data.user.id, nombre: d.nombre, correo: d.correo, rol: "visitante", estado: "activo", dependencia: d.dep, area: "", cargo: d.cargo, telefono: d.tel };
  const { error: e2 } = await tmp.from("perfiles").insert(perfil);
  if (e2) return { ok: false, msg: "La cuenta se creó, pero no se pudo guardar su perfil. Avisa al administrador de Supabase." };
  let aviso = "";
  if (d.rol !== "visitante") { const r = await sbPerfilUpd(perfil.id, { rol: d.rol }); if (r.ok) perfil.rol = d.rol; else aviso = "La cuenta se creó como Usuario, pero no se pudo subir de nivel. " + r.msg; }
  S.cat.usuarios.push(sbUsuario(perfil));
  if (d.dep) { try { await depsRegistrar(d.dep); } catch (e) {} }
  return { ok: true, aviso };
}
/* ---------- Apariencia ---------- */
async function cambiarRolUsuario(t) {
  const u = S.cat.usuarios.find((x) => x.id === t.dataset.usrRol); if (!u) return;
  const nuevo = ROLES[t.value] ? t.value : "visitante", vuelve = () => keep(() => render(false));
  if (!S.super) { toast("Solo el superadministrador puede cambiar tipos de acceso."); return vuelve(); }
  if (u.id === S.user.id) { toast("No puedes cambiar tu propio tipo de acceso."); return vuelve(); }
  if (rolDe(u.rol) === "superadmin" && nuevo !== "superadmin" && esUltimoAdmin(u)) { toast("Debe existir al menos un superadministrador activo."); return vuelve(); }
  if (nuevo === "superadmin" && !(await confirmar({ titulo: "Dar control total", texto: `${u.nombre} podrá administrar usuarios, configuración y publicación. ¿Continuar?`, si: "Dar control total" }))) return vuelve();
  if (SB_ON) { const r = await sbPerfilUpd(u.id, { rol: nuevo }); if (!r.ok) { toast(r.msg); return vuelve(); } u.rol = nuevo; toast(`Ahora es ${ROLES[nuevo].toLowerCase()}`); return vuelve(); }
  u.rol = nuevo; guardarCatalogo(); toast(`Ahora es ${ROLES[nuevo].toLowerCase()}`); vuelve();
}
const mezclar = (hex, con, p) => { const a = [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16)), b = [1, 3, 5].map((k) => parseInt(con.slice(k, k + 2), 16)); return "#" + a.map((v, k) => Math.round(v * (1 - p) + b[k] * p).toString(16).padStart(2, "0")).join(""); };
function aplicarApariencia(c) {
  c = c || cfg();
  const r = document.documentElement, st = r.style;
  if (c.tema === "claro") r.dataset.theme = "light"; else if (c.tema === "oscuro") r.dataset.theme = "dark"; else delete r.dataset.theme;
  const delSistema = !!(window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  const oscuro = c.tema === "oscuro" || (c.tema !== "claro" && delSistema);
  r.dataset.modo = oscuro ? "oscuro" : "claro";
  ["--accent", "--accent-soft", "--pill-ink", "--azul", "--azul-hover", "--azul-suave", "--azul-borde"].forEach((k) => st.removeProperty(k));
  const col = COLORES[c.acento];
  if (col || oscuro) {
    /* Siempre dentro de la paleta: azul #004EAA y lila #9568C6 (y sus tonos). En modo oscuro se usa el tono claro de cada color. */
    const hex = oscuro ? (col || COLORES.azul)[0] : col[1], fondo = "#0E1626";
    st.setProperty("--azul", hex);
    st.setProperty("--azul-hover", oscuro ? mezclar(hex, "#ffffff", 0.18) : mezclar(hex, "#000000", 0.2));
    st.setProperty("--azul-suave", oscuro ? mezclar(hex, fondo, 0.84) : mezclar(hex, "#ffffff", 0.91));
    st.setProperty("--azul-borde", oscuro ? mezclar(hex, fondo, 0.62) : mezclar(hex, "#ffffff", 0.78));
  }
}
if (window.matchMedia) { try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => aplicarApariencia()); } catch (e) { /* navegador antiguo */ } }

/* ---------- Router ---------- */
const hashParts = () => location.hash.replace(/^#\/?/, "").split("?")[0].split("/").filter(Boolean).map((d) => { try { return decodeURIComponent(d); } catch (e) { return d; } });
const go = (p) => { location.hash = "#/" + p; };
let post = null, io = null;
const F2 = { cat: "todas", orden: "catalogo", tipo: "todos" };

let rutaPrev = ["", ""];
function pestanear(parcial, sub) {
  let dest = [view];
  if (parcial) { const t = sub ? $(".cfg-body", view) : $(".admin-panel", view); if (t) dest = [t]; }
  [view, ...view.querySelectorAll(".admin-panel,.cfg-body")].forEach((e) => e.classList.remove("blink")); void view.offsetWidth; dest.forEach((e) => e.classList.add("blink"));
}
function centrarPestanas() {
  view.querySelectorAll(".seg,.cfg-nav").forEach((p) => {
    const e = p.querySelector('[aria-current="page"]'); if (!e || p.scrollWidth <= p.clientWidth) return;
    p.scrollLeft += e.getBoundingClientRect().left - p.getBoundingClientRect().left - (p.clientWidth - e.offsetWidth) / 2;
  });
}
function render(nav) {
  const pideAcceso = (hashParts()[0] === "acceso" && !S.user) || (S.user && S.user.debeCambiar) || (S.user && S.user.completar) || S.recup;
  if (pideAcceso) {
    document.body.classList.add("auth"); cerrarLightbox(); aplicarApariencia();
    view.innerHTML = vAuth(); document.title = cfg().nombre; window.scrollTo(0, 0); pestanear(); return;
  }
  document.body.classList.remove("auth");
  const [a, b, c] = hashParts();
  navActual = !!nav;
  post = null; if (io) { io.disconnect(); io = null; }
  if (!(a === "admin" && b === "config")) S.cfgDraft = null;
  aplicarApariencia(S.cfgDraft || cfg());
  if (!(a === "admin" && b === "editar")) cerrarLightbox();
  let html;
  try {
    switch (a || "") {
      case "": case "acceso": html = vHome(); break;
      case "sistemas": html = vSistemas(); break;
      case "categorias": html = vCategorias(); break;
      case "categoria": html = vLista("categoria", b); break;
      case "uso": html = vLista("uso", b); break;
      case "sistema": html = vFicha(b); break;
      case "buscar": html = vBuscar(); break;
      case "solicitar": if (S.super) { history.replaceState(null, "", "#/solicitudes"); html = vBandeja(); } else html = vSolicitar(b); break;
      case "gracias": html = vGracias(b); break;
      case "solicitudes": html = S.super ? vBandeja(b) : vSolicitudes(); break;
      case "avisos": html = vAvisos(); break;
      case "ayuda": html = vAyuda(); break;
      case "contacto": html = vContacto(); break;
      case "admin": html = vAdmin(b, c); break;
      default: html = vNoEncontrado();
    }
  } catch (err) {
    console.error(err);
    html = vacio("Algo salió mal", "No se pudo mostrar esta pantalla. Vuelve al inicio e inténtalo de nuevo.", `<a class="btn" href="#/">Ir al inicio</a>`);
  }
  view.innerHTML = (S.qa ? qaBanner() : "") + html;
  renderChrome(a || "");
  if (post) post();
  const dentro = !!nav && a === "admin" && rutaPrev[0] === "admin" && b !== "editar" && rutaPrev[1] !== "editar";
  if (nav) { if (!dentro) window.scrollTo(0, 0); pestanear(dentro, dentro && b === "config" && rutaPrev[1] === "config");
    document.querySelectorAll('.sidenav [aria-current="page"],.tabbar [aria-current="page"]').forEach((e) => { e.classList.remove("flash"); void e.offsetWidth; e.classList.add("flash"); }); }
  rutaPrev = [a || "", b || ""];
  centrarPestanas();
  if (!nav && Date.now() - (window.__tapT || 0) < 600) softBlink();
  document.title = (S.qa ? "[PRUEBAS] " : "") + (a === "sistema" && byId(b) ? byId(b).nombre + " · " : "") + cfg().nombre;
}

function renderChrome(a) {
  const c = cfg();
  $("#brand").setAttribute("aria-label", `${c.nombre} · inicio`);
  $("#brand").innerHTML = `${logoHtml(c)}<span><b>${esc(c.nombre)}</b><small>${esc(c.organizacion)}</small></span>`;
  const act = { "": "", sistema: "sistemas", sistemas: "sistemas", uso: "sistemas", categorias: "categorias", categoria: "categorias", solicitar: "solicitudes", gracias: "solicitudes", solicitudes: "solicitudes", buscar: "buscar", ayuda: "ayuda", admin: "admin" }[a] ?? "";
  const cur = (k) => (act === k ? ' aria-current="page"' : "");
  const catActiva = a === "categoria" ? hashParts()[1] : null;
  const cats = S.cat.categorias.slice();
  $("#sidenav").innerHTML = `
    <a href="#/"${cur("")}>${glifo("hoy")}Descubrir</a>
    <a href="#/sistemas"${cur("sistemas")}>${glifo("capas")}Sistemas</a>
    <a href="#/solicitudes"${cur("solicitudes")}>${glifo("send")}${S.super ? "Solicitudes" : "Mis solicitudes"}${misSols().length && !S.super ? ` <span class="badge acc" style="margin-left:auto">${misSols().length}</span>` : ""}</a>
    <a href="#/categorias"${cur("categorias")}>${glifo("grid")}Categorías</a>
    <a href="#/ayuda"${cur("ayuda")}>${glifo("info")}Cómo solicitar</a>
    ${cats.length ? `<h6 class="cat">Categorías</h6>` : ""}
    ${cats.map((k) => `<a class="cat" href="#/categoria/${enc(k.id)}" ${catActiva === k.id ? 'aria-current="page"' : ""}><span class="cdot${catCls(k)}" style="${colorVars(k.color)}">${catInner(k)}</span>${esc(k.nombre)}</a>`).join("")}`;
  $("#sidefoot").innerHTML = `<div class="mode">${S.user ? esc(S.user.nombre) + " · " + ROLES[rolDe(S.user.rol)] : "Visualizador"}</div>`
    + (S.admin ? `<a class="sidenav-a" href="#/admin" ${cur("admin")} style="display:flex;gap:10px;align-items:center;padding:8px 10px;border-radius:9px;color:var(--label);font-size:15px;${act === "admin" ? "background:var(--sel);font-weight:600" : ""}"><span style="color:var(--accent);display:flex">${glifo("ajustes")}</span>Administración</a>` : "")
    + (S.user ? `<button class="sidenav-a" data-act="mi-cuenta" style="display:flex;gap:10px;align-items:center;padding:8px 10px;border-radius:9px;color:var(--label-2);font-size:14.5px"><span style="display:flex">${glifo("user")}</span>Mi cuenta</button>` : "");
  const tabs = [["", "hoy", "Descubrir"], ["sistemas", "capas", "Sistemas"], ["categorias", "grid", "Categorías"], ["solicitudes", "send", "Solicitudes"], ["buscar", "search", "Buscar"]];
  $("#tabbar").innerHTML = `<a class="rail-brand${imgOk(c.logo) ? "" : " lg"}" href="#/" aria-label="Inicio · ${esc(c.nombre)}">${logoInner(c)}</a>`
    + tabs.map(([k, g, t]) => `<a href="#/${k}" ${act === k ? 'aria-current="page"' : ""}>${glifo(g)}<span>${t}</span></a>`).join("")
    + (S.user ? `<button class="rail-admin ${S.admin ? "on" : ""}" data-act="mi-cuenta" aria-label="Mi cuenta">${glifo("user")}<span>Cuenta</span></button>` : "");
  actualizarCampana();
  $("#foot").innerHTML = `<span>${esc(c.organizacion)}</span><span>Catálogo de sistemas digitales${c.telefono ? ` · ${esc(c.telefono)}` : ""}· <a href="#/contacto">Contacto y directorio</a></span>`;
}

/* ---------- Vistas públicas ---------- */
const etqCorta = (s) => tipoNom(s) + (s.estado && s.estado !== "Disponible" ? " · " + s.estado : "");
const etqDesc = (s) => (s.etiqueta && s.etiqueta.length > 24 ? s.etiqueta : s.subtitulo);
const etqChip = (s) => `${glifo(TIPO_ICO[tipoDe(s)])}${esc(etqCorta(s))}`;
function destCar(feats) {
  const n = feats.length, multi = n > 1;
  return `<section class="sec fc" aria-roledescription="carrusel" aria-label="Sistemas destacados">
    <div class="fc-head"><h2 class="fc-t">Sistemas destacados</h2></div>
    <div class="fc-wrap">${multi ? `<button type="button" class="fc-arrow fc-prev" data-act="fc-prev" aria-label="Sistema anterior" disabled>${glifo("back")}</button>` : ""}<div class="hscroll feat-row" tabindex="0" aria-label="Lista de sistemas destacados">${feats.map(feat).join("")}</div>${multi ? `<button type="button" class="fc-arrow fc-next" data-act="fc-next" aria-label="Sistema siguiente">${glifo("chev")}</button>` : ""}</div>
    ${multi ? `<div class="fc-dots" role="group" aria-label="Elegir sistema destacado">${feats.map((s, i) => `<button type="button" class="fc-dot" data-act="fc-go" data-i="${i}" aria-label="Ver ${esc(s.nombre)}"></button>`).join("")}</div>` : ""}
  </section>`;
}
const fcPaso = (r) => { const a = r.children[0], b = r.children[1]; return a && b ? b.offsetLeft - a.offsetLeft : r.clientWidth; };
function iniciarDestacados() {
  const w = $(".fc"); if (!w) return;
  const r = $(".feat-row", w), cnt = $(".fc-count", w), p = $(".fc-prev", w), n = $(".fc-next", w), dots = $$(".fc-dot", w), total = r.children.length;
  const act = () => {
    const max = r.scrollWidth - r.clientWidth, st = fcPaso(r) || 1;
    let i = Math.round(r.scrollLeft / st); if (r.scrollLeft >= max - 2) i = total - 1; i = Math.max(0, Math.min(total - 1, i));
    if (cnt) cnt.textContent = `${i + 1} / ${total}`;
    if (p) p.disabled = r.scrollLeft <= 2; if (n) n.disabled = r.scrollLeft >= max - 2;
    dots.forEach((d, k) => { if (k === i) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current"); });
  };
  r.addEventListener("scroll", act, { passive: true });
  if ("ResizeObserver" in window) new ResizeObserver(act).observe(r);
  act();
}
const galPaso = (g) => { const a = g.children[0], b = g.children[1]; return a && b ? b.offsetLeft - a.offsetLeft : g.clientWidth; };
function iniciarGaleria() {
  const w = $(".gal-wrap"); if (!w) return;
  const g = $(".gallery", w), p = $(".gal-prev", w), n = $(".gal-next", w);
  const act = () => {
    const max = g.scrollWidth - g.clientWidth, hay = max > 4;
    p.hidden = n.hidden = !hay;
    p.disabled = g.scrollLeft <= 2; n.disabled = g.scrollLeft >= max - 2;
  };
  g.addEventListener("scroll", act, { passive: true });
  if ("ResizeObserver" in window) new ResizeObserver(act).observe(g);
  g.querySelectorAll("img").forEach((im) => im.addEventListener("load", act, { once: true }));
  act();
}
function iniciarCarrusel() {
  iniciarDestacados();
  $$(".cv-wrap").forEach((w) => {
    const g = $(".cv-grid, .chips", w), p = $(".cv-prev", w), n = $(".cv-next", w);
    const act = () => { p.hidden = g.scrollLeft <= 2; n.hidden = g.scrollLeft >= g.scrollWidth - g.clientWidth - 2; };
    g.addEventListener("scroll", act, { passive: true });
    if ("ResizeObserver" in window) new ResizeObserver(act).observe(g);
    act();
  });
}
function cardVer(s) {
  const cap = s.capturas && s.capturas[0], k = catById(s.categorias[0]);
  const art = imgOk(s.portada)
    ? `<img class="cv-img" src="${esc(s.portada)}" alt="">`
    : `<span class="cv-glyph">${glifo(GLIFOS.includes(s.icono.glifo) ? s.icono.glifo : "app")}</span>${cap && imgOk(cap.src) ? `<span class="cv-shot"><img src="${esc(cap.src)}" alt=""></span>` : ""}`;
  return `<article class="cv"><span class="cv-eye t-${tipoDe(s)}">${etqChip(s)}</span><div class="cv-card"><a class="cv-art" href="#/sistema/${enc(s.id)}" aria-label="${esc(s.nombre)}">${art}<span class="cv-over">${k ? `<small>${esc(k.nombre)}</small>` : ""}<b>${esc(s.subtitulo || s.nombre)}</b></span></a><div class="cv-bar">${icono(s, "s48")}<span class="cv-t"><b>${esc(s.nombre)}</b><small>${esc(tipoNom(s))} · Versión ${esc(s.version)}${s.area ? " · " + esc(s.area) : ""}</small></span>${btnGet(s, "sm", true)}</div></div></article>`;
}
function vHome() {
  const lista = vis(), hoy = new Date();
  const cuando = `${DIAS[hoy.getDay()]} ${hoy.getDate()} de ${MESES[hoy.getMonth()]}`;
  if (!lista.length) {
    return cabecera("Descubrir", "", cuando) + vacio("Aún no hay sistemas publicados", S.admin ? "Agrega el primer sistema para que aparezca aquí." : "Vuelve pronto: estamos preparando el catálogo.", S.admin ? `<a class="btn" href="#/admin/editar/nuevo">${glifo("plus")}Agregar sistema</a>` : "");
  }
  const dest = lista.filter((s) => s.destacado), feats = (dest.length ? dest : lista).slice(0, 8);
  const enHero = new Set(feats.map((s) => s.id));
  const ver = lista.filter((s) => !enHero.has(s.id)).sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0)).slice(0, 8);
  const top = [...lista].sort((a, b) => b.dependencias.length - a.dependencias.length).slice(0, 6);
  const nuevos = [...lista].sort((a, b) => (b.actualizado || "").localeCompare(a.actualizado || "")).slice(0, 6);
  const cats = S.cat.categorias.slice();
  const usos = todosUsos().slice(0, 4);
  post = iniciarCarrusel;
  return `${cabecera("Descubrir", "", cuando)}
    ${bannerAviso()}
    ${cats.length ? `<div class="cv-wrap ch-wrap"><button type="button" class="cv-arrow cv-prev" data-act="cv-prev" aria-label="Anterior" hidden>${glifo("back")}</button><div class="chips bleed" role="list" aria-label="Categorías">${cats.map((k) => `<a role="listitem" class="chip" href="#/categoria/${enc(k.id)}" style="${colorVars(k.color)}"><span class="cdot${catCls(k)}">${catInner(k)}</span>${esc(k.nombre)}</a>`).join("")}</div><button type="button" class="cv-arrow cv-next" data-act="cv-next" aria-label="Siguiente" hidden>${glifo("chev")}</button></div>` : ""}
    ${destCar(feats)}
    ${ver.length ? `<section class="sec sec-ver"><h2 class="sec-h"><a href="#/sistemas">También te podría interesar ${glifo("chev")}</a></h2><div class="cv-wrap"><button type="button" class="cv-arrow cv-prev" data-act="cv-prev" aria-label="Anterior" hidden>${glifo("back")}</button><div class="cv-grid">${ver.map(cardVer).join("")}</div><button type="button" class="cv-arrow cv-next" data-act="cv-next" aria-label="Siguiente" hidden>${glifo("chev")}</button></div></section>` : ""}
    <div class="duo ${lista.length > 3 ? "" : "solo"}"><section class="sec"><h2 class="sec-h"><a href="#/sistemas">Los más utilizados ${glifo("chev")}</a></h2><div class="rows paged">${top.map((s) => fila(s)).join("")}</div></section>
    ${lista.length > 3 ? `<section class="sec"><h2 class="sec-h"><a href="#/sistemas">Nuevos y actualizados ${glifo("chev")}</a></h2><div class="rows paged">${nuevos.map((s) => fila(s, `Versión ${s.version} · ${hace(s.actualizado)}`)).join("")}</div></section>` : ""}</div>
    ${usos.length ? `<section class="sec"><h2 class="sec-h">Para cada necesidad</h2><div class="colls">${usos.map(([u, n]) => {
      const ss = vis().filter((s) => s.usos.includes(u));
      return `<a class="coll" href="#/uso/${enc(u)}" style="${colorVars(ss[0].icono.color)}"><div><span class="eyebrow">Ideal para</span><strong>${esc(u)}</strong><small>${n} ${plural(n, "sistema", "sistemas")}</small></div><div class="stack">${ss.slice(0, 4).map((s) => icono(s, "s40")).join("")}</div></a>`;
    }).join("")}</div></section>` : ""}
    <section class="sec"><h2 class="sec-h">Cómo solicitar un sistema</h2>
      <ol class="how">
        <li><span class="n">1</span><b>Elige un sistema</b><p>Revisa su descripción, capturas, requisitos y cuáles dependencias ya lo usan.</p></li>
        <li><span class="n">2</span><b>Llena la solicitud</b><p>Cuéntanos quién eres y para qué lo necesitas. Solo toma unos minutos.</p></li>
        <li><span class="n">3</span><b>Te contactamos</b><p>Revisamos tu solicitud y coordinamos una reunión con tu dependencia.</p></li>
      </ol></section>`;
}

function vSistemas() {
  let l = vis();
  const nSis = l.filter((s) => tipoDe(s) === "sistema").length, nWeb = l.length - nSis;
  if (F2.tipo !== "todos") l = l.filter((s) => tipoDe(s) === F2.tipo);
  if (F2.cat !== "todas") l = l.filter((s) => s.categorias.includes(F2.cat));
  if (F2.orden === "nombre") l = [...l].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  if (F2.orden === "recientes") l = [...l].sort((a, b) => (b.actualizado || "").localeCompare(a.actualizado || ""));
  if (F2.orden === "usados") l = [...l].sort((a, b) => b.dependencias.length - a.dependencias.length);
  const cats = S.cat.categorias.slice();
  post = iniciarCarrusel;
  return `${cabecera("Sistemas", "Sistemas (aplicaciones institucionales) y portales / sitios web (páginas en internet). Cada uno indica claramente de qué tipo es.")}
    <div class="chips tipos" role="group" aria-label="Filtrar por tipo"><button class="chip txt" data-act="filtro-tipo" data-id="todos" aria-pressed="${F2.tipo === "todos"}">Todos (${nSis + nWeb})</button><button class="chip txt" data-act="filtro-tipo" data-id="sistema" aria-pressed="${F2.tipo === "sistema"}">Sistemas (${nSis})</button><button class="chip txt" data-act="filtro-tipo" data-id="web" aria-pressed="${F2.tipo === "web"}">Portales / Sitios web (${nWeb})</button></div>
    <div class="cv-wrap ch-wrap"><button type="button" class="cv-arrow cv-prev" data-act="cv-prev" aria-label="Anterior" hidden>${glifo("back")}</button><div class="chips bleed" role="group" aria-label="Filtrar por categoría"><button class="chip txt" data-act="filtro-cat" data-id="todas" aria-pressed="${F2.cat === "todas"}">Todos</button>${cats.map((k) => `<button class="chip txt" data-act="filtro-cat" data-id="${esc(k.id)}" aria-pressed="${F2.cat === k.id}">${esc(k.nombre)}</button>`).join("")}</div><button type="button" class="cv-arrow cv-next" data-act="cv-next" aria-label="Siguiente" hidden>${glifo("chev")}</button></div>
    <div class="toolbar"><span class="muted">${l.length} ${plural(l.length, "resultado", "resultados")}</span>
      <label class="sr" for="orden">Ordenar</label><select class="select" id="orden" data-sel="orden"><option value="catalogo" ${F2.orden === "catalogo" ? "selected" : ""}>Orden del catálogo</option><option value="nombre" ${F2.orden === "nombre" ? "selected" : ""}>Nombre (A–Z)</option><option value="recientes" ${F2.orden === "recientes" ? "selected" : ""}>Más recientes</option><option value="usados" ${F2.orden === "usados" ? "selected" : ""}>Más usados</option></select></div>
    <div class="sp"></div>
    ${l.length ? `<div class="rows">${l.map((s) => fila(s)).join("")}</div>` : vacio("Sin resultados con este filtro", "Prueba con otro tipo o categoría.")}`;
}

function vCategorias() {
  const cats = S.cat.categorias.slice();
  const tools = (k) => S.admin ? `<div class="cat-tools"><button class="btn sm sec" data-act="edit-cat" data-id="${esc(k.id)}">${glifo("edit")}Renombrar / editar</button><button class="btn sm danger" data-act="del-cat" data-id="${esc(k.id)}">${glifo("trash")}Eliminar</button></div>` : "";
  return `${cabecera("Categorías", "Explora los sistemas según lo que necesitas hacer.")}
    ${S.admin ? `<div class="admbar" style="margin-top:12px"><span class="muted">Puedes renombrar, editar o eliminar categorías.</span><button class="btn" data-act="add-cat">${glifo("plus")}Agregar categoría</button></div>` : ""}
    <div class="colls" style="margin-top:22px">${cats.map((k) => { const ss = vis().filter((s) => s.categorias.includes(k.id)); return `<div class="cwrap"><a class="coll" href="#/categoria/${enc(k.id)}" style="${colorVars(k.color)}"><div><span class="eyebrow">${ss.length} ${plural(ss.length, "sistema", "sistemas")}</span><strong>${esc(k.nombre)}</strong></div><div class="stack">${ss.slice(0, 4).map((s) => icono(s, "s40")).join("")}</div></a>${tools(k)}</div>`; }).join("")}</div>
    ${cats.length ? "" : vacio("Aún no hay categorías", "Cuando se publiquen sistemas aparecerán aquí.")}`;
}

function vLista(tipo, id) {
  let titulo, l, eyebrow;
  if (tipo === "categoria") { const k = catById(id); if (!k) return vNoEncontrado(); titulo = k.nombre; l = vis().filter((s) => s.categorias.includes(id)); eyebrow = "Categoría"; }
  else { titulo = id; l = vis().filter((s) => s.usos.includes(id)); eyebrow = "Ideal para"; if (!l.length) return vNoEncontrado(); }
  return `${navbar()}<header class="pagehead" style="padding-top:8px"><div><div class="when">${eyebrow}</div><h1 class="large-title">${esc(titulo)}</h1><p class="lede">${l.length} ${plural(l.length, "sistema disponible", "sistemas disponibles")}</p></div></header>
    ${tipo === "categoria" && S.admin ? `<div class="cat-tools" style="margin-top:12px"><button class="btn sm sec" data-act="edit-cat" data-id="${esc(id)}">${glifo("edit")}Renombrar / editar categoría</button><button class="btn sm danger" data-act="del-cat" data-id="${esc(id)}">${glifo("trash")}Eliminar categoría</button></div>` : ""}<div class="sp"></div>${l.length ? `<div class="rows">${l.map((s) => fila(s)).join("")}</div>` : vacio("Sin sistemas todavía", "Aún no hay sistemas en esta categoría.")}`;
}

const SINONIMOS = [
  ["votacion", "voto", "votar", "elecciones", "eleccion", "sufragio", "consulta"],
  ["documento", "archivo", "oficio", "expediente", "papel"],
  ["encuesta", "formulario", "cuestionario", "sondeo"],
  ["gafete", "credencial", "identificacion", "tarjeta"],
  ["curso", "capacitacion", "taller", "academia", "academy", "aprendizaje", "formacion"],
  ["correo", "email", "mail", "mensajeria"],
  ["reporte", "informe", "estadistica", "indicador", "tablero", "dashboard"],
  ["evento", "registro", "asistencia", "acreditacion"],
  ["gestion", "administracion", "administrativo", "control"],
  ["firma", "firmar", "firmado"],
  ["usuario", "cuenta", "acceso", "permiso"],
  ["mapa", "ubicacion", "geografico", "georreferencia"],
  ["pago", "factura", "finanza", "presupuesto"],
  ["soporte", "ayuda", "incidencia", "asistencia"],
  ["sistema", "plataforma", "aplicacion", "app", "herramienta"]
];
const rBusq = (t) => String(t || "").replace(/\*\*|\[\/?(?:tam|color)[^\]]*\]/g, " ");
const txtDe = (x) => typeof x === "string" ? x : x && typeof x === "object" ? Object.values(x).filter((v) => typeof v === "string" && v.length < 600 && !/^data:/.test(v)).join(" ") : "";
const raiz = (w) => (w.length > 4 ? w.replace(/(?:es|s)$/, "") : w.replace(/s$/, ""));
const palabrasDe = (t) => norm(rBusq(t)).replace(/[^a-z0-9]+/g, " ").split(" ").filter(Boolean).map(raiz);
function distMax(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]; let mn = i;
    for (let j = 1; j <= b.length; j++) { const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); cur.push(v); if (v < mn) mn = v; }
    if (mn > max) return max + 1; prev = cur;
  }
  return prev[b.length];
}
function indiceBusqueda(s) {
  const cats = s.categorias.map((c) => (catById(c) || {}).nombre || "");
  const campos = [
    [10, [s.nombre, ...(s.alias || [])]],
    [5, [s.subtitulo, s.etiqueta]],
    [4, [...cats, ...s.usos]],
    [3, [s.area, s.plataforma, s.estado, ...s.dependencias.map((d) => d.nombre), ...s.tecnica.map(txtDe)]],
    [2, [s.descripcion]],
    [1, [...s.requisitos.map(txtDe), ...s.pasos.map(txtDe), ...s.novedades.map(txtDe), s.contacto && s.contacto.correo]]
  ];
  return campos.map(([peso, ts]) => { const txt = norm(rBusq(ts.filter(Boolean).join(" "))).replace(/[^a-z0-9]+/g, " "); return { peso, txt, pal: palabrasDe(ts.filter(Boolean).join(" ")) }; });
}
function puntajeToken(t, idx) {
  const rt = raiz(t), sin = SINONIMOS.find((g) => g.some((w) => w === t || raiz(w) === rt));
  let mejor = 0;
  for (const f of idx) {
    let v = 0;
    if (f.pal.includes(rt)) v = 1;
    else if (rt.length >= 2 && (f.pal.some((w) => w.startsWith(rt)) || (rt.length >= 3 && f.txt.includes(t)))) v = 0.75;
    else if (sin && sin.some((w) => f.pal.includes(raiz(w)) || f.pal.some((x) => x.startsWith(raiz(w))))) v = 0.55;
    else if (rt.length >= 4) { const m = rt.length >= 8 ? 2 : 1; if (f.pal.some((w) => w.length >= 3 && distMax(rt, w, m) <= m)) v = 0.45; }
    mejor = Math.max(mejor, v * f.peso);
  }
  return mejor;
}
function buscar(q) {
  const tk = norm(q).replace(/[^a-z0-9]+/g, " ").split(" ").filter(Boolean);
  if (!tk.length) return [];
  const frase = tk.join(" ");
  const filas = vis().map((s) => {
    const idx = indiceBusqueda(s), pts = tk.map((t) => puntajeToken(t, idx));
    const n = pts.filter((x) => x > 0).length; let p = pts.reduce((a, b) => a + b, 0);
    if (tk.length > 1 && idx[0].txt.includes(frase)) p += 8;
    return { s, n, p };
  }).filter((o) => o.n > 0);
  const completos = filas.filter((o) => o.n === tk.length).sort((a, b) => b.p - a.p);
  const parciales = tk.length > 1 ? filas.filter((o) => o.n < tk.length).sort((a, b) => b.n - a.n || b.p - a.p) : [];
  return [...completos, ...parciales].map((o) => o.s);
}
function htmlBusqueda() {
  const q = S.q.trim();
  if (!q) {
    const usos = todosUsos();
    return `<section class="sec" style="margin-top:26px"><h2 class="sec-h">Sugerencias</h2><div class="tagcards">${usos.slice(0, 8).map(([u]) => `<a class="tagcard" href="#/uso/${enc(u)}"><span class="cdot" style="${colorVars("azul")}">${glifo("tag")}</span>${esc(u)}</a>`).join("")}${S.cat.categorias.slice(0, 8).filter((k) => vis().some((s) => s.categorias.includes(k.id))).map((k) => `<a class="tagcard" href="#/categoria/${enc(k.id)}"><span class="cdot${catCls(k)}" style="${colorVars(k.color)}">${catInner(k)}</span>${esc(k.nombre)}</a>`).join("")}</div></section>
      <section class="sec"><h2 class="sec-h">Todos los sistemas</h2><div class="rows">${vis().map((s) => fila(s)).join("")}</div></section>`;
  }
  const r = buscar(q);
  return r.length ? `<div class="sp"></div><div class="rows" style="margin-top:12px">${r.map((s) => fila(s)).join("")}</div>`
    : vacio(`Sin resultados para «${q}»`, "Prueba con otra palabra o con menos palabras, por ejemplo: eventos, votación o documentos.");
}
function vBuscar() {
  post = () => { const i = $("#qv"); if (i && window.matchMedia("(max-width:900px)").matches) i.focus({ preventScroll: true }); };
  return `${cabecera("Buscar")}
    <label class="bigsearch">${glifo("search")}<span class="sr">Buscar sistemas</span><input id="qv" type="search" placeholder="Sistemas, eventos, dependencias…" value="${esc(S.q)}" autocomplete="off"></label>
    <div id="res">${htmlBusqueda()}</div>`;
}
function pintarBusqueda() { const r = $("#res"); if (r) r.innerHTML = htmlBusqueda(); }

function vNoEncontrado() {
  return `${navbar()}${vacio("No encontramos esta página", "Es posible que el sistema ya no esté publicado o que el enlace sea incorrecto.", `<a class="btn" href="#/sistemas">Ver todos los sistemas</a>`)}`;
}

/* ---------- Ficha del sistema ---------- */
function tipoArchivo(a) {
  const n = norm(a.nombre || ""), t = (a.tipo || "").toLowerCase(), x = n + " " + t;
  if (/pdf/.test(x)) return ["pdf", "PDF"];
  if (/^image\//.test(t)) return ["img", ""];
  if (/\.(docx?|odt)\b|word/.test(x)) return ["doc", "DOC"];
  if (/\.(xlsx?|csv|ods)\b|sheet|excel/.test(x)) return ["xls", "XLS"];
  if (/\.(pptx?)\b|presentation|powerpoint/.test(x)) return ["doc", "PPT"];
  if (/\.zip\b|zip|compressed/.test(x)) return ["zip", "ZIP"];
  return ["", (n.split(".").pop() || "ARCH").toUpperCase().slice(0, 4)];
}
function dataToBlob(d) {
  const m = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(d || ""); if (!m) return null;
  const bin = m[2] ? atob(m[3]) : decodeURIComponent(m[3]);
  const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return new Blob([u], { type: m[1] || "application/octet-stream" });
}
const hostDe = (u) => { try { return new URL(u).host.replace(/^www\./, ""); } catch (e) { return u; } };

function vFicha(id) {
  const s = byId(id);
  if (!s || (!s.publicado && !S.admin)) return vNoEncontrado();
  const cats = s.categorias.map(catById).filter(Boolean);
  const n = s.dependencias.length;
  const prim = s.enlaces.find((l) => l.tipo === "sistema" && urlOk(l.url));
  const otros = s.enlaces.filter((l) => l !== prim && urlOk(l.url));
  const nov = s.novedades[0];
  const manualArch = s.archivos.find((a) => a.categoria === "Manual");
  const manualLink = s.enlaces.find((l) => l.tipo === "manual" && urlOk(l.url));
  const rel = relacionados(s, 6), lig = ligadosDe(s);
  const c0 = cats[0];
  const correo = s.contacto.correo;

  post = () => {
    const nb = $("#nb"), obj = $("#mainget");
    if (nb && obj && "IntersectionObserver" in window) {
      io = new IntersectionObserver(([e]) => nb.classList.toggle("show", !e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
      io.observe(obj);
    }
    const d = $("#desc"), mb = $("#mas");
    if (d && mb && d.scrollHeight <= d.clientHeight + 2) mb.hidden = true;
    iniciarGaleria();
  };
  const right = (S.admin ? `<a class="btn sm sec" href="#/admin/editar/${enc(s.id)}">${glifo("edit")}Editar</a>` : "") + `<button class="circ" data-act="compartir" data-id="${esc(s.id)}" aria-label="Copiar enlace del sistema">${glifo("share")}</button>` + btnGet(s, "sm", true);

  const tipoHtml = `<span class="tipo-tag t-${tipoDe(s)} big">${glifo(TIPO_ICO[tipoDe(s)])}${esc(tipoNom(s))}</span><small class="vsub">${esc(TIPOS_DESC[tipoDe(s)])}</small>`;
  const filasTec = [["Tipo", tipoNom(s), tipoHtml], ["Categoría", cats.map((c) => c.nombre).join(", ")], ["Plataforma", s.plataforma, s.plataforma ? `<span class="vplat">${esc(s.plataforma)}<span class="vsep">·</span>${tipoTag(s)}</span>` : ""], ["Disponibilidad", s.estado]]
    .concat(s.tecnica.map((t) => [t.k, t.v])).filter(([, v]) => v);
  const adj = s.archivos.map((a) => {
    const [cl, et] = tipoArchivo(a);
    const esImg = /^image\//.test(a.tipo || "");
    return `<li><span class="dtype ${cl}">${esImg ? glifo("img") : esc(et)}</span><div class="dt"><b>${esc(a.nombre)}</b><small>${esc([a.categoria, bytes(a.tamano || 0)].filter(Boolean).join(" · "))}${a.descripcion ? `<br>${esc(a.descripcion)}` : ""}</small></div><div class="acts"><button class="get sm" data-act="ver-archivo" data-id="${esc(s.id)}" data-fid="${esc(a.id)}">Ver</button><button class="iconbtn" data-act="bajar-archivo" data-id="${esc(s.id)}" data-fid="${esc(a.id)}" aria-label="Descargar ${esc(a.nombre)}">${glifo("download")}</button></div></li>`;
  }).join("");
  const encl = otros.map((l) => `<li><span class="dtype link">${glifo("link")}</span><div class="dt"><b>${esc(l.etiqueta || hostDe(l.url))}</b><small>${esc(hostDe(l.url))}</small></div><div class="acts"><a class="get sm" href="${esc(urlOk(l.url))}" target="_blank" rel="noopener noreferrer">Abrir</a></div></li>`).join("");

  return `${navbar({ mid: icono(s, "s34"), right })}
  <section class="fhead">${icono(s, "s128")}
    <div class="fhead-t">
      <h1>${esc(s.nombre)}</h1>
      <p class="sub">${esc(s.subtitulo)}</p>
      <div class="cats">${tipoTag(s)}${cats.map((c) => `<a href="#/categoria/${enc(c.id)}">${esc(c.nombre)}</a>`).join("")}</div>
      ${!s.publicado ? `<div><span class="badge warn">No publicado · solo lo ves tú</span></div>` : ""}
      <div class="fhead-actions" id="mainget">${btnGet(s, "big")}${prim ? `<a class="btn2" href="${esc(urlOk(prim.url))}" target="_blank" rel="noopener noreferrer">Abrir ${tipoDe(s) === "web" ? "sitio web" : "sistema"} ${glifo("out")}</a>` : ""}<button class="circ" data-act="compartir" data-id="${esc(s.id)}" aria-label="Copiar enlace del sistema" style="color:var(--accent)">${glifo("share")}</button></div>
      ${S.admin ? `<div class="manage" role="group" aria-label="Gestionar este sistema"><button type="button" class="mbtn" data-act="gestionar" data-modo="info" data-id="${esc(s.id)}">${glifo("edit")}Editar información</button><button type="button" class="mbtn" data-act="gestionar" data-modo="imagen" data-id="${esc(s.id)}">${glifo("img")}Cambiar imagen</button><button type="button" class="mbtn" data-act="ren-sis" data-id="${esc(s.id)}">${glifo("edit")}Cambiar nombre</button><button type="button" class="mbtn" data-act="del-sistema" data-id="${esc(s.id)}">${glifo("trash")}Eliminar</button></div>${prim ? "" : `<div class="note warn" style="margin-top:12px">${glifo("warn")}<div>Este sistema aún no tiene enlace para «Abrir sistema». <a href="#/admin/editar/${enc(s.id)}">Agregar el enlace</a></div></div>`}` : ""}
    </div></section>
  <section class="stats" aria-label="Datos del sistema">
    <div class="stat"><span class="l">${plural(n, "Dependencia", "Dependencias")}</span><b>${n}</b><span class="s">${n ? plural(n, "lo utiliza", "lo utilizan") : "aún sin registro"}</span></div>
    <div class="stat"><span class="l">Ideal para</span><b>${esc(s.usos[0] || "General")}</b><span class="s">${s.usos.length > 1 ? "y " + (s.usos.length - 1) + " más" : "uso principal"}</span></div>
    <div class="stat"><span class="l">Categoría</span><b>${c0 ? glifo(c0.glifo) : glifo("capas")}</b><span class="s">${esc(c0 ? c0.nombre : "Sistema")}</span></div>
  </section>
  ${nov ? `<section class="sec"><h2 class="sec-h"><button data-act="historial" data-id="${esc(s.id)}">Novedades ${glifo("chev")}</button></h2><div class="nov"><span>Versión ${esc(nov.version)}</span><span>${esc(hace(nov.fecha))}</span></div><div class="prose">${rich(nov.notas)}</div></section>` : ""}
  ${videoInfo(s.videoDestacado) ? `<section class="sec vsec"><h2 class="sec-h">Video de muestra</h2><div class="vplayer">${videoHtml(videoInfo(s.videoDestacado), s.nombre)}</div></section>` : ""}
  ${s.capturas.length || (s.videos || []).some((v) => videoInfo(v)) ? `<section class="sec"><h2 class="sec-h">Vista previa</h2><div class="gal-wrap"><button type="button" class="gal-arrow gal-prev" data-act="gal-prev" aria-label="Captura anterior" hidden>${glifo("back")}</button><div class="gallery bleed" tabindex="0" aria-label="Capturas y videos del sistema">${s.capturas.filter((c) => imgOk(c.src)).map((c, i) => `<button class="shot" data-act="lightbox" data-id="${esc(s.id)}" data-i="${i}" aria-label="Ampliar captura ${i + 1}${c.pie ? ": " + esc(c.pie) : ""}"><img src="${esc(c.src)}" alt="${esc(c.pie || "Captura de " + s.nombre)}" loading="lazy"></button>`).join("")}${(s.videos || []).map((v, i) => videoInfo(v) ? `<button class="shot vshot" data-act="ver-video" data-id="${esc(s.id)}" data-i="${i}" aria-label="Ver video${v.pie ? ": " + esc(v.pie) : ""}">${glifo("play")}<small>${esc(v.pie || "Video de muestra")}</small></button>` : "").join("")}</div><button type="button" class="gal-arrow gal-next" data-act="gal-next" aria-label="Captura siguiente" hidden>${glifo("chev")}</button></div></section>` : ""}
  ${s.plataforma ? `<div class="platrow">${glifo("tablet")}<span>${esc(s.plataforma)}</span>${tipoTag(s)}</div>` : ""}
  ${s.descripcion ? `<section style="padding-top:18px"><div class="prose clamp" id="desc" style="${descEstilo(s)}">${rich(s.descripcion)}</div><button class="more" id="mas" data-act="toggle-desc">más</button><div style="clear:both"></div></section>` : ""}
  ${s.pasos.length || manualArch || manualLink ? `<section class="sec"><h2 class="sec-h">Manual de uso</h2>${s.pasos.length ? `<ol class="steps">${s.pasos.map((p) => `<li><span>${esc(p)}</span></li>`).join("")}</ol>` : ""}${manualArch ? `<div style="margin-top:14px"><button class="btn sec" data-act="ver-archivo" data-id="${esc(s.id)}" data-fid="${esc(manualArch.id)}">${glifo("libro")}Abrir manual completo</button></div>` : manualLink ? `<div style="margin-top:14px"><a class="btn sec" href="${esc(urlOk(manualLink.url))}" target="_blank" rel="noopener noreferrer">${glifo("libro")}Abrir manual completo</a></div>` : ""}</section>` : ""}
  <section class="sec"><h2 class="sec-h">Dependencias que lo usan</h2>
    ${n ? `<div class="usedby"><div class="big"><b>${n}</b><span>${plural(n, "dependencia", "dependencias")}</span></div><div class="revs">${s.dependencias.map((d) => `<article class="rev"><h3>${esc(d.nombre)}</h3><div class="meta">${d.desde ? "Desde " + esc(d.desde) : "Usuaria del sistema"}</div>${d.nota ? `<p>${esc(d.nota)}</p>` : ""}</article>`).join("")}</div></div>`
      : `<div class="empty-card"><p>Todavía ninguna dependencia lo tiene registrado. Puedes ser de las primeras en usarlo.</p>${btnGet(s, "big", true)}</div>`}
  </section>
  ${adj || encl ? `<section class="sec"><h2 class="sec-h">Documentos y enlaces</h2><ul class="docs">${adj}${encl}</ul></section>` : ""}
  ${s.requisitos.length ? `<section class="sec"><h2 class="sec-h">Requisitos</h2><ul class="checks">${s.requisitos.map((r) => `<li>${glifo("ok")}<span>${esc(r)}</span></li>`).join("")}</ul></section>` : ""}
  <section class="sec"><h2 class="sec-h">Ficha técnica</h2>
    <div class="kv">${filasTec.map(([k, v, h]) => `<div><span class="k">${esc(k)}</span><span class="v">${h || esc(v)}</span></div>`).join("")}
      ${prim ? `<div><a class="lr" href="${esc(urlOk(prim.url))}" target="_blank" rel="noopener noreferrer">${tipoDe(s) === "web" ? "Ir al sitio web" : "Ir al sistema"} ${glifo("out")}</a></div>` : ""}
      <div><button class="lr" data-act="contacto" data-id="${esc(s.id)}">Contactar al área responsable ${glifo("correo")}</button></div>
      <div><button class="lr" data-act="contacto" data-id="${esc(s.id)}" data-problema="1">Reportar un problema ${glifo("warn")}</button></div>
    </div></section>
  ${s.usos.length ? `<section class="sec"><h2 class="sec-h">Parte de</h2><div class="tagcards">${s.usos.map((u) => `<a class="tagcard" href="#/uso/${enc(u)}"><span class="cdot" style="${colorVars(s.icono.color)}">${glifo("tag")}</span>${esc(u)}</a>`).join("")}</div></section>` : ""}
  ${lig.length ? `<section class="sec"><h2 class="sec-h">Ligado con</h2><p class="muted" style="margin:-4px 0 10px">Sistemas y páginas que forman parte de este mismo conjunto o se conectan con él.</p><div class="rows">${lig.map((x) => fila(x)).join("")}</div></section>` : ""}
  ${rel.length ? `<section class="sec"><h2 class="sec-h"><a href="#/sistemas">También te podría interesar ${glifo("chev")}</a></h2><div class="rows">${rel.map((x) => fila(x, motivo(s, x))).join("")}</div></section>` : ""}
  <div class="cta-end"><div><b>¿Te sirve ${esc(s.nombre)}?</b><p>Envía tu solicitud y nos pondremos en contacto con tu dependencia para coordinar una reunión.${correo ? "" : ""}</p></div>${btnGet(s, "big", true)}</div>`;
}

function vContacto() {
  const c = cfg(), dir = Array.isArray(c.directorio) ? c.directorio : [];
  const tel = (t) => String(t || "").replace(/[^\d+]/g, "");
  const med = [
    c.telefono && `<a class="ctc" href="tel:${esc(tel(c.telefono))}">${glifo("mensaje")}<span><b>Teléfono</b>${esc(c.telefono)}</span></a>`,
    c.horario && `<div class="ctc">${glifo("reloj")}<span><b>Horario</b>${esc(c.horario)}</span></div>`
  ].filter(Boolean).join("");
  const pers = dir.map((p) => `<li class="dir-p"><span class="dir-av" aria-hidden="true">${esc((p.nombre || "?")[0].toUpperCase())}</span><div><b>${esc(p.nombre)}</b>${p.cargo ? `<small>${esc(p.cargo)}</small>` : ""}${p.correo ? `<a href="mailto:${esc(p.correo)}">${esc(p.correo)}</a>` : ""}${p.telefono ? `<a href="tel:${esc(tel(p.telefono))}">${esc(p.telefono)}</a>` : ""}</div></li>`).join("");
  const ed = S.admin ? `<details class="dir-ed"><summary>Editar directorio</summary><p>Una persona por línea: Nombre | Cargo | Correo | Teléfono</p><textarea id="dir-txt" rows="6" aria-label="Directorio">${esc(dir.map((p) => [p.nombre, p.cargo, p.correo, p.telefono].map((x) => x || "").join(" | ")).join("\n"))}</textarea><button class="btn" data-act="guardar-directorio">Guardar directorio</button></details>` : "";
  return `${cabecera("Contacto", "Escríbenos o llámanos; respondemos en " + (c.tiempoRespuesta || "unos días") + ".")}
    <div class="ctcs">${med || vacio("Aún no hay datos de contacto", S.admin ? "Agrégalos en Administración → Configuración." : "Vuelve pronto.")}</div>
    <h2 class="dir-h">Directorio</h2>${pers ? `<ul class="dir">${pers}</ul>` : vacio("El directorio está vacío", S.admin ? "Agrega a las personas responsables abajo." : "Pronto publicaremos a las personas responsables.")}${ed}`;
}
function vAyuda() {
  const c = cfg();
  const faq = [
    ["¿Qué pasa después de enviar mi solicitud?", "Se genera tu folio. Con él elaboras un oficio de solicitud y lo envías al correo que aparece en la pantalla de tu folio."],
    ["¿Qué debe llevar mi oficio?", "Cita tu folio, el sistema que solicitas y los datos de tu dependencia. Envíalo al correo que se indica al obtener tu folio."],
    ["¿Puedo pedir más de un sistema a la vez?", "Sí. En el formulario puedes agregar todos los sistemas que te interesen y quedarán en una sola solicitud, con un solo folio."],
    ["¿Qué significa «Requiere validación»?", "Algunos sistemas necesitan una revisión previa de requisitos antes de implementarse. Lo indicamos en la ficha de cada sistema."],
    ["¿Cómo sé en qué estado va mi solicitud?", "En «Mis solicitudes» ves tu folio y el historial de lo que solicitaste desde este dispositivo. El seguimiento se hace con tu oficio, citando el folio."],
    ["¿Qué hago si el sistema que necesito no aparece?", "Escríbenos desde el formulario eligiendo «Otro» en el tipo de uso y describe lo que necesitas."]
  ];
  return `${cabecera("Cómo solicitar", "Del catálogo a tu dependencia en tres pasos.")}
    <ol class="how" style="margin-top:24px">
      <li><span class="n">1</span><b>Explora el catálogo</b><p>Cada sistema tiene su descripción, manual de uso, requisitos y las dependencias que ya lo usan.</p></li>
      <li><span class="n">2</span><b>Solicita y obtén tu folio</b><p>Llena el formulario con los datos de tu dependencia y el uso que le darás. Al terminar se genera tu folio.</p></li>
      <li><span class="n">3</span><b>Elabora tu oficio</b><p>Redacta un oficio de solicitud citando tu folio y envíalo al correo que se te indica al terminar.</p></li>
    </ol>
    <section class="sec"><h2 class="sec-h">Preguntas frecuentes</h2>${faq.map(([q, a]) => `<details class="faq" style="border-bottom:1px solid var(--sep);padding:14px 0"><summary style="cursor:pointer;font-weight:600;font-size:17px;list-style:none;display:flex;justify-content:space-between;gap:12px">${esc(q)}<span style="color:var(--label-3)">${glifo("down")}</span></summary><p class="muted" style="margin-top:8px;max-width:70ch">${esc(a)}</p></details>`).join("")}</section>
    <div class="cta-end"><div><b>¿Listo para empezar?</b><p>Elige un sistema, llena tu solicitud y obtén tu folio.</p></div><a class="btn" href="#/sistemas">Ver sistemas</a></div>`;
}

/* ---------- Solicitud de sistema ---------- */
const F = { ini: null, sel: [], vals: { contactoPref: "Correo electrónico", acepto: false }, errs: {}, enviando: false };

function vSolicitar(id) {
  if (F.ini !== (id || "")) {
    F.ini = id || "";
    const s0 = id && byId(id);
    F.sel = s0 && (s0.publicado || S.admin) ? [id] : [];
    F.errs = {};
    const u = S.user;
    if (u) { const v0 = F.vals; if (!v0.nombre) v0.nombre = u.nombre || ""; if (!v0.correo) v0.correo = u.correo || ""; if (!v0.dependencia) v0.dependencia = u.dependencia || ""; if (!v0.cargo) v0.cargo = u.cargo || ""; if (!v0.telefono) v0.telefono = u.telefono || ""; }
  }
  F.sel = F.sel.filter((x) => byId(x));
  const sel = F.sel.map(byId), v = F.vals, e = F.errs;
  const disp = vis().filter((x) => !F.sel.includes(x.id) && x.estado !== "En mantenimiento");
  let sug = [];
  if (sel.length) { const seen = new Set(); sel.forEach((s) => relacionados(s, 6).forEach((x) => { if (!F.sel.includes(x.id) && x.estado !== "En mantenimiento" && !seen.has(x.id)) { seen.add(x.id); sug.push({ x, s }); } })); }
  sug = sug.slice(0, 4);
  const campo = (k, label, o = {}) => `<div class="field ${o.full ? "full" : ""} ${e[k] ? "bad" : ""}"><label for="f-${k}">${label}${o.req ? ' <span class="req" aria-hidden="true">*</span>' : ""}</label><input id="f-${k}" type="${o.tipo || "text"}" data-form="${k}" value="${esc(v[k] || "")}" placeholder="${esc(o.ph || "")}" ${o.req ? 'aria-required="true"' : ""} ${o.extra || ""} autocomplete="${o.ac || "off"}">${e[k] ? `<span class="err" role="alert">${esc(e[k])}</span>` : ""}</div>`;
  const uniq = (a) => [...new Set(a.filter(Boolean))];
  const depsUsadas = uniqNombres(depsNombres().concat(misSols().map((x) => x.datos && x.datos.dependencia)));
  const usosUsados = uniq(misSols().map((x) => { const m = /^Otro: (.+)/.exec((x.datos && x.datos.tipoUso) || ""); return m && m[1]; }));
  F.nuevo = F.nuevo || {};
  const combo = (k, label, lista, o) => {
    if (!lista.length) return campo(k, label, o);
    const cur = v[k] || "", texto = F.nuevo[k] || (cur && !lista.includes(cur));
    return `<div class="field ${o.full ? "full" : ""} ${e[k] && !texto ? "bad" : ""}"><label for="f-${k}Sel">${label} <span class="req" aria-hidden="true">*</span></label><select class="in select" id="f-${k}Sel" data-form="${k}Sel" style="width:100%"><option value="">Selecciona…</option>${lista.map((x) => `<option ${!texto && x === cur ? "selected" : ""}>${esc(x)}</option>`).join("")}<option value="__nuevo" ${texto ? "selected" : ""}>${o.nuevo}</option></select>${e[k] && !texto ? `<span class="err" role="alert">${esc(e[k])}</span>` : ""}</div>${texto ? campo(k, o.nuevoLabel, o) : ""}`;
  };
  const opts = (arr, cur) => arr.map((o) => `<option ${o === cur ? "selected" : ""}>${esc(o)}</option>`).join("");
  const ocon = opcionesContacto(); if (!ocon.includes(v.contactoPref)) v.contactoPref = ocon[0];
  return `${navbar()}
  <header class="pagehead" style="padding-top:8px"><div><div class="when">Solicitud</div><h1 class="large-title">Solicitar sistema</h1><p class="lede">Cuéntanos quién eres y qué necesitas. Al enviar recibirás tu folio para elaborar tu oficio.</p></div></header>
  <form id="form-sol" novalidate class="formgrid">
    <div>
      <p class="hint" style="margin:0 0 6px">Los campos marcados con <span class="req" style="color:var(--bad)">*</span> son obligatorios.</p>
      <section class="grp" id="selblock"><h2>Sistemas <span class="req" aria-hidden="true" style="${e.sel ? "color:#d92a2a" : "color:var(--label-3)"}">*</span></h2><p class="hint">Puedes pedir más de uno en la misma solicitud.</p>
        <div class="selchips">${sel.map((s) => `<div class="selchip">${icono(s, "s34")}<b>${esc(s.nombre)}</b><button type="button" class="iconbtn" data-act="quitar-sel" data-id="${esc(s.id)}" aria-label="Quitar ${esc(s.nombre)}">${glifo("x")}</button></div>`).join("")}</div>
        ${e.sel ? `<span class="err" role="alert" id="err-sel">${esc(e.sel)}</span>` : ""}
        ${disp.length ? `<div style="margin-top:${sel.length ? 12 : 0}px"><label class="sr" for="addsel">Agregar sistema</label><select class="select" id="addsel" data-sel="addsis"><option value="">${sel.length ? "Agregar otro sistema…" : "Elige un sistema…"}</option>${disp.map((x) => `<option value="${esc(x.id)}">${esc(x.nombre)}</option>`).join("")}</select></div>` : ""}
      </section>
      <section class="grp"><h2>Tus datos</h2><p class="hint">Los usaremos para contactarte.</p>
        <div class="fields">
          ${combo("dependencia", "Dependencia u organización", depsUsadas, { req: true, full: true, ph: "Ej. Secretaría de Ejemplo", ac: "organization", nuevo: "Otra dependencia (escribir)…", nuevoLabel: "Nombre de la dependencia u organización" })}
          ${campo("area", "Área o unidad", { ph: "Opcional" })}
          ${campo("cargo", "Cargo", { ph: "Opcional", ac: "organization-title" })}
          ${campo("nombre", "Nombre completo", { req: true, full: true, ac: "name" })}
          ${campo("correo", "Correo institucional", { req: true, tipo: "email", ph: "tucorreo@ejemplo.com", ac: "email" })}
          ${campo("telefono", "Teléfono", { req: true, tipo: "tel", ph: "10 dígitos", ac: "tel" })}
          <div class="field"><label for="f-contactoPref">¿Cómo prefieres que te contactemos? <span class="req" aria-hidden="true">*</span></label><select class="in select" id="f-contactoPref" data-form="contactoPref" style="width:100%">${opts(ocon, v.contactoPref)}</select></div>
          ${campo("horario", "Horario preferido para que te contactemos", { ph: "Ej. lunes a viernes, 10:00 a 14:00" })}
        </div></section>
      <section class="grp"><h2>Uso previsto</h2>
        <div class="fields">
          <div class="field ${e.tipoUso ? "bad" : ""}"><label for="f-tipoUso">Tipo de uso <span class="req" aria-hidden="true">*</span></label><select class="in select" id="f-tipoUso" data-form="tipoUso" style="width:100%"><option value="">Selecciona…</option>${opts(opcionesUso(), v.tipoUso)}</select>${e.tipoUso ? `<span class="err" role="alert">${esc(e.tipoUso)}</span>` : ""}</div>
          ${v.tipoUso === "Otro" ? combo("usoOtro", "¿Cuál será el uso?", usosUsados, { req: true, full: true, ph: "Describe el uso en pocas palabras", nuevo: "Otro uso (escribir)…", nuevoLabel: "¿Cuál será el uso?" }) : ""}
          ${campo("fechaUso", "Fecha estimada de uso", { tipo: "date" })}
          ${campo("participantes", "Personas que lo usarían", { tipo: "number", ph: "Aproximado", extra: 'min="1" inputmode="numeric"' })}
          <div class="field full ${e.mensaje ? "bad" : ""}"><label for="f-mensaje">¿Qué necesitas? <span class="req" aria-hidden="true">*</span></label><textarea id="f-mensaje" data-form="mensaje" placeholder="Describe brevemente el evento, la reunión o el proceso donde lo usarías.">${esc(v.mensaje || "")}</textarea>${e.mensaje ? `<span class="err" role="alert">${esc(e.mensaje)}</span>` : ""}</div>
        </div></section>
      ${sug.length ? `<section class="grp"><h2>Te podría interesar también</h2><p class="hint">Sistemas relacionados con lo que elegiste. Agrégalos si los necesitas.</p><div class="card"><ul class="sugg">${sug.map(({ x, s }) => `<li>${icono(x, "s40")}<div class="t"><b>${esc(x.nombre)}</b><small>${esc(motivo(s, x))}</small></div><button type="button" class="get sm" data-act="add-sel" data-id="${esc(x.id)}">Agregar</button></li>`).join("")}</ul></div></section>` : ""}
      <div class="hp" aria-hidden="true"><label for="f-web">No llenar este campo</label><input id="f-web" type="text" tabindex="-1" autocomplete="off" data-form="web"></div>
      <button class="get big" type="submit" id="btn-enviar" style="padding:14px 34px;font-size:17px">Enviar solicitud</button>
    </div>
    <aside class="sticky-side">
      <div class="card"><h2 style="font-size:18px;margin-bottom:12px;letter-spacing:-.015em">¿Qué sigue?</h2>
        <ol class="timeline">${pasosSigue().map(([t, d], i) => `<li><span class="n">${i + 1}</span><div><b>${esc(t)}</b><span>${esc(d)}</span></div></li>`).join("")}</ol>
        ${cfg().telefono || cfg().horario ? `<p class="muted" style="font-size:13.5px;margin-top:14px">¿Dudas? ${esc([cfg().telefono, cfg().horario].filter(Boolean).join(" · "))}</p>` : ""}</div>
      ${sel.some((s) => s.estado === "Requiere validación") ? `<div class="note warn">${glifo("info")}<div>Alguno de los sistemas elegidos requiere validación previa de requisitos. Lo revisaremos contigo en la reunión.</div></div>` : ""}
    </aside>
  </form>`;
}

function validarSolicitud() {
  const v = F.vals, e = {};
  const req = (k, m) => { if (!String(v[k] || "").trim()) e[k] = m; };
  if (!F.sel.length) e.sel = "Elige al menos un sistema.";
  req("dependencia", "Elige o escribe el nombre de tu dependencia."); req("nombre", "Escribe tu nombre completo.");
  if (!correoOk(v.correo)) e.correo = "Escribe un correo válido, por ejemplo tucorreo@ejemplo.com.";
  if (String(v.telefono || "").replace(/\D/g, "").length < 8) e.telefono = "Escribe un teléfono de al menos 8 dígitos.";
  req("tipoUso", "Elige el tipo de uso."); if (v.tipoUso === "Otro") req("usoOtro", "Escribe cuál será el uso."); req("mensaje", "Cuéntanos brevemente qué necesitas.");
  return e;
}
const folioNuevo = () => { const d = hoyISO().replace(/-/g, ""); return `SOL-${d}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`; };

function armarMensaje(sol) {
  const d = sol.datos, L = [];
  L.push("SOLICITUD DE SISTEMA", "Folio: " + sol.folio, `Fecha: ${fmtFecha(sol.fecha)}, ${sol.hora}`, "", "SISTEMAS SOLICITADOS");
  sol.sistemas.forEach((s) => L.push("- " + s.nombre + (s.version ? ` (v${s.version})` : "")));
  L.push("", "DATOS DE LA DEPENDENCIA");
  [["Dependencia", d.dependencia], ["Área o unidad", d.area], ["Nombre", d.nombre], ["Cargo", d.cargo], ["Correo", d.correo], ["Teléfono", d.telefono], ["Contacto preferido", d.contactoPref], ["Horario preferido", d.horario]].forEach(([k, x]) => { if (x) L.push(`${k}: ${x}`); });
  L.push("", "USO PREVISTO");
  [["Tipo de uso", d.tipoUso], ["Fecha estimada", d.fechaUso ? fmtFecha(d.fechaUso) : ""], ["Personas que lo usarían", d.participantes]].forEach(([k, x]) => { if (x) L.push(`${k}: ${x}`); });
  L.push("", "NECESIDAD", d.mensaje);
  return L.join("\n");
}
const asuntoSol = (sol) => `Solicitud de sistema: ${sol.sistemas.map((s) => s.nombre).join(", ")} — ${sol.datos.dependencia} (${sol.folio})`;

function enfocarError() {
  const el = $(".field.bad input,.field.bad select,.field.bad textarea") || $("#err-sel") || $("#err-acepto");
  if (el) { el.scrollIntoView({ block: "center", behavior: "smooth" }); if (el.focus) el.focus({ preventScroll: true }); }
}

async function enviarSolicitud() {
  F.errs = validarSolicitud();
  if (Object.keys(F.errs).length) { keep(() => render(false)); enfocarError(); return; }
  if (F.vals.web) { go("solicitudes"); return; }
  if (F.enviando) return;
  F.enviando = true;
  const b = $("#btn-enviar"); if (b) { b.disabled = true; b.textContent = "Enviando…"; }
  const d = new Date(), v = F.vals, c = cfg();
  const sol = {
    id: uid("sol"), folio: folioNuevo(), fecha: hoyISO(), hora: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    sistemas: F.sel.map((id) => { const s = byId(id); return { id, nombre: s.nombre, version: s.version, requisitos: s.requisitos.map((x) => String(x).trim()).filter(Boolean) }; }),
    base: baseReqs(), checks: {}, listo: false,
    datos: { dependencia: v.dependencia.trim(), area: (v.area || "").trim(), nombre: v.nombre.trim(), cargo: (v.cargo || "").trim(), correo: v.correo.trim(), telefono: v.telefono.trim(), contactoPref: v.contactoPref, horario: (v.horario || "").trim(), tipoUso: v.tipoUso === "Otro" ? "Otro: " + (v.usoOtro || "").trim() : v.tipoUso, fechaUso: v.fechaUso || "", participantes: v.participantes || "", mensaje: v.mensaje.trim() },
    estado: "guardada", canal: ""
  };
  if (SB) {
    try {
      const { error } = await conLimite(SB.from("solicitudes").insert({ folio: sol.folio, dependencia: sol.datos.dependencia, datos: sol.datos, sistemas: sol.sistemas.map((x) => ({ id: x.id, nombre: x.nombre, version: x.version || "" })) }), 15000, { error: { message: "tiempo" } });
      if (!error) { sol.estado = "enviada"; sol.canal = "Supabase"; }
    } catch (err) { /* sigue con el correo */ }
  }
  try { await depsRegistrar(sol.datos.dependencia); } catch (err) {}
  if (!S.qa) {   // avisa al superadministrador en Notificaciones
    const nombres = sol.sistemas.map((x) => x.nombre).join(", "), dd = sol.datos;
    const det = { folio: sol.folio, nombre: dd.nombre, correo: dd.correo, telefono: dd.telefono, dependencia: dd.dependencia, area: dd.area, cargo: dd.cargo, sistemas: nombres };
    const tit = `${dd.nombre} solicitó ${nombres}`;
    if (!SB) { notificar("solicitud", tit, det); guardarCatalogo(); }   // con Supabase, el superadministrador las lee directo de la tabla de solicitudes
  }
  S.sols.unshift(sol); await guardarSolicitudes();
  F.ini = null; F.sel = []; F.errs = {}; F.enviando = false; F.vals.mensaje = ""; F.vals.acepto = false;
  go("gracias/" + enc(sol.folio));
}

function vGracias(folio) {
  const sol = S.sols.find((x) => x.folio === folio);
  if (!sol) return vNoEncontrado();
  const c = cfg(), ids = sol.sistemas.map((s) => s.id);
  const base = byId(ids[0]);
  const sug = (base ? relacionados(base, 8) : vis()).filter((x) => !ids.includes(x.id) && x.estado !== "En mantenimiento").slice(0, 3);
  const dest = (c.correoOficio || "").trim();
  const estado = `<div class="note ok">${glifo("ok")}<div><b>Guarda tu folio y elabora tu oficio.</b><br>Redacta un oficio de solicitud, cita el folio <b>${esc(sol.folio)}</b> y envíalo al correo: ${dest ? `<b style="user-select:all">${esc(dest)}</b>` : "<b>por confirmar</b> (se publicará aquí en cuanto esté definido)"}.${sol.estado === "enviada" ? "" : `<br><span class="muted" style="font-size:13.5px">Tu folio quedó guardado en este dispositivo. Anótalo o cópialo para no perderlo.</span>`}<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn sec" data-act="copiar" data-v="${esc(sol.folio)}">${glifo("copy")}Copiar folio</button>${dest ? `<button class="btn sec" data-act="copiar" data-v="${esc(dest)}">${glifo("copy")}Copiar correo</button><a class="btn" href="mailto:${esc(dest)}?subject=${enc("Oficio de solicitud · " + sol.folio)}">${glifo("correo")}Abrir correo</a>` : ""}</div></div></div>`;
  return `${navbar({ back: false })}
  <div class="ok-hero"><div class="big">${glifo("check")}</div><h1 class="large-title">Solicitud registrada</h1><p class="lede" style="margin-top:0">Tu folio es</p><span class="folio">${esc(sol.folio)}</span></div>
  <div style="max-width:680px;margin:26px auto 0;display:grid;gap:18px">
    ${estado}
    <div class="card"><div class="lbl" style="margin-bottom:8px">Sistemas solicitados</div>${sol.sistemas.map((s) => { const x = byId(s.id); return `<div style="display:flex;gap:12px;align-items:center;padding:6px 0">${x ? icono(x, "s40") : ""}<b>${esc(s.nombre)}</b></div>`; }).join("")}
      <div class="kv" style="margin-top:8px"><div><span class="k">Dependencia</span><span class="v">${esc(sol.datos.dependencia)}</span></div><div><span class="k">Contacto</span><span class="v">${esc(sol.datos.nombre)}</span></div><div><span class="k">Correo</span><span class="v">${esc(sol.datos.correo)}</span></div><div><span class="k">Fecha</span><span class="v">${esc(fmtFecha(sol.fecha))}</span></div></div></div>
    <div class="card"><div class="lbl" style="margin-bottom:6px">Siguiente paso</div><p class="muted" style="margin-bottom:12px">Mientras preparas tu oficio, revisa la lista de verificación para confirmar que ya cumples los requisitos.</p><a class="btn" href="#/solicitudes">Verificar requisitos</a></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn sec" href="#/solicitudes">Ver mis solicitudes</a><a class="btn ghost" href="#/sistemas">Seguir explorando</a></div>
  </div>
  ${sug.length ? `<section class="sec" style="max-width:680px;margin-inline:auto"><h2 class="sec-h">Otros sistemas que podrían interesarte</h2><div class="rows" style="grid-template-columns:1fr">${sug.map((x) => fila(x, base ? motivo(base, x) : x.subtitulo)).join("")}</div></section>` : ""}`;
}

/* ---------- Lista de verificación de requisitos ---------- */
const baseReqs = () => String(cfg().requisitosBase || "").split("\n").map((x) => x.trim()).filter(Boolean);
const baseDe = (sol) => (Array.isArray(sol.base) ? sol.base : baseReqs());
const propiosDe = (si) => { if (Array.isArray(si.requisitos)) return si.requisitos; const s = byId(si.id); return s ? s.requisitos.map((x) => String(x).trim()).filter(Boolean) : []; };
function progreso(sol) {
  let t = 0, h = 0; const ch = sol.checks || {};
  baseDe(sol).forEach((_, i) => { t++; if ((ch._base || [])[i]) h++; });
  sol.sistemas.forEach((si) => propiosDe(si).forEach((_, i) => { t++; if ((ch[si.id] || [])[i]) h++; }));
  return { t, h, ok: h === t };
}
function vChecklist(sol) {
  const p = progreso(sol), pct = p.t ? Math.round((p.h / p.t) * 100) : 100, ch = sol.checks || {};
  const grupo = (clave, titulo, items) => items.length ? `<div class="chkgrp"><b>${esc(titulo)}</b>${items.map((t, i) => `<label class="chk"><input type="checkbox" data-chk="${esc(sol.id)}|${esc(clave)}|${i}" ${(ch[clave] || [])[i] ? "checked" : ""}><span>${esc(t)}</span></label>`).join("")}</div>` : "";
  const pie = p.ok
    ? `<div class="note ok">${glifo("check")}<div><b>Requisitos completos.</b> ${sol.listo ? `Lo marcaste como listo el ${esc(fmtFecha(sol.listoFecha || hoyISO()))}.` : "Márcalo como listo y menciónalo en tu oficio."}${sol.listo ? "" : `<div style="margin-top:10px"><button class="btn sm" data-act="chk-avisar" data-id="${esc(sol.id)}">Marcar como listo</button></div>`}</div></div>`
    : `<div class="note warn">${glifo("warn")}<div>Faltan ${p.t - p.h} ${plural(p.t - p.h, "requisito", "requisitos")} por cumplir antes de implementar el sistema.</div></div>`;
  return `<div class="chkl"><div class="chkl-h"><b>Lista de verificación de requisitos</b><span class="badge ${p.ok ? "ok" : "warn"}">${p.h}/${p.t}</span></div><div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
    ${grupo("_base", "Generales", baseDe(sol))}${sol.sistemas.map((si) => grupo(si.id, si.nombre, propiosDe(si))).join("")}${p.t === 0 ? '<p class="muted" style="font-size:14px">Estos sistemas no tienen requisitos registrados.</p>' : ""}${pie}</div>`;
}
function avisoListo(sol) {
  const L = ["REQUISITOS COMPLETOS", `Folio: ${sol.folio}`, `Fecha: ${fmtFecha(hoyISO())}`, "", `Dependencia: ${sol.datos.dependencia}`, `Contacto: ${sol.datos.nombre} (${sol.datos.correo}, ${sol.datos.telefono})`, `Sistemas: ${sol.sistemas.map((s) => s.nombre).join(", ")}`, "", "REQUISITOS VERIFICADOS"];
  baseDe(sol).forEach((r) => L.push("[x] " + r));
  sol.sistemas.forEach((si) => propiosDe(si).forEach((r) => L.push(`[x] ${si.nombre}: ${r}`)));
  L.push("", "Todo está listo para implementar el sistema.");
  return L.join("\n");
}
function marcarRequisito(t) {
  const [sid, clave, i] = t.dataset.chk.split("|"), sol = S.sols.find((x) => x.id === sid); if (!sol) return;
  sol.checks = sol.checks || {}; const a = (sol.checks[clave] = sol.checks[clave] || []); a[+i] = t.checked;
  if (!progreso(sol).ok) sol.listo = false;
  guardarSolicitudes(); keep(() => render(false));
}

/* ---------- Superadministrador: bandeja de solicitudes recibidas ---------- */
const ESTADOS_BAN = { nueva: ["warn", "Nueva"], contacto: ["info", "En contacto"], atendida: ["ok", "Atendida"], cancelada: ["bad", "Cancelada"], archivada: ["", "Archivada"] };
S.bf = "todas";
function exportarBandeja() {
  const ver = S.bf === "todas" ? filasBandeja() : filasBandeja().filter((r) => r.estado === S.bf);
  const d = (r) => r.datos || {};
  const cols = [["Folio", (r) => r.folio], ["Fecha", (r) => String(r.creado).slice(0, 10)], ["Estado", (r) => (ESTADOS_BAN[r.estado] || ["", r.estado])[1]], ["Dependencia", (r) => d(r).dependencia], ["Área o unidad", (r) => d(r).area], ["Nombre", (r) => d(r).nombre], ["Cargo", (r) => d(r).cargo], ["Correo", (r) => d(r).correo], ["Teléfono", (r) => d(r).telefono], ["Contacto preferido", (r) => d(r).contactoPref], ["Horario para contactarlo", (r) => d(r).horario], ["Sistemas", (r) => (r.sistemas || []).map((x) => x.nombre).join("; ")], ["Uso previsto", (r) => d(r).tipoUso], ["Fecha estimada", (r) => d(r).fechaUso], ["Personas", (r) => d(r).participantes], ["Mensaje", (r) => d(r).mensaje], ["Nota interna", (r) => r.nota]];
  const q = (x) => { let t = String(x == null ? "" : x); if (/^[=+\-@]/.test(t)) t = "'" + t; return '"' + t.replace(/"/g, '""') + '"'; };
  const csv = "\ufeff" + [cols.map((c) => q(c[0])).join(","), ...ver.map((r) => cols.map((c) => q(c[1](r))).join(","))].join("\r\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); a.download = "solicitudes-" + hoyISO() + ".csv"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(ver.length + " solicitud" + (ver.length === 1 ? "" : "es") + " exportada" + (ver.length === 1 ? "" : "s"));
}
async function cargarBandeja() {
  if (!SB || !S.super) { S.inbox = null; return; }
  S.inbox = "cargando";
  const { data, error } = await SB.from("solicitudes").select("*").order("creado", { ascending: false }).limit(500);
  S.inbox = error ? "error" : data;
}
async function bandejaEstado(ids, v) {
  if (!S.super || !ids.length) return;
  if (SB) {
    const { error } = await SB.from("solicitudes").update({ estado: v }).in("id", ids);
    if (error) return toast("No se pudo actualizar el estado.");
    (S.inbox || []).forEach((r) => { if (ids.includes(r.id)) r.estado = v; });
  } else { S.sols.forEach((x) => { if (ids.includes(x.id)) x.estadoBan = v; }); await guardarSolicitudes(); }
  keep(() => render(true));
}
async function bandejaBorrar(ids, texto) {
  if (!S.super || !ids.length) return;
  if (!(await confirmar({ titulo: ids.length === 1 ? "Eliminar solicitud" : "Eliminar solicitudes", texto, si: "Eliminar", peligro: true }))) return;
  if (SB) {
    const { error } = await SB.from("solicitudes").delete().in("id", ids);
    if (error) return toast("No se pudo eliminar: tu cuenta necesita permiso de borrado en Supabase.");
    S.inbox = (S.inbox || []).filter((r) => !ids.includes(r.id));
  } else { S.sols = S.sols.filter((x) => !ids.includes(x.id)); await guardarSolicitudes(); }
  toast(ids.length === 1 ? "Solicitud eliminada" : `${ids.length} solicitudes eliminadas`); keep(() => render(true));
}
function filasBandeja() {
  if (SB) return Array.isArray(S.inbox) ? S.inbox : [];
  return S.sols.map((x) => ({ id: x.id, folio: x.folio, creado: x.fecha, datos: x.datos, sistemas: x.sistemas, estado: x.estadoBan || "nueva", nota: x.nota || "" }));
}
function vBandeja(foco) {
  if (SB && S.inbox === undefined) { cargarBandeja().then(() => { if (/^#\/solicitudes/.test(location.hash)) render(true); }); }
  const rows = filasBandeja(), cuenta = (e) => rows.filter((r) => r.estado === e).length;
  /* Si se llega desde una notificación (#/solicitudes/FOLIO): muestra esa solicitud abierta y desplaza la pantalla hasta ella */
  if (!foco) S.focoHecho = null;
  const objetivo = foco ? rows.find((r) => r.folio === foco) : null, primera = !!objetivo && S.focoHecho !== foco;
  if (primera) {
    S.focoHecho = foco; S.bf = objetivo.estado === "archivada" ? "archivada" : "todas";
    post = () => setTimeout(() => { const el = document.getElementById("ban-" + foco); if (!el) return; el.scrollIntoView({ block: "start", behavior: "smooth" }); el.classList.add("ban-resalta"); setTimeout(() => el.classList.remove("ban-resalta"), 2600); }, 120);
  }
  const activas = rows.filter((r) => r.estado !== "archivada");
  const vis = S.bf === "todas" ? activas : rows.filter((r) => r.estado === S.bf);
  const grupos = new Map();
  vis.forEach((r) => { const k = String((r.datos && r.datos.dependencia) || "Sin dependencia").trim(); const g = k.toLowerCase(); if (!grupos.has(g)) grupos.set(g, { nombre: k, items: [] }); grupos.get(g).items.push(r); });
  const nDeps = new Set(rows.map((r) => String((r.datos && r.datos.dependencia) || "").trim().toLowerCase())).size;
  const dato = (t, x, href) => x ? `<div><small>${t}</small>${href ? `<a href="${esc(href)}">${esc(x)}</a>` : `<span>${esc(x)}</span>`}</div>` : "";
  const card = (r) => { const d = r.datos || {}, [cl, tx] = ESTADOS_BAN[r.estado] || ["", r.estado], tel = String(d.telefono || "").replace(/[^\d+]/g, "");
    return `<details class="ban-card" id="ban-${esc(r.folio)}"${foco && r.folio === foco ? " open" : ""}><summary><span class="ban-sis">${esc((r.sistemas || []).map((x) => x.nombre).join(", "))}</span><span class="badge ${cl}">${tx}</span><small>${esc(fmtFecha(String(r.creado).slice(0, 10)))} · ${esc(r.folio)}</small></summary>
      <div class="ban-grid">${dato("Nombre", d.nombre)}${dato("Cargo", d.cargo)}${dato("Correo", d.correo, "mailto:" + d.correo + "?subject=" + encodeURIComponent("Seguimiento de tu solicitud " + r.folio))}${dato("Teléfono", d.telefono, tel ? "tel:" + tel : "")}${dato("Prefiere que lo contacten por", d.contactoPref)}${dato("Horario para contactarlo", d.horario)}${dato("Área o unidad", d.area)}${dato("Uso previsto", d.tipoUso)}${dato("Fecha estimada", d.fechaUso ? fmtFecha(d.fechaUso) : "")}${dato("Personas que lo usarían", d.participantes)}</div>
      ${d.mensaje ? `<p class="ban-msg"><small>Lo que necesita</small>${esc(d.mensaje)}</p>` : ""}
      ${`<div class="ban-acts">${Object.entries(ESTADOS_BAN).filter(([k]) => k !== r.estado).map(([k, v]) => `<button class="btn sm sec" data-act="bandeja-estado" data-id="${esc(r.id)}" data-v="${k}">${k === "archivada" ? "Archivar" : r.estado === "archivada" && k === "nueva" ? "Restaurar" : "Marcar: " + v[1]}</button>`).join("")}<button class="btn sm danger" data-act="bandeja-borrar" data-id="${esc(r.id)}">${glifo("trash")}Eliminar</button></div>
      <label class="sr" for="nota-${esc(r.id)}">Nota interna</label><textarea id="nota-${esc(r.id)}" class="ban-nota" placeholder="Nota interna (solo la ves tú)">${esc(r.nota || "")}</textarea><button class="btn sm" data-act="bandeja-nota" data-id="${esc(r.id)}">Guardar nota</button>`}</details>`; };
  const estado = SB ? (S.inbox === "cargando" || S.inbox === undefined ? '<div class="note info">' + glifo("info") + "<div>Cargando solicitudes…</div></div>" : S.inbox === "error" ? '<div class="note warn">' + glifo("warn") + "<div>No se pudieron cargar las solicitudes. Revisa tu conexión y que tu cuenta sea superadministrador.</div></div>" : "") : '<div class="note info">' + glifo("info") + "<div>Aún no está conectado Supabase, así que solo ves las solicitudes hechas desde este dispositivo. Al conectarlo recibirás aquí las de todas las dependencias.</div></div>";
  const bulk = S.bf === "cancelada" && vis.length ? `<div class="note warn" style="margin:12px 0">${glifo("warn")}<div><b>${vis.length} ${plural(vis.length, "solicitud cancelada", "solicitudes canceladas")}.</b> Archívalas para conservarlas fuera de la lista, o elimínalas definitivamente.<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn sm sec" data-act="bandeja-archivar-canceladas">Archivar todas</button><button class="btn sm danger" data-act="bandeja-borrar-canceladas">${glifo("trash")}Eliminar todas</button></div></div></div>` : "";
  return `${cabecera("Solicitudes recibidas", "Qué sistemas pidió cada dependencia y cómo contactarla.")}
    <div class="sp"></div>${estado}
    <div class="ban-kpis"><div><b>${cuenta("nueva")}</b><span>Nuevas</span></div><div><b>${cuenta("contacto")}</b><span>En contacto</span></div><div><b>${cuenta("atendida")}</b><span>Atendidas</span></div><div><b>${nDeps}</b><span>Dependencias</span></div></div>
    <div class="chips" role="group" aria-label="Filtrar por estado">${[["todas", "Todas (" + activas.length + ")"], ...Object.entries(ESTADOS_BAN).map(([k, v]) => [k, v[1] + " (" + cuenta(k) + ")"])].map(([k, t]) => `<button type="button" data-act="bandeja-filtro" data-v="${k}" ${S.bf === k ? 'aria-current="true" class="on"' : ""}>${t}</button>`).join("")}<button type="button" data-act="bandeja-recargar">${glifo("reloj")}Actualizar</button><button type="button" data-act="bandeja-exportar">Descargar Excel (.csv)</button></div>
    ${bulk}
    ${grupos.size ? [...grupos.values()].map((g) => `<section class="ban-dep"><h2>${esc(g.nombre)} <small>${g.items.length} solicitud${g.items.length === 1 ? "" : "es"}</small></h2>${g.items.map(card).join("")}</section>`).join("") : vacio("No hay solicitudes", S.bf === "todas" ? "Cuando una dependencia solicite un sistema aparecerá aquí." : "No hay solicitudes con este estado.")}`;
}
function misSols() { return S.user ? S.sols.filter((x) => normCorreo((x.datos || {}).correo || "") === normCorreo(S.user.correo || "")) : S.sols.slice(); }
function vSolicitudes() {
  const lista = misSols();
  const est = { enviada: ["ok", "Registrada"], pendiente: ["", "Guardada en este dispositivo"], guardada: ["", "Guardada en este dispositivo"], cancelada: ["bad", "Cancelada"] };
  return `${cabecera("Mis solicitudes", "Historial de las solicitudes que hiciste desde este dispositivo.")}
    <div class="sp"></div>
    ${lista.length ? lista.map((sol) => { const [cl, tx] = est[sol.cancelada ? "cancelada" : sol.estado] || ["", sol.estado]; return `<article class="solcard${sol.cancelada ? " cancelada" : ""}"><header><div><b style="font-size:17px">${esc(sol.sistemas.map((s) => s.nombre).join(", "))}</b><div class="muted" style="font-size:14px">${esc(sol.datos.dependencia)} · ${esc(fmtFecha(sol.fecha))}</div></div><span class="badge ${cl}">${esc(tx)}</span></header>
      <div class="muted" style="font-size:14px">Folio <span class="folio" style="font-size:13px;padding:2px 8px">${esc(sol.folio)}</span>${sol.listo && !sol.cancelada ? ' <span class="badge ok">Listo para implementar</span>' : ""}</div>${sol.cancelada ? `<p class="muted" style="font-size:14px;margin:6px 0 0">Cancelaste esta solicitud${sol.canceladaFecha ? " el " + esc(fmtFecha(sol.canceladaFecha)) : ""}. Si aún necesitas el sistema, haz una solicitud nueva.</p>` : vChecklist(sol)}
      <div class="acts"><button class="btn sm sec" data-act="copiar" data-v="${esc(sol.folio)}">${glifo("copy")}Copiar folio</button><button class="btn sm sec" data-act="copiar-sol" data-id="${esc(sol.id)}">${glifo("copy")}Copiar datos</button>${sol.cancelada ? "" : `<button class="btn sm danger" data-act="cancelar-sol" data-id="${esc(sol.id)}">${glifo("x")}Cancelar solicitud</button>`}</div></article>`; }).join("")
      : vacio("Todavía no has enviado solicitudes", "Cuando solicites un sistema aparecerá aquí con su folio.", `<a class="btn" href="#/sistemas">Explorar sistemas</a>`)}
    ${lista.length ? `<p class="muted" style="font-size:13.5px;margin-top:6px">Este historial se guarda solo en este navegador. Si ya no necesitas un sistema, usa «Cancelar solicitud»: no se borra, queda marcada como cancelada y se avisa al administrador.</p>` : ""}`;
}

/* ---------- Administración ---------- */
const softBlink = () => { view.classList.remove("blink-soft"); void view.offsetWidth; view.classList.add("blink-soft"); setTimeout(() => view.classList.remove("blink-soft"), 420); };
const keep = (fn) => { const y = window.scrollY; fn(); window.scrollTo(0, y); if (Date.now() - (window.__tapT || 0) < 600) softBlink(); };
/* Pulso visual al tocar cualquier botón o enlace */
document.addEventListener("click", (e) => {
  const t = e.target.closest("button,a.btn,.chip,.seg a,.cfg-nav a,.sidenav a,.tabbar a,.get,.iconbtn,.row-main,.coll,.feat-txt,.nlink,.nitem,.brand,.circ,.opt-row button");
  if (!t || t.disabled || t.closest(".modal") && t.classList.contains("modal")) return;
  window.__tapT = Date.now();
  t.classList.remove("tap"); void t.offsetWidth; t.classList.add("tap"); setTimeout(() => t.classList.remove("tap"), 480);
}, true);
const getPath = (o, p) => p.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
function setPath(o, p, val) { const k = p.split("."); let a = o; for (let i = 0; i < k.length - 1; i++) { a = a[k[i]]; if (a == null) return; } a[k[k.length - 1]] = val; }

function bannerAdmin() {
  let h = "";
  if (S.memoria) h += `<div class="note warn">${glifo("warn")}<div>Este navegador no permite guardar datos (por ejemplo, ventana privada). Tus cambios se perderán al cerrar la página.</div></div>`;
  if (S.cat.editado && SB) h += `<div class="note warn">${glifo("warn")}<div><b>Publicando tus cambios…</b> Se publican solos para todas las dependencias; no necesitas subir ningún archivo.<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn sm" data-act="publicar-ahora">Publicar ahora</button></div></div></div>`;
  else if (S.cat.editado) h += `<div class="note warn">${glifo("warn")}<div><b>Tienes cambios sin publicar.</b> Solo tú los ves en este navegador. Para que los vean todas las dependencias, publícalos siguiendo la guía.${S.super ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn sm" data-act="como-publicar">Cómo publicar</button></div>` : '<div style="margin-top:6px">Avisa al superadministrador para que los publique.</div>'}</div></div>`;
  if (S.cat.sistemas.some((s) => s.ejemplo)) h += `<div class="note info">${glifo("info")}<div>Estás viendo sistemas de ejemplo. Cuando tengas los tuyos, puedes quitarlos${S.super ? ' todos de una vez.<div style="margin-top:10px"><button class="btn sm sec" data-act="quitar-ejemplos">Eliminar sistemas de ejemplo</button></div>' : ". Puedes editarlos o eliminarlos uno por uno."}</div></div>`;
  return h ? `<section class="grp avisos"><h2>Avisos</h2><p class="hint">Información sobre el estado del catálogo.</p>${h}</section>` : "";
}

function vAdmin(sub, id) {
  const h = vAdminBase(sub, id);
  if (!h.includes("<!--panel-->")) return h;
  return h.replace("<!--panel-->", '<div class="admin-panel">') + "</div>" + bannerAdmin();
}
function vAdminBase(sub, id) {
  if (!S.admin) return `${cabecera("Administración")}${vacio("Acceso restringido", "Esta sección es solo para administradores del catálogo.", `<a class="btn" href="#/">Ir al inicio</a>`)}`;
  if (sub === "editar") return vEditor(id);
  const permitidas = S.super ? ["categorias", "config", "usuarios", "notificaciones", "avisos", "qa"] : ["categorias"], tab = permitidas.includes(sub) ? sub : "sistemas";
  const cur = (k) => (tab === k ? ' aria-current="page"' : "");
  const cab = `${cabecera("Administración", S.super ? "Control total del catálogo, usuarios y configuración." : "Como colaborador puedes editar sistemas y categorías.")}
    <div class="admbar adm-flota"><nav class="seg" aria-label="Secciones de administración"><a href="#/admin"${cur("sistemas")}>Sistemas</a><a href="#/admin/categorias"${cur("categorias")}>Categorías</a>${S.super ? `<a href="#/admin/notificaciones"${cur("notificaciones")}>Notificaciones${nNoLeidas() ? ` <span class="badge acc">${nNoLeidas()}</span>` : ""}</a><a href="#/admin/avisos"${cur("avisos")}>Avisos</a><a href="#/admin/usuarios"${cur("usuarios")}>Usuarios</a><a href="#/admin/config"${cur("config")}>Configuración</a><a href="#/admin/qa"${cur("qa")}>Pruebas QA${S.qa ? " ●" : ""}</a>` : ""}</nav><button class="btn sec sm" data-act="cerrar-sesion">${glifo("unlock")}Cerrar sesión</button></div><!--panel-->`;
  if (tab === "categorias") return cab + vAdminCategorias();
  if (tab === "notificaciones") { if (S.super && SB && Date.now() - (S.ntRef || 0) > 15000) { S.ntRef = Date.now(); sbNotifs().then(() => { if (/^#\/admin\/notificaciones/.test(location.hash)) keep(() => render(false)); refrescarCampana(); }); } return cab + vAdminNotif(); }
  if (tab === "avisos") return cab + vAdminAvisos();
  if (tab === "usuarios") return cab + vAdminUsuarios();
  if (tab === "qa") return cab + vAdminQA();
  if (tab === "config") return cab + vAdminConfig(id);
  const l = S.cat.sistemas;
  return cab + `<div class="admbar" style="margin-top:0"><span class="muted">${l.length} ${plural(l.length, "sistema", "sistemas")} · ${l.filter((s) => s.publicado).length} publicados</span><a class="btn" href="#/admin/editar/nuevo">${glifo("plus")}Agregar sistema</a></div>
    ${l.length ? `<div class="list-card">${l.map((s, i) => `<div class="arow">${icono(s, "s40")}<div class="t"><b>${esc(s.nombre || "Sin nombre")}</b><small><span class="badge ${s.estado === "Disponible" ? "ok" : s.estado === "Requiere validación" ? "warn" : ""}">${esc(s.estado)}</span>${s.publicado ? '<span class="badge acc">Publicado</span>' : '<span class="badge warn">Oculto</span>'}${s.destacado ? '<span class="badge">Destacado</span>' : ""}${s.ejemplo ? '<span class="badge">Ejemplo</span>' : ""}</small></div>
      <div class="acts"><div class="acts-main"><a class="btn sm" href="#/admin/editar/${enc(s.id)}">${glifo("edit")}Editar</a><button class="btn sm sec" data-act="ren-sis" data-id="${esc(s.id)}">Renombrar</button><button class="btn sm ghost" data-act="toggle-pub" data-id="${esc(s.id)}">${s.publicado ? "Ocultar" : "Publicar"}</button></div><div class="acts-icons"><a class="iconbtn" href="#/sistema/${enc(s.id)}" aria-label="Ver ${esc(s.nombre)}">${glifo("eye")}</a><button class="iconbtn" data-act="mover" data-id="${esc(s.id)}" data-d="-1" ${i === 0 ? "disabled" : ""} aria-label="Subir">${glifo("up")}</button><button class="iconbtn" data-act="mover" data-id="${esc(s.id)}" data-d="1" ${i === l.length - 1 ? "disabled" : ""} aria-label="Bajar">${glifo("down")}</button><button class="iconbtn" data-act="duplicar" data-id="${esc(s.id)}" aria-label="Duplicar ${esc(s.nombre)}">${glifo("copy")}</button><button class="iconbtn bad" data-act="del-sistema" data-id="${esc(s.id)}" aria-label="Eliminar ${esc(s.nombre)}">${glifo("trash")}</button></div></div></div>`).join("")}</div>` : vacio("Aún no hay sistemas", "Agrega el primero para que aparezca en el catálogo.", `<a class="btn" href="#/admin/editar/nuevo">${glifo("plus")}Agregar sistema</a>`)}`;
}

function vAdminCategorias() {
  const opt = (arr, cur, f) => arr.map((g) => `<option value="${g}" ${g === cur ? "selected" : ""}>${f(g)}</option>`).join("");
  const cap = (g) => g[0].toUpperCase() + g.slice(1);
  const tarjeta = (k) => {
    const n = S.cat.sistemas.filter((x) => x.categorias.includes(k.id)).length, id = esc(k.id);
    return `<article class="cat-card">
      <div class="cat-top"><span class="ico s40" style="${colorVars(k.color)}">${catInner(k)}</span>
        <div class="field"><label for="cn-${id}">Nombre de la categoría</label><input id="cn-${id}" type="text" value="${esc(k.nombre)}" data-catf="nombre" data-id="${id}" autocomplete="off"></div></div>
      <div class="cat-opts">
        <div class="field"><label for="cg-${id}">Ícono</label><select class="select" id="cg-${id}" data-catf="glifo" data-id="${id}">${opt(GLIFOS, k.glifo, cap)}</select></div>
        <div class="field"><label for="cc-${id}">Color</label><select class="select" id="cc-${id}" data-catf="color" data-id="${id}">${opt(COLORES_UI, colorUI(k.color), cap)}</select></div>
      </div>
      <div class="cat-foot"><span class="cat-n">${n} sistema${n === 1 ? "" : "s"} en esta categoría</span>
        <button class="btn sm sec" data-act="edit-cat" data-id="${id}">${glifo("edit")}Imagen e ícono</button>
        <button class="btn sm ghost cat-del" data-act="del-cat" data-id="${id}" aria-label="Eliminar la categoría ${esc(k.nombre)}">${glifo("trash")}Eliminar</button></div>
    </article>`;
  };
  return `<div class="admbar" style="margin-top:0"><span class="muted">Las categorías agrupan los sistemas en el catálogo. Los cambios de nombre, ícono y color se guardan solos.</span><button class="btn" data-act="add-cat">${glifo("plus")}Agregar categoría</button></div>
  <div class="cat-list">${S.cat.categorias.map(tarjeta).join("")}</div>`;
}

/* ---- Vista previa en vivo de la apariencia (tema + color) ---- */
const apModoOscuro = (c) => { const d = !!(window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches); const t = (c && c.tema) || "auto"; return t === "oscuro" || (t !== "claro" && d); };
function apPreview(c) {
  c = c || cfg();
  const osc = apModoOscuro(c), t = c.tema || "auto", col = COLORES[c.acento] || COLORES.azul, hex = osc ? col[0] : col[1];
  const nom = osc ? "oscuro" : "claro";
  const msg = t === "auto" ? `Automático: tu dispositivo está en modo <b>${nom}</b>. La vista previa cambia sola cuando el dispositivo cambia de apariencia.` : `Modo <b>${nom}</b> fijo para todas las personas.`;
  return `<div id="ap-prev" class="apv-wrap" aria-live="polite"><div class="apv-head"><span class="apv-pill">${glifo(osc ? "estrella" : "globo")}Vista previa · modo ${nom}</span><span class="apv-msg">${msg}</span></div>
    <div class="apv ${osc ? "osc" : ""}" style="--ac:${hex}" role="img" aria-label="Vista previa del catálogo en modo ${nom}">
      <div class="apv-side"><div class="apv-brand"><i></i><b>Catálogo</b></div><span class="apv-nav on">Descubrir</span><span class="apv-nav">Sistemas</span><span class="apv-nav">Mis solicitudes</span><span class="apv-nav">Categorías</span></div>
      <div class="apv-main"><div class="apv-top"><b>Descubrir</b><span class="apv-search">Buscar</span></div>
        <div class="apv-hero"><span class="apv-tag">${glifo("app")}Sistema</span><b>Sistema de Votaciones</b><small>Cada voto cuenta</small><span class="apv-btn">Solicitar</span></div>
        <div class="apv-rows">
          <div class="apv-row"><i style="background:${hex}"></i><span><b>Portal CHIHUAHUA</b><small><em class="w">${glifo("globo")}Portal / Sitio web</em></small></span><span class="apv-get">Solicitar</span></div>
          <div class="apv-row"><i style="background:${hex};opacity:.7"></i><span><b>Encuestas Interactivas</b><small><em class="s">${glifo("app")}Sistema</em></small></span><span class="apv-get">Solicitar</span></div>
        </div></div></div></div>`;
}
function apRefrescar() { const el = document.getElementById("ap-prev"); if (el) el.outerHTML = apPreview(S.cfgDraft || cfg()); }
if (window.matchMedia) { try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", apRefrescar); } catch (e) { /* navegador antiguo */ } }

function vAdminConfig(sec) {
  if (!S.cfgDraft) S.cfgDraft = clone(cfg());
  const c = S.cfgDraft;
  const SECS = [["general", "General", "building"], ["solicitudes", "Solicitudes", "correo"], ["formulario", "Formulario y dependencias", "building"], ["apariencia", "Apariencia", "estrella"], ["seguridad", "Seguridad", "escudo"], ["datos", "Datos y publicación", "nube"]];
  if (!SECS.some((x) => x[0] === sec)) sec = "general";
  const f = (k, label, o = {}) => `<div class="field ${o.full ? "full" : ""}"><label for="c-${k}">${label}</label><input id="c-${k}" type="${o.tipo || "text"}" data-cfg="${k}" value="${esc(c[k] || "")}" placeholder="${esc(o.ph || "")}" autocomplete="off"><span class="muted" style="font-size:12.5px">${o.hint || ""}</span></div>`;
  const ta = (k, label, hint = "", h = 80) => `<div class="field full"><label for="c-${k}">${label}</label><textarea id="c-${k}" data-cfg="${k}" style="min-height:${h}px">${esc(c[k] || "")}</textarea><span class="muted" style="font-size:12.5px">${hint}</span></div>`;
  const savebar = `<div class="savebar"><span class="muted" style="font-size:14px">Los cambios se aplican al guardar.</span><button class="btn" data-act="guardar-cfg">Guardar configuración</button></div>`;
  const ej = S.cat.sistemas.filter((x) => x.ejemplo).length, g = cfg();
  const item = (estado, titulo, detalle, accion = "") => `<div class="chk-item"><span class="dot ${estado}">${glifo(estado === "ok" ? "check" : estado === "warn" ? "warn" : "info")}</span><div class="t"><b>${titulo}</b><small>${detalle}</small></div>${accion}</div>`;
  let panel = "";
  if (sec === "general") {
    panel = `<section class="grp"><h2>Estado del catálogo</h2><p class="hint">Revisión rápida de lo que falta para que el catálogo funcione completo.</p><div class="card">
      ${g.correoOficio ? item("ok", "Correo para el oficio", esc(g.correoOficio)) : item("warn", "Correo para el oficio", "Aún no se define: los solicitantes verán «por confirmar».", `<a class="btn sm sec" href="#/admin/config/solicitudes">Configurar</a>`)}
      ${item(S.cat.usuarios.some((x) => rolDe(x.rol) === "superadmin" && x.estado === "activo") ? "ok" : "warn", "Usuarios y accesos", `${S.cat.usuarios.length} ${plural(S.cat.usuarios.length, "usuario", "usuarios")} con acceso (correo y contraseña).`, `<a class="btn sm sec" href="#/admin/usuarios">Administrar</a>`)}
      ${SB ? item(S.cat.editado ? "warn" : "ok", "Publicación automática", S.cat.editado ? "Hay cambios por publicar; se envían solos en unos segundos." : "Conectado: los cambios se publican solos, sin subir catalogo.json.", S.cat.editado ? `<button class="btn sm sec" data-act="publicar-ahora">Publicar ahora</button>` : "") : S.pub ? item(S.cat.editado ? "warn" : "ok", "Catálogo publicado", S.cat.editado ? "Tienes cambios locales sin publicar." : "La versión publicada está al día.", S.cat.editado ? `<a class="btn sm sec" href="#/admin/config/datos">Publicar</a>` : "") : item("warn", "Catálogo publicado", "Aún no hay archivo catalogo.json junto a index.html.", `<a class="btn sm sec" href="#/admin/config/datos">Cómo publicar</a>`)}
      ${ej ? item("warn", "Sistemas de ejemplo", `${ej} ${plural(ej, "sistema de ejemplo", "sistemas de ejemplo")} visibles para las dependencias.`, `<a class="btn sm sec" href="#/admin/config/datos">Quitar</a>`) : item("ok", "Contenido propio", "No hay sistemas de ejemplo.")}
    </div></section>
    <section class="grp"><h2>Identidad</h2><div class="card"><div class="fields">
      ${f("nombre", "Nombre del catálogo")}${f("organizacion", "Organización o área responsable")}
      ${f("telefono", "Teléfono de contacto", { ph: "Opcional" })}${f("horario", "Horario de atención", { ph: "Lunes a viernes, 9:00 a 17:00" })}
      <div class="field full"><span class="lbl">Logotipo</span><div class="logo-ed">
        <div class="logo-prev" aria-label="Vista previa del logotipo">${imgOk(c.logo) ? `<span class="ico s96" style="${colorVars("azul")};--s:96px"><img src="${esc(c.logo)}" alt=""></span>` : logoSvg(c)}</div>
        <div>
          <div class="logo-grp"><span class="muted" style="font-size:13px">Símbolo</span><div class="logo-opts" role="group" aria-label="Símbolo">${Object.keys(LOGO_MARCAS).map((k) => `<button type="button" data-act="logo-marca" data-v="${k}" aria-pressed="${!imgOk(c.logo) && (c.logoMarca || "facetas") === k}" aria-label="${LOGO_MARCAS[k].n}" title="${LOGO_MARCAS[k].n}">${logoSvg(Object.assign({}, c, { logoMarca: k }))}</button>`).join("")}</div></div>
          <div class="logo-grp"><span class="muted" style="font-size:13px">Color</span><div class="swatches" role="group" aria-label="Color del logotipo">${COLORES_UI.map((k) => `<button type="button" data-act="logo-color" data-c="${k}" style="${colorVars(k)}" aria-pressed="${!imgOk(c.logo) && colorUI(c.logoColor || "azul") === k}" aria-label="${k}"></button>`).join("")}</div></div>
          <div class="logo-grp"><span class="muted" style="font-size:13px">Forma</span><div class="logo-opts" role="group" aria-label="Forma">${Object.keys(LOGO_FORMAS).map((k) => `<button type="button" class="txt" data-act="logo-forma" data-v="${k}" aria-pressed="${!imgOk(c.logo) && (c.logoForma || "squircle") === k}">${LOGO_FORMAS[k][0]}</button>`).join("")}</div></div>
          <div class="up" style="margin-top:6px"><input type="file" id="up-logo" accept="image/*" data-up="logo"><label class="btn sec sm" for="up-logo">${glifo("upload")}Añadir mi propio logotipo</label>${imgOk(c.logo) ? `<button class="btn ghost sm" data-act="quitar-logo">Volver al diseño</button>` : ""}</div>
          <p class="cfg-note">Elige símbolo, color y forma, o sube tu propia imagen. Presiona «Guardar configuración» para aplicarlo.</p>
        </div></div></div>
    </div></div></section>` + savebar;
  } else if (sec === "solicitudes") {
    const pasos = pasosSigue(c).map(([t, d], i) => `<li><span class="n">${i + 1}</span><div><b>${esc(t)}</b><span>${esc(d)}</span></div></li>`).join("");
    panel = `<section class="grp"><h2>Recepción de solicitudes</h2><p class="hint">Las solicitudes solo generan un folio. Define el correo al que cada persona enviará su oficio.</p><div class="card"><div class="fields">
      ${f("correoAdmin", "Correo del administrador (solicitudes de usuario y recuperación)", { tipo: "email", ph: "admin@tudependencia.gob.mx", full: true, hint: "Aquí llegan las solicitudes de nuevos usuarios y de recuperación de contraseña." })}
      ${f("correoOficio", "Correo al que se envía el oficio", { tipo: "email", ph: "oficios@tudependencia.gob.mx", full: true, hint: "Se muestra al solicitante junto a su folio. Mientras esté vacío verá «por confirmar»." })}
    </div></div></section>
    <section class="grp"><h2>Seguimiento</h2><p class="hint">Estos textos aparecen en «¿Qué sigue?» cuando alguien llena una solicitud.</p><div class="card"><div class="fields">
      ${f("tiempoRespuesta", "Tiempo de respuesta", { ph: "3 días hábiles", hint: "Ej. «2 días hábiles», «una semana»." })}
      ${ta("reunion", "Qué pasa después de la revisión", "Describe el siguiente paso con la dependencia (reunión, capacitación, accesos…).", 70)}
      ${ta("requisitosBase", "Requisitos generales para todos los sistemas (uno por línea)", "Aparecen en la lista de verificación de cada solicitud, antes de los requisitos propios de cada sistema.", 130)}
    </div></div></section>
    <section class="grp"><h2>Vista previa de «¿Qué sigue?»</h2><p class="hint">Así lo verá el solicitante. Se actualiza al guardar.</p><div class="card"><ol class="timeline">${pasos}</ol></div></section>` + savebar;
  } else if (sec === "formulario") {
    panel = vCfgFormulario(ta, savebar);
  } else if (sec === "legal") {
    panel = vCfgLegal(ta, savebar);
  } else if (sec === "apariencia") {
    panel = `<section class="grp"><h2>Vista previa</h2><p class="hint">Así se verá el catálogo con lo que elijas abajo. Se actualiza al instante.</p><div class="card">${apPreview(c)}</div></section>
    <section class="grp"><h2>Tema</h2><p class="hint">Elige cómo se ve el catálogo para todas las personas que lo abren.</p><div class="card"><div class="opt-row" role="group" aria-label="Tema">
      ${[["auto", "Automático"], ["claro", "Claro"], ["oscuro", "Oscuro"]].map(([v, l]) => `<button type="button" data-act="cfg-tema" data-v="${v}" aria-pressed="${(c.tema || "auto") === v}">${l}</button>`).join("")}</div>
      <p class="cfg-note">«Automático» sigue el modo del dispositivo.</p></div></section>
    <section class="grp"><h2>Color de acento</h2><p class="hint">Se usa en botones, enlaces y la barra lateral.</p><div class="card">
      <div class="swatches" role="group" aria-label="Color de acento"><button type="button" data-act="cfg-acento" data-c="" style="${colorVars("azul")}" aria-pressed="${!c.acento}" aria-label="Predeterminado"></button>${COLORES_UI.filter((k) => k !== "azul").map((k) => `<button type="button" data-act="cfg-acento" data-c="${k}" style="${colorVars(k)}" aria-pressed="${colorUI(c.acento) === k}" aria-label="${k}"></button>`).join("")}</div>
      <p class="cfg-note">La vista se actualiza al elegir; para conservarlo, presiona «Guardar configuración».</p></div></section>` + savebar;
  } else if (sec === "seguridad") {
    panel = `<section class="grp"><h2>Mi cuenta</h2><p class="hint">Sesión iniciada como ${esc(S.user.nombre)} (${esc(S.user.correo)}).</p><div class="card" style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn sec sm" data-act="cambiar-pass">${glifo("candado")}Cambiar mi contraseña</button><button class="btn sec sm" data-act="cerrar-sesion">${glifo("unlock")}Cerrar sesión</button></div></section>
    <section class="grp"><h2>Usuarios y accesos</h2><p class="hint">Crea cuentas, restablece contraseñas y bloquea accesos.</p><div class="card"><a class="btn sec sm" href="#/admin/usuarios">Administrar usuarios</a>
      <ul style="margin:14px 0 0;padding-left:18px;color:var(--label-2);font-size:14px;display:grid;gap:4px"><li>Se entra con correo y contraseña (mínimo 8 caracteres, con letras y números).</li><li>Tras 5 intentos fallidos, el correo se bloquea 5 minutos en ese dispositivo.</li><li>Las contraseñas temporales se deben cambiar al primer inicio de sesión.</li><li>Las contraseñas se guardan cifradas, nunca en texto claro.</li><li>Tres tipos de acceso: visitante, colaborador y superadministrador. El superadministrador crea y elimina usuarios directamente desde «Usuarios».</li></ul></div></section>`;
  } else {
    panel = `<section class="grp"><h2>Copia y publicación</h2><p class="hint">Carga una copia, consulta cómo publicar o vuelve a la versión publicada. El archivo del catálogo incluye las cuentas de usuario (con contraseñas cifradas): publícalo solo en un sitio con acceso controlado.</p>
      <div class="card" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <div class="up"><input type="file" id="up-import" accept="application/json,.json" data-up="import"><label class="btn sec sm" for="up-import">${glifo("upload")}Cargar catálogo…</label></div>
        <button class="btn sec sm" data-act="como-publicar">Cómo publicar</button>
        ${S.pub && S.cat.editado ? `<button class="btn danger sm" data-act="descartar-local">Descartar mis cambios y usar el publicado</button>` : ""}
      </div></section>
    <section class="grp"><h2>Textos de los sistemas</h2><p class="hint">Aplica los textos resumidos (frase corta de máximo 5 palabras, texto destacado y descripción con negritas y guiones) a los sistemas del catálogo y agrega los que falten.</p><div class="card"><button class="btn sm" data-act="aplicar-textos">Actualizar textos de los sistemas</button> <button class="btn sm sec" data-act="formato-todos">Dar formato automático a todas las descripciones</button></div></section>
    <section class="grp"><h2>Contenido de ejemplo</h2><p class="hint">${ej ? `Hay ${ej} ${plural(ej, "sistema de ejemplo", "sistemas de ejemplo")} en el catálogo.` : "No hay sistemas de ejemplo."}</p>${ej ? `<div class="card"><button class="btn danger sm" data-act="quitar-ejemplos">${glifo("trash")}Quitar sistemas de ejemplo</button></div>` : ""}</section>`;
  }
  const nav = `<nav class="cfg-nav" aria-label="Secciones de configuración">${SECS.map(([k, l, ic]) => `<a href="#/admin/config/${k}"${k === sec ? ' aria-current="page"' : ""}>${glifo(ic)}${l}</a>`).join("")}</nav>`;
  return `<div class="cfg">${nav}<div class="cfg-body">${panel}</div></div>`;
}
function pasosSigue(c) {
  c = c || cfg();
  const dest = (c.correoOficio || "").trim();
  return [
    ["Envías el formulario", "Se genera tu folio con el formato SOL-AAAAMMDD-XXXX y la solicitud queda guardada en «Mis solicitudes» de este dispositivo."],
    ["Elaboras tu oficio", "Redacta un oficio de solicitud y cita tu folio, el sistema que solicitas y los datos de tu dependencia."],
    ["Lo envías por correo", dest ? `Envía tu oficio a ${dest}.` : "El correo al que debes enviar el oficio se te indicará en cuanto esté definido."],
    ["Siguiente paso", (c.reunion || "").trim() || "Revisamos tu oficio y coordinamos una reunión con tu dependencia para definir accesos y fechas de uso."]
  ];
}

/* ---------- Editor de sistema ---------- */
let navActual = false;
function vEditor(id) {
  const nuevo = id === "nuevo";
  let dr = S.drafts[id];
  if (!dr) {
    const base = nuevo ? sistemaBase({ nombre: "", publicado: false }) : byId(id);
    if (!base) return vNoEncontrado();
    dr = S.drafts[id] = { s: clone(base), nuevo, dirty: false };
  } else if (dr.dirty && navActual) dr.aviso = true;
  const s = dr.s;
  const inp = (p, label, o = {}) => `<div class="field ${o.full ? "full" : ""}"><label for="e-${p}">${label}${o.req ? ' <span class="req" aria-hidden="true">*</span>' : ""}</label><input id="e-${p}" type="${o.tipo || "text"}" data-path="${p}" value="${esc(getPath(s, p) ?? "")}" placeholder="${esc(o.ph || "")}" autocomplete="off">${o.hint ? `<span class="muted" style="font-size:12.5px">${o.hint}</span>` : ""}</div>`;
  const mini = (path, i, n) => `<div class="line" style="justify-content:flex-end;gap:2px"><button type="button" class="iconbtn" data-act="e-mover" data-path="${path}" data-i="${i}" data-d="-1" ${i === 0 ? "disabled" : ""} aria-label="Subir">${glifo("up")}</button><button type="button" class="iconbtn" data-act="e-mover" data-path="${path}" data-i="${i}" data-d="1" ${i === n - 1 ? "disabled" : ""} aria-label="Bajar">${glifo("down")}</button><button type="button" class="iconbtn bad" data-act="e-del" data-path="${path}" data-i="${i}" aria-label="Quitar">${glifo("trash")}</button></div>`;
  const lista = (path, render, add) => `${s[path].map((it, i) => `<div class="ed-item">${render(it, i)}${mini(path, i, s[path].length)}</div>`).join("")}<button type="button" class="btn sec sm" data-act="e-add" data-path="${path}">${glifo("plus")}${add}</button>`;
  const field = (p, label, val, o = {}) => `<div class="field ${o.cls || ""}"><label for="e-${p}">${label}</label><input id="e-${p}" type="${o.tipo || "text"}" data-path="${p}" value="${esc(val ?? "")}" placeholder="${esc(o.ph || "")}" autocomplete="off"></div>`;
  const grp = (t, h, body) => `<section class="grp"><h2>${t}</h2>${h ? `<p class="hint">${h}</p>` : ""}<div class="card">${body}</div></section>`;
  const optSel = (arr, cur) => arr.map((o) => `<option ${o === cur ? "selected" : ""}>${esc(o)}</option>`).join("");
  const sinUsar = USOS_SUGERIDOS.filter((u) => !s.usos.includes(u));

  return `${navbar({ right: `<span class="badge ${dr.nuevo ? "acc" : ""}">${dr.nuevo ? "Nuevo sistema" : "Editando"}</span>` })}
  <header class="pagehead" style="padding-top:8px"><div><h1 class="large-title">${dr.nuevo ? "Nuevo sistema" : esc(s.nombre || "Editar sistema")}</h1><p class="lede">Lo que escribas aquí se muestra en la ficha del sistema.</p></div></header>
  ${dr.aviso ? `<div class="note info" style="margin-top:14px">${glifo("info")}<div>Recuperamos cambios que no habías guardado. <button class="btn ghost sm" data-act="e-descartar">Descartarlos</button></div></div>` : ""}
  <div style="margin-top:22px">
  ${grp("Identidad", "El nombre y el icono son lo primero que ven las dependencias.", `<div class="fields">
      ${inp("nombre", "Nombre del sistema", { req: true, full: true, ph: "Ej. Sistema de Votación" })}
      ${inp("subtitulo", "Frase corta", { full: true, ph: "Ej. Cuenta quién votó en tus reuniones y eventos", hint: "Aparece bajo el nombre del sistema en el catálogo." })}
      <div class="field full"><span class="lbl">Icono</span>
        <div class="up" style="margin:6px 0 10px">${icono(s, "s96")}
          <div style="display:grid;gap:8px"><div class="up"><input type="file" id="up-icono" accept="image/*" data-up="icono"><label class="btn sec sm" for="up-icono">${glifo("upload")}Subir imagen</label>${imgOk(s.icono.imagen) ? `<button type="button" class="btn ghost sm" data-act="e-quitar-icono">Quitar imagen</button>` : ""}</div><span class="muted" style="font-size:12.5px">O elige un símbolo y un color. Mejor una imagen cuadrada.</span></div></div>
        <div class="glyphs" role="group" aria-label="Símbolo">${GLIFOS.map((g) => `<button type="button" data-act="e-glifo" data-g="${g}" aria-pressed="${s.icono.glifo === g}" aria-label="${g}">${glifo(g)}</button>`).join("")}</div>
        <div class="swatches" style="margin-top:12px" role="group" aria-label="Color">${COLORES_UI.map((c) => `<button type="button" data-act="e-color" data-c="${c}" style="${colorVars(c)}" aria-pressed="${colorUI(s.icono.color) === c}" aria-label="${c}"></button>`).join("")}</div></div>
      <div class="field full"><span class="lbl">Imagen de portada (opcional)</span><div class="up">${imgOk(s.portada) ? `<img src="${esc(s.portada)}" alt="" style="width:160px;border-radius:12px;aspect-ratio:16/11;object-fit:cover">` : ""}<input type="file" id="up-portada" accept="image/*" data-up="portada"><label class="btn sec sm" for="up-portada">${glifo("upload")}Subir portada</label>${imgOk(s.portada) ? `<button type="button" class="btn ghost sm" data-act="e-quitar-portada">Quitar</button>` : ""}<span class="muted" style="font-size:12.5px">Se usa en la tarjeta grande de la portada.</span></div></div>
    </div>`)}
  ${grp("Clasificación y estado", "", `<div class="fields">
      <div class="field full"><span class="lbl">Categorías</span><div class="selchips" role="group">${S.cat.categorias.map((k) => `<button type="button" class="chip txt" data-act="e-cat" data-id="${esc(k.id)}" aria-pressed="${s.categorias.includes(k.id)}">${esc(k.nombre)}</button>`).join("") || '<span class="muted">Crea categorías en Administración → Categorías.</span>'}</div></div>
      <div class="field full"><span class="lbl">Ideal para (etiquetas)</span>
        <div class="tagedit">${s.usos.map((u) => `<span class="chip txt">${esc(u)}<button type="button" data-act="tag-del" data-t="${esc(u)}" aria-label="Quitar ${esc(u)}">${glifo("x")}</button></span>`).join("")}</div>
        <div style="display:flex;gap:8px;margin-top:8px"><input id="tag-in" type="text" placeholder="Ej. Eventos, Reuniones, Trámites" aria-label="Nueva etiqueta" autocomplete="off"><button type="button" class="btn sec sm" data-act="tag-add">${glifo("plus")}Agregar</button></div>
        ${sinUsar.length ? `<div class="selchips" style="margin-top:8px">${sinUsar.slice(0, 8).map((u) => `<button type="button" class="chip txt" data-act="tag-add" data-t="${esc(u)}" style="font-size:13px;padding:5px 12px">+ ${esc(u)}</button>`).join("")}</div>` : ""}</div>
      <div class="field"><label for="e-tipoSis">Tipo</label><select class="select" id="e-tipoSis" data-path="tipoSis"><option value="" ${!s.tipoSis ? "selected" : ""}>Automático (${esc(TIPOS[tipoDe(Object.assign({}, s, { tipoSis: "" }))])})</option><option value="sistema" ${s.tipoSis === "sistema" ? "selected" : ""}>Sistema</option><option value="web" ${s.tipoSis === "web" ? "selected" : ""}>Portal / Sitio web</option></select><span class="muted" style="font-size:12.5px">Es lo que el visitante ve como «Sistema» o «Portal / Sitio web».</span></div>
      <div class="field"><label for="e-estado">Disponibilidad</label><select class="select" id="e-estado" data-path="estado">${optSel(ESTADOS, s.estado)}</select></div>
      ${inp("plataforma", "Plataforma", { ph: "Ej. Web · Tablets · Teléfonos" })}
      <div class="field full"><span class="lbl">Ligado con (opcional)</span><div class="selchips" role="group">${S.cat.sistemas.filter((x) => x.id !== s.id).map((x) => `<button type="button" class="chip txt" data-act="e-lig" data-id="${esc(x.id)}" aria-pressed="${(s.ligados || []).includes(x.id)}">${esc(x.nombre)} · ${esc(tipoNom(x))}</button>`).join("") || '<span class="muted">Aún no hay otros elementos.</span>'}</div><span class="muted" style="font-size:12.5px">Los que marques aparecen en la ficha como «Ligado con» (y en la ficha del otro también).</span></div>
      <label class="chk full"><input type="checkbox" data-path="publicado" ${s.publicado ? "checked" : ""}><span><b>Publicado</b> — visible para todas las dependencias</span></label>
      <label class="chk full"><input type="checkbox" data-path="destacado" ${s.destacado ? "checked" : ""}><span><b>Destacado</b> — aparece en la tarjeta grande de la portada</span></label>
      ${inp("etiqueta", "Texto sobre el título destacado", { full: true, ph: "Ej. Ya está disponible, Nuevo, Ideal para tu próximo evento" })}
      ${videoDestacadoEditor(s)}
    </div>`)}
  ${grp("Descripción", "Selecciona el texto y usa la barra para cambiar tamaño, color, negrita o poner viñetas. Separa párrafos con una línea en blanco.", editorDescripcion(s))}
  ${grp("Capturas de pantalla", "Imágenes y videos del sistema en uso. Se muestran en la galería «Vista previa» de la ficha.", `${s.capturas.length ? `<div class="ed-shots">${s.capturas.map((c, i) => `<div class="ed-shot">${imgOk(c.src) ? `<img src="${esc(c.src)}" alt="Captura ${i + 1}">` : ""}<input type="text" data-path="capturas.${i}.pie" value="${esc(c.pie || "")}" placeholder="Pie de foto (opcional)" aria-label="Pie de la captura ${i + 1}"><div class="acts"><span><button type="button" class="iconbtn" data-act="e-mover" data-path="capturas" data-i="${i}" data-d="-1" ${i === 0 ? "disabled" : ""} aria-label="Mover antes">${glifo("back")}</button><button type="button" class="iconbtn" data-act="e-mover" data-path="capturas" data-i="${i}" data-d="1" ${i === s.capturas.length - 1 ? "disabled" : ""} aria-label="Mover después">${glifo("chev")}</button></span><button type="button" class="iconbtn bad" data-act="e-del" data-path="capturas" data-i="${i}" aria-label="Quitar captura ${i + 1}">${glifo("trash")}</button></div></div>`).join("")}</div>` : ""}
    <div class="dz" data-drop="captura"><div class="up" style="justify-content:center"><input type="file" id="up-captura" accept="image/*" multiple data-up="captura"><label class="btn sec sm" for="up-captura">${glifo("img")}Agregar imágenes</label></div><div style="margin-top:6px">o arrástralas aquí</div></div>${videosEditor(s)}`)}
  ${grp("Manual de uso", "Pasos para usar el sistema. Puedes adjuntar el manual completo en «Documentos».", lista("pasos", (p, i) => `<div class="field"><label class="sr" for="e-pasos.${i}">Paso ${i + 1}</label><input id="e-pasos.${i}" type="text" data-path="pasos.${i}" value="${esc(p)}" placeholder="Paso ${i + 1}" autocomplete="off"></div>`, "Agregar paso"))}
  ${grp("Requisitos", "Lo que necesita tener la dependencia para usarlo.", lista("requisitos", (p, i) => `<div class="field"><label class="sr" for="e-requisitos.${i}">Requisito ${i + 1}</label><input id="e-requisitos.${i}" type="text" data-path="requisitos.${i}" value="${esc(p)}" placeholder="Ej. Conexión a internet estable" autocomplete="off"></div>`, "Agregar requisito"))}
  ${grp("Ficha técnica", "Datos como capacidad, soporte, tiempo de implementación o idioma.", lista("tecnica", (t, i) => `<div class="grid2">${field(`tecnica.${i}.k`, "Dato", t.k, { ph: "Ej. Capacidad" })}${field(`tecnica.${i}.v`, "Valor", t.v, { ph: "Ej. Hasta 500 personas" })}</div>`, "Agregar dato"))}
  ${grp("Dependencias que lo usan", "Registra quién lo ha utilizado. Puedes agregar un comentario de su experiencia.", lista("dependencias", (d, i) => `<div class="grid2">${field(`dependencias.${i}.nombre`, "Dependencia", d.nombre, { ph: "Nombre de la dependencia" })}${field(`dependencias.${i}.desde`, "Desde", d.desde, { ph: "Ej. Marzo 2026" })}</div><div class="field"><label for="e-dependencias.${i}.nota">Comentario (opcional)</label><textarea id="e-dependencias.${i}.nota" data-path="dependencias.${i}.nota" style="min-height:70px">${esc(d.nota || "")}</textarea></div>`, "Agregar dependencia"))}
  ${grp("Novedades por versión", "La primera de la lista es la versión más reciente.", lista("novedades", (n, i) => `<div class="grid2">${field(`novedades.${i}.version`, "Versión", n.version, { ph: "Ej. 2.1" })}${field(`novedades.${i}.fecha`, "Fecha", n.fecha, { tipo: "date" })}</div><div class="field"><label for="e-novedades.${i}.notas">Qué cambió</label><textarea id="e-novedades.${i}.notas" data-path="novedades.${i}.notas" style="min-height:80px" placeholder="- Nueva función&#10;- Mejora de velocidad">${esc(n.notas || "")}</textarea></div>`, "Agregar versión"))}
  ${grp("Enlaces", "El enlace de tipo «Sistema» crea el botón «Abrir sistema».", lista("enlaces", (l, i) => `<div class="grid2">${field(`enlaces.${i}.etiqueta`, "Nombre", l.etiqueta, { ph: "Ej. Manual en línea" })}<div class="field"><label for="e-enlaces.${i}.tipo">Tipo</label><select class="select" id="e-enlaces.${i}.tipo" data-path="enlaces.${i}.tipo">${[["sistema", "Sistema"], ["manual", "Manual"], ["video", "Video"], ["otro", "Otro"]].map(([v, t]) => `<option value="${v}" ${l.tipo === v ? "selected" : ""}>${t}</option>`).join("")}</select></div></div>${field(`enlaces.${i}.url`, "Dirección (URL)", l.url, { tipo: "url", ph: "https://" })}`, "Agregar enlace"))}
  ${grp("Responsable y contacto", "Se muestra en «Contactar al área responsable».", `<div class="fields">${inp("contacto.correo", "Correo de contacto", { tipo: "email", ph: "sistemas@tudependencia.gob.mx" })}${inp("contacto.telefono", "Teléfono", { tipo: "tel" })}</div>`)}
  ${!dr.nuevo ? `<section class="grp"><h2>Zona de riesgo</h2><div class="card"><button type="button" class="btn danger" data-act="del-sistema" data-id="${esc(s.id)}">${glifo("trash")}Eliminar este sistema</button></div></section>` : ""}
  </div>
  <div class="savebar"><span class="muted" style="font-size:14px">${dr.dirty ? "Tienes cambios sin guardar." : "Sin cambios."}</span><span style="display:flex;gap:8px"><button type="button" class="btn sec" data-act="e-cancelar">Cancelar</button><button type="button" class="btn" data-act="e-guardar">Guardar</button></span></div>`;
}

/* ---------- Carga de imágenes y archivos ---------- */
const leer = (f) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => no(r.error); r.readAsDataURL(f); });
async function imagen(file, max, mime) {
  if (/svg|gif/.test(file.type)) return leer(file);
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
    const x = c.getContext("2d"); if (mime === "image/jpeg") { x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); }
    x.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL(mime, 0.86);
  } finally { URL.revokeObjectURL(url); }
}
const draftActual = () => { const [a, b, c] = hashParts(); return a === "admin" && b === "editar" ? S.drafts[c] : null; };

async function subirArchivos(kind, files) {
  const dr = draftActual();
  if (!dr && kind !== "logo") return;
  for (const f of files) {
    try {
      if (kind === "icono") { if (!/^image\//.test(f.type)) { toast("El icono debe ser una imagen."); continue; } dr.s.icono.imagen = await imagen(f, 512, "image/png"); }
      else if (kind === "portada") { if (!/^image\//.test(f.type)) { toast("La portada debe ser una imagen."); continue; } dr.s.portada = await imagen(f, 1600, "image/jpeg"); }
      else if (kind === "captura") { if (!/^image\//.test(f.type)) { toast(`«${f.name}» no es una imagen.`); continue; } dr.s.capturas.push({ src: await imagen(f, 1600, "image/jpeg"), pie: "" }); }
      else if (kind === "video" || kind === "videodest") {
        if (!/^video\/(mp4|webm|ogg|quicktime)$/.test(f.type)) { toast(`«${f.name}» no es un video compatible (usa MP4 o WebM).`); continue; }
        if (f.size > LIMITE_VIDEO) { toast(`«${f.name}» pesa más de ${bytes(LIMITE_VIDEO)}. Mejor pega un enlace de YouTube.`); continue; }
        const dato = await leer(f);
        if (kind === "videodest") dr.s.videoDestacado = { url: "", data: dato, nombre: f.name };
        else { if (!Array.isArray(dr.s.videos)) dr.s.videos = []; dr.s.videos.push({ id: uid("vid"), url: "", data: dato, nombre: f.name, pie: "" }); }
      }
      else if (kind === "archivo") {
        if (f.size > LIMITE_ARCHIVO) { toast(`«${f.name}» pesa más de ${bytes(LIMITE_ARCHIVO)}.`); continue; }
        dr.s.archivos.push({ id: uid("arc"), nombre: f.name, tipo: f.type || "", tamano: f.size, categoria: /\.pdf$/i.test(f.name) ? "Manual" : "Otro", descripcion: "", data: await leer(f) });
      }
      else if (kind === "logo") { if (!/^image\//.test(f.type)) { toast("El logotipo debe ser una imagen."); continue; } S.cfgDraft.logo = await imagen(f, 256, "image/png"); }
      if (dr) dr.dirty = true;
    } catch (e) { toast(`No se pudo leer «${f.name}».`); }
  }
  keep(() => render(false));
}
async function importarCatalogo(file) {
  try {
    const j = JSON.parse(await file.text());
    if (!catValido(j)) throw new Error("formato");
    const ok = await confirmar({ titulo: "Reemplazar el catálogo", texto: `Se cargarán ${j.sistemas.length} sistemas y reemplazarán a los actuales en este navegador.`, si: "Reemplazar", peligro: true });
    if (!ok) return;
    S.cat = migrar(j); S.drafts = {}; S.cfgDraft = null; guardarCatalogo(); revalidarSesion(); toast("Catálogo cargado"); render(false);
  } catch (e) { toast("Ese archivo no parece un catálogo válido."); }
}
function descargar(url, nombre) { const a = document.createElement("a"); a.href = url; a.download = nombre; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove(); }

function guardarDraft() {
  const [, , id] = hashParts(), dr = S.drafts[id];
  if (!dr) return;
  const s = dr.s, errs = [];
  if (!s.nombre.trim()) errs.push("El nombre del sistema es obligatorio.");
  s.enlaces.forEach((l) => { if (l.url && !urlOk(l.url)) errs.push(`La dirección «${l.url}» debe empezar con http:// o https://`); });
  if (s.contacto.correo && !correoOk(s.contacto.correo)) errs.push("El correo de contacto no es válido.");
  if (errs.length) { toast(errs[0]); return; }
  s.nombre = s.nombre.trim();
  s.pasos = s.pasos.map((x) => x.trim()).filter(Boolean);
  s.requisitos = s.requisitos.map((x) => x.trim()).filter(Boolean);
  s.tecnica = s.tecnica.filter((t) => t.k.trim() || t.v.trim());
  s.dependencias = s.dependencias.filter((d) => d.nombre.trim());
  s.novedades = s.novedades.filter((n) => n.version.trim() || n.notas.trim());
  s.enlaces = s.enlaces.filter((l) => l.url.trim()).map((l) => Object.assign(l, { url: urlOk(l.url) }));
  s.usos = [...new Set(s.usos.map((u) => u.trim()).filter(Boolean))];
  s.videos = (s.videos || []).filter((v) => videoInfo(v));
  if (!videoInfo(s.videoDestacado)) s.videoDestacado = { url: "", data: "", nombre: "" };
  else if (s.videoDestacado.url) s.videoDestacado.url = urlOk(s.videoDestacado.url);
  s.descTam = String(TAM_BASE.includes(+s.descTam) ? +s.descTam : 16); if (!/^#[0-9a-fA-F]{6}$/.test(s.descColor || "")) s.descColor = "";
  s.ejemplo = false;
  if (dr.nuevo) S.cat.sistemas.push(s); else { const i = S.cat.sistemas.findIndex((x) => x.id === s.id); if (i >= 0) S.cat.sistemas[i] = s; }
  guardarCatalogo(); delete S.drafts[id]; toast("Sistema guardado"); go("sistema/" + enc(s.id));
}

/* ---------- Acceso rápido de administrador y cambio de imagen ---------- */
function abrirImagenSistema(id) {
  const s = byId(id); if (!s) return;
  const tieneIc = imgOk(s.icono.imagen), tienePo = imgOk(s.portada);
  const fila = (k, tit, ayuda, vista, tiene) => `<div class="cur">${vista}<div><b>${tit}</b><small>${ayuda}</small>
    <div class="up"><input type="file" id="up-q-${k}" accept="image/*" data-up2="${k}" data-id="${esc(s.id)}"><label class="btn sec sm" for="up-q-${k}">${glifo("upload")}${tiene ? "Reemplazar" : "Subir imagen"}</label>${tiene ? `<button type="button" class="btn ghost sm" data-act="img-quitar" data-k="${k}" data-id="${esc(s.id)}">Quitar</button>` : ""}</div></div></div>`;
  modal({
    titulo: "Cambiar imagen · " + s.nombre, wide: true,
    body: `<div class="imgmod">
      ${fila("icono", "Icono del sistema", "Aparece en listas, tarjetas y la ficha. Lo ideal es una imagen cuadrada.", icono(s, "s96"), tieneIc)}
      ${fila("portada", "Imagen de portada", "Se usa en las tarjetas destacadas de la pantalla de inicio (formato horizontal).", tienePo ? `<img class="port" src="${esc(s.portada)}" alt="">` : `<span class="port">${glifo("img")}</span>`, tienePo)}
      <p class="cfg-note" style="margin-top:16px">Para cambiar el símbolo, el color o cualquier otro dato, usa «Editar información».</p></div>`,
    pie: `<button class="btn" data-act="cerrar-modal">Listo</button>`
  });
}
async function subirImagenRapida(kind, id, f) {
  const s = byId(id); if (!s) return;
  if (!/^image\//.test(f.type)) { toast("El archivo debe ser una imagen."); return; }
  try {
    if (kind === "icono") s.icono.imagen = await imagen(f, 512, "image/png");
    else s.portada = await imagen(f, 1600, "image/jpeg");
    guardarCatalogo(); toast("Imagen actualizada"); cerrarModal(); render(false); abrirImagenSistema(id);
  } catch (e) { toast("No se pudo leer la imagen."); }
}

/* ---------- Modo de pruebas (QA) ---------- */
const qaBanner = () => `<div class="note warn" style="margin-bottom:14px">${glifo("warn")}<div><b>MODO PRUEBAS.</b> Nada de lo que hagas se guarda y los correos solo se simulan.<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><a class="btn sm sec" href="#/admin/qa">Panel QA</a><button class="btn sm danger" data-act="qa-salir">Salir y descartar</button></div></div></div>`;
async function activarQA() {
  if (S.qa) return;
  if (guardadoPend) { clearTimeout(tGuardar); guardadoPend = false; await IDB.set("catalogo", S.cat); }
  S.qaSnap = { cat: clone(S.cat), sols: clone(S.sols) }; S.qaLog = []; S.qaRes = null; S.qa = true;
  toast("Modo pruebas activado: nada se guardará"); render(false);
}
function restaurarQA(soloDatos) {
  const sn = S.qaSnap; if (!sn) { S.qa = false; return; }
  S.cat = soloDatos ? clone(sn.cat) : sn.cat; S.sols = soloDatos ? clone(sn.sols) : sn.sols;
  S.drafts = {}; S.cfgDraft = null; S.qaLog = [];
  if (!soloDatos) { S.qa = false; S.qaSnap = null; S.qaRes = null; }
  revalidarSesion();
}
function salirQA() { restaurarQA(false); toast("Saliste del modo pruebas. Se descartó todo lo de prueba."); irA("admin/qa"); }
async function cargarDatosPrueba() {
  if (!S.qa) return;
  const kId = uid("cat");
  S.cat.categorias.push({ id: kId, nombre: "[PRUEBA] Categoría", glifo: "estrella", color: "naranja" });
  const mk = (o) => sistemaBase(Object.assign({ prueba: true, ejemplo: false, categorias: [kId], usos: ["Pruebas"], version: "0.1", actualizado: hoyISO(), area: "Equipo QA", contacto: { correo: "qa@ejemplo.com", telefono: "" } }, o));
  const completo = mk({ nombre: "[PRUEBA] Sistema completo", subtitulo: "Con enlace, requisitos y capturas", icono: { glifo: "rayo", color: "verde", imagen: "" }, destacado: true,
    descripcion: "Sistema ficticio para probar la ficha, la solicitud y la lista de verificación.", requisitos: ["Requisito de prueba 1", "Requisito de prueba 2", "Clave de acceso (API) entregada"],
    pasos: ["Paso de prueba 1", "Paso de prueba 2"], enlaces: [{ etiqueta: "Abrir el sistema", url: "https://example.com/prueba", tipo: "sistema" }], capturas: capturas("verde", "Prueba") });
  S.cat.sistemas.push(completo,
    mk({ nombre: "[PRUEBA] Sin enlace", subtitulo: "Para probar el aviso de enlace faltante", enlaces: [], requisitos: [] }),
    mk({ nombre: "[PRUEBA] En mantenimiento", subtitulo: "Botón de solicitar desactivado", estado: "En mantenimiento" }),
    mk({ nombre: "[PRUEBA] Requiere validación", subtitulo: "Muestra el aviso de validación", estado: "Requiere validación", requisitos: ["Visto bueno de TI"] }));
  for (const [correo, nombre, rol] of [["qa.colaborador@ejemplo.com", "QA Colaborador", "gestor"], ["qa.visitante@ejemplo.com", "QA Visitante", "visitante"]]) {
    if (buscarPorCorreo(correo)) continue;
    const salt = nuevoSalt();
    S.cat.usuarios.push({ id: uid("usr"), nombre, correo, dependencia: "Pruebas", cargo: "QA", telefono: "", rol, estado: "activo", salt, hash: await hashClave("Prueba1234", salt), debeCambiar: false, creado: hoyISO(), prueba: true });
  }
  const d = new Date();
  S.sols.unshift({ id: uid("sol"), folio: "SOL-PRUEBA-" + Math.random().toString(36).slice(2, 6).toUpperCase(), fecha: hoyISO(), hora: `${pad(d.getHours())}:${pad(d.getMinutes())}`, prueba: true,
    sistemas: [{ id: completo.id, nombre: completo.nombre, version: completo.version, requisitos: completo.requisitos.slice() }], base: baseReqs(), checks: {}, listo: false,
    datos: { dependencia: "Dependencia de prueba", area: "", nombre: "Persona de prueba", cargo: "Titular", correo: "prueba@ejemplo.com", telefono: "5512345678", contactoPref: "Correo electrónico", horario: "", tipoUso: "Prueba o demostración", fechaUso: "", participantes: "", mensaje: "Solicitud ficticia." },
    estado: "guardada", canal: "" });
  toast("Datos de prueba cargados"); render(false);
}
async function correrQA() {
  const R = [], add = (estado, titulo, detalle = "") => R.push({ estado, titulo, detalle });
  const t = async (titulo, fn) => { try { await fn(); } catch (e) { add("bad", titulo, "Error: " + (e && e.message ? e.message : e)); } };
  await t("Almacenamiento", () => add(S.memoria ? "bad" : "ok", "Almacenamiento del navegador", S.memoria ? "No se pueden guardar datos (ventana privada o bloqueado)." : "Disponible."));
  await t("Validaciones", () => { const v = [normCorreo(" A@B.com ") === "a@b.com", !correoOk("123"), claveOk("Clave1234"), !claveOk("corta1"), correoOk("a@b.com"), !correoOk("a@b"), urlOk("https://x.com") !== "", urlOk("javascript:alert(1)") === ""], n = v.filter(Boolean).length; add(n === v.length ? "ok" : "bad", "Validaciones (correo, contraseña, URL)", `${n} de ${v.length} correctas.`); });
  await t("Cifrado", async () => { const a = await hashClave("Prueba1234", "sal-a"), b = await hashClave("Prueba1234", "sal-a"), c = await hashClave("Prueba1234", "sal-b"), d = await hashClave("Otra12345", "sal-a"); add(a === b && a !== c && a !== d ? "ok" : "bad", "Cifrado de contraseñas", a === b && a !== c && a !== d ? "Mismo dato da el mismo resultado; cambia con otra sal u otra contraseña." : "El cifrado no es consistente."); });
  await t("Códigos", () => { const c = Array.from({ length: 50 }, nuevoCodigo); const ok = c.every((x) => /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(x)) && new Set(c).size === 50 && normCodigo("ab-cd 12") === "ABCD12"; add(ok ? "ok" : "bad", "Códigos de autorización", ok ? "Formato XXXX-XXXX y sin repeticiones en 50 pruebas." : "El formato o la unicidad fallaron."); });
  await t("Permisos", () => { const a0 = S.admin, s0 = S.super, r = {}; ["visitante", "gestor", "superadmin"].forEach((x) => { aplicarRol({ rol: x }); r[x] = S.admin + "," + S.super; }); S.admin = a0; S.super = s0; const ok = r.visitante === "false,false" && r.gestor === "true,false" && r.superadmin === "true,true" && rolDe("admin") === "superadmin" && rolDe("usuario") === "visitante"; add(ok ? "ok" : "bad", "Permisos por tipo de acceso", ok ? "Visitante sin acceso, colaborador sin usuarios/configuración, superadministrador con todo." : JSON.stringify(r)); });
  await t("Usuarios", () => {
    const U = S.cat.usuarios, sa = U.filter((u) => rolDe(u.rol) === "superadmin" && u.estado === "activo").length, rf = U.map((u) => normCorreo(u.correo)), dup = rf.length - new Set(rf).size;
    add(sa ? "ok" : "bad", "Superadministrador activo", sa ? `${sa} activo(s).` : "No hay ningún superadministrador activo.");
    add(dup ? "bad" : "ok", "Correos repetidos", dup ? `${dup} repetido(s).` : "Sin repetidos.");
  });
  await t("Catálogo", () => {
    const Sx = S.cat.sistemas, ids = Sx.map((s) => s.id), kids = new Set(S.cat.categorias.map((k) => k.id));
    const sinNombre = Sx.filter((s) => !String(s.nombre).trim()).length, dupId = ids.length - new Set(ids).size;
    const huerf = Sx.reduce((n, s) => n + s.categorias.filter((c) => !kids.has(c)).length, 0);
    const pub = Sx.filter((s) => s.publicado && !s.prueba), sinLink = pub.filter((s) => !s.enlaces.some((l) => l.tipo === "sistema" && urlOk(l.url)));
    const urlMal = Sx.reduce((n, s) => n + s.enlaces.filter((l) => l.url && !urlOk(l.url)).length, 0);
    const kn = S.cat.categorias.map((k) => norm(k.nombre)), kdup = kn.length - new Set(kn).size, vacias = S.cat.categorias.filter((k) => !Sx.some((s) => s.categorias.includes(k.id))).length;
    add(sinNombre || dupId ? "bad" : "ok", "Sistemas válidos", sinNombre || dupId ? `${sinNombre} sin nombre, ${dupId} con id repetido.` : `${Sx.length} sistemas con nombre e id únicos.`);
    add(huerf ? "bad" : "ok", "Categorías de cada sistema", huerf ? `${huerf} referencia(s) a categorías que ya no existen.` : "Todas existen.");
    add(sinLink.length ? "warn" : "ok", "Enlace «Abrir sistema»", sinLink.length ? `Faltan en: ${sinLink.map((s) => s.nombre).join(", ")}.` : "Todos los sistemas publicados tienen enlace válido.");
    add(urlMal ? "bad" : "ok", "Direcciones (URL)", urlMal ? `${urlMal} enlace(s) con dirección inválida.` : "Todas válidas.");
    add(kdup ? "warn" : "ok", "Nombres de categorías", kdup ? `${kdup} nombre(s) repetido(s).` : "Sin repetidos.");
    add(vacias ? "warn" : "ok", "Categorías vacías", vacias ? `${vacias} sin sistemas.` : "Todas tienen sistemas.");
    const ej = Sx.filter((s) => s.ejemplo).length; add(ej ? "warn" : "ok", "Sistemas de ejemplo", ej ? `${ej} visibles. Quítalos antes de usarlo en producción.` : "Ninguno.");
  });
  await t("Configuración", () => {
    const c = cfg();
    add(correoOk(c.correoAdmin) ? "ok" : "ok", "Registros de usuarios", "Llegan como notificaciones dentro del sistema (campana); no requieren correo.");
    add(correoOk(c.correoOficio) ? "ok" : "warn", "Correo para el oficio", correoOk(c.correoOficio) ? c.correoOficio : "Sin definir: los solicitantes verán «por confirmar».");
    add(baseReqs().length ? "ok" : "warn", "Requisitos generales", baseReqs().length ? `${baseReqs().length} requisitos.` : "No hay requisitos generales.");
  });
  await t("Solicitud simulada", () => {
    const f = { id: "x", folio: "SOL-TEST", fecha: hoyISO(), hora: "10:00", sistemas: [{ id: "x1", nombre: "Sis", version: "1", requisitos: ["a", "b"] }], base: ["g"], checks: { _base: [true], x1: [true, false] }, datos: { dependencia: "D", nombre: "N", cargo: "C", correo: "a@b.com", telefono: "5512345678", contactoPref: "Correo electrónico", tipoUso: "Otro", mensaje: "m" } };
    const p1 = progreso(f), m = armarMensaje(f); f.checks.x1 = [true, true]; const p2 = progreso(f);
    const ok = p1.t === 3 && p1.h === 2 && !p1.ok && p2.ok && m.includes("SOL-TEST") && avisoListo(f).includes("REQUISITOS COMPLETOS");
    add(ok ? "ok" : "bad", "Solicitud y lista de verificación", ok ? "El mensaje se arma y el avance se calcula bien." : "El cálculo o el mensaje fallaron.");
  });
  await t("Pantallas", () => {
    const fallas = [], prueba = (n, fn) => { try { const h = fn(); if (typeof h !== "string" || !h.length) fallas.push(n); } catch (e) { fallas.push(n); } };
    prueba("Inicio", vHome); prueba("Sistemas", vSistemas); prueba("Categorías", vCategorias); prueba("Ayuda", vAyuda); prueba("Solicitudes", vSolicitudes);
    S.cat.sistemas.forEach((s) => prueba("Ficha " + s.nombre, () => vFicha(s.id)));
    S.cat.categorias.forEach((k) => prueba("Categoría " + k.nombre, () => vLista("categoria", k.id)));
    add(fallas.length ? "bad" : "ok", "Pantallas sin errores", fallas.length ? "Fallan: " + fallas.join(", ") : `${5 + S.cat.sistemas.length + S.cat.categorias.length} pantallas generadas correctamente.`);
  });
  add(S.qa ? "ok" : "warn", "Envío de correos", S.qa ? "Simulado en modo pruebas (ver «Correos simulados»)." : "No probado: la revisión no envía correos reales. Pruébalo enviando una solicitud real.");
  S.qaRes = { fecha: new Date().toLocaleString("es-MX"), items: R }; render(false);
}
function vAdminQA() {
  const item = (e, t, d) => `<div class="chk-item"><span class="dot ${e}">${glifo(e === "ok" ? "check" : "warn")}</span><div class="t"><b>${esc(t)}</b><small>${esc(d)}</small></div></div>`;
  const R = S.qaRes, n = (e) => (R ? R.items.filter((x) => x.estado === e).length : 0);
  const prueba = S.cat.sistemas.filter((s) => s.prueba).length;
  return `<section class="grp"><h2>Modo pruebas</h2><p class="hint">Es un espacio aparte: puedes crear, editar y borrar sin que nada se guarde. Los correos solo se simulan. Al salir, el catálogo queda exactamente como estaba.</p><div class="card">
    ${S.qa ? `<div class="note warn">${glifo("warn")}<div><b>Modo pruebas activo.</b> Todo lo que hagas se descartará al salir o al recargar la página.</div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn sm" data-act="qa-datos">${glifo("plus")}Cargar datos de prueba</button><button class="btn sm sec" data-act="qa-reiniciar">Reiniciar datos de prueba</button><button class="btn sm danger" data-act="qa-salir">Salir y descartar todo</button></div>
      ${prueba ? `<div class="kv" style="margin-top:12px"><div><span class="k">Colaborador de prueba</span><span class="v">qa.colaborador@ejemplo.com · contraseña Prueba1234</span></div><div><span class="k">Visitante de prueba</span><span class="v">qa.visitante@ejemplo.com · contraseña Prueba1234</span></div></div>` : `<p class="cfg-note" style="margin-top:12px">«Cargar datos de prueba» agrega sistemas, una categoría, usuarios y una solicitud ficticios para probar todo.</p>`}`
    : `<button class="btn" data-act="qa-activar">Activar modo pruebas</button><p class="cfg-note" style="margin-top:10px">Los cambios reales no se tocan mientras esté activo.</p>`}</div></section>
  <section class="grp"><h2>Revisión automática</h2><p class="hint">Comprueba validaciones, cifrado, permisos, datos del catálogo, configuración y que cada pantalla se genere sin errores. No cambia nada.</p><div class="card">
    <button class="btn sm" data-act="qa-correr">Ejecutar revisión</button>
    ${R ? `<p class="muted" style="margin:12px 0 4px;font-size:14px">${esc(R.fecha)} · <b>${n("ok")}</b> bien · <b>${n("warn")}</b> por revisar · <b>${n("bad")}</b> con falla</p>${R.items.map((x) => item(x.estado, x.titulo, x.detalle)).join("")}` : ""}</div></section>
  <section class="grp"><h2>Correos simulados</h2><p class="hint">Lo que se habría enviado durante esta sesión de pruebas.</p><div class="card">
    ${S.qaLog.length ? `<div class="qa-log">${S.qaLog.map((m) => `<details><summary><b>${esc(m.asunto)}</b> <span class="muted">→ ${esc(m.para)} · ${esc(m.fecha)}</span></summary><pre>${esc(Object.entries(m.campos).map(([k, v]) => k + ": " + v).join("\n"))}</pre></details>`).join("")}</div>` : `<p class="muted">${S.qa ? "Aún no se ha simulado ningún correo. Envía una solicitud o avisa que cumples requisitos." : "Activa el modo pruebas para ver aquí los correos simulados."}</p>`}</div></section>`;
}

/* ---------- Renombrar sistema y editar categorías ---------- */
const irA = (p) => { const igual = location.hash === "#/" + p; go(p); if (igual) render(false); };
function abrirRenombrarSistema(id) {
  const s = byId(id); if (!s) return;
  modal({
    titulo: "Cambiar nombre del sistema",
    body: `<form id="form-ren" data-id="${esc(s.id)}" novalidate style="display:grid;gap:12px"><div class="field"><label for="rn-nombre">Nombre</label><input id="rn-nombre" type="text" maxlength="80" value="${esc(s.nombre)}" autocomplete="off"></div>
      <div class="field"><label for="rn-sub">Frase corta (opcional)</label><input id="rn-sub" type="text" maxlength="140" value="${esc(s.subtitulo)}" autocomplete="off"></div><div class="err" id="rn-err" role="alert"></div></form>`,
    pie: `<button class="btn sec" data-act="cerrar-modal">Cancelar</button><button class="btn" type="submit" form="form-ren">Guardar</button>`
  });
}
function guardarRenombrar() {
  const f = $("#form-ren"), s = f && byId(f.dataset.id); if (!s || !S.admin) return;
  const n = val("rn-nombre"); if (n.length < 2) { $("#rn-err").textContent = "Escribe un nombre."; return; }
  s.nombre = n; s.subtitulo = val("rn-sub"); s.ejemplo = false;
  if (S.drafts[s.id] && !S.drafts[s.id].dirty) delete S.drafts[s.id];
  guardarCatalogo(); cerrarModal(); toast("Nombre actualizado"); render(false);
}
function catSwatches() {
  return COLORES_UI.map((c) => `<button type="button" class="sw2" data-act="ct-pick-c" data-c="${c}" style="${colorVars(c)}" aria-pressed="${colorUI(S.catDraft.color) === c}" aria-label="Color ${c}" title="${c[0].toUpperCase() + c.slice(1)}"></button>`).join("");
}
function catIconos() {
  return GLIFOS.map((g) => `<button type="button" class="icb" data-act="ct-pick-g" data-g="${g}" aria-pressed="${S.catDraft.glifo === g}" aria-label="Icono ${g}" title="${g[0].toUpperCase() + g.slice(1)}">${glifo(g)}</button>`).join("");
}
function catPrevio() {
  const d = S.catDraft;
  return `<span class="ico s64" style="${colorVars(d.color)}">${catInner(d)}</span>`;
}
function pintarCatEditor() {
  const a = $("#ct-prev"), b = $("#ct-colores"), c = $("#ct-iconos"), q = $("#ct-img-quitar");
  if (a) a.innerHTML = catPrevio(); if (b) b.innerHTML = catSwatches(); if (c) c.innerHTML = catIconos(); if (q) q.hidden = !imgOk(S.catDraft.imagen);
}
async function catImagenElegida(inp) {
  const f = inp.files && inp.files[0]; inp.value = ""; if (!f) return;
  if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(f.type)) return toast("Usa una imagen PNG, JPG, WebP o SVG.");
  if (f.size > 1024 * 1024) return toast("La imagen pesa más de 1 MB. Usa una más ligera.");
  try { S.catDraft.imagen = await leer(f); } catch (e) { return toast("No se pudo leer la imagen."); }
  pintarCatEditor();
}
function abrirCategoria(id) {
  const k = id ? catById(id) : null; if (id && !k) return;
  S.catDraft = { glifo: k && GLIFOS.includes(k.glifo) ? k.glifo : "app", color: k && COLORES[k.color] ? k.color : "azul", imagen: k && imgOk(k.imagen) ? k.imagen : "" };
  modal({
    titulo: k ? "Editar categoría" : "Nueva categoría",
    body: `<form id="form-cat" data-id="${esc(id || "")}" novalidate><div class="fields"><div class="field full"><label for="ct-nombre">Nombre</label><input id="ct-nombre" type="text" maxlength="60" value="${esc(k ? k.nombre : "")}" autocomplete="off"></div>
      <div class="field full"><span class="lbl">Vista previa</span><div id="ct-prev">${catPrevio()}</div></div>
      <div class="field full"><span class="lbl">Color</span><div class="swgrid" id="ct-colores">${catSwatches()}</div></div>
      <div class="field full"><span class="lbl">Icono</span><div class="icogrid" id="ct-iconos">${catIconos()}</div></div>
      <div class="field full"><span class="lbl">Imagen de la categoría (opcional)</span><div class="up"><input type="file" id="ct-img" accept="image/png,image/jpeg,image/webp,image/svg+xml"><label class="btn sec sm" for="ct-img">${glifo("upload")}Cambiar imagen</label><button type="button" class="btn ghost sm" id="ct-img-quitar" data-act="ct-img-quitar" ${S.catDraft.imagen ? "" : "hidden"}>Quitar imagen</button></div><span class="muted" style="font-size:12.5px">Si subes una imagen, se muestra en lugar del icono (máx. 1 MB).</span></div></div>
      <div class="err" id="ct-err" role="alert" style="margin-top:10px"></div></form>`,
    pie: `<button class="btn sec" data-act="cerrar-modal">Cancelar</button><button class="btn" type="submit" form="form-cat">Guardar</button>`
  });
}
function guardarCategoria() {
  if (!S.admin) return;
  const f = $("#form-cat"), id = f.dataset.id, nombre = val("ct-nombre"), er = $("#ct-err"), dr = S.catDraft || {};
  if (nombre.length < 2) { er.textContent = "Escribe un nombre para la categoría."; return; }
  if (S.cat.categorias.some((x) => x.id !== id && norm(x.nombre) === norm(nombre))) { er.textContent = "Ya existe una categoría con ese nombre."; return; }
  const d = { nombre, glifo: GLIFOS.includes(dr.glifo) ? dr.glifo : "app", color: COLORES[dr.color] ? dr.color : "azul", imagen: imgOk(dr.imagen) ? dr.imagen : "" };
  if (id) Object.assign(catById(id), d); else S.cat.categorias.push(Object.assign({ id: uid("cat") }, d));
  guardarCatalogo(); cerrarModal(); toast(id ? "Categoría actualizada" : "Categoría creada"); render(false);
}

/* ---------- Acciones ---------- */
function mover(arr, i, d) { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; }
const PLANTILLAS = {
  pasos: () => "", requisitos: () => "", tecnica: () => ({ k: "", v: "" }), dependencias: () => ({ nombre: "", desde: "", nota: "" }),
  novedades: () => ({ version: "", fecha: hoyISO(), notas: "" }), enlaces: () => ({ etiqueta: "", url: "", tipo: "otro" })
};
function agregarTag(t) {
  const dr = draftActual(); if (!dr) return;
  const v = (t || ($("#tag-in") || {}).value || "").trim();
  if (!v) return;
  if (!dr.s.usos.some((u) => u.toLowerCase() === v.toLowerCase())) dr.s.usos.push(v);
  dr.dirty = true; keep(() => render(false));
  const i = $("#tag-in"); if (i) i.focus();
}
function abrirArchivo(a) {
  if (!a) return;
  if (/^image\//.test(a.tipo || "") && imgOk(a.data)) { abrirLightbox([{ src: a.data, pie: a.nombre }], 0); return; }
  const b = dataToBlob(a.data); if (!b) { toast("No se pudo abrir el archivo."); return; }
  const url = URL.createObjectURL(b);
  const w = window.open(url, "_blank");
  if (!w) descargar(url, a.nombre);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

const ACT = {
  back() { if (history.length > 1) history.back(); else go(""); },
  solicitar(t) { go("solicitar/" + enc(t.dataset.id)); },
  compartir(t) { copiar(location.href.split("#")[0] + "#/sistema/" + enc(t.dataset.id), "Enlace copiado"); },
  copiar(t) { copiar(t.dataset.v, "Copiado"); },
  "toggle-desc"(t) { const d = $("#desc"); if (!d) return; d.classList.toggle("open"); t.textContent = d.classList.contains("open") ? "menos" : "más"; },
  lightbox(t) { const s = byId(t.dataset.id); if (!s) return; const items = s.capturas.filter((c) => imgOk(c.src)); abrirLightbox(items, +t.dataset.i); },
  "cv-next"(t) { const g = $(".cv-grid, .chips", t.closest(".cv-wrap")); if (g) g.scrollBy({ left: g.clientWidth + 20, behavior: "smooth" }); },
  "fc-prev"(t) { const r = $(".feat-row", t.closest(".fc")); if (r) r.scrollBy({ left: -fcPaso(r), behavior: "smooth" }); },
  "fc-next"(t) { const r = $(".feat-row", t.closest(".fc")); if (r) r.scrollBy({ left: fcPaso(r), behavior: "smooth" }); },
  "fc-go"(t) { const r = $(".feat-row", t.closest(".fc")); if (r) r.scrollTo({ left: Number(t.dataset.i) * fcPaso(r), behavior: "smooth" }); },
  "cv-prev"(t) { const g = $(".cv-grid, .chips", t.closest(".cv-wrap")); if (g) g.scrollBy({ left: -(g.clientWidth + 20), behavior: "smooth" }); },
  "gal-prev"(t) { const g = $(".gallery", t.closest(".gal-wrap")); if (g) g.scrollBy({ left: -galPaso(g), behavior: "smooth" }); },
  "gal-next"(t) { const g = $(".gallery", t.closest(".gal-wrap")); if (g) g.scrollBy({ left: galPaso(g), behavior: "smooth" }); },
  "lb-cerrar": cerrarLightbox,
  "lb-prev"() { if (lb) { lb.i = (lb.i - 1 + lb.items.length) % lb.items.length; pintarLightbox(); } },
  "lb-next"() { if (lb) { lb.i = (lb.i + 1) % lb.items.length; pintarLightbox(); } },
  historial(t) {
    const s = byId(t.dataset.id); if (!s) return;
    modal({ titulo: "Historial de versiones", wide: true, body: `<ul class="hist">${s.novedades.map((n) => `<li><div class="h"><b>Versión ${esc(n.version)}</b><span>${esc(fmtFecha(n.fecha))}</span></div><div class="prose">${rich(n.notas)}</div></li>`).join("")}</ul>`, pie: `<button class="btn" data-act="cerrar-modal">Cerrar</button>` });
  },
  contacto(t) {
    const s = byId(t.dataset.id); if (!s) return;
    const prob = !!t.dataset.problema, c = cfg(), correo = s.contacto.correo, tel = s.contacto.telefono || c.telefono;
    const asunto = (prob ? "Problema con " : "Consulta sobre ") + s.nombre;
    modal({
      titulo: prob ? "Reportar un problema" : "Contactar al área",
      body: `<div class="kv"><div><span class="k">Área</span><span class="v">${esc(s.area || c.organizacion)}</span></div><div><span class="k">Sistema</span><span class="v">${esc(s.nombre)}</span></div>${correo ? `<div><span class="k">Correo</span><span class="v" style="user-select:all">${esc(correo)}</span></div>` : ""}${tel ? `<div><span class="k">Teléfono</span><span class="v" style="user-select:all">${esc(tel)}</span></div>` : ""}</div>${correo || tel ? "" : `<p class="muted">Todavía no hay datos de contacto registrados para este sistema.</p>`}`,
      pie: correo ? `<button class="btn sec" data-act="copiar" data-v="${esc(correo)}">${glifo("copy")}Copiar correo</button><a class="btn" href="mailto:${esc(correo)}?subject=${enc(asunto)}">${glifo("correo")}Escribir</a>` : `<button class="btn" data-act="cerrar-modal">Cerrar</button>`
    });
  },
  "ver-archivo"(t) { const s = byId(t.dataset.id); abrirArchivo(s && s.archivos.find((x) => x.id === t.dataset.fid)); },
  "bajar-archivo"(t) { const s = byId(t.dataset.id), a = s && s.archivos.find((x) => x.id === t.dataset.fid); if (!a) return; const b = dataToBlob(a.data); if (!b) return toast("No se pudo descargar el archivo."); const u = URL.createObjectURL(b); descargar(u, a.nombre); setTimeout(() => URL.revokeObjectURL(u), 5000); },
  "filtro-cat"(t) { F2.cat = t.dataset.id; render(false); },
  "filtro-tipo"(t) { F2.tipo = t.dataset.id; render(false); },

  /* solicitud */
  "quitar-sel"(t) { F.sel = F.sel.filter((x) => x !== t.dataset.id); keep(() => render(false)); },
  "add-sel"(t) { if (!F.sel.includes(t.dataset.id)) F.sel.push(t.dataset.id); keep(() => render(false)); },
  "copiar-sol"(t) { const s = S.sols.find((x) => x.id === t.dataset.id); if (s) copiar(`Folio: ${s.folio}\n\n${armarMensaje(s)}`, "Datos copiados"); },
  async "marcar-enviada"(t) { const s = S.sols.find((x) => x.id === t.dataset.id); if (!s) return; s.estado = "enviada"; s.canal = "correo"; await guardarSolicitudes(); toast("Marcada como enviada"); keep(() => render(false)); },
  async "cancelar-sol"(t) {
    const sol = S.sols.find((x) => x.id === t.dataset.id); if (!sol || sol.cancelada) return;
    if (!(await confirmar({ titulo: "Cancelar solicitud", texto: `Se marcará como cancelada la solicitud ${sol.folio} y se avisará al administrador. No se puede deshacer.`, si: "Sí, cancelar solicitud", no: "No, mantenerla", peligro: true }))) return;
    if (SB && sol.estado === "enviada") {
      let r; try { r = await SB.rpc("cancelar_solicitud", { p_folio: sol.folio }); } catch (e) { r = { error: e }; }
      const res = r && !r.error ? r.data : null;
      if (res === "no_cancelable") return toast("Esta solicitud ya está en atención y no se puede cancelar desde aquí. Contacta al administrador.");
      if (res !== "ok" && res !== "ya_cancelada") return toast("No se pudo cancelar en este momento. Inténtalo de nuevo o avisa al administrador.");
    }
    sol.cancelada = true; sol.canceladaFecha = hoyISO(); sol.estadoBan = "cancelada";
    if (!SB) { notificar("solicitud", `${sol.datos.nombre} canceló su solicitud de ${sol.sistemas.map((x) => x.nombre).join(", ")}`, { folio: sol.folio, nombre: sol.datos.nombre, correo: sol.datos.correo, telefono: sol.datos.telefono, dependencia: sol.datos.dependencia, area: sol.datos.area, cargo: sol.datos.cargo, sistemas: sol.sistemas.map((x) => x.nombre).join(", "), cancelada: true }); guardarCatalogo(); }
    await guardarSolicitudes(); toast("Solicitud cancelada"); keep(() => render(false));
  },

  gestionar(t) {
    const id = t.dataset.id, modo = t.dataset.modo;
    const ir = () => { if (modo === "info") go("admin/editar/" + enc(id)); else abrirImagenSistema(id); };
    if (S.admin) ir(); else toast("Solo el administrador puede editar el catálogo.");
  },
  "img-quitar"(t) {
    const s = byId(t.dataset.id); if (!s) return;
    if (t.dataset.k === "icono") s.icono.imagen = ""; else s.portada = "";
    guardarCatalogo(); toast("Imagen quitada"); cerrarModal(); render(false); abrirImagenSistema(s.id);
  },
  "cfg-tema"(t) { if (S.cfgDraft) { S.cfgDraft.tema = t.dataset.v; keep(() => render(false)); } },
  "cfg-acento"(t) { if (S.cfgDraft) { S.cfgDraft.acento = t.dataset.c; keep(() => render(false)); } },
  "probar-correo"() {
    const d = S.cfgDraft || cfg();
    if (!correoOk(d.correoOficio)) return toast("Escribe primero un correo válido.");
    window.open(gmailCompose(d.correoOficio, "Prueba del catálogo de sistemas", "Mensaje de prueba enviado desde la configuración del catálogo."), "_blank", "noopener");
  },
  /* administración */
  "admin-entry"() { go("admin"); },
  "mi-cuenta"() { abrirMiCuenta(); },
  "cambiar-pass"() { abrirCambiarClave(); },
  "cerrar-sesion"() { cerrarModal(); limpiarSesion(); location.hash = "#/"; render(false); toast("Sesión cerrada"); },
  "super-enviar"() { sbSuperEnviar(); },
  "codigo-enviar"() { sbCodigoEnviar(); },
  "google-login"() { sbGoogle(); },
  async "dep-add"() { if (!S.super) return; const i = $("#dep-nueva"), n = i ? i.value.trim() : ""; if (n.length < 2) { toast("Escribe el nombre de la dependencia."); return; } if (depsNombres().some((x) => norm(x) === norm(n))) { toast("Esa dependencia ya está en el registro."); return; } await depsRegistrar(n); toast("Dependencia registrada"); keep(() => render(false)); },
  "dep-ren"(t) { abrirRenDep(t.dataset.n); },
  async "dep-del"(t) { if (!(await confirmar({ titulo: "Eliminar dependencia", texto: `«${t.dataset.n}» dejará de aparecer en la lista. Las solicitudes y cuentas anteriores no se modifican.`, si: "Eliminar", peligro: true }))) return; if (await depsEliminar(t.dataset.n)) { toast("Dependencia eliminada"); keep(() => render(false)); } else toast("No se pudo eliminar."); },
  async "dep-reg"(t) { await depsRegistrar(t.dataset.n); keep(() => render(false)); },
  async "dep-import"() { for (const d of depsResumen().sin) await depsRegistrar(d.nombre); toast("Dependencias registradas"); keep(() => render(false)); },
  "auth-ir"(t) {
    const destino = t.dataset.v;
    if (!SB_ON && destino === "super" && normCorreo($("#a-correo")?.value || "") !== "delrivero25@gmail.com" && !["super", "codigo", "supercod"].includes(S.authView)) {
      toast("El acceso de Superadministrador está reservado al correo autorizado."); return;
    }
    S.authView = destino; render(false); const i = $("input", view); if (i) i.focus();
  },
  "auth-copiar"() { if (S.authInfo) copiar(`Para: ${S.authInfo.para}\nAsunto: ${S.authInfo.asunto}\n\n${S.authInfo.cuerpo}`, "Mensaje copiado"); },
  "ver-pass"(t) { const i = $("input", t.closest(".pwrow")); if (!i) return; const ver = i.type === "password"; i.type = ver ? "text" : "password"; t.textContent = ver ? "Ocultar" : "Mostrar"; },
  "usr-nuevo"() { abrirCrearUsuario({}); },
  async "usr-super"(t) {
    const u = S.cat.usuarios.find((x) => x.id === t.dataset.id); if (!u) return;
    if (u.id === S.user.id) return toast("No puedes cambiar tu propio tipo de acceso.");
    const era = rolDe(u.rol) === "superadmin";
    if (era && esUltimoAdmin(u)) return toast("Debe existir al menos un superadministrador activo.");
    const ok = await confirmar(era
      ? { titulo: "Quitar superadministrador", texto: `${u.nombre} pasará a ser colaborador y ya no podrá administrar usuarios, configuración ni publicación.`, si: "Quitar", peligro: true }
      : { titulo: "Hacer superadministrador", texto: `${u.nombre} tendrá control total: usuarios, configuración y publicación.`, si: "Hacer superadministrador" });
    if (!ok) return;
    const nuevoRol = era ? "gestor" : "superadmin";
    if (SB_ON) { const r = await sbPerfilUpd(u.id, { rol: nuevoRol }); if (!r.ok) return toast(r.msg); u.rol = nuevoRol; toast(era ? "Ahora es colaborador" : "Ahora es superadministrador"); return keep(() => render(false)); }
    u.rol = nuevoRol; guardarCatalogo(); toast(era ? "Ahora es colaborador" : "Ahora es superadministrador"); keep(() => render(false));
  },
  "usr-gen"() { const i = $("#uc-pass"); if (i) i.value = claveTemporal(); },
  "usr-reset"(t) { abrirReset(t.dataset.id); },
  async "usr-reset-ok"(t) { await restablecerClave(t.dataset.id); },
  async "usr-toggle"(t) {
    const u = S.cat.usuarios.find((x) => x.id === t.dataset.id); if (!u) return;
    if (u.estado === "activo" && esUltimoAdmin(u)) return toast("No puedes bloquear al único administrador activo.");
    if (u.id === S.user.id) return toast("No puedes bloquear tu propio usuario.");
    const nuevoEst = u.estado === "activo" ? "bloqueado" : "activo";
    if (SB_ON) { const r = await sbPerfilUpd(u.id, { estado: nuevoEst }); if (!r.ok) return toast(r.msg); u.estado = nuevoEst; toast(nuevoEst === "activo" ? "Usuario activado" : "Usuario bloqueado"); return keep(() => render(false)); }
    u.estado = nuevoEst; guardarCatalogo(); toast(u.estado === "activo" ? "Usuario activado" : "Usuario bloqueado"); keep(() => render(false));
  },
  async "usr-del"(t) {
    const u = S.cat.usuarios.find((x) => x.id === t.dataset.id); if (!u) return;
    if (u.id === S.user.id) return toast("No puedes eliminar tu propio usuario.");
    if (esUltimoAdmin(u)) return toast("No puedes eliminar al único administrador activo.");
    if (!(await confirmar({ titulo: `Eliminar a ${u.nombre}`, texto: "Perderá el acceso al catálogo. Esta acción no se puede deshacer.", si: "Eliminar", peligro: true }))) return;
    if (SB_ON) { let r; try { r = await SB.from("perfiles").delete().eq("id", u.id).select("id"); } catch (e) { r = { error: e }; } if (!r || r.error || !r.data || !r.data.length) return toast("No se pudo eliminar: tu cuenta no tiene permiso. Ejecuta supabase-roles.sql en Supabase."); }
    S.cat.usuarios = S.cat.usuarios.filter((x) => x.id !== u.id); if (!SB_ON) guardarCatalogo(); toast("Usuario eliminado"); keep(() => render(false));
  },

  "toggle-pub"(t) { const s = byId(t.dataset.id); if (!s) return; s.publicado = !s.publicado; guardarCatalogo(); toast(s.publicado ? "Sistema publicado" : "Sistema oculto"); keep(() => render(false));
    if (s.publicado && S.super) setTimeout(async () => { if (await confirmar({ titulo: "¿Avisar a los usuarios?", texto: `Crea un aviso «Ya está disponible» para ${s.nombre}.`, si: "Crear aviso" })) abrirAviso(null, { tipo: "sistema", sistemaId: s.id, titulo: `Ya está disponible: ${s.nombre}`, mensaje: s.subtitulo || "", fijado: true }); }, 350); },
  mover(t) { const i = S.cat.sistemas.findIndex((s) => s.id === t.dataset.id); mover(S.cat.sistemas, i, +t.dataset.d); guardarCatalogo(); keep(() => render(false)); },
  duplicar(t) { const s = byId(t.dataset.id); if (!s) return; const c = clone(s); c.id = uid("sis"); c.nombre += " (copia)"; c.publicado = false; c.destacado = false; c.archivos.forEach((a) => (a.id = uid("arc"))); const i = S.cat.sistemas.indexOf(s); S.cat.sistemas.splice(i + 1, 0, c); guardarCatalogo(); toast("Sistema duplicado (oculto)"); keep(() => render(false)); },
  async "del-sistema"(t) {
    const s = byId(t.dataset.id); if (!s) return;
    if (!(await confirmar({ titulo: `Eliminar «${s.nombre}»`, texto: "Se borrará el sistema con todo su contenido y adjuntos. Esta acción no se puede deshacer.", si: "Eliminar", peligro: true }))) return;
    S.cat.sistemas = S.cat.sistemas.filter((x) => x.id !== s.id); delete S.drafts[s.id]; guardarCatalogo(); toast("Sistema eliminado"); irA("admin");
  },
  async "aplicar-textos"() {
    if (!(await confirmar({ titulo: "Actualizar textos de los sistemas", texto: "Se actualizan nombre, frase corta, texto destacado y descripción de los sistemas que coincidan por nombre, y se agregan los que falten. Íconos, enlaces, capturas, manuales y dependencias no se tocan.", si: "Actualizar" }))) return;
    let n1 = 0, n2 = 0;
    CATEGORIAS_BASE.forEach((k) => { if (!catById(k.id) && !(S.cat.categoriasEliminadas || []).includes(k.id) && TEXTOS_SISTEMAS.some((t) => t.categoria === k.id)) S.cat.categorias.push(clone(k)); });
    TEXTOS_SISTEMAS.forEach((t) => {
      const keys = t.alias.map(norm), s = S.cat.sistemas.find((x) => keys.includes(norm(x.nombre)));
      if (s) { Object.assign(s, { nombre: t.nombre, subtitulo: t.subtitulo, etiqueta: t.etiqueta, descripcion: t.descripcion, ejemplo: false }); if (!s.usos.length) s.usos = t.usos.slice(); if (!s.categorias.length) s.categorias = [t.categoria]; n1++; }
      else { S.cat.sistemas.push(sistemaBase({ id: t.id, nombre: t.nombre, subtitulo: t.subtitulo, etiqueta: t.etiqueta, descripcion: t.descripcion, categorias: [t.categoria], icono: { glifo: t.glifo, color: t.color, imagen: "" }, usos: t.usos.slice(), destacado: t.destacado, area: "Coordinación de Política Digital", plataforma: "Web" })); n2++; }
    });
    guardarCatalogo(); toast(`Listo: ${n1} actualizados y ${n2} agregados`); render(false);
  },
  async "quitar-ejemplos"() {
    if (!(await confirmar({ titulo: "Eliminar sistemas de ejemplo", texto: "Se quitarán todos los sistemas marcados como ejemplo. Tus propios sistemas no se tocan.", si: "Eliminar", peligro: true }))) return;
    S.cat.sistemas = S.cat.sistemas.filter((s) => !s.ejemplo); guardarCatalogo(); toast("Ejemplos eliminados"); render(false);
  },
  "add-cat"() { abrirCategoria(null); },
  async "del-cat"(t) {
    const k = catById(t.dataset.id); if (!k) return;
    if (!(await confirmar({ titulo: `Eliminar «${k.nombre}»`, texto: "Los sistemas de esta categoría no se borran, solo dejan de pertenecer a ella.", si: "Eliminar", peligro: true }))) return;
    S.cat.categorias = S.cat.categorias.filter((x) => x.id !== k.id); S.cat.categoriasEliminadas = [...new Set([...(S.cat.categoriasEliminadas || []), k.id])]; S.cat.sistemas.forEach((s) => (s.categorias = s.categorias.filter((c) => c !== k.id))); guardarCatalogo(); toast("Categoría eliminada"); if (hashParts()[0] === "categoria") go("categorias"); else keep(() => render(false));
  },
  async "guardar-cfg"() {
    const c = S.cfgDraft; if (!c) return;
    if (c.correoOficio && !correoOk(c.correoOficio)) return toast("El correo para el oficio no es válido.");
    Object.assign(S.cat.config, c, { correoOficio: (c.correoOficio || "").trim(), correoDestino: "", endpoint: "", nombre: c.nombre.trim() || CONFIG_BASE.nombre, organizacion: c.organizacion.trim() || CONFIG_BASE.organizacion });
    S.cat.config.tiempoRespuesta = (S.cat.config.tiempoRespuesta || "").trim(); S.cat.config.reunion = (S.cat.config.reunion || "").trim(); S.cat.config.horario = (S.cat.config.horario || "").trim();
    guardarCatalogo(); S.cfgDraft = null; aplicarApariencia(); toast("Configuración guardada"); render(false);
  },
  "quitar-logo"() { if (S.cfgDraft) { S.cfgDraft.logo = ""; keep(() => render(false)); } },
  "logo-marca"(t) { if (S.cfgDraft) { S.cfgDraft.logoMarca = t.dataset.v; S.cfgDraft.logo = ""; keep(() => render(false)); } },
  "logo-color"(t) { if (S.cfgDraft) { S.cfgDraft.logoColor = t.dataset.c; S.cfgDraft.logo = ""; keep(() => render(false)); } },
  "logo-forma"(t) { if (S.cfgDraft) { S.cfgDraft.logoForma = t.dataset.v; S.cfgDraft.logo = ""; keep(() => render(false)); } },
  exportar() {
    const j = JSON.stringify(catPublico());
    const u = URL.createObjectURL(new Blob([j], { type: "application/json" })); descargar(u, ARCHIVO_PUBLICADO); setTimeout(() => URL.revokeObjectURL(u), 5000);
    toast("Catálogo descargado. Súbelo junto a index.html.");
  },
  "como-publicar"() {
    if (SB) return modal({
      titulo: "Publicación automática", wide: true,
      body: `<p class="muted">Este catálogo está conectado a la base de datos. Cada cambio que haces con tu sesión de administrador se publica solo para todas las dependencias, en unos segundos.</p>
        <ol class="timeline"><li><span class="n">1</span><div><b>Edita con tu sesión iniciada</b><span>Sistemas, textos, imágenes, categorías o configuración.</span></div></li>
        <li><span class="n">2</span><div><b>Espera el aviso</b><span>Aparece «Cambios publicados para todos». Si quieres forzarlo, usa «Publicar ahora».</span></div></li>
        <li><span class="n">3</span><div><b>Listo</b><span>Quien abra o recargue la página verá la versión nueva. No hay que subir ningún archivo.</span></div></li></ol>
        <div class="note info">${glifo("info")}<div>«Descargar catálogo» queda solo como copia de respaldo. Si publicaste un <b>${ARCHIVO_PUBLICADO}</b> antes, puedes borrarlo del sitio.</div></div>`,
      pie: `<button class="btn sec" data-act="exportar">${glifo("download")}Descargar respaldo</button><button class="btn sec" data-act="publicar-ahora">Publicar ahora</button><button class="btn" data-act="cerrar-modal">Entendido</button>`
    });
    modal({
      titulo: "Cómo publicar tus cambios", wide: true,
      body: `<p class="muted">Los cambios que haces aquí se guardan solo en este navegador. Para que todas las dependencias los vean:</p>
        <ol class="timeline"><li><span class="n">1</span><div><b>Descarga el catálogo</b><span>Usa «Descargar catálogo». Se genera el archivo <b>${ARCHIVO_PUBLICADO}</b> con todos tus sistemas, textos e imágenes.</span></div></li>
        <li><span class="n">2</span><div><b>Súbelo junto a index.html</b><span>Colócalo en la misma carpeta de tu sitio y reemplaza el anterior.</span></div></li>
        <li><span class="n">3</span><div><b>Listo</b><span>Quien abra la página verá el catálogo actualizado. Si no ve el cambio, que recargue la página.</span></div></li></ol>
        <div class="note info">${glifo("info")}<div>Si abres <b>index.html</b> directamente desde tu computadora (sin servidor), el navegador no carga ${ARCHIVO_PUBLICADO}. Súbelo a un servidor o hosting para compartirlo.</div></div>`,
      pie: `<button class="btn sec" data-act="exportar">${glifo("download")}Descargar catálogo</button><button class="btn" data-act="cerrar-modal">Entendido</button>`
    });
  },
  async "publicar-ahora"() { if (!SB) return; if (!S.admin) return toast("Inicia sesión como administrador para publicar."); await sbPublicar(); if (!S.cat.editado) toast("Cambios publicados para todos"); render(false); },
  async "descartar-local"() {
    if (!(await confirmar({ titulo: "Descartar mis cambios", texto: "Se borrarán los cambios hechos en este navegador y se usará el catálogo publicado.", si: "Descartar", peligro: true }))) return;
    await IDB.del("catalogo"); S.cat = migrar(S.pub); S.cat.editado = false; S.drafts = {}; S.cfgDraft = null; revalidarSesion(); toast("Usando el catálogo publicado"); render(false);
  },

  /* editor */
  "e-add"(t) { const dr = draftActual(); if (!dr) return; dr.s[t.dataset.path].push(PLANTILLAS[t.dataset.path]()); dr.dirty = true; keep(() => render(false)); const l = $$(`[data-path^="${t.dataset.path}."]`).pop(); if (l) l.focus({ preventScroll: false }); },
  "e-del"(t) { const dr = draftActual(); if (!dr) return; dr.s[t.dataset.path].splice(+t.dataset.i, 1); dr.dirty = true; keep(() => render(false)); },
  "e-mover"(t) { const dr = draftActual(); if (!dr) return; mover(dr.s[t.dataset.path], +t.dataset.i, +t.dataset.d); dr.dirty = true; keep(() => render(false)); },
  "e-glifo"(t) { const dr = draftActual(); if (!dr) return; dr.s.icono.glifo = t.dataset.g; dr.s.icono.imagen = ""; dr.dirty = true; keep(() => render(false)); },
  "e-color"(t) { const dr = draftActual(); if (!dr) return; dr.s.icono.color = t.dataset.c; dr.dirty = true; keep(() => render(false)); },
  "e-quitar-icono"() { const dr = draftActual(); if (!dr) return; dr.s.icono.imagen = ""; dr.dirty = true; keep(() => render(false)); },
  "e-quitar-portada"() { const dr = draftActual(); if (!dr) return; dr.s.portada = ""; dr.dirty = true; keep(() => render(false)); },
  "e-lig"(t) { const dr = draftActual(); if (!dr) return; if (!Array.isArray(dr.s.ligados)) dr.s.ligados = []; const a = dr.s.ligados, i = a.indexOf(t.dataset.id); if (i >= 0) a.splice(i, 1); else a.push(t.dataset.id); dr.dirty = true; keep(() => render(false)); },
  "e-cat"(t) { const dr = draftActual(); if (!dr) return; const a = dr.s.categorias, i = a.indexOf(t.dataset.id); if (i >= 0) a.splice(i, 1); else a.push(t.dataset.id); dr.dirty = true; keep(() => render(false)); },
  "tag-add"(t) { agregarTag(t.dataset.t); },
  "tag-del"(t) { const dr = draftActual(); if (!dr) return; dr.s.usos = dr.s.usos.filter((u) => u !== t.dataset.t); dr.dirty = true; keep(() => render(false)); },
  "e-ver-archivo"(t) { const dr = draftActual(); if (dr) abrirArchivo(dr.s.archivos[+t.dataset.i]); },
  "e-guardar": guardarDraft,
  async "e-cancelar"() {
    const [, , id] = hashParts(), dr = S.drafts[id];
    if (dr && dr.dirty && !(await confirmar({ titulo: "Descartar cambios", texto: "Hay cambios sin guardar. Si sales ahora, se perderán.", si: "Descartar", peligro: true }))) return;
    delete S.drafts[id]; go("admin");
  },
  "e-descartar"() { const [, , id] = hashParts(); delete S.drafts[id]; render(false); },
  "entrar-visitante"() { S.guest = true; try { sessionStorage.setItem("catalogo-visitante", "1"); } catch (e) {} location.hash = "#/"; render(true); },
  "bandeja-filtro"(t) { S.bf = t.dataset.v; keep(() => render(true)); },
  "bandeja-exportar"() { exportarBandeja(); },
  "bandeja-recargar"() { S.inbox = undefined; render(true); },
  async "bandeja-estado"(t) { await bandejaEstado([t.dataset.id], t.dataset.v); if (t.dataset.v === "archivada") toast("Solicitud archivada"); else if (t.dataset.v === "cancelada") toast("Marcada como cancelada"); },
  async "bandeja-nota"(t) {
    const n = $("#nota-" + t.dataset.id); if (!n) return;
    if (SB) { const r = (S.inbox || []).find((x) => x.id === t.dataset.id); if (!r) return; const { error } = await SB.from("solicitudes").update({ nota: n.value }).eq("id", r.id); if (error) return toast("No se pudo guardar la nota."); r.nota = n.value; }
    else { const x = S.sols.find((y) => y.id === t.dataset.id); if (!x) return; x.nota = n.value; await guardarSolicitudes(); }
    toast("Nota guardada");
  },
  async "bandeja-borrar"(t) { const r = filasBandeja().find((x) => x.id === t.dataset.id); if (r) await bandejaBorrar([r.id], `Se eliminará la solicitud ${r.folio} de ${(r.datos || {}).dependencia || "la dependencia"}. No se puede deshacer; si solo quieres sacarla de la lista, usa «Archivar».`); },
  async "bandeja-archivar-canceladas"() { await bandejaEstado(filasBandeja().filter((r) => r.estado === "cancelada").map((r) => r.id), "archivada"); toast("Solicitudes canceladas archivadas"); },
  async "bandeja-borrar-canceladas"() { const ids = filasBandeja().filter((r) => r.estado === "cancelada").map((r) => r.id); await bandejaBorrar(ids, `Se eliminarán ${ids.length} ${plural(ids.length, "solicitud cancelada", "solicitudes canceladas")}. No se puede deshacer; si prefieres conservarlas, usa «Archivar todas».`); },
  "guardar-directorio"() { const t = $("#dir-txt"); if (!t) return; cfg().directorio = t.value.split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((a) => a[0]).map((a) => ({ nombre: a[0], cargo: a[1] || "", correo: a[2] || "", telefono: a[3] || "" })); guardarCatalogo(); toast("Directorio guardado"); render(true); },
  "recup-cancelar"() { S.recup = false; if (SB) SB.auth.signOut(); S.authView = "login"; location.hash = "#/acceso"; render(true); },
  "ir-registro"() { cerrarModal(); if (!/^#\/acceso/.test(location.hash)) S.retorno = location.hash; S.authView = "registro"; if (location.hash === "#/acceso") render(true); else location.hash = "#/acceso"; },
  "notif-ver-sol"(t) { cerrarNotif(); marcarNotifs(t.dataset.id).then(() => refrescarCampana()); },
  "notif-leer"(t) { marcarNotifs(t.dataset.id).then(() => { refrescarCampana(); keep(() => render(false)); }); },
  "notif-todas"() { marcarNotifs().then(() => { refrescarCampana(); keep(() => render(false)); }); },
  "notif-abrir"() { abrirNotif(); },
  "notif-desde-cuenta"() { cerrarModal(); setTimeout(abrirNotif, 60); },
  "notif-cerrar"() { cerrarNotif(); },
  "notif-tab"(t) { S.nTab = t.dataset.v; pintarNotif(); },
  "notif-reset"(t) { cerrarNotif(); location.hash = "#/admin/usuarios"; setTimeout(() => abrirReset(t.dataset.id), 250); },
  "aviso-ir"(t) { const a = (S.cat.avisos || []).find((x) => x.id === t.dataset.id); marcarAvisos(t.dataset.id); cerrarNotif(); refrescarCampana(); if (a && a.sistemaId && byId(a.sistemaId)) location.hash = "#/sistema/" + enc(a.sistemaId); else if (location.hash === "#/avisos") keep(() => render(false)); else if (!t.closest(".aviso-banner")) location.hash = "#/avisos"; else keep(() => render(false)); },
  "aviso-leer"(t) { marcarAvisos(t.dataset.id); refrescarCampana(); },
  "aviso-cerrar"(t) { marcarAvisos(t.dataset.id); refrescarCampana(); keep(() => render(false)); },
  "avisos-leer-todo"() { marcarAvisos(); refrescarCampana(); keep(() => render(false)); },
  "aviso-nuevo"() { abrirAviso(); },
  "aviso-editar"(t) { abrirAviso(t.dataset.id); },
  async "aviso-borrar"(t) { const a = (S.cat.avisos || []).find((x) => x.id === t.dataset.id); if (!a) return; if (!(await confirmar({ titulo: "Eliminar aviso", texto: `Se borrará «${a.titulo}» para todas las personas.`, si: "Eliminar", peligro: true }))) return; S.cat.avisos = S.cat.avisos.filter((x) => x.id !== a.id); guardarCatalogo(); toast("Aviso eliminado"); refrescarCampana(); keep(() => render(false)); },
  "ir-login"() { cerrarModal(); if (!/^#\/acceso/.test(location.hash)) S.retorno = location.hash; S.authView = "login"; if (location.hash === "#/acceso") render(true); else location.hash = "#/acceso"; },
  "super-reenviar"() { reenviarCodigoSuper(); },
  "super-cancelar"() { pendSuper.guardar(null); S.authView = S.cat.usuarios.length ? "login" : "super"; render(false); },
  "ren-sis"(t) { abrirRenombrarSistema(t.dataset.id); },
  "edit-cat"(t) { abrirCategoria(t.dataset.id); },
  async "chk-avisar"(t) {
    const sol = S.sols.find((x) => x.id === t.dataset.id); if (!sol) return;
    if (!progreso(sol).ok) return toast("Aún faltan requisitos por marcar.");
    sol.listo = true; sol.listoFecha = hoyISO(); await guardarSolicitudes();
    toast("Listo. Menciona en tu oficio que ya cumples los requisitos.");
    keep(() => render(false));
  },
  "qa-activar"() { activarQA(); },
  "qa-salir"() { salirQA(); },
  "qa-datos"() { cargarDatosPrueba(); },
  "qa-reiniciar"() { restaurarQA(true); toast("Datos de prueba reiniciados"); render(false); },
  "qa-correr"() { correrQA(); },
  "ver-video"(t) { const s = byId(t.dataset.id); if (!s) return; abrirVideo(t.dataset.k === "dest" ? s.videoDestacado : (s.videos || [])[+t.dataset.i], s.nombre); },
  "e-ver-video"(t) { const dr = draftActual(); if (!dr) return; abrirVideo(t.dataset.k === "dest" ? dr.s.videoDestacado : (dr.s.videos || [])[+t.dataset.i], dr.s.nombre || "Video de muestra"); },
  "e-quitar-videodest"() { const dr = draftActual(); if (!dr) return; dr.s.videoDestacado = { url: "", data: "", nombre: "" }; dr.dirty = true; keep(() => render(false)); },
  "vid-add-url"() {
    const dr = draftActual(); if (!dr) return;
    const i = $("#vid-url"), url = i ? i.value.trim() : "";
    if (!url) { toast("Pega primero el enlace del video."); if (i) i.focus(); return; }
    if (!urlOk(url)) { toast("El enlace debe empezar con http:// o https://"); if (i) i.focus(); return; }
    if (!Array.isArray(dr.s.videos)) dr.s.videos = [];
    dr.s.videos.push({ id: uid("vid"), url: urlOk(url), data: "", nombre: "", pie: "" }); dr.dirty = true; keep(() => render(false));
  },
  "demo-media"() {
    const dr = draftActual(); if (!dr) return;
    const s = dr.s, col = (s.icono && s.icono.color) || "azul";
    s.capturas = (s.capturas || []).concat(capturas(col, s.nombre || "Sistema").map((c) => Object.assign(c, { pie: "[Prueba] " + c.pie })));
    if (!videoInfo(s.videoDestacado)) s.videoDestacado = { url: "", data: VIDEO_DEMO, nombre: "video-de-prueba.mp4" };
    if (!Array.isArray(s.videos)) s.videos = [];
    s.videos.push({ id: uid("vid"), url: "", data: VIDEO_DEMO, nombre: "video-de-prueba.mp4", pie: "[Prueba] Recorrido del sistema" });
    dr.dirty = true; keep(() => render(false));
    toast("Listo. Pulsa «Guardar» para verlo en la portada y en la ficha.");
  },
  fmt(t) { fmtAplicar(t.dataset.f, t.dataset.c); },
  "desc-color-reset"() { const dr = draftActual(); if (!dr) return; dr.s.descColor = ""; dr.dirty = true; keep(() => render(false)); },
  "ct-pick-c"(t) { if (S.catDraft && COLORES[t.dataset.c]) { S.catDraft.color = t.dataset.c; pintarCatEditor(); } },
  "ct-pick-g"(t) { if (S.catDraft && GLIFOS.includes(t.dataset.g)) { S.catDraft.glifo = t.dataset.g; pintarCatEditor(); } },
  "ct-img-quitar"() { if (S.catDraft) { S.catDraft.imagen = ""; pintarCatEditor(); } },
  async "notif-borrar"(t) { if (await confirmar({ titulo: "Eliminar notificación", texto: "Se borrará esta notificación. No se puede deshacer.", si: "Eliminar", peligro: true })) borrarNotifs([t.dataset.id]); },
  async "notif-borrar-leidas"() { const ids = (S.cat.notificaciones || []).filter((n) => n.leida).map((n) => n.id); if (ids.length && await confirmar({ titulo: "Eliminar notificaciones leídas", texto: `Se borrarán ${ids.length} ${plural(ids.length, "notificación leída", "notificaciones leídas")}.`, si: "Eliminar", peligro: true })) borrarNotifs(ids); },
  async "notif-borrar-todas"() { const ids = (S.cat.notificaciones || []).map((n) => n.id); if (ids.length && await confirmar({ titulo: "Eliminar todas las notificaciones", texto: `Se borrarán ${ids.length} ${plural(ids.length, "notificación", "notificaciones")}. No se puede deshacer.`, si: "Eliminar todas", peligro: true })) borrarNotifs(ids); },
  async "aviso-borrar-todos"() { const n = (S.cat.avisos || []).length; if (n && await confirmar({ titulo: "Eliminar todos los avisos", texto: `Se borrarán ${n} ${plural(n, "aviso", "avisos")} para todas las personas. No se puede deshacer.`, si: "Eliminar todos", peligro: true })) { S.cat.avisos = []; guardarCatalogo(); refrescarCampana(); keep(() => render(false)); toast("Avisos eliminados"); } },
  async "formato-todos"() { if (!(await confirmar({ titulo: "Formato automático en todas las descripciones", texto: "Se pondrán en negrita azul las palabras importantes (nombre del sistema, siglas y términos clave) y los símbolos «>» o guiones se cambiarán por viñetas azules en TODAS las descripciones. Tu texto no se borra.", si: "Aplicar" }))) return; let n = 0; S.cat.sistemas.forEach((s) => { const nv = formatoAuto(s.descripcion, s.nombre); if (nv !== s.descripcion) { s.descripcion = nv; n++; } }); guardarCatalogo(); keep(() => render(false)); toast(n ? `Formato aplicado en ${n} ${plural(n, "sistema", "sistemas")}` : "Las descripciones ya tenían el formato"); },
  "cerrar-modal": cerrarModal,
  "conf-si"() { if (confFin) confFin(true); },
  "conf-no"() { if (confFin) confFin(false); }
};

const SOLO_SUPER = new Set(["notif-ver-sol", "notif-borrar", "notif-borrar-leidas", "notif-borrar-todas", "aviso-borrar-todos", "formato-todos", "aplicar-textos", "bandeja-estado", "bandeja-nota", "bandeja-borrar", "bandeja-archivar-canceladas", "bandeja-borrar-canceladas", "aviso-nuevo", "aviso-editar", "aviso-borrar", "notif-leer", "notif-todas", "notif-reset", "usr-super", "usr-gen", "logo-marca", "logo-color", "logo-forma", "usr-nuevo", "usr-reset", "usr-reset-ok", "usr-toggle", "usr-del", "guardar-cfg", "exportar", "descartar-local", "quitar-ejemplos", "probar-correo", "cfg-tema", "cfg-acento", "quitar-logo", "como-publicar", "qa-activar", "qa-salir", "qa-datos", "qa-reiniciar", "qa-correr", "qa-limpiar-manual", "dep-add", "dep-ren", "dep-del", "dep-reg", "dep-import"]);
const QA_BLOQ = new Set(["exportar", "como-publicar", "descartar-local", "publicar-ahora"]);
const SOLO_GESTION = new Set(["toggle-pub", "mover", "duplicar", "del-sistema", "add-cat", "del-cat", "edit-cat", "ren-sis", "img-quitar", "e-guardar", "e-add", "e-del", "demo-media", "vid-add-url", "fmt", "desc-color-reset", "e-quitar-videodest"]);
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-act]");
  if (!t || t.disabled) return;
  if (SOLO_SUPER.has(t.dataset.act) && !S.super) { e.preventDefault(); toast("Esta acción es solo para el superadministrador."); return; }
  if (S.qa && QA_BLOQ.has(t.dataset.act)) { e.preventDefault(); toast("No disponible en modo pruebas: saca los datos reales saliendo primero."); return; }
  if (SOLO_GESTION.has(t.dataset.act) && !S.admin) { e.preventDefault(); toast("Necesitas ser colaborador o superadministrador."); return; }
  const fn = ACT[t.dataset.act];
  if (fn) { if (t.tagName === "A" && !t.getAttribute("href")) e.preventDefault(); fn(t, e); }
});
document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.dataset.path) {
    const dr = draftActual(); if (!dr) return;
    setPath(dr.s, t.dataset.path, t.type === "checkbox" ? t.checked : t.value); dr.dirty = true;
    if (t.dataset.path === "descripcion" || t.dataset.path === "descTam" || t.dataset.path === "descColor") actualizarPrevDesc();
    const sb = $(".savebar .muted"); if (sb) sb.textContent = "Tienes cambios sin guardar.";
    return;
  }
  if (t.dataset.form) {
    const kf = t.dataset.form, ms = /^(dependencia|usoOtro)Sel$/.exec(kf);
    if (ms || kf === "tipoUso") {
      F.nuevo = F.nuevo || {};
      if (ms) { const k = ms[1]; if (t.value === "__nuevo") { F.nuevo[k] = true; F.vals[k] = ""; } else { F.nuevo[k] = false; F.vals[k] = t.value; } delete F.errs[k]; }
      else { F.vals.tipoUso = t.value; delete F.errs.tipoUso; }
      keep(() => render(false)); return;
    }
    F.vals[t.dataset.form] = t.type === "checkbox" ? t.checked : t.value;
    if (F.errs[t.dataset.form]) { delete F.errs[t.dataset.form]; const fl = t.closest(".field"); if (fl) { fl.classList.remove("bad"); const er = $(".err", fl); if (er) er.remove(); } const er2 = $("#err-acepto"); if (t.dataset.form === "acepto" && er2) er2.remove(); }
    return;
  }
  if (t.dataset.cfg && S.cfgDraft) { S.cfgDraft[t.dataset.cfg] = t.value; return; }
  if (t.id === "qs" || t.id === "qv") {
    S.q = t.value;
    const o = t.id === "qs" ? $("#qv") : $("#qs"); if (o && o.value !== S.q) o.value = S.q;
    if (hashParts()[0] !== "buscar") go("buscar"); else pintarBusqueda();
  }
});
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.id === "a-depsel") depAuthCambio(t);
  else if (t.dataset.fmtSize !== undefined) { if (t.value) fmtAplicar("tam", t.value); t.value = ""; }
  else if (t.dataset.fmtColor !== undefined) fmtAplicar("color", t.value);
  else if (t.dataset.path === "videoDestacado.url") { const dr = draftActual(); if (dr) { if (t.value.trim()) { dr.s.videoDestacado.data = ""; dr.s.videoDestacado.nombre = ""; } keep(() => render(false)); } }
  else if (t.dataset.usrRol) cambiarRolUsuario(t);
  else if (t.dataset.chk) marcarRequisito(t);
  else if (t.dataset.sel === "orden") { F2.orden = t.value; render(false); }
  else if (t.dataset.sel === "addsis") { if (t.value && !F.sel.includes(t.value)) F.sel.push(t.value); keep(() => render(false)); }
  else if (t.dataset.up2 && S.admin) { const f = t.files[0], k = t.dataset.up2, id = t.dataset.id; t.value = ""; if (f) subirImagenRapida(k, id, f); }
  else if (t.dataset.up === "import") { if (!S.super) { t.value = ""; return toast("Solo el superadministrador puede cargar un catálogo."); } const f = t.files[0]; t.value = ""; if (f) importarCatalogo(f); }
  else if (t.dataset.up) { const fs = [...t.files]; t.value = ""; subirArchivos(t.dataset.up, fs); }
  else if (t.id === "ct-img") catImagenElegida(t);
  else if (t.dataset.catf && S.admin) {
    const k = catById(t.dataset.id); if (!k) return;
    if (t.dataset.catf === "nombre") { k.nombre = t.value.trim() || k.nombre; guardarCatalogo(); renderChrome("admin"); }
    else { k[t.dataset.catf] = t.value; guardarCatalogo(); keep(() => render(false)); }
  }
});
document.addEventListener("submit", (e) => {
  const f = e.target;
  if (f.id === "form-sol") { e.preventDefault(); enviarSolicitud(); }
  else if (f.id === "form-login") { e.preventDefault(); if (f.dataset.paso === "1") loginPaso(2); else iniciarSesion(); }
  else if (f.id === "form-super") { e.preventDefault(); solicitarSuper(); }
  else if (f.id === "form-depadd") { e.preventDefault(); ACT["dep-add"](); }
  else if (f.id === "form-depren") { e.preventDefault(); guardarRenDep(); }
  else if (f.id === "form-supercod") { e.preventDefault(); sbSuperVerificar(); }
  else if (f.id === "form-supermail") { e.preventDefault(); sbSuperEnviar(); }
  else if (f.id === "form-superpass") { e.preventDefault(); sbLoginSuper(); }
  else if (f.id === "form-codigo") { e.preventDefault(); verificarCodigoSuper(); }
  else if (f.id === "form-ren") { e.preventDefault(); guardarRenombrar(); }
  else if (f.id === "form-cat") { e.preventDefault(); guardarCategoria(); }
  else if (f.id === "form-cambiar") { e.preventDefault(); guardarClaveObligatoria(); }
  else if (f.id === "form-reg") { e.preventDefault(); registrarse(); }
  else if (f.id === "form-rec") { e.preventDefault(); solicitarRecuperacion(); }
  else if (f.id === "form-nueva") { e.preventDefault(); sbGuardarNueva(); }
  else if (f.id === "form-usercod") { e.preventDefault(); sbCodigoVerificar(); }
  else if (f.id === "form-completar") { e.preventDefault(); sbCompletarPerfil(); }
  else if (f.id === "form-aviso") { e.preventDefault(); guardarAviso(f); }
  else if (f.id === "form-usr") { e.preventDefault(); crearUsuarioAdmin(); }
  else if (f.id === "form-pass") { e.preventDefault(); cambiarMiClave(); }
});
document.addEventListener("mousedown", (e) => { if (e.target.closest && e.target.closest(".rtb button")) e.preventDefault(); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { if ($("#lb")) cerrarLightbox(); else if ($("#modal")) { if (confFin) confFin(false); else cerrarModal(); } }
  else if ($("#lb") && lb) { if (e.key === "ArrowLeft") ACT["lb-prev"](); else if (e.key === "ArrowRight") ACT["lb-next"](); }
  else if (e.key === "Enter" && e.target.id === "tag-in") { e.preventDefault(); agregarTag(); }
});
["dragover", "dragleave", "drop"].forEach((ev) => document.addEventListener(ev, (e) => {
  const z = e.target.closest && e.target.closest(".dz"); if (!z) return;
  e.preventDefault();
  if (ev === "dragover") z.classList.add("drag"); else z.classList.remove("drag");
  if (ev === "drop" && e.dataTransfer) subirArchivos(z.dataset.drop, [...e.dataTransfer.files]);
}));
window.addEventListener("scroll", () => { const nb = $("#nb"); if (nb) nb.classList.toggle("scrolled", window.scrollY > 8); }, { passive: true });

/* ---------- Arranque ---------- */
/* ---------- Supabase: catálogo público + acceso real (Auth + RLS) ---------- */
let SB = null;
const conLimite = (p, ms, def) => { let t; return Promise.race([Promise.resolve(p).catch(() => def), new Promise((r) => { t = setTimeout(() => r(def), ms); })]).finally(() => clearTimeout(t)); };
const cargarScript = (src, ms = 7000) => new Promise((ok, no) => { const s = document.createElement("script"); const t = setTimeout(() => { s.remove(); no(new Error("tiempo")); }, ms); s.src = src; s.onload = () => { clearTimeout(t); ok(); }; s.onerror = () => { clearTimeout(t); s.remove(); no(new Error("red")); }; document.head.appendChild(s); });
const catPublico = () => { const o = JSON.parse(JSON.stringify(Object.assign({}, S.cat, { editado: false }))); delete o.usuarios; delete o.notificaciones; if (o.config) { delete o.config.pinHash; delete o.config.correoAdmin; delete o.config.correoDestino; } return o; };
async function sbIniciar() {
  if (!SB_ON) return;
  /* Si una red institucional bloquea o tarda con un servidor, se prueba el otro y, si ninguno responde, el catálogo se muestra igual. */
  const fuentes = ["https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js", "https://unpkg.com/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"];
  try {
    await new Promise((ok, no) => {
      let fin = false, fallos = 0; const listo = () => { if (!fin) { fin = true; ok(); } }, falla = () => { if (++fallos === fuentes.length && !fin) { fin = true; no(new Error("red")); } };
      let seg = false; const segundo = () => { if (!seg && !fin) { seg = true; cargarScript(fuentes[1], 4000).then(listo, falla); } };
      cargarScript(fuentes[0], 4000).then(listo, () => { falla(); segundo(); }); /* si el primero falla, el segundo entra de inmediato */
      setTimeout(segundo, 2000); /* si solo tarda, se prueba el segundo en paralelo */
    });
    SB = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  } catch (e) { SB = null; }
}
async function sbCatalogo() { if (!SB) return null; try { const { data, error } = await conLimite(SB.from("catalogo").select("data").eq("id", 1).maybeSingle(), 5000, { data: null, error: { message: "tiempo" } }); S.catErr = error ? error.message || "error" : ""; return data && catValido(data.data) ? data.data : null; } catch (e) { S.catErr = "red"; return null; } }
const sbUsuario = (p, au) => ({ id: p.id, nombre: p.nombre || (au && au.email) || p.correo, correo: p.correo || (au && au.email) || "", rol: rolDe(p.rol), estado: p.estado || "activo", dependencia: p.dependencia || "", area: p.area || "", cargo: p.cargo || "", telefono: p.telefono || "", sb: true, salt: "", hash: "" });
const esGoogle = (au) => !!au && ((au.app_metadata && ((au.app_metadata.providers || []).includes("google") || au.app_metadata.provider === "google")) || (au.identities || []).some((i) => i.provider === "google"));
async function sbPerfil(au) {
  let { data: p } = await SB.from("perfiles").select("*").eq("id", au.id).maybeSingle();
  if (esGoogle(au)) {
    /* Google: solo correos permitidos (el propietario siempre entra). El perfil y el rol de administrador los asigna el servidor (supabase-google.sql). */
    if (!correoPermitido(au.email)) { S.googleErr = avisoDominio(); await SB.auth.signOut(); return null; }
    const esDueno = normCorreo(au.email) === normCorreo(CORREO_SUPER);
    if (!p || (esDueno && (rolDe(p.rol) !== "superadmin" || p.estado !== "activo"))) {
      let rr; try { rr = await SB.rpc("asegurar_perfil_google"); } catch (e) { rr = { error: e }; }
      if (rr && rr.error) S.googleErr = "No se pudo preparar tu perfil. Ejecuta supabase-google.sql en Supabase (SQL Editor).";
      ({ data: p } = await SB.from("perfiles").select("*").eq("id", au.id).maybeSingle());
    }
  }
  if (!p || p.estado !== "activo") { if (esGoogle(au) && !S.googleErr) S.googleErr = p ? "Tu usuario no está activo. Contacta al administrador." : "No se encontró tu perfil. Ejecuta supabase-google.sql en Supabase (SQL Editor)."; await SB.auth.signOut(); return null; }
  const u = sbUsuario(p, au); let lista = [u];
  /* Google: la primera vez se pide completar el perfil (cargo, dependencia, teléfono) */
  u.completar = esGoogle(au) && rolDe(p.rol) !== "superadmin" && !(p.dependencia && p.cargo && p.telefono);
  if (rolDe(p.rol) === "superadmin") { const { data } = await SB.from("perfiles").select("*"); if (data) lista = data.map((x) => sbUsuario(x)); }
  S.cat.usuarios = lista; if (rolDe(p.rol) === "superadmin") { await sbNotifs(); iniciarVigilancia(); if (S.catErr && S.catErr !== "red") setTimeout(() => toast("Los visualizadores no pueden leer el catálogo publicado. Ejecuta supabase-visualizador.sql en Supabase."), 1500); } return lista.find((x) => x.id === u.id) || u;
}
/* Entrar con código por correo (sirve también para cuentas creadas con Google que no tienen contraseña) */
async function sbCodigoEnviar() {
  authErr("");
  const reenvio = S.authView === "usercod";
  const correo = reenvio ? S.codCorreo : normCorreo(val("a-correo"));
  if (!correoOk(correo)) return marcarFaltantes([["a-correo", "Escribe tu correo electrónico válido."]]);
  if (correo === normCorreo(CORREO_SUPER)) return sbSuperEnviar();
  if (!SB) return authErr("No se pudo conectar con el servicio de acceso. Revisa tu conexión.");
  const espera = 60000 - (Date.now() - (S.codT || 0));
  if (espera > 0 && S.codCorreo === correo) return authErr(`Espera ${Math.ceil(espera / 1000)} s antes de pedir otro código.`);
  const { error } = await SB.auth.signInWithOtp({ email: correo, options: { shouldCreateUser: false } });
  if (error && /rate|seconds|too many|limit/i.test(error.message)) return authErr("Se pidieron demasiados códigos. Espera un minuto e inténtalo de nuevo.");
  /* Si el correo no tiene cuenta no se avisa, para no revelar quién está registrado */
  S.codT = Date.now(); S.codCorreo = correo; S.authView = "usercod"; render(false);
  if (reenvio) toast("Te enviamos un código nuevo.");
}
async function sbCodigoVerificar() {
  const tok = val("a-codigo").replace(/\s/g, ""); authErr("");
  if (!/^\d{6,10}$/.test(tok)) return marcarFaltantes([["a-codigo", "Escribe el código numérico que llegó a tu correo."]]);
  if (!SB || !S.codCorreo) return authErr("No se pudo conectar con el servicio de acceso. Revisa tu conexión.");
  const btn = $("#a-usc-btn"); if (btn) { btn.disabled = true; btn.textContent = "Verificando…"; }
  const libre = () => { if (btn) { btn.disabled = false; btn.textContent = "Entrar"; } };
  const r = await SB.auth.verifyOtp({ email: S.codCorreo, token: tok, type: "email" });
  if (r.error || !r.data || !r.data.user) { libre(); return authErr("Código incorrecto o vencido. Pide uno nuevo con «Reenviar código»."); }
  const u = await sbPerfil(r.data.user);
  if (!u) { libre(); return authErr("Tu usuario no está activo o no tiene perfil. Contacta al administrador."); }
  abrirSesion(u, true);
}
/* Primer ingreso con Google: guarda cargo, dependencia y teléfono (usa la función completar_perfil de supabase-completar-perfil.sql) */
async function sbCompletarPerfil() {
  authErr("");
  const d = { nombre: val("a-nombre"), dependencia: val("a-dep"), area: val("a-area"), cargo: val("a-cargo"), telefono: val("a-tel") };
  const falta = [], mal = (id, m) => falta.push([id, m]);
  if (d.nombre.length < 3) mal("a-nombre", "Escribe tu nombre completo.");
  if (d.cargo.length < 2) mal("a-cargo", "Escribe tu cargo.");
  if (d.dependencia.length < 2) mal($("#a-depsel") && $("#a-dep-wrap").hidden ? "a-depsel" : "a-dep", "Elige o escribe tu dependencia u organización.");
  if (d.telefono.replace(/\D/g, "").length < 8) mal("a-tel", "Escribe un teléfono de al menos 8 dígitos.");
  if (!$("#a-acepto").checked) mal("a-acepto", "Acepta el aviso de privacidad para continuar.");
  if (falta.length) return marcarFaltantes(falta);
  const btn = $("#a-comp-btn"); if (btn) { btn.disabled = true; btn.textContent = "Guardando…"; }
  const fin = (m) => { if (btn) { btn.disabled = false; btn.textContent = "Guardar y entrar"; } authErr(m); };
  if (!SB) return fin("No se pudo conectar con el servicio de acceso. Revisa tu conexión.");
  let r; try { r = await SB.rpc("completar_perfil", { p_nombre: d.nombre, p_dependencia: d.dependencia, p_area: d.area, p_cargo: d.cargo, p_telefono: d.telefono }); } catch (e) { r = { error: e }; }
  if (r && r.error) return fin("No se pudo guardar tu perfil. Avisa al administrador: falta ejecutar supabase-completar-perfil.sql en Supabase.");
  try { await SB.from("notificaciones").insert({ tipo: "registro", titulo: `Se unió ${d.nombre}`, detalle: { userId: S.user.id, nombre: d.nombre, correo: S.user.correo, dependencia: d.dependencia, area: d.area, cargo: d.cargo, telefono: d.telefono } }); } catch (e) {}
  try { await depsRegistrar(d.dependencia); } catch (e) {}
  Object.assign(S.user, { nombre: d.nombre, dependencia: d.dependencia, area: d.area, cargo: d.cargo, telefono: d.telefono, completar: false });
  if (/^#\/acceso/.test(location.hash)) history.replaceState(null, "", "#/");
  render(true); toast(`Bienvenido(a), ${d.nombre.split(" ")[0]}`);
}
/* Login en dos pasos: 1) Google o correo, 2) contraseña (+ olvidé contraseña / crear cuenta) */
function loginPaso(n) {
  const f = $("#form-login"), p1 = $("#lg-p1"), p2 = $("#lg-p2"); if (!f || !p1 || !p2) return;
  authErr("");
  if (n === 2) {
    const correo = normCorreo(val("a-correo"));
    if (!correoOk(correo)) return marcarFaltantes([["a-correo", "Escribe un correo electrónico válido."]]);
    if (typeof correoPermitido === "function" && !correoPermitido(correo)) return marcarFaltantes([["a-correo", avisoDominio()]]);
  }
  f.dataset.paso = String(n); p1.hidden = n === 2; p2.hidden = n !== 2;
  const i = $(n === 2 ? "#a-pass" : "#a-correo"); if (i) i.focus();
}
/* Al terminar de escribir un correo válido (pausa de ~0.8 s) pasa solo a la contraseña */
let loginAuto = null;
document.addEventListener("input", (e) => {
  if (!e.target || e.target.id !== "a-correo") return;
  const f = e.target.closest("#form-login"); if (!f || f.dataset.paso !== "1") return;
  clearTimeout(loginAuto);
  loginAuto = setTimeout(() => {
    const c = normCorreo(val("a-correo"));
    if (f.dataset.paso === "1" && correoOk(c) && (typeof correoPermitido !== "function" || correoPermitido(c))) loginPaso(2);
  }, 800);
});
async function sbLogin() {
  const correo = normCorreo(val("a-correo")), pass = $("#a-pass").value; authErr("");
  const fl = []; if (!correoOk(correo)) fl.push(["a-correo", "Escribe un correo electrónico válido."]); if (!pass) fl.push(["a-pass", "Escribe tu contraseña."]);
  if (fl.length) return marcarFaltantes(fl);
  if (!correoPermitido(correo)) return marcarFaltantes([["a-correo", avisoDominio()]]);
  if (!SB) return authErr("No se pudo conectar con el servicio de acceso. Revisa tu conexión.");
  const { data, error } = await SB.auth.signInWithPassword({ email: correo, password: pass });
  if (error || !data.user) return authErr("Correo o contraseña incorrectos. Si entraste antes con Google, usa «Continuar con Google» o «Entrar con código por correo».");
  const u = await sbPerfil(data.user);
  if (!u) return authErr("Tu usuario no está activo. Contacta al administrador.");
  if (S.authView === "colab" && !["gestor", "superadmin"].includes(rolDe(u.rol))) { try { await SB.auth.signOut(); } catch (e) {} S.cat.usuarios = []; return authErr("Esta cuenta es de tipo Usuario, no Colaborador. Entra por la pestaña «Usuario» o pide a un superadministrador que cambie tu tipo de acceso."); }
  abrirSesion(u, true);
}

/* Si ya escribieron su correo, Google lo preselecciona; si no, deja elegir la cuenta */
const loginHint = () => { const c = normCorreo(val("a-correo") || ""); return correoOk(c) ? { login_hint: c } : { prompt: "select_account" }; };
async function sbGoogle() {
  authErr("");
  if (!SB) return authErr("No se pudo conectar con el servicio de acceso. Revisa tu conexión.");
  const b = $("#a-google-btn"), tx = b && b.querySelector("span"), orig = tx ? tx.textContent : "";
  if (b) { b.disabled = true; if (tx) tx.textContent = "Conectando con Google…"; }
  let error = null;
  try { ({ error } = await SB.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname, queryParams: loginHint() } })); } catch (e) { error = e; }
  if (error) {
    if (b) { b.disabled = false; if (tx) tx.textContent = orig; }
    authErr(/not enabled|unsupported provider/i.test(error.message || "") ? "El acceso con Google aún no está activado en Supabase (Authentication → Providers → Google)." : "No se pudo iniciar con Google. Inténtalo de nuevo.");
  }
}
window.addEventListener("pageshow", (e) => { if (e.persisted) { const b = $("#a-google-btn"); if (b) { b.disabled = false; const t = b.querySelector("span"); if (t && b.dataset.txt) t.textContent = b.dataset.txt; } } });

async function sbLoginSuper() {
  authErr("");
  const correo = normCorreo(val("a-sup-correo")), pass = $("#a-sup-pass").value, fl = [];
  if (!correoOk(correo)) fl.push(["a-sup-correo", "Escribe el correo del propietario."]);
  if (!pass) fl.push(["a-sup-pass", "Escribe tu contraseña."]);
  if (fl.length) return marcarFaltantes(fl);
  if (correo !== normCorreo(CORREO_SUPER)) return marcarFaltantes([["a-sup-correo", "Este acceso está reservado al correo autorizado del propietario."]]);
  if (!SB) return authErr("No se pudo conectar con el servicio de acceso. Revisa tu conexión.");
  const btn = $("#a-supp-btn"); if (btn) { btn.disabled = true; btn.textContent = "Entrando…"; }
  const libre = () => { if (btn) { btn.disabled = false; btn.textContent = "Entrar como superadministrador"; } };
  const { data, error } = await SB.auth.signInWithPassword({ email: correo, password: pass });
  if (error || !data.user) { libre(); return authErr("Correo o contraseña incorrectos. Si aún no tienes contraseña, usa «Entrar con código por correo»."); }
  const u = await sbPerfil(data.user);
  if (!u || rolDe(u.rol) !== "superadmin") { try { await SB.auth.signOut(); } catch (e) {} libre(); return authErr("Esta cuenta aún no está habilitada como superadministrador. Ejecuta supabase-superadmin-dependencias.sql en Supabase."); }
  abrirSesion(u, true);
}
/* ---------- Superadministrador (Supabase): código de un solo uso al correo del propietario ---------- */
async function sbSuperEnviar() {
  authErr("");
  const campoSup = $("#a-sup-correo") || $("#a-correo");
  if (campoSup) { const c = normCorreo(campoSup.value); if (!correoOk(c)) return marcarFaltantes([["a-sup-correo", "Escribe el correo del propietario."]]); if (c !== normCorreo(CORREO_SUPER)) return marcarFaltantes([["a-sup-correo", "Este acceso está reservado al correo autorizado del propietario."]]); }
  if (!SB) return authErr("No se pudo conectar con el servicio de acceso. Revisa tu conexión.");
  const espera = 60000 - (Date.now() - (S.supT || 0));
  if (espera > 0) return authErr(`Espera ${Math.ceil(espera / 1000)} s antes de pedir otro código.`);
  const btn = $("#a-sup-btn"); if (btn) { btn.disabled = true; btn.textContent = "Enviando código…"; }
  const { error } = await SB.auth.signInWithOtp({ email: CORREO_SUPER, options: { shouldCreateUser: true } });
  if (error) {
    if (btn) { btn.disabled = false; btn.textContent = "Enviar código a mi correo"; }
    return authErr(/rate|seconds|too many|limit/i.test(error.message) ? "Se pidieron demasiados códigos. Espera un minuto e inténtalo de nuevo." : "No se pudo enviar el código: " + error.message);
  }
  S.supT = Date.now(); const reenvio = S.authView === "supercod"; S.authView = "supercod"; render(false);
  if (reenvio) toast("Te enviamos un código nuevo.");
}
async function sbSuperVerificar() {
  const tok = val("a-codigo").replace(/\s/g, ""); authErr("");
  if (!/^\d{6,10}$/.test(tok)) return marcarFaltantes([["a-codigo", "Escribe el código numérico que llegó a tu correo."]]);
  if (!SB) return authErr("No se pudo conectar con el servicio de acceso. Revisa tu conexión.");
  const btn = $("#a-supc-btn"); if (btn) { btn.disabled = true; btn.textContent = "Verificando…"; }
  const libre = () => { if (btn) { btn.disabled = false; btn.textContent = "Entrar"; } };
  let r = await SB.auth.verifyOtp({ email: CORREO_SUPER, token: tok, type: "email" });
  if (r.error || !r.data || !r.data.user) r = await SB.auth.verifyOtp({ email: CORREO_SUPER, token: tok, type: "signup" });
  if (r.error || !r.data || !r.data.user) { libre(); return authErr("Código incorrecto o vencido. Pide uno nuevo con «Reenviar código»."); }
  const u = await sbPerfil(r.data.user);
  if (!u) { libre(); return authErr("El código es correcto, pero esta cuenta aún no está habilitada como superadministrador. Ejecuta el archivo supabase-superadmin-dependencias.sql en Supabase."); }
  if (rolDe(u.rol) !== "superadmin") { await SB.auth.signOut(); libre(); return authErr("Esta cuenta no tiene permiso de superadministrador."); }
  abrirSesion(u, true);
}
/* ---------- Recuperar contraseña por enlace al correo (Supabase) ---------- */
async function sbRecuperar() {
  const correo = normCorreo(val("a-correo")); authErr("");
  if (!correoOk(correo)) return authErr("Escribe el correo con el que te registraste.");
  if (!SB) return authErr("No se pudo conectar con el servicio de acceso. Revisa tu conexión.");
  let ult = 0; try { ult = +localStorage.getItem("catalogo-rec-ts") || 0; } catch (e) {}
  if (Date.now() - ult < 60000) return authErr(`Espera ${Math.ceil((60000 - (Date.now() - ult)) / 1000)} s antes de pedir otro enlace.`);
  const btn = $("#a-rec-btn"); if (btn) { btn.disabled = true; btn.textContent = "Enviando…"; }
  try { localStorage.setItem("catalogo-rec-ts", String(Date.now())); } catch (e) {}
  let limite = false;
  try { const { error } = await SB.auth.resetPasswordForEmail(correo, { redirectTo: location.origin + location.pathname }); if (error && /rate|second|too many|limit/i.test(error.message)) limite = true; } catch (e) { /* respuesta neutra */ }
  if (limite) { if (btn) { btn.disabled = false; btn.textContent = "Enviarme el enlace"; } return authErr("Se pidieron demasiados enlaces. Espera unos minutos e inténtalo de nuevo."); }
  S.authView = "revisa"; S.authCorreo = correo; render(false);
}
async function sbGuardarNueva() {
  authErr("");
  const p1 = $("#a-pass").value, p2 = $("#a-pass2").value;
  if (!claveOk(p1)) return authErr(CLAVE_AYUDA);
  if (p1 !== p2) return authErr("Las contraseñas no coinciden.");
  if (!SB) return authErr("No se pudo conectar con el servicio de acceso. Revisa tu conexión.");
  const btn = $("#a-nueva-btn"); if (btn) { btn.disabled = true; btn.textContent = "Guardando…"; }
  const { error } = await SB.auth.updateUser({ password: p1 });
  if (error) {
    if (btn) { btn.disabled = false; btn.textContent = "Guardar contraseña"; }
    return authErr(/same|different|igual/i.test(error.message) ? "La nueva contraseña debe ser distinta a la anterior." : "No se pudo guardar. Es posible que el enlace haya vencido: pide uno nuevo.");
  }
  try { await SB.auth.signOut(); } catch (e) {}
  S.recup = false; S.authView = "login"; location.hash = "#/acceso"; render(true);
  toast("Contraseña actualizada. Inicia sesión con la nueva.");
}

let sbPend = null;
async function sbPublicar() {
  if (!SB || !S.admin || S.qa) return;
  const rev = catRev, hubo = S.cat.editado;
  const { error } = await SB.from("catalogo").upsert({ id: 1, data: catPublico(), updated_at: new Date().toISOString() });
  if (error) { toast("No se pudo publicar. Tus cambios siguen guardados en este navegador y se reintentarán al entrar de nuevo como administrador."); return; }
  if (hubo) toast("Cambios publicados para todos");
  if (rev === catRev) { S.cat.editado = false; await IDB.set("catalogo", Object.assign({}, S.cat, { sinPublicar: false })); }
}
const sbEnCola = () => { clearTimeout(sbPend); sbPend = setTimeout(sbPublicar, 1200); };
function vAuthSB() {
  const c = cfg(), logo = logoInner(c), reg = S.authView === "registro", err = `<div class="err" id="a-err" role="alert"></div>`;
  const fld = (id, label, o = {}) => `<div class="field"><label for="${id}">${label}${o.req ? reqMark : ""}</label>${o.pw ? `<div class="pwrow"><input id="${id}" type="password" autocomplete="${o.auto || "current-password"}" ${o.req ? 'aria-required="true"' : ""}><button type="button" class="showpw" data-act="ver-pass" aria-label="Mostrar u ocultar contraseña">Mostrar</button></div>` : `<input id="${id}" type="${o.tipo || "text"}" autocomplete="${o.auto || "off"}" placeholder="${esc(o.ph || "")}" ${o.extra || ""} ${o.req ? 'aria-required="true"' : ""}>`}${o.hint ? `<span class="muted" style="font-size:12.5px">${o.hint}</span>` : ""}</div>`;
  const cab = `<div class="auth-brand"><span class="auth-logo${imgOk(c.logo) ? "" : " lg"}">${logo}</span><div><b>${esc(c.nombre)}</b><small>${esc(c.organizacion)}</small></div></div>`;
  const vis = `<button class="btn sec big auth-alt" type="button" data-act="entrar-visitante">${glifo("eye")}Entrar como visualizador</button>`;
  const gBtn = (t, sep = "o con tu correo") => `<button type="button" class="btn-google" id="a-google-btn" data-act="google-login" data-txt="${esc(t)}"><svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg><span>${esc(t)}</span></button><div class="auth-or" role="separator"><span>${esc(sep)}</span></div>`;
  const marco = (h1, lede, body, tb = "") => `<div class="authwrap"><div class="authcard">${cab}${tb}<h1>${h1}</h1><p class="lede">${lede}</p>${body}</div><p class="auth-foot">${esc(c.organizacion)}</p></div>`;
  if (S.user && S.user.completar) {
    const u = S.user, nom = u.nombre && u.nombre !== u.correo ? u.nombre : "";
    return marco("Completa tu perfil", `Entraste con <b>${esc(u.correo)}</b>. Necesitamos unos datos para que tus solicitudes lleguen al área correcta. Solo se piden esta vez.`,
      `<form id="form-completar" novalidate><p class="auth-req"><b>*</b> Campo obligatorio</p>${fld("a-nombre", "Nombre completo", { auto: "name", req: 1, extra: `value="${esc(nom)}"` })}${fld("a-cargo", "Cargo", { req: 1 })}${depCampoAuth()}${fld("a-area", "Área o unidad (opcional)")}${fld("a-tel", "Teléfono de contacto", { tipo: "tel", auto: "tel", req: 1 })}
      <label class="chk"><input type="checkbox" id="a-acepto" aria-required="true"><span>${reqMark.trim()} ${esc(TEXTO_PRIVACIDAD_ACCESO)}${linksLegales()}</span></label>${err}<button class="btn big" type="submit" id="a-comp-btn">Guardar y entrar</button></form>
      <div class="auth-links"><button type="button" data-act="cerrar-sesion">Cancelar y cerrar sesión</button></div>`);
  }
  if (S.authView === "usercod") return marco("Escribe tu código", `Si <b>${esc(S.codCorreo || "ese correo")}</b> tiene una cuenta, le enviamos un código. Revisa tu bandeja de entrada y también spam.`,
    `<form id="form-usercod" novalidate><p class="auth-req"><b>*</b> Campo obligatorio</p>${fld("a-codigo", "Código recibido por correo", { req: 1, ph: "123456", extra: 'inputmode="numeric" autocomplete="one-time-code" maxlength="10" style="letter-spacing:.2em"' })}${err}<button class="btn big" type="submit" id="a-usc-btn">Entrar</button></form>
     <div class="auth-links"><button type="button" data-act="codigo-enviar">Reenviar código</button><button type="button" data-act="auth-ir" data-v="login">Cancelar</button></div>`);
  if (S.authView === "super") return marco("Acceso de superadministrador", `Entra con tu correo y contraseña. Si aún no tienes contraseña, usa «Entrar con código por correo» (se envía a <b>${esc(maskCorreo(CORREO_SUPER))}</b>) y luego créala en Mi cuenta → Cambiar contraseña.`,
    `<div class="note info">${glifo("info")}<div>Solo la persona propietaria recibe el código. Las demás personas deben usar la pestaña <b>Usuario</b>.</div></div><form id="form-superpass" novalidate>${fld("a-sup-correo", "Correo del propietario", { tipo: "email", req: 1, auto: "username", ph: "correo autorizado" })}${fld("a-sup-pass", "Contraseña", { pw: 1, req: 1 })}${err}<button class="btn big" type="submit" id="a-supp-btn" style="margin-top:12px">Entrar como superadministrador</button></form>
     <div class="auth-links"><button type="button" data-act="super-enviar" id="a-sup-btn">Entrar con código por correo</button></div>
     <div class="auth-links"><button type="button" data-act="auth-ir" data-v="login">Volver</button></div>`, authTabs("super"));
  if (S.authView === "supercod") return marco("Escribe tu código", `Enviamos un código a <b>${esc(maskCorreo(CORREO_SUPER))}</b>. Revisa tu bandeja de entrada y también spam.`,
    `<form id="form-supercod" novalidate><p class="auth-req"><b>*</b> Campo obligatorio</p>${fld("a-codigo", "Código recibido por correo", { req: 1, ph: "123456", extra: 'inputmode="numeric" autocomplete="one-time-code" maxlength="10" style="letter-spacing:.2em"' })}${err}<button class="btn big" type="submit" id="a-supc-btn">Entrar</button></form>
     <div class="auth-links"><button type="button" data-act="super-enviar">Reenviar código</button><button type="button" data-act="auth-ir" data-v="login">Cancelar</button></div>`, authTabs("super"));
  if (S.authView === "nueva") return marco("Elige tu nueva contraseña", "Escribe una contraseña nueva para tu cuenta. Después inicias sesión con ella.",
    `<form id="form-nueva" novalidate>${fld("a-pass", "Nueva contraseña", { pw: 1, auto: "new-password", hint: CLAVE_AYUDA, req: 1 })}${fld("a-pass2", "Confirma la contraseña", { pw: 1, auto: "new-password", req: 1 })}${err}<button class="btn big" type="submit" id="a-nueva-btn">Guardar contraseña</button></form>
     <div class="auth-links"><button type="button" data-act="recup-cancelar">Cancelar</button></div>`);
  if (S.authView === "recuperar") return marco("Recuperar contraseña", "Escribe el correo con el que te registraste y te enviaremos un enlace para elegir una contraseña nueva.",
    `<form id="form-rec" novalidate>${fld("a-correo", "Correo registrado", { tipo: "email", auto: "username", ph: "tucorreo@ejemplo.com", req: 1 })}${err}<button class="btn big" type="submit" id="a-rec-btn">Enviarme el enlace</button></form>
     <div class="auth-links"><button type="button" data-act="auth-ir" data-v="login">Volver a iniciar sesión</button></div>`);
  if (S.authView === "revisa") return marco("Revisa tu correo", `Si <b>${esc(S.authCorreo || "ese correo")}</b> tiene una cuenta, te enviamos un enlace para elegir tu nueva contraseña. Vence en poco tiempo y solo se puede usar una vez.`,
    `<div class="note info">${glifo("info")}<div>Si no llega en un par de minutos, revisa spam. ¿Ya no tienes acceso a ese correo? Pide ayuda al administrador del catálogo.</div></div>
     <div class="auth-links"><button type="button" data-act="auth-ir" data-v="recuperar">Pedir otro enlace</button><button type="button" data-act="auth-ir" data-v="login">Volver a iniciar sesión</button></div>`);
  if (S.authView === "colab") return marco("Acceso de colaborador", "Entra con tu correo y contraseña. Tu cuenta debe tener el tipo de acceso Colaborador o Superadministrador.",
    `<form id="form-login" novalidate><p class="auth-req"><b>*</b> Campo obligatorio</p>${fld("a-correo", "Correo electrónico", { tipo: "email", auto: "username", ph: "tucorreo@ejemplo.com", req: 1 })}${fld("a-pass", "Contraseña", { pw: 1, req: 1 })}${err}<button class="btn big" type="submit">Entrar como colaborador</button></form>
     <div class="auth-links"><button type="button" data-act="auth-ir" data-v="recuperar">¿Olvidaste tu contraseña?</button></div>${vis}`, authTabs("colab"));
  if (reg) return `<div class="authwrap"><div class="authcard wide">${cab}<h1>Crea tu cuenta</h1><p class="lede">Regístrate con Google o con tus datos y entra al instante.${DOMINIO_PERMITIDO ? ` Solo se aceptan correos que terminen en <b>${esc(DOMINIO_PERMITIDO)}</b>.` : ""}</p>
    ${gBtn("Registrarse con Google", "o con tus datos")}
    <form id="form-reg" novalidate><p class="auth-req"><b>*</b> Campo obligatorio</p>
      <fieldset class="fgrp"><legend>Tus datos</legend><div class="fgrid">${fld("a-nombre", "Nombre completo", { auto: "name", req: 1 })}${fld("a-cargo", "Cargo", { req: 1 })}</div></fieldset>
      <fieldset class="fgrp"><legend>Tu dependencia</legend><div class="fgrid">${depCampoAuth()}${fld("a-area", "Área o unidad (opcional)")}</div></fieldset>
      <fieldset class="fgrp"><legend>Contacto y acceso</legend><div class="fgrid">${fld("a-correo", "Correo electrónico", { tipo: "email", auto: "email", ph: "tucorreo@ejemplo.com", req: 1 })}${fld("a-tel", "Teléfono de contacto", { tipo: "tel", auto: "tel", req: 1 })}${fld("a-pass", "Contraseña", { pw: 1, auto: "new-password", hint: CLAVE_AYUDA, req: 1 })}${fld("a-pass2", "Confirma la contraseña", { pw: 1, auto: "new-password", req: 1 })}</div></fieldset>
      <label class="chk"><input type="checkbox" id="a-acepto" aria-required="true"><span>${reqMark.trim()} ${esc(TEXTO_PRIVACIDAD_ACCESO)}${linksLegales()}</span></label>${err}<button class="btn big" type="submit" id="a-reg-btn">Crear mi cuenta</button></form>
    <p class="auth-switch">¿Ya tienes cuenta? <button type="button" class="linkbtn" data-act="auth-ir" data-v="login">Inicia sesión</button></p>
    <div class="auth-divider" role="separator"></div><button class="btn ghost big auth-alt auth-visor" type="button" data-act="entrar-visitante">${glifo("eye")}Entrar como visualizador</button></div><p class="auth-foot">${esc(c.organizacion)}</p></div>`;
  const visor = `<div class="auth-divider" role="separator"></div><button class="btn ghost big auth-alt auth-visor" type="button" data-act="entrar-visitante">${glifo("eye")}Entrar como visualizador</button><p class="auth-note">Como visualizador puedes ver todo el catálogo. Para solicitar un sistema necesitas iniciar sesión.</p>`;
  return `<div class="authwrap"><div class="authcard">${cab}${authTabs("usuario")}<h1>Iniciar sesión</h1><p class="lede">Entra con tu cuenta de Google o con tu correo electrónico.${DOMINIO_PERMITIDO ? ` Solo se aceptan correos que terminen en <b>${esc(DOMINIO_PERMITIDO)}</b>.` : ""}</p>
  ${gBtn("Continuar con Google")}
  <form id="form-login" novalidate data-paso="1">
    ${fld("a-correo", "Correo electrónico", { tipo: "email", auto: "username", ph: "tucorreo@ejemplo.com", req: 1, extra: 'autocapitalize="none" spellcheck="false"' })}
    <div class="lg-paso" id="lg-p1"><button class="btn big" type="submit" id="lg-next">Continuar</button></div>
    <div class="lg-paso" id="lg-p2" hidden>
      ${fld("a-pass", "Contraseña", { pw: 1, req: 1 })}<div class="pw-help"><button type="button" class="linkbtn" data-act="auth-ir" data-v="recuperar">¿Olvidaste tu contraseña?</button></div>
      <button class="btn big" type="submit">Iniciar sesión</button>
      <p class="auth-switch" style="margin:0">¿Esta cuenta es de Google? <button type="button" class="linkbtn" data-act="google-login">Continuar con Google</button></p>
      <div class="auth-links"><button type="button" data-act="codigo-enviar">Entrar con código por correo</button></div><p class="auth-note" style="margin-top:2px">¿Entraste antes con Google y no tienes contraseña? Pide un código a tu correo.</p>
      <p class="auth-switch">¿No tienes cuenta? <button type="button" class="linkbtn" data-act="auth-ir" data-v="registro">Crear cuenta</button></p>
    </div>${err}</form>
  ${visor}</div><p class="auth-foot">${esc(c.organizacion)}</p></div>`;
}

/* ---------- Accesibilidad: preferencias guardadas en este dispositivo ---------- */
(function () {
  const K = "catalogo-acc"; let a = {}; try { a = JSON.parse(localStorage.getItem(K) || "{}"); } catch (e) {}
  const OP = [["big", "Texto más grande"], ["dys", "Letra más espaciada"], ["calm", "Reducir animaciones"]];
  const ap = () => OP.forEach(([k]) => document.documentElement.classList.toggle("acc-" + k, !!a[k]));
  ap();
  const b = document.createElement("button"); b.id = "acc-btn"; b.type = "button"; b.setAttribute("aria-label", "Opciones de accesibilidad"); b.setAttribute("aria-expanded", "false");
  b.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="4.5" r="1.8"/><path d="M5 8.5l7 1.5 7-1.5M12 10v4.5m0 0l-3 5.5m3-5.5l3 5.5"/></svg>';
  const pop = document.createElement("div"); pop.id = "acc-pop"; pop.hidden = true; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", "Accesibilidad");
  const draw = () => { pop.innerHTML = "<b>Accesibilidad</b>" + OP.map(([k, t]) => `<button type="button" role="switch" aria-checked="${!!a[k]}" data-k="${k}"><span>${t}</span><i></i></button>`).join(""); };
  draw();
  pop.onclick = (e) => { const t = e.target.closest("[data-k]"); if (!t) return; a[t.dataset.k] = !a[t.dataset.k]; try { localStorage.setItem(K, JSON.stringify(a)); } catch (x) {} ap(); draw(); };
  b.onclick = () => { pop.hidden = !pop.hidden; b.setAttribute("aria-expanded", String(!pop.hidden)); };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !pop.hidden) { pop.hidden = true; b.focus(); } });
  document.body.append(b, pop);
})();

/* ---------- Registro de dependencias, opciones del formulario y textos legales ---------- */
const uniqNombres = (a) => { const v = new Map(); a.forEach((x) => { const n = String(x || "").trim().replace(/\s+/g, " "); if (n && !v.has(norm(n))) v.set(norm(n), n); }); return [...v.values()].sort((p, q) => p.localeCompare(q, "es")); };
S.deps = [];
const depsNombres = () => uniqNombres(SB ? S.deps.map((d) => d.nombre) : (cfg().dependencias || []));
async function cargarDeps() { if (!SB) return; try { const { data, error } = await conLimite(SB.from("dependencias").select("id,nombre").order("nombre"), 4000, { error: true }); if (!error && Array.isArray(data)) S.deps = data; } catch (e) {} }
async function depsRegistrar(nombre) {
  const n = String(nombre || "").trim().replace(/\s+/g, " "); if (n.length < 2) return "";
  const ya = depsNombres().find((x) => norm(x) === norm(n)); if (ya) return ya;
  if (SB) {
    if (S.qa) S.deps.push({ id: "qa-" + Date.now(), nombre: n });
    else { try { const { data, error } = await SB.from("dependencias").insert({ nombre: n }).select("id,nombre").maybeSingle(); if (!error && data) S.deps.push(data); else if (error) await cargarDeps(); } catch (e) {} }
  } else { const c = cfg(); c.dependencias = (c.dependencias || []).concat([n]); guardarCatalogo(); }
  return n;
}
async function depsRenombrar(viejo, nuevo) {
  const n = String(nuevo || "").trim().replace(/\s+/g, " "); if (n.length < 2) return false;
  if (depsNombres().some((x) => norm(x) === norm(n) && norm(x) !== norm(viejo))) return false;
  if (SB) { const d = S.deps.find((x) => norm(x.nombre) === norm(viejo)); if (!d) return false; if (!S.qa) { const { error } = await SB.from("dependencias").update({ nombre: n }).eq("id", d.id); if (error) return false; } d.nombre = n; }
  else { const c = cfg(); c.dependencias = (c.dependencias || []).map((x) => (norm(x) === norm(viejo) ? n : x)); guardarCatalogo(); }
  return true;
}
async function depsEliminar(nombre) {
  if (SB) { const d = S.deps.find((x) => norm(x.nombre) === norm(nombre)); if (!d) return false; if (!S.qa) { const { error } = await SB.from("dependencias").delete().eq("id", d.id); if (error) return false; } S.deps = S.deps.filter((x) => x !== d); }
  else { const c = cfg(); c.dependencias = (c.dependencias || []).filter((x) => norm(x) !== norm(nombre)); guardarCatalogo(); }
  return true;
}
const lineasCfg = (t) => String(t || "").split("\n").map((x) => x.trim()).filter(Boolean);
function opcionesUso() { const l = lineasCfg(cfg().opcionesUso); if (!l.length) return TIPOS_USO.slice(); return l.some((x) => norm(x) === "otro") ? l.map((x) => (norm(x) === "otro" ? "Otro" : x)) : l.concat(["Otro"]); }
function opcionesContacto() { const l = lineasCfg(cfg().opcionesContacto); return l.length ? l : ["Correo electrónico", "Llamada telefónica", "Videollamada"]; }
function depsResumen() {
  const filas = SB ? (Array.isArray(S.inbox) ? S.inbox : []) : S.sols.map((x) => ({ datos: x.datos })), nSol = {}, nUsr = {};
  filas.forEach((r) => { const k = norm((r.datos && r.datos.dependencia) || ""); if (k) nSol[k] = (nSol[k] || 0) + 1; });
  S.cat.usuarios.forEach((u) => { const k = norm(u.dependencia || ""); if (k) nUsr[k] = (nUsr[k] || 0) + 1; });
  const reg = depsNombres(), rk = new Set(reg.map(norm));
  const vistos = uniqNombres(filas.map((r) => r.datos && r.datos.dependencia).concat(S.cat.usuarios.map((u) => u.dependencia))).filter((x) => !rk.has(norm(x)));
  const f = (n, r) => ({ nombre: n, sol: nSol[norm(n)] || 0, usr: nUsr[norm(n)] || 0, reg: r });
  return { reg: reg.map((n) => f(n, true)), sin: vistos.map((n) => f(n, false)) };
}
function vCfgFormulario(ta, savebar) {
  if (SB && S.super && (S.inbox === undefined || S.inbox === null)) cargarBandeja().then(() => { if (hashParts()[2] === "formulario") render(false); });
  const R2 = depsResumen(), fila = (d) => `<div class="arow"><span class="avatar-i">${glifo("building")}</span><div class="t"><b>${esc(d.nombre)}</b><small>${d.sol} ${plural(d.sol, "solicitud", "solicitudes")} · ${d.usr} ${plural(d.usr, "usuario", "usuarios")}${d.reg ? "" : ' · <span class="badge warn">Sin registrar</span>'}</small></div>
    <div class="acts">${d.reg ? `<button class="btn sm sec" data-act="dep-ren" data-n="${esc(d.nombre)}">Renombrar</button><button class="iconbtn bad" data-act="dep-del" data-n="${esc(d.nombre)}" aria-label="Eliminar ${esc(d.nombre)}">${glifo("trash")}</button>` : `<button class="btn sm" data-act="dep-reg" data-n="${esc(d.nombre)}">Registrar</button>`}</div></div>`;
  return `<section class="grp"><h2>Registro de dependencias</h2><p class="hint">En el registro y en la solicitud, las personas eligen su dependencia de esta lista. Si no aparece, la escriben y queda guardada aquí automáticamente. Así llevas el control de cada dependencia que solicita los sistemas. Los cambios de esta sección se guardan al instante.</p>
    <div class="card"><form id="form-depadd" class="fields" novalidate><div class="field full"><label for="dep-nueva">Agregar dependencia</label><div style="display:flex;gap:8px"><input id="dep-nueva" type="text" maxlength="120" placeholder="Nombre de la dependencia" autocomplete="off" style="flex:1"><button class="btn" type="submit">${glifo("plus")}Agregar</button></div></div></form>
    ${R2.sin.length ? `<div class="note info" style="margin-top:12px">${glifo("info")}<div>Hay ${R2.sin.length} ${plural(R2.sin.length, "dependencia", "dependencias")} en solicitudes o usuarios que aún no están en el registro.<div style="margin-top:8px"><button class="btn sm sec" data-act="dep-import">Registrarlas todas</button></div></div></div>` : ""}</div>
    <div class="list-card" style="margin-top:12px">${R2.reg.concat(R2.sin).map(fila).join("") || '<p class="muted" style="padding:14px">Aún no hay dependencias. Se irán agregando solas cuando alguien se registre o envíe una solicitud.</p>'}</div></section>
  <section class="grp"><h2>Opciones del formulario</h2><p class="hint">Escribe una opción por línea. Se aplican al guardar la configuración.</p><div class="card"><div class="fields">
    ${ta("opcionesUso", "Tipo de uso", "«Otro» siempre se agrega al final: permite escribir un uso distinto.", 120)}
    ${ta("opcionesContacto", "¿Cómo prefieres que te contactemos?", "Opciones que verá la persona al solicitar un sistema.", 100)}
  </div></div></section>` + savebar;
}
function vCfgLegal(ta, savebar) {
  return `<section class="grp"><h2>Aviso de privacidad y términos y condiciones</h2><p class="hint">Cuando escribas estos textos, aparecerán como enlaces en el registro, en la solicitud (donde se recaban los datos) y al pie de la página. Mientras estén vacíos no se muestran. No hace falta repetirlos al iniciar sesión.</p>
    <div class="card"><div class="fields">${ta("avisoPrivacidad", "Aviso de privacidad", "Puedes usar párrafos y listas con guion (-).", 240)}${ta("terminos", "Términos y condiciones", "Puedes usar párrafos y listas con guion (-).", 240)}</div></div></section>
  <section class="grp"><h2>Texto corto de aceptación</h2><p class="hint">Es la frase junto a la casilla que acepta la persona.</p><div class="card"><div class="fields">${ta("privacidad", "Texto de la casilla", "", 80)}</div></div></section>` + savebar;
}
function abrirRenDep(n) {
  modal({ titulo: "Renombrar dependencia", body: `<form id="form-depren" data-n="${esc(n)}" novalidate><div class="field"><label for="dr-nombre">Nombre</label><input id="dr-nombre" type="text" maxlength="120" value="${esc(n)}" autocomplete="off"></div><p class="cfg-note" style="margin-top:8px">Las solicitudes y cuentas anteriores conservan el nombre que tenían.</p><div class="err" id="dr-err" role="alert"></div></form>`, pie: `<button class="btn sec" data-act="cerrar-modal">Cancelar</button><button class="btn" type="submit" form="form-depren">Guardar</button>` });
}
async function guardarRenDep() {
  if (!S.super) return; const f = $("#form-depren"); if (!f) return;
  if (!(await depsRenombrar(f.dataset.n, val("dr-nombre")))) { $("#dr-err").textContent = "Escribe un nombre distinto de las demás dependencias."; return; }
  cerrarModal(); toast("Dependencia actualizada"); keep(() => render(false));
}

async function boot() {
  const okIDB = await IDB.open();
  S.memoria = !okIDB;
  await sbIniciar();
  const pDeps = cargarDeps();
  const local = await IDB.get("catalogo"), sols = await IDB.get("solicitudes");
  S.sols = Array.isArray(sols) ? sols : [];
  let pub = null;
  if (location.protocol !== "file:") {
    try {
      const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 3500);
      const r = await fetch(ARCHIVO_PUBLICADO, { cache: "no-store", signal: ctl.signal }); clearTimeout(tm);
      if (r.ok) { const j = await r.json(); if (catValido(j)) pub = j; }
    } catch (e) { /* sin catálogo publicado */ }
  }
  if (SB) { const rem = await sbCatalogo(); if (rem) pub = rem; }
  S.pub = pub;
  if (SB && pub) { S.cat = migrar(pub); S.cat.editado = false; }
  else if (local && local.editado && catValido(local)) S.cat = migrar(local);
  else if (pub) { S.cat = migrar(pub); S.cat.editado = false; }
  else S.cat = migrar(datosEjemplo());
  if (SB && URL_RECUP) { /* sesión de recuperación: no iniciar sesión, solo pedir la nueva contraseña */ }
  else if (SB) { try { const { data } = await conLimite(SB.auth.getSession(), 4000, { data: {} }); if (data && data.session) { const u = await sbPerfil(data.session.user); if (u) { S.user = u; aplicarRol(u); } } } catch (e) {} }
  else restaurarSesion();
  S.guest = !S.user;
  if (SB && S.admin && local && local.sinPublicar && catValido(local)) { const nn = S.cat.notificaciones, uu = S.cat.usuarios; S.cat = migrar(local); S.cat.notificaciones = nn; S.cat.usuarios = uu; S.cat.editado = true; catRev++; sbEnCola(); setTimeout(() => toast("Recuperamos cambios que no se habían publicado (categorías y sistemas) y los estamos publicando."), 900); }
  await pDeps;
  if (URL_RECUP) { S.recup = true; S.authView = "nueva"; history.replaceState(null, "", location.pathname + "#/acceso"); }
  else if (URL_ERR) {
    const deGoogle = /access_denied|oauth|provider|identity/i.test(location.hash + location.search);
    S.authView = deGoogle ? "login" : "recuperar"; history.replaceState(null, "", location.pathname + "#/acceso");
    setTimeout(() => toast(deGoogle ? "No se completó el inicio de sesión con Google." : "El enlace venció o ya se usó. Pide uno nuevo."), 600);
  }
  if (S.googleErr) setTimeout(() => toast(S.googleErr), 900);
  window.addEventListener("hashchange", () => render(true));
  render(true);
}
boot().catch((err) => { console.error(err); view.innerHTML = vacio("No se pudo iniciar el catálogo", "Recarga la página. Si el problema continúa, avisa al equipo responsable."); });
})();
