import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import droneIconUrl from '../assets/drone_icon.png';

let map;
let poiMarker = null;
let droneMarker = null;
let droneLatLng = L.latLng(37.7739, -122.4312); // Initial position near SF
let droneMoveInterval = null;
const log = document.getElementById('mission-log');



export function initMap() {
    map = L.map('map').setView([37.7749, -122.4194], 13); // SF placeholder
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    console.log('Map loaded')
    const missionControls = document.getElementById('mission-controls');
    const poiCoordsDisplay = document.getElementById('poi-coords');
    const startMissionBtn = document.getElementById('start-mission');
    const missionTypeSelect = document.getElementById('mission-type');

    // Map click handler: select POI
    map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        if (poiMarker) {
            poiMarker.setLatLng([lat, lng]);
        } else {
            poiMarker = L.marker([lat, lng]).addTo(map);
        }

        poiCoordsDisplay.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        missionControls.classList.remove('hidden');
        startMissionBtn.disabled = missionTypeSelect.value === "";
    });

    // Enable button only if POI and mission are both selected
    missionTypeSelect.addEventListener('change', () => {
        startMissionBtn.disabled = !poiMarker || missionTypeSelect.value === "";
    });

    startMissionBtn.addEventListener('click', () => {
        if (!poiMarker) return;

        const missionType = missionTypeSelect.value;
        const coords = poiMarker.getLatLng();
        map.flyTo(coords, 18, { animate: true, duration: 1 });


        log.innerHTML += `<div class="log-event">🚀 Starting mission: ${missionType}, at ${coords}</div>`
        log.scrollTop = log.scrollHeight;
        if (missionType === 'orbit') {
            orbitMission(coords)
        }
        if (missionType === 'double-grid-photo'){
            startDoubleGridMission([coords.lat, coords.lng])
        }
        if (missionType === 'grid-photo'){
            startSerpentineMission([coords.lat, coords.lng])
        }


    });
}


function orbitMission(poi, radius = 50, points = 12, interval = 1000) {
    const waypoints = [];
    const angleStep = 360 / points;

    const droneMarker = L.marker(droneLatLng, {
        icon: L.icon({
            iconUrl: droneIconUrl, // drone-icon.png
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -20]
        })
    }).addTo(map);

    // Generate waypoints around the POI in a circle
    for (let i = 0; i < 360; i += angleStep) {
        const angleRad = (i * Math.PI) / 180;
        const lat = poi.lat + (radius / 111111) * Math.cos(angleRad); // 111,111m per degree
        const lng = poi.lng + (radius / (111111 * Math.cos(poi.lat * Math.PI / 180))) * Math.sin(angleRad);
        waypoints.push([lat, lng]);
    }


    // Draw the path for visualization
    L.polyline(waypoints, { color: 'blue', dashArray: '4' }).addTo(map);

    // Log
    log.innerHTML = '<div class="log-event">🛰 Orbit Mission Start</div>';
    log.scrollTop = log.scrollHeight;

    let i = 0;
    function moveDrone() {
        if (i >= waypoints.length) {
            log.innerHTML += `<div class="log-event">✅ Orbit Mission Complete</div>`;
            log.scrollTop = log.scrollHeight;
            return;
        }

        const [lat, lng] = waypoints[i];
        droneMarker.setLatLng([lat, lng]);
        log.innerHTML += `<div class="log-event">📸 Photo captured at ${lat.toFixed(5)}, ${lng.toFixed(5)}</div>`;
        log.scrollTop = log.scrollHeight;
        L.circleMarker([lat, lng], {
            radius: 4,
            color: 'yellow',
            fillOpacity: 0.6
        }).addTo(map);

        i++;
        setTimeout(moveDrone, interval);
    }

    moveDrone();
}


