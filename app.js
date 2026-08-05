// =========================================================
// MUNDO INFINITO · v0.5.0
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

const defaultPlaces = [

  {
    id: "cristo-redentor",

    name:
      "Cristo Redentor",

    zone:
      "Cosme Velho",

    city:
      "Río de Janeiro",

    category:
      "Lugar",

    description:
      "Uno de los iconos más reconocibles de Río de Janeiro.",

    lat:
      -22.9519,

    lng:
      -43.2105,

    rating:
      5,

    image:
      ""
  },

  {
    id:
      "pao-de-acucar",

    name:
      "Pão de Açúcar",

    zone:
      "Urca",

    city:
      "Río de Janeiro",

    category:
      "Mirador",

    description:
      "Teleférico y vistas panorámicas sobre la bahía de Guanabara.",

    lat:
      -22.9493,

    lng:
      -43.1546,

    rating:
      5,

    image:
      ""
  },

  {
    id:
      "copacabana",

    name:
      "Copacabana",

    zone:
      "Copacabana",

    city:
      "Río de Janeiro",

    category:
      "Playa",

    description:
      "Una de las playas urbanas más famosas del mundo.",

    lat:
      -22.9711,

    lng:
      -43.1822,

    rating:
      5,

    image:
      ""
  },

  {
    id:
      "ipanema",

    name:
      "Ipanema",

    zone:
      "Ipanema",

    city:
      "Río de Janeiro",

    category:
      "Playa",

    description:
      "Playa conocida por su ambiente y sus atardeceres.",

    lat:
      -22.9868,

    lng:
      -43.2047,

    rating:
      5,

    image:
      ""
  },

  {
    id:
      "selaron",

    name:
      "Escadaria Selarón",

    zone:
      "Lapa / Santa Teresa",

    city:
      "Río de Janeiro",

    category:
      "Cultura",

    description:
      "Escalera artística cubierta por azulejos de todo el mundo.",

    lat:
      -22.9153,

    lng:
      -43.179,

    rating:
      5,

    image:
      ""
  },

  {
    id:
      "parque-lage",

    name:
      "Parque Lage",

    zone:
      "Jardim Botânico",

    city:
      "Río de Janeiro",

    category:
      "Parque",

    description:
      "Parque histórico situado a los pies del Corcovado.",

    lat:
      -22.9608,

    lng:
      -43.2116,

    rating:
      5,

    image:
      ""
  },

  {
    id:
      "saara",

    name:
      "SAARA",

    zone:
      "Centro",

    city:
      "Río de Janeiro",

    category:
      "Compras",

    description:
      "Zona comercial popular con multitud de tiendas.",

    lat:
      -22.9028,

    lng:
      -43.1815,

    rating:
      4,

    image:
      ""
  },

  {
    id:
      "pedra-do-sal",

    name:
      "Pedra do Sal",

    zone:
      "Saúde",

    city:
      "Río de Janeiro",

    category:
      "Vida nocturna",

    description:
      "Lugar histórico estrechamente ligado a la samba carioca.",

    lat:
      -22.8976,

    lng:
      -43.1852,

    rating:
      5,

    image:
      ""
  },

  {
    id:
      "arnaldo-quintela",

    name:
      "Rua Arnaldo Quintela",

    zone:
      "Botafogo",

    city:
      "Río de Janeiro",

    category:
      "Vida nocturna",

    description:
      "Calle de Botafogo conocida por su concentración de bares.",

    lat:
      -22.9537,

    lng:
      -43.1866,

    rating:
      4,

    image:
      ""
  },

  {
    id:
      "galeao",

    name:
      "Aeropuerto de Galeão",

    zone:
      "Ilha do Governador",

    city:
      "Río de Janeiro",

    category:
      "Transporte",

    description:
      "Principal aeropuerto internacional de Río de Janeiro.",

    lat:
      -22.809,

    lng:
      -43.2506,

    rating:
      4,

    image:
      ""
  }

];

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
      return fallback;
    }

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

