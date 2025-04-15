import { ModalManager } from './modal.js';
import { setupUploadForm } from "./profile.js";

export function setupAuth() {
    const loginForm = document.getElementById('login-form');
    // Call this once on page load
    checkLoginStatus();

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
            updateAuthUI(true);

        } else {
            alert('Login failed.');
        }
    });

}
function updateAuthUI(isLoggedIn) {
    console.log("UPDATE AUTH")
    const loginBtn = document.getElementById('login-button');
    const profileBtn = document.getElementById('profile-button');

    if (isLoggedIn) {

        loginBtn.classList.add('hidden');
        profileBtn.classList.remove('hidden');
        setupUploadForm()
    } else {
        loginBtn.classList.remove('hidden');
        profileBtn.classList.add('hidden');
    }
}
export async function checkLoginStatus() {
    console.log('Checking Login.')
    const userFlights = document.getElementById('user-flights')
    if(!userFlights) return;
    const res = await fetch('http://127.0.0.1:5000/auth/session', {
        method: 'GET',
        credentials: 'include'
    });
    const data = await res.json();
    console.log(data)
    const userInfo = document.getElementById('user-info')
    let user_icon;
    if (!data.user_icon) {
        user_icon = "../src/user_icon.png"
    } else {
        user_icon = data.user_icon;
    }
    userFlights.innerText = `${data.username}'s Flights`
    userInfo.innerHTML = '';
    userInfo.innerHTML += `<h3 id="username" class="text-lg text-white font-bold">${data.username}</h3><img class="thumbnail" src="${user_icon}" alt="${data.username}'s icon"/>`;
    return userFlights;
}
