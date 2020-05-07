

export const displayMap = (locations) => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiZGV2ZnJpdHoiLCJhIjoiY2s5OGtuZW9uMG5saTNsbGV3Y2RpdzR2eCJ9.h-Ew8dJiIJyq4AfE5k6ZDg';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/devfritz/ck98l6ad9009s1ik61fihxiga',
    scrollZoom:false
    // center: [-118.113491, 34.111745],
    // zoom:8,
    // interactive:false
});

const bounds = new mapboxgl.LngLatBounds();

locations.forEach(loc => {
    // Add marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
        element:el,
        anchor:'bottom'
    }).setLngLat(loc.coordinates).addTo(map);

    //  Add group
     new mapboxgl.Popup({
         offset:30
     })
     .setLngLat(loc.coordinates)
     .setHTML(`<p> Day ${loc.day}: ${loc.description}</p>`)
    .addTo(map);
    
    //  extend map bounds to include current location
    bounds.extend(loc.coordinates);
});


 map.fitBounds(bounds, {
     padding:{
          top:200,
          bottom:150,
          left: 100,
          right: 100 
       } 
 });
}

