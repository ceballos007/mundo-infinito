// =====================================================
// MUNDO INFINITO by Eric
// Beta 0.2
// =====================================================

"use strict";

// -----------------------------------------------------
// DATOS INICIALES
// -----------------------------------------------------

const lugaresIniciales = [
    {
        id: "cristo-redentor",
        nombre: "Cristo Redentor",
        zona: "Cosme Velho",
        categoria: "Lugar",
        descripcion: "Uno de los principales iconos de Río de Janeiro.",
        lat: -22.9519,
        lng: -43.2105,
        link: ""
    },
    {
        id: "pao-de-acucar",
        nombre: "Pão de Açúcar",
        zona: "Urca",
        categoria: "Mirador",
        descripcion: "Teleférico y vistas panorámicas de la bahía.",
        lat: -22.9493,
        lng: -43.1546,
        link: ""
    },
    {
        id: "copacabana",
        nombre: "Praia de Copacabana",
        zona: "Copacabana",
        categoria: "Playa",
        descripcion: "Playa urbana y paseo marítimo de Río.",
        lat: -22.9711,
        lng: -43.1822,
        link: ""
    },
    {
        id: "ipanema",
        nombre: "Praia de Ipanema",
        zona: "Ipanema",
        categoria: "Playa",
        descripcion: "Playa famosa por su ambiente y sus atardeceres.",
        lat: -22.9868,
        lng: -43.2047,
        link: ""
    },
    {
        id: "selaron",
        nombre: "Escadaria Selarón",
        zona: "Lapa / Santa Teresa",
        categoria: "Cultura",
        descripcion: "Escalera artística cubierta de azulejos.",
        lat: -22.9153,
        lng: -43.179,
        link: ""
    },
    {
        id: "parque-lage",
        nombre: "Parque Lage",
        zona: "Jardim Botânico",
        categoria: "Parque",
        descripcion: "Parque histórico situado a los pies del Corcovado.",
        lat: -22.9608,
        lng: -43.2116,
        link: ""
    },
    {
        id: "saara",
        nombre: "SAARA",
        zona: "Centro",
        categoria: "Compras",
        descripcion: "Zona comercial popular con tiendas y compras económicas.",
        lat: -22.9028,
        lng: -43.1815,
        link: ""
    },
    {
        id: "pedra-do-sal",
        nombre: "Pedra do Sal",
        zona: "Saúde",
        categoria: "Vida nocturna",
        descripcion: "Lugar histórico relacionado con la samba.",
        lat: -22.8976,
        lng: -43.1852,
        link: ""
    },
    {
        id: "arnaldo-quintela",
        nombre: "Rua Arnaldo Quintela",
        zona: "Botafogo",
        categoria: "Vida nocturna",
        descripcion: "Zona de bares con mucho ambiente nocturno.",
        lat: -22.9537,
        lng: -43.1866,
        link: ""
    },
    {
        id: "galeao",
        nombre: "Aeropuerto de Galeão",
        zona: "Ilha do Governador",
        categoria: "Transporte",
        descripcion: "Aeropuerto internacional de Río de Janeiro.",
        lat: -22.809,
        lng: -43.2506,
        link: ""
    }
];

// -----------------------------------------------------
// ALMACENAMIENTO LOCAL
// -----------------------------------------------------

const STORAGE_KEY = "mundoInfinitoDescubrimientos";

function cargarDescubrimientosGuardados() {
    try {
        const datos = localStorage.getItem(STORAGE_KEY);

        if (!datos) {
            return [];
        }

        const descubrimientos = JSON.parse(datos);

        return Array.isArray(descubrimientos)
            ? descubrimientos
            : [];
    } catch (error) {
        console.error("No se pudieron cargar los descubrimientos:", error);
        return [];
    }
}

function guardarDescubrimientos() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(descubrimientosGuardados)
    );
}

let descubrimientosGuardados =
    cargarDescubrimientosGuardados();

let lugares = [
    ...lugaresIniciales,
    ...descubrimientosGuardados
];

// -----------------------------------------------------
// MAPA
// -----------------------------------------------------

const map = L.map("map", {
    zoomControl: false
}).setView([-22.94, -43.22], 11);

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

const greenIcon = L.icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",

    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const markerMap = new Map();

