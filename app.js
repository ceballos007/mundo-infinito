// =========================================================
// MUNDO INFINITO · v0.4.1
// Mapa + datos + vídeos + reproductor + favoritos + buscador
// =========================================================

"use strict";

// =========================================================
// CONFIGURACIÓN
// =========================================================

const CONFIG = {
  city: "Río de Janeiro",
  country: "Brasil",
  center: [-22.94, -43.22],
  zoom: 11,

  storage: {
    discoveries: "mundoInfinitoDescubrimientos",
    savedPlaces: "mundoInfinitoLugaresGuardados"
  }
};

// =========================================================
// DATOS BASE
// =========================================================

const defaultPlaces = [
  {
    id: "cristo-redentor",
    name: "Cristo Redentor",
    zone: "Cosme Velho",
    city: "Río de Janeiro",
    category: "Lugar",
    description:
      "Uno de los iconos más reconocibles de Río de Janeiro.",
    lat: -22.9519,
    lng: -43.2105,
    rating: 5,
    image: ""
  },

  {
    id: "pao-de-acucar",
    name: "Pão de Açúcar",
    zone: "Urca",
    city: "Río de Janeiro",
    category: "Mirador",
    description:
      "Teleférico y vistas panorámicas sobre la bahía de Guanabara.",
    lat: -22.9493,
    lng: -43.1546,
    rating: 5,
    image: ""
  },

  {
    id: "copacabana",
    name: "Copacabana",
    zone: "Copacabana",
    city: "Río de Janeiro",
    category: "Playa",
    description:
      "Una de las playas urbanas más famosas del mundo.",
    lat: -22.9711,
    lng: -43.1822,
    rating: 5,
    image: ""
  },

  {
    id: "ipanema",
    name: "Ipanema",
    zone: "Ipanema",
    city: "Río de Janeiro",
    category: "Playa",
    description:
      "Playa conocida por su ambiente y sus atardeceres.",
    lat: -22.9868,
    lng: -43.2047,
    rating: 5,
    image: ""
  },

  {
    id: "selaron",
    name: "Escadaria Selarón",
    zone: "Lapa / Santa Teresa",
    city: "Río de Janeiro",
    category: "Cultura",
    description:
      "Escalera artística cubierta por azulejos de todo el mundo.",
    lat: -22.9153,
    lng: -43.179,
    rating: 5,
    image: ""
  },

  {
    id: "parque-lage",
    name: "Parque Lage",
    zone: "Jardim Botânico",
    city: "Río de Janeiro",
    category: "Parque",
    description:
      "Parque histórico situado a los pies del Corcovado.",
    lat: -22.9608,
    lng: -43.2116,
    rating: 5,
    image: ""
  },

  {
    id: "saara",
    name: "SAARA",
    zone: "Centro",
    city: "Río de Janeiro",
    category: "Compras",
    description:
      "Zona comercial popular con multitud de tiendas.",
    lat: -22.9028,
    lng: -43.1815,
    rating: 4,
    image: ""
  },

  {
    id: "pedra-do-sal",
    name: "Pedra do Sal",
    zone: "Saúde",
    city: "Río de Janeiro",
    category: "Vida nocturna",
    description:
      "Lugar histórico estrechamente ligado a la samba carioca.",
    lat: -22.8976,
    lng: -43.1852,
    rating: 5,
    image: ""
  },

  {
    id: "arnaldo-quintela",
    name: "Rua Arnaldo Quintela",
    zone: "Botafogo",
    city: "Río de Janeiro",
    category: "Vida nocturna",
    description:
      "Calle de Botafogo conocida por su concentración de bares.",
    lat: -22.9537,
    lng: -43.1866,
    rating: 4,
    image: ""
  },

  {
    id: "galeao",
    name: "Aeropuerto de Galeão",
    zone: "Ilha do Governador",
    city: "Río de Janeiro",
    category: "Transporte",
    description:
      "Principal aeropuerto internacional de Río de Janeiro.",
    lat: -22.809,
    lng: -43.2506,
    rating: 4,
    image: ""
  }
];

// =========================================================
// VARIABLES
// =========================================================

let places = [];
let videos = [];

