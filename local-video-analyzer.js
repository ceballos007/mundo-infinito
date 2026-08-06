// =========================================================
// MUNDO INFINITO · ANALIZADOR LOCAL v0.1
// Transcripción gratuita en el navegador
// =========================================================

"use strict";

(() => {

  console.log(
    "🧠 Analizador local de Mundo Infinito cargado"
  );


  // =======================================================
  // ESTADO
  // =======================================================

  let transcriber = null;

  let loadingModel = false;


  // =======================================================
  // COMPROBAR WEBGPU
  // =======================================================

  function hasWebGPU() {

    return (
      typeof navigator !== "undefined" &&
      "gpu" in navigator
    );

  }


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
  // =======================================================

  async function getTranscriber(
    onProgress = null
  ) {

    if (transcriber) {

      return transcriber;

    }


    if (loadingModel) {

      while (loadingModel) {

        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              200
            )
        );

      }

      return transcriber;

    }


    loadingModel = true;


    try {

      const {
        pipeline
      } =
        await loadTransformers();


      const options = {

        dtype:
          "q8",

        progress_callback:
          progress => {

            if (
              typeof onProgress ===
              "function"
            ) {

              onProgress(
                progress
              );

            }

          }

      };


      /*
       * Si Chrome admite WebGPU,
       * usamos la GPU.
       *
       * Si no, Transformers.js
       * seguirá usando WASM/CPU.
       */

      if (
        hasWebGPU()
      ) {

        options.device =
          "webgpu";

      }


      console.log(
        hasWebGPU()
          ? "⚡ Whisper usando WebGPU"
          : "🧠 Whisper usando CPU/WASM"
      );


      transcriber =

        await pipeline(
          "automatic-speech-recognition",

          /*
           * Multilingüe.
           * Nos interesa portugués/español,
           * no whisper-tiny.en.
           */

          "onnx-community/whisper-tiny",

          options
        );


      console.log(
        "✅ Whisper preparado"
      );


      return transcriber;


    } finally {

      loadingModel =
        false;

    }

  }


  // =======================================================
  // TRANSCRIBIR
  // =======================================================

  async function transcribeAudio(
    audio,
    onProgress = null
  ) {

    const whisper =
      await getTranscriber(
        onProgress
      );


    console.log(
      "🎧 Transcribiendo audio…"
    );


    const result =

      await whisper(
        audio,
        {

          /*
           * Queremos timestamps
           * para saber EN QUÉ MOMENTO
           * se menciona cada cosa.
           */

          return_timestamps:
            true,

          chunk_length_s:
            30,

          stride_length_s:
            5,

          language:
            "portuguese",

          task:
            "transcribe"

        }
      );


    console.log(
      "📝 Transcripción:",
      result
    );


    return result;

  }


  // =======================================================
  // API PARA MUNDO INFINITO
  // =======================================================

  window.MundoInfinitoAnalyzer = {

    hasWebGPU,

    getTranscriber,

    transcribeAudio

  };


})();