function createMarkerIcon(place) {

  const icon =
    categoryIcons[place.category] ||
    "📍";

  return L.divIcon({

    className: "",

    html: `
      <div
        class="custom-marker ${markerClass(place.category)}"
      >
        <span>${icon}</span>
      </div>
    `,

    iconSize: [38, 38],

    iconAnchor: [19, 38]
  });
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
          existingBySlug;

        if (existing) {

          /*
           * Si el nuevo lugar viene de Supabase,
           * conservamos su UUID porque será necesario
           * para relacionarlo con discoveries.
           */

          if (
            place.source ===
            "supabase"
          ) {

            if (
              existing.id !==
              place.id
            ) {

              combined.delete(
                existing.id
              );
            }

            combined.set(
              place.id,
              {
                ...existing,
                ...place
              }
            );

          } else {

            combined.set(
              existing.id,
              {
                ...existing,
                ...place,

                id:
                  existing.id
              }
            );
          }

        } else {

          combined.set(
            place.id,
            place
          );
        }
      });
  });

  return Array.from(
    combined.values()
  ).filter(
    place =>
      Number.isFinite(
        place.lat
      ) &&
      Number.isFinite(
        place.lng
      )
  );
}

// =========================================================
// LEER LUGARES DESDE SUPABASE
// =========================================================

async function loadSupabasePlaces() {

  if (!supabaseClient) {
    return [];
  }

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("places")
        .select("*")
        .order(
          "created_at",
          {
            ascending: true
          }
        );

    if (error) {
      throw error;
    }

    return (data || []).map(
      place =>
        normalizePlace({
          ...place,

          source:
            "supabase"
        })
    );

  } catch (error) {

    console.error(
      "No se pudieron cargar los lugares de Supabase:",
      error
    );

    return [];
  }
}

// =========================================================
// LEER VÍDEOS DESDE SUPABASE
// =========================================================

async function loadSupabaseVideos() {

  if (!supabaseClient) {
    return [];
  }

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("videos")
        .select("*")
        .order(
          "created_at",
          {
            ascending: true
          }
        );

    if (error) {
      throw error;
    }

    return (data || []).map(
      video =>
        normalizeVideo({
          ...video,

          source:
            "supabase"
        })
    );

  } catch (error) {

    console.error(
      "No se pudieron cargar los vídeos de Supabase:",
      error
    );

    return [];
  }
}

// =========================================================
// LEER DESCUBRIMIENTOS DESDE SUPABASE
// =========================================================

async function loadSupabaseDiscoveries() {

  if (!supabaseClient) {
    return [];
  }

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("discoveries")
        .select("*")
        .order(
          "created_at",
          {
            ascending: true
          }
        );

    if (error) {
      throw error;
    }

    return (data || []).map(
      normalizeDiscovery
    );

  } catch (error) {

    console.error(
      "No se pudieron cargar los descubrimientos de Supabase:",
      error
    );

    return [];
  }
}

// =========================================================
// COMPROBAR CONEXIÓN CON SUPABASE
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
  }

  selectedPlace =
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
);

// =========================================================
// BUSCADOR
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
// MOSTRAR RESULTADOS DE BÚSQUEDA
// =========================================================

