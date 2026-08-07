"use strict";

// =========================================================
// MUNDO INFINITO · RECOMENDACIONES ESCRITAS v1.1
// SOLO notes-explorer.js
// No modifica app.js, video-explorer.js ni el mapa al cargar.
// =========================================================

(() => {
  const openButton = document.getElementById("openNotesModal");
  const modal = document.getElementById("notesModal");
  const closeButton = document.getElementById("closeNotesModal");
  const textarea = document.getElementById("notesInput");
  const analyzeButton = document.getElementById("analyzeNotesButton");

  if (!openButton || !modal || !closeButton || !textarea || !analyzeButton) {
    console.warn("📝 Recomendaciones escritas: faltan elementos de la interfaz.");
    return;
  }

  let results = [];
  let analyzing = false;
  let saving = false;

  // ---------------------------------------------------------
  // INTERFAZ DE RESULTADOS
  // Se añade dentro del modal existente, sin tocar index.html.
  // ---------------------------------------------------------

  let statusBox = document.getElementById("notesExplorerStatus");
  let resultsBox = document.getElementById("notesExplorerResults");
  let summaryBox = document.getElementById("notesExplorerSummary");
  let saveButton = document.getElementById("saveNotesToMap");

  if (!statusBox) {
    statusBox = document.createElement("div");
    statusBox.id = "notesExplorerStatus";
    statusBox.style.marginTop = "16px";
    statusBox.style.fontWeight = "700";
    statusBox.style.color = "#10251f";
    analyzeButton.insertAdjacentElement("afterend", statusBox);
  }

  if (!resultsBox) {
    resultsBox = document.createElement("div");
    resultsBox.id = "notesExplorerResults";
    resultsBox.style.display = "grid";
    resultsBox.style.gap = "11px";
    resultsBox.style.marginTop = "14px";
    statusBox.insertAdjacentElement("afterend", resultsBox);
  }

  if (!summaryBox) {
    summaryBox = document.createElement("div");
    summaryBox.id = "notesExplorerSummary";
    summaryBox.hidden = true;
    summaryBox.style.marginTop = "14px";
    summaryBox.style.padding = "13px 15px";
    summaryBox.style.borderRadius = "15px";
    summaryBox.style.background = "#f7f9f8";
    summaryBox.style.color = "#52615c";
    resultsBox.insertAdjacentElement("afterend", summaryBox);
  }

  if (!saveButton) {
    saveButton = document.createElement("button");
    saveButton.id = "saveNotesToMap";
    saveButton.type = "button";
    saveButton.textContent = "✓ Añadir recomendaciones al mapa";
    saveButton.style.display = "none";
    saveButton.style.width = "100%";
    saveButton.style.marginTop = "14px";
    saveButton.style.padding = "14px 18px";
    saveButton.style.border = "0";
    saveButton.style.borderRadius = "15px";
    saveButton.style.background = "#0f8b6d";
    saveButton.style.color = "#fff";
    saveButton.style.font = "inherit";
    saveButton.style.fontWeight = "800";
    saveButton.style.cursor = "pointer";
    summaryBox.insertAdjacentElement("afterend", saveButton);
  }

  // ---------------------------------------------------------
  // UTILIDADES
  // ---------------------------------------------------------

  function safe(value) {
    if (typeof escapeHTML === "function") {
      return escapeHTML(String(value ?? ""));
    }

    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function usableCoordinates(lat, lng) {
    const a = Number(lat);
    const b = Number(lng);

    return (
      Number.isFinite(a) &&
      Number.isFinite(b) &&
      a >= -90 &&
      a <= 90 &&
      b >= -180 &&
      b <= 180 &&
      !(Math.abs(a) < 0.000001 && Math.abs(b) < 0.000001)
    );
  }

  function appReady() {
    return (
      typeof supabaseClient !== "undefined" &&
      !!supabaseClient &&
      typeof createOrGetPlace === "function" &&
      typeof createSupabaseDiscovery === "function" &&
      typeof renderMarkers === "function"
    );
  }

  function showMessage(message) {
    if (typeof showToast === "function") {
      showToast(message);
    } else {
      console.log(message);
    }
  }

  function resetResults() {
    results = [];
    resultsBox.innerHTML = "";
    statusBox.textContent = "";
    summaryBox.hidden = true;
    summaryBox.innerHTML = "";
    saveButton.style.display = "none";
  }

  function openModal() {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    window.setTimeout(() => textarea.focus(), 100);
  }

  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  // ---------------------------------------------------------
  // ANALYZE-NOTES
  // Puede recibir muchas recomendaciones en un solo texto.
  // ---------------------------------------------------------

  async function analyzeText(text) {
    const { data, error } = await supabaseClient.functions.invoke(
      "analyze-notes",
      {
        body: {
          text,
          country: "Brasil"
        }
      }
    );

    if (error) {
      throw error;
    }

    if (!data || data.success === false) {
      throw new Error(
        data?.error ||
        "No se pudieron analizar las recomendaciones."
      );
    }

    return Array.isArray(data.details)
      ? data.details
      : [];
  }

  // ---------------------------------------------------------
  // GEOLOCALIZAR UN DETALLE
  // ---------------------------------------------------------

  async function geocodeDetail(detail) {
    const placeName = String(
      detail.placeName ||
      detail.name ||
      detail.title ||
      ""
    ).trim();

    if (!placeName || detail.localizable === false) {
      return {
        ...detail,
        placeName,
        status: "failed",
        reason:
          detail.reason ||
          "No se ha identificado un lugar concreto."
      };
    }

    const { data, error } = await supabaseClient.functions.invoke(
      "geocode-place",
      {
        body: {
          name: placeName,
          zone:
            detail.zone ||
            detail.neighborhood ||
            "",
          city:
            detail.city ||
            "",
          state:
            detail.state ||
            "",
          country:
            detail.country ||
            "Brasil"
        }
      }
    );

    if (error) {
      console.warn(
        "📝 No se pudo geolocalizar:",
        placeName,
        error
      );

      return {
        ...detail,
        placeName,
        status: "failed",
        reason: "No se ha podido comprobar la ubicación."
      };
    }

    if (
      data?.found &&
      usableCoordinates(data.lat, data.lng)
    ) {
      return {
        ...detail,
        placeName,
        lat: Number(data.lat),
        lng: Number(data.lng),
        geocodeData: data,
        status: "ready"
      };
    }

    return {
      ...detail,
      placeName,
      status: "failed",
      reason:
        "No se ha podido localizar este lugar con suficiente seguridad."
    };
  }

  // ---------------------------------------------------------
  // AGRUPAR TODO LO QUE PERTENECE AL MISMO LUGAR
  //
  // Ejemplo:
  // SAARA: horario + precio + consejo -> UN lugar,
  // tres recomendaciones dentro de su ficha.
  // ---------------------------------------------------------

  function groupByPlace(items) {
    const grouped = new Map();

    items.forEach(item => {
      const key = normalizeText(
        [
          item.placeName,
          item.city,
          item.state,
          item.country
        ]
          .filter(Boolean)
          .join("|")
      );

      if (!key) {
        return;
      }

      if (!grouped.has(key)) {
        grouped.set(key, {
          ...item,
          notes: []
        });
      }

      const target = grouped.get(key);

      const note = String(
        item.detail ||
        item.description ||
        item.note ||
        ""
      ).trim();

      if (note && !target.notes.includes(note)) {
        target.notes.push(note);
      }

      if (item.status === "ready") {
        target.status = "ready";
        target.lat = item.lat;
        target.lng = item.lng;
        target.geocodeData = item.geocodeData;
      }
    });

    return Array.from(grouped.values());
  }

  // ---------------------------------------------------------
  // MOSTRAR REVISIÓN
  // ---------------------------------------------------------

  function renderResults() {
    const ready = results.filter(
      item => item.status === "ready"
    );

    const failed = results.filter(
      item => item.status !== "ready"
    );

    resultsBox.innerHTML = results
      .map(item => {
        const ok = item.status === "ready";

        const location = [
          item.zone,
          item.city,
          item.state,
          item.country
        ]
          .filter(Boolean)
          .join(" · ");

        const notes =
          Array.isArray(item.notes) &&
          item.notes.length
            ? item.notes
                .map(note => `• ${safe(note)}`)
                .join("<br>")
            : "";

        return `
          <article
            style="
              display:grid;
              grid-template-columns:1fr auto;
              gap:12px;
              padding:14px 15px;
              border:1px solid rgba(16,33,28,.09);
              border-radius:17px;
              background:#fff;
            "
          >
            <div>
              <strong>${safe(item.placeName || "Información sin lugar")}</strong>

              ${
                location
                  ? `
                    <div
                      style="
                        margin-top:3px;
                        color:#71807a;
                        font-size:12px;
                      "
                    >
                      ${safe(location)}
                    </div>
                  `
                  : ""
              }

              ${
                notes
                  ? `
                    <div
                      style="
                        margin-top:8px;
                        color:#52615c;
                        font-size:13px;
                        line-height:1.45;
                      "
                    >
                      ${notes}
                    </div>
                  `
                  : (
                    item.reason
                      ? `
                        <div
                          style="
                            margin-top:8px;
                            color:#8b5555;
                            font-size:13px;
                          "
                        >
                          ${safe(item.reason)}
                        </div>
                      `
                      : ""
                  )
              }
            </div>

            <span
              style="
                align-self:start;
                padding:5px 8px;
                border-radius:999px;
                font-size:10px;
                font-weight:800;
                white-space:nowrap;
                color:${ok ? "#0d6b55" : "#a63f3f"};
                background:${ok ? "#e5f3ee" : "#fdeaea"};
              "
            >
              ${ok ? "Localizado" : "No se añadirá"}
            </span>
          </article>
        `;
      })
      .join("");

    summaryBox.hidden = false;

    summaryBox.innerHTML =
      ready.length === 0
        ? "No se ha podido localizar ningún lugar con suficiente seguridad."
        : `
          <b>${ready.length}</b>
          ${ready.length === 1 ? "lugar listo" : "lugares listos"}
          para añadir al mapa
          ${
            failed.length
              ? ` · ${failed.length} no se ${failed.length === 1 ? "añadirá" : "añadirán"}`
              : ""
          }.
        `;

    if (ready.length > 0) {
      saveButton.textContent =
        ready.length === 1
          ? "✓ Añadir 1 lugar al mapa"
          : `✓ Añadir ${ready.length} lugares al mapa`;

      saveButton.style.display = "block";
    } else {
      saveButton.style.display = "none";
    }
  }

  // ---------------------------------------------------------
  // CORREGIR METADATOS DEL LUGAR SIN TOCAR app.js
  // createOrGetPlace mantiene el sistema actual.
  // Después actualizamos ciudad/país/coordenadas en Supabase.
  // ---------------------------------------------------------

  async function syncDetectedLocation(place, item) {
    if (!place?.id) {
      return place;
    }

    const address =
      item.geocodeData?.address ||
      {};

    const detectedZone =
      item.zone ||
      address.suburb ||
      address.neighbourhood ||
      address.city_district ||
      place.zone ||
      "";

    const detectedCity =
      item.city ||
      address.city ||
      address.town ||
      address.municipality ||
      place.city ||
      "";

    const detectedCountry =
      item.country ||
      address.country ||
      place.country ||
      "Brasil";

    const { data, error } = await supabaseClient
      .from("places")
      .update({
        zone: detectedZone,
        city: detectedCity,
        country: detectedCountry,
        latitude: Number(item.lat),
        longitude: Number(item.lng)
      })
      .eq("id", place.id)
      .select()
      .single();

    if (error) {
      console.warn(
        "📝 No se pudieron completar ciudad/país de:",
        item.placeName,
        error
      );

      return place;
    }

    if (typeof normalizePlace === "function") {
      return normalizePlace({
        ...data,
        source: "supabase"
      });
    }

    return {
      ...place,
      ...data,
      lat: Number(data.latitude),
      lng: Number(data.longitude)
    };
  }

  function putPlaceInMemory(place) {
    if (
      typeof places === "undefined" ||
      !Array.isArray(places) ||
      !place
    ) {
      return;
    }

    const index = places.findIndex(
      existing =>
        String(existing.id) === String(place.id)
    );

    if (index >= 0) {
      places[index] = {
        ...places[index],
        ...place
      };
    } else {
      places.push(place);
    }
  }

  function putDiscoveryInMemory(discovery) {
    if (
      typeof discoveries === "undefined" ||
      !Array.isArray(discoveries) ||
      !discovery
    ) {
      return;
    }

    if (
      !discoveries.some(
        existing =>
          String(existing.id) ===
          String(discovery.id)
      )
    ) {
      discoveries.push(discovery);
    }
  }

  // ---------------------------------------------------------
  // ANALIZAR
  // ---------------------------------------------------------

  async function analyze() {
    if (analyzing) {
      return;
    }

    const text = textarea.value.trim();

    if (text.length < 4) {
      showMessage("Pega primero alguna recomendación");
      textarea.focus();
      return;
    }

    if (!appReady()) {
      showMessage("Mundo Infinito todavía no está listo");
      return;
    }

    analyzing = true;
    resetResults();

    analyzeButton.disabled = true;
    analyzeButton.textContent = "🔎 Analizando…";
    statusBox.textContent =
      "Analizando recomendaciones e identificando lugares…";

    try {
      const details = await analyzeText(text);

      if (!details.length) {
        summaryBox.hidden = false;
        summaryBox.textContent =
          "No se ha encontrado información que pueda convertirse en lugares del mapa.";
        return;
      }

      const geocoded = [];

      for (const detail of details) {
        statusBox.textContent =
          `Localizando ${detail.placeName || detail.title || "lugar"}…`;

        geocoded.push(
          await geocodeDetail(detail)
        );
      }

      results = groupByPlace(geocoded);
      statusBox.textContent = "";
      renderResults();

    } catch (error) {
      console.error(
        "📝 Error analizando recomendaciones:",
        error
      );

      summaryBox.hidden = false;
      summaryBox.textContent =
        "No se han podido analizar las recomendaciones.";

      showMessage(
        "No se pudieron analizar las recomendaciones"
      );

    } finally {
      analyzing = false;
      analyzeButton.disabled = false;
      analyzeButton.textContent =
        "🔎 Analizar recomendaciones";
    }
  }

  // ---------------------------------------------------------
  // GUARDAR
  // ---------------------------------------------------------

  async function save() {
    if (saving) {
      return;
    }

    const ready = results.filter(
      item => item.status === "ready"
    );

    if (!ready.length) {
      showMessage("No hay lugares listos para añadir");
      return;
    }

    saving = true;
    saveButton.disabled = true;
    saveButton.textContent = "Guardando…";

    const createdPlaces = [];
    let savedNotes = 0;
    let failures = 0;

    try {
      for (const item of ready) {
        try {
          const description =
            Array.isArray(item.notes) &&
            item.notes.length
              ? item.notes.join("\n")
              : (
                  item.detail ||
                  "Lugar localizado desde recomendaciones escritas."
                );

          // Se crea/reutiliza UN lugar.
          let place = await createOrGetPlace({
            name: item.placeName,
            zone:
              item.zone ||
              item.neighborhood ||
              "",
            category:
              item.category ||
              "Lugar",
            description,
            lat: item.lat,
            lng: item.lng
          });

          // Sin modificar app.js, completamos ciudad/país detectados.
          place = await syncDetectedLocation(
            place,
            item
          );

          putPlaceInMemory(place);

          // Cada frase/recomendación se guarda como descubrimiento
          // dentro del lugar correspondiente.
          const notes =
            Array.isArray(item.notes) &&
            item.notes.length
              ? item.notes
              : [description];

          for (const note of notes) {
            const discovery =
              await createSupabaseDiscovery({
                title:
                  item.placeName,
                description:
                  note,
                category:
                  item.category ||
                  "Consejo",
                placeId:
                  place.id,
                videoId:
                  null,
                timestampStart:
                  0,
                timestampEnd:
                  null
              });

            putDiscoveryInMemory(discovery);
            savedNotes += 1;
          }

          createdPlaces.push(place);

        } catch (error) {
          failures += 1;

          console.warn(
            "📝 No se pudo guardar:",
            item.placeName,
            error
          );
        }
      }

      renderMarkers();

      if (!createdPlaces.length) {
        showMessage(
          "No se ha podido añadir ningún lugar"
        );
        return;
      }

      const first = createdPlaces[0];

      if (
        typeof map !== "undefined" &&
        usableCoordinates(
          first.lat,
          first.lng
        )
      ) {
        map.flyTo(
          [
            Number(first.lat),
            Number(first.lng)
          ],
          13,
          {
            duration: 1.1
          }
        );
      }

      showMessage(
        failures
          ? `${createdPlaces.length} lugares añadidos · ${failures} no se pudieron guardar`
          : `${savedNotes} recomendaciones añadidas en ${createdPlaces.length} lugares`
      );

      textarea.value = "";
      resetResults();
      closeModal();

    } finally {
      saving = false;
      saveButton.disabled = false;
      saveButton.textContent =
        "✓ Añadir recomendaciones al mapa";
    }
  }

  // ---------------------------------------------------------
  // EVENTOS
  // ---------------------------------------------------------

  openButton.addEventListener("click", openModal);
  closeButton.addEventListener("click", closeModal);
  analyzeButton.addEventListener("click", analyze);
  saveButton.addEventListener("click", save);

  modal.addEventListener("click", event => {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", event => {
    if (
      event.key === "Escape" &&
      modal.classList.contains("open")
    ) {
      closeModal();
    }
  });

  console.log(
    "📝 Mundo Infinito · recomendaciones escritas v1.1 cargadas"
  );
})();
