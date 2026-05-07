'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/services/api';
import { formatDate } from '@/utils/formatDate';

export default function AdminNotesPage() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Modal states
    const [viewNote, setViewNote] = useState(null);
    const [editNote, setEditNote] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editVisibility, setEditVisibility] = useState('public');
    const [deleteNote, setDeleteNote] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const fetchNotes = useCallback(async (page = 1, search = '') => {
        setLoading(true);
        try {
            const params = { page, per_page: 15 };
            if (search) params.search = search;
            const data = await api.getAdminNotes(params);
            setNotes(data.notes);
            setTotalPages(data.pages);
            setTotal(data.total);
            setCurrentPage(data.current_page);
        } catch (err) {
            console.error('Failed to load notes:', err);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    function handleSearch(e) {
        e.preventDefault();
        fetchNotes(1, searchQuery);
    }

    async function openView(note) {
        try {
            const data = await api.getAdminNote(note.id);
            setViewNote(data.note);
        } catch (err) {
            console.error('Failed to load note:', err);
        }
    }

    function openEdit(note) {
        setEditNote(note);
        setEditTitle(note.title);
        setEditContent(note.content || '');
        setEditVisibility(note.visibility);
        setError('');
    }

    async function handleEdit(e) {
        e.preventDefault();
        setActionLoading(true);
        setError('');
        try {
            await api.updateAdminNote(editNote.id, {
                title: editTitle,
                content: editContent,
                visibility: editVisibility,
            });
            setEditNote(null);
            setMessage('Note berhasil diupdate!');
            fetchNotes(currentPage, searchQuery);
        } catch (err) {
            setError(err.message);
        }
        setActionLoading(false);
    }

    async function handleDelete() {
        setActionLoading(true);
        try {
            await api.deleteAdminNote(deleteNote.id);
            setDeleteNote(null);
            setMessage('Note berhasil dihapus!');
            fetchNotes(currentPage, searchQuery);
        } catch (err) {
            setError(err.message);
        }
        setActionLoading(false);
    }

    // Auto-dismiss messages
    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(''), 3000);
            return () => clearTimeout(t);
        }
    }, [message]);

    const visibilityBadge = {
        public: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Public' },
        private: { bg: 'bg-red-50', text: 'text-red-700', label: 'Private' },
        protected: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Protected' },
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Kelola Notes</h1>
                    <p className="text-sm text-gray-500">{total} notes total</p>
                </div>
            </div>

            {/* Messages */}
            {message && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600 flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    {message}
                </div>
            )}

            {/* Search */}
            <form onSubmit={handleSearch} className="mb-6">
                <div className="relative max-w-md">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Cari judul note..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                </div>
            </form>

            {/* Notes Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-8 h-8 border-4 border-red-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : notes.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-gray-400 text-sm">Tidak ada notes ditemukan</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Judul</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Author</th>
                                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Visibility</th>
                                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Favorit</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {notes.map((n) => {
                                    const badge = visibilityBadge[n.visibility] || visibilityBadge.public;
                                    return (
                                        <tr key={n.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-sm text-gray-800 line-clamp-1 max-w-xs">{n.title}</p>
                                                <p className="text-xs text-gray-400 line-clamp-1 mt-0.5 max-w-xs">{n.content?.slice(0, 60)}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.3 0-9.8 1.6-9.8 4.9v2.4h19.6v-2.4c0-3.3-6.5-4.9-9.8-4.9z" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-sm text-gray-600">{n.author?.username || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="text-sm text-gray-500">{n.favorite_count}</span>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-500">{formatDate(n.created_at)}</td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-center gap-1">
                                                    {/* View */}
                                                    <button
                                                        onClick={() => openView(n)}
                                                        className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                                        title="Lihat note"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    {/* Edit */}
                                                    <button
                                                        onClick={() => openEdit(n)}
                                                        className="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                                                        title="Edit note"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => setDeleteNote(n)}
                                                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                                        title="Hapus note"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500">Halaman {currentPage} dari {totalPages}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => fetchNotes(currentPage - 1, searchQuery)}
                                disabled={currentPage <= 1}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                                Prev
                            </button>
                            <button
                                onClick={() => fetchNotes(currentPage + 1, searchQuery)}
                                disabled={currentPage >= totalPages}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* View Note Modal */}
            {viewNote && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => setViewNote(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0 mr-4">
                                    <h2 className="text-lg font-bold text-gray-800 truncate">{viewNote.title}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-500">oleh {viewNote.author?.username || 'Unknown'}</span>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${visibilityBadge[viewNote.visibility]?.bg} ${visibilityBadge[viewNote.visibility]?.text}`}>
                                            {visibilityBadge[viewNote.visibility]?.label}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => setViewNote(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                                {viewNote.content}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Note Modal */}
            {editNote && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => setEditNote(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Edit Note</h2>
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
                        )}
                        <form onSubmit={handleEdit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Judul</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Konten</label>
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    rows={8}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Visibility</label>
                                <select
                                    value={editVisibility}
                                    onChange={(e) => setEditVisibility(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                >
                                    <option value="public">Public</option>
                                    <option value="private">Private</option>
                                    <option value="protected">Protected</option>
                                </select>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setEditNote(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                                    Batal
                                </button>
                                <button type="submit" disabled={actionLoading} className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition disabled:opacity-50">
                                    {actionLoading ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteNote && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => setDeleteNote(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center mb-5">
                            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">Hapus Note?</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Yakin ingin menghapus note &quot;<strong>{deleteNote.title}</strong>&quot;? Aksi ini tidak dapat dibatalkan.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteNote(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                                Batal
                            </button>
                            <button onClick={handleDelete} disabled={actionLoading} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition disabled:opacity-50">
                                {actionLoading ? 'Menghapus...' : 'Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
