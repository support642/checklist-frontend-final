export async function authFetch(url, options = {}) {
    const sessionId = localStorage.getItem('session_id');
    const username = localStorage.getItem('user-name');
    const role = localStorage.getItem('role');

    const headers = {
        ...options.headers,
    };

    if (sessionId) {
        headers['x-session-id'] = sessionId;
    }
    if (username) {
        headers['x-user-name'] = username;
    }
    if (role) {
        headers['x-user-role'] = role;
    }

    // Auto-set Content-Type for JSON if body is present and not FormData
    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    // Handle global 401 Unauthorized (Force Logout)
    if (response.status === 401) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.clone().json();
            if (data.force_logout) {
                console.warn("Session expired. Forcing logout...");
                localStorage.clear();
                window.location.href = '/login';
            }
        }
    }

    return response;
}
