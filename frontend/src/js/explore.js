let page = 1;
let loading = false;
let hasMore = true;

const container = document.getElementById('flightsContainer');
const spinner = document.getElementById('loadingSpinner');
const searchInput = document.getElementById('searchInput');
const tagInput = document.getElementById('tagInput');

let currentQuery = '';
let currentTag = '';

const backend = 'http://127.0.0.1:5000'

// Load flights
async function loadFlights() {
    if (loading || !hasMore) return;
    loading = true;
    spinner.classList.remove('hidden');
    const res = await fetch(`${backend}/api/flights/explore`)
    if (!res.ok) {
        console.error("Failed to fetch flights.");
        return;
    }
    // const res = await fetch(`${backend}/api/flights/explore?page=${page}&query=${encodeURIComponent(currentQuery)}&tag=${encodeURIComponent(currentTag)}`);
    const data = await res.json();

    data.flights.forEach(flight => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded shadow p-4 cursor-pointer hover:shadow-lg transition';
        card.innerHTML = `
            <h2 class="font-semibold text-lg truncate">${flight.title}</h2>
            <p class="text-sm text-gray-500 mb-2">by ${flight.username}</p>
            <img src="${backend}${flight.scanPath}" alt="${flight.title}" class="rounded mb-2 object-cover h-48 w-full">
            <p class="text-xs text-gray-400">Tags: ${flight.tags.join(', ')}</p>
        `;
        card.addEventListener('click', () => showFlightModal(flight));
        container.appendChild(card);
    });

    hasMore = page < data.totalPages;
    page += 1;
    loading = false;
    spinner.classList.add('hidden');
}

// Infinite scroll
window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
        loadFlights();
    }
});

// Modal logic
function showFlightModal(flight) {
    document.getElementById('flightModal').classList.remove('hidden');
    document.getElementById('flightModalContent').querySelector('h2').innerText = flight.title;
    document.getElementById('flightUser').innerText = flight.username;
    document.getElementById('flightScan').src = backend + flight.scanPath;
    document.getElementById('flightTags').innerText = flight.tags.join(', ');
}

document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('flightModal').classList.add('hidden');
});

// Search
function handleSearch() {
    currentQuery = searchInput.value.trim();
    currentTag = tagInput.value.trim();
    container.innerHTML = '';
    page = 1;
    hasMore = true;
    loadFlights();
}

searchInput.addEventListener('change', handleSearch);
tagInput.addEventListener('change', handleSearch);

// Initial load
loadFlights();
