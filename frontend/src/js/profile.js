import {ModalManager} from "./modal.js";
import {checkLoginStatus} from "./auth.js";

async function loadProfile() {
    console.log('Fetching User Flights');

    const res = await fetch('http://127.0.0.1:5000/api/flights/user', {
        method: 'GET',
        credentials: 'include'
    });

    if (!res.ok) return alert('Failed to load flights.');

    const { flights } = await res.json();
    const profileList = document.getElementById('flight-modal-content');
    if(!profileList){
        console.log("profileList NULL")
    }
    profileList.innerHTML = ''
    profileList.innerHTML += `<div class="flex flex-row"><button class="close-button basis-32" data-modal-target="flight-modal">✖</button> <h2 id="user-flights" class="basis-150 text-xl font-semibold mb-4"></h2></div>`
    const uploadDiv = document.createElement('div')
    uploadDiv.innerHTML = `<button id="upload-flight-button" class="mt-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 cursor-pointer">Upload New Flight</button>`
    flights.forEach(f => {
        const flightItem = document.createElement('div');
        flightItem.classList.add('profile-flight');

        flightItem.innerHTML = `
            <div class="flight-info">
                <img class="thumbnail" src="${f.ndviPath}" alt="${f.title} thumbnail">
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

        profileList.append(flightItem);
    });
    profileList.appendChild(uploadDiv)
    const uploadBtn = document.getElementById('upload-flight-button');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            ModalManager.toggle('upload-modal')
        });
    }
    const userFlights = document.getElementById('user-flights')
    if(!userFlights) return;

    await checkLoginStatus()


}


export function setupProfile() {
    document.addEventListener('user-logged-in', () => {
        console.log('Profile fetched')
        loadProfile();
    });

    const profileBtn = document.getElementById('profile-button');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            ModalManager.toggle('profile-modal')
        });
    }


    const flightBtn = document.getElementById('flight-button');
    if (flightBtn) {
        flightBtn.addEventListener('click', () => {
            ModalManager.toggle('flight-modal')
            console.log('Flight btn clicka')
        });
    }



// Edit button
    document.querySelectorAll('.edit-flight').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const currentTitle = btn.closest('.profile-flight').querySelector('.flight-title').innerText;
            const newTitle = prompt('Enter a new title for the flight:', currentTitle);
            if (!newTitle || newTitle === currentTitle) return;

            const res = await fetch(`http://127.0.0.1:5000/api/flights/${id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: newTitle })
            });

            if (res.ok) {
                loadProfile(); // Refresh
            } else {
                alert('Failed to update flight');
            }
        });
    });

    // Profile Modal Dropdowns

    document.addEventListener('click', async (e) => {
        // Close all dropdowns if clicking outside
        document.querySelectorAll('.dropdown').forEach(d => {
            if (!d.contains(e.target)) d.classList.remove('show');
        });

        // Toggle this dropdown if clicked
        if (e.target.classList.contains('dropdown-toggle')) {
            const dropdown = e.target.closest('.dropdown');
            dropdown.classList.toggle('show');
        }

        // Handle edit/delete (stubs for now)
        if (e.target.classList.contains('edit-flight')) {
            const id = getFlightIdFromElement(e.target);
            console.log('Edit flight', id);
        }
        if (e.target.classList.contains('delete-flight')) {
            const id = getFlightIdFromElement(e.target);
            const confirmed = confirm('Are you sure you want to delete this flight?');
            if (!confirmed) return;

            try {
                const res = await fetch(`http://127.0.0.1:5000/api/flights/${id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });

                if (res.ok) {
                    loadProfile();
                } else {
                    alert('Failed to delete flight.');
                }
            } catch (err) {
                console.error('Delete failed:', err);
                alert('Something went wrong while deleting.');
            }
        }
    });

    function getFlightIdFromElement(el) {
        const card = el.closest('.profile-flight');
        const meta = card.querySelector('.flight-meta');
        return meta?.textContent?.match(/\d+/)?.[0];
    }

    // Edit Flight Confirm Modal

    document.querySelectorAll('.edit-flight').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const currentTitle = btn.closest('.profile-flight').querySelector('.flight-title').innerText;
            document.getElementById('edit-title').value = currentTitle;
            document.getElementById('edit-id').value = id;
            ModalManager.show('edit-modal');
        });
    });

    // Submit Edit

    document.getElementById('edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newTitle = document.getElementById('edit-title').value;
        const id = document.getElementById('edit-id').value;

        const res = await fetch(`http://127.0.0.1:5000/api/flights/${id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle })
        });

        if (res.ok) {
            ModalManager.hide('edit-modal');
            await loadProfile();
        } else {
            alert('Update failed');
        }
    });


}

export function setupUploadForm() {
    const uploadForm = document.getElementById('upload-form');

    if (!uploadForm) return;

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(uploadForm);

        const res = await fetch('http://127.0.0.1:5000/api/flights/upload', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        if (res.ok) {
            alert('Flight uploaded successfully!');
            ModalManager.hide('upload-modal');
            uploadForm.reset();
            await loadProfile();
        } else {
            alert('Upload failed.');
        }
    });
}