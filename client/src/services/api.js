const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

class ApiService {
    constructor() {
        this.baseURL = API_URL;
    }

    getToken() {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return null;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getToken();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        };

        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            const err = new Error(data.error || 'Something went wrong');
            err.errorType = data.error_type || null;
            throw err;
        }

        return data;
    }

    // Auth
    async register(username, email, password) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password }),
        });
    }

    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async getProfile() {
        return this.request('/auth/me');
    }

    async updateProfile(data) {
        return this.request('/auth/me', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // Notes
    async getNotes(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/notes?${query}`);
    }

    async getMyNotes(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/notes/my?${query}`);
    }

    async getNote(id) {
        return this.request(`/notes/${id}`);
    }

    async createNote(data) {
        return this.request('/notes', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateNote(id, data) {
        return this.request(`/notes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteNote(id) {
        return this.request(`/notes/${id}`, { method: 'DELETE' });
    }

    async verifyNotePassword(id, password) {
        return this.request(`/notes/${id}/verify-password`, {
            method: 'POST',
            body: JSON.stringify({ password }),
        });
    }

    // Favorites
    async getFavorites(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/favorites?${query}`);
    }

    async toggleFavorite(noteId) {
        return this.request(`/favorites/${noteId}`, { method: 'POST' });
    }
}

const api = new ApiService();
export default api;
