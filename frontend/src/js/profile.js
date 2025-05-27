import {ModalManager} from "./modal.js";
import {checkLoginStatus} from "./auth.js";
import {showToast} from './toast'
import {logoutUser} from "./session.js";



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

    const uploadPinBtn = document.createElement('button');
    uploadPinBtn.innerHTML = `
        <button id="upload-pin-button" class="mt-4 w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 cursor-pointer">Publish New Pin</button>
    `;
    if (uploadPinBtn) {
        uploadPinBtn.addEventListener('click', () => {
            ModalManager.toggle('profile-modal')
            ModalManager.toggle('pin-modal')
            ModalManager.toggle('pin-upload-modal');
        });
    }
    pinList.appendChild(uploadPinBtn);


    if (pins) {
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
                <div class="dropdown-toggle">⋯</div>
                    <div class="dropdown-menu">
                    <button class="edit-pin" data-id="${pin.id}">Edit</button>
                    <button class="delete-pin" data-id="${pin.id}">Delete</button>
                    </div>
                </div>
`;


            pinList.append(pinItem);
        });
    }




}


async function editPin(pinId) {

}

async function deletePin(pinId) {
// Delete Pin button
    const res = await fetch(`${backend}/pins/${pinId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
    });

    if (!res.ok) {
        showToast('Failed to delete pin','error');
    }
    if (res.status === 401) {
        showToast('Session lost, please login.','error');
        // show login modal on unauthorized
        ModalManager.toggle('login-modal');
    } else {
        showToast("Pin deleted",'success')
    }
}


async function loadProfile() {
    console.log('Fetching User Flights');

    const res = await fetch(`${backend}/api/flights/user`, {
        method: 'GET',
        credentials: 'include'
    });

    if (!res.ok) return showToast('Failed to load flights.', 'error');

    const { flights } = await res.json();
    const profileList = document.getElementById('flight-modal-content');
    if(!profileList){
        console.log("profileList NULL")
    }

    profileList.innerHTML = ''
    profileList.innerHTML += `<div class="flex flex-row"><button class="close-button basis-32" data-modal-target="flight-modal">✖</button> <h2 id="user-flights" class="basis-150 text-xl font-semibold mb-4"></h2></div>`
    const uploadDiv = document.createElement('div');
    uploadDiv.innerHTML = `<h3 class="mt-2 py-2 font-bold">Your Flights</h3><button id="upload-flight-button" class="mt-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 cursor-pointer">Upload New Flight</button>`
    profileList.appendChild(uploadDiv);

    if ( flights ) {
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
    }
    const uploadBtn = document.getElementById('upload-flight-button');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            ModalManager.toggle('upload-modal')
        });
    }
}


export function setupProfile() {
    document.addEventListener('user-logged-in', async () => {
        console.log('Profile fetched')
        await loadProfile();
        await loadUserPins();
        await fetchNotifications();

        // Delete Pin button

        document.querySelectorAll('.delete-pin').forEach(btn => {
            btn.addEventListener('click', () => {
                console.log('delete button')
                const id = btn.dataset.id;
                deletePin(id);
                showToast("Pin Deleted", "success");
                ModalManager.toggle('pin-modal-content');
            });
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

    // Notifs toggle
    const toggleBtn = document.getElementById('toggle-notifs-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const hydrate = document.getElementById('notification-list');

            const isExpanded = hydrate.classList.contains('max-h-full');

            hydrate.classList.toggle('max-h-0', isExpanded);
            hydrate.classList.toggle('max-h-full', !isExpanded);

            toggleBtn.textContent = isExpanded ? '+' : '−';
        });
        }



    // Edit Flights button

    document.querySelectorAll('.edit-flight').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const currentTitle = btn.closest('.profile-flight').querySelector('.flight-title').innerText;
            const newTitle = prompt('Enter a new title for the flight:', currentTitle);
            if (!newTitle) return;

            if (newTitle === currentTitle) {
                showToast("Please Choose a new Title!", 'error')
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
                showToast('Session lost, please login.', 'error');
                // show login modal on unauthorized
                ModalManager.toggle('login-modal');
            } else {
                showToast('Failed to update flight', 'error');
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
                    showToast(`Flight: ${id} deleted`, 'success');
                }
                if (res.status === 401) {
                    showToast('Session lost, please login.', 'error');
                    // show login modal on unauthorized
                    ModalManager.toggle('login-modal');
                } else {
                    showToast('Failed to delete flight.', 'error');
                }
            } catch (err) {
                console.error('Delete failed:', err);
                showToast(`Something went wrong while deleting.${err}`, 'error');
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
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({title: newTitle})
        });

        if (res.ok) {
            ModalManager.hide('edit-modal');
            await loadProfile();
        }
        if (res.status === 401) {
            showToast('Session lost, please login.', 'error');
            // show login modal on unauthorized
            ModalManager.toggle('login-modal');
        } else {
            showToast('Update failed', 'error');
        }
    });
});
}

export function setupUploadForm() {
    const uploadForm = document.getElementById('upload-form');

    if (!uploadForm) return;

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(uploadForm);

        const res = await fetch(`${backend}/api/flights/upload`, {
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


async function fetchNotifications() {
    const res = await fetch(`${backend}/auth/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
    });
    console.log(`Fetching User notifications.`)
    const notifs = await res.json();
    const list = document.getElementById('notification-list');
    const notifContainer = document.getElementById('notification-container');
    const listToggle = document.createElement('div');
    listToggle.innerHTML = `<button id="toggle-notifs-btn" class="text-sm text-white font-bold hover:underline focus:outline-none cursor-pointer">+ <span class="text-sm mb-2">${notifs.length === 0 ? '' : notifs.length }</span></button>`;

    list.innerHTML = '';

    if (notifs.length === 0) {
        list.innerHTML = '<p class="text-gray-500">No notifications</p>';
        console.log('No notifications.')
        return;
    } else if (notifs.length !== 0) {
        notifContainer.appendChild(listToggle);
    }

    for (const n of notifs) {
        const item = document.createElement('div');
        item.className = `p-2 max-h-full rounded ${n.is_read ? 'bg-gray-100' : 'bg-yellow-100'}`;
        item.innerHTML = `
      <p>${n.message}</p>
      ${n.link ? `<a href="${n.link}" class="text-blue-600 underline">View</a>` : ''}
    `;
        item.addEventListener('click', async () => {
            await fetch(`${backend}/auth/notifications/${n.id}/read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: "include",
            });
            fetchNotifications(); // re-render
        });
        list.appendChild(item);
    }
}