function crearId(texto) {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function crearPopup(lugar) {
    const mapsQuery = encodeURIComponent(
        `${lugar.nombre}, ${lugar.zona}, Río de Janeiro, Brasil`
    );

    const enlaceVideo = lugar.link
        ? `
            <p>
                <a
                    href="${lugar.link}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    🎥 Abrir vídeo
                </a>
            </p>
        `
        : "";

    return `
        <div class="place-popup">
            <h3>${lugar.nombre}</h3>

            <span class="popup-category">
                ${lugar.categoria}
            </span>

            <p>
                <strong>📍 ${lugar.zona}</strong>
            </p>

            <p>
                ${lugar.descripcion || "Descubrimiento añadido por un Explorador."}
            </p>

            ${enlaceVideo}

            <a
                href="https://www.google.com/maps/search/?api=1&query=${mapsQuery}"
                target="_blank"
                rel="noopener noreferrer"
            >
                Abrir en Google Maps
            </a>
        </div>
    `;
}

function añadirMarcador(lugar) {
    const marker = L.marker(
        [lugar.lat, lugar.lng],
        {
            icon: greenIcon,
            title: lugar.nombre
        }
    )
        .addTo(map)
        .bindPopup(crearPopup(lugar));

    markerMap.set(lugar.id, marker);
}

lugares.forEach(añadirMarcador);

// -----------------------------------------------------
// MODAL
// -----------------------------------------------------

const modal = document.getElementById("discoveryModal");
const openModalButton =
    document.getElementById("openDiscoveryModal");
const closeModalButton =
    document.getElementById("closeDiscoveryModal");
const discoveryForm =
    document.getElementById("discoveryForm");
const successToast =
    document.getElementById("successToast");

function abrirModal() {
    modal.classList.add("visible");
    modal.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";

    setTimeout(() => {
        document
            .getElementById("discoveryTitle")
            .focus();
    }, 250);
}

function cerrarModal() {
    modal.classList.remove("visible");
    modal.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";
}

openModalButton.addEventListener("click", abrirModal);
closeModalButton.addEventListener("click", cerrarModal);

modal.addEventListener("click", event => {
    if (event.target === modal) {
        cerrarModal();
    }
});

document.addEventListener("keydown", event => {
    if (
        event.key === "Escape" &&
        modal.classList.contains("visible")
    ) {
        cerrarModal();
    }
});

// -----------------------------------------------------
// GUARDAR DESCUBRIMIENTO
// -----------------------------------------------------

function mostrarConfirmacion() {
    successToast.classList.add("visible");

    window.setTimeout(() => {
        successToast.classList.remove("visible");
    }, 2600);
}

discoveryForm.addEventListener("submit", event => {
    event.preventDefault();

    const formData = new FormData(discoveryForm);

    const nombre = formData.get("title").trim();
    const zona = formData.get("place").trim();
    const categoria = formData.get("category");
    const link = formData.get("link").trim();
    const comentario = formData.get("comment").trim();

    const latIntroducida = Number(formData.get("lat"));
    const lngIntroducida = Number(formData.get("lng"));

    const lat = Number.isFinite(latIntroducida) &&
                latIntroducida !== 0
        ? latIntroducida
        : map.getCenter().lat;

    const lng = Number.isFinite(lngIntroducida) &&
                lngIntroducida !== 0
        ? lngIntroducida
        : map.getCenter().lng;

    const nuevoDescubrimiento = {
        id: `${crearId(nombre)}-${Date.now()}`,
        nombre,
        zona,
        categoria,
        descripcion:
            comentario ||
            "Descubrimiento añadido por un Explorador.",
        link,
        lat,
        lng,
        creadoEn: new Date().toISOString()
    };

    descubrimientosGuardados.push(nuevoDescubrimiento);
    lugares.push(nuevoDescubrimiento);

    guardarDescubrimientos();
    añadirMarcador(nuevoDescubrimiento);

    map.setView([lat, lng], 15);

    const nuevoMarcador =
        markerMap.get(nuevoDescubrimiento.id);

    window.setTimeout(() => {
        nuevoMarcador.openPopup();
    }, 350);

    discoveryForm.reset();

    cerrarModal();
    mostrarConfirmacion();

    actualizarResultadosBusqueda();
});

// -----------------------------------------------------
// BUSCADOR
// -----------------------------------------------------

const searchInput =
    document.getElementById("searchInput");
const clearSearch =
    document.getElementById("clearSearch");
const searchResults =
    document.getElementById("searchResults");

function normalizar(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function encontrarResultados(consulta) {
    const palabras = normalizar(consulta)
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (palabras.length === 0) {
        return [];
    }

    return lugares.filter(lugar => {
        const contenido = normalizar(
            [
                lugar.nombre,
                lugar.zona,
                lugar.categoria,
                lugar.descripcion
            ].join(" ")
        );

        return palabras.every(
            palabra => contenido.includes(palabra)
        );
    });
}

function abrirLugar(lugar) {
    searchInput.value = lugar.nombre;
    clearSearch.style.display = "block";
    searchResults.style.display = "none";

    map.setView([lugar.lat, lugar.lng], 16);

    const marker = markerMap.get(lugar.id);

    if (marker) {
        window.setTimeout(() => {
            marker.openPopup();
        }, 300);
    }
}

function renderizarResultados(resultados) {
    searchResults.innerHTML = "";

    if (!searchInput.value.trim()) {
        searchResults.style.display = "none";
        return;
    }

    if (resultados.length === 0) {
        searchResults.innerHTML = `
            <div class="search-result">
                <div>
                    <strong>Sin resultados</strong>
                    <small>Prueba con otra palabra.</small>
                </div>
            </div>
        `;

        searchResults.style.display = "block";
        return;
    }

    resultados.slice(0, 8).forEach(lugar => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "search-result";

        button.innerHTML = `
            <div>
                <strong>${lugar.nombre}</strong>
                <small>${lugar.zona}</small>
            </div>

            <span class="result-category">
                ${lugar.categoria}
            </span>
        `;

        button.addEventListener(
            "click",
            () => abrirLugar(lugar)
        );

        searchResults.appendChild(button);
    });

    searchResults.style.display = "block";
}

function actualizarResultadosBusqueda() {
    const resultados =
        encontrarResultados(searchInput.value);

    renderizarResultados(resultados);
}

searchInput.addEventListener("input", () => {
    clearSearch.style.display =
        searchInput.value
            ? "block"
            : "none";

    actualizarResultadosBusqueda();
});

clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    clearSearch.style.display = "none";
    searchResults.style.display = "none";

    searchInput.focus();

    map.setView([-22.94, -43.22], 11);
});

document.addEventListener("click", event => {
    const clickedInsideSearch =
        event.target.closest(".search");

    const clickedInsideResults =
        event.target.closest("#searchResults");

    if (
        !clickedInsideSearch &&
        !clickedInsideResults
    ) {
        searchResults.style.display = "none";
    }
});

// -----------------------------------------------------
// MENÚ
// -----------------------------------------------------

const navButtons =
    document.querySelectorAll(".nav-button");

navButtons.forEach(button => {
    button.addEventListener("click", () => {
        navButtons.forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");
    });
});
