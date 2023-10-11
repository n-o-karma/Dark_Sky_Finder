const url = 'https://s3.us-west-2.amazonaws.com/noirlab.edu.cee.prod/globeatnight/documents/GaN2022.json?AWSAccessKeyId=ASIAWX3YSJVTETPURX3O&Signature=fQXEvdbijyf4j%2BSZ%2FaDQ3yn6UIk%3D&x-amz-security-token=IQoJb3JpZ2luX2VjENj%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQDvOSjZrbvgzkIlDDupHsh5h4QDXw5TbGCzMryPkhhHlwIgJN2k80eQA2XPAPQ6JGCXrxWoZH%2BKgs%2F8LFloFuZ7v0MqjgUI4f%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw0NjM1NzI0NTQ3NTgiDBqb1KHrVS3E0VHzCCriBOyJ1M6IEJ%2B4Kmg2uiFiUyxNDqVs1aDwa7Bre7FkMZDARO%2Fx9pQVku2HQfN5SFCVHRAsF3J0WyGT0WPiZcQ6zIBGVwc%2BIxRtKxfZW7Ffja6NL2n1JqsHatayoMX3fafV9TdXzlu3GghK2Vq9zhkWSp9S0UayBg1LOFT3FtlnofAxfnQyrthub5GJwU%2F5wykIyIfkQdC2FANm%2BtzjTKtomWCUSLCOfYTMI%2B0g%2FaFTd5vdM%2BT3dzK4JeRxsZdMeRQTlUa9xD5FC9sjsRNE8TblT3lLy7OcO%2BoClGbL02WekMIp%2FXKkxrS%2BomvgEEDMXD0OiVHa%2Fs6XSvkniECwm3YrLFxh96nGh%2B9baLRxaG4OVYLh%2FW25Rkni17mNz7Wfu5DK50IRWSnEZusBZ%2FejZYHvFpJu%2BzJZrWWozYAUHRQZSBQezotMTkGDLj00LbJq0ZoutQpalC%2FAA6lblOnI2dmpqWxcUHQJnOEiTr%2BF7a1jy8f1Gi7hTcSiWMF42NXvEigl0QhFsIbnYZ8nvXZuWLIugD5xixFi6b9T5HLNyl7tIU2XM0ev61bFGuhf8a05kVEQLJu6kmk02WJyBQ9t9IL%2F5bmo1y%2BMUez0RWmnB%2BMD2PxzhDUipSaQ1fCFGoJD1cW7MfGhWQWMynhS%2BZ7V2E4QccXm2JLFASvDwvwps1vP6zGyv9Wo58ZzZX2hKay%2B6h3CiXerQ6GrUbgUUmonywEJ3X3obRdtbbCHwGKXhJNbWpRkxK21PgoONqBLqwsK2TXzGgtP78kUqijsUhiOI5Ru%2FQ%2FZcuTr1DekwBtmzv5vcrNRpJUw4cGXqQY6mgHeZAHvnurL8dSy1NaJVmaaKIGJI3%2BY9C%2BowrsQ2Uh1iL09kapMZ85k8Aap%2Ffg1%2FWhzuYZNAHZOV%2FQQ7Womz2RLFmJqNGWpqSt92T6Tj1wo5eFZpkvNWMSeXW%2BoP1E1rlwgMuHVcTcgKOPAzfv8XQwb5hUwZul%2FeUSEUULqBY3wnDwqALQhoZHaie6o%2Br8EVBQlxuipUdfmwYvR&Expires=1696986844';

d3.json(url).then(function(data){
    console.log(data);
});

let streetmap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

let baseMaps = {
    "Street Map": streetmap
  };

  let overlayMaps = {
    
  };

  let map = L.map("map", {
    center: [40.73, -74.0059],
    zoom: 3,
    layers: [streetmap]
  });

  L.control.layers(baseMaps,overlayMaps, {
    collapsed: false
  }).addTo(map);