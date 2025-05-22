import { Loader } from "@googlemaps/js-api-loader";
let markers;

const loader = new Loader({
    apiKey: import.meta.env.VITE_MAPS_API_KEY,
    version: "weekly",
    libraries: ["places"],
});

let mapResolve;
const mapPromise = new Promise((resolve) => {
    mapResolve = resolve;
});
loader.importLibrary("maps").then(async () => {
    const { Map } = await google.maps.importLibrary("maps");

    const mapInstance = new Map(document.getElementById("map"), {
        center: { lat: 37.7749, lng: -122.4194 },
        zoom: 14,
        mapTypeId: 'satellite',
        mapTypeControl: false,
        fullscreenControl: true,
        streetViewControl: false,
    });

    initMapControls(mapInstance); // pass initMapControls
    mapResolve(mapInstance); // Resolve after init
});


function initMapControls(map) {
    const controlDiv = document.createElement("div");
    controlDiv.className = "p-2 space-y-2";
    const wpUI = document.createElement("div");
    wpUI.className = "p-2 space-y-2";

    // Map/Satellite Toggle
    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = "🗺 Map View";
    toggleBtn.className = "px-3 py-1 bg-blue-500 text-white tx-shadow-sm rounded hover:bg-blue-600 text-sm active:border hover:cursor-pointer w-40";

    toggleBtn.addEventListener("click", () => {
        const current = map.getMapTypeId();
        if (current === "roadmap") {
            map.setMapTypeId("satellite");
            toggleBtn.textContent = "🗺 Map View";
        } else {
            map.setMapTypeId("roadmap");
            toggleBtn.textContent = "🛰 Satellite View";
        }
    });

    // 📍 My Location Button
    const mylocationBtn = document.createElement("button");
    mylocationBtn.textContent = "📍 My Location";
    mylocationBtn.className = "px-3 py-1 bg-blue-500 text-white tx-shadow-sm rounded hover:bg-blue-600 active:border text-sm hover:cursor-pointer w-40";

    mylocationBtn.addEventListener("click", () => {
        if (navigator.geolocation) {
            console.log('Getting Location...')
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };

                    map.setCenter(pos);
                    map.setZoom(17);

                    new google.maps.Marker({
                        position: pos,
                        map,
                        title: "You are here",
                    });
                },
                () => {
                    alert("Geolocation failed or was denied.");
                }
            );
        } else {
            alert("Your browser doesn't support geolocation.");
        }
    });

    let placesService;



    function performSearch(query) {
        placesService = new google.maps.places.PlacesService(map);
        const request = {
            query: query,
            location: map.getCenter(),
            radius: 10000,
        };


        placesService.textSearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                displayResults(results);
            } else {
                console.error('Places API Error:', status);
                document.getElementById('results').innerHTML = 'Error fetching results.';
            }
        });
    }

    function displayResults(places) {
        resultsUI.innerHTML = ''; // Clear previous results
        markers = []; // Clear the markers array

        if (places && places.length > 0) {
            places.forEach((place) => {
                const placeElement = document.createElement('div');
                placeElement.classList.add('result-item'); // Add a class for styling and event listener

                placeElement.innerHTML = `<div class="cursor-pointer hover:bg-blue-400 hover:text-white"><span>${place.name}</span><br>${place.formatted_address || 'No address available'}}</div>`;
                resultsUI.appendChild(placeElement);

                const marker = new google.maps.Marker({
                    map: map,
                    position: place.geometry.location,
                    title: place.name,
                });
                markers.push(marker);

                placeElement.addEventListener('click', () => {
                    map.panTo(place.geometry.location);
                    map.setZoom(15);
                });
            });
        } else {
            resultsContainer.innerHTML = 'No results found.';
        }
    }