function renderSearchResults(
  results
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

  if (
    results.length === 0
  ) {

    searchResults.innerHTML = `
      <div class="no-results">

        <span>🔍</span>

        <strong>
          Sin resultados
        </strong>

        <p>
          Prueba con otra palabra.
        </p>

      </div>
    `;

    searchResults.classList.remove(
      "hidden"
    );

    return;
  }

  searchResults.innerHTML =
    results
      .slice(
        0,
        8
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
                categoryIcons[
                  place.category
                ] || "📍"
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
      .join("");

  searchResults
    .querySelectorAll(
      "[data-place-id]"
    )
    .forEach(button => {

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
    });

  searchResults.classList.remove(
    "hidden"
  );
}

function updateSearch() {

  renderSearchResults(
    searchPlaces(
      searchInput.value
    )
  );
}

searchInput.addEventListener(
  "input",
  updateSearch
);

clearSearch.addEventListener(
  "click",
  () => {

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
); // =========================================================
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
// =========================================================

async function createOrGetPlace({
  name,
  zone,
  category,
  description,
  lat,
  lng
}) {

  const placeSlug =
    slug(name);

  /*
   * Primero comprobamos si ya existe.
   */

  const existing =
    await findSupabasePlaceBySlug(
      placeSlug
    );

  if (existing) {

    return normalizePlace({
      ...existing,
      source:
        "supabase"
    });
  }

  /*
   * Si no existe, lo creamos.
   */

  const {
    data,
    error
  } =
    await supabaseClient
      .from("places")
      .insert({
        slug:
          placeSlug,

        name,

        category,

        zone,

        city:
          CONFIG.city,

        country:
          CONFIG.country,

        description,

        latitude:
          lat,

        longitude:
          lng
      })
      .select()
      .single();

  if (error) {
    throw error;
  }

  return normalizePlace({
    ...data,
    source:
      "supabase"
  });
}

// =========================================================
// CREAR VÍDEO EN SUPABASE
// =========================================================

async function createSupabaseVideo({
  title,
  description,
  url
}) {

  if (!url) {
    return null;
  }

  /*
   * Si ya existe la misma URL, reutilizamos el vídeo.
   */

  const {
    data: existingVideos,
    error: searchError
  } =
    await supabaseClient
      .from("videos")
      .select("*")
      .eq(
        "source_url",
        url
      )
      .limit(1);

  if (searchError) {
    throw searchError;
  }

  if (
    Array.isArray(
      existingVideos
    ) &&
    existingVideos.length > 0
  ) {

    return normalizeVideo({
      ...existingVideos[0],
      source:
        "supabase"
    });
  }

  const sourceType =
    url.includes(
      "instagram.com"
    )
      ? "Instagram"
      : url.includes(
          "tiktok.com"
        )
        ? "TikTok"
        : url.includes(
            "youtube.com"
          ) ||
          url.includes(
            "youtu.be"
          )
          ? "YouTube"
          : "Vídeo";

  const {
    data,
    error
  } =
    await supabaseClient
      .from("videos")
      .insert({
        title,

        description,

        /*
         * Para enlaces externos usamos source_url.
         * video_url quedará para MP4 alojados.
         */

        video_url:
          null,

        source_type:
          sourceType,

        source_url:
          url,

        transcript:
          null,

        duration_seconds:
          null
      })
      .select()
      .single();

  if (error) {
    throw error;
  }

  return normalizeVideo({
    ...data,
    source:
      "supabase"
  });
}

// =========================================================
// CREAR DESCUBRIMIENTO
// =========================================================

async function createSupabaseDiscovery({
  title,
  description,
  category,
  placeId,
  videoId = null,
  timestampStart = 0,
  timestampEnd = null
}) {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("discoveries")
      .insert({
        video_id:
          videoId,

        place_id:
          placeId,

        title,

        description,

        category,

        timestamp_start:
          timestampStart,

        timestamp_end:
          timestampEnd,

        /*
         * Como todavía lo introduce una persona,
         * lo consideramos aprobado.
         *
         * Cuando llegue la IA, las propuestas
         * automáticas entrarán con approved=false.
         */

        confidence:
          1,

        approved:
          true
      })
      .select()
      .single();

  if (error) {
    throw error;
  }

  return normalizeDiscovery(
    data
  );
}

// =========================================================
// FALLBACK LOCAL
// Si Supabase falla, no perdemos lo escrito.
// =========================================================

function saveDiscoveryLocally({
  title,
  placeText,
  category,
  link,
  comment,
  lat,
  lng
}) {

  const localDiscoveries =
    loadJSON(
      CONFIG.storage.discoveries,
      []
    );

  const localId =
    `local-${slug(title)}-${Date.now()}`;

  const localDiscovery = {

    id:
      localId,

    title,

    name:
      title,

    place:
      placeText,

    zone:
      placeText,

    category,

    link,

    comment,

    description:
      comment ||
      "Descubrimiento añadido por un Explorador.",

    lat,

    lng,

    createdAt:
      new Date().toISOString()
  };

  localDiscoveries.push(
    localDiscovery
  );

  saveJSON(
    CONFIG.storage.discoveries,
    localDiscoveries
  );

  return localDiscovery;
}

// =========================================================
// FORMULARIO ➕
// =========================================================

discoveryForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    const submitButton =
      discoveryForm.querySelector(
        'button[type="submit"]'
      );

    const originalButtonText =
      submitButton
        ? submitButton.textContent
        : "";

    if (submitButton) {

      submitButton.disabled =
        true;

      submitButton.textContent =
        "Guardando…";
    }

    const form =
      new FormData(
        discoveryForm
      );

    const title =
      String(
        form.get("title") ||
        ""
      ).trim();

    const placeText =
      String(
        form.get("place") ||
        ""
      ).trim();

    const category =
      String(
        form.get("category") ||
        ""
      ).trim();

    const link =
      String(
        form.get("link") ||
        ""
      ).trim();

    const comment =
      String(
        form.get("comment") ||
        ""
      ).trim();

    const latValue =
      Number(
        form.get("lat")
      );

    const lngValue =
      Number(
        form.get("lng")
      );

    if (
      !title ||
      !placeText ||
      !category
    ) {

      showToast(
        "Completa nombre, lugar y categoría"
      );

      if (submitButton) {

        submitButton.disabled =
          false;

        submitButton.textContent =
          originalButtonText;
      }

      return;
    }

    const center =
      map.getCenter();

    const lat =
      Number.isFinite(
        latValue
      ) &&
      latValue !== 0
        ? latValue
        : center.lat;

    const lng =
      Number.isFinite(
        lngValue
      ) &&
      lngValue !== 0
        ? lngValue
        : center.lng;

    const description =
      comment ||
      "Descubrimiento añadido por un Explorador.";

    try {

      // ---------------------------------------------------
      // MODO COMPARTIDO
      // ---------------------------------------------------

      if (
        supabaseOnline &&
        supabaseClient
      ) {

        /*
         * 1. Creamos o reutilizamos el lugar.
         */

        const newPlace =
          await createOrGetPlace({
            name:
              title,

            zone:
              placeText,

            category,

            description,

            lat,

            lng
          });

        /*
         * 2. Si existe enlace, creamos/reutilizamos vídeo.
         */

        let newVideo =
          null;

        if (link) {

          newVideo =
            await createSupabaseVideo({
              title,

              description,

              url:
                link
            });
        }

        /*
         * 3. Creamos la relación descubrimiento.
         */

        const newDiscovery =
          await createSupabaseDiscovery({
            title,

            description,

            category,

            placeId:
              newPlace.id,

            videoId:
              newVideo
                ? newVideo.id
                : null,

            timestampStart:
              0
          });

        /*
         * 4. Actualizamos la app sin necesidad
         *    de recargar la página.
         */

        if (
          !places.some(
            item =>
              item.id ===
              newPlace.id
          )
        ) {

          places.push(
            newPlace
          );

          addMarker(
            newPlace
          );
        }

        if (
          newVideo &&
          !videos.some(
            item =>
              item.id ===
              newVideo.id
          )
        ) {

          videos.push(
            newVideo
          );
        }

        discoveries.push(
          newDiscovery
        );

        discoveryForm.reset();

        closeAddDiscovery();

        map.setView(
          [
            newPlace.lat,
            newPlace.lng
          ],
          15
        );

        window.setTimeout(
          () => {

            openPlace(
              newPlace.id
            );

          },
          250
        );

        showToast(
          "✓ Guardado para todos"
        );

      } else {

        // -------------------------------------------------
        // MODO LOCAL DE EMERGENCIA
        // -------------------------------------------------

        const localDiscovery =
          saveDiscoveryLocally({
            title,

            placeText,

            category,

            link,

            comment,

            lat,

            lng
          });

        const localPlace =
          normalizePlace({

            id:
              localDiscovery.id,

            slug:
              slug(title),

            name:
              title,

            zone:
              placeText,

            category,

            description,

            lat,

            lng,

            source:
              "local"
          });

        places.push(
          localPlace
        );

        addMarker(
          localPlace
        );

        if (link) {

          videos.push(
            normalizeVideo({

              id:
                `video-${localDiscovery.id}`,

              placeId:
                localPlace.id,

              place:
                localPlace.name,

              title,

              description,

              type:
                link.includes(
                  "instagram"
                )
                  ? "Instagram"
                  : "Vídeo",

              url:
                link,

              source:
                "local"
            })
          );
        }

        discoveryForm.reset();

        closeAddDiscovery();

        map.setView(
          [
            lat,
            lng
          ],
          15
        );

        window.setTimeout(
          () => {

            openPlace(
              localPlace.id
            );

          },
          250
        );

        showToast(
          "Guardado solo en este dispositivo"
        );
      }

    } catch (error) {

      console.error(
        "Error guardando el descubrimiento:",
        error
      );

      /*
       * Si Supabase responde con error,
       * guardamos una copia local.
       */

      const localDiscovery =
        saveDiscoveryLocally({
          title,
          placeText,
          category,
          link,
          comment,
          lat,
          lng
        });

      const localPlace =
        normalizePlace({

          id:
            localDiscovery.id,

          slug:
            slug(title),

          name:
            title,

          zone:
            placeText,

          category,

          description,

          lat,

          lng,

          source:
            "local"
        });

      if (
        !places.some(
          item =>
            item.id ===
            localPlace.id
        )
      ) {

        places.push(
          localPlace
        );

        addMarker(
          localPlace
        );
      }

      discoveryForm.reset();

      closeAddDiscovery();

      showToast(
        "No hubo conexión: guardado localmente"
      );

    } finally {

      if (submitButton) {

        submitButton.disabled =
          false;

        submitButton.textContent =
          originalButtonText;
      }
    }
  }
);// =========================================================
// APP.JS v0.5.0 · BLOQUE 5 FINAL
// Paneles + carga inicial + Supabase + arranque
// =========================================================

