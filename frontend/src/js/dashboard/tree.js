import {missions, openWaypointEditor} from "./missionBuilder.js";
import { waypoints} from "./missionBuilder.js";
import { getMap } from "./map.js";
import {ModalManager} from "../modal.js";


const backend = 'http://127.0.0.1:5000'

export function closeWaypointEditor() {
    document.getElementById("waypointEditor").classList.add("hidden");
}

// Batch editor
export function openBatchEditor(missionIndex) {
    const editor = document.getElementById("batchEditor");
    editor.classList.remove("hidden");

    const form = document.getElementById("batchEditForm");
    form.onsubmit = (e) => {
        e.preventDefault();

        const alt = document.getElementById("batch-altitude").value;
        const poiAlt = document.getElementById('batch-poi-altitude').value;
        const speed = document.getElementById("batch-speed").value;
        const action = document.getElementById("batch-action").value;

        missions[missionIndex].waypoints.forEach(wp => {
            if (alt) wp.meta.altitude = parseFloat(alt);
            if (poiAlt) wp.meta.poiAlt = parseFloat(alt);
            if (speed) wp.meta.speed = parseFloat(speed);
            if (action) wp.meta.action = action;
        });

        editor.classList.add("hidden");
        renderMissionTree();
    };
}

export function closeBatchEditor() {
    document.getElementById("batchEditor").classList.add("hidden");
}

// Download KML
function downloadKML(mission) {
    const kmlContent = generateKML(mission);
    const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mission.name || 'mission'}.kml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


// Export to JSON
export function exportMissionJSON(download=null) {
    const cleanedMissions = missions.map((mission) => ({
        ...mission,
        waypoints: mission.waypoints.map(({ position, meta }) => ({
            position,
            meta,
        })),
    }));

    const blob = new Blob([JSON.stringify(cleanedMissions, null, 2)], {
        type: "application/json",
    });
    if (download) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "missions.json";
        link.click();
        URL.revokeObjectURL(url);
    } else {
        return blob;
    }
}