let userDiscoveries = loadJSON(
  CONFIG.storage.discoveries,
  []
);

let selectedPlace = null;

const markers = new Map();

// =========================================================
// ELEMENTOS HTML
// =========================================================

const searchInput =
  document.getElementById("searchInput");

const clearSearch =
  document.getElementById("clearSearch");

const searchResults =
  document.getElementById("searchResults");

const openDiscoveryModal =
  document.getElementById("openDiscoveryModal");

const discoveryModal =
  document.getElementById("discoveryModal");

const closeDiscoveryModal =
  document.getElementById("closeDiscoveryModal");

const discoveryForm =
  document.getElementById("discoveryForm");

const useMapCenter =
  document.getElementById("useMapCenter");

const discoveryLat =
  document.getElementById("discoveryLat");

const discoveryLng =
  document.getElementById("discoveryLng");

const placePanel =
  document.getElementById("placePanel");

const closePlacePanel =
  document.getElementById("closePlacePanel");

const placeCoverIcon =
  document.getElementById("placeCoverIcon");

const placeCategory =
  document.getElementById("placeCategory");

const placeName =
  document.getElementById("placeName");

const placeZone =
  document.getElementById("placeZone");

const placeDescription =
  document.getElementById("placeDescription");

const placeLocationText =
  document.getElementById("placeLocationText");

const placeTip =
  document.getElementById("placeTip");

const placeVideosButton =
  document.getElementById("placeVideosButton");

const placeVideoActionText =
  document.getElementById("placeVideoActionText");

const placeVideoCount =
  document.getElementById("placeVideoCount");

const placeVideosList =
  document.getElementById("placeVideosList");

const savePlaceButton =
  document.getElementById("savePlaceButton");

const placeMapsButton =
  document.getElementById("placeMapsButton");

const contentPanel =
  document.getElementById("contentPanel");

const contentPanelTitle =
  document.getElementById("contentPanelTitle");

const contentPanelBody =
  document.getElementById("contentPanelBody");

const closeContentPanel =
  document.getElementById("closeContentPanel");

const toast =
  document.getElementById("toast");

const navButtons =
  document.querySelectorAll(".nav-button");

// Reproductor

const videoModal =
  document.getElementById("videoModal");

const closeVideoModal =
  document.getElementById("closeVideoModal");

const videoPlayer =
  document.getElementById("videoPlayer");

const videoModalTitle =
  document.getElementById("videoModalTitle");

const videoModalPlace =
  document.getElementById("videoModalPlace");

// =========================================================
// UTILIDADES
// =========================================================

