// =========================================================
// MUNDO INFINITO · ANALIZADOR LOCAL v0.4.1
// Whisper Tiny q4 · CPU/WASM
// Sin WebGPU
// Sin decodeAudioData() del vídeo completo
// =========================================================

"use strict";

(() => {

  console.log(
    "🧠 Analizador local de Mundo Infinito v0.4.1 cargado"
  );


  // =======================================================
  // CONFIGURACIÓN
  // =======================================================

  const TARGET_SAMPLE_RATE =
    16000;

  const CHUNK_SECONDS =
    10;

  const MAX_QUEUE =
    1;


  // =======================================================
  // ESTADO WHISPER
  // =======================================================

  let transcriber =
    null;

  let loadingModel =
    false;


  // =======================================================
  // CARGAR TRANSFORMERS.JS
  // =======================================================

  async function loadTransformers() {

    return await import(
      "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1"
    );

  }


  // =======================================================
  // CARGAR WHISPER
  // CPU/WASM + Q4
  // =======================================================

  async function getTranscriber(
    onProgress = null
  ) {

    if (
      transcriber
    ) {

      return transcriber;

    }


    if (
      loadingModel
    ) {

      while (
        loadingModel
      ) {

        await new Promise(
          resolve =>
            window.setTimeout(
              resolve,
              200
            )
        );

      }


      if (
        !transcriber
      ) {

        throw new Error(
          "Whisper no pudo cargarse"
        );

      }


      return transcriber;

    }


    loadingModel =
      true;


    try {

      console.log(
        "📦 Cargando Whisper Tiny q4…"
      );


      const {
        pipeline
      } =
        await loadTransformers();


      const options = {

        // Menor consumo de memoria que q8
        dtype:
          "q4",


        progress_callback:
          progress => {

            if (
              typeof onProgress ===
              "function"
            ) {

              onProgress({

                stage:
                  "model",

                ...progress

              });

            }

          }

      };


      /*
       * IMPORTANTE:
       *
       * No ponemos:
       *
       * options.device = "webgpu"
       *
       * De esta forma evitamos reservar memoria
       * adicional en la GPU.
       */

      console.log(
        "🧠 Whisper usando CPU/WASM q4"
      );


      transcriber =
        await pipeline(
          "automatic-speech-recognition",
          "onnx-community/whisper-tiny",
          options
        );


      console.log(
        "✅ Whisper Tiny q4 preparado"
      );


      return transcriber;


    } catch (
      error
    ) {

      console.error(
        "❌ Error cargando Whisper q4:",
        error
      );


      transcriber =
        null;


      throw error;


    } finally {

      loadingModel =
        false;

    }

  }


  // =======================================================
  // ESPERAR EVENTO
  // =======================================================

  function waitForEvent(
    element,
    eventName,
    timeout =
      15000
  ) {

    return new Promise(
      (
        resolve,
        reject
      ) => {

        let timer =
          null;


        const cleanup =
          () => {

            element.removeEventListener(
              eventName,
              success
            );


            element.removeEventListener(
              "error",
              failure
            );


            if (
              timer
            ) {

              clearTimeout(
                timer
              );

            }

          };


        const success =
          event => {

            cleanup();

            resolve(
              event
            );

          };


        const failure =
          () => {

            cleanup();


            reject(
              new Error(
                "El navegador no pudo reproducir el vídeo"
              )
            );

          };


        element.addEventListener(
          eventName,
          success,
          {
            once:
              true
          }
        );


        element.addEventListener(
          "error",
          failure,
          {
            once:
              true
          }
        );


        timer =
          window.setTimeout(
            () => {

              cleanup();


              reject(
                new Error(
                  `Tiempo agotado esperando ${eventName}`
                )
              );

            },
            timeout
          );

      }
    );

  }


  // =======================================================
  // REMUESTREAR PCM
  // =======================================================

  function resampleFloat32(
    input,
    sourceRate,
    targetRate =
      TARGET_SAMPLE_RATE
  ) {

    if (
      !input ||
      !input.length
    ) {

      return new Float32Array(
        0
      );

    }


    if (
      sourceRate ===
      targetRate
    ) {

      return input;

    }


    const ratio =
      sourceRate /
      targetRate;


    const outputLength =
      Math.max(
        1,
        Math.round(
          input.length /
          ratio
        )
      );


    const output =
      new Float32Array(
        outputLength
      );


    for (
      let i = 0;
      i < outputLength;
      i++
    ) {

      const position =
        i * ratio;


      const left =
        Math.floor(
          position
        );


      const right =
        Math.min(
          left + 1,
          input.length - 1
        );


      const fraction =
        position -
        left;


      output[i] =
        (
          input[left] *
          (
            1 - fraction
          )
        )
        +
        (
          input[right] *
          fraction
        );

    }


    return output;

  }


  // =======================================================
  // TRANSCRIBIR UN FRAGMENTO PCM
  // =======================================================

  async function transcribePCMChunk(
    whisper,
    audio16k
  ) {

    if (
      !audio16k ||
      !audio16k.length
    ) {

      return {

        text:
          "",

        chunks:
          []

      };

    }


    return await whisper(
      audio16k,
      {

        return_timestamps:
          true,

        language:
          "portuguese",

        task:
          "transcribe"

      }
    );

  }


  // =======================================================
  // NORMALIZAR TIMESTAMPS
  // =======================================================

  function normalizeResult(
    result,
    offsetSeconds
  ) {

    const text =
      String(
        result?.text ||
        ""
      ).trim();


    const normalizedChunks =
      [];


    const chunks =
      Array.isArray(
        result?.chunks
      )

        ? result.chunks

        : [];


    chunks.forEach(
      chunk => {

        const rawTimestamp =
          Array.isArray(
            chunk.timestamp
          )

            ? chunk.timestamp

            : [
                0,
                null
              ];


        const localStart =
          Number(
            rawTimestamp[0] ||
            0
          );


        const localEnd =
          rawTimestamp[1] ==
            null

            ? null

            : Number(
                rawTimestamp[1]
              );


        normalizedChunks.push({

          text:
            String(
              chunk.text ||
              ""
            ).trim(),


          timestamp: [

            offsetSeconds +
            localStart,


            localEnd ==
              null

              ? null

              : offsetSeconds +
                localEnd

          ]

        });

      }
    );


    /*
     * Si Whisper devuelve texto pero no chunks,
     * conservamos igualmente el instante aproximado.
     */

    if (
      text &&
      !normalizedChunks.length
    ) {

      normalizedChunks.push({

        text,

        timestamp: [
          offsetSeconds,
          null
        ]

      });

    }


    return {

      text,

      chunks:
        normalizedChunks

    };

  }


  // =======================================================
  // CREAR AUDIOWORKLET
  // =======================================================

  async function createCaptureWorklet(
    audioContext
  ) {

    const workletCode =
      `
        class MundoInfinitoCaptureProcessor
          extends AudioWorkletProcessor {

          process(
            inputs,
            outputs,
            parameters
          ) {

            const input =
              inputs[0];

            if (
              !input ||
              !input.length ||
              !input[0] ||
              !input[0].length
            ) {

              return true;

            }


            const length =
              input[0].length;


            const channels =
              input.length;


            const mono =
              new Float32Array(
                length
              );


            for (
              let channel = 0;
              channel < channels;
              channel++
            ) {

              const source =
                input[channel];


              if (
                !source
              ) {

                continue;

              }


              for (
                let i = 0;
                i < length;
                i++
              ) {

                mono[i] +=
                  source[i] /
                  channels;

              }

            }


            this.port.postMessage(
              mono,
              [
                mono.buffer
              ]
            );


            return true;

          }

        }


        registerProcessor(
          "mundo-infinito-capture",
          MundoInfinitoCaptureProcessor
        );
      `;


    const blob =
      new Blob(
        [
          workletCode
        ],
        {
          type:
            "text/javascript"
        }
      );


    const moduleUrl =
      URL.createObjectURL(
        blob
      );


    try {

      await audioContext
        .audioWorklet
        .addModule(
          moduleUrl
        );


    } finally {

      URL.revokeObjectURL(
        moduleUrl
      );

    }


    return new AudioWorkletNode(
      audioContext,
      "mundo-infinito-capture"
    );

  }


  // =======================================================
  // ANALIZAR ARCHIVO DE VÍDEO
  // =======================================================

  async function transcribeVideoFile(
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


    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );


    console.log(
      "🧠 MUNDO INFINITO · ANALIZADOR v0.4.1"
    );


    console.log(
      "CPU/WASM q4 · memoria reducida"
    );


    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );


    console.log(
      "📄 Vídeo:",
      {

        name:
          file.name,

        type:
          file.type,

        sizeMB:
          Math.round(
            (
              file.size /
              1024 /
              1024
            ) * 10
          ) / 10

      }
    );


    // =====================================================
    // 1. CARGAR WHISPER
    // =====================================================

    const whisper =
      await getTranscriber(
        onProgress
      );


    // =====================================================
    // 2. AUDIO CONTEXT
    // =====================================================

    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;


    if (
      !AudioContextClass
    ) {

      throw new Error(
        "Este navegador no dispone de AudioContext"
      );

    }


    const audioContext =
      new AudioContextClass();


    // =====================================================
    // 3. VÍDEO INTERNO
    // =====================================================

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


    video.playsInline =
      true;


    video.controls =
      false;


    video.volume =
      1;


    video.style.position =
      "fixed";


    video.style.left =
      "-99999px";


    video.style.top =
      "-99999px";


    video.style.width =
      "1px";


    video.style.height =
      "1px";


    video.style.opacity =
      "0";


    document.body.appendChild(
      video
    );


    // =====================================================
    // ESTADO DE CAPTURA
    // =====================================================

    let sourceNode =
      null;


    let workletNode =
      null;


    let silentGain =
      null;


    let ended =
      false;


    let captureFinished =
      false;


    let processing =
      false;


    let pausedByQueue =
      false;


    let accumulator =
      null;


    let accumulatorOffset =
      0;


    let capturedSamples =
      0;


    const queue =
      [];


    const textParts =
      [];


    const finalChunks =
      [];


    let resolveFinished =
      null;


    let rejectFinished =
      null;


    const finishedPromise =
      new Promise(
        (
          resolve,
          reject
        ) => {

          resolveFinished =
            resolve;


          rejectFinished =
            reject;

        }
      );


    // =====================================================
    // LIMPIAR
    // =====================================================

    async function cleanup() {

      try {

        video.pause();

      } catch (_) {}


      try {

        workletNode
          ?.disconnect();

      } catch (_) {}


      try {

        sourceNode
          ?.disconnect();

      } catch (_) {}


      try {

        silentGain
          ?.disconnect();

      } catch (_) {}


      try {

        await audioContext.close();

      } catch (_) {}


      try {

        video.remove();

      } catch (_) {}


      URL.revokeObjectURL(
        objectUrl
      );

    }


    // =====================================================
    // FINAL
    // =====================================================

    function checkFinished() {

      if (
        !captureFinished
      ) {

        return;

      }


      if (
        processing
      ) {

        return;

      }


      if (
        queue.length
      ) {

        return;

      }


      resolveFinished?.();

    }


    // =====================================================
    // CONTROL DE MEMORIA
    // =====================================================

    function updateBackpressure() {

      /*
       * MAX_QUEUE = 1:
       *
       * si Whisper todavía está trabajando,
       * dejamos de reproducir temporalmente.
       *
       * Esto evita acumular audio en RAM.
       */

      if (
        queue.length >=
          MAX_QUEUE &&
        !video.paused
      ) {

        pausedByQueue =
          true;


        video.pause();


        console.log(
          "⏸️ Esperando a Whisper para ahorrar memoria"
        );

      }

    }


    async function resumeIfPossible() {

      if (
        !pausedByQueue
      ) {

        return;

      }


      if (
        queue.length >=
        MAX_QUEUE
      ) {

        return;

      }


      if (
        ended
      ) {

        return;

      }


      pausedByQueue =
        false;


      try {

        await video.play();


        console.log(
          "▶️ Continuando captura"
        );


      } catch (
        error
      ) {

        console.warn(
          "No se pudo reanudar:",
          error
        );

      }

    }


    // =====================================================
    // PROCESAR COLA
    // =====================================================

    async function processQueue() {

      if (
        processing
      ) {

        return;

      }


      processing =
        true;


      try {

        while (
          queue.length
        ) {

          const item =
            queue.shift();


          const audio16k =
            resampleFloat32(
              item.audio,
              audioContext.sampleRate,
              TARGET_SAMPLE_RATE
            );


          /*
           * Eliminamos inmediatamente la referencia
           * al PCM original.
           */

          item.audio =
            null;


          await resumeIfPossible();


          console.log(
            `🎧 Whisper desde ${item.startSecond.toFixed(1)} s`
          );


          if (
            typeof onProgress ===
            "function"
          ) {

            onProgress({

              status:
                "transcribing",

              stage:
                "whisper",

              current_second:
                item.startSecond,

              duration:
                Number.isFinite(
                  video.duration
                )

                  ? video.duration

                  : null

            });

          }


          const result =
            await transcribePCMChunk(
              whisper,
              audio16k
            );


          const normalized =
            normalizeResult(
              result,
              item.startSecond
            );


          if (
            normalized.text
          ) {

            textParts.push(
              normalized.text
            );

          }


          finalChunks.push(
            ...normalized.chunks
          );


          console.log(
            "✅ Fragmento procesado"
          );


          await new Promise(
            resolve =>
              window.setTimeout(
                resolve,
                50
              )
          );


          await resumeIfPossible();

        }


      } catch (
        error
      ) {

        rejectFinished?.(
          error
        );


      } finally {

        processing =
          false;


        await resumeIfPossible();


        checkFinished();

      }

    }


    // =====================================================
    // AÑADIR FRAGMENTO A COLA
    // =====================================================

    function enqueueChunk(
      audio,
      startSecond
    ) {

      if (
        !audio ||
        !audio.length
      ) {

        return;

      }


      queue.push({

        audio,

        startSecond

      });


      updateBackpressure();


      processQueue();

    }


    // =====================================================
    // EJECUTAR
    // =====================================================

    try {

      // ---------------------------------------------------
      // METADATA
      // ---------------------------------------------------

      if (
        video.readyState <
        1
      ) {

        await waitForEvent(
          video,
          "loadedmetadata",
          20000
        );

      }


      console.log(
        "🎬 Duración:",
        Number.isFinite(
          video.duration
        )

          ? `${video.duration.toFixed(1)} segundos`

          : "desconocida"
      );


      // ---------------------------------------------------
      // AUDIO WORKLET
      // ---------------------------------------------------

      await audioContext.resume();


      sourceNode =
        audioContext
          .createMediaElementSource(
            video
          );


      workletNode =
        await createCaptureWorklet(
          audioContext
        );


      silentGain =
        audioContext.createGain();


      silentGain.gain.value =
        0;


      sourceNode.connect(
        workletNode
      );


      workletNode.connect(
        silentGain
      );


      silentGain.connect(
        audioContext.destination
      );


      // ---------------------------------------------------
      // SOLO 10 SEGUNDOS DE AUDIO EN MEMORIA
      // ---------------------------------------------------

      const chunkSamples =
        Math.max(
          1,
          Math.round(
            audioContext.sampleRate *
            CHUNK_SECONDS
          )
        );


      accumulator =
        new Float32Array(
          chunkSamples
        );


      // ---------------------------------------------------
      // DATOS DEL AUDIOWORKLET
      // ---------------------------------------------------

      workletNode
        .port
        .onmessage =
          event => {

            const incoming =
              event.data;


            if (
              !(
                incoming instanceof
                Float32Array
              ) ||
              !incoming.length
            ) {

              return;

            }


            let readOffset =
              0;


            while (
              readOffset <
              incoming.length
            ) {

              const available =
                accumulator.length -
                accumulatorOffset;


              const remaining =
                incoming.length -
                readOffset;


              const amount =
                Math.min(
                  available,
                  remaining
                );


              accumulator.set(
                incoming.subarray(
                  readOffset,
                  readOffset +
                  amount
                ),
                accumulatorOffset
              );


              accumulatorOffset +=
                amount;


              capturedSamples +=
                amount;


              readOffset +=
                amount;


              // -------------------------------------------
              // FRAGMENTO COMPLETO
              // -------------------------------------------

              if (
                accumulatorOffset >=
                accumulator.length
              ) {

                const startSecond =
                  (
                    capturedSamples -
                    accumulator.length
                  ) /
                  audioContext.sampleRate;


                const readyChunk =
                  accumulator;


                accumulator =
                  new Float32Array(
                    chunkSamples
                  );


                accumulatorOffset =
                  0;


                enqueueChunk(
                  readyChunk,
                  startSecond
                );

              }

            }

          };


      // ---------------------------------------------------
      // PROGRESO
      // ---------------------------------------------------

      video.addEventListener(
        "timeupdate",
        () => {

          if (
            typeof onProgress !==
            "function"
          ) {

            return;

          }


          const duration =
            video.duration;


          const current =
            video.currentTime;


          onProgress({

            status:
              "capturing",

            stage:
              "audio",

            current_second:
              current,


            duration:
              Number.isFinite(
                duration
              )

                ? duration

                : null,


            progress:
              Number.isFinite(
                duration
              ) &&
              duration > 0

                ? (
                    current /
                    duration
                  ) * 100

                : null

          });

        }
      );


      // ---------------------------------------------------
      // FINAL DEL VÍDEO
      // ---------------------------------------------------

      video.addEventListener(
        "ended",
        () => {

          ended =
            true;


          console.log(
            "🎬 Captura terminada"
          );


          window.setTimeout(
            () => {

              if (
                accumulatorOffset >
                0
              ) {

                const partial =
                  accumulator.slice(
                    0,
                    accumulatorOffset
                  );


                const startSecond =
                  (
                    capturedSamples -
                    accumulatorOffset
                  ) /
                  audioContext.sampleRate;


                enqueueChunk(
                  partial,
                  startSecond
                );


                accumulatorOffset =
                  0;

              }


              accumulator =
                null;


              captureFinished =
                true;


              checkFinished();

            },
            150
          );

        },
        {
          once:
            true
        }
      );


      // ---------------------------------------------------
      // EMPEZAR
      // ---------------------------------------------------

      console.log(
        "🎙️ Capturando audio sin cargar el vídeo completo…"
      );


      try {

        await video.play();


      } catch (
        playError
      ) {

        throw new Error(
          "Chrome bloqueó la reproducción interna. Selecciona otra vez el vídeo."
        );

      }


      await finishedPromise;


      // ===================================================
      // RESULTADO FINAL
      // ===================================================

      const finalResult = {

        text:
          textParts
            .join(" ")
            .replace(
              /\s+/g,
              " "
            )
            .trim(),


        chunks:
          finalChunks

      };


      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );


      console.log(
        "✅ TRANSCRIPCIÓN v0.4.1 TERMINADA"
      );


      console.log(
        finalResult
      );


      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );


      if (
        typeof onProgress ===
        "function"
      ) {

        onProgress({

          status:
            "done",

          stage:
            "complete",

          progress:
            100

        });

      }


      return finalResult;


    } catch (
      error
    ) {

      console.error(
        "❌ Error del analizador v0.4.1:",
        error
      );


      throw error;


    } finally {

      await cleanup();

    }

  }


  // =======================================================
  // TRANSCRIBIR PCM DIRECTAMENTE
  // =======================================================

  async function transcribeAudio(
    audio,
    onProgress = null
  ) {

    if (
      !audio
    ) {

      throw new Error(
        "No se recibió audio"
      );

    }


    const whisper =
      await getTranscriber(
        onProgress
      );


    return await whisper(
      audio,
      {

        return_timestamps:
          true,

        language:
          "portuguese",

        task:
          "transcribe"

      }
    );

  }


  // =======================================================
  // TRANSCRIBIR DESDE URL
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


    console.log(
      "🌐 Obteniendo vídeo…"
    );


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
        "mundo-infinito.mp4",
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
  // API PÚBLICA
  // =======================================================

  window.MundoInfinitoAnalyzer = {

    getTranscriber,

    transcribeAudio,

    transcribeVideoFile,

    transcribeVideoUrl

  };


  console.log(
    "✅ MundoInfinitoAnalyzer v0.4.1 preparado · CPU/WASM q4"
  );


})();
