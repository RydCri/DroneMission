const backend = 'http://127.0.0.1:5000'

// Session data only being used for simple URI to frontend implementation, only cookie data necessary for now
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
        credentials: 'include',
    });

    if (res.ok) {
        window.currentUserId = null;
        window.currentUsername = null;
        console.log('User logged out');
        return true;
    } else {
        console.error('Logout failed');
        return false;
    }
}
