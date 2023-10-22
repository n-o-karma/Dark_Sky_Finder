//"(imcompelete code) I just put old codes I used separately together. getStayPlaces(lat,lon,radius) was changed from python code"
//Find the darkest places near the selected state
// Find accommodataion near the darkest places
// let darkPosition = [39.952583, -75.165222,100000]
// let lat = darkPosition[0];
// let lon = darkPosition[1];
// let radius = 10000;
// var stayPlacesData =[];

getStayPlaces(lat,lon,radius);

function getStayPlaces(lat, lon, radius) {
    const paramsCamping = {
        categories: "camping",
        apiKey: geoapify_key,
        format: "json"
    };
    const paramsAccommodation = {
        categories: "accommodation.hotel",
        apiKey: geoapify_key,
        format: "json"
    };
    const latitude = lat;
    const longitude = lon;
    
    paramsCamping.filter = `circle:${longitude},${latitude},${radius}`;
    paramsCamping.bias = `proximity:${longitude},${latitude}`;

    paramsAccommodation.filter = `circle:${longitude},${latitude},${radius}`;
    paramsAccommodation.bias = `proximity:${longitude},${latitude}`;

    const baseUrl = "https://api.geoapify.com/v2/places";

    const responseCamping = fetch(`${baseUrl}?${new URLSearchParams(paramsCamping)}`);
    const campingData =responseCamping.json();

    const responseAccommodation = fetch(`${baseUrl}?${new URLSearchParams(paramsAccommodation)}`);
    const accommodationData =  responseAccommodation.json();

    campingData.features.forEach(feature => {
        try {
            stayPlacesData.push({
                name: feature.properties.name,
                latitude: feature.properties.lat,
                longitude: feature.properties.lon
            });
        } catch (error) {
            console.error(error);
        }
    });

    accommodationData.features.forEach(feature => {
        try {
            stayPlacesData.push({
                name: feature.properties.name,
                latitude: feature.properties.lat,
                longitude: feature.properties.lon
            });
        } catch (error) {
            console.error(error);
        }
    });
    console.log(accommodationData);
}

// Iterate through all the hotels and append their names to the list
campingData.features.forEach(function(feature) {
    try {
        stayPlacesData.push({
            "name": feature.properties.name,
            "latitude": feature.properties.lat,
            "longitude": feature.properties.lon
        });
    } catch (error) {
        console.error(error);
    }
});

// Iterate through all the accommodation data and append their names to the list
accommodationData.features.forEach(function(feature) {
    try {
        stayPlacesData.push({
            "name": feature.properties.name,
            "latitude": feature.properties.lat,
            "longitude": feature.properties.lon
        });
    } catch (error) {
        console.error(error);
    }
});
console.log(stayPlacesData);
generateHotelList(stayPlacesData);

// list accomodations near the dark plase 
function generateHotelList(stayPlacesData) {
    let htmlString = '<ul class="accommodation">';
    stayPlacesData.forEach((hotel) => {
        htmlString += `<li id="stayData">${hotel.name}</li>`;
    });
    htmlString += '</ul>';
    return htmlString;
}

// const htmlOutput = generateHotelList(stayPlacesData);
// console.log(htmlOutput);

// Create and configure your Leaflet map instance
let myMap = L.map("map-section").setView([{{ data['latitude'] | safe }}, {{ data['longitude'] | safe }}], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(myMap);