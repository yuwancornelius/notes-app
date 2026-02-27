'use client';

import { useAuth } from '@/store/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import api from '@/services/api';

export default function CreateNotePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [visibility, setVisibility] = useState('public');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [authLoading, user, router]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!title.trim() || !content.trim()) {
            setError('Title and content are required');
            return;
        }

        if (visibility === 'protected') {
            if (!password) {
                setError('Password is required for protected notes');
                return;
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match');
                return;
            }
            if (password.length < 4) {
                setError('Password must be at least 4 characters');
                return;
            }
        }

        setLoading(true);
        try {
            const data = { title: title.trim(), content: content.trim(), visibility };
            if (visibility === 'protected') data.password = password;
            await api.createNote(data);
            router.push('/my-notes');
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
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
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => router.back()} className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold text-gray-800">Upload Notes</h1>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
                            )}

                            {/* Title */}
                            <div className="mb-5">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Judul</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Masukkan judul catatan"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                />
                            </div>

                            {/* Content */}
                            <div className="mb-5">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Isi Catatan</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Tulis catatan kamu disini..."
                                    rows={8}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                                />
                            </div>

                            {/* Visibility */}
                            <div className="mb-5">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Visibilitas</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: 'public', label: 'Public', desc: 'Semua orang bisa lihat', icon: '🌐', activeClass: 'border-blue-400 bg-blue-50' },
                                        { value: 'private', label: 'Private', desc: 'Hanya kamu yang bisa lihat', icon: '🔒', activeClass: 'border-red-400 bg-red-50' },
                                        { value: 'protected', label: 'Protected', desc: 'Perlu password untuk buka', icon: '🛡️', activeClass: 'border-amber-400 bg-amber-50' },
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setVisibility(opt.value)}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${visibility === opt.value
                                                ? opt.activeClass
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <span className="text-xl mb-2 block">{opt.icon}</span>
                                            <span className="font-semibold text-sm text-gray-800 block">{opt.label}</span>
                                            <span className="text-xs text-gray-500">{opt.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Password for protected */}
                            {visibility === 'protected' && (
                                <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                    <label className="block text-sm font-medium text-amber-800 mb-2">
                                        🔐 Set Password Note
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Masukkan password"
                                        className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent mb-3"
                                    />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Konfirmasi password"
                                        className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                    />
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition disabled:opacity-50 text-sm"
                            >
                                {loading ? 'Uploading...' : 'Upload Notes'}
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
