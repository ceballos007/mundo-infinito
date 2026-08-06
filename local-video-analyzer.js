// =========================================================
// MUNDO INFINITO · ANALIZADOR LOCAL v0.3
// Transcripción gratuita por fragmentos
// Reduce consumo de memoria
// =========================================================

"use strict";

(() => {

  console.log(
    "🧠 Analizador local de Mundo Infinito v0.3 cargado"
  );


  // =======================================================
  // ESTADO
  // =======================================================

  let transcriber = null;
  let loadingModel = false;


  const TARGET_SAMPLE_RATE =
    16000;


  const CHUNK_SECONDS =
    20;


  // =======================================================
  // WEBGPU
  // =======================================================

  function hasWebGPU() {

    return (
      typeof navigator !== "undefined" &&
      "gpu" in navigator
    );

  }


  // =======================================================
  // TRANSFORMERS.JS
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
          "No se pudo cargar Whisper"
        );

      }


      return transcriber;

    }


    loadingModel =
      true;


    try {

      console.log(
        "📦 Cargando Whisper…"
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
          "onnx-community/whisper-tiny",
          options
        );


      console.log(
        "✅ Whisper preparado"
      );


      return transcriber;


    } catch (
      error
    ) {

      console.error(
        "❌ No se pudo cargar Whisper:",
        error
      );


      throw error;


    } finally {

      loadingModel =
        false;

    }

  }


  // =======================================================
  // DECODIFICAR AUDIO DEL VÍDEO
  // =======================================================

  async function decodeVideoAudio(
    file
  ) {

    if (
      !file
    ) {

      throw new Error(
        "No se recibió ningún vídeo"
      );

    }


    console.log(
      "🎬 Extrayendo audio del vídeo…"
    );


    console.log(
      "📄 Archivo:",
      file.name || "vídeo",
      file.type || "tipo desconocido",
      `${Math.round(
        (
          (file.size || 0) /
          1024 /
          1024
        ) * 10
      ) / 10} MB`
    );


    const arrayBuffer =
      await file.arrayBuffer();


    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;


    if (
      !AudioContextClass
    ) {

      throw new Error(
        "Este navegador no permite decodificar audio"
      );

    }


    const audioContext =
      new AudioContextClass();


    try {

      const decoded =
        await audioContext
          .decodeAudioData(
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


    } catch (
      error
    ) {

      console.error(
        "❌ No se pudo extraer el audio:",
        error
      );


      throw new Error(
        "Chrome no pudo decodificar el audio de este vídeo"
      );


    } finally {

      try {

        await audioContext.close();

      } catch (_) {

        // Nada.
      }

    }

  }


  // =======================================================
  // MEZCLAR A MONO
  // =======================================================

  function mixToMono(
    audioBuffer
  ) {

    const length =
      audioBuffer.length;


    const channels =
      audioBuffer.numberOfChannels;


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
        audioBuffer
          .getChannelData(
            channel
          );


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


    return mono;

  }


  // =======================================================
  // REMUESTREAR FLOAT32 A 16 KHZ
  // =======================================================

  function resampleFloat32(
    input,
    sourceRate,
    targetRate =
      TARGET_SAMPLE_RATE
  ) {

    if (
      sourceRate ===
      targetRate
    ) {

      return new Float32Array(
        input
      );

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

      const sourcePosition =
        i * ratio;


      const left =
        Math.floor(
          sourcePosition
        );


      const right =
        Math.min(
          left + 1,
          input.length - 1
        );


      const fraction =
        sourcePosition -
        left;


      output[i] =
        input[left] *
        (
          1 - fraction
        ) +
        input[right] *
        fraction;

    }


    return output;

  }


  // =======================================================
  // PREPARAR AUDIO A 16 KHZ
  // =======================================================

  async function resampleTo16k(
    audioBuffer
  ) {

    if (
      !audioBuffer
    ) {

      throw new Error(
        "No se recibió AudioBuffer"
      );

    }


    console.log(
      "🎚️ Preparando audio mono 16 kHz…"
    );


    const mono =
      mixToMono(
        audioBuffer
      );


    const audio16k =
      resampleFloat32(
        mono,
        audioBuffer.sampleRate,
        TARGET_SAMPLE_RATE
      );


    console.log(
      "✅ Audio preparado:",
      {
        samples:
          audio16k.length,

        seconds:
          Math.round(
            audio16k.length /
            TARGET_SAMPLE_RATE
          )
      }
    );


    return audio16k;

  }


  // =======================================================
  // DIVIDIR AUDIO EN TROZOS
  // =======================================================

  function splitAudioIntoChunks(
    audio,
    seconds =
      CHUNK_SECONDS
  ) {

    const samplesPerChunk =
      TARGET_SAMPLE_RATE *
      seconds;


    const chunks =
      [];


    for (
      let start = 0;
      start < audio.length;
      start += samplesPerChunk
    ) {

      const end =
        Math.min(
          start +
          samplesPerChunk,
          audio.length
        );


      chunks.push({

        startSample:
          start,

        startSecond:
          start /
          TARGET_SAMPLE_RATE,

        audio:
          audio.slice(
            start,
            end
          )

      });

    }


    return chunks;

  }


  // =======================================================
  // TRANSCRIBIR UN FRAGMENTO
  // =======================================================

  async function transcribeChunk(
    whisper,
    chunkAudio
  ) {

    return await whisper(
      chunkAudio,
      {

        return_timestamps:
          true,

        chunk_length_s:
          20,

        stride_length_s:
          2,

        language:
          "portuguese",

        task:
          "transcribe"

      }
    );

  }


  // =======================================================
  // AJUSTAR TIMESTAMPS AL TIEMPO REAL DEL VÍDEO
  // =======================================================

  function normalizeChunkResult(
    result,
    offsetSeconds
  ) {

    const normalizedChunks =
      [];


    const resultChunks =
      Array.isArray(
        result?.chunks
      )

        ? result.chunks

        : [];


    resultChunks.forEach(
      chunk => {

        const timestamp =
          Array.isArray(
            chunk.timestamp
          )

            ? chunk.timestamp

            : [
                0,
                null
              ];


        const start =
          Number(
            timestamp[0] ||
            0
          ) +
          offsetSeconds;


        const end =
          timestamp[1] ==
            null

            ? null

            : Number(
                timestamp[1]
              ) +
              offsetSeconds;


        normalizedChunks.push({

          text:
            String(
              chunk.text ||
              ""
            ).trim(),

          timestamp:
            [
              start,
              end
            ]

        });

      }
    );


    return {

      text:
        String(
          result?.text ||
          ""
        ).trim(),

      chunks:
        normalizedChunks

    };

  }


  // =======================================================
  // TRANSCRIBIR AUDIO POR FRAGMENTOS
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


    const pieces =
      splitAudioIntoChunks(
        audio,
        CHUNK_SECONDS
      );


    console.log(
      `🎧 Audio dividido en ${pieces.length} fragmentos`
    );


    const allText =
      [];


    const allChunks =
      [];


    for (
      let index = 0;
      index < pieces.length;
      index++
    ) {

      const piece =
        pieces[index];


      console.log(
        `🎧 Transcribiendo fragmento ${index + 1}/${pieces.length}`
      );


      if (
        typeof onProgress ===
        "function"
      ) {

        onProgress({

          status:
            "transcribing",

          chunk:
            index + 1,

          total_chunks:
            pieces.length,

          progress:
            (
              index /
              pieces.length
            ) * 100

        });

      }


      const result =
        await transcribeChunk(
          whisper,
          piece.audio
        );


      const normalized =
        normalizeChunkResult(
          result,
          piece.startSecond
        );


      if (
        normalized.text
      ) {

        allText.push(
          normalized.text
        );

      }


      allChunks.push(
        ...normalized.chunks
      );


      /*
       * Dejamos respirar al navegador
       * entre fragmentos.
       */
      await new Promise(
        resolve =>
          window.setTimeout(
            resolve,
            50
          )
      );

    }


    if (
      typeof onProgress ===
      "function"
    ) {

      onProgress({

        status:
          "done",

        chunk:
          pieces.length,

        total_chunks:
          pieces.length,

        progress:
          100

      });

    }


    const finalResult = {

      text:
        allText
          .join(" ")
          .trim(),

      chunks:
        allChunks

    };


    console.log(
      "📝 Transcripción completa:",
      finalResult
    );


    return finalResult;

  }


  // =======================================================
  // TRANSCRIBIR ARCHIVO DE VÍDEO
  // =======================================================

  async function transcribeVideoFile(
    file,
    onProgress = null
  ) {

    if (
      !file
    ) {

      throw new Error(
        "Selecciona primero un vídeo"
      );

    }


    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    console.log(
      "🧠 MUNDO INFINITO · ANÁLISIS LOCAL v0.3"
    );

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );


    const decoded =
      await decodeVideoAudio(
        file
      );


    const audio16k =
      await resampleTo16k(
        decoded
      );


    const result =
      await transcribeAudio(
        audio16k,
        onProgress
      );


    console.log(
      "✅ TRANSCRIPCIÓN TERMINADA"
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

    if (
      !url
    ) {

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


    if (
      !response.ok
    ) {

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
  // API PÚBLICA
  // =======================================================

  window.MundoInfinitoAnalyzer = {

    hasWebGPU,

    getTranscriber,

    decodeVideoAudio,

    resampleTo16k,

    splitAudioIntoChunks,

    transcribeAudio,

    transcribeVideoFile,

    transcribeVideoUrl

  };


  console.log(
    "✅ MundoInfinitoAnalyzer v0.3 preparado"
  );


})();
