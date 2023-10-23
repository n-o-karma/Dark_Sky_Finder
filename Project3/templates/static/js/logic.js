let lightpollu_path = '../api_data/Resources/lightpollution_v2.csv';
d3.csv(lightpollu_path).then(createLayers);
const stayIcon = L.icon({
  iconUrl: 'static/css/stay_icon.jpg',
  iconSize: [30, 30],
});

function createLayers(response) {
  let myMarkers = [];
  let heatArray = [];
  
  for (let i = 0; i < response.length; i++) {
    let event = response[i];
    if (event.NELM >= 4){
      let myMark = L.marker([event.Latitude, event.Longitude]).bindPopup(`<h2> ${event.State}, </h2> <h2> NELM ${event.NELM} </h2> `);
      myMarkers.push(myMark);
      heatArray.push([event.Latitude, event.Longitude]);
      myMark.on('click', function(e) {
        // Get latitude and longitude from the event
        let lat = e.latlng.lat;
        let lon = e.latlng.lng;
        console.log('Clicked marker at latitude: ' + lat + ', longitude: ' + lon);
        // Make a POST request to the Flask server
        fetch('http://localhost:5000/api/v1.0/stay-places', {
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
          const name = data.stay_places_data.name;
          data.stay_places_data.forEach(place => {
          const stayMarker = L.marker([place.latitude, place.longitude], { icon: stayIcon })
              .addTo(map)
              .bindPopup(place.name);
          });
        })
        .catch(error => console.error('Error:', error));
      });
      
    };
  };

  let overlayMaps = {
    "Data Sites": L.layerGroup(myMarkers),
    'Heat Map': L.heatLayer(heatArray,{minOpacity:0.35,maxZoom:10})
  };
  L.control.layers(baseMaps,overlayMaps, {
    collapsed: false
  }).addTo(map);

  fetch('static/js/gz_2010_us_040_00_500k.json').then((response2) => response2.json()).then(function makeStates(json){
    for (feature of json.features){
      L.geoJSON(feature.geometry).addTo(map)
    };
  });
};

let Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

let NASAGIBS_ViirsEarthAtNight2012 = L.tileLayer('https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}', {
	attribution: 'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System (<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
	bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
	minZoom: 1,
	maxZoom: 8,
	format: 'jpg',
	time: '',
	tilematrixset: 'GoogleMapsCompatible_Level'
});

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
      console.log(state);
      return [item.properties.lat, item.properties.lon]
    }
  }
  throw new Error("Unable to find valid state latitude and longitude");
}

// Make table of moon_weather_data
function createMoonWeatherDataTable(data) {
  resetTableCloud();
  resetTableStay();
  addTableHeadersCloud();
  const moonDataBody = document.getElementById('moonDataBody');
  data.forEach(row => {
      console.log(row.date, row.moon_illumination, row.moon_phase); 
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
    newCell.textContent = `Sorry, we cannot find any accommodation within  ${radius} miles`;
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
  
  // d3.json(geoapify_url).then(stateZoom)
  d3.json(geoapify_url)
  .then(response => {
    console.log('test2')
    return getStateCoordinates(response, state)}
  )
  .then((stateCoords) => {
    console.log('test3');
    fetch('http://localhost:5000/api/v1.0/moon-weather-data', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json;charset=UTF-8'
      },
      body: JSON.stringify(stateCoords)})
    .then(response=> response.json())
    .then(moon_weather_data => {
      // do stuff with moon_weather data
      console.log(moon_weather_data);
      const jsonData = JSON.parse(moon_weather_data);
      console.log(jsonData);
      console.log(typeof jsonData); 
      createMoonWeatherDataTable(jsonData)
    })
    .catch(error => console.error('Error:', error));
    
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
  const headerText = document.createTextNode('Moon and Cloud');
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

function selDate(date){
  console.log(date)
  let area = document.getElementById('dates')
  area.scrollIntoView({behavior:"smooth"})
}

let moonphase_path = '../api_data/Resources/moon_phases.csv'
d3.csv(moonphase_path).then(findDates);

function findDates(response){
  labels = []
  data = []
  for (let i = 1; i < 13; i++){
    labels.push(response.columns[i])
  }
  const theChart = document.getElementById('myChart');
  new Chart(theChart,{
    type:'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Moon Visibility',
        data: data
      }]
    }
  })
}

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