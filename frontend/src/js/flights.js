async function fetchUserFlights() {
    try {
        const res = await fetch('http://localhost:5000/api/flights/user', {
            credentials: 'include'
        });
        if (res.ok) {
            const data = await res.json();
            populateFlights(data.flights);
        }
    } catch (err) {
        console.error('Error fetching flights:', err);
    }
}

async function loadFlights() {
    const res = await fetch('http://127.0.0.1:5000/api/flights/user');
    const flights = await res.json();
    const flightList = document.getElementById('flight-list');
    flightList.innerHTML = '';

    flights.forEach(flight => {
        const div = document.createElement('div');
        div.className = 'flight-card';
        div.innerHTML = `
      <h4>${flight.title}</h4>
      <img src="${flight.ndviPath}" alt="NDVI preview" width="200" />
      <p>
        <button onclick="viewFlight('${flight.glbPath}')">View</button>
        <button onclick="deleteFlight(${flight.id})">Delete</button>
      </p>
    `;
        flightList.appendChild(div);
    });
}

function viewFlight(glbPath) {
    init(glbPath);
}

async function deleteFlight(id) {
    if (!confirm("Delete this flight?")) return;

    const res = await fetch(`http://127.0.0.1:5000/api/flights/${id}`, { method: 'DELETE' });
    if (res.ok) {
        alert('Flight deleted');
        loadFlights();
    } else {
        alert('Failed to delete flight');
    }
}

function populateFlights(flights) {
    flightList.innerHTML = '';
    flights.forEach(flight => {
        flightList.innerHTML += `
      <li class="flex items-center space-x-2">
        <img src="${flight.ndvi_path}" alt="ndvi" class="w-10 h-10 object-cover rounded">
        <span>${flight.title}</span>
      </li>
    `;
    });
}


export function setupFlights() {
    console.log('Fetching Page Flights (Not Setup)')
    fetch('http://127.0.0.1:5000/api/flights/', {
        method: 'GET',
        credentials: 'include'})
        .then(res => res.json())
        .then(data => {
            const missions = document.getElementById('missions');
            data.forEach(flight => {
                missions.innerHTML += `<option>${flight.title}</option>`;
            });
        });
}


