document.addEventListener("DOMContentLoaded", function () {
    const mapDiv = L.map("map").setView([0, 0], 2);
    const hotelsList = document.getElementById("hotels-list");
    const stateElement = document.getElementById("state");
    const latitudeElement = document.getElementById("latitude");
    const longitudeElement = document.getElementById("longitude");

    const getMapData = async () => {
        // Add your Flask route here to get all the necessary data
        const response = await fetch("/get_all_data?state=YOUR_SELECTED_STATE");
        const data = await response.json();

        stateElement.textContent = data.state;
        latitudeElement.textContent = data.latitude;
        longitudeElement.textContent = data.longitude;

        // Add map markers for stay data
        data.stay_data.forEach((place) => {
            L.marker([place.lat, place.lon]).addTo(mapDiv).bindPopup(place.name);
            const li = document.createElement("li");
            li.textContent = place.name;
            hotelsList.appendChild(li);
        });

        // ... Code for populating moon data and weather data
    };

    getMapData();
});