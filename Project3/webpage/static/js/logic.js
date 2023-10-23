// Read in the light pollution data
let lightpollu_path = '../api_data/Resources/lightpollution_v2.csv';
d3.csv(lightpollu_path).then(createLayers);

// Use light pollution data to create 2 map layers
function createLayers(response) {
  let myMarkers = [];
  let heatArray = [];

  for (let i = 0; i < response.length; i++) {
    let event = response[i]; 
    // Use data points with dark skies; i.e. NELM >= 4
    if (event.NELM >= 4){
      // Call the function to find hotels when a data point is selected
      let myMark = L.marker([event.Latitude, event.Longitude]).bindPopup(`<h2> ${event.State}, </h2> <h2> NELM ${event.NELM} </h2> `).on('click', getHotels(event.Latitude, event.Longitude));
      // Add these points individually and as a heatmap
      myMarkers.push(myMark);
      heatArray.push([event.Latitude, event.Longitude]);
    };
  };

  function getHotels(lat,lon){
    // !! There should be a call to the flask API connecting to Hannah's python code here !!
  }

  //Control for layers 
  let overlayMaps = {
    "Data Sites": L.layerGroup(myMarkers),
    'Heat Map': L.heatLayer(heatArray,{minOpacity:0.35,maxZoom:10})
  };
  L.control.layers(baseMaps,overlayMaps, {
    collapsed: false
  }).addTo(map);

  // This gives the state border outlines
  fetch('static/js/gz_2010_us_040_00_500k.json').then((response2) => response2.json()).then(function makeStates(json){
    for (feature of json.features){
      L.geoJSON(feature.geometry).addTo(map)
    };
  });
};

// Satellite image tiles
let Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

// Night-time light source tiles
let NASAGIBS_ViirsEarthAtNight2012 = L.tileLayer('https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}', {
	attribution: 'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System (<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
	bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
	minZoom: 1,
	maxZoom: 8,
	format: 'jpg',
	time: '',
	tilematrixset: 'GoogleMapsCompatible_Level'
});

// Define a map, center at the center of the USA
let map = L.map("map", {
  center: [37.0902, -95.7129],
  zoom: 4,
  layers: [Esri_WorldImagery]
});

let baseMaps = {
  "Terrain": Esri_WorldImagery,
  "Light Sources":NASAGIBS_ViirsEarthAtNight2012
};

// When a state is selected from the dropdown, zoom into that area
function zoomIn(state){
  let geoapify_url = `https://api.geoapify.com/v1/geocode/search?state=${state}&type=state&country=United%20States%20of%20America.&format=geojson&apiKey=${geoapify_key}`
  d3.json(geoapify_url).then(stateZoom)

  function stateZoom(response){
    for (item of response.features){
      if (item.properties.state_code == state){
        stateCoords = [item.properties.lat, item.properties.lon]
        map.flyTo(stateCoords,6)
      }
      else{break};
    };
  };
};

// This is where the selected date value is read here into the JS
function selDate(date){
  // !! This needs to be connected to the moon and weather data!!
  console.log(date)
  let area = document.getElementById('dates')
  area.scrollIntoView({behavior:"smooth"})
}

let moonphase_path = '../api_data/Resources/moon_phases.csv'

// Starting values for the moon drawing:
let moonshadow = 0.5;
let waxing = true;
let css_style = {
  diameter: 150,
  earthsine: 0.1,
  blur:10,
  lightColour: '#fff0b1'};
let mooncontainer = document.getElementById("moondrawing")

// Temp list of moonphases for testing
let moonphases = [];
let nextmoonphases = [{'date': '2023-10-18', 'moon_illumination': '', 'moon_phase': ''},
  {'date': '2023-10-19',
   'moon_illumination': 18,
   'moon_phase': 'Waxing Crescent'},
  {'date': '2023-10-20',
   'moon_illumination': 27,
   'moon_phase': 'Waxing Crescent'},
  {'date': '2023-10-21',
   'moon_illumination': 37,
   'moon_phase': 'Waxing Crescent'},
  {'date': '2023-10-22',
   'moon_illumination': 48,
   'moon_phase': 'First Quarter'},
  {'date': '2023-10-23',
   'moon_illumination': 60,
   'moon_phase': 'Waxing Gibbous'},
  {'date': '2023-10-24',
   'moon_illumination': 71,
   'moon_phase': 'Waxing Gibbous'},
  {'date': '2023-10-25',
   'moon_illumination': 81,
   'moon_phase': 'Waxing Gibbous'},
  {'date': '2023-10-26',
   'moon_illumination': 89,
   'moon_phase': 'Waxing Gibbous'},
  {'date': '2023-10-27',
   'moon_illumination': 95,
   'moon_phase': 'Waxing Gibbous'}]
moondrawing(nextmoonphases);


function moondrawing(nextmoonphases) {
  let header = d3.select(".moonheaders");
  let content = d3.select(".moondata");
  let drawings = d3.select(".moondrawing")
  for (let i = 1; i<nextmoonphases.length; i++ ) {
    let newshadow = nextmoonphases[i].moon_illumination/100;

    moonphases.push(newshadow);
    // drawPlanetPhase(document.getElementById("moondrawing"), moonshadow, waxing, css_style)
    header.append("th").text(nextmoonphases[i].date);
    content.append("td").text(nextmoonphases[i].moon_phase);
    drawings.append("td").attr("id", `phase_${i-1}`).text(`${i}`)
  }
  console.log(moonphases);
  //drawPlanetPhase(mooncontainer, moonshadow, waxing, css_style);
}