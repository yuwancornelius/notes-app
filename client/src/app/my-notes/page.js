'use client';

import { useAuth } from '@/store/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import NoteCard from '@/components/NoteCard';
import api from '@/services/api';

export default function MyNotesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotes = useCallback(async (search = '') => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            const data = await api.getMyNotes(params);
            setNotes(data.notes);
        } catch (err) {
            console.error('Failed to load notes:', err);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!authLoading) {
            if (!user) router.push('/login');
            else fetchNotes();
        }
    }, [authLoading, user, router, fetchNotes]);

    function handleDelete(noteId) {
        setNotes(notes.filter((n) => n.id !== noteId));
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
            <Navbar onSearch={(q) => fetchNotes(q)} />
            <Sidebar />
            <main className="ml-60 pt-16 p-6">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-xl font-bold text-gray-800">My Notes</h1>
                        <button
                            onClick={() => router.push('/create')}
                            className="px-5 py-2 bg-blue-500 text-white text-sm font-medium rounded-full hover:bg-blue-600 transition flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Note
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-600 mb-1">No notes yet</h3>
                            <p className="text-sm text-gray-400 mb-4">Start by creating your first note</p>
                            <button
                                onClick={() => router.push('/create')}
                                className="px-6 py-2 bg-blue-500 text-white text-sm font-medium rounded-full hover:bg-blue-600 transition"
                            >
                                Create Note
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {notes.map((note) => (
                                <NoteCard key={note.id} note={note} onDelete={handleDelete} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
