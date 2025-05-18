import { showToast } from "./toast.js";
import { fetchSession } from './session.js';
import {ModalManager} from "./modal.js";



let currentPinId = null;
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


async function pinDetail(pinId) {
    currentPinId = pinId;

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
        return `<img src="${backend}/uploads/user_${data.user_id}/images/${filename}" alt="${data.title}" class="pin-image rounded mb-4 w-full max-h-64 object-cover" />`;
    }).join('');


    const commentsHTML = data.comments.map(c => renderComment(c)).join('');

    // Fill modal content using string literal
    modal.innerHTML = `
    <div class="relative bg-white rounded-lg shadow-lg max-w-2xl w-full p-6">
    <button
      class="close-button absolute top-2 right-2 text-2xl text-red-500 hover:text-red-700 leading-none cursor-pointer"
      data-modal-target="pinSocial"
    >✖</button>

      <h2 class="text-2xl font-bold mb-2">${data.title}</h2>
      <p class="text-sm text-gray-500 mb-4">By <span class="font-medium">${data.user.username}</span> • ${new Date(data.created_at).toLocaleDateString()}</p>
      ${imageHTML}
      <p class="text-gray-700 mb-4">${data.description}</p>
      <div class="flex flex-wrap gap-2 mb-4">${tagHTML}</div>
      <div class="flex items-center mb-6 text-sm text-gray-500">
        <button class="hover:text-red-500">❤️ ${data.likes} likes</button>
      </div>
        <div class="space-y-4 mb-4" id="pin-comments">
          <div class="flex items-center">
            <h3 class="text-lg font-semibold">Comments ${data.comments.length}</h3>
            <button id="comments-toggle" class="text-lg font-bold hover:underline focus:outline-none cursor-pointer">+</button>
          </div>
          <div id="comments-list-hydrate"
               class="overflow-y-auto max-h-20 transition-[max-height] duration-300 ease-in-out">
            <button id="comments-latest" class="text-sm text-blue-500 hover:underline focus:outline-none cursor-pointer">Latest</button>
            ${commentsHTML}
          </div>
        </div>

      <div class="border-t pt-4">
        <textarea class="w-full border rounded p-2 text-sm mb-2 comment" placeholder="Leave a comment..."></textarea>
        <button id="post-new-comment" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 cursor-pointer">Post</button>
      </div>
    </div>
    `;


    modal.classList.remove('hidden');
    bindPinModalEvents(); // set listeners
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


function bindPinModalEvents() {
    document.querySelectorAll('.reply-btn').forEach(btn => {
        const commentEl = btn.closest('[data-comment-id]');
        const commentId = commentEl.dataset.commentId;

        btn.addEventListener('click', () => {
            const form = commentEl.querySelector('.reply-form');
            form.classList.toggle('hidden');
        });
    });

    // Comment toggle
    document.getElementById('comments-toggle').addEventListener('click', () => {
        const hydrate = document.getElementById('comments-list-hydrate');
        const toggleBtn = document.getElementById('comments-toggle');

        const isExpanded = hydrate.classList.contains('max-h-60');

        hydrate.classList.toggle('max-h-20', isExpanded);
        hydrate.classList.toggle('max-h-60', !isExpanded);

        toggleBtn.textContent = isExpanded ? '+' : '−';
    });

    // Reply toggle

    document.querySelectorAll('.toggle-reply-btn').forEach(btn => {
        const replyEL = btn.closest('[reply-tree]');
        const isExpanded = replyEL.classList.contains('max-h-full');


        btn.addEventListener('click', () => {
            replyEL.classList.toggle('max-h-0', isExpanded);
            replyEL.classList.toggle('max-h-full', !isExpanded);
        });

        btn.textContent = isExpanded ? '+' : '−';


    });

    document.getElementById('comments-latest').addEventListener('click', () => {
        const hydrate = document.getElementById('comments-list-hydrate');
        hydrate.scrollTo({
            top: hydrate.scrollHeight,
            behavior: 'smooth'
        });
    });

    document.querySelectorAll('.post-reply-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const commentEl = btn.closest('[data-comment-id]');
            const commentId = commentEl.dataset.commentId;
            const textarea = commentEl.querySelector('.reply-input');
            const text = textarea.value.trim();
            if (!text) return;

            await postReply(commentId, text);
        });
    });

    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const commentEl = btn.closest('[data-comment-id]');
            const commentId = commentEl.dataset.commentId;
            const value = parseInt(btn.dataset.value);
            await likeComment(commentId, value);
        });
    });

    const postBtn = document.querySelector('#post-new-comment');
    if (postBtn) {
        postBtn.addEventListener('click', postNewComment);
    }

    // Image Overlay

    document.querySelectorAll('.pin-image').forEach(img => {
        img.addEventListener('click', () => {
            const overlay = document.getElementById('image-overlay');
            const overlayImg = document.getElementById('overlay-img');
            overlayImg.src = img.src;
            overlay.classList.remove('hidden');
        });
    });

    document.getElementById('image-overlay').addEventListener('click', () => {
        document.getElementById('image-overlay').classList.add('hidden');
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('image-overlay').classList.add('hidden');
        }
    });
}


function renderComment(comment) {
    return `
    <div class="border rounded p-3 mb-2" data-comment-id="${comment.id}">
      <div class="text-sm font-medium">${comment.user.username}<span class="text-gray-400 text-xs">• ${timeAgo(comment.timestamp)}</span></div>
      <p class="text-sm mb-2">${comment.text}</p>
      <div class="flex gap-4 text-xs text-gray-500">
        <button class="like-btn cursor-pointer" data-value="1">👍 ${comment.likes}</button>
        <button class="like-btn cursor-pointer" data-value="-1">👎 ${comment.dislikes}</button>
        <button class="reply-btn text-blue-500 hover:underline">Reply</button>
      </div>
      <div class="reply-form hidden mt-2">
        <textarea class="w-full border rounded p-2 text-sm mb-2 reply-input" placeholder="Write a reply..."></textarea>
        <button class="post-reply-btn bg-blue-500 text-white px-2 py-1 hover:bg-blue-600 rounded text-sm">Post Reply</button>
      </div>
      <div class="reply-tree ml-4 mt-2 space-y-2 max-h-full">
      <button class="toggle-reply-btn text-sm font-bold hover:underline focus:outline-none cursor-pointer">+<span class="text-sm mb-2">${comment.replies.length}</span></button>
        ${(comment.replies || []).map(renderComment).join('')}
      </div>
    </div>
  `;
}


async function postNewComment() {
    const textarea = document.querySelector('textarea.comment');
    const text = textarea.value.trim();
    if (!text) return;

    await fetch(`${backend}/pins/${currentPinId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ text, pin_id: currentPinId})
    });

    await pinDetail(currentPinId);
}

async function postReply(parentId, text) {
    await fetch(`${backend}/pins/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ text, parent_id: parentId, pin_id: currentPinId })
    });

    await pinDetail(currentPinId);
}

async function likeComment(commentId, value) {
    await fetch(`${backend}/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ value })
    });

    await pinDetail(currentPinId);
}