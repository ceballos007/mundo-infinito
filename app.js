// =========================================================
// MUNDO INFINITO · v0.6.0
// Mapa + Supabase + descubrimientos compartidos
// Vídeos + favoritos + buscador
// =========================================================

"use strict";

// =========================================================
// CONFIGURACIÓN GENERAL
// =========================================================

const CONFIG = {
  city: "Río de Janeiro",
  country: "Brasil",

  center: [
    -22.94,
    -43.22
  ],

  zoom: 11,

  storage: {
    discoveries:
      "mundoInfinitoDescubrimientos",

    savedPlaces:
      "mundoInfinitoLugaresGuardados",

    deviceId:
      "mundoInfinitoDeviceId"
  }
};

// =========================================================
// CONEXIÓN CON SUPABASE
// =========================================================

let supabaseClient = null;

function initializeSupabase() {

  try {

    if (
      typeof window.supabase === "undefined"
    ) {

      console.warn(
        "Supabase todavía no está disponible."
      );

      return false;
    }

    if (
      typeof SUPABASE_URL === "undefined" ||
      typeof SUPABASE_KEY === "undefined"
    ) {

      console.warn(
        "No se encontró supabase-config.js"
      );

      return false;
    }

    supabaseClient =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );

    console.log(
      "☁️ Supabase conectado"
    );

    return true;

  } catch (error) {

    console.error(
      "Error conectando Supabase:",
      error
    );

    return false;
  }
}

// =========================================================
// IDENTIFICADOR DEL DISPOSITIVO
// =========================================================

