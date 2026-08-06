0001 // =========================================================
0002 // MUNDO INFINITO · v0.6.0
0003 // Mapa + Supabase + descubrimientos compartidos
0004 // Vídeos + favoritos + buscador
0005 // =========================================================
0006
0007 "use strict";
0008
0009 // =========================================================
0010 // CONFIGURACIÓN GENERAL
0011 // =========================================================
0012
0013 const CONFIG = {
0014 city: "Río de Janeiro",
0015 country: "Brasil",
0016
0017 center: [
0018 -22.94,
0019 -43.22
0020 ],
0021
0022 zoom: 11,
0023
0024 storage: {
0025 discoveries:
0026 "mundoInfinitoDescubrimientos",
0027
0028 savedPlaces:
0029 "mundoInfinitoLugaresGuardados",
0030
0031 deviceId:
0032 "mundoInfinitoDeviceId"
0033 }
0034 };
0035
0036 // =========================================================
0037 // CONEXIÓN CON SUPABASE
0038 // =========================================================
0039
0040 let supabaseClient = null;
0041
0042 function initializeSupabase() {
0043
0044 try {
0045
0046 if (
0047 typeof window.supabase === "undefined"
0048 ) {
0049
0050 console.warn(
0051 "Supabase todavía no está disponible."
0052 );
0053
0054 return false;
0055 }
0056
0057 if (
0058 typeof SUPABASE_URL === "undefined" ||
0059 typeof SUPABASE_KEY === "undefined"
0060 ) {
0061
0062 console.warn(
0063 "No se encontró supabase-config.js"
0064 );
0065
0066 return false;
0067 }
0068
0069 supabaseClient =
0070 window.supabase.createClient(
0071 SUPABASE_URL,
0072 SUPABASE_KEY
0073 );
0074
0075 console.log(
0076 "☁ Supabase conectado"
0077 );
0078
0079 return true;
0080
0081 } catch (error) {
0082
0083 console.error(
0084 "Error conectando Supabase:",
0085 error
0086 );
0087
0088 return false;
0089 }
0090 }
0091
0092 // =========================================================
0093 // IDENTIFICADOR DEL DISPOSITIVO
0094 // =========================================================
0095
0096 function getDeviceId() {
0097
0098 let deviceId =
0099 localStorage.getItem(
0100 CONFIG.storage.deviceId
0101 );
0102
0103 if (!deviceId) {
0104
0105 deviceId =
0106 crypto.randomUUID
0107 ? crypto.randomUUID()
0108 : `device-${Date.now()}-${Math.random()
0109 .toString(36)
0110 .slice(2)}`;
0111
0112 localStorage.setItem(
0113 CONFIG.storage.deviceId,
0114 deviceId
0115 );
0116 }
0117
0118 return deviceId;
0119 }
0120
0121 const DEVICE_ID =
0122 getDeviceId();
0123
0124 // =========================================================
0125 // LUGARES BASE
0126 // =========================================================
0127
0128 const defaultPlaces = [];
0129
0130 // =========================================================
0131 // ESTADO DE LA APLICACIÓN
0132 // =========================================================
0133
0134 let places = [];
0135
0136 let videos = [];
0137
0138 let discoveries = [];
0139
0140 let selectedPlace = null;
0141
0142 let supabaseOnline = false;
0143
0144 const markers =
0145 new Map();
0146
0147 // =========================================================
0148 // ELEMENTOS DE LA INTERFAZ
0149 // =========================================================
0150
0151 const searchInput =
0152 document.getElementById(
0153 "searchInput"
0154 );
0155
0156 const clearSearch =
0157 document.getElementById(
0158 "clearSearch"
0159 );
0160
0161 const searchResults =
0162 document.getElementById(
0163 "searchResults"
0164 );
0165
0166 const openDiscoveryModal =
0167 document.getElementById(
0168 "openDiscoveryModal"
0169 );
0170
0171 const discoveryModal =
0172 document.getElementById(
0173 "discoveryModal"
0174 );
0175
0176 const closeDiscoveryModal =
0177 document.getElementById(
0178 "closeDiscoveryModal"
0179 );
0180
0181 const discoveryForm =
0182 document.getElementById(
0183 "discoveryForm"
0184 );
0185
0186 const useMapCenter =
0187 document.getElementById(
0188 "useMapCenter"
0189 );
0190
0191 const discoveryLat =
0192 document.getElementById(
0193 "discoveryLat"
0194 );
0195
0196 const discoveryLng =
0197 document.getElementById(
0198 "discoveryLng"
0199 );
0200
0201 const placePanel =
0202 document.getElementById(
0203 "placePanel"
0204 );
0205
0206 const closePlacePanel =
0207 document.getElementById(
0208 "closePlacePanel"
0209 );
0210
0211 const placeCoverIcon =
0212 document.getElementById(
0213 "placeCoverIcon"
0214 );
0215
0216 const placeCategory =
0217 document.getElementById(
0218 "placeCategory"
0219 );
0220
0221 const placeName =
0222 document.getElementById(
0223 "placeName"
0224 );
0225
0226 const placeZone =
0227 document.getElementById(
0228 "placeZone"
0229 );
0230
0231 const placeDescription =
0232 document.getElementById(
0233 "placeDescription"
0234 );
0235
0236 const placeLocationText =
0237 document.getElementById(
0238 "placeLocationText"
0239 );
0240
0241 const placeTip =
0242 document.getElementById(
0243 "placeTip"
0244 );
0245
0246 const placeVideosButton =
0247 document.getElementById(
0248 "placeVideosButton"
0249 );
0250
0251 const placeVideoActionText =
0252 document.getElementById(
0253 "placeVideoActionText"
0254 );
0255
0256 const placeVideoCount =
0257 document.getElementById(
0258 "placeVideoCount"
0259 );
0260
0261 const placeVideosList =
0262 document.getElementById(
0263 "placeVideosList"
0264 );
0265
0266 const savePlaceButton =
0267 document.getElementById(
0268 "savePlaceButton"
0269 );
0270
0271 const placeMapsButton =
0272 document.getElementById(
0273 "placeMapsButton"
0274 );
0275
0276 const contentPanel =
0277 document.getElementById(
0278 "contentPanel"
0279 );
0280
0281 const contentPanelTitle =
0282 document.getElementById(
0283 "contentPanelTitle"
0284 );
0285
0286 const contentPanelBody =
0287 document.getElementById(
0288 "contentPanelBody"
0289 );
0290
0291 const closeContentPanel =
0292 document.getElementById(
0293 "closeContentPanel"
0294 );
0295
0296 const toast =
0297 document.getElementById(
0298 "toast"
0299 );
0300
0301 const navButtons =
0302 document.querySelectorAll(
0303 ".nav-button"
0304 );
0305
0306 // =========================================================
0307 // REPRODUCTOR
0308 // =========================================================
0309
0310 const videoModal =
0311 document.getElementById(
0312 "videoModal"
0313 );
0314
0315 const closeVideoModal =
0316 document.getElementById(
0317 "closeVideoModal"
0318 );
0319
0320 const videoPlayer =
0321 document.getElementById(
0322 "videoPlayer"
0323 );
0324
0325 const videoModalTitle =
0326 document.getElementById(
0327 "videoModalTitle"
0328 );
0329
0330 const videoModalPlace =
0331 document.getElementById(
0332 "videoModalPlace"
0333 );
0334
0335 // =========================================================
0336 // UTILIDADES
0337 // =========================================================
0338
0339 function loadJSON(
0340 key,
0341 fallback
0342 ) {
0343
0344 try {
0345
0346 const value =
0347 localStorage.getItem(key);
0348
0349 if (!value) {
0350 return fallback;
0351 }
0352
0353 return JSON.parse(value);
0354
0355 } catch (error) {
0356
0357 console.error(
0358 `No se pudo leer ${key}:`,
0359 error
0360 );
0361
0362 return fallback;
0363 }
0364 }
0365
0366 function saveJSON(
0367 key,
0368 value
0369 ) {
0370
0371 try {
0372
0373 localStorage.setItem(
0374 key,
0375 JSON.stringify(value)
0376 );
0377
0378 } catch (error) {
0379
0380 console.error(
0381 `No se pudo guardar ${key}:`,
0382 error
0383 );
0384 }
0385 }
0386
0387 function normalize(text) {
0388
0389 return String(
0390 text || ""
0391 )
0392 .normalize("NFD")
0393 .replace(
0394 /[\u0300-\u036f]/g,
0395 ""
0396 )
0397 .toLowerCase();
0398 }
0399
0400 function slug(text) {
0401
0402 return normalize(text)
0403 .trim()
0404 .replace(
0405 /[^a-z0-9]+/g,
0406 "-"
0407 )
0408 .replace(
0409 /^-|-$/g,
0410 ""
0411 );
0412 }
0413
0414 function escapeHTML(value) {
0415
0416 return String(
0417 value || ""
0418 )
0419 .replaceAll(
0420 "&",
0421 "&amp;"
0422 )
0423 .replaceAll(
0424 "<",
0425 "&lt;"
0426 )
0427 .replaceAll(
0428 ">",
0429 "&gt;"
0430 )
0431 .replaceAll(
0432 '"',
0433 "&quot;"
0434 )
0435 .replaceAll(
0436 "'",
0437 "&#039;"
0438 );
0439 }
0440
0441 function showToast(message) {
0442
0443 if (!toast) {
0444 return;
0445 }
0446
0447 toast.textContent =
0448 message;
0449
0450 toast.classList.add(
0451 "show"
0452 );
0453
0454 window.clearTimeout(
0455 showToast.timeout
0456 );
0457
0458 showToast.timeout =
0459 window.setTimeout(
0460 () => {
0461
0462 toast.classList.remove(
0463 "show"
0464 );
0465
0466 },
0467 2500
0468 );
0469 }
0470
0471 // =========================================================
0472 // CATEGORÍAS
0473 // =========================================================
0474
0475 const categoryIcons = {
0476
0477 Lugar:
0478 "",
0479
0480 Mirador:
0481 "",
0482
0483 Playa:
0484 "",
0485
0486 Cultura:
0487 "",
0488
0489 Parque:
0490 "",
0491
0492 Compras:
0493 "",
0494
0495 "Vida nocturna":
0496 "",
0497
0498 Transporte:
0499 "✈",
0500
0501 Restaurante:
0502 "",
0503
0504 Gastronomía:
0505 "",
0506
0507 Consejo:
0508 ""
0509 };
0510
0511 const categoryTips = {
0512
0513 Lugar:
0514 "Comprueba horarios y entradas antes de ir.",
0515
0516 Mirador:
0517 "El amanecer o el atardecer suelen ofrecer las mejores vistas.",
0518
0519 Playa:
0520 "Lleva protección solar, agua y vigila tus pertenencias.",
0521
0522 Cultura:
0523 "Ir temprano suele permitir disfrutarlo con más tranquilidad.",
0524
0525 Parque:
0526 "Lleva agua y calzado cómodo.",
0527
0528 Compras:
0529 "Compara precios antes de comprar y lleva algo de efectivo.",
0530
0531 "Vida nocturna":
0532 "Planifica el transporte de vuelta antes de salir.",
0533
0534 Transporte:
0535 "Confirma el punto exacto de recogida antes de desplazarte.",
0536
0537 Restaurante:
0538 "Comprueba horarios y si es necesario reservar.",
0539
0540 Gastronomía:
0541 "Pregunta por la especialidad de la casa.",
0542
0543 Consejo:
0544 "Guárdalo para consultarlo durante el viaje."
0545 };// =========================================================
0546 // MAPA
0547 // =========================================================
0548
0549 const map = L.map(
0550 "map",
0551 {
0552 zoomControl: false
0553 }
0554 ).setView(
0555 CONFIG.center,
0556 CONFIG.zoom
0557 );
0558
0559 L.control.zoom({
0560 position: "bottomleft"
0561 }).addTo(map);
0562
0563 L.tileLayer(
0564 "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
0565 {
0566 attribution: "&copy; OpenStreetMap",
0567 maxZoom: 19
0568 }
0569 ).addTo(map);
0570
0571 // =========================================================
0572 // ICONOS DEL MAPA
0573 // =========================================================
0574
0575 function markerClass(category) {
0576
0577 return normalize(category)
0578 .replace(/\s+/g, "-");
0579 }
0580
0581 function resolveCategoryIcon(category) {
0582
0583 const raw =
0584 String(
0585 category ||
0586 ""
0587 ).trim();
0588
0589 const key =
0590 normalize(
0591 raw
0592 );
0593
0594 const aliases = {
0595
0596 lugar:
0597 "\u{1F4CD}",
0598
0599 restaurante:
0600 "\u{1F374}",
0601
0602 restaurant:
0603 "\u{1F374}",
0604
0605 bar:
0606 "\u{1F379}",
0607
0608 boteco:
0609 "\u{1F379}",
0610
0611 gastronomia:
0612 "\u{1F958}",
0613
0614 comida:
0615 "\u{1F958}",
0616
0617 playa:
0618 "\u{1F3D6}\u{FE0F}",
0619
0620 praia:
0621 "\u{1F3D6}\u{FE0F}",
0622
0623 mirador:
0624 "\u{1F304}",
0625
0626 viewpoint:
0627 "\u{1F304}",
0628
0629 cultura:
0630 "\u{1F3A8}",
0631
0632 parque:
0633 "\u{1F33F}",
0634
0635 compras:
0636 "\u{1F6CD}\u{FE0F}",
0637
0638 shopping:
0639 "\u{1F6CD}\u{FE0F}",
0640
0641 "vida nocturna":
0642 "\u{1F379}",
0643
0644 nightlife:
0645 "\u{1F379}",
0646
0647 transporte:
0648 "\u{1F695}",
0649
0650 transport:
0651 "\u{1F695}",
0652
0653 consejo:
0654 "\u{1F4A1}",
0655
0656 aviso:
0657 "\u{26A0}\u{FE0F}",
0658
0659 evento:
0660 "\u{1F389}",
0661
0662 precio:
0663 "\u{1F4B0}",
0664
0665 otro:
0666 "\u{2728}"
0667
0668 };
0669
0670 return (
0671 aliases[
0672 key
0673 ] ||
0674 "\u{1F4CD}"
0675 );
0676 }
0677
0678
0679 // =========================================================
0680 // CREAR ICONO DEL MARCADOR
0681 // =========================================================
0682
0683 function createMarkerIcon(place) {
0684
0685 const icon =
0686 resolveCategoryIcon(
0687 place.category
0688 );
0689
0690 return L.divIcon({
0691
0692 className:
0693 "",
0694
0695 html:
0696 `
0697 <div
0698 class="custom-marker ${markerClass(place.category)}"
0699 >
0700 <span>${icon}</span>
0701 </div>
0702 `,
0703
0704 iconSize:
0705 [
0706 38,
0707 38
0708 ],
0709
0710 iconAnchor:
0711 [
0712 19,
0713 38
0714 ]
0715
0716 });
0717 }
0718
0719
0720 // =========================================================
0721 // AÑADIR MARCADOR AL MAPA
0722 // =========================================================
0723
0724 function addMarker(place) {
0725
0726 if (
0727 !Number.isFinite(
0728 Number(
0729 place.lat
0730 )
0731 ) ||
0732 !Number.isFinite(
0733 Number(
0734 place.lng
0735 )
0736 )
0737 ) {
0738
0739 return;
0740 }
0741
0742 if (
0743 markers.has(
0744 place.id
0745 )
0746 ) {
0747
0748 return;
0749 }
0750
0751 const marker =
0752 L.marker(
0753 [
0754 Number(
0755 place.lat
0756 ),
0757
0758 Number(
0759 place.lng
0760 )
0761 ],
0762 {
0763
0764 icon:
0765 createMarkerIcon(
0766 place
0767 ),
0768
0769 title:
0770 place.name
0771
0772 }
0773 )
0774 .addTo(
0775 map
0776 );
0777
0778 marker.on(
0779 "click",
0780 () => {
0781
0782 openPlace(
0783 place.id
0784 );
0785
0786 }
0787 );
0788
0789 markers.set(
0790 place.id,
0791 marker
0792 );
0793 }
0794
0795
0796 function renderMarkers() {
0797
0798 markers.forEach(
0799 marker => {
0800
0801 marker.remove();
0802
0803 }
0804 );
0805
0806 markers.clear();
0807
0808 places.forEach(
0809 place => {
0810
0811 addMarker(
0812 place
0813 );
0814
0815 }
0816 );
0817 }
0818
0819
0820 // =========================================================
0821 // CARGAR JSON ANTIGUOS
0822 // Seguimos conservando places.json y videos.json
0823 // =========================================================
0824
0825 async function fetchJSON(
0826 path,
0827 fallback = []
0828 ) {
0829
0830 try {
0831
0832 const response =
0833 await fetch(
0834 path,
0835 {
0836 cache: "no-store"
0837 }
0838 );
0839
0840 if (!response.ok) {
0841
0842 throw new Error(
0843 `Error ${response.status} cargando ${path}`
0844 );
0845 }
0846
0847 const data =
0848 await response.json();
0849
0850 return Array.isArray(data)
0851 ? data
0852 : fallback;
0853
0854 } catch (error) {
0855
0856 console.warn(
0857 `No se pudo cargar ${path}.`,
0858 error
0859 );
0860
0861 return fallback;
0862 }
0863 }
0864
0865 // =========================================================
0866 // NORMALIZAR LUGARES
0867 // Permite mezclar:
0868 // - lugares originales
0869 // - places.json
0870 // - Supabase
0871 // =========================================================
0872
0873 function normalizePlace(place) {
0874
0875 return {
0876
0877 id:
0878 place.id ||
0879 slug(
0880 place.name ||
0881 place.nombre
0882 ),
0883
0884 slug:
0885 place.slug ||
0886 slug(
0887 place.name ||
0888 place.nombre
0889 ),
0890
0891 name:
0892 place.name ||
0893 place.nombre ||
0894 "Lugar",
0895
0896 zone:
0897 place.zone ||
0898 place.zona ||
0899 place.neighborhood ||
0900 "",
0901
0902 city:
0903 place.city ||
0904 CONFIG.city,
0905
0906 country:
0907 place.country ||
0908 CONFIG.country,
0909
0910 category:
0911 place.category ||
0912 place.categoria ||
0913 "Lugar",
0914
0915 description:
0916 place.description ||
0917 place.descripcion ||
0918 "Descubrimiento guardado en Mundo Infinito.",
0919
0920 lat:
0921 Number(
0922 place.lat ??
0923 place.latitude
0924 ),
0925
0926 lng:
0927 Number(
0928 place.lng ??
0929 place.longitude
0930 ),
0931
0932 rating:
0933 Number(
0934 place.rating || 5
0935 ),
0936
0937 image:
0938 place.image ||
0939 place.image_url ||
0940 "",
0941
0942 source:
0943 place.source ||
0944 "local"
0945 };
0946 }
0947
0948 // =========================================================
0949 // NORMALIZAR VÍDEOS
0950 // =========================================================
0951
0952 function normalizeVideo(video) {
0953
0954 return {
0955
0956 id:
0957 video.id ||
0958 `video-${Date.now()}-${Math.random()}`,
0959
0960 placeId:
0961 video.placeId ||
0962 video.place_id ||
0963 "",
0964
0965 place:
0966 video.place ||
0967 video.lugar ||
0968 "",
0969
0970 title:
0971 video.title ||
0972 video.titulo ||
0973 "Vídeo",
0974
0975 description:
0976 video.description ||
0977 video.descripcion ||
0978 "",
0979
0980 category:
0981 video.category ||
0982 "",
0983
0984 type:
0985 video.type ||
0986 video.tipo ||
0987 video.source_type ||
0988 "Vídeo",
0989
0990 url:
0991 video.url ||
0992 video.video_url ||
0993 video.link ||
0994 video.enlace ||
0995 video.source_url ||
0996 "",
0997
0998 sourceUrl:
0999 video.source_url ||
1000 video.url ||
1001 video.link ||
1002 "",
1003
1004 transcript:
1005 video.transcript ||
1006 "",
1007
1008 duration:
1009 Number(
1010 video.duration_seconds || 0
1011 ),
1012
1013 source:
1014 video.source ||
1015 "local"
1016 };
1017 }
1018
1019 // =========================================================
1020 // NORMALIZAR DESCUBRIMIENTOS
1021 // =========================================================
1022
1023 function normalizeDiscovery(
1024 discovery
1025 ) {
1026
1027 return {
1028
1029 id:
1030 discovery.id,
1031
1032 videoId:
1033 discovery.video_id ||
1034 discovery.videoId ||
1035 null,
1036
1037 placeId:
1038 discovery.place_id ||
1039 discovery.placeId ||
1040 null,
1041
1042 title:
1043 discovery.title ||
1044 "Descubrimiento",
1045
1046 description:
1047 discovery.description ||
1048 "",
1049
1050 category:
1051 discovery.category ||
1052 "Lugar",
1053
1054 timestampStart:
1055 Number(
1056 discovery.timestamp_start || 0
1057 ),
1058
1059 timestampEnd:
1060 discovery.timestamp_end === null ||
1061 discovery.timestamp_end === undefined
1062 ? null
1063 : Number(
1064 discovery.timestamp_end
1065 ),
1066
1067 confidence:
1068 discovery.confidence === null ||
1069 discovery.confidence === undefined
1070 ? null
1071 : Number(
1072 discovery.confidence
1073 ),
1074
1075 approved:
1076 Boolean(
1077 discovery.approved
1078 )
1079 };
1080 }
1081
1082 // =========================================================
1083 // COMBINAR LUGARES
1084 // =========================================================
1085
1086 function mergePlaces(
1087 ...placeGroups
1088 ) {
1089
1090 const combined =
1091 new Map();
1092
1093 defaultPlaces
1094 .map(normalizePlace)
1095 .forEach(place => {
1096
1097 combined.set(
1098 place.id,
1099 place
1100 );
1101 });
1102
1103 placeGroups.forEach(group => {
1104
1105 if (!Array.isArray(group)) {
1106 return;
1107 }
1108
1109 group
1110 .map(normalizePlace)
1111 .forEach(place => {
1112
1113 /*
1114 * Para los lugares de Supabase usamos
1115 * primero su UUID.
1116 */
1117
1118 const existingById =
1119 combined.get(place.id);
1120
1121 /*
1122 * También buscamos por slug para evitar
1123 * duplicar visualmente un lugar.
1124 */
1125
1126 const existingBySlug =
1127 Array.from(
1128 combined.values()
1129 ).find(
1130 item =>
1131 item.slug ===
1132 place.slug
1133 );
1134
1135 const existing =
1136 existingById ||
1137 existingBySlug;
1138
1139 if (existing) {
1140
1141 /*
1142 * Si el nuevo lugar viene de Supabase,
1143 * conservamos su UUID porque será necesario
1144 * para relacionarlo con discoveries.
1145 */
1146
1147 if (
1148 place.source ===
1149 "supabase"
1150 ) {
1151
1152 if (
1153 existing.id !==
1154 place.id
1155 ) {
1156
1157 combined.delete(
1158 existing.id
1159 );
1160 }
1161
1162 combined.set(
1163 place.id,
1164 {
1165 ...existing,
1166 ...place
1167 }
1168 );
1169
1170 } else {
1171
1172 combined.set(
1173 existing.id,
1174 {
1175 ...existing,
1176 ...place,
1177
1178 id:
1179 existing.id
1180 }
1181 );
1182 }
1183
1184 } else {
1185
1186 combined.set(
1187 place.id,
1188 place
1189 );
1190 }
1191 });
1192 });
1193
1194 return Array.from(
1195 combined.values()
1196 ).filter(
1197 place =>
1198 Number.isFinite(
1199 place.lat
1200 ) &&
1201 Number.isFinite(
1202 place.lng
1203 )
1204 );
1205 }
1206
1207 // =========================================================
1208 // LEER LUGARES DESDE SUPABASE
1209 // =========================================================
1210
1211 async function loadSupabasePlaces() {
1212
1213 if (!supabaseClient) {
1214 return [];
1215 }
1216
1217 try {
1218
1219 const {
1220 data,
1221 error
1222 } =
1223 await supabaseClient
1224 .from("places")
1225 .select("*")
1226 .order(
1227 "created_at",
1228 {
1229 ascending: true
1230 }
1231 );
1232
1233 if (error) {
1234 throw error;
1235 }
1236
1237 return (data || []).map(
1238 place =>
1239 normalizePlace({
1240 ...place,
1241
1242 source:
1243 "supabase"
1244 })
1245 );
1246
1247 } catch (error) {
1248
1249 console.error(
1250 "No se pudieron cargar los lugares de Supabase:",
1251 error
1252 );
1253
1254 return [];
1255 }
1256 }
1257
1258 // =========================================================
1259 // LEER VÍDEOS DESDE SUPABASE
1260 // =========================================================
1261
1262 async function loadSupabaseVideos() {
1263
1264 if (!supabaseClient) {
1265 return [];
1266 }
1267
1268 try {
1269
1270 const {
1271 data,
1272 error
1273 } =
1274 await supabaseClient
1275 .from("videos")
1276 .select("*")
1277 .order(
1278 "created_at",
1279 {
1280 ascending: true
1281 }
1282 );
1283
1284 if (error) {
1285 throw error;
1286 }
1287
1288 return (data || []).map(
1289 video =>
1290 normalizeVideo({
1291 ...video,
1292
1293 source:
1294 "supabase"
1295 })
1296 );
1297
1298 } catch (error) {
1299
1300 console.error(
1301 "No se pudieron cargar los vídeos de Supabase:",
1302 error
1303 );
1304
1305 return [];
1306 }
1307 }
1308
1309 // =========================================================
1310 // LEER DESCUBRIMIENTOS DESDE SUPABASE
1311 // =========================================================
1312
1313 async function loadSupabaseDiscoveries() {
1314
1315 if (!supabaseClient) {
1316 return [];
1317 }
1318
1319 try {
1320
1321 const {
1322 data,
1323 error
1324 } =
1325 await supabaseClient
1326 .from("discoveries")
1327 .select("*")
1328 .order(
1329 "created_at",
1330 {
1331 ascending: true
1332 }
1333 );
1334
1335 if (error) {
1336 throw error;
1337 }
1338
1339 return (data || []).map(
1340 normalizeDiscovery
1341 );
1342
1343 } catch (error) {
1344
1345 console.error(
1346 "No se pudieron cargar los descubrimientos de Supabase:",
1347 error
1348 );
1349
1350 return [];
1351 }
1352 }
1353
1354 // =========================================================
1355 // COMPROBAR CONEXIÓN CON SUPABASE
1356 // =========================================================
1357
1358 async function testSupabaseConnection() {
1359
1360 if (!supabaseClient) {
1361
1362 supabaseOnline = false;
1363
1364 return false;
1365 }
1366
1367 try {
1368
1369 const {
1370 error
1371 } =
1372 await supabaseClient
1373 .from("places")
1374 .select(
1375 "id",
1376 {
1377 head: true,
1378 count: "exact"
1379 }
1380 );
1381
1382 if (error) {
1383 throw error;
1384 }
1385
1386 supabaseOnline = true;
1387
1388 console.log(
1389 "☁ Base compartida disponible"
1390 );
1391
1392 return true;
1393
1394 } catch (error) {
1395
1396 supabaseOnline = false;
1397
1398 console.warn(
1399 "Mundo Infinito continuará sin conexión compartida:",
1400 error
1401 );
1402
1403 return false;
1404 }
1405 }
1406
1407 // =========================================================
1408 // MARCADORES
1409 // =========================================================
1410
1411 function addMarker(place) {
1412
1413 if (
1414 !Number.isFinite(
1415 place.lat
1416 ) ||
1417 !Number.isFinite(
1418 place.lng
1419 )
1420 ) {
1421
1422 return;
1423 }
1424
1425 if (
1426 markers.has(
1427 place.id
1428 )
1429 ) {
1430
1431 return;
1432 }
1433
1434 const marker =
1435 L.marker(
1436 [
1437 place.lat,
1438 place.lng
1439 ],
1440 {
1441 icon:
1442 createMarkerIcon(
1443 place
1444 ),
1445
1446 title:
1447 place.name
1448 }
1449 ).addTo(map);
1450
1451 marker.on(
1452 "click",
1453 () => {
1454
1455 openPlace(
1456 place.id
1457 );
1458 }
1459 );
1460
1461 markers.set(
1462 place.id,
1463 marker
1464 );
1465 }
1466
1467 function renderMarkers() {
1468
1469 markers.forEach(
1470 marker => {
1471
1472 marker.remove();
1473 }
1474 );
1475
1476 markers.clear();
1477
1478 places.forEach(
1479 place => {
1480
1481 addMarker(
1482 place
1483 );
1484 }
1485 );
1486 }
1487
1488 // =========================================================
1489 // BUSCAR LUGAR
1490 // =========================================================
1491
1492 function getPlaceById(
1493 placeId
1494 ) {
1495
1496 return places.find(
1497 place =>
1498 place.id ===
1499 placeId
1500 );
1501 }
1502
1503 // =========================================================
1504 // DESCUBRIMIENTOS DE UN LUGAR
1505 // =========================================================
1506
1507 function getDiscoveriesForPlace(
1508 place
1509 ) {
1510
1511 if (!place) {
1512 return [];
1513 }
1514
1515 return discoveries.filter(
1516 discovery =>
1517 discovery.placeId ===
1518 place.id
1519 );
1520 }
1521
1522 // =========================================================
1523 // VÍDEOS DE UN LUGAR
1524 // =========================================================
1525
1526 function getVideosForPlace(
1527 place
1528 ) {
1529
1530 const placeNameNormalized =
1531 normalize(
1532 place.name
1533 );
1534
1535 /*
1536 * Primero obtenemos IDs de vídeos relacionados
1537 * mediante la tabla discoveries.
1538 */
1539
1540 const relatedVideoIds =
1541 new Set(
1542 getDiscoveriesForPlace(
1543 place
1544 )
1545 .map(
1546 discovery =>
1547 discovery.videoId
1548 )
1549 .filter(Boolean)
1550 );
1551
1552 return videos.filter(
1553 video => {
1554
1555 /*
1556 * Nueva relación Supabase.
1557 */
1558
1559 if (
1560 relatedVideoIds.has(
1561 video.id
1562 )
1563 ) {
1564
1565 return true;
1566 }
1567
1568 /*
1569 * Compatibilidad con videos.json antiguo.
1570 */
1571
1572 if (
1573 video.placeId &&
1574 video.placeId ===
1575 place.id
1576 ) {
1577
1578 return true;
1579 }
1580
1581 /*
1582 * Compatibilidad por nombre.
1583 */
1584
1585 if (
1586 video.place &&
1587 normalize(
1588 video.place
1589 ) ===
1590 placeNameNormalized
1591 ) {
1592
1593 return true;
1594 }
1595
1596 return false;
1597 }
1598 );
1599 }
1600
1601 // =========================================================
1602 // TIMESTAMP DE UN VÍDEO PARA UN LUGAR
1603 // =========================================================
1604
1605 function getVideoTimestampForPlace(
1606 videoId,
1607 placeId
1608 ) {
1609
1610 const discovery =
1611 discoveries.find(
1612 item =>
1613 item.videoId ===
1614 videoId &&
1615 item.placeId ===
1616 placeId
1617 );
1618
1619 if (!discovery) {
1620 return 0;
1621 }
1622
1623 return Number(
1624 discovery.timestampStart || 0
1625 );
1626 }
1627
1628 // =========================================================
1629 // FORMATEAR TIMESTAMP
1630 // Ejemplo: 65 segundos → 01:05
1631 // =========================================================
1632
1633 function formatTimestamp(
1634 seconds
1635 ) {
1636
1637 const total =
1638 Math.max(
1639 0,
1640 Math.floor(
1641 Number(seconds) || 0
1642 )
1643 );
1644
1645 const minutes =
1646 Math.floor(
1647 total / 60
1648 );
1649
1650 const remainingSeconds =
1651 total % 60;
1652
1653 return (
1654 String(minutes)
1655 .padStart(
1656 2,
1657 "0"
1658 ) +
1659 ":" +
1660 String(remainingSeconds)
1661 .padStart(
1662 2,
1663 "0"
1664 )
1665 );
1666 }// =========================================================
1667 // APP.JS v0.5.0 · BLOQUE 3
1668 // Fichas + vídeos + timestamps + favoritos
1669 // =========================================================
1670
1671 // =========================================================
1672 // ABRIR FICHA DE LUGAR
1673 // =========================================================
1674
1675 function openPlace(placeId) {
1676
1677 const place =
1678 getPlaceById(
1679 placeId
1680 );
1681
1682 if (!place) {
1683 return;
1684 }
1685
1686 selectedPlace =
1687 place;
1688
1689 closeContent();
1690
1691 placeCoverIcon.textContent =
1692 categoryIcons[
1693 place.category
1694 ] || "";
1695
1696 placeCategory.textContent =
1697 place.category;
1698
1699 placeName.textContent =
1700 place.name;
1701
1702 placeZone.textContent =
1703 [
1704 place.zone,
1705 place.city
1706 ]
1707 .filter(Boolean)
1708 .join(" · ");
1709
1710 placeDescription.textContent =
1711 place.description;
1712
1713 placeLocationText.textContent =
1714 [
1715 place.zone,
1716 place.city,
1717 place.country ||
1718 CONFIG.country
1719 ]
1720 .filter(Boolean)
1721 .join(", ");
1722
1723 placeTip.textContent =
1724 categoryTips[
1725 place.category
1726 ] ||
1727 "Consulta tus descubrimientos antes de visitar este lugar.";
1728
1729 const mapsQuery =
1730 encodeURIComponent(
1731 `${place.name}, ${place.zone}, ${place.city}, ${place.country || CONFIG.country}`
1732 );
1733
1734 placeMapsButton.href =
1735 `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
1736
1737 renderPlaceVideos(
1738 place
1739 );
1740
1741 updateSavedButton();
1742
1743 placePanel.classList.add(
1744 "open"
1745 );
1746
1747 placePanel.setAttribute(
1748 "aria-hidden",
1749 "false"
1750 );
1751 }
1752
1753 // =========================================================
1754 // CERRAR FICHA
1755 // =========================================================
1756
1757 function closePlace() {
1758
1759 placePanel.classList.remove(
1760 "open"
1761 );
1762
1763 placePanel.setAttribute(
1764 "aria-hidden",
1765 "true"
1766 );
1767
1768 selectedPlace =
1769 null;
1770 }
1771
1772 closePlacePanel.addEventListener(
1773 "click",
1774 closePlace
1775 );
1776
1777 // =========================================================
1778 // MOSTRAR VÍDEOS DEL LUGAR
1779 // =========================================================
1780
1781 function renderPlaceVideos(
1782 place
1783 ) {
1784
1785 const relatedVideos =
1786 getVideosForPlace(
1787 place
1788 );
1789
1790 placeVideoCount.textContent =
1791 relatedVideos.length;
1792
1793 placeVideoActionText.textContent =
1794 relatedVideos.length === 1
1795 ? "1 vídeo"
1796 : `${relatedVideos.length} vídeos`;
1797
1798 if (
1799 relatedVideos.length === 0
1800 ) {
1801
1802 placeVideosList.innerHTML = `
1803 <div class="empty-state">
1804
1805 <span></span>
1806
1807 <strong>
1808 Todavía no hay vídeos
1809 </strong>
1810
1811 <p>
1812 Los vídeos relacionados con este lugar aparecerán aquí.
1813 </p>
1814
1815 </div>
1816 `;
1817
1818 return;
1819 }
1820
1821 placeVideosList.innerHTML =
1822 relatedVideos
1823 .map(video => {
1824
1825 const timestamp =
1826 getVideoTimestampForPlace(
1827 video.id,
1828 place.id
1829 );
1830
1831 const timestampHTML =
1832 timestamp > 0
1833 ? `
1834 <span class="video-source">
1835 ▶ ${formatTimestamp(timestamp)}
1836 </span>
1837 `
1838 : `
1839 <span class="video-source">
1840 ${escapeHTML(video.type || "Vídeo")}
1841 </span>
1842 `;
1843
1844 return `
1845 <button
1846 class="video-card"
1847 type="button"
1848 data-video-id="${escapeHTML(video.id)}"
1849 data-video-time="${timestamp}"
1850 >
1851
1852 <div class="video-thumb"></div>
1853
1854 <div class="video-info">
1855
1856 <strong>
1857 ${escapeHTML(video.title)}
1858 </strong>
1859
1860 <p>
1861 ${
1862 escapeHTML(
1863 video.description ||
1864 place.name
1865 )
1866 }
1867 </p>
1868
1869 ${timestampHTML}
1870
1871 </div>
1872
1873 </button>
1874 `;
1875 })
1876 .join("");
1877
1878 placeVideosList
1879 .querySelectorAll(
1880 "[data-video-id]"
1881 )
1882 .forEach(button => {
1883
1884 button.addEventListener(
1885 "click",
1886 () => {
1887
1888 const video =
1889 videos.find(
1890 item =>
1891 item.id ===
1892 button.dataset.videoId
1893 );
1894
1895 const timestamp =
1896 Number(
1897 button.dataset.videoTime ||
1898 0
1899 );
1900
1901 openVideo(
1902 video,
1903 timestamp
1904 );
1905 }
1906 );
1907 });
1908 }
1909
1910 // =========================================================
1911 // BOTÓN "VÍDEOS" DE LA FICHA
1912 // =========================================================
1913
1914 placeVideosButton.addEventListener(
1915 "click",
1916 () => {
1917
1918 if (!selectedPlace) {
1919 return;
1920 }
1921
1922 const relatedVideos =
1923 getVideosForPlace(
1924 selectedPlace
1925 );
1926
1927 if (
1928 relatedVideos.length === 0
1929 ) {
1930
1931 showToast(
1932 "Todavía no hay vídeos para este lugar"
1933 );
1934
1935 return;
1936 }
1937
1938 placeVideosList.scrollIntoView({
1939 behavior: "smooth",
1940 block: "start"
1941 });
1942 }
1943 );
1944
1945 // =========================================================
1946 // REPRODUCTOR DE VÍDEO
1947 // Permite comenzar en un segundo concreto
1948 // =========================================================
1949
1950 function openVideo(
1951 video,
1952 startAt = 0
1953 ) {
1954
1955 if (
1956 !video ||
1957 !video.url
1958 ) {
1959
1960 showToast(
1961 "Este vídeo todavía no tiene archivo"
1962 );
1963
1964 return;
1965 }
1966
1967 /*
1968 * Instagram, TikTok, YouTube, etc.
1969 * se siguen abriendo fuera si no son un MP4 directo.
1970 */
1971
1972 const externalURL =
1973 /^https?:\/\//i.test(
1974 video.url
1975 );
1976
1977 const directVideo =
1978 /\.(mp4|webm|ogg)(\?.*)?$/i.test(
1979 video.url
1980 );
1981
1982 if (
1983 externalURL &&
1984 !directVideo
1985 ) {
1986
1987 window.open(
1988 video.url,
1989 "_blank",
1990 "noopener,noreferrer"
1991 );
1992
1993 return;
1994 }
1995
1996 if (
1997 !videoModal ||
1998 !videoPlayer
1999 ) {
2000
2001 window.open(
2002 video.url,
2003 "_blank"
2004 );
2005
2006 return;
2007 }
2008
2009 videoModalTitle.textContent =
2010 video.title ||
2011 "Vídeo";
2012
2013 videoModalPlace.textContent =
2014 video.place ||
2015 "Brasil";
2016
2017 videoPlayer.src =
2018 video.url;
2019
2020 videoModal.classList.add(
2021 "open"
2022 );
2023
2024 videoModal.setAttribute(
2025 "aria-hidden",
2026 "false"
2027 );
2028
2029 /*
2030 * Esperamos a que el navegador conozca
2031 * la duración antes de saltar al timestamp.
2032 */
2033
2034 videoPlayer.onloadedmetadata =
2035 () => {
2036
2037 const safeStart =
2038 Math.max(
2039 0,
2040 Number(startAt) || 0
2041 );
2042
2043 if (
2044 safeStart > 0 &&
2045 Number.isFinite(
2046 videoPlayer.duration
2047 )
2048 ) {
2049
2050 videoPlayer.currentTime =
2051 Math.min(
2052 safeStart,
2053 Math.max(
2054 0,
2055 videoPlayer.duration - 0.2
2056 )
2057 );
2058 }
2059
2060 videoPlayer
2061 .play()
2062 .catch(() => {
2063 // Algunos navegadores requieren pulsar Play.
2064 });
2065 };
2066 }
2067
2068 // =========================================================
2069 // CERRAR VÍDEO
2070 // =========================================================
2071
2072 function closeVideo() {
2073
2074 if (!videoPlayer) {
2075 return;
2076 }
2077
2078 videoPlayer.pause();
2079
2080 videoPlayer.onloadedmetadata =
2081 null;
2082
2083 videoPlayer.removeAttribute(
2084 "src"
2085 );
2086
2087 videoPlayer.load();
2088
2089 videoModal.classList.remove(
2090 "open"
2091 );
2092
2093 videoModal.setAttribute(
2094 "aria-hidden",
2095 "true"
2096 );
2097 }
2098
2099 if (
2100 closeVideoModal
2101 ) {
2102
2103 closeVideoModal.addEventListener(
2104 "click",
2105 closeVideo
2106 );
2107 }
2108
2109 if (
2110 videoModal
2111 ) {
2112
2113 videoModal.addEventListener(
2114 "click",
2115 event => {
2116
2117 if (
2118 event.target ===
2119 videoModal
2120 ) {
2121
2122 closeVideo();
2123 }
2124 }
2125 );
2126 }
2127
2128 // =========================================================
2129 // FAVORITOS
2130 // Por ahora siguen siendo personales en el dispositivo.
2131 // =========================================================
2132
2133 function getSavedPlaces() {
2134
2135 const saved =
2136 loadJSON(
2137 CONFIG.storage.savedPlaces,
2138 []
2139 );
2140
2141 return Array.isArray(saved)
2142 ? saved
2143 : [];
2144 }
2145
2146 function isPlaceSaved(
2147 placeId
2148 ) {
2149
2150 return getSavedPlaces()
2151 .includes(
2152 placeId
2153 );
2154 }
2155
2156 function updateSavedButton() {
2157
2158 if (!selectedPlace) {
2159 return;
2160 }
2161
2162 const saved =
2163 isPlaceSaved(
2164 selectedPlace.id
2165 );
2166
2167 savePlaceButton
2168 .classList
2169 .toggle(
2170 "saved",
2171 saved
2172 );
2173
2174 savePlaceButton.innerHTML =
2175 saved
2176 ? `
2177 <span>♥</span>
2178 <b>Guardado</b>
2179 `
2180 : `
2181 <span>♡</span>
2182 <b>Guardar</b>
2183 `;
2184 }
2185
2186 savePlaceButton.addEventListener(
2187 "click",
2188 () => {
2189
2190 if (!selectedPlace) {
2191 return;
2192 }
2193
2194 const saved =
2195 getSavedPlaces();
2196
2197 const index =
2198 saved.indexOf(
2199 selectedPlace.id
2200 );
2201
2202 if (
2203 index >= 0
2204 ) {
2205
2206 saved.splice(
2207 index,
2208 1
2209 );
2210
2211 showToast(
2212 "Eliminado de Guardados"
2213 );
2214
2215 } else {
2216
2217 saved.push(
2218 selectedPlace.id
2219 );
2220
2221 showToast(
2222 "Guardado en Mundo Infinito"
2223 );
2224 }
2225
2226 saveJSON(
2227 CONFIG.storage.savedPlaces,
2228 saved
2229 );
2230
2231 updateSavedButton();
2232 }
2233 );
2234
2235 // =========================================================
2236 // BUSCADOR
2237 // Lugares de Mundo Infinito + ciudades de Brasil
2238 // =========================================================
2239
2240 function searchPlaces(
2241 query
2242 ) {
2243
2244 const words =
2245 normalize(query)
2246 .trim()
2247 .split(/\s+/)
2248 .filter(Boolean);
2249
2250 if (
2251 words.length === 0
2252 ) {
2253
2254 return [];
2255 }
2256
2257 return places.filter(
2258 place => {
2259
2260 const searchable =
2261 normalize(
2262 [
2263 place.name,
2264 place.zone,
2265 place.city,
2266 place.category,
2267 place.description
2268 ].join(" ")
2269 );
2270
2271 return words.every(
2272 word =>
2273 searchable.includes(
2274 word
2275 )
2276 );
2277 }
2278 );
2279 }
2280
2281
2282 // =========================================================
2283 // BÚSQUEDA DE CIUDADES DE BRASIL
2284 // No crea marcadores ni guarda nada.
2285 // Solo mueve el mapa.
2286 // =========================================================
2287
2288 let citySearchTimer =
2289 null;
2290
2291 let citySearchController =
2292 null;
2293
2294 let citySearchRun =
2295 0;
2296
2297
2298 async function searchBrazilCities(
2299 query
2300 ) {
2301
2302 const text =
2303 String(
2304 query ||
2305 ""
2306 ).trim();
2307
2308 if (
2309 text.length <
2310 2
2311 ) {
2312
2313 return [];
2314 }
2315
2316
2317 if (
2318 citySearchController
2319 ) {
2320
2321 citySearchController.abort();
2322
2323 }
2324
2325
2326 citySearchController =
2327 new AbortController();
2328
2329
2330 const params =
2331 new URLSearchParams({
2332
2333 q:
2334 text,
2335
2336 format:
2337 "jsonv2",
2338
2339 addressdetails:
2340 "1",
2341
2342 namedetails:
2343 "1",
2344
2345 limit:
2346 "10",
2347
2348 countrycodes:
2349 "br"
2350
2351 });
2352
2353
2354 const response =
2355 await fetch(
2356 "https://nominatim.openstreetmap.org/search?" +
2357 params.toString(),
2358 {
2359
2360 signal:
2361 citySearchController.signal,
2362
2363 headers: {
2364
2365 "Accept":
2366 "application/json",
2367
2368 "Accept-Language":
2369 "pt-BR,pt;q=0.9,es;q=0.8"
2370
2371 }
2372
2373 }
2374 );
2375
2376
2377 if (
2378 !response.ok
2379 ) {
2380
2381 throw new Error(
2382 `No se pudieron buscar ciudades (${response.status})`
2383 );
2384
2385 }
2386
2387
2388 const data =
2389 await response.json();
2390
2391
2392 if (
2393 !Array.isArray(
2394 data
2395 )
2396 ) {
2397
2398 return [];
2399
2400 }
2401
2402
2403 const uniqueCities =
2404 new Map();
2405
2406
2407 data.forEach(
2408 item => {
2409
2410 const address =
2411 item.address ||
2412 {};
2413
2414
2415 const countryCode =
2416 String(
2417 address.country_code ||
2418 ""
2419 ).toLowerCase();
2420
2421
2422 if (
2423 countryCode &&
2424 countryCode !==
2425 "br"
2426 ) {
2427
2428 return;
2429
2430 }
2431
2432
2433 const type =
2434 String(
2435 item.addresstype ||
2436 item.type ||
2437 ""
2438 ).toLowerCase();
2439
2440
2441 const cityName =
2442 String(
2443
2444 address.city ||
2445
2446 address.town ||
2447
2448 address.municipality ||
2449
2450 address.village ||
2451
2452 (
2453 [
2454 "city",
2455 "town",
2456 "municipality",
2457 "village",
2458 "administrative"
2459 ].includes(type)
2460
2461 ? (
2462 item.namedetails?.name ||
2463 item.name ||
2464 ""
2465 )
2466
2467 : ""
2468 )
2469
2470 ).trim();
2471
2472
2473 const state =
2474 String(
2475 address.state ||
2476 ""
2477 ).trim();
2478
2479
2480 const lat =
2481 Number(
2482 item.lat
2483 );
2484
2485
2486 const lng =
2487 Number(
2488 item.lon
2489 );
2490
2491
2492 if (
2493 !cityName ||
2494 !Number.isFinite(
2495 lat
2496 ) ||
2497 !Number.isFinite(
2498 lng
2499 )
2500 ) {
2501
2502 return;
2503
2504 }
2505
2506
2507 const key =
2508 normalize(
2509 `${cityName}-${state}`
2510 );
2511
2512
2513 if (
2514 uniqueCities.has(
2515 key
2516 )
2517 ) {
2518
2519 return;
2520
2521 }
2522
2523
2524 uniqueCities.set(
2525 key,
2526 {
2527
2528 name:
2529 cityName,
2530
2531 state,
2532
2533 country:
2534 "Brasil",
2535
2536 lat,
2537
2538 lng
2539
2540 }
2541 );
2542
2543 }
2544 );
2545
2546
2547 return Array.from(
2548 uniqueCities.values()
2549 )
2550 .slice(
2551 0,
2552 5
2553 );
2554 }
2555
2556
2557 // =========================================================
2558 // MOSTRAR RESULTADOS DE BÚSQUEDA
2559 // =========================================================
2560
2561 function renderSearchResults(
2562 localResults,
2563 cityResults = [],
2564 {
2565 searchingCities = false,
2566 citySearchError = false
2567 } = {}
2568 ) {
2569
2570 const query =
2571 searchInput.value.trim();
2572
2573
2574 if (!query) {
2575
2576 searchResults.innerHTML =
2577 "";
2578
2579 searchResults.classList.add(
2580 "hidden"
2581 );
2582
2583 clearSearch.classList.add(
2584 "hidden"
2585 );
2586
2587 return;
2588
2589 }
2590
2591
2592 clearSearch.classList.remove(
2593 "hidden"
2594 );
2595
2596
2597 const localHTML =
2598
2599 localResults.length
2600
2601 ? `
2602 <div class="search-results-group">
2603
2604 <div class="search-results-label">
2605 Mundo Infinito
2606 </div>
2607
2608 ${
2609 localResults
2610 .slice(
2611 0,
2612 6
2613 )
2614 .map(
2615 place => `
2616 <button
2617 class="search-result"
2618 type="button"
2619 data-place-id="${escapeHTML(place.id)}"
2620 >
2621
2622 <div class="search-result-icon">
2623 ${
2624 typeof resolveCategoryIcon ===
2625 "function"
2626
2627 ? resolveCategoryIcon(
2628 place.category
2629 )
2630
2631 : "&#128205;"
2632 }
2633 </div>
2634
2635 <div>
2636
2637 <strong>
2638 ${escapeHTML(place.name)}
2639 </strong>
2640
2641 <small>
2642 ${
2643 escapeHTML(
2644 [
2645 place.zone,
2646 place.city,
2647 place.category
2648 ]
2649 .filter(Boolean)
2650 .join(" · ")
2651 )
2652 }
2653 </small>
2654
2655 </div>
2656
2657 </button>
2658 `
2659 )
2660 .join("")
2661 }
2662
2663 </div>
2664 `
2665
2666 : "";
2667
2668
2669 const cityHTML =
2670
2671 cityResults.length
2672
2673 ? `
2674 <div class="search-results-group">
2675
2676 <div class="search-results-label">
2677 Ir a una ciudad
2678 </div>
2679
2680 ${
2681 cityResults
2682 .map(
2683 (city, index) => `
2684 <button
2685 class="search-result search-city-result"
2686 type="button"
2687 data-city-index="${index}"
2688 >
2689
2690 <div class="search-result-icon">
2691 &#128506;
2692 </div>
2693
2694 <div>
2695
2696 <strong>
2697 ${escapeHTML(city.name)}
2698 </strong>
2699
2700 <small>
2701 ${
2702 escapeHTML(
2703 [
2704 city.state,
2705 city.country
2706 ]
2707 .filter(Boolean)
2708 .join(" · ")
2709 )
2710 }
2711 </small>
2712
2713 </div>
2714
2715 </button>
2716 `
2717 )
2718 .join("")
2719 }
2720
2721 </div>
2722 `
2723
2724 : "";
2725
2726
2727 let statusHTML =
2728 "";
2729
2730
2731 if (
2732 searchingCities
2733 ) {
2734
2735 statusHTML = `
2736 <div class="no-results search-city-status">
2737
2738 <span>
2739 &#8987;
2740 </span>
2741
2742 <strong>
2743 Buscando ciudades de Brasil...
2744 </strong>
2745
2746 </div>
2747 `;
2748
2749 } else if (
2750 citySearchError &&
2751 localResults.length === 0
2752 ) {
2753
2754 statusHTML = `
2755 <div class="no-results">
2756
2757 <span>
2758 &#128269;
2759 </span>
2760
2761 <strong>
2762 No se pudo buscar la ciudad
2763 </strong>
2764
2765 <p>
2766 Prueba de nuevo en unos segundos.
2767 </p>
2768
2769 </div>
2770 `;
2771
2772 } else if (
2773 localResults.length === 0 &&
2774 cityResults.length === 0
2775 ) {
2776
2777 statusHTML = `
2778 <div class="no-results">
2779
2780 <span>
2781 &#128269;
2782 </span>
2783
2784 <strong>
2785 Sin resultados
2786 </strong>
2787
2788 <p>
2789 Prueba con otro lugar o ciudad de Brasil.
2790 </p>
2791
2792 </div>
2793 `;
2794
2795 }
2796
2797
2798 searchResults.innerHTML =
2799 localHTML +
2800 cityHTML +
2801 statusHTML;
2802
2803
2804 searchResults
2805 .querySelectorAll(
2806 "[data-place-id]"
2807 )
2808 .forEach(
2809 button => {
2810
2811 button.addEventListener(
2812 "click",
2813 () => {
2814
2815 const place =
2816 getPlaceById(
2817 button.dataset.placeId
2818 );
2819
2820
2821 if (!place) {
2822
2823 return;
2824
2825 }
2826
2827
2828 searchInput.value =
2829 place.name;
2830
2831
2832 searchResults.classList.add(
2833 "hidden"
2834 );
2835
2836
2837 map.setView(
2838 [
2839 place.lat,
2840 place.lng
2841 ],
2842 16
2843 );
2844
2845
2846 window.setTimeout(
2847 () => {
2848
2849 openPlace(
2850 place.id
2851 );
2852
2853 },
2854 250
2855 );
2856
2857 }
2858 );
2859
2860 }
2861 );
2862
2863
2864 searchResults
2865 .querySelectorAll(
2866 "[data-city-index]"
2867 )
2868 .forEach(
2869 button => {
2870
2871 button.addEventListener(
2872 "click",
2873 () => {
2874
2875 const city =
2876 cityResults[
2877 Number(
2878 button.dataset.cityIndex
2879 )
2880 ];
2881
2882
2883 if (!city) {
2884
2885 return;
2886
2887 }
2888
2889
2890 searchInput.value =
2891 city.name;
2892
2893
2894 searchResults.classList.add(
2895 "hidden"
2896 );
2897
2898
2899 closePlace();
2900
2901 closeContent();
2902
2903
2904 map.flyTo(
2905 [
2906 city.lat,
2907 city.lng
2908 ],
2909 12,
2910 {
2911
2912 duration:
2913 1.2
2914
2915 }
2916 );
2917
2918
2919 showToast(
2920 `Explorando ${city.name}`
2921 );
2922
2923 }
2924 );
2925
2926 }
2927 );
2928
2929
2930 searchResults.classList.remove(
2931 "hidden"
2932 );
2933
2934 }
2935
2936
2937 // =========================================================
2938 // ACTUALIZAR BÚSQUEDA
2939 // =========================================================
2940
2941 function updateSearch() {
2942
2943 const query =
2944 searchInput.value.trim();
2945
2946
2947 const localResults =
2948 searchPlaces(
2949 query
2950 );
2951
2952
2953 citySearchRun +=
2954 1;
2955
2956
2957 const runId =
2958 citySearchRun;
2959
2960
2961 if (
2962 citySearchTimer
2963 ) {
2964
2965 window.clearTimeout(
2966 citySearchTimer
2967 );
2968
2969 }
2970
2971
2972 if (
2973 citySearchController
2974 ) {
2975
2976 citySearchController.abort();
2977
2978 citySearchController =
2979 null;
2980
2981 }
2982
2983
2984 if (
2985 query.length <
2986 2
2987 ) {
2988
2989 renderSearchResults(
2990 localResults,
2991 []
2992 );
2993
2994 return;
2995
2996 }
2997
2998
2999 renderSearchResults(
3000 localResults,
3001 [],
3002 {
3003 searchingCities:
3004 true
3005 }
3006 );
3007
3008
3009 citySearchTimer =
3010 window.setTimeout(
3011 async () => {
3012
3013 try {
3014
3015 const cityResults =
3016 await searchBrazilCities(
3017 query
3018 );
3019
3020
3021 if (
3022 runId !==
3023 citySearchRun
3024 ) {
3025
3026 return;
3027
3028 }
3029
3030
3031 renderSearchResults(
3032 localResults,
3033 cityResults
3034 );
3035
3036
3037 } catch (
3038 error
3039 ) {
3040
3041 if (
3042 error?.name ===
3043 "AbortError"
3044 ) {
3045
3046 return;
3047
3048 }
3049
3050
3051 console.warn(
3052 "No se pudieron buscar ciudades:",
3053 error
3054 );
3055
3056
3057 if (
3058 runId !==
3059 citySearchRun
3060 ) {
3061
3062 return;
3063
3064 }
3065
3066
3067 renderSearchResults(
3068 localResults,
3069 [],
3070 {
3071 citySearchError:
3072 true
3073 }
3074 );
3075
3076 }
3077
3078 },
3079 350
3080 );
3081
3082 }
3083
3084
3085 searchInput.addEventListener(
3086 "input",
3087 updateSearch
3088 );
3089
3090
3091 clearSearch.addEventListener(
3092 "click",
3093 () => {
3094
3095 citySearchRun +=
3096 1;
3097
3098
3099 if (
3100 citySearchTimer
3101 ) {
3102
3103 window.clearTimeout(
3104 citySearchTimer
3105 );
3106
3107 }
3108
3109
3110 if (
3111 citySearchController
3112 ) {
3113
3114 citySearchController.abort();
3115
3116 citySearchController =
3117 null;
3118
3119 }
3120
3121
3122 searchInput.value =
3123 "";
3124
3125
3126 searchResults.innerHTML =
3127 "";
3128
3129
3130 searchResults.classList.add(
3131 "hidden"
3132 );
3133
3134
3135 clearSearch.classList.add(
3136 "hidden"
3137 );
3138
3139
3140 searchInput.focus();
3141
3142
3143 closePlace();
3144
3145
3146 map.setView(
3147 CONFIG.center,
3148 CONFIG.zoom
3149 );
3150
3151 }
3152 );
3153
3154
3155 document.addEventListener(
3156 "click",
3157 event => {
3158
3159 if (
3160 !event.target.closest(
3161 ".search-wrap"
3162 ) &&
3163 !event.target.closest(
3164 "#searchResults"
3165 )
3166 ) {
3167
3168 searchResults.classList.add(
3169 "hidden"
3170 );
3171
3172 }
3173
3174 }
3175 );
3176
3177
3178 // =========================================================
3179 // APP.JS v0.5.0 · BLOQUE 4
3180 //  compartido con Supabase
3181 // =========================================================
3182
3183 // =========================================================
3184 // ABRIR / CERRAR FORMULARIO
3185 // =========================================================
3186
3187 function openAddDiscovery() {
3188
3189 closePlace();
3190 closeContent();
3191
3192 discoveryModal.classList.add(
3193 "open"
3194 );
3195
3196 discoveryModal.setAttribute(
3197 "aria-hidden",
3198 "false"
3199 );
3200
3201 window.setTimeout(
3202 () => {
3203
3204 const input =
3205 document.getElementById(
3206 "discoveryTitle"
3207 );
3208
3209 if (input) {
3210 input.focus();
3211 }
3212
3213 },
3214 200
3215 );
3216 }
3217
3218 function closeAddDiscovery() {
3219
3220 discoveryModal.classList.remove(
3221 "open"
3222 );
3223
3224 discoveryModal.setAttribute(
3225 "aria-hidden",
3226 "true"
3227 );
3228 }
3229
3230 openDiscoveryModal.addEventListener(
3231 "click",
3232 openAddDiscovery
3233 );
3234
3235 closeDiscoveryModal.addEventListener(
3236 "click",
3237 closeAddDiscovery
3238 );
3239
3240 discoveryModal.addEventListener(
3241 "click",
3242 event => {
3243
3244 if (
3245 event.target ===
3246 discoveryModal
3247 ) {
3248
3249 closeAddDiscovery();
3250 }
3251 }
3252 );
3253
3254 // =========================================================
3255 // USAR CENTRO DEL MAPA
3256 // =========================================================
3257
3258 useMapCenter.addEventListener(
3259 "click",
3260 () => {
3261
3262 const center =
3263 map.getCenter();
3264
3265 discoveryLat.value =
3266 center.lat.toFixed(6);
3267
3268 discoveryLng.value =
3269 center.lng.toFixed(6);
3270
3271 showToast(
3272 "Coordenadas del mapa añadidas"
3273 );
3274 }
3275 );
3276
3277 // =========================================================
3278 // BUSCAR SI EL LUGAR YA EXISTE EN SUPABASE
3279 // =========================================================
3280
3281 async function findSupabasePlaceBySlug(
3282 placeSlug
3283 ) {
3284
3285 if (!supabaseClient) {
3286 return null;
3287 }
3288
3289 try {
3290
3291 const {
3292 data,
3293 error
3294 } =
3295 await supabaseClient
3296 .from("places")
3297 .select("*")
3298 .eq(
3299 "slug",
3300 placeSlug
3301 )
3302 .maybeSingle();
3303
3304 if (error) {
3305 throw error;
3306 }
3307
3308 return data || null;
3309
3310 } catch (error) {
3311
3312 console.error(
3313 "Error buscando el lugar:",
3314 error
3315 );
3316
3317 return null;
3318 }
3319 }
3320
3321 // =========================================================
3322 // CREAR O REUTILIZAR LUGAR
3323 // =========================================================
3324
3325 async function createOrGetPlace({
3326 name,
3327 zone,
3328 category,
3329 description,
3330 lat,
3331 lng
3332 }) {
3333
3334 const placeSlug =
3335 slug(name);
3336
3337 const existing =
3338 await findSupabasePlaceBySlug(
3339 placeSlug
3340 );
3341
3342 if (existing) {
3343
3344 if (
3345 Number.isFinite(
3346 Number(lat)
3347 ) &&
3348 Number.isFinite(
3349 Number(lng)
3350 )
3351 ) {
3352
3353 const {
3354 data:
3355 updatedPlace,
3356
3357 error:
3358 updateError
3359 } =
3360
3361 await supabaseClient
3362 .from("places")
3363 .update({
3364
3365 zone:
3366 zone ||
3367 existing.zone,
3368
3369 category:
3370 category ||
3371 existing.category,
3372
3373 description:
3374 description ||
3375 existing.description,
3376
3377 latitude:
3378 Number(lat),
3379
3380 longitude:
3381 Number(lng)
3382
3383 })
3384 .eq(
3385 "id",
3386 existing.id
3387 )
3388 .select()
3389 .single();
3390
3391
3392 if (
3393 !updateError &&
3394 updatedPlace
3395 ) {
3396
3397 console.log(
3398 " Coordenadas actualizadas:",
3399 name,
3400 lat,
3401 lng
3402 );
3403
3404 return normalizePlace({
3405 ...updatedPlace,
3406 source:
3407 "supabase"
3408 });
3409
3410 }
3411
3412
3413 if (
3414 updateError
3415 ) {
3416
3417 console.warn(
3418 "No se pudieron actualizar las coordenadas de:",
3419 name,
3420 updateError
3421 );
3422
3423 }
3424
3425 }
3426
3427
3428 return normalizePlace({
3429 ...existing,
3430 source:
3431 "supabase"
3432 });
3433
3434 }
3435
3436
3437 const {
3438 data,
3439 error
3440 } =
3441 await supabaseClient
3442 .from("places")
3443 .insert({
3444 slug:
3445 placeSlug,
3446
3447 name,
3448
3449 category,
3450
3451 zone,
3452
3453 city:
3454 CONFIG.city,
3455
3456 country:
3457 CONFIG.country,
3458
3459 description,
3460
3461 latitude:
3462 Number.isFinite(
3463 Number(lat)
3464 )
3465 ? Number(lat)
3466 : null,
3467
3468 longitude:
3469 Number.isFinite(
3470 Number(lng)
3471 )
3472 ? Number(lng)
3473 : null
3474 })
3475 .select()
3476 .single();
3477
3478
3479 if (error) {
3480 throw error;
3481 }
3482
3483
3484 return normalizePlace({
3485 ...data,
3486 source:
3487 "supabase"
3488 });
3489
3490 }
3491
3492 // =========================================================
3493 // CREAR VÍDEO EN SUPABASE
3494 // =========================================================
3495
3496 async function createSupabaseVideo({
3497 title,
3498 description,
3499 url
3500 }) {
3501
3502 if (!url) {
3503 return null;
3504 }
3505
3506 /*
3507 * Si ya existe la misma URL, reutilizamos el vídeo.
3508 */
3509
3510 const {
3511 data: existingVideos,
3512 error: searchError
3513 } =
3514 await supabaseClient
3515 .from("videos")
3516 .select("*")
3517 .eq(
3518 "source_url",
3519 url
3520 )
3521 .limit(1);
3522
3523 if (searchError) {
3524 throw searchError;
3525 }
3526
3527 if (
3528 Array.isArray(
3529 existingVideos
3530 ) &&
3531 existingVideos.length > 0
3532 ) {
3533
3534 return normalizeVideo({
3535 ...existingVideos[0],
3536 source:
3537 "supabase"
3538 });
3539 }
3540
3541 const sourceType =
3542 url.includes(
3543 "instagram.com"
3544 )
3545 ? "Instagram"
3546 : url.includes(
3547 "tiktok.com"
3548 )
3549 ? "TikTok"
3550 : url.includes(
3551 "youtube.com"
3552 ) ||
3553 url.includes(
3554 "youtu.be"
3555 )
3556 ? "YouTube"
3557 : "Vídeo";
3558
3559 const {
3560 data,
3561 error
3562 } =
3563 await supabaseClient
3564 .from("videos")
3565 .insert({
3566 title,
3567
3568 description,
3569
3570 /*
3571 * Para enlaces externos usamos source_url.
3572 * video_url quedará para MP4 alojados.
3573 */
3574
3575 video_url:
3576 null,
3577
3578 source_type:
3579 sourceType,
3580
3581 source_url:
3582 url,
3583
3584 transcript:
3585 null,
3586
3587 duration_seconds:
3588 null
3589 })
3590 .select()
3591 .single();
3592
3593 if (error) {
3594 throw error;
3595 }
3596
3597 return normalizeVideo({
3598 ...data,
3599 source:
3600 "supabase"
3601 });
3602 }
3603
3604 // =========================================================
3605 // CREAR DESCUBRIMIENTO
3606 // =========================================================
3607
3608 async function createSupabaseDiscovery({
3609 title,
3610 description,
3611 category,
3612 placeId,
3613 videoId = null,
3614 timestampStart = 0,
3615 timestampEnd = null
3616 }) {
3617
3618 const {
3619 data,
3620 error
3621 } =
3622 await supabaseClient
3623 .from("discoveries")
3624 .insert({
3625 video_id:
3626 videoId,
3627
3628 place_id:
3629 placeId,
3630
3631 title,
3632
3633 description,
3634
3635 category,
3636
3637 timestamp_start:
3638 timestampStart,
3639
3640 timestamp_end:
3641 timestampEnd,
3642
3643 /*
3644 * Como todavía lo introduce una persona,
3645 * lo consideramos aprobado.
3646 *
3647 * Cuando llegue la IA, las propuestas
3648 * automáticas entrarán con approved=false.
3649 */
3650
3651 confidence:
3652 1,
3653
3654 approved:
3655 true
3656 })
3657 .select()
3658 .single();
3659
3660 if (error) {
3661 throw error;
3662 }
3663
3664 return normalizeDiscovery(
3665 data
3666 );
3667 }
3668
3669 // =========================================================
3670 // FALLBACK LOCAL
3671 // Si Supabase falla, no perdemos lo escrito.
3672 // =========================================================
3673
3674 function saveDiscoveryLocally({
3675 title,
3676 placeText,
3677 category,
3678 link,
3679 comment,
3680 lat,
3681 lng
3682 }) {
3683
3684 const localDiscoveries =
3685 loadJSON(
3686 CONFIG.storage.discoveries,
3687 []
3688 );
3689
3690 const localId =
3691 `local-${slug(title)}-${Date.now()}`;
3692
3693 const localDiscovery = {
3694
3695 id:
3696 localId,
3697
3698 title,
3699
3700 name:
3701 title,
3702
3703 place:
3704 placeText,
3705
3706 zone:
3707 placeText,
3708
3709 category,
3710
3711 link,
3712
3713 comment,
3714
3715 description:
3716 comment ||
3717 "Descubrimiento añadido por un Explorador.",
3718
3719 lat,
3720
3721 lng,
3722
3723 createdAt:
3724 new Date().toISOString()
3725 };
3726
3727 localDiscoveries.push(
3728 localDiscovery
3729 );
3730
3731 saveJSON(
3732 CONFIG.storage.discoveries,
3733 localDiscoveries
3734 );
3735
3736 return localDiscovery;
3737 }
3738
3739 // =========================================================
3740 // FORMULARIO  · v0.6
3741 // Vídeo → exploración → varios detalles → revisión → guardar
3742 // =========================================================
3743
3744 const discoveryVideoLink = document.getElementById("discoveryVideoLink");
3745 const discoveryVideoFile = document.getElementById("discoveryVideoFile");
3746 const discoveryVideoPreview = document.getElementById("discoveryVideoPreview");
3747 const discoveryPreviewPlayer = document.getElementById("discoveryPreviewPlayer");
3748 const videoExplorationStatus = document.getElementById("videoExplorationStatus");
3749 const explorationMessage = document.getElementById("explorationMessage");
3750 const explorationProgressBar = document.getElementById("explorationProgressBar");
3751 const explorationResults = document.getElementById("explorationResults");
3752 const detectedDetailsCount = document.getElementById("detectedDetailsCount");
3753 const detectedDetailsList = document.getElementById("detectedDetailsList");
3754 const addManualDetailButton = document.getElementById("addManualDetailButton");
3755 const manualDetailEditor = document.getElementById("manualDetailEditor");
3756 const detailType = document.getElementById("detailType");
3757 const discoveryTitle = document.getElementById("discoveryTitle");
3758 const discoveryPlace = document.getElementById("discoveryPlace");
3759 const discoveryCategory = document.getElementById("discoveryCategory");
3760 const detailTimestampStart = document.getElementById("detailTimestampStart");
3761 const detailTimestampEnd = document.getElementById("detailTimestampEnd");
3762 const useCurrentVideoTime = document.getElementById("useCurrentVideoTime");
3763 const discoveryComment = document.getElementById("discoveryComment");
3764 const addDetailToDraft = document.getElementById("addDetailToDraft");
3765 const cancelDetailEdit = document.getElementById("cancelDetailEdit");
3766 const videoDraftSummary = document.getElementById("videoDraftSummary");
3767 const videoDraftDetailsList = document.getElementById("videoDraftDetailsList");
3768 const draftDetailsCount = document.getElementById("draftDetailsCount");
3769 const saveAllDiscoveriesButton = document.getElementById("saveAllDiscoveriesButton");
3770 const discoveryCard = document.querySelector(".discovery-v06-card");
3771
3772 let discoveryDraft = [];
3773 let editingDraftIndex = null;
3774 let explorationTimer = null;
3775 let localVideoObjectURL = null;
3776
3777 function parseTimestamp(value) {
3778 const text = String(value || "").trim();
3779 if (!text) return 0;
3780 if (/^\d+$/.test(text)) return Math.max(0, Number(text));
3781 const parts = text.split(":").map(Number);
3782 if (parts.some(part => !Number.isFinite(part))) return 0;
3783 if (parts.length === 2) return Math.max(0, parts[0] * 60 + parts[1]);
3784 if (parts.length === 3) return Math.max(0, parts[0] * 3600 + parts[1] * 60 + parts[2]);
3785 return 0;
3786 }
3787
3788 function detailIcon(item) {
3789 const typeIcons = {
3790 Lugar: "",
3791 Restaurante: "",
3792 Bar: "",
3793 Playa: "",
3794 Mirador: "",
3795 Consejo: "",
3796 Precio: "",
3797 Transporte: "",
3798 Aviso: "⚠",
3799 Compras: "",
3800 Evento: "",
3801 Otro: ""
3802 };
3803
3804 return (
3805 typeIcons[
3806 item.type
3807 ] ||
3808 resolveCategoryIcon(
3809 item.category
3810 )
3811 );
3812 }
3813
3814 function resetDetailEditor() {
3815 editingDraftIndex = null;
3816 if (detailType) detailType.value = "Lugar";
3817 if (discoveryTitle) discoveryTitle.value = "";
3818 if (discoveryPlace) discoveryPlace.value = "";
3819 if (discoveryCategory) discoveryCategory.value = "";
3820 if (detailTimestampStart) detailTimestampStart.value = "00:00";
3821 if (detailTimestampEnd) detailTimestampEnd.value = "";
3822 if (discoveryComment) discoveryComment.value = "";
3823 if (discoveryLat) discoveryLat.value = "";
3824 if (discoveryLng) discoveryLng.value = "";
3825 if (addDetailToDraft) addDetailToDraft.textContent = " Añadir detalle";
3826 if (cancelDetailEdit) cancelDetailEdit.classList.add("hidden");
3827 }
3828
3829 function resetDiscoveryFlow() {
3830 discoveryDraft = [];
3831 editingDraftIndex = null;
3832 if (explorationTimer) window.clearInterval(explorationTimer);
3833 explorationTimer = null;
3834 if (localVideoObjectURL) URL.revokeObjectURL(localVideoObjectURL);
3835 localVideoObjectURL = null;
3836 discoveryForm.reset();
3837 resetDetailEditor();
3838 discoveryCard?.classList.remove("is-exploring", "has-results");
3839 videoExplorationStatus?.classList.remove("active");
3840 explorationResults?.classList.remove("active");
3841 videoDraftSummary?.classList.remove("active");
3842 manualDetailEditor?.classList.remove("open");
3843 saveAllDiscoveriesButton?.classList.remove("visible");
3844 if (detectedDetailsList) detectedDetailsList.innerHTML = "";
3845 if (videoDraftDetailsList) videoDraftDetailsList.innerHTML = "";
3846 if (detectedDetailsCount) detectedDetailsCount.textContent = "0";
3847 if (draftDetailsCount) draftDetailsCount.textContent = "0";
3848 if (explorationProgressBar) explorationProgressBar.style.width = "0%";
3849 if (discoveryVideoPreview) discoveryVideoPreview.classList.add("hidden");
3850 if (discoveryPreviewPlayer) {
3851 discoveryPreviewPlayer.pause();
3852 discoveryPreviewPlayer.removeAttribute("src");
3853 discoveryPreviewPlayer.load();
3854 }
3855 }
3856
3857 function openAddDiscovery() {
3858 closePlace();
3859 closeContent();
3860 resetDiscoveryFlow();
3861 discoveryModal.classList.add("open");
3862 discoveryModal.setAttribute("aria-hidden", "false");
3863 window.setTimeout(() => discoveryVideoLink?.focus(), 180);
3864 }
3865
3866 function closeAddDiscovery() {
3867 if (explorationTimer) window.clearInterval(explorationTimer);
3868 discoveryModal.classList.remove("open");
3869 discoveryModal.setAttribute("aria-hidden", "true");
3870 }
3871
3872 openDiscoveryModal.addEventListener("click", openAddDiscovery);
3873 closeDiscoveryModal.addEventListener("click", closeAddDiscovery);
3874 discoveryModal.addEventListener("click", event => {
3875 if (event.target === discoveryModal) closeAddDiscovery();
3876 });
3877
3878 useMapCenter.addEventListener("click", () => {
3879 const center = map.getCenter();
3880 discoveryLat.value = center.lat.toFixed(6);
3881 discoveryLng.value = center.lng.toFixed(6);
3882 showToast("Coordenadas del mapa añadidas");
3883 });
3884
3885 function showExplorationResults() {
3886 discoveryCard?.classList.remove("is-exploring");
3887 discoveryCard?.classList.add("has-results");
3888 videoExplorationStatus?.classList.remove("active");
3889 explorationResults?.classList.add("active");
3890 renderDraft();
3891
3892 /*
3893 * v0.6 deja listo el flujo completo de revisión y guardado.
3894 * El análisis real del audio/imagen del vídeo se conectará a un backend
3895 * seguro en el siguiente paso. No inventamos lugares ni resultados.
3896 */
3897 if (discoveryDraft.length === 0 && detectedDetailsList) {
3898 detectedDetailsList.innerHTML = `
3899 <div class="empty-state">
3900 <span></span>
3901 <strong>Vídeo preparado</strong>
3902 <p>La exploración automática real se conectará al servicio de análisis. Mientras tanto puedes añadir los detalles manualmente.</p>
3903 </div>
3904 `;
3905 }
3906 }
3907
3908 function startExploration() {
3909 const hasLink = Boolean(discoveryVideoLink?.value.trim());
3910 const hasFile = Boolean(discoveryVideoFile?.files?.[0]);
3911 if (!hasLink && !hasFile) return;
3912
3913 if (explorationTimer) window.clearInterval(explorationTimer);
3914 discoveryCard?.classList.remove("has-results");
3915 discoveryCard?.classList.add("is-exploring");
3916 explorationResults?.classList.remove("active");
3917 manualDetailEditor?.classList.remove("open");
3918 videoExplorationStatus?.classList.add("active");
3919
3920 const messages = [
3921 "Preparando el contenido…",
3922 "Escuchando lo que cuentan…",
3923 "Localizando lugares mencionados…",
3924 "Buscando gastronomía y consejos…",
3925 "Localizando los momentos exactos…",
3926 "Preparando tus descubrimientos…"
3927 ];
3928 let step = 0;
3929 if (explorationProgressBar) explorationProgressBar.style.width = "8%";
3930 if (explorationMessage) explorationMessage.textContent = messages[0];
3931
3932 explorationTimer = window.setInterval(() => {
3933 step += 1;
3934 const progress = Math.min(100, 8 + step * 18);
3935 if (explorationProgressBar) explorationProgressBar.style.width = `${progress}%`;
3936 if (explorationMessage) explorationMessage.textContent = messages[Math.min(step, messages.length - 1)];
3937 if (step >= 5) {
3938 window.clearInterval(explorationTimer);
3939 explorationTimer = null;
3940 window.setTimeout(showExplorationResults, 300);
3941 }
3942 }, 420);
3943 }
3944
3945 let linkExploreDebounce = null;
3946 discoveryVideoLink?.addEventListener("input", () => {
3947 window.clearTimeout(linkExploreDebounce);
3948 const value = discoveryVideoLink.value.trim();
3949 if (!value) return;
3950 linkExploreDebounce = window.setTimeout(startExploration, 650);
3951 });
3952
3953 discoveryVideoFile?.addEventListener("change", () => {
3954 const file = discoveryVideoFile.files?.[0];
3955 if (!file) return;
3956 if (localVideoObjectURL) URL.revokeObjectURL(localVideoObjectURL);
3957 localVideoObjectURL = URL.createObjectURL(file);
3958 if (discoveryPreviewPlayer && discoveryVideoPreview) {
3959 discoveryPreviewPlayer.src = localVideoObjectURL;
3960 discoveryVideoPreview.classList.remove("hidden");
3961 }
3962 startExploration();
3963 });
3964
3965 function renderDraft() {
3966 const count = discoveryDraft.length;
3967 if (detectedDetailsCount) detectedDetailsCount.textContent = String(count);
3968 if (draftDetailsCount) draftDetailsCount.textContent = String(count);
3969
3970 const html = discoveryDraft.map((item, index) => `
3971 <article class="detected-detail-card">
3972 <div class="detected-detail-icon">${detailIcon(item)}</div>
3973 <div class="detected-detail-info">
3974 <strong>${escapeHTML(item.title)}</strong>
3975 <div class="detected-detail-meta">
3976 <span>${escapeHTML(item.category || item.type)}</span>
3977 ${item.placeText ? `<span>· ${escapeHTML(item.placeText)}</span>` : ""}
3978 <span class="detail-time">▶ ${formatTimestamp(item.timestampStart)}</span>
3979 </div>
3980 </div>
3981 <div class="detected-detail-actions">
3982 <button type="button" data-edit-detail="${index}" aria-label="Editar">✏</button>
3983 <button type="button" data-delete-detail="${index}" aria-label="Eliminar"></button>
3984 </div>
3985 </article>
3986 `).join("");
3987
3988 if (detectedDetailsList) detectedDetailsList.innerHTML = html;
3989 if (videoDraftDetailsList) videoDraftDetailsList.innerHTML = html;
3990
3991 [detectedDetailsList, videoDraftDetailsList].forEach(container => {
3992 if (!container) return;
3993 container.querySelectorAll("[data-edit-detail]").forEach(button => {
3994 button.addEventListener("click", () => editDraftDetail(Number(button.dataset.editDetail)));
3995 });
3996 container.querySelectorAll("[data-delete-detail]").forEach(button => {
3997 button.addEventListener("click", () => {
3998 discoveryDraft.splice(Number(button.dataset.deleteDetail), 1);
3999 renderDraft();
4000 showToast("Detalle eliminado");
4001 });
4002 });
4003 });
4004
4005 if (count > 0) {
4006 videoDraftSummary?.classList.add("active");
4007 saveAllDiscoveriesButton?.classList.add("visible");
4008 } else {
4009 videoDraftSummary?.classList.remove("active");
4010 saveAllDiscoveriesButton?.classList.remove("visible");
4011 }
4012 }
4013
4014 function openDetailEditor() {
4015 manualDetailEditor?.classList.add("open");
4016 window.setTimeout(() => discoveryTitle?.focus(), 100);
4017 }
4018
4019 addManualDetailButton?.addEventListener("click", () => {
4020 resetDetailEditor();
4021 openDetailEditor();
4022 });
4023
4024 cancelDetailEdit?.addEventListener("click", () => {
4025 resetDetailEditor();
4026 manualDetailEditor?.classList.remove("open");
4027 });
4028
4029 useCurrentVideoTime?.addEventListener("click", () => {
4030 if (!discoveryPreviewPlayer || !Number.isFinite(discoveryPreviewPlayer.currentTime)) {
4031 showToast("Reproduce primero un vídeo subido");
4032 return;
4033 }
4034 detailTimestampStart.value = formatTimestamp(discoveryPreviewPlayer.currentTime);
4035 });
4036
4037 function editDraftDetail(index) {
4038 const item = discoveryDraft[index];
4039 if (!item) return;
4040 editingDraftIndex = index;
4041 if (detailType) detailType.value = item.type || "Lugar";
4042 discoveryTitle.value = item.title || "";
4043 discoveryPlace.value = item.placeText || "";
4044 discoveryCategory.value = item.category || "Lugar";
4045 detailTimestampStart.value = formatTimestamp(item.timestampStart || 0);
4046 detailTimestampEnd.value = item.timestampEnd == null ? "" : formatTimestamp(item.timestampEnd);
4047 discoveryComment.value = item.description || "";
4048 discoveryLat.value = Number.isFinite(item.lat) ? item.lat : "";
4049 discoveryLng.value = Number.isFinite(item.lng) ? item.lng : "";
4050 addDetailToDraft.textContent = "✓ Guardar cambios";
4051 cancelDetailEdit?.classList.remove("hidden");
4052 openDetailEditor();
4053 }
4054
4055 addDetailToDraft?.addEventListener("click", () => {
4056 const title = discoveryTitle.value.trim();
4057 const placeText = discoveryPlace.value.trim();
4058 const category = discoveryCategory.value.trim() || detailType.value || "Lugar";
4059 if (!title) {
4060 showToast("Escribe un nombre o título");
4061 discoveryTitle.focus();
4062 return;
4063 }
4064
4065 const center = map.getCenter();
4066 const latValue = Number(discoveryLat.value);
4067 const lngValue = Number(discoveryLng.value);
4068 const item = {
4069 type: detailType.value || "Lugar",
4070 title,
4071 placeText: placeText || CONFIG.city,
4072 category,
4073 description: discoveryComment.value.trim(),
4074 timestampStart: parseTimestamp(detailTimestampStart.value),
4075 timestampEnd: detailTimestampEnd.value.trim() ? parseTimestamp(detailTimestampEnd.value) : null,
4076 lat: Number.isFinite(latValue) && latValue !== 0 ? latValue : center.lat,
4077 lng: Number.isFinite(lngValue) && lngValue !== 0 ? lngValue : center.lng
4078 };
4079
4080 if (editingDraftIndex === null) {
4081 discoveryDraft.push(item);
4082 showToast("Detalle añadido");
4083 } else {
4084 discoveryDraft[editingDraftIndex] = item;
4085 showToast("Detalle actualizado");
4086 }
4087
4088 resetDetailEditor();
4089 manualDetailEditor?.classList.remove("open");
4090 renderDraft();
4091 });
4092
4093 // =========================================================
4094 // FUNCIONES SUPABASE REUTILIZADAS
4095 // =========================================================
4096
4097 async function findSupabasePlaceBySlug(placeSlug) {
4098 if (!supabaseClient) return null;
4099 try {
4100 const { data, error } = await supabaseClient.from("places").select("*").eq("slug", placeSlug).maybeSingle();
4101 if (error) throw error;
4102 return data || null;
4103 } catch (error) {
4104 console.error("Error buscando el lugar:", error);
4105 return null;
4106 }
4107 }
4108
4109 async function createOrGetPlace({
4110 name,
4111 zone,
4112 category,
4113 description,
4114 lat,
4115 lng
4116 }) {
4117
4118 const placeSlug =
4119 slug(name);
4120
4121 const existing =
4122 await findSupabasePlaceBySlug(
4123 placeSlug
4124 );
4125
4126 if (existing) {
4127
4128 if (
4129 Number.isFinite(
4130 Number(lat)
4131 ) &&
4132 Number.isFinite(
4133 Number(lng)
4134 )
4135 ) {
4136
4137 const {
4138 data:
4139 updatedPlace,
4140
4141 error:
4142 updateError
4143 } =
4144
4145 await supabaseClient
4146 .from("places")
4147 .update({
4148
4149 zone:
4150 zone ||
4151 existing.zone,
4152
4153 category:
4154 category ||
4155 existing.category,
4156
4157 description:
4158 description ||
4159 existing.description,
4160
4161 latitude:
4162 Number(lat),
4163
4164 longitude:
4165 Number(lng)
4166
4167 })
4168 .eq(
4169 "id",
4170 existing.id
4171 )
4172 .select()
4173 .single();
4174
4175
4176 if (
4177 !updateError &&
4178 updatedPlace
4179 ) {
4180
4181 console.log(
4182 " Coordenadas actualizadas:",
4183 name,
4184 lat,
4185 lng
4186 );
4187
4188 return normalizePlace({
4189 ...updatedPlace,
4190 source:
4191 "supabase"
4192 });
4193
4194 }
4195
4196
4197 if (
4198 updateError
4199 ) {
4200
4201 console.warn(
4202 "No se pudieron actualizar las coordenadas de:",
4203 name,
4204 updateError
4205 );
4206
4207 }
4208
4209 }
4210
4211
4212 return normalizePlace({
4213 ...existing,
4214 source:
4215 "supabase"
4216 });
4217
4218 }
4219
4220
4221 const {
4222 data,
4223 error
4224 } =
4225 await supabaseClient
4226 .from("places")
4227 .insert({
4228 slug:
4229 placeSlug,
4230
4231 name,
4232
4233 category,
4234
4235 zone,
4236
4237 city:
4238 CONFIG.city,
4239
4240 country:
4241 CONFIG.country,
4242
4243 description,
4244
4245 latitude:
4246 Number.isFinite(
4247 Number(lat)
4248 )
4249 ? Number(lat)
4250 : null,
4251
4252 longitude:
4253 Number.isFinite(
4254 Number(lng)
4255 )
4256 ? Number(lng)
4257 : null
4258 })
4259 .select()
4260 .single();
4261
4262
4263 if (error) {
4264 throw error;
4265 }
4266
4267
4268 return normalizePlace({
4269 ...data,
4270 source:
4271 "supabase"
4272 });
4273
4274 }
4275
4276 async function createSupabaseVideo({ title, description, url }) {
4277 if (!url) return null;
4278 const { data: existingVideos, error: searchError } = await supabaseClient.from("videos").select("*").eq("source_url", url).limit(1);
4279 if (searchError) throw searchError;
4280 if (Array.isArray(existingVideos) && existingVideos.length > 0) {
4281 return normalizeVideo({ ...existingVideos[0], source: "supabase" });
4282 }
4283 const sourceType = url.includes("instagram.com") ? "Instagram" : url.includes("tiktok.com") ? "TikTok" : (url.includes("youtube.com") || url.includes("you
tu.be")) ? "YouTube" : "Vídeo";
4284 const { data, error } = await supabaseClient.from("videos").insert({
4285 title, description, video_url: null, source_type: sourceType, source_url: url,
4286 transcript: null, duration_seconds: null
4287 }).select().single();
4288 if (error) throw error;
4289 return normalizeVideo({ ...data, source: "supabase" });
4290 }
4291
4292 async function createSupabaseDiscovery({ title, description, category, placeId, videoId = null, timestampStart = 0, timestampEnd = null }) {
4293 const { data, error } = await supabaseClient.from("discoveries").insert({
4294 video_id: videoId, place_id: placeId, title, description, category,
4295 timestamp_start: timestampStart, timestamp_end: timestampEnd,
4296 confidence: 1, approved: true
4297 }).select().single();
4298 if (error) throw error;
4299 return normalizeDiscovery(data);
4300 }
4301
4302 // =========================================================
4303 // GUARDAR TODO
4304 // =========================================================
4305
4306 discoveryForm.addEventListener("submit", async event => {
4307 event.preventDefault();
4308 if (discoveryDraft.length === 0) {
4309 showToast("Añade al menos un detalle");
4310 return;
4311 }
4312
4313 const link = discoveryVideoLink?.value.trim() || "";
4314 if (!link) {
4315 showToast("Para compartirlo ahora, pega el enlace del vídeo");
4316 return;
4317 }
4318
4319 const original = saveAllDiscoveriesButton?.textContent || "Guardar todo";
4320 if (saveAllDiscoveriesButton) {
4321 saveAllDiscoveriesButton.disabled = true;
4322 saveAllDiscoveriesButton.textContent = "Guardando…";
4323 }
4324
4325 try {
4326 if (!supabaseOnline || !supabaseClient) throw new Error("Supabase no disponible");
4327
4328 const first = discoveryDraft[0];
4329 const sharedVideo = await createSupabaseVideo({
4330 title: first.title || "Vídeo de Mundo Infinito",
4331 description: `Vídeo con ${discoveryDraft.length} detalles explorados en Mundo Infinito.`,
4332 url: link
4333 });
4334
4335 const createdPlaces = [];
4336 for (const item of discoveryDraft) {
4337 const newPlace = await createOrGetPlace({
4338 name: item.title,
4339 zone: item.placeText,
4340 category: item.category,
4341 description: item.description || "Descubrimiento añadido por un Explorador.",
4342 lat: item.lat,
4343 lng: item.lng
4344 });
4345 const newDiscovery = await createSupabaseDiscovery({
4346 title: item.title,
4347 description: item.description || "",
4348 category: item.category,
4349 placeId: newPlace.id,
4350 videoId: sharedVideo?.id || null,
4351 timestampStart: item.timestampStart || 0,
4352 timestampEnd: item.timestampEnd
4353 });
4354 createdPlaces.push(newPlace);
4355 if (!places.some(p => p.id === newPlace.id)) places.push(newPlace);
4356 discoveries.push(newDiscovery);
4357 }
4358
4359 if (sharedVideo && !videos.some(v => v.id === sharedVideo.id)) videos.push(sharedVideo);
4360 renderMarkers();
4361 closeAddDiscovery();
4362 showToast(`✓ ${discoveryDraft.length} detalles guardados para todos`);
4363
4364 if (createdPlaces[0]) {
4365 map.setView([createdPlaces[0].lat, createdPlaces[0].lng], 14);
4366 window.setTimeout(() => openPlace(createdPlaces[0].id), 250);
4367 }
4368 } catch (error) {
4369 console.error("Error guardando el vídeo y sus detalles:", error);
4370 showToast("No se pudo guardar en la base compartida");
4371 } finally {
4372 if (saveAllDiscoveriesButton) {
4373 saveAllDiscoveriesButton.disabled = false;
4374 saveAllDiscoveriesButton.textContent = original;
4375 }
4376 }
4377 });
4378
4379 // =========================================================
4380 // APP.JS v0.5.0 · BLOQUE 5 FINAL
4381 // Paneles + carga inicial + Supabase + arranque
4382 // =========================================================
4383
4384 // =========================================================
4385 // PANEL GENERAL
4386 // =========================================================
4387
4388 function openContent(
4389 title,
4390 html
4391 ) {
4392
4393 closePlace();
4394
4395 contentPanelTitle.textContent =
4396 title;
4397
4398 contentPanelBody.innerHTML =
4399 html;
4400
4401 contentPanel.classList.add(
4402 "open"
4403 );
4404
4405 contentPanel.setAttribute(
4406 "aria-hidden",
4407 "false"
4408 );
4409 }
4410
4411 function closeContent() {
4412
4413 contentPanel.classList.remove(
4414 "open"
4415 );
4416
4417 contentPanel.setAttribute(
4418 "aria-hidden",
4419 "true"
4420 );
4421 }
4422
4423 closeContentPanel.addEventListener(
4424 "click",
4425 closeContent
4426 );
4427
4428 // =========================================================
4429 // PANEL TODOS LOS VÍDEOS
4430 // =========================================================
4431
4432 function renderAllVideosPanel() {
4433
4434 if (
4435 videos.length === 0
4436 ) {
4437
4438 openContent(
4439 "Vídeos",
4440 `
4441 <div class="empty-state">
4442
4443 <span></span>
4444
4445 <strong>
4446 No hay vídeos todavía
4447 </strong>
4448
4449 <p>
4450 Los vídeos guardados aparecerán aquí.
4451 </p>
4452
4453 </div>
4454 `
4455 );
4456
4457 return;
4458 }
4459
4460 const html =
4461 videos
4462 .map(
4463 video => `
4464 <button
4465 class="content-card"
4466 type="button"
4467 data-global-video="${escapeHTML(video.id)}"
4468 >
4469
4470 <div class="content-card-icon">
4471 
4472 </div>
4473
4474 <div class="content-card-text">
4475
4476 <strong>
4477 ${escapeHTML(video.title)}
4478 </strong>
4479
4480 <p>
4481 ${
4482 escapeHTML(
4483 video.place ||
4484 video.type ||
4485 "Brasil"
4486 )
4487 }
4488 </p>
4489
4490 </div>
4491
4492 </button>
4493 `
4494 )
4495 .join("");
4496
4497 openContent(
4498 "Vídeos",
4499 html
4500 );
4501
4502 contentPanelBody
4503 .querySelectorAll(
4504 "[data-global-video]"
4505 )
4506 .forEach(
4507 button => {
4508
4509 button.addEventListener(
4510 "click",
4511 () => {
4512
4513 const video =
4514 videos.find(
4515 item =>
4516 item.id ===
4517 button.dataset.globalVideo
4518 );
4519
4520 if (video) {
4521
4522 openVideo(
4523 video,
4524 0
4525 );
4526 }
4527 }
4528 );
4529 }
4530 );
4531 }
4532
4533 // =========================================================
4534 // PANEL GASTRONOMÍA
4535 // =========================================================
4536
4537 function renderFoodPanel() {
4538
4539 const foodPlaces =
4540 places.filter(
4541 place =>
4542 [
4543 "Restaurante",
4544 "Gastronomía"
4545 ].includes(
4546 place.category
4547 )
4548 );
4549
4550 if (
4551 foodPlaces.length === 0
4552 ) {
4553
4554 openContent(
4555 "Gastronomía",
4556 `
4557 <div class="empty-state">
4558
4559 <span></span>
4560
4561 <strong>
4562 Todavía no hay restaurantes
4563 </strong>
4564
4565 <p>
4566 Cuando añadáis restaurantes aparecerán aquí automáticamente.
4567 </p>
4568
4569 </div>
4570 `
4571 );
4572
4573 return;
4574 }
4575
4576 const html =
4577 foodPlaces
4578 .map(
4579 place => `
4580 <button
4581 class="content-card"
4582 type="button"
4583 data-food-place="${escapeHTML(place.id)}"
4584 >
4585
4586 <div class="content-card-icon">
4587 ${
4588 categoryIcons[
4589 place.category
4590 ] || ""
4591 }
4592 </div>
4593
4594 <div class="content-card-text">
4595
4596 <strong>
4597 ${escapeHTML(place.name)}
4598 </strong>
4599
4600 <p>
4601 ${
4602 escapeHTML(
4603 place.zone ||
4604 place.city ||
4605 "Brasil"
4606 )
4607 }
4608 </p>
4609
4610 </div>
4611
4612 </button>
4613 `
4614 )
4615 .join("");
4616
4617 openContent(
4618 "Gastronomía",
4619 html
4620 );
4621
4622 contentPanelBody
4623 .querySelectorAll(
4624 "[data-food-place]"
4625 )
4626 .forEach(
4627 button => {
4628
4629 button.addEventListener(
4630 "click",
4631 () => {
4632
4633 const place =
4634 getPlaceById(
4635 button.dataset.foodPlace
4636 );
4637
4638 if (!place) {
4639 return;
4640 }
4641
4642 closeContent();
4643
4644 map.setView(
4645 [
4646 place.lat,
4647 place.lng
4648 ],
4649 16
4650 );
4651
4652 window.setTimeout(
4653 () => {
4654
4655 openPlace(
4656 place.id
4657 );
4658 },
4659 250
4660 );
4661 }
4662 );
4663 }
4664 );
4665 }
4666
4667 // =========================================================
4668 // PANEL MI VIAJE
4669 // =========================================================
4670
4671 function renderTripPanel() {
4672
4673 openContent(
4674 "Mi viaje",
4675 `
4676 <div class="empty-state">
4677
4678 <span></span>
4679
4680 <strong>
4681 Planificador en preparación
4682 </strong>
4683
4684 <p>
4685 Aquí organizaremos los descubrimientos por días cuando avancemos con la siguiente fase.
4686 </p>
4687
4688 </div>
4689 `
4690 );
4691 }
4692
4693 // =========================================================
4694 // PANEL GUARDADOS
4695 // =========================================================
4696
4697 function renderSavedPanel() {
4698
4699 const savedIds =
4700 getSavedPlaces();
4701
4702 const savedPlaces =
4703 places.filter(
4704 place =>
4705 savedIds.includes(
4706 place.id
4707 )
4708 );
4709
4710 if (
4711 savedPlaces.length === 0
4712 ) {
4713
4714 openContent(
4715 "Guardados",
4716 `
4717 <div class="empty-state">
4718
4719 <span>❤</span>
4720
4721 <strong>
4722 Todavía no tienes lugares guardados
4723 </strong>
4724
4725 <p>
4726 Pulsa Guardar dentro de cualquier ficha.
4727 </p>
4728
4729 </div>
4730 `
4731 );
4732
4733 return;
4734 }
4735
4736 const html =
4737 savedPlaces
4738 .map(
4739 place => `
4740 <button
4741 class="content-card"
4742 type="button"
4743 data-saved-place="${escapeHTML(place.id)}"
4744 >
4745
4746 <div class="content-card-icon">
4747 ${
4748 categoryIcons[
4749 place.category
4750 ] || ""
4751 }
4752 </div>
4753
4754 <div class="content-card-text">
4755
4756 <strong>
4757 ${escapeHTML(place.name)}
4758 </strong>
4759
4760 <p>
4761 ${
4762 escapeHTML(
4763 [
4764 place.zone,
4765 place.category
4766 ]
4767 .filter(Boolean)
4768 .join(" · ")
4769 )
4770 }
4771 </p>
4772
4773 </div>
4774
4775 </button>
4776 `
4777 )
4778 .join("");
4779
4780 openContent(
4781 "Guardados",
4782 html
4783 );
4784
4785 contentPanelBody
4786 .querySelectorAll(
4787 "[data-saved-place]"
4788 )
4789 .forEach(
4790 button => {
4791
4792 button.addEventListener(
4793 "click",
4794 () => {
4795
4796 const place =
4797 getPlaceById(
4798 button.dataset.savedPlace
4799 );
4800
4801 if (!place) {
4802 return;
4803 }
4804
4805 closeContent();
4806
4807 map.setView(
4808 [
4809 place.lat,
4810 place.lng
4811 ],
4812 16
4813 );
4814
4815 window.setTimeout(
4816 () => {
4817
4818 openPlace(
4819 place.id
4820 );
4821 },
4822 250
4823 );
4824 }
4825 );
4826 }
4827 );
4828 }
4829
4830 // =========================================================
4831 // MENÚ INFERIOR
4832 // =========================================================
4833
4834 function setActiveNav(
4835 activeButton
4836 ) {
4837
4838 navButtons.forEach(
4839 button => {
4840
4841 button.classList.remove(
4842 "active"
4843 );
4844 }
4845 );
4846
4847 activeButton.classList.add(
4848 "active"
4849 );
4850 }
4851
4852 navButtons.forEach(
4853 button => {
4854
4855 button.addEventListener(
4856 "click",
4857 () => {
4858
4859 setActiveNav(
4860 button
4861 );
4862
4863 const section =
4864 button.dataset.section;
4865
4866 if (
4867 section ===
4868 "explorar"
4869 ) {
4870
4871 closeContent();
4872 closePlace();
4873
4874 map.setView(
4875 CONFIG.center,
4876 CONFIG.zoom
4877 );
4878
4879 return;
4880 }
4881
4882 if (
4883 section ===
4884 "descubrimientos"
4885 ) {
4886
4887 renderAllVideosPanel();
4888
4889 return;
4890 }
4891
4892 if (
4893 section ===
4894 "gastronomia"
4895 ) {
4896
4897 renderFoodPanel();
4898
4899 return;
4900 }
4901
4902 if (
4903 section ===
4904 "viaje"
4905 ) {
4906
4907 renderTripPanel();
4908
4909 return;
4910 }
4911
4912 if (
4913 section ===
4914 "guardados"
4915 ) {
4916
4917 renderSavedPanel();
4918 }
4919 }
4920 );
4921 }
4922 );
4923
4924 // =========================================================
4925 // CERRAR AL PULSAR ESCAPE
4926 // =========================================================
4927
4928 document.addEventListener(
4929 "keydown",
4930 event => {
4931
4932 if (
4933 event.key !==
4934 "Escape"
4935 ) {
4936
4937 return;
4938 }
4939
4940 closeVideo();
4941 closeAddDiscovery();
4942 closePlace();
4943 closeContent();
4944 }
4945 );
4946
4947 // =========================================================
4948 // CLIC EN MAPA
4949 // =========================================================
4950
4951 map.on(
4952 "click",
4953 () => {
4954
4955 closePlace();
4956 closeContent();
4957 }
4958 );
4959
4960 // =========================================================
4961 // DESCUBRIMIENTOS LOCALES ANTIGUOS
4962 // Compatibilidad con lo guardado antes de Supabase.
4963 // =========================================================
4964
4965 function loadOldLocalPlaces() {
4966
4967 const oldDiscoveries =
4968 loadJSON(
4969 CONFIG.storage.discoveries,
4970 []
4971 );
4972
4973 if (
4974 !Array.isArray(
4975 oldDiscoveries
4976 )
4977 ) {
4978
4979 return [];
4980 }
4981
4982 return oldDiscoveries
4983 .filter(
4984 item =>
4985 Number.isFinite(
4986 Number(
4987 item.lat
4988 )
4989 ) &&
4990 Number.isFinite(
4991 Number(
4992 item.lng
4993 )
4994 )
4995 )
4996 .map(
4997 item =>
4998 normalizePlace({
4999
5000 id:
5001 item.id ||
5002 `local-${slug(
5003 item.name ||
5004 item.title ||
5005 "descubrimiento"
5006 )}`,
5007
5008 slug:
5009 slug(
5010 item.name ||
5011 item.title ||
5012 ""
5013 ),
5014
5015 name:
5016 item.name ||
5017 item.title ||
5018 "Descubrimiento",
5019
5020 zone:
5021 item.zone ||
5022 item.place ||
5023 CONFIG.city,
5024
5025 city:
5026 CONFIG.city,
5027
5028 country:
5029 CONFIG.country,
5030
5031 category:
5032 item.category ||
5033 "Lugar",
5034
5035 description:
5036 item.description ||
5037 item.comment ||
5038 "Descubrimiento guardado anteriormente.",
5039
5040 lat:
5041 Number(
5042 item.lat
5043 ),
5044
5045 lng:
5046 Number(
5047 item.lng
5048 ),
5049
5050 source:
5051 "local"
5052 })
5053 );
5054 }
5055
5056 // =========================================================
5057 // VÍDEOS LOCALES ANTIGUOS
5058 // =========================================================
5059
5060 function loadOldLocalVideos() {
5061
5062 const oldDiscoveries =
5063 loadJSON(
5064 CONFIG.storage.discoveries,
5065 []
5066 );
5067
5068 if (
5069 !Array.isArray(
5070 oldDiscoveries
5071 )
5072 ) {
5073
5074 return [];
5075 }
5076
5077 return oldDiscoveries
5078 .filter(
5079 item =>
5080 item.link
5081 )
5082 .map(
5083 item =>
5084 normalizeVideo({
5085
5086 id:
5087 `local-video-${item.id}`,
5088
5089 placeId:
5090 item.id,
5091
5092 place:
5093 item.name ||
5094 item.title ||
5095 "",
5096
5097 title:
5098 item.title ||
5099 item.name ||
5100 "Vídeo",
5101
5102 description:
5103 item.comment ||
5104 item.description ||
5105 "",
5106
5107 type:
5108 String(
5109 item.link
5110 ).includes(
5111 "instagram"
5112 )
5113 ? "Instagram"
5114 : "Vídeo",
5115
5116 url:
5117 item.link,
5118
5119 source:
5120 "local"
5121 })
5122 );
5123 }
5124
5125 // =========================================================
5126 // CARGAR TODA LA INFORMACIÓN
5127 // =========================================================
5128
5129 async function loadAppData() {
5130
5131 /*
5132 * 1. Datos estáticos actuales
5133 */
5134
5135 const [
5136 placesJSON,
5137 videosJSON
5138 ] =
5139 await Promise.all([
5140
5141 fetchJSON(
5142 "data/places.json",
5143 []
5144 ),
5145
5146 fetchJSON(
5147 "data/videos.json",
5148 []
5149 )
5150
5151 ]);
5152
5153 /*
5154 * 2. Datos locales antiguos
5155 */
5156
5157 const oldLocalPlaces =
5158 loadOldLocalPlaces();
5159
5160 const oldLocalVideos =
5161 loadOldLocalVideos();
5162
5163 /*
5164 * 3. Comprobamos Supabase
5165 */
5166
5167 await testSupabaseConnection();
5168
5169 let cloudPlaces = [];
5170 let cloudVideos = [];
5171 let cloudDiscoveries = [];
5172
5173 if (
5174 supabaseOnline
5175 ) {
5176
5177 [
5178 cloudPlaces,
5179 cloudVideos,
5180 cloudDiscoveries
5181 ] =
5182 await Promise.all([
5183
5184 loadSupabasePlaces(),
5185
5186 loadSupabaseVideos(),
5187
5188 loadSupabaseDiscoveries()
5189
5190 ]);
5191 }
5192
5193 /*
5194 * 4. Mezclamos lugares
5195 */
5196
5197 places =
5198 mergePlaces(
5199 placesJSON,
5200 oldLocalPlaces,
5201 cloudPlaces
5202 );
5203
5204 /*
5205 * 5. Mezclamos vídeos
5206 */
5207
5208 const videoMap =
5209 new Map();
5210
5211 [
5212 ...(Array.isArray(videosJSON)
5213 ? videosJSON
5214 : []),
5215
5216 ...oldLocalVideos,
5217
5218 ...cloudVideos
5219
5220 ]
5221 .map(
5222 normalizeVideo
5223 )
5224 .forEach(
5225 video => {
5226
5227 const dedupeKey =
5228 video.sourceUrl ||
5229 video.url ||
5230 video.id;
5231
5232 if (
5233 !videoMap.has(
5234 dedupeKey
5235 )
5236 ) {
5237
5238 videoMap.set(
5239 dedupeKey,
5240 video
5241 );
5242
5243 return;
5244 }
5245
5246 const existing =
5247 videoMap.get(
5248 dedupeKey
5249 );
5250
5251 if (
5252 video.source ===
5253 "supabase"
5254 ) {
5255
5256 videoMap.set(
5257 dedupeKey,
5258 {
5259 ...existing,
5260 ...video
5261 }
5262 );
5263 }
5264 }
5265 );
5266
5267 videos =
5268 Array.from(
5269 videoMap.values()
5270 );
5271
5272 /*
5273 * 6. Descubrimientos compartidos
5274 */
5275
5276 discoveries =
5277 cloudDiscoveries;
5278
5279 /*
5280 * 7. Dibujamos
5281 */
5282
5283 renderMarkers();
5284
5285 console.log(
5286 ` ${places.length} lugares cargados`
5287 );
5288
5289 console.log(
5290 ` ${videos.length} vídeos cargados`
5291 );
5292
5293 console.log(
5294 ` ${discoveries.length} descubrimientos compartidos`
5295 );
5296 }
5297
5298 // =========================================================
5299 // ACTUALIZACIÓN EN TIEMPO REAL
5300 // Si otra persona añade un lugar, podemos refrescar
5301 // automáticamente la información.
5302 // =========================================================
5303
5304 function startRealtimeUpdates() {
5305
5306 if (
5307 !supabaseClient ||
5308 !supabaseOnline
5309 ) {
5310
5311 return;
5312 }
5313
5314 supabaseClient
5315 .channel(
5316 "mundo-infinito-live"
5317 )
5318 .on(
5319 "postgres_changes",
5320 {
5321 event:
5322 "*",
5323
5324 schema:
5325 "public",
5326
5327 table:
5328 "places"
5329 },
5330 async () => {
5331
5332 await reloadSharedData();
5333 }
5334 )
5335 .on(
5336 "postgres_changes",
5337 {
5338 event:
5339 "*",
5340
5341 schema:
5342 "public",
5343
5344 table:
5345 "videos"
5346 },
5347 async () => {
5348
5349 await reloadSharedData();
5350 }
5351 )
5352 .on(
5353 "postgres_changes",
5354 {
5355 event:
5356 "*",
5357
5358 schema:
5359 "public",
5360
5361 table:
5362 "discoveries"
5363 },
5364 async () => {
5365
5366 await reloadSharedData();
5367 }
5368 )
5369 .subscribe();
5370 }
5371
5372 // =========================================================
5373 // RECARGAR SOLO DATOS COMPARTIDOS
5374 // =========================================================
5375
5376 async function reloadSharedData() {
5377
5378 if (
5379 !supabaseClient ||
5380 !supabaseOnline
5381 ) {
5382
5383 return;
5384 }
5385
5386 try {
5387
5388 const [
5389 cloudPlaces,
5390 cloudVideos,
5391 cloudDiscoveries
5392 ] =
5393 await Promise.all([
5394
5395 loadSupabasePlaces(),
5396
5397 loadSupabaseVideos(),
5398
5399 loadSupabaseDiscoveries()
5400
5401 ]);
5402
5403 /*
5404 * Añadimos/actualizamos lugares
5405 */
5406
5407 cloudPlaces.forEach(
5408 cloudPlace => {
5409
5410 const index =
5411 places.findIndex(
5412 place =>
5413 place.id ===
5414 cloudPlace.id ||
5415 place.slug ===
5416 cloudPlace.slug
5417 );
5418
5419 if (
5420 index >= 0
5421 ) {
5422
5423 places[index] = {
5424 ...places[index],
5425 ...cloudPlace
5426 };
5427
5428 } else {
5429
5430 places.push(
5431 cloudPlace
5432 );
5433 }
5434 }
5435 );
5436
5437 /*
5438 * Vídeos
5439 */
5440
5441 cloudVideos.forEach(
5442 cloudVideo => {
5443
5444 const index =
5445 videos.findIndex(
5446 video =>
5447 video.id ===
5448 cloudVideo.id ||
5449 (
5450 cloudVideo.sourceUrl &&
5451 video.sourceUrl ===
5452 cloudVideo.sourceUrl
5453 )
5454 );
5455
5456 if (
5457 index >= 0
5458 ) {
5459
5460 videos[index] = {
5461 ...videos[index],
5462 ...cloudVideo
5463 };
5464
5465 } else {
5466
5467 videos.push(
5468 cloudVideo
5469 );
5470 }
5471 }
5472 );
5473
5474 discoveries =
5475 cloudDiscoveries;
5476
5477 renderMarkers();
5478
5479 /*
5480 * Si tenemos una ficha abierta,
5481 * actualizamos sus vídeos también.
5482 */
5483
5484 if (
5485 selectedPlace
5486 ) {
5487
5488 const refreshed =
5489 places.find(
5490 place =>
5491 place.id ===
5492 selectedPlace.id ||
5493 place.slug ===
5494 selectedPlace.slug
5495 );
5496
5497 if (
5498 refreshed
5499 ) {
5500
5501 selectedPlace =
5502 refreshed;
5503
5504 renderPlaceVideos(
5505 refreshed
5506 );
5507 }
5508 }
5509
5510 console.log(
5511 " Mundo Infinito actualizado"
5512 );
5513
5514 } catch (error) {
5515
5516 console.error(
5517 "Error actualizando datos compartidos:",
5518 error
5519 );
5520 }
5521 }
5522
5523 // =========================================================
5524 // REDIMENSIONAR MAPA
5525 // =========================================================
5526
5527 window.addEventListener(
5528 "resize",
5529 () => {
5530
5531 window.setTimeout(
5532 () => {
5533
5534 map.invalidateSize();
5535 },
5536 120
5537 );
5538 }
5539 );
5540
5541 // =========================================================
5542 // CONTROL GENERAL DE ERRORES
5543 // =========================================================
5544
5545 window.addEventListener(
5546 "error",
5547 event => {
5548
5549 console.error(
5550 "Mundo Infinito:",
5551 event.error ||
5552 event.message
5553 );
5554 }
5555 );
5556
5557 // =========================================================
5558 // INICIALIZACIÓN
5559 // =========================================================
5560
5561 async function init() {
5562
5563 console.log(
5564 " Iniciando Mundo Infinito v0.6.0"
5565 );
5566
5567 /*
5568 * Primero creamos el cliente Supabase.
5569 */
5570
5571 initializeSupabase();
5572
5573 /*
5574 * Después cargamos toda la información.
5575 */
5576
5577 await loadAppData();
5578
5579 map.invalidateSize();
5580
5581 /*
5582 * Activamos sincronización en tiempo real
5583 * solamente si la conexión funciona.
5584 */
5585
5586 if (
5587 supabaseOnline
5588 ) {
5589
5590 startRealtimeUpdates();
5591
5592 console.log(
5593 " Mundo Infinito conectado y compartido"
5594 );
5595
5596 } else {
5597
5598 console.log(
5599 " Mundo Infinito funcionando en modo local"
5600 );
5601 }
5602 }
5603
5604 // =========================================================
5605 // ARRANCAR
5606 // =========================================================
5607
5608 init();
5609
5610 // =========================================================
5611 // FIN · MUNDO INFINITO v0.6.0
5612 // ==========================
