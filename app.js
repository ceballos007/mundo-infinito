// =======================================
// MUNDO INFINITO by Eric
// Beta 0.1
// =======================================

// Crear mapa centrado en Río de Janeiro
const map = L.map('map', {
    zoomControl: false
}).setView([-22.9068, -43.1729], 12);

// Capa OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

// Icono principal
const greenIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25,41],
    iconAnchor: [12,41],
    popupAnchor: [1,-34]
});

// ===============================
// LUGARES
// ===============================

const lugares = [

{
nombre:"Cristo Redentor",
lat:-22.9519,
lng:-43.2105,
tipo:"Lugar"
},

{
nombre:"Pan de Azúcar",
lat:-22.9486,
lng:-43.1566,
tipo:"Lugar"
},

{
nombre:"Copacabana",
lat:-22.9711,
lng:-43.1822,
tipo:"Playa"
},

{
nombre:"Ipanema",
lat:-22.9839,
lng:-43.2096,
tipo:"Playa"
},

{
nombre:"Escadaria Selarón",
lat:-22.9153,
lng:-43.1795,
tipo:"Arte"
},

{
nombre:"Parque Lage",
lat:-22.9605,
lng:-43.2130,
tipo:"Parque"
}

];

// Crear marcadores

lugares.forEach(lugar=>{

L.marker(
[lugar.lat,lugar.lng],
{icon:greenIcon}

)

.addTo(map)

.bindPopup(

`
<b>${lugar.nombre}</b>
<br>
${lugar.tipo}
`

);

});

// ===============================
// BOTÓN +
// ===============================

document.querySelector(".addButton")

.addEventListener("click",()=>{

alert(

"🚀 Próximamente podrás añadir descubrimientos."

);

});
