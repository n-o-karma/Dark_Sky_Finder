const lightpollu_path = '../api_data/Resources/lightpollution_v2.csv'
d3.csv(lightpollu_path).then(createLayers);

// const moonphase_path = '../api_data/Resources/moon_phases.csv'
// d3.csv(moonphase_path).then(findDates);

function createMap(skymarkers, heatMap){
let Stadia_AlidadeSmoothDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}', {
	minZoom: 0,
	maxZoom: 20,
	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'png'
});

let baseMaps = {
    "Street Map": Stadia_AlidadeSmoothDark
  };

  let overlayMaps = {
    "Data Sites": skymarkers,
    'Heat Map': heatMap
  };

  let map = L.map("map", {
    center: [37.0902, -95.7129],
    zoom: 5,
    layers: [Stadia_AlidadeSmoothDark,skymarkers]
  });

  L.control.layers(baseMaps,overlayMaps, {
    collapsed: false
  }).addTo(map);
}

function createLayers(response) {
    let myMarkers = [];
    let heatArray = [];

    for (let i = 0; i < response.length; i++) {
      let event = response[i];
;

      if (event.NELM >= 4){
        heatArray.push([event.Latitude, event.Longitude]);
        let myMark = L.marker([event.Latitude, event.Longitude]).bindPopup(event.State);
        myMarkers.push(myMark)
      }
    }
    createMap(L.layerGroup(myMarkers), L.heatLayer(heatArray,{minOpacity:0.35,maxZoom:10}));
  }

function zoomIn(){

}