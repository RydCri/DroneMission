import { ModalManager } from './modal.js';

export function setupAuth() {
    const loginForm = document.getElementById('login-form');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = loginForm.username.value;
        const password = loginForm.password.value;

        const res = await fetch('http://127.0.0.1:5000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });

        if (res.ok) {
            ModalManager.hide('login-modal');
            document.dispatchEvent(new CustomEvent('user-logged-in'));
        } else {
            alert('Login failed.');
        }
    });

    function updateAuthUI(isLoggedIn) {
        document.getElementById('login-button').classList.toggle('hidden', isLoggedIn);
        document.getElementById('profile-button').classList.toggle('hidden', !isLoggedIn);
    }

// Example usage:
    if (sessionStorage.getItem('token')) {
        updateAuthUI(true);
    } else {
        updateAuthUI(false);
    }

}
