import { showToast } from "./toast.js";
import { fetchSession } from './session.js';
import {ModalManager} from "./modal.js";




const backend = 'http://127.0.0.1:5000'
export async function loadPins() {
    const res = await fetch(`${backend}/pins`);
    const data = await res.json();
    const grid = document.getElementById('pin-grid');

    grid.innerHTML = '';

    data.pins.forEach(pin => {
        const el = document.createElement('div');
        el.className = 'bg-white rounded-xl shadow-md overflow-hidden flex flex-col gap-2';

        el.innerHTML = `
      <div class="p-4">
        <h3 class="text-lg font-bold text-gray-800 mb-1">${pin.title}</h3>
        <p class="text-sm text-gray-600">${pin.description || ''}</p>
      </div>
      <div class="carousel-wrapper w-full overflow-x-auto flex gap-2 px-4">
        ${pin.images.map(img => `<img src="${img}" class="h-24 rounded object-cover" alt="${img}">`).join('')}
      </div>
      <div class="px-4 pb-4 flex flex-col gap-1 text-sm text-gray-600">
        <div><strong>By:</strong> ${pin.username}</div>
        <div><strong>Tags:</strong> ${pin.tags.join(', ')}</div>
        <div><strong>Likes:</strong> ❤️ ${pin.likes}</div>
      </div>
    `;

        grid.appendChild(el);
    });

}


document.getElementById('pinForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await (async () => {
        const session = await fetchSession();
        if (session)
            console.log('User:', session.username, 'ID:', session.user_id);
        if (!session) return;

        console.log('LoggedIn: False');

        const user_id = window.currentUserId;
        const form = e.target;
        const formData = new FormData();

        formData.append('title', form.title.value);
        formData.append('description', form.description.value);
        formData.append('model', form.model.files[0]);

        for (let img of form.images.files) {
            formData.append('images', img);
        }

        const tags = form.tags.value.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag !== '');
        for (let tag of tags) {
            formData.append('tags', tag);
        }

        try {
            const res = await fetch(`${backend}/pins/upload`, {
                method: 'POST',
                body: formData,
                credentials: "include"
            });

            const data = await res.json();

            if (res.ok) {
                showToast('✅ Pin published successfully!', 'success')
                form.reset();
            }
            if (res.status === 401) {
                showToast('Session lost, please login.', 'error');
                // show login modal on unauthorized
                ModalManager.toggle('login-modal');
            } else {
                showToast(`❌ Error: ${data.error}`, 'error')
            }
        } catch (err) {
            console.error(err);
            showToast('❌ Upload failed', 'error')
        }
    })();
});
