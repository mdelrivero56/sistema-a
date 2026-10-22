/* ==========================================================================
   Configuración del catálogo (edita aquí lo básico)
   Se carga antes que app.js. También puede cambiarse desde
   Administración → Configuración.
   - correoOficio: correo al que cada solicitante envía su oficio citando su folio.
   - SUPABASE_URL / SUPABASE_KEY: URL y clave pública (anon) de tu proyecto.
     Nunca uses la clave service_role.
   ========================================================================== */

const FORMATO_AUTOMATICO = true;   // por el momento: da formato automático a todas las descripciones al cargar (pon false para desactivarlo)
const CONFIG_BASE = {
  nombre: "Catálogo de Sistemas",
  organizacion: "Coordinación de Política Digital",
  correoDestino: "",          // (ya no se usa: las solicitudes no llegan por correo)
  correoOficio: "",           // ← correo al que el solicitante envía su oficio con el folio (por definir)
  endpoint: "",               // (ya no se usa)
  telefono: "",
  privacidad: "Usaremos tus datos únicamente para atender esta solicitud y ponernos en contacto contigo.",
  pinHash: "",
  correoAdmin: "delrivero25@gmail.com",   // recibe solicitudes de usuario y de recuperación de contraseña
  logo: "",                   // imagen subida (opcional); si está vacío se usa el diseño de abajo
  logoMarca: "nodos",         // facetas | mosaico | capas | orbita | cubo | onda | inicial
  logoColor: "azul",          // color de la paleta
  logoForma: "squircle",      // squircle | circulo | cuadrado
  directorio: [],             // personas responsables: [{nombre, cargo, correo, telefono}]
  horario: "",                // ej. «Lunes a viernes, 9:00 a 17:00»
  tiempoRespuesta: "3 días hábiles",
  reunion: "Coordinamos una reunión con tu dependencia para presentar el sistema, definir accesos y acordar fechas de uso.",
  tema: "auto",               // auto | claro | oscuro
  acento: "",                 // vacío = azul institucional; o un color de la paleta
  requisitosBase: "Persona responsable designada (nombre y contacto)\nConexión a internet estable en el lugar de uso\nDispositivos compatibles disponibles (computadora, tablet o teléfono)\nFecha y lugar de la ocasión confirmados\nAutorización de la dependencia para usar el sistema",
  dependencias: [],           // registro de dependencias que solicitan sistemas (se llena solo y se administra en Ajustes → Formulario)
  opcionesUso: "Evento o reunión\nUso institucional recurrente\nPrueba o demostración\nOtro",
  opcionesContacto: "Correo electrónico\nLlamada telefónica\nVideollamada",
  avisoPrivacidad: "",        // texto completo del aviso de privacidad (opcional)
  terminos: ""                // términos y condiciones (opcional)
};
const TEXTO_PRIVACIDAD_ACCESO = "Usaremos tus datos para identificar a quien consulta el catálogo y para contactarte.";
const SUPABASE_URL = "https://owdeglulxmamvbpbqiog.supabase.co";
const SUPABASE_KEY = "sb_publishable_33l2WIbJHQ96J7McaPbgXQ_XH3tKmAL";
const ARCHIVO_PUBLICADO = "catalogo.json";   // catálogo compartido con todos los visitantes
const LIMITE_ARCHIVO = 10 * 1024 * 1024;      // 10 MB por adjunto
const CORREO_SUPER = "delrivero25@gmail.com";  // único correo autorizado para Superadministrador
const DOMINIO_PERMITIDO = "";  // ← por ahora vacío = se acepta cualquier correo. Cuando quieras limitar el acceso, escribe "gob.mx" (el propietario siempre puede entrar)
