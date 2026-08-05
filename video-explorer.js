// =========================================================
// MUNDO INFINITO · video-explorer v0.6.0
// Extensión segura sobre app.js v0.5 estable
// Un vídeo -> varios detalles -> revisión -> Supabase
// =========================================================

"use strict";

(() => {
  // -------------------------------------------------------
  // DOM v0.6
  // -------------------------------------------------------
  const modalCard = discoveryModal?.querySelector(".discovery-v06-card");
  const videoLink = document.getElementById("discoveryVideoLink");
  const videoFile = document.getElementById("discoveryVideoFile");
  const videoPreview = document.getElementById("discoveryVideoPreview");
  const previewPlayer = document.getElementById("discoveryPreviewPlayer");
  const explorationStatus = document.getElementById("videoExplorationStatus");
  const explorationMessage = document.getElementById("explorationMessage");
  const progressBar = document.getElementById("explorationProgressBar");
  const resultsSection = document.getElementById("explorationResults");
  const detailsCount = document.getElementById("detectedDetailsCount");
  const detailsList = document.getElementById("detectedDetailsList");
  const addManualButton = document.getElementById("addManualDetailButton");
  const manualEditor = document.getElementById("manualDetailEditor");
  const detailType = document.getElementById("detailType");
  const titleInput = document.getElementById("discoveryTitle");
  const placeInput = document.getElementById("discoveryPlace");
  const categoryInput = document.getElementById("discoveryCategory");
  const commentInput = document.getElementById("discoveryComment");
  const startInput = document.getElementById("detailTimestampStart");
  const endInput = document.getElementById("detailTimestampEnd");
  const useCurrentTimeButton = document.getElementById("useCurrentVideoTime");
  const cancelEditButton = document.getElementById("cancelDetailEdit");
  const addDetailButton = document.getElementById("addDetailToDraft");
  const draftSection = document.getElementById("videoDraftSummary");
  const draftCount = document.getElementById("draftDetailsCount");
  const draftList = document.getElementById("videoDraftDetailsList");
  const saveAllButton = document.getElementById("saveAllDiscoveriesButton");

  if (!discoveryForm || !modalCard || !videoLink) {
    console.warn("Mundo Infinito v0.6: interfaz de exploración no disponible.");
    return;
  }

  // El formulario nuevo valida los detalles en JS.
  // Evitamos que campos required ocultos impidan guardar.
  [titleInput, placeInput, categoryInput].forEach((el) => {
    if (el) el.required = false;
  });

  // -------------------------------------------------------
  // Estado
  // -------------------------------------------------------

  let draftDetails = [];
  let editingIndex = null;
  let selectedFile = null;
  let selectedFileUrl = null;
  let explorationRun = 0;
  let linkDebounce = null;
  let saving = false;

  const ICONS = {
    Lugar: "📍",
    Restaurante: "🍴",
    Playa: "🏖️",
    Mirador: "🌄",
    Consejo: "💡",
    Precio: "💰",
    Transporte: "🚕",
    Aviso: "⚠️",
    Compras: "🛍️",
    Evento: "🎉",
    Otro: "✨",
  };

  // -------------------------------------------------------
  // Utilidades de tiempo
  // -------------------------------------------------------

  function toSeconds(value) {
    const text = String(value ?? "").trim();

    if (!text) return 0;

    if (/^\d+$/.test(text)) {
      return Math.max(0, Number(text));
    }

    const parts = text.split(":").map(Number);

    if (parts.some((n) => !Number.isFinite(n))) {
      return 0;
    }

    if (parts.length === 2) {
      return Math.max(0, parts[0] * 60 + parts[1]);
    }

    if (parts.length === 3) {
      return Math.max(
        0,
        parts[0] * 3600 +
        parts[1] * 60 +
        parts[2]
      );
    }

    return 0;
  }

  function toTime(value) {
    const total = Math.max(
      0,
      Math.floor(Number(value) || 0)
    );

    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;

    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function iconFor(detail) {
    return (
      ICONS[detail.type] ||
      categoryIcons?.[detail.category] ||
      "📍"
    );
  }

  function safeText(value) {
    return typeof escapeHTML === "function"
      ? escapeHTML(value)
      : String(value ?? "");
  }

  function setProgress(percent, message) {
    if (progressBar) {
      progressBar.style.width =
        `${Math.max(0, Math.min(100, percent))}%`;
    }

    if (explorationMessage && message) {
      explorationMessage.textContent = message;
    }
  }

  function sourceUrl() {
    return String(videoLink.value || "").trim();
  }

  // -------------------------------------------------------
  // Reset y estados visuales
  // -------------------------------------------------------

  function clearObjectUrl() {
    if (selectedFileUrl) {
      URL.revokeObjectURL(selectedFileUrl);
      selectedFileUrl = null;
    }
  }

  function resetEditor() {
    editingIndex = null;

    if (detailType) detailType.value = "Lugar";
    if (titleInput) titleInput.value = "";
    if (placeInput) placeInput.value = "";
    if (categoryInput) categoryInput.value = "";
    if (commentInput) commentInput.value = "";
    if (startInput) startInput.value = "00:00";
    if (endInput) endInput.value = "";

    if (discoveryLat) {
      discoveryLat.value = "";
    }

    if (discoveryLng) {
      discoveryLng.value = "";
    }

    cancelEditButton?.classList.add("hidden");

    if (addDetailButton) {
      addDetailButton.textContent =
        "＋ Añadir detalle";
    }
  }

  function resetFlow() {
    explorationRun += 1;

    clearTimeout(linkDebounce);

    draftDetails = [];
    selectedFile = null;

    clearObjectUrl();
    resetEditor();

    modalCard.classList.remove(
      "is-exploring",
      "has-results"
    );

    explorationStatus?.classList.remove("active");
    resultsSection?.classList.remove("active");
    draftSection?.classList.remove("active");
    manualEditor?.classList.remove("open");
    saveAllButton?.classList.remove("visible");

    if (detailsList) {
      detailsList.innerHTML = "";
    }

    if (draftList) {
      draftList.innerHTML = "";
    }

    if (detailsCount) {
      detailsCount.textContent = "0";
    }

    if (draftCount) {
      draftCount.textContent = "0";
    }

    if (videoPreview) {
      videoPreview.classList.add("hidden");
    }

    if (previewPlayer) {
      previewPlayer.pause();
      previewPlayer.removeAttribute("src");
      previewPlayer.load();
    }

    setProgress(
      0,
      "Preparando el contenido…"
    );
  }

  function showExploring() {
    modalCard.classList.remove("has-results");
    modalCard.classList.add("is-exploring");

    explorationStatus?.classList.add("active");
    resultsSection?.classList.remove("active");
    manualEditor?.classList.remove("open");
    saveAllButton?.classList.remove("visible");
  }

  function showResults() {
    modalCard.classList.remove("is-exploring");
    modalCard.classList.add("has-results");

    explorationStatus?.classList.remove("active");
    resultsSection?.classList.add("active");

    renderDetails();
  }

  // app.js v0.5 sigue siendo quien abre el modal.
  // v0.6 solamente prepara el nuevo explorador.

  openDiscoveryModal?.addEventListener(
    "click",
    () => {
      resetFlow();

      window.setTimeout(
        () => videoLink.focus(),
        120
      );
    }
  );

  closeDiscoveryModal?.addEventListener(
    "click",
    () => {
      explorationRun += 1;
      clearObjectUrl();
    }
  );  // -------------------------------------------------------
  // SELECCIONAR VÍDEO LOCAL
  // -------------------------------------------------------

  videoFile?.addEventListener(
    "change",
    () => {
      const file =
        videoFile.files?.[0];

      if (!file) {
        return;
      }

      selectedFile = file;

      clearObjectUrl();

      selectedFileUrl =
        URL.createObjectURL(file);

      if (previewPlayer) {
        previewPlayer.src =
          selectedFileUrl;

        previewPlayer.load();
      }

      videoPreview?.classList.remove(
        "hidden"
      );

      exploreVideo({
        type: "file",
        file,
        url: selectedFileUrl,
      });
    }
  );


  // -------------------------------------------------------
  // PEGAR ENLACE
  // La exploración comienza automáticamente.
  // -------------------------------------------------------

  videoLink.addEventListener(
    "input",
    () => {
      clearTimeout(linkDebounce);

      const url =
        sourceUrl();

      if (!url) {
        return;
      }

      if (url.length < 8) {
        return;
      }

      linkDebounce =
        window.setTimeout(
          () => {
            exploreVideo({
              type: "url",
              url,
            });
          },
          750
        );
    }
  );


  // -------------------------------------------------------
  // MENSAJES DURANTE LA EXPLORACIÓN
  // -------------------------------------------------------

  const explorationPhases = [
    {
      progress: 8,
      message:
        "Preparando el vídeo…",
    },
    {
      progress: 22,
      message:
        "Escuchando lo que cuentan…",
    },
    {
      progress: 38,
      message:
        "Localizando lugares mencionados…",
    },
    {
      progress: 54,
      message:
        "Buscando restaurantes y recomendaciones…",
    },
    {
      progress: 68,
      message:
        "Identificando consejos útiles…",
    },
    {
      progress: 82,
      message:
        "Localizando momentos del vídeo…",
    },
    {
      progress: 94,
      message:
        "Organizando los detalles…",
    },
  ];


  // -------------------------------------------------------
  // ANIMACIÓN DE PROGRESO
  // -------------------------------------------------------

  async function animateExploration(
    runId
  ) {
    for (
      const phase
      of explorationPhases
    ) {
      if (
        runId !==
        explorationRun
      ) {
        return;
      }

      setProgress(
        phase.progress,
        phase.message
      );

      await new Promise(
        resolve =>
          window.setTimeout(
            resolve,
            420
          )
      );
    }
  }


  // -------------------------------------------------------
  // EXPLORAR VÍDEO
  // -------------------------------------------------------

  async function exploreVideo(
    source
  ) {
    const runId =
      ++explorationRun;

    draftDetails = [];
    editingIndex = null;

    renderDetails();

    showExploring();

    setProgress(
      4,
      "Explorando detalles del vídeo…"
    );

    /*
     * Ejecutamos la animación visual
     * mientras intentamos obtener
     * resultados automáticos.
     */

    const animation =
      animateExploration(
        runId
      );

    let automaticDetails =
      [];

    try {
      automaticDetails =
        await requestAutomaticAnalysis(
          source
        );
    } catch (error) {
      console.warn(
        "Mundo Infinito v0.6: análisis automático no disponible.",
        error
      );
    }

    await animation;

    if (
      runId !==
      explorationRun
    ) {
      return;
    }

    /*
     * Si la función automática devuelve
     * información válida, la cargamos.
     *
     * Si todavía no está conectada,
     * NO inventamos lugares.
     */

    if (
      Array.isArray(
        automaticDetails
      ) &&
      automaticDetails.length
    ) {
      draftDetails =
        automaticDetails
          .map(
            normalizeAutomaticDetail
          )
          .filter(Boolean);

      setProgress(
        100,
        "Detalles encontrados"
      );

      showResults();

      showToast?.(
        draftDetails.length === 1
          ? "✨ 1 detalle encontrado"
          : `✨ ${draftDetails.length} detalles encontrados`
      );

      return;
    }

    /*
     * Todavía no hay análisis real.
     * Permitimos completar manualmente.
     */

    setProgress(
      100,
      "Vídeo preparado"
    );

    showResults();

    showToast?.(
      "✨ Vídeo preparado para revisar"
    );

    openManualEditor();
  }


  // -------------------------------------------------------
  // LLAMADA AL ANALIZADOR AUTOMÁTICO
  // -------------------------------------------------------

  async function requestAutomaticAnalysis(
    source
  ) {
    /*
     * Esta función queda preparada para
     * Supabase Edge Functions.
     *
     * Cuando creemos:
     *
     *   analyze-video
     *
     * la web podrá enviar el enlace
     * y recibir los detalles detectados.
     */

    if (
      !supabaseClient ||
      !supabaseOnline
    ) {
      return [];
    }

    /*
     * Los archivos MP4 locales necesitarán
     * primero Supabase Storage.
     *
     * No enviamos una blob: URL porque
     * solo existe en este navegador.
     */

    if (
      source.type === "file"
    ) {
      return [];
    }

    if (
      !source.url
    ) {
      return [];
    }

    try {
      const {
        data,
        error,
      } =
        await supabaseClient
          .functions
          .invoke(
            "analyze-video",
            {
              body: {
                video_url:
                  source.url,

                city:
                  CONFIG?.city ||
                  "Río de Janeiro",

                country:
                  CONFIG?.country ||
                  "Brasil",
              },
            }
          );

      if (error) {
        /*
         * Mientras la función todavía
         * no exista, simplemente seguimos
         * con el modo manual.
         */
        console.info(
          "Analizador automático todavía no conectado."
        );

        return [];
      }

      if (
        !data
      ) {
        return [];
      }

      if (
        Array.isArray(
          data
        )
      ) {
        return data;
      }

      if (
        Array.isArray(
          data.details
        )
      ) {
        return data.details;
      }

      if (
        Array.isArray(
          data.discoveries
        )
      ) {
        return data.discoveries;
      }

      return [];
    } catch (error) {
      console.info(
        "Exploración automática pendiente:",
        error
      );

      return [];
    }
  }


  // -------------------------------------------------------
  // NORMALIZAR RESULTADO AUTOMÁTICO
  // -------------------------------------------------------

  function normalizeAutomaticDetail(
    item
  ) {
    if (
      !item ||
      typeof item !==
        "object"
    ) {
      return null;
    }

    const title =
      String(
        item.title ||
        item.name ||
        ""
      ).trim();

    if (!title) {
      return null;
    }

    const type =
      String(
        item.type ||
        item.detail_type ||
        item.category ||
        "Lugar"
      ).trim();

    const category =
      String(
        item.category ||
        type ||
        "Lugar"
      ).trim();

    const place =
      String(
        item.place ||
        item.zone ||
        item.location ||
        ""
      ).trim();

    const description =
      String(
        item.description ||
        item.comment ||
        item.tip ||
        ""
      ).trim();

    const start =
      Number.isFinite(
        Number(
          item.timestamp_start
        )
      )
        ? Number(
            item.timestamp_start
          )
        : Number.isFinite(
            Number(
              item.timestampStart
            )
          )
          ? Number(
              item.timestampStart
            )
          : toSeconds(
              item.time ||
              item.timestamp ||
              "00:00"
            );

    let end =
      item.timestamp_end ??
      item.timestampEnd ??
      null;

    if (
      typeof end ===
        "string"
    ) {
      end =
        toSeconds(end);
    }

    if (
      end !== null &&
      !Number.isFinite(
        Number(end)
      )
    ) {
      end = null;
    }

    let lat =
      Number(
        item.latitude ??
        item.lat
      );

    let lng =
      Number(
        item.longitude ??
        item.lng
      );

    /*
     * Si la IA todavía no proporciona
     * coordenadas, no inventamos unas.
     * Al editar el detalle podremos
     * establecerlas desde el mapa.
     */

    if (
      !Number.isFinite(lat)
    ) {
      lat = null;
    }

    if (
      !Number.isFinite(lng)
    ) {
      lng = null;
    }

    return {
      id:
        item.id ||
        (
          crypto.randomUUID
            ? crypto.randomUUID()
            : `detail-${Date.now()}-${Math.random()}`
        ),

      title,
      place,
      type,
      category,

      comment:
        description,

      timestampStart:
        Math.max(
          0,
          start || 0
        ),

      timestampEnd:
        end === null
          ? null
          : Math.max(
              0,
              Number(end)
            ),

      lat,
      lng,

      confidence:
        Number.isFinite(
          Number(
            item.confidence
          )
        )
          ? Number(
              item.confidence
            )
          : null,

      manual:
        false,
    };
  }


  // -------------------------------------------------------
  // ABRIR EDITOR MANUAL
  // -------------------------------------------------------

  function openManualEditor(
    index = null
  ) {
    manualEditor?.classList.add(
      "open"
    );

    if (
      index === null
    ) {
      resetEditor();
    } else {
      loadDetailIntoEditor(
        index
      );
    }

    window.setTimeout(
      () => {
        manualEditor
          ?.scrollIntoView({
            behavior:
              "smooth",
            block:
              "start",
          });
      },
      100
    );
  }


  // -------------------------------------------------------
  // CERRAR EDITOR
  // -------------------------------------------------------

  function closeManualEditor() {
    manualEditor?.classList.remove(
      "open"
    );

    resetEditor();
  }


  addManualButton?.addEventListener(
    "click",
    () => {
      openManualEditor();
    }
  );


  cancelEditButton?.addEventListener(
    "click",
    () => {
      closeManualEditor();
    }
  );


  // -------------------------------------------------------
  // USAR EL MOMENTO ACTUAL DEL VÍDEO
  // -------------------------------------------------------

  useCurrentTimeButton
    ?.addEventListener(
      "click",
      () => {
        if (
          !previewPlayer ||
          !startInput
        ) {
          return;
        }

        const current =
          Number(
            previewPlayer.currentTime ||
            0
          );

        startInput.value =
          toTime(current);

        showToast?.(
          `⏱ ${toTime(current)}`
        );
      }
    );


  // -------------------------------------------------------
  // TIPO -> CATEGORÍA SUGERIDA
  // -------------------------------------------------------

  detailType?.addEventListener(
    "change",
    () => {
      if (!categoryInput) {
        return;
      }

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
          "Lugar",
      };

      const suggested =
        suggestions[
          detailType.value
        ];

      if (suggested) {
        categoryInput.value =
          suggested;
      }
    }
  );


  // -------------------------------------------------------
  // NORMALIZAR CAMPOS DE TIEMPO
  // -------------------------------------------------------

  startInput?.addEventListener(
    "blur",
    () => {
      startInput.value =
        toTime(
          toSeconds(
            startInput.value
          )
        );
    }
  );


  endInput?.addEventListener(
    "blur",
    () => {
      const value =
        String(
          endInput.value ||
          ""
        ).trim();

      if (!value) {
        return;
      }

      endInput.value =
        toTime(
          toSeconds(value)
        );
    }
  );  // -------------------------------------------------------
  // EDITOR MANUAL
  // -------------------------------------------------------

  function openEditor(
    index = null
  ) {
    editingIndex =
      index;

    manualEditor
      ?.classList
      .add(
        "open"
      );

    if (
      index === null
    ) {
      resetEditor();
    } else {
      const d =
        draftDetails[
          index
        ];

      if (!d) {
        return;
      }

      if (detailType) {
        detailType.value =
          d.type ||
          "Lugar";
      }

      if (titleInput) {
        titleInput.value =
          d.title ||
          "";
      }

      if (placeInput) {
        placeInput.value =
          d.place ||
          "";
      }

      if (categoryInput) {
        categoryInput.value =
          d.category ||
          "";
      }

      if (commentInput) {
        commentInput.value =
          d.comment ||
          "";
      }

      if (startInput) {
        startInput.value =
          toTime(
            d.timestampStart
          );
      }

      if (endInput) {
        endInput.value =
          d.timestampEnd ==
          null
            ? ""
            : toTime(
                d.timestampEnd
              );
      }

      if (discoveryLat) {
        discoveryLat.value =
          d.lat ?? "";
      }

      if (discoveryLng) {
        discoveryLng.value =
          d.lng ?? "";
      }

      cancelEditButton
        ?.classList
        .remove(
          "hidden"
        );

      if (
        addDetailButton
      ) {
        addDetailButton.textContent =
          "✓ Guardar cambios";
      }
    }

    setTimeout(
      () =>
        manualEditor
          ?.scrollIntoView({
            behavior:
              "smooth",
            block:
              "start",
          }),
      80
    );
  }


  function closeEditor() {
    manualEditor
      ?.classList
      .remove(
        "open"
      );

    resetEditor();
  }


  addManualButton
    ?.addEventListener(
      "click",
      () => {
        openEditor();
      }
    );


  cancelEditButton
    ?.addEventListener(
      "click",
      closeEditor
    );


  useCurrentTimeButton
    ?.addEventListener(
      "click",
      () => {
        const current =
          Number(
            previewPlayer
              ?.currentTime ||
            0
          );

        if (
          startInput
        ) {
          startInput.value =
            toTime(
              current
            );
        }

        showToast(
          `⏱ ${toTime(current)}`
        );
      }
    );


  detailType
    ?.addEventListener(
      "change",
      () => {
        const suggested = {
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
            "Lugar",
        }[
          detailType.value
        ];

        if (
          categoryInput &&
          suggested
        ) {
          categoryInput.value =
            suggested;
        }
      }
    );


  // -------------------------------------------------------
  // LEER DATOS DEL EDITOR
  // -------------------------------------------------------

  function readEditor() {
    const center =
      map.getCenter();

    const lat =
      Number(
        discoveryLat
          ?.value
      );

    const lng =
      Number(
        discoveryLng
          ?.value
      );

    const endText =
      String(
        endInput
          ?.value ||
        ""
      ).trim();

    return {
      id:
        editingIndex ===
        null
          ? (
              crypto.randomUUID
                ? crypto.randomUUID()
                : `draft-${Date.now()}-${Math.random()}`
            )
          : draftDetails[
              editingIndex
            ].id,

      type:
        String(
          detailType
            ?.value ||
          "Lugar"
        ),

      title:
        String(
          titleInput
            ?.value ||
          ""
        ).trim(),

      place:
        String(
          placeInput
            ?.value ||
          ""
        ).trim(),

      category:
        String(
          categoryInput
            ?.value ||
          detailType
            ?.value ||
          "Lugar"
        ).trim(),

      comment:
        String(
          commentInput
            ?.value ||
          ""
        ).trim(),

      timestampStart:
        toSeconds(
          startInput
            ?.value
        ),

      timestampEnd:
        endText
          ? toSeconds(
              endText
            )
          : null,

      lat:
        Number.isFinite(
          lat
        ) &&
        lat !== 0
          ? lat
          : center.lat,

      lng:
        Number.isFinite(
          lng
        ) &&
        lng !== 0
          ? lng
          : center.lng,

      confidence:
        editingIndex ===
        null
          ? 1
          : draftDetails[
              editingIndex
            ].confidence,

      automatic:
        editingIndex ===
        null
          ? false
          : draftDetails[
              editingIndex
            ].automatic,
    };
  }


  // -------------------------------------------------------
  // AÑADIR / EDITAR DETALLE
  // -------------------------------------------------------

  addDetailButton
    ?.addEventListener(
      "click",
      () => {
        const detail =
          readEditor();

        if (
          !detail.title
        ) {
          return showToast(
            "Escribe un nombre o título"
          );
        }

        if (
          !detail.place
        ) {
          return showToast(
            "Indica el lugar o zona"
          );
        }

        if (
          !detail.category
        ) {
          return showToast(
            "Selecciona una categoría"
          );
        }

        if (
          detail.timestampEnd !=
            null &&
          detail.timestampEnd <
            detail.timestampStart
        ) {
          return showToast(
            "El minuto final debe ser posterior al inicial"
          );
        }

        if (
          editingIndex ===
          null
        ) {
          draftDetails.push(
            detail
          );

          showToast(
            "＋ Detalle añadido"
          );
        } else {
          draftDetails[
            editingIndex
          ] =
            detail;

          showToast(
            "✓ Detalle actualizado"
          );
        }

        closeEditor();
        renderDetails();
      }
    );


  // -------------------------------------------------------
  // TARJETAS DE RESULTADOS
  // -------------------------------------------------------

  function renderDetails() {
    const count =
      draftDetails.length;

    if (
      detailsCount
    ) {
      detailsCount.textContent =
        String(count);
    }

    if (
      draftCount
    ) {
      draftCount.textContent =
        String(count);
    }

    if (!count) {
      if (
        detailsList
      ) {
        detailsList.innerHTML =
          `
            <div class="empty-state">
              <span>✨</span>

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
      }

      draftSection
        ?.classList
        .remove(
          "active"
        );

      saveAllButton
        ?.classList
        .remove(
          "visible"
        );

      return;
    }


    const cards =
      draftDetails
        .map(
          (
            d,
            index
          ) => `
            <article
              class="detected-detail-card"
            >

              <div
                class="detected-detail-icon"
              >
                ${iconFor(d)}
              </div>

              <div
                class="detected-detail-info"
              >

                <strong>
                  ${safeText(
                    d.title
                  )}
                </strong>

                <div
                  class="detected-detail-meta"
                >

                  <span>
                    ${safeText(
                      d.category
                    )}
                  </span>

                  ${
                    d.place
                      ? `
                          <span>
                            · ${safeText(
                              d.place
                            )}
                          </span>
                        `
                      : ""
                  }

                  <span
                    class="detail-time"
                  >
                    ▶ ${toTime(
                      d.timestampStart
                    )}
                  </span>

                  ${
                    d.confidence !=
                      null &&
                    d.automatic
                      ? `
                          <span>
                            ${Math.round(
                              d.confidence *
                              (
                                d.confidence <=
                                1
                                  ? 100
                                  : 1
                              )
                            )}%
                          </span>
                        `
                      : ""
                  }

                </div>

              </div>

              <div
                class="detected-detail-actions"
              >

                <button
                  type="button"
                  data-v06-edit="${index}"
                  aria-label="Editar"
                >
                  ✏️
                </button>

                <button
                  type="button"
                  data-v06-delete="${index}"
                  aria-label="Eliminar"
                >
                  🗑️
                </button>

              </div>

            </article>
          `
        )
        .join("");


    if (
      detailsList
    ) {
      detailsList.innerHTML =
        cards;
    }


    if (
      draftList
    ) {
      draftList.innerHTML =
        cards
          .replaceAll(
            "data-v06-edit",
            "data-v06-edit-summary"
          )
          .replaceAll(
            "data-v06-delete",
            "data-v06-delete-summary"
          );
    }


    draftSection
      ?.classList
      .add(
        "active"
      );

    saveAllButton
      ?.classList
      .add(
        "visible"
      );


    document
      .querySelectorAll(
        "[data-v06-edit], [data-v06-edit-summary]"
      )
      .forEach(
        button => {
          button.addEventListener(
            "click",
            () => {
              openEditor(
                Number(
                  button.dataset
                    .v06Edit ??
                  button.dataset
                    .v06EditSummary
                )
              );
            }
          );
        }
      );


    document
      .querySelectorAll(
        "[data-v06-delete], [data-v06-delete-summary]"
      )
      .forEach(
        button => {
          button.addEventListener(
            "click",
            () => {
              const index =
                Number(
                  button.dataset
                    .v06Delete ??
                  button.dataset
                    .v06DeleteSummary
                );

              draftDetails.splice(
                index,
                1
              );

              renderDetails();

              showToast(
                "Detalle eliminado"
              );
            }
          );
        }
      );
  }  // -------------------------------------------------------
  // BLOQUE 4 FINAL
  // GUARDAR 1 VÍDEO + VARIOS DETALLES EN SUPABASE
  // -------------------------------------------------------


  // -------------------------------------------------------
  // TÍTULO GENERAL DEL VÍDEO
  // -------------------------------------------------------

  function videoDraftTitle() {
    if (!draftDetails.length) {
      return "Vídeo de Mundo Infinito";
    }

    if (draftDetails.length === 1) {
      return (
        draftDetails[0].title ||
        "Vídeo de Mundo Infinito"
      );
    }

    const zone =
      draftDetails[0].place ||
      CONFIG.city ||
      "Brasil";

    return `Descubrimientos en ${zone}`;
  }


  // -------------------------------------------------------
  // DESCRIPCIÓN GENERAL DEL VÍDEO
  // -------------------------------------------------------

  function videoDraftDescription() {
    const names =
      draftDetails
        .slice(0, 5)
        .map(
          item =>
            item.title
        )
        .filter(Boolean);

    let description =
      names.join(" · ");

    if (
      draftDetails.length >
      5
    ) {
      description +=
        ` · +${draftDetails.length - 5} detalles`;
    }

    return description;
  }


  // -------------------------------------------------------
  // ACTUALIZAR LA APP SIN RECARGAR
  // -------------------------------------------------------

  function addPlaceToApp(
    place
  ) {
    if (!place) {
      return;
    }

    const existingIndex =
      places.findIndex(
        item =>
          String(item.id) ===
            String(place.id) ||
          (
            item.slug &&
            place.slug &&
            item.slug ===
              place.slug
          )
      );

    if (
      existingIndex >= 0
    ) {
      places[
        existingIndex
      ] = {
        ...places[
          existingIndex
        ],
        ...place,
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


  function addVideoToApp(
    video
  ) {
    if (!video) {
      return;
    }

    const existingIndex =
      videos.findIndex(
        item =>
          String(item.id) ===
            String(video.id) ||
          (
            video.sourceUrl &&
            item.sourceUrl ===
              video.sourceUrl
          )
      );

    if (
      existingIndex >= 0
    ) {
      videos[
        existingIndex
      ] = {
        ...videos[
          existingIndex
        ],
        ...video,
      };

      return;
    }

    videos.push(
      video
    );
  }


  function addDiscoveryToApp(
    discovery
  ) {
    if (!discovery) {
      return;
    }

    const exists =
      discoveries.some(
        item =>
          String(item.id) ===
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


  // -------------------------------------------------------
  // GUARDAR TODO
  // -------------------------------------------------------
  //
  // capture:true es IMPORTANTE.
  //
  // app.js v0.5 ya escucha el submit.
  // Este listener se ejecuta primero
  // y evita que después se ejecute
  // el formulario antiguo.
  // -------------------------------------------------------

  discoveryForm.addEventListener(
    "submit",
    async event => {
      event.preventDefault();
      event.stopImmediatePropagation();

      if (saving) {
        return;
      }

      if (
        !draftDetails.length
      ) {
        showToast(
          "Añade al menos un detalle"
        );

        openEditor();

        return;
      }


      // ---------------------------------------------------
      // NECESITAMOS EL ENLACE
      // ---------------------------------------------------

      const url =
        sourceUrl();

      if (
        !url &&
        !selectedFile
      ) {
        showToast(
          "Añade primero un vídeo o Reel"
        );

        return;
      }


      // ---------------------------------------------------
      // MP4 LOCAL
      // ---------------------------------------------------
      //
      // Todavía no tenemos Supabase Storage.
      // Una blob: URL solamente funciona
      // dentro de este navegador.
      // ---------------------------------------------------

      if (
        selectedFile &&
        !url
      ) {
        showToast(
          "Para compartir un vídeo subido desde tu dispositivo tenemos que conectar primero el almacenamiento."
        );

        return;
      }


      // ---------------------------------------------------
      // COMPROBAR CONEXIÓN
      // ---------------------------------------------------

      if (
        !supabaseClient ||
        !supabaseOnline
      ) {
        showToast(
          "No hay conexión con la base compartida"
        );

        return;
      }


      // ---------------------------------------------------
      // ESTADO DEL BOTÓN
      // ---------------------------------------------------

      saving = true;

      const oldButtonHTML =
        saveAllButton
          ?.innerHTML ||
        "✓ Guardar todo";

      if (
        saveAllButton
      ) {
        saveAllButton.disabled =
          true;

        saveAllButton.innerHTML =
          `
            <span>
              ⏳
            </span>

            Guardando…
          `;
      }


      try {

        // -------------------------------------------------
        // 1. GUARDAMOS EL VÍDEO UNA SOLA VEZ
        // -------------------------------------------------

        const savedVideo =
          await createSupabaseVideo({
            title:
              videoDraftTitle(),

            description:
              videoDraftDescription(),

            url,
          });


        if (!savedVideo) {
          throw new Error(
            "No se pudo crear el vídeo"
          );
        }


        addVideoToApp(
          savedVideo
        );


        // -------------------------------------------------
        // 2. GUARDAMOS CADA DETALLE
        // -------------------------------------------------

        const created =
          [];

        let firstPlace =
          null;


        for (
          const detail
          of draftDetails
        ) {

          // -----------------------------------------------
          // Coordenadas
          // -----------------------------------------------

          const center =
            map.getCenter();

          const lat =
            Number.isFinite(
              Number(
                detail.lat
              )
            )
              ? Number(
                  detail.lat
                )
              : center.lat;

          const lng =
            Number.isFinite(
              Number(
                detail.lng
              )
            )
              ? Number(
                  detail.lng
                )
              : center.lng;


          // -----------------------------------------------
          // Crear/reutilizar lugar
          // -----------------------------------------------

          const savedPlace =
            await createOrGetPlace({
              name:
                detail.title,

              zone:
                detail.place,

              category:
                detail.category ||
                detail.type ||
                "Lugar",

              description:
                detail.comment ||
                "Detalle encontrado en un vídeo de Mundo Infinito.",

              lat,
              lng,
            });


          if (!savedPlace) {
            throw new Error(
              `No se pudo guardar ${detail.title}`
            );
          }


          addPlaceToApp(
            savedPlace
          );


          if (!firstPlace) {
            firstPlace =
              savedPlace;
          }


          // -----------------------------------------------
          // Crear relación con el vídeo
          // -----------------------------------------------

          const savedDiscovery =
            await createSupabaseDiscovery({
              title:
                detail.title,

              description:
                detail.comment ||
                "",

              category:
                detail.category ||
                detail.type ||
                "Lugar",

              placeId:
                savedPlace.id,

              videoId:
                savedVideo.id,

              timestampStart:
                Number(
                  detail.timestampStart ||
                  0
                ),

              timestampEnd:
                detail.timestampEnd ==
                  null
                  ? null
                  : Number(
                      detail.timestampEnd
                    ),
            });


          addDiscoveryToApp(
            savedDiscovery
          );


          created.push(
            savedDiscovery
          );
        }


        // -------------------------------------------------
        // 3. MAPA
        // -------------------------------------------------

        renderMarkers();


        // -------------------------------------------------
        // 4. MENSAJE
        // -------------------------------------------------

        const total =
          created.length;

        showToast(
          total === 1
            ? "✓ 1 detalle guardado para todos"
            : `✓ ${total} detalles guardados para todos`
        );


        // -------------------------------------------------
        // 5. CERRAR
        // -------------------------------------------------

        draftDetails =
          [];

        editingIndex =
          null;

        closeAddDiscovery();


        // -------------------------------------------------
        // 6. IR AL PRIMER LUGAR
        // -------------------------------------------------

        if (
          firstPlace &&
          Number.isFinite(
            Number(
              firstPlace.lat
            )
          ) &&
          Number.isFinite(
            Number(
              firstPlace.lng
            )
          )
        ) {
          map.setView(
            [
              firstPlace.lat,
              firstPlace.lng,
            ],
            15
          );

          window.setTimeout(
            () => {
              openPlace(
                firstPlace.id
              );
            },
            300
          );
        }


      } catch (error) {
        console.error(
          "Mundo Infinito v0.6 · Error guardando:",
          error
        );

        showToast(
          "No se pudieron guardar todos los detalles"
        );

      } finally {
        saving = false;

        if (
          saveAllButton
        ) {
          saveAllButton.disabled =
            false;

          saveAllButton.innerHTML =
            oldButtonHTML;
        }
      }
    },
    true
  );


  // -------------------------------------------------------
  // CERRAR CON ESCAPE
  // -------------------------------------------------------

  document.addEventListener(
    "keydown",
    event => {
      if (
        event.key ===
        "Escape" &&
        manualEditor
          ?.classList
          .contains(
            "open"
          )
      ) {
        closeEditor();
      }
    }
  );


  // -------------------------------------------------------
  // INFORMACIÓN DE ARRANQUE
  // -------------------------------------------------------

  console.log(
    "✨ Mundo Infinito · Explorador de vídeos v0.6 cargado"
  );


})(); // FIN video-explorer v0.6
