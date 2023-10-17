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
});

let map = L.map("map", {
  center: [37.0902, -95.7129],
  zoom: 4,
  layers: [Stadia_AlidadeSmoothDark]
});

let baseMaps = {
  "Street Map": Stadia_AlidadeSmoothDark
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
  console.log(response)
  labels = []
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
        data: [response]
      }]
    }
  })
}