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
    saved: "mi-saved-places",
    discoveries: "mi-discoveries"
  }
};

// =========================================================
// SUPABASE
// =========================================================

let supabaseClient = null;
let supabaseOnline = false;

// =========================================================
// DATOS DE LA APP
// =========================================================

let places = [];
let videos = [];
let discoveries = [];

let selectedPlace = null;

// =========================================================
// MARCADORES
// =========================================================

const markers = new Map();

// =========================================================
// ICONOS POR CATEGORÍA
// =========================================================

const categoryIcons = {
  Lugar: "📍",
  Mirador: "🌄",
  Playa: "🏖️",
  Parque: "🌿",
  Cultura: "🎭",
  Restaurante: "🍴",
  Gastronomía: "🍴",
  Compras: "🛍️",
  "Vida nocturna": "🌙",
  Transporte: "🚕",
  Consejo: "💡"
};

// =========================================================
// ELEMENTOS DEL DOM
// =========================================================

const mapElement =
  document.getElementById("map");

const searchInput =
  document.getElementById("searchInput");

const clearSearch =
  document.getElementById("clearSearch");

const searchResults =
  document.getElementById("searchResults");

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

const discoveryTitle =
  document.getElementById(
    "discoveryTitle"
  );

const discoveryPlace =
  document.getElementById(
    "discoveryPlace"
  );

const discoveryCategory =
  document.getElementById(
    "discoveryCategory"
  );

const discoveryVideoLink =
  document.getElementById(
    "discoveryVideoLink"
  );

const discoveryComment =
  document.getElementById(
    "discoveryComment"
  );

const discoveryLat =
  document.getElementById(
    "discoveryLat"
  );

const discoveryLng =
  document.getElementById(
    "discoveryLng"
  );

const useMapCenter =
  document.getElementById(
    "useMapCenter"
  );

// =========================================================
// NUEVOS ELEMENTOS v0.6
// =========================================================

const discoveryVideoFile =
  document.getElementById(
    "discoveryVideoFile"
  );

const discoveryVideoPreview =
  document.getElementById(
    "discoveryVideoPreview"
  );

const discoveryPreviewPlayer =
  document.getElementById(
    "discoveryPreviewPlayer"
  );

const videoExplorationStatus =
  document.getElementById(
    "videoExplorationStatus"
  );

const explorationMessage =
  document.getElementById(
    "explorationMessage"
  );

const explorationProgressBar =
  document.getElementById(
    "explorationProgressBar"
  );

const explorationResults =
  document.getElementById(
    "explorationResults"
  );

const detectedDetailsCount =
  document.getElementById(
    "detectedDetailsCount"
  );

const detectedDetailsList =
  document.getElementById(
    "detectedDetailsList"
  );

const addManualDetailButton =
  document.getElementById(
    "addManualDetailButton"
  );

const manualDetailEditor =
  document.getElementById(
    "manualDetailEditor"
  );

const detailType =
  document.getElementById(
    "detailType"
  );

const detailTimestampStart =
  document.getElementById(
    "detailTimestampStart"
  );

const detailTimestampEnd =
  document.getElementById(
    "detailTimestampEnd"
  );

const useCurrentVideoTime =
  document.getElementById(
    "useCurrentVideoTime"
  );

const cancelDetailEdit =
  document.getElementById(
    "cancelDetailEdit"
  );

const addDetailToDraft =
  document.getElementById(
    "addDetailToDraft"
  );

const videoDraftSummary =
  document.getElementById(
    "videoDraftSummary"
  );

const draftDetailsCount =
  document.getElementById(
    "draftDetailsCount"
  );

const videoDraftDetailsList =
  document.getElementById(
    "videoDraftDetailsList"
  );

const saveAllDiscoveriesButton =
  document.getElementById(
    "saveAllDiscoveriesButton"
  );

// =========================================================
// FICHA DE LUGAR
// =========================================================

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

const savePlaceButton =
  document.getElementById(
    "savePlaceButton"
  );

const placeMapsButton =
  document.getElementById(
    "placeMapsButton"
  );

const placeVideoCount =
  document.getElementById(
    "placeVideoCount"
  );

const placeVideosList =
  document.getElementById(
    "placeVideosList"
  );

// =========================================================
// PANEL GENERAL
// =========================================================

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

const videoModalTitle =
  document.getElementById(
    "videoModalTitle"
  );

const videoModalPlace =
  document.getElementById(
    "videoModalPlace"
  );

const videoPlayer =
  document.getElementById(
    "videoPlayer"
  );

// =========================================================
// OTROS
// =========================================================

const toast =
  document.getElementById("toast");

const navButtons =
  document.querySelectorAll(
    ".nav-button"
  );

// =========================================================
// ESTADO DEL NUEVO ➕ v0.6
// =========================================================

let videoDraftDetails = [];

let editingDetailIndex = null;

let selectedVideoFile = null;

let explorationTimer = null;

// =========================================================
// MAPA
// =========================================================

const map =
  L.map(
    mapElement,
    {
      zoomControl: true
    }
  ).setView(
    CONFIG.center,
    CONFIG.zoom
  );

L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution:
      "&copy; OpenStreetMap"
  }
).addTo(map);// =========================================================
// UTILIDADES
// =========================================================

function escapeHTML(value) {

  return String(
    value ?? ""
  )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slug(value) {

  return String(
    value || ""
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
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
    showToast.timer
  );

  showToast.timer =
    window.setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      2600
    );
}

function loadJSON(
  key,
  fallback
) {

  try {

    const raw =
      localStorage.getItem(
        key
      );

    if (!raw) {
      return fallback;
    }

    return JSON.parse(
      raw
    );

  } catch (error) {

    console.warn(
      "No se pudo leer:",
      key,
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
      JSON.stringify(
        value
      )
    );

  } catch (error) {

    console.warn(
      "No se pudo guardar:",
      key,
      error
    );
  }
}

async function fetchJSON(
  url,
  fallback = []
) {

  try {

    const response =
      await fetch(
        url,
        {
          cache:
            "no-store"
        }
      );

    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );
    }

    return await response.json();

  } catch (error) {

    console.warn(
      `No se pudo cargar ${url}`,
      error
    );

    return fallback;
  }
}

// =========================================================
// TIMESTAMPS v0.6
// Convierte 01:35 → 95 segundos
// =========================================================

function timestampToSeconds(
  value
) {

  const text =
    String(
      value || ""
    ).trim();

  if (!text) {
    return 0;
  }

  if (
    /^\d+$/.test(
      text
    )
  ) {

    return Math.max(
      0,
      Number(text)
    );
  }

  const parts =
    text
      .split(":")
      .map(
        part =>
          Number(part)
      );

  if (
    parts.some(
      part =>
        !Number.isFinite(
          part
        )
    )
  ) {

    return 0;
  }

  if (
    parts.length === 2
  ) {

    return Math.max(
      0,
      (
        parts[0] * 60
      ) +
      parts[1]
    );
  }

  if (
    parts.length === 3
  ) {

    return Math.max(
      0,
      (
        parts[0] * 3600
      ) +
      (
        parts[1] * 60
      ) +
      parts[2]
    );
  }

  return 0;
}

// =========================================================
// SEGUNDOS → 01:35
// =========================================================

function secondsToTimestamp(
  totalSeconds
) {

  const seconds =
    Math.max(
      0,
      Math.floor(
        Number(
          totalSeconds
        ) || 0
      )
    );

  const hours =
    Math.floor(
      seconds / 3600
    );

  const minutes =
    Math.floor(
      (
        seconds % 3600
      ) / 60
    );

  const remainingSeconds =
    seconds % 60;

  if (
    hours > 0
  ) {

    return [
      hours,
      String(
        minutes
      ).padStart(
        2,
        "0"
      ),
      String(
        remainingSeconds
      ).padStart(
        2,
        "0"
      )
    ].join(":");
  }

  return [
    String(
      minutes
    ).padStart(
      2,
      "0"
    ),
    String(
      remainingSeconds
    ).padStart(
      2,
      "0"
    )
  ].join(":");
}

// =========================================================
// NORMALIZAR TIMESTAMP ESCRITO
// =========================================================

function normalizeTimestampText(
  value
) {

  const seconds =
    timestampToSeconds(
      value
    );

  return secondsToTimestamp(
    seconds
  );
}

// =========================================================
// ICONO DEL TIPO DE DETALLE
// =========================================================

function detailIcon(
  type,
  category
) {

  const icons = {
    Lugar:
      "📍",

    Restaurante:
      "🍴",

    Playa:
      "🏖️",

    Mirador:
      "🌄",

    Consejo:
      "💡",

    Precio:
      "💰",

    Transporte:
      "🚕",

    Aviso:
      "⚠️",

    Compras:
      "🛍️",

    Evento:
      "🎉",

    Otro:
      "✨"
  };

  return (
    icons[type] ||
    categoryIcons[
      category
    ] ||
    "📍"
  );
}

// =========================================================
// NORMALIZAR LUGAR
// =========================================================

function normalizePlace(
  place
) {

  return {
    id:
      String(
        place.id ||
        `place-${Date.now()}`
      ),

    slug:
      place.slug ||
      slug(
        place.name ||
        place.title ||
        ""
      ),

    name:
      place.name ||
      place.title ||
      "Lugar",

    zone:
      place.zone ||
      place.place ||
      "",

    city:
      place.city ||
      CONFIG.city,

    country:
      place.country ||
      CONFIG.country,

    category:
      place.category ||
      "Lugar",

    description:
      place.description ||
      "",

    tip:
      place.tip ||
      "",

    lat:
      Number(
        place.lat
      ),

    lng:
      Number(
        place.lng
      ),

    source:
      place.source ||
      "static"
  };
}

// =========================================================
// NORMALIZAR VÍDEO
// =========================================================

function normalizeVideo(
  video
) {

  return {
    id:
      String(
        video.id ||
        `video-${Date.now()}`
      ),

    placeId:
      video.placeId ||
      video.place_id ||
      null,

    place:
      video.place ||
      "",

    title:
      video.title ||
      "Vídeo",

    description:
      video.description ||
      "",

    type:
      video.type ||
      "Vídeo",

    url:
      video.url ||
      video.sourceUrl ||
      video.source_url ||
      "",

    sourceUrl:
      video.sourceUrl ||
      video.source_url ||
      video.url ||
      "",

    source:
      video.source ||
      "static"
  };
}

// =========================================================
// NORMALIZAR DESCUBRIMIENTO
// =========================================================

