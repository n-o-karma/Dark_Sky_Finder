// Read in the light pollution data
//let lightpollu_path = '../api_data/Resources/lightpollution_v2.csv';
//d3.csv(lightpollu_path).then(createLayers);

///////////// This is the code to get lightpol db from flask ///////////// 

    // Variables with paths for each call:

    // allstatespath is a json with the complete database
    let allstatespath = 'http://127.0.0.1:5000/api/v1.0/allstates';

    // D3 call for all states:

    d3.json(allstatespath).then(createLayers); //call create layers inside of then

/////////////  End of code to get lightpol db from flask ///////////// 

// Create a set of custom leaflet icons
const myIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2536/2536650.png',
  iconSize: [30, 30],
});

const stayIcon = L.icon({
  iconUrl: 'https://icon-library.com/images/accommodation-icon/accommodation-icon-6.jpg',
  iconSize: [30, 30],
});

let oldStayMarkerGroup = null;
// Use light pollution data to create 2 default map layers
function createLayers(response) {
  console.log(response)
  let myMarkers = [];
  let heatArray = [];
  let stayMarkerLayer = [];
  for (let i = 0; i < response.length; i++) {
    let point = response[i];
    // Select data points with dark skies; i.e. NELM >= 4
    if (point.NELM >= 4){
      let myMark = L.marker([point.Latitude, point.Longitude],{icon:myIcon}).bindPopup(`<h2> ${point.State}, </h2> <h2> NELM ${point.NELM} </h2> `);
      // Add these points individually and as a heatmap
      myMarkers.push(myMark);
      heatArray.push([point.Latitude, point.Longitude]);
      
      // Add onClick functionality to data points
      myMark.on('click', function(e) {
        // Get latitude and longitude from the click event
        let lat = e.latlng.lat;
        let lon = e.latlng.lng;
        // Make a POST request to the Flask server to make moon and cloud table
        fetch(`http://localhost:5000/api/v1.0/moon-weather-data/${lat}/${lon}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json;charset=UTF-8'
          },
          body: JSON.stringify({lat: lat, lon: lon})
          })
        .then(response=> response.json())
        .then(moon_weather_data => {
          const jsonData = JSON.parse(moon_weather_data);
          createMoonWeatherDataTable(jsonData)
        })
        .catch(error => console.error('Error:', error));

        // Make a POST request to the Flask server to make lodging table and markers
        fetch(`http://localhost:5000/api/v1.0/stay-places/${lat}/${lon}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json;charset=UTF-8'
          },
          body: JSON.stringify({lat: lat, lon: lon})
        })
        .then(response => response.json())
        .then(data => {
          createStayTable(data.stay_places_data, data.radius);

          data.stay_places_data.forEach(place => {
          let stayMarker = L.marker([place.latitude, place.longitude], {icon: stayIcon}).bindPopup(place.name);
          stayMarkerLayer.push(stayMarker)
          });

          // Remove the old lodging markers on a new click event
          let stayMarkerGroup = L.layerGroup(stayMarkerLayer)
          if(oldStayMarkerGroup){
            map.removeLayer(oldStayMarkerGroup)
          }
          oldStayMarkerGroup = stayMarkerGroup
          stayMarkerGroup.addTo(map);
          stayMarkerLayer = [];
        })
        .catch(error => console.error('Error:', error));
      });
    };
  };

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

  // Making a map legend
  let legend = L.control({ position: "bottomleft" });
  legend.onAdd = function() {
    let div = L.DomUtil.create("div", "info legend");
    let labels = ['<strong>Markers</strong>'];

    let legendInfo = "<div class=\"labels\">" + "</div>";
    div.innerHTML = legendInfo;

    labels.push(`<br> <i> <img src = 'https://cdn-icons-png.flaticon.com/512/2536/2536650.png' width = '15' height = '15' alt='Data Point' id='defaultIcon'> Data Point </i> <br> `);
    labels.push(`<i> <img src = 'https://icon-library.com/images/accommodation-icon/accommodation-icon-6.jpg' width = '15' height = '15' alt='Lodging' id='lodgingIcon'> Lodging </i> <br> `);

    div.innerHTML += "<ul>" + labels.join("") + "</ul>";
  return div;
  };

  legend.addTo(map);
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

