import { ModalManager } from './modal.js';

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
            console.log(res.body)
        } else {
            alert('Login failed.');
        }
    });
    async function checkLoginStatus() {
        const res = await fetch('http://127.0.0.1:5000/auth/session', {
            method: 'GET',
            credentials: 'include'
        });
        const data = await res.json();
        const userInfo = document.getElementById('user-info')
        const userFlights = document.getElementById('user-flights')
        let user_icon;
        if(!data.user_icon){
            user_icon = "../src/user_icon.png"
        } else{
            user_icon = data.user_icon;
        }
            userFlights.innerText = `${data.username}'s Flights`
            userInfo.innerHTML = '';
            userInfo.innerHTML += `<h3 id="username" class="text-lg text-white font-bold">${data.username}</h3>
      <img class="thumbnail" src="${user_icon}" alt="${data.username}'s icon"/>`;

        updateAuthUI(data.loggedIn);
        if (data.loggedIn) {
        }
    }

    function updateAuthUI(isLoggedIn) {
        console.log("UPDATE AUTH")
        const loginBtn = document.getElementById('login-button');
        const profileBtn = document.getElementById('profile-button');

        if (isLoggedIn) {

            loginBtn.classList.add('hidden');
            profileBtn.classList.remove('hidden');
            console.log("User is logged in login should disappear")
        } else {
            loginBtn.classList.remove('hidden');
            profileBtn.classList.add('hidden');
            console.log("User is NOT logged in Login should be visible")
        }
    }

}
