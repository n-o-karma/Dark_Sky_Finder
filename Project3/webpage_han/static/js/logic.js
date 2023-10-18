
function initMap(lat, lon) {
    var mymap = L.map('map').setView([lat, lon], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
    }).addTo(mymap);
    L.marker([lat, lon]).addTo(mymap).bindPopup("Selected State Center").openPopup();
}

var mapDiv = document.getElementById("map");
var lat = parseFloat("{{ data.latitude }}");
var lon = parseFloat("{{ data.longitude }}");
if (mapDiv) {
    initMap(lat, lon);
}