// =========================================================
// PANEL GENERAL
// =========================================================

function openContent(
  title,
  html
) {

  closePlace();

  contentPanelTitle.textContent =
    title;

  contentPanelBody.innerHTML =
    html;

  contentPanel.classList.add(
    "open"
  );

  contentPanel.setAttribute(
    "aria-hidden",
    "false"
  );
}

function closeContent() {

  contentPanel.classList.remove(
    "open"
  );

  contentPanel.setAttribute(
    "aria-hidden",
    "true"
  );
}

closeContentPanel.addEventListener(
  "click",
  closeContent
);

// =========================================================
// PANEL TODOS LOS VÍDEOS
// =========================================================

function renderAllVideosPanel() {

  if (
    videos.length === 0
  ) {

    openContent(
      "Vídeos",
      `
        <div class="empty-state">

          <span>🎥</span>

          <strong>
            No hay vídeos todavía
          </strong>

          <p>
            Los vídeos guardados aparecerán aquí.
          </p>

        </div>
      `
    );

    return;
  }

  const html =
    videos
      .map(
        video => `
          <button
            class="content-card"
            type="button"
            data-global-video="${escapeHTML(video.id)}"
          >

            <div class="content-card-icon">
              🎥
            </div>

            <div class="content-card-text">

              <strong>
                ${escapeHTML(video.title)}
              </strong>

              <p>
                ${
                  escapeHTML(
                    video.place ||
                    video.type ||
                    "Brasil"
                  )
                }
              </p>

            </div>

          </button>
        `
      )
      .join("");

  openContent(
    "Vídeos",
    html
  );

  contentPanelBody
    .querySelectorAll(
      "[data-global-video]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const video =
              videos.find(
                item =>
                  item.id ===
                  button.dataset.globalVideo
              );

            if (video) {

              openVideo(
                video,
                0
              );
            }
          }
        );
      }
    );
}