// Define a map, centered at the center of the USA
let map = L.map("map", {
  center: [37.0902, -95.7129],
  zoom: 4,
  layers: [Esri_WorldImagery]
});

let baseMaps = {
  "Terrain": Esri_WorldImagery,
  "Light Sources":NASAGIBS_ViirsEarthAtNight2012
};

// The function that returns state coordinates
function getStateCoordinates(response, state){
  for (item of response.features){
    if (item.properties.state_code == state){
      return [item.properties.lat, item.properties.lon]
    };
  };
  throw new Error("Unable to find valid state latitude and longitude");
};

// Define an array of objects that will hold lunar data
let nextmoonphases = [{}];

// Make the moon+weather table and draw moon phases
function createMoonWeatherDataTable(data) {
  resetTableCloud();
  addTableHeadersCloud();

  const moonDataBody = document.getElementById('moonDataBody');

  // Reset the array each time the table is updated
  nextmoonphases = [{}];

  data.forEach(row => {
      // Populate the table
      const newRow = document.createElement('tr');
      const dateCell = document.createElement('td');
      dateCell.appendChild(document.createTextNode(row.date));
      newRow.appendChild(dateCell);

      const illuminationCell = document.createElement('td');
      illuminationCell.appendChild(document.createTextNode(row.moon_illumination));
      newRow.appendChild(illuminationCell);

      const phaseCell = document.createElement('td');
      phaseCell.appendChild(document.createTextNode(row.moon_phase));
      newRow.appendChild(phaseCell);

      const cloudCell = document.createElement('td');
      cloudCell.appendChild(document.createTextNode(row.cloud_cover));
      newRow.appendChild(cloudCell);

      moonDataBody.appendChild(newRow);

      // Add lunar data to the array
      nextmoonphases.push({"date": row.date,"moon_illumination": row.moon_illumination,"moon_phase": row.moon_phase})
  });
  // Draw moon phases and create line chart
  moondrawing(nextmoonphases);
};

// Make the lodging table
function createStayTable(data,radius) {
  resetTableStay();
  addTableHeadersStay();

  const stayDataBody = document.getElementById('stayDataBody');

  // If no lodging can be found, notify the user
  if (data.length === 0) {
    const newRow = document.createElement('tr');
    const newCell = document.createElement('td');
    newCell.textContent = `Sorry, we cannot find any accommodation within  ${radius/1000} kilometers`;
    newRow.appendChild(newCell);
    stayDataBody.appendChild(newRow);
    // Else, populate the table
  } else {
    data.forEach(item => {
      const newRow = document.createElement('tr');
      const newCell = document.createElement('td');
      newCell.textContent = item.name;
      newRow.appendChild(newCell);
      stayDataBody.appendChild(newRow);
    });
  };
};

// When a new state is selected from the dropdown menu ..
function onStateSelectChange(state){
  let geoapify_url = `https://api.geoapify.com/v1/geocode/search?state=${state}&type=state&country=United%20States%20of%20America.&format=geojson&apiKey=${geoapify_key}`
  // statepath is a dynamic url that receives the selected state
  let statepath = `/api/v1.0/bystate/${state}`;
  d3.json(geoapify_url)
  .then(response => {
    // Get the coordinates of the new state from geoapify
    return getStateCoordinates(response, state)}
  )
  // Then pan to the new state on the map with those coordinates
  .then((stateCoords) => {map.flyTo(stateCoords,6)})
  .catch(error => console.error('Error:', error));

      // D3 call for selected state:
    d3.json(statepath).then(); //call next function needed inside of then
};

// Make a header for the moon+cloud table
function addTableHeadersCloud() {
  const tableHeaders1 = ["Date", "Moon Illumination", "Moon Phase","Cloud Cover (Total)"];
  const headerRow1 = document.getElementById('tableHeaders');
  headerRow1.style.fontSize = "30px";

  const tr = document.createElement('tr');
  const th = document.createElement('th');
  th.setAttribute('colspan', '4');
  headerRow1.style.fontSize = "20px";
  const headerText = document.createTextNode('Moon and Cloud Info');
  th.appendChild(headerText);
  th.style.fontSize = "30px";
  tr.appendChild(th);
  headerRow1.appendChild(tr);

  tableHeaders1.forEach(header => {
      const th = document.createElement('th');
      th.appendChild(document.createTextNode(header));
      headerRow1.appendChild(th);
  });
};


