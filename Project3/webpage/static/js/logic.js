let lightpollu_path = '../api_data/Resources/lightpollution_v2.csv';
d3.csv(lightpollu_path).then(createLayers);

function createLayers(response) {
  let myMarkers = [];
  let heatArray = [];

  for (let i = 0; i < response.length; i++) {
    let event = response[i];
    if (event.NELM >= 4){
      let myMark = L.marker([event.Latitude, event.Longitude]).bindPopup(`<h2> ${event.State}, </h2> <h2> NELM ${event.NELM} </h2> `);
      myMarkers.push(myMark);
      heatArray.push([event.Latitude, event.Longitude]);
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
  resetTable();
  addTableHeaders();
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

function onStateSelectChange(state){
  console.log('test');
  console.log(state);
  console.log(typeof geoapify_key);
  console.log('geoapify_key');
  console.log(geoapify_key);
  console.log('geoapify_key');


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

// Make a table header
function addTableHeaders() {
  const tableHeaders = ["Date", "Moon Illumination", "Moon Phase","Cloud Cover (Total)"];
  const headerRow = document.getElementById('tableHeaders');
  tableHeaders.forEach(header => {
      const th = document.createElement('th');
      th.appendChild(document.createTextNode(header));
      headerRow.appendChild(th);
  });
}

// reset the table after selecting another state
function resetTable() {
  const moonDataBody = document.getElementById('moonDataBody');
  while (moonDataBody.firstChild) {
      moonDataBody.removeChild(moonDataBody.firstChild);
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