const globeatnight_URL = 'https://s3.us-west-2.amazonaws.com/noirlab.edu.cee.prod/globeatnight/documents/GaN2022.json?AWSAccessKeyId=ASIAWX3YSJVTES3ORD5X&Signature=4rq%2FqSDss6%2F0Npb%2BDngQnWNbpuE%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEOj%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQC2vCP9zfYhXVA%2FoY6fb1aTk6EV%2Fdo6JAW6qp46K6JUdAIgLR5Tb2c9cseRBUmiuiT8C5dtlX2Op3VKPKUzR%2BbIS0EqjgUI8f%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw0NjM1NzI0NTQ3NTgiDAB1u1puuDwgPtZuGyriBMVFSuoMyINJyz38J%2BaIlWoJ%2B72sk7a%2F2Usa0VisAzk6%2Fa7vLNcUaRya5m49%2BnWLYjKhpTNmIXEXdlfj9%2BbLD5e7gFZ2mGxdGyl%2BtYVaVApVWkbkfB2PmbaktiVIubA7kMm5L02dRk3xyHcykjGK5zriOtr7JKpxOcBuEtqTtJoVxvIXAGY%2BwFOWfjgFIspppI9dMaCodHMQb0eMiZBRiFqeTvKL9OcJLIAo2RqMJkZilyZGn%2FnfUe73LjxXmKcCuBIztB8uRyZHOCHnN9uqcpF0A5lk8G67zKQNTe0clgFXkr6dxKfanQAp9NFqpRynrubPvuQ7Z9vX3grmHtiexe2NPiq29W36nPz4CvWfgGIiP%2B1q2udX1OVrhrrc0%2B%2B5d5tUB%2BsYhtQNOi4K2jH18b1xcHRyfvQFbYpMI92mDxg02q5pNq6HXiTnU409BOxJNfuG42PQCewXZnUkOpX%2BPVi3LTJDs%2BNJo1FLXpy%2FFzjzNxngakiniJZA1Stgyovra%2BmMHBaKPISCB3Bnieuac7TMKtLPOHphnYwQG03PZC0JXjNrFVQeOZHAPfZzG0BVY5IS2pSHFgc0Qa9LyAEHKTLeeeVuCPaCrj%2Fz23XrWE%2FvrS2RY4ChiE7uGp1aFGSvXvtWt7nzXwcV3KpcpRrKziyXvTKiDzrUDHMyYWrb0DiPMa03ylNwcAGEull3dEgIUEdtfuQ7Gj3xqVYtqmt%2BTHK0gOKdoLh9FHCNAknKnTDG3%2Fkxdcd1w6p1ctfscAwaPvKkSU9TmirK5Lk9YU9OG6TIflRjJ5F81C8pc8OYI5ZxXxMw7JObqQY6mgHayWezmVDdcFRe%2Br7fUaIe0Uq0S2mlXk9P2Uev6eg54%2B%2Bc3kYohhEJq8gKPDgOHHzju4S4SQpPhn9U32XJdm99kl8RFoBf0DTCkrzs6275P19b8QBT7vge%2BBI%2B8a0SjRBgfjeEjuMook%2BabA1ZgB5fuchXSA1DEqMus3nWnX1viq6M5JE2c%2Bibdu51o1c8QPG6w1lZQaDBumfh&Expires=1697044478';

d3.json(globeatnight_URL).then(createLayers);

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

    for (let i = 0; i < 5000; i++) {
      let event = response[i];
      let myMark = L.marker([event.Latitude, event.Longitude]);
      myMarkers.push(myMark);

      if (event.LimitingMag > 4){
        heatArray.push([event.Latitude, event.Longitude]);
      }
    }
    createMap(L.layerGroup(myMarkers), L.heatLayer(heatArray,{maxZoom:10,blur:15}));
  }