function getDeviceId() {

  let deviceId =
    localStorage.getItem(
      CONFIG.storage.deviceId
    );

  if (!deviceId) {

    deviceId =
      crypto.randomUUID
        ? crypto.randomUUID()
        : `device-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;

    localStorage.setItem(
      CONFIG.storage.deviceId,
      deviceId
    );
  }

  return deviceId;
}

const DEVICE_ID =
  getDeviceId();

// =========================================================
// LUGARES BASE
// =========================================================

const defaultPlaces = [];

// =========================================================
// ESTADO DE LA APLICACIÓN
// =========================================================

let places = [];

let videos = [];

let discoveries = [];

let selectedPlace = null;

let supabaseOnline = false;

const markers =
  new Map();

// =========================================================
// ELEMENTOS DE LA INTERFAZ
// =========================================================

const searchInput =
  document.getElementById(
    "searchInput"
  );

const clearSearch =
  document.getElementById(
    "clearSearch"
  );

const searchResults =
  document.getElementById(
    "searchResults"
  );

const openDiscoveryModal =
  document.getElementById(
    "openDiscoveryModal"
  );

const discoveryModal =
  document.getElementById(
    "discoveryModal"
  );

const closeDiscoveryModal =
  document.getElementById(
    "closeDiscoveryModal"
  );

const discoveryForm =
  document.getElementById(
    "discoveryForm"
  );

const useMapCenter =
  document.getElementById(
    "useMapCenter"
  );

const discoveryLat =
  document.getElementById(
    "discoveryLat"
  );

const discoveryLng =
  document.getElementById(
    "discoveryLng"
  );

const placePanel =
  document.getElementById(
    "placePanel"
  );

const closePlacePanel =
  document.getElementById(
    "closePlacePanel"
  );

const placeCoverIcon =
  document.getElementById(
    "placeCoverIcon"
  );

const placeCategory =
  document.getElementById(
    "placeCategory"
  );

const placeName =
  document.getElementById(
    "placeName"
  );

const placeZone =
  document.getElementById(
    "placeZone"
  );

const placeDescription =
  document.getElementById(
    "placeDescription"
  );

const placeLocationText =
  document.getElementById(
    "placeLocationText"
  );

const placeTip =
  document.getElementById(
    "placeTip"
  );

const placeVideosButton =
  document.getElementById(
    "placeVideosButton"
  );

const placeVideoActionText =
  document.getElementById(
    "placeVideoActionText"
  );

const placeVideoCount =
  document.getElementById(
    "placeVideoCount"
  );

const placeVideosList =
  document.getElementById(
    "placeVideosList"
  );

const savePlaceButton =
  document.getElementById(
    "savePlaceButton"
  );

const placeMapsButton =
  document.getElementById(
    "placeMapsButton"
  );

const contentPanel =
  document.getElementById(
    "contentPanel"
  );

const contentPanelTitle =
  document.getElementById(
    "contentPanelTitle"
  );

const contentPanelBody =
  document.getElementById(
    "contentPanelBody"
  );

const closeContentPanel =
  document.getElementById(
    "closeContentPanel"
  );

const toast =
  document.getElementById(
    "toast"
  );

const navButtons =
  document.querySelectorAll(
    ".nav-button"
  );

// =========================================================
// REPRODUCTOR
// =========================================================

const videoModal =
  document.getElementById(
    "videoModal"
  );

const closeVideoModal =
  document.getElementById(
    "closeVideoModal"
  );

const videoPlayer =
  document.getElementById(
    "videoPlayer"
  );

const videoModalTitle =
  document.getElementById(
    "videoModalTitle"
  );

const videoModalPlace =
  document.getElementById(
    "videoModalPlace"
  );

// =========================================================
// UTILIDADES
// =========================================================

function loadJSON(
  key,
  fallback
) {

  try {

    const value =
      localStorage.getItem(key);

    if (!value) {
      return fallback;    }

    return JSON.parse(value);

  } catch (error) {

    console.error(
      `No se pudo leer ${key}:`,
      error
    );

    return fallback;
  }
}

function saveJSON(
  key,
  value
) {

  try {

    localStorage.setItem(
      key,
      JSON.stringify(value)
    );

  } catch (error) {

    console.error(
      `No se pudo guardar ${key}:`,
      error
    );
  }
}

function normalize(text) {

  return String(
    text || ""
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase();
}

function slug(text) {

  return normalize(text)
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-|-$/g,
      ""
    );
}

function escapeHTML(value) {

  return String(
    value || ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

function showToast(message) {

  if (!toast) {
    return;
  }

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );

  window.clearTimeout(
    showToast.timeout
  );

  showToast.timeout =
    window.setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      2500
    );
}

// =========================================================
// CATEGORÍAS
// =========================================================

const categoryIcons = {

  Lugar:
    "📍",

  Mirador:
    "🌄",

  Playa:
    "🏖️",

  Cultura:
    "🎨",

  Parque:
    "🌿",

  Compras:
    "🛍️",

  "Vida nocturna":
    "🍹",

  Transporte:
    "✈️",

  Restaurante:
    "🍴",

  Gastronomía:
    "🥘",

  Consejo:
    "💡"
};

const categoryTips = {

  Lugar:
    "Comprueba horarios y entradas antes de ir.",

  Mirador:
    "El amanecer o el atardecer suelen ofrecer las mejores vistas.",

  Playa:
    "Lleva protección solar, agua y vigila tus pertenencias.",

  Cultura:
    "Ir temprano suele permitir disfrutarlo con más tranquilidad.",

  Parque:
    "Lleva agua y calzado cómodo.",

  Compras:
    "Compara precios antes de comprar y lleva algo de efectivo.",

  "Vida nocturna":
    "Planifica el transporte de vuelta antes de salir.",

  Transporte:
    "Confirma el punto exacto de recogida antes de desplazarte.",

  Restaurante:
    "Comprueba horarios y si es necesario reservar.",

  Gastronomía:
    "Pregunta por la especialidad de la casa.",

  Consejo:
    "Guárdalo para consultarlo durante el viaje."
};// =========================================================
// MAPA
// =========================================================

const map = L.map(
  "map",
  {
    zoomControl: false
  }
).setView(
  CONFIG.center,
  CONFIG.zoom
);

L.control.zoom({
  position: "bottomleft"
}).addTo(map);

L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution: "&copy; OpenStreetMap",
    maxZoom: 19
  }
).addTo(map);

// =========================================================
// ICONOS DEL MAPA
// =========================================================

function markerClass(category) {

  return normalize(category)
    .replace(/\s+/g, "-");
}

function resolveCategoryIcon(category) {

  const raw =
    String(
      category ||
      ""
    ).trim();

  const key =
    normalize(
      raw
    );

  const aliases = {

    lugar:
      "\u{1F4CD}",

    restaurante:
      "\u{1F374}",

    restaurant:
      "\u{1F374}",

    bar:
      "\u{1F379}",

    boteco:
      "\u{1F379}",

    gastronomia:
      "\u{1F958}",

    comida:
      "\u{1F958}",

    playa:
      "\u{1F3D6}\u{FE0F}",

    praia:
      "\u{1F3D6}\u{FE0F}",

    mirador:
      "\u{1F304}",

    viewpoint:
      "\u{1F304}",

    cultura:
      "\u{1F3A8}",

    parque:
      "\u{1F33F}",

    compras:
      "\u{1F6CD}\u{FE0F}",

    shopping:
      "\u{1F6CD}\u{FE0F}",

    "vida nocturna":
      "\u{1F379}",

    nightlife:
      "\u{1F379}",

    transporte:
      "\u{1F695}",

    transport:
      "\u{1F695}",

    consejo:
      "\u{1F4A1}",

    aviso:
      "\u{26A0}\u{FE0F}",

    evento:
      "\u{1F389}",

    precio:
      "\u{1F4B0}",

    otro:
      "\u{2728}"

  };

  return (
    aliases[
      key
    ] ||
    "\u{1F4CD}"
  );
}


// =========================================================
// CREAR ICONO DEL MARCADOR
// =========================================================

function createMarkerIcon(place) {

  const icon =
    resolveCategoryIcon(
      place.category
    );

  return L.divIcon({

    className:
      "",

    html:
      `
        <div
          class="custom-marker ${markerClass(place.category)}"
        >
          <span>${icon}</span>        </div>
      `,

    iconSize:
      [
        38,
        38
      ],

    iconAnchor:
      [
        19,
        38
      ]

  });
}


// =========================================================
// AÑADIR MARCADOR AL MAPA
// =========================================================

function addMarker(place) {

  if (
    !Number.isFinite(
      Number(
        place.lat
      )
    ) ||
    !Number.isFinite(
      Number(
        place.lng
      )
    )
  ) {

    return;
  }

  if (
    markers.has(
      place.id
    )
  ) {

    return;
  }

  const marker =
    L.marker(
      [
        Number(
          place.lat
        ),

        Number(
          place.lng
        )
      ],
      {

        icon:
          createMarkerIcon(
            place
          ),

        title:
          place.name

      }
    )
      .addTo(
        map
      );

  marker.on(
    "click",
    () => {

      openPlace(
        place.id
      );

    }
  );

  markers.set(
    place.id,
    marker
  );
}


function renderMarkers() {

  markers.forEach(
    marker => {

      marker.remove();

    }
  );

  markers.clear();

  places.forEach(
    place => {

      addMarker(
        place
      );

    }
  );
}


// =========================================================
// CARGAR JSON ANTIGUOS
// Seguimos conservando places.json y videos.json
// =========================================================

async function fetchJSON(
  path,
  fallback = []
) {

  try {

    const response =
      await fetch(
        path,
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {

      throw new Error(
        `Error ${response.status} cargando ${path}`
      );
    }

    const data =
      await response.json();

    return Array.isArray(data)
      ? data
      : fallback;

  } catch (error) {

    console.warn(
      `No se pudo cargar ${path}.`,
      error
    );

    return fallback;
  }
}

// =========================================================
// NORMALIZAR LUGARES
// Permite mezclar:
// - lugares originales
// - places.json
// - Supabase
// =========================================================

function normalizePlace(place) {

  return {

    id:
      place.id ||
      slug(
        place.name ||
        place.nombre
      ),

    slug:
      place.slug ||
      slug(
        place.name ||
        place.nombre
      ),

    name:
      place.name ||
      place.nombre ||
      "Lugar",

    zone:
      place.zone ||
      place.zona ||
      place.neighborhood ||
      "",

    city:
      place.city ||
      CONFIG.city,

    country:
      place.country ||
      CONFIG.country,

    category:
      place.category ||
      place.categoria ||
      "Lugar",

    description:
      place.description ||
      place.descripcion ||
      "Descubrimiento guardado en Mundo Infinito.",

    lat:
      Number(
        place.lat ??
        place.latitude
      ),

    lng:
      Number(
        place.lng ??
        place.longitude
      ),

    rating:
      Number(
        place.rating || 5
      ),

    image:
      place.image ||
      place.image_url ||
      "",

    source:
      place.source ||
      "local"
  };
}

// =========================================================
// NORMALIZAR VÍDEOS
// =========================================================

function normalizeVideo(video) {

  return {

    id:
      video.id ||
      `video-${Date.now()}-${Math.random()}`,

    placeId:
      video.placeId ||
      video.place_id ||
      "",

    place:
      video.place ||
      video.lugar ||
      "",

    title:
      video.title ||
      video.titulo ||
      "Vídeo",

    description:
      video.description ||
      video.descripcion ||
      "",

    category:
      video.category ||
      "",

    type:
      video.type ||
      video.tipo ||
      video.source_type ||
      "Vídeo",

    url:
      video.url ||
      video.video_url ||
      video.link ||
      video.enlace ||
      video.source_url ||
      "",

    sourceUrl:
      video.source_url ||
      video.url ||
      video.link ||
      "",

    transcript:
      video.transcript ||
      "",

    duration:
      Number(
        video.duration_seconds || 0
      ),

    source:
      video.source ||
      "local"
  };
}

// =========================================================
// NORMALIZAR DESCUBRIMIENTOS
// =========================================================

function normalizeDiscovery(
  discovery
) {

  return {

    id:
      discovery.id,

    videoId:
      discovery.video_id ||
      discovery.videoId ||
      null,

    placeId:
      discovery.place_id ||
      discovery.placeId ||
      null,

    title:
      discovery.title ||
      "Descubrimiento",

    description:
      discovery.description ||
      "",

    category:
      discovery.category ||
      "Lugar",

    timestampStart:
      Number(
        discovery.timestamp_start || 0
      ),

    timestampEnd:
      discovery.timestamp_end === null ||
      discovery.timestamp_end === undefined
        ? null
        : Number(
            discovery.timestamp_end
          ),

    confidence:
      discovery.confidence === null ||
      discovery.confidence === undefined
        ? null
        : Number(
            discovery.confidence
          ),

    approved:
      Boolean(
        discovery.approved
      )
  };
}

// =========================================================
// COMBINAR LUGARES
// =========================================================

function mergePlaces(
  ...placeGroups
) {

  const combined =
    new Map();

  defaultPlaces
    .map(normalizePlace)
    .forEach(place => {

      combined.set(
        place.id,
        place
      );
    });

  placeGroups.forEach(group => {

    if (!Array.isArray(group)) {
      return;
    }

    group
      .map(normalizePlace)
      .forEach(place => {

        /*
         * Para los lugares de Supabase usamos
         * primero su UUID.
         */

        const existingById =
          combined.get(place.id);

        /*
         * También buscamos por slug para evitar
         * duplicar visualmente un lugar.
         */

        const existingBySlug =
          Array.from(
            combined.values()
          ).find(
            item =>
              item.slug ===
              place.slug
          );

        const existing =
          existingById ||
          existingBySlug;        const existing =
          existingById ||
          existingBySlug;// COMPROBAR CONEXIÓN CON SUPABASE
// =========================================================

async function testSupabaseConnection() {

  if (!supabaseClient) {

    supabaseOnline = false;

    return false;
  }

  try {

    const {
      error
    } =
      await supabaseClient
        .from("places")
        .select(
          "id",
          {
            head: true,
            count: "exact"
          }
        );

    if (error) {
      throw error;
    }

    supabaseOnline = true;

    console.log(
      "☁️ Base compartida disponible"
    );

    return true;

  } catch (error) {

    supabaseOnline = false;

    console.warn(
      "Mundo Infinito continuará sin conexión compartida:",
      error
    );

    return false;
  }
}

// =========================================================
// MARCADORES
// =========================================================

function addMarker(place) {

  if (
    !Number.isFinite(
      place.lat
    ) ||
    !Number.isFinite(
      place.lng
    )
  ) {

    return;
  }

  if (
    markers.has(
      place.id
    )
  ) {

    return;
  }

  const marker =
    L.marker(
      [
        place.lat,
        place.lng
      ],
      {
        icon:
          createMarkerIcon(
            place
          ),

        title:
          place.name
      }
    ).addTo(map);

  marker.on(
    "click",
    () => {

      openPlace(
        place.id
      );
    }
  );

  markers.set(
    place.id,
    marker
  );
}

function renderMarkers() {

  markers.forEach(
    marker => {

      marker.remove();
    }
  );

  markers.clear();

  places.forEach(
    place => {

      addMarker(
        place
      );
    }
  );
}

// =========================================================
// BUSCAR LUGAR
// =========================================================

function getPlaceById(
  placeId
) {

  return places.find(
    place =>
      place.id ===
      placeId
  );
}

// =========================================================
// DESCUBRIMIENTOS DE UN LUGAR
// =========================================================

function getDiscoveriesForPlace(
  place
) {

  if (!place) {
    return [];
  }

  return discoveries.filter(
    discovery =>
      discovery.placeId ===
      place.id
  );
}

// =========================================================
// VÍDEOS DE UN LUGAR
// =========================================================

function getVideosForPlace(
  place
) {

  const placeNameNormalized =
    normalize(
      place.name
    );

  /*
   * Primero obtenemos IDs de vídeos relacionados
   * mediante la tabla discoveries.
   */

  const relatedVideoIds =
    new Set(
      getDiscoveriesForPlace(
        place
      )
        .map(
          discovery =>
            discovery.videoId
        )
        .filter(Boolean)
    );

  return videos.filter(
    video => {

      /*
       * Nueva relación Supabase.
       */

      if (
        relatedVideoIds.has(
          video.id
        )
      ) {

        return true;
      }

      /*
       * Compatibilidad con videos.json antiguo.
       */

      if (
        video.placeId &&
        video.placeId ===
        place.id
      ) {

        return true;
      }

      /*
       * Compatibilidad por nombre.
       */

      if (
        video.place &&
        normalize(
          video.place
        ) ===
        placeNameNormalized
      ) {

        return true;
      }

      return false;
    }
  );
}

// =========================================================
// TIMESTAMP DE UN VÍDEO PARA UN LUGAR
// =========================================================

function getVideoTimestampForPlace(
  videoId,
  placeId
) {

  const discovery =
    discoveries.find(
      item =>
        item.videoId ===
          videoId &&
        item.placeId ===
          placeId
    );

  if (!discovery) {
    return 0;
  }

  return Number(
    discovery.timestampStart || 0
  );
}

// =========================================================
// FORMATEAR TIMESTAMP
// Ejemplo: 65 segundos → 01:05
// =========================================================

function formatTimestamp(
  seconds
) {

  const total =
    Math.max(
      0,
      Math.floor(
        Number(seconds) || 0
      )
    );

  const minutes =
    Math.floor(
      total / 60
    );

  const remainingSeconds =
    total % 60;

  return (
    String(minutes)
      .padStart(
        2,
        "0"
      ) +
    ":" +
    String(remainingSeconds)
      .padStart(
        2,
        "0"
      )
  );
}// =========================================================
// APP.JS v0.5.0 · BLOQUE 3
// Fichas + vídeos + timestamps + favoritos
// =========================================================

// =========================================================
// ABRIR FICHA DE LUGAR
// =========================================================

function openPlace(placeId) {

  const place =
    getPlaceById(
      placeId
    );

  if (!place) {
    return;
  }  selectedPlace =
    place;

  closeContent();

  placeCoverIcon.textContent =
    categoryIcons[
      place.category
    ] || "📍";

  placeCategory.textContent =
    place.category;

  placeName.textContent =
    place.name;

  placeZone.textContent =
    [
      place.zone,
      place.city
    ]
      .filter(Boolean)
      .join(" · ");

  placeDescription.textContent =
    place.description;

  placeLocationText.textContent =
    [
      place.zone,
      place.city,
      place.country ||
        CONFIG.country
    ]
      .filter(Boolean)
      .join(", ");

  placeTip.textContent =
    categoryTips[
      place.category
    ] ||
    "Consulta tus descubrimientos antes de visitar este lugar.";

  const mapsQuery =
    encodeURIComponent(
      `${place.name}, ${place.zone}, ${place.city}, ${place.country || CONFIG.country}`
    );

  placeMapsButton.href =
    `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  renderPlaceVideos(
    place
  );

  updateSavedButton();

  placePanel.classList.add(
    "open"
  );

  placePanel.setAttribute(
    "aria-hidden",
    "false"
  );
}

// =========================================================
// CERRAR FICHA
// =========================================================

function closePlace() {

  placePanel.classList.remove(
    "open"
  );

  placePanel.setAttribute(
    "aria-hidden",
    "true"
  );

  selectedPlace =
    null;
}

closePlacePanel.addEventListener(
  "click",
  closePlace
);

// =========================================================
// MOSTRAR VÍDEOS DEL LUGAR
// =========================================================

function renderPlaceVideos(
  place
) {

  const relatedVideos =
    getVideosForPlace(
      place
    );

  placeVideoCount.textContent =
    relatedVideos.length;

  placeVideoActionText.textContent =
    relatedVideos.length === 1
      ? "1 vídeo"
      : `${relatedVideos.length} vídeos`;

  if (
    relatedVideos.length === 0
  ) {

    placeVideosList.innerHTML = `
      <div class="empty-state">

        <span>🎥</span>

        <strong>
          Todavía no hay vídeos
        </strong>

        <p>
          Los vídeos relacionados con este lugar aparecerán aquí.
        </p>

      </div>
    `;

    return;
  }

  placeVideosList.innerHTML =
    relatedVideos
      .map(video => {

        const timestamp =
          getVideoTimestampForPlace(
            video.id,
            place.id
          );

        const timestampHTML =
          timestamp > 0
            ? `
              <span class="video-source">
                ▶ ${formatTimestamp(timestamp)}
              </span>
            `
            : `
              <span class="video-source">
                ${escapeHTML(video.type || "Vídeo")}
              </span>
            `;

        return `
          <button
            class="video-card"
            type="button"
            data-video-id="${escapeHTML(video.id)}"
            data-video-time="${timestamp}"
          >

            <div class="video-thumb"></div>

            <div class="video-info">

              <strong>
                ${escapeHTML(video.title)}
              </strong>

              <p>
                ${
                  escapeHTML(
                    video.description ||
                    place.name
                  )
                }
              </p>

              ${timestampHTML}

            </div>

          </button>
        `;
      })
      .join("");

  placeVideosList
    .querySelectorAll(
      "[data-video-id]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const video =
            videos.find(
              item =>
                item.id ===
                button.dataset.videoId
            );

          const timestamp =
            Number(
              button.dataset.videoTime ||
              0
            );

          openVideo(
            video,
            timestamp
          );
        }
      );
    });
}

// =========================================================
// BOTÓN "VÍDEOS" DE LA FICHA
// =========================================================

