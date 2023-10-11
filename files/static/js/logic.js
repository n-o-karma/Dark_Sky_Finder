const globeatnightURL = 'https://s3.us-west-2.amazonaws.com/noirlab.edu.cee.prod/globeatnight/documents/GaN2022.json?AWSAccessKeyId=ASIAWX3YSJVTNP64QOPM&Signature=F3P8VEIPR%2BSpwiM%2BPYlxTgINv5k%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEOT%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQDsC2M%2BawiVaHmJvTt0ya9eRxq%2BgwH0EERsRtu4aJDdyQIgITmBx%2FsoTcH2qW5G56nn7PTzmGvn72x%2B6T658vwWfJAqjgUI7f%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw0NjM1NzI0NTQ3NTgiDKptNihQUXEHwCZHrCriBJwnSmZINfIbyEeHAXfVYL0AcaiMDKTk4ZY%2FqNMplP5vZ7doV93NJCg0AsVH3MPWJnSFijy1G5YPFXiWiZ7Qs%2Bh9Bh3qo2BAr8FYCZ31vD3ehpdiVwhSWPqF%2B9Zdz1EfnKZA4ZAE5GDCOLpuGEwMcdxkVmJxjOSM9POAJyRiPr%2Ff5g0h5%2FrHxK9TT0U4L9BbPlHOFUz2AopDdbg%2BDaOj52aEbuWc9PAmU3l5qgqk0vx3Jaid7AdP0QpCqEKjy59uQWSVGgBYWpLtToTXlEFGL8invWiPTlmbLmVqy3kjr4Qzi4BNYErrDpgfdykHJAlTSq56B2b7x4WHAJLbgFLB5ExRnCO1LGK%2BuVZrBaoLrfPrIGo%2FMUkYcpxa79maOsTuyj2Wka5Dz9fy%2FwuBQNPikQ0PosZsJNoeyUAuut4rp6fv%2FLYmt1aeaSxhnahaNP%2FFC5gTV6M9CXW9TA3X38Tcj5umCriuTZPphsOBOelNui2LTFkyhVXfonhzNDkedBpMbI%2B1fMx5v6zX1lGVIPHmLWe8mg0buPEXiTSpbToX%2BYpHx3tNyXwXDaey01CSmA57kwC3kplzdEmJMSrbAkPXuFBCW4qgfYMKSmgIzIxQgx3tJHp367bRe7k5ih9L9NvGcJm3cunFByJflkX%2BWxKN6xfhVdIXF9FCnCGHwfhf1t7jc41nn%2BaBwKegqWksyuW%2F93%2BJwvazLUd0aGQ4sQwHFRgqkcs6sGAo3WR2SLbXhJ1eb%2BW%2BD9rGuHEvn0WrhiwZamL6%2BLAE0Ui7mwH1YTD%2FjOG9QsaYpszLvvy47CM5nUFczO4w35SaqQY6mgGvCsTKn9kwOT91NjnSIkQUI2ST%2B%2FFa53UjcxA8Mq4BSNU1ZSdDfgeZtGrMTbeSgHRQ0X6B%2BFaWyK6T%2BOFQs3ghiL%2FN7TCNfA%2BbNqQsSmDW7fv3%2B2K8HI53RqHYxV4eLP1JB%2BroS74sbj1635Bv964ZeRFX%2FzyAjLig0FA6u6mkG5%2FDZWdSVuni64O9FQaxB4HMwmUKsKm171zb&Expires=1697029011';

d3.json(globeatnightURL).then(createLayers);

function createMap(skymarkers, heatMap){
let streetmap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

let baseMaps = {
    "Street Map": streetmap
  };

  let overlayMaps = {
    "Data Sites": skymarkers,
    'Heat Map': heatMap
  };

  let map = L.map("map", {
    center: [40.73, -74.0059],
    zoom: 3,
    layers: [streetmap,skymarkers]
  });

  L.control.layers(baseMaps,overlayMaps, {
    collapsed: false
  }).addTo(map);
}

function createLayers(response) {
    let myMarkers = [];
    let heatArray = [];

    for (let i = 0; i < (response.length)/3; i++) {
      let event = response[i];
      let myMark = L.marker([event.Latitude, event.Longitude]);
      myMarkers.push(myMark);
      heatArray.push([event.Latitude, event.Longitude]);
    }
    
    createMap(L.layerGroup(myMarkers), L.heatLayer(heatArray));
  }