function loadJSON(key, fallback) {
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

function saveJSON(key, value) {
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
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slug(text) {
  return normalize(text)
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function showToast(message) {
  if (!toast) {
    return;
  }

  toast.textContent = message;

  toast.classList.add("show");

  window.clearTimeout(
    showToast.timeout
  );

  showToast.timeout =
    window.setTimeout(() => {
      toast.classList.remove("show");
    }, 2400);
}

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// =========================================================
// CATEGORÍAS
// =========================================================

const categoryIcons = {
  Lugar: "📍",
  Mirador: "🌄",
  Playa: "🏖️",
  Cultura: "🎨",
  Parque: "🌿",
  Compras: "🛍️",
  "Vida nocturna": "🍹",
  Transporte: "✈️",
  Restaurante: "🍴",
  Gastronomía: "🥘",
  Consejo: "💡"
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
};

// =========================================================
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
// ICONOS
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
// CARGAR JSON EXTERNOS
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
// NORMALIZAR LUGAR
// =========================================================

function normalizePlace(place) {
  return {
    id:
      place.id ||
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
      place.image || ""
  };
}

// =========================================================
// NORMALIZAR VÍDEO
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
      "Vídeo",

    url:
      video.url ||
      video.link ||
      video.enlace ||
      ""
  };
}

// =========================================================
// COMBINAR LUGARES
// =========================================================

function mergePlaces(externalPlaces) {
  const combined =
    new Map();

  defaultPlaces.forEach(place => {
    combined.set(
      place.id,
      normalizePlace(place)
    );
  });

  externalPlaces
    .map(normalizePlace)
    .forEach(place => {
      const existing =
        combined.get(place.id);

      combined.set(
        place.id,
        {
          ...existing,
          ...place
        }
      );
    });

  return Array.from(
    combined.values()
  ).filter(place =>
    Number.isFinite(place.lat) &&
    Number.isFinite(place.lng)
  );
}

// =========================================================
// DESCUBRIMIENTOS LOCALES
// =========================================================

function localDiscoveriesAsPlaces() {
  return userDiscoveries
    .filter(item =>
      Number.isFinite(
        Number(item.lat)
      ) &&
      Number.isFinite(
        Number(item.lng)
      )
    )
    .map(item => ({
      id:
        item.id ||
        `local-${slug(
          item.name ||
          item.title
        )}`,

      name:
        item.name ||
        item.title ||
        "Descubrimiento",

      zone:
        item.zone ||
        item.place ||
        "Río de Janeiro",

      city:
        CONFIG.city,

      category:
        item.category ||
        "Lugar",

      description:
        item.description ||
        item.comment ||
        "Descubrimiento añadido por un Explorador.",

      lat:
        Number(item.lat),

      lng:
        Number(item.lng),

      rating: 5,

      image: "",

      link:
        item.link || ""
    }));
}

// =========================================================
// MARCADORES
// =========================================================

function addMarker(place) {
  if (
    !Number.isFinite(place.lat) ||
    !Number.isFinite(place.lng)
  ) {
    return;
  }

  if (
    markers.has(place.id)
  ) {
    return;
  }

  const marker =
    L.marker(
      [place.lat, place.lng],
      {
        icon:
          createMarkerIcon(place),

        title:
          place.name
      }
    ).addTo(map);

  marker.on(
    "click",
    () => {
      openPlace(place.id);
    }
  );

  markers.set(
    place.id,
    marker
  );
}

function renderMarkers() {
  markers.forEach(marker => {
    marker.remove();
  });

  markers.clear();

  places.forEach(place => {
    addMarker(place);
  });
}

// =========================================================
// BUSCAR LUGAR POR ID
// =========================================================

function getPlaceById(placeId) {
  return places.find(
    place =>
      place.id === placeId
  );
}

// =========================================================
// VÍDEOS DE UN LUGAR
// =========================================================

function getVideosForPlace(place) {
  const placeName =
    normalize(place.name);

  return videos.filter(video => {

    if (
      video.placeId &&
      video.placeId === place.id
    ) {
      return true;
    }

    if (
      video.place &&
      normalize(video.place) ===
      placeName
    ) {
      return true;
    }

    return false;
  });
}

// =========================================================
// ABRIR FICHA
// =========================================================

function openPlace(placeId) {
  const place =
    getPlaceById(placeId);

  if (!place) {
    return;
  }

  selectedPlace = place;

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
      `${place.name}, ${place.zone}, ${place.city}, ${CONFIG.country}`
    );

  placeMapsButton.href =
    `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  renderPlaceVideos(place);

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

  selectedPlace = null;
}

// =========================================================
// RENDERIZAR VÍDEOS DEL LUGAR
// =========================================================

function renderPlaceVideos(place) {
  const relatedVideos =
    getVideosForPlace(place);

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
          Añade un Reel relacionado con este lugar usando el botón +.
        </p>

      </div>
    `;

    return;
  }

  placeVideosList.innerHTML =
    relatedVideos
      .map(video => `
        <button
          class="video-card"
          type="button"
          data-video-id="${escapeHTML(video.id)}"
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

            <span class="video-source">
              ${escapeHTML(video.type)}
            </span>

          </div>

        </button>
      `)
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

          openVideo(video);
        }
      );

    });
}

// =========================================================
// BOTÓN VÍDEOS
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

closePlacePanel.addEventListener(
  "click",
  closePlace
);

// =========================================================
// FAVORITOS
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

function isPlaceSaved(placeId) {
  return getSavedPlaces()
    .includes(placeId);
}