placeVideosButton.addEventListener(
  "click",
  () => {

    if (!selectedPlace) {
      return;
    }

    const relatedVideos =
      getVideosForPlace(
        selectedPlace
      );

    if (
      relatedVideos.length === 0
    ) {

      showToast(
        "Todavía no hay vídeos para este lugar"
      );

      return;
    }

    placeVideosList.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
);

// =========================================================
// REPRODUCTOR DE VÍDEO
// Permite comenzar en un segundo concreto
// =========================================================

function openVideo(
  video,
  startAt = 0
) {

  if (
    !video ||
    !video.url
  ) {

    showToast(
      "Este vídeo todavía no tiene archivo"
    );

    return;
  }

  /*
   * Instagram, TikTok, YouTube, etc.
   * se siguen abriendo fuera si no son un MP4 directo.
   */

  const externalURL =
    /^https?:\/\//i.test(
      video.url
    );

  const directVideo =
    /\.(mp4|webm|ogg)(\?.*)?$/i.test(
      video.url
    );

  if (
    externalURL &&
    !directVideo
  ) {

    window.open(
      video.url,
      "_blank",
      "noopener,noreferrer"
    );

    return;
  }

  if (
    !videoModal ||
    !videoPlayer
  ) {

    window.open(
      video.url,
      "_blank"
    );

    return;
  }

  videoModalTitle.textContent =
    video.title ||
    "Vídeo";

  videoModalPlace.textContent =
    video.place ||
    "Brasil";

  videoPlayer.src =
    video.url;

  videoModal.classList.add(
    "open"
  );

  videoModal.setAttribute(
    "aria-hidden",
    "false"
  );

  /*
   * Esperamos a que el navegador conozca
   * la duración antes de saltar al timestamp.
   */

  videoPlayer.onloadedmetadata =
    () => {

      const safeStart =
        Math.max(
          0,
          Number(startAt) || 0
        );

      if (
        safeStart > 0 &&
        Number.isFinite(
          videoPlayer.duration
        )
      ) {

        videoPlayer.currentTime =
          Math.min(
            safeStart,
            Math.max(
              0,
              videoPlayer.duration - 0.2
            )
          );
      }

      videoPlayer
        .play()
        .catch(() => {
          // Algunos navegadores requieren pulsar Play.
        });
    };
}

// =========================================================
// CERRAR VÍDEO
// =========================================================

function closeVideo() {

  if (!videoPlayer) {
    return;
  }

  videoPlayer.pause();

  videoPlayer.onloadedmetadata =
    null;

  videoPlayer.removeAttribute(
    "src"
  );

  videoPlayer.load();

  videoModal.classList.remove(
    "open"
  );

  videoModal.setAttribute(
    "aria-hidden",
    "true"
  );
}

if (
  closeVideoModal
) {

  closeVideoModal.addEventListener(
    "click",
    closeVideo
  );
}

if (
  videoModal
) {

  videoModal.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        videoModal
      ) {

        closeVideo();
      }
    }
  );
}

// =========================================================
// FAVORITOS
// Por ahora siguen siendo personales en el dispositivo.
// =========================================================

function getSavedPlaces() {

  const saved =
    loadJSON(
      CONFIG.storage.savedPlaces,
      []
    );

  return Array.isArray(saved)
    ? saved
    : [];
}

function isPlaceSaved(
  placeId
) {

  return getSavedPlaces()
    .includes(
      placeId
    );
}

function updateSavedButton() {

  if (!selectedPlace) {
    return;
  }

  const saved =
    isPlaceSaved(
      selectedPlace.id
    );

  savePlaceButton
    .classList
    .toggle(
      "saved",
      saved
    );

  savePlaceButton.innerHTML =
    saved
      ? `
          <span>♥</span>
          <b>Guardado</b>
        `
      : `
          <span>♡</span>
          <b>Guardar</b>
        `;
}

savePlaceButton.addEventListener(
  "click",
  () => {

    if (!selectedPlace) {
      return;
    }

    const saved =
      getSavedPlaces();

    const index =
      saved.indexOf(
        selectedPlace.id
      );

    if (
      index >= 0
    ) {

      saved.splice(
        index,
        1
      );

      showToast(
        "Eliminado de Guardados"
      );

    } else {

      saved.push(
        selectedPlace.id
      );

      showToast(
        "Guardado en Mundo Infinito"
      );
    }

    saveJSON(
      CONFIG.storage.savedPlaces,
      saved
    );

    updateSavedButton();
  }
);// BUSCADOR
// Lugares de Mundo Infinito + ciudades de Brasil
// =========================================================

function searchPlaces(
  query
) {

  const words =
    normalize(query)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    words.length === 0
  ) {

    return [];
  }

  return places.filter(
    place => {

      const searchable =
        normalize(
          [
            place.name,
            place.zone,
            place.city,
            place.category,
            place.description
          ].join(" ")
        );

      return words.every(
        word =>
          searchable.includes(
            word
          )
      );
    }
  );
}


// =========================================================
// BÚSQUEDA DE CIUDADES DE BRASIL
// No crea marcadores ni guarda nada.
// Solo mueve el mapa.
// =========================================================

let citySearchTimer =
  null;

let citySearchController =
  null;

let citySearchRun =
  0;


async function searchBrazilCities(
  query
) {

  const text =
    String(
      query ||
      ""
    ).trim();

  if (
    text.length <
    2
  ) {

    return [];
  }


  if (
    citySearchController
  ) {

    citySearchController.abort();

  }


  citySearchController =
    new AbortController();


  const params =
    new URLSearchParams({

      q:
        text,

      format:
        "jsonv2",

      addressdetails:
        "1",

      namedetails:
        "1",

      limit:
        "10",

      countrycodes:
        "br"

    });


  const response =
    await fetch(
      "https://nominatim.openstreetmap.org/search?" +
      params.toString(),
      {

        signal:
          citySearchController.signal,

        headers: {

          "Accept":
            "application/json",

          "Accept-Language":
            "pt-BR,pt;q=0.9,es;q=0.8"

        }

      }
    );


  if (
    !response.ok
  ) {

    throw new Error(
      `No se pudieron buscar ciudades (${response.status})`
    );

  }


  const data =
    await response.json();


  if (
    !Array.isArray(
      data
    )
  ) {

    return [];

  }


  const uniqueCities =
    new Map();


  data.forEach(
    item => {

      const address =
        item.address ||
        {};


      const countryCode =
        String(
          address.country_code ||
          ""
        ).toLowerCase();


      if (
        countryCode &&
        countryCode !==
          "br"
      ) {

        return;

      }


      const type =
        String(
          item.addresstype ||
          item.type ||
          ""
        ).toLowerCase();


      const cityName =
        String(

          address.city ||

          address.town ||

          address.municipality ||

          address.village ||

          (
            [
              "city",
              "town",
              "municipality",
              "village",
              "administrative"
            ].includes(type)

              ? (
                  item.namedetails?.name ||
                  item.name ||
                  ""
                )

              : ""
          )

        ).trim();


      const state =
        String(
          address.state ||
          ""
        ).trim();


      const lat =
        Number(
          item.lat
        );


      const lng =
        Number(
          item.lon
        );


      if (
        !cityName ||
        !Number.isFinite(
          lat
        ) ||
        !Number.isFinite(
          lng
        )
      ) {

        return;

      }


      const key =
        normalize(
          `${cityName}-${state}`
        );


      if (
        uniqueCities.has(
          key
        )
      ) {

        return;      }


      uniqueCities.set(
        key,
        {

          name:
            cityName,

          state,

          country:
            "Brasil",

          lat,

          lng

        }
      );

    }
  );


  return Array.from(
    uniqueCities.values()
  )
    .slice(
      0,
      5
    );
}


// =========================================================
// MOSTRAR RESULTADOS DE BÚSQUEDA
// =========================================================

function renderSearchResults(
  localResults,
  cityResults = [],
  {
    searchingCities = false,
    citySearchError = false
  } = {}
) {

  const query =
    searchInput.value.trim();


  if (!query) {

    searchResults.innerHTML =
      "";

    searchResults.classList.add(
      "hidden"
    );

    clearSearch.classList.add(
      "hidden"
    );

    return;

  }


  clearSearch.classList.remove(
    "hidden"
  );


  const localHTML =

    localResults.length

      ? `
        <div class="search-results-group">

          <div class="search-results-label">
            Mundo Infinito
          </div>

          ${
            localResults
              .slice(
                0,
                6
              )
              .map(
                place => `
                  <button
                    class="search-result"
                    type="button"
                    data-place-id="${escapeHTML(place.id)}"
                  >

                    <div class="search-result-icon">
                      ${
                        typeof resolveCategoryIcon ===
                        "function"

                          ? resolveCategoryIcon(
                              place.category
                            )

                          : "&#128205;"
                      }
                    </div>

                    <div>

                      <strong>
                        ${escapeHTML(place.name)}
                      </strong>

                      <small>
                        ${
                          escapeHTML(
                            [
                              place.zone,
                              place.city,
                              place.category
                            ]
                              .filter(Boolean)
                              .join(" · ")
                          )
                        }
                      </small>

                    </div>

                  </button>
                `
              )
              .join("")
          }

        </div>
      `

      : "";


  const cityHTML =

    cityResults.length

      ? `
        <div class="search-results-group">

          <div class="search-results-label">
            Ir a una ciudad
          </div>

          ${
            cityResults
              .map(
                (city, index) => `
                  <button
                    class="search-result search-city-result"
                    type="button"
                    data-city-index="${index}"
                  >

                    <div class="search-result-icon">
                      &#128506;
                    </div>

                    <div>

                      <strong>
                        ${escapeHTML(city.name)}
                      </strong>

                      <small>
                        ${
                          escapeHTML(
                            [
                              city.state,
                              city.country
                            ]
                              .filter(Boolean)
                              .join(" · ")
                          )
                        }
                      </small>

                    </div>

                  </button>
                `
              )
              .join("")
          }

        </div>
      `

      : "";


  let statusHTML =
    "";


  if (
    searchingCities
  ) {

    statusHTML = `
      <div class="no-results search-city-status">

        <span>
          &#8987;
        </span>

        <strong>
          Buscando ciudades de Brasil...
        </strong>

      </div>
    `;

  } else if (
    citySearchError &&
    localResults.length === 0
  ) {

    statusHTML = `
      <div class="no-results">

        <span>
          &#128269;
        </span>

        <strong>
          No se pudo buscar la ciudad
        </strong>

        <p>
          Prueba de nuevo en unos segundos.
        </p>

      </div>
    `;

  } else if (
    localResults.length === 0 &&
    cityResults.length === 0
  ) {

    statusHTML = `
      <div class="no-results">

        <span>
          &#128269;
        </span>

        <strong>
          Sin resultados
        </strong>

        <p>
          Prueba con otro lugar o ciudad de Brasil.
        </p>

      </div>
    `;

  }


  searchResults.innerHTML =
    localHTML +
    cityHTML +
    statusHTML;


  searchResults
    .querySelectorAll(
      "[data-place-id]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const place =
              getPlaceById(
                button.dataset.placeId
              );


            if (!place) {

              return;

            }


            searchInput.value =
              place.name;


            searchResults.classList.add(
              "hidden"
            );


            map.setView(
              [
                place.lat,
                place.lng
              ],
              16
            );


            window.setTimeout(
              () => {

                openPlace(
                  place.id
                );

              },
              250
            );

          }
        );

      }
    );


  searchResults
    .querySelectorAll(
      "[data-city-index]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const city =
              cityResults[
                Number(
                  button.dataset.cityIndex
                )
              ];


            if (!city) {

              return;

            }


            searchInput.value =
              city.name;


            searchResults.classList.add(
              "hidden"
            );


            closePlace();

            closeContent();


            map.flyTo(
              [
                city.lat,
                city.lng
              ],
              12,
              {

                duration:
                  1.2

              }
            );


            showToast(
              `Explorando ${city.name}`
            );

          }
        );

      }
    );


  searchResults.classList.remove(
    "hidden"
  );

}


// =========================================================
// ACTUALIZAR BÚSQUEDA
// =========================================================