function normalizeDiscovery(
  discovery
) {

  return {
    id:
      String(
        discovery.id ||
        `discovery-${Date.now()}`
      ),

    title:
      discovery.title ||
      "Descubrimiento",

    description:
      discovery.description ||
      "",

    category:
      discovery.category ||
      "Lugar",

    placeId:
      discovery.placeId ||
      discovery.place_id ||
      null,

    videoId:
      discovery.videoId ||
      discovery.video_id ||
      null,

    timestampStart:
      Number(
        discovery.timestampStart ??
        discovery.timestamp_start ??
        0
      ),

    timestampEnd:
      discovery.timestampEnd ===
        null ||
      discovery.timestampEnd ===
        undefined
        ? null
        : Number(
            discovery.timestampEnd ??
            discovery.timestamp_end
          ),

    source:
      discovery.source ||
      "supabase"
  };
}

// =========================================================
// FAVORITOS
// =========================================================

function getSavedPlaces() {

  const saved =
    loadJSON(
      CONFIG.storage.saved,
      []
    );

  return Array.isArray(
    saved
  )
    ? saved.map(String)
    : [];
}

function isPlaceSaved(
  placeId
) {

  return getSavedPlaces()
    .includes(
      String(
        placeId
      )
    );
}

function toggleSavedPlace(
  placeId
) {

  const id =
    String(
      placeId
    );

  const saved =
    getSavedPlaces();

  const index =
    saved.indexOf(
      id
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
      id
    );

    showToast(
      "❤️ Guardado"
    );
  }

  saveJSON(
    CONFIG.storage.saved,
    saved
  );

  return saved.includes(
    id
  );
}

// =========================================================
// SUPABASE · INICIALIZACIÓN
// =========================================================

function initializeSupabase() {

  try {

    if (
      typeof window.supabase ===
      "undefined"
    ) {

      console.warn(
        "La librería de Supabase no está disponible."
      );

      return;
    }

    if (
      typeof SUPABASE_URL ===
        "undefined" ||
      typeof SUPABASE_KEY ===
        "undefined"
    ) {

      console.warn(
        "Falta la configuración de Supabase."
      );

      return;
    }

    supabaseClient =
      window.supabase
        .createClient(
          SUPABASE_URL,
          SUPABASE_KEY
        );

  } catch (error) {

    console.error(
      "Error inicializando Supabase:",
      error
    );

    supabaseClient =
      null;
  }
}

// =========================================================
// COMPROBAR CONEXIÓN
// =========================================================

async function testSupabaseConnection() {

  if (
    !supabaseClient
  ) {

    supabaseOnline =
      false;

    return false;
  }

  try {

    const {
      error
    } =
      await supabaseClient
        .from(
          "places"
        )
        .select(
          "id"
        )
        .limit(
          1
        );

    if (error) {

      throw error;
    }

    supabaseOnline =
      true;

    console.log(
      "🟢 Supabase conectado"
    );

    return true;

  } catch (error) {

    supabaseOnline =
      false;

    console.warn(
      "🟠 Supabase no disponible:",
      error
    );

    return false;
  }
}// =========================================================
// SUPABASE · CARGAR DATOS COMPARTIDOS
// =========================================================

async function loadSupabasePlaces() {

  if (
    !supabaseClient
  ) {

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

    return (
      data || []
    ).map(
      item =>
        normalizePlace({
          id:
            item.id,

          slug:
            item.slug,

          name:
            item.name,

          zone:
            item.zone,

          city:
            item.city,

          country:
            item.country,

          category:
            item.category,

          description:
            item.description,

          lat:
            item.latitude,

          lng:
            item.longitude,

          source:
            "supabase"
        })
    );

  } catch (error) {

    console.error(
      "No se pudieron cargar los lugares:",
      error
    );

    return [];
  }
}

async function loadSupabaseVideos() {

  if (
    !supabaseClient
  ) {

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

    return (
      data || []
    ).map(
      item =>
        normalizeVideo({
          id:
            item.id,

          title:
            item.title,

          description:
            item.description,

          type:
            item.source_type ||
            "Vídeo",

          url:
            item.video_url ||
            item.source_url ||
            "",

          sourceUrl:
            item.source_url ||
            item.video_url ||
            "",

          source:
            "supabase"
        })
    );

  } catch (error) {

    console.error(
      "No se pudieron cargar los vídeos:",
      error
    );

    return [];
  }
}

async function loadSupabaseDiscoveries() {

  if (
    !supabaseClient
  ) {

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

    return (
      data || []
    ).map(
      normalizeDiscovery
    );

  } catch (error) {

    console.error(
      "No se pudieron cargar los descubrimientos:",
      error
    );

    return [];
  }
}

// =========================================================
// SUPABASE · BUSCAR LUGAR POR SLUG
// =========================================================

async function findSupabasePlaceBySlug(
  placeSlug
) {

  if (
    !supabaseClient
  ) {

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

    if (!data) {
      return null;
    }

    return normalizePlace({
      id:
        data.id,

      slug:
        data.slug,

      name:
        data.name,

      zone:
        data.zone,

      city:
        data.city,

      country:
        data.country,

      category:
        data.category,

      description:
        data.description,

      lat:
        data.latitude,

      lng:
        data.longitude,

      source:
        "supabase"
    });

  } catch (error) {

    console.error(
      "Error buscando lugar:",
      error
    );

    return null;
  }
}

// =========================================================
// SUPABASE · CREAR O REUTILIZAR LUGAR
// =========================================================

async function createOrGetPlace(
  detail
) {

  const name =
    String(
      detail.title ||
      "Descubrimiento"
    ).trim();

  const placeSlug =
    slug(name);

  const existing =
    await findSupabasePlaceBySlug(
      placeSlug
    );

  if (existing) {

    return existing;
  }

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

        category:
          detail.category ||
          "Lugar",

        zone:
          detail.place ||
          detail.zone ||
          "",

        city:
          CONFIG.city,

        country:
          CONFIG.country,

        description:
          detail.comment ||
          detail.description ||
          "Descubrimiento guardado en Mundo Infinito.",

        latitude:
          Number(
            detail.lat
          ),

        longitude:
          Number(
            detail.lng
          )
      })
      .select()
      .single();

  if (error) {
    throw error;
  }

  return normalizePlace({
    id:
      data.id,

    slug:
      data.slug,

    name:
      data.name,

    zone:
      data.zone,

    city:
      data.city,

    country:
      data.country,

    category:
      data.category,

    description:
      data.description,

    lat:
      data.latitude,

    lng:
      data.longitude,

    source:
      "supabase"
  });
}

// =========================================================
// SUPABASE · CREAR O REUTILIZAR VÍDEO
// Un vídeo solo se guarda UNA VEZ.
// =========================================================

async function createOrGetSupabaseVideo({
  title,
  description,
  url
}) {

  if (
    !url
  ) {

    return null;
  }

  const {
    data: existing,
    error: searchError
  } =
    await supabaseClient
      .from("videos")
      .select("*")
      .eq(
        "source_url",
        url
      )
      .limit(
        1
      );

  if (searchError) {
    throw searchError;
  }

  if (
    Array.isArray(
      existing
    ) &&
    existing.length > 0
  ) {

    return normalizeVideo({
      id:
        existing[0].id,

      title:
        existing[0].title,

      description:
        existing[0].description,

      type:
        existing[0].source_type ||
        "Vídeo",

      url:
        existing[0].video_url ||
        existing[0].source_url,

      sourceUrl:
        existing[0].source_url,

      source:
        "supabase"
    });
  }

  let sourceType =
    "Vídeo";

  if (
    url.includes(
      "instagram.com"
    )
  ) {

    sourceType =
      "Instagram";

  } else if (
    url.includes(
      "tiktok.com"
    )
  ) {

    sourceType =
      "TikTok";

  } else if (
    url.includes(
      "youtube.com"
    ) ||
    url.includes(
      "youtu.be"
    )
  ) {

    sourceType =
      "YouTube";
  }

  const directVideo =
    /\.(mp4|webm|ogg)(\?.*)?$/i.test(
      url
    );

  const {
    data,
    error
  } =
    await supabaseClient
      .from("videos")
      .insert({
        title:
          title ||
          "Vídeo de Mundo Infinito",

        description:
          description ||
          "",

        video_url:
          directVideo
            ? url
            : null,

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
    id:
      data.id,

    title:
      data.title,

    description:
      data.description,

    type:
      data.source_type ||
      "Vídeo",

    url:
      data.video_url ||
      data.source_url,

    sourceUrl:
      data.source_url,

    source:
      "supabase"
  });
}

// =========================================================
// SUPABASE · CREAR DESCUBRIMIENTO
// Cada detalle del vídeo crea una fila diferente.
// =========================================================

