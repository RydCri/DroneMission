const backend = 'http://127.0.0.1:5000'

// Session data only being used for API to frontend implementation, only cookie data necessary for now
export async function fetchSession() {
    const res = await fetch(`${backend}/auth/session`, {
        credentials: 'include'
    });

    if (res.ok) {
        const { user_id, username } = await res.json();
        window.currentUserId = user_id;
        window.currentUsername = username;
        return { user_id, username };
    } else {
        console.log('User not logged in');
        return null;
    }
}


export async function logoutUser() {
    const res = await fetch(`${backend}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
    });

    if (res.ok) {
        console.log('User logged out');
        window.location.href = '/';
    } else {
        console.error('Logout failed');
    }
}