function updateSearch() {

  const query =
    searchInput.value.trim();


  const localResults =
    searchPlaces(
      query
    );


  citySearchRun +=
    1;


  const runId =
    citySearchRun;


  if (
    citySearchTimer
  ) {

    window.clearTimeout(
      citySearchTimer
    );

  }


  if (
    citySearchController
  ) {

    citySearchController.abort();

    citySearchController =
      null;

  }


  if (
    query.length <
    2
  ) {

    renderSearchResults(
      localResults,
      []
    );

    return;

  }


  renderSearchResults(
    localResults,
    [],
    {
      searchingCities:
        true
    }
  );


  citySearchTimer =
    window.setTimeout(
      async () => {

        try {

          const cityResults =
            await searchBrazilCities(
              query
            );


          if (
            runId !==
            citySearchRun
          ) {

            return;

          }


          renderSearchResults(
            localResults,
            cityResults
          );


        } catch (
          error
        ) {

          if (
            error?.name ===
            "AbortError"
          ) {

            return;

          }


          console.warn(
            "No se pudieron buscar ciudades:",
            error
          );


          if (
            runId !==
            citySearchRun
          ) {

            return;

          }


          renderSearchResults(
            localResults,
            [],
            {
              citySearchError:
                true
            }
          );

        }

      },
      350
    );

}


searchInput.addEventListener(
  "input",
  updateSearch
);


clearSearch.addEventListener(
  "click",
  () => {

    citySearchRun +=
      1;


    if (
      citySearchTimer
    ) {

      window.clearTimeout(
        citySearchTimer
      );

    }


    if (
      citySearchController
    ) {

      citySearchController.abort();

      citySearchController =
        null;

    }


    searchInput.value =
      "";


    searchResults.innerHTML =
      "";


    searchResults.classList.add(
      "hidden"
    );


    clearSearch.classList.add(
      "hidden"
    );


    searchInput.focus();


    closePlace();


    map.setView(
      CONFIG.center,
      CONFIG.zoom
    );

  }
);


document.addEventListener(
  "click",
  event => {

    if (
      !event.target.closest(
        ".search-wrap"
      ) &&
      !event.target.closest(
        "#searchResults"
      )
    ) {

      searchResults.classList.add(
        "hidden"
      );

    }

  }
);


// =========================================================
// APP.JS v0.5.0 · BLOQUE 4
// ➕ compartido con Supabase
// =========================================================

// =========================================================
// ABRIR / CERRAR FORMULARIO
// =========================================================

function openAddDiscovery() {

  closePlace();
  closeContent();

  discoveryModal.classList.add(
    "open"
  );

  discoveryModal.setAttribute(
    "aria-hidden",
    "false"
  );

  window.setTimeout(
    () => {

      const input =
        document.getElementById(
          "discoveryTitle"
        );

      if (input) {
        input.focus();
      }

    },
    200
  );
}

function closeAddDiscovery() {

  discoveryModal.classList.remove(
    "open"
  );

  discoveryModal.setAttribute(
    "aria-hidden",
    "true"
  );
}

openDiscoveryModal.addEventListener(
  "click",
  openAddDiscovery
);

closeDiscoveryModal.addEventListener(
  "click",
  closeAddDiscovery
);

discoveryModal.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      discoveryModal
    ) {

      closeAddDiscovery();
    }
  }
);

// =========================================================
// USAR CENTRO DEL MAPA
// =========================================================

useMapCenter.addEventListener(
  "click",
  () => {

    const center =
      map.getCenter();

    discoveryLat.value =
      center.lat.toFixed(6);

    discoveryLng.value =
      center.lng.toFixed(6);

    showToast(
      "Coordenadas del mapa añadidas"
    );
  }
);

// =========================================================
// BUSCAR SI EL LUGAR YA EXISTE EN SUPABASE
// =========================================================

async function findSupabasePlaceBySlug(
  placeSlug
) {

  if (!supabaseClient) {
    return null;
  }

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("places")
        .select("*")
        .eq(
          "slug",
          placeSlug
        )
        .maybeSingle();

    if (error) {
      throw error;
    }

    return data || null;

  } catch (error) {

    console.error(
      "Error buscando el lugar:",
      error
    );

    return null;
  }
}