// =========================================================
// PANEL GASTRONOMÍA
// =========================================================

function renderFoodPanel() {

  const foodPlaces =
    places.filter(
      place =>
        [
          "Restaurante",
          "Gastronomía"
        ].includes(
          place.category
        )
    );

  if (
    foodPlaces.length === 0
  ) {

    openContent(
      "Gastronomía",
      `
        <div class="empty-state">

          <span>🍴</span>

          <strong>
            Todavía no hay restaurantes
          </strong>

          <p>
            Cuando añadáis restaurantes aparecerán aquí automáticamente.
          </p>

        </div>
      `
    );

    return;
  }

  const html =
    foodPlaces
      .map(
        place => `
          <button
            class="content-card"
            type="button"
            data-food-place="${escapeHTML(place.id)}"
          >

            <div class="content-card-icon">
              ${
                categoryIcons[
                  place.category
                ] || "🍴"
              }
            </div>

            <div class="content-card-text">

              <strong>
                ${escapeHTML(place.name)}
              </strong>

              <p>
                ${
                  escapeHTML(
                    place.zone ||
                    place.city ||
                    "Brasil"
                  )
                }
              </p>

            </div>

          </button>
        `
      )
      .join("");

  openContent(
    "Gastronomía",
    html
  );

  contentPanelBody
    .querySelectorAll(
      "[data-food-place]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const place =
              getPlaceById(
                button.dataset.foodPlace
              );

            if (!place) {
              return;
            }

            closeContent();

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
}

// =========================================================
// PANEL MI VIAJE
// =========================================================

function renderTripPanel() {

  openContent(
    "Mi viaje",
    `
      <div class="empty-state">

        <span>📅</span>

        <strong>
          Planificador en preparación
        </strong>

        <p>
          Aquí organizaremos los descubrimientos por días cuando avancemos con la siguiente fase.
        </p>

      </div>
    `
  );
}

// =========================================================
// PANEL GUARDADOS
// =========================================================

function renderSavedPanel() {

  const savedIds =
    getSavedPlaces();

  const savedPlaces =
    places.filter(
      place =>
        savedIds.includes(
          place.id
        )
    );

  if (
    savedPlaces.length === 0
  ) {

    openContent(
      "Guardados",
      `
        <div class="empty-state">

          <span>❤️</span>

          <strong>
            Todavía no tienes lugares guardados
          </strong>

          <p>
            Pulsa Guardar dentro de cualquier ficha.
          </p>

        </div>
      `
    );

    return;
  }

  const html =
    savedPlaces
      .map(
        place => `
          <button
            class="content-card"
            type="button"
            data-saved-place="${escapeHTML(place.id)}"
          >

            <div class="content-card-icon">
              ${
                categoryIcons[
                  place.category
                ] || "📍"
              }
            </div>

            <div class="content-card-text">

              <strong>
                ${escapeHTML(place.name)}
              </strong>

              <p>
                ${
                  escapeHTML(
                    [
                      place.zone,
                      place.category
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  )
                }
              </p>

            </div>

          </button>
        `
      )
      .join("");

  openContent(
    "Guardados",
    html
  );

  contentPanelBody
    .querySelectorAll(
      "[data-saved-place]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const place =
              getPlaceById(
                button.dataset.savedPlace
              );

            if (!place) {
              return;
            }

            closeContent();

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
}

// =========================================================
// MENÚ INFERIOR
// =========================================================

function setActiveNav(
  activeButton
) {

  navButtons.forEach(
    button => {

      button.classList.remove(
        "active"
      );
    }
  );

  activeButton.classList.add(
    "active"
  );
}

navButtons.forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        setActiveNav(
          button
        );

        const section =
          button.dataset.section;

        if (
          section ===
          "explorar"
        ) {

          closeContent();
          closePlace();

          map.setView(
            CONFIG.center,
            CONFIG.zoom
          );

          return;
        }

        if (
          section ===
          "descubrimientos"
        ) {

          renderAllVideosPanel();

          return;
        }

        if (
          section ===
          "gastronomia"
        ) {

          renderFoodPanel();

          return;
        }

        if (
          section ===
          "viaje"
        ) {

          renderTripPanel();

          return;
        }

        if (
          section ===
          "guardados"
        ) {

          renderSavedPanel();
        }
      }
    );
  }
);

