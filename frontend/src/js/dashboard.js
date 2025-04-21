import { ModalManager } from "./modal.js";
import { initMap } from './map.js';

const loginContainer = document.getElementById('login-modal');
const mapContainer = document.getElementById('map-container');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const statusText = document.getElementById('login-status');

loginBtn.addEventListener('click', async () => {
    ModalManager.toggle('login-modal')
});


window.addEventListener('DOMContentLoaded', async () => {
    // await loginUser()
    // const user = await checkSession();
    // if (user) {
    //     ModalManager.toggle('login-modal')
    //     ModalManager.toggle('map-container')
    // }
    initMap();
});


// close modal button listener
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('close-button')) {
        const targetModalId = event.target.getAttribute('data-modal-target');
        if (targetModalId) {
            ModalManager.toggle(targetModalId);
        } else {
            console.warn("Close button missing data-modal-target attribute.");
        }
    }
});