function updateSavedButton() {
  if (!selectedPlace) {
    return;
  }

  const saved =
    isPlaceSaved(
      selectedPlace.id
    );

  savePlaceButton.classList.toggle(
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

    if (index >= 0) {

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

function searchPlaces(query) {
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

  return places.filter(place => {

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
        searchable.includes(word)
    );
  });
}

function renderSearchResults(results) {
  const query =
    searchInput.value.trim();

  if (!query) {

    searchResults.innerHTML = "";

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
      .slice(0, 8)
      .map(place => `
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
      `)
      .join("");

  searchResults
    .querySelectorAll(
      "[data-place-id]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const placeId =
            button.dataset.placeId;

          const place =
            getPlaceById(placeId);

          if (!place) {
            return;
          }

          searchInput.value =
            place.name;

          searchResults.classList.add(
            "hidden"
          );

          map.setView(
            [place.lat, place.lng],
            16
          );

          window.setTimeout(
            () => {
              openPlace(place.id);
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

    searchInput.value = "";

    searchResults.innerHTML = "";

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
// MODAL AÑADIR DESCUBRIMIENTO
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
// GUARDAR DESCUBRIMIENTO
// =========================================================

discoveryForm.addEventListener(
  "submit",
  event => {

    event.preventDefault();

    const form =
      new FormData(
        discoveryForm
      );

    const title =
      String(
        form.get("title") || ""
      ).trim();

    const placeText =
      String(
        form.get("place") || ""
      ).trim();

    const category =
      String(
        form.get("category") || ""
      ).trim();

    const link =
      String(
        form.get("link") || ""
      ).trim();

    const comment =
      String(
        form.get("comment") || ""
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

      return;
    }

    const center =
      map.getCenter();

    const lat =
      Number.isFinite(latValue) &&
      latValue !== 0
        ? latValue
        : center.lat;

    const lng =
      Number.isFinite(lngValue) &&
      lngValue !== 0
        ? lngValue
        : center.lng;

    const newDiscovery = {

      id:
        `local-${slug(title)}-${Date.now()}`,

      name:
        title,

      title,

      place:
        placeText,

      zone:
        placeText,

      category,

      description:
        comment ||
        "Descubrimiento añadido por un Explorador.",

      comment,

      link,

      lat,
      lng,

      createdAt:
        new Date().toISOString()
    };

    userDiscoveries.push(
      newDiscovery
    );

    saveJSON(
      CONFIG.storage.discoveries,
      userDiscoveries
    );

    const newPlace =
      normalizePlace({

        id:
          newDiscovery.id,

        name:
          newDiscovery.name,

        zone:
          newDiscovery.zone,

        category:
          newDiscovery.category,

        description:
          newDiscovery.description,

        lat:
          newDiscovery.lat,

        lng:
          newDiscovery.lng,

        rating: 5
      });

    places.push(
      newPlace
    );

    addMarker(
      newPlace
    );

    if (link) {

      const localVideo =
        normalizeVideo({

          id:
            `local-video-${Date.now()}`,

          placeId:
            newPlace.id,

          place:
            newPlace.name,

          title,

          description:
            comment,

          type:
            link.includes(
              "instagram"
            )
              ? "Instagram"
              : "Vídeo",

          url:
            link
        });

      videos.push(
        localVideo
      );
    }

    discoveryForm.reset();

    closeAddDiscovery();

    map.setView(
      [lat, lng],
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
      "Descubrimiento añadido"
    );
  }
);

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
            Añade tus primeros vídeos desde el botón +.
          </p>

        </div>
      `
    );

    return;
  }

  const html =
    videos
      .map(video => `
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
                  "Brasil"
                )
              }
            </p>

          </div>

        </button>
      `)
      .join("");

  openContent(
    "Vídeos",
    html
  );

  contentPanelBody
    .querySelectorAll(
      "[data-global-video]"
    )
    .forEach(button => {

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
            openVideo(video);
          }

        }
      );

    });
}

// =========================================================
// GASTRONOMÍA
// =========================================================

function renderFoodPanel() {

  const foodPlaces =
    places.filter(place =>
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
            Los iremos añadiendo en las siguientes versiones.
          </p>

        </div>
      `
    );

    return;
  }

  const html =
    foodPlaces
      .map(place => `
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
                  place.city
                )
              }
            </p>

          </div>

        </button>
      `)
      .join("");

  openContent(
    "Gastronomía",
    html
  );

  contentPanelBody
    .querySelectorAll(
      "[data-food-place]"
    )
    .forEach(button => {

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
            [place.lat, place.lng],
            16
          );

          window.setTimeout(
            () => {
              openPlace(place.id);
            },
            250
          );
        }
      );

    });
}

