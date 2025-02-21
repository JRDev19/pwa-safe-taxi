import '@maptiler/sdk/dist/maptiler-sdk.css';
import './style.css';
import { config, Map, GeolocateControl, Marker, Popup } from '@maptiler/sdk';
import axios from 'axios';

document.addEventListener('DOMContentLoaded', () => {
  const inputCost = document.querySelector('#costInput');

  function init() {
    const container = document.getElementById('app');
    let startCoords = [];
    let endCoords = [];
    let first = true;
    var endMarker = new Marker({
        draggable: true,
        color: '#e80401'
    });
  
    if (!container) throw new Error('There is no div with the id: "map" ');
    
    //Mostrar el mapa en la pantalla
    config.apiKey = 'ZAeS0BkqUR2nTaRbBgBY';
    const map = new Map({
        container,
        zoom: 14
    });

    //Utilizamos la clase Geolocate, para obtener la ubicación del usaurio
    const geolocate = new GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserLocation: false
    });

    //Añadir el control geolocate
    map.addControl(geolocate);
    
    //Al cargar realizar la localización
    map.on('load', function(){
        geolocate.trigger();
    })

    //Centra el mapa en la ubicación del usuario
    geolocate.on('geolocate', function(e){
        if(first){
            //Obtener el valor de la longitud y latitud
            const {longitude, latitude} = e.coords;
            //Mostrar el marcador en las coordenadas
            startMarker.setLngLat([longitude, latitude]);
            startMarker.addTo(map);
            startCoords = [longitude, latitude];
            console.log(startCoords)
            first = false;
        }
    })

    //Crea el marcador en la ubicación del usuario
    var startMarker = new Marker({
        draggable: true,
        color: '#43e801'
    });

    //Actualizar información al mover el marcador inicial
    function onDragEndMarkerStart(){
        const {lng, lat} = startMarker.getLngLat();
        startCoords = [lng, lat];
        if(endCoords.length === 0) return;
        getCost(startCoords, endCoords);
        updateRoute(startCoords, endCoords);
    }
    
    //Esperar al evento cuando se deja de arrartrar el punto de inicio
    startMarker.on('dragend', onDragEndMarkerStart);

    //Crear el marcador en la ubicación final
    map.on('click', function(e){
        const {lng, lat} = e?.lngLat;
        endCoords = [lng, lat];
        
        //Actualizar la ubicación del marcador final
        endMarker.setLngLat(endCoords);
        endMarker.addTo(map);
        getCost(startCoords, endCoords);
        updateRoute(startCoords, endCoords);
    });

    //Actualizar información al mover el marcador final
    function onDragEndMarkerEnd(){
        const {lng, lat} = endMarker.getLngLat();
        endCoords = [lng, lat];
        getCost(startCoords, endCoords);
        console.log(endCoords)
        updateRoute(startCoords, endCoords);
    }

    //Esperar al evento cuando se deja de arrartrar el punto de fin
    endMarker.on('dragend', onDragEndMarkerEnd);

    //Crear el pop-up para instrucciones
    // const markerHeight = 50, markerRadius = 10, linearOffset = 25;
    // const popupOffsets = {
    //     'top': [0, 0],
    //     'top-left': [0,0],
    //     'top-right': [0,0],
    //     'bottom': [0, -markerHeight],
    //     'bottom-left': [linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
    //     'bottom-right': [-linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
    //     'left': [markerRadius, (markerHeight - markerRadius) * -1],
    //     'right': [-markerRadius, (markerHeight - markerRadius) * -1]
    // };
    // const popupStart = new Popup({offset: popupOffsets, className: 'my-class'})
    //     .setLngLat([-88.293144, 18.514768])
    //     .setHTML("Arrastrame")
    //     .setMaxWidth("300px")
    //     .addTo(map);

    //Obtener ruta
    async function getRoute(start, end) {
        let osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson`;
    
        return fetch(osrmUrl)
            .then(response => response.json())
            .then(data => data.routes[0].geometry.coordinates);
    }

    //Funcion para actualizar la ruta
    function updateRoute(start, end){
        getRoute(start, end).then(routeCoordinates => {
            if (map.getSource('route')) {
                // Si ya existe la ruta, actualiza los datos
                map.getSource('route').setData({
                    'type': 'Feature',
                    'properties': {},
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': routeCoordinates
                    }
                });
            } else {
                // Si no existe, añade la ruta al mapa
                map.addSource('route', {
                    'type': 'geojson',
                    'data': {
                        'type': 'Feature',
                        'properties': {},
                        'geometry': {
                            'type': 'LineString',
                            'coordinates': routeCoordinates
                        }
                    }
                });

                map.addLayer({
                    'id': 'route',
                    'type': 'line',
                    'source': 'route',
                    'layout': {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    'paint': {
                        'line-color': '#0197e8',
                        'line-width': 5
                    }
                });
            }
        });
    }
  }

  async function getCost(firstPoints, secondPoints){
    try {
        let response = await axios.get('http://safe-taxi-web-app.test/api/getCost', {
            params: {
                "coords_starter_zone": [firstPoints[1], firstPoints[0]],
                "coords_finish_zone": [secondPoints[1], secondPoints[0]]
            }
        });
        response = response.data.cost;
        console.log(response)
        inputCost.value = response || 'Costo no registrado';
      } catch (error) {
        alert('Ocurrio un error!, recarga la página');
        console.error(error);
      }
  }
  
  init();
})