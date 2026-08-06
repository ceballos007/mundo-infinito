// =========================================================
// MUNDO INFINITO · notes-explorer v0.1.0
// "Localiza tus notas"
// Módulo independiente: no modifica el explorador de vídeo.
// =========================================================
"use strict";
(() => {
const VERSION = "0.1.0";
// ---------------------------------------------------------
// COMPROBAR DEPENDENCIAS
// ---------------------------------------------------------
function appReady() {
return (
typeof supabaseClient !== "undefined" &&
typeof createOrGetPlace === "function" &&
typeof createSupabaseDiscovery === "function" &&
typeof renderMarkers === "function" &&
typeof map !== "undefined"
);
}
// ---------------------------------------------------------
// UTILIDADES
// ---------------------------------------------------------
function safe(value) {
if (typeof escapeHTML === "function") {
return escapeHTML(String(value ?? ""));
}
return String(value ?? "")
.replaceAll("&", "&amp;")
.replaceAll("<", "&lt;")
.replaceAll(">", "&gt;")
.replaceAll('"', "&quot;");
}
function normalizeText(value) {
return String(value || "")
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.toLowerCase()
.replace(/\s+/g, " ")
.trim();
}
function iconForCategory(category) {
if (typeof resolveCategoryIcon === "function") {
return resolveCategoryIcon(category);
}
const key = normalizeText(category);
const icons = {
lugar: "\u{1F4CD}",
restaurante: "\u{1F374}",
gastronomia: "\u{1F958}",
bar: "\u{1F379}",
"vida nocturna": "\u{1F379}",
playa: "\u{1F3D6}\u{FE0F}",
parque: "\u{1F33F}",
cultura: "\u{1F3A8}",
compras: "\u{1F6CD}\u{FE0F}",
transporte: "\u{1F695}",
mirador: "\u{1F304}",
consejo: "\u{1F4A1}"
};
return icons[key] || "\u{1F4CD}";
}
function toast(message) {
if (typeof showToast === "function") {
showToast(message);
} else {
console.log(message);
}
}
// ---------------------------------------------------------
// INYECTAR INTERFAZ
// ---------------------------------------------------------
function injectStyles() {
if (document.getElementById("notesExplorerStyles")) {
return;
}
const style = document.createElement("style");
style.id = "notesExplorerStyles";
style.textContent = `
.notes-fab {
position: absolute;
right: 20px;
bottom: calc(var(--nav-height) + 94px + env(safe-area-inset-bottom));
z-index: 549;
display: flex;
align-items: center;
gap: 9px;
min-height: 46px;
padding: 0 16px;
border: 0;
border-radius: 999px;
color: #fff;
background: linear-gradient(145deg, #174f77, #2389a6);
box-shadow: 0 14px 34px rgba(15, 64, 92, .24);
font: inherit;
font-size: 13px;
font-weight: 800;
cursor: pointer;
}
.notes-fab span {
font-size: 18px;
}
.notes-backdrop {
position: fixed;
inset: 0;
z-index: 1600;
display: none;
align-items: center;
justify-content: center;
padding: 20px;
background: rgba(5, 24, 18, .52);
backdrop-filter: blur(8px);
}
.notes-backdrop.open {
display: flex;
}
.notes-card {
position: relative;
width: min(780px, 96vw);
max-height: min(850px, 92dvh);
overflow-y: auto;
padding: 28px;
border: 1px solid rgba(16, 33, 28, .10);
border-radius: 28px;
background: #fff;
box-shadow: 0 30px 80px rgba(5, 24, 18, .25);
}
.notes-close {
position: absolute;
top: 18px;
right: 18px;
display: grid;
width: 38px;
height: 38px;
place-items: center;
border: 0;
border-radius: 50%;
background: #eef2f0;
color: #31423c;
font-size: 23px;
cursor: pointer;
}
.notes-eyebrow {
display: block;
margin-bottom: 7px;
color: #0d6b55;
font-size: 11px;
font-weight: 800;
letter-spacing: .10em;
text-transform: uppercase;
}
.notes-card h2 {
margin: 0 50px 7px 0;
color: #10211c;
font-size: 27px;
}
.notes-intro {
margin: 0 0 20px;
color: #71807a;
line-height: 1.5;
}
.notes-textarea {
width: 100%;
min-height: 210px;
resize: vertical;
padding: 17px;
border: 1px solid rgba(16, 33, 28, .12);
border-radius: 18px;
outline: 0;
background: #f7f9f8;
color: #10211c;
font: inherit;
line-height: 1.55;
}
.notes-textarea:focus {
border-color: rgba(13, 107, 85, .35);
background: #fff;
box-shadow: 0 0 0 4px rgba(13, 107, 85, .08);
}
.notes-actions {
display: flex;
gap: 10px;
margin-top: 14px;
}
.notes-primary,
.notes-secondary {
min-height: 46px;
padding: 0 17px;
border-radius: 14px;
font: inherit;
font-weight: 800;
cursor: pointer;
}
.notes-primary {
flex: 1;
border: 0;
color: #fff;
background: #0d6b55;
}
.notes-primary:disabled {
opacity: .55;
cursor: wait;
}
.notes-secondary {
border: 1px solid rgba(16, 33, 28, .10);
color: #10211c;
background: #f4f6f5;
}
.notes-status {
display: none;
margin-top: 22px;
padding: 16px;
border-radius: 18px;
background: #eef8f4;
}
.notes-status.active {
display: block;
}
.notes-spinner {
display: inline-block;
margin-right: 8px;
animation: notesSpin 1s linear infinite;
}
@keyframes notesSpin {
to { transform: rotate(360deg); }
}
.notes-results {
display: grid;
gap: 11px;
margin-top: 20px;
}
.notes-result {
display: grid;
grid-template-columns: 44px 1fr auto;
gap: 12px;
align-items: start;
padding: 14px;
border: 1px solid rgba(16, 33, 28, .09);
border-radius: 17px;
background: #fff;
}
.notes-result-icon {
display: grid;
width: 42px;
height: 42px;
place-items: center;
border-radius: 13px;
background: #e5f3ee;
font-size: 20px;
}
.notes-result strong {
display: block;
margin-bottom: 3px;
color: #10211c;
}
.notes-result small,
.notes-result p {
color: #71807a;
}
.notes-result p {
margin: 6px 0 0;
font-size: 13px;
line-height: 1.4;
}
.notes-badge {
padding: 5px 8px;
border-radius: 999px;
font-size: 10px;
font-weight: 800;
white-space: nowrap;
}
.notes-badge.ok {
color: #0d6b55;
background: #e5f3ee;
}
.notes-badge.pending {
color: #865b1c;
background: #fff3d8;
}
.notes-badge.fail {
color: #a63f3f;
background: #fdeaea;
}
.notes-summary {
margin-top: 18px;
padding: 14px 16px;
border-radius: 16px;
background: #f7f9f8;
color: #52615c;
font-size: 13px;
}
.notes-save-row {
display: none;
margin-top: 15px;
}
.notes-save-row.active {
display: flex;
}
@media (max-width: 820px) {
.notes-fab {
right: 14px;
bottom: calc(var(--nav-height) + 88px + env(safe-area-inset-bottom));
max-width: 170px;
padding: 0 12px;
}
.notes-card {
width: 100%;
padding: 22px 17px calc(24px + env(safe-area-inset-bottom));
border-radius: 24px;
}
.notes-result {
grid-template-columns: 40px 1fr;
}
.notes-badge {
grid-column: 2;
justify-self: start;
}
}
`;
document.head.appendChild(style);
}
function injectUI() {
if (document.getElementById("openNotesExplorer")) {
return;
}
const button = document.createElement("button");
button.id = "openNotesExplorer";
button.className = "notes-fab";
button.type = "button";
button.innerHTML = `<span>&#128221;</span> Localiza tus notas`;
button.setAttribute("aria-label", "Localiza tus notas");
const mapContainer =
document.querySelector(".app-shell") ||
document.body;
mapContainer.appendChild(button);
const modal = document.createElement("div");
modal.id = "notesExplorerModal";
modal.className = "notes-backdrop";
modal.setAttribute("aria-hidden", "true");
modal.innerHTML = `
<section
class="notes-card"
role="dialog"
aria-modal="true"
aria-labelledby="notesExplorerTitle"
>
<button
id="closeNotesExplorer"
class="notes-close"
type="button"
aria-label="Cerrar"
>×</button>
<span class="notes-eyebrow">
Mundo Infinito
</span>
<h2 id="notesExplorerTitle">
Localiza tus notas
</h2>
<p class="notes-intro">
Pega cualquier texto sobre Brasil. La IA intentará separar lugares,
restaurantes, playas, compras, consejos y otros descubrimientos.
Solo se añadirán al mapa los lugares que se puedan identificar y
localizar con suficiente seguridad.
</p>
<textarea
id="notesExplorerText"
class="notes-textarea"
placeholder="Ej.: En SAARA merece la pena ir por la mañana. En Belmonte Leblon las caipirinhas están muy bien. Pura Brasa Ipanema tiene ambiente por la noche..."
></textarea>
<div class="notes-actions">
<button
id="analyzeNotesButton"
class="notes-primary"
type="button"
>
&#10024; Analizar información
</button>
<button
id="clearNotesButton"
class="notes-secondary"
type="button"
>
Limpiar
</button>
</div>
<div
id="notesExplorerStatus"
class="notes-status"
aria-live="polite"
></div>
<div
id="notesExplorerResults"
class="notes-results"
></div>
<div
id="notesExplorerSummary"
class="notes-summary"
hidden
></div>
<div
id="notesSaveRow"
class="notes-save-row"
>
<button
id="saveNotesToMap"
class="notes-primary"
type="button"
>
Añadir al mapa
</button>
</div>
</section>
`;
document.body.appendChild(modal);
}
injectStyles();
injectUI();
// ---------------------------------------------------------
// DOM
// ---------------------------------------------------------
const openButton =
document.getElementById("openNotesExplorer");
const modal =
document.getElementById("notesExplorerModal");
const closeButton =
document.getElementById("closeNotesExplorer");
const textarea =
document.getElementById("notesExplorerText");
const analyzeButton =
document.getElementById("analyzeNotesButton");
const clearButton =
document.getElementById("clearNotesButton");
const statusBox =
document.getElementById("notesExplorerStatus");
const resultsBox =
document.getElementById("notesExplorerResults");
const summaryBox =
document.getElementById("notesExplorerSummary");
const saveRow =
document.getElementById("notesSaveRow");
const saveButton =
document.getElementById("saveNotesToMap");
let results = [];
let saving = false;
let runId = 0;
// ---------------------------------------------------------
// MODAL
// ---------------------------------------------------------
function openModal() {
modal.classList.add("open");
modal.setAttribute("aria-hidden", "false");
window.setTimeout(
() => textarea.focus(),
100
);
}
function closeModal() {
runId += 1;
modal.classList.remove("open");
modal.setAttribute("aria-hidden", "true");
}
function resetResults() {
results = [];
resultsBox.innerHTML = "";
statusBox.classList.remove("active");
statusBox.innerHTML = "";
summaryBox.hidden = true;
summaryBox.innerHTML = "";
saveRow.classList.remove("active");
}
openButton.addEventListener("click", openModal);
closeButton.addEventListener("click", closeModal);
modal.addEventListener("click", event => {
if (event.target === modal) {
closeModal();
}
});
document.addEventListener("keydown", event => {
if (
event.key === "Escape" &&
modal.classList.contains("open")
) {
closeModal();
}
});
clearButton.addEventListener("click", () => {
textarea.value = "";
resetResults();
textarea.focus();
});
// ---------------------------------------------------------
// IA
// ---------------------------------------------------------
async function analyzeTextWithAI(text) {
if (
typeof supabaseClient === "undefined" ||
!supabaseClient
) {
throw new Error("Supabase no está disponible.");
}
const { data, error } =
await supabaseClient.functions.invoke(
"analyze-notes",
{
body: {
text,
country: "Brasil"
}
}
);
if (error) {
throw error;
}
if (!data?.success) {
throw new Error(
data?.error ||
"No se pudieron analizar las notas."
);
}
return Array.isArray(data.details)
? data.details
: [];
}
// ---------------------------------------------------------
// GEOLOCALIZACIÓN
// ---------------------------------------------------------
async function geocodeDetail(detail) {
const name =
String(
detail.placeName ||
detail.name ||
detail.title ||
""
).trim();
if (!name) {
return {
...detail,
status: "failed",
reason:
detail.reason ||
"La IA no ha podido identificar un lugar concreto."
};
}
try {
const { data, error } =
await supabaseClient.functions.invoke(
"geocode-place",
{
body: {
name,
zone:
detail.zone ||
detail.neighborhood ||
"",
city:
detail.city ||
"",
state:
detail.state ||
"",
country:
"Brasil"
}
}
);
if (error) {
throw error;
}
if (
data?.found &&
Number.isFinite(Number(data.lat)) &&
Number.isFinite(Number(data.lng)) &&
Number(data.confidence ?? 0) >= 0.55
) {
return {
...detail,
placeName: name,
lat: Number(data.lat),
lng: Number(data.lng),
geocodeConfidence:
Number(data.confidence ?? 0),
matchedName:
data.matchedName ||
data.displayName ||
"",
status: "ready"
};
}
return {
...detail,
placeName: name,
status: "failed",
reason:
"No he podido localizar este lugar con suficiente seguridad."
};
} catch (error) {
console.warn(
"Localiza tus notas · error geolocalizando:",
name,
error
);
return {
...detail,
placeName: name,
status: "failed",
reason:
"No se ha podido comprobar la ubicación."
};
}
}
// ---------------------------------------------------------
// AGRUPAR INFORMACIÓN DEL MISMO LUGAR
// ---------------------------------------------------------
function groupByPlace(items) {
const grouped = new Map();
items.forEach(item => {
const key =
normalizeText(
[
item.placeName,
item.city,
item.state
].join("|")
);
if (!key) {
return;
}
if (!grouped.has(key)) {
grouped.set(key, {
...item,
notes: []
});
}
const target = grouped.get(key);
const note =
String(
item.detail ||
item.description ||
item.note ||
""
).trim();
if (
note &&
!target.notes.includes(note)
) {
target.notes.push(note);
}
if (
item.status === "ready"
) {
target.status = "ready";
target.lat = item.lat;
target.lng = item.lng;
target.geocodeConfidence =
item.geocodeConfidence;
}
});
return Array.from(grouped.values());
}
// ---------------------------------------------------------
// RENDER
// ---------------------------------------------------------
function renderResults() {
const ready =
results.filter(
item => item.status === "ready"
);
const failed =
results.filter(
item => item.status !== "ready"
);
resultsBox.innerHTML =
results
.map(item => {
const ok =
item.status === "ready";
return `
<article class="notes-result">
<div class="notes-result-icon">
${
ok
? iconForCategory(item.category)
: "&#9888;&#65039;"
}
</div>
<div>
<strong>
${
safe(
item.placeName ||
item.title ||
"Información sin lugar"
)
}
</strong>
<small>
${
safe(
[
item.zone,
item.city,
item.state,
item.category
]
.filter(Boolean)
.join(" · ")
)
}
</small>
${
Array.isArray(item.notes) &&
item.notes.length
? `
<p>
${
item.notes
.map(note => `• ${safe(note)}`)
.join("<br>")
}
</p>
`
: item.reason
? `<p>${safe(item.reason)}</p>`
: ""
}
</div>
<span
class="notes-badge ${
ok
? "ok"
: "fail"
}"
>
${
ok
? "Localizado"
: "No se añadirá"
}
</span>
</article>
`;
})
.join("");
summaryBox.hidden = false;
summaryBox.innerHTML =
ready.length === 0
? `
No he podido identificar y localizar ningún lugar
con suficiente seguridad. No se añadirá nada al mapa.
`
: `
<b>${ready.length}</b>
${
ready.length === 1
? "lugar listo"
: "lugares listos"
}
para añadir al mapa
${
failed.length
? ` · ${failed.length} no se ${
failed.length === 1
? "añadirá"
: "añadirán"
}`
: ""
}.
`;
if (ready.length > 0) {
saveButton.textContent =
ready.length === 1
? "Añadir 1 lugar al mapa"
: `Añadir ${ready.length} lugares al mapa`;
saveRow.classList.add("active");
} else {
saveRow.classList.remove("active");
}
}
// ---------------------------------------------------------
// ANALIZAR
// ---------------------------------------------------------
analyzeButton.addEventListener(
"click",
async () => {
const text =
textarea.value.trim();
if (text.length < 4) {
toast("Pega primero alguna información");
textarea.focus();
return;
}
if (!appReady()) {
toast("Mundo Infinito todavía no está listo");
return;
}
const currentRun =
++runId;
resetResults();
analyzeButton.disabled = true;
analyzeButton.textContent =
"Analizando...";
statusBox.classList.add("active");
statusBox.innerHTML =
`<span class="notes-spinner">&#129517;</span>
Analizando tus notas, identificando lugares y comprobando ubicaciones...`;
try {
const aiDetails =
await analyzeTextWithAI(text);
if (currentRun !== runId) {
return;
}
if (!aiDetails.length) {
results = [];
statusBox.classList.remove("active");
summaryBox.hidden = false;
summaryBox.textContent =
"No he encontrado información que pueda convertirse en lugares del mapa.";
return;
}
const geocoded = [];
for (const detail of aiDetails) {
if (currentRun !== runId) {
return;
}
if (
detail.localizable === false ||
!(
detail.placeName ||
detail.name ||
detail.title
)
) {
geocoded.push({
...detail,
status: "failed",
reason:
detail.reason ||
"No se ha identificado un lugar concreto."
});
continue;
}
statusBox.innerHTML =
`<span class="notes-spinner">&#129517;</span>
Localizando ${safe(
detail.placeName ||
detail.name ||
detail.title
)}...`;
geocoded.push(
await geocodeDetail(detail)
);
}
results =
groupByPlace(geocoded);
statusBox.classList.remove("active");
renderResults();
} catch (error) {
console.error(
"Localiza tus notas · error:",
error
);
statusBox.classList.remove("active");
summaryBox.hidden = false;
summaryBox.textContent =
"No se han podido analizar tus notas. No se ha añadido nada al mapa.";
toast("No se pudieron analizar las notas");
} finally {
analyzeButton.disabled = false;
analyzeButton.innerHTML =
"&#10024; Analizar información";
}
}
);
// ---------------------------------------------------------
// GUARDAR EN SUPABASE Y MAPA
// ---------------------------------------------------------
saveButton.addEventListener(
"click",
async () => {
if (saving) {
return;
}
const ready =
results.filter(
item => item.status === "ready"
);
if (!ready.length) {
toast("No hay lugares listos para añadir");
return;
}
saving = true;
saveButton.disabled = true;
saveButton.textContent = "Guardando...";
const createdPlaces = [];
let failures = 0;
try {
for (const item of ready) {
try {
const description =
Array.isArray(item.notes) &&
item.notes.length
? item.notes.join("\n")
: (
item.description ||
item.detail ||
"Lugar localizado desde tus notas."
);
const place =
await createOrGetPlace({
name:
item.placeName,
zone:
item.zone ||
item.neighborhood ||
"",
category:
item.category ||
"Lugar",
description,
lat:
item.lat,
lng:
item.lng
});
if (
!places.some(
existing =>
String(existing.id) ===
String(place.id)
)
) {
places.push(place);
}
const notes =
Array.isArray(item.notes) &&
item.notes.length
? item.notes
: [description];
for (const note of notes) {
const discovery =
await createSupabaseDiscovery({
title:
item.placeName,
description:
note,
category:
item.category ||
"Lugar",
placeId:
place.id,
videoId:
null,
timestampStart:
0,
timestampEnd:
null
});
if (
typeof discoveries !== "undefined" &&
Array.isArray(discoveries) &&
!discoveries.some(
existing =>
String(existing.id) ===
String(discovery.id)
)
) {
discoveries.push(discovery);
}
}
createdPlaces.push(place);
} catch (error) {
failures += 1;
console.warn(
"Localiza tus notas · no se pudo guardar:",
item.placeName,
error
);
}
}
renderMarkers();
if (
createdPlaces.length > 0
) {
const first =
createdPlaces[0];
if (
Number.isFinite(Number(first.lat)) &&
Number.isFinite(Number(first.lng))
) {
map.flyTo(
[
Number(first.lat),
Number(first.lng)
],
13,
{
duration: 1.1
}
);
}
}
const total =
createdPlaces.length;
if (total === 0) {
toast("No se ha podido añadir ningún lugar");
return;
}
toast(
failures
? `${total} lugares añadidos · ${failures} no se pudieron guardar`
: (
total === 1
? "1 lugar añadido al mapa"
: `${total} lugares añadidos al mapa`
)
);
closeModal();
textarea.value = "";
resetResults();
} finally {
saving = false;
saveButton.disabled = false;
}
}
);
console.log(
`\u{1F4DD} Mundo Infinito · Localiza tus notas v${VERSION} cargado`
);
})