// =========================================================
// CREAR O REUTILIZAR LUGAR
// =========================================================3323 // =========================================================
3324
3325 async function createOrGetPlace({
3326 name,
3327 zone,
3328 category,
3329 description,
3330 lat,
3331 lng
3332 }) {
3333
3334 const placeSlug =
3335 slug(name);
3336
3337 const existing =
3338 await findSupabasePlaceBySlug(
3339 placeSlug
3340 );
3341
3342 if (existing) {
3343
3344 if (
3345 Number.isFinite(
3346 Number(lat)
3347 ) &&
3348 Number.isFinite(
3349 Number(lng)
3350 )
3351 ) {
3352
3353 const {
3354 data:
3355 updatedPlace,
3356
3357 error:
3358 updateError
3359 } =
3360
3361 await supabaseClient
3362 .from("places")
3363 .update({
3364
3365 zone:
3366 zone ||
3367 existing.zone,
3368
3369 category:
3370 category ||
3371 existing.category,
3372
3373 description:
3374 description ||
3375 existing.description,
3376
3377 latitude:
3378 Number(lat),
3379
3380 longitude:
3381 Number(lng)
3382
3383 })
3384 .eq(
3385 "id",
3386 existing.id
3387 )
3388 .select()
3389 .single();
3390
3391
3392 if (
3393 !updateError &&
3394 updatedPlace
3395 ) {
3396
3397 console.log(
3398 "n Coordenadas actualizadas:",
3399 name,
3400 lat,
3401 lng
3402 );
3403
3404 return normalizePlace({
3405 ...updatedPlace,
3406 source:
3407 "supabase"
3408 });
3409
3410 }
3411
3412
3413 if (
3414 updateError
3415 ) {
3416
3417 console.warn(
3418 "No se pudieron actualizar las coordenadas de:",
3419 name,
3420 updateError
3421 );
3422
3423 }
3424
3425 }
3426
3427
3428 return normalizePlace({
3429 ...existing,
3430 source:
3431 "supabase"
3432 });
3433
3434 }
3435
3436
3437 const {
3438 data,
3439 error
3440 } =
3441 await supabaseClient
3442 .from("places")
3443 .insert({
3444 slug:
3445 placeSlug,
3446
3447 name,
3448
3449 category,
3450
3451 zone,
3452
3453 city:
3454 CONFIG.city,
3455
3456 country:
3457 CONFIG.country,
3458
3459 description,
3460
3461 latitude:
3462 Number.isFinite(
3463 Number(lat)
3464 )
3465 ? Number(lat)
3466 : null,
3467
3468 longitude:
3469 Number.isFinite(
3470 Number(lng)
3471 )
3472 ? Number(lng)
3473 : null
3474 })
3475 .select()
3476 .single();
3477
3478
3479 if (error) {
3480 throw error;
3481 }
3482
3483
3484 return normalizePlace({
3485 ...data,
3486 source:
3487 "supabase"
3488 });
3489
3490 }
3491
3492 // =========================================================
3493 // CREAR VÍDEO EN SUPABASE
3494 // =========================================================
3495
3496 async function createSupabaseVideo({
3497 title,
3498 description,
3499 url
3500 }) {
3501
3502 if (!url) {
3503 return null;
3504 }
3505
3506 /*
3507 * Si ya existe la misma URL, reutilizamos el vídeo.
3508 */
3509
3510 const {
3511 data: existingVideos,
3512 error: searchError
3513 } =
3514 await supabaseClient
3515 .from("videos")
3516 .select("*")
3517 .eq(
3518 "source_url",
3519 url
3520 )
3521 .limit(1);
3522
3523 if (searchError) {
3524 throw searchError;
3525 }
3526
3527 if (
3528 Array.isArray(
3529 existingVideos
3530 ) &&
3531 existingVideos.length > 0
3532 ) {
3533
3534 return normalizeVideo({
3535 ...existingVideos[0],
3536 source:
3537 "supabase"
3538 });
3539 }
3540
3541 const sourceType =
3542 url.includes(
3543 "instagram.com"
3544 )
3545 ? "Instagram"
3546 : url.includes(
3547 "tiktok.com"
3548 )
3549 ? "TikTok"
3550 : url.includes(
3551 "youtube.com"
3552 ) ||
3553 url.includes(
3554 "youtu.be"
3555 )
3556 ? "YouTube"
3557 : "Vídeo";
3558
3559 const {
3560 data,
3561 error
3562 } =
3563 await supabaseClient
3564 .from("videos")
3565 .insert({
3566 title,
3567
3568 description,
3569
3570 /*
3571 * Para enlaces externos usamos source_url.
3572 * video_url quedará para MP4 alojados.
3573 */
3574
3575 video_url:
3576 null,
3577
3578 source_type:
3579 sourceType,
3580
3581 source_url:
3582 url,
3583
3584 transcript:
3585 null,
3586
3587 duration_seconds:
3588 null
3589 })
3590 .select()
3591 .single();
3592
3593 if (error) {
3594 throw error;
3595 }
3596
3597 return normalizeVideo({
3598 ...data,
3599 source:
3600 "supabase"
3601 });
3602 }
3603
3604 // =========================================================
3605 // CREAR DESCUBRIMIENTO
3606 // =========================================================
3607
3608 async function createSupabaseDiscovery({
3609 title,
3610 description,
3611 category,
3612 placeId,
3613 videoId = null,
3614 timestampStart = 0,
3615 timestampEnd = null
3616 }) {
3617
3618 const {
3619 data,
3620 error
3621 } =
3622 await supabaseClient
3623 .from("discoveries")
3624 .insert({
3625 video_id:
3626 videoId,
3627
3628 place_id:
3629 placeId,
3630
3631 title,
3632
3633 description,
3634
3635 category,
3636
3637 timestamp_start:
3638 timestampStart,
3639
3640 timestamp_end:
3641 timestampEnd,
3642
3643 /*
3644 * Como todavía lo introduce una persona,
3645 * lo consideramos aprobado.
3646 *
3647 * Cuando llegue la IA, las propuestas
3648 * automáticas entrarán con approved=false.
3649 */
3650
3651 confidence:
3652 1,
3653
3654 approved:
3655 true
3656 })
3657 .select()
3658 .single();
3659
3660 if (error) {
3661 throw error;
3662 }
3663
3664 return normalizeDiscovery(
3665 data
3666 );
3667 }
3668
3669 // =========================================================
3670 // FALLBACK LOCAL
3671 // Si Supabase falla, no perdemos lo escrito.
3672 // =========================================================
3673
3674 function saveDiscoveryLocally({
3675 title,
3676 placeText,
3677 category,
3678 link,
3679 comment,
3680 lat,
3681 lng
3682 }) {
3683
3684 const localDiscoveries =
3685 loadJSON(
3686 CONFIG.storage.discoveries,
3687 []
3688 );
3689
3690 const localId =
3691 `local-${slug(title)}-${Date.now()}`;
3692
3693 const localDiscovery = {
3694
3695 id:
3696 localId,
3697
3698 title,
3699
3700 name:
3701 title,
3702
3703 place:
3704 placeText,
3705
3706 zone:
3707 placeText,
3708
3709 category,
3710
3711 link,
3712
3713 comment,
3714
3715 description:
3716 comment ||
3717 "Descubrimiento añadido por un Explorador.",
3718
3719 lat,
3720
3721 lng,
3722
3723 createdAt:
3724 new Date().toISOString()
3725 };
3726
3727 localDiscoveries.push(
3728 localDiscovery
3729 );
3730
3731 saveJSON(
3732 CONFIG.storage.discoveries,
3733 localDiscoveries
3734 );
3735
3736 return localDiscovery;
3737 }
3738
3739 // =========================================================
3740 // FORMULARIO n · v0.6
3741 // Vídeo → exploración → varios detalles → revisión → guardar
3742 // =========================================================
3743
3744 const discoveryVideoLink = document.getElementById("discoveryVideoLink");
3745 const discoveryVideoFile = document.getElementById("discoveryVideoFile");
3746 const discoveryVideoPreview = document.getElementById("discoveryVideoPreview");
3747 const discoveryPreviewPlayer = document.getElementById("discoveryPreviewPlayer");
3748 const videoExplorationStatus = document.getElementById("videoExplorationStatus");
3749 const explorationMessage = document.getElementById("explorationMessage");
3750 const explorationProgressBar = document.getElementById("explorationProgressBar");
3751 const explorationResults = document.getElementById("explorationResults");
3752 const detectedDetailsCount = document.getElementById("detectedDetailsCount");
3753 const detectedDetailsList = document.getElementById("detectedDetailsList");
3754 const addManualDetailButton = document.getElementById("addManualDetailButton");
3755 const manualDetailEditor = document.getElementById("manualDetailEditor");
3756 const detailType = document.getElementById("detailType");
3757 const discoveryTitle = document.getElementById("discoveryTitle");
3758 const discoveryPlace = document.getElementById("discoveryPlace");
3759 const discoveryCategory = document.getElementById("discoveryCategory");
3760 const detailTimestampStart = document.getElementById("detailTimestampStart");
3761 const detailTimestampEnd = document.getElementById("detailTimestampEnd");
3762 const useCurrentVideoTime = document.getElementById("useCurrentVideoTime");
3763 const discoveryComment = document.getElementById("discoveryComment");
3764 const addDetailToDraft = document.getElementById("addDetailToDraft");
3765 const cancelDetailEdit = document.getElementById("cancelDetailEdit");
3766 const videoDraftSummary = document.getElementById("videoDraftSummary");
3767 const videoDraftDetailsList = document.getElementById("videoDraftDetailsList");
3768 const draftDetailsCount = document.getElementById("draftDetailsCount");
3769 const saveAllDiscoveriesButton = document.getElementById("saveAllDiscoveriesButton");
3770 const discoveryCard = document.querySelector(".discovery-v06-card");
3771
3772 let discoveryDraft = [];
3773 let editingDraftIndex = null;
3774 let explorationTimer = null;
3775 let localVideoObjectURL = null;
3776
3777 function parseTimestamp(value) {
3778 const text = String(value || "").trim();
3779 if (!text) return 0;
3780 if (/^\d+$/.test(text)) return Math.max(0, Number(text));
3781 const parts = text.split(":").map(Number);
3782 if (parts.some(part => !Number.isFinite(part))) return 0;
3783 if (parts.length === 2) return Math.max(0, parts[0] * 60 + parts[1]);
3784 if (parts.length === 3) return Math.max(0, parts[0] * 3600 + parts[1] * 60 + parts[2]);
3785 return 0;
3786 }
3787
3788 function detailIcon(item) {
3789 const typeIcons = {
3790 Lugar: "n",
3791 Restaurante: "n",
3792 Bar: "n",
3793 Playa: "nn",
3794 Mirador: "n",
3795 Consejo: "n",
3796 Precio: "n",
3797 Transporte: "n",
3798 Aviso: "nn",
3799 Compras: "nn",
3800 Evento: "n",
3801 Otro: "n"
3802 };
3803
3804 return (
3805 typeIcons[
3806 item.type
3807 ] ||
3808 resolveCategoryIcon(
3809 item.category
3810 )
3811 );
3812 }
3813
3814 function resetDetailEditor() {
3815 editingDraftIndex = null;
3816 if (detailType) detailType.value = "Lugar";
3817 if (discoveryTitle) discoveryTitle.value = "";
3818 if (discoveryPlace) discoveryPlace.value = "";
3819 if (discoveryCategory) discoveryCategory.value = "";
3820 if (detailTimestampStart) detailTimestampStart.value = "00:00";
3821 if (detailTimestampEnd) detailTimestampEnd.value = "";
3822 if (discoveryComment) discoveryComment.value = "";
3823 if (discoveryLat) discoveryLat.value = "";
3824 if (discoveryLng) discoveryLng.value = "";
3825 if (addDetailToDraft) addDetailToDraft.textContent = "n Añadir detalle";
3826 if (cancelDetailEdit) cancelDetailEdit.classList.add("hidden");
3827 }
3828
3829 function resetDiscoveryFlow() {
3830 discoveryDraft = [];
3831 editingDraftIndex = null;
3832 if (explorationTimer) window.clearInterval(explorationTimer);
3833 explorationTimer = null;
3834 if (localVideoObjectURL) URL.revokeObjectURL(localVideoObjectURL);
3835 localVideoObjectURL = null;
3836 discoveryForm.reset();
3837 resetDetailEditor();
3838 discoveryCard?.classList.remove("is-exploring", "has-results");
3839 videoExplorationStatus?.classList.remove("active");
3840 explorationResults?.classList.remove("active");
3841 videoDraftSummary?.classList.remove("active");
3842 manualDetailEditor?.classList.remove("open");
3843 saveAllDiscoveriesButton?.classList.remove("visible");
3844 if (detectedDetailsList) detectedDetailsList.innerHTML = "";
3845 if (videoDraftDetailsList) videoDraftDetailsList.innerHTML = "";
3846 if (detectedDetailsCount) detectedDetailsCount.textContent = "0";
3847 if (draftDetailsCount) draftDetailsCount.textContent = "0";
3848 if (explorationProgressBar) explorationProgressBar.style.width = "0%";
3849 if (discoveryVideoPreview) discoveryVideoPreview.classList.add("hidden");
3850 if (discoveryPreviewPlayer) {
3851 discoveryPreviewPlayer.pause();
3852 discoveryPreviewPlayer.removeAttribute("src");
3853 discoveryPreviewPlayer.load();
3854 }
3855 }
3856
3857 function openAddDiscovery() {
3858 closePlace();
3859 closeContent();
3860 resetDiscoveryFlow();
3861 discoveryModal.classList.add("open");
3862 discoveryModal.setAttribute("aria-hidden", "false");
3863 window.setTimeout(() => discoveryVideoLink?.focus(), 180);
3864 }
3865
3866 function closeAddDiscovery() {
3867 if (explorationTimer) window.clearInterval(explorationTimer);
3868 discoveryModal.classList.remove("open");
3869 discoveryModal.setAttribute("aria-hidden", "true");
3870 }
3871
3872 openDiscoveryModal.addEventListener("click", openAddDiscovery);
3873 closeDiscoveryModal.addEventListener("click", closeAddDiscovery);
3874 discoveryModal.addEventListener("click", event => {
3875 if (event.target === discoveryModal) closeAddDiscovery();
3876 });
3877
3878 useMapCenter.addEventListener("click", () => {
3879 const center = map.getCenter();
3880 discoveryLat.value = center.lat.toFixed(6);
3881 discoveryLng.value = center.lng.toFixed(6);
3882 showToast("Coordenadas del mapa añadidas");
3883 });
3884
3885 function showExplorationResults() {
3886 discoveryCard?.classList.remove("is-exploring");
3887 discoveryCard?.classList.add("has-results");
3888 videoExplorationStatus?.classList.remove("active");
3889 explorationResults?.classList.add("active");
3890 renderDraft();
3891
3892 /*
3893 * v0.6 deja listo el flujo completo de revisión y guardado.
3894 * El análisis real del audio/imagen del vídeo se conectará a un backend
3895 * seguro en el siguiente paso. No inventamos lugares ni resultados.
3896 */
3897 if (discoveryDraft.length === 0 && detectedDetailsList) {
3898 detectedDetailsList.innerHTML = `
3899 <div class="empty-state">
3900 <span>n</span>
3901 <strong>Vídeo preparado</strong>
3902 <p>La exploración automática real se conectará al servicio de análisis. Mientras tanto puedes añadir los detalles manualment
e.</p>
3903 </div>
3904 `;
3905 }
3906 }
3907
3908 function startExploration() {
3909 const hasLink = Boolean(discoveryVideoLink?.value.trim());
3910 const hasFile = Boolean(discoveryVideoFile?.files?.[0]);
3911 if (!hasLink && !hasFile) return;
3912
3913 if (explorationTimer) window.clearInterval(explorationTimer);
3914 discoveryCard?.classList.remove("has-results");
3915 discoveryCard?.classList.add("is-exploring");
3916 explorationResults?.classList.remove("active");
3917 manualDetailEditor?.classList.remove("open");
3918 videoExplorationStatus?.classList.add("active");
3919
3920 const messages = [
3921 "Preparando el contenido…",
3922 "Escuchando lo que cuentan…",
3923 "Localizando lugares mencionados…",
3924 "Buscando gastronomía y consejos…",
3925 "Localizando los momentos exactos…",
3926 "Preparando tus descubrimientos…"
3927 ];
3928 let step = 0;
3929 if (explorationProgressBar) explorationProgressBar.style.width = "8%";
3930 if (explorationMessage) explorationMessage.textContent = messages[0];
3931
3932 explorationTimer = window.setInterval(() => {
3933 step += 1;
3934 const progress = Math.min(100, 8 + step * 18);
3935 if (explorationProgressBar) explorationProgressBar.style.width = `${progress}%`;
3936 if (explorationMessage) explorationMessage.textContent = messages[Math.min(step, messages.length - 1)];
3937 if (step >= 5) {
3938 window.clearInterval(explorationTimer);
3939 explorationTimer = null;
3940 window.setTimeout(showExplorationResults, 300);
3941 }
3942 }, 420);
3943 }
3944
3945 let linkExploreDebounce = null;
3946 discoveryVideoLink?.addEventListener("input", () => {
3947 window.clearTimeout(linkExploreDebounce);
3948 const value = discoveryVideoLink.value.trim();
3949 if (!value) return;
3950 linkExploreDebounce = window.setTimeout(startExploration, 650);
3951 });
3952
3953 discoveryVideoFile?.addEventListener("change", () => {
3954 const file = discoveryVideoFile.files?.[0];
3955 if (!file) return;
3956 if (localVideoObjectURL) URL.revokeObjectURL(localVideoObjectURL);
3957 localVideoObjectURL = URL.createObjectURL(file);
3958 if (discoveryPreviewPlayer && discoveryVideoPreview) {
3959 discoveryPreviewPlayer.src = localVideoObjectURL;
3960 discoveryVideoPreview.classList.remove("hidden");
3961 }
3962 startExploration();
3963 });
3964
3965 function renderDraft() {
3966 const count = discoveryDraft.length;
3967 if (detectedDetailsCount) detectedDetailsCount.textContent = String(count);
3968 if (draftDetailsCount) draftDetailsCount.textContent = String(count);
3969
3970 const html = discoveryDraft.map((item, index) => `
3971 <article class="detected-detail-card">
3972 <div class="detected-detail-icon">${detailIcon(item)}</div>
3973 <div class="detected-detail-info">
3974 <strong>${escapeHTML(item.title)}</strong>
3975 <div class="detected-detail-meta">
3976 <span>${escapeHTML(item.category || item.type)}</span>
3977 ${item.placeText ? `<span>· ${escapeHTML(item.placeText)}</span>` : ""}
3978 <span class="detail-time">n ${formatTimestamp(item.timestampStart)}</span>
3979 </div>
3980 </div>
3981 <div class="detected-detail-actions">
3982 <button type="button" data-edit-detail="${index}" aria-label="Editar">/n</button>
3983 <button type="button" data-delete-detail="${index}" aria-label="Eliminar">nn</button>
3984 </div>
3985 </article>
3986 `).join("");
3987
3988 if (detectedDetailsList) detectedDetailsList.innerHTML = html;
3989 if (videoDraftDetailsList) videoDraftDetailsList.innerHTML = html;
3990
3991 [detectedDetailsList, videoDraftDetailsList].forEach(container => {
3992 if (!container) return;
3993 container.querySelectorAll("[data-edit-detail]").forEach(button => {
3994 button.addEventListener("click", () => editDraftDetail(Number(button.dataset.editDetail)));
3995 });
3996 container.querySelectorAll("[data-delete-detail]").forEach(button => {
3997 button.addEventListener("click", () => {
3998 discoveryDraft.splice(Number(button.dataset.deleteDetail), 1);
3999 renderDraft();
4000 showToast("Detalle eliminado");
4001 });
4002 });
4003 });
4004
4005 if (count > 0) {
4006 videoDraftSummary?.classList.add("active");
4007 saveAllDiscoveriesButton?.classList.add("visible");
4008 } else {
4009 videoDraftSummary?.classList.remove("active");
4010 saveAllDiscoveriesButton?.classList.remove("visible");
4011 }
4012 }
4013
4014 function openDetailEditor() {
4015 manualDetailEditor?.classList.add("open");
4016 window.setTimeout(() => discoveryTitle?.focus(), 100);
4017 }
4018
4019 addManualDetailButton?.addEventListener("click", () => {
4020 resetDetailEditor();
4021 openDetailEditor();
4022 });
4023
4024 cancelDetailEdit?.addEventListener("click", () => {
4025 resetDetailEditor();
4026 manualDetailEditor?.classList.remove("open");
4027 });
4028
4029 useCurrentVideoTime?.addEventListener("click", () => {
4030 if (!discoveryPreviewPlayer || !Number.isFinite(discoveryPreviewPlayer.currentTime)) {
4031 showToast("Reproduce primero un vídeo subido");
4032 return;
4033 }
4034 detailTimestampStart.value = formatTimestamp(discoveryPreviewPlayer.currentTime);
4035 });
4036
4037 function editDraftDetail(index) {
4038 const item = discoveryDraft[index];
4039 if (!item) return;
4040 editingDraftIndex = index;
4041 if (detailType) detailType.value = item.type || "Lugar";
4042 discoveryTitle.value = item.title || "";
4043 discoveryPlace.value = item.placeText || "";
4044 discoveryCategory.value = item.category || "Lugar";
4045 detailTimestampStart.value = formatTimestamp(item.timestampStart || 0);
4046 detailTimestampEnd.value = item.timestampEnd == null ? "" : formatTimestamp(item.timestampEnd);
4047 discoveryComment.value = item.description || "";
4048 discoveryLat.value = Number.isFinite(item.lat) ? item.lat : "";
4049 discoveryLng.value = Number.isFinite(item.lng) ? item.lng : "";
4050 addDetailToDraft.textContent = "3 Guardar cambios";
4051 cancelDetailEdit?.classList.remove("hidden");
4052 openDetailEditor();
4053 }
4054
4055 addDetailToDraft?.addEventListener("click", () => {
4056 const title = discoveryTitle.value.trim();
4057 const placeText = discoveryPlace.value.trim();
4058 const category = discoveryCategory.value.trim() || detailType.value || "Lugar";
4059 if (!title) {
4060 showToast("Escribe un nombre o título");
4061 discoveryTitle.focus();
4062 return;
4063 }
4064
4065 const center = map.getCenter();
4066 const latValue = Number(discoveryLat.value);
4067 const lngValue = Number(discoveryLng.value);
4068 const item = {
4069 type: detailType.value || "Lugar",
4070 title,
4071 placeText: placeText || CONFIG.city,
4072 category,
4073 description: discoveryComment.value.trim(),
4074 timestampStart: parseTimestamp(detailTimestampStart.value),
4075 timestampEnd: detailTimestampEnd.value.trim() ? parseTimestamp(detailTimestampEnd.value) : null,
4076 lat: Number.isFinite(latValue) && latValue !== 0 ? latValue : center.lat,
4077 lng: Number.isFinite(lngValue) && lngValue !== 0 ? lngValue : center.lng
4078 };
4079
4080 if (editingDraftIndex === null) {
4081 discoveryDraft.push(item);
4082 showToast("Detalle añadido");
4083 } else {
4084 discoveryDraft[editingDraftIndex] = item;
4085 showToast("Detalle actualizado");
4086 }
4087
4088 resetDetailEditor();
4089 manualDetailEditor?.classList.remove("open");
4090 renderDraft();
4091 });
4092
4093 // =========================================================
4094 // FUNCIONES SUPABASE REUTILIZADAS
4095 // =========================================================
4096
4097 async function findSupabasePlaceBySlug(placeSlug) {
4098 if (!supabaseClient) return null;
4099 try {
4100 const { data, error } = await supabaseClient.from("places").select("*").eq("slug", placeSlug).maybeSingle();
4101 if (error) throw error;
4102 return data || null;
4103 } catch (error) {
4104 console.error("Error buscando el lugar:", error);
4105 return null;
4106 }
4107 }
4108
4109 async function createOrGetPlace({
4110 name,
4111 zone,
4112 category,
4113 description,
4114 lat,
4115 lng
4116 }) {
4117
4118 const placeSlug =
4119 slug(name);
4120
4121 const existing =
4122 await findSupabasePlaceBySlug(
4123 placeSlug
4124 );
4125
4126 if (existing) {
4127
4128 if (
4129 Number.isFinite(
4130 Number(lat)
4131 ) &&
4132 Number.isFinite(
4133 Number(lng)
4134 )
4135 ) {
4136
4137 const {
4138 data:
4139 updatedPlace,
4140
4141 error:
4142 updateError
4143 } =
4144
4145 await supabaseClient
4146 .from("places")
4147 .update({
4148
4149 zone:
4150 zone ||
4151 existing.zone,
4152
4153 category:
4154 category ||
4155 existing.category,
4156
4157 description:
4158 description ||
4159 existing.description,
4160
4161 latitude:
4162 Number(lat),
4163
4164 longitude:
4165 Number(lng)
4166
4167 })
4168 .eq(
4169 "id",
4170 existing.id
4171 )
4172 .select()
4173 .single();
4174
4175
4176 if (
4177 !updateError &&
4178 updatedPlace
4179 ) {
4180
4181 console.log(
4182 "n Coordenadas actualizadas:",
4183 name,
4184 lat,
4185 lng
4186 );
4187
4188 return normalizePlace({
4189 ...updatedPlace,
4190 source:
4191 "supabase"
4192 });
4193
4194 }
4195
4196
4197 if (
4198 updateError
4199 ) {
4200
4201 console.warn(
4202 "No se pudieron actualizar las coordenadas de:",
4203 name,
4204 updateError
4205 );
4206
4207 }
4208
4209 }
4210
4211
4212 return normalizePlace({
4213 ...existing,
4214 source:
4215 "supabase"
4216 });
4217
4218 }
4219
4220
4221 const {
4222 data,
4223 error
4224 } =
4225 await supabaseClient
4226 .from("places")
4227 .insert({
4228 slug:
4229 placeSlug,
4230
4231 name,
4232
4233 category,
4234
4235 zone,
4236
4237 city:
4238 CONFIG.city,
4239
4240 country:
4241 CONFIG.country,
4242
4243 description,
4244
4245 latitude:
4246 Number.isFinite(
4247 Number(lat)
4248 )
4249 ? Number(lat)
4250 : null,
4251
4252 longitude:
4253 Number.isFinite(
4254 Number(lng)
4255 )
4256 ? Number(lng)
4257 : null
4258 })
4259 .select()
4260 .single();
4261
4262
4263 if (error) {
4264 throw error;
4265 }
4266
4267
4268 return normalizePlace({
4269 ...data,
4270 source:
4271 "supabase"
4272 });
4273
4274 }
4275
4276 async function createSupabaseVideo({ title, description, url }) {
4277 if (!url) return null;
4278 const { data: existingVideos, error: searchError } = await supabaseClient.from("videos").select("*").eq("source_url", url).limit(1
);
4279 if (searchError) throw searchError;
4280 if (Array.isArray(existingVideos) && existingVideos.length > 0) {
4281 return normalizeVideo({ ...existingVideos[0], source: "supabase" });
4282 }
4283 const sourceType = url.includes("instagram.com") ? "Instagram" : url.includes("tiktok.com") ? "TikTok" : (url.includes("youtube.co
m") || url.includes("youtu.be")) ? "YouTube" : "Vídeo";
4284 const { data, error } = await supabaseClient.from("videos").insert({
4285 title, description, video_url: null, source_type: sourceType, source_url: url,
4286 transcript: null, duration_seconds: null
4287 }).select().single();
4288 if (error) throw error;
4289 return normalizeVideo({ ...data, source: "supabase" });
4290 }
4291
4292 async function createSupabaseDiscovery({ title, description, category, placeId, videoId = null, timestampStart = 0, timestampEnd = n
ull }) {
4293 const { data, error } = await supabaseClient.from("discoveries").insert({
4294 video_id: videoId, place_id: placeId, title, description, category,
4295 timestamp_start: timestampStart, timestamp_end: timestampEnd,
4296 confidence: 1, approved: true
4297 }).select().single();
4298 if (error) throw error;
4299 return normalizeDiscovery(data);
4300 }
4301
4302 // =========================================================
4303 // GUARDAR TODO
4304 // =========================================================
4305
4306 discoveryForm.addEventListener("submit", async event => {
4307 event.preventDefault();
4308 if (discoveryDraft.length === 0) {
4309 showToast("Añade al menos un detalle");
4310 return;
4311 }
4312
4313 const link = discoveryVideoLink?.value.trim() || "";
4314 if (!link) {
4315 showToast("Para compartirlo ahora, pega el enlace del vídeo");
4316 return;
4317 }
4318
4319 const original = saveAllDiscoveriesButton?.textContent || "Guardar todo";
4320 if (saveAllDiscoveriesButton) {
4321 saveAllDiscoveriesButton.disabled = true;
4322 saveAllDiscoveriesButton.textContent = "Guardando…";
4323 }
4324
4325 try {
4326 if (!supabaseOnline || !supabaseClient) throw new Error("Supabase no disponible");
4327
4328 const first = discoveryDraft[0];
4329 const sharedVideo = await createSupabaseVideo({
4330 title: first.title || "Vídeo de Mundo Infinito",
4331 description: `Vídeo con ${discoveryDraft.length} detalles explorados en Mundo Infinito.`,
4332 url: link
4333 });
4334
4335 const createdPlaces = [];
4336 for (const item of discoveryDraft) {
4337 const newPlace = await createOrGetPlace({
4338 name: item.title,
4339 zone: item.placeText,
4340 category: item.category,
4341 description: item.description || "Descubrimiento añadido por un Explorador.",
4342 lat: item.lat,
4343 lng: item.lng
4344 });
4345 const newDiscovery = await createSupabaseDiscovery({
4346 title: item.title,
4347 description: item.description || "",
4348 category: item.category,
4349 placeId: newPlace.id,
4350 videoId: sharedVideo?.id || null,
4351 timestampStart: item.timestampStart || 0,
4352 timestampEnd: item.timestampEnd
4353 });
4354 createdPlaces.push(newPlace);
4355 if (!places.some(p => p.id === newPlace.id)) places.push(newPlace);
4356 discoveries.push(newDiscovery);
4357 }
4358
4359 if (sharedVideo && !videos.some(v => v.id === sharedVideo.id)) videos.push(sharedVideo);
4360 renderMarkers();
4361 closeAddDiscovery();
4362 showToast(`3 ${discoveryDraft.length} detalles guardados para todos`);
4363
4364 if (createdPlaces[0]) {
4365 map.setView([createdPlaces[0].lat, createdPlaces[0].lng], 14);
4366 window.setTimeout(() => openPlace(createdPlaces[0].id), 250);
4367 }
4368 } catch (error) {
4369 console.error("Error guardando el vídeo y sus detalles:", error);
4370 showToast("No se pudo guardar en la base compartida");
4371 } finally {
4372 if (saveAllDiscoveriesButton) {
4373 saveAllDiscoveriesButton.disabled = false;
4374 saveAllDiscoveriesButton.textContent = original;
4375 }
4376 }
4377 });
4378
4379 // =========================================================
4380 // APP.JS v0.5.0 · BLOQUE 5 FINAL
4381 // Paneles + carga inicial + Supabase + arranque
4382 // =========================================================
4383
4384 // =========================================================
4385 // PANEL GENERAL
4386 // =========================================================
4387
4388 function openContent(
4389 title,
4390 html
4391 ) {
4392
4393 closePlace();
4394
4395 contentPanelTitle.textContent =
4396 title;
4397
4398 contentPanelBody.innerHTML =
4399 html;
4400
4401 contentPanel.classList.add(
4402 "open"
4403 );
4404
4405 contentPanel.setAttribute(
4406 "aria-hidden",
4407 "false"
4408 );
4409 }
4410
4411 function closeContent() {
4412
4413 contentPanel.classList.remove(
4414 "open"
4415 );
4416
4417 contentPanel.setAttribute(
4418 "aria-hidden",
4419 "true"
4420 );
4421 }
4422
4423 closeContentPanel.addEventListener(
4424 "click",
4425 closeContent
4426 );
4427
4428 // =========================================================
4429 // PANEL TODOS LOS VÍDEOS
4430 // =========================================================
4431
4432 function renderAllVideosPanel() {
4433
4434 if (
4435 videos.length === 0
4436 ) {
4437
4438 openContent(
4439 "Vídeos",
4440 `
4441 <div class="empty-state">
4442
4443 <span>n</span>
4444
4445 <strong>
4446 No hay vídeos todavía
4447 </strong>
4448
4449 <p>
4450 Los vídeos guardados aparecerán aquí.
4451 </p>
4452
4453 </div>
4454 `
4455 );
4456
4457 return;
4458 }
4459
4460 const html =
4461 videos
4462 .map(
4463 video => `
4464 <button
4465 class="content-card"
4466 type="button"
4467 data-global-video="${escapeHTML(video.id)}"
4468 >
4469
4470 <div class="content-card-icon">
4471 n
4472 </div>
4473
4474 <div class="content-card-text">
4475
4476 <strong>
4477 ${escapeHTML(video.title)}
4478 </strong>
4479
4480 <p>
4481 ${
4482 escapeHTML(
4483 video.place ||
4484 video.type ||
4485 "Brasil"
4486 )
4487 }
4488 </p>
4489
4490 </div>
4491
4492 </button>
4493 `
4494 )
4495 .join("");
4496
4497 openContent(
4498 "Vídeos",
4499 html
4500 );
4501
4502 contentPanelBody
4503 .querySelectorAll(
4504 "[data-global-video]"
4505 )
4506 .forEach(
4507 button => {
4508
4509 button.addEventListener(
4510 "click",
4511 () => {
4512
4513 const video =
4514 videos.find(
4515 item =>
4516 item.id ===
4517 button.dataset.globalVideo
4518 );
4519
4520 if (video) {
4521
4522 openVideo(
4523 video,
4524 0
4525 );
4526 }
4527 }
4528 );
4529 }
4530 );
4531 }
4532
4533 // =========================================================
4534 // PANEL GASTRONOMÍA
4535 // =========================================================
4536
4537 function renderFoodPanel() {
4538
4539 const foodPlaces =
4540 places.filter(
4541 place =>
4542 [
4543 "Restaurante",
4544 "Gastronomía"
4545 ].includes(
4546 place.category
4547 )
4548 );
4549
4550 if (
4551 foodPlaces.length === 0
4552 ) {
4553
4554 openContent(
4555 "Gastronomía",
4556 `
4557 <div class="empty-state">
4558
4559 <span>n</span>
4560
4561 <strong>
4562 Todavía no hay restaurantes
4563 </strong>
4564
4565 <p>
4566 Cuando añadáis restaurantes aparecerán aquí automáticamente.
4567 </p>
4568
4569 </div>
4570 `
4571 );
4572
4573 return;
4574 }
4575
4576 const html =
4577 foodPlaces
4578 .map(
4579 place => `
4580 <button
4581 class="content-card"
4582 type="button"
4583 data-food-place="${escapeHTML(place.id)}"
4584 >
4585
4586 <div class="content-card-icon">
4587 ${
4588 categoryIcons[
4589 place.category
4590 ] || "n"
4591 }
4592 </div>
4593
4594 <div class="content-card-text">
4595
4596 <strong>
4597 ${escapeHTML(place.name)}
4598 </strong>
4599
4600 <p>
4601 ${
4602 escapeHTML(
4603 place.zone ||
4604 place.city ||
4605 "Brasil"
4606 )
4607 }
4608 </p>
4609
4610 </div>
4611
4612 </button>
4613 `
4614 )
4615 .join("");
4616
4617 openContent(
4618 "Gastronomía",
4619 html
4620 );
4621
4622 contentPanelBody
4623 .querySelectorAll(
4624 "[data-food-place]"
4625 )
4626 .forEach(
4627 button => {
4628
4629 button.addEventListener(
4630 "click",
4631 () => {
4632
4633 const place =
4634 getPlaceById(
4635 button.dataset.foodPlace
4636 );
4637
4638 if (!place) {
4639 return;
4640 }
4641
4642 closeContent();
4643
4644 map.setView(
4645 [
4646 place.lat,
4647 place.lng
4648 ],
4649 16
4650 );
4651
4652 window.setTimeout(
4653 () => {
4654
4655 openPlace(
4656 place.id
4657 );
4658 },
4659 250
4660 );
4661 }
4662 );
4663 }
4664 );
4665 }
4666
4667 // =========================================================
4668 // PANEL MI VIAJE
4669 // =========================================================
4670
4671 function renderTripPanel() {
4672
4673 openContent(
4674 "Mi viaje",
4675 `
4676 <div class="empty-state">
4677
4678 <span>n</span>
4679
4680 <strong>
4681 Planificador en preparación
4682 </strong>
4683
4684 <p>
4685 Aquí organizaremos los descubrimientos por días cuando avancemos con la siguiente fase.
4686 </p>
4687
4688 </div>
4689 `
4690 );
4691 }
4692
4693 // =========================================================
4694 // PANEL GUARDADOS
4695 // =========================================================
4696
4697 function renderSavedPanel() {
4698
4699 const savedIds =
4700 getSavedPlaces();
4701
4702 const savedPlaces =
4703 places.filter(
4704 place =>
4705 savedIds.includes(
4706 place.id
4707 )
4708 );
4709
4710 if (
4711 savedPlaces.length === 0
4712 ) {
4713
4714 openContent(
4715 "Guardados",
4716 `
4717 <div class="empty-state">
4718
4719 <span>¤n</span>
4720
4721 <strong>
4722 Todavía no tienes lugares guardados
4723 </strong>
4724
4725 <p>
4726 Pulsa Guardar dentro de cualquier ficha.
4727 </p>
4728
4729 </div>
4730 `
4731 );
4732
4733 return;
4734 }
4735
4736 const html =
4737 savedPlaces
4738 .map(
4739 place => `
4740 <button
4741 class="content-card"
4742 type="button"
4743 data-saved-place="${escapeHTML(place.id)}"
4744 >
4745
4746 <div class="content-card-icon">
4747 ${
4748 categoryIcons[
4749 place.category
4750 ] || "n"
4751 }
4752 </div>
4753
4754 <div class="content-card-text">
4755
4756 <strong>
4757 ${escapeHTML(place.name)}
4758 </strong>
4759
4760 <p>
4761 ${
4762 escapeHTML(
4763 [
4764 place.zone,
4765 place.category
4766 ]
4767 .filter(Boolean)
4768 .join(" · ")
4769 )
4770 }
4771 </p>
4772
4773 </div>
4774
4775 </button>
4776 `
4777 )
4778 .join("");
4779
4780 openContent(
4781 "Guardados",
4782 html
4783 );
4784
4785 contentPanelBody
4786 .querySelectorAll(
4787 "[data-saved-place]"
4788 )
4789 .forEach(
4790 button => {
4791
4792 button.addEventListener(
4793 "click",
4794 () => {
4795
4796 const place =
4797 getPlaceById(
4798 button.dataset.savedPlace
4799 );
4800
4801 if (!place) {
4802 return;
4803 }
4804
4805 closeContent();
4806
4807 map.setView(
4808 [
4809 place.lat,
4810 place.lng
4811 ],
4812 16
4813 );
4814
4815 window.setTimeout(
4816 () => {
4817
4818 openPlace(
4819 place.id
4820 );
4821 },
4822 250
4823 );
4824 }
4825 );
4826 }
4827 );
4828 }
4829
4830 // =========================================================
4831 // MENÚ INFERIOR
4832 // =========================================================
4833
4834 function setActiveNav(
4835 activeButton
4836 ) {
4837
4838 navButtons.forEach(
4839 button => {
4840
4841 button.classList.remove(
4842 "active"
4843 );
4844 }
4845 );
4846
4847 activeButton.classList.add(
4848 "active"
4849 );
4850 }
4851
4852 navButtons.forEach(
4853 button => {
4854
4855 button.addEventListener(
4856 "click",
4857 () => {
4858
4859 setActiveNav(
4860 button
4861 );
4862
4863 const section =
4864 button.dataset.section;
4865
4866 if (
4867 section ===
4868 "explorar"
4869 ) {
4870
4871 closeContent();
4872 closePlace();
4873
4874 map.setView(
4875 CONFIG.center,
4876 CONFIG.zoom
4877 );
4878
4879 return;
4880 }
4881
4882 if (
4883 section ===
4884 "descubrimientos"
4885 ) {
4886
4887 renderAllVideosPanel();
4888
4889 return;
4890 }
4891
4892 if (
4893 section ===
4894 "gastronomia"
4895 ) {
4896
4897 renderFoodPanel();
4898
4899 return;
4900 }
4901
4902 if (
4903 section ===
4904 "viaje"
4905 ) {
4906
4907 renderTripPanel();
4908
4909 return;
4910 }
4911
4912 if (
4913 section ===
4914 "guardados"
4915 ) {
4916
4917 renderSavedPanel();
4918 }
4919 }
4920 );
4921 }
4922 );
4923
4924 // =========================================================
4925 // CERRAR AL PULSAR ESCAPE
4926 // =========================================================
4927
4928 document.addEventListener(
4929 "keydown",
4930 event => {
4931
4932 if (
4933 event.key !==
4934 "Escape"
4935 ) {
4936
4937 return;
4938 }
4939
4940 closeVideo();
4941 closeAddDiscovery();
4942 closePlace();
4943 closeContent();
4944 }
4945 );
4946
4947 // =========================================================
4948 // CLIC EN MAPA
4949 // =========================================================
4950
4951 map.on(
4952 "click",
4953 () => {
4954
4955 closePlace();
4956 closeContent();
4957 }
4958 );
4959
4960 // =========================================================
4961 // DESCUBRIMIENTOS LOCALES ANTIGUOS
4962 // Compatibilidad con lo guardado antes de Supabase.
4963 // =========================================================
4964
4965 function loadOldLocalPlaces() {
4966
4967 const oldDiscoveries =
4968 loadJSON(
4969 CONFIG.storage.discoveries,
4970 []
4971 );
4972
4973 if (
4974 !Array.isArray(
4975 oldDiscoveries
4976 )
4977 ) {
4978
4979 return [];
4980 }
4981
4982 return oldDiscoveries
4983 .filter(
4984 item =>
4985 Number.isFinite(
4986 Number(
4987 item.lat
4988 )
4989 ) &&
4990 Number.isFinite(
4991 Number(
4992 item.lng
4993 )
4994 )
4995 )
4996 .map(
4997 item =>
4998 normalizePlace({
4999
5000 id:
5001 item.id ||
5002 `local-${slug(
5003 item.name ||
5004 item.title ||
5005 "descubrimiento"
5006 )}`,
5007
5008 slug:
5009 slug(
5010 item.name ||
5011 item.title ||
5012 ""
5013 ),
5014
5015 name:
5016 item.name ||
5017 item.title ||
5018 "Descubrimiento",
5019
5020 zone:
5021 item.zone ||
5022 item.place ||
5023 CONFIG.city,
5024
5025 city:
5026 CONFIG.city,
5027
5028 country:
5029 CONFIG.country,
5030
5031 category:
5032 item.category ||
5033 "Lugar",
5034
5035 description:
5036 item.description ||
5037 item.comment ||
5038 "Descubrimiento guardado anteriormente.",
5039
5040 lat:
5041 Number(
5042 item.lat
5043 ),
5044
5045 lng:
5046 Number(
5047 item.lng
5048 ),
5049
5050 source:
5051 "local"
5052 })
5053 );
5054 }
5055
5056 // =========================================================
5057 // VÍDEOS LOCALES ANTIGUOS
5058 // =========================================================
5059
5060 function loadOldLocalVideos() {
5061
5062 const oldDiscoveries =
5063 loadJSON(
5064 CONFIG.storage.discoveries,
5065 []
5066 );
5067
5068 if (
5069 !Array.isArray(
5070 oldDiscoveries
5071 )
5072 ) {
5073
5074 return [];
5075 }
5076
5077 return oldDiscoveries
5078 .filter(
5079 item =>
5080 item.link
5081 )
5082 .map(
5083 item =>
5084 normalizeVideo({
5085
5086 id:
5087 `local-video-${item.id}`,
5088
5089 placeId:
5090 item.id,
5091
5092 place:
5093 item.name ||
5094 item.title ||
5095 "",
5096
5097 title:
5098 item.title ||
5099 item.name ||
5100 "Vídeo",
5101
5102 description:
5103 item.comment ||
5104 item.description ||
5105 "",
5106
5107 type:
5108 String(
5109 item.link
5110 ).includes(
5111 "instagram"
5112 )
5113 ? "Instagram"
5114 : "Vídeo",
5115
5116 url:
5117 item.link,
5118
5119 source:
5120 "local"
5121 })
5122 );
5123 }
5124
5125 // =========================================================
5126 // CARGAR TODA LA INFORMACIÓN
5127 // =========================================================
5128
5129 async function loadAppData() {
5130
5131 /*
5132 * 1. Datos estáticos actuales
5133 */
5134
5135 const [
5136 placesJSON,
5137 videosJSON
5138 ] =
5139 await Promise.all([
5140
5141 fetchJSON(
5142 "data/places.json",
5143 []
5144 ),
5145
5146 fetchJSON(
5147 "data/videos.json",
5148 []
5149 )
5150
5151 ]);
5152
5153 /*
5154 * 2. Datos locales antiguos
5155 */
5156
5157 const oldLocalPlaces =
5158 loadOldLocalPlaces();
5159
5160 const oldLocalVideos =
5161 loadOldLocalVideos();
5162
5163 /*
5164 * 3. Comprobamos Supabase
5165 */
5166
5167 await testSupabaseConnection();
5168
5169 let cloudPlaces = [];
5170 let cloudVideos = [];
5171 let cloudDiscoveries = [];
5172
5173 if (
5174 supabaseOnline
5175 ) {
5176
5177 [
5178 cloudPlaces,
5179 cloudVideos,
5180 cloudDiscoveries
5181 ] =
5182 await Promise.all([
5183
5184 loadSupabasePlaces(),
5185
5186 loadSupabaseVideos(),
5187
5188 loadSupabaseDiscoveries()
5189
5190 ]);
5191 }
5192
5193 /*
5194 * 4. Mezclamos lugares
5195 */
5196
5197 places =
5198 mergePlaces(
5199 placesJSON,
5200 oldLocalPlaces,
5201 cloudPlaces
5202 );
5203
5204 /*
5205 * 5. Mezclamos vídeos
5206 */
5207
5208 const videoMap =
5209 new Map();
5210
5211 [
5212 ...(Array.isArray(videosJSON)
5213 ? videosJSON
5214 : []),
5215
5216 ...oldLocalVideos,
5217
5218 ...cloudVideos
5219
5220 ]
5221 .map(
5222 normalizeVideo
5223 )
5224 .forEach(
5225 video => {
5226
5227 const dedupeKey =
5228 video.sourceUrl ||
5229 video.url ||
5230 video.id;
5231
5232 if (
5233 !videoMap.has(
5234 dedupeKey
5235 )
5236 ) {
5237
5238 videoMap.set(
5239 dedupeKey,
5240 video
5241 );
5242
5243 return;
5244 }
5245
5246 const existing =
5247 videoMap.get(
5248 dedupeKey
5249 );
5250
5251 if (
5252 video.source ===
5253 "supabase"
5254 ) {
5255
5256 videoMap.set(
5257 dedupeKey,
5258 {
5259 ...existing,
5260 ...video
5261 }
5262 );
5263 }
5264 }
5265 );
5266
5267 videos =
5268 Array.from(
5269 videoMap.values()
5270 );
5271
5272 /*
5273 * 6. Descubrimientos compartidos
5274 */
5275
5276 discoveries =
5277 cloudDiscoveries;
5278
5279 /*
5280 * 7. Dibujamos
5281 */
5282
5283 renderMarkers();
5284
5285 console.log(
5286 `n ${places.length} lugares cargados`
5287 );
5288
5289 console.log(
5290 `n ${videos.length} vídeos cargados`
5291 );
5292
5293 console.log(
5294 `n ${discoveries.length} descubrimientos compartidos`
5295 );
5296 }
5297
5298 // =========================================================
5299 // ACTUALIZACIÓN EN TIEMPO REAL
5300 // Si otra persona añade un lugar, podemos refrescar
5301 // automáticamente la información.
5302 // =========================================================
5303
5304 function startRealtimeUpdates() {
5305
5306 if (
5307 !supabaseClient ||
5308 !supabaseOnline
5309 ) {
5310
5311 return;
5312 }
5313
5314 supabaseClient
5315 .channel(
5316 "mundo-infinito-live"
5317 )
5318 .on(
5319 "postgres_changes",
5320 {
5321 event:
5322 "*",
5323
5324 schema:
5325 "public",
5326
5327 table:
5328 "places"
5329 },
5330 async () => {
5331
5332 await reloadSharedData();
5333 }
5334 )
5335 .on(
5336 "postgres_changes",
5337 {
5338 event:
5339 "*",
5340
5341 schema:
5342 "public",
5343
5344 table:
5345 "videos"
5346 },
5347 async () => {
5348
5349 await reloadSharedData();
5350 }
5351 )
5352 .on(
5353 "postgres_changes",
5354 {
5355 event:
5356 "*",
5357
5358 schema:
5359 "public",
5360
5361 table:
5362 "discoveries"
5363 },
5364 async () => {
5365
5366 await reloadSharedData();
5367 }
5368 )
5369 .subscribe();
5370 }
5371
5372 // =========================================================
5373 // RECARGAR SOLO DATOS COMPARTIDOS
5374 // =========================================================
5375
5376 async function reloadSharedData() {
5377
5378 if (
5379 !supabaseClient ||
5380 !supabaseOnline
5381 ) {
5382
5383 return;
5384 }
5385
5386 try {
5387
5388 const [
5389 cloudPlaces,
5390 cloudVideos,
5391 cloudDiscoveries
5392 ] =
5393 await Promise.all([
5394
5395 loadSupabasePlaces(),
5396
5397 loadSupabaseVideos(),
5398
5399 loadSupabaseDiscoveries()
5400
5401 ]);
5402
5403 /*
5404 * Añadimos/actualizamos lugares
5405 */
5406
5407 cloudPlaces.forEach(
5408 cloudPlace => {
5409
5410 const index =
5411 places.findIndex(
5412 place =>
5413 place.id ===
5414 cloudPlace.id ||
5415 place.slug ===
5416 cloudPlace.slug
5417 );
5418
5419 if (
5420 index >= 0
5421 ) {
5422
5423 places[index] = {
5424 ...places[index],
5425 ...cloudPlace
5426 };
5427
5428 } else {
5429
5430 places.push(
5431 cloudPlace
5432 );
5433 }
5434 }
5435 );
5436
5437 /*
5438 * Vídeos
5439 */
5440
5441 cloudVideos.forEach(
5442 cloudVideo => {
5443
5444 const index =
5445 videos.findIndex(
5446 video =>
5447 video.id ===
5448 cloudVideo.id ||
5449 (
5450 cloudVideo.sourceUrl &&
5451 video.sourceUrl ===
5452 cloudVideo.sourceUrl
5453 )
5454 );
5455
5456 if (
5457 index >= 0
5458 ) {
5459
5460 videos[index] = {
5461 ...videos[index],
5462 ...cloudVideo
5463 };
5464
5465 } else {
5466
5467 videos.push(
5468 cloudVideo
5469 );
5470 }
5471 }
5472 );
5473
5474 discoveries =
5475 cloudDiscoveries;
5476
5477 renderMarkers();
5478
5479 /*
5480 * Si tenemos una ficha abierta,
5481 * actualizamos sus vídeos también.
5482 */
5483
5484 if (
5485 selectedPlace
5486 ) {
5487
5488 const refreshed =
5489 places.find(
5490 place =>
5491 place.id ===
5492 selectedPlace.id ||
5493 place.slug ===
5494 selectedPlace.slug
5495 );
5496
5497 if (
5498 refreshed
5499 ) {
5500
5501 selectedPlace =
5502 refreshed;
5503
5504 renderPlaceVideos(
5505 refreshed
5506 );
5507 }
5508 }
5509
5510 console.log(
5511 "n Mundo Infinito actualizado"
5512 );
5513
5514 } catch (error) {
5515
5516 console.error(
5517 "Error actualizando datos compartidos:",
5518 error
5519 );
5520 }
5521 }
5522
5523 // =========================================================
5524 // REDIMENSIONAR MAPA
5525 // =========================================================
5526
5527 window.addEventListener(
5528 "resize",
5529 () => {
5530
5531 window.setTimeout(
5532 () => {
5533
5534 map.invalidateSize();
5535 },
5536 120
5537 );
5538 }
5539 );
5540
5541 // =========================================================
5542 // CONTROL GENERAL DE ERRORES
5543 // =========================================================
5544
5545 window.addEventListener(
5546 "error",
5547 event => {
5548
5549 console.error(
5550 "Mundo Infinito:",
5551 event.error ||
5552 event.message
5553 );
5554 }
5555 );
5556
5557 // =========================================================
5558 // INICIALIZACIÓN
5559 // =========================================================
5560
5561 async function init() {
5562
5563 console.log(
5564 "n Iniciando Mundo Infinito v0.6.0"
5565 );
5566
5567 /*
5568 * Primero creamos el cliente Supabase.
5569 */
5570
5571 initializeSupabase();
5572
5573 /*
5574 * Después cargamos toda la información.
5575 */
5576
5577 await loadAppData();
5578
5579 map.invalidateSize();
5580
5581 /*
5582 * Activamos sincronización en tiempo real
5583 * solamente si la conexión funciona.
5584 */
5585
5586 if (
5587 supabaseOnline
5588 ) {
5589
5590 startRealtimeUpdates();
5591
5592 console.log(
5593 "n Mundo Infinito conectado y compartido"
5594 );
5595
5596 } else {
5597
5598 console.log(
5599 "n Mundo Infinito funcionando en modo local"
5600 );
5601 }
5602 }
5603
5604 // =========================================================
5605 // ARRANCAR
5606 // =========================================================
5607
5608 init();
5609
5610 // =========================================================
5611 // FIN · MUNDO INFINITO v0.6.0
5612 // =============================
