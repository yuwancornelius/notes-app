'use client';

import { useAuth } from '@/store/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import api from '@/services/api';

export default function ProfilePage() {
    const { user, loading: authLoading, refreshUser, logout } = useAuth();
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
        if (user) {
            setUsername(user.username);
            setEmail(user.email);
        }
    }, [authLoading, user, router]);

    async function handleSubmit(e) {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            const data = { username, email };
            if (newPassword) data.password = newPassword;
            await api.updateProfile(data);
            await refreshUser();
            setMessage('Profile updated successfully!');
            setNewPassword('');
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    }

    function handleLogout() {
        logout();
        router.push('/login');
    }

    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Sidebar />
            <main className="ml-60 pt-16 p-6">
                <div className="max-w-lg mx-auto">
                    <h1 className="text-xl font-bold text-gray-800 mb-6">Profile</h1>

                    <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                        {/* Avatar */}
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                                <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.3 0-9.8 1.6-9.8 4.9v2.4h19.6v-2.4c0-3.3-6.5-4.9-9.8-4.9z" />
                                </svg>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {message && (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600">{message}</div>
                            )}
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
                            )}

                            <div className="mb-5">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                />
                            </div>

                            <div className="mb-5">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span></label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition disabled:opacity-50 text-sm"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>

                        <button
                            onClick={handleLogout}
                            className="w-full mt-4 py-3 border border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition text-sm"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