async function createSupabaseDiscovery({
  detail,
  placeId,
  videoId
}) {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("discoveries")
      .insert({
        video_id:
          videoId ||
          null,

        place_id:
          placeId ||
          null,

        title:
          detail.title,

        description:
          detail.comment ||
          detail.description ||
          "",

        category:
          detail.category ||
          detail.type ||
          "Lugar",

        timestamp_start:
          Number(
            detail.timestampStart ||
            0
          ),

        timestamp_end:
          detail.timestampEnd ===
            null ||
          detail.timestampEnd ===
            undefined
            ? null
            : Number(
                detail.timestampEnd
              ),

        confidence:
          detail.confidence ??
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
// RELACIONES VÍDEO ↔ LUGAR
// =========================================================

function getDiscoveriesForPlace(
  place
) {

  if (!place) {
    return [];
  }

  return discoveries.filter(
    discovery =>
      String(
        discovery.placeId
      ) ===
      String(
        place.id
      )
  );
}

function getDiscoveriesForVideo(
  video
) {

  if (!video) {
    return [];
  }

  return discoveries.filter(
    discovery =>
      String(
        discovery.videoId
      ) ===
      String(
        video.id
      )
  );
}

// =========================================================
// VÍDEOS RELACIONADOS CON UN LUGAR
// =========================================================

function getVideosForPlace(
  place
) {

  const relatedDiscoveries =
    getDiscoveriesForPlace(
      place
    );

  const videoIds =
    new Set(
      relatedDiscoveries
        .map(
          item =>
            String(
              item.videoId ||
              ""
            )
        )
        .filter(Boolean)
    );

  return videos.filter(
    video => {

      if (
        videoIds.has(
          String(
            video.id
          )
        )
      ) {

        return true;
      }

      if (
        video.placeId &&
        String(
          video.placeId
        ) ===
        String(
          place.id
        )
      ) {

        return true;
      }

      if (
        video.place &&
        slug(
          video.place
        ) ===
        slug(
          place.name
        )
      ) {

        return true;
      }

      return false;
    }
  );
}

// =========================================================
// TIMESTAMP PARA UN LUGAR DENTRO DE UN VÍDEO
// =========================================================

function getVideoTimestampForPlace(
  videoId,
  placeId
) {

  const discovery =
    discoveries.find(
      item =>
        String(
          item.videoId
        ) ===
        String(
          videoId
        ) &&
        String(
          item.placeId
        ) ===
        String(
          placeId
        )
    );

  if (!discovery) {
    return 0;
  }

  return Number(
    discovery.timestampStart ||
    0
  );
}

// =========================================================
// OBTENER TODOS LOS MOMENTOS DE UN VÍDEO
// =========================================================

function getVideoMoments(
  videoId
) {

  return discoveries
    .filter(
      item =>
        String(
          item.videoId
        ) ===
        String(
          videoId
        )
    )
    .sort(
      (
        a,
        b
      ) =>
        Number(
          a.timestampStart ||
          0
        ) -
        Number(
          b.timestampStart ||
          0
        )
    );
}

// =========================================================
// COMBINAR LUGARES
// Evitamos duplicados entre JSON, local y Supabase.
// =========================================================

function mergePlaces(
  ...groups
) {

  const result =
    new Map();

  groups
    .flat()
    .filter(Boolean)
    .map(
      normalizePlace
    )
    .forEach(
      place => {

        const key =
          place.slug ||
          slug(
            place.name
          ) ||
          place.id;

        if (
          !result.has(
            key
          )
        ) {

          result.set(
            key,
            place
          );

          return;
        }

        const previous =
          result.get(
            key
          );

        if (
          place.source ===
          "supabase"
        ) {

          result.set(
            key,
            {
              ...previous,
              ...place
            }
          );
        }
      }
    );

  return Array.from(
    result.values()
  );
}

// =========================================================
// MARCADORES
// =========================================================

function markerClass(
  category
) {

  return slug(
    category ||
    "Lugar"
  );
}

function createMarkerIcon(
  place
) {

  const icon =
    categoryIcons[
      place.category
    ] ||
    "📍";

  return L.divIcon({
    className:
      "",

    html:
      `
        <div
          class="custom-marker ${markerClass(place.category)}"
        >
          <span>
            ${icon}
          </span>
        </div>
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

function addMarker(
  place
) {

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

  const id =
    String(
      place.id
    );

  if (
    markers.has(
      id
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
    ).addTo(
      map
    );

  marker.on(
    "click",
    () => {

      openPlace(
        id
      );
    }
  );

  markers.set(
    id,
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
// BUSCAR LUGAR POR ID
// =========================================================

function getPlaceById(
  placeId
) {

  return places.find(
    place =>
      String(
        place.id
      ) ===
      String(
        placeId
      )
  );
}// =========================================================
// BLOQUE 4 · NUEVO ➕ v0.6
// Exploración + borrador + edición manual
// =========================================================


// =========================================================
// ABRIR / CERRAR MODAL
// =========================================================

function resetDiscoveryFlow() {

  videoDraftDetails =
    [];

  editingDetailIndex =
    null;

  selectedVideoFile =
    null;

  if (
    explorationTimer
  ) {

    window.clearInterval(
      explorationTimer
    );

    explorationTimer =
      null;
  }

  if (
    discoveryForm
  ) {

    discoveryForm.reset();
  }

  if (
    discoveryPreviewPlayer
  ) {

    discoveryPreviewPlayer.pause();

    discoveryPreviewPlayer
      .removeAttribute(
        "src"
      );

    discoveryPreviewPlayer.load();
  }

  if (
    discoveryVideoPreview
  ) {

    discoveryVideoPreview
      .classList
      .add(
        "hidden"
      );
  }

  const card =
    discoveryModal
      ?.querySelector(
        ".discovery-v06-card"
      );

  if (card) {

    card.classList.remove(
      "is-exploring",
      "has-results"
    );
  }

  if (
    videoExplorationStatus
  ) {

    videoExplorationStatus
      .classList
      .remove(
        "active"
      );
  }

  if (
    explorationResults
  ) {

    explorationResults
      .classList
      .remove(
        "active"
      );
  }

  if (
    videoDraftSummary
  ) {

    videoDraftSummary
      .classList
      .remove(
        "active"
      );
  }

  if (
    manualDetailEditor
  ) {

    manualDetailEditor
      .classList
      .remove(
        "open"
      );
  }

  if (
    saveAllDiscoveriesButton
  ) {

    saveAllDiscoveriesButton
      .classList
      .remove(
        "visible"
      );
  }

  if (
    detectedDetailsList
  ) {

    detectedDetailsList.innerHTML =
      "";
  }

  if (
    videoDraftDetailsList
  ) {

    videoDraftDetailsList.innerHTML =
      "";
  }

  if (
    detectedDetailsCount
  ) {

    detectedDetailsCount.textContent =
      "0";
  }

  if (
    draftDetailsCount
  ) {

    draftDetailsCount.textContent =
      "0";
  }

  if (
    explorationProgressBar
  ) {

    explorationProgressBar.style.width =
      "0%";
  }

  if (
    explorationMessage
  ) {

    explorationMessage.textContent =
      "Preparando el contenido…";
  }
}

function openAddDiscovery() {

  closePlace();
  closeContent();

  resetDiscoveryFlow();

  discoveryModal
    .classList
    .add(
      "open"
    );

  discoveryModal
    .setAttribute(
      "aria-hidden",
      "false"
    );

  window.setTimeout(
    () => {

      if (
        discoveryVideoLink
      ) {

        discoveryVideoLink.focus();
      }

    },
    180
  );
}

function closeAddDiscovery() {

  discoveryModal
    .classList
    .remove(
      "open"
    );

  discoveryModal
    .setAttribute(
      "aria-hidden",
      "true"
    );

  if (
    explorationTimer
  ) {

    window.clearInterval(
      explorationTimer
    );

    explorationTimer =
      null;
  }
}

openDiscoveryModal
  ?.addEventListener(
    "click",
    openAddDiscovery
  );

closeDiscoveryModal
  ?.addEventListener(
    "click",
    closeAddDiscovery
  );

discoveryModal
  ?.addEventListener(
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
// CENTRO DEL MAPA
// =========================================================

useMapCenter
  ?.addEventListener(
    "click",
    () => {

      const center =
        map.getCenter();

      discoveryLat.value =
        center.lat.toFixed(
          6
        );

      discoveryLng.value =
        center.lng.toFixed(
          6
        );

      showToast(
        "📍 Ubicación añadida"
      );
    }
  );


// =========================================================
// SELECCIONAR ARCHIVO LOCAL
// =========================================================

discoveryVideoFile
  ?.addEventListener(
    "change",
    event => {

      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      selectedVideoFile =
        file;

      const objectURL =
        URL.createObjectURL(
          file
        );

      discoveryPreviewPlayer.src =
        objectURL;

      discoveryVideoPreview
        .classList
        .remove(
          "hidden"
        );

      beginVideoExploration({
        sourceType:
          "file",

        source:
          objectURL
      });
    }
  );


// =========================================================
// PEGAR ENLACE
// Al terminar de escribir el enlace,
// comienza automáticamente la exploración.
// =========================================================

let videoLinkTimer =
  null;

discoveryVideoLink
  ?.addEventListener(
    "input",
    () => {

      window.clearTimeout(
        videoLinkTimer
      );

      const url =
        discoveryVideoLink
          .value
          .trim();

      if (
        !url ||
        url.length < 8
      ) {

        return;
      }

      videoLinkTimer =
        window.setTimeout(
          () => {

            beginVideoExploration({
              sourceType:
                "url",

              source:
                url
            });

          },
          700
        );
    }
  );


// =========================================================
// EXPLORACIÓN DEL VÍDEO
// En esta fase mostramos el flujo visual.
// El análisis automático real se conectará después.
// =========================================================

function beginVideoExploration({
  sourceType,
  source
}) {

  const card =
    discoveryModal
      ?.querySelector(
        ".discovery-v06-card"
      );

  if (!card) {
    return;
  }

  card.classList.remove(
    "has-results"
  );

  card.classList.add(
    "is-exploring"
  );

  videoExplorationStatus
    ?.classList
    .add(
      "active"
    );

  explorationResults
    ?.classList
    .remove(
      "active"
    );

  manualDetailEditor
    ?.classList
    .remove(
      "open"
    );

  if (
    explorationProgressBar
  ) {

    explorationProgressBar.style.width =
      "8%";
  }

  const phases = [

    {
      progress:
        18,

      message:
        "Escuchando lo que cuentan…"
    },

    {
      progress:
        35,

      message:
        "Localizando lugares mencionados…"
    },

    {
      progress:
        52,

      message:
        "Buscando gastronomía y recomendaciones…"
    },

    {
      progress:
        69,

      message:
        "Identificando consejos útiles…"
    },

    {
      progress:
        86,

      message:
        "Localizando momentos exactos…"
    },

    {
      progress:
        100,

      message:
        "Preparando tus descubrimientos…"
    }

  ];

  let phaseIndex =
    0;

  if (
    explorationTimer
  ) {

    window.clearInterval(
      explorationTimer
    );
  }

  explorationTimer =
    window.setInterval(
      () => {

        const phase =
          phases[
            phaseIndex
          ];

        if (!phase) {

          window.clearInterval(
            explorationTimer
          );

          explorationTimer =
            null;

          finishVideoExploration({
            sourceType,
            source
          });

          return;
        }

        if (
          explorationMessage
        ) {

          explorationMessage.textContent =
            phase.message;
        }

        if (
          explorationProgressBar
        ) {

          explorationProgressBar
            .style
            .width =
              `${phase.progress}%`;
        }

        phaseIndex +=
          1;

      },
      650
    );
}


// =========================================================
// FIN DE EXPLORACIÓN
// Todavía no inventamos resultados.
// Ofrecemos añadir/corregir manualmente.
// =========================================================

function finishVideoExploration({
  sourceType,
  source
}) {

  const card =
    discoveryModal
      ?.querySelector(
        ".discovery-v06-card"
      );

  if (!card) {
    return;
  }

  card.classList.remove(
    "is-exploring"
  );

  card.classList.add(
    "has-results"
  );

  videoExplorationStatus
    ?.classList
    .remove(
      "active"
    );

  explorationResults
    ?.classList
    .add(
      "active"
    );

  /*
   * IMPORTANTE:
   * En esta versión NO fingimos detecciones.
   * La exploración automática real vendrá después.
   */

  videoDraftDetails =
    [];

  renderDetectedDetails();

  renderDraftSummary();

  if (
    detectedDetailsCount
  ) {

    detectedDetailsCount.textContent =
      "0";
  }

  showToast(
    "Vídeo preparado para revisar"
  );

  /*
   * Abrimos directamente el editor
   * para que puedas añadir el primer detalle.
   */

  openManualDetailEditor();
}


// =========================================================
// EDITOR MANUAL
// =========================================================

function resetManualEditor() {

  editingDetailIndex =
    null;

  if (
    detailType
  ) {

    detailType.value =
      "Lugar";
  }

  if (
    discoveryTitle
  ) {

    discoveryTitle.value =
      "";
  }

  if (
    discoveryPlace
  ) {

    discoveryPlace.value =
      "";
  }

  if (
    discoveryCategory
  ) {

    discoveryCategory.value =
      "";
  }

  if (
    detailTimestampStart
  ) {

    detailTimestampStart.value =
      "00:00";
  }

  if (
    detailTimestampEnd
  ) {

    detailTimestampEnd.value =
      "";
  }

  if (
    discoveryComment
  ) {

    discoveryComment.value =
      "";
  }

  if (
    discoveryLat
  ) {

    discoveryLat.value =
      "";
  }

  if (
    discoveryLng
  ) {

    discoveryLng.value =
      "";
  }

  if (
    cancelDetailEdit
  ) {

    cancelDetailEdit
      .classList
      .add(
        "hidden"
      );
  }

  if (
    addDetailToDraft
  ) {

    addDetailToDraft.textContent =
      "＋ Añadir detalle";
  }
}

function openManualDetailEditor(
  detailIndex = null
) {

  manualDetailEditor
    ?.classList
    .add(
      "open"
    );

  if (
    detailIndex === null
  ) {

    resetManualEditor();

  } else {

    editDraftDetail(
      detailIndex
    );
  }

  window.setTimeout(
    () => {

      manualDetailEditor
        ?.scrollIntoView({
          behavior:
            "smooth",

          block:
            "start"
        });

    },
    100
  );
}

function closeManualDetailEditor() {

  manualDetailEditor
    ?.classList
    .remove(
      "open"
    );

  resetManualEditor();
}

addManualDetailButton
  ?.addEventListener(
    "click",
    () => {

      openManualDetailEditor();
    }
  );

cancelDetailEdit
  ?.addEventListener(
    "click",
    () => {

      closeManualDetailEditor();
    }
  );


// =========================================================
// USAR MINUTO ACTUAL DEL REPRODUCTOR
// =========================================================

useCurrentVideoTime
  ?.addEventListener(
    "click",
    () => {

      if (
        !discoveryPreviewPlayer
      ) {

        return;
      }

      const current =
        Number(
          discoveryPreviewPlayer
            .currentTime ||
          0
        );

      detailTimestampStart.value =
        secondsToTimestamp(
          current
        );

      showToast(
        `⏱ ${secondsToTimestamp(current)}`
      );
    }
  );


// =========================================================
// LEER DATOS DEL EDITOR
// =========================================================

function getDetailFromEditor() {

  const title =
    String(
      discoveryTitle?.value ||
      ""
    ).trim();

  const place =
    String(
      discoveryPlace?.value ||
      ""
    ).trim();

  const type =
    String(
      detailType?.value ||
      "Lugar"
    ).trim();

  const category =
    String(
      discoveryCategory?.value ||
      type ||
      "Lugar"
    ).trim();

  const comment =
    String(
      discoveryComment?.value ||
      ""
    ).trim();

  const start =
    timestampToSeconds(
      detailTimestampStart?.value
    );

  const endText =
    String(
      detailTimestampEnd?.value ||
      ""
    ).trim();

  const end =
    endText
      ? timestampToSeconds(
          endText
        )
      : null;

  const center =
    map.getCenter();

  let lat =
    Number(
      discoveryLat?.value
    );

  let lng =
    Number(
      discoveryLng?.value
    );

  if (
    !Number.isFinite(
      lat
    ) ||
    lat === 0
  ) {

    lat =
      center.lat;
  }

  if (
    !Number.isFinite(
      lng
    ) ||
    lng === 0
  ) {

    lng =
      center.lng;
  }

  return {
    id:
      crypto.randomUUID
        ? crypto.randomUUID()
        : `draft-${Date.now()}-${Math.random()}`,

    title,

    place,

    type,

    category,

    comment,

    timestampStart:
      start,

    timestampEnd:
      end,

    lat,

    lng,

    confidence:
      1,

    manual:
      true
  };
}


// =========================================================
// AÑADIR / ACTUALIZAR DETALLE
// =========================================================

addDetailToDraft
  ?.addEventListener(
    "click",
    () => {

      const detail =
        getDetailFromEditor();

      if (
        !detail.title
      ) {

        showToast(
          "Escribe un nombre o título"
        );

        discoveryTitle
          ?.focus();

        return;
      }

      if (
        !detail.place
      ) {

        showToast(
          "Indica el lugar o zona"
        );

        discoveryPlace
          ?.focus();

        return;
      }

      if (
        !detail.category
      ) {

        showToast(
          "Selecciona una categoría"
        );

        return;
      }

      if (
        editingDetailIndex !==
        null
      ) {

        detail.id =
          videoDraftDetails[
            editingDetailIndex
          ].id;

        videoDraftDetails[
          editingDetailIndex
        ] =
          detail;

        showToast(
          "✓ Detalle actualizado"
        );

      } else {

        videoDraftDetails.push(
          detail
        );

        showToast(
          "＋ Detalle añadido"
        );
      }

      editingDetailIndex =
        null;

      renderDetectedDetails();

      renderDraftSummary();

      closeManualDetailEditor();

      if (
        videoDraftDetails.length >
        0
      ) {

        saveAllDiscoveriesButton
          ?.classList
          .add(
            "visible"
          );
      }
    }
  );


// =========================================================
// EDITAR DETALLE
// =========================================================

function editDraftDetail(
  index
) {

  const detail =
    videoDraftDetails[
      index
    ];

  if (!detail) {
    return;
  }

  editingDetailIndex =
    index;

  manualDetailEditor
    ?.classList
    .add(
      "open"
    );

  if (
    detailType
  ) {

    detailType.value =
      detail.type ||
      "Lugar";
  }

  if (
    discoveryTitle
  ) {

    discoveryTitle.value =
      detail.title ||
      "";
  }

  if (
    discoveryPlace
  ) {

    discoveryPlace.value =
      detail.place ||
      "";
  }

  if (
    discoveryCategory
  ) {

    discoveryCategory.value =
      detail.category ||
      "";
  }

  if (
    detailTimestampStart
  ) {

    detailTimestampStart.value =
      secondsToTimestamp(
        detail.timestampStart ||
        0
      );
  }

  if (
    detailTimestampEnd
  ) {

    detailTimestampEnd.value =
      detail.timestampEnd ===
        null ||
      detail.timestampEnd ===
        undefined
        ? ""
        : secondsToTimestamp(
            detail.timestampEnd
          );
  }

  if (
    discoveryComment
  ) {

    discoveryComment.value =
      detail.comment ||
      "";
  }

  if (
    discoveryLat
  ) {

    discoveryLat.value =
      detail.lat ?? "";
  }

  if (
    discoveryLng
  ) {

    discoveryLng.value =
      detail.lng ?? "";
  }

  cancelDetailEdit
    ?.classList
    .remove(
      "hidden"
    );

  if (
    addDetailToDraft
  ) {

    addDetailToDraft.textContent =
      "✓ Guardar cambios";
  }
}


// =========================================================
// ELIMINAR DETALLE
// =========================================================

function removeDraftDetail(
  index
) {

  if (
    !videoDraftDetails[
      index
    ]
  ) {

    return;
  }

  videoDraftDetails.splice(
    index,
    1
  );

  renderDetectedDetails();

  renderDraftSummary();

  if (
    videoDraftDetails.length ===
    0
  ) {

    saveAllDiscoveriesButton
      ?.classList
      .remove(
        "visible"
      );

  } else {

    saveAllDiscoveriesButton
      ?.classList
      .add(
        "visible"
      );
  }

  showToast(
    "Detalle eliminado"
  );
}


// =========================================================
// RENDERIZAR TARJETAS
// =========================================================

function renderDetectedDetails() {

  if (
    !detectedDetailsList
  ) {

    return;
  }

  if (
    videoDraftDetails.length ===
    0
  ) {

    detectedDetailsList.innerHTML =
      `
        <div class="empty-state">

          <span>
            ✨
          </span>

          <strong>
            Añade el primer detalle
          </strong>

          <p>
            Puedes indicar lugares,
            restaurantes, consejos,
            precios o cualquier momento
            útil del vídeo.
          </p>

        </div>
      `;

    detectedDetailsCount.textContent =
      "0";

    return;
  }

  detectedDetailsCount.textContent =
    String(
      videoDraftDetails.length
    );

  detectedDetailsList.innerHTML =
    videoDraftDetails
      .map(
        (
          detail,
          index
        ) => {

          return `
            <article
              class="detected-detail-card"
            >

              <div
                class="detected-detail-icon"
              >
                ${detailIcon(
                  detail.type,
                  detail.category
                )}
              </div>

              <div
                class="detected-detail-info"
              >

                <strong>
                  ${escapeHTML(
                    detail.title
                  )}
                </strong>

                <div
                  class="detected-detail-meta"
                >

                  <span>
                    ${escapeHTML(
                      detail.category
                    )}
                  </span>

                  ${
                    detail.place
                      ? `
                        <span>
                          · ${escapeHTML(
                            detail.place
                          )}
                        </span>
                      `
                      : ""
                  }

                  <span
                    class="detail-time"
                  >
                    ▶ ${secondsToTimestamp(
                      detail.timestampStart
                    )}
                  </span>

                </div>

              </div>

              <div
                class="detected-detail-actions"
              >

                <button
                  type="button"
                  data-edit-detail="${index}"
                  aria-label="Editar detalle"
                >
                  ✏️
                </button>

                <button
                  type="button"
                  data-delete-detail="${index}"
                  aria-label="Eliminar detalle"
                >
                  🗑️
                </button>

              </div>

            </article>
          `;
        }
      )
      .join("");

  detectedDetailsList
    .querySelectorAll(
      "[data-edit-detail]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            openManualDetailEditor(
              Number(
                button.dataset
                  .editDetail
              )
            );
          }
        );
      }
    );

  detectedDetailsList
    .querySelectorAll(
      "[data-delete-detail]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            removeDraftDetail(
              Number(
                button.dataset
                  .deleteDetail
              )
            );
          }
        );
      }
    );
}


// =========================================================
// RESUMEN DEL BORRADOR
// =========================================================

function renderDraftSummary() {

  if (
    !videoDraftSummary ||
    !videoDraftDetailsList
  ) {

    return;
  }

  if (
    videoDraftDetails.length ===
    0
  ) {

    videoDraftSummary
      .classList
      .remove(
        "active"
      );

    return;
  }

  videoDraftSummary
    .classList
    .add(
      "active"
    );

  draftDetailsCount.textContent =
    String(
      videoDraftDetails.length
    );

  videoDraftDetailsList.innerHTML =
    videoDraftDetails
      .map(
        detail => `
          <div
            class="detected-detail-card"
          >

            <div
              class="detected-detail-icon"
            >
              ${detailIcon(
                detail.type,
                detail.category
              )}
            </div>

            <div
              class="detected-detail-info"
            >

              <strong>
                ${escapeHTML(
                  detail.title
                )}
              </strong>

              <div
                class="detected-detail-meta"
              >

                <span>
                  ${escapeHTML(
                    detail.place
                  )}
                </span>

                <span
                  class="detail-time"
                >
                  ${secondsToTimestamp(
                    detail.timestampStart
                  )}
                </span>

              </div>

            </div>

          </div>
        `
      )
      .join("");
}// =========================================================
// BLOQUE 5 · GUARDAR TODO EN SUPABASE
// Un vídeo → varios descubrimientos
// =========================================================


// =========================================================
// OBTENER LA FUENTE DEL VÍDEO
// =========================================================

function getDraftVideoSource() {

  const link =
    String(
      discoveryVideoLink?.value ||
      ""
    ).trim();

  if (link) {

    return {
      type:
        "url",

      url:
        link
    };
  }

  if (
    selectedVideoFile
  ) {

    return {
      type:
        "file",

      file:
        selectedVideoFile
    };
  }

  return null;
}


// =========================================================
// CREAR TÍTULO GENERAL DEL VÍDEO
// =========================================================

function getDraftVideoTitle() {

  if (
    videoDraftDetails.length ===
    0
  ) {

    return "Vídeo de Mundo Infinito";
  }

  if (
    videoDraftDetails.length ===
    1
  ) {

    return videoDraftDetails[0]
      .title ||
      "Vídeo de Mundo Infinito";
  }

  const first =
    videoDraftDetails[0];

  const zone =
    first.place ||
    CONFIG.city;

  return `Descubrimientos en ${zone}`;
}


// =========================================================
// DESCRIPCIÓN GENERAL DEL VÍDEO
// =========================================================

function getDraftVideoDescription() {

  if (
    videoDraftDetails.length ===
    0
  ) {

    return "";
  }

  const names =
    videoDraftDetails
      .slice(
        0,
        4
      )
      .map(
        detail =>
          detail.title
      )
      .filter(Boolean);

  let description =
    names.join(
      " · "
    );

  if (
    videoDraftDetails.length >
    4
  ) {

    description +=
      ` · +${videoDraftDetails.length - 4} detalles`;
  }

  return description;
}


// =========================================================
// ACTUALIZAR DATOS EN MEMORIA
// =========================================================

function addPlaceToLocalState(
  place
) {

  if (!place) {
    return;
  }

  const index =
    places.findIndex(
      item =>
        String(
          item.id
        ) ===
        String(
          place.id
        ) ||
        (
          item.slug &&
          place.slug &&
          item.slug ===
          place.slug
        )
    );

  if (
    index >= 0
  ) {

    places[index] = {
      ...places[index],
      ...place
    };

    return;
  }

  places.push(
    place
  );

  addMarker(
    place
  );
}


function addVideoToLocalState(
  video
) {

  if (!video) {
    return;
  }

  const index =
    videos.findIndex(
      item =>
        String(
          item.id
        ) ===
        String(
          video.id
        ) ||
        (
          video.sourceUrl &&
          item.sourceUrl ===
          video.sourceUrl
        )
    );

  if (
    index >= 0
  ) {

    videos[index] = {
      ...videos[index],
      ...video
    };

    return;
  }

  videos.push(
    video
  );
}


function addDiscoveryToLocalState(
  discovery
) {

  if (!discovery) {
    return;
  }

  const exists =
    discoveries.some(
      item =>
        String(
          item.id
        ) ===
        String(
          discovery.id
        )
    );

  if (!exists) {

    discoveries.push(
      discovery
    );
  }
}


// =========================================================
// GUARDAR BORRADOR EN LOCAL
// Solo se usa si Supabase falla.
// =========================================================

function saveVideoDraftLocally({
  videoURL,
  details
}) {

  const stored =
    loadJSON(
      CONFIG.storage.discoveries,
      []
    );

  const safeStored =
    Array.isArray(
      stored
    )
      ? stored
      : [];

  const localVideoId =
    `local-video-${Date.now()}`;

  details.forEach(
    (
      detail,
      index
    ) => {

      safeStored.push({

        id:
          `local-${Date.now()}-${index}`,

        videoId:
          localVideoId,

        title:
          detail.title,

        name:
          detail.title,

        place:
          detail.place,

        zone:
          detail.place,

        category:
          detail.category,

        type:
          detail.type,

        comment:
          detail.comment,

        description:
          detail.comment,

        timestampStart:
          detail.timestampStart,

        timestampEnd:
          detail.timestampEnd,

        link:
          videoURL ||
          "",

        lat:
          detail.lat,

        lng:
          detail.lng,

        createdAt:
          new Date()
            .toISOString()
      });
    }
  );

  saveJSON(
    CONFIG.storage.discoveries,
    safeStored
  );
}


// =========================================================
// BOTÓN GUARDAR TODO
// =========================================================

discoveryForm
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      if (
        videoDraftDetails.length ===
        0
      ) {

        showToast(
          "Añade al menos un detalle"
        );

        openManualDetailEditor();

        return;
      }

      const videoSource =
        getDraftVideoSource();

      if (
        !videoSource
      ) {

        showToast(
          "Añade primero un vídeo o Reel"
        );

        return;
      }

      /*
       * IMPORTANTE:
       * En esta versión todavía no hemos
       * conectado Supabase Storage.
       *
       * Un archivo seleccionado desde el ordenador
       * tiene una URL temporal que solo funciona
       * en este navegador.
       */

      if (
        videoSource.type ===
        "file"
      ) {

        showToast(
          "La subida de archivos se conectará en el siguiente paso. Usa por ahora un enlace de vídeo."
        );

        return;
      }

      const videoURL =
        videoSource.url;

      const button =
        saveAllDiscoveriesButton;

      const originalText =
        button
          ? button.innerHTML
          : "";

      if (button) {

        button.disabled =
          true;

        button.innerHTML =
          `
            <span>
              ⏳
            </span>

            Guardando…
          `;
      }

      try {

        // =================================================
        // COMPROBAR SUPABASE
        // =================================================

        if (
          !supabaseOnline ||
          !supabaseClient
        ) {

          throw new Error(
            "Supabase no está disponible"
          );
        }


        // =================================================
        // 1. CREAR EL VÍDEO UNA SOLA VEZ
        // =================================================

        const videoTitle =
          getDraftVideoTitle();

        const videoDescription =
          getDraftVideoDescription();

        const savedVideo =
          await createOrGetSupabaseVideo({

            title:
              videoTitle,

            description:
              videoDescription,

            url:
              videoURL
          });

        if (!savedVideo) {

          throw new Error(
            "No se pudo crear el vídeo"
          );
        }

        addVideoToLocalState(
          savedVideo
        );


        // =================================================
        // 2. RECORRER TODOS LOS DETALLES
        // =================================================

        let firstSavedPlace =
          null;

        const createdDiscoveries =
          [];

        for (
          const detail
          of videoDraftDetails
        ) {

          /*
           * Creamos/reutilizamos el lugar.
           *
           * Incluso un consejo puede quedar
           * geolocalizado en un lugar del mapa.
           */

          const savedPlace =
            await createOrGetPlace(
              detail
            );

          addPlaceToLocalState(
            savedPlace
          );

          if (
            !firstSavedPlace
          ) {

            firstSavedPlace =
              savedPlace;
          }


          // ===============================================
          // 3. CREAR DESCUBRIMIENTO CON TIMESTAMP
          // ===============================================

          const savedDiscovery =
            await createSupabaseDiscovery({

              detail,

              placeId:
                savedPlace.id,

              videoId:
                savedVideo.id
            });

          createdDiscoveries.push(
            savedDiscovery
          );

          addDiscoveryToLocalState(
            savedDiscovery
          );
        }


        // =================================================
        // 4. REFRESCAR MAPA
        // =================================================

        renderMarkers();


        // =================================================
        // 5. LIMPIAR FORMULARIO
        // =================================================

        const total =
          createdDiscoveries.length;

        discoveryForm.reset();

        videoDraftDetails =
          [];

        editingDetailIndex =
          null;

        closeAddDiscovery();


        // =================================================
        // 6. CENTRAR EN EL PRIMER DESCUBRIMIENTO
        // =================================================

        if (
          firstSavedPlace &&
          Number.isFinite(
            Number(
              firstSavedPlace.lat
            )
          ) &&
          Number.isFinite(
            Number(
              firstSavedPlace.lng
            )
          )
        ) {

          map.setView(
            [
              firstSavedPlace.lat,
              firstSavedPlace.lng
            ],
            15
          );

          window.setTimeout(
            () => {

              openPlace(
                firstSavedPlace.id
              );

            },
            300
          );
        }


        // =================================================
        // 7. MENSAJE FINAL
        // =================================================

        showToast(
          total === 1
            ? "✓ 1 detalle guardado para todos"
            : `✓ ${total} detalles guardados para todos`
        );


      } catch (error) {

        console.error(
          "Error guardando el vídeo:",
          error
        );

        /*
         * No perdemos el trabajo:
         * guardamos una copia local.
         */

        saveVideoDraftLocally({

          videoURL:
            videoURL,

          details:
            videoDraftDetails
        });

        showToast(
          "No hubo conexión. Se ha guardado una copia en este dispositivo."
        );

      } finally {

        if (button) {

          button.disabled =
            false;

          button.innerHTML =
            originalText;
        }
      }
    }
  );


// =========================================================
// ACTUALIZAR CATEGORÍA SEGÚN TIPO
// =========================================================

detailType
  ?.addEventListener(
    "change",
    () => {

      if (
        !discoveryCategory
      ) {

        return;
      }

      const type =
        detailType.value;

      const suggestions = {

        Lugar:
          "Lugar",

        Restaurante:
          "Restaurante",

        Playa:
          "Playa",

        Mirador:
          "Mirador",

        Consejo:
          "Consejo",

        Precio:
          "Consejo",

        Transporte:
          "Transporte",

        Aviso:
          "Consejo",

        Compras:
          "Compras",

        Evento:
          "Vida nocturna",

        Otro:
          "Lugar"
      };

      const suggested =
        suggestions[
          type
        ];

      if (
        suggested
      ) {

        discoveryCategory.value =
          suggested;
      }
    }
  );


// =========================================================
// NORMALIZAR TIMESTAMPS AL SALIR DEL CAMPO
// =========================================================

detailTimestampStart
  ?.addEventListener(
    "blur",
    () => {

      detailTimestampStart.value =
        normalizeTimestampText(
          detailTimestampStart.value
        );
    }
  );


detailTimestampEnd
  ?.addEventListener(
    "blur",
    () => {

      const value =
        String(
          detailTimestampEnd.value ||
          ""
        ).trim();

      if (!value) {
        return;
      }

      detailTimestampEnd.value =
        normalizeTimestampText(
          value
        );
    }
  );


// =========================================================
// COMPROBAR FINAL > INICIO
// =========================================================

detailTimestampEnd
  ?.addEventListener(
    "change",
    () => {

      const start =
        timestampToSeconds(
          detailTimestampStart?.value
        );

      const end =
        timestampToSeconds(
          detailTimestampEnd?.value
        );

      if (
        detailTimestampEnd.value &&
        end < start
      ) {

        showToast(
          "El minuto final debe ser posterior al inicial"
        );

        detailTimestampEnd.value =
          "";
      }
    }
  );// =========================================================
// BLOQUE 6 · FICHAS + VÍDEOS + TIMESTAMPS
// =========================================================


// =========================================================
// ABRIR FICHA DE LUGAR
// =========================================================

function openPlace(
  placeId
) {

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

  if (
    placeCoverIcon
  ) {

    placeCoverIcon.textContent =
      categoryIcons[
        place.category
      ] ||
      "📍";
  }

  if (
    placeCategory
  ) {

    placeCategory.textContent =
      place.category ||
      "Lugar";
  }

  if (
    placeName
  ) {

    placeName.textContent =
      place.name ||
      "Lugar";
  }

  if (
    placeZone
  ) {

    placeZone.textContent =
      [
        place.zone,
        place.city
      ]
        .filter(Boolean)
        .join(
          " · "
        );
  }

  if (
    placeDescription
  ) {

    placeDescription.textContent =
      place.description ||
      "Descubrimiento guardado en Mundo Infinito.";
  }

  if (
    placeLocationText
  ) {

    placeLocationText.textContent =
      [
        place.zone,
        place.city,
        place.country ||
          CONFIG.country
      ]
        .filter(Boolean)
        .join(
          ", "
        );
  }

  if (
    placeTip
  ) {

    placeTip.textContent =
      place.tip ||
      "Consulta los vídeos relacionados para descubrir más detalles.";
  }

  if (
    placeMapsButton
  ) {

    const mapsQuery =
      encodeURIComponent(
        [
          place.name,
          place.zone,
          place.city,
          place.country ||
            CONFIG.country
        ]
          .filter(Boolean)
          .join(
            ", "
          )
      );

    placeMapsButton.href =
      `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  }

  renderPlaceVideos(
    place
  );

  updateSavedButton();

  placePanel
    ?.classList
    .add(
      "open"
    );

  placePanel
    ?.setAttribute(
      "aria-hidden",
      "false"
    );
}


// =========================================================
// CERRAR FICHA
// =========================================================

function closePlace() {

  placePanel
    ?.classList
    .remove(
      "open"
    );

  placePanel
    ?.setAttribute(
      "aria-hidden",
      "true"
    );

  selectedPlace =
    null;
}

closePlacePanel
  ?.addEventListener(
    "click",
    closePlace
  );


// =========================================================
// FAVORITOS
// =========================================================

function updateSavedButton() {

  if (
    !selectedPlace ||
    !savePlaceButton
  ) {

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
          <span>
            ♥
          </span>

          <b>
            Guardado
          </b>
        `
      : `
          <span>
            ♡
          </span>

          <b>
            Guardar
          </b>
        `;
}

savePlaceButton
  ?.addEventListener(
    "click",
    () => {

      if (
        !selectedPlace
      ) {

        return;
      }

      toggleSavedPlace(
        selectedPlace.id
      );

      updateSavedButton();
    }
  );


// =========================================================
// RENDERIZAR VÍDEOS DE UN LUGAR
// =========================================================

function renderPlaceVideos(
  place
) {

  if (
    !placeVideosList
  ) {

    return;
  }

  const relatedVideos =
    getVideosForPlace(
      place
    );

  if (
    placeVideoCount
  ) {

    placeVideoCount.textContent =
      String(
        relatedVideos.length
      );
  }

  if (
    placeVideoActionText
  ) {

    placeVideoActionText.textContent =
      relatedVideos.length ===
      1
        ? "1 vídeo"
        : `${relatedVideos.length} vídeos`;
  }

  if (
    relatedVideos.length ===
    0
  ) {

    placeVideosList.innerHTML =
      `
        <div
          class="empty-state"
        >

          <span>
            🎥
          </span>

          <strong>
            Todavía no hay vídeos
          </strong>

          <p>
            Cuando un vídeo mencione este lugar aparecerá aquí.
          </p>

        </div>
      `;

    return;
  }

  placeVideosList.innerHTML =
    relatedVideos
      .map(
        video => {

          const timestamp =
            getVideoTimestampForPlace(
              video.id,
              place.id
            );

          const formattedTime =
            secondsToTimestamp(
              timestamp
            );

          const moments =
            getVideoMoments(
              video.id
            );

          const numberOfMoments =
            moments.length;

          return `
            <button
              class="video-card"
              type="button"
              data-place-video="${escapeHTML(video.id)}"
              data-place-time="${timestamp}"
            >

              <div
                class="video-thumb"
              ></div>

              <div
                class="video-info"
              >

                <strong>
                  ${escapeHTML(
                    video.title
                  )}
                </strong>

                <p>
                  ${
                    escapeHTML(
                      video.description ||
                      place.name
                    )
                  }
                </p>

                <div>
                  ${
                    timestamp > 0
                      ? `
                          <span
                            class="video-source"
                          >
                            ▶ ${formattedTime}
                          </span>
                        `
                      : `
                          <span
                            class="video-source"
                          >
                            ${escapeHTML(
                              video.type ||
                              "Vídeo"
                            )}
                          </span>
                        `
                  }

                  ${
                    numberOfMoments > 1
                      ? `
                          <span
                            class="video-source"
                          >
                            ${numberOfMoments} detalles
                          </span>
                        `
                      : ""
                  }
                </div>

              </div>

            </button>
          `;
        }
      )
      .join("");

  placeVideosList
    .querySelectorAll(
      "[data-place-video]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const videoId =
              button.dataset
                .placeVideo;

            const timestamp =
              Number(
                button.dataset
                  .placeTime ||
                0
              );

            const video =
              videos.find(
                item =>
                  String(
                    item.id
                  ) ===
                  String(
                    videoId
                  )
              );

            if (!video) {

              return;
            }

            openVideo(
              video,
              timestamp
            );
          }
        );
      }
    );
}


// =========================================================
// BOTÓN "VÍDEOS" DE LA FICHA
// =========================================================

placeVideosButton
  ?.addEventListener(
    "click",
    () => {

      if (
        !selectedPlace
      ) {

        return;
      }

      const relatedVideos =
        getVideosForPlace(
          selectedPlace
        );

      if (
        relatedVideos.length ===
        0
      ) {

        showToast(
          "Todavía no hay vídeos para este lugar"
        );

        return;
      }

      placeVideosList
        ?.scrollIntoView({
          behavior:
            "smooth",

          block:
            "start"
        });
    }
  );


// =========================================================
// ABRIR VÍDEO DESDE UN TIMESTAMP
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

  const url =
    String(
      video.url
    );

  const externalURL =
    /^https?:\/\//i.test(
      url
    );

  const directVideo =
    /\.(mp4|webm|ogg)(\?.*)?$/i.test(
      url
    );

  /*
   * Un Reel de Instagram, TikTok o YouTube
   * no se puede controlar con currentTime
   * desde nuestro <video>.
   *
   * Por ahora se abre en una nueva pestaña.
   */

  if (
    externalURL &&
    !directVideo
  ) {

    window.open(
      url,
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
      url,
      "_blank"
    );

    return;
  }

  videoModalTitle.textContent =
    video.title ||
    "Vídeo";

  videoModalPlace.textContent =
    video.place ||
    CONFIG.country;

  videoPlayer.src =
    url;

  videoModal
    .classList
    .add(
      "open"
    );

  videoModal
    .setAttribute(
      "aria-hidden",
      "false"
    );

  videoPlayer.onloadedmetadata =
    () => {

      const safeStart =
        Math.max(
          0,
          Number(
            startAt
          ) || 0
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
              videoPlayer.duration -
                0.25
            )
          );
      }

      videoPlayer
        .play()
        .catch(
          () => {
            /*
             * Algunos navegadores bloquean
             * el autoplay.
             */
          }
        );
    };
}


// =========================================================
// CERRAR VÍDEO
// =========================================================

function closeVideo() {

  if (
    !videoPlayer
  ) {

    return;
  }

  videoPlayer.pause();

  videoPlayer.onloadedmetadata =
    null;

  videoPlayer.removeAttribute(
    "src"
  );

  videoPlayer.load();

  videoModal
    ?.classList
    .remove(
      "open"
    );

  videoModal
    ?.setAttribute(
      "aria-hidden",
      "true"
    );
}

closeVideoModal
  ?.addEventListener(
    "click",
    closeVideo
  );

videoModal
  ?.addEventListener(
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


// =========================================================
// MOMENTOS DE UN VÍDEO
// Generamos etiquetas tipo:
// 00:14 Selarón
// 00:38 Pão de Açúcar
// =========================================================

function renderVideoMomentsHTML(
  video
) {

  const moments =
    getVideoMoments(
      video.id
    );

  if (
    moments.length ===
    0
  ) {

    return "";
  }

  return `
    <div
      class="video-moments"
    >

      ${
        moments
          .map(
            moment => {

              const place =
                places.find(
                  item =>
                    String(
                      item.id
                    ) ===
                    String(
                      moment.placeId
                    )
                );

              const label =
                place?.name ||
                moment.title ||
                "Detalle";

              return `
                <button
                  type="button"
                  class="video-moment-chip"
                  data-moment-time="${Number(
                    moment.timestampStart ||
                    0
                  )}"
                >
                  <span>
                    ▶
                  </span>

                  <b>
                    ${secondsToTimestamp(
                      moment.timestampStart
                    )}
                  </b>

                  <small>
                    ${escapeHTML(
                      label
                    )}
                  </small>
                </button>
              `;
            }
          )
          .join("")
      }

    </div>
  `;
}


// =========================================================
// BUSCADOR
// =========================================================

function searchPlaces(
  query
) {

  const words =
    String(
      query ||
      ""
    )
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLowerCase()
      .trim()
      .split(
        /\s+/
      )
      .filter(Boolean);

  if (
    words.length ===
    0
  ) {

    return [];
  }

  return places.filter(
    place => {

      const searchable =
        [
          place.name,
          place.zone,
          place.city,
          place.category,
          place.description
        ]
          .join(
            " "
          )
          .normalize("NFD")
          .replace(
            /[\u0300-\u036f]/g,
            ""
          )
          .toLowerCase();

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
// RENDER RESULTADOS DEL BUSCADOR
// =========================================================

function renderSearchResults(
  results
) {

  const query =
    searchInput
      ?.value
      .trim() ||
    "";

  if (!query) {

    searchResults.innerHTML =
      "";

    searchResults
      .classList
      .add(
        "hidden"
      );

    clearSearch
      ?.classList
      .add(
        "hidden"
      );

    return;
  }

  clearSearch
    ?.classList
    .remove(
      "hidden"
    );

  if (
    results.length ===
    0
  ) {

    searchResults.innerHTML =
      `
        <div
          class="no-results"
        >

          <span>
            🔍
          </span>

          <strong>
            Sin resultados
          </strong>

          <p>
            Prueba con otra palabra.
          </p>

        </div>
      `;

    searchResults
      .classList
      .remove(
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
            data-search-place="${escapeHTML(place.id)}"
          >

            <div
              class="search-result-icon"
            >
              ${
                categoryIcons[
                  place.category
                ] ||
                "📍"
              }
            </div>

            <div>

              <strong>
                ${escapeHTML(
                  place.name
                )}
              </strong>

              <small>
                ${escapeHTML(
                  [
                    place.zone,
                    place.category
                  ]
                    .filter(Boolean)
                    .join(
                      " · "
                    )
                )}
              </small>

            </div>

          </button>
        `
      )
      .join("");

  searchResults
    .querySelectorAll(
      "[data-search-place]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const place =
              getPlaceById(
                button.dataset
                  .searchPlace
              );

            if (!place) {

              return;
            }

            searchInput.value =
              place.name;

            searchResults
              .classList
              .add(
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
              220
            );
          }
        );
      }
    );

  searchResults
    .classList
    .remove(
      "hidden"
    );
}

function updateSearch() {

  renderSearchResults(
    searchPlaces(
      searchInput
        ?.value ||
      ""
    )
  );
}

searchInput
  ?.addEventListener(
    "input",
    updateSearch
  );

clearSearch
  ?.addEventListener(
    "click",
    () => {

      searchInput.value =
        "";

      searchResults.innerHTML =
        "";

      searchResults
        .classList
        .add(
          "hidden"
        );

      clearSearch
        .classList
        .add(
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

      searchResults
        ?.classList
        .add(
          "hidden"
        );
    }
  }
);// =========================================================
// BLOQUE 7 · PANELES + MENÚ INFERIOR
// =========================================================


// =========================================================
// PANEL GENERAL
// =========================================================

function openContent(
  title,
  html
) {

  closePlace();

  if (
    contentPanelTitle
  ) {

    contentPanelTitle.textContent =
      title;
  }

  if (
    contentPanelBody
  ) {

    contentPanelBody.innerHTML =
      html;
  }

  contentPanel
    ?.classList
    .add(
      "open"
    );

  contentPanel
    ?.setAttribute(
      "aria-hidden",
      "false"
    );
}


function closeContent() {

  contentPanel
    ?.classList
    .remove(
      "open"
    );

  contentPanel
    ?.setAttribute(
      "aria-hidden",
      "true"
    );
}


closeContentPanel
  ?.addEventListener(
    "click",
    closeContent
  );


// =========================================================
// PANEL · TODOS LOS VÍDEOS
// =========================================================

function renderAllVideosPanel() {

  if (
    videos.length ===
    0
  ) {

    openContent(
      "Vídeos",
      `
        <div class="empty-state">

          <span>
            🎥
          </span>

          <strong>
            No hay vídeos todavía
          </strong>

          <p>
            Los vídeos que guardéis aparecerán aquí.
          </p>

        </div>
      `
    );

    return;
  }

  /*
   * Ordenamos los vídeos:
   * los más recientes primero.
   */

  const orderedVideos =
    [...videos]
      .reverse();

  const html =
    orderedVideos
      .map(
        video => {

          const moments =
            getVideoMoments(
              video.id
            );

          const firstMoment =
            moments[0];

          const firstPlace =
            firstMoment
              ? places.find(
                  place =>
                    String(
                      place.id
                    ) ===
                    String(
                      firstMoment.placeId
                    )
                )
              : null;

          return `
            <article
              class="content-card"
              data-video-card="${escapeHTML(video.id)}"
            >

              <div
                class="content-card-icon"
              >
                🎥
              </div>

              <div
                class="content-card-text"
              >

                <strong>
                  ${escapeHTML(
                    video.title
                  )}
                </strong>

                <p>
                  ${
                    escapeHTML(
                      firstPlace?.name ||
                      video.type ||
                      CONFIG.country
                    )
                  }
                </p>

                ${
                  moments.length > 0
                    ? `
                        <p>
                          ✨ ${moments.length}
                          ${
                            moments.length === 1
                              ? "detalle"
                              : "detalles"
                          }
                        </p>
                      `
                    : ""
                }

              </div>

            </article>
          `;
        }
      )
      .join("");

  openContent(
    "Vídeos",
    html
  );


  // =======================================================
  // CLIC EN CADA VÍDEO
  // =======================================================

  contentPanelBody
    ?.querySelectorAll(
      "[data-video-card]"
    )
    .forEach(
      card => {

        card.addEventListener(
          "click",
          () => {

            const video =
              videos.find(
                item =>
                  String(
                    item.id
                  ) ===
                  String(
                    card.dataset
                      .videoCard
                  )
              );

            if (!video) {

              return;
            }

            openVideoDetailsPanel(
              video
            );
          }
        );
      }
    );
}


// =========================================================
// FICHA COMPLETA DE UN VÍDEO
// Aquí se ven TODOS sus momentos.
// =========================================================

function openVideoDetailsPanel(
  video
) {

  const moments =
    getVideoMoments(
      video.id
    );

  const momentsHTML =
    moments.length ===
    0
      ? `
          <div class="empty-state">

            <span>
              ✨
            </span>

            <strong>
              Sin detalles todavía
            </strong>

            <p>
              Este vídeo todavía no tiene momentos asociados.
            </p>

          </div>
        `
      : moments
          .map(
            moment => {

              const place =
                places.find(
                  item =>
                    String(
                      item.id
                    ) ===
                    String(
                      moment.placeId
                    )
                );

              const time =
                secondsToTimestamp(
                  moment.timestampStart
                );

              return `
                <button
                  class="content-card"
                  type="button"
                  data-video-moment-time="${Number(
                    moment.timestampStart ||
                    0
                  )}"
                  data-video-moment-place="${escapeHTML(
                    moment.placeId ||
                    ""
                  )}"
                >

                  <div
                    class="content-card-icon"
                  >
                    ${
                      categoryIcons[
                        moment.category
                      ] ||
                      "📍"
                    }
                  </div>

                  <div
                    class="content-card-text"
                  >

                    <strong>
                      ${escapeHTML(
                        moment.title
                      )}
                    </strong>

                    <p>
                      ${escapeHTML(
                        place?.name ||
                        moment.category ||
                        "Detalle"
                      )}
                    </p>

                    <p>
                      ▶ ${time}
                    </p>

                  </div>

                </button>
              `;
            }
          )
          .join("");

  openContent(
    video.title ||
    "Vídeo",
    `
      <div
        style="
          display:grid;
          gap:14px;
        "
      >

        <div
          class="info-card"
        >

          <span>
            🎥
          </span>

          <div>

            <b>
              ${escapeHTML(
                video.type ||
                "Vídeo"
              )}
            </b>

            <p>
              ${
                escapeHTML(
                  video.description ||
                  "Vídeo guardado en Mundo Infinito."
                )
              }
            </p>

          </div>

        </div>


        ${
          video.url
            ? `
                <button
                  id="playFullVideoFromPanel"
                  class="primary-btn"
                  type="button"
                >
                  ▶ Ver vídeo
                </button>
              `
            : ""
        }


        <section>

          <div
            class="section-head"
          >

            <div>

              <span
                class="eyebrow"
              >
                Exploración
              </span>

              <h3>
                Momentos del vídeo
              </h3>

            </div>

            <span
              class="count-badge"
            >
              ${moments.length}
            </span>

          </div>


          <div>
            ${momentsHTML}
          </div>

        </section>

      </div>
    `
  );


  // =======================================================
  // VER VÍDEO COMPLETO
  // =======================================================

  document
    .getElementById(
      "playFullVideoFromPanel"
    )
    ?.addEventListener(
      "click",
      () => {

        openVideo(
          video,
          0
        );
      }
    );


  // =======================================================
  // CLIC EN UN MOMENTO
  // =======================================================

  contentPanelBody
    ?.querySelectorAll(
      "[data-video-moment-time]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const time =
              Number(
                button.dataset
                  .videoMomentTime ||
                0
              );

            /*
             * Si el vídeo es reproducible
             * dentro de Mundo Infinito,
             * saltamos al momento.
             */

            openVideo(
              video,
              time
            );
          }
        );
      }
    );
}


