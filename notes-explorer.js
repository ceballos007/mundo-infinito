"use strict";

(() => {

  const openButton =
    document.getElementById(
      "openNotesModal"
    );

  const modal =
    document.getElementById(
      "notesModal"
    );

  const closeButton =
    document.getElementById(
      "closeNotesModal"
    );

  const analyzeButton =
    document.getElementById(
      "analyzeNotesButton"
    );

  const notesInput =
    document.getElementById(
      "notesInput"
    );

  /*
   * Este módulo es independiente.
   * Si falta algún elemento,
   * simplemente no se activa.
   */

  if (
    !openButton ||
    !modal ||
    !closeButton
  ) {
    console.warn(
      "Mundo Infinito · módulo de notas no disponible"
    );

    return;
  }

  function openNotes() {

    modal.classList.add(
      "open"
    );

    modal.setAttribute(
      "aria-hidden",
      "false"
    );

    window.setTimeout(
      () => {
        notesInput?.focus();
      },
      100
    );
  }

  function closeNotes() {

    modal.classList.remove(
      "open"
    );

    modal.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  openButton.addEventListener(
    "click",
    openNotes
  );

  closeButton.addEventListener(
    "click",
    closeNotes
  );

  modal.addEventListener(
    "click",
    event => {

      if (
        event.target === modal
      ) {
        closeNotes();
      }
    }
  );

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape" &&
        modal.classList.contains(
          "open"
        )
      ) {
        closeNotes();
      }
    }
  );

  analyzeButton
    ?.addEventListener(
      "click",
      () => {

        const text =
          String(
            notesInput?.value ||
            ""
          ).trim();

        if (!text) {
          return;
        }

        /*
         * De momento no llamamos
         * a ninguna Edge Function.
         */

        console.log(
          "📝 Recomendaciones:",
          text
        );

        alert(
          "Las recomendaciones están preparadas para analizar."
        );
      }
    );

})();
