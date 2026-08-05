// =====================================================
// MUNDO INFINITO by Eric
// Beta 0.3
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
        descripcion:
            "Uno de los principales iconos de Río de Janeiro.",
        lat: -22.9519,
        lng: -43.2105,
        link: ""
    },
    {
        id: "pao-de-acucar",
        nombre: "Pão de Açúcar",
        zona: "Urca",
        categoria: "Mirador",
        descripcion:
            "Teleférico y vistas panorámicas de la bahía.",
        lat: -22.9493,
        lng: -43.1546,
        link: ""
    },
    {
        id: "copacabana",
        nombre: "Praia de Copacabana",
        zona: "Copacabana",
        categoria: "Playa",
        descripcion:
            "Playa urbana y paseo marítimo de Río.",
        lat: -22.9711,
        lng: -43.1822,
        link: ""
    },
    {
        id: "ipanema",
        nombre: "Praia de Ipanema",
        zona: "Ipanema",
        categoria: "Playa",
        descripcion:
            "Playa famosa por su ambiente y sus atardeceres.",
        lat: -22.9868,
        lng: -43.2047,
        link: ""
    },
    {
        id: "selaron",
        nombre: "Escadaria Selarón",
        zona: "Lapa / Santa Teresa",
        categoria: "Cultura",
        descripcion:
            "Escalera artística cubierta de azulejos.",
        lat: -22.9153,
        lng: -43.179,
        link: ""
    },
    {
        id: "parque-lage",
        nombre: "Parque Lage",
        zona: "Jardim Botânico",
        categoria: "Parque",
        descripcion:
            "Parque histórico situado a los pies del Corcovado.",
        lat: -22.9608,
        lng: -43.2116,
        link: ""
    },
    {
        id: "saara",
        nombre: "SAARA",
        zona: "Centro",
        categoria: "Compras",
        descripcion:
            "Zona comercial popular con tiendas y compras económicas.",
        lat: -22.9028,
        lng: -43.1815,
        link: ""
    },
    {
        id: "pedra-do-sal",
        nombre: "Pedra do Sal",
        zona: "Saúde",
        categoria: "Vida nocturna",
        descripcion:
            "Lugar histórico relacionado con la samba.",
        lat: -22.8976,
        lng: -43.1852,
        link: ""
    },
    {
        id: "arnaldo-quintela",
        nombre: "Rua Arnaldo Quintela",
        zona: "Botafogo",
        categoria: "Vida nocturna",
        descripcion:
            "Zona de bares con mucho ambiente nocturno.",
        lat: -22.9537,
        lng: -43.1866,
        link: ""
    },
    {
        id: "galeao",
        nombre: "Aeropuerto de Galeão",
        zona: "Ilha do Governador",
        categoria: "Transporte",
        descripcion:
            "Aeropuerto internacional de Río de Janeiro.",
        lat: -22.809,
        lng: -43.2506,
        link: ""
    }
];

// -----------------------------------------------------
// ALMACENAMIENTO LOCAL
// -----------------------------------------------------

const STORAGE_KEY =
    "mundoInfinitoDescubrimientos";

const SAVED_PLACES_KEY =
    "mundoInfinitoLugaresGuardados";

function cargarDescubrimientosGuardados() {
    try {
        const datos =
            localStorage.getItem(STORAGE_KEY);

        if (!datos) {
            return [];
        }

        const descubrimientos =
            JSON.parse(datos);

        return Array.isArray(descubrimientos)
            ? descubrimientos
            : [];
    } catch (error) {
        console.error(
            "No se pudieron cargar los descubrimientos:",
            error
        );

        return [];
    }
}

function guardarDescubrimientos() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(descubrimientosGuardados)
    );
}