// Reset the moon+cloud table after selecting another state
function resetTableCloud() {
  const moonDataBody = document.getElementById('moonDataBody');
  const headerRow = document.getElementById('tableHeaders');

  while (moonDataBody.firstChild) {
    moonDataBody.removeChild(moonDataBody.firstChild);
  };
  while (headerRow.firstChild) {
    headerRow.removeChild(headerRow.firstChild);
  };
};

// Make a header for the lodging table
function addTableHeadersStay() {
  const stayHeaders = document.getElementById('stayHeaders');
  const tr = document.createElement('tr');
  const th = document.createElement('th');
  const headerText = document.createTextNode('Where to stay');
  th.appendChild(headerText);
  th.style.fontSize = '30px';
  tr.appendChild(th);
  stayHeaders.appendChild(tr);
};

// Reset the lodging table after selecting another data point
function resetTableStay() {
  const stayDataBody = document.getElementById('stayDataBody');
  const stayHeaders = document.getElementById('stayHeaders');

  while (stayDataBody.firstChild) {
    stayDataBody.removeChild(stayDataBody.firstChild);
  };
  while (stayHeaders.firstChild) {
    stayHeaders.removeChild(stayHeaders.firstChild);
  };
};

let theChart;

// Use Chart.js to draw a line graph of moon visibility
function makeGraph(nextmoonphases){
  // Clear the data handlers
  thelabels = [];
  thedata = [];

  // Extract the necessary data; only consider dates with valid illumination values
  for (let i = 1; i < nextmoonphases.length; i++){
    if (nextmoonphases[i].moon_illumination != ''){
      thelabels.push(nextmoonphases[i].date);
      thedata.push(nextmoonphases[i].moon_illumination); 
    };
  };

  // Set up plot parameters
  let theChartArea = document.getElementById('myChart');
  let data = {
    labels: thelabels,
    datasets: [{
      label: 'Moon Visibility (%)',
      data: thedata
    }]
  };
  let configuration = {
    type:'line',
    data,
    options: {
      animation: true,
      plugins: {
        legend: {
          display: true
        },
        tooltip: {
          enabled: true
        }
      }
    }
  };
  
  // If there is already a chart occupying the div, delete it before trying to draw the new one
  if (theChart){
    theChart.destroy()
    theChart = new Chart(theChartArea,configuration)
  }
  else{
    theChart = new Chart(theChartArea,configuration)
  };
};

// Define starting values for the moon drawing
let waxing = true;
let css_style = {
  diameter: 100,
  earthshine: 0.1,
  blur:10,
  lightColour: '#fff0b1'};

// Draw lunar phases and call our Chart.js function 
function moondrawing(nextmoonphases) {
  makeGraph(nextmoonphases)
  resetMoons()
  let moonphases = [];
  let header = d3.select("#moonheaders");
  let drawings = d3.select("#moondrawing")

  
  for (let i = 1; i < nextmoonphases.length; i++) {
    // Convert moon illumination from percent to decimal values
    let newshadow = nextmoonphases[i].moon_illumination/100;
    moonphases.push(newshadow);
    
    // Populate the moon drawing table
    header.append("th").text(nextmoonphases[i].date);
    // If a full/new moon occurs, the shadow on the moon switches sides
    if (nextmoonphases[i].moon_phase == 'Full'|| nextmoonphases[i].moon_phase == 'New'){
      waxing = !waxing
    };
    // As long as data for the date 'i' exists, draw a moon
    if (nextmoonphases[i].moon_phase != ''){
      drawings.append("td").attr("id", `phase_${i-1}`)
      drawPlanetPhase(document.getElementById(`phase_${i-1}`), moonphases[i-1], waxing, css_style);
    };
  };
};

// When a new location is selected, reset the moon phase drawings
function resetMoons() {
  const moonHeaders = document.getElementById('moonheaders');
  const moonData = document.getElementById('moondata');
  const moonDrawing = document.getElementById('moondrawing');

  while (moonHeaders.firstChild) {
    moonHeaders.removeChild(moonHeaders.firstChild);
  };
  while (moonData.firstChild) {
    moonData.removeChild(moonData.firstChild);
  };
  while (moonDrawing.firstChild) {
    moonDrawing.removeChild(moonDrawing.firstChild);
  };
};