// =========================================================
// PANEL · GASTRONOMÍA
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
    foodPlaces.length ===
    0
  ) {

    openContent(
      "Gastronomía",
      `
        <div class="empty-state">

          <span>
            🍴
          </span>

          <strong>
            Todavía no hay gastronomía
          </strong>

          <p>
            Restaurantes y recomendaciones aparecerán aquí.
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

            <div
              class="content-card-icon"
            >
              ${
                categoryIcons[
                  place.category
                ] ||
                "🍴"
              }
            </div>

            <div
              class="content-card-text"
            >

              <strong>
                ${escapeHTML(
                  place.name
                )}
              </strong>

              <p>
                ${
                  escapeHTML(
                    [
                      place.zone,
                      place.city
                    ]
                      .filter(Boolean)
                      .join(
                        " · "
                      )
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
    ?.querySelectorAll(
      "[data-food-place]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const place =
              getPlaceById(
                button.dataset
                  .foodPlace
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
              220
            );
          }
        );
      }
    );
}


// =========================================================
// PANEL · MI VIAJE
// =========================================================

function renderTripPanel() {

  const savedIds =
    getSavedPlaces();

  const savedPlaces =
    places.filter(
      place =>
        savedIds.includes(
          String(
            place.id
          )
        )
    );


  if (
    savedPlaces.length ===
    0
  ) {

    openContent(
      "Mi viaje",
      `
        <div class="empty-state">

          <span>
            📅
          </span>

          <strong>
            Tu viaje está vacío
          </strong>

          <p>
            Guarda lugares y más adelante podremos organizarlos por días.
          </p>

        </div>
      `
    );

    return;
  }


  const html =
    `
      <div
        class="info-card"
      >

        <span>
          ✨
        </span>

        <div>

          <b>
            ${savedPlaces.length}
            ${
              savedPlaces.length === 1
                ? "lugar guardado"
                : "lugares guardados"
            }
          </b>

          <p>
            Próximamente podrás ordenarlos por días y crear tu ruta.
          </p>

        </div>

      </div>

      ${
        savedPlaces
          .map(
            place => `
              <button
                class="content-card"
                type="button"
                data-trip-place="${escapeHTML(place.id)}"
              >

                <div
                  class="content-card-icon"
                >
                  ${
                    categoryIcons[
                      place.category
                    ] ||
                    "📍"
                  }
                </div>

                <div
                  class="content-card-text"
                >

                  <strong>
                    ${escapeHTML(
                      place.name
                    )}
                  </strong>

                  <p>
                    ${escapeHTML(
                      place.zone ||
                      place.category
                    )}
                  </p>

                </div>

              </button>
            `
          )
          .join("")
      }
    `;


  openContent(
    "Mi viaje",
    html
  );


  contentPanelBody
    ?.querySelectorAll(
      "[data-trip-place]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const place =
              getPlaceById(
                button.dataset
                  .tripPlace
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
              220
            );
          }
        );
      }
    );
}


// =========================================================
// PANEL · GUARDADOS
// =========================================================

function renderSavedPanel() {

  const savedIds =
    getSavedPlaces();

  const savedPlaces =
    places.filter(
      place =>
        savedIds.includes(
          String(
            place.id
          )
        )
    );


  if (
    savedPlaces.length ===
    0
  ) {

    openContent(
      "Guardados",
      `
        <div class="empty-state">

          <span>
            ❤️
          </span>

          <strong>
            No tienes guardados
          </strong>

          <p>
            Pulsa Guardar dentro de cualquier ficha del mapa.
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

            <div
              class="content-card-icon"
            >
              ${
                categoryIcons[
                  place.category
                ] ||
                "📍"
              }
            </div>

            <div
              class="content-card-text"
            >

              <strong>
                ${escapeHTML(
                  place.name
                )}
              </strong>

              <p>
                ${
                  escapeHTML(
                    [
                      place.zone,
                      place.category
                    ]
                      .filter(Boolean)
                      .join(
                        " · "
                      )
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
    ?.querySelectorAll(
      "[data-saved-place]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const place =
              getPlaceById(
                button.dataset
                  .savedPlace
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
              220
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
  selectedButton
) {

  navButtons
    .forEach(
      button => {

        button.classList
          .remove(
            "active"
          );
      }
    );

  selectedButton
    ?.classList
    .add(
      "active"
    );
}


navButtons
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          setActiveNav(
            button
          );

          const section =
            button.dataset
              .section;


          // ===============================================
          // EXPLORAR
          // ===============================================

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


          // ===============================================
          // VÍDEOS
          // ===============================================

          if (
            section ===
            "descubrimientos"
          ) {

            renderAllVideosPanel();

            return;
          }


          // ===============================================
          // COMIDA
          // ===============================================

          if (
            section ===
            "gastronomia"
          ) {

            renderFoodPanel();

            return;
          }


          // ===============================================
          // MI VIAJE
          // ===============================================

          if (
            section ===
            "viaje"
          ) {

            renderTripPanel();

            return;
          }


          // ===============================================
          // GUARDADOS
          // ===============================================

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
// TECLA ESCAPE
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
// CLIC EN EL MAPA
// =========================================================

map.on(
  "click",
  () => {

    closePlace();
    closeContent();
  // =========================================================
// BLOQUE 8 FINAL
// CARGA + SUPABASE + TIEMPO REAL + ARRANQUE
// =========================================================


// =========================================================
// DATOS LOCALES ANTIGUOS
// Compatibilidad con versiones anteriores.
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

  const result =
    [];

  const seen =
    new Set();

  oldDiscoveries
    .filter(
      item =>
        item.link
    )
    .forEach(
      item => {

        const url =
          String(
            item.link
          );

        if (
          seen.has(
            url
          )
        ) {

          return;
        }

        seen.add(
          url
        );

        result.push(
          normalizeVideo({

            id:
              item.videoId ||
              `local-video-${slug(url)}-${Date.now()}`,

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
              url.includes(
                "instagram"
              )
                ? "Instagram"
                : url.includes(
                    "tiktok"
                  )
                  ? "TikTok"
                  : url.includes(
                      "youtube"
                    ) ||
                    url.includes(
                      "youtu.be"
                    )
                    ? "YouTube"
                    : "Vídeo",

            url,

            sourceUrl:
              url,

            source:
              "local"
          })
        );
      }
    );

  return result;
}


// =========================================================
// DESCUBRIMIENTOS LOCALES ANTIGUOS
// =========================================================

function loadOldLocalDiscoveries() {

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
    .map(
      item => {

        return normalizeDiscovery({

          id:
            item.id,

          title:
            item.title ||
            item.name ||
            "Descubrimiento",

          description:
            item.comment ||
            item.description ||
            "",

          category:
            item.category ||
            "Lugar",

          placeId:
            item.id,

          videoId:
            item.videoId ||
            null,

          timestampStart:
            item.timestampStart ||
            0,

          timestampEnd:
            item.timestampEnd ??
            null,

          source:
            "local"
        });
      }
    );
}


// =========================================================
// COMBINAR VÍDEOS
// Evitamos duplicarlos por URL.
// =========================================================

function mergeVideos(
  ...groups
) {

  const result =
    new Map();

  groups
    .flat()
    .filter(Boolean)
    .map(
      normalizeVideo
    )
    .forEach(
      video => {

        const key =
          video.sourceUrl ||
          video.url ||
          video.id;

        if (
          !result.has(
            key
          )
        ) {

          result.set(
            key,
            video
          );

          return;
        }

        const previous =
          result.get(
            key
          );

        if (
          video.source ===
          "supabase"
        ) {

          result.set(
            key,
            {
              ...previous,
              ...video
            }
          );
        }
      }
    );

  return Array.from(
    result.values()
  );
}


// =========================================================
// COMBINAR DESCUBRIMIENTOS
// =========================================================

function mergeDiscoveries(
  ...groups
) {

  const result =
    new Map();

  groups
    .flat()
    .filter(Boolean)
    .map(
      normalizeDiscovery
    )
    .forEach(
      discovery => {

        const key =
          String(
            discovery.id
          );

        result.set(
          key,
          discovery
        );
      }
    );

  return Array.from(
    result.values()
  );
}


// =========================================================
// CARGAR TODA LA APP
// =========================================================

async function loadAppData() {

  console.log(
    "📦 Cargando Mundo Infinito…"
  );

  // =======================================================
  // 1. JSON ESTÁTICOS
  // =======================================================

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


  // =======================================================
  // 2. DATOS LOCALES ANTIGUOS
  // =======================================================

  const oldLocalPlaces =
    loadOldLocalPlaces();

  const oldLocalVideos =
    loadOldLocalVideos();

  const oldLocalDiscoveries =
    loadOldLocalDiscoveries();


  // =======================================================
  // 3. COMPROBAR SUPABASE
  // =======================================================

  await testSupabaseConnection();

  let cloudPlaces =
    [];

  let cloudVideos =
    [];

  let cloudDiscoveries =
    [];


  // =======================================================
  // 4. DATOS COMPARTIDOS
  // =======================================================

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


  // =======================================================
  // 5. MEZCLAR LUGARES
  // =======================================================

  places =
    mergePlaces(
      Array.isArray(
        placesJSON
      )
        ? placesJSON
        : [],

      oldLocalPlaces,

      cloudPlaces
    );


  // =======================================================
  // 6. MEZCLAR VÍDEOS
  // =======================================================

  videos =
    mergeVideos(
      Array.isArray(
        videosJSON
      )
        ? videosJSON
        : [],

      oldLocalVideos,

      cloudVideos
    );


  // =======================================================
  // 7. DESCUBRIMIENTOS
  // =======================================================

  discoveries =
    mergeDiscoveries(
      oldLocalDiscoveries,
      cloudDiscoveries
    );


  // =======================================================
  // 8. MAPA
  // =======================================================

  renderMarkers();


  // =======================================================
  // 9. MENSAJES DE CONTROL
  // =======================================================

  console.log(
    `📍 ${places.length} lugares cargados`
  );

  console.log(
    `🎥 ${videos.length} vídeos cargados`
  );

  console.log(
    `✨ ${discoveries.length} detalles cargados`
  );
}


// =========================================================
// RECARGAR DATOS COMPARTIDOS
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


    // =====================================================
    // ACTUALIZAR LUGARES
    // =====================================================

    cloudPlaces.forEach(
      cloudPlace => {

        const index =
          places.findIndex(
            place =>
              String(
                place.id
              ) ===
              String(
                cloudPlace.id
              ) ||
              (
                place.slug &&
                cloudPlace.slug &&
                place.slug ===
                cloudPlace.slug
              )
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


    // =====================================================
    // ACTUALIZAR VÍDEOS
    // =====================================================

    cloudVideos.forEach(
      cloudVideo => {

        const index =
          videos.findIndex(
            video =>
              String(
                video.id
              ) ===
              String(
                cloudVideo.id
              ) ||
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


    // =====================================================
    // ACTUALIZAR DESCUBRIMIENTOS
    // =====================================================

    const localDiscoveries =
      discoveries.filter(
        item =>
          item.source ===
          "local"
      );

    discoveries =
      mergeDiscoveries(
        localDiscoveries,
        cloudDiscoveries
      );


    // =====================================================
    // REDIBUJAR
    // =====================================================

    renderMarkers();


    // =====================================================
    // ACTUALIZAR FICHA ABIERTA
    // =====================================================

    if (
      selectedPlace
    ) {

      const refreshed =
        places.find(
          place =>
            String(
              place.id
            ) ===
            String(
              selectedPlace.id
            ) ||
            (
              place.slug &&
              selectedPlace.slug &&
              place.slug ===
              selectedPlace.slug
            )
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
      "🔄 Datos compartidos actualizados"
    );

  } catch (error) {

    console.error(
      "Error actualizando Mundo Infinito:",
      error
    );
  }
}


// =========================================================
// TIEMPO REAL
// =========================================================

function startRealtimeUpdates() {

  if (
    !supabaseClient ||
    !supabaseOnline
  ) {

    return;
  }

  try {

    supabaseClient
      .channel(
        "mundo-infinito-v06"
      )

      // ===================================================
      // LUGARES
      // ===================================================

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


      // ===================================================
      // VÍDEOS
      // ===================================================

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


      // ===================================================
      // DETALLES
      // ===================================================

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

      .subscribe(
        status => {

          console.log(
            "📡 Tiempo real:",
            status
          );
        }
      );

  } catch (error) {

    console.warn(
      "No se pudo activar tiempo real:",
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
// ERRORES GENERALES
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
// PROMESAS RECHAZADAS
// =========================================================

window.addEventListener(
  "unhandledrejection",
  event => {

    console.error(
      "Mundo Infinito · Promise:",
      event.reason
    );
  }
);


// =========================================================
// INICIALIZAR
// =========================================================

async function init() {

  console.log(
    "🌍 Iniciando Mundo Infinito v0.6.0"
  );


  // =======================================================
  // 1. SUPABASE
  // =======================================================

  initializeSupabase();


  // =======================================================
  // 2. DATOS
  // =======================================================

  await loadAppData();


  // =======================================================
  // 3. AJUSTAR MAPA
  // =======================================================

  map.invalidateSize();


  // =======================================================
  // 4. TIEMPO REAL
  // =======================================================

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


  // =======================================================
  // 5. LISTO
  // =======================================================

  console.log(
    "✨ Mundo Infinito v0.6 listo"
  );
}


// =========================================================
// ARRANCAR
// =========================================================

init();


// =========================================================
// FIN · MUNDO INFINITO v0.6.0
// =========================================================
);
