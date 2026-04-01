import { authFetch as baseAuthFetch } from "../authFetch";
// Centralized API client that automatically attaches JWT token
// Use authFetch() for all authenticated API calls

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api';

function getToken(): string | null {
    try {
        const raw = localStorage.getItem('auth-storage');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.state?.token || null;
    } catch {
        return null;
    }
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const username = localStorage.getItem('user-name');
    const role = localStorage.getItem('role');

    const headers: Record<string, string> = {
        ...Object.fromEntries(
            Object.entries(options.headers || {})
        ),
    };

    const sessionId = localStorage.getItem('session_id');
    if (sessionId) {
        headers['x-session-id'] = sessionId;
    }

    if (username) {
        headers['x-user-name'] = username;
        if (role) headers['x-user-role'] = role;
    }

    // Auto-set Content-Type for JSON if body is present and not FormData
    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    return baseAuthFetch(url, {
        ...options,
        headers,
    });
}

export { API_BASE_URL };