function generateSerpentineGrid(center, width, height, rows, cols, rotate = false) {
    const lat = center[0];
    const lng = center[1];
    // Convert meters to degrees
    const latMeter = 1 / 111111;
    const lngMeter = 1 / (111111 * Math.cos(lat * Math.PI / 180));

    let grid = [];

    for (let i = 0; i < rows; i++) {
        let row = [];

        for (let j = 0; j < cols; j++) {
            let offsetLat = (i * height / rows) * latMeter;
            let offsetLng = (j * width / cols) * lngMeter;

            let pointLat, pointLng;

            if (!rotate) {
                pointLat = lat + offsetLat;
                pointLng = lng + offsetLng;
            } else {
                pointLat = lat + offsetLng; // swap axis
                pointLng = lng + offsetLat;
            }

            row.push([pointLat, pointLng]);
        }

        // serpentine: reverse alternate rows
        if (i % 2 !== 0) row.reverse();

        grid.push(...row);
    }

    return grid;
}


async function startDoubleGridMission(center) {
    const grid1 = generateSerpentineGrid(center, 60, 60, 4, 4);
    const grid2 = generateSerpentineGrid(center, 60, 60, 4, 4, true)
        .map(([lat, lng]) => [lat + 0.0001, lng + 0.0001]); // slight offset
    const pathPolyline = L.polyline([], { color: 'cyan', weight: 3 }).addTo(map);
    const mission = [...grid1, ...grid2];
    const droneMarker = L.marker(droneLatLng, {
        icon: L.icon({
            iconUrl: droneIconUrl, // drone-icon.png
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -20]
        })
    }).addTo(map);
    droneMarker.setLatLng(droneLatLng);

    await animateMissionPath(mission,pathPolyline);
    droneMarker.remove()
    log.innerHTML += "<div class='log-event'>✅ Double-grid mission complete!</div>";
    log.scrollTop = log.scrollHeight;

    async function animateMissionPath(path,polyline,index = 0) {
        for (let i = 0; i < path.length; i++) {
            const [lat, lng] = path[i];
            const nextPoint = path[index];
            polyline.addLatLng(nextPoint);
            index += 1
            if (index > 16){
                polyline = L.polyline([], { color: 'orange', weight: 3 }).addTo(map);
                polyline.addLatLng(nextPoint);
            }
            L.circleMarker([lat, lng], {
                radius: 4,
                color: 'yellow',
                fillOpacity: 0.6
            }).addTo(map);

            if(droneMarker){
                droneMarker.setLatLng([lat, lng]);
            }

            log.innerHTML += `<div class="log-event">📸 Photo taken at ${lat.toFixed(5)}, ${lng.toFixed(5)}</div>`;
            log.scrollTop = log.scrollHeight;
            await delay(1000);
        }
    }
}
async function startSerpentineMission(center) {
    const grid = generateSerpentineGrid(center, 60, 60, 4, 6); // 4 rows, 6 cols

    const gridLine = L.polyline(grid, {
        color: 'cyan',
        weight: 3,
        opacity: 0.8,
        dashArray: '6, 6'
    }).addTo(map);


    if (!window.droneMarker) {
        const droneIcon = L.icon({
            iconUrl: droneIconUrl,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
        });
        window.droneMarker = L.marker(grid[0], { icon: droneIcon }).addTo(map);
    }

    // Fly the grid
    for (let i = 0; i < grid.length; i++) {
        const [lat, lng] = grid[i];
        window.droneMarker.setLatLng([lat, lng]);

        // Simulate photo capture
        L.circleMarker([lat, lng], {
            radius: 4,
            color: 'yellow',
            fillOpacity: 0.6
        }).addTo(map);

        log.innerHTML += `<div class='log-event'>📸 Photo ${i + 1} at ${lat.toFixed(5)}, ${lng.toFixed(5)}</div>`;
        log.scrollTop = log.scrollHeight;

        await delay(1000);
    }

    log.innerHTML += "<div class='log-event'>✅ Serpentine 2D mission complete.</div>";
    log.scrollTop = log.scrollHeight;

}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}