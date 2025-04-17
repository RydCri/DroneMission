import {ModalManager} from "./modal.js";
import {checkLoginStatus} from "./auth.js";
import {showToast} from './toast'
import {fetchSession, logoutUser} from "./session.js";

(async () => {
    const session = await fetchSession();
    if (!session) return;

    console.log('User:', session.username, 'ID:', session.user_id);
    // window.currentUserId
})();

const backend = 'http://127.0.0.1:5000'
async function loadUserPins() {
    console.log('Fetching User Pins');

    const res = await fetch(`${backend}/pins/user`, {
        method: 'GET',
        credentials: 'include'
    });

    if (!res.ok) {
        showToast('No User pins.','error');
        return;
    }

    const { pins } = await res.json();
    const pinList = document.getElementById('pin-modal-content');

    if (!pinList) {
        console.warn("pinList NULL");
        return;
    }

    pinList.innerHTML = '';
    pinList.innerHTML += `
        <div class="flex flex-row">
            <button class="close-button basis-32" data-modal-target="pin-modal">✖</button>
            <h2 class="basis-150 text-xl font-semibold mb-4">Your Pins</h2>
        </div>
    `;

    const uploadDiv = document.createElement('div');
    uploadDiv.innerHTML = `
        <button id="upload-pin-button" class="mt-4 w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 cursor-pointer">Publish New Pin</button>
    `;

    if (pins)
    pins.forEach(pin => {
        const pinItem = document.createElement('div');
        pinItem.classList.add('profile-pin');

        // Render the first image if available
        const firstImage = pin.images && pin.images.length > 0 ? `${backend}${pin.images[0]}` : '/user_icon.png';

        pinItem.innerHTML = `
            <div class="pin-info flex items-center space-x-4">
                <img class="w-24 h-24 object-cover rounded" src="${firstImage}" alt="${pin.title}">
                <div class="flex-1">
                    <div class="text-lg font-semibold">${pin.title}</div>
                    <div class="text-sm text-gray-600">${new Date(pin.created_at).toLocaleString()}</div>
                    <div class="text-sm text-gray-500">ID: ${pin.id}</div>
                </div>
            </div>
            <div class="dropdown mt-2">
                <button class="dropdown-toggle">⋯</button>
                <div class="dropdown-menu">
                    <button class="edit-pin" data-id="${pin.id}">Edit</button>
                    <button class="delete-pin" data-id="${pin.id}">Delete</button>
                </div>
            </div>
        `;

        pinList.append(pinItem);
    });

    pinList.appendChild(uploadDiv);
    const uploadPinBtn = document.getElementById('upload-pin-button')
    if (uploadPinBtn) {
        uploadPinBtn.addEventListener('click', () => {
            ModalManager.toggle('profile-modal')
            ModalManager.toggle('pin-modal')
            ModalManager.toggle('pin-upload-modal');
        });
    }

}

async function loadProfile() {
    console.log('Fetching User Flights');

    const res = await fetch(`${backend}/api/flights/user`, {
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

    loadUserPins()
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

    const logoutBtn = document.getElementById('logout-button');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async () => {
                    await logoutUser();
                    showToast('Logged out Successfully, Refreshing...', 'success')

        });
    }

    const flightBtn = document.getElementById('flight-button');
    if (flightBtn) {
        flightBtn.addEventListener('click', () => {
            ModalManager.toggle('flight-modal')
        });
    }

    // If user has pins, show user's pin modal, else 'Your Pins' button shows upload-pin-form
        const pinBtn = document.getElementById('pin-button');
    if (pinBtn) {
        pinBtn.addEventListener('click', () => {
            ModalManager.toggle('pin-modal');
        });
    }



// edit button logic
        document.querySelectorAll('.edit-flight').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const currentTitle = btn.closest('.profile-flight').querySelector('.flight-title').innerText;
                const newTitle = prompt('Enter a new title for the flight:', currentTitle);
                if (!newTitle) return;

                if (newTitle === currentTitle) {
                    showToast("Please Choose a new Title!",'error')
                    return;
                }
                const res = await fetch(`${backend}/api/flights/${id}`, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({title: newTitle})
                });

                if (res.ok) {
                    loadProfile(); // Refresh
                }
                if (res.status === 401) {
                    showToast('Session lost, please login.','error');
                    // show login modal on unauthorized
                    ModalManager.toggle('login-modal');
                } else {
                    showToast('Failed to update flight','error');
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

        // Handle edit/delete
        if (e.target.classList.contains('edit-flight')) {
            const id = getFlightIdFromElement(e.target);
            console.log('Edit flight', id);
        }
        if (e.target.classList.contains('delete-flight')) {
            const id = getFlightIdFromElement(e.target);
            const confirmed = confirm('Are you sure you want to delete this flight?');
            if (!confirmed) return;

            try {
                const res = await fetch(`${backend}/api/flights/${id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });

                if (res.ok) {
                    loadProfile();
                    showToast(`Flight: ${id} deleted`,'success');
                }
                if (res.status === 401) {
                    showToast('Session lost, please login.','error');
                    // show login modal on unauthorized
                    ModalManager.toggle('login-modal');
                }else {
                    showToast('Failed to delete flight.','error');
                }
            } catch (err) {
                console.error('Delete failed:', err);
                showToast(`Something went wrong while deleting.${err}`,'error');
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

        const res = await fetch(`${backend}/api/flights/${id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle })
        });

        if (res.ok) {
            ModalManager.hide('edit-modal');
            await loadProfile();
        }
        if (res.status === 401) {
            showToast('Session lost, please login.','error');
            // show login modal on unauthorized
            ModalManager.toggle('login-modal');
        }else {
            showToast('Update failed','error');
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
            loadProfile();
            showToast('Flight uploaded successfully!','success');
            ModalManager.hide('upload-modal');

            uploadForm.reset();
        }
        if (res.status === 401) {
            showToast('Session lost, please login.','error');
            // show login modal on unauthorized
            ModalManager.toggle('login-modal');
        }else {
            showToast('Upload failed.','error');
        }
    });
}