// Read in the light pollution data
let lightpollu_path = '../api_data/Resources/lightpollution_v2.csv';
d3.csv(lightpollu_path).then(createLayers);
const stayIcon = L.icon({
  iconUrl: 'static/css/stay_icon.jpg',
  iconSize: [30, 30],
});

let oldStayMarkerGroup = null;
// Use light pollution data to create 2 default map layers and a dynamic one for lodging
function createLayers(response) {
  let myMarkers = [];
  let heatArray = [];
  let stayMarkerLayer = [];
  for (let i = 0; i < response.length; i++) {
    let event = response[i];
    // Use data points with dark skies; i.e. NELM >= 4
    if (event.NELM >= 4){
      let myMark = L.marker([event.Latitude, event.Longitude]).bindPopup(`<h2> ${event.State}, </h2> <h2> NELM ${event.NELM} </h2> `);
      // Add these points individually and as a heatmap
      myMarkers.push(myMark);
      heatArray.push([event.Latitude, event.Longitude]);
      myMark.on('click', function(e) {
        // Get latitude and longitude from the event
        let lat = e.latlng.lat;
        let lon = e.latlng.lng;
        console.log('Clicked marker at latitude: ' + lat + ', longitude: ' + lon);
        // Make a POST request to the Flask server for make moon and cloud table
        fetch(`http://localhost:5000/api/v1.0/moon-weather-data/${lat}/${lon}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json;charset=UTF-8'
          },
          body: JSON.stringify({lat: lat, lon: lon})
          })
        .then(response=> response.json())
        .then(moon_weather_data => {
          // do stuff with moon_weather data
          const jsonData = JSON.parse(moon_weather_data);
          createMoonWeatherDataTable(jsonData)
        })
        .catch(error => console.error('Error:', error));

        // Make a POST request to the Flask server for make stay table and markers
        fetch(`http://localhost:5000/api/v1.0/stay-places/${lat}/${lon}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json;charset=UTF-8'
          },
          body: JSON.stringify({lat: lat, lon: lon})
        })
        .then(response => response.json())
        .then(data => {
          console.log('Response from Flask server:', data);
          createStayTable(data.stay_places_data, data.radius);

          data.stay_places_data.forEach(place => {
          let stayMarker = L.marker([place.latitude, place.longitude], {icon: stayIcon}).bindPopup(place.name);
          stayMarkerLayer.push(stayMarker)
          });
          
          let stayMarkerGroup = L.layerGroup(stayMarkerLayer)
          if( oldStayMarkerGroup){
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

function getStateCoordinates(response, state){
  for (item of response.features){
    if (item.properties.state_code == state){
      return [item.properties.lat, item.properties.lon]
    }
  }
  throw new Error("Unable to find valid state latitude and longitude");
}
let nextmoonphases = [{}]
// Make table of moon_weather_data
function createMoonWeatherDataTable(data) {
  resetTableCloud();
  addTableHeadersCloud();
  const moonDataBody = document.getElementById('moonDataBody');
  nextmoonphases = [{}]
  data.forEach(row => {
      nextmoonphases.push({"date": row.date,"moon_illumination": row.moon_illumination,"moon_phase": row.moon_phase})

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
  });
  moondrawing(nextmoonphases);
}

// Make table of staying
function createStayTable(data,radius) {
  resetTableStay();
  addTableHeadersStay();
  const stayDataBody = document.getElementById('stayDataBody');
  console.log("test1")
  console.log(radius);
  if (data.length === 0) {
    const newRow = document.createElement('tr');
    const newCell = document.createElement('td');
    newCell.textContent = `Sorry, we cannot find any accommodation within  ${radius/1000} kilometers`;
    newRow.appendChild(newCell);
    stayDataBody.appendChild(newRow);
  } else {
    data.forEach(item => {
      const newRow = document.createElement('tr');
      const newCell = document.createElement('td');
      newCell.textContent = item.name;
      newRow.appendChild(newCell);
      stayDataBody.appendChild(newRow);
    });
  }
}

function onStateSelectChange(state){
  let geoapify_url = `https://api.geoapify.com/v1/geocode/search?state=${state}&type=state&country=United%20States%20of%20America.&format=geojson&apiKey=${geoapify_key}`
  
  d3.json(geoapify_url)
  .then(response => {
    return getStateCoordinates(response, state)}
  )
  .then((stateCoords) => {
    // fetch('http://localhost:5000/api/v1.0/moon-weather-data', {
    //   method: 'POST',
    //   headers: {
    //       'Content-Type': 'application/json;charset=UTF-8'
    //   },
    //   body: JSON.stringify(stateCoords)})
    // .then(response=> response.json())
    // .then(moon_weather_data => {
    //   // do stuff with moon_weather data
    //   const jsonData = JSON.parse(moon_weather_data);
    //   createMoonWeatherDataTable(jsonData)
    // })
    // .catch(error => console.error('Error:', error));
    
    map.flyTo(stateCoords,6);
  })
  .catch(error => console.error('Error:', error));
};

// Make a table header for moonCoudTable
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
}


// reset the cloud table after selecting another state
function resetTableCloud() {
  const moonDataBody = document.getElementById('moonDataBody');
  const headerRow = document.getElementById('tableHeaders');

  while (moonDataBody.firstChild) {
    moonDataBody.removeChild(moonDataBody.firstChild);
  }

  while (headerRow.firstChild) {
    headerRow.removeChild(headerRow.firstChild);
  }
}

// make stay table head
function addTableHeadersStay() {
  const stayHeaders = document.getElementById('stayHeaders');
  const tr = document.createElement('tr');
  const th = document.createElement('th');
  const headerText = document.createTextNode('Where to stay');
  th.appendChild(headerText);
  th.style.fontSize = '30px';
  tr.appendChild(th);
  stayHeaders.appendChild(tr);
}

// reset the stay table after selecting another dark place
function resetTableStay() {
  const stayDataBody = document.getElementById('stayDataBody');
  const stayHeaders = document.getElementById('stayHeaders');

  while (stayDataBody.firstChild) {
    stayDataBody.removeChild(stayDataBody.firstChild);
  }

  while (stayHeaders.firstChild) {
    stayHeaders.removeChild(stayHeaders.firstChild);
  }
}

function makeChart(nextmoonphases){
  thelabels = []
  thedata = []
  for (let i = 1; i < 10; i++){
    thelabels.push(nextmoonphases[i].date)
    thedata.push(nextmoonphases[i].moon_illumination)
  }
  let theChartArea = document.getElementById('myChart');
  let theChart = new Chart(theChartArea,{
    type:'line',
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
    },
    data: {
      labels: thelabels,
      datasets: [{
        label: 'Moon Visibility (%)',
        data: thedata
      }]
    }
  })
  
}

// Starting values for the moon drawing:
let waxing = true;
let css_style = {
  diameter: 150,
  earthshine: 0.1,
  blur:10,
  lightColour: '#fff0b1'};
let mooncontainer = document.getElementById("moondrawing")

function moondrawing(nextmoonphases) {
  makeChart(nextmoonphases)
  resetTableMoon()
  let moonphases = [];
  let header = d3.select("#moonheaders");
  let content = d3.select("#moondata");
  let drawings = d3.select("#moondrawing")

  for (let i = 1; i < nextmoonphases.length; i++) {
    let newshadow = nextmoonphases[i].moon_illumination/100;
    moonphases.push(newshadow);
    
    header.append("th").text(nextmoonphases[i].date);
    content.append("td").text(nextmoonphases[i].moon_phase);
    if (nextmoonphases[i].moon_phase == 'Full'){
      waxing = !waxing
    }
    drawings.append("td").attr("id", `phase_${i-1}`).text(`${moonphases[i-1]}`)
    drawPlanetPhase(document.getElementById(`phase_${i-1}`), moonphases[i-1], waxing, css_style);
  }
};

function resetTableMoon() {
  const moonHeaders = document.getElementById('moonheaders');
  const moonData = document.getElementById('moondata');
  const moonDrawing = document.getElementById('moondrawing');

  while (moonHeaders.firstChild) {
    moonHeaders.removeChild(moonHeaders.firstChild);
  }

  while (moonData.firstChild) {
    moonData.removeChild(moonData.firstChild);
  }

  while (moonDrawing.firstChild) {
    moonDrawing.removeChild(moonDrawing.firstChild);
  }
}