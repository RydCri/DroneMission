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
      <div class="p-4" id="${pin.id}">
        <h3 class="text-lg font-bold text-gray-800 mb-1">${pin.title}</h3>
        <p class="text-sm text-gray-600">${pin.description || ''}</p>
      </div>
      <div class="carousel-wrapper w-full overflow-x-auto flex gap-2 px-4">
        ${pin.images.map(img => `<img src="${backend}${img}" class="pin-thumbnail h-24 rounded object-cover" alt="${backend}${img}">`)}
      </div>
      <div class="px-4 pb-4 flex flex-col gap-1 text-sm text-gray-600">
        <div><strong>By:</strong> ${pin.username}</div>
        <div><strong>Tags:</strong> ${pin.tags.join(', ')}</div>
        <div> ❤️ ${pin.likes}</div>
        <div class="p-4 mb-1 text-md comments">
          <h3>Comments ${([pin.comments]).length}</h3>
          <div id="comments-list">${pin.comments}</div>
        </div>

      </div>
    `;

        el.addEventListener("click", ()=>{
            pinDetail(pin.id);
        })
        grid.appendChild(el);
    });

}



async function loadComments(pinId) {
    const res = await fetch(`/pins/${pinId}/comments`);
    const comments = await res.json();

    const container = document.getElementById('comments-list');
    container.innerHTML = '';

    comments.forEach(comment => {
        const div = document.createElement('div');
        div.innerHTML = `<strong>${comment.user}</strong>: ${comment.text}`;
        container.appendChild(div);
    });
}

async function submitComment(pinId) {
    const text = document.getElementById('comment-input').value;
    if (!text.trim()) return;

    const res = await fetch(`/pins/${pinId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });

    if (res.ok) {
        document.getElementById('comment-input').value = '';
        loadComments(pinId);
    }
}

async function pinDetail(pinId) {
    const res = await fetch(`${backend}/pins/${pinId}`);
    if (!res.ok) {
        console.error("Failed to fetch pin details");
        return;
    }

    const data = await res.json();
    const modal = document.getElementById('pinSocial');
    // Format tags
    const tagHTML = data.tags.map(tag =>
        `<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">#${tag}</span>`
    ).join('');

    // Format images (carousel)
    const imageHTML = data.images.map(img => {
        const filename = img.url.split('/').pop(); // extract filename
        const userId = data.user.id; // refactored to use user passed to Pin dict
        return `<img src="${backend}/uploads/user_${data.user_id}/images/${filename}" alt="${data.title}" class="rounded mb-4 w-full max-h-64 object-cover" />`;
    }).join('');

    // Format comments with replies
    const commentsHTML = data.comments.map(comment => {
        const repliesHTML = comment.replies.map(reply => `
      <div class="ml-4 mt-2 border-l pl-3">
        <p class="text-sm font-medium">${reply.user.username} <span class="text-gray-400 text-xs">• ${timeAgo(reply.timestamp)}</span></p>
        <p class="text-sm text-gray-600">${reply.text}</p>
      </div>
    `).join('');

        return `
      <div class="border p-3 rounded mb-3">
        <p class="text-sm font-medium">${comment.user.username} <span class="text-gray-400 text-xs">• ${timeAgo(comment.timestamp)}</span></p>
        <p class="text-gray-700 text-sm mt-1">${comment.text}</p>
        <div class="flex items-center text-sm gap-4 mt-2 text-gray-500">
          <button class="hover:text-red-500">❤️ ${comment.likes}</button>
          <button class="hover:text-blue-500">Reply</button>
        </div>
        ${repliesHTML}
      </div>
    `;
    }).join('');

    // Fill modal content using string literal
    modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 overflow-y-scroll">

      <h2 class="text-2xl font-bold mb-2">${data.title}</h2>
      <p class="text-sm text-gray-500 mb-4">By <span class="font-medium">${data.user.username}</span> • ${new Date(data.created_at).toLocaleDateString()}</p>
      ${imageHTML}
      <p class="text-gray-700 mb-4">${data.description}</p>
      <div class="flex flex-wrap gap-2 mb-4">${tagHTML}</div>
      <div class="flex items-center mb-6 text-sm text-gray-500">
        <button class="hover:text-red-500">❤️ ${data.likes} likes</button>
      </div>
      <div class="space-y-4 mb-4">
        <h3 class="text-lg font-semibold">Comments</h3>
        ${commentsHTML}
      </div>
      <div class="border-t pt-4">
        <textarea class="w-full border rounded p-2 text-sm mb-2" placeholder="Leave a comment..."></textarea>
        <button class="bg-blue-500 text-white px-4 py-2 rounded">Post</button>
      </div>
    </div>
  `;
    const deleteBtn = document.createElement('div');
    deleteBtn.innerHTML = `  <button 
    class="close-button"
    data-modal-target="pinSocial"
    >
    ✖
  </button>`;
    modal.appendChild(deleteBtn);

    modal.classList.remove('hidden');
}

// Helper
function timeAgo(dateStr) {
    const diff = (new Date() - new Date(dateStr)) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
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
