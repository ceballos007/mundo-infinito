// =========================================================
// MUNDO INFINITO · ANALIZADOR LOCAL v0.2
// Transcripción gratuita de vídeos en el navegador
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

    // Ya está cargado
    if (transcriber) {

      return transcriber;

    }


    // Si otra llamada lo está cargando,
    // esperamos a que termine.
    if (loadingModel) {

      while (loadingModel) {

        await new Promise(
          resolve =>
            window.setTimeout(
              resolve,
              200
            )
        );

      }


      if (!transcriber) {

        throw new Error(
          "No se pudo cargar Whisper"
        );

      }


      return transcriber;

    }


    loadingModel = true;


    try {

      console.log(
        "📦 Cargando Whisper por primera vez…"
      );


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


      // WebGPU si está disponible.
      // Si no, Transformers.js utilizará WASM/CPU.
      if (hasWebGPU()) {

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
          "onnx-community/whisper-tiny",
          options
        );


      console.log(
        "✅ Whisper preparado"
      );


      return transcriber;


    } catch (error) {

      console.error(
        "❌ No se pudo cargar Whisper:",
        error
      );


      throw error;


    } finally {

      loadingModel = false;

    }

  }


  // =======================================================
  // TRANSCRIBIR AUDIO YA PREPARADO
  // =======================================================

  async function transcribeAudio(
    audio,
    onProgress = null
  ) {

    if (!audio) {

      throw new Error(
        "No se recibió audio para transcribir"
      );

    }


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

          // Queremos tiempos para después saber
          // cuándo aparece cada recomendación.
          return_timestamps:
            true,

          chunk_length_s:
            30,

          stride_length_s:
            5,

          // Nuestros vídeos de Brasil
          // pueden contener portugués.
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
  // DECODIFICAR AUDIO DEL MP4
  // =======================================================

  async function decodeVideoAudio(
    file
  ) {

    if (!file) {

      throw new Error(
        "No se ha recibido ningún vídeo"
      );

    }


    console.log(
      "🎬 Extrayendo audio del vídeo…"
    );


    console.log(
      "📄 Archivo:",
      file.name || "vídeo",
      file.type || "tipo desconocido",
      `${Math.round((file.size || 0) / 1024 / 1024 * 10) / 10} MB`
    );


    const arrayBuffer =
      await file.arrayBuffer();


    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;


    if (!AudioContextClass) {

      throw new Error(
        "Este navegador no permite decodificar audio"
      );

    }


    const audioContext =
      new AudioContextClass();


    try {

      const decoded =
        await audioContext.decodeAudioData(
          arrayBuffer.slice(0)
        );


      console.log(
        "🎵 Audio decodificado:",
        {
          duration:
            decoded.duration,

          sampleRate:
            decoded.sampleRate,

          channels:
            decoded.numberOfChannels
        }
      );


      return decoded;


    } catch (error) {

      console.error(
        "❌ No se pudo extraer el audio del vídeo:",
        error
      );


      throw new Error(
        "Chrome no pudo decodificar el audio de este vídeo"
      );


    } finally {

      try {

        await audioContext.close();

      } catch (_) {

        // No hacemos nada.
      }

    }

  }


  // =======================================================
  // CONVERTIR AUDIO A MONO
  // =======================================================

  function createMonoBuffer(
    audioBuffer,
    audioContext
  ) {

    const monoBuffer =
      audioContext.createBuffer(
        1,
        audioBuffer.length,
        audioBuffer.sampleRate
      );


    const mono =
      monoBuffer.getChannelData(
        0
      );


    const channels =
      audioBuffer.numberOfChannels;


    for (
      let channel = 0;
      channel < channels;
      channel++
    ) {

      const source =
        audioBuffer.getChannelData(
          channel
        );


      for (
        let i = 0;
        i < source.length;
        i++
      ) {

        mono[i] +=
          source[i] /
          channels;

      }

    }


    return monoBuffer;

  }


  // =======================================================
  // REMUESTREAR A 16 kHz
  // =======================================================

  async function resampleTo16k(
    audioBuffer
  ) {

    if (!audioBuffer) {

      throw new Error(
        "No se recibió AudioBuffer"
      );

    }


    const targetRate =
      16000;


    console.log(
      "🎚️ Preparando audio para Whisper…"
    );


    // Si ya está a 16 kHz,
    // solamente lo convertimos a mono.
    if (
      audioBuffer.sampleRate ===
      targetRate
    ) {

      const channels =
        audioBuffer.numberOfChannels;


      if (channels === 1) {

        return new Float32Array(
          audioBuffer.getChannelData(
            0
          )
        );

      }


      const result =
        new Float32Array(
          audioBuffer.length
        );


      for (
        let channel = 0;
        channel < channels;
        channel++
      ) {

        const source =
          audioBuffer.getChannelData(
            channel
          );


        for (
          let i = 0;
          i < source.length;
          i++
        ) {

          result[i] +=
            source[i] /
            channels;

        }

      }


      return result;

    }


    const targetLength =
      Math.ceil(
        audioBuffer.duration *
        targetRate
      );


    const offlineContext =
      new OfflineAudioContext(
        1,
        targetLength,
        targetRate
      );


    const monoBuffer =
      createMonoBuffer(
        audioBuffer,
        offlineContext
      );


    const sourceNode =
      offlineContext
        .createBufferSource();


    sourceNode.buffer =
      monoBuffer;


    sourceNode.connect(
      offlineContext.destination
    );


    sourceNode.start(0);


    const rendered =
      await offlineContext
        .startRendering();


    console.log(
      "✅ Audio preparado:",
      {
        duration:
          rendered.duration,

        sampleRate:
          rendered.sampleRate,

        samples:
          rendered.length
      }
    );


    return new Float32Array(
      rendered.getChannelData(
        0
      )
    );

  }


  // =======================================================
  // TRANSCRIBIR UN ARCHIVO DE VÍDEO
  // =======================================================

  async function transcribeVideoFile(
    file,
    onProgress = null
  ) {

    if (!file) {

      throw new Error(
        "Selecciona primero un vídeo"
      );

    }


    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    console.log(
      "🧠 MUNDO INFINITO · ANÁLISIS LOCAL"
    );

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );


    // 1. MP4 → AudioBuffer
    const decoded =
      await decodeVideoAudio(
        file
      );


    // 2. AudioBuffer → Float32 mono 16 kHz
    const audio16k =
      await resampleTo16k(
        decoded
      );


    console.log(
      "🎧 Enviando audio a Whisper…"
    );


    // 3. Whisper
    const result =
      await transcribeAudio(
        audio16k,
        onProgress
      );


    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    console.log(
      "✅ TRANSCRIPCIÓN TERMINADA"
    );

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );


    console.log(
      result
    );


    return result;

  }


  // =======================================================
  // TRANSCRIBIR DESDE URL
  // =======================================================

  async function transcribeVideoUrl(
    url,
    onProgress = null
  ) {

    if (!url) {

      throw new Error(
        "No se recibió la URL del vídeo"
      );

    }


    console.log(
      "🌐 Descargando vídeo desde Storage…"
    );


    const response =
      await fetch(
        url
      );


    if (!response.ok) {

      throw new Error(
        `No se pudo descargar el vídeo (${response.status})`
      );

    }


    const blob =
      await response.blob();


    const extension =
      blob.type.includes(
        "webm"
      )
        ? "webm"
        : "mp4";


    const file =
      new File(
        [
          blob
        ],
        `mundo-infinito.${extension}`,
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
  // API PÚBLICA PARA VIDEO-EXPLORER
  // =======================================================

  window.MundoInfinitoAnalyzer = {

    hasWebGPU,

    getTranscriber,

    transcribeAudio,

    decodeVideoAudio,

    resampleTo16k,

    transcribeVideoFile,

    transcribeVideoUrl

  };


  console.log(
    "✅ MundoInfinitoAnalyzer preparado"
  );


})();
