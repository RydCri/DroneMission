export async function showProfileModal() {
    const res = await fetch('/api/profile');
    if (res.ok) {
        const data = await res.json();
        document.getElementById('user-email').innerText = data.email;
        const flightsEl = document.getElementById('user-flights');
        flightsEl.innerHTML = '';

        data.flights.forEach(f => {
            const li = document.createElement('li');
            li.innerHTML = `${f.title} - <a href="${f.glbPath}">Model</a> | <a href="${f.ndviPath}">NDVI</a>`;
            flightsEl.appendChild(li);
        });

        document.getElementById('profile-modal').classList.remove('hidden');
    }
}
