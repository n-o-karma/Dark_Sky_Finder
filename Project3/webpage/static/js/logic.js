let lightpollu_path = '../api_data/Resources/lightpollution_v2.csv'
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
    }
  }

    let overlayMaps = {
      "Data Sites": L.layerGroup(myMarkers),
      'Heat Map': L.heatLayer(heatArray,{minOpacity:0.35,maxZoom:10})
    };
    L.control.layers(baseMaps,overlayMaps, {
      collapsed: false
    }).addTo(map);
}

let Stadia_AlidadeSmoothDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}', {
	minZoom: 0,
	maxZoom: 20,
	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'png'
}
);

var NASAGIBS_ViirsEarthAtNight2012 = L.tileLayer('https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}', {
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
  layers: [NASAGIBS_ViirsEarthAtNight2012]
});

let baseMaps = {
  "Street Map": NASAGIBS_ViirsEarthAtNight2012
};

function zoomIn(state){
  let geoapify_url = `https://api.geoapify.com/v1/geocode/search?state=${state}&type=state&country=United%20States%20of%20America.&format=geojson&apiKey=${geoapify_key}`
  d3.json(geoapify_url).then(stateZoom)

  function stateZoom(response){
    for (item of response.features){
      if (item.properties.state_code == state){
        stateCoords = [item.properties.lat, item.properties.lon]
        map.flyTo(stateCoords,6)
      }
      else{break}
    }
  }
}

let moonphase_path = '../api_data/Resources/moon_phases.csv'
d3.csv(moonphase_path).then(findDates);

function findDates(response){
  //console.log(response)
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
let moonphases = [];

// Temp list of moonphases for testing
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
  let header = d3.select(".moonheader");
  let content = d3.select(".moondata").append("tr");
  for (let i = 1; i<nextmoonphases.length; i++ ) {
    let newshadow = nextmoonphases[i].moon_illumination/100;
    moonphases.push(newshadow);
    let dateheaders = header.append("th").text(nextmoonphases[i].date);
    //let moonphases = content.append("td").text(newshadow)
  }
  console.log(moonphases);
  //drawPlanetPhase(mooncontainer, moonshadow, waxing, css_style);
}