// function clearMarkers() {
//     markers.forEach(marker => {
//         marker.setMap(null); // Remove marker from the map
//     });
//     markers = []; // Clear the markers array
// }

    let userPath = null;
    let pathCoords = [];
    let watchId = null;
    let userMarker = null;

    const liveTrackBtn = document.createElement("button");
    liveTrackBtn.textContent = "📡 Start Tracking";
    liveTrackBtn.className = "px-3 py-1 text-white rounded bg-[rgb(0,0,0)]/50 hover:bg-[rgb(0,0,0)]/60 active:border text-sm hover:cursor-pointer";

    function startTracking(map) {
        if (watchId) return;

        watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const userLatLng = { lat: latitude, lng: longitude };

                // Place or move the marker
                if (!userMarker) {
                    userMarker = new google.maps.Marker({
                        position: userLatLng,
                        map,
                        title: "Your Location",
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 6,
                            fillColor: "#00f",
                            fillOpacity: 0.8,
                            strokeWeight: 2,
                            strokeColor: "#fff",
                        },
                    });
                } else {
                    userMarker.setPosition(userLatLng);
                }

                // Append to POI
                pathCoords.push(userLatLng);

                // Draw polyline
                if (!userPath) {
                    userPath = new google.maps.Polyline({
                        path: pathCoords,
                        geodesic: true,
                        strokeColor: "#00f",
                        strokeOpacity: 0.7,
                        strokeWeight: 3,
                        map,
                    });
                } else {
                    userPath.setPath(pathCoords);
                }

                map.panTo(userLatLng);
            },
            (err) => console.error("Tracking error:", err),
            {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 20000,
            }
        );

        liveTrackBtn.textContent = "🛑 Stop Tracking";
        liveTrackBtn.classList.replace("bg-green-500", "bg-red-500");
    }

    function stopTracking() {
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }

        if (userMarker) {
            userMarker.setMap(null);
            userMarker = null;
        }

        if (userPath) {
            userPath.setMap(null);
            userPath = null;
        }

        pathCoords = [];

        liveTrackBtn.textContent = "📡 Start Tracking";
        liveTrackBtn.classList.replace("bg-red-500", "bg-green-500");
    }

    liveTrackBtn.addEventListener("click", () => {
        if (!watchId) {
            getMap().then((map) => startTracking(map));
        } else {
            stopTracking();
        }
    });


    const searchUI = document.createElement('div')
    searchUI.classList.add('bg-[rgb(255,255,255)]/90', 'p-4', 'text-black')
    const searchBtn = document.createElement('button')
    searchBtn.classList.add('bg-blue-500', 'hover:bg-blue-600','rounded', 'p-2', 'mx-1', 'text-white', 'cursor-pointer')
    searchBtn.textContent = 'Search'
    const resultsUI = document.createElement('div')
    resultsUI.classList.add('overflow-y-scroll', 'h-20', 'z-50')
    const searchInput = document.createElement('input')
    searchInput.type = 'text'
    searchInput.placeholder = 'Search for places'
    searchInput.classList.add('font-medium', 'p-1')
    searchUI.append(searchInput,searchBtn,resultsUI)
    const missionBtn = document.createElement('button')
    const missionUI = document.getElementById('mission-controls')
    missionBtn.textContent = 'Build Mission ⇕ '
    missionBtn.className = "px-3 py-1 bg-[rgb(0,0,0)]/60 hover:bg-[rgb(0,0,0)]/80 text-white active:border rounded text-sm hover:cursor-pointer";
    missionBtn.id = 'mission-toggle'
    const wpTree = document.getElementById('waypointTreeWrapper')
    const wpTreeToggle = document.createElement('button')
    wpTreeToggle.textContent = 'Waypoints ⇕ '
    wpTreeToggle.className = "px-3 py-1 bg-[rgb(0,0,0)]/60 hover:bg-[rgb(0,0,0)]/80 text-white active:border rounded shadow text-sm hover:cursor-pointer";
    wpTreeToggle.id = 'mission-toggle'



    // Append buttons
    controlDiv.appendChild(toggleBtn);
    controlDiv.appendChild(mylocationBtn);
    controlDiv.appendChild(liveTrackBtn);
    wpUI.appendChild(missionBtn);
    wpUI.appendChild(wpTreeToggle);
    wpUI.appendChild(searchUI);
    missionBtn.addEventListener('click', () => {
        missionUI.classList.toggle('-translate-x-full')
    });
    wpTreeToggle.addEventListener('click', () => {
        wpTree.classList.toggle('-translate-x-full')
    });
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value;
        if (query) {
            // clearMarkers(); // Clear previous markers
            performSearch(query);
        }
    })

    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(wpUI);

}

let mapInstance = null;

export async function getMap() {
    return mapPromise;
}
