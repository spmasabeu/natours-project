/* eslint-disable */
const getMapboxAccessToken = async () => {
  const res = await fetch('/api/v1/config');
  if (!res.ok) return '';

  const config = await res.json();
  return config.data.mapboxAccessToken;
};

export const displayMap = async (locations) => {
  mapboxgl.accessToken = await getMapboxAccessToken();
  if (!mapboxgl.accessToken) return;

  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v12', // style URL
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