// =========================================================
// CERRAR AL PULSAR ESCAPE
// =========================================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key !==
      "Escape"
    ) {

      return;
    }

    closeVideo();
    closeAddDiscovery();
    closePlace();
    closeContent();
  }
);

// =========================================================
// CLIC EN MAPA
// =========================================================

map.on(
  "click",
  () => {

    closePlace();
    closeContent();
  }
);

// =========================================================
// DESCUBRIMIENTOS LOCALES ANTIGUOS
// Compatibilidad con lo guardado antes de Supabase.
// =========================================================

function loadOldLocalPlaces() {

  const oldDiscoveries =
    loadJSON(
      CONFIG.storage.discoveries,
      []
    );

  if (
    !Array.isArray(
      oldDiscoveries
    )
  ) {

    return [];
  }

  return oldDiscoveries
    .filter(
      item =>
        Number.isFinite(
          Number(
            item.lat
          )
        ) &&
        Number.isFinite(
          Number(
            item.lng
          )
        )
    )
    .map(
      item =>
        normalizePlace({

          id:
            item.id ||
            `local-${slug(
              item.name ||
              item.title ||
              "descubrimiento"
            )}`,

          slug:
            slug(
              item.name ||
              item.title ||
              ""
            ),

          name:
            item.name ||
            item.title ||
            "Descubrimiento",

          zone:
            item.zone ||
            item.place ||
            CONFIG.city,

          city:
            CONFIG.city,

          country:
            CONFIG.country,

          category:
            item.category ||
            "Lugar",

          description:
            item.description ||
            item.comment ||
            "Descubrimiento guardado anteriormente.",

          lat:
            Number(
              item.lat
            ),

          lng:
            Number(
              item.lng
            ),

          source:
            "local"
        })
    );
}

