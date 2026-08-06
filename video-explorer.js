0001 // =========================================================
0002 // MUNDO INFINITO · video-explorer v0.6.2
0003 // Extensión segura sobre app.js v0.5 estable
0004 // Un vídeo -> varios detalles -> revisión -> Supabase
0005 // =========================================================
0006 "use strict";
0007 (() => {
0008 // -------------------------------------------------------
0009 // DOM v0.6
0010 // -------------------------------------------------------
0011 const modalCard =
0012 discoveryModal?.querySelector(".discovery-v06-card");
0013 const videoLink =
0014 document.getElementById("discoveryVideoLink");
0015 const videoFile =
0016 document.getElementById("discoveryVideoFile");
0017 const videoPreview =
0018 document.getElementById("discoveryVideoPreview");
0019 const previewPlayer =
0020 document.getElementById("discoveryPreviewPlayer");
0021 const explorationStatus =
0022 document.getElementById("videoExplorationStatus");
0023 const explorationMessage =
0024 document.getElementById("explorationMessage");
0025 const progressBar =
0026 document.getElementById("explorationProgressBar");
0027 const resultsSection =
0028 document.getElementById("explorationResults");
0029 const detailsCount =
0030 document.getElementById("detectedDetailsCount");
0031 const detailsList =
0032 document.getElementById("detectedDetailsList");
0033 const addManualButton =
0034 document.getElementById("addManualDetailButton");
0035 const manualEditor =
0036 document.getElementById("manualDetailEditor");
0037 const detailType =
0038 document.getElementById("detailType");
0039 const titleInput =
0040 document.getElementById("discoveryTitle");
0041 const placeInput =
0042 document.getElementById("discoveryPlace");
0043 const categoryInput =
0044 document.getElementById("discoveryCategory");
0045 const commentInput =
0046 document.getElementById("discoveryComment");
0047 const startInput =
0048 document.getElementById("detailTimestampStart");
0049 const endInput =
0050 document.getElementById("detailTimestampEnd");
0051 const useCurrentTimeButton =
0052 document.getElementById("useCurrentVideoTime");
0053 const cancelEditButton =
0054 document.getElementById("cancelDetailEdit");
0055 const addDetailButton =
0056 document.getElementById("addDetailToDraft");
0057 const draftSection =
0058 document.getElementById("videoDraftSummary");
0059 const draftCount =
0060 document.getElementById("draftDetailsCount");
0061 const draftList =
0062 document.getElementById("videoDraftDetailsList");
0063 const saveAllButton =
0064 document.getElementById("saveAllDiscoveriesButton");
0065 if (
0066 !discoveryForm ||
0067 !modalCard ||
0068 !videoLink
0069 ) {
0070 console.warn(
0071 "Mundo Infinito v0.6.2: interfaz de exploración no disponible."
0072 );
0073 return;
0074 }
0075 // -------------------------------------------------------
0076 // Evitar que required bloquee campos ocultos
0077 // -------------------------------------------------------
0078 [
0079 titleInput,
0080 placeInput,
0081 categoryInput
0082 ].forEach(
0083 el => {
0084 if (el) {
0085 el.required = false;
0086 }
0087 }
0088 );
0089 // =======================================================
0090 // ESTADO
0091 // =======================================================
0092 let draftDetails = [];
0093 let editingIndex = null;
0094 let selectedFile = null;
0095 let selectedFileUrl = null;
0096 let uploadedVideoUrl = null;
0097 let uploadedVideoPath = null;
0098 let uploadingVideo = false;
0099 let explorationRun = 0;
0100 let linkDebounce = null;
0101 let saving = false;
0102 // =======================================================
0103 // ICONOS
0104 // =======================================================
0105 const ICONS = {
0106 Lugar: "",
0107 Restaurante: "",
0108 Bar: "",
0109 Playa: "",
0110 Mirador: "",
0111 Consejo: "",
0112 Precio: "",
0113 Transporte: "",
0114 Aviso: "⚠",
0115 Compras: "",
0116 Evento: "",
0117 "Vida nocturna": "",
0118 Gastronomía: "",
0119 Cultura: "",
0120 Parque: "",
0121 Otro: ""
0122 };
0123 // =======================================================
0124 // UTILIDADES DE TIEMPO
0125 // =======================================================
0126 function toSeconds(
0127 value
0128 ) {
0129 const text =
0130 String(
0131 value ?? ""
0132 ).trim();
0133 if (!text) {
0134 return 0;
0135 }
0136 if (
0137 /^\d+$/.test(
0138 text
0139 )
0140 ) {
0141 return Math.max(
0142 0,
0143 Number(
0144 text
0145 )
0146 );
0147 }
0148 const parts =
0149 text
0150 .split(":")
0151 .map(Number);
0152 if (
0153 parts.some(
0154 number =>
0155 !Number.isFinite(
0156 number
0157 )
0158 )
0159 ) {
0160 return 0;
0161 }
0162 if (
0163 parts.length === 2
0164 ) {
0165 return Math.max(
0166 0,
0167 (
0168 parts[0] * 60
0169 ) +
0170 parts[1]
0171 );
0172 }
0173 if (
0174 parts.length === 3
0175 ) {
0176 return Math.max(
0177 0,
0178 (
0179 parts[0] * 3600
0180 ) +
0181 (
0182 parts[1] * 60
0183 ) +
0184 parts[2]
0185 );
0186 }
0187 return 0;
0188 }
0189 function toTime(
0190 value
0191 ) {
0192 const total =
0193 Math.max(
0194 0,
0195 Math.floor(
0196 Number(
0197 value
0198 ) || 0
0199 )
0200 );
0201 const hours =
0202 Math.floor(
0203 total / 3600
0204 );
0205 const minutes =
0206 Math.floor(
0207 (
0208 total % 3600
0209 ) / 60
0210 );
0211 const seconds =
0212 total % 60;
0213 if (
0214 hours > 0
0215 ) {
0216 return (
0217 `${hours}:` +
0218 `${String(minutes).padStart(2, "0")}:` +
0219 `${String(seconds).padStart(2, "0")}`
0220 );
0221 }
0222 return (
0223 `${String(minutes).padStart(2, "0")}:` +
0224 `${String(seconds).padStart(2, "0")}`
0225 );
0226 }
0227 function iconFor(
0228 detail
0229 ) {
0230 return (
0231 ICONS[
0232 detail.type
0233 ] ||
0234 categoryIcons?.[
0235 detail.category
0236 ] ||
0237 "n"
0238 );
0239 }
0240 function safeText(
0241 value
0242 ) {
0243 return (
0244 typeof escapeHTML ===
0245 "function"
0246 )
0247 ? escapeHTML(
0248 value
0249 )
0250 : String(
0251 value ?? ""
0252 );
0253 }
0254 function setProgress(
0255 percent,
0256 message
0257 ) {
0258 if (
0259 progressBar
0260 ) {
0261 progressBar.style.width =
0262 `${Math.max(
0263 0,
0264 Math.min(
0265 100,
0266 percent
0267 )
0268 )}%`;
0269 }
0270 if (
0271 explorationMessage &&
0272 message
0273 ) {
0274 explorationMessage.textContent =
0275 message;
0276 }
0277 }
0278 function sourceUrl() {
0279 return String(
0280 videoLink.value ||
0281 ""
0282 ).trim();
0283 }
0284 // =======================================================
0285 // INFORMACIÓN DEL ENLACE SOCIAL
0286 // =======================================================
0287 function detectSocialPlatform(
0288 url
0289 ) {
0290 const text =
0291 String(
0292 url ||
0293 ""
0294 ).toLowerCase();
0295 if (text.includes("instagram.com")) return "instagram";
0296 if (text.includes("tiktok.com")) return "tiktok";
0297 return "other";
0298 }
0299 function extractHashtags(
0300 text
0301 ) {
0302 const matches =
0303 String(
0304 text ||
0305 ""
0306 ).match(/#[\p{L}\p{N}_]+/gu);
0307 return matches
0308 ? Array.from(new Set(matches))
0309 : [];
0310 }
0311 function buildCombinedContext({
0312 transcript = null,
0313 caption = "",
0314 hashtags = []
0315 } = {}) {
0316 const parts = [];
0317 if (caption) {
0318 parts.push(`DESCRIPCIÓN DEL POST:\n${caption}`);
0319 }
0320 if (hashtags?.length) {
0321 parts.push(`HASHTAGS:\n${hashtags.join(" ")}`);
0322 }
0323 if (transcript?.visualText) {
0324 parts.push(`TEXTO VISIBLE EN EL VÍDEO:\n${transcript.visualText}`);
0325 }
0326 if (
0327 transcript?.text &&
0328 transcript.text !== transcript.visualText
0329 ) {
0330 parts.push(`TRANSCRIPCIÓN:\n${transcript.text}`);
0331 }
0332 if (transcript?.audioText) {
0333 parts.push(`AUDIO:\n${transcript.audioText}`);
0334 }
0335 return parts
0336 .filter(Boolean)
0337 .join("\n\n")
0338 .trim();
0339 }
0340 // =======================================================
0341 // RESET
0342 // =======================================================
0343 function clearObjectUrl() {
0344 if (
0345 selectedFileUrl
0346 ) {
0347 URL.revokeObjectURL(
0348 selectedFileUrl
0349 );
0350 selectedFileUrl =
0351 null;
0352 }
0353 }
0354 function resetEditor() {
0355 editingIndex =
0356 null;
0357 if (detailType) {
0358 detailType.value =
0359 "Lugar";
0360 }
0361 if (titleInput) {
0362 titleInput.value =
0363 "";
0364 }
0365 if (placeInput) {
0366 placeInput.value =
0367 "";
0368 }
0369 if (categoryInput) {
0370 categoryInput.value =
0371 "";
0372 }
0373 if (commentInput) {
0374 commentInput.value =
0375 "";
0376 }
0377 if (startInput) {
0378 startInput.value =
0379 "00:00";
0380 }
0381 if (endInput) {
0382 endInput.value =
0383 "";
0384 }
0385 if (discoveryLat) {
0386 discoveryLat.value =
0387 "";
0388 }
0389 if (discoveryLng) {
0390 discoveryLng.value =
0391 "";
0392 }
0393 cancelEditButton
0394 ?.classList
0395 .add(
0396 "hidden"
0397 );
0398 if (
0399 addDetailButton
0400 ) {
0401 addDetailButton.textContent =
0402 "n Añadir detalle";
0403 }
0404 }
0405 function resetFlow() {
0406 explorationRun +=
0407 1;
0408 clearTimeout(
0409 linkDebounce
0410 );
0411 draftDetails =
0412 [];
0413 selectedFile =
0414 null;
0415 uploadedVideoUrl =
0416 null;
0417 uploadedVideoPath =
0418 null;
0419 uploadingVideo =
0420 false;
0421 clearObjectUrl();
0422 resetEditor();
0423 modalCard.classList.remove(
0424 "is-exploring",
0425 "has-results"
0426 );
0427 explorationStatus
0428 ?.classList
0429 .remove(
0430 "active"
0431 );
0432 resultsSection
0433 ?.classList
0434 .remove(
0435 "active"
0436 );
0437 draftSection
0438 ?.classList
0439 .remove(
0440 "active"
0441 );
0442 manualEditor
0443 ?.classList
0444 .remove(
0445 "open"
0446 );
0447 saveAllButton
0448 ?.classList
0449 .remove(
0450 "visible"
0451 );
0452 if (
0453 detailsList
0454 ) {
0455 detailsList.innerHTML =
0456 "";
0457 }
0458 if (
0459 draftList
0460 ) {
0461 draftList.innerHTML =
0462 "";
0463 }
0464 if (
0465 detailsCount
0466 ) {
0467 detailsCount.textContent =
0468 "0";
0469 }
0470 if (
0471 draftCount
0472 ) {
0473 draftCount.textContent =
0474 "0";
0475 }
0476 if (
0477 videoPreview
0478 ) {
0479 videoPreview.classList.add(
0480 "hidden"
0481 );
0482 }
0483 if (
0484 previewPlayer
0485 ) {
0486 previewPlayer.pause();
0487 previewPlayer.removeAttribute(
0488 "src"
0489 );
0490 previewPlayer.load();
0491 }
0492 setProgress(
0493 0,
0494 "Preparando el contenido…"
0495 );
0496 }
0497 function showExploring() {
0498 modalCard.classList.remove(
0499 "has-results"
0500 );
0501 modalCard.classList.add(
0502 "is-exploring"
0503 );
0504 explorationStatus
0505 ?.classList
0506 .add(
0507 "active"
0508 );
0509 resultsSection
0510 ?.classList
0511 .remove(
0512 "active"
0513 );
0514 manualEditor
0515 ?.classList
0516 .remove(
0517 "open"
0518 );
0519 saveAllButton
0520 ?.classList
0521 .remove(
0522 "visible"
0523 );
0524 }
0525 function showResults() {
0526 modalCard.classList.remove(
0527 "is-exploring"
0528 );
0529 modalCard.classList.add(
0530 "has-results"
0531 );
0532 explorationStatus
0533 ?.classList
0534 .remove(
0535 "active"
0536 );
0537 resultsSection
0538 ?.classList
0539 .add(
0540 "active"
0541 );
0542 renderDetails();
0543 }
0544 // =======================================================
0545 // APERTURA DEL MODAL
0546 // =======================================================
0547 openDiscoveryModal
0548 ?.addEventListener(
0549 "click",
0550 () => {
0551 resetFlow();
0552 window.setTimeout(
0553 () => {
0554 videoLink.focus();
0555 },
0556 120
0557 );
0558 }
0559 );
0560 closeDiscoveryModal
0561 ?.addEventListener(
0562 "click",
0563 () => {
0564 explorationRun +=
0565 1;
0566 clearObjectUrl();
0567 }
0568 );
0569 // =======================================================
0570 // SUPABASE STORAGE
0571 // =======================================================
0572 function safeVideoExtension(
0573 file
0574 ) {
0575 const byName =
0576 String(
0577 file?.name ||
0578 ""
0579 )
0580 .split(".")
0581 .pop()
0582 ?.toLowerCase();
0583 const known = {
0584 "video/mp4":
0585 "mp4",
0586 "video/quicktime":
0587 "mov",
0588 "video/webm":
0589 "webm",
0590 "video/x-m4v":
0591 "m4v"
0592 };
0593 return (
0594 known[
0595 file?.type
0596 ]
0597 ||
0598 (
0599 byName &&
0600 /^[a-z0-9]{2,5}$/.test(
0601 byName
0602 )
0603 ? byName
0604 : "mp4"
0605 )
0606 );
0607 }
0608 async function uploadVideoToStorage(
0609 file
0610 ) {
0611 if (!file) {
0612 throw new Error(
0613 "No se ha seleccionado ningún vídeo."
0614 );
0615 }
0616 if (
0617 !supabaseClient ||
0618 !supabaseOnline
0619 ) {
0620 throw new Error(
0621 "No hay conexión con Supabase."
0622 );
0623 }
0624 const extension =
0625 safeVideoExtension(
0626 file
0627 );
0628 const uniqueId =
0629 crypto.randomUUID
0630 ? crypto.randomUUID()
0631 : `${Date.now()}-${Math.random()
0632 .toString(16)
0633 .slice(2)}`;
0634 const filePath =
0635 `uploads/${uniqueId}.${extension}`;
0636 const {
0637 data,
0638 error
0639 } =
0640 await supabaseClient
0641 .storage
0642 .from(
0643 "videos"
0644 )
0645 .upload(
0646 filePath,
0647 file,
0648 {
0649 cacheControl:
0650 "3600",
0651 upsert:
0652 false,
0653 contentType:
0654 file.type ||
0655 "video/mp4"
0656 }
0657 );
0658 if (
0659 error
0660 ) {
0661 throw error;
0662 }
0663 const {
0664 data:
0665 publicData
0666 } =
0667 supabaseClient
0668 .storage
0669 .from(
0670 "videos"
0671 )
0672 .getPublicUrl(
0673 data.path
0674 );
0675 const publicUrl =
0676 publicData
0677 ?.publicUrl;
0678 if (
0679 !publicUrl
0680 ) {
0681 throw new Error(
0682 "Supabase no devolvió la URL pública del vídeo."
0683 );
0684 }
0685 return {
0686 path:
0687 data.path,
0688 url:
0689 publicUrl
0690 };
0691 } // =======================================================
0692 // SELECCIONAR VÍDEO
0693 // =======================================================
0694 videoFile
0695 ?.addEventListener(
0696 "change",
0697 async () => {
0698 const file =
0699 videoFile
0700 .files?.[0];
0701 if (!file) {
0702 return;
0703 }
0704 selectedFile =
0705 file;
0706 uploadedVideoUrl =
0707 null;
0708 uploadedVideoPath =
0709 null;
0710 // -----------------------------------------------
0711 // PREVISUALIZACIÓN LOCAL
0712 // -----------------------------------------------
0713 clearObjectUrl();
0714 selectedFileUrl =
0715 URL.createObjectURL(
0716 file
0717 );
0718 if (
0719 previewPlayer
0720 ) {
0721 previewPlayer.src =
0722 selectedFileUrl;
0723 previewPlayer.load();
0724 }
0725 videoPreview
0726 ?.classList
0727 .remove(
0728 "hidden"
0729 );
0730 // -----------------------------------------------
0731 // SUBIR A STORAGE
0732 // -----------------------------------------------
0733 try {
0734 uploadingVideo =
0735 true;
0736 showToast?.(
0737 "n Subiendo vídeo a Mundo Infinito…"
0738 );
0739 setProgress(
0740 8,
0741 "Guardando el vídeo…"
0742 );
0743 const uploaded =
0744 await uploadVideoToStorage(
0745 file
0746 );
0747 uploadedVideoUrl =
0748 uploaded.url;
0749 uploadedVideoPath =
0750 uploaded.path;
0751 console.log(
0752 "nn Vídeo guardado:",
0753 uploadedVideoPath
0754 );
0755 console.log(
0756 "n URL del vídeo:",
0757 uploadedVideoUrl
0758 );
0759 showToast?.(
0760 "n Vídeo guardado"
0761 );
0762 // =============================================
0763 // ANALIZAR EN SERVIDOR CON GEMINI
0764 // =============================================
0765 setProgress(
0766 30,
0767 "Analizando el vídeo con IA…"
0768 );
0769 console.log(
0770 "n Enviando vídeo a Gemini:",
0771 uploadedVideoUrl
0772 );
0773 await exploreVideo({
0774 type:
0775 "file",
0776 file,
0777 url:
0778 uploadedVideoUrl,
0779 storagePath:
0780 uploadedVideoPath,
0781 transcript:
0782 null
0783 });
0784 } catch (
0785 error
0786 ) {
0787 console.error(
0788 "Mundo Infinito v0.6.2 · Error subiendo vídeo:",
0789 error
0790 );
0791 showToast?.(
0792 "No se pudo subir o analizar el vídeo"
0793 );
0794 } finally {
0795 uploadingVideo =
0796 false;
0797 }
0798 }
0799 );
0800 // =======================================================
0801 // CONVERTIR TRANSCRIPCIÓN EN DETALLES
0802 // =======================================================
0803 function detailsFromTranscript(
0804 transcript
0805 ) {
0806 if (
0807 !transcript
0808 ) {
0809 return [];
0810 }
0811 const results =
0812 [];
0813 const chunks =
0814 Array.isArray(
0815 transcript.chunks
0816 )
0817 ? transcript.chunks
0818 : [];
0819 const fullText =
0820 String(
0821 transcript.text ||
0822 transcript.visualText ||
0823 ""
0824 ).trim();
0825 // =====================================================
0826 // UTILIDADES
0827 // =====================================================
0828 function normalize(
0829 text
0830 ) {
0831 return String(
0832 text ||
0833 ""
0834 )
0835 .normalize(
0836 "NFD"
0837 )
0838 .replace(
0839 /[\u0300-\u036f]/g,
0840 ""
0841 )
0842 .toLowerCase();
0843 }
0844 function createDetail({
0845 title,
0846 place,
0847 type,
0848 category,
0849 comment,
0850 timestampStart = 0,
0851 confidence = 0.8
0852 }) {
0853 return {
0854 id:
0855 crypto.randomUUID
0856 ? crypto.randomUUID()
0857 : `auto-${Date.now()}-${Math.random()}`,
0858 title,
0859 place,
0860 type,
0861 category,
0862 comment,
0863 timestampStart:
0864 Number(
0865 timestampStart ||
0866 0
0867 ),
0868 timestampEnd:
0869 null,
0870 lat:
0871 null,
0872 lng:
0873 null,
0874 confidence,
0875 automatic:
0876 true
0877 };
0878 }
0879 function pushUnique(
0880 detail
0881 ) {
0882 const key =
0883 [
0884 normalize(
0885 detail.type
0886 ),
0887 normalize(
0888 detail.title
0889 ),
0890 Math.floor(
0891 Number(
0892 detail.timestampStart ||
0893 0
0894 ) / 3
0895 )
0896 ].join(
0897 "|"
0898 );
0899 const exists =
0900 results.some(
0901 item => {
0902 const itemKey =
0903 [
0904 normalize(
0905 item.type
0906 ),
0907 normalize(
0908 item.title
0909 ),
0910 Math.floor(
0911 Number(
0912 item.timestampStart ||
0913 0
0914 ) / 3
0915 )
0916 ].join(
0917 "|"
0918 );
0919 return (
0920 itemKey ===
0921 key
0922 );
0923 }
0924 );
0925 if (
0926 !exists
0927 ) {
0928 results.push(
0929 detail
0930 );
0931 }
0932 }
0933 // =====================================================
0934 // DICCIONARIOS
0935 // =====================================================
0936 const places = [
0937 "Rio de Janeiro",
0938 "Río de Janeiro",
0939 "Copacabana",
0940 "Ipanema",
0941 "Leblon",
0942 "Lapa",
0943 "Santa Teresa",
0944 "Botafogo",
0945 "Arpoador",
0946 "Urca",
0947 "Lagoa",
0948 "Flamengo",
0949 "Gávea",
0950 "Gavea",
0951 "São Conrado",
0952 "Sao Conrado",
0953 "Barra da Tijuca",
0954 "Recreio",
0955 "Cristo Redentor",
0956 "Corcovado",
0957 "Pão de Açúcar",
0958 "Pao de Acucar",
0959 "Escadaria Selarón",
0960 "Escadaria Selaron",
0961 "Maracanã",
0962 "Maracana",
0963 "Jardim Botânico",
0964 "Jardim Botanico",
0965 "Ilha Grande",
0966 "Lopes Mendes"
0967 ];
0968 const airportTerms = [
0969 "aeroporto",
0970 "aeropuerto",
0971 "galeao",
0972 "galeão",
0973 "gig",
0974 "santos dumont",
0975 "sdu"
0976 ];
0977 const transportTerms = [
0978 "uber",
0979 "99",
0980 "99pop",
0981 "taxi",
0982 "táxi",
0983 "metro",
0984 "metrô",
0985 "onibus",
0986 "ônibus",
0987 "autobus",
0988 "autobús",
0989 "transfer",
0990 "van",
0991 "trem",
0992 "tren"
0993 ];
0994 const adviceTerms = [
0995 "erro",
0996 "error",
0997 "cuidado",
0998 "evita",
0999 "evitar",
1000 "nao faca",
1001 "não faça",
1002 "no hagas",
1003 "recomendo",
1004 "recomiendo",
1005 "recomendamos",
1006 "dica",
1007 "consejo",
1008 "importante",
1009 "vale a pena",
1010 "vale la pena",
1011 "tem que",
1012 "hay que",
1013 "turista",
1014 "turistas"
1015 ];
1016 const restaurantTerms = [
1017 "restaurante",
1018 "restaurant",
1019 "bar",
1020 "boteco",
1021 "cafeteria",
1022 "café",
1023 "cafe",
1024 "comer",
1025 "comida"
1026 ];
1027 const beachTerms = [
1028 "praia",
1029 "playa",
1030 "beach"
1031 ];
1032 const shoppingTerms = [
1033 "shopping",
1034 "compras",
1035 "loja",
1036 "tienda",
1037 "mercado"
1038 ];
1039 const priceRegex =
1040 /(?:R\$|RS|\$|€)\s?\d+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?\s?(?:reais|real|euros?)/gi;
1041 // =====================================================
1042 // ANALIZAR UN TEXTO
1043 // =====================================================
1044 function analyzeText(
1045 text,
1046 timestamp = 0
1047 ) {
1048 const cleanText =
1049 String(
1050 text ||
1051 ""
1052 ).trim();
1053 if (
1054 !cleanText
1055 ) {
1056 return;
1057 }
1058 const normalized =
1059 normalize(
1060 cleanText
1061 );
1062 // ===================================================
1063 // LUGARES
1064 // ===================================================
1065 places.forEach(
1066 placeName => {
1067 if (
1068 normalized.includes(
1069 normalize(
1070 placeName
1071 )
1072 )
1073 ) {
1074 pushUnique(
1075 createDetail({
1076 title:
1077 placeName,
1078 place:
1079 placeName,
1080 type:
1081 "Lugar",
1082 category:
1083 "Lugar",
1084 comment:
1085 cleanText,
1086 timestampStart:
1087 timestamp,
1088 confidence:
1089 0.92
1090 })
1091 );
1092 }
1093 }
1094 );
1095 // ===================================================
1096 // AEROPUERTO
1097 // ===================================================
1098 const hasAirport =
1099 airportTerms.some(
1100 term =>
1101 normalized.includes(
1102 normalize(
1103 term
1104 )
1105 )
1106 );
1107 if (
1108 hasAirport
1109 ) {
1110 const isRio =
1111 normalized.includes(
1112 "rio de janeiro"
1113 );
1114 let airportTitle =
1115 "Aeropuerto";
1116 if (
1117 normalized.includes(
1118 "galeao"
1119 ) ||
1120 normalized.includes(
1121 "gig"
1122 )
1123 ) {
1124 airportTitle =
1125 "Aeropuerto Internacional de Galeão";
1126 } else if (
1127 normalized.includes(
1128 "santos dumont"
1129 ) ||
1130 normalized.includes(
1131 "sdu"
1132 )
1133 ) {
1134 airportTitle =
1135 "Aeropuerto Santos Dumont";
1136 } else if (
1137 isRio
1138 ) {
1139 airportTitle =
1140 "Aeropuerto de Río de Janeiro";
1141 }
1142 pushUnique(
1143 createDetail({
1144 title:
1145 airportTitle,
1146 place:
1147 isRio
1148 ? "Río de Janeiro"
1149 : airportTitle,
1150 type:
1151 "Lugar",
1152 category:
1153 "Lugar",
1154 comment:
1155 cleanText,
1156 timestampStart:
1157 timestamp,
1158 confidence:
1159 0.9
1160 })
1161 );
1162 }
1163 // ===================================================
1164 // TRANSPORTE
1165 // ===================================================
1166 const detectedTransport =
1167 transportTerms.find(
1168 term =>
1169 normalized.includes(
1170 normalize(
1171 term
1172 )
1173 )
1174 );
1175 if (
1176 detectedTransport
1177 ) {
1178 let transportTitle =
1179 detectedTransport;
1180 if (
1181 normalize(
1182 detectedTransport
1183 ) ===
1184 "uber"
1185 ) {
1186 transportTitle =
1187 hasAirport
1188 ? "Uber en el aeropuerto"
1189 : "Uber";
1190 }
1191 pushUnique(
1192 createDetail({
1193 title:
1194 transportTitle,
1195 place:
1196 normalized.includes(
1197 "rio de janeiro"
1198 )
1199 ? "Río de Janeiro"
1200 : CONFIG.city ||
1201 "Río de Janeiro",
1202 type:
1203 "Transporte",
1204 category:
1205 "Transporte",
1206 comment:
1207 cleanText,
1208 timestampStart:
1209 timestamp,
1210 confidence:
1211 0.9
1212 })
1213 );
1214 }
1215 // ===================================================
1216 // CONSEJO / AVISO
1217 // ===================================================
1218 const hasAdvice =
1219 adviceTerms.some(
1220 term =>
1221 normalized.includes(
1222 normalize(
1223 term
1224 )
1225 )
1226 );
1227 if (
1228 hasAdvice
1229 ) {
1230 let adviceTitle =
1231 "Consejo del vídeo";
1232 if (
1233 normalized.includes(
1234 "error"
1235 ) ||
1236 normalized.includes(
1237 "erro"
1238 )
1239 ) {
1240 adviceTitle =
1241 normalized.includes(
1242 "turista"
1243 )
1244 ? "Error habitual de los turistas"
1245 : "Error que conviene evitar";
1246 }
1247 if (
1248 hasAirport &&
1249 detectedTransport
1250 ) {
1251 adviceTitle =
1252 "Consejo de transporte en el aeropuerto";
1253 }
1254 pushUnique(
1255 createDetail({
1256 title:
1257 adviceTitle,
1258 place:
1259 normalized.includes(
1260 "rio de janeiro"
1261 )
1262 ? "Río de Janeiro"
1263 : CONFIG.city ||
1264 "Río de Janeiro",
1265 type:
1266 "Consejo",
1267 category:
1268 "Consejo",
1269 comment:
1270 cleanText,
1271 timestampStart:
1272 timestamp,
1273 confidence:
1274 0.85
1275 })
1276 );
1277 }
1278 // ===================================================
1279 // RESTAURANTE / BAR
1280 // ===================================================
1281 const restaurantWord =
1282 restaurantTerms.find(
1283 term =>
1284 normalized.includes(
1285 normalize(
1286 term
1287 )
1288 )
1289 );
1290 if (
1291 restaurantWord
1292 ) {
1293 pushUnique(
1294 createDetail({
1295 title:
1296 "Lugar para comer o beber",
1297 place:
1298 CONFIG.city ||
1299 "Río de Janeiro",
1300 type:
1301 "Restaurante",
1302 category:
1303 "Restaurante",
1304 comment:
1305 cleanText,
1306 timestampStart:
1307 timestamp,
1308 confidence:
1309 0.72
1310 })
1311 );
1312 }
1313 // ===================================================
1314 // PLAYA
1315 // ===================================================
1316 const hasBeach =
1317 beachTerms.some(
1318 term =>
1319 normalized.includes(
1320 normalize(
1321 term
1322 )
1323 )
1324 );
1325 if (
1326 hasBeach
1327 ) {
1328 pushUnique(
1329 createDetail({
1330 title:
1331 "Playa mencionada en el vídeo",
1332 place:
1333 CONFIG.city ||
1334 "Brasil",
1335 type:
1336 "Playa",
1337 category:
1338 "Playa",
1339 comment:
1340 cleanText,
1341 timestampStart:
1342 timestamp,
1343 confidence:
1344 0.72
1345 })
1346 );
1347 }
1348 // ===================================================
1349 // COMPRAS
1350 // ===================================================
1351 const hasShopping =
1352 shoppingTerms.some(
1353 term =>
1354 normalized.includes(
1355 normalize(
1356 term
1357 )
1358 )
1359 );
1360 if (
1361 hasShopping
1362 ) {
1363 pushUnique(
1364 createDetail({
1365 title:
1366 "Compras",
1367 place:
1368 CONFIG.city ||
1369 "Río de Janeiro",
1370 type:
1371 "Compras",
1372 category:
1373 "Compras",
1374 comment:
1375 cleanText,
1376 timestampStart:
1377 timestamp,
1378 confidence:
1379 0.7
1380 })
1381 );
1382 }
1383 // ===================================================
1384 // PRECIOS
1385 // ===================================================
1386 const prices =
1387 cleanText.match(
1388 priceRegex
1389 );
1390 prices?.forEach(
1391 price => {
1392 pushUnique(
1393 createDetail({
1394 title:
1395 price,
1396 place:
1397 CONFIG.city ||
1398 "Río de Janeiro",
1399 type:
1400 "Precio",
1401 category:
1402 "Consejo",
1403 comment:
1404 cleanText,
1405 timestampStart:
1406 timestamp,
1407 confidence:
1408 0.88
1409 })
1410 );
1411 }
1412 );
1413 }
1414 // =====================================================
1415 // CHUNKS DEL OCR / AUDIO
1416 // =====================================================
1417 chunks.forEach(
1418 chunk => {
1419 const text =
1420 String(
1421 chunk.text ||
1422 ""
1423 ).trim();
1424 let timestamp =
1425 0;
1426 if (
1427 Array.isArray(
1428 chunk.timestamp
1429 )
1430 ) {
1431 timestamp =
1432 Number(
1433 chunk.timestamp[0] ||
1434 0
1435 );
1436 }
1437 analyzeText(
1438 text,
1439 timestamp
1440 );
1441 }
1442 );
1443 // =====================================================
1444 // SI NO HAY CHUNKS, ANALIZAR TEXTO COMPLETO
1445 // =====================================================
1446 if (
1447 !chunks.length &&
1448 fullText
1449 ) {
1450 analyzeText(
1451 fullText,
1452 0
1453 );
1454 }
1455 console.log(
1456 "n Detalles detectados:",
1457 results
1458 );
1459 return results;
1460 }
1461 // =======================================================
1462 // PEGAR ENLACE
1463 // =======================================================
1464 videoLink.addEventListener(
1465 "input",
1466 () => {
1467 clearTimeout(
1468 linkDebounce
1469 );
1470 const url =
1471 sourceUrl();
1472 if (
1473 !url ||
1474 url.length < 8
1475 ) {
1476 return;
1477 }
1478 linkDebounce =
1479 window.setTimeout(
1480 () => {
1481 exploreVideo({
1482 type:
1483 "url",
1484 url
1485 });
1486 },
1487 750
1488 );
1489 }
1490 );
1491 // =======================================================
1492 // FASES DE EXPLORACIÓN
1493 // =======================================================
1494 const explorationPhases = [
1495 {
1496 progress:
1497 8,
1498 message:
1499 "Preparando el vídeo…"
1500 },
1501 {
1502 progress:
1503 22,
1504 message:
1505 "Escuchando lo que cuentan…"
1506 },
1507 {
1508 progress:
1509 38,
1510 message:
1511 "Localizando lugares mencionados…"
1512 },
1513 {
1514 progress:
1515 54,
1516 message:
1517 "Buscando restaurantes y recomendaciones…"
1518 },
1519 {
1520 progress:
1521 68,
1522 message:
1523 "Identificando consejos útiles…"
1524 },
1525 {
1526 progress:
1527 82,
1528 message:
1529 "Localizando momentos del vídeo…"
1530 },
1531 {
1532 progress:
1533 94,
1534 message:
1535 "Organizando los detalles…"
1536 }
1537 ];
1538 // =======================================================
1539 // ANIMAR EXPLORACIÓN
1540 // =======================================================
1541 async function animateExploration(
1542 runId
1543 ) {
1544 for (
1545 const phase
1546 of explorationPhases
1547 ) {
1548 if (
1549 runId !==
1550 explorationRun
1551 ) {
1552 return;
1553 }
1554 setProgress(
1555 phase.progress,
1556 phase.message
1557 );
1558 await new Promise(
1559 resolve =>
1560 window.setTimeout(
1561 resolve,
1562 420
1563 )
1564 );
1565 }
1566 }
1567 // =======================================================
1568 // EXPLORAR VÍDEO
1569 // =======================================================
1570 async function exploreVideo(
1571 source
1572 ) {
1573 const runId = ++explorationRun;
1574 draftDetails = [];
1575 editingIndex = null;
1576 renderDetails();
1577 showExploring();
1578 setProgress(
1579 4,
1580 "Explorando detalles del vídeo…"
1581 );
1582 const animation =
1583 animateExploration(runId);
1584 let automaticDetails = [];
1585 try {
1586 console.log(
1587 "n Enviando vídeo a analyze-video…"
1588 );
1589 automaticDetails =
1590 await requestAutomaticAnalysis(source);
1591 console.log(
1592 "n Respuesta automática de Gemini:",
1593 automaticDetails
1594 );
1595 if (!Array.isArray(automaticDetails)) {
1596 automaticDetails = [];
1597 }
1598 } catch (error) {
1599 console.error(
1600 "n Error analizando el vídeo con Gemini:",
1601 error
1602 );
1603 automaticDetails = [];
1604 showToast?.(
1605 "No se pudo analizar automáticamente el vídeo"
1606 );
1607 }
1608 await animation;
1609 if (runId !== explorationRun) {
1610 return;
1611 }
1612 if (automaticDetails.length > 0) {
1613 draftDetails =
1614 automaticDetails
1615 .map(normalizeAutomaticDetail)
1616 .filter(Boolean);
1617 console.log(
1618 "n Detalles normalizados:",
1619 draftDetails
1620 );
1621 if (draftDetails.length > 0) {
1622 setProgress(100, "Detalles encontrados");
1623 showResults();
1624 showToast?.(
1625 draftDetails.length === 1
1626 ? "n 1 detalle encontrado"
1627 : `n ${draftDetails.length} detalles encontrados`
1628 );
1629 return;
1630 }
1631 }
1632 setProgress(100, "Vídeo preparado");
1633 showResults();
1634 showToast?.(
1635 "n Vídeo preparado para revisar"
1636 );
1637 openEditor();
1638 }
1639 // =======================================================
1640 // ANALIZADOR AUTOMÁTICO / EDGE FUNCTION
1641 // =======================================================
1642 async function requestAutomaticAnalysis(
1643 source
1644 ) {
1645 if (!supabaseClient || !supabaseOnline) {
1646 console.warn("nn Supabase no está disponible.");
1647 return [];
1648 }
1649 if (
1650 source.type === "file" &&
1651 (
1652 !source.url ||
1653 String(source.url).startsWith("blob:")
1654 )
1655 ) {
1656 console.warn("nn El vídeo todavía no tiene URL pública.");
1657 return [];
1658 }
1659 if (!source.url) {
1660 return [];
1661 }
1662 try {
1663 console.log(
1664 "n Llamando a analyze-video:",
1665 source.url
1666 );
1667 const { data, error } =
1668 await supabaseClient
1669 .functions
1670 .invoke(
1671 "analyze-video",
1672 {
1673 body: {
1674 video_url: source.url,
1675 source_url: source.url,
1676 storage_path: source.storagePath || null,
1677 source_type: source.type || null,
1678 platform: detectSocialPlatform(source.url),
1679 caption: source.caption || "",
1680 author: source.author || "",
1681 hashtags:
1682 source.hashtags ||
1683 extractHashtags(source.caption || ""),
1684 transcript: source.transcript || null,
1685 visual_text: source.transcript?.visualText || "",
1686 audio_text: source.transcript?.audioText || "",
1687 combined_context:
1688 buildCombinedContext({
1689 transcript: source.transcript,
1690 caption: source.caption || "",
1691 hashtags:
1692 source.hashtags ||
1693 extractHashtags(source.caption || "")
1694 }),
1695 city: CONFIG?.city || "Río de Janeiro",
1696 country: CONFIG?.country || "Brasil"
1697 }
1698 }
1699 );
1700 if (error) {
1701 console.error("n Error de analyze-video:", error);
1702 return [];
1703 }
1704 console.log(
1705 "n Respuesta completa de analyze-video:",
1706 data
1707 );
1708 if (!data) return [];
1709 if (Array.isArray(data)) return data;
1710 if (Array.isArray(data.details)) return data.details;
1711 if (Array.isArray(data.discoveries)) return data.discoveries;
1712 return [];
1713 } catch (error) {
1714 console.error("n Fallo llamando a analyze-video:", error);
1715 return [];
1716 }
1717 }
1718 // =======================================================
1719 // NORMALIZAR RESULTADOS AUTOMÁTICOS
1720 // =======================================================
1721 function normalizeAutomaticDetail(
1722 item
1723 ) {
1724 if (
1725 !item ||
1726 typeof item !==
1727 "object"
1728 ) {
1729 return null;
1730 }
1731 const title =
1732 String(
1733 item.title ||
1734 item.name ||
1735 ""
1736 ).trim();
1737 if (
1738 !title
1739 ) {
1740 return null;
1741 }
1742 const type =
1743 String(
1744 item.type ||
1745 item.detail_type ||
1746 item.category ||
1747 "Lugar"
1748 ).trim();
1749 const category =
1750 String(
1751 item.category ||
1752 type ||
1753 "Lugar"
1754 ).trim();
1755 const place =
1756 String(
1757 item.place ||
1758 item.zone ||
1759 item.location ||
1760 ""
1761 ).trim();
1762 const description =
1763 String(
1764 item.description ||
1765 item.comment ||
1766 item.tip ||
1767 ""
1768 ).trim();
1769 const start =
1770 Number.isFinite(
1771 Number(
1772 item.timestamp_start
1773 )
1774 )
1775 ? Number(
1776 item.timestamp_start
1777 )
1778 : Number.isFinite(
1779 Number(
1780 item.timestampStart
1781 )
1782 )
1783 ? Number(
1784 item.timestampStart
1785 )
1786 : toSeconds(
1787 item.time ||
1788 item.timestamp ||
1789 "00:00"
1790 );
1791 let end =
1792 item.timestamp_end ??
1793 item.timestampEnd ??
1794 null;
1795 if (
1796 typeof end ===
1797 "string"
1798 ) {
1799 end =
1800 toSeconds(
1801 end
1802 );
1803 }
1804 if (
1805 end !== null &&
1806 !Number.isFinite(
1807 Number(
1808 end
1809 )
1810 )
1811 ) {
1812 end =
1813 null;
1814 }
1815 let lat =
1816 Number(
1817 item.latitude ??
1818 item.lat
1819 );
1820 let lng =
1821 Number(
1822 item.longitude ??
1823 item.lng
1824 );
1825 if (
1826 !Number.isFinite(
1827 lat
1828 )
1829 ) {
1830 lat =
1831 null;
1832 }
1833 if (
1834 !Number.isFinite(
1835 lng
1836 )
1837 ) {
1838 lng =
1839 null;
1840 }
1841 return {
1842 id:
1843 item.id ||
1844 (
1845 crypto.randomUUID
1846 ? crypto.randomUUID()
1847 : `detail-${Date.now()}-${Math.random()}`
1848 ),
1849 title,
1850 place,
1851 type,
1852 category,
1853 comment:
1854 description,
1855 timestampStart:
1856 Math.max(
1857 0,
1858 start || 0
1859 ),
1860 timestampEnd:
1861 end === null
1862 ? null
1863 : Math.max(
1864 0,
1865 Number(
1866 end
1867 )
1868 ),
1869 lat,
1870 lng,
1871 confidence:
1872 Number.isFinite(
1873 Number(
1874 item.confidence
1875 )
1876 )
1877 ? Number(
1878 item.confidence
1879 )
1880 : null,
1881 manual:
1882 false,
1883 automatic:
1884 true
1885 };
1886 }
1887 // =======================================================
1888 // EDITOR MANUAL
1889 // =======================================================
1890 function openEditor(
1891 index = null
1892 ) {
1893 editingIndex =
1894 index;
1895 manualEditor
1896 ?.classList
1897 .add(
1898 "open"
1899 );
1900 if (
1901 index ===
1902 null
1903 ) {
1904 resetEditor();
1905 } else {
1906 const detail =
1907 draftDetails[
1908 index
1909 ];
1910 if (
1911 !detail
1912 ) {
1913 return;
1914 }
1915 if (
1916 detailType
1917 ) {
1918 detailType.value =
1919 detail.type ||
1920 "Lugar";
1921 }
1922 if (
1923 titleInput
1924 ) {
1925 titleInput.value =
1926 detail.title ||
1927 "";
1928 }
1929 if (
1930 placeInput
1931 ) {
1932 placeInput.value =
1933 detail.place ||
1934 "";
1935 }
1936 if (
1937 categoryInput
1938 ) {
1939 categoryInput.value =
1940 detail.category ||
1941 "";
1942 }
1943 if (
1944 commentInput
1945 ) {
1946 commentInput.value =
1947 detail.comment ||
1948 "";
1949 }
1950 if (
1951 startInput
1952 ) {
1953 startInput.value =
1954 toTime(
1955 detail.timestampStart
1956 );
1957 }
1958 if (
1959 endInput
1960 ) {
1961 endInput.value =
1962 detail.timestampEnd ==
1963 null
1964 ? ""
1965 : toTime(
1966 detail.timestampEnd
1967 );
1968 }
1969 if (
1970 discoveryLat
1971 ) {
1972 discoveryLat.value =
1973 detail.lat ??
1974 "";
1975 }
1976 if (
1977 discoveryLng
1978 ) {
1979 discoveryLng.value =
1980 detail.lng ??
1981 "";
1982 }
1983 cancelEditButton
1984 ?.classList
1985 .remove(
1986 "hidden"
1987 );
1988 if (
1989 addDetailButton
1990 ) {
1991 addDetailButton.textContent =
1992 "3 Guardar cambios";
1993 }
1994 }
1995 window.setTimeout(
1996 () => {
1997 manualEditor
1998 ?.scrollIntoView({
1999 behavior:
2000 "smooth",
2001 block:
2002 "start"
2003 });
2004 },
2005 100
2006 );
2007 }
2008 function closeEditor() {
2009 manualEditor
2010 ?.classList
2011 .remove(
2012 "open"
2013 );
2014 resetEditor();
2015 }
2016 addManualButton
2017 ?.addEventListener(
2018 "click",
2019 () => {
2020 openEditor();
2021 }
2022 );
2023 cancelEditButton
2024 ?.addEventListener(
2025 "click",
2026 () => {
2027 closeEditor();
2028 }
2029 );
2030 // =======================================================
2031 // USAR MOMENTO ACTUAL DEL VÍDEO
2032 // =======================================================
2033 useCurrentTimeButton
2034 ?.addEventListener(
2035 "click",
2036 () => {
2037 if (
2038 !previewPlayer ||
2039 !startInput
2040 ) {
2041 return;
2042 }
2043 const current =
2044 Number(
2045 previewPlayer
2046 .currentTime ||
2047 0
2048 );
2049 startInput.value =
2050 toTime(
2051 current
2052 );
2053 showToast?.(
2054 `n ${toTime(current)}`
2055 );
2056 }
2057 );
2058 // =======================================================
2059 // TIPO -> CATEGORÍA
2060 // =======================================================
2061 detailType
2062 ?.addEventListener(
2063 "change",
2064 () => {
2065 if (
2066 !categoryInput
2067 ) {
2068 return;
2069 }
2070 const suggestions = {
2071 Lugar:
2072 "Lugar",
2073 Restaurante:
2074 "Restaurante",
2075 Playa:
2076 "Playa",
2077 Mirador:
2078 "Mirador",
2079 Consejo:
2080 "Consejo",
2081 Precio:
2082 "Consejo",
2083 Transporte:
2084 "Transporte",
2085 Aviso:
2086 "Consejo",
2087 Compras:
2088 "Compras",
2089 Evento:
2090 "Vida nocturna",
2091 Otro:
2092 "Lugar"
2093 };
2094 const suggested =
2095 suggestions[
2096 detailType.value
2097 ];
2098 if (
2099 suggested
2100 ) {
2101 categoryInput.value =
2102 suggested;
2103 }
2104 }
2105 );
2106 // =======================================================
2107 // NORMALIZAR TIMESTAMPS
2108 // =======================================================
2109 startInput
2110 ?.addEventListener(
2111 "blur",
2112 () => {
2113 startInput.value =
2114 toTime(
2115 toSeconds(
2116 startInput.value
2117 )
2118 );
2119 }
2120 );
2121 endInput
2122 ?.addEventListener(
2123 "blur",
2124 () => {
2125 const value =
2126 String(
2127 endInput.value ||
2128 ""
2129 ).trim();
2130 if (
2131 !value
2132 ) {
2133 return;
2134 }
2135 endInput.value =
2136 toTime(
2137 toSeconds(
2138 value
2139 )
2140 );
2141 }
2142 );
2143 // =======================================================
2144 // LEER DATOS DEL EDITOR
2145 // =======================================================
2146 function readEditor() {
2147 const center =
2148 map.getCenter();
2149 const lat =
2150 Number(
2151 discoveryLat?.value
2152 );
2153 const lng =
2154 Number(
2155 discoveryLng?.value
2156 );
2157 const endText =
2158 String(
2159 endInput?.value ||
2160 ""
2161 ).trim();
2162 return {
2163 id:
2164 editingIndex ===
2165 null
2166 ? (
2167 crypto.randomUUID
2168 ? crypto.randomUUID()
2169 : `draft-${Date.now()}-${Math.random()}`
2170 )
2171 : draftDetails[
2172 editingIndex
2173 ].id,
2174 type:
2175 String(
2176 detailType?.value ||
2177 "Lugar"
2178 ),
2179 title:
2180 String(
2181 titleInput?.value ||
2182 ""
2183 ).trim(),
2184 place:
2185 String(
2186 placeInput?.value ||
2187 ""
2188 ).trim(),
2189 category:
2190 String(
2191 categoryInput?.value ||
2192 detailType?.value ||
2193 "Lugar"
2194 ).trim(),
2195 comment:
2196 String(
2197 commentInput?.value ||
2198 ""
2199 ).trim(),
2200 timestampStart:
2201 toSeconds(
2202 startInput?.value
2203 ),
2204 timestampEnd:
2205 endText
2206 ? toSeconds(
2207 endText
2208 )
2209 : null,
2210 lat:
2211 Number.isFinite(
2212 lat
2213 ) &&
2214 lat !== 0
2215 ? lat
2216 : center.lat,
2217 lng:
2218 Number.isFinite(
2219 lng
2220 ) &&
2221 lng !== 0
2222 ? lng
2223 : center.lng,
2224 confidence:
2225 editingIndex ===
2226 null
2227 ? 1
2228 : draftDetails[
2229 editingIndex
2230 ].confidence,
2231 automatic:
2232 editingIndex ===
2233 null
2234 ? false
2235 : draftDetails[
2236 editingIndex
2237 ].automatic
2238 };
2239 }
2240 // =======================================================
2241 // AÑADIR / ACTUALIZAR DETALLE
2242 // =======================================================
2243 addDetailButton
2244 ?.addEventListener(
2245 "click",
2246 () => {
2247 const detail =
2248 readEditor();
2249 if (
2250 !detail.title
2251 ) {
2252 showToast?.(
2253 "Escribe un nombre o título"
2254 );
2255 titleInput?.focus();
2256 return;
2257 }
2258 if (
2259 !detail.place
2260 ) {
2261 showToast?.(
2262 "Indica el lugar o zona"
2263 );
2264 placeInput?.focus();
2265 return;
2266 }
2267 if (
2268 !detail.category
2269 ) {
2270 showToast?.(
2271 "Selecciona una categoría"
2272 );
2273 return;
2274 }
2275 if (
2276 detail.timestampEnd !==
2277 null &&
2278 detail.timestampEnd <
2279 detail.timestampStart
2280 ) {
2281 showToast?.(
2282 "El minuto final debe ser posterior al inicial"
2283 );
2284 return;
2285 }
2286 if (
2287 editingIndex ===
2288 null
2289 ) {
2290 draftDetails.push(
2291 detail
2292 );
2293 showToast?.(
2294 "n Detalle añadido"
2295 );
2296 } else {
2297 draftDetails[
2298 editingIndex
2299 ] =
2300 detail;
2301 showToast?.(
2302 "3 Detalle actualizado"
2303 );
2304 }
2305 closeEditor();
2306 renderDetails();
2307 }
2308 );
2309 // =======================================================
2310 // TARJETAS DE RESULTADOS
2311 // =======================================================
2312 function renderDetails() {
2313 const count =
2314 draftDetails.length;
2315 if (
2316 detailsCount
2317 ) {
2318 detailsCount.textContent =
2319 String(
2320 count
2321 );
2322 }
2323 if (
2324 draftCount
2325 ) {
2326 draftCount.textContent =
2327 String(
2328 count
2329 );
2330 }
2331 // -----------------------------------------------------
2332 // SIN DETALLES
2333 // -----------------------------------------------------
2334 if (
2335 count === 0
2336 ) {
2337 if (
2338 detailsList
2339 ) {
2340 detailsList.innerHTML =
2341 `
2342 <div
2343 class="empty-state"
2344 >
2345 <span>
2346 n
2347 </span>
2348 <strong>
2349 Añade el primer detalle
2350 </strong>
2351 <p>
2352 Puedes indicar lugares,
2353 restaurantes, consejos,
2354 precios o cualquier momento
2355 útil del vídeo.
2356 </p>
2357 </div>
2358 `;
2359 }
2360 if (
2361 draftList
2362 ) {
2363 draftList.innerHTML =
2364 "";
2365 }
2366 draftSection
2367 ?.classList
2368 .remove(
2369 "active"
2370 );
2371 saveAllButton
2372 ?.classList
2373 .remove(
2374 "visible"
2375 );
2376 return;
2377 }
2378 // -----------------------------------------------------
2379 // TARJETAS PRINCIPALES
2380 // -----------------------------------------------------
2381 const cards =
2382 draftDetails
2383 .map(
2384 (
2385 detail,
2386 index
2387 ) => {
2388 let confidence =
2389 null;
2390 if (
2391 detail.confidence !==
2392 null &&
2393 detail.confidence !==
2394 undefined &&
2395 detail.automatic
2396 ) {
2397 const raw =
2398 Number(
2399 detail.confidence
2400 );
2401 if (
2402 Number.isFinite(
2403 raw
2404 )
2405 ) {
2406 confidence =
2407 Math.round(
2408 raw <= 1
2409 ? raw * 100
2410 : raw
2411 );
2412 }
2413 }
2414 return `
2415 <article
2416 class="detected-detail-card"
2417 >
2418 <div
2419 class="detected-detail-icon"
2420 >
2421 ${iconFor(
2422 detail
2423 )}
2424 </div>
2425 <div
2426 class="detected-detail-info"
2427 >
2428 <strong>
2429 ${safeText(
2430 detail.title
2431 )}
2432 </strong>
2433 <div
2434 class="detected-detail-meta"
2435 >
2436 <span>
2437 ${safeText(
2438 detail.category
2439 )}
2440 </span>
2441 ${
2442 detail.place
2443 ? `
2444 <span>
2445 · ${safeText(
2446 detail.place
2447 )}
2448 </span>
2449 `
2450 : ""
2451 }
2452 <span
2453 class="detail-time"
2454 >
2455 n ${toTime(
2456 detail.timestampStart
2457 )}
2458 </span>
2459 ${
2460 confidence !==
2461 null
2462 ? `
2463 <span>
2464 ${confidence}%
2465 </span>
2466 `
2467 : ""
2468 }
2469 </div>
2470 ${
2471 detail.comment
2472 ? `
2473 <p>
2474 ${safeText(
2475 detail.comment
2476 )}
2477 </p>
2478 `
2479 : ""
2480 }
2481 </div>
2482 <div
2483 class="detected-detail-actions"
2484 >
2485 <button
2486 type="button"
2487 data-v06-edit="${index}"
2488 aria-label="Editar detalle"
2489 >
2490 /n
2491 </button>
2492 <button
2493 type="button"
2494 data-v06-delete="${index}"
2495 aria-label="Eliminar detalle"
2496 >
2497 nn
2498 </button>
2499 </div>
2500 </article>
2501 `;
2502 }
2503 )
2504 .join("");
2505 if (
2506 detailsList
2507 ) {
2508 detailsList.innerHTML =
2509 cards;
2510 }
2511 // -----------------------------------------------------
2512 // RESUMEN DEL BORRADOR
2513 // -----------------------------------------------------
2514 if (
2515 draftList
2516 ) {
2517 draftList.innerHTML =
2518 draftDetails
2519 .map(
2520 detail => `
2521 <article
2522 class="detected-detail-card"
2523 >
2524 <div
2525 class="detected-detail-icon"
2526 >
2527 ${iconFor(
2528 detail
2529 )}
2530 </div>
2531 <div
2532 class="detected-detail-info"
2533 >
2534 <strong>
2535 ${safeText(
2536 detail.title
2537 )}
2538 </strong>
2539 <div
2540 class="detected-detail-meta"
2541 >
2542 <span>
2543 ${safeText(
2544 detail.place
2545 )}
2546 </span>
2547 <span
2548 class="detail-time"
2549 >
2550 ${toTime(
2551 detail.timestampStart
2552 )}
2553 </span>
2554 </div>
2555 </div>
2556 </article>
2557 `
2558 )
2559 .join("");
2560 }
2561 draftSection
2562 ?.classList
2563 .add(
2564 "active"
2565 );
2566 saveAllButton
2567 ?.classList
2568 .add(
2569 "visible"
2570 );
2571 // -----------------------------------------------------
2572 // EDITAR
2573 // -----------------------------------------------------
2574 detailsList
2575 ?.querySelectorAll(
2576 "[data-v06-edit]"
2577 )
2578 .forEach(
2579 button => {
2580 button.addEventListener(
2581 "click",
2582 () => {
2583 const index =
2584 Number(
2585 button.dataset
2586 .v06Edit
2587 );
2588 openEditor(
2589 index
2590 );
2591 }
2592 );
2593 }
2594 );
2595 // -----------------------------------------------------
2596 // ELIMINAR
2597 // -----------------------------------------------------
2598 detailsList
2599 ?.querySelectorAll(
2600 "[data-v06-delete]"
2601 )
2602 .forEach(
2603 button => {
2604 button.addEventListener(
2605 "click",
2606 () => {
2607 const index =
2608 Number(
2609 button.dataset
2610 .v06Delete
2611 );
2612 if (
2613 !Number.isInteger(
2614 index
2615 ) ||
2616 !draftDetails[
2617 index
2618 ]
2619 ) {
2620 return;
2621 }
2622 draftDetails.splice(
2623 index,
2624 1
2625 );
2626 renderDetails();
2627 showToast?.(
2628 "Detalle eliminado"
2629 );
2630 }
2631 );
2632 }
2633 );
2634 }
2635 // =======================================================
2636 // TÍTULO GENERAL DEL VÍDEO
2637 // =======================================================
2638 function videoDraftTitle() {
2639 if (
2640 !draftDetails.length
2641 ) {
2642 return (
2643 "Vídeo de Mundo Infinito"
2644 );
2645 }
2646 if (
2647 draftDetails.length ===
2648 1
2649 ) {
2650 return (
2651 draftDetails[0]
2652 .title ||
2653 "Vídeo de Mundo Infinito"
2654 );
2655 }
2656 const zone =
2657 draftDetails[0]
2658 .place ||
2659 CONFIG.city ||
2660 "Brasil";
2661 return (
2662 `Descubrimientos en ${zone}`
2663 );
2664 }
2665 // =======================================================
2666 // DESCRIPCIÓN GENERAL DEL VÍDEO
2667 // =======================================================
2668 function videoDraftDescription() {
2669 const names =
2670 draftDetails
2671 .slice(
2672 0,
2673 5
2674 )
2675 .map(
2676 detail =>
2677 detail.title
2678 )
2679 .filter(
2680 Boolean
2681 );
2682 let description =
2683 names.join(
2684 " · "
2685 );
2686 if (
2687 draftDetails.length >
2688 5
2689 ) {
2690 description +=
2691 ` · +${draftDetails.length - 5} detalles`;
2692 }
2693 return description;
2694 }
2695 // =======================================================
2696 // ACTUALIZAR LUGAR EN MEMORIA
2697 // =======================================================
2698 function addPlaceToApp(
2699 place
2700 ) {
2701 if (
2702 !place
2703 ) {
2704 return;
2705 }
2706 const existingIndex =
2707 places.findIndex(
2708 item =>
2709 String(
2710 item.id
2711 ) ===
2712 String(
2713 place.id
2714 )
2715 ||
2716 (
2717 item.slug &&
2718 place.slug &&
2719 item.slug ===
2720 place.slug
2721 )
2722 );
2723 if (
2724 existingIndex >=
2725 0
2726 ) {
2727 places[
2728 existingIndex
2729 ] = {
2730 ...places[
2731 existingIndex
2732 ],
2733 ...place
2734 };
2735 return;
2736 }
2737 places.push(
2738 place
2739 );
2740 addMarker(
2741 place
2742 );
2743 }
2744 // =======================================================
2745 // ACTUALIZAR VÍDEO EN MEMORIA
2746 // =======================================================
2747 function addVideoToApp(
2748 video
2749 ) {
2750 if (
2751 !video
2752 ) {
2753 return;
2754 }
2755 const existingIndex =
2756 videos.findIndex(
2757 item =>
2758 String(
2759 item.id
2760 ) ===
2761 String(
2762 video.id
2763 )
2764 ||
2765 (
2766 video.sourceUrl &&
2767 item.sourceUrl ===
2768 video.sourceUrl
2769 )
2770 );
2771 if (
2772 existingIndex >=
2773 0
2774 ) {
2775 videos[
2776 existingIndex
2777 ] = {
2778 ...videos[
2779 existingIndex
2780 ],
2781 ...video
2782 };
2783 return;
2784 }
2785 videos.push(
2786 video
2787 );
2788 }
2789 // =======================================================
2790 // ACTUALIZAR DESCUBRIMIENTO EN MEMORIA
2791 // =======================================================
2792 function addDiscoveryToApp(
2793 discovery
2794 ) {
2795 if (
2796 !discovery
2797 ) {
2798 return;
2799 }
2800 const exists =
2801 discoveries.some(
2802 item =>
2803 String(
2804 item.id
2805 ) ===
2806 String(
2807 discovery.id
2808 )
2809 );
2810 if (
2811 !exists
2812 ) {
2813 discoveries.push(
2814 discovery
2815 );
2816 }
2817 }
2818
2819 // =======================================================
2820 // DECIDIR QUÉ DEBE SER UN MARCADOR
2821 // v0.6.5
2822 //
2823 // Un vídeo puede contener:
2824 // - lugares reales -> crean / reutilizan un marcador;
2825 // - información sobre un lugar -> se guarda dentro del
2826 // marcador del lugar, sin crear un punto falso.
2827 //
2828 // Ejemplo:
2829 // "SAARA" -> marcador.
2830 // "Horarios de atención en SAARA" -> detalle de SAARA.
2831 // "Precios de souvenirs en SAARA" -> detalle de SAARA.
2832 // =======================================================
2833
2834 function normalizeExplorerText(
2835 value
2836 ) {
2837
2838 return String(
2839 value ||
2840 ""
2841 )
2842 .normalize(
2843 "NFD"
2844 )
2845 .replace(
2846 /[\u0300-\u036f]/g,
2847 ""
2848 )
2849 .toLowerCase()
2850 .replace(
2851 /\s+/g,
2852 " "
2853 )
2854 .trim();
2855
2856 }
2857
2858
2859 function looksLikeInformationDetail(
2860 detail
2861 ) {
2862
2863 const type =
2864 normalizeExplorerText(
2865 detail?.type
2866 );
2867
2868 const category =
2869 normalizeExplorerText(
2870 detail?.category
2871 );
2872
2873 const title =
2874 normalizeExplorerText(
2875 detail?.title
2876 );
2877
2878
2879 /*
2880 * Tipos que normalmente describen información
2881 * sobre un lugar y no un lugar nuevo.
2882 */
2883
2884 const informationTypes =
2885 new Set([
2886 "consejo",
2887 "precio",
2888 "aviso"
2889 ]);
2890
2891
2892 if (
2893 informationTypes.has(
2894 type
2895 ) ||
2896 informationTypes.has(
2897 category
2898 )
2899 ) {
2900
2901 return true;
2902
2903 }
2904
2905
2906 /*
2907 * Patrones habituales que Gemini puede devolver
2908 * como títulos aunque realmente sean atributos
2909 * del lugar.
2910 */
2911
2912 const informationPatterns = [
2913
2914 /^horario\b/,
2915 /^horarios\b/,
2916 /^precio\b/,
2917 /^precios\b/,
2918 /^cuanto cuesta\b/,
2919 /^cuánto cuesta\b/,
2920 /^entrada\b/,
2921 /^entradas\b/,
2922 /^recomendacion\b/,
2923 /^recomendación\b/,
2924 /^recomendaciones\b/,
2925 /^consejo\b/,
2926 /^consejos\b/,
2927 /^aviso\b/,
2928 /^avisos\b/,
2929 /^como llegar\b/,
2930 /^cómo llegar\b/,
2931 /^como ir\b/,
2932 /^cómo ir\b/,
2933 /^como pedir\b/,
2934 /^cómo pedir\b/,
2935 /^que comprar\b/,
2936 /^qué comprar\b/,
2937 /^cuando ir\b/,
2938 /^cuándo ir\b/,
2939 /^mejor hora\b/,
2940 /^mejor momento\b/,
2941 /^que pedir\b/,
2942 /^qué pedir\b/,
2943 /^que hacer\b/,
2944 /^qué hacer\b/,
2945 /^donde aparcar\b/,
2946 /^dónde aparcar\b/,
2947 /^transporte\b/,
2948 /^uber\b/,
2949 /^taxi\b/
2950
2951 ];
2952
2953
2954 return informationPatterns.some(
2955 pattern =>
2956 pattern.test(
2957 title
2958 )
2959 );
2960
2961 }
2962
2963
2964 // =======================================================
2965 // EXTRAER UN LUGAR MENCIONADO EN EL TÍTULO
2966 // =======================================================
2967
2968 function extractPlaceFromInformationalTitle(
2969 title
2970 ) {
2971
2972 const text =
2973 String(
2974 title ||
2975 ""
2976 ).trim();
2977
2978
2979 if (!text) {
2980 return "";
2981 }
2982
2983
2984 /*
2985 * Captura ejemplos como:
2986 *
2987 * "Horarios de atención en SAARA"
2988 * "Precios de souvenirs y prendas en SAARA"
2989 * "Cómo pedir Uber en Galeão"
2990 *
2991 * Tomamos lo que aparece después del último " en ".
2992 */
2993
2994 const enMatches =
2995 Array.from(
2996 text.matchAll(
2997 /\s+en\s+(.+?)(?=[.!?;:]?$)/gi
2998 )
2999 );
3000
3001
3002 if (
3003 enMatches.length
3004 ) {
3005
3006 return String(
3007 enMatches[
3008 enMatches.length - 1
3009 ][1] ||
3010 ""
3011 ).trim();
3012
3013 }
3014
3015
3016 return "";
3017
3018 }
3019
3020
3021 // =======================================================
3022 // RESOLVER EL LUGAR REAL AL QUE PERTENECE UN DETALLE
3023 // =======================================================
3024
3025 function resolveMapTarget(
3026 detail
3027 ) {
3028
3029 const title =
3030 String(
3031 detail?.title ||
3032 ""
3033 ).trim();
3034
3035 const place =
3036 String(
3037 detail?.place ||
3038 ""
3039 ).trim();
3040
3041
3042 const informational =
3043 looksLikeInformationDetail(
3044 detail
3045 );
3046
3047
3048 /*
3049 * Si es información, preferimos el campo place.
3050 * Si Gemini no lo rellenó, intentamos extraer el
3051 * lugar desde el propio título.
3052 */
3053
3054 if (
3055 informational
3056 ) {
3057
3058 const extracted =
3059 extractPlaceFromInformationalTitle(
3060 title
3061 );
3062
3063
3064 const targetName =
3065 place ||
3066 extracted;
3067
3068
3069 if (
3070 !targetName
3071 ) {
3072
3073 return {
3074 localizable:
3075 false,
3076
3077 informational:
3078 true,
3079
3080 name:
3081 "",
3082
3083 zone:
3084 "",
3085
3086 reason:
3087 "No se ha podido identificar a qué lugar pertenece esta información."
3088 };
3089
3090 }
3091
3092
3093 return {
3094 localizable:
3095 true,
3096
3097 informational:
3098 true,
3099
3100 name:
3101 targetName,
3102
3103 zone:
3104 "",
3105
3106 reason:
3107 ""
3108 };
3109
3110 }
3111
3112
3113 /*
3114 * Si parece un lugar real, el nombre del marcador
3115 * debe ser el título detectado.
3116 */
3117
3118 return {
3119 localizable:
3120 Boolean(
3121 title
3122 ),
3123
3124 informational:
3125 false,
3126
3127 name:
3128 title,
3129
3130 zone:
3131 place,
3132
3133 reason:
3134 title
3135 ? ""
3136 : "El descubrimiento no tiene un nombre de lugar."
3137 };
3138
3139 }
3140
3141
3142 // =======================================================
3143 // CATEGORÍA DEL MARCADOR
3144 //
3145 // Cuando el detalle es "Precio", "Consejo", etc. no
3146 // queremos que el marcador se llame Consejo. Intentamos
3147 // conservar una categoría útil para el lugar.
3148 // =======================================================
3149
3150 function categoryForMapTarget(
3151 detail,
3152 target
3153 ) {
3154
3155 if (
3156 !target?.informational
3157 ) {
3158
3159 return (
3160 detail?.category ||
3161 detail?.type ||
3162 "Lugar"
3163 );
3164
3165 }
3166
3167
3168 const category =
3169 String(
3170 detail?.category ||
3171 ""
3172 ).trim();
3173
3174 const type =
3175 String(
3176 detail?.type ||
3177 ""
3178 ).trim();
3179
3180
3181 const invalid =
3182 new Set([
3183 "Consejo",
3184 "Precio",
3185 "Aviso"
3186 ]);
3187
3188
3189 if (
3190 category &&
3191 !invalid.has(
3192 category
3193 )
3194 ) {
3195
3196 return category;
3197
3198 }
3199
3200
3201 if (
3202 type &&
3203 !invalid.has(
3204 type
3205 )
3206 ) {
3207
3208 return type;
3209
3210 }
3211
3212
3213 return "Lugar";
3214
3215 }
3216
3217
3218 // =======================================================
3219 // GUARDAR TODO
3220 // =======================================================
3221 discoveryForm.addEventListener(
3222 "submit",
3223 async event => {
3224 event.preventDefault();
3225 event.stopImmediatePropagation();
3226 if (
3227 saving
3228 ) {
3229 return;
3230 }
3231 if (
3232 !draftDetails.length
3233 ) {
3234 showToast?.(
3235 "Añade al menos un detalle"
3236 );
3237 openEditor();
3238 return;
3239 }
3240 const url =
3241 uploadedVideoUrl ||
3242 sourceUrl();
3243 if (
3244 !url &&
3245 !selectedFile
3246 ) {
3247 showToast?.(
3248 "Añade primero un vídeo o Reel"
3249 );
3250 return;
3251 }
3252 if (
3253 selectedFile &&
3254 uploadingVideo
3255 ) {
3256 showToast?.(
3257 "Espera a que termine de subir el vídeo"
3258 );
3259 return;
3260 }
3261 if (
3262 selectedFile &&
3263 !uploadedVideoUrl
3264 ) {
3265 showToast?.(
3266 "El vídeo todavía no está guardado en Mundo Infinito"
3267 );
3268 return;
3269 }
3270 if (
3271 !supabaseClient ||
3272 !supabaseOnline
3273 ) {
3274 showToast?.(
3275 "No hay conexión con la base compartida"
3276 );
3277 return;
3278 }
3279 saving =
3280 true;
3281 const oldButtonHTML =
3282 saveAllButton
3283 ?.innerHTML ||
3284 "3 Guardar todo";
3285 if (
3286 saveAllButton
3287 ) {
3288 saveAllButton.disabled =
3289 true;
3290 saveAllButton.innerHTML =
3291 `
3292 <span>
3293 n
3294 </span>
3295 Guardando…
3296 `;
3297 }
3298 try {
3299 // =================================================
3300 // 1. CREAR VÍDEO
3301 // =================================================
3302 const savedVideo =
3303 await createSupabaseVideo({
3304 title:
3305 videoDraftTitle(),
3306 description:
3307 videoDraftDescription(),
3308 url
3309 });
3310 if (
3311 !savedVideo
3312 ) {
3313 throw new Error(
3314 "No se pudo crear el vídeo"
3315 );
3316 }
3317 addVideoToApp(
3318 savedVideo
3319 );
3320 // =================================================
3321 // 2. CREAR DETALLES
3322 // =================================================
3323 const created =
3324 [];
3325 let firstPlace =
3326 null;
3327 for (
3328 const detail
3329 of draftDetails
3330 ) {
3331
3332 const target =
3333 resolveMapTarget(
3334 detail
3335 );
3336
3337
3338 /*
3339 * Si ni siquiera podemos identificar un lugar real,
3340 * no inventamos un marcador.
3341 */
3342
3343 if (
3344 !target.localizable ||
3345 !target.name
3346 ) {
3347
3348 console.warn(
3349 "⚠ No se puede añadir al mapa:",
3350 detail.title,
3351 target.reason
3352 );
3353
3354 continue;
3355
3356 }
3357
3358
3359 /*
3360 * El marcador se geolocaliza con el nombre REAL del lugar.
3361 *
3362 * Para un lugar:
3363 * Belmonte Leblon -> Belmonte Leblon
3364 *
3365 * Para información:
3366 * Horarios de atención en SAARA -> SAARA
3367 */
3368
3369 let lat =
3370 null;
3371
3372 let lng =
3373 null;
3374
3375 let geocodeData =
3376 null;
3377
3378
3379 try {
3380
3381 console.log(
3382 target.informational
3383 ? " Asociando información a:"
3384 : " Localizando:",
3385 target.name
3386 );
3387
3388 const {
3389 data,
3390 error
3391 } =
3392
3393 await supabaseClient
3394 .functions
3395 .invoke(
3396 "geocode-place",
3397 {
3398
3399 body: {
3400
3401 name:
3402 target.name,
3403
3404 zone:
3405 target.zone ||
3406 "",
3407
3408 city:
3409 detail.city ||
3410 CONFIG.city ||
3411 "Rio de Janeiro",
3412
3413 state:
3414 detail.state ||
3415 "Rio de Janeiro",
3416
3417 country:
3418 detail.country ||
3419 CONFIG.country ||
3420 "Brasil"
3421
3422 }
3423
3424 }
3425 );
3426
3427
3428 geocodeData =
3429 data;
3430
3431
3432 if (
3433 error
3434 ) {
3435
3436 console.warn(
3437 "No se pudo geolocalizar:",
3438 target.name,
3439 error
3440 );
3441
3442 }
3443
3444
3445 if (
3446 geocodeData?.found &&
3447 Number.isFinite(
3448 Number(
3449 geocodeData.lat
3450 )
3451 ) &&
3452 Number.isFinite(
3453 Number(
3454 geocodeData.lng
3455 )
3456 )
3457 ) {
3458
3459 lat =
3460 Number(
3461 geocodeData.lat
3462 );
3463
3464 lng =
3465 Number(
3466 geocodeData.lng
3467 );
3468
3469
3470 console.log(
3471 " Localizado:",
3472 target.name,
3473 lat,
3474 lng
3475 );
3476
3477 }
3478
3479 } catch (
3480 geocodeError
3481 ) {
3482
3483 console.warn(
3484 "Error localizando:",
3485 target.name,
3486 geocodeError
3487 );
3488
3489 }
3490
3491
3492 /*
3493 * Si el lugar no se puede localizar de forma fiable,
3494 * no creamos ningún punto inventado.
3495 */
3496
3497 if (
3498 !Number.isFinite(
3499 lat
3500 ) ||
3501 !Number.isFinite(
3502 lng
3503 )
3504 ) {
3505
3506 console.warn(
3507 "⚠ Ubicación pendiente:",
3508 target.name,
3509 "· detalle:",
3510 detail.title
3511 );
3512
3513 continue;
3514
3515 }
3516
3517
3518 /*
3519 * Creamos o reutilizamos UN ÚNICO lugar.
3520 *
3521 * Si hay varios detalles sobre SAARA todos usarán
3522 * el slug "saara" y quedarán vinculados al mismo punto.
3523 */
3524
3525 const savedPlace =
3526 await createOrGetPlace({
3527
3528 name:
3529 target.name,
3530
3531 zone:
3532 target.zone ||
3533 geocodeData?.address?.suburb ||
3534 geocodeData?.address?.neighbourhood ||
3535 geocodeData?.address?.city_district ||
3536 "",
3537
3538 category:
3539 categoryForMapTarget(
3540 detail,
3541 target
3542 ),
3543
3544 description:
3545 target.informational
3546
3547 ? (
3548 detail.comment ||
3549 `Información encontrada sobre ${target.name}.`
3550 )
3551
3552 : (
3553 detail.comment ||
3554 "Detalle encontrado en un vídeo de Mundo Infinito."
3555 ),
3556
3557 lat,
3558
3559 lng
3560
3561 });
3562
3563
3564 if (
3565 !savedPlace
3566 ) {
3567
3568 throw new Error(
3569 `No se pudo guardar ${target.name}`
3570 );
3571
3572 }
3573
3574
3575 addPlaceToApp(
3576 savedPlace
3577 );
3578
3579
3580 if (
3581 !firstPlace
3582 ) {
3583
3584 firstPlace =
3585 savedPlace;
3586
3587 }
3588
3589
3590 /*
3591 * El descubrimiento conserva SU título original.
3592 *
3593 * Por ejemplo:
3594 * place = SAARA
3595 * discovery = "Horarios de atención en SAARA"
3596 *
3597 * Así aparece como información dentro de la ficha
3598 * del marcador SAARA.
3599 */
3600
3601 const savedDiscovery =
3602 await createSupabaseDiscovery({
3603
3604 title:
3605 detail.title,
3606
3607 description:
3608 detail.comment ||
3609 "",
3610
3611 category:
3612 detail.category ||
3613 detail.type ||
3614 "Consejo",
3615
3616 placeId:
3617 savedPlace.id,
3618
3619 videoId:
3620 savedVideo.id,
3621
3622 timestampStart:
3623 Number(
3624 detail.timestampStart ||
3625 0
3626 ),
3627
3628 timestampEnd:
3629 detail.timestampEnd ==
3630 null
3631 ? null
3632 : Number(
3633 detail.timestampEnd
3634 )
3635
3636 });
3637
3638
3639 addDiscoveryToApp(
3640 savedDiscovery
3641 );
3642
3643
3644 created.push(
3645 savedDiscovery
3646 );
3647
3648
3649 console.log(
3650 target.informational
3651 ? " Información asociada:"
3652 : " Lugar guardado:",
3653 detail.title,
3654 "→",
3655 savedPlace.name
3656 );
3657
3658 }
3659
3660 // =================================================
3661 // 3. ACTUALIZAR MAPA
3662 // =================================================
3663 renderMarkers();
3664 // =================================================
3665 // 4. MENSAJE FINAL
3666 // =================================================
3667 const total =
3668 created.length;
3669 showToast?.(
3670 total === 1
3671 ? "3 1 detalle guardado para todos"
3672 : `3 ${total} detalles guardados para todos`
3673 );
3674 // =================================================
3675 // 5. LIMPIAR
3676 // =================================================
3677 draftDetails =
3678 [];
3679 editingIndex =
3680 null;
3681 selectedFile =
3682 null;
3683 uploadedVideoUrl =
3684 null;
3685 uploadedVideoPath =
3686 null;
3687 uploadingVideo =
3688 false;
3689 clearObjectUrl();
3690 closeAddDiscovery();
3691 // =================================================
3692 // 6. IR AL PRIMER LUGAR
3693 // =================================================
3694 if (
3695 firstPlace &&
3696 Number.isFinite(
3697 Number(
3698 firstPlace.lat
3699 )
3700 ) &&
3701 Number.isFinite(
3702 Number(
3703 firstPlace.lng
3704 )
3705 )
3706 ) {
3707 map.setView(
3708 [
3709 firstPlace.lat,
3710 firstPlace.lng
3711 ],
3712 15
3713 );
3714 window.setTimeout(
3715 () => {
3716 openPlace(
3717 firstPlace.id
3718 );
3719 },
3720 300
3721 );
3722 }
3723 } catch (
3724 error
3725 ) {
3726 console.error(
3727 "Mundo Infinito v0.6.2 · Error guardando:",
3728 error
3729 );
3730 showToast?.(
3731 "No se pudieron guardar todos los detalles"
3732 );
3733 } finally {
3734 saving =
3735 false;
3736 if (
3737 saveAllButton
3738 ) {
3739 saveAllButton.disabled =
3740 false;
3741 saveAllButton.innerHTML =
3742 oldButtonHTML;
3743 }
3744 }
3745 },
3746 true
3747 );
3748 // =======================================================
3749 // ESCAPE
3750 // =======================================================
3751 document.addEventListener(
3752 "keydown",
3753 event => {
3754 if (
3755 event.key ===
3756 "Escape" &&
3757 manualEditor
3758 ?.classList
3759 .contains(
3760 "open"
3761 )
3762 ) {
3763 closeEditor();
3764 }
3765 }
3766 );
3767 // =======================================================
3768 // LISTO
3769 // =======================================================
3770 console.log(
3771 "n Mundo Infinito · Explorador de vídeos v0.6.5 cargado"
3772 );
3773 })(); // FIN video-explorer v0.