// =========================================================
// MI VIAJE
// =========================================================

function renderTripPanel() {

  openContent(
    "Mi viaje",
    `
      <div class="empty-state">

        <span>📅</span>

        <strong>
          Tu itinerario llegará pronto
        </strong>

        <p>
          Aquí organizaremos los lugares por días para vuestro viaje a Brasil.
        </p>

      </div>
    `
  );
}

// =========================================================
// GUARDADOS
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
            Todavía no has guardado lugares
          </strong>

          <p>
            Pulsa Guardar en cualquier ficha para añadirlo aquí.
          </p>

        </div>
      `
    );

    return;
  }

  const html =
    savedPlaces
      .map(place => `
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
      `)
      .join("");

  openContent(
    "Guardados",
    html
  );

  contentPanelBody
    .querySelectorAll(
      "[data-saved-place]"
    )
    .forEach(button => {

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
            [place.lat, place.lng],
            16
          );

          window.setTimeout(
            () => {
              openPlace(place.id);
            },
            250
          );
        }
      );

    });
}

// =========================================================
// MENÚ
// =========================================================

function setActiveNav(
  activeButton
) {

  navButtons.forEach(button => {

    button.classList.remove(
      "active"
    );

  });

  activeButton.classList.add(
    "active"
  );
}

navButtons.forEach(button => {

  button.addEventListener(
    "click",
    () => {

      setActiveNav(button);

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

});

// =========================================================
// REPRODUCTOR DE VÍDEO
// =========================================================

function openVideo(video) {

  if (
    !video ||
    !video.url
  ) {

    showToast(
      "Este vídeo todavía no tiene archivo"
    );

    return;
  }

  if (
    video.url.startsWith(
      "http"
    ) &&
    !video.url
      .toLowerCase()
      .endsWith(".mp4")
  ) {

    window.open(
      video.url,
      "_blank",
      "noopener"
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

  videoPlayer
    .play()
    .catch(() => {
      // El usuario puede pulsar Play manualmente.
    });
}

function closeVideo() {

  if (!videoPlayer) {
    return;
  }

  videoPlayer.pause();

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
// CARGAR DATOS
// =========================================================

async function loadAppData() {

  const [
    placesData,
    videosData
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

  places =
    mergePlaces(
      placesData
    );

  const localPlaces =
    localDiscoveriesAsPlaces();

  localPlaces.forEach(place => {

    if (
      !places.some(
        item =>
          item.id ===
          place.id
      )
    ) {

      places.push(
        place
      );

    }

  });

  videos =
    videosData.map(
      normalizeVideo
    );

  userDiscoveries
    .filter(
      discovery =>
        discovery.link
    )
    .forEach(discovery => {

      const alreadyExists =
        videos.some(
          video =>
            video.url ===
            discovery.link
        );

      if (
        alreadyExists
      ) {
        return;
      }

      videos.push(
        normalizeVideo({

          id:
            `local-video-${discovery.id}`,

          placeId:
            discovery.id,

          place:
            discovery.name ||
            discovery.title,

          title:
            discovery.title ||
            discovery.name,

          description:
            discovery.comment ||
            discovery.description,

          type:
            discovery.link.includes(
              "instagram"
            )
              ? "Instagram"
              : "Vídeo",

          url:
            discovery.link
        })
      );

    });

  renderMarkers();
}

// =========================================================
// RESPONSIVE MAPA
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
// ERRORES
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
// INICIO
// =========================================================

async function init() {

  await loadAppData();

  map.invalidateSize();

  console.log(
    "🌍 Mundo Infinito v0.4.1"
  );

  console.log(
    `📍 ${places.length} lugares`
  );

  console.log(
    `🎥 ${videos.length} vídeos`
  );
}

init();
