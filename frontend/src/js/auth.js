function login(username) {
    currentUser = username;
    profileUsername.textContent = username;
    userIcon.innerHTML = `<img src="./default-avatar.svg" alt="User" class="w-full h-full rounded-full object-cover">`;
}