// TODO: camera and bearing logic for pan flight
export function generateKML(mission) {
    const { name, poi, waypoints = [], altitudeMode = 'relativeToGround' } = mission;

    function getCameraParams(wp, poi) {
        const toRadians = deg => deg * Math.PI / 180;
        const toDegrees = rad => rad * 180 / Math.PI;

        // Defensive parse
        const lat1 = parseFloat(wp.lat);
        const lon1 = parseFloat(wp.lon);
        const alt1 = parseFloat(wp.alt);

        const lat2 = parseFloat(poi.lat);
        const lon2 = parseFloat(poi.lon);
        const alt2 = parseFloat(poi.alt);

        if (
            [lat1, lon1, alt1, lat2, lon2, alt2].some(val => isNaN(val))
        ) {
            console.warn("Invalid coordinates or altitudes in getCameraParams", {
                wp, poi
            });
            return { tilt: 90, heading: 0 }; // fallback
        }

        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
        const dAlt = alt2 - alt1;

        const R = 6371000; // meters
        const x = dLon * Math.cos(toRadians((lat1 + lat2) / 2));
        const horizontalDist = R * Math.sqrt(dLat ** 2 + x ** 2);

        const tilt = toDegrees(Math.atan2(horizontalDist, -dAlt)); // camera tilt down
        const heading = getBearing(lat1, lon1, lat2, lon2);

        return { tilt, heading };
    }


    function getBearing(lat1, lon1, lat2, lon2) {
        const toRad = x => x * Math.PI / 180;
        const toDeg = x => x * 180 / Math.PI;

        const dLon = toRad(lon2 - lon1);
        const y = Math.sin(dLon) * Math.cos(toRad(lat2));
        const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
        return (toDeg(Math.atan2(y, x)) + 360) % 360;
    }
    const kml = [];
    kml.push(`<?xml version="1.0" encoding="UTF-8"?>`);
    kml.push(`<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2">`);
    kml.push(`<Document>`);
    kml.push(`<name>${name}</name>`);

    // Flight path line
    kml.push(`<Placemark><name>Flight Path</name><LineString>`);
    kml.push(`<altitudeMode>${altitudeMode}</altitudeMode>`);
    kml.push(`<coordinates>`);
    waypoints.forEach(wp => {
        const alt = wp.meta.altitude ?? 30;
        kml.push(`${wp.position.lng},${wp.position.lat},${alt}`);
    });
    kml.push(`</coordinates></LineString></Placemark>`);

    // Per waypoint camera + data
    waypoints.forEach((wp, idx) => {
        const wpLat = wp.position.lat;
        const wpLng = wp.position.lng;
        const wpAlt = wp.meta?.altitude ?? 30;

        const poiWithAlt = {
            lat: poi.lat,
            lon: poi.lon,
            alt: wp.meta.poiAlt ?? 1
        };


        const wpFull = {
            lat: wpLat,
            lon: wpLng,
            alt: wpAlt
        };

        const { tilt, heading } = getCameraParams(wpFull, poiWithAlt);
        const speed = wp.meta?.speed ?? mission.speed ?? 5;
        const gimbalPitch = tilt;
        const action = wp.meta?.action ?? 'None';

        kml.push(`<Placemark><name>Waypoint ${idx + 1}</name>`);
        kml.push(`
        <Camera>
          <longitude>${wpLng}</longitude>
          <latitude>${wpLat}</latitude>
          <altitude>${wpAlt}</altitude>
          <altitudeMode>${altitudeMode}</altitudeMode>
          <tilt>${tilt.toFixed(2)}</tilt>
          <heading>${heading.toFixed(2)}</heading>
        </Camera>`);

        kml.push(`<ExtendedData>
            <Data name="speed"><value>${speed}</value></Data>
            <Data name="gimbalPitch"><value>${gimbalPitch.toFixed(2)}</value></Data>
            <Data name="action"><value>${action}</value></Data>
        </ExtendedData>`);

        kml.push(`<Point><coordinates>${wpLng},${wpLat},${wpAlt}</coordinates></Point>`);
        kml.push(`</Placemark>`);
    });

    // Optional gx:Tour
    kml.push(`<gx:Tour><name>${name} Tour</name><gx:Playlist>`);
    waypoints.forEach((wp, idx) => {
        const wpLat = wp.position.lat;
        const wpLng = wp.position.lng;
        const wpAlt = wp.meta?.altitude ?? 30;

        const poiWithAlt = {
            ...poi,
            alt: poi.alt ?? 0
        };

        const wpFull = {
            lat: wpLat,
            lon: wpLng,
            alt: wpAlt
        };

        const { tilt, heading } = getCameraParams(wpFull, poiWithAlt);

        kml.push(`<gx:FlyTo><gx:duration>1.2</gx:duration><gx:flyToMode>smooth</gx:flyToMode>
        <Camera>
          <longitude>${wpLng}</longitude>
          <latitude>${wpLat}</latitude>
          <altitude>${wpAlt}</altitude>
          <altitudeMode>${altitudeMode}</altitudeMode>
          <tilt>${tilt.toFixed(2)}</tilt>
          <heading>${heading.toFixed(2)}</heading>
        </Camera></gx:FlyTo>`);
    });
    kml.push(`</gx:Playlist></gx:Tour>`);

    kml.push(`</Document></kml>`);
    return kml.join('\n');
}