function cargarLugaresGuardados() {
    try {
        const datos =
            localStorage.getItem(SAVED_PLACES_KEY);

        if (!datos) {
            return [];
        }

        const guardados =
            JSON.parse(datos);

        return Array.isArray(guardados)
            ? guardados
            : [];
    } catch (error) {
        console.error(
            "No se pudieron cargar los guardados:",
            error
        );

        return [];
    }
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
}).setView(
    [-22.94, -43.22],
    11
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

// -----------------------------------------------------
// ELEMENTOS DE LA PÁGINA
// -----------------------------------------------------

const modal =
    document.getElementById("discoveryModal");

const openModalButton =
    document.getElementById(
        "openDiscoveryModal"
    );

const closeModalButton =
    document.getElementById(
        "closeDiscoveryModal"
    );

const discoveryForm =
    document.getElementById(
        "discoveryForm"
    );

const successToast =
    document.getElementById(
        "successToast"
    );

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

const placeMapsButton =
    document.getElementById(
        "placeMapsButton"
    );

const placeVideoLink =
    document.getElementById(
        "placeVideoLink"
    );

const placeVideosButton =
    document.getElementById(
        "placeVideosButton"
    );

const savePlaceButton =
    document.getElementById(
        "savePlaceButton"
    );

const navButtons =
    document.querySelectorAll(
        ".nav-button"
    ); // -----------------------------------------------------
// UTILIDADES
// -----------------------------------------------------

function crearId(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function normalizar(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

// -----------------------------------------------------
// CATEGORÍAS
// -----------------------------------------------------

const iconosCategorias = {
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

const consejosCategorias = {
    Lugar:
        "Comprueba los horarios y reserva entrada si es necesario.",

    Mirador:
        "El amanecer o el atardecer suelen ofrecer las mejores vistas.",

    Playa:
        "Lleva protección solar, agua y vigila tus pertenencias.",

    Cultura:
        "Intenta acudir temprano para disfrutar del lugar con tranquilidad.",

    Parque:
        "Lleva agua y calzado cómodo.",

    Compras:
        "Compara precios y lleva algo de efectivo.",

    "Vida nocturna":
        "Comprueba el transporte de vuelta antes de salir.",

    Transporte:
        "Confirma siempre el punto exacto de recogida.",

    Restaurante:
        "Consulta el horario y comprueba si es necesario reservar.",

    Gastronomía:
        "Pregunta por la especialidad de la casa.",

    Consejo:
        "Guarda este descubrimiento para consultarlo durante el viaje."
};

// -----------------------------------------------------
// MARCADORES
// -----------------------------------------------------

function añadirMarcador(lugar) {
    const marker = L.marker(
        [lugar.lat, lugar.lng],
        {
            icon: greenIcon,
            title: lugar.nombre
        }
    ).addTo(map);

    marker.on("click", () => {
        abrirFichaLugar(lugar);
    });

    markerMap.set(lugar.id, marker);
}

lugares.forEach(lugar => {
    añadirMarcador(lugar);
});

// -----------------------------------------------------
// FICHA PREMIUM DEL LUGAR
// -----------------------------------------------------

let lugarSeleccionado = null;

function actualizarBotonGuardado(guardado) {
    if (guardado) {
        savePlaceButton.classList.add("saved");

        savePlaceButton.innerHTML = `
            <span>♥</span>
            <strong>Guardado</strong>
        `;
    } else {
        savePlaceButton.classList.remove("saved");

        savePlaceButton.innerHTML = `
            <span>♡</span>
            <strong>Guardar</strong>
        `;
    }
}

function abrirFichaLugar(lugar) {
    lugarSeleccionado = lugar;

    placeCoverIcon.textContent =
        iconosCategorias[lugar.categoria] || "📍";

    placeCategory.textContent =
        lugar.categoria || "Lugar";

    placeName.textContent =
        lugar.nombre;

    placeZone.textContent =
        `${lugar.zona} · Río de Janeiro`;

    placeDescription.textContent =
        lugar.descripcion ||
        "Descubrimiento añadido por un Explorador.";

    placeLocationText.textContent =
        `${lugar.zona}, Río de Janeiro, Brasil`;

    placeTip.textContent =
        consejosCategorias[lugar.categoria] ||
        "Consulta la información antes de visitar este lugar.";

    const mapsQuery = encodeURIComponent(
        `${lugar.nombre}, ${lugar.zona}, Río de Janeiro, Brasil`
    );

    placeMapsButton.href =
        `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

    if (lugar.link) {
        placeVideoLink.href = lugar.link;
        placeVideoLink.classList.remove("hidden");
        placeVideosButton.disabled = false;
    } else {
        placeVideoLink.href = "#";
        placeVideoLink.classList.add("hidden");
        placeVideosButton.disabled = true;
    }

    const guardados = cargarLugaresGuardados();

    actualizarBotonGuardado(
        guardados.includes(lugar.id)
    );

    placePanel.classList.add("visible");
    placePanel.setAttribute(
        "aria-hidden",
        "false"
    );
}

function cerrarFichaLugar() {
    placePanel.classList.remove("visible");

    placePanel.setAttribute(
        "aria-hidden",
        "true"
    );

    lugarSeleccionado = null;
}

closePlacePanel.addEventListener(
    "click",
    cerrarFichaLugar
);

placeVideosButton.addEventListener(
    "click",
    () => {
        if (
            lugarSeleccionado &&
            lugarSeleccionado.link
        ) {
            window.open(
                lugarSeleccionado.link,
                "_blank",
                "noopener"
            );
        }
    }
);

savePlaceButton.addEventListener(
    "click",
    () => {
        if (!lugarSeleccionado) {
            return;
        }

        const guardados =
            cargarLugaresGuardados();

        const posicion =
            guardados.indexOf(
                lugarSeleccionado.id
            );

        if (posicion >= 0) {
            guardados.splice(posicion, 1);
            actualizarBotonGuardado(false);
        } else {
            guardados.push(
                lugarSeleccionado.id
            );

            actualizarBotonGuardado(true);
        }

        localStorage.setItem(
            SAVED_PLACES_KEY,
            JSON.stringify(guardados)
        );
    }
);

// -----------------------------------------------------
// MODAL AÑADIR DESCUBRIMIENTO
// -----------------------------------------------------

function abrirModal() {
    cerrarFichaLugar();

    modal.classList.add("visible");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";

    window.setTimeout(() => {
        const titleInput =
            document.getElementById(
                "discoveryTitle"
            );

        if (titleInput) {
            titleInput.focus();
        }
    }, 250);
}

function cerrarModal() {
    modal.classList.remove("visible");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow = "";
}

openModalButton.addEventListener(
    "click",
    abrirModal
);

closeModalButton.addEventListener(
    "click",
    cerrarModal
);

modal.addEventListener(
    "click",
    event => {
        if (event.target === modal) {
            cerrarModal();
        }
    }
);

document.addEventListener(
    "keydown",
    event => {
        if (event.key !== "Escape") {
            return;
        }

        if (
            modal.classList.contains(
                "visible"
            )
        ) {
            cerrarModal();
        }

        if (
            placePanel.classList.contains(
                "visible"
            )
        ) {
            cerrarFichaLugar();
        }
    }
);// -----------------------------------------------------
// MENSAJE DE CONFIRMACIÓN
// -----------------------------------------------------

function mostrarConfirmacion() {
    successToast.classList.add("visible");

    window.setTimeout(() => {
        successToast.classList.remove("visible");
    }, 2600);
}

// -----------------------------------------------------
// GUARDAR UN NUEVO DESCUBRIMIENTO
// -----------------------------------------------------

discoveryForm.addEventListener(
    "submit",
    event => {
        event.preventDefault();

        const formData =
            new FormData(discoveryForm);

        const nombre = String(
            formData.get("title") || ""
        ).trim();

        const zona = String(
            formData.get("place") || ""
        ).trim();

        const categoria = String(
            formData.get("category") || ""
        ).trim();

        const link = String(
            formData.get("link") || ""
        ).trim();

        const comentario = String(
            formData.get("comment") || ""
        ).trim();

        const latIntroducida = Number(
            formData.get("lat")
        );

        const lngIntroducida = Number(
            formData.get("lng")
        );

        if (
            !nombre ||
            !zona ||
            !categoria
        ) {
            alert(
                "Completa el nombre, la zona y la categoría."
            );

            return;
        }

        const centroMapa =
            map.getCenter();

        const lat =
            Number.isFinite(latIntroducida) &&
            latIntroducida !== 0
                ? latIntroducida
                : centroMapa.lat;

        const lng =
            Number.isFinite(lngIntroducida) &&
            lngIntroducida !== 0
                ? lngIntroducida
                : centroMapa.lng;

        const nuevoDescubrimiento = {
            id:
                `${crearId(nombre)}-${Date.now()}`,

            nombre,
            zona,
            categoria,

            descripcion:
                comentario ||
                "Descubrimiento añadido por un Explorador.",

            link,
            lat,
            lng,

            creadoEn:
                new Date().toISOString()
        };

        descubrimientosGuardados.push(
            nuevoDescubrimiento
        );

        lugares.push(
            nuevoDescubrimiento
        );

        guardarDescubrimientos();

        añadirMarcador(
            nuevoDescubrimiento
        );

        discoveryForm.reset();

        cerrarModal();

        mostrarConfirmacion();

        map.setView(
            [lat, lng],
            15
        );

        window.setTimeout(() => {
            abrirFichaLugar(
                nuevoDescubrimiento
            );
        }, 400);

        actualizarResultadosBusqueda();
    }
);

// -----------------------------------------------------
// BUSCADOR
// -----------------------------------------------------

function encontrarResultados(consulta) {
    const palabras =
        normalizar(consulta)
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (palabras.length === 0) {
        return [];
    }

    return lugares.filter(lugar => {
        const contenido =
            normalizar(
                [
                    lugar.nombre,
                    lugar.zona,
                    lugar.categoria,
                    lugar.descripcion
                ].join(" ")
            );

        return palabras.every(
            palabra =>
                contenido.includes(palabra)
        );
    });
}

function abrirLugar(lugar) {
    searchInput.value =
        lugar.nombre;

    clearSearch.style.display =
        "block";

    searchResults.style.display =
        "none";

    map.setView(
        [lugar.lat, lugar.lng],
        16
    );

    window.setTimeout(() => {
        abrirFichaLugar(lugar);
    }, 300);
}

function renderizarResultados(
    resultados
) {
    searchResults.innerHTML = "";

    const consulta =
        searchInput.value.trim();

    if (!consulta) {
        searchResults.style.display =
            "none";

        return;
    }

    if (resultados.length === 0) {
        searchResults.innerHTML = `
            <div class="search-result">
                <div>
                    <strong>
                        Sin resultados
                    </strong>

                    <small>
                        Prueba con otra palabra.
                    </small>
                </div>
            </div>
        `;

        searchResults.style.display =
            "block";

        return;
    }

    resultados
        .slice(0, 8)
        .forEach(lugar => {
            const button =
                document.createElement(
                    "button"
                );

            button.type = "button";

            button.className =
                "search-result";

            button.innerHTML = `
                <div>
                    <strong>
                        ${lugar.nombre}
                    </strong>

                    <small>
                        ${lugar.zona}
                    </small>
                </div>

                <span class="result-category">
                    ${lugar.categoria}
                </span>
            `;

            button.addEventListener(
                "click",
                () => abrirLugar(lugar)
            );

            searchResults.appendChild(
                button
            );
        });

    searchResults.style.display =
        "block";
}

function actualizarResultadosBusqueda() {
    const resultados =
        encontrarResultados(
            searchInput.value
        );

    renderizarResultados(
        resultados
    );
}

searchInput.addEventListener(
    "input",
    () => {
        clearSearch.style.display =
            searchInput.value
                ? "block"
                : "none";

        actualizarResultadosBusqueda();
    }
);

clearSearch.addEventListener(
    "click",
    () => {
        searchInput.value = "";

        clearSearch.style.display =
            "none";

        searchResults.style.display =
            "none";

        cerrarFichaLugar();

        searchInput.focus();

        map.setView(
            [-22.94, -43.22],
            11
        );
    }
);

document.addEventListener(
    "click",
    event => {
        const dentroDelBuscador =
            event.target.closest(
                ".search"
            );

        const dentroDeResultados =
            event.target.closest(
                "#searchResults"
            );

        if (
            !dentroDelBuscador &&
            !dentroDeResultados
        ) {
            searchResults.style.display =
                "none";
        }
    }
);// -----------------------------------------------------
// INICIALIZACIÓN
// -----------------------------------------------------

// Actualizar resultados al iniciar
actualizarResultadosBusqueda();

// Activar menú inferior
navButtons.forEach(button => {

    button.addEventListener("click", () => {

        navButtons.forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");

    });

});

// Cerrar ficha al pulsar fuera (solo escritorio)
document.addEventListener("click", event => {

    if (
        placePanel.classList.contains("visible") &&
        !event.target.closest("#placePanel") &&
        !event.target.closest(".leaflet-marker-icon") &&
        !event.target.closest(".search-result")
    ) {

        cerrarFichaLugar();

    }

});

// Evitar errores si no existe vídeo
if(placeVideosButton){

    placeVideosButton.disabled = true;

}

// Mensaje en consola
console.log(
    "%c🌍 Mundo Infinito Beta 0.3 cargada correctamente",
    "color:#19c37d;font-size:16px;font-weight:bold;"
);
