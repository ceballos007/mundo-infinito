// =========================================================
// MUNDO INFINITO · video-explorer v0.6.2
// Extensión segura sobre app.js v0.5 estable
// Un vídeo -> varios detalles -> revisión -> Supabase
// =========================================================

"use strict";

(() => {

  // -------------------------------------------------------
  // DOM v0.6
  // -------------------------------------------------------

  const modalCard =
    discoveryModal?.querySelector(".discovery-v06-card");

  const videoLink =
    document.getElementById("discoveryVideoLink");

  const videoFile =
    document.getElementById("discoveryVideoFile");

  const videoPreview =
    document.getElementById("discoveryVideoPreview");

  const previewPlayer =
    document.getElementById("discoveryPreviewPlayer");

  const explorationStatus =
    document.getElementById("videoExplorationStatus");

  const explorationMessage =
    document.getElementById("explorationMessage");

  const progressBar =
    document.getElementById("explorationProgressBar");

  const resultsSection =
    document.getElementById("explorationResults");

  const detailsCount =
    document.getElementById("detectedDetailsCount");

  const detailsList =
    document.getElementById("detectedDetailsList");

  const addManualButton =
    document.getElementById("addManualDetailButton");

  const manualEditor =
    document.getElementById("manualDetailEditor");

  const detailType =
    document.getElementById("detailType");

  const titleInput =
    document.getElementById("discoveryTitle");

  const placeInput =
    document.getElementById("discoveryPlace");

  const categoryInput =
    document.getElementById("discoveryCategory");

  const commentInput =
    document.getElementById("discoveryComment");

  const startInput =
    document.getElementById("detailTimestampStart");

  const endInput =
    document.getElementById("detailTimestampEnd");

  const useCurrentTimeButton =
    document.getElementById("useCurrentVideoTime");

  const cancelEditButton =
    document.getElementById("cancelDetailEdit");

  const addDetailButton =
    document.getElementById("addDetailToDraft");

  const draftSection =
    document.getElementById("videoDraftSummary");

  const draftCount =
    document.getElementById("draftDetailsCount");

  const draftList =
    document.getElementById("videoDraftDetailsList");

  const saveAllButton =
    document.getElementById("saveAllDiscoveriesButton");


  if (
    !discoveryForm ||
    !modalCard ||
    !videoLink
  ) {

    console.warn(
      "Mundo Infinito v0.6.2: interfaz de exploración no disponible."
    );

    return;
  }


  // -------------------------------------------------------
  // Evitar que required bloquee campos ocultos
  // -------------------------------------------------------

  [
    titleInput,
    placeInput,
    categoryInput
  ].forEach(
    el => {

      if (el) {
        el.required = false;
      }

    }
  );


  // =======================================================
  // ESTADO
  // =======================================================

  let draftDetails = [];

  let editingIndex = null;

  let selectedFile = null;

  let selectedFileUrl = null;

  let uploadedVideoUrl = null;

  let uploadedVideoPath = null;

  let uploadingVideo = false;

  let explorationRun = 0;

  let linkDebounce = null;

  let saving = false;


  // =======================================================
  // ICONOS
  // =======================================================

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

    Otro: "✨"

  };


  // =======================================================
  // UTILIDADES DE TIEMPO
  // =======================================================

  function toSeconds(
    value
  ) {

    const text =
      String(
        value ?? ""
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
        Number(
          text
        )
      );

    }


    const parts =
      text
        .split(":")
        .map(Number);


    if (
      parts.some(
        number =>
          !Number.isFinite(
            number
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


  function toTime(
    value
  ) {

    const total =
      Math.max(
        0,
        Math.floor(
          Number(
            value
          ) || 0
        )
      );


    const hours =
      Math.floor(
        total / 3600
      );


    const minutes =
      Math.floor(
        (
          total % 3600
        ) / 60
      );


    const seconds =
      total % 60;


    if (
      hours > 0
    ) {

      return (
        `${hours}:` +
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`
      );

    }


    return (
      `${String(minutes).padStart(2, "0")}:` +
      `${String(seconds).padStart(2, "0")}`
    );

  }


  function iconFor(
    detail
  ) {

    return (
      ICONS[
        detail.type
      ] ||
      categoryIcons?.[
        detail.category
      ] ||
      "📍"
    );

  }


  function safeText(
    value
  ) {

    return (
      typeof escapeHTML ===
      "function"
    )

      ? escapeHTML(
          value
        )

      : String(
          value ?? ""
        );

  }


  function setProgress(
    percent,
    message
  ) {

    if (
      progressBar
    ) {

      progressBar.style.width =
        `${Math.max(
          0,
          Math.min(
            100,
            percent
          )
        )}%`;

    }


    if (
      explorationMessage &&
      message
    ) {

      explorationMessage.textContent =
        message;

    }

  }


  function sourceUrl() {
  // =======================================================
  // INFORMACIÓN DEL ENLACE SOCIAL
  // =======================================================

  function detectSocialPlatform(
    url
  ) {

    const text =
      String(
        url ||
        ""
      ).toLowerCase();


    if (
      text.includes(
        "instagram.com"
      )
    ) {

      return "instagram";

    }


    if (
      text.includes(
        "tiktok.com"
      )
    ) {

      return "tiktok";

    }


    return "other";

  }


  function extractHashtags(
    text
  ) {

    const matches =
      String(
        text ||
        ""
      ).match(
        /#[\p{L}\p{N}_]+/gu
      );


    return matches
      ? Array.from(
          new Set(
            matches
          )
        )
      : [];

  }


  function buildCombinedContext({
    transcript = null,
    caption = "",
    hashtags = []
  } = {}) {

    const parts =
      [];


    if (
      caption
    ) {

      parts.push(
        `DESCRIPCIÓN DEL POST:\n${caption}`
      );

    }


    if (
      hashtags?.length
    ) {

      parts.push(
        `HASHTAGS:\n${hashtags.join(" ")}`
      );

    }


    if (
      transcript?.visualText
    ) {

      parts.push(
        `TEXTO VISIBLE EN EL VÍDEO:\n${transcript.visualText}`
      );

    }


    /*
     * transcript.text en la v0.5 ya puede contener
     * principalmente OCR.
     *
     * Evitamos repetirlo si visualText es idéntico.
     */

    if (
      transcript?.text &&
      transcript.text !==
        transcript.visualText
    ) {

      parts.push(
        `TRANSCRIPCIÓN:\n${transcript.text}`
      );

    }


    if (
      transcript?.audioText
    ) {

      parts.push(
        `AUDIO:\n${transcript.audioText}`
      );

    }


    return parts
      .filter(
        Boolean
      )
      .join(
        "\n\n"
      )
      .trim();

  }
    return String(
      videoLink.value ||
      ""
    ).trim();

  }


  // =======================================================
  // RESET
  // =======================================================

  function clearObjectUrl() {

    if (
      selectedFileUrl
    ) {

      URL.revokeObjectURL(
        selectedFileUrl
      );

      selectedFileUrl =
        null;

    }

  }


  function resetEditor() {

    editingIndex =
      null;


    if (detailType) {
      detailType.value =
        "Lugar";
    }


    if (titleInput) {
      titleInput.value =
        "";
    }


    if (placeInput) {
      placeInput.value =
        "";
    }


    if (categoryInput) {
      categoryInput.value =
        "";
    }


    if (commentInput) {
      commentInput.value =
        "";
    }


    if (startInput) {
      startInput.value =
        "00:00";
    }


    if (endInput) {
      endInput.value =
        "";
    }


    if (discoveryLat) {
      discoveryLat.value =
        "";
    }


    if (discoveryLng) {
      discoveryLng.value =
        "";
    }


    cancelEditButton
      ?.classList
      .add(
        "hidden"
      );


    if (
      addDetailButton
    ) {

      addDetailButton.textContent =
        "＋ Añadir detalle";

    }

  }


  function resetFlow() {

    explorationRun +=
      1;


    clearTimeout(
      linkDebounce
    );


    draftDetails =
      [];


    selectedFile =
      null;


    uploadedVideoUrl =
      null;


    uploadedVideoPath =
      null;


    uploadingVideo =
      false;


    clearObjectUrl();


    resetEditor();


    modalCard.classList.remove(
      "is-exploring",
      "has-results"
    );


    explorationStatus
      ?.classList
      .remove(
        "active"
      );


    resultsSection
      ?.classList
      .remove(
        "active"
      );


    draftSection
      ?.classList
      .remove(
        "active"
      );


    manualEditor
      ?.classList
      .remove(
        "open"
      );


    saveAllButton
      ?.classList
      .remove(
        "visible"
      );


    if (
      detailsList
    ) {

      detailsList.innerHTML =
        "";

    }


    if (
      draftList
    ) {

      draftList.innerHTML =
        "";

    }


    if (
      detailsCount
    ) {

      detailsCount.textContent =
        "0";

    }


    if (
      draftCount
    ) {

      draftCount.textContent =
        "0";

    }


    if (
      videoPreview
    ) {

      videoPreview.classList.add(
        "hidden"
      );

    }


    if (
      previewPlayer
    ) {

      previewPlayer.pause();

      previewPlayer.removeAttribute(
        "src"
      );

      previewPlayer.load();

    }


    setProgress(
      0,
      "Preparando el contenido…"
    );

  }


  function showExploring() {

    modalCard.classList.remove(
      "has-results"
    );


    modalCard.classList.add(
      "is-exploring"
    );


    explorationStatus
      ?.classList
      .add(
        "active"
      );


    resultsSection
      ?.classList
      .remove(
        "active"
      );


    manualEditor
      ?.classList
      .remove(
        "open"
      );


    saveAllButton
      ?.classList
      .remove(
        "visible"
      );

  }


  function showResults() {

    modalCard.classList.remove(
      "is-exploring"
    );


    modalCard.classList.add(
      "has-results"
    );


    explorationStatus
      ?.classList
      .remove(
        "active"
      );


    resultsSection
      ?.classList
      .add(
        "active"
      );


    renderDetails();

  }


  // =======================================================
  // APERTURA DEL MODAL
  // =======================================================

  openDiscoveryModal
    ?.addEventListener(
      "click",
      () => {

        resetFlow();


        window.setTimeout(
          () => {

            videoLink.focus();

          },
          120
        );

      }
    );


  closeDiscoveryModal
    ?.addEventListener(
      "click",
      () => {

        explorationRun +=
          1;


        clearObjectUrl();

      }
    );


  // =======================================================
  // SUPABASE STORAGE
  // =======================================================

  function safeVideoExtension(
    file
  ) {

    const byName =
      String(
        file?.name ||
        ""
      )
        .split(".")
        .pop()
        ?.toLowerCase();


    const known = {

      "video/mp4":
        "mp4",

      "video/quicktime":
        "mov",

      "video/webm":
        "webm",

      "video/x-m4v":
        "m4v"

    };


    return (

      known[
        file?.type
      ]

      ||

      (
        byName &&
        /^[a-z0-9]{2,5}$/.test(
          byName
        )

          ? byName

          : "mp4"
      )

    );

  }


  async function uploadVideoToStorage(
    file
  ) {

    if (!file) {

      throw new Error(
        "No se ha seleccionado ningún vídeo."
      );

    }


    if (
      !supabaseClient ||
      !supabaseOnline
    ) {

      throw new Error(
        "No hay conexión con Supabase."
      );

    }


    const extension =
      safeVideoExtension(
        file
      );


    const uniqueId =

      crypto.randomUUID

        ? crypto.randomUUID()

        : `${Date.now()}-${Math.random()
            .toString(16)
            .slice(2)}`;


    const filePath =
      `uploads/${uniqueId}.${extension}`;


    const {
      data,
      error
    } =

      await supabaseClient
        .storage
        .from(
          "videos"
        )
        .upload(
          filePath,
          file,
          {

            cacheControl:
              "3600",

            upsert:
              false,

            contentType:
              file.type ||
              "video/mp4"

          }
        );


    if (
      error
    ) {

      throw error;

    }


    const {
      data:
        publicData
    } =

      supabaseClient
        .storage
        .from(
          "videos"
        )
        .getPublicUrl(
          data.path
        );


    const publicUrl =
      publicData
        ?.publicUrl;


    if (
      !publicUrl
    ) {

      throw new Error(
        "Supabase no devolvió la URL pública del vídeo."
      );

    }


    return {

      path:
        data.path,

      url:
        publicUrl

    };

  }  // =======================================================
  // SELECCIONAR VÍDEO
  // =======================================================

  videoFile
    ?.addEventListener(
      "change",
      async () => {

        const file =
          videoFile
            .files?.[0];


        if (!file) {

          return;

        }


        selectedFile =
          file;


        uploadedVideoUrl =
          null;


        uploadedVideoPath =
          null;


        // -----------------------------------------------
        // PREVISUALIZACIÓN LOCAL
        // -----------------------------------------------

        clearObjectUrl();


        selectedFileUrl =
          URL.createObjectURL(
            file
          );


        if (
          previewPlayer
        ) {

          previewPlayer.src =
            selectedFileUrl;


          previewPlayer.load();

        }


        videoPreview
          ?.classList
          .remove(
            "hidden"
          );


        // -----------------------------------------------
        // SUBIR A STORAGE
        // -----------------------------------------------

        try {

          uploadingVideo =
            true;


          showToast?.(
            "📤 Subiendo vídeo a Mundo Infinito…"
          );


          setProgress(
            8,
            "Guardando el vídeo…"
          );


          const uploaded =
            await uploadVideoToStorage(
              file
            );


          uploadedVideoUrl =
            uploaded.url;


          uploadedVideoPath =
            uploaded.path;


          console.log(
            "☁️ Vídeo guardado:",
            uploadedVideoPath
          );


          console.log(
            "🔗 URL del vídeo:",
            uploadedVideoUrl
          );


          showToast?.(
            "✅ Vídeo guardado"
          );


                    // =============================================
          // ANALIZAR EN SERVIDOR CON GEMINI
          // =============================================

          setProgress(
            30,
            "Analizando el vídeo con IA…"
          );


          console.log(
            "🧠 Enviando vídeo a Gemini:",
            uploadedVideoUrl
          );


          await exploreVideo({

            type:
              "file",

            file,

            url:
              uploadedVideoUrl,

            storagePath:
              uploadedVideoPath,

            transcript:
              null

          });


        } catch (
          error
        ) {

          console.error(
            "Mundo Infinito v0.6.2 · Error subiendo vídeo:",
            error
          );


          showToast?.(
            "No se pudo subir o analizar el vídeo"
          );


        } finally {

          uploadingVideo =
            false;

        }

      }
    );
  // =======================================================
  // CONVERTIR TRANSCRIPCIÓN EN DETALLES
  // =======================================================

  function detailsFromTranscript(
    transcript
  ) {

    if (
      !transcript
    ) {

      return [];

    }


    const results =
      [];


    const chunks =
      Array.isArray(
        transcript.chunks
      )
        ? transcript.chunks
        : [];


    const fullText =
      String(
        transcript.text ||
        transcript.visualText ||
        ""
      ).trim();


    // =====================================================
    // UTILIDADES
    // =====================================================

    function normalize(
      text
    ) {

      return String(
        text ||
        ""
      )
        .normalize(
          "NFD"
        )
        .replace(
          /[\u0300-\u036f]/g,
          ""
        )
        .toLowerCase();

    }


    function createDetail({

      title,

      place,

      type,

      category,

      comment,

      timestampStart = 0,

      confidence = 0.8

    }) {

      return {

        id:
          crypto.randomUUID

            ? crypto.randomUUID()

            : `auto-${Date.now()}-${Math.random()}`,


        title,

        place,

        type,

        category,

        comment,


        timestampStart:
          Number(
            timestampStart ||
            0
          ),


        timestampEnd:
          null,


        lat:
          null,


        lng:
          null,


        confidence,


        automatic:
          true

      };

    }


    function pushUnique(
      detail
    ) {

      const key =
        [
          normalize(
            detail.type
          ),

          normalize(
            detail.title
          ),

          Math.floor(
            Number(
              detail.timestampStart ||
              0
            ) / 3
          )
        ].join(
          "|"
        );


      const exists =
        results.some(
          item => {

            const itemKey =
              [
                normalize(
                  item.type
                ),

                normalize(
                  item.title
                ),

                Math.floor(
                  Number(
                    item.timestampStart ||
                    0
                  ) / 3
                )
              ].join(
                "|"
              );


            return (
              itemKey ===
              key
            );

          }
        );


      if (
        !exists
      ) {

        results.push(
          detail
        );

      }

    }


    // =====================================================
    // DICCIONARIOS
    // =====================================================

    const places = [

      "Rio de Janeiro",
      "Río de Janeiro",

      "Copacabana",
      "Ipanema",
      "Leblon",
      "Lapa",
      "Santa Teresa",
      "Botafogo",
      "Arpoador",
      "Urca",
      "Lagoa",
      "Flamengo",
      "Gávea",
      "Gavea",
      "São Conrado",
      "Sao Conrado",
      "Barra da Tijuca",
      "Recreio",

      "Cristo Redentor",
      "Corcovado",

      "Pão de Açúcar",
      "Pao de Acucar",

      "Escadaria Selarón",
      "Escadaria Selaron",

      "Maracanã",
      "Maracana",

      "Jardim Botânico",
      "Jardim Botanico",

      "Ilha Grande",
      "Lopes Mendes"

    ];


    const airportTerms = [

      "aeroporto",
      "aeropuerto",

      "galeao",
      "galeão",

      "gig",

      "santos dumont",

      "sdu"

    ];


    const transportTerms = [

      "uber",
      "99",
      "99pop",
      "taxi",
      "táxi",

      "metro",
      "metrô",

      "onibus",
      "ônibus",
      "autobus",
      "autobús",

      "transfer",

      "van",

      "trem",
      "tren"

    ];


    const adviceTerms = [

      "erro",
      "error",

      "cuidado",

      "evita",
      "evitar",

      "nao faca",
      "não faça",
      "no hagas",

      "recomendo",
      "recomiendo",
      "recomendamos",

      "dica",
      "consejo",

      "importante",

      "vale a pena",
      "vale la pena",

      "tem que",
      "hay que",

      "turista",
      "turistas"

    ];


    const restaurantTerms = [

      "restaurante",
      "restaurant",

      "bar",

      "boteco",

      "cafeteria",
      "café",
      "cafe",

      "comer",
      "comida"

    ];


    const beachTerms = [

      "praia",
      "playa",
      "beach"

    ];


    const shoppingTerms = [

      "shopping",

      "compras",

      "loja",
      "tienda",

      "mercado"

    ];


    const priceRegex =
      /(?:R\$|RS|\$|€)\s?\d+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?\s?(?:reais|real|euros?)/gi;


    // =====================================================
    // ANALIZAR UN TEXTO
    // =====================================================

    function analyzeText(
      text,
      timestamp = 0
    ) {

      const cleanText =
        String(
          text ||
          ""
        ).trim();


      if (
        !cleanText
      ) {

        return;

      }


      const normalized =
        normalize(
          cleanText
        );


      // ===================================================
      // LUGARES
      // ===================================================

      places.forEach(
        placeName => {

          if (
            normalized.includes(
              normalize(
                placeName
              )
            )
          ) {

            pushUnique(
              createDetail({

                title:
                  placeName,

                place:
                  placeName,

                type:
                  "Lugar",

                category:
                  "Lugar",

                comment:
                  cleanText,

                timestampStart:
                  timestamp,

                confidence:
                  0.92

              })
            );

          }

        }
      );


      // ===================================================
      // AEROPUERTO
      // ===================================================

      const hasAirport =
        airportTerms.some(
          term =>
            normalized.includes(
              normalize(
                term
              )
            )
        );


      if (
        hasAirport
      ) {

        const isRio =
          normalized.includes(
            "rio de janeiro"
          );


        let airportTitle =
          "Aeropuerto";


        if (
          normalized.includes(
            "galeao"
          ) ||
          normalized.includes(
            "gig"
          )
        ) {

          airportTitle =
            "Aeropuerto Internacional de Galeão";

        } else if (
          normalized.includes(
            "santos dumont"
          ) ||
          normalized.includes(
            "sdu"
          )
        ) {

          airportTitle =
            "Aeropuerto Santos Dumont";

        } else if (
          isRio
        ) {

          airportTitle =
            "Aeropuerto de Río de Janeiro";

        }


        pushUnique(
          createDetail({

            title:
              airportTitle,

            place:
              isRio
                ? "Río de Janeiro"
                : airportTitle,

            type:
              "Lugar",

            category:
              "Lugar",

            comment:
              cleanText,

            timestampStart:
              timestamp,

            confidence:
              0.9

          })
        );

      }


      // ===================================================
      // TRANSPORTE
      // ===================================================

      const detectedTransport =
        transportTerms.find(
          term =>
            normalized.includes(
              normalize(
                term
              )
            )
        );


      if (
        detectedTransport
      ) {

        let transportTitle =
          detectedTransport;


        if (
          normalize(
            detectedTransport
          ) ===
          "uber"
        ) {

          transportTitle =
            hasAirport
              ? "Uber en el aeropuerto"
              : "Uber";

        }


        pushUnique(
          createDetail({

            title:
              transportTitle,

            place:
              normalized.includes(
                "rio de janeiro"
              )
                ? "Río de Janeiro"
                : CONFIG.city ||
                  "Río de Janeiro",

            type:
              "Transporte",

            category:
              "Transporte",

            comment:
              cleanText,

            timestampStart:
              timestamp,

            confidence:
              0.9

          })
        );

      }


      // ===================================================
      // CONSEJO / AVISO
      // ===================================================

      const hasAdvice =
        adviceTerms.some(
          term =>
            normalized.includes(
              normalize(
                term
              )
            )
        );


      if (
        hasAdvice
      ) {

        let adviceTitle =
          "Consejo del vídeo";


        if (
          normalized.includes(
            "error"
          ) ||
          normalized.includes(
            "erro"
          )
        ) {

          adviceTitle =
            normalized.includes(
              "turista"
            )
              ? "Error habitual de los turistas"
              : "Error que conviene evitar";

        }


        if (
          hasAirport &&
          detectedTransport
        ) {

          adviceTitle =
            "Consejo de transporte en el aeropuerto";

        }


        pushUnique(
          createDetail({

            title:
              adviceTitle,

            place:
              normalized.includes(
                "rio de janeiro"
              )
                ? "Río de Janeiro"
                : CONFIG.city ||
                  "Río de Janeiro",

            type:
              "Consejo",

            category:
              "Consejo",

            comment:
              cleanText,

            timestampStart:
              timestamp,

            confidence:
              0.85

          })
        );

      }


      // ===================================================
      // RESTAURANTE / BAR
      // ===================================================

      const restaurantWord =
        restaurantTerms.find(
          term =>
            normalized.includes(
              normalize(
                term
              )
            )
        );


      if (
        restaurantWord
      ) {

        pushUnique(
          createDetail({

            title:
              "Lugar para comer o beber",

            place:
              CONFIG.city ||
              "Río de Janeiro",

            type:
              "Restaurante",

            category:
              "Restaurante",

            comment:
              cleanText,

            timestampStart:
              timestamp,

            confidence:
              0.72

          })
        );

      }


      // ===================================================
      // PLAYA
      // ===================================================

      const hasBeach =
        beachTerms.some(
          term =>
            normalized.includes(
              normalize(
                term
              )
            )
        );


      if (
        hasBeach
      ) {

        pushUnique(
          createDetail({

            title:
              "Playa mencionada en el vídeo",

            place:
              CONFIG.city ||
              "Brasil",

            type:
              "Playa",

            category:
              "Playa",

            comment:
              cleanText,

            timestampStart:
              timestamp,

            confidence:
              0.72

          })
        );

      }


      // ===================================================
      // COMPRAS
      // ===================================================

      const hasShopping =
        shoppingTerms.some(
          term =>
            normalized.includes(
              normalize(
                term
              )
            )
        );


      if (
        hasShopping
      ) {

        pushUnique(
          createDetail({

            title:
              "Compras",

            place:
              CONFIG.city ||
              "Río de Janeiro",

            type:
              "Compras",

            category:
              "Compras",

            comment:
              cleanText,

            timestampStart:
              timestamp,

            confidence:
              0.7

          })
        );

      }


      // ===================================================
      // PRECIOS
      // ===================================================

      const prices =
        cleanText.match(
          priceRegex
        );


      prices?.forEach(
        price => {

          pushUnique(
            createDetail({

              title:
                price,

              place:
                CONFIG.city ||
                "Río de Janeiro",

              type:
                "Precio",

              category:
                "Consejo",

              comment:
                cleanText,

              timestampStart:
                timestamp,

              confidence:
                0.88

            })
          );

        }
      );

    }


    // =====================================================
    // CHUNKS DEL OCR / AUDIO
    // =====================================================

    chunks.forEach(
      chunk => {

        const text =
          String(
            chunk.text ||
            ""
          ).trim();


        let timestamp =
          0;


        if (
          Array.isArray(
            chunk.timestamp
          )
        ) {

          timestamp =
            Number(
              chunk.timestamp[0] ||
              0
            );

        }


        analyzeText(
          text,
          timestamp
        );

      }
    );


    // =====================================================
    // SI NO HAY CHUNKS, ANALIZAR TEXTO COMPLETO
    // =====================================================

    if (
      !chunks.length &&
      fullText
    ) {

      analyzeText(
        fullText,
        0
      );

    }


    console.log(
      "🔎 Detalles detectados:",
      results
    );


    return results;

  }

    if (
      !transcript
    ) {

      return [];

    }


    const results =
      [];


    const chunks =
      Array.isArray(
        transcript.chunks
      )

        ? transcript.chunks

        : [];


    const fullText =
      String(
        transcript.text ||
        ""
      ).trim();


    // =====================================================
    // PRECIOS
    // =====================================================

    const priceRegex =
      /(?:R\$|RS|\$)\s?\d+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?\s?(?:reais|real)/gi;


    // =====================================================
    // LUGARES CONOCIDOS
    // =====================================================

    const knownPlaces = [

      "Copacabana",
      "Ipanema",
      "Leblon",
      "Lapa",
      "Santa Teresa",
      "Botafogo",
      "Arpoador",
      "Urca",
      "Lagoa",
      "Flamengo",
      "Gávea",
      "Gavea",
      "São Conrado",
      "Sao Conrado",
      "Barra da Tijuca",
      "Recreio",
      "Centro",

      "Cristo Redentor",
      "Corcovado",

      "Pão de Açúcar",
      "Pao de Acucar",

      "Escadaria Selarón",
      "Escadaria Selaron",

      "Maracanã",
      "Maracana",

      "Jardim Botânico",
      "Jardim Botanico",

      "Ilha Grande",
      "Lopes Mendes"

    ];


    // =====================================================
    // PALABRAS DE CONSEJO
    // =====================================================

    const adviceWords = [

      "recomendo",
      "recomienda",
      "recomiendo",
      "recomendamos",

      "vale a pena",
      "vale la pena",

      "melhor",
      "mejor",

      "cuidado",

      "importante",

      "tem que",
      "tienes que",
      "hay que",

      "evita",
      "evitar",

      "não esquece",
      "nao esquece",
      "no olvides",

      "dica",
      "consejo"

    ];


    // =====================================================
    // CREAR DETALLE
    // =====================================================

    function createDetail({
      title,
      place,
      type,
      category,
      comment,
      timestampStart = 0,
      confidence = 0.7
    }) {

      return {

        id:
          crypto.randomUUID

            ? crypto.randomUUID()

            : `auto-${Date.now()}-${Math.random()}`,


        title,

        place,

        type,

        category,

        comment,


        timestampStart:
          Number(
            timestampStart ||
            0
          ),


        timestampEnd:
          null,


        lat:
          null,


        lng:
          null,


        confidence,


        automatic:
          true

      };

    }


    // =====================================================
    // ANALIZAR CHUNKS DE WHISPER
    // =====================================================

    chunks.forEach(
      chunk => {

        const text =
          String(
            chunk.text ||
            ""
          ).trim();


        if (
          !text
        ) {

          return;

        }


        const lowerText =
          text.toLowerCase();


        let timestamp =
          0;


        if (
          Array.isArray(
            chunk.timestamp
          )
        ) {

          timestamp =
            Number(
              chunk.timestamp[0] ||
              0
            );

        } else if (
          Array.isArray(
            chunk.timestamps
          )
        ) {

          timestamp =
            Number(
              chunk.timestamps[0] ||
              0
            );

        }


        // -------------------------------------------------
        // LUGARES
        // -------------------------------------------------

        knownPlaces.forEach(
          placeName => {

            if (
              !lowerText.includes(
                placeName.toLowerCase()
              )
            ) {

              return;

            }


            const exists =
              results.some(
                detail =>

                  detail.type ===
                    "Lugar" &&

                  detail.title
                    .toLowerCase() ===
                    placeName
                      .toLowerCase() &&

                  Math.abs(
                    detail.timestampStart -
                    timestamp
                  ) < 3
              );


            if (
              exists
            ) {

              return;

            }


            results.push(
              createDetail({

                title:
                  placeName,

                place:
                  placeName,

                type:
                  "Lugar",

                category:
                  "Lugar",

                comment:
                  text,

                timestampStart:
                  timestamp,

                confidence:
                  0.9

              })
            );

          }
        );


        // -------------------------------------------------
        // PRECIOS
        // -------------------------------------------------

        const prices =
          text.match(
            priceRegex
          );


        prices?.forEach(
          price => {

            results.push(
              createDetail({

                title:
                  price,

                place:
                  CONFIG.city ||
                  "Río de Janeiro",

                type:
                  "Precio",

                category:
                  "Consejo",

                comment:
                  text,

                timestampStart:
                  timestamp,

                confidence:
                  0.85

              })
            );

          }
        );


        // -------------------------------------------------
        // CONSEJOS
        // -------------------------------------------------

        const isAdvice =
          adviceWords.some(
            word =>
              lowerText.includes(
                word
              )
          );


        if (
          isAdvice
        ) {

          results.push(
            createDetail({

              title:
                "Consejo del vídeo",

              place:
                CONFIG.city ||
                "Río de Janeiro",

              type:
                "Consejo",

              category:
                "Consejo",

              comment:
                text,

              timestampStart:
                timestamp,

              confidence:
                0.75

            })
          );

        }

      }
    );


    // =====================================================
    // FALLBACK SI NO HAY CHUNKS
    // =====================================================

    if (
      !chunks.length &&
      fullText
    ) {

      const lowerFullText =
        fullText.toLowerCase();


      // ---------------------------------------------------
      // LUGARES
      // ---------------------------------------------------

      knownPlaces.forEach(
        placeName => {

          if (
            !lowerFullText.includes(
              placeName.toLowerCase()
            )
          ) {

            return;

          }


          results.push(
            createDetail({

              title:
                placeName,

              place:
                placeName,

              type:
                "Lugar",

              category:
                "Lugar",

              comment:
                fullText,

              timestampStart:
                0,

              confidence:
                0.7

            })
          );

        }
      );


      // ---------------------------------------------------
      // PRECIOS
      // ---------------------------------------------------

      const prices =
        fullText.match(
          priceRegex
        );


      prices?.forEach(
        price => {

          results.push(
            createDetail({

              title:
                price,

              place:
                CONFIG.city ||
                "Río de Janeiro",

              type:
                "Precio",

              category:
                "Consejo",

              comment:
                fullText,

              timestampStart:
                0,

              confidence:
                0.65

            })
          );

        }
      );


      // ---------------------------------------------------
      // CONSEJOS
      // ---------------------------------------------------

      const hasAdvice =
        adviceWords.some(
          word =>
            lowerFullText.includes(
              word
            )
        );


      if (
        hasAdvice
      ) {

        results.push(
          createDetail({

            title:
              "Consejo del vídeo",

            place:
              CONFIG.city ||
              "Río de Janeiro",

            type:
              "Consejo",

            category:
              "Consejo",

            comment:
              fullText,

            timestampStart:
              0,

            confidence:
              0.6

          })
        );

      }

    }


    // =====================================================
    // ELIMINAR DUPLICADOS
    // =====================================================

    const unique =
      [];


    const keys =
      new Set();


    results.forEach(
      detail => {

        const key =
          [
            detail.type,

            String(
              detail.title
            ).toLowerCase(),

            Math.floor(
              Number(
                detail.timestampStart ||
                0
              ) / 3
            )
          ].join(
            "|"
          );


        if (
          keys.has(
            key
          )
        ) {

          return;

        }


        keys.add(
          key
        );


        unique.push(
          detail
        );

      }
    );


    console.log(
      "🔎 Detalles detectados localmente:",
      unique
    );


    return unique;

  }


  // =======================================================
  // PEGAR ENLACE
  // =======================================================

  videoLink.addEventListener(
    "input",
    () => {

      clearTimeout(
        linkDebounce
      );


      const url =
        sourceUrl();


      if (
        !url ||
        url.length < 8
      ) {

        return;

      }


      linkDebounce =
        window.setTimeout(
          () => {

            exploreVideo({

              type:
                "url",

              url

            });

          },
          750
        );

    }
  );


  // =======================================================
  // FASES DE EXPLORACIÓN
  // =======================================================

  const explorationPhases = [

    {
      progress:
        8,

      message:
        "Preparando el vídeo…"
    },

    {
      progress:
        22,

      message:
        "Escuchando lo que cuentan…"
    },

    {
      progress:
        38,

      message:
        "Localizando lugares mencionados…"
    },

    {
      progress:
        54,

      message:
        "Buscando restaurantes y recomendaciones…"
    },

    {
      progress:
        68,

      message:
        "Identificando consejos útiles…"
    },

    {
      progress:
        82,

      message:
        "Localizando momentos del vídeo…"
    },

    {
      progress:
        94,

      message:
        "Organizando los detalles…"
    }

  ];


  // =======================================================
  // ANIMAR EXPLORACIÓN
  // =======================================================

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


  // =======================================================
  // EXPLORAR VÍDEO
  // =======================================================

  async function exploreVideo(
    source
  ) {

    const runId =
      ++explorationRun;


    draftDetails =
      [];


    editingIndex =
      null;


    renderDetails();


    showExploring();


    setProgress(
      4,
      "Explorando detalles del vídeo…"
    );


    const animation =
      animateExploration(
        runId
      );


    let automaticDetails =
      [];


    try {

      // ---------------------------------------------------
      // PRIMERO EDGE FUNCTION
      // ---------------------------------------------------

      automaticDetails =
        await requestAutomaticAnalysis(
          source
        );


      // ---------------------------------------------------
      // SI EDGE NO DEVUELVE NADA,
      // USAR LA TRANSCRIPCIÓN LOCAL
      // ---------------------------------------------------

      if (
        (
          !Array.isArray(
            automaticDetails
          ) ||
          automaticDetails.length === 0
        ) &&
        source.transcript &&
        typeof detailsFromTranscript === "function"
      ) {

        console.log(
          "🧠 Analizando la transcripción local…"
        );


        automaticDetails =
          detailsFromTranscript(
            source.transcript
          );


        console.log(
          "✨ Detalles obtenidos de la transcripción:",
          automaticDetails
        );

      }


    } catch (
      error
    ) {

      console.warn(
        "Mundo Infinito v0.6.2: análisis automático no disponible.",
        error
      );


      if (
        source.transcript &&
        typeof detailsFromTranscript === "function"
      ) {

           try {

      // ---------------------------------------------------
      // ANALIZAR EN SERVIDOR CON GEMINI
      // ---------------------------------------------------

      console.log(
        "🧠 Enviando vídeo a analyze-video…"
      );


      automaticDetails =
        await requestAutomaticAnalysis(
          source
        );


      console.log(
        "✨ Respuesta automática de Gemini:",
        automaticDetails
      );


      if (
        !Array.isArray(
          automaticDetails
        )
      ) {

        automaticDetails =
          [];

      }


    } catch (
      error
    ) {

      console.error(
        "❌ Error analizando el vídeo con Gemini:",
        error
      );


      automaticDetails =
        [];


      showToast?.(
        "No se pudo analizar automáticamente el vídeo"
      );

    }


    if (
      runId !==
      explorationRun
    ) {

      return;

    }


    // =====================================================
    // HEMOS ENCONTRADO DETALLES
    // =====================================================

    if (
      Array.isArray(
        automaticDetails
      ) &&
      automaticDetails.length > 0
    ) {

      draftDetails =
        automaticDetails
          .map(
            normalizeAutomaticDetail
          )
          .filter(
            Boolean
          );


      console.log(
        "📋 Detalles normalizados:",
        draftDetails
      );


      if (
        draftDetails.length > 0
      ) {

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

    }


    // =====================================================
    // NO HA ENCONTRADO DETALLES
    // =====================================================

    setProgress(
      100,
      "Vídeo preparado"
    );


    showResults();


    showToast?.(
      "✨ Vídeo preparado para revisar"
    );


    openEditor();

  }  // =======================================================
  // ANALIZADOR AUTOMÁTICO / EDGE FUNCTION
  // =======================================================

  async function requestAutomaticAnalysis(
    source
  ) {

    if (
      !supabaseClient ||
      !supabaseOnline
    ) {

      return [];

    }


    /*
     * Si es un archivo local, solo podemos enviarlo
     * cuando ya tiene una URL pública de Storage.
     */

    if (
      source.type ===
        "file" &&
      (
        !source.url ||
        String(
          source.url
        ).startsWith(
          "blob:"
        )
      )
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
        error
      } =

        await supabaseClient
          .functions
          .invoke(
            "analyze-video",
            {

                           body: {

                video_url:
                  source.url,

                source_url:
                  source.url,

                storage_path:
                  source.storagePath ||
                  null,

                source_type:
                  source.type ||
                  null,


                // -----------------------------------------
                // RED SOCIAL
                // -----------------------------------------

                platform:
                  detectSocialPlatform(
                    source.url
                  ),


                caption:
                  source.caption ||
                  "",


                author:
                  source.author ||
                  "",


                hashtags:
                  source.hashtags ||
                  extractHashtags(
                    source.caption ||
                    ""
                  ),


                // -----------------------------------------
                // OCR / AUDIO
                // -----------------------------------------

                transcript:
                  source.transcript ||
                  null,


                visual_text:
                  source.transcript
                    ?.visualText ||
                  "",


                audio_text:
                  source.transcript
                    ?.audioText ||
                  "",


                // -----------------------------------------
                // TODO EL CONTEXTO JUNTO
                // -----------------------------------------

                combined_context:
                  buildCombinedContext({

                    transcript:
                      source.transcript,

                    caption:
                      source.caption ||
                      "",

                    hashtags:
                      source.hashtags ||
                      extractHashtags(
                        source.caption ||
                        ""
                      )

                  }),


                city:
                  CONFIG?.city ||
                  "Río de Janeiro",


                country:
                  CONFIG?.country ||
                  "Brasil"

              }

                storage_path:
                  source.storagePath ||
                  null,

                source_type:
                  source.type ||
                  null,

                transcript:
                  source.transcript ||
                  null,

                city:
                  CONFIG?.city ||
                  "Río de Janeiro",

                country:
                  CONFIG?.country ||
                  "Brasil"

              }

            }
          );


      if (
        error
      ) {

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


    } catch (
      error
    ) {

      console.info(
        "Exploración automática pendiente:",
        error
      );


      return [];

    }

  }


  // =======================================================
  // NORMALIZAR RESULTADOS AUTOMÁTICOS
  // =======================================================

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


    if (
      !title
    ) {

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
        toSeconds(
          end
        );

    }


    if (
      end !== null &&
      !Number.isFinite(
        Number(
          end
        )
      )
    ) {

      end =
        null;

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


    if (
      !Number.isFinite(
        lat
      )
    ) {

      lat =
        null;

    }


    if (
      !Number.isFinite(
        lng
      )
    ) {

      lng =
        null;

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
              Number(
                end
              )
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


      automatic:
        true

    };

  }


  // =======================================================
  // EDITOR MANUAL
  // =======================================================

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
      index ===
      null
    ) {

      resetEditor();

    } else {

      const detail =
        draftDetails[
          index
        ];


      if (
        !detail
      ) {

        return;

      }


      if (
        detailType
      ) {

        detailType.value =
          detail.type ||
          "Lugar";

      }


      if (
        titleInput
      ) {

        titleInput.value =
          detail.title ||
          "";

      }


      if (
        placeInput
      ) {

        placeInput.value =
          detail.place ||
          "";

      }


      if (
        categoryInput
      ) {

        categoryInput.value =
          detail.category ||
          "";

      }


      if (
        commentInput
      ) {

        commentInput.value =
          detail.comment ||
          "";

      }


      if (
        startInput
      ) {

        startInput.value =
          toTime(
            detail.timestampStart
          );

      }


      if (
        endInput
      ) {

        endInput.value =

          detail.timestampEnd ==
          null

            ? ""

            : toTime(
                detail.timestampEnd
              );

      }


      if (
        discoveryLat
      ) {

        discoveryLat.value =
          detail.lat ??
          "";

      }


      if (
        discoveryLng
      ) {

        discoveryLng.value =
          detail.lng ??
          "";

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


    window.setTimeout(
      () => {

        manualEditor
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
      () => {

        closeEditor();

      }
    );


  // =======================================================
  // USAR MOMENTO ACTUAL DEL VÍDEO
  // =======================================================

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
            previewPlayer
              .currentTime ||
            0
          );


        startInput.value =
          toTime(
            current
          );


        showToast?.(
          `⏱ ${toTime(current)}`
        );

      }
    );


  // =======================================================
  // TIPO -> CATEGORÍA
  // =======================================================

  detailType
    ?.addEventListener(
      "change",
      () => {

        if (
          !categoryInput
        ) {

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
            "Lugar"

        };


        const suggested =
          suggestions[
            detailType.value
          ];


        if (
          suggested
        ) {

          categoryInput.value =
            suggested;

        }

      }
    );


  // =======================================================
  // NORMALIZAR TIMESTAMPS
  // =======================================================

  startInput
    ?.addEventListener(
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


  endInput
    ?.addEventListener(
      "blur",
      () => {

        const value =
          String(
            endInput.value ||
            ""
          ).trim();


        if (
          !value
        ) {

          return;

        }


        endInput.value =
          toTime(
            toSeconds(
              value
            )
          );

      }
    );


  // =======================================================
  // LEER DATOS DEL EDITOR
  // =======================================================

  function readEditor() {

    const center =
      map.getCenter();


    const lat =
      Number(
        discoveryLat?.value
      );


    const lng =
      Number(
        discoveryLng?.value
      );


    const endText =
      String(
        endInput?.value ||
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
          detailType?.value ||
          "Lugar"
        ),


      title:

        String(
          titleInput?.value ||
          ""
        ).trim(),


      place:

        String(
          placeInput?.value ||
          ""
        ).trim(),


      category:

        String(
          categoryInput?.value ||
          detailType?.value ||
          "Lugar"
        ).trim(),


      comment:

        String(
          commentInput?.value ||
          ""
        ).trim(),


      timestampStart:

        toSeconds(
          startInput?.value
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
            ].automatic

    };

  }


  // =======================================================
  // AÑADIR / ACTUALIZAR DETALLE
  // =======================================================

  addDetailButton
    ?.addEventListener(
      "click",
      () => {

        const detail =
          readEditor();


        if (
          !detail.title
        ) {

          showToast?.(
            "Escribe un nombre o título"
          );

          titleInput?.focus();

          return;

        }


        if (
          !detail.place
        ) {

          showToast?.(
            "Indica el lugar o zona"
          );

          placeInput?.focus();

          return;

        }


        if (
          !detail.category
        ) {

          showToast?.(
            "Selecciona una categoría"
          );

          return;

        }


        if (
          detail.timestampEnd !==
            null &&
          detail.timestampEnd <
            detail.timestampStart
        ) {

          showToast?.(
            "El minuto final debe ser posterior al inicial"
          );

          return;

        }


        if (
          editingIndex ===
          null
        ) {

          draftDetails.push(
            detail
          );


          showToast?.(
            "＋ Detalle añadido"
          );

        } else {

          draftDetails[
            editingIndex
          ] =
            detail;


          showToast?.(
            "✓ Detalle actualizado"
          );

        }


        closeEditor();

        renderDetails();

      }
    );


  // =======================================================
  // TARJETAS DE RESULTADOS
  // =======================================================

  function renderDetails() {

    const count =
      draftDetails.length;


    if (
      detailsCount
    ) {

      detailsCount.textContent =
        String(
          count
        );

    }


    if (
      draftCount
    ) {

      draftCount.textContent =
        String(
          count
        );

    }


    // -----------------------------------------------------
    // SIN DETALLES
    // -----------------------------------------------------

    if (
      count === 0
    ) {

      if (
        detailsList
      ) {

        detailsList.innerHTML =
          `
            <div
              class="empty-state"
            >

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

      }


      if (
        draftList
      ) {

        draftList.innerHTML =
          "";

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


    // -----------------------------------------------------
    // TARJETAS PRINCIPALES
    // -----------------------------------------------------

    const cards =

      draftDetails
        .map(
          (
            detail,
            index
          ) => {

            let confidence =
              null;


            if (
              detail.confidence !==
                null &&
              detail.confidence !==
                undefined &&
              detail.automatic
            ) {

              const raw =
                Number(
                  detail.confidence
                );


              if (
                Number.isFinite(
                  raw
                )
              ) {

                confidence =
                  Math.round(
                    raw <= 1
                      ? raw * 100
                      : raw
                  );

              }

            }


            return `
              <article
                class="detected-detail-card"
              >

                <div
                  class="detected-detail-icon"
                >
                  ${iconFor(
                    detail
                  )}
                </div>


                <div
                  class="detected-detail-info"
                >

                  <strong>
                    ${safeText(
                      detail.title
                    )}
                  </strong>


                  <div
                    class="detected-detail-meta"
                  >

                    <span>
                      ${safeText(
                        detail.category
                      )}
                    </span>


                    ${
                      detail.place

                        ? `
                            <span>
                              · ${safeText(
                                detail.place
                              )}
                            </span>
                          `

                        : ""
                    }


                    <span
                      class="detail-time"
                    >
                      ▶ ${toTime(
                        detail.timestampStart
                      )}
                    </span>


                    ${
                      confidence !==
                        null

                        ? `
                            <span>
                              ${confidence}%
                            </span>
                          `

                        : ""
                    }

                  </div>


                  ${
                    detail.comment

                      ? `
                          <p>
                            ${safeText(
                              detail.comment
                            )}
                          </p>
                        `

                      : ""
                  }

                </div>


                <div
                  class="detected-detail-actions"
                >

                  <button
                    type="button"
                    data-v06-edit="${index}"
                    aria-label="Editar detalle"
                  >
                    ✏️
                  </button>


                  <button
                    type="button"
                    data-v06-delete="${index}"
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


    if (
      detailsList
    ) {

      detailsList.innerHTML =
        cards;

    }


    // -----------------------------------------------------
    // RESUMEN DEL BORRADOR
    // -----------------------------------------------------

    if (
      draftList
    ) {

      draftList.innerHTML =

        draftDetails
          .map(
            detail => `
              <article
                class="detected-detail-card"
              >

                <div
                  class="detected-detail-icon"
                >
                  ${iconFor(
                    detail
                  )}
                </div>


                <div
                  class="detected-detail-info"
                >

                  <strong>
                    ${safeText(
                      detail.title
                    )}
                  </strong>


                  <div
                    class="detected-detail-meta"
                  >

                    <span>
                      ${safeText(
                        detail.place
                      )}
                    </span>


                    <span
                      class="detail-time"
                    >
                      ${toTime(
                        detail.timestampStart
                      )}
                    </span>

                  </div>

                </div>

              </article>
            `
          )
          .join("");

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


    // -----------------------------------------------------
    // EDITAR
    // -----------------------------------------------------

    detailsList
      ?.querySelectorAll(
        "[data-v06-edit]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              const index =
                Number(
                  button.dataset
                    .v06Edit
                );


              openEditor(
                index
              );

            }
          );

        }
      );


    // -----------------------------------------------------
    // ELIMINAR
    // -----------------------------------------------------

    detailsList
      ?.querySelectorAll(
        "[data-v06-delete]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              const index =
                Number(
                  button.dataset
                    .v06Delete
                );


              if (
                !Number.isInteger(
                  index
                ) ||
                !draftDetails[
                  index
                ]
              ) {

                return;

              }


              draftDetails.splice(
                index,
                1
              );


              renderDetails();


              showToast?.(
                "Detalle eliminado"
              );

            }
          );

        }
      );

  }


  // =======================================================
  // TÍTULO GENERAL DEL VÍDEO
  // =======================================================

  function videoDraftTitle() {

    if (
      !draftDetails.length
    ) {

      return (
        "Vídeo de Mundo Infinito"
      );

    }


    if (
      draftDetails.length ===
      1
    ) {

      return (
        draftDetails[0]
          .title ||
        "Vídeo de Mundo Infinito"
      );

    }


    const zone =
      draftDetails[0]
        .place ||
      CONFIG.city ||
      "Brasil";


    return (
      `Descubrimientos en ${zone}`
    );

  }


  // =======================================================
  // DESCRIPCIÓN GENERAL DEL VÍDEO
  // =======================================================

  function videoDraftDescription() {

    const names =
      draftDetails
        .slice(
          0,
          5
        )
        .map(
          detail =>
            detail.title
        )
        .filter(
          Boolean
        );


    let description =
      names.join(
        " · "
      );


    if (
      draftDetails.length >
      5
    ) {

      description +=
        ` · +${draftDetails.length - 5} detalles`;

    }


    return description;

  }


  // =======================================================
  // ACTUALIZAR LUGAR EN MEMORIA
  // =======================================================

  function addPlaceToApp(
    place
  ) {

    if (
      !place
    ) {

      return;

    }


    const existingIndex =
      places.findIndex(
        item =>

          String(
            item.id
          ) ===
          String(
            place.id
          )

          ||

          (
            item.slug &&
            place.slug &&
            item.slug ===
            place.slug
          )
      );


    if (
      existingIndex >=
      0
    ) {

      places[
        existingIndex
      ] = {

        ...places[
          existingIndex
        ],

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


  // =======================================================
  // ACTUALIZAR VÍDEO EN MEMORIA
  // =======================================================

  function addVideoToApp(
    video
  ) {

    if (
      !video
    ) {

      return;

    }


    const existingIndex =
      videos.findIndex(
        item =>

          String(
            item.id
          ) ===
          String(
            video.id
          )

          ||

          (
            video.sourceUrl &&
            item.sourceUrl ===
            video.sourceUrl
          )
      );


    if (
      existingIndex >=
      0
    ) {

      videos[
        existingIndex
      ] = {

        ...videos[
          existingIndex
        ],

        ...video

      };


      return;

    }


    videos.push(
      video
    );

  }


  // =======================================================
  // ACTUALIZAR DESCUBRIMIENTO EN MEMORIA
  // =======================================================

  function addDiscoveryToApp(
    discovery
  ) {

    if (
      !discovery
    ) {

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


    if (
      !exists
    ) {

      discoveries.push(
        discovery
      );

    }

  }


  // =======================================================
  // GUARDAR TODO
  // =======================================================

  discoveryForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      event.stopImmediatePropagation();


      if (
        saving
      ) {

        return;

      }


      if (
        !draftDetails.length
      ) {

        showToast?.(
          "Añade al menos un detalle"
        );


        openEditor();


        return;

      }


      const url =
        uploadedVideoUrl ||
        sourceUrl();


      if (
        !url &&
        !selectedFile
      ) {

        showToast?.(
          "Añade primero un vídeo o Reel"
        );


        return;

      }


      if (
        selectedFile &&
        uploadingVideo
      ) {

        showToast?.(
          "Espera a que termine de subir el vídeo"
        );


        return;

      }


      if (
        selectedFile &&
        !uploadedVideoUrl
      ) {

        showToast?.(
          "El vídeo todavía no está guardado en Mundo Infinito"
        );


        return;

      }


      if (
        !supabaseClient ||
        !supabaseOnline
      ) {

        showToast?.(
          "No hay conexión con la base compartida"
        );


        return;

      }


      saving =
        true;


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

        // =================================================
        // 1. CREAR VÍDEO
        // =================================================

        const savedVideo =
          await createSupabaseVideo({

            title:
              videoDraftTitle(),

            description:
              videoDraftDescription(),

            url

          });


        if (
          !savedVideo
        ) {

          throw new Error(
            "No se pudo crear el vídeo"
          );

        }


        addVideoToApp(
          savedVideo
        );


        // =================================================
        // 2. CREAR DETALLES
        // =================================================

        const created =
          [];


        let firstPlace =
          null;


        for (
          const detail
          of draftDetails
        ) {

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

              lng

            });


          if (
            !savedPlace
          ) {

            throw new Error(
              `No se pudo guardar ${detail.title}`
            );

          }


          addPlaceToApp(
            savedPlace
          );


          if (
            !firstPlace
          ) {

            firstPlace =
              savedPlace;

          }


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
                    )

            });


          addDiscoveryToApp(
            savedDiscovery
          );


          created.push(
            savedDiscovery
          );

        }


        // =================================================
        // 3. ACTUALIZAR MAPA
        // =================================================

        renderMarkers();


        // =================================================
        // 4. MENSAJE FINAL
        // =================================================

        const total =
          created.length;


        showToast?.(

          total === 1

            ? "✓ 1 detalle guardado para todos"

            : `✓ ${total} detalles guardados para todos`

        );


        // =================================================
        // 5. LIMPIAR
        // =================================================

        draftDetails =
          [];


        editingIndex =
          null;


        selectedFile =
          null;


        uploadedVideoUrl =
          null;


        uploadedVideoPath =
          null;


        uploadingVideo =
          false;


        clearObjectUrl();


        closeAddDiscovery();


        // =================================================
        // 6. IR AL PRIMER LUGAR
        // =================================================

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
              firstPlace.lng
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


      } catch (
        error
      ) {

        console.error(
          "Mundo Infinito v0.6.2 · Error guardando:",
          error
        );


        showToast?.(
          "No se pudieron guardar todos los detalles"
        );


      } finally {

        saving =
          false;


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


  // =======================================================
  // ESCAPE
  // =======================================================

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


  // =======================================================
  // LISTO
  // =======================================================

  console.log(
    "✨ Mundo Infinito · Explorador de vídeos v0.6.2 cargado"
  );


})(); // FIN video-explorer v0.6.2
