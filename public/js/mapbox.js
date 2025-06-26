/* eslint-disable */
export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic3BhbG1hbWFzYWJldSIsImEiOiJjbWF5ZmJhZncwOHdtMmtwcDN6MDZ1MTZzIn0.-CkLlEJcweozMFnkXS6KoQ';
  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/spalmamasabeu/cmaygpzkc000i01s12ypv0e3o', // style URL
    scrollZoom: true,
    // zoom: 12,
    // center: [], // starting position [lng, lat]
    // zoom: 9, // starting zoom
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    //create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // add marker
    // new mapboxgl.Marker({
    //   element: el,
    //   anchor: 'bottom',
    // })
    //   .setLngLat(loc.coordinates)
    //   .addTo(map);

    // add popup
    // new mapboxgl.Popup()
    //   .setLngLat(loc.coordinates)
    //   .setHTML(`<p>Day ${loc.day} : ${loc.description}</p>`)
    //   .addTo(map);

    // improve
    const popup = new mapboxgl.Popup({
      offset: 30,
      closeOnClick: false,
    }).setHTML(`<p>Day ${loc.day} : ${loc.description}</p>`);

    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .setPopup(popup)
      .addTo(map);

    // extends map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 200,
      left: 100,
      right: 100,
    },
    maxZoom: 15,
  });
  map.doubleClickZoom.disable();
};