// =========================================================
// VÍDEOS LOCALES ANTIGUOS
// =========================================================

function loadOldLocalVideos() {

  const oldDiscoveries =
    loadJSON(
      CONFIG.storage.discoveries,
      []
    );

  if (
    !Array.isArray(
      oldDiscoveries
    )
  ) {

    return [];
  }

  return oldDiscoveries
    .filter(
      item =>
        item.link
    )
    .map(
      item =>
        normalizeVideo({

          id:
            `local-video-${item.id}`,

          placeId:
            item.id,

          place:
            item.name ||
            item.title ||
            "",

          title:
            item.title ||
            item.name ||
            "Vídeo",

          description:
            item.comment ||
            item.description ||
            "",

          type:
            String(
              item.link
            ).includes(
              "instagram"
            )
              ? "Instagram"
              : "Vídeo",

          url:
            item.link,

          source:
            "local"
        })
    );
}

// =========================================================
// CARGAR TODA LA INFORMACIÓN
// =========================================================

async function loadAppData() {

  /*
   * 1. Datos estáticos actuales
   */

  const [
    placesJSON,
    videosJSON
  ] =
    await Promise.all([

      fetchJSON(
        "data/places.json",
        []
      ),

      fetchJSON(
        "data/videos.json",
        []
      )

    ]);

  /*
   * 2. Datos locales antiguos
   */

  const oldLocalPlaces =
    loadOldLocalPlaces();

  const oldLocalVideos =
    loadOldLocalVideos();

  /*
   * 3. Comprobamos Supabase
   */

  await testSupabaseConnection();

  let cloudPlaces = [];
  let cloudVideos = [];
  let cloudDiscoveries = [];

  if (
    supabaseOnline
  ) {

    [
      cloudPlaces,
      cloudVideos,
      cloudDiscoveries
    ] =
      await Promise.all([

        loadSupabasePlaces(),

        loadSupabaseVideos(),

        loadSupabaseDiscoveries()

      ]);
  }

  /*
   * 4. Mezclamos lugares
   */

  places =
    mergePlaces(
      placesJSON,
      oldLocalPlaces,
      cloudPlaces
    );

  /*
   * 5. Mezclamos vídeos
   */

  const videoMap =
    new Map();

  [
    ...(Array.isArray(videosJSON)
      ? videosJSON
      : []),

    ...oldLocalVideos,

    ...cloudVideos

  ]
    .map(
      normalizeVideo
    )
    .forEach(
      video => {

        const dedupeKey =
          video.sourceUrl ||
          video.url ||
          video.id;

        if (
          !videoMap.has(
            dedupeKey
          )
        ) {

          videoMap.set(
            dedupeKey,
            video
          );

          return;
        }

        const existing =
          videoMap.get(
            dedupeKey
          );

        if (
          video.source ===
          "supabase"
        ) {

          videoMap.set(
            dedupeKey,
            {
              ...existing,
              ...video
            }
          );
        }
      }
    );

  videos =
    Array.from(
      videoMap.values()
    );

  /*
   * 6. Descubrimientos compartidos
   */

  discoveries =
    cloudDiscoveries;

  /*
   * 7. Dibujamos
   */

  renderMarkers();

  console.log(
    `📍 ${places.length} lugares cargados`
  );

  console.log(
    `🎥 ${videos.length} vídeos cargados`
  );

  console.log(
    `✨ ${discoveries.length} descubrimientos compartidos`
  );
}

// =========================================================
// ACTUALIZACIÓN EN TIEMPO REAL
// Si otra persona añade un lugar, podemos refrescar
// automáticamente la información.
// =========================================================

