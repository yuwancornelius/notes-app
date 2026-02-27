'use client';

import { useAuth } from '@/store/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import NoteCard from '@/components/NoteCard';
import api from '@/services/api';

export default function FavoritesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchFavorites = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getFavorites();
            setNotes(data.notes);
        } catch (err) {
            console.error('Failed to load favorites:', err);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!authLoading) {
            if (!user) router.push('/login');
            else fetchFavorites();
        }
    }, [authLoading, user, router, fetchFavorites]);

    function handleFavoriteToggle(noteId, isFav) {
        if (!isFav) {
            setNotes(notes.filter((n) => n.id !== noteId));
        }
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
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-xl font-bold text-gray-800 mb-6">My Favorites</h1>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-600 mb-1">No favorites yet</h3>
                            <p className="text-sm text-gray-400">Star a note to add it to your favorites</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {notes.map((note) => (
                                <NoteCard key={note.id} note={note} onFavoriteToggle={handleFavoriteToggle} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