export function addMissionToTree(mission) {
    let currentFlightId = mission.id
    const tree = document.getElementById("missionList");

    const rightSide = document.createElement("div");
    rightSide.classList.add("space-x-2");

    const batchBtn = document.createElement("button");
    batchBtn.textContent = "Batch Edit";
    batchBtn.classList.add("text-xs", "bg-gray-300", "rounded", "px-2", "py-0.5");
    batchBtn.onclick = () => openBatchEditor(mission);

    const downloadBtn = document.createElement("button");
    downloadBtn.textContent = "Download KML";
    downloadBtn.classList.add("text-xs", "bg-blue-500", "text-white", "rounded", "px-2", "py-0.5","hover:bg-blue-600","cursor-pointer");
    downloadBtn.onclick = () => downloadKML(mission);


    const saveFlightBtn = document.createElement("button");
    saveFlightBtn.textContent = "Save Flight";
    saveFlightBtn.classList.add("text-xs", "bg-blue-500", "text-white", "rounded", "px-2", "py-0.5","hover:bg-blue-600", "cursor-pointer");
    saveFlightBtn.onclick = () => saveFlightData()

    const deleteBtn = document.createElement("button");
    deleteBtn.id = 'deleteMissionTree'
    deleteBtn.textContent = "Delete Mission";
    deleteBtn.classList.add("text-xs", "bg-red-500", "text-white", "rounded", "px-2", "py-0.5","hover:bg-red-600", "cursor-pointer");
    deleteBtn.onclick = () => tree.removeChild(missionNode);
    deleteBtn.addEventListener('click', () => {
        getMap().then((map) => {
            mission.markers.forEach(m => m.setMap(null));
            mission.markers.length = 0;
        });
    });


    rightSide.appendChild(batchBtn);
    rightSide.appendChild(downloadBtn);
    rightSide.appendChild(saveFlightBtn);
    rightSide.appendChild(deleteBtn);

    const missionNode = document.createElement("li");
    missionNode.className = "mission-node";

    const summary = document.createElement("summary");
    summary.textContent = `${mission.name} (${mission.type})`;
    summary.className = "cursor-pointer font-bold";

    const details = document.createElement("details");
    details.open = true;
    details.appendChild(summary);

    const childrenList = document.createElement("ul");
    childrenList.className = "pl-4";

    mission.waypoints.forEach((wp, index) => {
        const child = document.createElement("li");
        child.className = "text-sm hover:underline cursor-pointer";
        child.textContent = `Waypoint ${index + 1} - Drone Alt: ${wp.meta.altitude}m - POI Alt: ${wp.meta.poiAlt}m`;

        child.addEventListener("click", () => {
            wp.marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(() => wp.marker.setAnimation(null), 1400);
            wp.marker.getMap().panTo(wp.marker.getPosition());
        });

        childrenList.appendChild(child);
    });

    details.appendChild(childrenList);
    missionNode.appendChild(details);
    missionNode.appendChild(rightSide);
    tree.appendChild(missionNode);
}


async function saveFlightData() {
    const res = await fetch(`${backend}/api/flights/user`, {
        method: 'GET',
        credentials: "include",
    })

    const { flights } = await res.json();
    console.log(flights)


    // flightId, kmlContent, jsonContent
        const flightUI = document.getElementById('flight-list')
        flightUI.innerHTML = '';
        flights.forEach(f => {
            const flightItem = document.createElement('div');
            flightItem.classList.add('profile-flight');

            flightItem.innerHTML = `
            <div class="flight-info">
                <img class="thumbnail" src="${backend}${f.scanPath}" alt="${f.title}">
                <div>
                    <div class="flight-title">${f.title}</div>
                    <div class="flight-meta">ID: ${f.id}</div>
                </div>
            </div>
            <div class="dropdown">
                <button class="dropdown-toggle">⋯</button>
                <div class="dropdown-menu">
                    <button class="edit-flight" data-id="${f.id}">Edit</button>
                    <button class="delete-flight" data-id="${f.id}">Delete</button>
                </div>
            </div>
        `;

            flightUI.append(flightItem);
        });
            ModalManager.toggle(flightUI);
    // const res = await fetch(`${backend}/export/save_flight_data`, {
    //     method: 'POST',
    //     credentials: "include",
    //     headers: {
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({
    //         flight_id: flightId,
    //         kml_content: kmlContent,
    //         json_content: jsonContent
    //     })
    // });
    //
    // const result = await res.json();
    // if (res.ok) {
    //     alert('Flight saved!');
    // } else {
    //     alert(`Error: ${result.error}`);
    // }
}