function startRealtimeUpdates() {

  if (
    !supabaseClient ||
    !supabaseOnline
  ) {

    return;
  }

  supabaseClient
    .channel(
      "mundo-infinito-live"
    )
    .on(
      "postgres_changes",
      {
        event:
          "*",

        schema:
          "public",

        table:
          "places"
      },
      async () => {

        await reloadSharedData();
      }
    )
    .on(
      "postgres_changes",
      {
        event:
          "*",

        schema:
          "public",

        table:
          "videos"
      },
      async () => {

        await reloadSharedData();
      }
    )
    .on(
      "postgres_changes",
      {
        event:
          "*",

        schema:
          "public",

        table:
          "discoveries"
      },
      async () => {

        await reloadSharedData();
      }
    )
    .subscribe();
}

// =========================================================
// RECARGAR SOLO DATOS COMPARTIDOS
// =========================================================

async function reloadSharedData() {

  if (
    !supabaseClient ||
    !supabaseOnline
  ) {

    return;
  }

  try {

    const [
      cloudPlaces,
      cloudVideos,
      cloudDiscoveries
    ] =
      await Promise.all([

        loadSupabasePlaces(),

        loadSupabaseVideos(),

        loadSupabaseDiscoveries()

      ]);

    /*
     * Añadimos/actualizamos lugares
     */

    cloudPlaces.forEach(
      cloudPlace => {

        const index =
          places.findIndex(
            place =>
              place.id ===
              cloudPlace.id ||
              place.slug ===
              cloudPlace.slug
          );

        if (
          index >= 0
        ) {

          places[index] = {
            ...places[index],
            ...cloudPlace
          };

        } else {

          places.push(
            cloudPlace
          );
        }
      }
    );

    /*
     * Vídeos
     */

    cloudVideos.forEach(
      cloudVideo => {

        const index =
          videos.findIndex(
            video =>
              video.id ===
              cloudVideo.id ||
              (
                cloudVideo.sourceUrl &&
                video.sourceUrl ===
                cloudVideo.sourceUrl
              )
          );

        if (
          index >= 0
        ) {

          videos[index] = {
            ...videos[index],
            ...cloudVideo
          };

        } else {

          videos.push(
            cloudVideo
          );
        }
      }
    );

    discoveries =
      cloudDiscoveries;

    renderMarkers();

    /*
     * Si tenemos una ficha abierta,
     * actualizamos sus vídeos también.
     */

    if (
      selectedPlace
    ) {

      const refreshed =
        places.find(
          place =>
            place.id ===
              selectedPlace.id ||
            place.slug ===
              selectedPlace.slug
        );

      if (
        refreshed
      ) {

        selectedPlace =
          refreshed;

        renderPlaceVideos(
          refreshed
        );
      }
    }

    console.log(
      "🔄 Mundo Infinito actualizado"
    );

  } catch (error) {

    console.error(
      "Error actualizando datos compartidos:",
      error
    );
  }
}

// =========================================================
// REDIMENSIONAR MAPA
// =========================================================

window.addEventListener(
  "resize",
  () => {

    window.setTimeout(
      () => {

        map.invalidateSize();
      },
      120
    );
  }
);

// =========================================================
// CONTROL GENERAL DE ERRORES
// =========================================================

window.addEventListener(
  "error",
  event => {

    console.error(
      "Mundo Infinito:",
      event.error ||
      event.message
    );
  }
);

// =========================================================
// INICIALIZACIÓN
// =========================================================

async function init() {

  console.log(
    "🌍 Iniciando Mundo Infinito v0.5.0"
  );

  /*
   * Primero creamos el cliente Supabase.
   */

  initializeSupabase();

  /*
   * Después cargamos toda la información.
   */

  await loadAppData();

  map.invalidateSize();

  /*
   * Activamos sincronización en tiempo real
   * solamente si la conexión funciona.
   */

  if (
    supabaseOnline
  ) {

    startRealtimeUpdates();

    console.log(
      "🟢 Mundo Infinito conectado y compartido"
    );

  } else {

    console.log(
      "🟠 Mundo Infinito funcionando en modo local"
    );
  }
}

// =========================================================
// ARRANCAR
// =========================================================

init();

// =========================================================
// FIN · MUNDO INFINITO v0.5.0
// =========================================================
