// =========================================================
// MUNDO INFINITO · ANALIZADOR LOCAL v0.5
// OCR visual ligero para vídeos
//
// Vídeo
//   ↓
// fotogramas cada 5 segundos
//   ↓
// OCR secuencial
//   ↓
// texto visible + timestamps
//
// Whisper queda desactivado por defecto
// para evitar Out of Memory.
// =========================================================

"use strict";

(() => {

  console.log(
    "👁️ Mundo Infinito · Analizador visual v0.5 cargado"
  );


  // =======================================================
  // CONFIGURACIÓN
  // =======================================================

  const FRAME_INTERVAL_SECONDS =
    5;

  const MAX_FRAME_WIDTH =
    900;

  /*
   * Lo dejamos en false porque Whisper estaba
   * provocando problemas de memoria.
   *
   * Más adelante podemos volver a activarlo
   * como complemento.
   */

  const ENABLE_WHISPER =
    false;


  // =======================================================
  // ESTADO
  // =======================================================

  let tesseractReady =
    false;

  let tesseractWorker =
    null;


  // =======================================================
  // UTILIDAD
  // =======================================================

  function sleep(
    milliseconds
  ) {

    return new Promise(
      resolve =>
        window.setTimeout(
          resolve,
          milliseconds
        )
    );

  }


  // =======================================================
  // CARGAR TESSERACT.JS
  // =======================================================

  async function loadTesseract() {

    if (
      window.Tesseract
    ) {

      return window.Tesseract;

    }


    console.log(
      "📦 Cargando lector de texto visual…"
    );


    await new Promise(
      (
        resolve,
        reject
      ) => {

        const existing =
          document.querySelector(
            'script[data-mundo-tesseract="true"]'
          );


        if (
          existing
        ) {

          existing.addEventListener(
            "load",
            resolve,
            {
              once:
                true
            }
          );


          existing.addEventListener(
            "error",
            reject,
            {
              once:
                true
            }
          );


          return;

        }


        const script =
          document.createElement(
            "script"
          );


        script.src =
          "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";


        script.async =
          true;


        script.dataset
          .mundoTesseract =
          "true";


        script.onload =
          resolve;


        script.onerror =
          () =>
            reject(
              new Error(
                "No se pudo cargar Tesseract.js"
              )
            );


        document.head.appendChild(
          script
        );

      }
    );


    if (
      !window.Tesseract
    ) {

      throw new Error(
        "Tesseract.js no está disponible"
      );

    }


    return window.Tesseract;

  }


  // =======================================================
  // CREAR WORKER OCR
  // =======================================================

  async function getOCRWorker(
    onProgress = null
  ) {

    if (
      tesseractReady &&
      tesseractWorker
    ) {

      return tesseractWorker;

    }


    const Tesseract =
      await loadTesseract();


    console.log(
      "🧠 Preparando OCR portugués/español…"
    );


    tesseractWorker =
      await Tesseract.createWorker(
        [
          "por",
          "spa",
          "eng"
        ],
        1,
        {

          logger:
            message => {

              if (
                typeof onProgress ===
                "function"
              ) {

                onProgress({

                  stage:
                    "ocr",

                  status:
                    message.status,

                  progress:
                    message.progress

                });

              }

            }

        }
      );


    tesseractReady =
      true;


    console.log(
      "✅ OCR preparado"
    );


    return tesseractWorker;

  }


  // =======================================================
  // ESPERAR METADATOS DEL VÍDEO
  // =======================================================

  function waitForMetadata(
    video
  ) {

    if (
      video.readyState >= 1
    ) {

      return Promise.resolve();

    }


    return new Promise(
      (
        resolve,
        reject
      ) => {

        const timeout =
          window.setTimeout(
            () => {

              reject(
                new Error(
                  "No se pudieron leer los datos del vídeo"
                )
              );

            },
            15000
          );


        video.addEventListener(
          "loadedmetadata",
          () => {

            clearTimeout(
              timeout
            );

            resolve();

          },
          {
            once:
              true
          }
        );


        video.addEventListener(
          "error",
          () => {

            clearTimeout(
              timeout
            );

            reject(
              new Error(
                "El navegador no pudo abrir el vídeo"
              )
            );

          },
          {
            once:
              true
          }
        );

      }
    );

  }


  // =======================================================
  // IR A UN MOMENTO DEL VÍDEO
  // =======================================================

   function seekVideo(
    video,
    second
  ) {

    return new Promise(
      (
        resolve,
        reject
      ) => {

        const safeSecond =
          Math.max(
            0,
            Math.min(
              second,
              Math.max(
                0,
                video.duration - 0.05
              )
            )
          );


        // =================================================
        // SI YA ESTAMOS EN ESE MOMENTO
        // NO ESPERAR AL EVENTO seeked
        // =================================================

        if (
          Math.abs(
            video.currentTime -
            safeSecond
          ) < 0.05
        ) {

          resolve();

          return;

        }


        const timeout =
          window.setTimeout(
            () => {

              cleanup();

              reject(
                new Error(
                  `No se pudo acceder al segundo ${safeSecond}`
                )
              );

            },
            10000
          );


        const cleanup =
          () => {

            clearTimeout(
              timeout
            );

            video.removeEventListener(
              "seeked",
              done
            );

            video.removeEventListener(
              "error",
              failed
            );

          };


        const done =
          () => {

            cleanup();

            resolve();

          };


        const failed =
          () => {

            cleanup();

            reject(
              new Error(
                `Error leyendo el fotograma ${safeSecond}`
              )
            );

          };


        video.addEventListener(
          "seeked",
          done,
          {
            once: true
          }
        );


        video.addEventListener(
          "error",
          failed,
          {
            once: true
          }
        );


        video.currentTime =
          safeSecond;

      }
    );

  }

    return new Promise(
      (
        resolve,
        reject
      ) => {

        const safeSecond =
          Math.max(
            0,
            Math.min(
              second,
              Math.max(
                0,
                video.duration -
                0.05
              )
            )
          );


        const timeout =
          window.setTimeout(
            () => {

              reject(
                new Error(
                  `No se pudo acceder al segundo ${safeSecond}`
                )
              );

            },
            10000
          );


        const done =
          () => {

            clearTimeout(
              timeout
            );

            resolve();

          };


        video.addEventListener(
          "seeked",
          done,
          {
            once:
              true
          }
        );


        video.currentTime =
          safeSecond;

      }
    );

  }


  // =======================================================
  // CREAR CANVAS REDUCIDO
  // =======================================================

  function createFrameCanvas(
    video
  ) {

    const naturalWidth =
      video.videoWidth ||
      720;


    const naturalHeight =
      video.videoHeight ||
      1280;


    const scale =
      Math.min(
        1,
        MAX_FRAME_WIDTH /
        naturalWidth
      );


    const width =
      Math.max(
        1,
        Math.round(
          naturalWidth *
          scale
        )
      );


    const height =
      Math.max(
        1,
        Math.round(
          naturalHeight *
          scale
        )
      );


    const canvas =
      document.createElement(
        "canvas"
      );


    canvas.width =
      width;


    canvas.height =
      height;


    return canvas;

  }


  // =======================================================
  // CAPTURAR UN FOTOGRAMA
  // =======================================================

  function captureFrame(
    video,
    canvas
  ) {

    const context =
      canvas.getContext(
        "2d",
        {
          alpha:
            false
        }
      );


    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );


    return canvas;

  }


  // =======================================================
  // LIMPIAR TEXTO OCR
  // =======================================================

  function cleanOCRText(
    text
  ) {

    return String(
      text ||
      ""
    )
      .replace(
        /\r/g,
        ""
      )
      .replace(
        /[ \t]+/g,
        " "
      )
      .replace(
        /\n{3,}/g,
        "\n\n"
      )
      .trim();

  }


  // =======================================================
  // NORMALIZAR PARA COMPARAR
  // =======================================================

  function normalizeText(
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
      .toLowerCase()
      .replace(
        /[^a-z0-9\s]/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  }


  // =======================================================
  // EVITAR TEXTO REPETIDO
  // =======================================================

  function isVerySimilar(
    a,
    b
  ) {

    const first =
      normalizeText(
        a
      );


    const second =
      normalizeText(
        b
      );


    if (
      !first ||
      !second
    ) {

      return false;

    }


    if (
      first ===
      second
    ) {

      return true;

    }


    if (
      first.includes(
        second
      ) ||
      second.includes(
        first
      )
    ) {

      const shortest =
        Math.min(
          first.length,
          second.length
        );


      const longest =
        Math.max(
          first.length,
          second.length
        );


      return (
        shortest /
        longest
      ) >
      0.72;

    }


    return false;

  }


  // =======================================================
  // ANALIZAR TEXTO DEL VÍDEO
  // =======================================================

  async function analyzeVideoFrames(
    file,
    onProgress = null
  ) {

    if (
      !file
    ) {

      throw new Error(
        "No se recibió ningún vídeo"
      );

    }


    const worker =
      await getOCRWorker(
        onProgress
      );


    const video =
      document.createElement(
        "video"
      );


    const objectUrl =
      URL.createObjectURL(
        file
      );


    video.src =
      objectUrl;


    video.preload =
      "metadata";


    video.muted =
      true;


    video.playsInline =
      true;


    video.style.position =
      "fixed";


    video.style.left =
      "-99999px";


    video.style.width =
      "1px";


    video.style.height =
      "1px";


    document.body.appendChild(
      video
    );


    try {

      await waitForMetadata(
        video
      );


      const duration =
        Number(
          video.duration ||
          0
        );


      if (
        !Number.isFinite(
          duration
        ) ||
        duration <= 0
      ) {

        throw new Error(
          "No se pudo determinar la duración del vídeo"
        );

      }


      console.log(
        `🎬 Vídeo de ${duration.toFixed(1)} segundos`
      );


      const times =
        [];


      /*
       * Siempre analizamos el principio.
       */

      times.push(
        0
      );


      for (
        let second =
          FRAME_INTERVAL_SECONDS;
        second <
          duration;
        second +=
          FRAME_INTERVAL_SECONDS
      ) {

        times.push(
          second
        );

      }


      /*
       * Y también cerca del final.
       */

      if (
        duration >
        2
      ) {

        const last =
          Math.max(
            0,
            duration -
            1
          );


        if (
          !times.some(
            value =>
              Math.abs(
                value -
                last
              ) <
              1
          )
        ) {

          times.push(
            last
          );

        }

      }


      const canvas =
        createFrameCanvas(
          video
        );


      const findings =
        [];


      let previousText =
        "";


      for (
        let index = 0;
        index <
          times.length;
        index++
      ) {

        const second =
          times[index];


        console.log(
          `👁️ Leyendo fotograma ${index + 1}/${times.length} · ${second.toFixed(1)} s`
        );


        if (
          typeof onProgress ===
          "function"
        ) {

          onProgress({

            stage:
              "frames",

            status:
              "reading",

            frame:
              index + 1,

            total_frames:
              times.length,

            current_second:
              second,

            progress:
              (
                index /
                times.length
              ) * 100

          });

        }


        await seekVideo(
          video,
          second
        );


        /*
         * Dejamos un instante para que el frame
         * quede realmente renderizado.
         */

        await sleep(
          80
        );


        captureFrame(
          video,
          canvas
        );


        const result =
          await worker.recognize(
            canvas
          );


        const text =
          cleanOCRText(
            result?.data?.text
          );


        console.log(
          `📝 OCR ${second.toFixed(1)}s:`,
          text
        );


        if (
          text &&
          !isVerySimilar(
            text,
            previousText
          )
        ) {

          findings.push({

            text,

            timestamp: [
              second,
              null
            ],

            source:
              "screen"

          });


          previousText =
            text;

        }


        /*
         * Tiempo para liberar referencias del
         * proceso OCR anterior antes del siguiente.
         */

        await sleep(
          50
        );

      }


      const fullText =
        findings
          .map(
            finding =>
              finding.text
          )
          .join(
            "\n"
          )
          .trim();


      return {

        text:
          fullText,

        chunks:
          findings,

        visualText:
          fullText,

        visualChunks:
          findings

      };


    } finally {

      video.pause();


      video.removeAttribute(
        "src"
      );


      video.load();


      video.remove();


      URL.revokeObjectURL(
        objectUrl
      );

    }

  }


  // =======================================================
  // FUNCIÓN COMPATIBLE CON VIDEO-EXPLORER.JS
  // =======================================================

  async function transcribeVideoFile(
    file,
    onProgress = null
  ) {

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );


    console.log(
      "👁️ MUNDO INFINITO · ANÁLISIS VISUAL v0.5"
    );


    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );


    /*
     * En v0.5 usamos OCR como fuente principal.
     *
     * Conservamos el nombre transcribeVideoFile()
     * porque video-explorer.js ya llama a esta función.
     */

    const visualResult =
      await analyzeVideoFrames(
        file,
        onProgress
      );


    let audioText =
      "";


    let audioChunks =
      [];


    /*
     * Whisper queda desactivado por defecto.
     * Evitamos así el error Out of Memory.
     */

    if (
      ENABLE_WHISPER
    ) {

      console.warn(
        "Whisper está activado experimentalmente."
      );

      /*
       * Aquí podremos reincorporar después
       * una implementación ligera de audio.
       */

    }


    // =====================================================
    // UNIR AUDIO + TEXTO VISUAL
    // =====================================================

    const combinedText =
      [
        visualResult.text,
        audioText
      ]
        .filter(
          Boolean
        )
        .join(
          "\n"
        )
        .trim();


    const combinedChunks =
      [
        ...visualResult.chunks,
        ...audioChunks
      ]
        .sort(
          (
            a,
            b
          ) => {

            const aTime =
              Array.isArray(
                a.timestamp
              )
                ? Number(
                    a.timestamp[0] ||
                    0
                  )
                : 0;


            const bTime =
              Array.isArray(
                b.timestamp
              )
                ? Number(
                    b.timestamp[0] ||
                    0
                  )
                : 0;


            return (
              aTime -
              bTime
            );

          }
        );


    const result = {

      text:
        combinedText,

      chunks:
        combinedChunks,

      visualText:
        visualResult.text,

      visualChunks:
        visualResult.chunks,

      audioText,

      audioChunks

    };


    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );


    console.log(
      "✅ ANÁLISIS VISUAL TERMINADO"
    );


    console.log(
      result
    );


    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );


    if (
      typeof onProgress ===
      "function"
    ) {

      onProgress({

        stage:
          "complete",

        status:
          "done",

        progress:
          100

      });

    }


    return result;

  }


  // =======================================================
  // DESDE URL
  // =======================================================

  async function transcribeVideoUrl(
    url,
    onProgress = null
  ) {

    if (
      !url
    ) {

      throw new Error(
        "No se recibió una URL"
      );

    }


    const response =
      await fetch(
        url
      );


    if (
      !response.ok
    ) {

      throw new Error(
        `No se pudo obtener el vídeo (${response.status})`
      );

    }


    const blob =
      await response.blob();


    const file =
      new File(
        [
          blob
        ],
        "mundo-infinito-video.mp4",
        {

          type:
            blob.type ||
            "video/mp4"

        }
      );


    return await transcribeVideoFile(
      file,
      onProgress
    );

  }


  // =======================================================
  // LIBERAR OCR
  // =======================================================

  async function dispose() {

    if (
      tesseractWorker
    ) {

      try {

        await tesseractWorker
          .terminate();

      } catch (_) {}

    }


    tesseractWorker =
      null;


    tesseractReady =
      false;

  }


  // =======================================================
  // API PÚBLICA
  // =======================================================

  window.MundoInfinitoAnalyzer = {

    analyzeVideoFrames,

    transcribeVideoFile,

    transcribeVideoUrl,

    dispose

  };


  console.log(
    "✅ MundoInfinitoAnalyzer v0.5 preparado · OCR visual"
  );


})();
